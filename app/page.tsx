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
          background: #0e0e13;
          color: #f9f5fd;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
        }

        /* Top Bar */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: rgba(14,14,19,0.80);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }

        /* Logo */
        .logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 22px;
          color: #9fa7ff;
          letter-spacing: -0.5px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }
        .logo span {
          color: rgba(159,167,255,0.45);
        }

        /* Nav links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-btn {
          position: relative;
          padding: 7px 18px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(249,245,253,0.45);
          letter-spacing: 0.01em;
          transition: color 0.18s, background 0.18s, transform 0.15s;
        }
        .nav-btn:hover {
          color: rgba(249,245,253,0.85);
          background: rgba(255,255,255,0.05);
        }
        .nav-btn.active {
          color: #9fa7ff;
          background: rgba(159,167,255,0.14);
        }
        .nav-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          border-radius: 999px;
          background: #9fa7ff;
          opacity: 0.7;
        }
        .nav-btn:active { transform: scale(0.96); }
        .nav-btn.disabled {
          opacity: 0.25;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Main */
        .main-wrap {
          padding-top: 80px;
          padding-bottom: 48px;
          min-height: 100dvh;
        }
        .inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px 0;
        }
      `}</style>

      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo" onClick={() => setScreen('home')}>
          Lumora<span>.</span>
        </div>

        <nav className="nav-links">
          {NAV_ITEMS.map(({ screen: s, label }) => {
            const isActive = screen === s;
            const isDisabled = s === 'practice' && !activeDeck;
            return (
              <button
                key={s}
                className={`nav-btn${isActive ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
                onClick={() => handleNavClick(s)}
              >
                {label}
              </button>
            );
          })}
        </nav>
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
