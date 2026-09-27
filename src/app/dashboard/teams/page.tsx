'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Track {
  id: string;
  name: string;
  description?: string;
}

interface Prize {
  id: string;
  name: string;
  description?: string;
}

interface Hackathon {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  votingOpen?: boolean;
  tracks?: Track[];
  prizes?: Prize[];
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

function TeamsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryHackathonId = searchParams.get('hackathonId');

  const [teams, setTeams] = useState<Team[]>([]);
  const [availableHackathons, setAvailableHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states (scoped to selected hackathon)
  const [createName, setCreateName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Interaction feedback states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const refreshData = async (preferredHackathonId?: string) => {
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
        const events: Hackathon[] = eventsData.events;
        setAvailableHackathons(events);

        // Update selected hackathon if needed
        const targetId = preferredHackathonId || selectedHackathonId;
        if (targetId && events.some(e => e.id === targetId)) {
          setSelectedHackathonId(targetId);
        } else if (events.length > 0) {
          setSelectedHackathonId(events[0].id);
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
            const events: Hackathon[] = eventsData.events;
            setAvailableHackathons(events);

            if (queryHackathonId && events.some(e => e.id === queryHackathonId)) {
              setSelectedHackathonId(queryHackathonId);
            } else if (events.length > 0) {
              setSelectedHackathonId(events[0].id);
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
  }, [queryHackathonId]);

  const handleSelectHackathon = (id: string) => {
    setSelectedHackathonId(id);
    setFormError('');
    setFormSuccess('');
    router.replace(`/dashboard/teams?hackathonId=${id}`, { scroll: false });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId) return;
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

      setFormSuccess(`🎉 Team "${data.team.name}" successfully created! Your squad code is ${data.team.joinCode}`);
      setCreateName('');
      await refreshData(selectedHackathonId);
    } catch {
      setFormError('Network communication error while creating team');
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

      setFormSuccess(`🎉 Successfully joined team "${data.team.name}"!`);
      setJoinCodeInput('');
      const targetHackathonId = data.team.hackathonId || selectedHackathonId;
      setSelectedHackathonId(targetHackathonId);
      await refreshData(targetHackathonId);
    } catch {
      setFormError('Network communication error while joining team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!leavingTeamId) return;
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: leavingTeamId })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to leave team');
        setSubmitting(false);
        setShowLeaveConfirm(false);
        return;
      }

      setFormSuccess(data.message || 'You have successfully left the team.');
      setShowLeaveConfirm(false);
      setLeavingTeamId(null);
      await refreshData(selectedHackathonId);
    } catch {
      setFormError('Network error while processing team departure.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHackathon = availableHackathons.find((h) => h.id === selectedHackathonId);
  const now = new Date();
  const isSelectedClosed = selectedHackathon ? now > new Date(selectedHackathon.endDate) : false;
  const isSelectedUpcoming = selectedHackathon ? now < new Date(selectedHackathon.startDate) : false;

  // Find if user already belongs to a team in the selected hackathon
  const myTeamForEvent = teams.find(
    (t) => t.hackathonId === selectedHackathonId || t.hackathon?.id === selectedHackathonId
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hackathon Team Workspace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your squad, track project submissions, and isolate operations per hackathon competition.
        </p>
      </div>

      {/* Hackathon Selector Navigation Tabs */}
      {availableHackathons.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Select Hackathon Competition
          </div>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            {availableHackathons.map((h) => {
              const isSelected = h.id === selectedHackathonId;
              const hasTeam = teams.some(t => t.hackathonId === h.id || t.hackathon?.id === h.id);
              const closed = now > new Date(h.endDate);

              return (
                <button
                  key={h.id}
                  onClick={() => handleSelectHackathon(h.id)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: closed ? '#ef4444' : hasTeam ? 'var(--accent-tertiary)' : '#f59e0b'
                    }}
                  />
                  <span>{h.name}</span>
                  {hasTeam && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(20, 184, 166, 0.25)',
                        color: 'var(--accent-tertiary)',
                        fontWeight: 700
                      }}
                    >
                      In Team
                    </span>
                  )}
                  {closed && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        fontWeight: 700
                      }}
                    >
                      Closed
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
          </motion.div>
        )}

        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading hackathon workspace telemetry...
        </div>
      ) : !selectedHackathon ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Hackathon Selected</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            There are currently no registered hackathons in the system.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* ISOLATED HACKATHON DETAILS BANNER */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem 2.5rem',
              border: isSelectedClosed
                ? '1px solid var(--border-subtle)'
                : '1px solid rgba(20, 184, 166, 0.35)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(99,102,241,0.06) 100%)'
            }}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    background: isSelectedClosed
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isSelectedUpcoming
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(20, 184, 166, 0.15)',
                    color: isSelectedClosed
                      ? '#ef4444'
                      : isSelectedUpcoming
                      ? '#f59e0b'
                      : 'var(--accent-tertiary)'
                  }}
                >
                  {isSelectedClosed ? 'CLOSED' : isSelectedUpcoming ? 'UPCOMING' : 'ACTIVE NOW'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ID: {selectedHackathon.id.slice(0, 8)}...
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ⏳ <strong>Deadline:</strong>{' '}
                {new Date(selectedHackathon.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC'
                })}{' '}
                UTC
              </div>
            </div>

            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {selectedHackathon.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              {selectedHackathon.description}
            </p>

            {/* Tracks & Prizes pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              {selectedHackathon.tracks && selectedHackathon.tracks.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Tracks ({selectedHackathon.tracks.length})
                  </div>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {selectedHackathon.tracks.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.8rem',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        🎯 {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedHackathon.prizes && selectedHackathon.prizes.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Prize Pool
                  </div>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {selectedHackathon.prizes.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(234, 179, 8, 0.1)',
                          color: '#eab308',
                          fontSize: '0.8rem',
                          border: '1px solid rgba(234, 179, 8, 0.25)'
                        }}
                      >
                        🏆 {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SCENARIO A: PARTICIPANT IS ALREADY IN A TEAM FOR THIS HACKATHON */}
          {myTeamForEvent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{ padding: '2.5rem' }}
            >
              <div
                className="flex justify-between items-center"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1.5rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Registered Squad for {selectedHackathon.name}
                  </span>
                  <h2 style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>{myTeamForEvent.name}</h2>
                </div>

                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INVITE CODE</div>
                    <div style={{ fontSize: '1.6rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent-primary)' }}>
                      {myTeamForEvent.joinCode}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(myTeamForEvent.joinCode)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    {copiedCode ? '✓ Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Roster & Submission Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Team Roster */}
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Team Roster</h3>
                    <span style={{ fontSize: '0.875rem', color: myTeamForEvent.members.length >= 5 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {myTeamForEvent.members.length} / 5 Members
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {myTeamForEvent.members.map((member, idx) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center"
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(0,0,0,0.25)',
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

                {/* Submission Status */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Project Submission</h3>
                  <div
                    className="glass-panel"
                    style={{
                      padding: '1.75rem',
                      background: 'rgba(20, 20, 30, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '170px'
                    }}
                  >
                    {myTeamForEvent.projects && myTeamForEvent.projects.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.2rem' }}>{myTeamForEvent.projects[0].name}</h4>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              background:
                                myTeamForEvent.projects[0].status === 'SUBMITTED'
                                  ? 'rgba(20, 184, 166, 0.2)'
                                  : 'rgba(234, 179, 8, 0.2)',
                              color:
                                myTeamForEvent.projects[0].status === 'SUBMITTED'
                                  ? 'var(--accent-tertiary)'
                                  : '#eab308',
                              fontWeight: 700
                            }}
                          >
                            {myTeamForEvent.projects[0].status}
                          </span>
                        </div>
                        {myTeamForEvent.projects[0].track && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Track: {myTeamForEvent.projects[0].track.name}
                          </p>
                        )}
                        <Link
                          href={`/dashboard/projects/submit?teamId=${myTeamForEvent.id}`}
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          Edit Project Submission
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                          No project submission has been initiated yet for {selectedHackathon.name}.
                        </p>
                        <Link
                          href={`/dashboard/projects/submit?teamId=${myTeamForEvent.id}`}
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          + Start Project Submission
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Leave / Disband Team Action Area */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Squad Membership Management
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    {myTeamForEvent.members.length === 1
                      ? 'You are the only member. Leaving will permanently disband this team.'
                      : 'Leaving will surrender your spot on this roster, making you idle for this event.'}
                  </p>
                </div>

                <div>
                  {!showLeaveConfirm ? (
                    <button
                      type="button"
                      disabled={submitting || isSelectedClosed}
                      onClick={() => {
                        setLeavingTeamId(myTeamForEvent.id);
                        setShowLeaveConfirm(true);
                      }}
                      className="btn btn-secondary"
                      style={{
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: '0.85rem'
                      }}
                    >
                      {isSelectedClosed
                        ? 'Event Concluded (Locked)'
                        : myTeamForEvent.members.length === 1
                        ? 'Disband Team'
                        : 'Leave Team'}
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>
                        Are you sure?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLeaveConfirm(false)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleLeaveTeam}
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.4rem 0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {submitting ? 'Processing...' : 'Confirm & Leave'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice that Create / Join is disabled because user is in a team */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                ℹ️ <strong>Rule Enforced:</strong> Each participant can belong to exactly 1 team per hackathon. Because you are already an active member of <strong>{myTeamForEvent.name}</strong>, new team creation or joining is disabled for <strong>{selectedHackathon.name}</strong>. If you wish to join a different team, please leave your current team above.
              </div>
            </motion.div>
          ) : (
            /* SCENARIO B: PARTICIPANT IS IDLE FOR THIS HACKATHON */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Idle notification banner */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#f59e0b' }}>
                    You are currently Idle for {selectedHackathon.name}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    You have not joined or formed a team for this event yet. Create a new team below as captain or enter an invite code to join an existing team.
                  </p>
                </div>
              </div>

              {isSelectedClosed ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#f87171', marginBottom: '0.5rem' }}>
                    Team Registration Closed
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    This hackathon event has closed. New team registrations or joins are no longer accepted.
                  </p>
                </div>
              ) : (
                /* Create or Join Forms scoped specifically to this event */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  {/* Create Team Form */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Option 1: Form New Squad
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      Create Team for {selectedHackathon.name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Form a squad as team captain and generate a 6-character invite code for your teammates.
                    </p>

                    <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
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
                        disabled={submitting || createName.trim().length < 2}
                        className="btn btn-primary"
                        style={{
                          marginTop: '0.5rem',
                          opacity: submitting || createName.trim().length < 2 ? 0.6 : 1
                        }}
                      >
                        {submitting ? 'Creating Squad...' : `Create Team for ${selectedHackathon.name}`}
                      </button>
                    </form>
                  </div>

                  {/* Join Team Form */}
                  <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Option 2: Join Existing Squad
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      Join with Invite Code
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Have an invite code from your team captain? Enter the 6-character code below.
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
                        {submitting ? 'Verifying Code...' : 'Join Squad Roster'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamsDashboardPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading team operations...</p>
      </div>
    }>
      <TeamsContent />
    </Suspense>
  );
}
