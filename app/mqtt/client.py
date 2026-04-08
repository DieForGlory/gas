import asyncio
import aiomqtt
from app.core.config import settings
from app.core.database import SessionLocal
from . import handlers


async def mqtt_listener():
    reconnect_interval = 5
    while True:
        try:
            print(f"[MQTT] Подключение к {settings.MQTT_BROKER} под пользователем {settings.MQTT_USER}...")
            async with aiomqtt.Client(
                    hostname=settings.MQTT_BROKER,
                    port=settings.MQTT_PORT,
                    username=settings.MQTT_USER,
                    password=settings.MQTT_PASSWORD,
                    client_id="backend_core_service",
                    clean_session=False
            ) as client:
                print("[MQTT] Подключено. Подписка на топики...")
                await client.subscribe("gas/status/#", qos=1)
                await client.subscribe("gas/config/+/provision", qos=1)

                async with client.messages() as messages:
                    async for message in messages:
                        payload = message.payload.decode()
                        topic = str(message.topic)

                        print(f"[MQTT RX] {topic} -> {payload}")

                        with SessionLocal() as db:
                            try:
                                if topic.startswith("gas/status/"):
                                    await handlers.handle_status_message(payload, topic, db, client)
                                elif "provision" in topic:
                                    await handlers.handle_provision_request(payload, topic, db, client)
                            except Exception as e:
                                db.rollback()
                                print(f"[MQTT DB ERROR] Ошибка обработки сообщения: {e}")
        except Exception as e:
            print(f"[MQTT ERROR] Сбой слушателя: {e}")
            await asyncio.sleep(reconnect_interval)