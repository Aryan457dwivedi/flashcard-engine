'use client';
import { useState } from 'react';

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
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < 1.3) ease = 1.3;
  } else {
    reps = 0;
    interval = 1;
  }
  return { ...card, ease, interval, reps };
}

export default function Practice({ deck, onFinish }: { deck: Deck; onFinish: (updatedDeck: Deck) => void }) {
  const [cards, setCards] = useState<Card[]>(
    deck.cards.map(c => ({ ...c, ease: c.ease || 2.5, interval: c.interval || 1, reps: c.reps || 0 }))
  );
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState({ correct: 0, incorrect: 0 });

  const card = cards[current];
  const done = current >= cards.length;
  const progress = Math.round((current / cards.length) * 100);

  const answer = (quality: number) => {
    const updated = [...cards];
    updated[current] = sm2(card, quality);
    setCards(updated);
    setSession(prev => ({
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
    }));
    setCurrent(prev => prev + 1);
    setFlipped(false);
  };

  const handleFinish = (updatedCards: Card[]) => {
    onFinish({ ...deck, cards: updatedCards });
  };

  if (done) {
    const score = Math.round((session.correct / cards.length) * 100);
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          width: '72px', height: '72px', background: 'rgba(99,102,241,0.12)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem'
        }}>
          <svg width="32" height="32" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: '#fff' }}>Session Complete</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem' }}>You reviewed all {cards.length} cards</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            [score + '%', 'Score', '#818cf8'],
            [session.correct.toString(), 'Correct', '#4ade80'],
            [session.incorrect.toString(), 'Missed', '#f87171'],
          ].map(([val, label, color]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '1.25rem'
            }}>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color, marginBottom: '0.25rem' }}>{val}</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => handleFinish(cards)} style={{
          padding: '0.85rem 2.5rem',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '10px', color: '#818cf8',
          fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
        }}>
          Back to Decks
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => handleFinish(cards)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', padding: 0
        }}>
          ← Exit
        </button>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>{current + 1} / {cards.length}</span>
        <span style={{ color: '#818cf8', fontSize: '0.875rem', fontWeight: '600' }}>{deck.name}</span>
      </div>

      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', marginBottom: '2.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '999px', transition: 'width 0.4s ease' }}></div>
      </div>

      <div onClick={() => setFlipped(!flipped)} style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '3.5rem 2.5rem',
        minHeight: '260px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', cursor: 'pointer',
        transition: 'border-color 0.2s', marginBottom: '1.5rem',
      }}>
        <p style={{
          fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px',
          textTransform: 'uppercase', color: flipped ? '#4ade80' : '#818cf8',
          marginBottom: '1.5rem'
        }}>
          {flipped ? 'Answer' : 'Question'}
        </p>
        <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#ffffff' }}>
          {flipped ? card.answer : card.question}
        </p>
        {!flipped && <p style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Click to reveal answer</p>}
      </div>

      {flipped && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          {[
            [1, 'Missed', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', '#f87171'],
            [3, 'Shaky', 'rgba(251,191,36,0.1)', 'rgba(251,191,36,0.3)', '#fbbf24'],
            [5, 'Got it', 'rgba(74,222,128,0.1)', 'rgba(74,222,128,0.3)', '#4ade80'],
          ].map(([quality, label, bg, border, color]) => (
            <button key={label as string} onClick={() => answer(quality as number)} style={{
              padding: '1rem', background: bg as string,
              border: `1px solid ${border}`, borderRadius: '12px',
              color: color as string, fontWeight: '600',
              fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label as string}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}