'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Hackathon {
  id: string;
  name: string;
  votingOpen: boolean;
}

interface VoteTally {
  projectId: string;
  projectName: string;
  teamName: string;
  votes: number;
}

export default function VotingManagementPage() {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tallies, setTallies] = useState<VoteTally[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventRes, voteRes, projRes] = await Promise.all([
        fetch('/api/events/voting'),
        fetch('/api/votes'),
        fetch('/api/projects')
      ]);

      const eventData = await eventRes.json();
      const voteData = await voteRes.json();
      const projData = await projRes.json();

      if (eventData.success) {
        setHackathon({
          id: eventData.hackathonId,
          name: eventData.name,
          votingOpen: eventData.votingOpen
        });
      }

      if (voteData.success && voteData.voteCounts && projData.success && projData.projects) {
        const counts: Record<string, number> = voteData.voteCounts;
        let sum = 0;
        const projectMap = new Map();
        projData.projects.forEach((p: { id: string; name: string; team?: { name: string } }) => {
          projectMap.set(p.id, p);
        });

        const list: VoteTally[] = [];
        for (const [projId, count] of Object.entries(counts)) {
          sum += count;
          const p = projectMap.get(projId);
          list.push({
            projectId: projId,
            projectName: p?.name || projId,
            teamName: p?.team?.name || 'Unknown',
            votes: count
          });
        }
        list.sort((a, b) => b.votes - a.votes);
        setTallies(list);
        setTotalVotes(sum);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load community voting telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [eventRes, voteRes, projRes] = await Promise.all([
          fetch('/api/events/voting'),
          fetch('/api/votes'),
          fetch('/api/projects')
        ]);

        const eventData = await eventRes.json();
        const voteData = await voteRes.json();
        const projData = await projRes.json();

        if (isMounted) {
          if (eventData.success) {
            setHackathon({
              id: eventData.hackathonId,
              name: eventData.name,
              votingOpen: eventData.votingOpen
            });
          }

          if (voteData.success && voteData.voteCounts && projData.success && projData.projects) {
            const counts: Record<string, number> = voteData.voteCounts;
            let sum = 0;
            const projectMap = new Map();
            projData.projects.forEach((p: { id: string; name: string; team?: { name: string } }) => {
              projectMap.set(p.id, p);
            });

            const list: VoteTally[] = [];
            for (const [projId, count] of Object.entries(counts)) {
              sum += count;
              const p = projectMap.get(projId);
              list.push({
                projectId: projId,
                projectName: p?.name || projId,
                teamName: p?.team?.name || 'Unknown',
                votes: count
              });
            }
            list.sort((a, b) => b.votes - a.votes);
            setTallies(list);
            setTotalVotes(sum);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Failed to load community voting telemetry.');
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleVoting = async () => {
    if (!hackathon) return;
    setToggling(true);
    setMessage('');
    setError('');

    try {
      const nextState = !hackathon.votingOpen;
      const res = await fetch('/api/events/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: hackathon.id,
          votingOpen: nextState
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHackathon((prev) => (prev ? { ...prev, votingOpen: data.votingOpen } : null));
        setMessage(data.message);
        loadData();
      } else {
        setError(data.error || 'Failed to toggle voting state');
      }
    } catch {
      setError('Network communication failed');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tier 3 Public Showcase
          </span>
          <h1 style={{ fontSize: '2.5rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            Community Voting Control
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage public community voting windows, anti-sybil defenses, and unmasked live tallies.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/gallery" className="btn btn-secondary">
            View Public Showcase
          </Link>
        </div>
      </div>

      {message && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderColor: 'var(--accent-tertiary)' }}>
          <span style={{ color: 'var(--accent-tertiary)', fontSize: '0.9rem' }}>✓ {message}</span>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderColor: 'var(--accent-error)' }}>
          <span style={{ color: '#f87171', fontSize: '0.9rem' }}>✕ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading voting telemetry...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Status & Control Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Voting Window Status</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Target Event: <strong style={{ color: 'white' }}>{hackathon?.name || 'Active Event'}</strong>
            </p>

            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                background: hackathon?.votingOpen ? 'rgba(20, 184, 166, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${hackathon?.votingOpen ? 'var(--accent-tertiary)' : 'rgba(239, 68, 68, 0.3)'}`,
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: hackathon?.votingOpen ? 'var(--accent-tertiary)' : '#ef4444'
                  }}
                />
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Community Voting is {hackathon?.votingOpen ? 'ACTIVE' : 'LOCKED'}
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {hackathon?.votingOpen
                  ? 'Public visitors can cast ballots in the showcase. Results remain masked on the public view to prevent herd effects.'
                  : 'Voting window is closed. Verified vote totals are unmasked and displayed in the public gallery.'}
              </p>
            </div>

            <button
              onClick={handleToggleVoting}
              disabled={toggling}
              className={hackathon?.votingOpen ? 'btn btn-secondary' : 'btn btn-primary'}
              style={{ width: '100%', padding: '0.75rem 1rem' }}
            >
              {toggling
                ? 'Updating State...'
                : hackathon?.votingOpen
                ? '⛔ Close Community Voting'
                : '🚀 Open Community Voting'}
            </button>
          </div>

          {/* Anti-Sybil Defense Specs */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Anti-Abuse Invariants</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>1. Cryptographic Fingerprint</strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Deterministic SHA-256 hash of (Client IP + User-Agent + Event Salt).
                </p>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                <strong style={{ color: 'var(--accent-secondary)' }}>2. Sliding-Window Rate Limit</strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Maximum 5 votes per hour per IP. Returns HTTP 429 if exceeded.
                </p>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                <strong style={{ color: 'var(--accent-tertiary)' }}>3. Unique Ballot Invariant</strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Exact 1 vote per project per voter hash. Duplicate attempts rejected with HTTP 409.
                </p>
              </div>
            </div>
          </div>

          {/* Live Unmasked Leaderboard */}
          <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Community Vote Tallies (Organizer View)</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total ballots recorded: <strong style={{ color: 'white' }}>{totalVotes}</strong>
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600
                }}
              >
                UNMASKED ORGANIZER TELEMETRY
              </span>
            </div>

            {tallies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                No community ballots have been recorded yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>RANK</th>
                      <th style={{ padding: '0.75rem 1rem' }}>PROJECT</th>
                      <th style={{ padding: '0.75rem 1rem' }}>TEAM</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>VOTE COUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tallies.map((tally, idx) => (
                      <motion.tr
                        key={tally.projectId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: idx === 0 ? '#eab308' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'white' }}>
                          {tally.projectName}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {tally.teamName}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-tertiary)' }}>
                          ⭐ {tally.votes}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
