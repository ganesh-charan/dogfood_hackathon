import { getUserSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Dashboard() {
  const user = await getUserSession();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Welcome back, {user.name} 
              <span style={{ 
                marginLeft: '1rem', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                background: 'var(--accent-primary)',
                fontWeight: 'bold'
              }}>
                {user.role}
              </span>
            </p>
          </div>
          
          <form action="/api/auth/logout" method="POST">
            <button className="btn btn-secondary" type="submit">Sign Out</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {user.role === 'ORGANIZER' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Organize Event</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create and manage hackathons, configure tracks, and assign judges.</p>
            <Link href="/dashboard/events/create" className="btn btn-primary">Create Hackathon</Link>
          </div>
        )}
        
        {(user.role === 'PARTICIPANT' || user.role === 'ORGANIZER') && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>My Projects</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Form teams, submit your code, and view your evaluation results.</p>
            <Link href="/dashboard/projects" className="btn btn-secondary">View Projects</Link>
          </div>
        )}

        {(user.role === 'JUDGE' || user.role === 'ORGANIZER') && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Evaluation Queue</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Review assigned projects using the designated rubrics.</p>
            <Link href="/dashboard/evaluations" className="btn btn-secondary">Start Judging</Link>
          </div>
        )}
      </div>
    </div>
  );
}
