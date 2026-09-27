'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Track {
  name: string;
}

interface Hackathon {
  id: string;
  name: string;
  endDate: string;
}

interface Team {
  id: string;
  name: string;
  hackathon: Hackathon;
}

interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  status: string;
  track?: Track;
  team: Team;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Project Portfolio</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track project submission states, deadlines, and git repository linkages.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/gallery" className="btn btn-secondary">
            Public Gallery
          </Link>
          <Link href="/dashboard/projects/submit" className="btn btn-primary">
            + Edit / New Submission
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading project telemetry...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Submissions Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            You haven&apos;t initiated any project submission yet. Ensure you are part of a team and draft your submission.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard/teams" className="btn btn-secondary">
              View Teams
            </Link>
            <Link href="/dashboard/projects/submit" className="btn btn-primary">
              Draft Project
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {projects.map((proj) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel"
              style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: proj.status === 'SUBMITTED' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: proj.status === 'SUBMITTED' ? 'var(--accent-tertiary)' : '#eab308'
                      }}
                    >
                      {proj.status}
                    </span>
                    {proj.team.hackathon && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {proj.team.hackathon.name}
                      </span>
                    )}
                  </div>

                  {proj.track && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {proj.track.name}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{proj.name}</h3>
                <p style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Team: {proj.team.name}
                </p>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {proj.description}
                </p>
              </div>

              <div>
                <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-tertiary)' }}>
                      ⌥ Repository Link
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a href={proj.demoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>
                      ▶ Live Demo
                    </a>
                  )}
                </div>

                <Link href={`/dashboard/projects/submit?teamId=${proj.team.id}`} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                  Edit Submission
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
