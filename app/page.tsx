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
        html { color-scheme: dark; }

        body {
          background: #0a0a0f;
          color: #f9f5fd;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(159,167,255,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(120,100,255,0.07) 0%, transparent 60%);
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
          background: rgba(10,10,15,0.75);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border-bottom: 1px solid rgba(159,167,255,0.07);
          box-shadow: 0 1px 0 rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.2);
        }

        /* subtle top glow line */
        .top-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(159,167,255,0.35), transparent);
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

        /* Nav links — centred via grid middle column */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 999px;
          padding: 5px;
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
          color: rgba(249,245,253,0.45);
          letter-spacing: 0.01em;
          transition: color 0.2s ease, background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          overflow: hidden;
          white-space: nowrap;
        }

        /* shimmer layer on hover */
        .nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(135deg,
            rgba(159,167,255,0.18) 0%,
            rgba(120,100,255,0.10) 50%,
            rgba(159,167,255,0.05) 100%
          );
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .nav-btn:hover::before { opacity: 1; }

        .nav-btn:hover {
          color: rgba(249,245,253,0.92);
          transform: translateY(-1px);
        }

        .nav-btn.active {
          color: #c4c9ff;
          background: linear-gradient(135deg,
            rgba(159,167,255,0.22) 0%,
            rgba(120,100,255,0.16) 100%
          );
          box-shadow:
            0 0 0 1px rgba(159,167,255,0.2),
            0 2px 12px rgba(159,167,255,0.15),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .nav-btn.active::before { opacity: 0; }

        .nav-btn:active { transform: scale(0.96) translateY(0); }

        .nav-btn.disabled {
          opacity: 0.22;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* right side spacer so logo stays left, nav stays centre */
        .nav-right {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* version badge */
        .version-badge {
          font-size: 11px;
          font-weight: 500;
          color: rgba(159,167,255,0.5);
          background: rgba(159,167,255,0.08);
          border: 1px solid rgba(159,167,255,0.12);
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
          padding: 48px 24px 80px;
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

        {/* Right — version badge */}
        <div className="nav-right">
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
