import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const trackId = searchParams.get('trackId');
    const hackathonId = searchParams.get('hackathonId');
    const shouldShuffle = searchParams.get('shuffle') !== 'false';

    const whereClause: {
      status: string;
      trackId?: string;
      team?: { hackathonId?: string };
      OR?: Array<{ name: { contains: string } } | { description: { contains: string } }>;
    } = {
      status: 'SUBMITTED'
    };

    if (trackId && trackId !== 'all') {
      whereClause.trackId = trackId;
    }

    if (hackathonId && hackathonId !== 'all') {
      whereClause.team = { hackathonId };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { description: { contains: q } }
      ];
    }

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        track: true,
        team: {
          include: {
            hackathon: {
              select: { id: true, name: true, votingOpen: true }
            },
            members: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    const results = shouldShuffle ? fisherYatesShuffle(projects) : projects;

    return NextResponse.json({ success: true, projects: results });
  } catch (error) {
    console.error('Fetch public gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch public showcase projects' }, { status: 500 });
  }
}
