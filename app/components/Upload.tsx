'use client';
import { useState, useEffect, useRef } from 'react';

/* ── Same TextGenerateEffect as page.tsx ─────────────────────────────── */
function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.12,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
}) {
  const wordsArray = words.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisibleCount(0);
    let index = 0;
    intervalRef.current = setInterval(() => {
      index += 1;
      setVisibleCount(index);
      if (index >= wordsArray.length) clearInterval(intervalRef.current!);
    }, staggerDelay * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [words]);

  return (
    <span className={className} style={{ display: 'inline' }}>
      {wordsArray.map((word, idx) => {
        const visible = idx < visibleCount;
        return (
          <span
            key={word + idx}
            style={{
              opacity: visible ? 1 : 0,
              filter: filter ? (visible ? 'blur(0px)' : 'blur(8px)') : 'none',
              transition: `opacity ${duration}s ease, filter ${duration}s ease`,
              display: 'inline-block',
              marginRight: '0.28em',
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

/* ── Inline grid — no corner brackets, no crosshair ─────────────────── */
function DropZoneGrid() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        borderRadius: '18px',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox="0 0 600 260"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="uploadGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(91,91,214,0.13)" strokeWidth="0.8"/>
        </pattern>
        <radialGradient id="uploadFade" cx="50%" cy="50%" r="58%">
          <stop offset="0%"   stopColor="white" stopOpacity="1"/>
          <stop offset="55%"  stopColor="white" stopOpacity="0.72"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="uploadMask">
          <rect width="600" height="260" fill="url(#uploadFade)"/>
        </mask>
      </defs>
      <rect width="600" height="260" fill="url(#uploadGrid)" mask="url(#uploadMask)"/>
    </svg>
  );
}

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
            words="Turn any PDF into"
            duration={0.4}
            staggerDelay={0.10}
          />
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <TextGenerateEffect
              words="smart flashcards"
              duration={0.4}
              staggerDelay={0.10}
            />
          </span>
        </h1>
        <p style={{
          color: 'rgba(26,26,46,0.5)',
          fontSize: '1.05rem',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}>
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
          position: 'relative',
          overflow: 'hidden',
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
        {/* Matrix grid — sits behind all content */}
        <DropZoneGrid />

        {/* All drop-zone content must be above the grid (z-index: 2) */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {loading ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
              </div>
              <p style={{ color: '#6366f1', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>
                Generating flashcards...
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
                <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
