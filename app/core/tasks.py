import asyncio
from datetime import datetime, timezone
import aiomqtt
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app import models, crud


async def process_device_retries():
    with SessionLocal() as db:
        pending_devices = db.query(models.Device).filter(models.Device.pending_command.isnot(None)).all()

        if not pending_devices:
            return

        async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER,
                port=settings.MQTT_PORT,
                username=settings.MQTT_USER,
                password=settings.MQTT_PASSWORD
        ) as client:
            for device in pending_devices:
                # Остановка ретраев при успешном закрытии
                if device.pending_command == "CLOSE" and device.state_l == 0 and device.state_r == 0:
                    device.pending_command = None
                    device.command_retries = 0
                    db.commit()
                    continue

                # Остановка ретраев при переходе клапана в режим ожидания кнопки
                if device.pending_command == "OPEN" and device.state_p == 1:
                    device.pending_command = None
                    device.command_retries = 0
                    db.commit()
                    continue

                # Общий лимит попыток для всех типов команд (включая конфигурации)
                if device.command_retries >= 5:
                    device.error_flag = 1
                    device.manual_control = True
                    device.pending_command = None
                    device.command_retries = 0
                    db.commit()
                    continue

                device.command_retries += 1
                db.commit()
                await client.publish(f"gas/command/{device.imei}", payload=device.pending_command, qos=1)


def check_offline_status():
    with SessionLocal() as db:
        devices = db.query(models.Device).all()
        now = datetime.now(timezone.utc)
        for device in devices:
            if device.last_online is None:
                continue
            delta = (now - device.last_online).total_seconds()
            offline_state = delta > (device.hb_interval + 60)
            if device.is_online == offline_state:
                device.is_online = not offline_state
        db.commit()