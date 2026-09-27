import { db } from '../db';

export interface NormalizationResult {
  message: string;
  totalEvaluationsNormalized: number;
  judgeStats: Record<string, { mean: number; stdDev: number; reviewCount: number }>;
}

export async function runZScoreNormalization(): Promise<NormalizationResult> {
  const completedEvaluations = await db.evaluation.findMany({
    where: { completed: true },
    include: {
      judge: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    }
  });

  if (completedEvaluations.length === 0) {
    throw new Error('No completed evaluations found to normalize');
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
  const judgeStats: Record<string, { mean: number; stdDev: number; reviewCount: number }> = {};
  for (const [judgeId, scores] of Object.entries(judgeScoresMap)) {
    const n = scores.length;
    const mean = scores.reduce((sum, s) => sum + s, 0) / n;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    judgeStats[judgeId] = {
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(Math.max(stdDev, 0.5) * 100) / 100, // Damped variance floor
      reviewCount: n
    };
  }

  // Normalize each evaluation using Z-score standardized to 0-100 scale: 50 + 15 * Z
  let updatedCount = 0;
  await db.$transaction(async (tx) => {
    for (const ev of completedEvaluations) {
      const stats = judgeStats[ev.judgeId];
      if (stats) {
        const zScore = (ev.totalScore - stats.mean) / stats.stdDev;
        const normalized = Math.min(100, Math.max(0, 50 + 15 * zScore));

        await tx.evaluation.update({
          where: { id: ev.id },
          data: {
            normalizedScore: Math.round(normalized * 100) / 100
          }
        });
        updatedCount++;
      }
    }
  });

  return {
    message: 'Z-Score Normalization completed successfully',
    totalEvaluationsNormalized: updatedCount,
    judgeStats
  };
}
