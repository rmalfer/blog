import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'umfuturo_admin_session';

const DEFAULT_ADMIN_EMAIL = 'rmalfer@gmail.com';
// Hash scrypt com salt (nunca armazena a senha em texto puro no repositório)
const DEFAULT_ADMIN_PASSWORD_HASH =
  '0ba56b0bb03079a742f36f951eed68dd:e8fffdbbded2efb37905aea6a6a6f6b2d68d00a871e619d85ae10077b9834b319aa410895d204bbb9960ec1bd4ddcd3b141efa5717548705ec0858383f2dd97d';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function getPasswordHash(): string {
  return (process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH).trim();
}

function getSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16) {
    return process.env.ADMIN_SESSION_SECRET;
  }
  // Deriva uma chave determinística no servidor a partir do hash configurado
  return crypto
    .createHmac('sha256', getPasswordHash())
    .update('umfuturoproximo-admin-session-v1')
    .digest('hex');
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail !== getAdminEmail()) {
    return false;
  }

  // Suporte opcional a override direto por variável de ambiente ADMIN_PASSWORD (se configurada na Vercel)
  if (process.env.ADMIN_PASSWORD) {
    const a = Buffer.from(password || '', 'utf8');
    const b = Buffer.from(process.env.ADMIN_PASSWORD, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  const stored = getPasswordHash();
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;

  try {
    const derived = crypto.scryptSync(password || '', salt, 64);
    const expected = Buffer.from(keyHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      exp: Date.now() + SESSION_TTL_MS,
    }),
    'utf8'
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifySessionToken(token?: string | null): { email: string; exp: number } | null {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!decoded.email || !decoded.exp || Date.now() > decoded.exp) {
      return null;
    }
    if (decoded.email.toLowerCase() !== getAdminEmail()) {
      return null;
    }
    return { email: decoded.email, exp: decoded.exp };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string; exp: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
