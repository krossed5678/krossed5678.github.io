from fastapi import APIRouter, HTTPException
from typing import List
from . import crud
from . import schemas

router = APIRouter()


def booking_to_dict(b):
    return {
        "id": b.id,
        "customer_name": b.customer_name,
        "contact": b.contact,
        "notes": b.notes,
        "start_time": b.start_time.isoformat() if b.start_time else None,
        "end_time": b.end_time.isoformat() if b.end_time else None,
        "party_size": b.party_size,
        "status": b.status,
        "provisional_expires_at": b.provisional_expires_at.isoformat() if b.provisional_expires_at else None,
    }


@router.post("/bookings", response_model=schemas.BookingOut)
def create_booking_endpoint(payload: schemas.BookingIn):
    # if start_time provided, parse and use that
    if payload.start_time and payload.end_time:
        import dateutil.parser
        st = dateutil.parser.isoparse(payload.start_time)
        et = dateutil.parser.isoparse(payload.end_time)
        try:
            b = crud.create_booking_with_times(customer_name=payload.customer_name, start_time=st, end_time=et, party_size=payload.party_size, contact=payload.contact, notes=payload.notes)
            return booking_to_dict(b)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    try:
        b = crud.create_booking(customer_name=payload.customer_name, contact=payload.contact, notes=payload.notes)
        return booking_to_dict(b)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bookings/finalize")
def finalize_provisionals_endpoint():
    crud.finalize_provisionals()
    return {"status": "finalized"}


@router.get("/bookings/provisionals", response_model=List[schemas.BookingOut])
def list_provisionals():
    allb = crud.list_bookings()
    return [booking_to_dict(b) for b in allb if b.status == "provisional"]


@router.get("/bookings", response_model=List[schemas.BookingOut])
def list_bookings_endpoint():
    return [booking_to_dict(b) for b in crud.list_bookings()]


# Simple NLU endpoint (rule-based)
@router.post("/nlu", response_model=schemas.NLUOut)
def nlu_parse(payload: schemas.NLUIn):
    text = payload.text
    from nlu.nlu import parse_booking
    parsed = parse_booking(text)
    return {"intent": parsed.get("intent","unknown"), "entities": {k:v for k,v in parsed.items() if k!='intent'}}


@router.post("/simulate/start")
def start_simulation():
    # lightweight: spawn a background thread that runs a simulator loop
    import threading
    from backend.app import simulator

    if simulator.running:
        return {"status": "already running"}
    t = threading.Thread(target=simulator.run_forever, daemon=True)
    t.start()
    return {"status": "started"}


@router.post("/logs", response_model=schemas.CallLogOut)
def create_log(payload: schemas.NLUIn):
    # reuse NLUIn for simple text logs (text and source will be same)
    l = crud.create_log(source="frontend", text=payload.text, typ="text")
    return {
        "id": l.id,
        "source": l.source,
        "text": l.text,
        "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        "type": l.type,
    }


@router.get("/logs", response_model=List[schemas.CallLogOut])
def list_logs():
    logs = crud.list_logs()
    return [{
        "id": l.id,
        "source": l.source,
        "text": l.text,
        "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        "type": l.type,
    } for l in logs]


@router.get("/employees", response_model=List[schemas.EmployeeOut])
def list_employees():
    emps = crud.list_employees()
    return [{"id": e.id, "name": e.name, "standby": e.standby} for e in emps]


@router.post("/employees/{employee_id}/standby", response_model=schemas.EmployeeOut)
def set_standby(employee_id: int, body: dict):
    standby = bool(body.get("standby", False))
    try:
        emp = crud.set_employee_standby(employee_id=employee_id, standby=standby)
        return {"id": emp.id, "name": emp.name, "standby": emp.standby}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
