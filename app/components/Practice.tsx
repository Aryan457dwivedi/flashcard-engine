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
  const colors = ['#7F77DD','#AFA9EC','#1D9E75','#5DCAA5','#EF9F27','#D4537E','#85B7EB'];
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

function attachCometTilt(
  wrap: HTMLElement,
  glare: HTMLElement,
  ROTATE = 15,
  TRANSLATE = 16
) {
  let rX=0,rY=0,tX=0,tY=0,gX=50,gY=50,sc=1;
  let tRX=0,tRY=0,tTX=0,tTY=0,tGX=50,tGY=50,tSc=1;
  let raf: number | null = null;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  function tick() {
    const s = 0.18;
    rX=lerp(rX,tRX,s); rY=lerp(rY,tRY,s);
    tX=lerp(tX,tTX,s); tY=lerp(tY,tTY,s);
    gX=lerp(gX,tGX,s); gY=lerp(gY,tGY,s);
    sc=lerp(sc,tSc,0.18);
    wrap.style.transform =
      `rotateX(${rX.toFixed(3)}deg) rotateY(${rY.toFixed(3)}deg) ` +
      `translateX(${tX.toFixed(2)}px) translateY(${tY.toFixed(2)}px) ` +
      `scale(${sc.toFixed(4)})`;
    glare.style.background =
      `radial-gradient(circle at ${gX.toFixed(1)}% ${gY.toFixed(1)}%, ` +
      `rgba(255,255,255,0.88) 5%, rgba(255,255,255,0.60) 18%, rgba(255,255,255,0) 75%)`;
    const done =
      Math.abs(rX-tRX)<0.02 && Math.abs(rY-tRY)<0.02 &&
      Math.abs(tX-tTX)<0.1  && Math.abs(tY-tTY)<0.1  &&
      Math.abs(sc-tSc)<0.001;
    raf = done ? null : requestAnimationFrame(tick);
  }

  function go() { if (!raf) raf = requestAnimationFrame(tick); }

  function onMove(e: MouseEvent) {
    const r = wrap.getBoundingClientRect();
    const xp = (e.clientX - r.left) / r.width - 0.5;
    const yp = (e.clientY - r.top)  / r.height - 0.5;
    tRX=yp*-ROTATE; tRY=xp*ROTATE;
    tTX=xp*-TRANSLATE; tTY=yp*TRANSLATE;
    tGX=(xp+0.5)*100; tGY=(yp+0.5)*100;
    tSc=1.04; go();
  }

  function onLeave() {
    tRX=0; tRY=0; tTX=0; tTY=0; tGX=50; tGY=50; tSc=1; go();
  }

  wrap.addEventListener('mousemove', onMove);
  wrap.addEventListener('mouseleave', onLeave);

  return () => {
    wrap.removeEventListener('mousemove', onMove);
    wrap.removeEventListener('mouseleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
  };
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

  const [cards, setCards]                   = useState<Card[]>(() => initCards(deck.cards));
  const [current, setCurrent]               = useState(0);
  const [flipped, setFlipped]               = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Record<number, number>>({});
  const [session, setSession]               = useState({ correct: 0, incorrect: 0 });
  const [animDir, setAnimDir]               = useState<'in'|'out-left'|'out-right'>('in');
  const [streakFlash, setStreakFlash]        = useState(false);
  const [showKeyHint, setShowKeyHint]        = useState(true);

  const cometRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

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

  /* Attach comet tilt whenever card is visible */
  useEffect(() => {
    if (!cometRef.current || !glareRef.current) return;
    const cleanup = attachCometTilt(cometRef.current, glareRef.current);
    return cleanup;
  });

  const card = cards[current];
  const done = current >= cards.length;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, done, current]);

  useEffect(() => { if (flipped) setShowKeyHint(false); }, [flipped]);

  useEffect(() => {
    if (!onRegisterSave) return;
    onRegisterSave(() => { onFinish({ ...deck, cards }); });
  }, [cards, deck, onFinish, onRegisterSave]);

  const answer = (quality: number) => {
    if (quality === 5 && cometRef.current) spawnConfetti(cometRef.current);
    setAnimDir(quality >= 3 ? 'out-right' : 'out-left');
    const cardSnapshot  = card;
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
    const score    = Math.round((session.correct / cards.length) * 100);
    const ratings  = Object.values(sessionRatings);
    const mastered = ratings.filter(q => q === 5).length;
    const shaky    = ratings.filter(q => q === 3).length;
    const missed   = ratings.filter(q => q === 1).length;
    const circ     = 2 * Math.PI * 46;

    return (
      <>
        <style>{STYLES}</style>
        <div className="done-wrap">
          <div className="done-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="done-title">Session complete!</h2>
          <p className="done-sub">
            You reviewed all <strong>{cards.length}</strong> cards this session.
          </p>
          <div className="score-ring-wrap">
            <svg width="116" height="116" viewBox="0 0 116 116">
              <circle cx="58" cy="58" r="46" fill="none" stroke="#EEEDFE" strokeWidth="9"/>
              <circle cx="58" cy="58" r="46" fill="none" stroke="#7F77DD" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                strokeDashoffset={`${circ * (1 - score / 100)}`}
                transform="rotate(-90 58 58)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <text x="58" y="54" textAnchor="middle"
                fontFamily="'Fraunces',Georgia,serif" fontWeight="700" fontSize="24"
                fill="#1a1a2e">
                {score}%
              </text>
              <text x="58" y="70" textAnchor="middle" fontSize="12" fill="#888"
                fontFamily="'DM Sans',sans-serif">
                score
              </text>
            </svg>
          </div>
          <div className="mastery-grid">
            {[
              { label: 'Mastered', val: mastered, cls: 'mc-green' },
              { label: 'Shaky',    val: shaky,    cls: 'mc-amber' },
              { label: 'Missed',   val: missed,   cls: 'mc-red'   },
            ].map(({ label, val, cls }) => (
              <div key={label} className={`mastery-card ${cls}`}>
                <span className="mastery-val">{val}</span>
                <span className="mastery-label">{label}</span>
                <div className="mastery-bar-track">
                  <div className="mastery-bar-fill"
                    style={{ width: `${cards.length ? (val / cards.length) * 100 : 0}%` }}/>
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
              setSession({ correct: 0, incorrect: 0 }); setSessionRatings({});
            }}>
              Retry session
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── PRACTICE SCREEN ─────────────────────────────────────────── */
  const pct = Math.round((current / cards.length) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className="practice-wrap">

        {/* Header */}
        <div className="practice-header">
          <button className="exit-btn" onClick={() => onFinish({ ...deck, cards })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Exit
          </button>
          <div className="deck-tag">
            {deck.name}
          </div>
          <div className="counter-badge">
            <span className="counter-current">{current + 1}</span>
            <span className="counter-sep">/</span>
            <span className="counter-total">{cards.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }}/>
        </div>

        {/* Streak */}
        {session.correct > 1 && (
          <div className={`streak-bar${streakFlash ? ' flash' : ''}`}>
            {session.correct} correct in a row!
          </div>
        )}

        {/* Card stack — no ghost cards, just the comet tilt wrapper */}
        <div className="stack-wrap">
          <div className="comet-wrap" ref={cometRef}>
            <div
              className={`card-shell anim-${animDir}${flipped ? ' is-flipped' : ''}`}
              onClick={() => setFlipped(f => !f)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.code === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
              }}
              role="button"
              aria-label={flipped ? 'Showing answer' : 'Showing question'}
            >
              {!flipped ? (
                <div className="card-face face-front">
                  {/* Label: no dot, black text */}
                  <div className="card-side-label">Question</div>
                  <p className="card-text">{card.question}</p>
                  <div className="card-bottom-hint">
                    <span className="tap-hint">Tap to reveal</span>
                    <span className="kbd-hint"><kbd>Space</kbd> to flip</span>
                  </div>
                </div>
              ) : (
                <div className="card-face face-back">
                  {/* Label: no dot, black text */}
                  <div className="card-side-label">Answer</div>
                  <p className="card-text answer-text">{card.answer}</p>
                </div>
              )}
            </div>
            {/* Glare overlay */}
            <div className="card-glare" ref={glareRef}/>
          </div>
        </div>

        {/* Rating buttons */}
        <div className={`rating-row${flipped ? ' visible' : ''}`}>
          {[
            { q: 1, label: 'Missed',  sub: 'Show again soon', cls: 'btn-miss',  icon: '✕' },
            { q: 3, label: 'Shaky',   sub: 'Needed effort',   cls: 'btn-shaky', icon: '~' },
            { q: 5, label: 'Got it!', sub: 'Easy recall',     cls: 'btn-got',   icon: '✓' },
          ].map(({ q, label, sub, cls, icon }) => (
            <button key={q} className={`rating-btn ${cls}`}
              onClick={e => { e.stopPropagation(); answer(q); }}>
              <span className="r-icon">{icon}</span>
              <span className="r-label">{label}</span>
              <span className="r-sub">{sub}</span>
            </button>
          ))}
        </div>

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

@keyframes confetti-fly {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
  100% { transform: translate(var(--dx), var(--dy)) rotate(480deg) scale(0.3); opacity:0; }
}
@keyframes card-in {
  from { opacity:0; transform: translateY(28px) scale(0.95); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
@keyframes card-out-right {
  from { opacity:1; transform: translateX(0) rotate(0deg); }
  to   { opacity:0; transform: translateX(110px) rotate(6deg); }
}
@keyframes card-out-left {
  from { opacity:1; transform: translateX(0) rotate(0deg); }
  to   { opacity:0; transform: translateX(-110px) rotate(-6deg); }
}
@keyframes streak-flash {
  0%,100% { background: rgba(239,159,39,0.12); }
  40%     { background: rgba(239,159,39,0.30); transform: scale(1.03); }
}
@keyframes face-appear {
  from { opacity:0; transform: translateY(8px); }
  to   { opacity:1; transform: translateY(0); }
}

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
  --glass-blur: blur(28px) saturate(1.7);
  --text-primary: #0f0f1a;
  --text-secondary: rgba(15,15,26,0.46);
  --radius-card: 28px;
  --radius-btn: 18px;
}

.practice-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 16px 64px;
  font-family: 'DM Sans', sans-serif;
}

/* ── Header ── */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.exit-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.65);
  color: var(--text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer; padding: 7px 14px;
  border-radius: 12px;
  transition: background 0.15s, color 0.15s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(100,90,200,0.07);
}
.exit-btn:hover {
  background: rgba(255,255,255,0.65);
  color: var(--brand-dark);
  transform: translateY(-1px);
}

.deck-tag {
  background: rgba(255,255,255,0.50);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.70);
  border-radius: 10px; padding: 6px 16px;
  font-size: 12.5px; font-weight: 600;
  color: var(--brand-dark); letter-spacing: 0.01em;
  max-width: 200px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
  box-shadow: 0 2px 10px rgba(100,90,200,0.08);
}

.counter-badge { display: flex; align-items: baseline; gap: 2px; font-family: 'Fraunces', Georgia, serif; }
.counter-current { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.counter-sep { font-size: 14px; color: rgba(15,15,26,0.20); margin: 0 2px; }
.counter-total { font-size: 14px; font-weight: 400; color: var(--text-secondary); }

/* ── Progress ── */
.progress-track {
  position: relative; height: 5px;
  background: rgba(15,15,26,0.08);
  border-radius: 999px; margin-bottom: 18px; overflow: visible;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7F77DD 0%, #AFA9EC 100%);
  border-radius: 999px;
  transition: width 0.55s cubic-bezier(0.4,0,0.2,1);
}
/* ── Streak ── */
.streak-bar {
  display: inline-flex; align-items: center;
  background: rgba(255,255,255,0.50);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.70);
  border-radius: 10px; padding: 6px 16px;
  font-size: 12.5px; font-weight: 600;
  color: var(--brand-dark); margin-bottom: 22px;
  box-shadow: 0 2px 10px rgba(100,90,200,0.08);
}
.streak-bar.flash { animation: streak-flash 0.55s ease; }

/* ── Stack wrapper (no ghost cards) ── */
.stack-wrap {
  position: relative;
  margin-bottom: 40px;
  padding-bottom: 4px;
  perspective: 1000px;
}

/* ── Comet tilt wrapper ── */
.comet-wrap {
  position: relative;
  z-index: 2;
  border-radius: var(--radius-card);
  will-change: transform;
  transform-style: preserve-3d;
  /* Soft, light shadow — no dark blotch on hover */
  box-shadow:
    0 2px 8px rgba(100,90,200,0.06),
    0 8px 24px rgba(100,90,200,0.08);
  transition: box-shadow 0.3s ease;
}
.comet-wrap:hover {
  box-shadow:
    0 4px 16px rgba(100,90,200,0.10),
    0 16px 40px rgba(100,90,200,0.12);
}

/* ── Glare overlay ── */
.card-glare {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: var(--radius-card);
  mix-blend-mode: overlay;
  opacity: 0.55;
  transition: opacity 0.2s;
}

/* ── Card shell (liquid glass) ── */
.card-shell {
  position: relative;
  min-height: 300px; height: 300px;
  border-radius: var(--radius-card);
  cursor: pointer; overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.72) 0%,
    rgba(255,255,255,0.42) 40%,
    rgba(255,255,255,0.52) 100%
  );
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.72);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.90),
    inset 0 -1px 0 rgba(255,255,255,0.28),
    0 2px 12px rgba(127,119,221,0.06),
    0 1px 4px rgba(0,0,0,0.03);
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transform-style: preserve-3d;
}
.card-shell.is-flipped {
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.72) 0%,
    rgba(255,255,255,0.42) 40%,
    rgba(255,255,255,0.52) 100%
  );
  border-color: rgba(255,255,255,0.72);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.90),
    inset 0 -1px 0 rgba(255,255,255,0.28),
    0 2px 12px rgba(127,119,221,0.06),
    0 1px 4px rgba(0,0,0,0.03);
}
.card-shell:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }
.card-shell.anim-in        { animation: card-in        0.36s cubic-bezier(0.22,1,0.36,1) forwards; }
.card-shell.anim-out-right { animation: card-out-right 0.26s ease-in forwards; }
.card-shell.anim-out-left  { animation: card-out-left  0.26s ease-in forwards; }

