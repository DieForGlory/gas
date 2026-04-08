from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base
from datetime import timedelta, timezone
from sqlalchemy import Numeric

class Role(enum.Enum):
    ADMIN = "ADMIN"
    REGIONAL = "REGIONAL"
    LOCAL = "LOCAL"

class ValveType(Base):
    __tablename__ = "valve_types"
    id = Column(Integer, primary_key=True, index=True, autoincrement=False) # autoincrement=False добавлено
    name = Column(String, unique=True, index=True, nullable=False)
    response_time = Column(Integer, nullable=False)

class ContractStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class AuthStatus(enum.Enum):
    NEW = "NEW"
    PROVISIONING = "PROVISIONING"
    ACTIVE = "ACTIVE"


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    districts = relationship("District", back_populates="region", cascade="all, delete-orphan")
    users = relationship("User", back_populates="region", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)

    region = relationship("Region", back_populates="districts")
    subscribers = relationship("Subscriber", back_populates="district", cascade="all, delete-orphan")
    users = relationship("User", back_populates="district", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, default=Role.LOCAL)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)

    region = relationship("Region", back_populates="users")
    district = relationship("District", back_populates="users")


class Subscriber(Base):
    __tablename__ = "subscribers"

    account_number = Column(String, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    inn = Column(String, nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    balance = Column(Numeric(12, 2), default=0.00)
    contract_status = Column(Enum(ContractStatus), default=ContractStatus.ACTIVE)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    district = relationship("District", back_populates="subscribers")
    devices = relationship("Device", back_populates="subscriber", cascade="all, delete-orphan", order_by="Device.imei")


class Device(Base):
    __tablename__ = "devices"

    imei = Column(String, primary_key=True, index=True)
    subscriber_account = Column(String, ForeignKey("subscribers.account_number"))
    valve_type = Column(Integer, ForeignKey("valve_types.id"))
    valve_type_ref = relationship("ValveType")
    hb_interval = Column(Integer, default=3600)
    state_l = Column(Integer, nullable=True)
    state_r = Column(Integer, nullable=True)
    state_p = Column(Integer, nullable=True, default=0)
    battery = Column(Float, nullable=True)
    rssi = Column(Integer, nullable=True)
    error_flag = Column(Integer, nullable=True, default=0)
    is_online = Column(Boolean, default=False)
    last_online = Column(DateTime, nullable=True)
    auth_status = Column(Enum(AuthStatus), default=AuthStatus.PROVISIONING)
    manual_control = Column(Boolean, default=False)
    pending_command = Column(String, nullable=True)
    command_retries = Column(Integer, default=0)
    secret_key_hash = Column(String, nullable=True)

    subscriber = relationship("Subscriber", back_populates="devices")

def get_local_time():
    return datetime.now(timezone(timedelta(hours=5)))

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=get_local_time)
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator = relationship("User")
    imei = Column(String, nullable=True)
    action = Column(String)

