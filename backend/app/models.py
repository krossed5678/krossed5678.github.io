from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.database import Base
import datetime


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    party_size = Column(Integer, default=1)
    status = Column(String, default="provisional")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    provisional_expires_at = Column(DateTime, nullable=True)


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    standby = Column(Boolean, default=False)


class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    employee = relationship("Employee")


class CallLog(Base):
    __tablename__ = "call_logs"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    text = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String, default="voice")
