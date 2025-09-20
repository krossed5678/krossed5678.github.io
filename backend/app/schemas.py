from pydantic import BaseModel
from typing import Optional, Dict


class BookingIn(BaseModel):
    customer_name: str
    contact: Optional[str] = None
    notes: Optional[str] = None
    start_time: Optional[str] = None  # ISO format
    end_time: Optional[str] = None
    party_size: int = 1


class BookingOut(BookingIn):
    id: int
    status: Optional[str] = None
    provisional_expires_at: Optional[str] = None


class NLUIn(BaseModel):
    text: str


class NLUOut(BaseModel):
    intent: str
    entities: Dict[str, str]


class EmployeeOut(BaseModel):
    id: int
    name: str
    standby: bool


class CallLogOut(BaseModel):
    id: int
    source: str
    text: Optional[str]
    timestamp: Optional[str]
    type: str
