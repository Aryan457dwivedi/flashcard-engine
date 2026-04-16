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

export default function Decks({ decks, onPractice }: { decks: Deck[]; onPractice: (deck: Deck) => void }) {
  if (decks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }} className="fade-up">
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>No decks yet</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem' }}>Upload a PDF from the home screen to create your first deck</p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.5px' }}>My Decks</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem', fontSize: '0.9rem' }}>{decks.length} deck{decks.length > 1 ? 's' : ''} available</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {decks.map((deck) => {
          const mastered = deck.cards.filter(c => c.ease >= 2.5 && c.reps > 2).length;
          const total = deck.cards.length;
          const progress = Math.round((mastered / total) * 100);

          return (
            <div key={deck.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.3rem', color: '#fff' }}>{deck.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{total} cards · Created {deck.created}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Mastered</span>
                  <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '600' }}>{progress}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '999px', transition: 'width 0.6s ease' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', fontWeight: '500' }}>{mastered} mastered</span>
                <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontWeight: '500' }}>{total - mastered} to learn</span>
              </div>

              <button
                onClick={() => onPractice(deck)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '10px',
                  color: '#818cf8',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Practice Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}