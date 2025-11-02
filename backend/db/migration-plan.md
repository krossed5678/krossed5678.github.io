"""
Database Migration Plan

1. Initial SQLite Migration
- Create SQLite database schema
- Add users table with:
  - email verification status
  - password reset token/expiry
  - account lockout counter/timestamp
- Add bookings table with foreign key to users
- Add sessions table for auth token management

2. Data Migration Process
- Create backup of current JSON data
- Write migration script to:
  a) Create SQLite tables
  b) Import existing JSON data
  c) Add new required fields with defaults
  
3. Auth Improvements
- Implement email verification flow
- Add password reset functionality
- Add account lockout after failed attempts
- Add session management and token rotation

4. Future Postgres Migration (if needed)
- Schema is Postgres-compatible
- Use SQLAlchemy for database abstraction
- Migration path from SQLite to Postgres
"""