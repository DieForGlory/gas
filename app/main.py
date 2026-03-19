import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import aiomqtt
from typing import List
from sqlalchemy import or_
from app import models, schemas, crud
from app.core.database import engine, get_db
from app.core.config import settings
from app.mqtt.client import mqtt_listener
from app.mqtt.handlers import send_command
from fastapi import Request, Form

models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_task = asyncio.create_task(mqtt_listener())
    yield
    mqtt_task.cancel()


app = FastAPI(title="Gas Valve Control System API", version="3.0", lifespan=lifespan)


@app.get("/api/v1/subscribers/{account_number}", response_model=schemas.SubscriberOut)
def get_subscriber(account_number: str, db: Session = Depends(get_db)):
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return subscriber


@app.get("/api/v1/devices/{imei}/status")
def get_device_status(imei: str, db: Session = Depends(get_db)):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    now = datetime.now(timezone.utc)
    delta = (now - device.last_online).total_seconds()

    # Формула: hb_interval + 60s
    is_online = delta <= (device.hb_interval + 60)

    return {
        "imei": device.imei,
        "is_online": is_online,
        "auth_status": device.auth_status,
        "manual_control": device.manual_control,
        "last_online": device.last_online
    }
@app.post("/api/v1/mqtt/auth")
async def emqx_auth(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    EMQX HTTP Authentication Webhook.
    EMQX должен быть настроен на отправку POST-запроса с form-data (username, password).
    """
    device = crud.get_device(db, username)
    if not device:
        raise HTTPException(status_code=401, detail="deny")

    # Временный пароль для нового или провижинящегося устройства
    if password == "00000000":
        if device.auth_status in [models.AuthStatus.NEW, models.AuthStatus.PROVISIONING]:
            return {"result": "allow", "is_superuser": False}
        raise HTTPException(status_code=401, detail="deny")

    # Проверка основного ключа для активного устройства
    if device.auth_status == models.AuthStatus.ACTIVE and device.secret_key_hash:
        import hashlib
        req_hash = hashlib.sha256(password.encode()).hexdigest()
        if device.secret_key_hash == req_hash:
            return {"result": "allow", "is_superuser": False}

    raise HTTPException(status_code=401, detail="deny")

@app.post("/api/v1/mqtt/acl")
async def emqx_acl(
    username: str = Form(...),
    topic: str = Form(...),
    action: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    EMQX HTTP ACL Webhook.
    Контроль доступа к топикам (publish/subscribe).
    """
    if username == settings.MQTT_USER:
        return {"result": "allow"}

    # Разрешения для конечных устройств (username = imei)
    allowed_sub = f"gas/command/{username}"
    allowed_pub_status = f"gas/status/{username}"
    allowed_pub_prov = f"gas/config/{username}/provision"

    if action == "subscribe" and topic == allowed_sub:
        return {"result": "allow"}
    if action == "publish" and topic in [allowed_pub_status, allowed_pub_prov]:
        return {"result": "allow"}

    raise HTTPException(status_code=401, detail="deny")

@app.post("/api/v1/devices/{imei}/reset_key")
def reset_device_key(imei: str, operator_id: int, db: Session = Depends(get_db)):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.auth_status = models.AuthStatus.NEW
    device.secret_key_hash = None
    device.manual_control = True  # Блокировка автоматики до нового провижининга

    crud.log_audit(db, operator_id=operator_id, imei=imei, action="RESET_KEY")
    db.commit()

    return {"status": "Key reset successful. Provisioning state activated."}

@app.get("/api/v1/dashboard/search", response_model=List[schemas.SubscriberOut])
def search_subscribers(query: str, db: Session = Depends(get_db)):
    results = db.query(models.Subscriber).filter(
        or_(
            models.Subscriber.account_number.ilike(f"%{query}%"),
            models.Subscriber.name.ilike(f"%{query}%"),
            models.Subscriber.address.ilike(f"%{query}%")
        )
    ).limit(100).all()
    return results

@app.post("/api/v1/devices/{imei}/command")
async def execute_manual_command(
        imei: str,
        command: str,
        operator_id: int,
        db: Session = Depends(get_db)
):
    valid_commands = ["OPEN", "CLOSE", "STATUS", "SERVICE", "SET_HB", "SET_VTYPE"]
    if command not in valid_commands:
        raise HTTPException(status_code=400, detail="Invalid command")

    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.manual_control = True
    db.commit()

    crud.log_audit(db, operator_id=operator_id, imei=imei, action=f"MANUAL_CMD: {command}")

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        await send_command(client, imei, command)

    return {"status": "Command dispatched", "imei": imei, "command": command}