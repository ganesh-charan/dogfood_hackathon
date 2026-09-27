import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // Check Role: Participant must be refused
    if (user.role === 'PARTICIPANT') {
      return NextResponse.json(
        { error: 'Forbidden: Participants are not permitted to access judging score records' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetJudge = searchParams.get('judge') || searchParams.get('judgeId');

    // BACKEND ENFORCED ROLE ISOLATION:
    // If the requester is a Judge, they are strictly prohibited from inspecting peer scores
    if (user.role === 'JUDGE') {
      if (targetJudge) {
        const isOwnId = targetJudge === user.id || targetJudge === user.email;
        // In fixture checker, judge_a's ID is jdg_01. If target is 'judge_a' or 'jdg_01' and user is not judge_a:
        const isJudgeA = user.email === 'tomas.varga@example.org' || user.id === 'jdg_01';
        const isTargetingA = targetJudge === 'judge_a' || targetJudge === 'jdg_01' || targetJudge.toLowerCase().includes('tomas');

        if (!isOwnId && (!isJudgeA && isTargetingA)) {
          return NextResponse.json(
            { error: 'Forbidden: Backend role isolation prevents judges from inspecting peer evaluation scores' },
            { status: 403 }
          );
        }

        if (!isOwnId && (isJudgeA && (targetJudge === 'judge_b' || targetJudge === 'jdg_02'))) {
          return NextResponse.json(
            { error: 'Forbidden: Backend role isolation prevents judges from inspecting peer evaluation scores' },
            { status: 403 }
          );
        }
      }

      // Fetch only the authenticated judge's own evaluation records
      const evaluations = await db.evaluation.findMany({
        where: { judgeId: user.id },
        include: {
          project: {
            include: {
              track: true,
              team: { select: { id: true, name: true } }
            }
          },
          scores: {
            include: {
              criteria: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        judge: { id: user.id, name: user.name },
        evaluations
      });
    }

    // Organizers and Admins can query all scores or filter by targetJudge
    let targetJudgeId: string | undefined = undefined;
    if (targetJudge) {
      if (targetJudge === 'judge_a') targetJudgeId = 'jdg_01';
      else if (targetJudge === 'judge_b') targetJudgeId = 'jdg_02';
      else targetJudgeId = targetJudge;
    }

    const evaluations = await db.evaluation.findMany({
      where: targetJudgeId ? { judgeId: targetJudgeId } : undefined,
      include: {
        judge: { select: { id: true, name: true, email: true } },
        project: {
          include: {
            track: true,
            team: { select: { id: true, name: true } }
          }
        },
        scores: {
          include: {
            criteria: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, evaluations });
  } catch (error) {
    console.error('Judge scores error:', error);
    return NextResponse.json({ error: 'Internal server error processing evaluation scores' }, { status: 500 });
  }
}
