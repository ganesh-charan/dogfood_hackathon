import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// GET /api/certificates/[projectId]
// Generates a vectorized SVG Certificate of Participation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        track: true,
        team: {
          include: {
            hackathon: true,
            members: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const eventName = project.team.hackathon?.name || 'DOGFOOD HACKATHON 2026';
    const projectName = project.name;
    const teamName = project.team.name;
    const trackName = project.track?.name || 'General Innovation';
    const memberNames = project.team.members.map((m) => m.user.name).join(', ') || 'Participant';

    const verificationHash = crypto
      .createHash('sha256')
      .update(`${projectId}:${eventName}:${teamName}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d14"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1000" height="700" fill="url(#bg)"/>

  <!-- Border Frame -->
  <rect x="25" y="25" width="950" height="650" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="4"/>
  <rect x="35" y="35" width="930" height="630" rx="12" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Header Emblem -->
  <circle cx="500" cy="115" r="32" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="2"/>
  <text x="500" y="123" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#14b8a6" text-anchor="middle">★</text>

  <!-- Title -->
  <text x="500" y="185" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="url(#gold)" letter-spacing="4" text-anchor="middle">
    CERTIFICATE OF PARTICIPATION
  </text>
  <text x="500" y="215" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#9ca3af" letter-spacing="2" text-anchor="middle">
    ${eventName.toUpperCase()}
  </text>

  <!-- Subtitle -->
  <text x="500" y="275" font-family="system-ui, sans-serif" font-size="16" fill="#d1d5db" text-anchor="middle">
    This certifies that the engineering squad
  </text>

  <!-- Team & Members -->
  <text x="500" y="320" font-family="system-ui, sans-serif" font-size="30" font-weight="800" fill="#ffffff" text-anchor="middle">
    ${teamName}
  </text>
  <text x="500" y="355" font-family="system-ui, sans-serif" font-size="14" fill="#14b8a6" font-weight="600" text-anchor="middle">
    ${memberNames}
  </text>

  <!-- Accomplishment -->
  <text x="500" y="415" font-family="system-ui, sans-serif" font-size="16" fill="#d1d5db" text-anchor="middle">
    has successfully architected and verified the competitive platform submission
  </text>
  <text x="500" y="460" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#38bdf8" text-anchor="middle">
    "${projectName}"
  </text>
  <text x="500" y="495" font-family="system-ui, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">
    Track Focus: <tspan fill="#f59e0b" font-weight="600">${trackName}</tspan>
  </text>

  <!-- Footer Info & Verification Seal -->
  <line x1="120" y1="565" x2="880" y2="565" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <text x="150" y="605" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">ISSUED DATE</text>
  <text x="150" y="628" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#e5e7eb">${dateStr}</text>

  <text x="850" y="605" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280" text-anchor="end">VERIFICATION DIGEST</text>
  <text x="850" y="628" font-family="Courier, monospace" font-size="14" font-weight="700" fill="#14b8a6" text-anchor="end">SHA256:${verificationHash}</text>

  <text x="500" y="635" font-family="system-ui, sans-serif" font-size="12" fill="#4b5563" text-anchor="middle">
    DogFood Hackathon Self-Hostable Engine • Zero Cloud Dependencies
  </text>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `inline; filename="certificate-${projectId}.svg"`
      }
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return new NextResponse('Internal error generating certificate', { status: 500 });
  }
}
