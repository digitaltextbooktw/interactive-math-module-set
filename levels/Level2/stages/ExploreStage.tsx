import React, { useState, useRef, useCallback, useEffect } from 'react';
import { playSound } from '../../../utils/sound';
import { exploreEntryHint, exploreNudge, discoveryQuestion, discoveryOptions, discoveryCorrectIndex } from '../data';

interface Point { x: number; y: number; }

function dist(a: Point, b: Point) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

// Calculate all three interior angles + exterior angle at C
function calcAngles(A: Point, B: Point, C: Point) {
  const a = dist(B, C), b = dist(A, C), c = dist(A, B);
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const angA = Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c))) * 180 / Math.PI;
  const angB = Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c))) * 180 / Math.PI;
  const angC = Math.acos(clamp((a * a + b * b - c * c) / (2 * a * b))) * 180 / Math.PI;
  const rA = Math.round(angA), rB = Math.round(angB);
  const ext = rA + rB; // exterior angle = A + B exactly (no separate rounding)
  return { A: rA, B: rB, C: Math.round(angC), ext };
}

// SVG sector from center, between directions to p1 and p2
function drawSector(center: Point, p1: Point, p2: Point, r: number): string {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const s = { x: center.x + r * Math.cos(a1), y: center.y + r * Math.sin(a1) };
  const e = { x: center.x + r * Math.cos(a2), y: center.y + r * Math.sin(a2) };
  return `M ${center.x},${center.y} L ${s.x},${s.y} A ${r},${r} 0 ${Math.abs(diff) > Math.PI ? 1 : 0},${diff > 0 ? 1 : 0} ${e.x},${e.y} Z`;
}

// Compute label position at the midpoint angle of a sector
function sectorLabelPos(center: Point, p1: Point, p2: Point, dist: number): Point {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const mid = a1 + diff / 2;
  return { x: center.x + dist * Math.cos(mid), y: center.y + dist * Math.sin(mid) };
}


