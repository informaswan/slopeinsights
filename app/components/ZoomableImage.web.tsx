import React, { useEffect, useState } from 'react';

interface Props { uri: string; visible: boolean; onClose: () => void; }

const STEPS = [1, 1.5, 2, 3, 4, 6];

// Full-screen picture: +/- buttons, mouse wheel or pinch to zoom, scroll or drag to move around.
export function ZoomableImage({ uri, visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (visible) setStep(0); }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);
  if (!visible) return null;

  const zoom = (d: number) => setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + d)));
  const btn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.18)', color: '#fff', border: 0, borderRadius: 999,
    padding: '10px 16px', fontSize: 16, fontWeight: 600, cursor: 'pointer', minWidth: 44,
  };

  return (
    <div
      role="dialog"
      aria-label="Camera picture"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12 }}>
        <button aria-label="Zoom out" style={btn} onClick={() => zoom(-1)}>−</button>
        <button aria-label="Zoom in" style={btn} onClick={() => zoom(1)}>+</button>
        <button aria-label="Close picture" style={btn} onClick={onClose}>Close</button>
      </div>
      <div
        style={{ flex: 1, overflow: 'auto', display: 'flex' }}
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) return; if (e.deltaY !== 0 && !e.shiftKey && step === 0) zoom(e.deltaY < 0 ? 1 : 0); }}
      >
        <img
          alt=""
          src={uri}
          onDoubleClick={() => setStep((s) => (s === 0 ? 2 : 0))}
          style={{ width: `${STEPS[step] * 100}%`, height: step === 0 ? '100%' : 'auto', objectFit: 'contain', margin: 'auto', flexShrink: 0, maxWidth: 'none', cursor: step === 0 ? 'zoom-in' : 'zoom-out' }}
        />
      </div>
    </div>
  );
}
