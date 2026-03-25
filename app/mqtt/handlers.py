import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from aiomqtt import Client
from app.schemas import StatusPayload, ProvisionPayload
from app import crud, models


async def handle_status_message(payload: str, topic: str, db: Session, mqtt_client: Client):
    imei = topic.split("/")[-1]

    clean_payload = payload.strip().strip('"').strip("'")
    if clean_payload == "OPENED_OK":
        device = crud.get_device(db, imei)
        if device:
            device.pending_command = None
            device.command_retries = 0
            device.state_l = 1
            device.state_r = 1
            db.commit()
        return

    try:
        data = StatusPayload.model_validate_json(payload)
    except Exception:
        return

    device = crud.get_device(db, imei)
    if not device:
        return

    device.last_online = datetime.now(timezone.utc)
    device.is_online = True
    device.state_l = data.l
    device.state_r = data.r
    device.error_flag = data.err
    device.rssi = data.s

    if data.bat is not None:
        device.battery = data.bat

    if data.err == 1:
        device.manual_control = True
    elif data.l == 1 and data.r == 1 and device.auth_status == models.AuthStatus.PROVISIONING:
        crud.activate_device(db, imei)

    db.commit()

    action = crud.check_billing_automation(db, imei)
    if action:
        if action == "CLOSE" and device.state_l == 0 and device.state_r == 0:
            pass
        elif action == "OPEN" and device.state_l == 1 and device.state_r == 1:
            pass
        else:
            device.pending_command = action
            device.command_retries = 0
            db.commit()
            await send_command(mqtt_client, imei, action)


async def handle_provision_request(payload: str, topic: str, db: Session, mqtt_client: Client):
    # Предотвращение бесконечного цикла (игнорируем собственные ответы сервера)
    if "new_key" in payload:
        return

    imei = topic.split("/")[-2]
    new_key = crud.generate_provisioning_key(db, imei)

    if new_key:
        response = ProvisionPayload(new_key=new_key).model_dump_json()
        await mqtt_client.publish(f"gas/config/{imei}/provision", payload=response, qos=1)


async def send_command(mqtt_client: Client, imei: str, cmd: str):
    await mqtt_client.publish(f"gas/command/{imei}", payload=cmd, qos=1)