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
    if (reps === 0) {
      // First time correct: "Got it!" jumps to mastered (reps=2), "Shaky" stays at learning (reps=1)
      interval = quality === 5 ? 3 : 1;
      reps = quality === 5 ? 2 : 1;
    } else if (reps === 1) {
      interval = 6;
      reps = 2;
    } else {
      interval = Math.round(interval * ease);
      reps += 1;
    }
    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < 1.3) ease = 1.3;
  } else {
    reps = 0;
    interval = 1;
  }
  return { ...card, ease, interval, reps };
}

function spawnConfetti(container: HTMLElement) {
  const colors = ['#7F77DD', '#AFA9EC', '#1D9E75', '#5DCAA5', '#EF9F27', '#D4537E', '#85B7EB'];
  for (let i = 0; i < 28; i++) {
    const dot = document.createElement('span');
    const size = Math.random() * 9 + 5;
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    dot.style.cssText = `
      position:absolute;pointer-events:none;border-radius:${shape};
      width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${20 + Math.random() * 60}%;top:40%;
      opacity:1;z-index:30;
      animation:confetti-fly ${0.7 + Math.random() * 0.7}s ease-out forwards;
      --dx:${(Math.random() - 0.5) * 200}px;
      --dy:${-(Math.random() * 140 + 60)}px;
    `;
    container.appendChild(dot);
    setTimeout(() => dot.remove(), 1500);
  }
}

