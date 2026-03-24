import enum
from sqlalchemy import Column, String, Numeric, Boolean, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone
from sqlalchemy import Index
Base = declarative_base()


class ContractStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class AuthStatus(enum.Enum):
    NEW = "NEW"
    PROVISIONING = "PROVISIONING"
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"


class Role(enum.Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)


class Subscriber(Base):
    __tablename__ = "subscribers"

    account_number = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    contract_status = Column(Enum(ContractStatus), default=ContractStatus.ACTIVE, nullable=False)

    devices = relationship("Device", back_populates="subscriber")

    __table_args__ = (
        Index('idx_subscriber_search', 'name', 'address'),
    )


class Device(Base):
    __tablename__ = "devices"

    imei = Column(String(15), primary_key=True, index=True)
    subscriber_account = Column(String, ForeignKey("subscribers.account_number"))
    valve_type = Column(Integer, nullable=False)
    last_online = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    hb_interval = Column(Integer, default=60, nullable=False)
    auth_status = Column(Enum(AuthStatus), default=AuthStatus.NEW, nullable=False)
    secret_key_hash = Column(String, nullable=True)
    manual_control = Column(Boolean, default=False, nullable=False)
    pending_command = Column(String, nullable=True)
    command_retries = Column(Integer, default=0, nullable=False)
    # Новые поля телеметрии
    state_l = Column(Integer, nullable=True)
    state_r = Column(Integer, nullable=True)
    error_flag = Column(Integer, default=0, nullable=False)
    rssi = Column(Integer, nullable=True)
    battery = Column(Numeric(4, 2), nullable=True)

    subscriber = relationship("Subscriber", back_populates="devices")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    imei = Column(String(15), ForeignKey("devices.imei"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)