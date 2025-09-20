from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

DB_FILE = Path(__file__).parent.parent.parent / "bookings.db"
DB_FILE.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_FILE}"

# allow multithread access
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def init_db():
    # import models so they are registered on Base
    import backend.app.models as models
    Base.metadata.create_all(bind=engine)

def get_session():
    return SessionLocal()
