import hashlib
import secrets
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas
from app.core.security import get_password_hash
from .models import Role, Subscriber, Device, District, User

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
    if user.role == Role.ADMIN:
        return query

    if model == Subscriber:
        if user.role == Role.REGIONAL:
            return query.join(District).filter(District.region_id == user.region_id)
        if user.role == Role.LOCAL:
            return query.filter(Subscriber.district_id == user.district_id)

    if model == Device:
        if user.role == Role.REGIONAL:
            return query.join(Subscriber).join(District).filter(District.region_id == user.region_id)
        if user.role == Role.LOCAL:
            return query.join(Subscriber).filter(Subscriber.district_id == user.district_id)

    return query.filter(False)

def get_devices(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Device)
    query = apply_access_scope(query, user, Device)
    return query.offset(skip).limit(limit).all()

def get_subscribers(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Subscriber)
    query = apply_access_scope(query, user, Subscriber)
    return query.offset(skip).limit(limit).all()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

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

    new_key = secrets.token_hex(8)
    key_hash = hashlib.sha256(new_key.encode()).hexdigest()

    db_device.secret_key_hash = key_hash
    db_device.auth_status = models.AuthStatus.PROVISIONING
    db.commit()

    return new_key

def activate_device(db: Session, imei: str):
    db_device = get_device(db, imei)
    if db_device and db_device.auth_status == models.AuthStatus.PROVISIONING:
        db_device.auth_status = models.AuthStatus.ACTIVE
        db.commit()

def log_audit(db: Session, operator_id: int, imei: str, action: str):
    log_entry = models.AuditLog(operator_id=operator_id, imei=imei, action=action)
    db.add(log_entry)
    db.commit()

def check_billing_automation(db: Session, imei: str) -> str | None:
    db_device = get_device(db, imei)
    if not db_device or db_device.manual_control:
        return None

    subscriber = db_device.subscriber
    if subscriber.balance < 0:
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