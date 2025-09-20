import time
import threading
import datetime
from . import crud
import random

running = False


def run_forever(interval_sec: int = 10):
    """Simple simulator: every interval, try to create a booking 1-2 hours from now for 1 hour.
    Also ensure there is at least 1 staff scheduled for the same window by creating an employee/shift if needed.
    """
    global running
    running = True
    try:
        while running:
            try:
                now = datetime.datetime.utcnow()
                start = now + datetime.timedelta(hours=1)
                end = start + datetime.timedelta(hours=1)
                name = f"SimUser-{int(time.time())%10000}"
                # attempt booking; create provisional booking
                try:
                    crud.create_booking_with_times(customer_name=name, start_time=start, end_time=end, party_size=2, notes="simulated")
                except Exception:
                    pass

                # create a sample voice log
                try:
                    crud.create_log(source=name, text=f"Booking request for {start.isoformat()}", typ="voice")
                except Exception:
                    pass

                # ensure staffing
                if not crud.ensure_staffing(min_staff=1, window_start=start, window_end=end):
                    emp = crud.create_employee(name=f"SimEmp-{int(time.time())%1000}")
                    crud.create_shift(employee_id=emp.id, start_time=start, end_time=end)
                # finalize any expired provisionals
                try:
                    crud.finalize_provisionals()
                except Exception:
                    pass

                # randomly toggle standby for demo
                try:
                    emps = crud.list_employees()
                    if emps:
                        e = random.choice(emps)
                        crud.set_employee_standby(e.id, random.choice([True, False]))
                except Exception:
                    pass
            except Exception:
                # swallow simulator errors to keep running
                pass
            time.sleep(interval_sec)
    finally:
        running = False


def stop():
    global running
    running = False
