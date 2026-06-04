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

// ── Card classification ─────────────────────────────────────────────────
function classifyCard(c: Card): 'mastered' | 'learning' | 'struggling' {
  if (c.reps >= 2 && c.ease >= 1.6) return 'mastered';
  if (c.reps === 1) return 'learning';
  return 'struggling';
}

// ── Deck-level helpers ────────────────────────────────────────────────────
function deckStats(deck: Deck) {
  const total = deck.cards.length;
  const mastered = deck.cards.filter(c => classifyCard(c) === 'mastered').length;
  const learning = deck.cards.filter(c => classifyCard(c) === 'learning').length;
  const struggling = deck.cards.filter(c => classifyCard(c) === 'struggling').length;
  const mastPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const practicedPct = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;
  const practicedCards = deck.cards.filter(c => c.reps > 0);
  const avgEase = practicedCards.length > 0
    ? practicedCards.reduce((s, c) => s + c.ease, 0) / practicedCards.length
    : 2.5;
  return { total, mastered, learning, struggling, mastPct, practicedPct, avgEase };
}

// ── Radial progress ring ──────────────────────────────────────────────────
function Ring({ pct, color, size = 64, trackColor = 'rgba(26,26,46,0.07)', showLabel = true, strokeWidth, glow = false }: { pct: number; color: string; size?: number; trackColor?: string; showLabel?: boolean; strokeWidth?: number; glow?: boolean }) {
  const sw = strokeWidth ?? (size > 100 ? 9 : 5);
  const r = (size - sw - 2) / 2;
  const c = size / 2;
  const dash = 2 * Math.PI * r;
  const uid = `${color.replace(/[^a-z0-9]/gi, '')}-${size}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`rg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        {glow && (
          <filter id={`rgf-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        )}
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />
      {glow && (
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" opacity="0.35"
          strokeDasharray={`${dash}`}
          strokeDashoffset={`${dash * (1 - pct / 100)}`}
          transform={`rotate(-90 ${c} ${c})`}
          filter={`url(#rgf-${uid})`}
        />
      )}
      <circle cx={c} cy={c} r={r} fill="none" stroke={`url(#rg-${uid})`} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash}`}
        strokeDashoffset={`${dash * (1 - pct / 100)}`}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {showLabel && (
        <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={size > 100 ? 26 : size < 56 ? 11 : 13} fontWeight="700"
          fontFamily="'DM Sans', sans-serif" fill={color}>
          {pct}%
        </text>
      )}
    </svg>
  );
}

// ── Stacked bar ──────────────────────────────────────────────────────────
function StackBar({ mastered, learning, struggling, total, height = 8 }: {
  mastered: number; learning: number; struggling: number; total: number; height?: number;
}) {
  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;
  return (
    <div style={{ height: `${height}px`, display: 'flex', borderRadius: '999px', overflow: 'hidden', background: 'rgba(26,26,46,0.06)', gap: '1px' }}>
      {mastered > 0 && <div style={{ width: `${pct(mastered)}%`, background: 'linear-gradient(90deg,#1D9E75,#2BBF8E)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />}
      {learning > 0 && <div style={{ width: `${pct(learning)}%`, background: 'linear-gradient(90deg,#7F77DD,#9C95F0)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />}
      {struggling > 0 && <div style={{ width: `${pct(struggling)}%`, background: 'linear-gradient(90deg,#E24B4A,#F26B6A)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />}
    </div>
  );
}

// ── Mini bar ─────────────────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '5px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.7s ease' }} />
    </div>
  );
}

// ── Ease gauge ───────────────────────────────────────────────────────────
function EaseGauge({ ease }: { ease: number }) {
  const pct = Math.round(Math.min(100, Math.max(0, ((ease - 1.3) / (3.5 - 1.3)) * 100)));
  const color = ease < 1.8 ? '#E24B4A' : ease < 2.2 ? '#BA7517' : '#1D9E75';
  const label = ease < 1.8 ? 'Hard' : ease < 2.2 ? 'Fair' : ease < 2.8 ? 'Good' : 'Easy';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.7s ease' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color, minWidth: '28px' }}>{label}</span>
    </div>
  );
}

// ── Shared atoms ─────────────────────────────────────────────────────────
const PANEL: React.CSSProperties = {
  position: 'relative',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,248,255,0.92))',
  border: '1px solid rgba(127,119,221,0.14)',
  borderRadius: '24px',
  boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 40px rgba(15,15,26,0.06), 0 2px 6px rgba(15,15,26,0.03)',
  transition: 'all .25s cubic-bezier(.4,0,.2,1)',
};

function Eyebrow({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      fontSize: '10.5px', fontWeight: 700, color: 'rgba(15,15,26,0.5)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}` }} />}
      {children}
    </div>
  );
}

