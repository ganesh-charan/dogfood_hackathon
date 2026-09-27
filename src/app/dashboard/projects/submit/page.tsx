'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface Track {
  id: string;
  name: string;
  description: string;
}

interface Hackathon {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tracks: Track[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  trackId: string | null;
  status: string;
}

interface Team {
  id: string;
  name: string;
  hackathonId: string;
  hackathon: Hackathon;
  projects: Project[];
}

function ProjectSubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryHackathonId = searchParams.get('hackathonId');

  const [loading, setLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  // Preview tab toggle
  const [previewTab, setPreviewTab] = useState<'write' | 'preview'>('write');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Load user teams
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/teams/my-team');
        const data = await res.json();

        if (data.success && data.teams && data.teams.length > 0) {
          const teamsList: Team[] = data.teams;
          setAllTeams(teamsList);

          // Determine initial team selection
          let target = teamsList[0];
          if (queryTeamId) {
            const found = teamsList.find((t) => t.id === queryTeamId);
            if (found) target = found;
          } else if (queryHackathonId) {
            const found = teamsList.find(
              (t) => t.hackathonId === queryHackathonId || t.hackathon?.id === queryHackathonId
            );
            if (found) target = found;
          }

          setSelectedTeamId(target.id);
          applyTeamData(target);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryTeamId, queryHackathonId]);

