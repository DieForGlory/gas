import asyncio
from datetime import datetime, timezone
import aiomqtt
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app import models, crud


async def process_device_retries():
    """Сканирование устройств с незавершенными командами (механизм Retry 3-5 попыток)"""
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
                # Физическая/логическая проверка завершена
                if (device.pending_command == "OPEN" and device.state_l == 1 and device.state_r == 1) or \
                        (device.pending_command == "CLOSE" and device.state_l == 0 and device.state_r == 0):
                    device.pending_command = None
                    device.command_retries = 0
                    db.commit()
                    continue

                # Превышение лимита попыток (п. 4.2 ТЗ)
                if device.command_retries >= 5:
                    device.error_flag = 1  # Принудительная фиксация ошибки связи/заклинивания
                    device.manual_control = True
                    device.pending_command = None
                    device.command_retries = 0
                    db.commit()
                    continue

                # Повторная отправка
                device.command_retries += 1
                db.commit()
                await client.publish(f"gas/command/{device.imei}", payload=device.pending_command, qos=1)


def check_offline_status():
    """Маркировка устройств оффлайн при превышении (hb_interval + 60s)"""
    with SessionLocal() as db:
        devices = db.query(models.Device).all()
        now = datetime.now(timezone.utc)
        for device in devices:
            delta = (now - device.last_online).total_seconds()
            is_offline = delta > (device.hb_interval + 60)
            # При необходимости можно логировать переход в оффлайн