import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from aiomqtt import Client
from app.schemas import StatusPayload
from app import crud, models


async def handle_status_message(payload: str, topic: str, db: Session, mqtt_client: Client):
    imei = topic.split("/")[-1]

    clean_payload = payload.replace(" ", "").strip().strip('"').strip("'")
    if clean_payload in ["OPENED_OK", "HB_SET_OK", "VTYPE_SET_OK"]:
        device = crud.get_device(db, imei)
        if device:
            device.pending_command = None
            device.command_retries = 0
            if clean_payload == "OPENED_OK":
                device.state_l = 1
                device.state_r = 1
                device.state_p = 0
            db.commit()
        return

    try:
        data = StatusPayload.model_validate_json(payload)
    except Exception as e:
        print(f"[MQTT] Parse error {imei}: {e} | Payload: {payload}")
        return

    device = crud.get_device(db, imei)
    if not device:
        return

    # Активация статуса устройства при получении валидной телеметрии
    if device.auth_status != models.AuthStatus.ACTIVE:
        device.auth_status = models.AuthStatus.ACTIVE

    device.last_online = datetime.now(timezone.utc)
    device.is_online = True
    device.state_l = data.l
    device.state_r = data.r
    device.state_p = data.p
    device.error_flag = data.err
    device.rssi = data.s

    if data.bat is not None:
        device.battery = data.bat

    if data.err == 1:
        device.manual_control = True

    db.commit()

    # Если в очереди находится JSON-команда (настройка), биллинг не должен её перезаписывать
    if device.pending_command and ("{" in device.pending_command):
        return

    action = crud.check_billing_automation(db, imei)
    if action:
        # Проверка актуальности: не отправляем команду, если состояние уже соответствует целевому
        is_redundant = (
                (action == "CLOSE" and device.state_l == 0 and device.state_r == 0) or
                (action == "OPEN" and device.state_l == 1 and device.state_r == 1)
        )

        # Обновляем очередь только если состояние не достигнуто и команда еще не установлена
        if not is_redundant and device.pending_command != action:
            device.pending_command = action
            device.command_retries = 0
            db.commit()
            await send_command(mqtt_client, imei, action)


async def handle_provision_request(payload: str, topic: str, db: Session, mqtt_client: Client):
    if "new_key" in payload:
        return

    imei = topic.split("/")[-2]
    new_key = crud.generate_provisioning_key(db, imei)

    if new_key:
        response = json.dumps({"cmd": "PROVISION", "new_key": new_key}, separators=(',', ':'))
        await mqtt_client.publish(f"gas/config/{imei}/provision", payload=response, qos=1)


async def send_command(mqtt_client: Client, imei: str, cmd: str):
    await mqtt_client.publish(f"gas/command/{imei}", payload=cmd, qos=1)