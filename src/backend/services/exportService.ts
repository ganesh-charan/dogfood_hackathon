import { db } from '../db';
import { UserSession } from '../security/auth';
import { RoleIsolationError } from './evaluationService';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function generateEvaluationCsv(user: UserSession): Promise<string> {
  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
    throw new RoleIsolationError('Forbidden: Organizers or Admins only', 403);
  }

  const evaluations = await db.evaluation.findMany({
    include: {
      judge: { select: { id: true, name: true, email: true } },
      project: {
        include: {
          track: true,
          team: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { totalScore: 'desc' }
  });

  const headers = [
    'Evaluation ID',
    'Project ID',
    'Project Title',
    'Track',
    'Team Name',
    'Judge ID',
    'Judge Name',
    'Raw Score',
    'Normalized Score',
    'Completed',
    'Comment'
  ];

  const rows = evaluations.map((e) => [
    escapeCsv(e.id),
    escapeCsv(e.projectId),
    escapeCsv(e.project.name),
    escapeCsv(e.project.track?.name || 'General'),
    escapeCsv(e.project.team.name),
    escapeCsv(e.judgeId),
    escapeCsv(e.judge.name),
    escapeCsv(e.totalScore.toFixed(2)),
    escapeCsv(e.normalizedScore !== null ? e.normalizedScore.toFixed(2) : 'N/A'),
    escapeCsv(e.completed ? 'YES' : 'NO'),
    escapeCsv(e.comment)
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
