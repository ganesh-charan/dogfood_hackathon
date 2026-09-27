import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

export async function createSession(userId: string, role: string) {
  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  
  (await cookies()).set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function getUserSession() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    
    // Check if user still exists
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) return null;
    return user;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  (await cookies()).delete('auth_token');
}
