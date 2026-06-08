'use client';
import React, { useState, useEffect, useRef } from 'react';

function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.12,
  gradientStyle,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  gradientStyle?: React.CSSProperties;
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
              ...(gradientStyle ?? {}),
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

function DropZoneGrid(): React.ReactElement {
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
          <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(91,91,214,0.12)" strokeWidth="0.8"/>
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

/* ── iOS 26 Liquid Glass card + comet tilt ───────────────────────────── */
function CometFeatureCard({ title, desc }: { title: string; desc: string }): React.ReactElement {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rimRef   = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number | null>(null);

  const state = useRef({
    rX: 0, rY: 0, tX: 0, tY: 0, gX: 50, gY: 50, sc: 1,
    tRX: 0, tRY: 0, tTX: 0, tTY: 0, tGX: 50, tGY: 50, tSc: 1,
  });

  const ROTATE   = 18;
  const TRANSLATE = 9;

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

  function tick() {
    const s  = state.current;
    const sp = 0.16;
    s.rX = lerp(s.rX, s.tRX, sp); s.rY = lerp(s.rY, s.tRY, sp);
    s.tX = lerp(s.tX, s.tTX, sp); s.tY = lerp(s.tY, s.tTY, sp);
    s.gX = lerp(s.gX, s.tGX, sp); s.gY = lerp(s.gY, s.tGY, sp);
    s.sc = lerp(s.sc, s.tSc, sp);

    if (cardRef.current) {
      cardRef.current.style.transform =
        `rotateX(${s.rX.toFixed(3)}deg) rotateY(${s.rY.toFixed(3)}deg) ` +
        `translateX(${s.tX.toFixed(2)}px) translateY(${s.tY.toFixed(2)}px) ` +
        `scale(${s.sc.toFixed(4)})`;

      /* Shadow shifts with tilt to fake a real light source */
      const sx = (s.rY *  0.7).toFixed(1);
      const sy = (s.rX * -0.7).toFixed(1);
      cardRef.current.style.boxShadow = `
        0 1.5px 0 0 rgba(255,255,255,0.82) inset,
        0 -1px 0 0 rgba(0,0,0,0.10) inset,
        1px 0 0 0 rgba(255,255,255,0.40) inset,
        -1px 0 0 0 rgba(0,0,0,0.04) inset,
        ${sx}px ${sy}px 48px rgba(99,102,241,0.16),
        0 12px 40px rgba(0,0,0,0.12),
        0 2px 8px rgba(0,0,0,0.08)
      `;
    }

    /* Glare blob follows pointer */
    if (glareRef.current) {
      glareRef.current.style.background =
        `radial-gradient(ellipse 70% 55% at ${s.gX.toFixed(1)}% ${s.gY.toFixed(1)}%, ` +
        `rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.10) 50%, transparent 75%)`;
    }

    /* Top specular rim shifts slightly with tilt */
    if (rimRef.current) {
      const rimShift = (s.rY * 0.3).toFixed(1);
      rimRef.current.style.left  = `${8  + parseFloat(rimShift)}%`;
      rimRef.current.style.right = `${8  - parseFloat(rimShift)}%`;
    }

    const done =
      Math.abs(s.rX - s.tRX) < 0.02 && Math.abs(s.rY - s.tRY) < 0.02 &&
      Math.abs(s.tX - s.tTX) < 0.1  && Math.abs(s.tY - s.tTY) < 0.1 &&
      Math.abs(s.sc - s.tSc) < 0.001;

    rafRef.current = done ? null : requestAnimationFrame(tick);
  }

  function go() { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const xp = (e.clientX - r.left)  / r.width  - 0.5;
    const yp = (e.clientY - r.top)   / r.height - 0.5;
    const s  = state.current;
    s.tRX = yp * -ROTATE;  s.tRY = xp * ROTATE;
    s.tTX = xp * -TRANSLATE; s.tTY = yp * TRANSLATE;
    s.tGX = (xp + 0.5) * 100; s.tGY = (yp + 0.5) * 100;
    s.tSc = 1.055;
    go();
  }

  function onMouseLeave() {
    const s  = state.current;
    s.tRX = 0; s.tRY = 0; s.tTX = 0; s.tTY = 0;
    s.tGX = 50; s.tGY = 50; s.tSc = 1;
    go();
  }

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    /* perspective wrapper — must NOT stretch height */
    <div ref={wrapRef} style={{ perspective: '900px', height: '100%' }}>
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'relative',
          height: '100%',
          borderRadius: '18px',
          padding: '1.25rem',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          cursor: 'default',
          /* Glass base */
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(32px) saturate(2.2) brightness(1.08)',
          WebkitBackdropFilter: 'blur(32px) saturate(2.2) brightness(1.08)',
          /* Hair-line border simulating the glass edge */
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: `
            0 1.5px 0 0 rgba(255,255,255,0.82) inset,
            0 -1px 0 0 rgba(0,0,0,0.10) inset,
            1px 0 0 0 rgba(255,255,255,0.40) inset,
            -1px 0 0 0 rgba(0,0,0,0.04) inset,
            0 12px 40px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.08)
          `,
        }}
      >
        {/* Top specular rim — key to the "liquid" look */}
        <div
          ref={rimRef}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: '1px',
            left: '8%',
            right: '8%',
            height: '1px',
            borderRadius: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 70%, transparent 100%)',
            zIndex: 14,
          }}
        />

        {/* Bottom shadow rim */}
        <div style={{
          pointerEvents: 'none',
          position: 'absolute',
          bottom: '1px',
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0.12) 70%, transparent)',
          zIndex: 14,
        }} />

        {/* Left edge glint */}
        <div style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          left: '1px',
          width: '1px',
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.65) 35%, rgba(255,255,255,0.65) 65%, transparent)',
          zIndex: 14,
        }} />

        {/* Comet glare — pointer-driven */}
        <div
          ref={glareRef}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            borderRadius: '18px',
            zIndex: 13,
            mixBlendMode: 'overlay',
            opacity: 0.9,
            background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Micro noise — the frosted texture */}
        <div style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: '18px',
          zIndex: 12,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }} />

        {/* Content */}
        <p style={{
          fontWeight: 650,
          fontSize: '0.875rem',
          marginBottom: '0.45rem',
          color: 'rgba(12,12,30,0.90)',
          position: 'relative',
          zIndex: 15,
          letterSpacing: '-0.015em',
        }}>
          {title}
        </p>
        <p style={{
          color: 'rgba(12,12,30,0.50)',
          fontSize: '0.79rem',
          lineHeight: '1.58',
          position: 'relative',
          zIndex: 15,
        }}>
          {desc}
        </p>
      </div>
    </div>
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

