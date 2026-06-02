'use client';
import React, { useState, useRef } from 'react';

/* ── Types ── */
interface Card { question: string; answer: string; ease: number; interval: number; reps: number; }
interface Deck { id: number; name: string; cards: Card[]; created: string; }
interface UploadedFile { name: string; sizeMB: string; type: string; modified: string; }

/* ── Grid SVG (unchanged from your original) ── */
function DropZoneGrid() { /* ... keep your existing DropZoneGrid ... */ }

export default function Upload({ onDeckCreated }: { onDeckCreated: (deck: Deck) => void }) {
  const [dragging, setDragging]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [dropHint, setDropHint]         = useState(false);   // ← "Drop it" state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // ← file cards

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── File card builder ── */
  const addFileCard = (file: File) => {
    setUploadedFiles(prev => [...prev, {
      name:     file.name,
      sizeMB:   (file.size / (1024 * 1024)).toFixed(2),
      type:     file.type || 'unknown',
      modified: new Date(file.lastModified).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    }]);
  };

  /* ── API call ── */
  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a PDF file'); return; }
    addFileCard(file);
    setLoading(true); setError('');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res  = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onDeckCreated({ id: Date.now(), name: file.name.replace('.pdf', ''), cards: data.cards, created: new Date().toLocaleDateString() });
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(handleFile);
  };

  return (
    <div className="fade-up">
      {/* ... your hero section ... */}

      {/* ── Drop Zone ── */}
      <div
        onDragOver={e  => { e.preventDefault(); setDragging(true);  setDropHint(true);  }}
        onDragLeave={() => {                     setDragging(false); setDropHint(false); }}
        onDrop={e => {
          e.preventDefault();
          setDragging(false); setDropHint(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !loading && fileInputRef.current?.click()}
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: `2px dashed ${dragging ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: '20px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: loading ? 'default' : 'pointer',
          background: dragging ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.6)',
          transition: 'all 0.2s',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          boxShadow: dragging
            ? '0 6px 32px rgba(99,102,241,0.12)'
            : '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        <DropZoneGrid />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ── Icon card (hidden once files added) ── */}
          {uploadedFiles.length === 0 && !loading && (
            <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 1.25rem' }}>
              {/* Card with lift on drag/hover */}
              <div style={{
                width: '72px', height: '72px',
                borderRadius: '14px',
                background: '#fff',
                boxShadow: dragging
                  ? '0 22px 55px rgba(0,0,0,0.18)'
                  : '0 10px 40px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: dragging ? 'translate(14px, -14px)' : 'translate(0,0)',
                transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s cubic-bezier(0.22,1,0.36,1)',
                position: 'relative', zIndex: 2,
              }}>
                {dropHint ? (
                  /* "Drop it" hint */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#6366f1', fontSize: '11px', fontWeight: '600' }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Drop it</span>
                  </div>
                ) : (
                  <svg width="24" height="24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </div>

              {/* Dashed blue overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                border: '1.5px dashed #38bdf8',
                borderRadius: '14px',
                opacity: dragging ? 1 : 0,
                transition: 'opacity 0.35s ease',
                zIndex: 1,
              }} />
            </div>
          )}

          {/* Text labels */}
          {uploadedFiles.length === 0 && !loading && (
            <>
              <p style={{ fontWeight: '600', fontSize: '1rem', color: '#1a1a2e', marginBottom: '4px' }}>
                Drop your PDF here
              </p>
              <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>
                or click to browse files
              </p>
            </>
          )}

          {/* Loading spinner */}
          {loading && (
            <div>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1.25rem' }} />
              <p style={{ color: '#6366f1', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>
                Generating flashcards...
              </p>
              <p style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.875rem' }}>
                This usually takes 5–10 seconds
              </p>
            </div>
          )}

          {/* ── File cards ── */}
          {uploadedFiles.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {uploadedFiles.map((f, i) => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid rgba(99,102,241,0.12)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  textAlign: 'left',
                  animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>
                      {f.sizeMB} MB
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'rgba(26,26,46,0.4)' }}>
                    <span style={{ background: '#f5f5f5', borderRadius: '4px', padding: '2px 7px', fontFamily: 'monospace', fontSize: '11px', color: '#525252' }}>
                      {f.type}
                    </span>
                    <span>modified {f.modified}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        multiple
        onChange={e => handleFiles(e.target.files)}
      />

      {error && (
        <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {error}
        </p>
      )}

      {/* ... your feature cards ... */}
    </div>
  );
}
