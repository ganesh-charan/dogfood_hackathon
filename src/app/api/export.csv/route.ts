import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return new NextResponse('Forbidden: Organizers or Admins only', { status: 403 });
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
      escapeCsv(e.comment || '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="hackathon_evaluations_export.csv"'
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return new NextResponse('Internal server error exporting CSV data', { status: 500 });
  }
}
