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

const NAV_ITEMS: { screen: string; label: string; icon: string }[] = [
  { screen: 'home',      label: 'Home',     icon: 'home' },
  { screen: 'decks',     label: 'Library',  icon: 'library_books' },
  { screen: 'practice',  label: 'Practice', icon: 'bolt' },
  { screen: 'dashboard', label: 'Stats',    icon: 'insights' },
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
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: dark; }

        body {
          background: #0e0e13;
          color: #f9f5fd;
          font-family: 'Inter', sans-serif;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
        }

        .msymbol {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 22px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          user-select: none;
        }
        .msymbol.filled {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* Top App Bar */
        .top-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 24px;
          background: rgba(14,14,19,0.70);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .logo-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid rgba(159,167,255,0.20);
          flex-shrink: 0;
        }
        .logo-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .logo-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 20px;
          color: #9fa7ff;
          letter-spacing: -0.5px;
        }

        /* Main */
        .main-wrap {
          padding-top: 96px;
          padding-bottom: 96px;
          min-height: 100dvh;
        }
        .inner {
          max-width: 1024px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Bottom Nav — floating pill */
        .bottom-nav {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(14,14,19,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 999px;
          box-shadow: 0px 8px 32px rgba(0,0,0,0.50), inset 0 0.5px 0 rgba(255,255,255,0.07);
          border: 0.5px solid rgba(255,255,255,0.08);
          white-space: nowrap;
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: rgba(249,245,253,0.50);
          transition: color 0.2s, background 0.2s, transform 0.15s;
          transform: scale(1);
        }
        .nav-btn.active {
          background: rgba(159,167,255,0.20);
          color: #9fa7ff;
          box-shadow: 0 0 15px rgba(159,167,255,0.12);
        }
        .nav-btn:not(.active):hover { color: #9fa7ff; }
        .nav-btn:active { transform: scale(0.94); }

        .nav-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          line-height: 1;
          margin-top: 1px;
        }
      `}</style>

      {/* Top App Bar */}
      <header className="top-bar">
        <div className="logo-row" onClick={() => setScreen('home')}>
          <div className="logo-avatar">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNPxq8BYq_0yGwAaKspjEm1MgNDhDPhVLBCWy79a589dzKv3bC0Mreov9S_oLhAJ2OY5SS9YoThhDbfbu1FjBkvmoPoxFYGVAFngMP_Fww1cSM_Wd7AAG8wYDoZjiFzHwenP2r5D6iFTno2b-wW38S526VJA93kZsEJPfSR62lLucy6N37UdYy3eTanyjtHXSD9ttYUOuSE0BjSBAYSd5nq02wiTshLOeineaAuK-S6tJne8cNVgI22dPNDP3U7O4ndzvaT8gH_5c"
              alt="FlashAI"
            />
          </div>
          <span className="logo-name">FlashAI</span>
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

      {/* Bottom Nav — floating pill */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ screen: s, label, icon }) => {
          const isActive = screen === s;
          return (
            <button
              key={s}
              className={`nav-btn${isActive ? ' active' : ''}`}
              onClick={() => handleNavClick(s)}
              aria-label={label}
            >
              <span className={`msymbol${isActive ? ' filled' : ''}`}>{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}