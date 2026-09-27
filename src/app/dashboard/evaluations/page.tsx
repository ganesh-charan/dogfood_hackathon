'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Criteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  track?: { name: string };
  team: { name: string };
}

interface EvaluationScore {
  criteriaId: string;
  score: number;
  criteria: Criteria;
}

interface Evaluation {
  id: string;
  judge?: { id: string; name: string };
  projectId: string;
  project: Project;
  totalScore: number;
  normalizedScore: number | null;
  comment: string | null;
  completed: boolean;
  scores: EvaluationScore[];
}

interface Rubric {
  id: string;
  name: string;
  criteria: Criteria[];
}

export default function EvaluationsDashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

  // Scoring form state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Normalization / Admin action state
  const [normalizing, setNormalizing] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch('/api/evaluations');
      const data = await res.json();
      if (data.success) {
        setEvaluations(data.evaluations || []);
        if (data.rubrics) setRubrics(data.rubrics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res = await fetch('/api/evaluations');
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setEvaluations(data.evaluations || []);
            if (data.rubrics) setRubrics(data.rubrics);
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
  }, []);

  const openEvaluationModal = (ev: Evaluation) => {
    setSelectedEval(ev);
    setMessage('');
    setError('');
    setComment(ev.comment || '');

    // Initialize scores
    const initialScores: Record<string, number> = {};
    if (ev.scores && ev.scores.length > 0) {
      ev.scores.forEach((s) => {
        initialScores[s.criteriaId] = s.score;
      });
    } else if (rubrics.length > 0 && rubrics[0].criteria) {
      rubrics[0].criteria.forEach((c) => {
        initialScores[c.id] = 3; // Default middle score
      });
    }
    setScores(initialScores);
  };

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const calculateLiveTotal = () => {
    if (!rubrics.length || !rubrics[0].criteria) return 0;
    let sum = 0;
    rubrics[0].criteria.forEach((c) => {
      const s = scores[c.id] || 0;
      sum += s * c.weight;
    });
    return sum.toFixed(2);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEval) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: selectedEval.id,
          scores,
          comment
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit score');
        setSubmitting(false);
        return;
      }

      setMessage('✓ Evaluation submitted successfully!');
      setTimeout(() => {
        setSelectedEval(null);
        loadData();
      }, 1200);
    } catch {
      setError('Network communication failure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNormalize = async () => {
    setNormalizing(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/evaluations/normalize', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ ${data.message}`);
        await loadData();
      } else {
        setError(data.error || 'Failed to run normalization');
      }
    } catch {
      setError('Network error running normalization');
    } finally {
      setNormalizing(false);
    }
  };

  const completedCount = evaluations.filter((e) => e.completed).length;
  const progressPercent = evaluations.length > 0 ? Math.round((completedCount / evaluations.length) * 100) : 0;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Evaluation Queue</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review assigned hackathon projects, score weighted criteria, and submit calibrated feedback.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNormalize}
            disabled={normalizing}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            {normalizing ? 'Calibrating Z-Scores...' : 'Run Z-Score Normalization'}
          </button>
          <a
            href="/api/export.csv"
            download
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            Export CSV Report
          </a>
        </div>
      </div>

      {message && (
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
          {message}
        </div>
      )}

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

      {/* Progress Telemetry Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Review Progress</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {completedCount} / {evaluations.length} Completed ({progressPercent}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Evaluations List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading evaluation queue...
        </div>
      ) : evaluations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Evaluations In Queue</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your reviewer queue is empty or assignments have not been distributed yet by an organizer.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {evaluations.map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
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
                      background: ev.completed ? 'rgba(20, 184, 166, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      color: ev.completed ? 'var(--accent-tertiary)' : '#eab308'
                    }}
                  >
                    {ev.completed ? 'COMPLETED' : 'PENDING EVALUATION'}
                  </span>

                  {ev.project.track && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ev.project.track.name}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{ev.project.name}</h3>
                <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Team: {ev.project.team.name}
                </div>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    marginBottom: '1.5rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {ev.project.description}
                </p>

                {ev.completed && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>RAW TOTAL SCORE:</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{ev.totalScore.toFixed(2)} / 5.0</strong>
                    </div>
                    {ev.normalizedScore !== null && (
                      <div className="flex justify-between items-center" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>NORMALIZED SCORE:</span>
                        <strong style={{ color: 'var(--accent-tertiary)' }}>{ev.normalizedScore.toFixed(1)} / 100</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  {ev.project.repoUrl && (
                    <a href={ev.project.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-tertiary)' }}>
                      ⌥ Git Repo
                    </a>
                  )}
                  {ev.project.demoUrl && (
                    <a href={ev.project.demoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>
                      ▶ Live Demo
                    </a>
                  )}
                </div>

                <button
                  onClick={() => openEvaluationModal(ev)}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.875rem' }}
                >
                  {ev.completed ? 'Edit Evaluation' : 'Score Project →'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Evaluation Scoring Modal */}
      {selectedEval && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}
          >
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Scoring Rubric
                </span>
                <h2 style={{ fontSize: '1.5rem' }}>{selectedEval.project.name}</h2>
              </div>
              <button
                onClick={() => setSelectedEval(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitScore} className="flex flex-col gap-5">
              {rubrics.length > 0 && rubrics[0].criteria.map((crit) => (
                <div key={crit.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(25,25,35,0.4)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{crit.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        (Weight: {(crit.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {scores[crit.id] || 3} / {crit.maxScore}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={crit.maxScore}
                    step={1}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    value={scores[crit.id] || 3}
                    onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                  />
                </div>
              ))}

              <div className="flex justify-between items-center" style={{ padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <span style={{ fontWeight: 600 }}>Total Weighted Raw Score:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {calculateLiveTotal()} / 5.0
                </span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Feedback & Evaluation Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes on code quality, architecture strengths, demo validation..."
                  className="input-field"
                  style={{ resize: 'vertical' }}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEval(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Saving Evaluation...' : 'Finalize & Submit Score'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
