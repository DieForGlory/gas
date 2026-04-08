from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models import ContractStatus, AuthStatus, Role
from decimal import Decimal
from typing import Optional

class BalanceUpdate(BaseModel):
    amount: Decimal

class RegionBase(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)

class SubscriberUpdate(BaseModel):
    name: Optional[str] = None
    inn: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None

class DistrictNested(BaseModel):
    id: int
    name: str
    region: RegionBase
    model_config = ConfigDict(from_attributes=True)

class RegionOut(RegionBase):
    id: int

class DistrictBase(BaseModel):
    name: str
    region_id: int

class DistrictOut(DistrictBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ValveTypeCreate(BaseModel):
    id: int
    name: str
    response_time: int

class ValveTypeOut(ValveTypeCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DeviceBase(BaseModel):
    subscriber_account: str
    valve_type: int
    hb_interval: int = 60
    manual_control: bool = False

class DeviceCreate(DeviceBase):
    imei: str = Field(min_length=15, max_length=15)

class DeviceUpdate(BaseModel):
    hb_interval: Optional[int] = Field(None, ge=10, le=3600)
    valve_type: Optional[int] = None
    manual_control: Optional[bool] = None

class DeviceOut(DeviceCreate):
    last_online: Optional[datetime] = None
    auth_status: AuthStatus
    is_online: bool
    state_l: Optional[int] = None
    state_r: Optional[int] = None
    state_p: Optional[int] = 0
    error_flag: Optional[int] = 0
    rssi: Optional[int] = None
    battery: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class SubscriberBase(BaseModel):
    name: str
    inn: str
    address: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    district_id: int

class SubscriberCreate(SubscriberBase):
    account_number: str

class SubscriberOut(SubscriberCreate):
    balance: Decimal
    contract_status: ContractStatus
    devices: List[DeviceOut] = []
    district: Optional[DistrictNested] = None
    model_config = ConfigDict(from_attributes=True)

class PaginatedSubscribers(BaseModel):
    total: int
    items: List[SubscriberOut]

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    operator_id: int
    imei: Optional[str] = None
    action: str
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    role: Role
    region_id: Optional[int] = None
    district_id: Optional[int] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None

    @model_validator(mode='after')
    def check_role_hierarchy(self):
        role_val = self.role.value if hasattr(self.role, 'value') else self.role

        if role_val == "ADMIN" or role_val == Role.ADMIN.value:
            self.region_id = None
            self.district_id = None
        elif role_val == "REGIONAL" or role_val == Role.REGIONAL.value:
            if not self.region_id:
                raise ValueError("REGIONAL role requires a region_id")
            self.district_id = None
        elif role_val == "LOCAL" or role_val == Role.LOCAL.value:
            if not self.district_id:
                raise ValueError("LOCAL role requires a district_id")
            self.region_id = None

        return self

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StatusPayload(BaseModel):
    id: str
    l: int
    r: int
    err: int
    s: int
    bat: Optional[float] = None
    p: Optional[int] = 0

class ProvisionPayload(BaseModel):
    cmd: str = "PROVISION"
    new_key: str