/* ── Card faces ── */
.card-face {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 48px 52px 52px; text-align: center;
}
.face-back { animation: face-appear 0.22s ease forwards; }

/* Side label — no dot, plain black */
.card-side-label {
  position: absolute; top: 20px; left: 24px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.10em; text-transform: uppercase;
  color: #0f0f1a;
}

.card-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.45rem; font-weight: 400;
  line-height: 1.75; color: var(--text-primary);
  max-width: 460px; letter-spacing: -0.012em;
}
.answer-text { color: #0f1a14; }

.card-bottom-hint {
  position: absolute; bottom: 20px; left: 0; right: 0;
  display: flex; align-items: center;
  justify-content: center; gap: 12px;
}
.tap-hint { font-size: 12px; color: var(--text-secondary); display: none; }
@media (hover: none) { .tap-hint { display: inline; } .kbd-hint { display: none; } }
.kbd-hint {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-secondary);
}
kbd {
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(15,15,26,0.13);
  border-bottom-width: 2px; border-radius: 6px;
  padding: 1px 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  line-height: 1.7;
}

/* ── Rating buttons ── */
.rating-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
  max-width: 420px; margin: 0 auto;
  opacity: 0; transform: translateY(14px);
  pointer-events: none;
  transition: opacity 0.26s ease, transform 0.26s ease;
}
.rating-row.visible { opacity: 1; transform: translateY(0); pointer-events: all; }

