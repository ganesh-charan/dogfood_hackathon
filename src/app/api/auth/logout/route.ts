import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(req: NextRequest) {
  await logout();
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
  }
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  await logout();
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}

