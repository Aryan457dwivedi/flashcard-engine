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

        body {
          background: #f5f4f0;
          color: #1a1a2e;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120,110,255,0.06) 0%, transparent 70%);
        }

        /* Top Bar */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 68px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 36px;
          background: rgba(245,244,240,0.85);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border-bottom: 1px solid rgba(120,110,255,0.1);
          box-shadow: 0 1px 0 rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.06);
        }

        .top-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(120,110,255,0.2), transparent);
          pointer-events: none;
        }

        /* Logo */
        .logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.5px;
          cursor: pointer;
          user-select: none;
          background: linear-gradient(135deg, #c4c9ff 0%, #9fa7ff 40%, #7b85f5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          justify-self: start;
        }

        /* Nav links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(120,110,255,0.12);
          border-radius: 999px;
          padding: 5px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
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
            rgba(91,91,214,0.1) 0%,
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
            rgba(91,91,214,0.12) 0%,
            rgba(123,104,238,0.08) 100%
          );
          box-shadow:
            0 0 0 1px rgba(91,91,214,0.15),
            0 2px 8px rgba(91,91,214,0.1),
            inset 0 1px 0 rgba(255,255,255,0.6);
        }

        .nav-btn.active::before { opacity: 0; }
        .nav-btn:active { transform: scale(0.96) translateY(0); }
        .nav-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Right side */
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
          border: 1px solid rgba(120,110,255,0.15);
          border-radius: 999px;
          padding: 6px 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-pill:focus-within {
          border-color: rgba(91,91,214,0.4);
          box-shadow: 0 0 0 3px rgba(91,91,214,0.08), 0 1px 4px rgba(0,0,0,0.06);
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

        /* Version badge */
        .version-badge {
          font-size: 11px;
          font-weight: 500;
          color: rgba(91,91,214,0.7);
          background: rgba(91,91,214,0.08);
          border: 1px solid rgba(91,91,214,0.15);
          border-radius: 999px;
          padding: 3px 10px;
          letter-spacing: 0.03em;
          user-select: none;
        }

        /* Main */
        .main-wrap {
          padding-top: 68px;
          min-height: 100dvh;
        }
        .inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 28px 24px 80px;
        }
      `}</style>

      {/* Top Bar */}
      <header className="top-bar">

        {/* Logo — left */}
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

      {/* Main Content */}
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