function Divider({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(180deg, transparent, rgba(127,119,221,0.18), transparent)' }} />;
  }
  return <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(127,119,221,0.18), transparent)' }} />;
}

function statusBadge(pct: number) {
  if (pct >= 75) return { label: 'Mastered', bg: '#E1F5EE', fg: '#0F6E56', border: '#9FE1CB' };
  if (pct >= 50) return { label: 'Advanced', bg: '#EEEDFE', fg: '#534AB7', border: '#AFA9EC' };
  if (pct >= 25) return { label: 'Progressing', bg: '#FFF4E0', fg: '#7A5111', border: '#F0D89A' };
  return { label: 'Beginner', bg: '#F3F2F0', fg: '#555149', border: '#D9D6CF' };
}

function easeLabel(ease: number, practiced: number) {
  if (practiced === 0) return { label: 'Untested', fg: 'rgba(15,15,26,0.4)', dot: 'rgba(15,15,26,0.2)' };
  if (ease < 1.8) return { label: 'Poor', fg: '#A32D2D', dot: '#E24B4A' };
  if (ease < 2.2) return { label: 'Fair', fg: '#7A5111', dot: '#BA7517' };
  if (ease < 2.8) return { label: 'Good', fg: '#0F6E56', dot: '#1D9E75' };
  return { label: 'Excellent', fg: '#0F6E56', dot: '#2BBF8E' };
}

