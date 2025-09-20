from typing import List
from .models import Booking, Employee, Shift, CallLog
from backend.db.database import get_session
import datetime


def overlaps(start_a: datetime.datetime, end_a: datetime.datetime, start_b: datetime.datetime, end_b: datetime.datetime) -> bool:
    return max(start_a, start_b) < min(end_a, end_b)


def create_booking(*, customer_name: str, contact: str = None, notes: str = None) -> Booking:
    # note: this earlier version didn't have times; keep a default 1-hour slot now
    now = datetime.datetime.utcnow()
    start = now
    end = now + datetime.timedelta(hours=1)
    booking = Booking(customer_name=customer_name, contact=contact, notes=notes, start_time=start, end_time=end)
    # check overlaps
    with get_session() as session:
        existing = session.query(Booking).all()
        for ex in existing:
            if overlaps(ex.start_time, ex.end_time, booking.start_time, booking.end_time):
                raise ValueError("Requested time overlaps an existing booking")
        session.add(booking)
        session.commit()
        session.refresh(booking)
    return booking


def create_booking_with_times(*, customer_name: str, start_time: datetime.datetime, end_time: datetime.datetime, party_size: int = 1, contact: str = None, notes: str = None) -> Booking:
    """
    Create a provisional booking that expires after 1 minute unless superseded by a larger party.
    The first booking gets provisional status; a larger party within the provisional window can supersede.
    """
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(minutes=1)
    booking = Booking(customer_name=customer_name, contact=contact, notes=notes, start_time=start_time, end_time=end_time, party_size=party_size, status="provisional", provisional_expires_at=expires, created_at=now)
    with get_session() as session:
        # find overlapping provisionals or confirmed bookings
        existing = session.query(Booking).all()
        # Check for confirmed bookings that overlap — if any, we cannot create
        for ex in existing:
            if ex.status == "confirmed" and overlaps(ex.start_time, ex.end_time, booking.start_time, booking.end_time):
                raise ValueError("Requested time overlaps a confirmed booking")

        # For provisionals overlapping the same slot: allow superseding within expiry window
        overlapped_provisionals = [ex for ex in existing if ex.status == "provisional" and overlaps(ex.start_time, ex.end_time, booking.start_time, booking.end_time)]

        # If there is an overlapping provisional with equal or larger party, then reject
        for p in overlapped_provisionals:
            if p.party_size >= booking.party_size and p.provisional_expires_at and p.provisional_expires_at > now:
                # an active equal/greater provisional holds this slot currently
                raise ValueError("Requested time is provisionally held by another party")

        # Supersede any smaller active provisionals
        for p in overlapped_provisionals:
            if p.party_size < booking.party_size and p.provisional_expires_at and p.provisional_expires_at > now:
                # cancel smaller provisional
                session.delete(p)

        session.add(booking)
        session.commit()
        session.refresh(booking)
    return booking


def finalize_provisionals():
    """Confirm provisionals whose provisional_expires_at <= now and are not superseded.
    Should be called periodically (simulator or a background task).
    """
    now = datetime.datetime.utcnow()
    with get_session() as session:
        bookings = session.query(Booking).all()
        for b in bookings:
            if b.status == "provisional" and b.provisional_expires_at and b.provisional_expires_at <= now:
                # ensure there is no confirmed booking overlapping (shouldn't be, but check)
                conflict = False
                for other in bookings:
                    if other.id != b.id and other.status == "confirmed" and overlaps(other.start_time, other.end_time, b.start_time, b.end_time):
                        conflict = True
                        break
                if not conflict:
                    # confirm it
                    b.status = "confirmed"
                    session.add(b)
                    # send notification if contact looks like an email
                    try:
                        from backend.app.notifications import send_email
                        if b.contact and "@" in b.contact:
                            send_email(b.contact, f"Booking confirmed #{b.id}", f"Your booking for {b.start_time} is confirmed.")
                    except Exception:
                        pass
        session.commit()


def list_bookings() -> List[Booking]:
    with get_session() as session:
        results = session.query(Booking).order_by(Booking.id).all()
    return results


def ensure_staffing(min_staff: int = 1, window_start: datetime.datetime = None, window_end: datetime.datetime = None):
    """Return True if at least `min_staff` employees are scheduled for the given window."""
    with get_session() as session:
        shifts = session.query(Shift).all()
        # default window is now to now+1h
        if window_start is None:
            window_start = datetime.datetime.utcnow()
        if window_end is None:
            window_end = window_start + datetime.timedelta(hours=1)
        count = 0
        for s in shifts:
            if overlaps(s.start_time, s.end_time, window_start, window_end):
                count += 1
        return count >= min_staff


def create_employee(name: str) -> Employee:
    emp = Employee(name=name)
    with get_session() as session:
        session.add(emp)
        session.commit()
        session.refresh(emp)
    return emp


def create_shift(employee_id: int, start_time: datetime.datetime, end_time: datetime.datetime) -> Shift:
    shift = Shift(employee_id=employee_id, start_time=start_time, end_time=end_time)
    with get_session() as session:
        session.add(shift)
        session.commit()
        session.refresh(shift)
    return shift


def set_employee_standby(employee_id: int, standby: bool) -> Employee:
    with get_session() as session:
        emp = session.get(Employee, employee_id)
        if not emp:
            raise ValueError("employee not found")
        emp.standby = standby
        session.add(emp)
        session.commit()
        session.refresh(emp)
    return emp


def list_employees() -> List[Employee]:
    with get_session() as session:
        return session.query(Employee).all()


def create_log(source: str, text: str = None, typ: str = "voice") -> CallLog:
    log = CallLog(source=source, text=text, type=typ)
    with get_session() as session:
        session.add(log)
        session.commit()
        session.refresh(log)
    return log


def list_logs(limit: int = 200) -> List[CallLog]:
    with get_session() as session:
        results = session.query(CallLog).order_by(CallLog.timestamp.desc()).all()
        return results[:limit]
