import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

function generateJoinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    const teams = await db.team.findMany({
      where: hackathonId ? { hackathonId } : undefined,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        projects: {
          select: { id: true, name: true, status: true }
        },
        hackathon: {
          select: { id: true, name: true, startDate: true, endDate: true }
        }
      }
    });

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { hackathonId, name } = body;

    if (!hackathonId || !name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Team name must be at least 2 characters long' }, { status: 400 });
    }

    // Verify hackathon exists
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId }
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon event not found' }, { status: 404 });
    }

    // Enforce invariant: Participant can belong to at most one active team per hackathon
    const existingMembership = await db.teamMember.findFirst({
      where: {
        userId: user.id,
        team: { hackathonId }
      },
      include: {
        team: true
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: `You already belong to team "${existingMembership.team.name}" in this hackathon` },
        { status: 400 }
      );
    }

    // Enforce invariant: Team name must be unique within the hackathon
    const existingName = await db.team.findFirst({
      where: {
        hackathonId,
        name: name.trim()
      }
    });

    if (existingName) {
      return NextResponse.json(
        { error: 'A team with this name already exists in this hackathon' },
        { status: 400 }
      );
    }

    // Generate unique 6-character code
    let joinCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      joinCode = generateJoinCode();
      const existing = await db.team.findUnique({ where: { joinCode } });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique team code' }, { status: 500 });
    }

    // Create team and add creator as member
    const team = await db.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: name.trim(),
          joinCode,
          hackathonId,
          members: {
            create: {
              userId: user.id
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          hackathon: {
            select: { id: true, name: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_TEAM',
          userId: user.id,
          details: `User ${user.name} created team "${createdTeam.name}" (Code: ${joinCode}) for hackathon "${createdTeam.hackathon.name}".`
        }
      });

      return createdTeam;
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Internal server error creating team' }, { status: 500 });
  }
}
