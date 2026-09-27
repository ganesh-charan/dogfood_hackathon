import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

// GET /api/votes?hackathonId=...
// Tier 3 requirement: "results hidden until the window closes"
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    const user = await getUserSession();
    const isOrganizerOrAdmin = user && (user.role === 'ORGANIZER' || user.role === 'ADMIN');

    let hackathon;
    if (hackathonId) {
      hackathon = await db.hackathon.findUnique({
        where: { id: hackathonId }
      });
    } else {
      hackathon = await db.hackathon.findFirst();
    }

    if (!hackathon) {
      return NextResponse.json({ success: false, error: 'Hackathon event not found' }, { status: 404 });
    }

    // Results Masking Enforcement:
    // If voting is open AND user is NOT organizer/admin, mask the live tally counts
    if (hackathon.votingOpen && !isOrganizerOrAdmin) {
      return NextResponse.json({
        success: true,
        masked: true,
        votingOpen: true,
        message: 'Community voting is currently active. Results are masked until the voting window closes to prevent bandwagoning.'
      });
    }

    // When voting is closed OR user is organizer/admin, return unmasked tallies
    const votes = await db.vote.groupBy({
      by: ['projectId'],
      _count: {
        id: true
      }
    });

    const voteCounts: Record<string, number> = {};
    votes.forEach((v) => {
      voteCounts[v.projectId] = v._count.id;
    });

    return NextResponse.json({
      success: true,
      masked: false,
      votingOpen: hackathon.votingOpen,
      voteCounts
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/votes
// Cast a community vote with anti-sybil fingerprinting and rate-limiting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400 });
    }

    // Lookup project and associated hackathon
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            hackathon: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const hackathon = project.team.hackathon;
    if (!hackathon.votingOpen) {
      return NextResponse.json(
        { success: false, error: 'Community voting is currently closed for this hackathon.' },
        { status: 403 }
      );
    }

    // Extract client IP & User-Agent for Anti-Sybil Fingerprint
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null) ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Sliding-Window Rate Limit Defense: Max 5 votes per hour per IP
    const rateLimit = checkRateLimit(ip, 5, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Anti-fraud rate limit triggered. You can submit up to 5 votes per hour. Try again in ${rateLimit.resetInSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    // 2. Compute Deterministic Voter Fingerprint (SHA-256)
    const voterFingerprint = crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}:${hackathon.id}`)
      .digest('hex');

    // 3. Unique Invariant: 1 vote per project per voter hash
    const existingVote = await db.vote.findFirst({
      where: {
        projectId,
        voterIpOrId: voterFingerprint
      }
    });

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already cast your ballot for this project.'
        },
        { status: 409 }
      );
    }

    // 4. Record the vote
    const vote = await db.vote.create({
      data: {
        projectId,
        voterIpOrId: voterFingerprint
      }
    });

    // 5. Audit Log Entry
    await db.auditLog.create({
      data: {
        action: 'VOTE_CAST',
        details: `Vote cast for project "${project.name}" (${project.id}) with fingerprint ${voterFingerprint.slice(0, 8)}...`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Your vote has been verified and counted!',
      voteId: vote.id,
      remainingHourlyVotes: rateLimit.remaining
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
