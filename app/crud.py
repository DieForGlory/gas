import hashlib
import secrets
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas


def get_device(db: Session, imei: str):
    return db.query(models.Device).filter(models.Device.imei == imei).first()


def create_device(db: Session, device: schemas.DeviceCreate):
    db_device = models.Device(
        imei=device.imei,
        subscriber_account=device.subscriber_account,
        valve_type=device.valve_type,
        hb_interval=device.hb_interval,
        manual_control=device.manual_control
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