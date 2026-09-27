import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const events = await db.hackathon.findMany({
      include: {
        tracks: true,
        prizes: true,
        _count: {
          select: {
            teams: true,
            rubrics: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Organizers or Admins only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, startDate, endDate, tracks, prizes } = body;

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Event name must be at least 3 characters long' }, { status: 400 });
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters long' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Must be ISO 8601 compliant' }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({ error: 'Event start date must precede end date' }, { status: 400 });
    }

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'At least one competition track is required' }, { status: 400 });
    }

    for (const track of tracks) {
      if (!track.name || track.name.trim().length === 0) {
        return NextResponse.json({ error: 'All tracks must have a valid name' }, { status: 400 });
      }
    }

    // Create hackathon with tracks and prizes
    const hackathon = await db.$transaction(async (tx) => {
      const created = await tx.hackathon.create({
        data: {
          name: name.trim(),
          description: description.trim(),
          startDate: start,
          endDate: end,
          tracks: {
            create: tracks.map((t: { name: string; description?: string }) => ({
              name: t.name.trim(),
              description: t.description?.trim() || ''
            }))
          },
          prizes: prizes && Array.isArray(prizes) && prizes.length > 0 ? {
            create: prizes.map((p: { name: string; description?: string }) => ({
              name: p.name.trim(),
              description: p.description?.trim() || ''
            }))
          } : undefined
        },
        include: {
          tracks: true,
          prizes: true
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_HACKATHON',
          userId: user.id,
          details: `Organizer ${user.name} created hackathon "${created.name}" (ID: ${created.id}) with ${created.tracks.length} tracks.`
        }
      });

      return created;
    });

    return NextResponse.json({ success: true, hackathon }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error while creating event' }, { status: 500 });
  }
}
