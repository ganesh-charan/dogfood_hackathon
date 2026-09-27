'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CriteriaInput {
  name: string;
  weight: number;
  maxScore: number;
}

interface Rubric {
  id: string;
  name: string;
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    maxScore: number;
  }>;
}

interface Hackathon {
  id: string;
  name: string;
}

export default function RubricBuilderPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  // Form states
  const [rubricName, setRubricName] = useState('');
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [criteria, setCriteria] = useState<CriteriaInput[]>([
    { name: 'Functionality', weight: 40, maxScore: 5 },
    { name: 'Code Quality', weight: 30, maxScore: 5 },
    { name: 'Originality & UX', weight: 30, maxScore: 5 }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [rubricRes, eventRes] = await Promise.all([
        fetch('/api/rubrics'),
        fetch('/api/events')
      ]);
      const rubricData = await rubricRes.json();
      const eventData = await eventRes.json();

      if (rubricData.success) setRubrics(rubricData.rubrics || []);
      if (eventData.success && eventData.events) {
        setHackathons(eventData.events);
        if (eventData.events.length > 0 && !selectedHackathonId) {
          setSelectedHackathonId(eventData.events[0].id);
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
        const [rubricRes, eventRes] = await Promise.all([
          fetch('/api/rubrics'),
          fetch('/api/events')
        ]);
        const rubricData = await rubricRes.json();
        const eventData = await eventRes.json();

        if (isMounted) {
          if (rubricData.success) setRubrics(rubricData.rubrics || []);
          if (eventData.success && eventData.events) {
            setHackathons(eventData.events);
            if (eventData.events.length > 0 && !selectedHackathonId) {
              setSelectedHackathonId(eventData.events[0].id);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [selectedHackathonId]);

  const handleAddCriteria = () => {
    setCriteria([...criteria, { name: '', weight: 10, maxScore: 5 }]);
  };

  const handleRemoveCriteria = (index: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, field: keyof CriteriaInput, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const currentTotalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Math.abs(currentTotalWeight - 100) > 0.1) {
      setError(`Weights must sum to exactly 100%. Current sum: ${currentTotalWeight}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: selectedHackathonId,
          name: rubricName,
          criteria: criteria.map((c) => ({
            name: c.name,
            weight: c.weight / 100,
            maxScore: c.maxScore
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create rubric');
        setSaving(false);
        return;
      }

      setSuccess('✓ Scoring rubric created and locked into place!');
      setRubricName('');
      await loadData();
    } catch {
      setError('Network communication failure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem', maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Rubric Builder</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure weighted scoring criteria summing to 100% to govern judge evaluations.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(20, 184, 166, 0.2)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Active Rubrics View */}
      {rubrics.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Rubrics</h3>
          <div className="flex flex-col gap-4">
            {rubrics.map((r) => (
              <div key={r.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{r.name}</h4>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent-tertiary)', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {r.criteria.map((c) => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>: {(c.weight * 100).toFixed(0)}% (Max {c.maxScore})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Rubric Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          Configure New Rubric
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Select Hackathon Event *
            </label>
            <select
              className="input-field"
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id} style={{ background: '#121218' }}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Rubric Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Evaluation Matrix"
              className="input-field"
              value={rubricName}
              onChange={(e) => setRubricName(e.target.value)}
            />
          </div>

          {/* Criteria Inputs */}
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>Scoring Criteria & Weights</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Assign percentage weights to each criterion. Total must equal 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCriteria}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                + Add Criterion
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {criteria.map((c, idx) => (
                <div key={idx} className="flex gap-3 items-center" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="text"
                    required
                    placeholder="Criterion Name (e.g. Code Quality)"
                    className="input-field"
                    style={{ flex: 3 }}
                    value={c.name}
                    onChange={(e) => handleCriteriaChange(idx, 'name', e.target.value)}
                  />
                  <div style={{ flex: 1.5, position: 'relative' }}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      placeholder="Weight %"
                      className="input-field"
                      value={c.weight}
                      onChange={(e) => handleCriteriaChange(idx, 'weight', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ flex: 1.5 }}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      placeholder="Max Score"
                      className="input-field"
                      value={c.maxScore}
                      onChange={(e) => handleCriteriaChange(idx, 'maxScore', Number(e.target.value))}
                    />
                  </div>
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Weight Bar */}
            <div
              className="flex justify-between items-center"
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: currentTotalWeight === 100 ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)',
                border: currentTotalWeight === 100 ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(239,68,68,0.3)'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Weight Allocation:</span>
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: currentTotalWeight === 100 ? 'var(--accent-tertiary)' : '#ef4444'
                }}
              >
                {currentTotalWeight}% / 100%
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || currentTotalWeight !== 100}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: saving || currentTotalWeight !== 100 ? 0.6 : 1 }}
          >
            {saving ? 'Saving Rubric...' : 'Save & Deploy Rubric'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
