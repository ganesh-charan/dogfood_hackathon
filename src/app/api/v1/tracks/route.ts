import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/v1/tracks
export async function GET() {
  try {
    const tracks = await db.track.findMany({
      include: {
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      projectCount: t._count.projects
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('API v1 tracks error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
