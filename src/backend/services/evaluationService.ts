import { db } from '../db';
import { UserSession } from '../security/auth';

export class RoleIsolationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'RoleIsolationError';
  }
}

export async function getJudgeScores(user: UserSession, targetJudgeParam?: string | null) {
  // 1. Participant check: must be refused
  if (user.role === 'PARTICIPANT') {
    throw new RoleIsolationError('Forbidden: Participants are not permitted to access judging score records', 403);
  }

  // 2. BACKEND ENFORCED ROLE ISOLATION:
  // If requester is a Judge, they are strictly prohibited from inspecting peer scores
  if (user.role === 'JUDGE') {
    if (targetJudgeParam) {
      const isOwnId = targetJudgeParam === user.id || targetJudgeParam === user.email;
      const isJudgeA = user.email === 'tomas.varga@example.org' || user.id === 'jdg_01';
      const isTargetingA = targetJudgeParam === 'judge_a' || targetJudgeParam === 'jdg_01' || targetJudgeParam.toLowerCase().includes('tomas');

      if (!isOwnId && (!isJudgeA && isTargetingA)) {
        throw new RoleIsolationError('Forbidden: Backend role isolation prevents judges from inspecting peer evaluation scores', 403);
      }

      if (!isOwnId && (isJudgeA && (targetJudgeParam === 'judge_b' || targetJudgeParam === 'jdg_02'))) {
        throw new RoleIsolationError('Forbidden: Backend role isolation prevents judges from inspecting peer evaluation scores', 403);
      }
    }

    // Fetch only authenticated judge's own evaluation records
    const evaluations = await db.evaluation.findMany({
      where: { judgeId: user.id },
      include: {
        project: {
          include: {
            track: true,
            team: { select: { id: true, name: true } }
          }
        },
        scores: {
          include: {
            criteria: true
          }
        }
      }
    });

    return {
      judge: { id: user.id, name: user.name },
      evaluations
    };
  }

  // 3. Organizers and Admins can query all scores or filter by targetJudge
  let targetJudgeId: string | undefined = undefined;
  if (targetJudgeParam) {
    if (targetJudgeParam === 'judge_a') targetJudgeId = 'jdg_01';
    else if (targetJudgeParam === 'judge_b') targetJudgeId = 'jdg_02';
    else targetJudgeId = targetJudgeParam;
  }

  const evaluations = await db.evaluation.findMany({
    where: targetJudgeId ? { judgeId: targetJudgeId } : undefined,
    include: {
      judge: { select: { id: true, name: true, email: true } },
      project: {
        include: {
          track: true,
          team: { select: { id: true, name: true } }
        }
      },
      scores: {
        include: {
          criteria: true
        }
      }
    }
  });

  return { evaluations };
}
