import axios from 'axios';
import fs from 'fs';
import path from 'path';

type Booking = { id: number; text: string; phone?: string; created_at: string; status?: string };

const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

async function getGoogleAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const url = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  try {
    const resp = await axios.post(url, params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return resp.data.access_token;
  } catch (err:any) {
    console.warn('Google token fetch failed', err?.response?.data || err.message);
    return null;
  }
}

export async function createGoogleEvent(booking: Booking) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  if (!accessToken) throw new Error('Google credentials not configured');

  // Attempt to derive a simple start/end from booking.created_at
  const startDate = new Date(booking.created_at || Date.now());
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `Booking #${booking.id}`,
    description: booking.text + (booking.phone ? `\nPhone: ${booking.phone}` : ''),
    start: { dateTime: startDate.toISOString() },
    end: { dateTime: endDate.toISOString() }
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  try {
    const resp = await axios.post(url, event, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
    return { ok: true, event: resp.data };
  } catch (err:any) {
    console.warn('createGoogleEvent failed', err?.response?.data || err.message);
    throw err;
  }
}

export function createICS(booking: Booking) {
  const uid = `booking-${booking.id}@local`; 
  const dtstamp = new Date(booking.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = new Date(booking.created_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//restaurant-ai//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:Booking #${booking.id}`,
    `DESCRIPTION:${(booking.text || '').replace(/\n/g,'\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const filename = `booking-${booking.id}.ics`;
  const filepath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filepath, ics, 'utf8');
  // Return a path relative to project root that the static server can serve
  const publicPath = `/exports/${filename}`;
  return { ok: true, icsPath: publicPath, filepath };
}

export async function syncBookingToCalendar(booking: Booking) {
  // Prefer Google when configured
  try {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
      const res = await createGoogleEvent(booking);
      return { provider: 'google', result: res };
    }
  } catch (err:any) {
    console.warn('Google sync failed, falling back to ICS generation', err?.message || err);
  }
  const ics = createICS(booking);
  return { provider: 'ics', result: ics };
}

export default { syncBookingToCalendar, createICS, createGoogleEvent };
