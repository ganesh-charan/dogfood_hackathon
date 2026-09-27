import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user is a member of this team
    const membership = await db.teamMember.findFirst({
      where: {
        userId: user.id,
        teamId
      },
      include: {
        team: {
          include: {
            members: {
              orderBy: { joinedAt: 'asc' }
            },
            projects: true,
            hackathon: true
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 404 });
    }

    const team = membership.team;

    // Check if hackathon deadline has passed
    const now = new Date();
    if (team.hackathon && now > new Date(team.hackathon.endDate)) {
      return NextResponse.json(
        { error: 'Cannot leave team after the hackathon has closed' },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      if (team.members.length === 1) {
        // User is the sole member: delete team and any associated draft/project data
        for (const proj of team.projects) {
          await tx.evaluationScore.deleteMany({
            where: { evaluation: { projectId: proj.id } }
          });
          await tx.evaluation.deleteMany({
            where: { projectId: proj.id }
          });
          await tx.vote.deleteMany({
            where: { projectId: proj.id }
          });
          await tx.project.delete({
            where: { id: proj.id }
          });
        }

        await tx.teamMember.delete({
          where: { id: membership.id }
        });

        await tx.team.delete({
          where: { id: team.id }
        });

        await tx.auditLog.create({
          data: {
            action: 'DISBAND_TEAM',
            userId: user.id,
            details: `User ${user.name} disbanded team "${team.name}" for hackathon "${team.hackathon.name}".`
          }
        });
      } else {
        // More than one member: remove this user from roster.
        // If this user was captain (first member), the next member in joinedAt order automatically becomes captain.
        await tx.teamMember.delete({
          where: { id: membership.id }
        });

        await tx.auditLog.create({
          data: {
            action: 'LEAVE_TEAM',
            userId: user.id,
            details: `User ${user.name} left team "${team.name}" for hackathon "${team.hackathon.name}".`
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: team.members.length === 1
        ? `Team "${team.name}" was disbanded. You are now idle for ${team.hackathon.name}.`
        : `Successfully left team "${team.name}". You are now idle for ${team.hackathon.name}.`
    });
  } catch (error) {
    console.error('Leave team error:', error);
    return NextResponse.json({ error: 'Internal server error while leaving team' }, { status: 500 });
  }
}
