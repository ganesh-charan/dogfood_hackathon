import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/v1/stats
export async function GET() {
  try {
    const [hackathonCount, projectCount, teamCount, trackCount, evalCount, voteCount] = await Promise.all([
      db.hackathon.count(),
      db.project.count({ where: { status: 'SUBMITTED' } }),
      db.team.count(),
      db.track.count(),
      db.evaluation.count({ where: { completed: true } }),
      db.vote.count()
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        activeHackathons: hackathonCount,
        verifiedSubmissions: projectCount,
        registeredTeams: teamCount,
        trackCategories: trackCount,
        completedEvaluations: evalCount,
        communityVotesCast: voteCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API v1 stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
