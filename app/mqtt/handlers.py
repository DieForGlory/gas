import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from aiomqtt import Client
from app.schemas import StatusPayload, ProvisionPayload
from app import crud, models


async def handle_status_message(payload: str, topic: str, db: Session, mqtt_client: Client):
    imei = topic.split("/")[-1]
    try:
        data = StatusPayload.model_validate_json(payload)
    except Exception:
        return

    device = crud.get_device(db, imei)
    if not device:
        return

    device.last_online = datetime.now(timezone.utc)

    if data.err == 1:
        # Логика обработки заклинивания клапана (ERROR state)
        device.manual_control = True
    elif data.l != data.r:
        # Рассинхрон: устройство само проводит попытки.
        # Сервер фиксирует состояние "Рассинхрон / Ручное вмешательство"
        pass
    elif data.l == 1 and data.r == 1 and device.auth_status == models.AuthStatus.PROVISIONING:
        # Подтверждение успешного провижининга после перезагрузки
        crud.activate_device(db, imei)

    db.commit()

    # Проверка триггеров автоматики биллинга
    action = crud.check_billing_automation(db, imei)
    if action:
        await send_command(mqtt_client, imei, action)


async def handle_provision_request(payload: str, topic: str, db: Session, mqtt_client: Client):
    imei = topic.split("/")[-2]
    new_key = crud.generate_provisioning_key(db, imei)

    if new_key:
        response = ProvisionPayload(new_key=new_key).model_dump_json()
        await mqtt_client.publish(f"gas/config/{imei}/provision", payload=response, qos=1)


async def send_command(mqtt_client: Client, imei: str, cmd: str):
    await mqtt_client.publish(f"gas/command/{imei}", payload=cmd, qos=1)