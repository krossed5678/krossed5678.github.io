import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { loadDB, saveDB } from './storage';
import { User, JWTPayload, AUTH_CONSTANTS, EmailOptions } from './types/auth.types';

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EMAIL_FROM = process.env.GMAIL_USER || 'no-reply@example.com';

// Rate limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 
});
router.use(limiter);

// CSRF Protection
const csrfProtection = csurf({ cookie: false });

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Email sending failed');
  }
}

// Database helpers
function loadUsers(): User[] {
  const db = loadDB();
  return db.users || [];
}

function saveUsers(users: User[]): void {
  const db = loadDB();
  db.users = users;
  saveDB(db);
}

function findUserByEmail(email: string): User | undefined {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id: number): User | undefined {
  return loadUsers().find(u => u.id === id);
}

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    
    req.user = decoded as JWTPayload;
    next();
  });
}

// Registration endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    if (password.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        error: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long` 
      });
    }
    
    const users = loadUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();
    
    const newUser: User = {
      id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      is_verified: 0,
      created_at: new Date().toISOString(),
      verification_token: verificationToken,
      failed_login_attempts: 0
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your account',
      text: `Please verify your account by clicking: ${verificationLink}`,
      html: `
        <h1>Welcome!</h1>
        <p>Please verify your account by clicking the link below:</p>
        <a href="${verificationLink}">Verify Account</a>
      `
    });
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check account lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingTime = Math.ceil(
        (new Date(user.lockout_until).getTime() - new Date().getTime()) / 1000 / 60
      );
      return res.status(423).json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes` 
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Increment failed attempts
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      
      if (user.failed_login_attempts >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
        user.lockout_until = new Date(
          Date.now() + AUTH_CONSTANTS.LOCKOUT_DURATION
        ).toISOString();
        saveUsers(users);
        return res.status(423).json({ 
          error: 'Account locked due to too many failed attempts. Try again in 15 minutes' 
        });
      }
      
      saveUsers(users);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        remaining_attempts: AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS - user.failed_login_attempts 
      });
    }
    
    // Check verification
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in' 
      });
    }
    
    // Reset failed attempts on successful login
    user.failed_login_attempts = 0;
    user.last_login = new Date().toISOString();
    saveUsers(users);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: AUTH_CONSTANTS.TOKEN_EXPIRY }
    );
    
    // Remove sensitive data
    const userResponse = { ...user } as Partial<User>;
    delete userResponse.password_hash;
    delete userResponse.reset_token;
    delete userResponse.verification_token;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Email verification endpoint
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token?: string };
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.verification_token === token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    user.is_verified = 1;
    delete user.verification_token;
    saveUsers(users);
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Password reset request endpoint
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }
    
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000 // 1 hour
    ).toISOString();
    
    user.reset_token = resetToken;
    user.reset_token_expires = resetTokenExpires;
    saveUsers(users);
    
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
    
    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Password reset endpoint
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }
    
    if (newPassword.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        error: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long` 
      });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.reset_token === token);
    
    if (!user || !user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    user.password_hash = await bcrypt.hash(newPassword, 12);
    delete user.reset_token;
    delete user.reset_token_expires;
    saveUsers(users);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Change password endpoint (authenticated)
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as { 
      currentPassword?: string; 
      newPassword?: string 
    };
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ 
        error: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long` 
      });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === req.user?.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    user.password_hash = await bcrypt.hash(newPassword, 12);
    saveUsers(users);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Logout endpoint (optional - can be handled client-side)
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // In a more complex system, you might want to invalidate the token here
  res.json({ message: 'Logged out successfully' });
});

export default router;
