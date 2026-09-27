import Link from 'next/link';
import { db } from '@/lib/db';
import GalleryClient from '@/components/GalleryClient';

export const dynamic = 'force-dynamic';

export default async function PublicGalleryPage() {
  const [projects, hackathon] = await Promise.all([
    db.project.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        track: true,
        team: {
          include: {
            hackathon: {
              select: { name: true }
            },
            members: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    }),
    db.hackathon.findFirst()
  ]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      {/* Navigation Bar */}
      <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Inception
        </Link>

        <div className="flex gap-4">
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            Dashboard
          </Link>
        </div>
      </div>

      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span
          style={{
            fontSize: '0.85rem',
            padding: '0.3rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          Public Showcase & Gallery
        </span>
        <h1 style={{ fontSize: '3rem', marginTop: '1rem', marginBottom: '1rem' }}>
          Explore Verified Submissions
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem' }}>
          Showcase of competitive solutions built during the Dog Food Hackathon. Card sequences are randomized to ensure impartial visibility.
        </p>
      </div>

      {/* Client-side Search and Filterable Grid with Server Pre-rendered Data */}
      <GalleryClient
        initialProjects={projects}
        initialVotingOpen={hackathon?.votingOpen ?? false}
        hackathonId={hackathon?.id}
      />
    </div>
  );
}
