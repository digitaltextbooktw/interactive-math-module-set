import React, { useState, useCallback, useRef } from 'react';

interface Point { x: number; y: number; }

type Tab = 'sss' | 'sas' | 'aaa';

// Triangle definitions
const BASE_TRI = {
  sss: { A: { x: 60, y: 180 }, B: { x: 260, y: 180 }, C: { x: 140, y: 40 }, label: 'SSS：三邊固定' },
  sas: { A: { x: 60, y: 180 }, B: { x: 260, y: 180 }, C: { x: 100, y: 50 }, label: 'SAS：兩邊＋夾角固定' },
  aaa: { A: { x: 60, y: 180 }, B: { x: 260, y: 180 }, C: { x: 160, y: 50 }, label: 'AAA：三角固定' },
};

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angleDeg(a: Point, vertex: Point, b: Point) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;
  return Math.round(Math.abs(Math.atan2(cross, dot) * 180 / Math.PI));
}

function TriPanel({ type }: { type: Tab }) {
  const base = BASE_TRI[type];
  const [scale, setScale] = useState(1);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [showSnap, setShowSnap] = useState(false);
  const dragStart = useRef<Point | null>(null);

  const isLocked = type === 'sss' || type === 'sas';

  // Compute triangle points with scale (AAA) or offset (SSS/SAS for snap-back)
  const getPoints = (): { A: Point; B: Point; C: Point } => {
    if (type === 'aaa') {
      const origin = base.A; // scale from bottom-left
      return {
        A: base.A,
        B: { x: origin.x + (base.B.x - origin.x) * scale, y: origin.y + (base.B.y - origin.y) * scale },
        C: { x: origin.x + (base.C.x - origin.x) * scale, y: origin.y + (base.C.y - origin.y) * scale },
      };
    }
    return {
      A: base.A,
      B: base.B,
      C: { x: base.C.x + dragOffset.x, y: base.C.y + dragOffset.y },
    };
  };

  const pts = getPoints();
  const sides = {
    a: Math.round(dist(pts.B, pts.C) / 10) / 4,
    b: Math.round(dist(pts.A, pts.C) / 10) / 4,
    c: Math.round(dist(pts.A, pts.B) / 10) / 4,
  };
  const angles = {
    A: angleDeg(pts.B, pts.A, pts.C),
    B: angleDeg(pts.A, pts.B, pts.C),
    C: angleDeg(pts.A, pts.C, pts.B),
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (type === 'aaa') {
      const newScale = Math.max(0.4, Math.min(2.0, 1 + dy / -150));
      setScale(newScale);
    } else {
      setDragOffset({ x: dx * 0.3, y: dy * 0.3 });
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) setShowSnap(true);
    }
  }, [type]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    if (type === 'aaa') {
      const newScale = Math.max(0.4, Math.min(2.0, 1 + dy / -150));
      setScale(newScale);
    } else {
      setDragOffset({ x: dx * 0.3, y: dy * 0.3 });
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) setShowSnap(true);
    }
  }, [type]);

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
    if (isLocked) {
      setDragOffset({ x: 0, y: 0 });
      setShowSnap(false);
    }
  }, [isLocked]);

  const borderColor = showSnap && isLocked ? '#EF4444' : '#E5E7EB';

  return (
    <div style={{
      flex: 1, background: 'white', borderRadius: 14,
      border: `2px solid ${borderColor}`,
      padding: 'clamp(6px, 1vmin, 10px)',
      display: 'flex', flexDirection: 'column', gap: 4,
      transition: 'border-color 0.2s',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 'clamp(14px, 2.2vmin, 17px)', fontWeight: 900,
        color: type === 'aaa' ? '#ee6c4d' : '#3d5a80', textAlign: 'center',
      }}>
        {base.label}
      </div>

      <svg viewBox="0 0 320 220" style={{
        width: '100%', flex: 1, touchAction: 'none', cursor: 'grab',
      }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      >
        <polygon
          points={`${pts.A.x},${pts.A.y} ${pts.B.x},${pts.B.y} ${pts.C.x},${pts.C.y}`}
          fill="#98c1d9" fillOpacity="0.15" stroke="#3d5a80" strokeWidth="2"
          style={{ transition: isLocked ? 'all 0.3s ease-out' : undefined }}
        />

        {/* Side lengths — accent color for "known" conditions */}
        {/* side a (BC right): SSS=known, SAS=derived, AAA=derived */}
        <text x={(pts.B.x + pts.C.x) / 2 + 8} y={(pts.B.y + pts.C.y) / 2}
          className="font-en" fontSize="13" fontWeight="700"
          fill={type === 'sss' ? '#ee6c4d' : '#94A3B8'}>{sides.a}</text>
        {/* side b (AC left): SSS=known, SAS=known, AAA=derived */}
        <text x={(pts.A.x + pts.C.x) / 2 - 20} y={(pts.A.y + pts.C.y) / 2}
          className="font-en" fontSize="13" fontWeight="700"
          fill={type === 'sss' || type === 'sas' ? '#ee6c4d' : '#94A3B8'}>{sides.b}</text>
        {/* side c (AB base): SSS=known, SAS=known, AAA=derived */}
        <text x={(pts.A.x + pts.B.x) / 2} y={pts.A.y + 15} textAnchor="middle"
          className="font-en" fontSize="13" fontWeight="700"
          fill={type === 'sss' || type === 'sas' ? '#ee6c4d' : '#94A3B8'}>{sides.c}</text>

        {/* Angles — accent color for "known" conditions */}
        {/* angle A: SAS=known, AAA=known, SSS=derived */}
        <text x={pts.A.x + 8} y={pts.A.y - 6} className="font-en" fontSize="12" fontWeight="900"
          fill={type === 'sas' || type === 'aaa' ? '#ee6c4d' : '#94A3B8'}>{angles.A}°</text>
        {/* angle B: AAA=known, SSS=derived, SAS=derived */}
        <text x={pts.B.x - 25} y={pts.B.y - 6} className="font-en" fontSize="12" fontWeight="900"
          fill={type === 'aaa' ? '#ee6c4d' : '#94A3B8'}>{angles.B}°</text>
        {/* angle C: AAA=known, SSS=derived, SAS=derived */}
        <text x={pts.C.x} y={pts.C.y - 8} textAnchor="middle" className="font-en" fontSize="12" fontWeight="900"
          fill={type === 'aaa' ? '#ee6c4d' : '#94A3B8'}>{angles.C}°</text>

        {/* Drag hint */}
        <text x="160" y="210" textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="500">
          {type === 'aaa' ? '↕ 拖拉看看' : '試著拖拉頂點'}
        </text>

        {/* Lock icon for SSS/SAS */}
        {isLocked && showSnap && (
          <text x="160" y="120" textAnchor="middle" fontSize="24" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
            🔒
          </text>
        )}
      </svg>

      <div style={{
        fontSize: 'clamp(13px, 2vmin, 15px)', textAlign: 'center', fontWeight: 600,
        color: type === 'aaa' ? '#ee6c4d' : '#10B981',
      }}>
        {isLocked ? '形狀被鎖死了！' : '形狀一樣，大小會變！'}
      </div>
    </div>
  );
}

export default function RevealStage({ onComplete }: { onComplete: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(6px, 1vmin, 10px)',
      fontFamily: 'var(--font-main)',
      touchAction: 'none',
    }}>
      {/* Title */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        padding: 'clamp(10px, 2vmin, 16px)',
        fontSize: 'clamp(14px, 2.2vmin, 17px)', fontWeight: 700, color: '#3d5a80',
        textAlign: 'center',
      }}>
        試著拖拉每個三角形的頂點——哪些能變形？哪些不能？
      </div>

      {/* Three panels */}
      <div style={{
        flex: 1, minHeight: 0, display: 'flex',
        gap: 'clamp(6px, 1vmin, 10px)',
      }}>
        <TriPanel type="sss" />
        <TriPanel type="sas" />
        <TriPanel type="aaa" />
      </div>

      {/* Continue button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={onComplete} style={{
          height: 'clamp(36px, 6vmin, 44px)', padding: '0 clamp(16px, 3vmin, 24px)',
          borderRadius: 12, border: 'none', background: '#3d5a80', color: 'white',
          cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(13px, 2vmin, 15px)',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          我理解了
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