interface UploadedFile {
  name: string;
  sizeMB: string;
  type: string;
  modified: string;
  file: File;
}

export default function Upload({ onDeckCreated }: { onDeckCreated: (deck: Deck) => void }) {
  const [dragging, setDragging]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const processFile = (file: File) => {
    const sizeMB   = (file.size / (1024 * 1024)).toFixed(2);
    const modified = new Date(file.lastModified).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const type = file.type || 'unknown';
    setUploadedFiles(prev => [...prev, { name: file.name, sizeMB, type, modified, file }]);
  };

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    processFile(file);
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res  = await fetch('/api/generate', { method: 'POST', body: formData });
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
      <style>{`
        @keyframes hero-gradient-in {
          0%   { opacity: 0; filter: blur(8px); }
          100% { opacity: 1; filter: blur(0px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .drop-zone-outer {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          max-width: 600px;
          margin: 0 auto 2rem;
        }
        .drop-zone-outer:hover,
        .drop-zone-outer.drag-active {
          border-color: #6366f1 !important;
          background: rgba(99,102,241,0.04) !important;
          box-shadow: 0 6px 32px rgba(99,102,241,0.12) !important;
        }
        .drop-zone-outer:hover .icon-card,
        .drop-zone-outer.drag-active .icon-card {
          box-shadow: 0 22px 55px rgba(0,0,0,0.18);
          transform: translate(14px, -14px);
        }
        .drop-zone-outer:hover .dashed-overlay,
        .drop-zone-outer.drag-active .dashed-overlay { opacity: 1; }
        .icon-card {
          width: 72px; height: 72px;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.10);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s cubic-bezier(0.22,1,0.36,1);
          position: relative; z-index: 2;
        }
        .dashed-overlay {
          position: absolute; inset: 0;
          border: 1.5px dashed #38bdf8;
          border-radius: 14px;
          opacity: 0;
          transition: opacity 0.35s ease;
          z-index: 1;
          pointer-events: none;
        }
        .file-card {
          background: #fff;
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1);
          text-align: left;
        }
        /* equal-height grid */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 1fr;
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
          align-items: stretch;
        }
      `}</style>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: '1.25rem',
          color: '#fff',
        }}>
          <TextGenerateEffect words=".pdf to Smart Flashcards" duration={0.4} staggerDelay={0.10} />
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            animation: 'hero-gradient-in 0.8s ease 0.8s forwards',
            opacity: 0,
          }}>
            For faster, better learning
          </span>
        </h1>
        <p style={{
          color: 'rgba(180,180,190,0.75)',
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
        className={`drop-zone-outer${dragging ? ' drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !loading && document.getElementById('fileInput')?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.25)'}`,
          background: dragging ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.85)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        <DropZoneGrid />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {loading ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div className="spinner" style={{ width: '36px', height: '36px' }} />
              </div>
              <p style={{ color: '#6366f1', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>Generating flashcards...</p>
              <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>This usually takes 5–10 seconds</p>
            </>
          ) : (
            <>
              {uploadedFiles.length === 0 && (
                <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 1.25rem' }}>
                  <div className="icon-card">
                    {dragging ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#6366f1', fontSize: '11px', fontWeight: 600 }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Drop it</span>
                      </div>
                    ) : (
                      <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    )}
                  </div>
                  <div className="dashed-overlay" />
                </div>
              )}
              {uploadedFiles.length === 0 ? (
                <>
                  <p style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '1rem', marginBottom: '4px' }}>Drop your PDF here</p>
                  <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>or click to browse files</p>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="file-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{f.sizeMB} MB</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'rgba(26,26,46,0.4)' }}>
                        <span style={{ background: '#f5f5f5', borderRadius: '4px', padding: '2px 7px', fontFamily: 'monospace', fontSize: '11px', color: '#525252' }}>{f.type}</span>
                        <span>modified {f.modified}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <input
        id="fileInput" type="file" accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {error && (
        <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginBottom: '2rem' }}>{error}</p>
      )}

      {/* Feature Cards */}
      <div className="feature-grid">
        {[
          ['Smart Extraction', 'Automatically extracts key concepts, definitions, and relationships to simplify learning.'],
          ['Spaced Repetition', 'The SM-2 algorithm surfaces hard cards more often so you learn faster.'],
          ['Track Mastery', 'See exactly what you know, what needs work, and what is coming up for review.'],
        ].map(([title, desc]) => (
          <CometFeatureCard key={title} title={title!} desc={desc!} />
        ))}
      </div>

    </div>
  );
}
