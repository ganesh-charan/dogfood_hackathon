import { NextResponse } from 'next/server';
import { getUserSession } from '@/backend/security/auth';
import { getJudgeScores, RoleIsolationError } from '@/backend/services/evaluationService';

export async function GET(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetJudge = searchParams.get('judge') || searchParams.get('judgeId');

    const result = await getJudgeScores(user, targetJudge);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof RoleIsolationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Judge scores error:', error);
    return NextResponse.json({ error: 'Internal server error processing evaluation scores' }, { status: 500 });
  }
}
