import { getUserSession } from '@/lib/auth';
import { db } from '@/backend/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Dashboard() {
  const user = await getUserSession();
  
  if (!user) {
    redirect('/login');
  }

  const hackathons = await db.hackathon.findMany({
    include: {
      tracks: true,
      prizes: true,
      _count: {
        select: { teams: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const now = new Date();

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '5rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>DogFood Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({user.email})
              <span style={{ 
                marginLeft: '1rem', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                background: 'var(--accent-primary)',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}>
                {user.role}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/gallery" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
              Public Gallery
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button className="btn btn-secondary" type="submit" style={{ fontSize: '0.875rem' }}>Sign Out</button>
            </form>
          </div>
        </div>
      </div>

      {/* Available Hackathons Showcase */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Hackathon Competitions</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Browse active events, inspect tracks and deadlines, and form squads.
            </p>
          </div>
          {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
            <Link href="/dashboard/events/create" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
              + Create Hackathon
            </Link>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {hackathons.map((h) => {
            const isClosed = now > new Date(h.endDate);
            const isUpcoming = now < new Date(h.startDate);
            const statusLabel = isClosed ? 'CLOSED' : isUpcoming ? 'UPCOMING' : 'ACTIVE NOW';
            const statusColor = isClosed ? '#ef4444' : isUpcoming ? '#f59e0b' : 'var(--accent-tertiary)';
            const statusBg = isClosed ? 'rgba(239, 68, 68, 0.15)' : isUpcoming ? 'rgba(245, 158, 11, 0.15)' : 'rgba(20, 184, 166, 0.15)';

            return (
              <div
                key={h.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isClosed ? '1px solid var(--border-subtle)' : '1px solid rgba(20, 184, 166, 0.4)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      background: statusBg,
                      color: statusColor
                    }}>
                      {statusLabel}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {h._count.teams} Teams
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {h.name}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {h.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>🎯 <strong>Tracks ({h.tracks.length}):</strong> {h.tracks.slice(0, 3).map(t => t.name).join(', ')}{h.tracks.length > 3 ? '...' : ''}</div>
                    <div>⏳ <strong>Deadline:</strong> {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/teams?hackathonId=${h.id}`}
                    className={isClosed ? 'btn btn-secondary' : 'btn btn-primary'}
                    style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}
                  >
                    {isClosed ? 'View Teams' : 'Join / Form Team'}
                  </Link>
                  <Link
                    href="/gallery"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Gallery
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

        {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Event Management
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Organize Event</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Provision hackathons, define track categories, configure cash prizes, and lock schedules.
              </p>
            </div>
            <Link href="/dashboard/events/create" className="btn btn-primary" style={{ width: '100%' }}>
              Create Hackathon
            </Link>
          </div>
        )}

        {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase' }}>
                Evaluation Policy
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Rubric Builder</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Establish weighted judging criteria, calibrate max score scales, and enforce 100% total weight invariants.
              </p>
            </div>
            <Link href="/dashboard/rubrics" className="btn btn-secondary" style={{ width: '100%' }}>
              Configure Rubrics
            </Link>
          </div>
        )}

        {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase' }}>
                Community Engagement
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Voting Control</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Toggle public voting windows, monitor anti-sybil rate limits, and inspect live unmasked vote tallies.
              </p>
            </div>
            <Link href="/dashboard/voting" className="btn btn-secondary" style={{ width: '100%' }}>
              Manage Voting
            </Link>
          </div>
        )}
        
        {(user.role === 'PARTICIPANT' || user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Collaboration
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Team Operations</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Form your squad, distribute unique 6-character invite codes, and manage your team roster.
              </p>
            </div>
            <Link href="/dashboard/teams" className="btn btn-secondary" style={{ width: '100%' }}>
              Manage Teams
            </Link>
          </div>
        )}

        {(user.role === 'PARTICIPANT' || user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Submissions
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Project Pipeline</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Draft project descriptions, connect repositories, and submit before the hard deadline locks.
              </p>
            </div>
            <Link href="/dashboard/projects" className="btn btn-secondary" style={{ width: '100%' }}>
              View Projects
            </Link>
          </div>
        )}

        {(user.role === 'JUDGE' || user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 700, textTransform: 'uppercase' }}>
                Scoring Engine
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Evaluation Queue</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Review assigned projects against weighted rubric criteria and submit evaluation scores.
              </p>
            </div>
            <Link href="/dashboard/evaluations" className="btn btn-secondary" style={{ width: '100%' }}>
              Start Judging
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
