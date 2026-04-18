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
  // Ref so Practice can push live card state up at any time (including nav-away)
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
    // If navigating away from practice, flush current card state first
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
        html { color-scheme: light; }

        @keyframes shimmer-x {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes orb-a {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(20px,-14px) scale(1.05); }
          70%     { transform: translate(-10px, 8px) scale(0.97); }
        }
        @keyframes orb-b {
          0%,100% { transform: translate(0,0) scale(1); }
          35%     { transform: translate(-24px,16px) scale(1.06); }
          65%     { transform: translate(12px,-6px) scale(0.95); }
        }
        @keyframes orb-c {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(10px, 22px); }
        }

        body {
          background: linear-gradient(
            160deg,
            #d8d4ee 0%,
            #dedad0 20%,
            #e2dce8 38%,
            #d8e2ee 55%,
            #d4e8e0 72%,
            #dce4d8 88%,
            #e0ddd4 100%
          );
          background-attachment: fixed;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          width: 820px; height: 600px;
          top: -240px; left: -180px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 38% 38%,
            rgba(99,88,240,0.32) 0%,
            rgba(120,100,255,0.18) 30%,
            rgba(91,91,214,0.08) 58%,
            transparent 75%
          );
          filter: blur(72px);
          pointer-events: none;
          z-index: 0;
          animation: orb-a 16s ease-in-out infinite;
        }

        body::after {
          content: '';
          position: fixed;
          width: 640px; height: 500px;
          bottom: -160px; right: -100px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 60% 60%,
            rgba(80,140,240,0.22) 0%,
            rgba(91,130,214,0.12) 42%,
            rgba(100,180,220,0.06) 65%,
            transparent 80%
          );
          filter: blur(68px);
          pointer-events: none;
          z-index: 0;
          animation: orb-b 20s ease-in-out infinite;
        }

        .page-glow {
          position: fixed;
          top: 44%; left: 50%;
          transform: translate(-50%, -50%);
          width: 720px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 50% 50%,
            rgba(91,91,214,0.09) 0%,
            rgba(120,110,255,0.04) 42%,
            transparent 68%
          );
          filter: blur(44px);
          pointer-events: none;
          z-index: 0;
          animation: orb-c 24s ease-in-out infinite;
        }

        .orb-mid {
          position: fixed;
          top: 55%; left: 65%;
          transform: translate(-50%, -50%);
          width: 480px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(ellipse at 50% 50%,
            rgba(180,120,255,0.12) 0%,
            rgba(140,100,240,0.06) 50%,
            transparent 72%
          );
          filter: blur(52px);
          pointer-events: none;
          z-index: 0;
          animation: orb-c 18s ease-in-out infinite 3s;
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
          background: rgba(225,222,215,0.55);
          backdrop-filter: blur(48px) saturate(200%) brightness(1.02);
          -webkit-backdrop-filter: blur(48px) saturate(200%) brightness(1.02);
          border-bottom: 1px solid rgba(91,91,214,0.08);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9),
            0 4px 40px rgba(91,91,214,0.07),
            0 1px 3px rgba(0,0,0,0.04);
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
            rgba(100,90,255,0.55) 38%,
            rgba(91,91,214,0.82) 50%,
            rgba(100,90,255,0.55) 62%,
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
            rgba(91,91,214,0.20) 0%,
            rgba(110,100,255,0.08) 45%,
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
          color: #0a0a0a;
          justify-self: start;
        }

        /* ── Nav ── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(91,91,214,0.12);
          border-radius: 999px;
          padding: 5px;
          box-shadow:
            0 1px 4px rgba(0,0,0,0.06),
            0 0 0 1px rgba(255,255,255,0.7) inset,
            0 2px 16px rgba(91,91,214,0.05);
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
          color: rgba(26,26,46,0.42);
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
            rgba(91,91,214,0.10) 0%,
            rgba(123,104,238,0.05) 100%
          );
          opacity: 0;
          transition: opacity 0.18s;
          pointer-events: none;
        }

        .nav-btn:hover::before { opacity: 1; }
        .nav-btn:hover { color: rgba(26,26,46,0.82); transform: translateY(-1px); }

        .nav-btn.active {
          color: #5b5bd6;
          background: linear-gradient(135deg,
            rgba(91,91,214,0.13) 0%,
            rgba(120,100,240,0.08) 100%
          );
          box-shadow:
            0 0 0 1px rgba(91,91,214,0.22),
            0 2px 12px rgba(91,91,214,0.14),
            0 0 24px rgba(91,91,214,0.07),
            inset 0 1px 0 rgba(255,255,255,0.78);
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
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(91,91,214,0.12);
          border-radius: 999px;
          padding: 6px 14px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.95);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-pill:focus-within {
          border-color: rgba(91,91,214,0.38);
          box-shadow:
            0 0 0 3px rgba(91,91,214,0.09),
            0 0 18px rgba(91,91,214,0.09),
            inset 0 1px 0 rgba(255,255,255,0.95);
        }
        .search-icon { color: rgba(26,26,46,0.28); flex-shrink: 0; pointer-events: none; }
        .search-input {
          border: none; outline: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 13px; color: #1a1a2e;
          width: 140px;
        }
        .search-input::placeholder { color: rgba(26,26,46,0.33); }

        .version-badge {
          position: relative;
          font-size: 11px; font-weight: 600;
          color: #5b5bd6;
          background: rgba(91,91,214,0.08);
          border: 1px solid rgba(91,91,214,0.20);
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
            rgba(255,255,255,0.65) 50%,
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
          border-top: 1px solid rgba(91,91,214,0.10);
          background: rgba(215,212,205,0.50);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
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
          color: #0a0a0a;
          margin-bottom: 4px;
        }

        .footer-tagline {
          font-size: 12px;
          color: rgba(26,26,46,0.62);
          letter-spacing: 0.01em;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .footer-link {
          font-size: 12px;
          color: rgba(26,26,46,0.62);
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
        .footer-link:hover { color: rgba(26,26,46,0.88); }

        .footer-divider {
          width: 1px;
          height: 12px;
          background: rgba(91,91,214,0.15);
        }

        .footer-copy {
          font-size: 11px;
          color: rgba(26,26,46,0.50);
          letter-spacing: 0.02em;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(91,91,214,0.06);
          text-align: center;
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      {/* Background orbs */}
      <div className="page-glow" aria-hidden="true" />
      <div className="orb-mid"   aria-hidden="true" />

      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div className="logo" onClick={() => setScreen('home')}>Lumora.</div>

        <nav className="nav-links">
          {NAV_ITEMS.map(({ screen: s, label }) => {
            const isActive   = screen === s;
            const isDisabled = s === 'practice' && !activeDeck;
            return (
              <button
                key={s}
                className={`nav-btn${isActive ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
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
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
              onRegisterSave={(saveFn) => { practiceFinishRef.current = saveFn; }}
            />
          )}
          {screen === 'dashboard' && <Dashboard decks={decks} />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">Lumora.</div>
            <div className="footer-tagline">
              <TextGenerateEffect
                words=".pdf to AI flashcards"
                duration={0.4}
                staggerDelay={0.10}
              />
            </div>
          </div>
          <nav className="footer-links">
            <button className="footer-link" onClick={() => setScreen('home')}>Upload</button>
            <div className="footer-divider" />
            <button className="footer-link" onClick={() => setScreen('decks')}>Library</button>
            <div className="footer-divider" />
            <button className="footer-link" onClick={() => setScreen('dashboard')}>Stats</button>
          </nav>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Lumora. Enhancing learning through spaced repetition.
        </p>
      </footer>
    </>
  );
}

/**
 * DropZoneGrid
 */
export function DropZoneGrid() {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: '14px',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      viewBox="0 0 600 260"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="evenGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(91,91,214,0.13)" strokeWidth="0.8"/>
        </pattern>
        <radialGradient id="gridFade" cx="50%" cy="50%" r="58%">
          <stop offset="0%"   stopColor="white" stopOpacity="1"/>
          <stop offset="55%"  stopColor="white" stopOpacity="0.72"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="gridMask">
          <rect width="600" height="260" fill="url(#gridFade)"/>
        </mask>
      </defs>
      <rect width="600" height="260" fill="url(#evenGrid)" mask="url(#gridMask)"/>
      <path d="M0 0 L36 0 M0 0 L0 36"
        stroke="rgba(91,91,214,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M600 0 L564 0 M600 0 L600 36"
        stroke="rgba(91,91,214,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M0 260 L36 260 M0 260 L0 224"
        stroke="rgba(91,91,214,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M600 260 L564 260 M600 260 L600 224"
        stroke="rgba(91,91,214,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <circle cx="300" cy="130" r="1.8" fill="rgba(91,91,214,0.28)"/>
      <line x1="288" y1="130" x2="312" y2="130" stroke="rgba(91,91,214,0.16)" strokeWidth="1"/>
      <line x1="300" y1="118" x2="300" y2="142" stroke="rgba(91,91,214,0.16)" strokeWidth="1"/>
    </svg>
  );
}
