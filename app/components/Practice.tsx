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

function sm2(card: Card, quality: number): Card {
  let { ease, interval, reps } = card;
  if (quality >= 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < 1.3) ease = 1.3;
  } else {
    reps = 0;
    interval = 1;
  }
  return { ...card, ease, interval, reps };
}

/* ── Tiny confetti burst on "Got it" ─────────────────────────────── */
function spawnConfetti(container: HTMLElement) {
  const colors = ['#5b5bd6', '#a78bfa', '#34d399', '#f59e0b', '#f472b6'];
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement('span');
    const size = Math.random() * 7 + 5;
    dot.style.cssText = `
      position:absolute;pointer-events:none;border-radius:50%;
      width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;top:40%;
      opacity:1;z-index:20;
      animation:confetti-fly ${0.6 + Math.random() * 0.6}s ease-out forwards;
      --dx:${(Math.random() - 0.5) * 160}px;
      --dy:${-(Math.random() * 120 + 60)}px;
    `;
    container.appendChild(dot);
    setTimeout(() => dot.remove(), 1400);
  }
}

export default function Practice({
  deck,
  onFinish,
}: {
  deck: Deck;
  onFinish: (updatedDeck: Deck) => void;
}) {
  const [cards, setCards] = useState<Card[]>(
    deck.cards.map(c => ({
      ...c,
      ease: c.ease || 2.5,
      interval: c.interval || 1,
      reps: c.reps || 0,
    }))
  );
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [session, setSession]   = useState({ correct: 0, incorrect: 0 });
  const [animDir, setAnimDir]   = useState<'in' | 'out-left' | 'out-right'>('in');
  const [streakFlash, setStreakFlash] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const card     = cards[current];
  const done     = current >= cards.length;
  const progress = current / cards.length;
  const streak   = session.correct; // consecutive so far (simplified)

  /* flip shortcut */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const answer = (quality: number) => {
    if (quality === 5 && cardRef.current) spawnConfetti(cardRef.current);

    setAnimDir(quality >= 3 ? 'out-right' : 'out-left');

    setTimeout(() => {
      const updated = [...cards];
      updated[current] = sm2(card, quality);
      setCards(updated);
      setSession(prev => ({
        correct:   quality >= 3 ? prev.correct + 1   : prev.correct,
        incorrect: quality < 3  ? prev.incorrect + 1 : prev.incorrect,
      }));
      setCurrent(p => p + 1);
      setFlipped(false);
      setAnimDir('in');
    }, 280);

    if (quality === 5) {
      setStreakFlash(true);
      setTimeout(() => setStreakFlash(false), 600);
    }
  };

  /* ── DONE SCREEN ─────────────────────────────────────────────── */
  if (done) {
    const score    = Math.round((session.correct / cards.length) * 100);
    const mastered = cards.filter(c => c.reps >= 2).length;
    const shaky    = cards.filter(c => c.reps === 1).length;
    const missed   = cards.length - mastered - shaky;

    return (
      <>
        <style>{STYLES}</style>
        <div className="done-wrap">

          {/* Trophy glow */}
          <div className="done-trophy">
            <div className="trophy-ring" />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="#5b5bd6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h2 className="done-title">Session complete</h2>
          <p className="done-sub">You reviewed all <strong>{cards.length}</strong> cards in this session.</p>

          {/* Score ring */}
          <div className="score-ring-wrap">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(91,91,214,0.10)" strokeWidth="9"/>
              <circle cx="55" cy="55" r="46" fill="none" stroke="#5b5bd6" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - score / 100)}`}
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <text x="55" y="52" textAnchor="middle" fill="#1a1a2e"
                fontFamily="'Space Grotesk',sans-serif" fontWeight="900" fontSize="22">
                {score}%
              </text>
              <text x="55" y="67" textAnchor="middle" fill="rgba(26,26,46,0.4)"
                fontFamily="'Inter',sans-serif" fontSize="11">
                score
              </text>
            </svg>
          </div>

          {/* Mastery breakdown */}
          <div className="mastery-grid">
            {[
              { label: 'Mastered',  val: mastered, color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
              { label: 'Shaky',     val: shaky,    color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)'  },
              { label: 'Missed',    val: missed,   color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)'  },
            ].map(({ label, val, color, bg, border }) => (
              <div key={label} className="mastery-card" style={{ background: bg, border: `1px solid ${border}` }}>
                <span className="mastery-val" style={{ color }}>{val}</span>
                <span className="mastery-label" style={{ color }}>{label}</span>
                {/* Bar */}
                <div className="mastery-bar-track">
                  <div className="mastery-bar-fill"
                    style={{ width: `${cards.length ? (val / cards.length) * 100 : 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="done-actions">
            <button className="btn-primary" onClick={() => onFinish({ ...deck, cards })}>
              Back to Library
            </button>
            <button className="btn-ghost" onClick={() => {
              setCurrent(0); setFlipped(false);
              setSession({ correct: 0, incorrect: 0 });
            }}>
              Retry session
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── PRACTICE SCREEN ─────────────────────────────────────────── */
  const pct = Math.round(progress * 100);

  return (
    <>
      <style>{STYLES}</style>

      <div className="practice-wrap">

        {/* ── Header row ── */}
        <div className="practice-header">
          <button className="exit-btn" onClick={() => onFinish({ ...deck, cards })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Exit
          </button>

          <div className="deck-pill">
            <span className="deck-pill-dot" />
            {deck.name}
          </div>

          <div className="counter-badge">
            <span className="counter-current">{current + 1}</span>
            <span className="counter-sep">/</span>
            <span className="counter-total">{cards.length}</span>
          </div>
        </div>

        {/* ── Progress track ── */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          {/* Glowing head */}
          {pct > 0 && pct < 100 && (
            <div className="progress-head" style={{ left: `${pct}%` }} />
          )}
        </div>

        {/* ── Streak bar ── */}
        {session.correct > 0 && (
          <div className={`streak-bar${streakFlash ? ' flash' : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <path d="M13 2L4.09 12.97A1 1 0 005 14.5h5.5L10 22l9.91-10.97A1 1 0 0019 9.5h-5.5L13 2z"/>
            </svg>
            <span>{session.correct} card{session.correct !== 1 ? 's' : ''} in a row</span>
          </div>
        )}

        {/* ── Card ── */}
        <div
          ref={cardRef}
          className={`card-shell anim-${animDir}${flipped ? ' is-flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          tabIndex={0}
          onKeyDown={e => e.code === 'Enter' && setFlipped(f => !f)}
          role="button"
          aria-label={flipped ? 'Card showing answer' : 'Card showing question, press to flip'}
        >
          {/* Decorative grid on card */}
          <svg className="card-grid" viewBox="0 0 540 300" preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="cg" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M36 0L0 0 0 36" fill="none"
                  stroke={flipped ? 'rgba(22,163,74,0.09)' : 'rgba(91,91,214,0.09)'}
                  strokeWidth="0.7"/>
              </pattern>
              <radialGradient id="cgf" cx="50%" cy="50%" r="55%">
                <stop offset="0%"  stopColor="white" stopOpacity="1"/>
                <stop offset="60%" stopColor="white" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </radialGradient>
              <mask id="cgm"><rect width="540" height="300" fill="url(#cgf)"/></mask>
            </defs>
            <rect width="540" height="300" fill="url(#cg)" mask="url(#cgm)"/>
          </svg>

          {/* Card inner */}
          <div className="card-inner">
            {/* Side label */}
            <div className={`card-side-label${flipped ? ' answer' : ''}`}>
              {flipped
                ? <><span className="side-dot answer-dot"/>Answer</>
                : <><span className="side-dot question-dot"/>Question</>
              }
            </div>

            {/* Text */}
            <p className="card-text">
              {flipped ? card.answer : card.question}
            </p>

            {/* Hint */}
            {!flipped && (
              <div className="card-hint">
                <kbd>Space</kbd> or click to flip
              </div>
            )}
          </div>

          {/* Glow overlay on hover — pure CSS */}
          <div className="card-glow" aria-hidden="true" />
        </div>

        {/* ── Rating buttons ── */}
        <div className={`rating-row${flipped ? ' visible' : ''}`}>
          {[
            { q: 1, label: 'Missed',  emoji: '✕', desc: 'Show again',   cls: 'btn-miss'  },
            { q: 3, label: 'Shaky',   emoji: '~', desc: 'Needed a hint', cls: 'btn-shaky' },
            { q: 5, label: 'Got it',  emoji: '✓', desc: 'Felt easy',     cls: 'btn-got'   },
          ].map(({ q, label, emoji, desc, cls }) => (
            <button
              key={q}
              className={`rating-btn ${cls}`}
              onClick={e => { e.stopPropagation(); answer(q); }}
            >
              <span className="rating-emoji">{emoji}</span>
              <span className="rating-label">{label}</span>
              <span className="rating-desc">{desc}</span>
            </button>
          ))}
        </div>

        {/* ── Keyboard hint ── */}
        {!flipped && (
          <p className="keyboard-hint">Press <kbd>Space</kbd> to flip the card</p>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Confetti keyframe ── */
@keyframes confetti-fly {
  0%   { transform: translate(0,0) rotate(0deg); opacity:1; }
  100% { transform: translate(var(--dx), var(--dy)) rotate(360deg); opacity:0; }
}

@keyframes card-in {
  from { opacity:0; transform: translateY(18px) scale(0.97); }
  to   { opacity:1; transform: translateY(0)    scale(1);    }
}
@keyframes card-out-right {
  from { opacity:1; transform: translateX(0)    rotate(0deg);   }
  to   { opacity:0; transform: translateX(80px) rotate(3deg);   }
}
@keyframes card-out-left {
  from { opacity:1; transform: translateX(0)     rotate(0deg);   }
  to   { opacity:0; transform: translateX(-80px) rotate(-3deg);  }
}
@keyframes streak-flash {
  0%,100% { background: rgba(245,158,11,0.08); }
  50%     { background: rgba(245,158,11,0.22); }
}
@keyframes progress-pulse {
  0%,100% { opacity:1; box-shadow: 0 0 6px 2px rgba(91,91,214,0.5); }
  50%     { opacity:0.7; box-shadow: 0 0 12px 4px rgba(91,91,214,0.7); }
}

/* ── Layout ── */
.practice-wrap {
  max-width: 600px;
  margin: 0 auto;
  padding: 8px 0 48px;
  font-family: 'DM Sans', sans-serif;
}

/* ── Header ── */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.exit-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none;
  color: rgba(26,26,46,0.4);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer; padding: 0;
  transition: color 0.15s;
}
.exit-btn:hover { color: rgba(26,26,46,0.75); }

.deck-pill {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(91,91,214,0.14);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12px; font-weight: 600;
  color: #5b5bd6;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 4px rgba(91,91,214,0.08);
  max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.deck-pill-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #5b5bd6; flex-shrink: 0;
}

.counter-badge {
  display: flex; align-items: baseline; gap: 2px;
  font-family: 'Space Grotesk', sans-serif;
}
.counter-current {
  font-size: 17px; font-weight: 900; color: #1a1a2e;
}
.counter-sep {
  font-size: 13px; color: rgba(26,26,46,0.28); margin: 0 1px;
}
.counter-total {
  font-size: 13px; font-weight: 600; color: rgba(26,26,46,0.38);
}

/* ── Progress bar ── */
.progress-track {
  position: relative;
  height: 4px;
  background: rgba(26,26,46,0.07);
  border-radius: 999px;
  margin-bottom: 14px;
  overflow: visible;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5b5bd6 0%, #a78bfa 100%);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
}
.progress-head {
  position: absolute;
  top: 50%; transform: translate(-50%,-50%);
  width: 8px; height: 8px;
  background: #a78bfa;
  border-radius: 50%;
  animation: progress-pulse 1.6s ease-in-out infinite;
}

/* ── Streak bar ── */
.streak-bar {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px; font-weight: 600;
  color: #b45309;
  margin-bottom: 18px;
  transition: background 0.3s;
}
.streak-bar.flash {
  animation: streak-flash 0.5s ease;
}

/* ── Card shell ── */
.card-shell {
  position: relative;
  background:
    radial-gradient(ellipse 70% 60% at 50% 110%, rgba(91,91,214,0.06) 0%, transparent 70%),
    rgba(255,255,255,0.80);
  border: 1px solid rgba(91,91,214,0.13);
  border-radius: 22px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 18px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 4px 24px rgba(91,91,214,0.07),
    0 1px 4px rgba(0,0,0,0.05);
  transition:
    border-color 0.22s,
    box-shadow 0.22s,
    transform 0.18s;
  outline: none;
}

/* Hover lift */
.card-shell:hover {
  border-color: rgba(91,91,214,0.28);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 8px 40px rgba(91,91,214,0.13),
    0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-3px);
}
.card-shell:active {
  transform: translateY(-1px) scale(0.995);
}

/* Flipped state */
.card-shell.is-flipped {
  background:
    radial-gradient(ellipse 70% 60% at 50% 110%, rgba(22,163,74,0.06) 0%, transparent 70%),
    rgba(255,255,255,0.84);
  border-color: rgba(22,163,74,0.18);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 6px 32px rgba(22,163,74,0.09),
    0 1px 4px rgba(0,0,0,0.05);
}
.card-shell.is-flipped:hover {
  border-color: rgba(22,163,74,0.32);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 10px 44px rgba(22,163,74,0.13),
    0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-3px);
}

/* Glow hover overlay */
.card-glow {
  position: absolute; inset: 0; border-radius: 22px;
  background: radial-gradient(ellipse 60% 50% at 50% 0%,
    rgba(91,91,214,0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}
.card-shell:hover .card-glow { opacity: 1; }

/* Card animations */
.card-shell.anim-in {
  animation: card-in 0.32s cubic-bezier(0.22,1,0.36,1) forwards;
}
.card-shell.anim-out-right {
  animation: card-out-right 0.26s ease-in forwards;
}
.card-shell.anim-out-left {
  animation: card-out-left 0.26s ease-in forwards;
}

/* Decorative grid */
.card-grid {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 0;
  border-radius: 22px;
  transition: opacity 0.3s;
}

/* Card inner content */
.card-inner {
  position: relative; z-index: 2;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex: 1;
  padding: 42px 40px 36px;
  text-align: center;
}

/* Side label */
.card-side-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.10em; text-transform: uppercase;
  color: rgba(91,91,214,0.65);
  margin-bottom: 24px;
  transition: color 0.25s;
}
.card-side-label.answer { color: rgba(22,163,74,0.65); }

.side-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink:0;
}
.question-dot { background: rgba(91,91,214,0.5); }
.answer-dot   { background: rgba(22,163,74,0.5); }

/* Card text */
.card-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.18rem;
  font-weight: 400;
  line-height: 1.72;
  color: #1a1a2e;
  max-width: 440px;
  letter-spacing: -0.01em;
}

/* Hint */
.card-hint {
  margin-top: 28px;
  display: flex; align-items: center; gap: 6px;
  color: rgba(26,26,46,0.28);
  font-size: 12px; font-weight: 500;
}
.card-hint kbd,
.keyboard-hint kbd {
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(26,26,46,0.14);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 1px 7px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 600;
  color: rgba(26,26,46,0.5);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.keyboard-hint {
  text-align: center;
  font-size: 12px;
  color: rgba(26,26,46,0.28);
  margin-top: 10px;
}

/* ── Rating buttons ── */
.rating-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.rating-row.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.rating-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px 10px 14px;
  border-radius: 16px;
  border: 1px solid;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
  position: relative; overflow: hidden;
}

.rating-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.3);
  opacity: 0;
  transition: opacity 0.15s;
}
.rating-btn:hover::before { opacity: 1; }
.rating-btn:hover { transform: translateY(-3px); }
.rating-btn:active { transform: translateY(-1px) scale(0.97); }

.btn-miss  {
  background: rgba(220,38,38,0.07);
  border-color: rgba(220,38,38,0.22);
  box-shadow: 0 2px 12px rgba(220,38,38,0.06);
}
.btn-miss:hover {
  background: rgba(220,38,38,0.11);
  box-shadow: 0 6px 20px rgba(220,38,38,0.12);
}

.btn-shaky {
  background: rgba(217,119,6,0.07);
  border-color: rgba(217,119,6,0.22);
  box-shadow: 0 2px 12px rgba(217,119,6,0.06);
}
.btn-shaky:hover {
  background: rgba(217,119,6,0.11);
  box-shadow: 0 6px 20px rgba(217,119,6,0.12);
}

.btn-got {
  background: rgba(22,163,74,0.07);
  border-color: rgba(22,163,74,0.22);
  box-shadow: 0 2px 12px rgba(22,163,74,0.06);
}
.btn-got:hover {
  background: rgba(22,163,74,0.11);
  box-shadow: 0 6px 20px rgba(22,163,74,0.12);
}

.rating-emoji {
  font-size: 18px; line-height: 1;
  font-family: monospace;
}
.btn-miss  .rating-emoji { color: #dc2626; }
.btn-shaky .rating-emoji { color: #d97706; }
.btn-got   .rating-emoji { color: #16a34a; }

.rating-label {
  font-size: 14px; font-weight: 700;
  letter-spacing: -0.01em;
}
.btn-miss  .rating-label { color: #dc2626; }
.btn-shaky .rating-label { color: #d97706; }
.btn-got   .rating-label { color: #16a34a; }

.rating-desc {
  font-size: 11px; font-weight: 400;
  color: rgba(26,26,46,0.35);
}

/* ── DONE SCREEN ── */
.done-wrap {
  max-width: 500px;
  margin: 0 auto;
  padding: 3rem 0 5rem;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  font-family: 'DM Sans', sans-serif;
}

.done-trophy {
  position: relative;
  width: 76px; height: 76px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.trophy-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(91,91,214,0.15) 0%,
    rgba(91,91,214,0.05) 55%,
    transparent 75%
  );
  border: 1px solid rgba(91,91,214,0.18);
  box-shadow:
    0 0 0 6px rgba(91,91,214,0.05),
    0 0 24px rgba(91,91,214,0.12);
}

.done-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem; font-weight: 900;
  letter-spacing: -0.6px;
  color: #0a0a0a;
  margin-bottom: 8px;
}
.done-sub {
  font-size: 14px;
  color: rgba(26,26,46,0.45);
  margin-bottom: 28px;
}
.done-sub strong { color: rgba(26,26,46,0.7); font-weight: 600; }

.score-ring-wrap { margin-bottom: 28px; }

.mastery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-bottom: 32px;
}
.mastery-card {
  border-radius: 16px;
  padding: 16px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.mastery-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem; font-weight: 900;
  line-height: 1;
}
.mastery-label {
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.mastery-bar-track {
  width: 100%; height: 3px;
  background: rgba(26,26,46,0.07);
  border-radius: 999px;
  margin-top: 10px;
  overflow: hidden;
}
.mastery-bar-fill {
  height: 100%; border-radius: 999px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

.done-actions {
  display: flex; gap: 10px;
}
.btn-primary {
  padding: 11px 28px;
  background: linear-gradient(135deg, #5b5bd6 0%, #7c6ff7 100%);
  border: none; border-radius: 12px;
  color: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 16px rgba(91,91,214,0.28), 0 1px 0 rgba(255,255,255,0.15) inset;
  transition: all 0.18s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(91,91,214,0.35), 0 1px 0 rgba(255,255,255,0.15) inset;
}
.btn-ghost {
  padding: 11px 24px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(91,91,214,0.18);
  border-radius: 12px;
  color: #5b5bd6; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(91,91,214,0.10);
}
`;
