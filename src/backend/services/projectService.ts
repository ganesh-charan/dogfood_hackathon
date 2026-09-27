import { db } from '../db';
import { UserSession } from '../security/auth';
import { RoleIsolationError } from './evaluationService';

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getPublicProjects(options: {
  search?: string | null;
  trackId?: string | null;
  hackathonId?: string | null;
  shuffle?: boolean;
}) {
  const { search, trackId, hackathonId, shuffle = true } = options;

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

  return shuffle ? fisherYatesShuffle(projects) : projects;
}

export async function validateAndSubmitProject(
  user: UserSession,
  data: {
    teamId?: string;
    name?: string;
    title?: string;
    description?: string;
    summary?: string;
    repoUrl?: string;
    demoUrl?: string;
    trackId?: string;
    status?: string;
  }
) {
  const teamId = data.teamId;
  const name = data.name || data.title;
  const description = data.description || data.summary;

  let membership = null;
  if (teamId) {
    membership = await db.teamMember.findFirst({
      where: { userId: user.id, teamId },
      include: { team: { include: { hackathon: true } } }
    });
  } else {
    membership = await db.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: { include: { hackathon: true } } }
    });
  }

  if (!membership) {
    throw new RoleIsolationError('Team ID is required or user is not a member of an active team', 400);
  }

  const hackathon = membership.team.hackathon;
  const now = new Date();

  // HARD DEADLINE ENFORCEMENT
  if (now > hackathon.endDate) {
    throw new RoleIsolationError('Submission deadline has passed. Submissions are permanently locked against edits.', 403);
  }

  return { membership, name, description };
}
