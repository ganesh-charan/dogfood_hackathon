import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

interface CriteriaInput {
  name: string;
  weight: number; // e.g. 0.40 or 40
  maxScore: number;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    const rubrics = await db.rubric.findMany({
      where: hackathonId ? { hackathonId } : undefined,
      include: {
        criteria: true,
        hackathon: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, rubrics });
  } catch (error) {
    console.error('Fetch rubrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch rubrics' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only organizers or administrators can configure scoring rubrics' }, { status: 403 });
    }

    const body = await req.json();
    const { hackathonId, name, criteria } = body;

    if (!hackathonId || !name || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: 'Missing required rubric fields or empty criteria list' }, { status: 400 });
    }

    // Normalize weights if passed as percentages (e.g. 40 -> 0.4)
    const normalizedCriteria = criteria.map((c: CriteriaInput) => {
      let weight = Number(c.weight);
      if (weight > 1) {
        weight = weight / 100;
      }
      return {
        name: c.name.trim(),
        weight: Number(weight.toFixed(4)),
        maxScore: Number(c.maxScore) || 10
      };
    });

    // Enforce invariant: Sum of weights must equal 1.0 (100%) within 0.001 tolerance
    const sumWeight = normalizedCriteria.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0);
    if (Math.abs(sumWeight - 1.0) > 0.001) {
      return NextResponse.json(
        { error: `Criteria weights must sum to exactly 100% (1.0). Current sum: ${(sumWeight * 100).toFixed(1)}%` },
        { status: 400 }
      );
    }

    const rubric = await db.$transaction(async (tx) => {
      const created = await tx.rubric.create({
        data: {
          name: name.trim(),
          hackathonId,
          criteria: {
            create: normalizedCriteria.map((c: { name: string; weight: number; maxScore: number }) => ({
              name: c.name,
              weight: c.weight,
              maxScore: c.maxScore
            }))
          }
        },
        include: {
          criteria: true
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_RUBRIC',
          userId: user.id,
          details: `Organizer ${user.name} created rubric "${created.name}" with ${created.criteria.length} criteria.`
        }
      });

      return created;
    });

    return NextResponse.json({ success: true, rubric }, { status: 201 });
  } catch (error) {
    console.error('Create rubric error:', error);
    return NextResponse.json({ error: 'Internal server error creating rubric' }, { status: 500 });
  }
}
