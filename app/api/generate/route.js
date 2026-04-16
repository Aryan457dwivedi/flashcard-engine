import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

async function extractTextFromPDF(buffer) {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an expert teacher. Based on the following text, create 15-20 high quality flashcards.
Each flashcard should test a key concept, definition, relationship, or important fact.
Write cards that a great teacher would write - clear, specific, and educational.

Return ONLY a valid JSON array like this:
[
  {"question": "What is X?", "answer": "X is..."},
  {"question": "How does Y work?", "answer": "Y works by..."}
]

No extra text, no markdown, just the JSON array.

Text to process:
${text.slice(0, 15000)}`
      }]
    });

    let rawText = message.content[0].text.trim();
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const cards = JSON.parse(rawText);

    return NextResponse.json({ cards });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}