from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .models import ContractStatus, AuthStatus, Role

class SubscriberBase(BaseModel):
    name: str
    address: str
    contact_person: str
    phone: str

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

class DeviceOut(DeviceCreate):
    last_online: datetime
    auth_status: AuthStatus

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