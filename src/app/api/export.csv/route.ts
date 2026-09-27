import { NextResponse } from 'next/server';
import { getUserSession } from '@/backend/security/auth';
import { generateEvaluationCsv } from '@/backend/services/exportService';
import { RoleIsolationError } from '@/backend/services/evaluationService';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const csvContent = await generateEvaluationCsv(user);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="evaluations.csv"'
      }
    });
  } catch (error) {
    if (error instanceof RoleIsolationError) {
      return new NextResponse(error.message, { status: error.statusCode });
    }
    console.error('Export CSV error:', error);
    return new NextResponse('Internal server error exporting CSV report', { status: 500 });
  }
}
