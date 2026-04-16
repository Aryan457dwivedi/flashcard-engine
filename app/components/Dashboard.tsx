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
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>No progress yet</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem' }}>Upload a PDF and start practicing to see your stats</p>
      </div>
    );
  }

  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const totalMastered = decks.reduce((acc, d) => acc + d.cards.filter(c => c.ease >= 2.5 && c.reps > 2).length, 0);
  const totalShaky = decks.reduce((acc, d) => acc + d.cards.filter(c => c.reps > 0 && c.ease < 2.5).length, 0);
  const totalUnseen = decks.reduce((acc, d) => acc + d.cards.filter(c => c.reps === 0).length, 0);
  const masteryPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Progress</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem', fontSize: '0.9rem' }}>Track your mastery across all decks</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          ['Total Decks', decks.length, '#818cf8'],
          ['Total Cards', totalCards, '#60a5fa'],
          ['Mastered', totalMastered, '#4ade80'],
          ['Shaky', totalShaky, '#fbbf24'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: color as string, marginBottom: '0.25rem' }}>{value as number}</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{label as string}</p>
          </div>
        ))}
      </div>

      {/* Overall Mastery Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Overall Mastery</span>
          <span style={{ fontWeight: '700', color: '#818cf8', fontSize: '1.1rem' }}>{masteryPct}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${masteryPct}%`,
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            borderRadius: '999px',
            transition: 'width 0.6s ease'
          }}></div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.6rem' }}>
          {totalMastered} of {totalCards} cards mastered across all decks
        </p>
      </div>

      {/* Deck Breakdown */}
      <h3 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deck Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {decks.map(deck => {
          const mastered = deck.cards.filter(c => c.ease >= 2.5 && c.reps > 2).length;
          const shaky = deck.cards.filter(c => c.reps > 0 && c.ease < 2.5).length;
          const unseen = deck.cards.filter(c => c.reps === 0).length;
          const total = deck.cards.length;

          return (
            <div key={deck.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{deck.name}</h4>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{total} cards</span>
              </div>

              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginBottom: '0.75rem' }}>
                <div style={{ height: '100%', width: `${(mastered / total) * 100}%`, background: '#4ade80', transition: 'width 0.5s' }}></div>
                <div style={{ height: '100%', width: `${(shaky / total) * 100}%`, background: '#fbbf24', transition: 'width 0.5s' }}></div>
                <div style={{ height: '100%', width: `${(unseen / total) * 100}%`, background: 'rgba(255,255,255,0.08)', transition: 'width 0.5s' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#4ade80', fontWeight: '500' }}>{mastered} mastered</span>
                <span style={{ color: '#fbbf24', fontWeight: '500' }}>{shaky} shaky</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>{unseen} unseen</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}