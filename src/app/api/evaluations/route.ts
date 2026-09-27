import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'JUDGE') {
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
            include: { criteria: true }
          }
        },
        orderBy: { completed: 'asc' }
      });

      // Also get rubric criteria for the hackathon
      const rubrics = await db.rubric.findMany({
        include: { criteria: true }
      });

      return NextResponse.json({
        success: true,
        evaluations,
        rubrics
      });
    }

    if (user.role === 'ORGANIZER' || user.role === 'ADMIN') {
      const evaluations = await db.evaluation.findMany({
        include: {
          judge: { select: { id: true, name: true, email: true } },
          project: {
            include: {
              track: true,
              team: { select: { id: true, name: true } }
            }
          },
          scores: {
            include: { criteria: true }
          }
        },
        orderBy: { completed: 'asc' }
      });

      return NextResponse.json({ success: true, evaluations });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('Fetch evaluations error:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'JUDGE' && user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only judges can submit evaluation scores' }, { status: 403 });
    }

    const body = await req.json();
    const { evaluationId, projectId, scores, comment } = body;

    // Target judge is the current user if judge
    const targetJudgeId = user.id;

    // Find the evaluation record
    let evaluation = null;
    if (evaluationId) {
      evaluation = await db.evaluation.findUnique({
        where: { id: evaluationId }
      });
    } else if (projectId) {
      evaluation = await db.evaluation.findUnique({
        where: {
          judgeId_projectId: {
            judgeId: targetJudgeId,
            projectId
          }
        }
      });
    }

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation record not found for this project and judge' }, { status: 404 });
    }

    // Role check: if judge, must be assigned to this evaluation
    if (user.role === 'JUDGE' && evaluation.judgeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You cannot evaluate projects outside your assigned queue' }, { status: 403 });
    }

    // Calculate total weighted score from criteria
    let totalScore = 0;
    if (scores && typeof scores === 'object') {
      for (const [criteriaId, scoreVal] of Object.entries(scores)) {
        const crit = await db.criteria.findUnique({ where: { id: criteriaId } });
        if (crit) {
          totalScore += Number(scoreVal) * crit.weight;
        }
      }
    }

    // Update evaluation and per-criteria scores in transaction
    const updated = await db.$transaction(async (tx) => {
      // Upsert evaluation score entries
      if (scores && typeof scores === 'object') {
        for (const [criteriaId, scoreVal] of Object.entries(scores)) {
          const existingScore = await tx.evaluationScore.findFirst({
            where: { evaluationId: evaluation.id, criteriaId }
          });

          if (existingScore) {
            await tx.evaluationScore.update({
              where: { id: existingScore.id },
              data: { score: Number(scoreVal) }
            });
          } else {
            await tx.evaluationScore.create({
              data: {
                evaluationId: evaluation.id,
                criteriaId,
                score: Number(scoreVal)
              }
            });
          }
        }
      }

      return tx.evaluation.update({
        where: { id: evaluation.id },
        data: {
          totalScore: Number(totalScore.toFixed(2)),
          comment: comment || null,
          completed: true
        },
        include: {
          project: true,
          scores: { include: { criteria: true } }
        }
      });
    });

    return NextResponse.json({ success: true, evaluation: updated });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error submitting evaluation' }, { status: 500 });
  }
}
