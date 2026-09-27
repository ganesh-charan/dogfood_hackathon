import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    // If organizer or judge or admin, allow viewing all projects
    if (user.role === 'ORGANIZER' || user.role === 'JUDGE' || user.role === 'ADMIN') {
      const projects = await db.project.findMany({
        where: hackathonId ? { team: { hackathonId } } : undefined,
        include: {
          team: {
            include: {
              hackathon: true,
              members: { include: { user: { select: { id: true, name: true, email: true } } } }
            }
          },
          track: true,
          _count: {
            select: { evaluations: true, votes: true }
          }
        },
        orderBy: { id: 'desc' }
      });
      return NextResponse.json({ success: true, projects });
    }

    // If participant, fetch only their team's projects
    const memberships = await db.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            projects: {
              include: {
                track: true
              }
            },
            hackathon: {
              include: {
                tracks: true
              }
            }
          }
        }
      }
    });

    const userProjects = memberships.flatMap((m) =>
      m.team.projects.map((p) => ({
        ...p,
        team: m.team,
        hackathon: m.team.hackathon
      }))
    );

    return NextResponse.json({ success: true, projects: userProjects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const teamId = body.teamId;
    const name = body.name || body.title;
    const description = body.description || body.summary;
    const { repoUrl, demoUrl, trackId, status } = body;

    // Verify user is a member of this team or fallback to user's first active team
    let membership = null;
    if (teamId) {
      membership = await db.teamMember.findFirst({
        where: {
          userId: user.id,
          teamId
        },
        include: {
          team: {
            include: {
              hackathon: true
            }
          }
        }
      });
    } else {
      membership = await db.teamMember.findFirst({
        where: { userId: user.id },
        include: {
          team: {
            include: {
              hackathon: true
            }
          }
        }
      });
    }

    if (!membership) {
      return NextResponse.json({ error: 'Team ID is required or user is not a member of an active team' }, { status: 400 });
    }

    const effectiveTeamId = membership.teamId;
    const hackathon = membership.team.hackathon;
    const now = new Date();

    // HARD DEADLINE ENFORCEMENT
    if (now > hackathon.endDate) {
      return NextResponse.json(
        { error: 'Submission deadline has passed. Submissions are permanently locked against edits.' },
        { status: 403 }
      );
    }

    const targetStatus = status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';

    if (targetStatus === 'SUBMITTED' && now < hackathon.startDate) {
      return NextResponse.json(
        { error: 'Submission window has not opened yet. You can only save drafts prior to competition start.' },
        { status: 400 }
      );
    }

    // Title validation
    if (!name || name.trim().length < 3 || name.trim().length > 80) {
      return NextResponse.json({ error: 'Project title must be between 3 and 80 characters' }, { status: 400 });
    }

    // Description validation
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters long' }, { status: 400 });
    }

    // Additional validations for final submission
    if (targetStatus === 'SUBMITTED') {
      if (!repoUrl || !isValidUrl(repoUrl.trim())) {
        return NextResponse.json({ error: 'A valid repository URL (http/https) is required for final submission' }, { status: 400 });
      }

      if (demoUrl && !isValidUrl(demoUrl.trim())) {
        return NextResponse.json({ error: 'Demo URL must be a valid URL (http/https)' }, { status: 400 });
      }

      if (!trackId) {
        return NextResponse.json({ error: 'You must select a competition track for final submission' }, { status: 400 });
      }

      // Verify track belongs to this hackathon
      const track = await db.track.findFirst({
        where: { id: trackId, hackathonId: hackathon.id }
      });
      if (!track) {
        return NextResponse.json({ error: 'Selected track is not valid for this hackathon' }, { status: 400 });
      }
    }

    // Check if team already has an existing project
    const existingProject = await db.project.findFirst({
      where: { teamId: effectiveTeamId }
    });

    const project = await db.$transaction(async (tx) => {
      let savedProject;
      if (existingProject) {
        savedProject = await tx.project.update({
          where: { id: existingProject.id },
          data: {
            name: name.trim(),
            description: description.trim(),
            repoUrl: repoUrl?.trim() || null,
            demoUrl: demoUrl?.trim() || null,
            trackId: trackId || null,
            status: targetStatus
          },
          include: { track: true, team: true }
        });
      } else {
        savedProject = await tx.project.create({
          data: {
            name: name.trim(),
            description: description.trim(),
            repoUrl: repoUrl?.trim() || null,
            demoUrl: demoUrl?.trim() || null,
            trackId: trackId || null,
            status: targetStatus,
            teamId: effectiveTeamId
          },
          include: { track: true, team: true }
        });
      }

      await tx.auditLog.create({
        data: {
          action: targetStatus === 'SUBMITTED' ? 'SUBMIT_PROJECT' : 'SAVE_DRAFT_PROJECT',
          userId: user.id,
          details: `User ${user.name} for team "${membership.team.name}" saved project "${savedProject.name}" as ${targetStatus}.`
        }
      });

      return savedProject;
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Project submission error:', error);
    return NextResponse.json({ error: 'Internal server error processing project submission' }, { status: 500 });
  }
}
