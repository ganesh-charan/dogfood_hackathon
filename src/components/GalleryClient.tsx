'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GalleryProject {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  track?: { name: string } | null;
  team: {
    name: string;
    hackathon?: { name: string } | null;
    members?: Array<{ user: { name: string } }>;
  };
}

interface GalleryClientProps {
  initialProjects: GalleryProject[];
  initialVotingOpen?: boolean;
  hackathonId?: string;
}

export default function GalleryClient({
  initialProjects,
  initialVotingOpen = false,
  hackathonId
}: GalleryClientProps) {
  const [projects, setProjects] = useState<GalleryProject[]>(initialProjects);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [votingOpen] = useState<boolean>(initialVotingOpen);

  // Voting state
  const [votedProjects, setVotedProjects] = useState<Record<string, boolean>>({});
  const [votingLoading, setVotingLoading] = useState<Record<string, boolean>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Randomize cards using Fisher-Yates on initial client hydration to avoid ordering bias
  useEffect(() => {
    const shuffled = [...initialProjects];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setProjects(shuffled);
  }, [initialProjects]);

  // Load vote tallies if voting is closed (unmasked results)
  useEffect(() => {
    let isMounted = true;
    async function loadVoteTallies() {
      try {
        const url = hackathonId ? `/api/votes?hackathonId=${hackathonId}` : '/api/votes';
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data.success) {
          setIsMasked(data.masked);
          if (!data.masked && data.voteCounts) {
            setVoteCounts(data.voteCounts);
          }
        }
      } catch (err) {
        console.error('Error fetching vote tallies:', err);
      }
    }
    loadVoteTallies();
    return () => {
      isMounted = false;
    };
  }, [hackathonId]);

  const handleVote = async (projectId: string) => {
    if (!votingOpen) {
      setFeedback({ message: 'Community voting is currently closed.', type: 'error' });
      return;
    }

    if (votedProjects[projectId]) {
      setFeedback({ message: 'You have already voted for this project.', type: 'error' });
      return;
    }

    setVotingLoading((prev) => ({ ...prev, [projectId]: true }));
    setFeedback(null);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVotedProjects((prev) => ({ ...prev, [projectId]: true }));
        setFeedback({ message: data.message || 'Ballot verified and recorded!', type: 'success' });
      } else {
        setFeedback({ message: data.error || 'Failed to submit vote.', type: 'error' });
      }
    } catch {
      setFeedback({ message: 'Network error while casting vote.', type: 'error' });
    } finally {
      setVotingLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const trackSet = new Set<string>();
  initialProjects.forEach((p) => {
    if (p.track?.name) trackSet.add(p.track.name);
  });
  const tracks = Array.from(trackSet);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.team.name.toLowerCase().includes(search.toLowerCase());

    const matchesTrack = selectedTrack === 'all' || p.track?.name === selectedTrack;

    return matchesSearch && matchesTrack;
  });

  return (
    <div>
      {/* Toast Feedback Notification */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderColor: feedback.type === 'success' ? 'var(--accent-tertiary)' : 'var(--accent-error)',
            background:
              feedback.type === 'success'
                ? 'rgba(20, 184, 166, 0.15)'
                : 'rgba(239, 68, 68, 0.15)'
          }}
        >
          <span style={{ fontSize: '0.9rem', color: feedback.type === 'success' ? '#2dd4bf' : '#f87171' }}>
            {feedback.message}
          </span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Search and Track Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          marginBottom: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search projects by title, architecture keywords, or team name..."
              className="input-field"
              style={{ paddingLeft: '1rem', fontSize: '1rem', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.35rem 0.8rem',
                borderRadius: '9999px',
                background: votingOpen ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: votingOpen ? 'var(--accent-tertiary)' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: votingOpen ? 'var(--accent-tertiary)' : 'var(--text-muted)'
                }}
              />
              Community Voting: {votingOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.5rem' }}>
              TRACKS:
            </span>
            <button
              onClick={() => setSelectedTrack('all')}
              style={{
                background: selectedTrack === 'all' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: '1px solid var(--border-subtle)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              All Tracks ({projects.length})
            </button>
            {tracks.map((track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                style={{
                  background: selectedTrack === track ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.35rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {track}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2rem'
        }}
      >
        <AnimatePresence>
          {filteredProjects.map((project) => {
            const hasVoted = !!votedProjects[project.id];
            const isSubmittingVote = !!votingLoading[project.id];
            const projectVotes = voteCounts[project.id];

            return (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%'
                }}
              >
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: 'rgba(20, 184, 166, 0.2)',
                        color: 'var(--accent-tertiary)'
                      }}
                    >
                      {project.track?.name || 'General Track'}
                    </span>

                    {/* If results are unmasked (voting closed), show public tally */}
                    {!isMasked && typeof projectVotes === 'number' && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          color: '#c084fc'
                        }}
                      >
                        ⭐ {projectVotes} {projectVotes === 1 ? 'Vote' : 'Votes'}
                      </span>
                    )}

                    {project.team.hackathon && isMasked && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {project.team.hackathon.name}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{project.name}</h3>
                  <div style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Team: {project.team.name}
                  </div>

                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      marginBottom: '1.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Team Members */}
                  {project.team.members && project.team.members.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        TEAM ROSTER:
                      </div>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {project.team.members.map((m, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {m.user.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Links & Vote Button */}
                  <div className="flex flex-col gap-2" style={{ paddingTop: '0.5rem' }}>
                    <div className="flex gap-3">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'center' }}
                        >
                          Source Code
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.75rem', textAlign: 'center' }}
                        >
                          Live Demo
                        </a>
                      )}
                    </div>

                    {/* Community Vote Button */}
                    {votingOpen && (
                      <button
                        onClick={() => handleVote(project.id)}
                        disabled={hasVoted || isSubmittingVote}
                        className={hasVoted ? 'btn btn-secondary' : 'btn btn-primary'}
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.5rem 1rem',
                          background: hasVoted ? 'rgba(20, 184, 166, 0.2)' : undefined,
                          borderColor: hasVoted ? 'var(--accent-tertiary)' : undefined,
                          color: hasVoted ? 'var(--accent-tertiary)' : undefined,
                          cursor: hasVoted ? 'default' : 'pointer'
                        }}
                      >
                        {isSubmittingVote
                          ? 'Casting Ballot...'
                          : hasVoted
                          ? '✓ Voted'
                          : '★ Cast Community Vote'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
