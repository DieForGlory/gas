import asyncio
from datetime import datetime, timezone
import aiomqtt
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app import models


async def process_device_retries():
    with SessionLocal() as db:
        try:
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

                    # Лимит увеличен для предотвращения False Positives у батарейных устройств.
                    # 360 попыток = 1 час ожидания (при интервале задачи 10 секунд).
                    if device.command_retries >= 360:
                        if device.pending_command in ["OPEN", "CLOSE"]:
                            device.error_flag = 1
                            device.manual_control = True

                        device.pending_command = None
                        device.command_retries = 0
                        db.commit()
                        continue

                    device.command_retries += 1
                    db.commit()

                    await client.publish(f"gas/command/{device.imei}", payload=device.pending_command, qos=1)

        except Exception as e:
            db.rollback()
            print(f"[TASKS] Ошибка обработки очереди: {e}")


def check_offline_status():
    with SessionLocal() as db:
        try:
            devices = db.query(models.Device).all()

            # Приведение к naive-времени (без таймзоны) для совместимости с SQLAlchemy
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            changed = False

            for device in devices:
                if device.last_online is None:
                    continue

                delta = (now - device.last_online).total_seconds()

                # Использование фактического интервала устройства + запас времени 60 секунд
                hb = device.hb_interval if device.hb_interval else 3600
                offline_state = delta > (hb + 60)

                if device.is_online == offline_state:
                    device.is_online = not offline_state
                    changed = True

            # Оптимизация: коммит выполняется только при наличии реальных изменений
            if changed:
                db.commit()

        except Exception as e:
            db.rollback()
            print(f"[TASKS] Ошибка проверки оффлайн статуса: {e}")