import { Router, Request, Response } from 'express';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const router = Router();
import { loadDB, saveDB, User as StorageUser } from './storage';

type User = StorageUser;

function loadUsers(): User[] {
  const db = loadDB();
  return db.users || [];
}

function saveUsers(users: User[]) {
  const db = loadDB();
  db.users = users;
  saveDB(db);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EMAIL_FROM = process.env.GMAIL_USER || 'no-reply@example.com';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
router.use(limiter);

const csrfProtection = csurf({ cookie: false });

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const pwHash = await bcrypt.hash(password, 12);
  try {
    // ensure unique
  const users = loadUsers();
  const exists = users.find((u: User) => u.email === email.toLowerCase());
    if (exists) return res.status(409).json({ error: 'Email already exists' });
  const id = (users.length ? Math.max(...users.map((u: User) => u.id)) : 0) + 1;
  const user: User = { id, email: email.toLowerCase(), password_hash: pwHash, is_verified: 0, created_at: new Date().toISOString() };
  users.push(user); saveUsers(users);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    try { await sendEmail(email, 'Verify your account', `Use this token to verify: ${token}`); } catch (e) { console.warn('email send failed', e); }
    res.json({ ok: true });
  } catch (err:any) { console.error(err); res.status(500).json({ error: 'Registration failed' }); }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?:string; password?:string };
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const users = loadUsers();
  const row = users.find((u: User) => u.email === email.toLowerCase());
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, email: row.email, verified: !!row.is_verified });
});

router.post('/verify', async (req: Request, res: Response) => {
  const { token } = req.body as { token?:string }; if (!token) return res.status(400).json({ error: 'Missing token' });
  try { const payload:any = jwt.verify(token, JWT_SECRET); const users = loadUsers(); const u = users.find((x: User) => x.id === payload.id); if (u) { u.is_verified = 1; saveUsers(users); } res.json({ ok: true }); } catch (err:any) { res.status(400).json({ error: 'Invalid token' }); }
});

async function sendEmail(to:string, subject:string, text:string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD }
  });
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, text });
}

export default router;
