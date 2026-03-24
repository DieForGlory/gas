from typing import List
from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
import aiomqtt
from jose import JWTError, jwt
from pydantic import BaseModel
import hashlib

from app import models, schemas, crud
from app.core.database import get_db
from app.core.config import settings
from app.core.security import ALGORITHM, verify_password, create_access_token
from app.mqtt.handlers import send_command

api_router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(user: models.User = Depends(get_current_user)):
    if user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@api_router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect credentials")

    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/users", response_model=schemas.UserOut)
def create_new_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    db_user = crud.create_user(db, user)
    if not db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return db_user

@api_router.get("/users", response_model=List[schemas.UserOut])
def read_users(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    return crud.get_users(db, skip=skip, limit=limit)

@api_router.post("/subscribers", response_model=schemas.SubscriberOut)
def create_subscriber(
    subscriber: schemas.SubscriberCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    db_sub = models.Subscriber(**subscriber.model_dump())
    db.add(db_sub)
    try:
        db.commit()
        db.refresh(db_sub)
        return db_sub
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Account number already exists")

@api_router.get("/subscribers/{account_number}", response_model=schemas.SubscriberOut)
def get_subscriber(
        account_number: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return subscriber

class BalanceUpdate(BaseModel):
    amount: float

@api_router.post("/subscribers/{account_number}/balance")
async def update_balance(
        account_number: str,
        payload: BalanceUpdate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    subscriber.balance += payload.amount
    db.commit()

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        for device in subscriber.devices:
            action = crud.check_billing_automation(db, device.imei)
            if action:
                await send_command(client, device.imei, action)

    return {"account_number": account_number, "new_balance": subscriber.balance}

@api_router.get("/dashboard/search", response_model=List[schemas.SubscriberOut])
def search_subscribers(
        query: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    results = db.query(models.Subscriber).filter(
        or_(
            models.Subscriber.account_number.ilike(f"%{query}%"),
            models.Subscriber.name.ilike(f"%{query}%"),
            models.Subscriber.address.ilike(f"%{query}%")
        )
    ).limit(100).all()
    return results

@api_router.post("/devices", response_model=schemas.DeviceOut)
def register_device(
    device: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    db_device = crud.create_device(db, device)
    if not db_device:
        raise HTTPException(status_code=400, detail="IMEI already registered or invalid subscriber")
    return db_device

@api_router.get("/devices/{imei}/status", response_model=schemas.DeviceOut)
def get_device_status(
        imei: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@api_router.patch("/devices/{imei}", response_model=schemas.DeviceOut)
async def update_device_config(
        imei: str,
        config: schemas.DeviceUpdate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        if config.hb_interval is not None and config.hb_interval != device.hb_interval:
            device.hb_interval = config.hb_interval
            await send_command(client, imei, f"SET_HB:{config.hb_interval}")
            crud.log_audit(db, operator_id=user.id, imei=imei, action=f"SET_HB:{config.hb_interval}")

        if config.valve_type is not None and config.valve_type != device.valve_type:
            device.valve_type = config.valve_type
            await send_command(client, imei, f"SET_VTYPE:{config.valve_type}")
            crud.log_audit(db, operator_id=user.id, imei=imei, action=f"SET_VTYPE:{config.valve_type}")

    db.commit()
    db.refresh(device)
    return device

@api_router.post("/devices/{imei}/command")
async def execute_manual_command(
        imei: str,
        command: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    valid_commands = ["OPEN", "CLOSE", "STATUS", "SERVICE", "SET_HB", "SET_VTYPE"]
    if command not in valid_commands:
        raise HTTPException(status_code=400, detail="Invalid command")

    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.manual_control = True

    if command in ["OPEN", "CLOSE"]:
        device.pending_command = command
        device.command_retries = 0

    db.commit()

    crud.log_audit(db, operator_id=user.id, imei=imei, action=f"MANUAL_CMD: {command}")

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        await send_command(client, imei, command)

    return {"status": "Command dispatched", "imei": imei, "command": command}

@api_router.post("/devices/{imei}/reset_key")
def reset_device_key(
        imei: str,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.auth_status = models.AuthStatus.NEW
    device.secret_key_hash = None
    device.manual_control = True

    crud.log_audit(db, operator_id=admin.id, imei=imei, action="RESET_KEY")
    db.commit()

    return {"status": "Key reset successful"}

@api_router.post("/mqtt/auth")
async def emqx_auth(
        username: str = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_db)
):
    if username == settings.MQTT_USER and password == settings.MQTT_PASSWORD:
        return {"result": "allow", "is_superuser": True}

    device = crud.get_device(db, username)
    if not device:
        raise HTTPException(status_code=401, detail="deny")

    if password == "00000000":
        if device.auth_status in [models.AuthStatus.NEW, models.AuthStatus.PROVISIONING]:
            return {"result": "allow", "is_superuser": False}
        raise HTTPException(status_code=401, detail="deny")

    if device.auth_status == models.AuthStatus.ACTIVE and device.secret_key_hash:
        req_hash = hashlib.sha256(password.encode()).hexdigest()
        if device.secret_key_hash == req_hash:
            return {"result": "allow", "is_superuser": False}

    raise HTTPException(status_code=401, detail="deny")

@api_router.post("/mqtt/acl")
async def emqx_acl(
        username: str = Form(...),
        topic: str = Form(...),
        action: str = Form(...),
        db: Session = Depends(get_db)
):
    if username == settings.MQTT_USER:
        return {"result": "allow"}

    allowed_sub = f"gas/command/{username}"
    allowed_pub_status = f"gas/status/{username}"
    allowed_pub_prov = f"gas/config/{username}/provision"

    if action == "subscribe" and topic == allowed_sub:
        return {"result": "allow"}
    if action == "publish" and topic in [allowed_pub_status, allowed_pub_prov]:
        return {"result": "allow"}

    raise HTTPException(status_code=401, detail="deny")

@api_router.get("/audit", response_model=List[schemas.AuditLogOut])
def read_audit_logs(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()