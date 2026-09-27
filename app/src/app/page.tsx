'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import ThreeScene to avoid SSR issues with Three.js
const ThreeScene = dynamic(() => import('../components/ThreeScene'), { ssr: false });

export default function Home() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <ThreeScene />
      
      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '15vh' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ 
              display: 'inline-block',
              padding: '0.5rem 1rem', 
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '2rem'
            }}
          >
            DOG FOOD HACKATHON 2026
          </motion.div>
          
          <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>
            Build the Future.<br/>
            <span className="text-gradient">Together.</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            The definitive open-source, self-hostable hackathon submission and judging platform. Experience the next generation of builder events.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/hackathons" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Explore Events
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Organizer Login
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}
        >
          {[
            { title: 'Participant Portal', desc: 'Form teams, submit projects, and compete on a global scale.' },
            { title: 'Intelligent Judging', desc: 'Advanced rubrics, score normalization, and automated role isolation.' },
            { title: '100% Self-Hostable', desc: 'Run the entire platform entirely offline via Docker Compose.' }
          ].map((feature, idx) => (
            <motion.div 
              key={idx} 
              className="glass-panel"
              whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(99,102,241,0.3)' }}
              style={{ padding: '2rem' }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
