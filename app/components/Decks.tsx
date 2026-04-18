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

// ── Must match Practice.tsx sm2 and Dashboard.tsx exactly ────────────────
// reps === 0        → unseen
// reps === 1        → learning
// reps >= 2         → mastered (or struggling if ease < 1.6)
// reps >= 2, ease < 1.6 → struggling (got there but keeps slipping)
function classifyCard(c: Card) {
  if (c.reps === 0) return 'unseen'     as const;
  if (c.reps === 1) return 'learning'   as const;
  if (c.ease < 1.6) return 'struggling' as const;
  return               'mastered'       as const;
}

function deckStats(deck: Deck) {
  const total      = deck.cards.length;
  const mastered   = deck.cards.filter(c => classifyCard(c) === 'mastered').length;
  const learning   = deck.cards.filter(c => classifyCard(c) === 'learning').length;
  const struggling = deck.cards.filter(c => classifyCard(c) === 'struggling').length;
  const unseen     = deck.cards.filter(c => classifyCard(c) === 'unseen').length;
  const due        = deck.cards.filter(c => c.reps > 0 && c.interval <= 1).length;
  const mastPct    = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const seenPct    = total > 0 ? Math.round(((total - unseen) / total) * 100) : 0;
  return { total, mastered, learning, struggling, unseen, due, mastPct, seenPct };
}

// ── Stacked progress bar ─────────────────────────────────────────────────
function StackBar({ mastered, learning, struggling, unseen, total }: {
  mastered: number; learning: number; struggling: number; unseen: number; total: number;
}) {
  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;
  return (
    <div style={{ height: '5px', display: 'flex', borderRadius: '999px', overflow: 'hidden', background: 'rgba(26,26,46,0.07)', gap: '1px' }}>
      {mastered   > 0 && <div style={{ width: `${pct(mastered)}%`,   background: '#1D9E75', transition: 'width 0.7s ease' }} />}
      {learning   > 0 && <div style={{ width: `${pct(learning)}%`,   background: '#7F77DD', transition: 'width 0.7s ease' }} />}
      {struggling > 0 && <div style={{ width: `${pct(struggling)}%`, background: '#E24B4A', transition: 'width 0.7s ease' }} />}
      {unseen     > 0 && <div style={{ width: `${pct(unseen)}%`,     background: 'rgba(26,26,46,0.10)', transition: 'width 0.7s ease' }} />}
    </div>
  );
}

