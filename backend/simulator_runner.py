"""
Standalone simulator runner. Run this in a separate process for production/demo.
Usage:
    python backend/simulator_runner.py

This script will initialize the DB and run the simulator loop.
"""
from app import simulator
from db import database

if __name__ == "__main__":
    database.init_db()
    simulator.run_forever()
