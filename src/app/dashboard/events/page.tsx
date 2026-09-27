import Link from 'next/link';
import { db } from '@/backend/db';
import { getUserSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EventsListPage() {
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
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>All Hackathons</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Browse active and past hackathon events, review competition tracks, and join squads.
          </p>
        </div>

        {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <Link href="/dashboard/events/create" className="btn btn-primary">
            + Create New Hackathon
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
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
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isClosed ? '1px solid var(--border-subtle)' : '1px solid rgba(20, 184, 166, 0.4)'
              }}
            >
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      background: statusBg,
                      color: statusColor
                    }}
                  >
                    {statusLabel}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {h._count.teams} Teams Registered
                  </span>
                </div>

                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {h.name}
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.925rem' }}>
                  {h.description}
                </p>

                <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>
                    📅 <strong>Window:</strong>{' '}
                    {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} –{' '}
                    {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  </div>
                  <div>
                    ⏳ <strong>Submission Deadline:</strong>{' '}
                    {new Date(h.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                  </div>
                </div>

                {/* Tracks list */}
                {h.tracks && h.tracks.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Competition Tracks ({h.tracks.length})
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {h.tracks.map((t) => (
                        <span
                          key={t.id}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            fontSize: '0.75rem',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prizes list if any */}
                {h.prizes && h.prizes.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Prize Pool
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {h.prizes.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(234, 179, 8, 0.1)',
                            color: '#eab308',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(234, 179, 8, 0.2)'
                          }}
                        >
                          🏆 {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                <Link
                  href={`/dashboard/teams?hackathonId=${h.id}`}
                  className={isClosed ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem' }}
                >
                  {isClosed ? 'View Teams' : 'Join / Form Team'}
                </Link>
                <Link
                  href="/gallery"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  Gallery
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