export default function Practice({
  deck,
  onFinish,
  onRegisterSave,
}: {
  deck: Deck;
  onFinish: (updatedDeck: Deck) => void;
  onRegisterSave?: (saveFn: () => void) => void;
}) {
  const initCards = (src: Card[]) =>
    src.map(c => ({
      ...c,
      ease:     c.ease     || 2.5,
      interval: c.interval || 1,
      reps:     c.reps     || 0,
    }));

  const [cards, setCards] = useState<Card[]>(() => initCards(deck.cards));
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Record<number, number>>({});
  const [session, setSession] = useState({ correct: 0, incorrect: 0 });
  const [animDir, setAnimDir] = useState<'in' | 'out-left' | 'out-right'>('in');
  const [streakFlash, setStreakFlash] = useState(false);
  const [showKeyHint, setShowKeyHint] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Re-initialize when deck changes — critical so re-practicing a deck
  // picks up the updated reps/ease/interval from the previous session.
  useEffect(() => {
    setCards(initCards(deck.cards));
    setCurrent(0);
    setFlipped(false);
    setSessionRatings({});
    setSession({ correct: 0, incorrect: 0 });
    setAnimDir('in');
    setShowKeyHint(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id]);

  const card = cards[current];
  const done = current >= cards.length;
  const progress = current / cards.length;

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      }
      if (flipped) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') answer(1);
        if (e.code === 'Digit2' || e.code === 'Numpad2') answer(3);
        if (e.code === 'Digit3' || e.code === 'Numpad3') answer(5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, done, current]);

  /* Hide keyboard hint after first flip */
  useEffect(() => {
    if (flipped) setShowKeyHint(false);
  }, [flipped]);

  /* Register a save function with parent so nav-away always persists card state */
  useEffect(() => {
    if (!onRegisterSave) return;
    onRegisterSave(() => {
      onFinish({ ...deck, cards });
    });
  }, [cards, deck, onFinish, onRegisterSave]);

  const answer = (quality: number) => {
    if (quality === 5 && cardRef.current) spawnConfetti(cardRef.current);
    setAnimDir(quality >= 3 ? 'out-right' : 'out-left');

    // Capture current values NOW (before the 280ms timeout) to avoid stale closure
    const cardSnapshot = card;
    const indexSnapshot = current;

    setTimeout(() => {
      const updatedCard = sm2(cardSnapshot, quality);
      setCards(prev => {
        const next = [...prev];
        next[indexSnapshot] = updatedCard;
        return next;
      });
      setSessionRatings(prev => ({ ...prev, [indexSnapshot]: quality }));
      setSession(prev => ({
        correct:   quality >= 3 ? prev.correct   + 1 : prev.correct,
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
    const score = Math.round((session.correct / cards.length) * 100);
    // Use session ratings: Got it (5) = mastered, Shaky (3) = shaky, Missed (1) = missed
    const ratings = Object.values(sessionRatings);
    const mastered = ratings.filter(q => q === 5).length;
    const shaky = ratings.filter(q => q === 3).length;
    const missed = ratings.filter(q => q === 1).length;
    const circ = 2 * Math.PI * 46;

    return (
      <>
        <style>{STYLES}</style>
        <div className="done-wrap">

          <div className="done-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="done-title">Session complete!</h2>
          <p className="done-sub">
            You reviewed all <strong>{cards.length}</strong> cards this session.
          </p>

          <div className="score-ring-wrap">
            <svg width="116" height="116" viewBox="0 0 116 116">
              <circle cx="58" cy="58" r="46" fill="none" stroke="#EEEDFE" strokeWidth="9" />
              <circle
                cx="58" cy="58" r="46" fill="none" stroke="#7F77DD" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                strokeDashoffset={`${circ * (1 - score / 100)}`}
                transform="rotate(-90 58 58)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <text x="58" y="54" textAnchor="middle" fill="currentColor"
                fontFamily="'Fraunces', Georgia, serif" fontWeight="700" fontSize="24"
                style={{ fill: 'var(--done-text)' }}>
                {score}%
              </text>
              <text x="58" y="70" textAnchor="middle" fontSize="12"
                style={{ fill: 'var(--done-muted)' }} fontFamily="'DM Sans', sans-serif">
                score
              </text>
            </svg>
          </div>

          <div className="mastery-grid">
            {[
              { label: 'Mastered', val: mastered, cls: 'mc-green' },
              { label: 'Shaky', val: shaky, cls: 'mc-amber' },
              { label: 'Missed', val: missed, cls: 'mc-red' },
            ].map(({ label, val, cls }) => (
              <div key={label} className={`mastery-card ${cls}`}>
                <span className="mastery-val">{val}</span>
                <span className="mastery-label">{label}</span>
                <div className="mastery-bar-track">
                  <div
                    className="mastery-bar-fill"
                    style={{ width: `${cards.length ? (val / cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="done-actions">
            <button className="btn-primary" onClick={() => onFinish({ ...deck, cards })}>
              Back to Library
            </button>
            <button className="btn-ghost" onClick={() => {
              setCurrent(0);
              setFlipped(false);
              setSession({ correct: 0, incorrect: 0 });
              setSessionRatings({});
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

        {/* ── Header ── */}
        <div className="practice-header">
          <button className="exit-btn" onClick={() => onFinish({ ...deck, cards })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
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

        {/* ── Progress bar ── */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          {pct > 0 && pct < 100 && (
            <div className="progress-head" style={{ left: `${pct}%` }} />
          )}
        </div>

        {/* ── Streak ── */}
        {session.correct > 1 && (
          <div className={`streak-bar${streakFlash ? ' flash' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF9F27">
              <path d="M13 2L4.09 12.97A1 1 0 005 14.5h5.5L10 22l9.91-10.97A1 1 0 0019 9.5h-5.5z" />
            </svg>
            {session.correct} correct in a row!
          </div>
        )}

        {/* ── Card ── */}
        <div
          ref={cardRef}
          className={`card-shell anim-${animDir}${flipped ? ' is-flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          tabIndex={0}
          onKeyDown={e => {
            if (e.code === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
          }}
          role="button"
          aria-label={flipped ? 'Showing answer — click to flip back' : 'Showing question — click to reveal answer'}
        >
          {!flipped ? (
            /* Question face */
            <div className="card-face face-front">
              <div className="card-side-label tag-q">
                <span className="side-dot dot-q" />
                Question
              </div>
              <p className="card-text">{card.question}</p>
              <div className="card-bottom-hint">
                <span className="tap-hint">Tap to reveal</span>
                <span className="kbd-hint"><kbd>Space</kbd> to flip</span>
              </div>
            </div>
          ) : (
            /* Answer face */
            <div className="card-face face-back">
              <div className="card-side-label tag-a">
                <span className="side-dot dot-a" />
                Answer
              </div>
              <p className="card-text answer-text">{card.answer}</p>
              <div className="card-bottom-hint">
                <span className="kbd-hint">Rate: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span>
              </div>
            </div>
          )}
        </div>

        {/* ── Rating buttons ── */}
        <div className={`rating-row${flipped ? ' visible' : ''}`}>
          {[
            { q: 1, label: 'Missed', sub: 'Show again soon', cls: 'btn-miss', icon: '✕' },
            { q: 3, label: 'Shaky', sub: 'Needed effort', cls: 'btn-shaky', icon: '~' },
            { q: 5, label: 'Got it!', sub: 'Easy recall', cls: 'btn-got', icon: '✓' },
          ].map(({ q, label, sub, cls, icon }) => (
            <button
              key={q}
              className={`rating-btn ${cls}`}
              onClick={e => { e.stopPropagation(); answer(q); }}
            >
              <span className="r-icon-wrap">
                <span className="r-icon">{icon}</span>
              </span>
              <span className="r-label">{label}</span>
              <span className="r-sub">{sub}</span>
              <span className="r-key">{q}</span>
            </button>
          ))}
        </div>

        {/* ── Bottom keyboard hint ── */}
        {!flipped && showKeyHint && (
          <p className="bottom-kb-hint">
            Press <kbd>Space</kbd> to flip the card
          </p>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Confetti ── */
@keyframes confetti-fly {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
  100% { transform: translate(var(--dx), var(--dy)) rotate(480deg) scale(0.3); opacity:0; }
}

/* ── Card animations ── */
@keyframes card-in {
  from { opacity:0; transform: translateY(24px) scale(0.96); }
  to   { opacity:1; transform: translateY(0)    scale(1); }
}
@keyframes card-out-right {
  from { opacity:1; transform: translateX(0)    rotate(0deg); }
  to   { opacity:0; transform: translateX(96px) rotate(5deg); }
}
@keyframes card-out-left {
  from { opacity:1; transform: translateX(0)     rotate(0deg); }
  to   { opacity:0; transform: translateX(-96px) rotate(-5deg); }
}

/* ── Streak flash ── */
@keyframes streak-flash {
  0%,100% { background: rgba(239,159,39,0.10); }
  40%     { background: rgba(239,159,39,0.28); transform: scale(1.03); }
}

/* ── Progress pulse ── */
@keyframes head-pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(127,119,221,0.25); }
  50%     { box-shadow: 0 0 0 6px rgba(127,119,221,0.10); }
}

/* ── Face fade ── */
@keyframes face-appear {
  from { opacity:0; transform: translateY(6px); }
  to   { opacity:1; transform: translateY(0); }
}

/* ────────────────────────────────────────────
   CSS VARIABLES
──────────────────────────────────────────── */
:root {
  --brand: #7F77DD;
  --brand-dark: #534AB7;
  --brand-light: #EEEDFE;
  --green: #1D9E75;
  --green-light: #E1F5EE;
  --green-mid: #9FE1CB;
  --amber: #BA7517;
  --amber-light: #FAEEDA;
  --amber-mid: #FAC775;
  --red: #E24B4A;
  --red-light: #FCEBEB;
  --red-mid: #F7C1C1;
  --done-text: #1a1a2e;
  --done-muted: #888;
  --card-bg: rgba(255,255,255,0.92);
  --card-border: rgba(127,119,221,0.14);
  --card-shadow: 0 2px 32px rgba(127,119,221,0.08), 0 1px 4px rgba(0,0,0,0.05);
  --text-primary: #0f0f1a;
  --text-secondary: rgba(15,15,26,0.45);
  --radius-card: 24px;
  --radius-btn: 16px;
}

/* ────────────────────────────────────────────
   LAYOUT
──────────────────────────────────────────── */
.practice-wrap {
  max-width: 620px;
  margin: 0 auto;
  padding: 10px 2px 56px;
  font-family: 'DM Sans', sans-serif;
}

/* ────────────────────────────────────────────
   HEADER
──────────────────────────────────────────── */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.exit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.15s, color 0.15s;
}
.exit-btn:hover {
  background: rgba(127,119,221,0.07);
  color: var(--brand-dark);
}

.deck-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.75);
  border: 1px solid var(--card-border);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand-dark);
  letter-spacing: 0.01em;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 6px rgba(127,119,221,0.07);
}
.deck-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand);
  flex-shrink: 0;
}

.counter-badge {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'Fraunces', Georgia, serif;
}
.counter-current {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
}
.counter-sep {
  font-size: 14px;
  color: rgba(15,15,26,0.22);
  margin: 0 2px;
}
.counter-total {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* ────────────────────────────────────────────
   PROGRESS BAR
──────────────────────────────────────────── */
.progress-track {
  position: relative;
  height: 5px;
  background: rgba(15,15,26,0.07);
  border-radius: 999px;
  margin-bottom: 16px;
  overflow: visible;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7F77DD 0%, #AFA9EC 100%);
  border-radius: 999px;
  transition: width 0.55s cubic-bezier(0.4,0,0.2,1);
}
.progress-head {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #AFA9EC;
  border-radius: 50%;
  border: 2px solid white;
  animation: head-pulse 1.8s ease-in-out infinite;
}

/* ────────────────────────────────────────────
   STREAK
──────────────────────────────────────────── */
.streak-bar {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(239,159,39,0.10);
  border: 1px solid rgba(239,159,39,0.25);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: #633806;
  margin-bottom: 20px;
}
.streak-bar.flash {
  animation: streak-flash 0.55s ease;
}

/* ────────────────────────────────────────────
   CARD SHELL
──────────────────────────────────────────── */
.card-shell {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  min-height: 300px;
  height: 300px;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.2s cubic-bezier(0.22,1,0.36,1);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.card-shell:hover {
  border-color: rgba(127,119,221,0.30);
  box-shadow: 0 8px 48px rgba(127,119,221,0.14), 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-5px) scale(1.005);
}
.card-shell:active {
  transform: translateY(-2px) scale(0.997);
}
.card-shell:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

/* Flipped state — green tint */
.card-shell.is-flipped {
  border-color: rgba(29,158,117,0.22);
  background: rgba(255,255,255,0.95);
  box-shadow: 0 6px 40px rgba(29,158,117,0.10), 0 1px 4px rgba(0,0,0,0.05);
}
.card-shell.is-flipped:hover {
  border-color: rgba(29,158,117,0.38);
  box-shadow: 0 10px 52px rgba(29,158,117,0.16), 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-5px) scale(1.005);
}

/* Card entry/exit animations */
.card-shell.anim-in { animation: card-in 0.34s cubic-bezier(0.22,1,0.36,1) forwards; }
.card-shell.anim-out-right { animation: card-out-right 0.26s ease-in forwards; }
.card-shell.anim-out-left  { animation: card-out-left  0.26s ease-in forwards; }

/* ────────────────────────────────────────────
   CARD FACES
──────────────────────────────────────────── */
.card-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 52px 52px;
  text-align: center;
  transition: opacity 0.18s ease;
  visibility: visible;
}
.face-back {
  animation: face-appear 0.22s ease forwards;
}

/* Side label */
.card-side-label {
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.tag-q { color: rgba(127,119,221,0.7); }
.tag-a { color: rgba(29,158,117,0.75); }

.side-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-q { background: rgba(127,119,221,0.55); }
.dot-a { background: rgba(29,158,117,0.60); }

/* ── THE MAIN TEXT — BIG AND READABLE ── */
.card-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.45rem;
  font-weight: 400;
  line-height: 1.75;
  color: var(--text-primary);
  max-width: 460px;
  letter-spacing: -0.012em;
}
.answer-text {
  color: #0f1a14;
}

/* Bottom hint inside card */
.card-bottom-hint {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.tap-hint {
  font-size: 12px;
  color: var(--text-secondary);
  display: none;
}
@media (hover: none) {
  .tap-hint { display: inline; }
  .kbd-hint { display: none; }
}
.kbd-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(15,15,26,0.13);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 1px 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  line-height: 1.7;
}

/* ────────────────────────────────────────────
   RATING BUTTONS
──────────────────────────────────────────── */
.rating-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.24s ease, transform 0.24s ease;
}
.rating-row.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.rating-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 18px 10px 16px;
  border-radius: var(--radius-btn);
  border: 1px solid;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}
.rating-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.25);
  opacity: 0;
  transition: opacity 0.15s;
}
.rating-btn:hover::after { opacity: 1; }
.rating-btn:hover { transform: translateY(-5px); }
.rating-btn:active { transform: translateY(-2px) scale(0.97); }
.rating-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

/* Missed */
.btn-miss {
  background: #FCEBEB;
  border-color: #F7C1C1;
  box-shadow: 0 2px 14px rgba(226,75,74,0.07);
}
.btn-miss:hover {
  background: #F9DADA;
  box-shadow: 0 6px 28px rgba(226,75,74,0.14);
}

/* Shaky */
.btn-shaky {
  background: #FAEEDA;
  border-color: #FAC775;
  box-shadow: 0 2px 14px rgba(186,117,23,0.07);
}
.btn-shaky:hover {
  background: #F5E4C4;
  box-shadow: 0 6px 28px rgba(186,117,23,0.14);
}

/* Got it */
.btn-got {
  background: #E1F5EE;
  border-color: #9FE1CB;
  box-shadow: 0 2px 14px rgba(29,158,117,0.07);
}
.btn-got:hover {
  background: #C8EDDF;
  box-shadow: 0 6px 28px rgba(29,158,117,0.14);
}

/* Icon circle */
.r-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.btn-miss  .r-icon-wrap { background: #F7C1C1; }
.btn-shaky .r-icon-wrap { background: #FAC775; }
.btn-got   .r-icon-wrap { background: #9FE1CB; }

.r-icon {
  font-size: 17px;
  font-family: monospace;
  line-height: 1;
  font-weight: 700;
}
.btn-miss  .r-icon { color: #791F1F; }
.btn-shaky .r-icon { color: #633806; }
.btn-got   .r-icon { color: #085041; }

.r-label {
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.btn-miss  .r-label { color: #A32D2D; }
.btn-shaky .r-label { color: #854F0B; }
.btn-got   .r-label { color: #0F6E56; }

.r-sub {
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(15,15,26,0.38);
}

/* Keyboard number badge */
.r-key {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 10px;
  font-weight: 600;
  opacity: 0.32;
  font-family: 'DM Sans', sans-serif;
}
.btn-miss  .r-key { color: #A32D2D; }
.btn-shaky .r-key { color: #854F0B; }
.btn-got   .r-key { color: #0F6E56; }

@media (hover: none) { .r-key { display: none; } }

/* ── Bottom keyboard hint ── */
.bottom-kb-hint {
  text-align: center;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
@media (hover: none) { .bottom-kb-hint { display: none; } }

/* ────────────────────────────────────────────
   DONE SCREEN
──────────────────────────────────────────── */
.done-wrap {
  max-width: 500px;
  margin: 0 auto;
  padding: 3rem 0 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-family: 'DM Sans', sans-serif;
}

.done-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #EEEDFE;
  border: 1px solid #AFA9EC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  box-shadow: 0 0 0 8px rgba(127,119,221,0.07);
}

.done-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 9px;
}
.done-sub {
  font-size: 14.5px;
  color: var(--text-secondary);
  margin-bottom: 30px;
}
.done-sub strong {
  color: rgba(15,15,26,0.7);
  font-weight: 600;
}

.score-ring-wrap { margin-bottom: 30px; }

/* Mastery grid */
.mastery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-bottom: 36px;
}
.mastery-card {
  border-radius: 18px;
  padding: 20px 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border: 1px solid;
}
.mc-green { background: #E1F5EE; border-color: #9FE1CB; }
.mc-amber { background: #FAEEDA; border-color: #FAC775; }
.mc-red   { background: #FCEBEB; border-color: #F7C1C1; }

.mastery-val {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
}
.mc-green .mastery-val { color: #085041; }
.mc-amber .mastery-val { color: #633806; }
.mc-red   .mastery-val { color: #791F1F; }

.mastery-label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.mc-green .mastery-label { color: #0F6E56; }
.mc-amber .mastery-label { color: #854F0B; }
.mc-red   .mastery-label { color: #A32D2D; }

.mastery-bar-track {
  width: 100%;
  height: 3px;
  background: rgba(15,15,26,0.09);
  border-radius: 999px;
  margin-top: 12px;
  overflow: hidden;
}
.mastery-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.85s cubic-bezier(0.4,0,0.2,1);
}
.mc-green .mastery-bar-fill { background: #1D9E75; }
.mc-amber .mastery-bar-fill { background: #BA7517; }
.mc-red   .mastery-bar-fill { background: #E24B4A; }

.done-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary {
  padding: 12px 30px;
  background: var(--brand);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 20px rgba(127,119,221,0.30);
  transition: all 0.2s;
}
.btn-primary:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(127,119,221,0.38);
}
.btn-primary:active { transform: translateY(0) scale(0.97); }

.btn-ghost {
  padding: 12px 26px;
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(127,119,221,0.20);
  border-radius: 14px;
  color: var(--brand-dark);
  font-family: 'DM Sans', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: var(--brand-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 18px rgba(127,119,221,0.12);
}
.btn-ghost:active { transform: translateY(0) scale(0.97); }
`;
