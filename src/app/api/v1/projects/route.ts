import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/v1/projects?track=...&search=...&limit=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const whereClause: any = {
      status: 'SUBMITTED'
    };

    if (track) {
      whereClause.track = {
        name: {
          contains: track
        }
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const projects = await db.project.findMany({
      where: whereClause,
      take: limit,
      include: {
        track: { select: { id: true, name: true } },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: { select: { name: true } }
              }
            }
          }
        },
        _count: {
          select: { votes: true, evaluations: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      title: p.name,
      summary: p.description,
      repositoryUrl: p.repoUrl,
      demoUrl: p.demoUrl,
      track: p.track?.name || 'General',
      team: {
        id: p.team.id,
        name: p.team.name,
        members: p.team.members.map((m) => m.user.name)
      },
      metrics: {
        communityVotes: p._count.votes,
        evaluationsCount: p._count.evaluations
      }
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      limit,
      data: formatted
    });
  } catch (error) {
    console.error('API v1 projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
