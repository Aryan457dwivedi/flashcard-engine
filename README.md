# Flashcard Engine

A smart flashcard generation system that converts PDFs into high-quality, practice-ready flashcards using AI and applies spaced repetition to improve long-term retention.

https://flashcard-engine-two.vercel.app/

---

## Problem

Most students rely on passive learning methods like re-reading notes, which leads to poor retention.

Research shows that active recall and spaced repetition are far more effective, but tools to apply these methods seamlessly are limited.

---

## Solution

Flashcard Engine allows users to:

- Upload any PDF (notes, chapters, study material)
- Automatically generate structured flashcards
- Practice using an adaptive spaced repetition system
- Focus more on weak areas and retain knowledge longer

---

## Features

- PDF to Flashcards  
  Extracts key concepts, definitions, relationships, and examples  

- High-Quality Card Generation  
  Focus on meaningful, teacher-like flashcards instead of shallow AI output  

- Spaced Repetition  
  Cards adapt based on user performance  
  Difficult cards appear more frequently  

- Progress-Based Learning  
  Reinforces strong areas while improving weak ones  

- Fast and Clean UI  
  Built for a smooth learning experience  

---

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS  
- Backend: Next.js API Routes  
- AI Integration: Claude API (Anthropic)  
- Deployment: Vercel  

---

## How It Works

1. User uploads a PDF  
2. Content is extracted and processed  
3. AI generates structured flashcards  
4. Cards are stored as a deck  
5. User practices using spaced repetition logic  

---

## Key Decisions and Tradeoffs

- Claude over Gemini  
  Better structured and context-aware outputs  
  Tradeoff: Higher API cost  

- Quality over Quantity  
  Fewer but meaningful flashcards  
  Avoids overwhelming the user  

- Simplified Spaced Repetition (SM-2 Inspired)  
  Functional and adaptive  
  Not fully optimized yet  

---

## Challenges

- PDF Parsing Issues  
  Solved through improved extraction pipeline  

- Low-Quality AI Outputs Initially  
  Fixed using better prompt engineering  

- Balancing Card Depth vs Overload  
  Ensured concise yet meaningful cards  

---

## Future Improvements

- Full SM-2 implementation  
- Gamification (streaks, rewards)  
- Deck search and tagging  
- Multi-language support  
- Offline support  

---

## Live Demo

https://flashcard-engine-two.vercel.app/

---
