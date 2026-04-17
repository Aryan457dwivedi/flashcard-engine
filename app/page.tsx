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
  duration?: number;
  stagger?: number;
};

function TextGenerateEffect({ words, duration = 0.5, stagger = 0.12 }: TGEProps) {
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
    <div style={{ display: 'inline' }}>
      {wordsArray.map((word, idx) => {
        const shown = idx < visibleCount;
        return (
          <span
            key={word + idx}
            style={{
              display: 'inline-block',
              opacity: shown ? 1 : 0,
              filter: shown ? 'blur(0px)' : 'blur(8px)',
              transition: `opacity ${duration}s ease, filter ${duration}s ease`,
              marginRight: '0.28em',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
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
    <>
      <style>{`
        @keyframes grad-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes subtle-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        .hero-gradient-text {
          background: linear-gradient(
            115deg,
            #7c6aff 0%,
            #a78bfa 18%,
            #c4b5fd 32%,
            #818cf8 46%,
            #6366f1 58%,
            #a78bfa 72%,
            #c084fc 84%,
            #7c6aff 100%
          );
          background-size: 280% 280%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: grad-shift 6s ease infinite;
        }
        .upload-box {
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .upload-box:hover {
          border-color: rgba(99,102,241,0.4) !important;
          box-shadow: 0 4px 32px rgba(99,102,241,0.1), 0 0 0 4px rgba(99,102,241,0.04);
        }
        .upload-icon-wrap {
          animation: subtle-float 3.5s ease-in-out infinite;
        }
        .feature-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.1);
        }
      `}</style>

      <div className="fade-up">

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>

          {/* Main heading — line 1 plain, line 2 animated gradient */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
            fontWeight: '800',
            lineHeight: '1.08',
            letterSpacing: '-1.5px',
            marginBottom: '1.4rem',
            color: '#1a1a2e',
          }}>
            Turn any PDF into<br />
            <span className="hero-gradient-text">
              <TextGenerateEffect words="smart flashcards" stagger={0.18} duration={0.55} />
            </span>
          </h1>

          <p style={{
            color: 'rgba(26,26,46,0.48)',
            fontSize: '1.05rem',
            maxWidth: '460px',
            margin: '0 auto',
            lineHeight: '1.7',
            fontWeight: '400',
          }}>
            Upload your notes, textbooks, or study material. Get back a complete deck ready to practice with spaced repetition.
          </p>
        </div>

        {/* Upload Box */}
        <div
          className="upload-box"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !loading && document.getElementById('fileInput')?.click()}
          style={{
            position: 'relative',
            border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.22)'}`,
            borderRadius: '22px',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: loading ? 'default' : 'pointer',
            background: dragging
              ? 'rgba(99,102,241,0.05)'
              : 'rgba(255,255,255,0.62)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            boxShadow: dragging
              ? '0 0 0 4px rgba(99,102,241,0.08), 0 8px 40px rgba(99,102,241,0.12)'
              : '0 2px 20px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(8px)',
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
              <p style={{ color: 'rgba(26,26,46,0.38)', fontSize: '0.875rem' }}>
                This usually takes 20–30 seconds
              </p>
            </div>
          ) : (
            <div>
              <div className="upload-icon-wrap" style={{
                width: '60px', height: '60px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.13) 0%, rgba(167,139,250,0.10) 100%)',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 4px 16px rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.14)',
              }}>
                <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ color: '#1a1a2e', fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                Drop your PDF here
              </p>
              <p style={{ color: 'rgba(26,26,46,0.38)', fontSize: '0.875rem' }}>
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
            ['✦', 'Smart Extraction', 'Gemini AI identifies key concepts, definitions, and relationships from your material.'],
            ['⟳', 'Spaced Repetition', 'The SM-2 algorithm surfaces hard cards more often so you learn faster.'],
            ['◎', 'Track Mastery', 'See exactly what you know, what needs work, and what is coming up for review.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="feature-card" style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(99,102,241,0.11)',
              borderRadius: '16px',
              padding: '1.35rem',
              boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{
                fontSize: '1rem',
                marginBottom: '0.6rem',
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
              }}>
                {icon}
              </div>
              <p style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.45rem', color: '#1a1a2e' }}>
                {title}
              </p>
              <p style={{ color: 'rgba(26,26,46,0.42)', fontSize: '0.78rem', lineHeight: '1.6' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
