import asyncio
import json
from datetime import datetime, timezone

from aiomqtt import Client
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session
import asyncio
import json
import base64
import urllib.request
from datetime import datetime, timezone
from app import crud
from app import models
from app.core.database import SessionLocal
from app.models import DeviceTelemetryLog
from app.schemas import StatusPayload


def _save_telemetry_sync(imei: str, topic: str, payload_data: dict):
    with SessionLocal() as db:
        # Проверка существования устройства
        if not db.query(models.Device).filter(models.Device.imei == imei).first():
            return

        log_entry = DeviceTelemetryLog(
            imei=imei,
            topic=topic,
            payload=payload_data
        )
        db.add(log_entry)
        db.commit()

async def handle_status_message(payload: str, topic: str, db: Session, mqtt_client: Client):
    imei = topic.split("/")[-1]

    clean_payload = payload.replace(" ", "").strip().strip('"').strip("'")
    if clean_payload in ["OPENED_OK", "HB_SET_OK", "VTYPE_SET_OK"]:
        device = await asyncio.to_thread(crud.get_device, db, imei)
        if device:
            device.pending_command = None
            device.command_retries = 0
            if clean_payload == "OPENED_OK":
                device.state_l = 1
                device.state_r = 1
                device.state_p = 0
            await asyncio.to_thread(db.commit)
        return

    try:
        data = StatusPayload.model_validate_json(payload)
    except Exception as e:
        print(f"[MQTT] Parse error {imei}: {e} | Payload: {payload}")
        return

    device = await asyncio.to_thread(crud.get_device, db, imei)
    if not device:
        return
    if getattr(device, 'is_key_reset_pending', False):
        await send_command(mqtt_client, imei, json.dumps({"cmd": "RESET_KEY"}, separators=(',', ':')))

        device.is_key_reset_pending = False
        device.auth_status = models.AuthStatus.PROVISIONING
        device.secret_key_hash = None
        device.manual_control = True

        await asyncio.to_thread(db.commit)

        def drop_emqx_session():
            req = urllib.request.Request(f"http://emqx:18083/api/v5/clients/{imei}", method="DELETE")
            auth_str = base64.b64encode(b"admin:public").decode("ascii")
            req.add_header("Authorization", f"Basic {auth_str}")
            try:
                urllib.request.urlopen(req, timeout=2)
            except Exception:
                pass

        await asyncio.sleep(3)
        await asyncio.to_thread(drop_emqx_session)
        return
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

    await asyncio.to_thread(db.commit)

    if device.pending_command and ("{" in device.pending_command):
        return

    action = await asyncio.to_thread(crud.check_billing_automation, db, imei)
    if action:
        is_redundant = (
                (action == "CLOSE" and device.state_l == 0 and device.state_r == 0) or
                (action == "OPEN" and device.state_l == 1 and device.state_r == 1)
        )

        if not is_redundant and device.pending_command != action:
            device.pending_command = action
            device.command_retries = 0
            await asyncio.to_thread(db.commit)
            if device.pending_command:
                if "{" in device.pending_command:
                    await send_command(mqtt_client, imei, device.pending_command)
                    return

            action = await asyncio.to_thread(crud.check_billing_automation, db, imei)

async def log_device_telemetry(imei: str, topic: str, payload_bytes: bytes):
    try:
        payload_data = json.loads(payload_bytes.decode('utf-8'))
    except json.JSONDecodeError:
        payload_data = {"raw_data": payload_bytes.decode('utf-8', errors='ignore')}

    await run_in_threadpool(_save_telemetry_sync, imei, topic, payload_data)

async def handle_provision_request(payload: str, topic: str, db: Session, mqtt_client: Client):
    if "new_key" in payload:
        return

    imei = topic.split("/")[-2]
    new_key = await asyncio.to_thread(crud.generate_provisioning_key, db, imei)

    if new_key:
        response = json.dumps({"cmd": "PROVISION", "new_key": new_key}, separators=(',', ':'))
        await mqtt_client.publish(f"gas/config/{imei}/provision", payload=response, qos=1)


async def send_command(mqtt_client: Client, imei: str, cmd: str):
    await mqtt_client.publish(f"gas/command/{imei}", payload=cmd, qos=1)