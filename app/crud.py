import hashlib
import secrets
from app.core.security import pwd_context
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas
from app.core.security import get_password_hash
from .models import Role, Subscriber, Device, District, User
from typing import Optional, List
from sqlalchemy import or_

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        role=user.role,
        region_id=user.region_id,
        district_id=user.district_id,
        full_name=user.full_name, # Убедитесь, что это поле есть в модели
        phone=user.phone          # Убедитесь, что это поле есть в модели
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        return None

def apply_access_scope(query, user, model):
    if user.role in [models.Role.ADMIN, models.Role.SUPER_ADMIN]:
        return query

    if model == models.Subscriber:
        # Скрываем неактивных абонентов для 2 и 3 уровней
        query = query.filter(models.Subscriber.contract_status == models.ContractStatus.ACTIVE)
        if user.role == models.Role.REGIONAL:
            return query.join(models.District).filter(models.District.region_id == user.region_id)
        if user.role == models.Role.LOCAL:
            return query.filter(models.Subscriber.district_id == user.district_id)

    if model == models.Device:
        # Скрываем устройства неактивных абонентов
        query = query.join(models.Subscriber).filter(models.Subscriber.contract_status == models.ContractStatus.ACTIVE)
        if user.role == models.Role.REGIONAL:
            return query.join(models.District).filter(models.District.region_id == user.region_id)
        if user.role == models.Role.LOCAL:
            return query.filter(models.Subscriber.district_id == user.district_id)

    return query.filter(False)

def get_devices(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Device)
    query = apply_access_scope(query, user, Device)
    return query.offset(skip).limit(limit).all()


def get_subscribers(db: Session, user: User, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Subscriber)
    query = apply_access_scope(query, user, Subscriber)

    if search:
        query = query.filter(
            or_(
                Subscriber.account_number.ilike(f"%{search}%"),
                Subscriber.name.ilike(f"%{search}%"),
                Subscriber.address.ilike(f"%{search}%"),
                Subscriber.inn.ilike(f"%{search}%")  # Добавлено
            )
        )
    return query.offset(skip).limit(limit).all()


def get_users(db: Session, search: str = None, role: str = None, region_id: int = None, district_id: int = None):
    query = db.query(
        models.User,
        models.Region.name.label("region_name"),
        models.District.name.label("district_name")
    ).outerjoin(models.Region, models.User.region_id == models.Region.id) \
        .outerjoin(models.District, models.User.district_id == models.District.id)

    if search:
        query = query.filter(models.User.username.ilike(f"%{search}%"))
    if role:
        query = query.filter(models.User.role == role)
    if region_id:
        query = query.filter(models.User.region_id == region_id)
    if district_id:
        query = query.filter(models.User.district_id == district_id)

    results = query.all()

    users_out = []
    for user_obj, r_name, d_name in results:
        u = schemas.UserOut.model_validate(user_obj)
        u.region_name = r_name
        u.district_name = d_name
        users_out.append(u)
    return users_out

def get_device(db: Session, imei: str, user: User = None):
    query = db.query(models.Device).filter(models.Device.imei == imei)
    if user:
        query = apply_access_scope(query, user, models.Device)
    return query.first()

def create_device(db: Session, device: schemas.DeviceCreate):
    db_device = models.Device(
        imei=device.imei,
        subscriber_account=device.subscriber_account,
        valve_type=device.valve_type,
        hb_interval=device.hb_interval,
        manual_control=device.manual_control,
        sim_number=device.sim_number,
        auth_status=models.AuthStatus.NEW
    )
    db.add(db_device)
    try:
        db.commit()
        db.refresh(db_device)
        return db_device
    except IntegrityError:
        db.rollback()
        return None


def generate_provisioning_key(db: Session, imei: str) -> str | None:
    db_device = get_device(db, imei)
    if not db_device or db_device.auth_status not in [models.AuthStatus.NEW, models.AuthStatus.PROVISIONING]:
        return None

    new_key = secrets.token_hex(16)
    db_device.secret_key_hash = pwd_context.hash(new_key)

    db_device.auth_status = models.AuthStatus.PROVISIONING
    db.commit()

    return new_key

def activate_device(db: Session, imei: str):
    db_device = get_device(db, imei)
    if db_device and db_device.auth_status == models.AuthStatus.PROVISIONING:
        db_device.auth_status = models.AuthStatus.ACTIVE
        db.commit()

def log_audit(db: Session, operator_id: int, action: str, imei: Optional[str] = None):
    log_entry = models.AuditLog(operator_id=operator_id, imei=imei, action=action)
    db.add(log_entry)
    db.commit()

def check_billing_automation(db: Session, imei: str) -> str | None:
    db_device = get_device(db, imei)
    if not db_device or db_device.manual_control:
        return None

    subscriber = db_device.subscriber
    if subscriber.balance <= 0:
        return "CLOSE"
    elif subscriber.balance > 0 and subscriber.contract_status == models.ContractStatus.ACTIVE:
        return "OPEN"
    return None

# --- Новые функции для работы с типами клапанов ---

def get_valve_type(db: Session, type_id: int):
    return db.query(models.ValveType).filter(models.ValveType.id == type_id).first()

def create_valve_type(db: Session, vt: schemas.ValveTypeCreate):
    db_vt = models.ValveType(**vt.model_dump())
    db.add(db_vt)
    try:
        db.commit()
        db.refresh(db_vt)
        return db_vt
    except IntegrityError:
        db.rollback()
        return None

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user(db: Session, db_user: models.User, user: schemas.UserUpdate):
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    db.delete(db_user)
    db.commit()

def update_valve_type(db: Session, db_vt: models.ValveType, vt_in: schemas.ValveTypeCreate):
    db_vt.name = vt_in.name
    db_vt.response_time = vt_in.response_time
    db.commit()
    db.refresh(db_vt)
    return db_vt

def delete_valve_type(db: Session, db_vt: models.ValveType):
    db.delete(db_vt)
    db.commit()

def get_valve_types(db: Session):
    return db.query(models.ValveType).all()