  const applyTeamData = (userTeam: Team) => {
    // Check deadline
    const now = new Date();
    const end = new Date(userTeam.hackathon.endDate);
    setDeadlinePassed(now > end);

    // Preload existing project draft if present
    if (userTeam.projects && userTeam.projects.length > 0) {
      const p = userTeam.projects[0];
      setName(p.name || '');
      setDescription(p.description || '');
      setRepoUrl(p.repoUrl || '');
      setDemoUrl(p.demoUrl || '');
      setTrackId(p.trackId || (userTeam.hackathon.tracks?.[0]?.id || ''));
      setCurrentStatus(p.status || 'DRAFT');
    } else {
      setName('');
      setDescription('');
      setRepoUrl('');
      setDemoUrl('');
      setTrackId(userTeam.hackathon.tracks?.[0]?.id || '');
      setCurrentStatus('DRAFT');
    }
  };

  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    setError('');
    setSuccess('');
    const found = allTeams.find((t) => t.id === newTeamId);
    if (found) {
      applyTeamData(found);
    }
  };

  const currentTeam = allTeams.find((t) => t.id === selectedTeamId);

  // Update countdown clock
  useEffect(() => {
    if (!currentTeam) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentTeam.hackathon.endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setDeadlinePassed(true);
        setTimeRemaining('Submission Window Closed');
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeRemaining(`${days}d : ${hours}h : ${minutes}m : ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTeam]);

  const handleSave = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!currentTeam) return;
    setError('');
    setSuccess('');
    setSaving(true);

    let cleanRepo = repoUrl.trim();
    if (cleanRepo && !/^https?:\/\//i.test(cleanRepo)) {
      cleanRepo = `https://${cleanRepo}`;
    }

    let cleanDemo = demoUrl.trim();
    if (cleanDemo && !/^https?:\/\//i.test(cleanDemo)) {
      cleanDemo = `https://${cleanDemo}`;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: currentTeam.id,
          name,
          description,
          repoUrl: cleanRepo,
          demoUrl: cleanDemo || undefined,
          trackId,
          status: targetStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save project submission');
        setSaving(false);
        return;
      }

      setCurrentStatus(data.project.status);

      if (targetStatus === 'SUBMITTED') {
        setSuccess('🎉 Project submitted successfully! Your submission is now in the evaluation queue.');
        setTimeout(() => {
          router.push('/dashboard/projects');
        }, 1800);
      } else {
        setSuccess('Draft autosaved successfully.');
      }
    } catch {
      setError('Network communication failure.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading submission pipeline...</p>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="container" style={{ paddingTop: '5rem', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No Registered Squad Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            To submit a project, you must first create or join a team for a hackathon event.
          </p>
          <Link href="/dashboard/teams" className="btn btn-primary">
            Go to Team Operations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/dashboard/teams?hackathonId=${currentTeam.hackathonId || currentTeam.hackathon.id}`} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Squad Workspace
        </Link>
      </div>

      {/* Team / Hackathon Switcher if user has multiple teams */}
      {allTeams.length > 1 && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Select Submission Scope
            </span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Submitting for Hackathon Squad:
            </div>
          </div>
          <select
            className="input-field"
            style={{ maxWidth: '350px' }}
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
          >
            {allTeams.map((t) => (
              <option key={t.id} value={t.id} style={{ background: '#121218' }}>
                {t.hackathon.name} — Team {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Deadline telemetry header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderColor: deadlinePassed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.3)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
            {currentTeam.hackathon.name} • SQUAD: {currentTeam.name}
          </span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>Project Submission Pipeline</h3>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {deadlinePassed ? 'DEADLINE CUTOFF' : 'DEADLINE COUNTDOWN'}
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: deadlinePassed ? '#ef4444' : 'var(--accent-primary)'
            }}
          >
            {timeRemaining || 'Syncing clock...'}
          </div>
        </div>
      </motion.div>

      {error && (
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
          {error}
        </div>
      )}

      {success && (
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
          {success}
        </div>
      )}

      {deadlinePassed && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          ⚠️ Hard deadline has expired for this event. Submissions are permanently locked against edits.
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel"
        style={{ padding: '2.5rem' }}
      >
        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem' }}>Project Submission Editor</h2>
          <span
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: currentStatus === 'SUBMITTED' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              color: currentStatus === 'SUBMITTED' ? 'var(--accent-tertiary)' : '#eab308'
            }}
          >
            STATUS: {currentStatus}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Project Title * (3 - 80 characters)
            </label>
            <input
              type="text"
              disabled={deadlinePassed}
              maxLength={80}
              placeholder="e.g. Autonomous Agentic Workflow Synthesizer"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Competition Track *
            </label>
            <select
              disabled={deadlinePassed}
              className="input-field"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
            >
              {currentTeam.hackathon.tracks?.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#121218' }}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Git Repository URL *
              </label>
              <input
                type="text"
                disabled={deadlinePassed}
                placeholder="https://github.com/org/repo or github.com/..."
                className="input-field"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Live Demo / Video URL (Optional)
              </label>
              <input
                type="text"
                disabled={deadlinePassed}
                placeholder="https://demo.example.com, youtube.com/..., or loom.com/..."
                className="input-field"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Description with Markdown Write / Preview tabs */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Detailed Description & Architecture (Markdown Supported) *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('write')}
                  style={{
                    background: previewTab === 'write' ? 'var(--accent-primary)' : 'transparent',
                    color: 'white',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Edit Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  style={{
                    background: previewTab === 'preview' ? 'var(--accent-primary)' : 'transparent',
                    color: 'white',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Preview
                </button>
              </div>
            </div>

            {previewTab === 'write' ? (
              <textarea
                disabled={deadlinePassed}
                rows={10}
                placeholder="Describe your architecture, tools used, offline capabilities, problems solved, and setup instructions..."
                className="input-field"
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : (
              <div
                className="glass-panel"
                style={{
                  minHeight: '200px',
                  padding: '1.5rem',
                  background: 'rgba(0,0,0,0.3)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)'
                }}
              >
                {description.trim().length > 0 ? description : '(Nothing to preview)'}
              </div>
            )}
          </div>

          {!deadlinePassed && (
            <div className="flex justify-between items-center" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('DRAFT')}
                className="btn btn-secondary"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving Draft...' : 'Save Draft'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('SUBMITTED')}
                className="btn btn-primary"
                style={{ padding: '0.75rem 2rem', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Submitting...' : 'Submit Final Project →'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ProjectSubmitPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project submission pipeline...</p>
      </div>
    }>
      <ProjectSubmitContent />
    </Suspense>
  );
}
