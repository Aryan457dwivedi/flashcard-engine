'use client';
import { useState, useEffect, useRef } from 'react';

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

// ── TextGenerateEffect ──────────────────────────────────────────
type TGEProps = {
  words: string;
  filter?: boolean;
  duration?: number;
  stagger?: number;
};

function TextGenerateEffect({ words, filter = true, duration = 0.5, stagger = 0.2 }: TGEProps) {
  const wordsArray = words.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setVisibleCount(0);
    wordsArray.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setVisibleCount((c) => Math.max(c, i + 1));
      }, i * stagger * 1000);
      timers.current.push(t);
    });
    return () => { timers.current.forEach((t) => window.clearTimeout(t)); };
  }, [words, stagger]);

  return (
    <>
      {wordsArray.map((word, idx) => {
        const shown = idx < visibleCount;
        return (
          <span
            key={word + idx}
            style={{
              display: 'inline-block',
              opacity: shown ? 1 : 0,
              filter: filter ? (shown ? 'blur(0px)' : 'blur(10px)') : 'none',
              transition: `opacity ${duration}s ease, filter ${duration}s ease`,
              marginRight: '0.28em',
            }}
          >
            {word}
          </span>
        );
      })}
    </>
  );
}

// ── Upload ──────────────────────────────────────────────────────
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
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fade-up">

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: '1.25rem',
          color: '#1a1a2e',
        }}>
          <TextGenerateEffect
            words="Turn any PDF into smart flashcards"
            stagger={0.12}
            duration={0.5}
          />
        </h1>

        <p style={{
          color: 'rgba(26,26,46,0.5)',
          fontSize: '1.05rem',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}>
          <TextGenerateEffect
            words="Upload your notes, textbooks, or study material. Get back a complete deck ready to practice with spaced repetition."
            stagger={0.04}
            duration={0.4}
          />
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !loading && document.getElementById('fileInput')?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.2s',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {loading ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div className="spinner" style={{ width: '36px', height: '36px' }} />
            </div>
            <p style={{ color: '#6366f1', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>
              Generating flashcards…
            </p>
            <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>
              This usually takes 20–30 seconds
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              width: '56px', height: '56px',
              background: 'rgba(99,102,241,0.1)',
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
            <p style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem' }}>
              Drop your PDF here
            </p>
            <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>
              or click to browse files
            </p>
          </div>
        )}
      </div>

      <input
        id="fileInput"
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {error && (
        <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {error}
        </p>
      )}

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        {[
          ['Smart Extraction', 'Gemini AI identifies key concepts, definitions, and relationships from your material.'],
          ['Spaced Repetition', 'The SM-2 algorithm surfaces hard cards more often so you learn faster.'],
          ['Track Mastery', 'See exactly what you know, what needs work, and what is coming up for review.'],
        ].map(([title, desc]) => (
          <div key={title} style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1a1a2e' }}>
              {title}
            </p>
            <p style={{ color: 'rgba(26,26,46,0.45)', fontSize: '0.8rem', lineHeight: '1.5' }}>
              {desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
