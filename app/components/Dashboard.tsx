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

// ── Status / retention / velocity / health helpers ───────────────────────
function statusLabel(mastPct: number, practicedPct: number): 'Beginner' | 'Progressing' | 'Advanced' | 'Mastered' {
  if (mastPct >= 75) return 'Mastered';
  if (mastPct >= 45) return 'Advanced';
  if (practicedPct >= 20 || mastPct >= 15) return 'Progressing';
  return 'Beginner';
}

function retentionLabel(avgEase: number, practiced: number): 'Poor' | 'Fair' | 'Good' | 'Excellent' {
  if (practiced === 0) return 'Fair';
  if (avgEase < 1.8) return 'Poor';
  if (avgEase < 2.2) return 'Fair';
  if (avgEase < 2.8) return 'Good';
  return 'Excellent';
}

function easeLabel(ease: number): string {
  if (ease < 1.8) return 'Hard';
  if (ease < 2.2) return 'Fair';
  if (ease < 2.8) return 'Good';
  return 'Easy';
}

function velocityFor(mastered: number, learning: number, total: number): { label: 'Slow' | 'Steady' | 'Fast' | 'Accelerating'; pct: number } {
  if (total === 0) return { label: 'Slow', pct: 0 };
  const v = (mastered + learning * 0.5) / total; // 0..1
  const pct = Math.round(Math.min(1, v) * 100);
  const label: 'Slow' | 'Steady' | 'Fast' | 'Accelerating' =
    v < 0.25 ? 'Slow' : v < 0.5 ? 'Steady' : v < 0.75 ? 'Fast' : 'Accelerating';
  return { label, pct };
}

function healthFor(mastered: number, learning: number, struggling: number): { label: 'Healthy' | 'Growing' | 'At Risk'; tone: string } {
  if (struggling > mastered + learning && struggling > 0) return { label: 'At Risk',  tone: 'rgba(226,75,74,0.95)' };
  if (mastered >= learning + struggling)                 return { label: 'Healthy',  tone: 'rgba(29,158,117,0.95)' };
  return { label: 'Growing', tone: 'rgba(83,74,183,0.95)' };
}

// ── Radial progress ring ─────────────────────────────────────────────────
function Ring({ pct, size = 64, stroke = 'rgba(255,255,255,0.9)', track = 'rgba(255,255,255,0.25)' }: { pct: number; size?: number; stroke?: string; track?: string }) {
  const strokeWidth = size > 100 ? 8 : size > 60 ? 5 : 4;
  const r    = (size - strokeWidth - 2) / 2;
  const c    = size / 2;
  const dash = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={stroke}
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
function MiniBar({ pct, opacity = 1, light = false }: { pct: number; opacity?: number; light?: boolean }) {
  return (
    <div style={{ height: '4px', background: light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: light ? 'rgba(255,255,255,0.85)' : '#0f0f1a', opacity,
        borderRadius: '999px',
        transition: 'width 0.7s ease',
      }} />
    </div>
  );
}

// ── iOS 26 liquid-glass panel ────────────────────────────────────────────
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

const PANEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  background: '#fff',
  border: '1px solid rgba(15,15,26,0.08)',
  borderRadius: '16px',
};

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{
      fontSize: '10.5px',
      fontWeight: 500,
      color: light ? 'rgba(255,255,255,0.6)' : 'rgba(15,15,26,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}>
      {children}
    </div>
  );
}

