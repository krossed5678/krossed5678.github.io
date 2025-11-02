import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'server-db.json');

export type Booking = {
  id: number;
  created_at: string;
  source?: string;
  text: string;
  phone?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
};

export type User = { id: number; email: string; password_hash: string; is_verified?: number; created_at?: string };

export type DB = { users?: User[]; bookings?: Booking[] };

export function loadDB(): DB {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw) as DB;
    return { users: data.users || [], bookings: data.bookings || [] };
  } catch (e:any) {
    return { users: [], bookings: [] };
  }
}

export function saveDB(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function getBookings(): Booking[] {
  return loadDB().bookings || [];
}

export function addBooking(partial: Omit<Booking, 'id' | 'created_at'>): Booking {
  const db = loadDB();
  const bookings = db.bookings || [];
  const id = bookings.length ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
  const booking: Booking = { id, created_at: new Date().toISOString(), ...partial };
  bookings.push(booking);
  db.bookings = bookings;
  saveDB(db);
  return booking;
}

export function updateBooking(id: number, patch: Partial<Booking>) {
  const db = loadDB();
  const bookings = db.bookings || [];
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...patch };
  db.bookings = bookings;
  saveDB(db);
  return bookings[idx];
}
