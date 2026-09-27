'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  track?: { name: string };
}

interface Hackathon {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Team {
  id: string;
  name: string;
  joinCode: string;
  hackathonId: string;
  hackathon: Hackathon;
  members: Member[];
  projects: Project[];
}

export default function TeamsDashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableHackathons, setAvailableHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states
  const [createName, setCreateName] = useState('');
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshData = async () => {
    try {
      const [teamRes, eventsRes] = await Promise.all([
        fetch('/api/teams/my-team'),
        fetch('/api/events')
      ]);
      const teamData = await teamRes.json();
      const eventsData = await eventsRes.json();
      if (teamData.success) {
        setTeams(teamData.teams || []);
      }
      if (eventsData.success && eventsData.events) {
        setAvailableHackathons(eventsData.events);
        if (eventsData.events.length > 0 && !selectedHackathonId) {
          setSelectedHackathonId(eventsData.events[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [teamRes, eventsRes] = await Promise.all([
          fetch('/api/teams/my-team'),
          fetch('/api/events')
        ]);
        const teamData = await teamRes.json();
        const eventsData = await eventsRes.json();
        if (isMounted) {
          if (teamData.success) {
            setTeams(teamData.teams || []);
          }
          if (eventsData.success && eventsData.events) {
            setAvailableHackathons(eventsData.events);
            if (eventsData.events.length > 0 && !selectedHackathonId) {
              setSelectedHackathonId(eventsData.events[0].id);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [selectedHackathonId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          hackathonId: selectedHackathonId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create team');
        setSubmitting(false);
        return;
      }

      setFormSuccess(`Team "${data.team.name}" created! Join code: ${data.team.joinCode}`);
      setCreateName('');
      await refreshData();
    } catch {
      setFormError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCodeInput })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to join team');
        setSubmitting(false);
        return;
      }

      setFormSuccess(`Successfully joined team "${data.team.name}"!`);
      setJoinCodeInput('');
      await refreshData();
    } catch {
      setFormError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Team Operations</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create teams, invite collaborators via secure 6-character codes, and manage your competition roster.
        </p>
      </div>

      {formError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          {formError}
        </div>
      )}

      {formSuccess && (
        <div
          style={{
            background: 'rgba(20, 184, 166, 0.1)',
            color: 'var(--accent-tertiary)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            fontWeight: 600
          }}
        >
          {formSuccess}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading team roster telemetry...
        </div>
      ) : teams.length > 0 ? (
        <div className="flex flex-col gap-8">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ padding: '2.5rem' }}
            >
              <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {team.hackathon.name}
                  </div>
                  <h2 style={{ fontSize: '2rem' }}>{team.name}</h2>
                </div>

                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INVITE CODE</div>
                    <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent-primary)' }}>
                      {team.joinCode}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(team.joinCode)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    {copiedCode ? '✓ Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Roster & Project Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Team Roster</h3>
                    <span style={{ fontSize: '0.875rem', color: team.members.length >= 5 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {team.members.length} / 5 Members
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {team.members.map((member, idx) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center"
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.user.email}</div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            background: idx === 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            fontWeight: 600
                          }}
                        >
                          {idx === 0 ? 'Captain' : 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Submission Status</h3>
                  <div
                    className="glass-panel"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(20, 20, 30, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '160px'
                    }}
                  >
                    {team.projects && team.projects.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.2rem' }}>{team.projects[0].name}</h4>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              background: team.projects[0].status === 'SUBMITTED' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                              color: team.projects[0].status === 'SUBMITTED' ? 'var(--accent-tertiary)' : '#eab308',
                              fontWeight: 700
                            }}
                          >
                            {team.projects[0].status}
                          </span>
                        </div>
                        {team.projects[0].track && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Track: {team.projects[0].track.name}
                          </p>
                        )}
                        <Link href="/dashboard/projects/submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                          Edit Submission
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                          No project submission has been initiated yet for this hackathon.
                        </p>
                        <Link href="/dashboard/projects/submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                          + Start Project Submission
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Team Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create a New Team</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Form a squad as team captain and generate an invite code for your teammates.
            </p>

            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Select Hackathon Event *
                </label>
                {availableHackathons.length > 0 ? (
                  <select
                    className="input-field"
                    value={selectedHackathonId}
                    onChange={(e) => setSelectedHackathonId(e.target.value)}
                  >
                    {availableHackathons.map((h) => (
                      <option key={h.id} value={h.id} style={{ background: '#121218' }}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No active hackathons found. Please wait for an organizer to create one.
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberVanguard"
                  className="input-field"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || availableHackathons.length === 0}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Creating Team...' : 'Create Team'}
              </button>
            </form>
          </div>

          {/* Join Team Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Join an Existing Team</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Have an invite code from your team captain? Enter it below to join the roster.
            </p>

            <form onSubmit={handleJoinTeam} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  6-Character Invite Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. A9X2K1"
                  className="input-field"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, fontSize: '1.25rem' }}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || joinCodeInput.trim().length !== 6}
                className="btn btn-secondary"
                style={{ marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Joining...' : 'Join Roster'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
