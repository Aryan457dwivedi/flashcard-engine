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
// mastered   → reps >= 2 AND ease >= 1.6
// learning   → reps === 1
// struggling → everything else (unseen, low-ease, due) — merged into one bucket
function classifyCard(c: Card): 'mastered' | 'learning' | 'struggling' {
  if (c.reps >= 2 && c.ease >= 1.6) return 'mastered';
  if (c.reps === 1)                  return 'learning';
  return                                    'struggling';
}

// ── Deck-level helpers ────────────────────────────────────────────────────
function deckStats(deck: Deck) {
  const total      = deck.cards.length;
  const mastered   = deck.cards.filter(c => classifyCard(c) === 'mastered').length;
  const learning   = deck.cards.filter(c => classifyCard(c) === 'learning').length;
  const struggling = deck.cards.filter(c => classifyCard(c) === 'struggling').length;
  const mastPct    = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const practicedPct = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;

  // Average ease of practiced cards
  const practicedCards = deck.cards.filter(c => c.reps > 0);
  const avgEase = practicedCards.length > 0
    ? practicedCards.reduce((s, c) => s + c.ease, 0) / practicedCards.length
    : 2.5;

  return { total, mastered, learning, struggling, mastPct, practicedPct, avgEase };
}

// ── Radial progress ring ──────────────────────────────────────────────────
function Ring({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r  = (size - 8) / 2;
  const c  = size / 2;
  const dash = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(26,26,46,0.07)" strokeWidth="5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash}`}
        strokeDashoffset={`${dash * (1 - pct / 100)}`}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size < 56 ? 11 : 13} fontWeight="700"
        fontFamily="'DM Sans', sans-serif" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

// ── Stacked bar (3 buckets) ───────────────────────────────────────────────
function StackBar({ mastered, learning, struggling, total }: {
  mastered: number; learning: number; struggling: number; total: number;
}) {
  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;
  return (
    <div style={{ height: '8px', display: 'flex', borderRadius: '999px', overflow: 'hidden', background: 'rgba(26,26,46,0.07)', gap: '1px' }}>
      {mastered   > 0 && <div style={{ width: `${pct(mastered)}%`,   background: '#1D9E75', transition: 'width 0.7s ease' }} />}
      {learning   > 0 && <div style={{ width: `${pct(learning)}%`,   background: '#7F77DD', transition: 'width 0.7s ease' }} />}
      {struggling > 0 && <div style={{ width: `${pct(struggling)}%`, background: '#E24B4A', transition: 'width 0.7s ease' }} />}
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

// ── Ease gauge (shows how well cards are retained) ───────────────────────
function EaseGauge({ ease }: { ease: number }) {
  // ease range: 1.3 (hard) to 3.5 (very easy). Normal ~2.5.
  const pct = Math.round(Math.min(100, Math.max(0, ((ease - 1.3) / (3.5 - 1.3)) * 100)));
  const color = ease < 1.8 ? '#E24B4A' : ease < 2.2 ? '#BA7517' : '#1D9E75';
  const label = ease < 1.8 ? 'Hard' : ease < 2.2 ? 'Fair' : ease < 2.8 ? 'Good' : 'Easy';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.7s ease' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: '600', color, minWidth: '28px' }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard({ decks }: { decks: Deck[] }) {

  // ── Global stats ──────────────────────────────────────────────────────
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

  // ── Empty state ────────────────────────────────────────────────────────
  if (decks.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '6rem 0' }}>
        <div style={{
          width: '72px', height: '72px',
          background: '#EEEDFE',
          border: '1px solid #AFA9EC',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="30" height="30" fill="none" stroke="#7F77DD" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0f0f1a' }}>
          No decks yet
        </h2>
        <p style={{ color: 'rgba(15,15,26,0.4)', fontSize: '0.9rem' }}>
          Upload a PDF and create your first deck to see your progress here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#0f0f1a' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.55rem', fontWeight: '600', letterSpacing: '-0.4px', color: '#0f0f1a', marginBottom: '4px' }}>
          Your Progress
        </h2>
        <p style={{ color: 'rgba(15,15,26,0.4)', fontSize: '0.875rem' }}>
          {decks.length} deck{decks.length !== 1 ? 's' : ''} · {total} cards total
        </p>
      </div>

      {/* ── Top stat row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
        {[
          { label: 'Mastered',   val: mastered,   color: '#1D9E75', bg: '#E1F5EE', border: '#9FE1CB', icon: '✓' },
          { label: 'Learning',   val: learning,   color: '#7F77DD', bg: '#EEEDFE', border: '#AFA9EC', icon: '~' },
          { label: 'Struggling', val: struggling, color: '#E24B4A', bg: '#FCEBEB', border: '#F7C1C1', icon: '↺' },
        ].map(({ label, val, color, bg, border, icon }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '16px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: '600', color, lineHeight: 1, marginBottom: '6px' }}>
                  {val}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '500', color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </div>
              </div>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', color,
              }}>
                {icon}
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <MiniBar pct={total > 0 ? Math.round((val / total) * 100) : 0} color={color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Overview + Due ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>

        {/* Overall mastery */}
        <div style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(127,119,221,0.13)',
          borderRadius: '18px',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}>
          <Ring pct={mastPct} color="#1D9E75" size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f0f1a', marginBottom: '4px' }}>
              Overall Mastery
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)', marginBottom: '14px' }}>
              {mastered} of {total} cards mastered
            </div>
            <StackBar mastered={mastered} learning={learning} struggling={struggling} total={total} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {[
                ['#1D9E75', 'Mastered'],
                ['#7F77DD', 'Learning'],
                ['#E24B4A', 'Struggling'],
              ].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', color: 'rgba(15,15,26,0.4)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Retention ease */}
        <div style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(127,119,221,0.13)',
          borderRadius: '18px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f0f1a', marginBottom: '4px' }}>
              Retention Ease
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)', marginBottom: '20px' }}>
              How easily you recall practiced cards
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '600', color: '#534AB7', lineHeight: 1 }}>
                {practicedPct}%
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)', marginTop: '4px' }}>
                cards practiced
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ease factor
              </div>
              <div style={{ width: '140px' }}>
                <EaseGauge ease={globalEase} />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.35)', marginTop: '4px' }}>
                avg: {globalEase.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-deck breakdown ── */}
      <div style={{
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(127,119,221,0.13)',
        borderRadius: '18px',
        padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f0f1a', marginBottom: '2px' }}>
              Deck Breakdown
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(15,15,26,0.4)' }}>
              Per-deck mastery and retention
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px' }}>
            {[['#1D9E75', 'Mastered'], ['#7F77DD', 'Learning'], ['#E24B4A', 'Struggling']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.4)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 80px 80px 130px',
          gap: '12px',
          padding: '0 4px 10px',
          borderBottom: '1px solid rgba(15,15,26,0.07)',
          marginBottom: '4px',
        }}>
          {['Deck', 'Progress', 'Mastered', 'Cards', 'Ease'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(15,15,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                gridTemplateColumns: '200px 1fr 80px 80px 130px',
                gap: '12px',
                alignItems: 'center',
                padding: '14px 4px',
                borderBottom: i < decks.length - 1 ? '1px solid rgba(15,15,26,0.05)' : 'none',
              }}>
                {/* Name */}
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: '500', color: '#0f0f1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '2px',
                  }}>
                    {deck.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(15,15,26,0.35)' }}>
                    {new Date(deck.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Stacked progress bar */}
                <div>
                  <StackBar
                    mastered={s.mastered}
                    learning={s.learning}
                    struggling={s.struggling}
                    total={s.total}
                  />
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)', marginTop: '4px' }}>
                    {s.practicedPct}% practiced
                  </div>
                </div>

                {/* Mastered % */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '600',
                    color: s.mastPct >= 70 ? '#1D9E75' : s.mastPct >= 30 ? '#7F77DD' : '#888780',
                  }}>
                    {s.mastPct}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)' }}>{s.mastered} cards</div>
                </div>

                {/* Total cards */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f0f1a' }}>
                    {s.total}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(15,15,26,0.3)' }}>total</div>
                </div>

                {/* Ease gauge */}
                <div>
                  {s.practicedPct > 0
                    ? <EaseGauge ease={s.avgEase} />
                    : <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.25)' }}>Not started</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Insight footer ── */}
      {total > 0 && (
        <div style={{
          marginTop: '14px',
          background: mastPct >= 80 ? '#E1F5EE' : struggling > mastered ? '#FCEBEB' : '#EEEDFE',
          border: `1px solid ${mastPct >= 80 ? '#9FE1CB' : struggling > mastered ? '#F7C1C1' : '#AFA9EC'}`,
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '20px', flexShrink: 0 }}>
            {mastPct >= 80 ? '🏆' : struggling > mastered ? '💪' : '📈'}
          </div>
          <div style={{ fontSize: '13px', color: mastPct >= 80 ? '#0F6E56' : struggling > mastered ? '#A32D2D' : '#534AB7', fontWeight: '400', lineHeight: 1.5 }}>
            {mastPct >= 80
              ? `Outstanding — ${mastPct}% mastered across all cards. Keep practicing to maintain retention.`
              : practicedPct < 20
                ? `You've practiced ${practicedPct}% of your cards so far. Start a session to build momentum.`
                : struggling > mastered
                  ? `${struggling} cards still need work. Focus on your struggling cards to push your mastery up.`
                  : `Good progress — ${mastered} mastered, ${learning} in learning. Keep the sessions going! "Success is the sum of small efforts, repeated day in and day out"`
            }
          </div>
        </div>
      )}
    </div>
  );
}
