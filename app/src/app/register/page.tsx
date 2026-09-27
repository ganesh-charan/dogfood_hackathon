'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PARTICIPANT');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <Link href="/" className="btn btn-secondary">← Back Home</Link>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel"
        style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Join the hackathon platform</p>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="Jane Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Password</label>
            <input 
              type="password" 
              required
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>I am joining as</label>
            <select 
              className="input-field" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ appearance: 'none', backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <option value="PARTICIPANT">Participant</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="JUDGE">Judge</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            Sign Up
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
