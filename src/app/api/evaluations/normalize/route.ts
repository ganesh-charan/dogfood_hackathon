import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Organizers or Admins only' }, { status: 403 });
    }

    // Fetch all completed evaluations grouped by judge
    const completedEvaluations = await db.evaluation.findMany({
      where: { completed: true },
      include: {
        judge: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });

    if (completedEvaluations.length === 0) {
      return NextResponse.json({ error: 'No completed evaluations found to normalize' }, { status: 400 });
    }

    // Group scores by judge
    const judgeScoresMap: Record<string, number[]> = {};
    for (const ev of completedEvaluations) {
      if (!judgeScoresMap[ev.judgeId]) {
        judgeScoresMap[ev.judgeId] = [];
      }
      judgeScoresMap[ev.judgeId].push(ev.totalScore);
    }

    // Compute mean and standard deviation per judge
    const judgeStats: Record<string, { mean: number; stdDev: number }> = {};
    for (const [judgeId, scores] of Object.entries(judgeScoresMap)) {
      const n = scores.length;
      const mean = scores.reduce((sum, s) => sum + s, 0) / n;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      judgeStats[judgeId] = {
        mean,
        stdDev: Math.max(stdDev, 0.5) // Damped floor to prevent division by zero
      };
    }

    // Normalize each evaluation using Z-score standardized to 0-100 scale: 50 + 15 * Z
    let updatedCount = 0;
    await db.$transaction(async (tx) => {
      for (const ev of completedEvaluations) {
        const stats = judgeStats[ev.judgeId];
        if (stats) {
          const zScore = (ev.totalScore - stats.mean) / stats.stdDev;
          // Scale to 0-100
          const normalized = Math.min(100, Math.max(0, 50 + 15 * zScore));

          await tx.evaluation.update({
            where: { id: ev.id },
            data: {
              normalizedScore: Number(normalized.toFixed(2))
            }
          });
          updatedCount++;
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'EXECUTE_SCORE_NORMALIZATION',
          userId: user.id,
          details: `Organizer ${user.name} ran Z-Score variance normalization across ${updatedCount} evaluations from ${Object.keys(judgeStats).length} judges.`
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Normalized ${updatedCount} evaluations using Z-Score statistical variance compensation.`,
      judgesCalibrated: Object.keys(judgeStats).length,
      evaluationsUpdated: updatedCount
    });
  } catch (error) {
    console.error('Normalization error:', error);
    return NextResponse.json({ error: 'Internal server error executing score normalization' }, { status: 500 });
  }
}