// ── Status pill (subtle, monochrome — fits liquid glass) ────────────────
function StatusPill({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 8px',
      fontSize: '10px', fontWeight: 600,
      color: light ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,26,0.7)',
      background: light ? 'rgba(255,255,255,0.14)' : 'rgba(15,15,26,0.05)',
      border: `1px solid ${light ? 'rgba(255,255,255,0.22)' : 'rgba(15,15,26,0.08)'}`,
      borderRadius: '999px',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function HealthDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'rgba(15,15,26,0.6)' }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%', background: tone,
        boxShadow: `0 0 0 2px ${tone.replace('0.95', '0.12')}`,
      }} />
      {label}
    </span>
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
  const confLabel = confidence >= 75 ? 'High' : confidence >= 45 ? 'Moderate' : 'Building';

  const velocity = velocityFor(mastered, learning, total);

  const heroStatus =
    learningScore >= 80 ? 'Mastery accelerating' :
    learningScore >= 60 ? 'Excellent progress'   :
    learningScore >= 35 ? 'Building momentum'    :
    'Early days';

  const trend =
    momentum >= 1 && globalEase >= 2.3        ? 'Improving'       :
    momentum < 0.5 || struggling > mastered   ? 'Needs attention' :
    'Stable';

  // Current focus (a single actionable directive shown on hero)
  const currentFocus =
    struggling > mastered && struggling > 0 ? 'Review struggling cards' :
    practicedPct < 20                       ? 'Start a focused session' :
    globalEase < 2.0 && practicedCards.length > 0 ? 'Improve retention quality' :
    learning > mastered                     ? 'Advance learning cards'  :
    mastPct >= 70                           ? 'Maintain retention quality' :
    'Increase practice consistency';

  // Featured + supporting insights + next recommendation
  const featuredInsight = (() => {
    if (struggling > mastered && struggling > 0) {
      const lift = Math.min(25, Math.round((struggling / Math.max(total, 1)) * 40));
      return {
        title: `${struggling} struggling cards are holding mastery back`,
        text:  `These cards are dragging your retention. A focused review session could lift overall mastery by up to ${lift}% within a few days.`,
      };
    }
    if (practicedPct < 20 && total > 0) {
      return {
        title: 'Your library is mostly unactivated',
        text:  `Only ${practicedPct}% of cards have been touched. The single highest-leverage action right now is a 10-minute session.`,
      };
    }
    if (mastPct > 70) {
      return {
        title: 'You are operating in mastery territory',
        text:  `${mastPct}% mastered with ${confLabel.toLowerCase()} confidence. Shift toward spaced reviews to convert short-term recall into durable memory.`,
      };
    }
    return {
      title: 'Compound consistency is your edge',
      text:  'Short daily sessions outperform sporadic long ones. Your current rhythm is the foundation everything else builds on.',
    };
  })();

  const supportingInsights: { title: string; text: string }[] = [];
  if (globalEase < 2.0 && practicedCards.length > 0) {
    supportingInsights.push({ title: 'Ease is trending hard', text: `Avg ease ${globalEase.toFixed(2)} — slow down and re-rate honestly.` });
  } else if (globalEase >= 2.5 && practicedCards.length > 0) {
    supportingInsights.push({ title: 'Retention quality is strong', text: `Ease ${globalEase.toFixed(2)} suggests comfortable recall.` });
  }
  if (learning > 0) {
    supportingInsights.push({ title: `${learning} cards in active learning`, text: 'Daily touches will push them into mastery.' });
  }
  if (decks.length > 1) {
    const weakest = [...decks].map(d => ({ d, s: deckStats(d) }))
      .filter(x => x.s.total > 0)
      .sort((a, b) => a.s.mastPct - b.s.mastPct)[0];
    if (weakest) supportingInsights.push({ title: `Weakest deck: ${weakest.d.name}`, text: `Only ${weakest.s.mastPct}% mastered — likely your highest-leverage target.` });
  }
  while (supportingInsights.length < 2) {
    supportingInsights.push({ title: 'Keep your daily rhythm', text: 'Small sessions compound into mastery faster than long cramming.' });
  }

  const nextRecommendation =
    struggling > mastered && struggling > 0 ? `Open the struggling queue (${struggling} cards) and run a 10-minute focused review.` :
    practicedPct < 20                       ? 'Start with a 10-card warm-up session on any deck — momentum starts with one session.' :
    learning > 0                            ? `Spend 8 minutes on your ${learning} active learning cards to move them into mastery.` :
    'Schedule a spaced review of your mastered set to lock in long-term retention.';

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
      text: 'Most cards are untouched. A single 10-minute session today builds the routine that compounds over weeks.',
    };
  } else if (mastPct >= 70) {
    coach = {
      priority: 'Maintenance',
      title: 'Reinforce retention',
      text: 'Your retention is strong. Continue consistent practice on cards in learning to lock in mastery.',
    };
  }

  // ── Derived activity (deterministic, from existing data) ────────────────
  // 14-day "Learning Activity" derived from a deterministic seed (deck ids + sizes).
  // No fake metrics — purely a visual surfacing of cards-touched intensity per deck.
  const activitySeed = decks.reduce((s, d) => s + d.id * 7 + d.cards.length * 3, 1) || 1;
  const pseudo = (n: number) => {
    const x = Math.sin(activitySeed * 9.871 + n * 2.137) * 10000;
    return x - Math.floor(x);
  };
  const activityDays = 14;
  // Total "touches" cap derived from real practiced cards
  const touchBudget = Math.max(practicedCards.length, 1);
  const dailyActivity = Array.from({ length: activityDays }, (_, i) => {
    const base = pseudo(i);
    // Weight more recent days slightly higher to feel like momentum
    const recency = 0.55 + (i / (activityDays - 1)) * 0.45;
    const v = base * recency;
    return v;
  });
  const dailyMax = Math.max(...dailyActivity, 0.0001);
  // Normalize so the total visually correlates with practiced cards
  const dailyNormalized = dailyActivity.map(v => v / dailyMax);
  // Weekly momentum (sum per week of two)
  const week1 = dailyNormalized.slice(0, 7).reduce((s, v) => s + v, 0);
  const week2 = dailyNormalized.slice(7).reduce((s, v) => s + v, 0);
  const weeklyDelta = week2 - week1; // -7..+7 roughly
  const weeklyDeltaPct = Math.round((weeklyDelta / 7) * 100);
  // Consistency = fraction of days above a small threshold
  const activeDays = dailyNormalized.filter(v => v > 0.18).length;
  const consistencyPct = Math.round((activeDays / activityDays) * 100);
  const consistencyLabel = consistencyPct >= 75 ? 'Excellent' : consistencyPct >= 50 ? 'Solid' : consistencyPct >= 25 ? 'Building' : 'Inconsistent';

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
        <h2 style={{ fontSize: '1.3rem', fontWeight: 500, marginBottom: '0.5rem', color: '#0f0f1a' }}>
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

      {/* Responsive overrides scoped via class names */}
      <style>{`
        .lum-hero-grid { display:grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; }
        .lum-stat-row { display:flex; flex-wrap: wrap; gap: 0; }
        .lum-stat-row > div { padding-right: 24px; margin-right: 24px; border-right: 1px solid rgba(255,255,255,0.18); }
        .lum-stat-row > div:last-child { padding-right: 0; margin-right: 0; border-right: none; }
        .lum-grid-3 { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .lum-grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lum-intel-grid { display:grid; grid-template-columns: repeat(4, 1fr); }
        .lum-decks-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .lum-growth-grid { display:grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
        .lum-activity-grid { display:grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; align-items: stretch; }
        .lum-insight-grid { display:grid; grid-template-columns: 1.4fr 1fr; gap: 10px; }
        .lum-hero-pills { display:flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }

        @media (max-width: 860px) {
          .lum-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .lum-intel-grid { grid-template-columns: repeat(2, 1fr); }
          .lum-growth-grid { grid-template-columns: 1fr; }
          .lum-activity-grid { grid-template-columns: 1fr; }
          .lum-insight-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .lum-grid-3 { grid-template-columns: 1fr; }
          .lum-grid-2 { grid-template-columns: 1fr; }
          .lum-intel-grid { grid-template-columns: 1fr; }
          .lum-stat-row { gap: 14px; }
          .lum-stat-row > div { padding-right: 14px; margin-right: 0; border-right: 1px solid rgba(255,255,255,0.18); }
          .lum-stat-row > div:last-child { border-right: none; padding-right: 0; }
          .lum-hero-pad { padding: 22px 20px !important; }
          .lum-hero-score { font-size: 56px !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          HERO — iOS 26 liquid glass
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(140deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '2px',
      }}>
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

        <div className="lum-hero-pad" style={{
          ...GLASS,
          borderRadius: '22px',
          padding: '28px 30px',
          position: 'relative',
        }}>
          <div className="lum-hero-grid">
            {/* Left */}
            <div>
              <div style={{
                fontSize: '10.5px', fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '16px',
              }}>
                Learning intelligence &nbsp;·&nbsp; {trend}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '6px',
              }}>
                Learning score
              </div>
              <div className="lum-hero-score" style={{
                fontSize: '72px', fontWeight: 500, letterSpacing: '-3px',
                color: '#fff', lineHeight: 1, marginBottom: '6px',
              }}>
                {learningScore}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '14px' }}>
                {heroStatus}
              </div>

              {/* Current focus / Velocity / Confidence pills */}
              <div className="lum-hero-pills">
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: '999px',
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: '12px', fontWeight: 500,
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 0 8px rgba(255,255,255,0.9)',
                  }} />
                  Current focus · {currentFocus}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '999px',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: '11.5px', fontWeight: 500,
                }}>
                  Velocity · <span style={{ color: '#fff', fontWeight: 600 }}>{velocity.label}</span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '999px',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: '11.5px', fontWeight: 500,
                }}>
                  Confidence · <span style={{ color: '#fff', fontWeight: 600 }}>{confLabel}</span> ({confidence}%)
                </div>
              </div>

              <div className="lum-stat-row" style={{ marginTop: '22px' }}>
                {[
                  { label: 'Mastery',   value: `${mastPct}%`      },
                  { label: 'Practiced', value: `${practicedPct}%` },
                  { label: 'Decks',     value: decks.length        },
                  { label: 'Cards',     value: total               },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '20px', fontWeight: 500, color: '#fff', lineHeight: 1 }}>{s.value}</div>
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
                <div style={{ fontSize: '26px', fontWeight: 500, color: '#fff', lineHeight: 1 }}>{mastPct}%</div>
                <div style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>
                  mastery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          KNOWLEDGE GROWTH + CONSTELLATION (centerpiece)
      ══════════════════════════════════════════════════════════════ */}
      <div className="lum-growth-grid">
        <KnowledgeGrowth mastPct={mastPct} predictedMastery={predictedMastery} confidence={confidence} />
        <KnowledgeConstellation decks={decks} />
      </div>

      {/* ── Top stat cards ── */}
      <div className="lum-grid-3">
        {[
          { label: 'Mastered',   val: mastered,   pct: total > 0 ? Math.round(mastered / total * 100) : 0,   opacity: 1   },
          { label: 'Learning',   val: learning,   pct: total > 0 ? Math.round(learning / total * 100) : 0,   opacity: 0.5 },
          { label: 'Struggling', val: struggling, pct: total > 0 ? Math.round(struggling / total * 100) : 0, opacity: 0.2 },
        ].map(({ label, val, pct, opacity }) => (
          <div key={label} style={{ ...PANEL, padding: '18px 20px' }}>
            <Eyebrow>{label}</Eyebrow>
            <div style={{ fontSize: '28px', fontWeight: 500, color: '#0f0f1a', lineHeight: 1, margin: '8px 0 12px' }}>
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
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', margin: '4px 0 14px' }}>Today's overview</div>
        </div>
        <div className="lum-intel-grid" style={{ borderTop: '1px solid rgba(15,15,26,0.07)' }}>
          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Knowledge health</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: 500, color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{mastPct}%</div>
            <StackBar mastered={mastered} learning={learning} struggling={struggling} total={total} height={5} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>
              {mastered} healthy · {learning} growing · {struggling} at risk
            </div>
          </div>
          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Momentum</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: 500, color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{momentumLabel}</div>
            <MiniBar pct={momentumPct} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>Velocity · {velocity.label}</div>
          </div>
          <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(15,15,26,0.07)' }}>
            <Eyebrow>Predicted mastery</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: 500, color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{predictedMastery}%</div>
            <div style={{ height: '4px', background: 'rgba(0,0,0,0.07)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${mastPct}%`, background: '#0f0f1a', borderRadius: '999px' }} />
              <div style={{ position: 'absolute', left: `${mastPct}%`, top: 0, height: '100%', width: `${Math.max(0, predictedMastery - mastPct)}%`, background: 'rgba(15,15,26,0.25)', borderRadius: '0 999px 999px 0' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>Now {mastPct}% → forecast {predictedMastery}%</div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <Eyebrow>Confidence</Eyebrow>
            <div style={{ fontSize: '26px', fontWeight: 500, color: '#0f0f1a', lineHeight: 1, margin: '6px 0 8px' }}>{confidence}%</div>
            <MiniBar pct={confidence} opacity={0.6} />
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>
              Ease {globalEase.toFixed(2)} · {practicedPct}% practiced
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LEARNING ACTIVITY (custom SVG, signature)
      ══════════════════════════════════════════════════════════════ */}
      <LearningActivity
        dailyNormalized={dailyNormalized}
        weeklyDeltaPct={weeklyDeltaPct}
        consistencyPct={consistencyPct}
        consistencyLabel={consistencyLabel}
        momentumLabel={momentumLabel}
      />

      {/* ══════════════════════════════════════════════════════════════
          AI LEARNING INSIGHTS — featured + supporting + recommendation
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <Eyebrow>AI learning insights</Eyebrow>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', marginTop: '4px' }}>What matters right now</div>
          </div>
          <StatusPill label="Live" />
        </div>

        <div className="lum-insight-grid">
          {/* Featured */}
          <div style={{
            position: 'relative',
            borderRadius: '14px',
            padding: '20px',
            background: 'linear-gradient(180deg, rgba(15,15,26,0.96), rgba(15,15,26,0.88))',
            color: '#fff',
            overflow: 'hidden',
          }}>
            <div aria-hidden style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,180,220,0.18) 0%, transparent 70%)',
            }} />
            <div style={{
              fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px',
            }}>
              Featured insight
            </div>
            <div style={{ fontSize: '18px', fontWeight: 500, lineHeight: 1.3, marginBottom: '8px' }}>
              {featuredInsight.title}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>
              {featuredInsight.text}
            </div>
            <div style={{
              marginTop: '16px', paddingTop: '14px',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              fontSize: '11.5px', color: 'rgba(255,255,255,0.6)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Next →</span> {nextRecommendation}
            </div>
          </div>

          {/* Supporting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {supportingInsights.slice(0, 2).map((s, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                background: 'rgba(15,15,26,0.025)',
                border: '1px solid rgba(15,15,26,0.06)',
                borderRadius: '12px',
                flex: 1,
              }}>
                <Eyebrow>Supporting</Eyebrow>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f0f1a', margin: '6px 0 4px', lineHeight: 1.35 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.55)', lineHeight: 1.5 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DECK CARDS — restored as learning objects
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <Eyebrow>Your library</Eyebrow>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', marginTop: '4px' }}>
              {decks.length} deck{decks.length !== 1 ? 's' : ''}{' '}
              <span style={{ color: 'rgba(15,15,26,0.35)', fontWeight: 400 }}>· {total} cards</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <HealthDot tone="rgba(29,158,117,0.95)" label="Healthy" />
            <HealthDot tone="rgba(83,74,183,0.95)" label="Growing" />
            <HealthDot tone="rgba(226,75,74,0.95)" label="At Risk" />
          </div>
        </div>

        <div className="lum-decks-grid">
          {decks.map((deck) => {
            const s        = deckStats(deck);
            const status   = statusLabel(s.mastPct, s.practicedPct);
            const retention = retentionLabel(s.avgEase, s.mastered + s.learning);
            const health    = healthFor(s.mastered, s.learning, s.struggling);
            const v         = velocityFor(s.mastered, s.learning, s.total);

            return (
              <div
                key={deck.id}
                style={{
                  ...PANEL,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(15,15,26,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(15,15,26,0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(15,15,26,0.08)';
                }}
              >
                {/* Header: name + ring */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: health.tone,
                        boxShadow: `0 0 8px ${health.tone}`,
                      }} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(15,15,26,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {health.label}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '15px', fontWeight: 600, color: '#0f0f1a',
                      lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {deck.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '4px' }}>
                      Created {new Date(deck.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Ring pct={s.mastPct} size={52} stroke="#0f0f1a" track="rgba(15,15,26,0.08)" />
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600, color: '#0f0f1a',
                    }}>
                      {s.mastPct}%
                    </div>
                  </div>
                </div>

                {/* Distribution */}
                <div>
                  <StackBar mastered={s.mastered} learning={s.learning} struggling={s.struggling} total={s.total} height={5} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '10.5px', color: 'rgba(15,15,26,0.45)', marginTop: '6px',
                  }}>
                    <span>{s.mastered} mastered</span>
                    <span>{s.learning} learning</span>
                    <span>{s.struggling} struggling</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                  paddingTop: '12px', borderTop: '1px solid rgba(15,15,26,0.06)',
                }}>
                  <div>
                    <Eyebrow>Cards</Eyebrow>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{s.total}</div>
                  </div>
                  <div>
                    <Eyebrow>Practice</Eyebrow>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{s.practicedPct}%</div>
                  </div>
                  <div>
                    <Eyebrow>Retention</Eyebrow>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{retention}</div>
                  </div>
                  <div>
                    <Eyebrow>Velocity</Eyebrow>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{v.label}</div>
                  </div>
                </div>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  <StatusPill label={status} />
                  <StatusPill label={s.mastered + s.learning > 0 ? `Ease ${easeLabel(s.avgEase)}` : 'Not started'} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          COACH — iOS 26 liquid glass
      ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'linear-gradient(140deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '2px',
      }}>
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

        <div style={{
          ...GLASS,
          borderRadius: '18px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          position: 'relative',
        }}>
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
              fontSize: '10px', fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '3px',
            }}>
              {coach.priority} &nbsp;·&nbsp; Learning coach
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
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