function clientToSvg(svg: SVGSVGElement, cx: number, cy: number) {
  const pt = svg.createSVGPoint();
  pt.x = cx; pt.y = cy;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

export default function ExploreStage({ onComplete }: { onComplete: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Points: A (top-left), B (top-right), C (bottom-center) — exterior angle is at C
  const [pts, setPts] = useState<[Point, Point, Point]>([
    { x: 100, y: 120 },  // A
    { x: 400, y: 150 },  // B
    { x: 200, y: 340 },  // C
  ]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragCount, setDragCount] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAnswer, setModalAnswer] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [entryHint, setEntryHint] = useState(true);
  const startTime = useRef(Date.now());

  const [A, B, C] = pts;


  // Extension line: from C, continuing the direction A→C (past C)
  const extDir = { x: C.x - A.x, y: C.y - A.y };
  const extLen = Math.sqrt(extDir.x ** 2 + extDir.y ** 2) || 1;
  const D: Point = { x: C.x + (extDir.x / extLen) * 120, y: C.y + (extDir.y / extLen) * 120 };

  const angles = calcAngles(A, B, C);

  // Entry hint
  useEffect(() => {
    const t = setTimeout(() => setEntryHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Flash on drag end
  useEffect(() => {
    if (dragCount > 0) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 400);
      return () => clearTimeout(t);
    }
  }, [dragCount]);

  // Nudge after 3 drags or 10 seconds
  useEffect(() => {
    if (showButton) return;
    const check = () => {
      if (dragCount >= 2 || Date.now() - startTime.current > 10000) setShowNudge(true);
    };
    check();
    const iv = setInterval(check, 2000);
    return () => clearInterval(iv);
  }, [dragCount, showButton]);

  // Show "I found it" button after nudge + 2 more drags
  useEffect(() => {
    if (showNudge && dragCount >= 4 && !showButton) setShowButton(true);
  }, [showNudge, dragCount, showButton]);

  // Drag
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent, idx: number) => {
    e.preventDefault();
    setDraggingIdx(idx);
  }, []);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIdx === null) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pt = clientToSvg(svg, cx, cy);
    setPts(prev => {
      const next = [...prev] as [Point, Point, Point];
      next[draggingIdx] = { x: Math.max(30, Math.min(520, pt.x)), y: Math.max(30, Math.min(380, pt.y)) };
      return next;
    });
  }, [draggingIdx]);

  const handleEnd = useCallback(() => {
    if (draggingIdx !== null) {
      setDragCount(c => c + 1);
      setDraggingIdx(null);
    }
  }, [draggingIdx]);

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => { window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchend', handleEnd); };
  }, [handleEnd]);

  // Modal answer
  const handleModalAnswer = useCallback((idx: number) => {
    setModalAnswer(idx);
    if (idx === discoveryCorrectIndex) {
      playSound('success');
      setTimeout(onComplete, 1200);
    } else {
      playSound('wrong');
      setTimeout(() => {
        setModalAnswer(null);
        setShowModal(false);
        setShowButton(true);
      }, 1500);
    }
  }, [onComplete]);

  const sumAB = angles.A + angles.B;
  const flashStyle = flash ? '#ee6c4d' : undefined;

  // Vertex label positions (outside the triangle, far enough from drag circles)

  return (
    <div style={{ display: 'flex', height: '100%', padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)', gap: 'clamp(8px, 1.5vmin, 12px)', position: 'relative' }}>
      {/* SVG */}
      <div style={{ flex: 1, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative', minWidth: 0 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 550 400"
          style={{ width: '100%', height: '100%', touchAction: 'none', userSelect: 'none' }}
          onMouseMove={handleMove}
          onTouchMove={handleMove}
        >
          {/* Extension line from C (continuing AC direction) */}
          <line x1={C.x} y1={C.y} x2={D.x} y2={D.y} stroke="#3d5a80" strokeWidth="2" strokeDasharray="6 4" />

          {/* Triangle */}
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="#98c1d9" fillOpacity="0.1" stroke="#3d5a80" strokeWidth="2" />

          {/* Interior angle sectors: A (blue) */}
          <path d={drawSector(A, C, B, 80)} fill="#98c1d9" fillOpacity="0.25" stroke="none" />
          {/* Interior angle sectors: B (blue) */}
          <path d={drawSector(B, A, C, 80)} fill="#98c1d9" fillOpacity="0.25" stroke="none" />

          {/* Exterior angle at C (orange) — between extension line D and edge CB */}
          <path d={drawSector(C, D, B, 70)} fill="#ee6c4d" fillOpacity="0.25" stroke="none" />

          {/* Angle degree labels inside sectors */}
          {(() => {
            const posA = sectorLabelPos(A, C, B, 45);
            return <text x={posA.x} y={posA.y} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="900" fill="#3d5a80" className="font-en">{angles.A}°</text>;
          })()}
          {(() => {
            const posB = sectorLabelPos(B, A, C, 45);
            return <text x={posB.x} y={posB.y} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="900" fill="#3d5a80" className="font-en">{angles.B}°</text>;
          })()}
          {(() => {
            const posExt = sectorLabelPos(C, D, B, 45);
            return <text x={posExt.x} y={posExt.y} textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="900" fill="#ee6c4d" className="font-en">{angles.ext}°</text>;
          })()}

          {/* Draggable vertices with labels inside */}
          {pts.map((p, i) => {
            const label = ['A', 'B', 'C'][i];
            const isC = i === 2;
            const strokeColor = draggingIdx === i ? '#ee6c4d' : isC ? '#ee6c4d' : '#3d5a80';
            const fillColor = isC ? '#ee6c4d' : '#3d5a80';
            return (
              <g key={i}
                onMouseDown={(e) => handleStart(e, i)}
                onTouchStart={(e) => handleStart(e, i)}
                style={{ cursor: 'grab' }}
              >
                <circle cx={p.x} cy={p.y} r="16" fill="white" stroke={strokeColor} strokeWidth="3" />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="900" fill={fillColor} className="font-en" style={{ pointerEvents: 'none' }}>
                  {label}
                </text>
                <circle cx={p.x} cy={p.y} r="28" fill="transparent" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Right panel */}
      <div style={{ width: 'clamp(150px, 24vmin, 210px)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: 'clamp(12px, 2vmin, 18px) clamp(14px, 2.5vmin, 20px)' }}>
          <div style={{ fontSize: 'clamp(15px, 2.2vmin, 18px)', fontWeight: 700, color: '#3d5a80', marginBottom: 6 }}>A = {angles.A}°</div>
          <div style={{ fontSize: 'clamp(15px, 2.2vmin, 18px)', fontWeight: 700, color: '#3d5a80', marginBottom: 10 }}>B = {angles.B}°</div>
          <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: 10, marginBottom: 10 }}>
            <div style={{
              fontSize: 'clamp(17px, 2.5vmin, 20px)', fontWeight: 900,
              color: flashStyle || '#3d5a80',
              transition: 'color 0.3s',
            }}>
              A + B = {sumAB}°
            </div>
          </div>
          <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: 10 }}>
            <div style={{
              fontSize: 'clamp(18px, 2.8vmin, 22px)', fontWeight: 900,
              color: flashStyle || '#ee6c4d',
              transition: 'color 0.3s',
            }}>
              外角 = {angles.ext}°
            </div>
          </div>
        </div>

        {/* Entry hint */}
        {entryHint && (
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>
            {exploreEntryHint}
          </div>
        )}

        {/* Nudge */}
        {showNudge && !showButton && (
          <div style={{ fontSize: 12, color: '#ee6c4d', fontWeight: 700, textAlign: 'center', lineHeight: 1.4, animation: 'fadeSlideIn 0.4s ease-out' }}>
            {exploreNudge}
          </div>
        )}

        {/* Discovery button */}
        {showButton && !showModal && (
          <button onClick={() => { setShowButton(false); setShowModal(true); }} style={{
            background: '#ee6c4d', color: 'white', border: 'none', borderRadius: 12,
            padding: '10px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', animation: 'fadeSlideIn 0.4s ease-out',
          }}>
            我發現了！
          </button>
        )}
      </div>

      {/* Discovery modal */}
      {showModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: 'clamp(20px, 4vmin, 28px) clamp(20px, 4vmin, 32px)',
            maxWidth: 440, width: '85%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}>
            {modalAnswer === discoveryCorrectIndex ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginBottom: 8 }}>沒錯！</div>
                <div style={{ fontSize: 28, color: '#293241', fontWeight: 900 }}>外角 = ∠A + ∠B</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 'clamp(22px, 4vmin, 28px)', fontWeight: 900, color: '#293241', marginBottom: 'clamp(14px, 3vmin, 20px)', textAlign: 'center' }}>
                  {discoveryQuestion}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vmin, 14px)' }}>
                  {discoveryOptions.map((opt, i) => {
                    let bg = 'white', border = '#e5e7eb';
                    if (modalAnswer !== null) {
                      if (i === discoveryCorrectIndex) { bg = '#d1fae5'; border = '#10B981'; }
                      else if (i === modalAnswer) { bg = '#fee2e2'; border = '#EF4444'; }
                    }
                    return (
                      <button key={i} onClick={() => handleModalAnswer(i)}
                        disabled={modalAnswer !== null}
                        style={{
                          padding: 'clamp(12px, 2vmin, 16px) clamp(16px, 2.5vmin, 22px)',
                          border: `2px solid ${border}`, borderRadius: 12,
                          background: bg, fontWeight: 700, fontSize: 'clamp(17px, 2.8vmin, 20px)',
                          cursor: modalAnswer !== null ? 'default' : 'pointer',
                          fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.2s',
                        }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {modalAnswer !== null && modalAnswer !== discoveryCorrectIndex && (
                  <div style={{ textAlign: 'center', marginTop: 12, color: '#EF4444', fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)' }}>
                    再觀察看看
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
