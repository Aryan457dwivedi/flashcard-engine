'use client';
import { useState, useEffect, useRef } from 'react';
import Upload from './components/Upload';
import Decks from './components/Decks';
import Practice from './components/Practice';
import Dashboard from './components/Dashboard';

/* ── TextGenerateEffect (no external deps) ───────────────────────────── */
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

const NAV_ITEMS: { screen: string; label: string }[] = [
  { screen: 'home',      label: 'Upload'   },
  { screen: 'decks',     label: 'Library'  },
  { screen: 'practice',  label: 'Practice' },
  { screen: 'dashboard', label: 'Stats'    },
];

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const practiceFinishRef = useRef<(() => void) | null>(null);

  const addDeck = (deck: Deck) => {
    setDecks(prev => [...prev, deck]);
    setScreen('decks');
  };

  const updateDeck = (updatedDeck: Deck) => {
    setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
    setActiveDeck(prev => prev?.id === updatedDeck.id ? updatedDeck : prev);
  };

  const startPractice = (deck: Deck) => {
    setActiveDeck(deck);
    setScreen('practice');
  };

  const handleNavClick = (s: string) => {
    if (s === 'practice' && !activeDeck) return;
    if (screen === 'practice' && s !== 'practice' && practiceFinishRef.current) {
      practiceFinishRef.current();
    }
    setScreen(s);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: dark; }

        @keyframes shimmer-x {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes hero-pan {
          0%, 100% { background-position: 50% 100%; }
          50%      { background-position: 50% 90%; }
        }
        @keyframes blob-drift-a {
          0%   { transform: translate3d(-16%, 12%, 0) scale(1); }
          33%  { transform: translate3d(18%, -8%, 0) scale(1.16); }
          66%  { transform: translate3d(8%, 20%, 0) scale(1.08); }
          100% { transform: translate3d(-16%, 12%, 0) scale(1); }
        }
        @keyframes blob-drift-b {
          0%   { transform: translate3d(14%, 8%, 0) scale(1.08); }
          33%  { transform: translate3d(-18%, 20%, 0) scale(0.97); }
          66%  { transform: translate3d(16%, -10%, 0) scale(1.16); }
          100% { transform: translate3d(14%, 8%, 0) scale(1.08); }
        }
        @keyframes blob-drift-c {
          0%   { transform: translate3d(-10%, 18%, 0) scale(1.04); }
          33%  { transform: translate3d(14%, -10%, 0) scale(1.14); }
          66%  { transform: translate3d(-16%, 10%, 0) scale(1.08); }
          100% { transform: translate3d(-10%, 18%, 0) scale(1.04); }
        }

        body {
          background: #000;
          color: #f5f5f7;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── Fixed gradient backdrop (behind everything) ── */
        .hero-bg-fixed {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: #000;
          overflow: hidden;
          pointer-events: none;
        }

        .bg-hero-gradient {
          position: absolute;
          background-image:
            radial-gradient(ellipse 100% 80% at 50% 110%, oklch(0.65 0.27 25) 0%, transparent 70%),
            radial-gradient(ellipse 110% 70% at 50% 90%,  oklch(0.72 0.25 0)  0%, transparent 75%),
            radial-gradient(ellipse 140% 80% at 50% 60%,  oklch(0.38 0.18 265) 0%, transparent 80%),
            radial-gradient(ellipse 100% 80% at 50% 0%,   oklch(0.18 0.03 270) 0%, oklch(0.12 0.02 270) 100%);
          background-size: 120% 120%;
          background-position: 50% 100%;
          animation: hero-pan 18s ease-in-out infinite;
        }

        /* Bottom layer — covers lower 70% of viewport */
        .hero-bg-fixed .layer-bottom {
          inset-inline: 0;
          bottom: 0;
          height: 70%;
          opacity: 0.55;
          -webkit-mask-image: linear-gradient(to bottom,
            transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.2) 18%,
            rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.75) 45%, black 65%);
                  mask-image: linear-gradient(to bottom,
            transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.2) 18%,
            rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.75) 45%, black 65%);
        }

        /* Blob container — mid-viewport */
        .hero-bg-fixed .layer-blobs {
          position: absolute;
          inset-inline: 0;
          top: 25%;
          bottom: -40vh;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom,
            transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.24) 28%,
            rgba(0,0,0,0.45) 44%, rgba(0,0,0,0.72) 60%,
            rgba(0,0,0,0.92) 76%, transparent 100%);
                  mask-image: linear-gradient(to bottom,
            transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.24) 28%,
            rgba(0,0,0,0.45) 44%, rgba(0,0,0,0.72) 60%,
            rgba(0,0,0,0.92) 76%, transparent 100%);
        }

        /* The gradient layer inside blob container */
        .layer-blobs > .bg-hero-gradient {
          inset: 0;
        }

        .hero-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.7;
          pointer-events: none;
          will-change: transform;
        }

        /* Footer fade — masks the gradient so it fades cleanly to black at the bottom */
        .hero-bg-fixed .layer-footer-fade {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: 260px;
          background: linear-gradient(to bottom, transparent 0%, #000 100%);
          pointer-events: none;
        }

        /* ── Top bar ── */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 68px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 36px;
          background: rgba(10,10,20,0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.04),
            0 4px 40px rgba(0,0,0,0.35),
            0 1px 3px rgba(0,0,0,0.3);
          isolation: isolate;
        }

        .top-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 8%; right: 8%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(140,120,255,0.18) 15%,
            rgba(160,140,255,0.55) 38%,
            rgba(180,160,255,0.82) 50%,
            rgba(160,140,255,0.55) 62%,
            rgba(140,120,255,0.18) 85%,
            transparent 100%
          );
          pointer-events: none;
        }

        .top-bar::after {
          content: '';
          position: absolute;
          top: -32px; left: 50%;
          transform: translateX(-50%);
          width: 560px; height: 64px;
          background: radial-gradient(ellipse at 50% 100%,
            rgba(140,120,255,0.28) 0%,
            rgba(160,140,255,0.10) 45%,
            transparent 70%
          );
          filter: blur(12px);
          pointer-events: none;
        }

        /* ── Logo ── */
        .logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.5px;
          cursor: pointer;
          user-select: none;
          color: #ffffff;
          justify-self: start;
        }

        /* ── Nav ── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          padding: 5px;
          box-shadow:
            0 1px 4px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 2px 16px rgba(140,120,255,0.08);
        }

        .nav-btn {
          position: relative;
          padding: 7px 20px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(245,245,247,0.55);
          letter-spacing: 0.01em;
          transition: color 0.18s, background 0.18s, transform 0.14s, box-shadow 0.18s;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-btn::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: 999px;
          background: linear-gradient(135deg,
            rgba(160,140,255,0.14) 0%,
            rgba(200,140,220,0.08) 100%
          );
          opacity: 0;
          transition: opacity 0.18s;
          pointer-events: none;
        }

        .nav-btn:hover::before { opacity: 1; }
        .nav-btn:hover { color: #fff; transform: translateY(-1px); }

        .nav-btn.active {
          color: #fff;
          background: linear-gradient(135deg,
            rgba(160,140,255,0.22) 0%,
            rgba(200,140,220,0.14) 100%
          );
          box-shadow:
            0 0 0 1px rgba(180,160,255,0.32),
            0 2px 12px rgba(140,120,255,0.22),
            0 0 24px rgba(160,140,255,0.14),
            inset 0 1px 0 rgba(255,255,255,0.14);
        }

        .nav-btn.active::before { opacity: 0; }
        .nav-btn:active { transform: scale(0.96) translateY(0); }
        .nav-btn.disabled { opacity: 0.28; cursor: not-allowed; pointer-events: none; }

        /* ── Right side ── */
        .nav-right {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          padding: 6px 14px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .search-pill:focus-within {
          border-color: rgba(180,160,255,0.42);
          box-shadow:
            0 0 0 3px rgba(160,140,255,0.14),
            0 0 18px rgba(160,140,255,0.14),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .search-icon { color: rgba(245,245,247,0.45); flex-shrink: 0; pointer-events: none; }
        .search-input {
          border: none; outline: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 13px; color: #f5f5f7;
          width: 140px;
        }
        .search-input::placeholder { color: rgba(245,245,247,0.4); }

        .version-badge {
          position: relative;
          font-size: 11px; font-weight: 600;
          color: #d8ccff;
          background: rgba(160,140,255,0.14);
          border: 1px solid rgba(180,160,255,0.30);
          border-radius: 999px;
          padding: 3px 10px;
          letter-spacing: 0.05em;
          user-select: none;
          overflow: hidden;
        }
        .version-badge::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 999px;
          background: linear-gradient(105deg,
            transparent 25%,
            rgba(255,255,255,0.35) 50%,
            transparent 75%
          );
          background-size: 200% 100%;
          animation: shimmer-x 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        /* ── Layout ── */
        .main-wrap {
          padding-top: 68px;
          min-height: 100dvh;
          position: relative;
          z-index: 1;
        }
        .inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 28px 24px 48px;
        }

        /* ── Footer ── */
        .site-footer {
          position: relative;
          z-index: 1;
          background: #000;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 32px 36px 28px;
        }

        .footer-inner {
          max-width: 860px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 16px;
        }

        .footer-logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.4px;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .footer-tagline {
          font-size: 12px;
          color: rgba(245,245,247,0.55);
          letter-spacing: 0.01em;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .footer-link {
          font-size: 12px;
          color: rgba(245,245,247,0.55);
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: color 0.18s;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: 'Inter', sans-serif;
        }
        .footer-link:hover { color: #fff; }

        .footer-divider {
          width: 1px;
          height: 12px;
          background: rgba(255,255,255,0.12);
        }

        .footer-copy {
          font-size: 11px;
          color: rgba(245,245,247,0.42);
          letter-spacing: 0.02em;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      {/* ── Fixed gradient backdrop (renders behind all content) ── */}
      <div className="hero-bg-fixed" aria-hidden="true">
        {/* Bottom radial gradient layer */}
        <div className="bg-hero-gradient layer-bottom" />

        {/* Blob + gradient mid-layer */}
        <div className="layer-blobs">
          <div className="bg-hero-gradient" />
          <div
            className="hero-blob"
            style={{
              width: '70vw', height: '70vw',
              left: '-10vw', bottom: '-25vw',
              background: 'radial-gradient(circle, oklch(0.65 0.27 25) 0%, transparent 60%)',
              animation: 'blob-drift-a 12s ease-in-out infinite',
            }}
          />
          <div
            className="hero-blob"
            style={{
              width: '80vw', height: '80vw',
              right: '-20vw', bottom: '-30vw',
              background: 'radial-gradient(circle, oklch(0.72 0.25 0) 0%, transparent 60%)',
              animation: 'blob-drift-b 15s ease-in-out infinite',
            }}
          />
          <div
            className="hero-blob"
            style={{
              width: '75vw', height: '75vw',
              left: '10vw', top: '-15vw',
              background: 'radial-gradient(circle, oklch(0.45 0.2 265) 0%, transparent 60%)',
              animation: 'blob-drift-c 12s ease-in-out infinite',
              opacity: 0.7,
            }}
          />
          <div
            className="hero-blob"
            style={{
              width: '55vw', height: '55vw',
              left: '-5vw', top: '-25vw',
              background: 'radial-gradient(circle, oklch(0.5 0.22 265) 0%, transparent 60%)',
              animation: 'blob-drift-a 10s ease-in-out infinite',
              opacity: 0.65,
            }}
          />
          <div
            className="hero-blob"
            style={{
              width: '50vw', height: '50vw',
              right: '-5vw', top: '-20vw',
              background: 'radial-gradient(circle, oklch(0.48 0.2 270) 0%, transparent 60%)',
              animation: 'blob-drift-b 13s ease-in-out infinite',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Fades gradient cleanly into solid black at page bottom */}
        <div className="layer-footer-fade" />
      </div>

      {/* ── Top Bar (untouched) ── */}
      <header className="top-bar">
        <div className="logo" onClick={() => setScreen('home')}>Lumora.</div>

        <nav className="nav-links">
          {NAV_ITEMS.map(({ screen: s, label }) => {
            const isActive   = screen === s;
            const isDisabled = s === 'practice' && !activeDeck;
            return (
              <button
                key={s}
                className={`nav-btn ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleNavClick(s)}
                onMouseEnter={() => setHoveredNav(s)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="nav-right">
          <div className="search-pill">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input className="search-input" placeholder="Search decks…" />
          </div>
          <span className="version-badge">Beta</span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-wrap">
        <div className="inner">
          {screen === 'home'     && <Upload onDeckCreated={addDeck} />}
          {screen === 'decks'    && <Decks decks={decks} onPractice={startPractice} />}
          {screen === 'practice' && activeDeck && (
            <Practice
              deck={activeDeck}
              onFinish={(updatedDeck: Deck) => {
                updateDeck(updatedDeck);
                setScreen('decks');
              }}
              onRegisterSave={(saveFn: () => void) => { practiceFinishRef.current = saveFn; }}
            />
          )}
          {screen === 'dashboard' && <Dashboard decks={decks} />}
        </div>
      </main>

      {/* ── Footer (solid black) ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">Lumora.</div>
            <div className="footer-tagline">
              <TextGenerateEffect words="Spaced repetition, refined." />
            </div>
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={() => setScreen('home')}>Upload</button>
            <div className="footer-divider" />
            <button className="footer-link" onClick={() => setScreen('decks')}>Library</button>
            <div className="footer-divider" />
            <button className="footer-link" onClick={() => setScreen('dashboard')}>Stats</button>
          </div>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} Lumora. Enhancing learning through spaced repetition.
        </div>
      </footer>
    </>
  );
}
