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

export default function Dashboard({ decks }: { decks: Deck[] }) {
  if (decks.length === 0) {
    return (
      <div className="fade-up" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1a1a2e' }}>No progress yet</h2>
        <p style={{ color: 'rgba(26,26,46,0.45)', fontSize: '0.95rem' }}>Upload a PDF and start practicing to see your stats</p>
      </div>
    );
  }

  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const totalMastered = decks.reduce((acc, d) => acc + d.cards.filter(c => c.ease >= 2.5 && c.reps > 2).length, 0);
  const totalShaky = decks.reduce((acc, d) => acc + d.cards.filter(c => c.reps > 0 && c.ease < 2.5).length, 0);
  const totalUnseen = decks.reduce((acc, d) => acc + d.cards.filter(c => c.reps === 0).length, 0);
  const masteryPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;
  const reviewedPct = totalCards > 0 ? Math.round(((totalCards - totalUnseen) / totalCards) * 100) : 0;

  // Generate heatmap squares (mock activity)
  const heatSquares = Array.from({ length: 70 }, (_, i) => {
    const levels = [0, 0, 1, 2, 3, 4];
    return levels[Math.floor(Math.random() * levels.length)];
  });
  const heatColors = ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.2)', 'rgba(99,102,241,0.4)', 'rgba(99,102,241,0.65)', '#6366f1'];

  const milestones = [
    { icon: '⚡', title: 'First Session', desc: 'Completed your first practice session', unlocked: true, color: '#6366f1' },
    { icon: '🔥', title: 'On a Roll', desc: 'Practiced 3 days in a row', unlocked: totalMastered >= 5, color: '#f97316' },
    { icon: '🏆', title: 'Half Mastered', desc: `Master 50% of a deck`, unlocked: masteryPct >= 50, color: '#16a34a' },
    { icon: '🔒', title: 'Deep Focus', desc: 'Complete 10 sessions to unlock', unlocked: false, color: 'rgba(26,26,46,0.2)' },
  ];

  return (
    <div className="fade-up" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#1a1a2e' }}>Cognitive Analytics</h2>
        <p style={{ color: 'rgba(26,26,46,0.4)', marginTop: '0.3rem', fontSize: '0.875rem' }}>Track your mastery across all decks</p>
      </div>

      {/* Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '14px' }}>

        {/* Retention Chart — large */}
        <div style={{
          gridColumn: 'span 8',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          padding: '1.75rem',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.2rem' }}>Retention Curve</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(26,26,46,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Memory decay & interval projection</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#6366f1', lineHeight: 1 }}>{masteryPct}%</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(26,26,46,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Stability Index</div>
            </div>
          </div>
          <svg width="100%" height="130" viewBox="0 0 600 130" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,100 Q80,85 150,90 T300,55 T450,65 T600,25 L600,130 L0,130 Z" fill="url(#retGrad)" />
            <path d="M0,100 Q80,85 150,90 T300,55 T450,65 T600,25" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="300" cy="55" r="4" fill="#6366f1" />
            <circle cx="300" cy="55" r="10" fill="#6366f1" fillOpacity="0.15" />
            <path d="M300,25 Q400,18 450,65 T600,25" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5,4" strokeLinecap="round" opacity="0.5" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            {['Now', '7 days', '14 days', '21 days', '30 days'].map(l => (
              <span key={l} style={{ fontSize: '0.68rem', color: 'rgba(26,26,46,0.3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Cognitive Load — right */}
        <div style={{
          gridColumn: 'span 4',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          padding: '1.75rem',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.2rem' }}>Cognitive Load</h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(26,26,46,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review vs New cards</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', margin: '1.25rem 0' }}>
            {[
              { label: 'Cards Reviewed', value: totalCards - totalUnseen, max: totalCards, pct: reviewedPct, color: '#6366f1' },
              { label: 'Mastered', value: totalMastered, max: totalCards, pct: masteryPct, color: '#16a34a' },
              { label: 'Still Learning', value: totalShaky, max: totalCards, pct: totalCards > 0 ? Math.round((totalShaky / totalCards) * 100) : 0, color: '#d97706' },
            ].map(({ label, value, max, pct, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(26,26,46,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1a1a2e' }}>{value}/{max}</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(26,26,46,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(26,26,46,0.35)', fontStyle: 'italic', borderTop: '1px solid rgba(26,26,46,0.07)', paddingTop: '1rem' }}>
            Keep going — consistency beats intensity.
          </p>
        </div>

        {/* Heatmap */}
        <div style={{
          gridColumn: 'span 7',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          padding: '1.75rem',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e' }}>Activity Heatmap</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(26,26,46,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Last 10 weeks</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {heatColors.map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '3px', background: c, border: '1px solid rgba(99,102,241,0.1)' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {heatSquares.map((level, i) => (
              <div key={i} style={{
                width: '13px', height: '13px',
                borderRadius: '3px',
                background: heatColors[level],
                border: '1px solid rgba(99,102,241,0.08)',
                transition: 'transform 0.1s',
                cursor: 'default',
              }} />
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div style={{
          gridColumn: 'span 5',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          padding: '1.75rem',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.1rem' }}>Milestones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {milestones.map(({ icon, title, desc, unlocked, color }) => (
              <div key={title} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: unlocked ? `rgba(99,102,241,0.05)` : 'rgba(26,26,46,0.03)',
                border: `1px solid ${unlocked ? 'rgba(99,102,241,0.12)' : 'rgba(26,26,46,0.07)'}`,
                opacity: unlocked ? 1 : 0.5,
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: unlocked ? `${color}18` : 'rgba(26,26,46,0.06)',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(26,26,46,0.4)' }}>{desc}</p>
                </div>
                {unlocked && (
                  <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deck Proficiency */}
        <div style={{
          gridColumn: 'span 12',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          padding: '1.75rem',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1a1a2e' }}>Deck Proficiency</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(26,26,46,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Cross-deck mastery status</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(26,26,46,0.4)' }}>
              {[['#6366f1', 'Mastered'], ['#a78bfa', 'Reviewing'], ['rgba(26,26,46,0.12)', 'Unseen']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {decks.map(deck => {
              const mastered = deck.cards.filter(c => c.ease >= 2.5 && c.reps > 2).length;
              const shaky = deck.cards.filter(c => c.reps > 0 && c.ease < 2.5).length;
              const unseen = deck.cards.filter(c => c.reps === 0).length;
              const total = deck.cards.length;
              const mastPct = Math.round((mastered / total) * 100);
              const shakPct = Math.round((shaky / total) * 100);
              const unsPct = Math.round((unseen / total) * 100);

              return (
                <div key={deck.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '180px', flexShrink: 0 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(26,26,46,0.35)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{total} cards</p>
                  </div>
                  <div style={{ flex: 1, height: '10px', display: 'flex', borderRadius: '999px', overflow: 'hidden', background: 'rgba(26,26,46,0.07)' }}>
                    <div style={{ height: '100%', width: `${mastPct}%`, background: '#6366f1', transition: 'width 0.6s ease' }} />
                    <div style={{ height: '100%', width: `${shakPct}%`, background: '#a78bfa', transition: 'width 0.6s ease' }} />
                    <div style={{ height: '100%', width: `${unsPct}%`, background: 'rgba(26,26,46,0.1)', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ width: '38px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#6366f1', flexShrink: 0 }}>
                    {mastPct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
