'use client';
import { useState } from 'react';

interface Card {
  question: string;
  answer: string;
  ease: number;
  interval: number;
  reps: number;
}

interface Deck {
  id: number;
  name: string;
  cards: Card[];
  created: string;
}

export default function Upload({ onDeckCreated }: { onDeckCreated: (deck: Deck) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onDeckCreated({
        id: Date.now(),
        name: file.name.replace('.pdf', ''),
        cards: data.cards,
        created: new Date().toLocaleDateString(),
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fade-up">

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '100px',
          padding: '0.4rem 1.1rem',
          fontSize: '0.8rem',
          color: '#818cf8',
          fontWeight: '500',
          letterSpacing: '0.5px',
          marginBottom: '1.5rem',
          textTransform: 'uppercase'
        }}>
          AI-Powered Study Tool
        </div>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: '1.25rem',
          color: '#ffffff'
        }}>
          Turn any PDF into<br />
          <span style={{
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            smart flashcards
          </span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
          Upload your notes, textbooks, or study material. Get back a complete deck ready to practice with spaced repetition.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !loading && document.getElementById('fileInput')?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          background: dragging ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
          maxWidth: '600px',
          margin: '0 auto 2rem',
        }}
      >
        {loading ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
            </div>
            <p style={{ color: '#818cf8', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>Generating flashcards...</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>This usually takes 20–30 seconds</p>
          </div>
        ) : (
          <div>
            <div style={{
              width: '56px', height: '56px',
              background: 'rgba(99,102,241,0.12)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={{ color: '#ffffff', fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem' }}>Drop your PDF here</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>or click to browse files</p>
          </div>
        )}
      </div>

      <input id="fileInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

      {error && (
        <p style={{ textAlign: 'center', color: '#f87171', fontSize: '0.875rem', marginBottom: '2rem' }}>{error}</p>
      )}

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
        {[
          ['Smart Extraction', 'Gemini AI identifies key concepts, definitions, and relationships from your material.'],
          ['Spaced Repetition', 'The SM-2 algorithm surfaces hard cards more often so you learn faster.'],
          ['Track Mastery', 'See exactly what you know, what needs work, and what is coming up for review.'],
        ].map(([title, desc]) => (
          <div key={title} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}>
            <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#fff' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: '1.5' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}