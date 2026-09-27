import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EmbedGalleryPage() {
  const projects = await db.project.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      track: true,
      team: true
    },
    take: 12,
    orderBy: { id: 'asc' }
  });

  return (
    <div style={{ padding: '1rem', background: '#0a0d14', minHeight: '100vh', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#14b8a6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Live Showcase
          </span>
          <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0', fontWeight: 700 }}>
            Hackathon Submissions
          </h2>
        </div>
        <a
          href="/gallery"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '0.75rem', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
        >
          View Full Gallery ↗
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '9999px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: '#2dd4bf',
                  fontWeight: 700
                }}
              >
                {p.track?.name || 'General'}
              </span>
              <h4 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1rem', color: '#ffffff' }}>
                {p.name}
              </h4>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#818cf8' }}>
                by {p.team.name}
              </p>
              <p
                style={{
                  margin: '0 0 0.75rem',
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {p.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
              {p.demoUrl && (
                <a
                  href={p.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.3rem 0.5rem',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Demo
                </a>
              )}
              {p.repoUrl && (
                <a
                  href={p.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.3rem 0.5rem',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Code
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
