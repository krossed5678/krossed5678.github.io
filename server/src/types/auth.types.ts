export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_verified: number | undefined;
  created_at: string;
  reset_token?: string;
  reset_token_expires?: string;
  failed_login_attempts?: number;
  lockout_until?: string;
  last_login?: string;
  verification_token?: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash' | 'reset_token' | 'verification_token'>;
}

export interface AuthError {
  error: string;
  code?: string;
  remaining_attempts?: number;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const AUTH_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_EXPIRY: '7d',
  VERIFICATION_TOKEN_EXPIRY: '24h',
  RESET_TOKEN_EXPIRY: '1h',
  MIN_PASSWORD_LENGTH: 8,
} as const;