export default function Decks({
  decks,
  onPractice,
}: {
  decks: Deck[];
  onPractice: (deck: Deck) => void;
}) {

  /* ── Empty state ──────────────────────────────────────────────────── */
  if (decks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: "'DM Sans', sans-serif" }} className="fade-up">
        <div style={{
          width: '68px', height: '68px',
          background: '#EEEDFE',
          border: '1px solid #AFA9EC',
          borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 0 6px rgba(127,119,221,0.07)',
        }}>
          <svg width="26" height="26" fill="none" stroke="#7F77DD" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0f0f1a' }}>
          No decks yet
        </h2>
        <p style={{ color: 'rgba(15,15,26,0.4)', fontSize: '0.9rem' }}>
          Upload a PDF from the home screen to create your first deck.
        </p>
      </div>
    );
  }

  /* ── Global summary ───────────────────────────────────────────────── */
  const allCards   = decks.flatMap(d => d.cards);
  const totalCards = allCards.length;
  const gMastered  = allCards.filter(c => classifyCard(c) === 'mastered').length;
  const gLearning  = allCards.filter(c => classifyCard(c) === 'learning').length;
  const gStruggle  = allCards.filter(c => classifyCard(c) === 'struggling').length;
  const gUnseen    = allCards.filter(c => classifyCard(c) === 'unseen').length;
  const gDue       = allCards.filter(c => c.reps > 0 && c.interval <= 1).length;
  const gMastPct   = totalCards > 0 ? Math.round((gMastered / totalCards) * 100) : 0;

  return (
    <div className="fade-up" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.55rem', fontWeight: '600', letterSpacing: '-0.4px', color: '#0f0f1a', marginBottom: '4px' }}>
          My Library
        </h2>
        <p style={{ color: 'rgba(15,15,26,0.4)', fontSize: '0.875rem' }}>
          {decks.length} deck{decks.length !== 1 ? 's' : ''} · {totalCards} cards total
        </p>
      </div>

      {/* ── Global stat strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginBottom: '20px',
      }}>
        {[
          { label: 'Mastered',   val: gMastered, color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB' },
          { label: 'Learning',   val: gLearning, color: '#534AB7', bg: '#EEEDFE', border: '#AFA9EC' },
          { label: 'Struggling', val: gStruggle, color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' },
          { label: 'Due now',    val: gDue,      color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '600', color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '11.5px', fontWeight: '500', color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Deck cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: '14px',
      }}>
        {decks.map(deck => {
          const s = deckStats(deck);

          // Status label
          const statusLabel =
            s.seenPct === 0    ? 'Not started' :
            s.mastPct >= 80    ? 'Nearly mastered' :
            s.mastPct >= 40    ? 'In progress' :
            s.due > 0          ? `${s.due} due` :
                                 'Just started';
          const statusColor =
            s.seenPct === 0    ? '#888780' :
            s.mastPct >= 80    ? '#0F6E56' :
            s.mastPct >= 40    ? '#534AB7' :
            s.due > 0          ? '#854F0B' :
                                 '#534AB7';
          const statusBg =
            s.seenPct === 0    ? '#F1EFE8' :
            s.mastPct >= 80    ? '#E1F5EE' :
            s.mastPct >= 40    ? '#EEEDFE' :
            s.due > 0          ? '#FAEEDA' :
                                 '#EEEDFE';
          const statusBorder =
            s.seenPct === 0    ? '#D3D1C7' :
            s.mastPct >= 80    ? '#9FE1CB' :
            s.mastPct >= 40    ? '#AFA9EC' :
            s.due > 0          ? '#FAC775' :
                                 '#AFA9EC';

          return (
            <div
              key={deck.id}
              style={{
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(127,119,221,0.13)',
                borderRadius: '20px',
                padding: '22px 22px 18px',
                boxShadow: '0 2px 16px rgba(127,119,221,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(127,119,221,0.28)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 32px rgba(127,119,221,0.12), 0 2px 6px rgba(0,0,0,0.05)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(127,119,221,0.13)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(127,119,221,0.06), 0 1px 3px rgba(0,0,0,0.04)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              {/* ── Card header ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontWeight: '600',
                    fontSize: '1rem',
                    color: '#0f0f1a',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}>
                    {deck.name}
                  </h3>
                  <p style={{ color: 'rgba(15,15,26,0.38)', fontSize: '12px' }}>
                    {s.total} cards · {new Date(deck.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {/* Status badge */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusBorder}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* ── Stacked progress bar ── */}
              <div>
                <StackBar
                  mastered={s.mastered}
                  learning={s.learning}
                  struggling={s.struggling}
                  unseen={s.unseen}
                  total={s.total}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(15,15,26,0.35)' }}>
                    {s.seenPct}% seen
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: s.mastPct >= 70 ? '#0F6E56' : s.mastPct >= 30 ? '#534AB7' : '#888780',
                  }}>
                    {s.mastPct}% mastered
                  </span>
                </div>
              </div>

              {/* ── Pill breakdown ── */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { val: s.mastered,   label: 'mastered',   color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB' },
                  { val: s.learning,   label: 'learning',   color: '#534AB7', bg: '#EEEDFE', border: '#AFA9EC' },
                  { val: s.struggling, label: 'struggling', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' },
                  { val: s.unseen,     label: 'unseen',     color: '#5F5E5A', bg: '#F1EFE8', border: '#D3D1C7' },
                ].filter(p => p.val > 0).map(({ val, label, color, bg, border }) => (
                  <span key={label} style={{
                    fontSize: '11.5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: bg,
                    color,
                    border: `1px solid ${border}`,
                    fontWeight: '500',
                  }}>
                    {val} {label}
                  </span>
                ))}
              </div>

              {/* ── Practice button ── */}
              <button
                onClick={() => onPractice(deck)}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'rgba(127,119,221,0.08)',
                  border: '1px solid rgba(127,119,221,0.22)',
                  borderRadius: '12px',
                  color: '#534AB7',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.01em',
                  transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#7F77DD';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#7F77DD';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(127,119,221,0.28)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(127,119,221,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#534AB7';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(127,119,221,0.22)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {s.due > 0 ? `Practice · ${s.due} due` : s.seenPct === 0 ? 'Start Practicing' : 'Practice Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
