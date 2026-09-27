import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await db.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } }
              }
            },
            projects: {
              include: {
                track: true
              }
            },
            hackathon: {
              include: {
                tracks: true,
                prizes: true
              }
            }
          }
        }
      }
    });

    const teams = memberships.map((m) => m.team);

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error('Fetch my-team error:', error);
    return NextResponse.json({ error: 'Failed to fetch user teams' }, { status: 500 });
  }
}
