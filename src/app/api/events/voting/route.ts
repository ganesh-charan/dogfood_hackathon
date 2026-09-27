import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

// GET /api/events/voting?hackathonId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    const hackathon = hackathonId
      ? await db.hackathon.findUnique({ where: { id: hackathonId } })
      : await db.hackathon.findFirst();

    if (!hackathon) {
      return NextResponse.json({ success: false, error: 'Hackathon not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hackathonId: hackathon.id,
      name: hackathon.name,
      votingOpen: hackathon.votingOpen
    });
  } catch (error) {
    console.error('Error getting voting status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events/voting
// Toggle community voting open / closed (Organizers/Admins only)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only event organizers can toggle community voting' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hackathonId, votingOpen } = body;

    let targetHackathon;
    if (hackathonId) {
      targetHackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    } else {
      targetHackathon = await db.hackathon.findFirst();
    }

    if (!targetHackathon) {
      return NextResponse.json({ success: false, error: 'Hackathon not found' }, { status: 404 });
    }

    const updated = await db.hackathon.update({
      where: { id: targetHackathon.id },
      data: {
        votingOpen: typeof votingOpen === 'boolean' ? votingOpen : !targetHackathon.votingOpen
      }
    });

    await db.auditLog.create({
      data: {
        action: 'VOTING_STATUS_CHANGED',
        userId: user.id,
        details: `Organizer ${user.name} set community voting to ${updated.votingOpen ? 'OPEN' : 'CLOSED'} for event ${updated.name}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Community voting is now ${updated.votingOpen ? 'OPEN' : 'CLOSED'}`,
      votingOpen: updated.votingOpen
    });
  } catch (error) {
    console.error('Error toggling voting state:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
