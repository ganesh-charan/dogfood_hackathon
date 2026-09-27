import { NextResponse } from 'next/server';
import { getUserSession } from '@/backend/security/auth';
import { runZScoreNormalization } from '@/backend/services/normalizationService';

export async function POST() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Organizers or Admins only' }, { status: 403 });
    }

    const result = await runZScoreNormalization();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Normalization error:', error);
    return NextResponse.json({ error: error.message || 'Normalization failed' }, { status: 400 });
  }
}
