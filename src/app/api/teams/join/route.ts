import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { joinCode } = await req.json();

    if (!joinCode || typeof joinCode !== 'string' || joinCode.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a valid 6-character team invite code' }, { status: 400 });
    }

    const cleanCode = joinCode.trim().toUpperCase();

    // Find the target team
    const team = await db.team.findUnique({
      where: { joinCode: cleanCode },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        hackathon: {
          select: { id: true, name: true, startDate: true, endDate: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team invite code not found' }, { status: 404 });
    }

    // Check if user is already in this team
    const alreadyInTeam = team.members.some((m) => m.userId === user.id);
    if (alreadyInTeam) {
      return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 });
    }

    // Enforce invariant: Participant can belong to at most one team per hackathon
    const existingMembership = await db.teamMember.findFirst({
      where: {
        userId: user.id,
        team: { hackathonId: team.hackathonId }
      },
      include: {
        team: true
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: `You are already part of team "${existingMembership.team.name}" in this hackathon. A participant can only join one team per event.` },
        { status: 400 }
      );
    }

    // Enforce invariant: Team size limit between 1 and 5 members
    if (team.members.length >= 5) {
      return NextResponse.json(
        { error: 'Team roster is full. Maximum allowable team size is 5 members.' },
        { status: 400 }
      );
    }

    // Add user to team
    const updatedTeam = await db.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'JOIN_TEAM',
          userId: user.id,
          details: `User ${user.name} joined team "${team.name}" using invite code ${cleanCode}.`
        }
      });

      return tx.team.findUnique({
        where: { id: team.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          },
          hackathon: { select: { id: true, name: true } }
        }
      });
    });

    return NextResponse.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Join team error:', error);
    return NextResponse.json({ error: 'Internal server error joining team' }, { status: 500 });
  }
}