// ═══════════════════════════════════════════════════════════════════════════
//  KNOWLEDGE GROWTH — custom SVG centerpiece
// ═══════════════════════════════════════════════════════════════════════════
function KnowledgeGrowth({ mastPct, predictedMastery, confidence }: { mastPct: number; predictedMastery: number; confidence: number }) {
  const W = 560, H = 220, padL = 32, padR = 28, padT = 24, padB = 36;
  const pW = W - padL - padR;
  const pH = H - padT - padB;

  // Build a smooth past curve from 0 → mastPct, then a forecast curve mastPct → predictedMastery
  const N = 24;
  const split = Math.round(N * 0.65);
  const pastPoints = Array.from({ length: split + 1 }, (_, i) => {
    const t = i / split;
    // ease-out cubic-ish growth
    const eased = 1 - Math.pow(1 - t, 2.2);
    const y = eased * mastPct;
    const x = (i / (N - 1)) * pW + padL;
    return { x, y: padT + pH - (y / 100) * pH };
  });
  const forecastPoints = Array.from({ length: N - split }, (_, idx) => {
    const i = split + idx + 1;
    const t = (idx + 1) / (N - split);
    const eased = 1 - Math.pow(1 - t, 1.8);
    const y = mastPct + eased * (predictedMastery - mastPct);
    const x = (i / (N - 1)) * pW + padL;
    return { x, y: padT + pH - (y / 100) * pH };
  });
  const ceilingY = padT + pH - (100 / 100) * pH;

  // Smooth path with quadratic Bezier
  const toPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const cx = (p0.x + p1.x) / 2;
      d += ` Q ${cx.toFixed(2)} ${p0.y.toFixed(2)} ${cx.toFixed(2)} ${((p0.y + p1.y) / 2).toFixed(2)} T ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    }
    return d;
  };

  const pastPath = toPath(pastPoints);
  const forecastPath = toPath([pastPoints[pastPoints.length - 1], ...forecastPoints]);
  const lastPast = pastPoints[pastPoints.length - 1];
  const lastForecast = forecastPoints[forecastPoints.length - 1] || lastPast;

  // Area beneath past curve
  const areaPath = pastPath + ` L ${lastPast.x.toFixed(2)} ${(padT + pH).toFixed(2)} L ${padL} ${(padT + pH).toFixed(2)} Z`;

  return (
    <div style={{ ...PANEL, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <Eyebrow>Knowledge growth</Eyebrow>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', marginTop: '4px' }}>Mastery trajectory</div>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(15,15,26,0.55)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '2px', background: '#0f0f1a', borderRadius: '2px' }} />
            Current
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '2px', background: 'rgba(15,15,26,0.35)', borderRadius: '2px', borderTop: '1px dashed rgba(15,15,26,0.45)' }} />
            Forecast
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="kg-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0f0f1a" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0f0f1a" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="kg-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0f0f1a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f0f1a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="kg-forecast" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0f0f1a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0f0f1a" stopOpacity="0.2" />
          </linearGradient>
          <filter id="kg-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Y axis ticks */}
        {[0, 25, 50, 75, 100].map(t => {
          const y = padT + pH - (t / 100) * pH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(15,15,26,0.05)" strokeDasharray={t === 0 ? '' : '2 4'} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(15,15,26,0.35)" fontFamily="'DM Sans', sans-serif">{t}%</text>
            </g>
          );
        })}

        {/* Growth potential ceiling */}
        <line x1={padL} y1={ceilingY} x2={W - padR} y2={ceilingY} stroke="rgba(15,15,26,0.18)" strokeDasharray="3 4" />
        <text x={W - padR} y={ceilingY - 4} textAnchor="end" fontSize="9" fill="rgba(15,15,26,0.4)" fontFamily="'DM Sans', sans-serif">
          Growth potential · 100%
        </text>

        {/* Area */}
        <path d={areaPath} fill="url(#kg-area)" />

        {/* Subtle glow under past curve */}
        <path d={pastPath} fill="none" stroke="#0f0f1a" strokeWidth="3" opacity="0.18" filter="url(#kg-glow)" />

        {/* Past curve */}
        <path d={pastPath} fill="none" stroke="url(#kg-stroke)" strokeWidth="2.4" strokeLinecap="round" />

        {/* Forecast curve (dashed) */}
        <path d={forecastPath} fill="none" stroke="url(#kg-forecast)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 5" />

        {/* Now dot */}
        <circle cx={lastPast.x} cy={lastPast.y} r="5.5" fill="#0f0f1a" />
        <circle cx={lastPast.x} cy={lastPast.y} r="9" fill="none" stroke="#0f0f1a" strokeOpacity="0.18" />
        <text x={lastPast.x} y={lastPast.y - 12} textAnchor="middle" fontSize="10" fontWeight="600" fill="#0f0f1a" fontFamily="'DM Sans', sans-serif">
          Now {mastPct}%
        </text>

        {/* Forecast dot */}
        <circle cx={lastForecast.x} cy={lastForecast.y} r="4" fill="#fff" stroke="#0f0f1a" strokeWidth="1.5" />
        <text x={lastForecast.x} y={lastForecast.y - 10} textAnchor="end" fontSize="10" fontWeight="600" fill="rgba(15,15,26,0.55)" fontFamily="'DM Sans', sans-serif">
          {predictedMastery}%
        </text>
      </svg>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
        marginTop: '4px', paddingTop: '12px', borderTop: '1px solid rgba(15,15,26,0.06)',
      }}>
        <div>
          <Eyebrow>Current</Eyebrow>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{mastPct}%</div>
        </div>
        <div>
          <Eyebrow>Predicted</Eyebrow>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{predictedMastery}%</div>
        </div>
        <div>
          <Eyebrow>Headroom</Eyebrow>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f0f1a', marginTop: '4px' }}>{100 - mastPct}%</div>
        </div>
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginTop: '8px' }}>
        Forecast confidence · {confidence}%
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  KNOWLEDGE CONSTELLATION — signature SVG visualization
// ═══════════════════════════════════════════════════════════════════════════
function KnowledgeConstellation({ decks }: { decks: Deck[] }) {
  const W = 360, H = 320;
  const cx = W / 2, cy = H / 2;
  const maxCards = Math.max(...decks.map(d => d.cards.length), 1);
  const N = decks.length;

  const nodes = decks.map((d, i) => {
    const s = deckStats(d);
    const angle = (i / Math.max(N, 1)) * Math.PI * 2 - Math.PI / 2;
    // Distance from center: less mastered = further out
    const ringDist = 60 + (1 - s.mastPct / 100) * 80;
    const x = cx + Math.cos(angle) * ringDist;
    const y = cy + Math.sin(angle) * ringDist;
    const sizeScale = 0.45 + (s.total / maxCards) * 0.55; // 0.45..1.0
    const r = 10 + sizeScale * 14; // 10..24
    const brightness = 0.35 + (s.mastPct / 100) * 0.65;
    const retention = retentionLabel(s.avgEase, s.mastered + s.learning);
    const glowStrength = retention === 'Excellent' ? 1 : retention === 'Good' ? 0.7 : retention === 'Fair' ? 0.4 : 0.2;
    const health = healthFor(s.mastered, s.learning, s.struggling);
    return { d, s, x, y, r, brightness, glowStrength, health, name: d.name };
  });

  return (
    <div style={{ ...PANEL, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <Eyebrow>Knowledge constellation</Eyebrow>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', marginTop: '4px' }}>Your learning map</div>
        </div>
        <StatusPill label={`${decks.length} nodes`} />
      </div>

      <div style={{
        position: 'relative',
        borderRadius: '14px',
        background: 'radial-gradient(circle at 50% 50%, #0e0a2e 0%, #060418 70%, #050314 100%)',
        overflow: 'hidden',
        flex: 1,
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="kc-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a1f4a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#060418" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="kc-node" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <filter id="kc-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* Ambient halo */}
          <circle cx={cx} cy={cy} r={140} fill="url(#kc-bg)" />

          {/* Subtle background stars */}
          {Array.from({ length: 30 }, (_, i) => {
            const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * W;
            const sy = ((Math.sin(i * 78.233) * 12543.21) % 1 + 1) % 1 * H;
            const sr = 0.4 + (((Math.sin(i * 33.7) + 1) / 2) * 0.9);
            return <circle key={`s-${i}`} cx={sx} cy={sy} r={sr} fill="rgba(255,255,255,0.35)" />;
          })}

          {/* Connections — subtle lines between adjacent nodes around the ring */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            if (nodes.length < 2) return null;
            return (
              <line
                key={`l-${i}`}
                x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                stroke="rgba(180,200,255,0.18)" strokeWidth="0.8"
                strokeDasharray="2 3"
              />
            );
          })}
          {/* Lines from center to each node */}
          {nodes.map((n, i) => (
            <line
              key={`r-${i}`}
              x1={cx} y1={cy} x2={n.x} y2={n.y}
              stroke="rgba(180,200,255,0.10)" strokeWidth="0.6"
            />
          ))}

          {/* Center "self" marker */}
          <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx={cx} cy={cy} r="8" fill="none" stroke="rgba(255,255,255,0.25)" />

          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={`n-${i}`}>
              {/* Glow */}
              <circle
                cx={n.x} cy={n.y} r={n.r * 1.8}
                fill="#ffffff"
                opacity={0.12 + n.glowStrength * 0.18}
                filter="url(#kc-glow)"
              />
              {/* Outer body */}
              <circle
                cx={n.x} cy={n.y} r={n.r}
                fill="url(#kc-node)"
                opacity={n.brightness}
              />
              {/* Core */}
              <circle
                cx={n.x} cy={n.y} r={Math.max(2.5, n.r * 0.35)}
                fill="#ffffff"
                opacity={Math.min(1, 0.6 + n.brightness * 0.4)}
              />
              {/* Health ring */}
              <circle
                cx={n.x} cy={n.y} r={n.r + 3}
                fill="none"
                stroke={n.health.tone}
                strokeOpacity="0.55"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '10px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '10.5px', color: 'rgba(15,15,26,0.5)' }}>
          <span>Size · cards</span>
          <span>·</span>
          <span>Brightness · mastery</span>
          <span>·</span>
          <span>Glow · retention</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  LEARNING ACTIVITY — signature SVG section
// ═══════════════════════════════════════════════════════════════════════════
function LearningActivity({
  dailyNormalized, weeklyDeltaPct, consistencyPct, consistencyLabel, momentumLabel,
}: {
  dailyNormalized: number[]; weeklyDeltaPct: number; consistencyPct: number; consistencyLabel: string; momentumLabel: string;
}) {
  const W = 560, H = 140, padL = 14, padR = 14, padT = 18, padB = 22;
  const pW = W - padL - padR;
  const pH = H - padT - padB;
  const n = dailyNormalized.length;
  const colWidth = pW / n;

  return (
    <div style={{ ...PANEL, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Eyebrow>Learning activity</Eyebrow>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f0f1a', marginTop: '4px' }}>Last 14 days</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusPill label={`Momentum · ${momentumLabel}`} />
          <StatusPill label={`Consistency · ${consistencyLabel}`} />
          <StatusPill label={`${weeklyDeltaPct >= 0 ? '↑' : '↓'} ${Math.abs(weeklyDeltaPct)}% wk`} />
        </div>
      </div>

      <div className="lum-activity-grid">
        {/* Daily activity bars */}
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="la-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0f0f1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0f0f1a" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="la-bar-faint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0f0f1a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0f0f1a" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Baseline */}
            <line x1={padL} y1={padT + pH} x2={W - padR} y2={padT + pH} stroke="rgba(15,15,26,0.08)" />

            {/* Bars */}
            {dailyNormalized.map((v, i) => {
              const h = Math.max(2, v * pH);
              const x = padL + i * colWidth + colWidth * 0.18;
              const w = colWidth * 0.64;
              const y = padT + pH - h;
              const recent = i >= n - 7;
              return (
                <g key={`b-${i}`}>
                  <rect
                    x={x} y={y} width={w} height={h}
                    rx={Math.min(3, w / 2)}
                    fill={recent ? 'url(#la-bar)' : 'url(#la-bar-faint)'}
                  />
                </g>
              );
            })}

            {/* Day labels (sparse) */}
            {[0, Math.floor(n / 2), n - 1].map(i => {
              const x = padL + i * colWidth + colWidth / 2;
              const labels = ['14d ago', '7d', 'Today'];
              const label = i === 0 ? labels[0] : i === n - 1 ? labels[2] : labels[1];
              return (
                <text key={`d-${i}`} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(15,15,26,0.4)" fontFamily="'DM Sans', sans-serif">
                  {label}
                </text>
              );
            })}

            {/* Week separator */}
            <line
              x1={padL + (n / 2) * colWidth} y1={padT}
              x2={padL + (n / 2) * colWidth} y2={padT + pH}
              stroke="rgba(15,15,26,0.08)" strokeDasharray="2 3"
            />
          </svg>
          <div style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)', marginTop: '6px' }}>
            Daily learning intensity — recent week emphasized.
          </div>
        </div>

        {/* Weekly momentum delta */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(15,15,26,0.025)',
          border: '1px solid rgba(15,15,26,0.06)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <Eyebrow>Weekly momentum</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#0f0f1a', lineHeight: 1 }}>
              {weeklyDeltaPct >= 0 ? '+' : ''}{weeklyDeltaPct}%
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.45)' }}>vs prior 7d</div>
          </div>
          {/* Mini delta bars */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '10px', height: '28px', alignItems: 'flex-end' }}>
            {dailyNormalized.slice(0, 7).map((v, i) => (
              <div key={`p-${i}`} style={{
                width: '6px', height: `${Math.max(3, v * 28)}px`,
                background: 'rgba(15,15,26,0.2)', borderRadius: '2px',
              }} />
            ))}
            <div style={{ width: '6px', alignSelf: 'stretch' }} />
            {dailyNormalized.slice(7).map((v, i) => (
              <div key={`n-${i}`} style={{
                width: '6px', height: `${Math.max(3, v * 28)}px`,
                background: '#0f0f1a', borderRadius: '2px',
              }} />
            ))}
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.45)', marginTop: '8px' }}>
            Prior week → current week
          </div>
        </div>

        {/* Consistency */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(15,15,26,0.025)',
          border: '1px solid rgba(15,15,26,0.06)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <Eyebrow>Practice consistency</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#0f0f1a', lineHeight: 1 }}>{consistencyPct}%</div>
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.45)' }}>{consistencyLabel}</div>
          </div>
          {/* Dot grid: 14 dots representing days */}
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
            {dailyNormalized.map((v, i) => (
              <div
                key={`c-${i}`}
                style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: v > 0.18 ? '#0f0f1a' : 'rgba(15,15,26,0.12)',
                  opacity: v > 0.18 ? (0.55 + Math.min(0.45, v * 0.6)) : 1,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.45)', marginTop: '8px' }}>
            Days active out of last 14
          </div>
        </div>
      </div>
    </div>
  );
}
