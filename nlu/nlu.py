import dateparser
import re
from typing import Optional, Dict
import datetime


def parse_booking(text: str, now: Optional[datetime.datetime] = None) -> Dict:
    """Parse a free-text booking request into structured fields.
    Returns dict with keys: intent, customer_name (optional), party_size (int), start_time (datetime), end_time (datetime), raw_time_text
    """
    if now is None:
        now = datetime.datetime.utcnow()

    text_l = text.lower()
    intent = "unknown"
    if any(k in text_l for k in ("book", "reserve", "reservation", "table", "appointment")):
        intent = "book_reservation"

    # find party size like 'for 4', 'party of 4'
    party_size = 1
    m = re.search(r"(?:party of|for|party)\s+(\d{1,3})", text_l)
    if m:
        try:
            party_size = int(m.group(1))
        except Exception:
            party_size = 1

    # find a time expression (try to extract portion after 'at' or common phrases)
    # Use dateparser to parse natural language times
    dt = None
    raw_time_text = None
    # attempt to find 'at <...>' or 'tomorrow', 'on <date>' etc.
    # first try to parse the entire text; dateparser will ignore unrelated words
    parsed = dateparser.parse(text, settings={'RELATIVE_BASE': now, 'PREFER_DATES_FROM': 'future'})
    if parsed:
        dt = parsed
        raw_time_text = text

    # default: if no time found, None
    start_time = dt
    end_time = None
    if start_time:
        # default duration 1 hour
        end_time = start_time + datetime.timedelta(hours=1)

    # naive name extraction: look for 'for NAME' where NAME is word
    customer_name = None
    mname = re.search(r"for ([A-Z][a-z]+)|for (\w+)", text)
    if mname:
        customer_name = mname.group(1) or mname.group(2)

    return {
        "intent": intent,
        "customer_name": customer_name,
        "party_size": party_size,
        "start_time": start_time,
        "end_time": end_time,
        "raw_time_text": raw_time_text,
    }
