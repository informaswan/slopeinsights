import React, { useEffect, useRef, useState } from 'react';

const MAX = 6;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface View { s: number; x: number; y: number; }

// A picture that keeps its size on the page; wheel, pinch, double-click or the +/- buttons zoom in
// and out underneath the frame, and dragging moves around once zoomed.
export function ZoomFrame({ uri }: { uri: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<View>({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; v: View } | null>(null);
  const drag = useRef<{ x: number; y: number; v: View } | null>(null);

  // Keep the picture covering the frame: x/y are offsets from centre.
  const fit = (s: number, x: number, y: number): View => {
    const r = frame.current?.getBoundingClientRect();
    const mx = r ? (r.width * (s - 1)) / 2 : 0;
    const my = r ? (r.height * (s - 1)) / 2 : 0;
    return { s, x: clamp(x, -mx, mx), y: clamp(y, -my, my) };
  };

  // Zoom to scale `s2` keeping the point under (cx, cy) (relative to frame centre) fixed.
  const zoomAt = (from: View, s2: number, cx: number, cy: number): View => {
    const s = clamp(s2, 1, MAX);
    const k = s / from.s;
    return s === 1 ? { s: 1, x: 0, y: 0 } : fit(s, cx - (cx - from.x) * k, cy - (cy - from.y) * k);
  };

  const centre = (clientX: number, clientY: number) => {
    const r = frame.current!.getBoundingClientRect();
    return { cx: clientX - r.left - r.width / 2, cy: clientY - r.top - r.height / 2 };
  };

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { cx, cy } = centre(e.clientX, e.clientY);
      setV((cur) => zoomAt(cur, cur.s * Math.exp(-e.deltaY * 0.002), cx, cy));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) { pinch.current = { dist: spread(), v }; drag.current = null; }
    else drag.current = { x: e.clientX, y: e.clientY, v };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const { cx, cy } = centre((a.x + b.x) / 2, (a.y + b.y) / 2);
      setV(zoomAt(pinch.current.v, pinch.current.v.s * (spread() / pinch.current.dist), cx, cy));
    } else if (drag.current && v.s > 1) {
      setV(fit(drag.current.v.s, drag.current.v.x + e.clientX - drag.current.x, drag.current.v.y + e.clientY - drag.current.y));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    drag.current = pointers.current.size === 1 ? { x: e.clientX, y: e.clientY, v } : null;
  };
  const onDoubleClick = (e: React.MouseEvent) => {
    const { cx, cy } = centre(e.clientX, e.clientY);
    setV((cur) => (cur.s > 1 ? { s: 1, x: 0, y: 0 } : zoomAt(cur, 2.5, cx, cy)));
  };
  const step = (f: number) => setV((cur) => zoomAt(cur, cur.s * f, 0, 0));

  const btn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 16, border: 0, cursor: 'pointer', fontSize: 18, lineHeight: '32px',
    padding: 0, color: '#fff', background: 'rgba(15,23,42,0.55)',
  };

  return (
    <div
      ref={frame}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      style={{
        position: 'relative', width: '100%', height: 'min(56vh, 440px)', overflow: 'hidden', flexShrink: 0,
        touchAction: 'none', userSelect: 'none', cursor: v.s > 1 ? 'grab' : 'zoom-in',
      }}
    >
      <img
        alt="Camera picture"
        src={uri}
        draggable={false}
        style={{
          width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none',
          transform: `translate(${v.x}px, ${v.y}px) scale(${v.s})`, transformOrigin: 'center',
        }}
      />
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 6 }}
      >
        <button aria-label="Zoom out" style={{ ...btn, opacity: v.s > 1 ? 1 : 0.4 }} onClick={() => step(1 / 1.6)}>−</button>
        <button aria-label="Zoom in" style={btn} onClick={() => step(1.6)}>+</button>
      </div>
    </div>
  );
}
