from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .models import ContractStatus, AuthStatus, Role

class SubscriberBase(BaseModel):
    name: str
    address: str
    contact_person: Optional[str] = None  # Сделано необязательным
    phone: Optional[str] = None           # Сделано необязательным

class SubscriberCreate(SubscriberBase):
    account_number: str

class SubscriberOut(SubscriberCreate):
    balance: float
    contract_status: ContractStatus

    class Config:
        from_attributes = True

class DeviceBase(BaseModel):
    subscriber_account: str
    valve_type: int = Field(ge=0, le=1)
    hb_interval: int = 60
    manual_control: bool = False

class DeviceCreate(DeviceBase):
    imei: str = Field(min_length=15, max_length=15)

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    operator_id: int
    imei: Optional[str] = None
    action: str

    class Config:
        from_attributes = True

class DeviceUpdate(BaseModel):
    hb_interval: Optional[int] = Field(None, ge=10, le=3600)
    valve_type: Optional[int] = Field(None, ge=0, le=1)

class DeviceOut(DeviceCreate):
    last_online: datetime
    auth_status: AuthStatus
    state_l: Optional[int] = None
    state_r: Optional[int] = None
    error_flag: int
    rssi: Optional[int] = None
    battery: Optional[float] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: Role

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

class StatusPayload(BaseModel):
    id: str
    l: int
    r: int
    err: int
    s: int

class ProvisionPayload(BaseModel):
    cmd: str = "PROVISION"
    new_key: str