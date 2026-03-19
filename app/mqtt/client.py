import asyncio
import aiomqtt
from app.core.config import settings
from app.core.database import SessionLocal
from . import handlers


async def mqtt_listener():
    reconnect_interval = 5
    while True:
        try:
            async with aiomqtt.Client(
                    hostname=settings.MQTT_BROKER,
                    port=settings.MQTT_PORT,
                    username=settings.MQTT_USER,
                    password=settings.MQTT_PASSWORD,
                    client_id="backend_core_service",
                    clean_session=False
            ) as client:
                await client.subscribe("gas/status/#", qos=1)
                await client.subscribe("gas/config/+/provision", qos=1)

                async for message in client.messages:
                    payload = message.payload.decode()
                    topic = str(message.topic)

                    with SessionLocal() as db:
                        if topic.startswith("gas/status/"):
                            await handlers.handle_status_message(payload, topic, db, client)
                        elif "provision" in topic:
                            await handlers.handle_provision_request(payload, topic, db, client)
        except aiomqtt.MqttError:
            await asyncio.sleep(reconnect_interval)