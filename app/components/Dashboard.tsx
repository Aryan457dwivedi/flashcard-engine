'use client';

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

// ── Card classification ──────────────────────────────────────────────────
function classifyCard(c: Card): 'mastered' | 'learning' | 'struggling' {
  if (c.reps >= 2 && c.ease >= 1.6) return 'mastered';
  if (c.reps === 1) return 'learning';
  return 'struggling';
}

// ── Deck-level helpers ───────────────────────────────────────────────────
function deckStats(deck: Deck) {
  const total        = deck.cards.length;
  const mastered     = deck.cards.filter(c => classifyCard(c) === 'mastered').length;
  const learning     = deck.cards.filter(c => classifyCard(c) === 'learning').length;
  const struggling   = deck.cards.filter(c => classifyCard(c) === 'struggling').length;
  const mastPct      = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const practicedPct = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;
  const practicedCards = deck.cards.filter(c => c.reps > 0);
  const avgEase = practicedCards.length > 0
    ? practicedCards.reduce((s, c) => s + c.ease, 0) / practicedCards.length
    : 2.5;
  return { total, mastered, learning, struggling, mastPct, practicedPct, avgEase };
}

// ── Radial progress ring ─────────────────────────────────────────────────
function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const strokeWidth = size > 100 ? 8 : 5;
  const r    = (size - strokeWidth - 2) / 2;
  const c    = size / 2;
  const dash = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={strokeWidth} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash}`}
        strokeDashoffset={`${dash * (1 - pct / 100)}`}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ── Stacked bar ──────────────────────────────────────────────────────────
function StackBar({
  mastered, learning, struggling, total, height = 5,
}: {
  mastered: number; learning: number; struggling: number; total: number; height?: number;
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div style={{
      height: `${height}px`,
      display: 'flex',
      borderRadius: '999px',
      overflow: 'hidden',
      background: 'rgba(0,0,0,0.06)',
      gap: '1px',
    }}>
      {mastered   > 0 && <div style={{ width: `${pct(mastered)}%`,   background: 'rgba(15,15,26,1)',    transition: 'width 0.7s ease' }} />}
      {learning   > 0 && <div style={{ width: `${pct(learning)}%`,   background: 'rgba(15,15,26,0.45)', transition: 'width 0.7s ease' }} />}
      {struggling > 0 && <div style={{ width: `${pct(struggling)}%`, background: 'rgba(15,15,26,0.18)', transition: 'width 0.7s ease' }} />}
    </div>
  );
}

// ── Mini bar ─────────────────────────────────────────────────────────────
function MiniBar({ pct, opacity = 1 }: { pct: number; opacity?: number }) {
  return (
    <div style={{ height: '4px', background: 'rgba(0,0,0,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: '#0f0f1a', opacity,
        borderRadius: '999px',
        transition: 'width 0.7s ease',
      }} />
    </div>
  );
}

// ── Ease label ───────────────────────────────────────────────────────────
function easeLabel(ease: number): string {
  if (ease < 1.8) return 'Hard';
  if (ease < 2.2) return 'Fair';
  if (ease < 2.8) return 'Good';
  return 'Easy';
}

// ── iOS 26 liquid-glass panel ────────────────────────────────────────────
// Uses backdrop-filter + layered pseudo-element approach via box-shadow + border
const GLASS: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.14) 100%)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderBottom: '1px solid rgba(255,255,255,0.20)',
  borderRight: '1px solid rgba(255,255,255,0.20)',
  boxShadow: '0 8px 32px rgba(15,15,26,0.12), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(255,255,255,0.1)',
  borderRadius: '24px',
};

// ── Plain panel ───────────────────────────────────────────────────────────
const PANEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  background: '#fff',
  border: '1px solid rgba(15,15,26,0.08)',
  borderRadius: '16px',
};

// ── Eyebrow (no dot) ─────────────────────────────────────────────────────
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{
      fontSize: '10.5px',
      fontWeight: '500',
      color: light ? 'rgba(255,255,255,0.6)' : 'rgba(15,15,26,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard({ decks }: { decks: Deck[] }) {

  const allCards     = decks.flatMap(d => d.cards);
  const total        = allCards.length;
  const mastered     = allCards.filter(c => classifyCard(c) === 'mastered').length;
  const learning     = allCards.filter(c => classifyCard(c) === 'learning').length;
  const struggling   = allCards.filter(c => classifyCard(c) === 'struggling').length;
  const mastPct      = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const practicedPct = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;
  const practicedCards = allCards.filter(c => c.reps > 0);
  const globalEase   = practicedCards.length > 0
    ? practicedCards.reduce((s, c) => s + c.ease, 0) / practicedCards.length
    : 2.5;

  const learningScore    = total > 0 ? Math.round(((mastered * 100) + (learning * 50)) / total) : 0;
  const momentum         = total > 0 ? ((mastered * 2) + learning) / total : 0;
  const momentumPct      = Math.min(100, Math.round((momentum / 2) * 100));
  const momentumLabel    = momentum < 0.5 ? 'Slow' : momentum < 1 ? 'Building' : momentum < 1.5 ? 'Strong' : 'Excellent';
  const predictedMastery = Math.min(100, mastPct + Math.round((learning / Math.max(total, 1)) * 70));
  const confidence       = total === 0 ? 0 : Math.min(99, Math.round(
    (practicedPct * 0.45)
    + (Math.min(100, Math.max(0, ((globalEase - 1.3) / 2.2) * 100)) * 0.35)
    + (mastPct * 0.20),
  ));

  const heroStatus =
    learningScore >= 80 ? 'Mastery accelerating' :
    learningScore >= 60 ? 'Excellent progress'   :
    learningScore >= 35 ? 'Building momentum'    :
    'Early days';

  const trend =
    momentum >= 1 && globalEase >= 2.3        ? 'Improving'       :
    momentum < 0.5 || struggling > mastered   ? 'Needs attention' :
    'Stable';

  // Primary insight
  let insight = {
    title: 'Keep your daily rhythm',
    text: 'Consistent short sessions outperform infrequent long ones for long-term recall.',
  };
  if (struggling > mastered && struggling > 0) {
    const lift = Math.min(25, Math.round((struggling / Math.max(total, 1)) * 40));
    insight = {
      title: `${struggling} struggling cards need attention`,
      text: `Reviewing them next could increase mastery by up to ${lift}%.`,
    };
  } else if (practicedPct < 20 && total > 0) {
    insight = {
      title: 'Most cards remain unpracticed',
      text: `Only ${practicedPct}% of your library is active. A single 10-minute session would meaningfully shift this.`,
    };
  } else if (mastPct > 70) {
    insight = {
      title: 'Outstanding mastery rate',
      text: `${mastPct}% mastered. Shift focus to spaced reviews to lock in long-term retention.`,
    };
  }

  // Coach
  let coach = {
    priority: 'Medium',
    title: 'Advance learning cards',
    text: `${learning} cards are in active learning. Daily reviews will push them into mastery.`,
  };
  if (struggling > mastered && struggling > 0) {
    coach = {
      priority: 'High priority',
      title: 'Review struggling cards',
      text: `You have ${struggling} struggling cards. Reviewing them next could significantly improve mastery.`,
    };
  } else if (practicedPct < 20) {
    coach = {
      priority: 'High priority',
      title: 'Start a focused session',
      text: `Most cards are untouched. A single 10-minute session today builds the routine that compounds over weeks.`,
    };
  } else if (mastPct >= 70) {
    coach = {
      priority: 'Maintenance',
      title: 'Reinforce retention',
      text: 'Your retention is strong. Continue consistent practice on cards in learning to lock in mastery.',
    };
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (decks.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '6rem 0' }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(15,15,26,0.04)',
          border: '1px solid rgba(15,15,26,0.08)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="26" height="26" fill="none" stroke="rgba(15,15,26,0.4)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '500', marginBottom: '0.5rem', color: '#0f0f1a' }}>
          No decks yet
        </h2>
        <p style={{ color: 'rgba(15,15,26,0.4)', fontSize: '0.875rem' }}>
          Upload a PDF and create your first deck to see your progress here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#0f0f1a', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ══════════════════════════════════════════════════════════════
          HERO — iOS 26 liquid glass
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        // Deep dark base so glass has something to blur against
        background: 'linear-gradient(140deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '2px',
      }}>
        {/* Subtle ambient blobs behind the glass */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '24px',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-40px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,180,220,0.25) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-80px', left: '-60px',
            width: '360px', height: '360px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160,180,255,0.15) 0%, transparent 70%)',
          }} />
        </div>

        {/* Glass surface */}
        <div style={{
          ...GLASS,
          borderRadius: '22px',
          padding: '28px 30px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '32px',
          alignItems: 'center',
          position: 'relative',
        }}>
          {/* Left */}
          <div>
            <div style={{
              fontSize: '10.5px', fontWeight: '500',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '16px',
            }}>
              Learning intelligence &nbsp;·&nbsp; {trend}
            </div>

            <div style={{
              fontSize: '11px', fontWeight: '500',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '6px',
            }}>
              Learning score
            </div>
            <div style={{
              fontSize: '72px', fontWeight: '500', letterSpacing: '-3px',
              color: '#fff', lineHeight: 1, marginBottom: '6px',
            }}>
              {learningScore}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginBottom: '24px' }}>
              {heroStatus}
            </div>

            <div style={{ display: 'flex', gap: '0' }}>
              {[
                { label: 'Mastery',   value: `${mastPct}%`     },
                { label: 'Practiced', value: `${practicedPct}%` },
                { label: 'Decks',     value: decks.length       },
                { label: 'Cards',     value: total              },
              ].map((s, i) => (
                <div key={s.label} style={{
                  paddingRight: i < 3 ? '24px' : 0,
                  marginRight:  i < 3 ? '24px' : 0,
                  borderRight:  i < 3 ? '1px solid rgba(255,255,255,0.18)' : 'none',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '500', color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ring */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ring pct={mastPct} size={140} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '500', color: '#fff', lineHeight: 1 }}>{mastPct}%</div>
              <div style={{ fontSize: '9px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>
                mastery
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Mastered',   val: mastered,   pct: total > 0 ? Math.round(mastered / total * 100) : 0,   opacity: 1   },
          { label: 'Learning',   val: learning,   pct: total > 0 ? Math.round(learning / total * 100) : 0,   opacity: 0.5 },
          { label: 'Struggling', val: struggling, pct: total > 0 ? Math.round(struggling / total * 100) : 0, opacity: 0.2 },
        ].map(({ label, val, pct, opacity }) => (
          <div key={label} style={{ ...PANEL, padding: '18px 20px' }}>
            <Eyebrow>{label}</Eyebrow>
            <div style={{ fontSize: '28px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '8px 0 12px' }}>
              {val}
            </div>
            <MiniBar pct={pct} opacity={opacity} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.35)', marginTop: '5px' }}>{pct}% of total</div>
          </div>
        ))}
      </div>

      {/* ── Intelligence panel ── */}
      <div style={{ ...PANEL, overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 0' }}>
          <Eyebrow>Snapshot</Eyebrow>
          <div style={{ fontSize: '15px', fontWeight: '500', color: '#0f0f1a', margin: '4px 0 14px' }}>Today's overview</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid rgba(15,15,26,0.07)',
        }}>
          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Knowledge health</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{mastPct}%</div>
            <StackBar mastered={mastered} learning={learning} struggling={struggling} total={total} height={5} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>
              {mastered} healthy · {learning} growing · {struggling} at risk
            </div>
          </div>

          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Momentum</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{momentumLabel}</div>
            <MiniBar pct={momentumPct} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>Score {momentum.toFixed(2)} / 2.00</div>
          </div>

          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Predicted mastery</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{predictedMastery}%</div>
            <div style={{ height: '4px', background: 'rgba(0,0,0,0.07)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${mastPct}%`, background: '#0f0f1a', borderRadius: '999px' }} />
              <div style={{ position: 'absolute', left: `${mastPct}%`, top: 0, height: '100%', width: `${predictedMastery - mastPct}%`, background: 'rgba(15,15,26,0.25)', borderRadius: '0 999px 999px 0' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>Now {mastPct}% → forecast {predictedMastery}%</div>
          </div>

          <div style={{ padding: '18px 20px' }}>
            <Eyebrow>Confidence</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{confidence}%</div>
            <MiniBar pct={confidence} opacity={0.6} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>
              Ease {globalEase.toFixed(2)} · {practicedPct}% practiced
            </div>
          </div>
        </div>
      </div>

      {/* ── Insight + Ease row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ ...PANEL, padding: '20px 22px', border: '1px solid rgba(15,15,26,0.12)' }}>
          <Eyebrow>Primary insight</Eyebrow>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f0f1a', margin: '8px 0 4px', lineHeight: 1.35 }}>
            {insight.title}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(15,15,26,0.55)', lineHeight: 1.55 }}>{insight.text}</div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Card distribution</Eyebrow>
            <div style={{ marginTop: '8px' }}>
              <StackBar mastered={mastered} learning={learning} struggling={struggling} total={total} height={6} />
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
              {[
                { opacity: 1,    label: 'Mastered'   },
                { opacity: 0.45, label: 'Learning'   },
                { opacity: 0.18, label: 'Struggling' },
              ].map(({ opacity, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: `rgba(15,15,26,${opacity})`, flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...PANEL, padding: '20px 22px' }}>
          <Eyebrow>Retention ease</Eyebrow>
          <div style={{ fontSize: '32px', fontWeight: '500', color: '#0f0f1a', lineHeight: 1, margin: '8px 0 4px' }}>
            {practicedPct}%
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)', marginBottom: '18px' }}>cards practiced</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.5)' }}>Ease factor</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#0f0f1a' }}>
                  {globalEase.toFixed(2)} — {easeLabel(globalEase)}
                </span>
              </div>
              <MiniBar pct={Math.round(Math.min(100, Math.max(0, ((globalEase - 1.3) / 2.2) * 100)))} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.5)' }}>Confidence signal</span>
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#0f0f1a' }}>{confidence}%</span>
              </div>
              <MiniBar pct={confidence} opacity={0.55} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Deck breakdown table ── */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Eyebrow>Your library</Eyebrow>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#0f0f1a', marginTop: '4px' }}>
              {decks.length} deck{decks.length !== 1 ? 's' : ''}{' '}
              <span style={{ color: 'rgba(15,15,26,0.35)', fontWeight: '400' }}>· {total} cards</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[
              { opacity: 1,    label: 'Mastered'   },
              { opacity: 0.45, label: 'Learning'   },
              { opacity: 0.18, label: 'Struggling' },
            ].map(({ opacity, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: `rgba(15,15,26,${opacity})` }} />
                <span style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '190px 1fr 80px 70px 110px',
          gap: '12px',
          padding: '0 4px 10px',
          borderBottom: '1px solid rgba(15,15,26,0.07)',
        }}>
          {['Deck', 'Progress', 'Mastered', 'Cards', 'Ease'].map((h, i) => (
            <div key={h} style={{
              fontSize: '10.5px', fontWeight: '500',
              color: 'rgba(15,15,26,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              textAlign: i === 0 ? 'left' : 'center',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Deck rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {decks.map((deck, i) => {
            const s = deckStats(deck);
            return (
              <div key={deck.id} style={{
                display: 'grid',
                gridTemplateColumns: '190px 1fr 80px 70px 110px',
                gap: '12px',
                alignItems: 'center',
                padding: '13px 4px',
                borderBottom: i < decks.length - 1 ? '1px solid rgba(15,15,26,0.05)' : 'none',
              }}>
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: '500', color: '#0f0f1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
                  }}>
                    {deck.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.35)' }}>
                    {new Date(deck.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <div>
                  <StackBar mastered={s.mastered} learning={s.learning} struggling={s.struggling} total={s.total} height={5} />
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)', marginTop: '4px', textAlign: 'center' }}>
                    {s.practicedPct}% practiced
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#0f0f1a' }}>{s.mastPct}%</div>
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)' }}>{s.mastered} cards</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#0f0f1a' }}>{s.total}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)' }}>total</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {s.practicedPct > 0 ? (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f0f1a' }}>{easeLabel(s.avgEase)}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.35)' }}>{s.avgEase.toFixed(2)}</div>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.25)' }}>Not started</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          COACH — iOS 26 liquid glass (matches hero)
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'linear-gradient(140deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '2px',
      }}>
        {/* Ambient blobs */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '20px',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-30px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,180,220,0.2) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-50px', left: '-40px',
            width: '220px', height: '220px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160,180,255,0.12) 0%, transparent 70%)',
          }} />
        </div>

        {/* Glass surface */}
        <div style={{
          ...GLASS,
          borderRadius: '18px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          position: 'relative',
        }}>
          {/* Icon */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
              <path d="M9 21h6M10 17v4M14 17v4" />
            </svg>
          </div>

          <div>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '3px',
            }}>
              {coach.priority} &nbsp;·&nbsp; Learning coach
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '4px' }}>
              {coach.title}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
              {coach.text}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
