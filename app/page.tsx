'use client';
import { useState } from 'react';
import Upload from './components/Upload';
import Decks from './components/Decks';
import Practice from './components/Practice';
import Dashboard from './components/Dashboard';

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

  const addDeck = (deck: Deck) => {
    setDecks(prev => [...prev, deck]);
    setScreen('decks');
  };

  const updateDeck = (updatedDeck: Deck) => {
    setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
  };

  const startPractice = (deck: Deck) => {
    setActiveDeck(deck);
    setScreen('practice');
  };

  const handleNavClick = (s: string) => {
    if (s === 'practice' && !activeDeck) return;
    setScreen(s);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: light; }

        /* ─── Premium ambient glow keyframes ─── */
        @keyframes orb-drift-a {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(18px, -12px) scale(1.04); }
          66%  { transform: translate(-10px, 8px) scale(0.97); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes orb-drift-b {
          0%   { transform: translate(0px, 0px) scale(1); }
          40%  { transform: translate(-22px, 14px) scale(1.06); }
          70%  { transform: translate(12px, -6px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes orb-drift-c {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(8px, 20px) scale(1.03); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer-x {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        body {
          background: #f5f4f0;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ─── Global ambient gradient orbs (Vercel-style) ─── */
        body::before,
        body::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(80px);
        }

        /* Top-left violet orb */
        body::before {
          width: 640px;
          height: 440px;
          top: -160px;
          left: -120px;
          background: radial-gradient(ellipse at center,
            rgba(109, 100, 255, 0.13) 0%,
            rgba(91, 91, 214, 0.07) 45%,
            transparent 75%
          );
          animation: orb-drift-a 14s ease-in-out infinite;
        }

        /* Bottom-right indigo orb */
        body::after {
          width: 520px;
          height: 380px;
          bottom: -140px;
          right: -80px;
          background: radial-gradient(ellipse at center,
            rgba(123, 104, 238, 0.10) 0%,
            rgba(99, 88, 220, 0.05) 50%,
            transparent 75%
          );
          animation: orb-drift-b 18s ease-in-out infinite;
        }

        /* ─── Top Bar ─── */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 68px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 36px;
          /* Frosted glass base */
          background: rgba(245,244,240,0.72);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-bottom: 1px solid rgba(120,110,255,0.09);
          /* Layered box shadows for depth */
          box-shadow:
            0 1px 0 rgba(255,255,255,0.8),
            0 4px 32px rgba(91,91,214,0.06),
            0 1px 3px rgba(0,0,0,0.04);
          isolation: isolate;
        }

        /* Top bar inner glow line */
        .top-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(120,110,255,0.25) 30%,
            rgba(91,91,214,0.45) 50%,
            rgba(120,110,255,0.25) 70%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Top bar subtle radial glow from top-centre */
        .top-bar::after {
          content: '';
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 480px;
          height: 80px;
          background: radial-gradient(ellipse at top,
            rgba(91,91,214,0.12) 0%,
            transparent 70%
          );
          pointer-events: none;
          filter: blur(8px);
        }

        /* ─── Logo ─── */
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

        /* ─── Nav ─── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(120,110,255,0.13);
          border-radius: 999px;
          padding: 5px;
          box-shadow:
            0 1px 4px rgba(0,0,0,0.06),
            0 0 0 1px rgba(255,255,255,0.6) inset,
            0 2px 12px rgba(91,91,214,0.05);
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
          color: rgba(26,26,46,0.45);
          letter-spacing: 0.01em;
          transition: color 0.2s ease, background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          overflow: hidden;
          white-space: nowrap;
        }

        .nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(135deg,
            rgba(91,91,214,0.10) 0%,
            rgba(123,104,238,0.06) 100%
          );
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .nav-btn:hover::before { opacity: 1; }
        .nav-btn:hover {
          color: rgba(26,26,46,0.85);
          transform: translateY(-1px);
        }

        .nav-btn.active {
          color: #5b5bd6;
          background: linear-gradient(135deg,
            rgba(91,91,214,0.13) 0%,
            rgba(123,104,238,0.08) 100%
          );
          box-shadow:
            0 0 0 1px rgba(91,91,214,0.18),
            0 2px 10px rgba(91,91,214,0.12),
            0 0 18px rgba(91,91,214,0.08),
            inset 0 1px 0 rgba(255,255,255,0.7);
        }

        .nav-btn.active::before { opacity: 0; }
        .nav-btn:active { transform: scale(0.96) translateY(0); }
        .nav-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* ─── Right Side ─── */
        .nav-right {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Search pill */
        .search-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(120,110,255,0.14);
          border-radius: 999px;
          padding: 6px 14px;
          box-shadow:
            0 1px 4px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-pill:focus-within {
          border-color: rgba(91,91,214,0.4);
          box-shadow:
            0 0 0 3px rgba(91,91,214,0.08),
            0 1px 4px rgba(0,0,0,0.06),
            0 0 16px rgba(91,91,214,0.08);
        }

        .search-icon {
          color: rgba(26,26,46,0.3);
          flex-shrink: 0;
          pointer-events: none;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #1a1a2e;
          width: 140px;
        }

        .search-input::placeholder { color: rgba(26,26,46,0.35); }

        /* Version badge — shimmer gradient (Vercel-tier) */
        .version-badge {
          position: relative;
          font-size: 11px;
          font-weight: 600;
          color: #5b5bd6;
          background: rgba(91,91,214,0.07);
          border: 1px solid rgba(91,91,214,0.18);
          border-radius: 999px;
          padding: 3px 10px;
          letter-spacing: 0.05em;
          user-select: none;
          overflow: hidden;
        }

        /* Shimmer sweep on badge */
        .version-badge::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.55) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: shimmer-x 3.5s ease-in-out infinite;
          pointer-events: none;
        }

        /* ─── Drop Zone Grid (exported for use in Upload component) ─── */
        .drop-zone-grid-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border-radius: 15px;
          pointer-events: none;
          z-index: 0;
        }

        /* ─── Main layout ─── */
        .main-wrap {
          padding-top: 68px;
          min-height: 100dvh;
          position: relative;
          z-index: 1;
        }

        .inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 28px 24px 80px;
        }

        /* ─── Mid-page subtle orb (centre focus glow) ─── */
        .page-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -55%);
          width: 700px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center,
            rgba(91,91,214,0.055) 0%,
            rgba(120,110,255,0.025) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
          filter: blur(40px);
          animation: orb-drift-c 22s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient centre glow */}
      <div className="page-glow" aria-hidden="true" />

      {/* ── Top Bar ── */}
      <header className="top-bar">

        {/* Logo — left, plain black */}
        <div className="logo" onClick={() => setScreen('home')}>
          Lumora
        </div>

        {/* Nav — centre */}
        <nav className="nav-links">
          {NAV_ITEMS.map(({ screen: s, label }) => {
            const isActive = screen === s;
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

        {/* Right — search + version badge */}
        <div className="nav-right">
          <div className="search-pill">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="search-input" placeholder="Search decks..." />
          </div>
          <span className="version-badge">Beta</span>
        </div>

      </header>

      {/* ── Main Content ── */}
      <main className="main-wrap">
        <div className="inner">
          {screen === 'home' && <Upload onDeckCreated={addDeck} />}
          {screen === 'decks' && <Decks decks={decks} onPractice={startPractice} />}
          {screen === 'practice' && activeDeck && (
            <Practice
              deck={activeDeck}
              onFinish={(updatedDeck: Deck) => {
                updateDeck(updatedDeck);
                setScreen('decks');
              }}
            />
          )}
          {screen === 'dashboard' && <Dashboard decks={decks} />}
        </div>
      </main>
    </>
  );
}

/**
 * ─── Drop Zone Grid SVG ───────────────────────────────────────────────────────
 * Export this and drop it inside your Upload component's drop zone container.
 * The container must have `position: relative; overflow: hidden`.
 *
 * Usage in Upload.tsx:
 *   import { DropZoneGrid } from '../page';   // or paste inline
 *   <div className="drop-zone" style={{position:'relative'}}>
 *     <DropZoneGrid />
 *     ... rest of drop zone content ...
 *   </div>
 */
export function DropZoneGrid() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        borderRadius: '15px',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      viewBox="0 0 600 260"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Even 40×40 grid */}
        <pattern id="evenGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(91,91,214,0.12)" strokeWidth="1"/>
        </pattern>

        {/* Radial fade mask — grid fades toward edges for Vercel-style depth */}
        <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="white" stopOpacity="1"/>
          <stop offset="70%"  stopColor="white" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="gridMask">
          <rect width="600" height="260" fill="url(#gridFade)"/>
        </mask>
      </defs>

      {/* Grid surface with fade mask */}
      <rect width="600" height="260" fill="url(#evenGrid)" mask="url(#gridMask)"/>

      {/* Corner bracket accents */}
      <path d="M 0 0 L 36 0 M 0 0 L 0 36"
        stroke="rgba(91,91,214,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M 600 0 L 564 0 M 600 0 L 600 36"
        stroke="rgba(91,91,214,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M 0 260 L 36 260 M 0 260 L 0 224"
        stroke="rgba(91,91,214,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
      <path d="M 600 260 L 564 260 M 600 260 L 600 224"
        stroke="rgba(91,91,214,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="square"/>

      {/* Centre crosshair dot — subtle focal accent */}
      <circle cx="300" cy="130" r="1.5" fill="rgba(91,91,214,0.25)"/>
      <line x1="292" y1="130" x2="308" y2="130" stroke="rgba(91,91,214,0.15)" strokeWidth="1"/>
      <line x1="300" y1="122" x2="300" y2="138" stroke="rgba(91,91,214,0.15)" strokeWidth="1"/>
    </svg>
  );
}