function Hoverable({ children, style, lift = 4 }: { children: React.ReactNode; style?: React.CSSProperties; lift?: number }) {
  return (
    <div
      style={{ ...PANEL, ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `translateY(-${lift}px)`;
        e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 56px rgba(15,15,26,0.10), 0 4px 10px rgba(15,15,26,0.04)';
        e.currentTarget.style.borderColor = 'rgba(127,119,221,0.32)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = PANEL.boxShadow as string;
        e.currentTarget.style.borderColor = 'rgba(127,119,221,0.14)';
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function Dashboard({ decks }: { decks: Deck[] }) {
  const allCards = decks.flatMap(d => d.cards);
  const total = allCards.length;
  const mastered = allCards.filter(c => classifyCard(c) === 'mastered').length;
  const learning = allCards.filter(c => classifyCard(c) === 'learning').length;
  const struggling = allCards.filter(c => classifyCard(c) === 'struggling').length;
  const mastPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const practicedPct = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;
  const practicedCards = allCards.filter(c => c.reps > 0);
  const globalEase = practicedCards.length > 0
    ? practicedCards.reduce((s, c) => s + c.ease, 0) / practicedCards.length
    : 2.5;

  // Derived metrics
  const learningScore = total > 0
    ? Math.round(((mastered * 100) + (learning * 50)) / total)
    : 0;
  const momentum = total > 0 ? ((mastered * 2) + learning) / total : 0;
  const momentumLabel = momentum < 0.5 ? 'Slow' : momentum < 1 ? 'Building' : momentum < 1.5 ? 'Strong' : 'Excellent';
  const momentumColor = momentum < 0.5 ? '#888780' : momentum < 1 ? '#BA7517' : momentum < 1.5 ? '#534AB7' : '#1D9E75';
  const momentumPct = Math.min(100, Math.round((momentum / 2) * 100));
  const predictedMastery = Math.min(100, mastPct + Math.round((learning / Math.max(total, 1)) * 70));

  // Trend (derived from momentum + ease)
  const trend = momentum >= 1 && globalEase >= 2.3
    ? { dir: 'up' as const, label: 'Improving', color: '#1D9E75', arrow: '↑' }
    : momentum < 0.5 || struggling > mastered
      ? { dir: 'down' as const, label: 'Needs Attention', color: '#E24B4A', arrow: '↓' }
      : { dir: 'flat' as const, label: 'Stable', color: '#BA7517', arrow: '→' };

  const heroStatus =
    learningScore >= 80 ? 'Mastery Accelerating' :
    learningScore >= 60 ? 'Excellent Progress' :
    learningScore >= 35 ? 'Building Momentum' :
    'Early Days';

  // Confidence (composite signal)
  const confidence = total === 0 ? 0 : Math.min(99, Math.round(
    (practicedPct * 0.45) + (Math.min(100, Math.max(0, ((globalEase - 1.3) / 2.2) * 100)) * 0.35) + (mastPct * 0.20)
  ));
  const confidenceLabel = confidence >= 75 ? 'High' : confidence >= 45 ? 'Moderate' : 'Low';
  const confidenceColor = confidence >= 75 ? '#1D9E75' : confidence >= 45 ? '#534AB7' : '#BA7517';

  // Primary + secondary insights
  const allInsights: { icon: string; tone: 'good' | 'warn' | 'info'; title: string; text: string; weight: number }[] = [];
  if (struggling > mastered && struggling > 0) {
    const lift = Math.min(25, Math.round((struggling / Math.max(total, 1)) * 40));
    allInsights.push({
      icon: '🎯', tone: 'warn', weight: 100,
      title: `${struggling} struggling cards need attention`,
      text: `Reviewing them next could increase mastery by up to ${lift}%.`,
    });
  }
  if (practicedPct < 20 && total > 0) {
    allInsights.push({
      icon: '🚀', tone: 'warn', weight: 90,
      title: 'Most cards remain unpracticed',
      text: `Only ${practicedPct}% of your library is active. A single 10-minute session would meaningfully shift this.`,
    });
  }
  if (mastPct > 70) {
    allInsights.push({
      icon: '🏆', tone: 'good', weight: 80,
      title: 'Outstanding mastery rate',
      text: `${mastPct}% mastered. Shift focus to spaced reviews to lock in long-term retention.`,
    });
  }
  if (globalEase > 2.5 && practicedCards.length > 0) {
    allInsights.push({
      icon: '✨', tone: 'good', weight: 60,
      title: 'Retention quality above average',
      text: `Your average ease of ${globalEase.toFixed(2)} suggests you're recalling cards comfortably.`,
    });
  }
  if (allInsights.length === 0 && total > 0) {
    allInsights.push({
      icon: '📚', tone: 'info', weight: 10,
      title: 'Keep your daily rhythm',
      text: 'Consistent short sessions outperform infrequent long ones for long-term recall.',
    });
  }
  allInsights.sort((a, b) => b.weight - a.weight);
  const primaryInsight = allInsights[0];
  const secondaryInsights = allInsights.slice(1, 3);

  // Coach
  const coach = total === 0
    ? { priority: 'LOW', type: 'Onboarding', conf: 50, color: '#534AB7',
        text: 'Create your first deck to begin.' }
    : struggling > mastered
      ? { priority: 'HIGH PRIORITY', type: 'Review struggling cards', conf: 92, color: '#E24B4A',
          text: `You have ${struggling} struggling cards. Reviewing them next could significantly improve mastery and unblock new material.` }
      : practicedPct < 20
        ? { priority: 'HIGH PRIORITY', type: 'Start a focused session', conf: 88, color: '#BA7517',
            text: `Most cards are untouched. A single 10-minute session today builds the routine that compounds over weeks.` }
        : mastPct >= 70
          ? { priority: 'MAINTENANCE', type: 'Reinforce retention', conf: 84, color: '#1D9E75',
              text: 'Your retention is strong. Continue consistent practice on the cards still in learning to lock in mastery.' }
          : { priority: 'MEDIUM', type: 'Advance learning cards', conf: 76, color: '#534AB7',
              text: `${learning} cards are in active learning. Daily reviews will push them into mastery within a week.` };

  // ── Empty state ────────────────────────────────────────────────────────
  if (decks.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '4rem 1rem' }}>
        <div style={{
          maxWidth: '560px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(238,237,254,0.85))',
          border: '1px solid rgba(127,119,221,0.20)',
          borderRadius: '28px',
          padding: '4rem 2rem',
          boxShadow: '0 20px 60px rgba(15,15,26,0.08)',
        }}>
          <div style={{
            width: '112px', height: '112px',
            background: 'linear-gradient(135deg, #EEEDFE, #DCD8FB)',
            border: '1px solid #AFA9EC',
            borderRadius: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem',
            boxShadow: '0 12px 32px rgba(127,119,221,0.25)',
          }}>
            <svg width="46" height="46" fill="none" stroke="#534AB7" strokeWidth="1.7"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f0f1a', letterSpacing: '-0.5px' }}>
            Your learning journey starts here
          </h2>
          <p style={{ color: 'rgba(15,15,26,0.55)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Upload a PDF and create your first deck to unlock a personalized intelligence dashboard.
          </p>
          <div style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #534AB7, #7F77DD)',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(83,74,183,0.32)',
          }}>
            Create your first deck →
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#0f0f1a', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section style={{
        position: 'relative',
        background: 'radial-gradient(120% 140% at 0% 0%, #2E2670 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, #1D9E75 0%, transparent 55%), linear-gradient(135deg, #0E0A2E 0%, #1B1742 55%, #2E2670 100%)',
        borderRadius: '32px',
        padding: '44px 48px',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(14,10,46,0.40), 0 1px 0 rgba(255,255,255,0.08) inset',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff',
      }}>
        {/* layered glow */}
        <div aria-hidden style={{ position: 'absolute', top: '-180px', right: '-120px', width: '460px', height: '460px', background: 'radial-gradient(circle, rgba(159,225,203,0.30), transparent 65%)', filter: 'blur(10px)' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '-220px', left: '-140px', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(127,119,221,0.40), transparent 65%)', filter: 'blur(10px)' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 60%)' }} />
        {/* subtle grid */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '40px', alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '999px',
                fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ position: 'relative', width: '7px', height: '7px' }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#9FE1CB' }} />
                  <span style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: '#9FE1CB', opacity: 0.4, animation: 'lp-pulse 2s ease-out infinite' }} />
                </span>
                Learning Intelligence
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                background: `${trend.color}22`,
                border: `1px solid ${trend.color}55`,
                borderRadius: '999px',
                fontSize: '11px', fontWeight: 700, color: trend.color === '#BA7517' ? '#F5C97A' : trend.color,
                letterSpacing: '0.04em',
              }}>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{trend.arrow}</span>
                {trend.label}
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '8px' }}>
              Learning Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{
                fontSize: '7rem', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-4px',
                background: 'linear-gradient(135deg, #ffffff 0%, #9FE1CB 60%, #7F77DD 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                textShadow: '0 0 60px rgba(159,225,203,0.25)',
              }}>
                {learningScore}
              </span>
              <span style={{ fontSize: '14px', opacity: 0.55, fontWeight: 500, letterSpacing: '0.04em' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.4px', marginBottom: '28px', background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {heroStatus}
            </div>

            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                { l: 'Mastery', v: `${mastPct}%`, sub: `${mastered}/${total}` },
                { l: 'Practiced', v: `${practicedPct}%`, sub: `${mastered + learning} cards` },
                { l: 'Decks', v: decks.length, sub: `${total} total` },
              ].map((s, i) => (
                <div key={s.l} style={{ display: 'flex', gap: '28px' }}>
                  {i > 0 && <div style={{ width: '1px', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.18), transparent)' }} />}
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>{s.l}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.6px', lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div aria-hidden style={{ position: 'absolute', inset: '-30px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,225,203,0.25), transparent 70%)', filter: 'blur(8px)' }} />
            <Ring pct={mastPct} color="#9FE1CB" size={210} strokeWidth={12} trackColor="rgba(255,255,255,0.10)" glow showLabel={false} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '46px', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1, color: '#fff' }}>{mastPct}%</div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: '6px' }}>Mastery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ INTELLIGENCE PANEL ═══════════════════════ */}
      <section style={{ ...PANEL, padding: 0, overflow: 'hidden' }}>
        {/* gradient border accent */}
        <div aria-hidden style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(127,119,221,0.5), rgba(29,158,117,0.5), transparent)' }} />

        <div style={{ padding: '24px 28px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Eyebrow dot="#7F77DD">Learning Intelligence</Eyebrow>
            <h3 style={{ margin: '6px 0 2px', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: '#0f0f1a' }}>
              Today's snapshot
            </h3>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px',
            background: `${confidenceColor}14`,
            border: `1px solid ${confidenceColor}44`,
            borderRadius: '999px',
            fontSize: '11px', fontWeight: 700, color: confidenceColor,
            letterSpacing: '0.04em',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: confidenceColor }} />
            {confidenceLabel} confidence · {confidence}%
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          padding: '8px 12px 24px',
        }}>
          {/* Knowledge Health */}
          <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Eyebrow>Knowledge Health</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', color: '#0f0f1a' }}>{mastPct}%</span>
              <span style={{ fontSize: '12px', color: 'rgba(15,15,26,0.5)' }}>healthy</span>
            </div>
            <StackBar mastered={mastered} learning={learning} struggling={struggling} total={total} height={8} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              {[
                { l: 'Healthy', v: mastered, c: '#1D9E75' },
                { l: 'Growing', v: learning, c: '#7F77DD' },
                { l: 'At Risk', v: struggling, c: '#E24B4A' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(15,15,26,0.6)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.c }} />
                    {r.l}
                  </span>
                  <span style={{ fontWeight: 600, color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Momentum */}
          <div style={{ padding: '20px 18px', borderLeft: '1px solid rgba(127,119,221,0.10)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Eyebrow>Learning Momentum</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', color: momentumColor }}>{momentumLabel}</span>
              <span style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)' }}>{momentum.toFixed(2)}</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${momentumPct}%`,
                background: `linear-gradient(90deg, ${momentumColor}, ${momentumColor}cc)`,
                borderRadius: '999px',
                boxShadow: `0 0 14px ${momentumColor}66`,
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{ position: 'relative', height: '10px' }}>
              {[0, 25, 50, 75, 100].map(p => (
                <div key={p} style={{ position: 'absolute', left: `${p}%`, top: 0, width: '1px', height: '5px', background: 'rgba(15,15,26,0.18)', transform: 'translateX(-0.5px)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'rgba(15,15,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '-6px' }}>
              <span>Slow</span><span>Building</span><span>Strong</span><span>Excellent</span>
            </div>
          </div>

          {/* Predicted Mastery */}
          <div style={{ padding: '20px 18px', borderLeft: '1px solid rgba(127,119,221,0.10)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Eyebrow>Predicted Mastery</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', color: '#534AB7' }}>{predictedMastery}%</span>
              <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>+{predictedMastery - mastPct}</span>
            </div>
            <div style={{ position: 'relative', height: '8px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${mastPct}%`, background: 'linear-gradient(90deg,#1D9E75,#2BBF8E)', borderRadius: '999px' }} />
              <div style={{ position: 'absolute', left: `${mastPct}%`, width: `${predictedMastery - mastPct}%`, top: 0, bottom: 0, background: 'repeating-linear-gradient(45deg, rgba(127,119,221,0.55) 0 6px, rgba(127,119,221,0.20) 6px 12px)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(15,15,26,0.5)' }}>
              <span>Now <strong style={{ color: '#0f0f1a' }}>{mastPct}%</strong></span>
              <span>Forecast <strong style={{ color: '#534AB7' }}>{predictedMastery}%</strong></span>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ padding: '20px 18px', borderLeft: '1px solid rgba(127,119,221,0.10)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Eyebrow>Confidence Level</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Ring pct={confidence} color={confidenceColor} size={68} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: confidenceColor, lineHeight: 1.2 }}>{confidenceLabel}</div>
                <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.5)', marginTop: '4px', lineHeight: 1.4 }}>
                  Based on practice, ease, and mastery signals.
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.55)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ease <strong style={{ color: '#0f0f1a' }}>{globalEase.toFixed(2)}</strong></span>
              <span>Practiced <strong style={{ color: '#0f0f1a' }}>{practicedPct}%</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRIMARY + SECONDARY INSIGHTS ═══════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
        {/* PRIMARY */}
        {primaryInsight && (
          <Hoverable style={{
            background: primaryInsight.tone === 'good'
              ? 'linear-gradient(135deg, rgba(225,245,238,0.7) 0%, rgba(255,255,255,0.96) 60%)'
              : primaryInsight.tone === 'warn'
                ? 'linear-gradient(135deg, rgba(252,235,235,0.7) 0%, rgba(255,255,255,0.96) 60%)'
                : 'linear-gradient(135deg, rgba(238,237,254,0.7) 0%, rgba(255,255,255,0.96) 60%)',
            padding: '28px 30px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div aria-hidden style={{
              position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px',
              background: primaryInsight.tone === 'good'
                ? 'radial-gradient(circle, rgba(29,158,117,0.18), transparent 70%)'
                : primaryInsight.tone === 'warn'
                  ? 'radial-gradient(circle, rgba(226,75,74,0.16), transparent 70%)'
                  : 'radial-gradient(circle, rgba(127,119,221,0.18), transparent 70%)',
            }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))',
                border: '1px solid rgba(127,119,221,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
                boxShadow: '0 8px 20px rgba(15,15,26,0.06)',
                flexShrink: 0,
              }}>{primaryInsight.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Eyebrow dot="#7F77DD">Primary Insight</Eyebrow>
                <div style={{
                  fontSize: '20px', fontWeight: 700, letterSpacing: '-0.4px',
                  color: '#0f0f1a', marginTop: '8px', marginBottom: '6px', lineHeight: 1.3,
                }}>
                  {primaryInsight.title}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(15,15,26,0.65)', lineHeight: 1.6 }}>
                  {primaryInsight.text}
                </div>
              </div>
            </div>
          </Hoverable>
        )}

        {/* SECONDARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {secondaryInsights.length > 0 ? secondaryInsights.map((ins, i) => {
            const c = ins.tone === 'good' ? '#1D9E75' : ins.tone === 'warn' ? '#E24B4A' : '#534AB7';
            return (
              <Hoverable key={i} lift={2} style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '11px',
                    background: `${c}14`, border: `1px solid ${c}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                  }}>{ins.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0f1a', marginBottom: '2px', lineHeight: 1.35 }}>{ins.title}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.55)', lineHeight: 1.5 }}>{ins.text}</div>
                  </div>
                </div>
              </Hoverable>
            );
          }) : (
            <Hoverable lift={2} style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
              <div style={{ textAlign: 'center', color: 'rgba(15,15,26,0.4)', fontSize: '12px' }}>
                Additional insights appear as you practice more.
              </div>
            </Hoverable>
          )}
        </div>
      </section>

      {/* ═════════════════════════ DECK GRID ═════════════════════════ */}
      <section>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px', padding: '0 4px' }}>
          <div>
            <Eyebrow>Your Library</Eyebrow>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f0f1a', margin: '6px 0 0', letterSpacing: '-0.4px' }}>
              {decks.length} deck{decks.length !== 1 ? 's' : ''} <span style={{ color: 'rgba(15,15,26,0.35)', fontWeight: 500 }}>· {total} cards</span>
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {[['#1D9E75', 'Healthy'], ['#7F77DD', 'Growing'], ['#E24B4A', 'At Risk']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c }} />
                <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.5)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '14px',
        }}>
          {decks.map(deck => {
            const s = deckStats(deck);
            const badge = statusBadge(s.mastPct);
            const e = easeLabel(s.avgEase, s.practicedPct > 0 ? 1 : 0);
            const ringColor = s.mastPct >= 70 ? '#1D9E75' : s.mastPct >= 30 ? '#7F77DD' : '#888780';
            return (
              <Hoverable key={deck.id} style={{ padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
                {/* top gradient accent */}
                <div aria-hidden style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '2px', background: `linear-gradient(90deg, ${ringColor}, transparent)`, opacity: 0.7, borderRadius: '0 0 999px 999px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px', marginBottom: '3px' }}>
                      {deck.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)' }}>
                      {new Date(deck.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: badge.bg, color: badge.fg,
                    border: `1px solid ${badge.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 12px ${badge.border}55`,
                  }}>{badge.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <Ring pct={s.mastPct} color={ringColor} size={64} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'rgba(15,15,26,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px', fontWeight: 600 }}>Cards</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f1a' }}>{s.total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'rgba(15,15,26,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px', fontWeight: 600 }}>Practiced</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f1a' }}>{s.practicedPct}%</div>
                    </div>
                  </div>
                </div>

                <StackBar mastered={s.mastered} learning={s.learning} struggling={s.struggling} total={s.total} height={6} />

                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: e.dot }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: e.fg }}>{e.label}</span>
                    <span style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)' }}>retention</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.45)' }}>
                    ease <strong style={{ color: '#0f0f1a', fontWeight: 700 }}>{s.avgEase.toFixed(2)}</strong>
                  </div>
                </div>
              </Hoverable>
            );
          })}
        </div>
      </section>

      {/* ═════════════════════════ LEARNING COACH ═════════════════════════ */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1B1742 0%, #2E2670 100%)',
        borderRadius: '24px',
        padding: '2px',
        boxShadow: '0 20px 60px rgba(27,23,66,0.30)',
      }}>
        {/* inner card */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,248,255,0.96))',
          borderRadius: '22px',
          padding: '24px 28px',
          overflow: 'hidden',
        }}>
          <div aria-hidden style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(127,119,221,0.18), transparent 70%)' }} />
          <div aria-hidden style={{ position: 'absolute', bottom: '-80px', left: '40%', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(159,225,203,0.14), transparent 70%)' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #534AB7, #7F77DD)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
              boxShadow: '0 12px 28px rgba(83,74,183,0.40), 0 0 0 1px rgba(255,255,255,0.20) inset',
              flexShrink: 0,
            }}>🤖</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  padding: '4px 9px', borderRadius: '6px',
                  background: `${coach.color}18`,
                  color: coach.color,
                  border: `1px solid ${coach.color}44`,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{coach.priority}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(15,15,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Learning Coach
                </span>
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(15,15,26,0.25)' }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(15,15,26,0.5)' }}>
                  Confidence <strong style={{ color: coach.color }}>{coach.conf}%</strong>
                </span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f0f1a', letterSpacing: '-0.3px', marginBottom: '6px' }}>
                {coach.type}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(15,15,26,0.65)', lineHeight: 1.6 }}>
                {coach.text}
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, maxWidth: '200px', height: '4px', background: 'rgba(15,15,26,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${coach.conf}%`, background: `linear-gradient(90deg, ${coach.color}, ${coach.color}aa)`, borderRadius: '999px', boxShadow: `0 0 10px ${coach.color}66`, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Signal strength
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes lp-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
