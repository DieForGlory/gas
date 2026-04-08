from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
import aiomqtt
from jose import JWTError, jwt
from pydantic import BaseModel
import hashlib
import urllib.request
import base64
import json
from datetime import datetime, timedelta, timezone

from app import models, schemas, crud
from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.core.security import ALGORITHM, verify_password, create_access_token
from app.mqtt.handlers import send_command

api_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# Утилита для получения времени в GMT+5
def get_local_time():
    return datetime.now(timezone(timedelta(hours=5)))


# --- Зависимости безопасности ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Недействительный токен")
    except JWTError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user


def require_admin(user: models.User = Depends(get_current_user)):
    if user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return user


# --- Авторизация и Управление пользователями ---

@api_router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")

    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}


@api_router.post("/users", response_model=schemas.UserOut)
def create_new_user(
        user: schemas.UserCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    c_role = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    u_role = user.role.value if hasattr(user.role, 'value') else user.role

    if c_role == "LOCAL":
        raise HTTPException(status_code=403, detail="Операторы уровня LOCAL не могут создавать пользователей")

    if c_role == "REGIONAL" and u_role in ["ADMIN", "REGIONAL"]:
        raise HTTPException(status_code=403, detail="Администратор региона может создавать только операторов уровня LOCAL")

    if u_role == "REGIONAL":
        if not db.query(models.Region).filter(models.Region.id == user.region_id).first():
            raise HTTPException(status_code=400, detail="Неверный ID региона")

    if u_role == "LOCAL":
        district = db.query(models.District).filter(models.District.id == user.district_id).first()
        if not district:
            raise HTTPException(status_code=400, detail="Неверный ID района")
        if c_role == "REGIONAL" and district.region_id != current_user.region_id:
            raise HTTPException(status_code=403, detail="Нельзя создавать операторов вне своего региона")

    db_user = crud.create_user(db, user)
    if not db_user:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    return db_user


@api_router.get("/users", response_model=List[schemas.UserOut])
def read_users(
        skip: int = 0, limit: int = 100,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    return crud.get_users(db, skip=skip, limit=limit)


# --- Управление типами клапанов ---

@api_router.post("/valve-types", response_model=schemas.ValveTypeOut)
def create_valve_type(
        vt: schemas.ValveTypeCreate,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    db_vt = crud.create_valve_type(db, vt)
    if not db_vt:
        raise HTTPException(status_code=400, detail="Тип клапана уже существует")
    return db_vt


@api_router.get("/valve-types", response_model=List[schemas.ValveTypeOut])
def read_valve_types(
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    return crud.get_valve_types(db)


@api_router.put("/valve-types/{type_id}", response_model=schemas.ValveTypeOut)
def update_valve_type(
        type_id: int,
        vt_in: schemas.ValveTypeCreate,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    db_vt = crud.get_valve_type(db, type_id)
    if not db_vt:
        raise HTTPException(status_code=404, detail="Тип не найден")
    return crud.update_valve_type(db, db_vt, vt_in)


@api_router.delete("/valve-types/{type_id}")
def delete_valve_type(
        type_id: int,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    db_vt = crud.get_valve_type(db, type_id)
    if not db_vt:
        raise HTTPException(status_code=404, detail="Тип не найден")

    usage_count = db.query(models.Device).filter(models.Device.valve_type == type_id).count()
    if usage_count > 0:
        raise HTTPException(status_code=400, detail="Нельзя удалить: тип используется в устройствах")

    crud.delete_valve_type(db, db_vt)
    return {"status": "deleted"}


# --- Управление абонентами ---

@api_router.get("/dashboard/search", response_model=schemas.PaginatedSubscribers)
def search_subscribers(
        query: str = "",
        skip: int = 0,
        limit: int = 20,
        region_id: Optional[int] = None,
        district_id: Optional[int] = None,
        status: Optional[str] = None,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    base_query = db.query(models.Subscriber).options(
        joinedload(models.Subscriber.district).joinedload(models.District.region)
    )

    if query.strip():
        base_query = base_query.filter(
            or_(
                models.Subscriber.account_number.ilike(f"%{query}%"),
                models.Subscriber.name.ilike(f"%{query}%"),
                models.Subscriber.address.ilike(f"%{query}%")
            )
        )

    if region_id:
        base_query = base_query.join(models.District).filter(models.District.region_id == region_id)
    if district_id:
        base_query = base_query.filter(models.Subscriber.district_id == district_id)
    if status:
        base_query = base_query.filter(models.Subscriber.contract_status == status)

    base_query = crud.apply_access_scope(base_query, user, models.Subscriber)
    total = base_query.count()
    items = base_query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@api_router.post("/subscribers", response_model=schemas.SubscriberOut)
def create_subscriber(
        subscriber: schemas.SubscriberCreate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    c_role = user.role.value if hasattr(user.role, 'value') else user.role

    if c_role == "LOCAL" and subscriber.district_id != user.district_id:
        raise HTTPException(status_code=403, detail="Нельзя создать абонента вне вашего района")

    district = db.query(models.District).filter(models.District.id == subscriber.district_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="Неверный ID района")

    if c_role == "REGIONAL" and district.region_id != user.region_id:
        raise HTTPException(status_code=403, detail="Нельзя создать абонента вне вашего региона")

    db_sub = models.Subscriber(**subscriber.model_dump())
    db.add(db_sub)
    try:
        db.commit()
        db.refresh(db_sub)
        return db_sub
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Лицевой счет уже существует")


@api_router.get("/subscribers/{account_number}", response_model=schemas.SubscriberOut)
def get_subscriber(
        account_number: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    query = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number)
    query = crud.apply_access_scope(query, user, models.Subscriber)
    subscriber = query.first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Абонент не найден")
    return subscriber


@api_router.patch("/subscribers/{account_number}", response_model=schemas.SubscriberOut)
def update_subscriber(
        account_number: str,
        payload: schemas.SubscriberUpdate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    query = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number)
    query = crud.apply_access_scope(query, user, models.Subscriber)
    subscriber = query.first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Абонент не найден")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(subscriber, key, value)

    db.commit()
    db.refresh(subscriber)
    return subscriber


@api_router.post("/subscribers/{account_number}/balance")
async def update_balance(
        account_number: str,
        payload: schemas.BalanceUpdate,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    query = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number)
    query = crud.apply_access_scope(query, user, models.Subscriber)
    subscriber = query.first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Абонент не найден")

    subscriber.balance += payload.amount
    db.commit()

    background_tasks.add_task(notify_devices, account_number, SessionLocal)
    return {"account_number": account_number, "new_balance": subscriber.balance}


async def notify_devices(account_number: str, db_session_factory):
    db = db_session_factory()
    try:
        subscriber = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number).first()
        if not subscriber:
            return

        async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER,
                port=settings.MQTT_PORT,
                username=settings.MQTT_USER,
                password=settings.MQTT_PASSWORD
        ) as client:
            for device in subscriber.devices:
                action = crud.check_billing_automation(db, device.imei)
                if action:
                    if (action == "CLOSE" and device.state_l == 0 and device.state_r == 0) or \
                            (action == "OPEN" and device.state_l == 1 and device.state_r == 1):
                        continue

                    device.pending_command = action
                    device.command_retries = 0
                    db.commit()
                    await send_command(client, device.imei, action)
    except Exception as e:
        db.rollback()
        print(f"Ошибка MQTT уведомления: {e}")
    finally:
        db.close()


# --- Устройства и Команды ---

@api_router.post("/devices", response_model=schemas.DeviceOut)
def register_device(
        device: schemas.DeviceCreate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    sub_query = db.query(models.Subscriber).filter(models.Subscriber.account_number == device.subscriber_account)
    sub_query = crud.apply_access_scope(sub_query, user, models.Subscriber)
    if not sub_query.first():
        raise HTTPException(status_code=403, detail="Доступ к абоненту запрещен или он не найден")

    db_device = crud.create_device(db, device)
    if not db_device:
        raise HTTPException(status_code=400, detail="IMEI уже зарегистрирован")

    db_device.pending_command = json.dumps({"cmd": "SET_VTYPE", "type": device.valve_type}, separators=(',', ':'))
    db.commit()
    return db_device


@api_router.get("/devices/{imei}/status", response_model=schemas.DeviceOut)
def get_device_status(
        imei: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    device = crud.get_device(db, imei, user)
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено")
    return device


@api_router.patch("/devices/{imei}", response_model=schemas.DeviceOut)
async def update_device_config(
        imei: str,
        config: schemas.DeviceUpdate,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    device = crud.get_device(db, imei, user)
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено")

    if config.manual_control is not None:
        device.manual_control = config.manual_control
        crud.log_audit(db, operator_id=user.id, imei=imei, action=f"Установлен manual_control: {config.manual_control}")

    if config.hb_interval is not None:
        device.hb_interval = config.hb_interval
        device.pending_command = json.dumps({"cmd": "SET_HB", "interval": config.hb_interval}, separators=(',', ':'))
        device.command_retries = 0
        crud.log_audit(db, operator_id=user.id, imei=imei, action=f"Установлен интервал {config.hb_interval} сек.")

    if config.valve_type is not None and config.valve_type != device.valve_type:
        device.valve_type = config.valve_type
        device.pending_command = json.dumps({"cmd": "SET_VTYPE", "type": config.valve_type}, separators=(',', ':'))
        device.command_retries = 0
        crud.log_audit(db, operator_id=user.id, imei=imei, action=f"Изменен тип клапана на ID:{config.valve_type}")

    db.commit()
    db.refresh(device)

    if device.pending_command:
        async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER,
                port=settings.MQTT_PORT,
                username=settings.MQTT_USER,
                password=settings.MQTT_PASSWORD
        ) as client:
            await send_command(client, imei, device.pending_command)

    return device


@api_router.post("/devices/{imei}/command")
async def execute_manual_command(
        imei: str,
        command: str,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    valid_commands = ["OPEN", "CLOSE", "STATUS", "SERVICE"]
    if command not in valid_commands:
        raise HTTPException(status_code=400, detail="Неверная команда")

    device = crud.get_device(db, imei, user)
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено")

    readable_cmds = {
        "OPEN": "Открыть клапан",
        "CLOSE": "Закрыть клапан",
        "SERVICE": "Сервисный режим",
        "STATUS": "Запрос статуса"
    }

    device.manual_control = True
    if command in ["OPEN", "CLOSE"]:
        device.pending_command = command
        device.command_retries = 0

    db.commit()
    crud.log_audit(db, operator_id=user.id, imei=imei, action=f"Команда: {readable_cmds.get(command)}")

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        await send_command(client, imei, command)

    return {"status": "Команда отправлена", "imei": imei, "command": command}


@api_router.post("/devices/{imei}/reset_key")
async def reset_device_key(
        imei: str,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    device = crud.get_device(db, imei)
    if not device:
        raise HTTPException(status_code=404, detail="Устройство не найдено")

    async with aiomqtt.Client(
            hostname=settings.MQTT_BROKER,
            port=settings.MQTT_PORT,
            username=settings.MQTT_USER,
            password=settings.MQTT_PASSWORD
    ) as client:
        await send_command(client, imei, json.dumps({"cmd": "RESET_KEY"}, separators=(',', ':')))

    device.auth_status = models.AuthStatus.PROVISIONING
    device.secret_key_hash = None
    device.manual_control = True

    crud.log_audit(db, operator_id=admin.id, imei=imei, action="Сброс ключей шифрования")
    db.commit()

    # Удаление сессии в EMQX
    req = urllib.request.Request(f"http://emqx:18083/api/v5/clients/{imei}", method="DELETE")
    auth_str = base64.b64encode(b"admin:public").decode("ascii")
    req.add_header("Authorization", f"Basic {auth_str}")
    try:
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass

    return {"status": "Команда сброса ключей отправлена"}


# --- География и Аудит ---

@api_router.get("/regions", response_model=List[schemas.RegionOut])
def get_regions(
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    c_role = user.role.value if hasattr(user.role, 'value') else user.role
    if c_role == "ADMIN":
        return db.query(models.Region).all()
    elif c_role == "REGIONAL":
        return db.query(models.Region).filter(models.Region.id == user.region_id).all()
    elif c_role == "LOCAL":
        district = db.query(models.District).filter(models.District.id == user.district_id).first()
        return db.query(models.Region).filter(models.Region.id == district.region_id).all() if district else []


@api_router.get("/regions/{region_id}/districts", response_model=List[schemas.DistrictOut])
def get_districts_by_region(
        region_id: int,
        db: Session = Depends(get_db),
        user: models.User = Depends(get_current_user)
):
    c_role = user.role.value if hasattr(user.role, 'value') else user.role
    if c_role == "ADMIN":
        return db.query(models.District).filter(models.District.region_id == region_id).all()
    elif c_role == "REGIONAL":
        return db.query(models.District).filter(
            models.District.region_id == region_id).all() if region_id == user.region_id else []
    elif c_role == "LOCAL":
        district = db.query(models.District).filter(models.District.id == user.district_id).first()
        return [district] if district and district.region_id == region_id else []


@api_router.get("/audit", response_model=List[schemas.AuditLogOut])
def read_audit_logs(
        skip: int = 0, limit: int = 100,
        db: Session = Depends(get_db),
        admin: models.User = Depends(require_admin)
):
    return db.query(models.AuditLog).options(joinedload(models.AuditLog.operator)).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


@api_router.get("/subscribers/{account_number}/audit", response_model=List[schemas.AuditLogOut])
def get_subscriber_audit(
        account_number: str, skip: int = 0, limit: int = 100,
        db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    query = db.query(models.Subscriber).filter(models.Subscriber.account_number == account_number)
    query = crud.apply_access_scope(query, user, models.Subscriber)
    sub = query.first()
    if not sub: raise HTTPException(status_code=404, detail="Абонент не найден")

    imeis = [device.imei for device in sub.devices]
    if not imeis: return []

    return db.query(models.AuditLog) \
        .options(joinedload(models.AuditLog.operator)) \
        .filter(models.AuditLog.imei.in_(imeis)) \
        .order_by(models.AuditLog.timestamp.desc()) \
        .offset(skip).limit(limit).all()

@api_router.post("/mqtt/auth")
async def emqx_auth(
        clientid: str = Form(...),
        username: str = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_db)
):
    if clientid != username and username != settings.MQTT_USER:
        raise HTTPException(status_code=401, detail="deny")

    if username == settings.MQTT_USER and password == settings.MQTT_PASSWORD:
        return {"result": "allow", "is_superuser": True}

    device = crud.get_device(db, username)
    if not device: raise HTTPException(status_code=401, detail="deny")

    if password == "00000000":
        if device.auth_status in [models.AuthStatus.NEW, models.AuthStatus.PROVISIONING]:
            return {"result": "allow", "is_superuser": False}
        raise HTTPException(status_code=401, detail="deny")

    if device.secret_key_hash:
        # Используем verify_password из вашего app.core.security
        if verify_password(password, device.secret_key_hash):
            if device.auth_status in [models.AuthStatus.NEW, models.AuthStatus.PROVISIONING]:
                device.auth_status = models.AuthStatus.ACTIVE
                db.commit()
            return {"result": "allow", "is_superuser": False}

    raise HTTPException(status_code=401, detail="deny")


@api_router.post("/mqtt/acl")
async def emqx_acl(
        username: str = Form(...),
        topic: str = Form(...),
        action: str = Form(...),
        db: Session = Depends(get_db)
):
    if username == settings.MQTT_USER: return {"result": "allow"}

    allowed_sub = f"gas/command/{username}"
    allowed_sub_prov = f"gas/config/{username}/provision"
    allowed_pub_status = f"gas/status/{username}"
    allowed_pub_prov = f"gas/config/{username}/provision"

    if action == "subscribe" and topic in [allowed_sub, allowed_sub_prov]:
        return {"result": "allow"}
    if action == "publish" and topic in [allowed_pub_status, allowed_pub_prov]:
        return {"result": "allow"}

    raise HTTPException(status_code=401, detail="deny")