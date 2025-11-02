import { DB, Booking, BookingStatus, loadDB, saveDB } from './storage';

export function createBooking(userId: number, bookingData: Partial<Booking>): Booking {
  const db = loadDB();
  const id = db.bookings.length ? Math.max(...db.bookings.map(b => b.id)) + 1 : 1;
  
  const booking: Booking = {
    id,
    userId,
    date: bookingData.date!,
    time: bookingData.time!,
    partySize: bookingData.partySize!,
    specialRequests: bookingData.specialRequests,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: bookingData.source,
    text: bookingData.text,
    phone: bookingData.phone
  };

  db.bookings.push(booking);
  saveDB(db);
  return booking;
}

export function updateBooking(id: number, data: Partial<Booking>): Booking | null {
  const db = loadDB();
  const booking = db.bookings.find(b => b.id === id);
  if (!booking) return null;

  Object.assign(booking, {
    ...data,
    updated_at: new Date().toISOString()
  });

  saveDB(db);
  return booking;
}

export function deleteBooking(id: number): boolean {
  const db = loadDB();
  const index = db.bookings.findIndex(b => b.id === id);
  if (index === -1) return false;

  db.bookings.splice(index, 1);
  saveDB(db);
  return true;
}

export function getUserBookings(userId: number): Booking[] {
  const db = loadDB();
  return db.bookings.filter(b => b.userId === userId);
}

export function getBookingById(id: number): Booking | null {
  const db = loadDB();
  return db.bookings.find(b => b.id === id) || null;
}

export function validateBooking(booking: Partial<Booking>): string | null {
  if (!booking.date) return 'Date is required';
  if (!booking.time) return 'Time is required';
  if (!booking.partySize || booking.partySize < 1) return 'Valid party size is required';
  if (!booking.userId) return 'User ID is required';
  return null;
}

export function updateBookingStatus(id: number, status: BookingStatus): Booking | null {
  return updateBooking(id, { status });
}

export function getBookingsByStatus(status: BookingStatus): Booking[] {
  const db = loadDB();
  return db.bookings.filter(b => b.status === status);
}

export function getUpcomingBookings(userId?: number): Booking[] {
  const db = loadDB();
  const now = new Date();
  return db.bookings.filter(b => {
    if (userId && b.userId !== userId) return false;
    const bookingDate = new Date(`${b.date}T${b.time}`);
    return bookingDate > now && b.status !== 'cancelled';
  });
}

export function getPastBookings(userId?: number): Booking[] {
  const db = loadDB();
  const now = new Date();
  return db.bookings.filter(b => {
    if (userId && b.userId !== userId) return false;
    const bookingDate = new Date(`${b.date}T${b.time}`);
    return bookingDate < now || b.status === 'completed';
  });
}

export function searchBookings(query: string): Booking[] {
  const db = loadDB();
  const lowerQuery = query.toLowerCase();
  return db.bookings.filter(b => 
    b.text?.toLowerCase().includes(lowerQuery) ||
    b.phone?.includes(query) ||
    b.specialRequests?.toLowerCase().includes(lowerQuery)
  );
}