.rating-btn {
  position: relative; display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  padding: 14px 8px 12px;
  border-radius: var(--radius-btn); border: 1px solid;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s, background 0.15s;
  -webkit-tap-highlight-color: transparent; overflow: hidden;
}
/* Subtle top specular highlight on all buttons */
.rating-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0) 55%);
  pointer-events: none; border-radius: inherit; z-index: 0;
}
/* Shine sweep on hover — diagonal highlight travels left→right */
.rating-btn::after {
  content: '';
  position: absolute;
  top: -60%; left: -75%;
  width: 50%; height: 220%;
  background: linear-gradient(
    105deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.52) 50%,
    rgba(255,255,255,0) 100%
  );
  transform: skewX(-18deg) translateX(0);
  opacity: 0;
  pointer-events: none; border-radius: 0;
  transition: opacity 0.15s, transform 0.45s cubic-bezier(0.22,1,0.36,1);
}
.rating-btn:hover::after {
  opacity: 1;
  transform: skewX(-18deg) translateX(380%);
}
.rating-btn:hover { transform: translateY(-5px); }
.rating-btn:active { transform: translateY(-2px) scale(0.97); }
.rating-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

/* All three buttons — same neutral glass base */
.btn-miss, .btn-shaky, .btn-got {
  background: rgba(255,255,255,0.50);
  border-color: rgba(255,255,255,0.70);
  box-shadow: 0 2px 10px rgba(100,90,200,0.08), inset 0 1px 0 rgba(255,255,255,0.80);
}
.btn-miss:hover, .btn-shaky:hover, .btn-got:hover {
  background: rgba(255,255,255,0.62);
  box-shadow: 0 6px 24px rgba(100,90,200,0.12), inset 0 1px 0 rgba(255,255,255,0.90);
}

