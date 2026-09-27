'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TrackInput {
  name: string;
  description: string;
}

interface PrizeInput {
  name: string;
  description: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [tracks, setTracks] = useState<TrackInput[]>([
    { name: 'Agentic Workflows', description: 'Autonomous multi-agent orchestration and tool use.' },
    { name: 'Developer Tooling', description: 'Developer productivity, CLI, and offline utilities.' }
  ]);

  const [prizes, setPrizes] = useState<PrizeInput[]>([
    { name: '1st Grand Prize', description: '$10,000 Cash + Cloud Credits' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddTrack = () => {
    setTracks([...tracks, { name: '', description: '' }]);
  };

  const handleRemoveTrack = (index: number) => {
    if (tracks.length <= 1) return;
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: keyof TrackInput, value: string) => {
    const updated = [...tracks];
    updated[index][field] = value;
    setTracks(updated);
  };

  const handleAddPrize = () => {
    setPrizes([...prizes, { name: '', description: '' }]);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handlePrizeChange = (index: number, field: keyof PrizeInput, value: string) => {
    const updated = [...prizes];
    updated[index][field] = value;
    setPrizes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          tracks,
          prizes: prizes.filter((p) => p.name.trim().length > 0)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create hackathon event');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel"
        style={{ padding: '2.5rem' }}
      >
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create New Hackathon</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Configure competition schedules, tracks, prizes, and submission deadlines.
          </p>
        </div>

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
            ✓ Hackathon provisioned successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Hackathon Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dog Food Hackathon 2026"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Event Description & Theme *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the hackathon objectives, expectations, and evaluation context..."
              className="input-field"
              style={{ resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Start Date & Time (UTC) *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Hard Submission Deadline (UTC) *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Tracks Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Competition Tracks</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Define categories under which participants submit projects.
                </p>
              </div>
              <button type="button" onClick={handleAddTrack} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                + Add Track
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {tracks.map((track, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(25, 25, 35, 0.4)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      TRACK #{idx + 1}
                    </span>
                    {tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Track Title (e.g. AI & Automation)"
                      className="input-field"
                      value={track.name}
                      onChange={(e) => handleTrackChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Track Focus & Criteria Description"
                      className="input-field"
                      value={track.description}
                      onChange={(e) => handleTrackChange(idx, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prizes Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Prizes & Bounties</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Configure awards, cash pools, and sponsor bounties.
                </p>
              </div>
              <button type="button" onClick={handleAddPrize} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                + Add Prize
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {prizes.map((prize, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(25, 25, 35, 0.4)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      PRIZE #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrize(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Prize Title (e.g. 1st Place Overall)"
                      className="input-field"
                      value={prize.name}
                      onChange={(e) => handlePrizeChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Prize Reward Details (e.g. $5,000 + Trophy)"
                      className="input-field"
                      value={prize.description}
                      onChange={(e) => handlePrizeChange(idx, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating Hackathon Event...' : 'Deploy Hackathon Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
