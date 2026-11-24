import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifyAdminCredentials,
} from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(email);
    const response = NextResponse.json({
      authenticated: true,
      email: email.toLowerCase(),
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Requisição de login inválida.' },
      { status: 400 }
    );
  }
}