/* Icon circles — subtle tinted but not saturated */
.r-icon-wrap {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin-bottom: 2px;
}
.btn-miss  .r-icon-wrap { background: rgba(226,75,74,0.12); }
.btn-shaky .r-icon-wrap { background: rgba(186,117,23,0.12); }
.btn-got   .r-icon-wrap { background: rgba(29,158,117,0.12); }
.r-icon { font-size: 17px; font-family: monospace; line-height: 1; font-weight: 700; }
.btn-miss  .r-icon { color: #A32D2D; }
.btn-shaky .r-icon { color: #854F0B; }
.btn-got   .r-icon { color: #0F6E56; }
.r-label { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--text-primary); }
.r-sub { font-size: 11.5px; font-weight: 400; color: rgba(15,15,26,0.38); }
.r-key {
  position: absolute; top: 8px; right: 10px;
  font-size: 10px; font-weight: 600; opacity: 0.28;
  font-family: 'DM Sans', sans-serif; color: var(--text-primary);
}
@media (hover: none) { .r-key { display: none; } }

.bottom-kb-hint {
  text-align: center; font-size: 12.5px; color: var(--text-secondary);
  margin-top: 14px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
@media (hover: none) { .bottom-kb-hint { display: none; } }

/* ── Done screen ── */
.done-wrap {
  max-width: 500px; margin: 0 auto; padding: 3rem 0 5rem;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; font-family: 'DM Sans', sans-serif;
}
.done-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(238,237,254,0.72);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.80);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 22px;
  box-shadow: 0 0 0 8px rgba(127,119,221,0.07), 0 4px 20px rgba(127,119,221,0.12);
}
.done-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 2.1rem; font-weight: 700; letter-spacing: -0.5px;
  color: var(--text-primary); margin-bottom: 9px;
}
.done-sub { font-size: 14.5px; color: var(--text-secondary); margin-bottom: 30px; }
.done-sub strong { color: rgba(15,15,26,0.7); font-weight: 600; }
.score-ring-wrap { margin-bottom: 30px; }

