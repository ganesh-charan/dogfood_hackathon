import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Organizers or Admins only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { hackathonId, judgesPerProject = 3 } = body;

    const targetHackathonId = hackathonId || 'evt_01';

    // Fetch all submitted projects
    const projects = await db.project.findMany({
      where: {
        status: 'SUBMITTED',
        team: { hackathonId: targetHackathonId }
      },
      include: {
        team: {
          include: {
            members: {
              include: { user: { select: { email: true } } }
            }
          }
        }
      }
    });

    if (projects.length === 0) {
      return NextResponse.json({ error: 'No submitted projects available to assign' }, { status: 400 });
    }

    // Fetch all judges
    const judges = await db.user.findMany({
      where: { role: 'JUDGE' }
    });

    if (judges.length < judgesPerProject) {
      return NextResponse.json(
        { error: `Insufficient judges in pool (${judges.length}) to satisfy ${judgesPerProject} reviews per project` },
        { status: 400 }
      );
    }

    let assignmentsCreated = 0;
    let judgeIndex = 0;

    await db.$transaction(async (tx) => {
      for (const proj of projects) {
        // Collect team member emails for COI check
        const memberEmails = new Set(proj.team.members.map((m) => m.user.email.toLowerCase()));

        let assignedToThisProject = 0;
        let attempts = 0;

        while (assignedToThisProject < judgesPerProject && attempts < judges.length * 2) {
          const candidateJudge = judges[judgeIndex % judges.length];
          judgeIndex++;
          attempts++;

          // Conflict of interest check: Judge cannot evaluate their own project
          if (memberEmails.has(candidateJudge.email.toLowerCase())) {
            continue;
          }

          // Check if already assigned
          const existing = await tx.evaluation.findUnique({
            where: {
              judgeId_projectId: {
                judgeId: candidateJudge.id,
                projectId: proj.id
              }
            }
          });

          if (!existing) {
            await tx.evaluation.create({
              data: {
                judgeId: candidateJudge.id,
                projectId: proj.id,
                totalScore: 0,
                completed: false
              }
            });
            assignmentsCreated++;
            assignedToThisProject++;
          } else {
            assignedToThisProject++;
          }
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'BATCH_ASSIGN_JUDGES',
          userId: user.id,
          details: `Organizer ${user.name} ran algorithmic assignment: ${assignmentsCreated} evaluations provisioned across ${projects.length} projects.`
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed round-robin assignment with conflict-of-interest isolation.`,
      projectsCount: projects.length,
      assignmentsCreated
    });
  } catch (error) {
    console.error('Judge assignment error:', error);
    return NextResponse.json({ error: 'Internal server error executing judge distribution' }, { status: 500 });
  }
}