.mastery-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 12px; width: 100%; margin-bottom: 36px;
}
.mastery-card {
  border-radius: 18px; padding: 20px 14px 16px;
  display: flex; flex-direction: column;
  align-items: center; gap: 5px; border: 1px solid;
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
.mc-green { background: rgba(225,245,238,0.68); border-color: rgba(159,225,203,0.80); }
.mc-amber { background: rgba(250,238,218,0.68); border-color: rgba(250,199,117,0.80); }
.mc-red   { background: rgba(252,235,235,0.68); border-color: rgba(247,193,193,0.80); }
.mastery-val {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 2.2rem; font-weight: 700; line-height: 1;
}
.mc-green .mastery-val { color: #085041; }
.mc-amber .mastery-val { color: #633806; }
.mc-red   .mastery-val { color: #791F1F; }
.mastery-label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; }
.mc-green .mastery-label { color: #0F6E56; }
.mc-amber .mastery-label { color: #854F0B; }
.mc-red   .mastery-label { color: #A32D2D; }
.mastery-bar-track {
  width: 100%; height: 3px;
  background: rgba(15,15,26,0.09);
  border-radius: 999px; margin-top: 12px; overflow: hidden;
}
.mastery-bar-fill { height: 100%; border-radius: 999px; transition: width 0.85s cubic-bezier(0.4,0,0.2,1); }
.mc-green .mastery-bar-fill { background: #1D9E75; }
.mc-amber .mastery-bar-fill { background: #BA7517; }
.mc-red   .mastery-bar-fill { background: #E24B4A; }

.done-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.btn-primary {
  padding: 12px 30px;
  background: rgba(127,119,221,0.85);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.40); border-radius: 14px; color: #fff;
  font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 20px rgba(127,119,221,0.28), inset 0 1px 0 rgba(255,255,255,0.35);
  transition: all 0.2s;
}
.btn-primary:hover {
  background: rgba(83,74,183,0.90);
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(127,119,221,0.38);
}
.btn-primary:active { transform: translateY(0) scale(0.97); }
.btn-ghost {
  padding: 12px 26px;
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.72); border-radius: 14px;
  color: var(--brand-dark);
  font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 600;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 10px rgba(100,90,200,0.08);
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: rgba(238,237,254,0.75);
  transform: translateY(-2px);
  box-shadow: 0 4px 18px rgba(127,119,221,0.14);
}
.btn-ghost:active { transform: translateY(0) scale(0.97); }
`;
