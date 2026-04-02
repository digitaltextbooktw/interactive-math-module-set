import React, { useState, useRef, useCallback, useEffect } from 'react';
import { playSound } from '../../../utils/sound';

interface Point { x: number; y: number; }
interface TriDef {
  name: string;
  points: [Point, Point, Point];
  angles: [number, number, number];
  labels: [string, string, string];
  baseEdges: [number, number, number];
}

// Equilateral: use exact geometry (side=346, height=300)
const EQ_SIDE = 346;
const EQ_H = EQ_SIDE * Math.sqrt(3) / 2; // ≈ 300
const EQ_CX = 400, EQ_BY = 450;
const TRIANGLES: TriDef[] = [
  { name: '等邊三角形', points: [
    {x: EQ_CX, y: EQ_BY - EQ_H},  // A top
    {x: EQ_CX - EQ_SIDE/2, y: EQ_BY},  // B bottom-left
    {x: EQ_CX + EQ_SIDE/2, y: EQ_BY},  // C bottom-right
  ], angles: [60,60,60], labels: ['A','B','C'], baseEdges: [1,2,1] },
  { name: '直角三角形', points: [{x:200,y:480},{x:200,y:210},{x:500,y:480}], angles: [90,45,45], labels: ['A','B','C'], baseEdges: [2,0,0] },
  // 30-120-30: isoceles with base 500, apex at calculated height
  { name: '鈍角三角形', points: [
    {x:150,y:450},
    {x:400,y:450 - 500 * Math.tan(30 * Math.PI / 180) / 2},  // ≈ 306
    {x:650,y:450}
  ], angles: [30,120,30], labels: ['A','B','C'], baseEdges: [2,0,0] },
];

// Compute the ACTUAL geometric angle at a vertex from coordinates
function geoAngleAt(pts: [Point, Point, Point], vi: number): number {
  const v = pts[vi];
  const prev = pts[(vi + 2) % 3];
  const next = pts[(vi + 1) % 3];
  const a1 = Math.atan2(prev.y - v.y, prev.x - v.x);
  const a2 = Math.atan2(next.y - v.y, next.x - v.x);
  let diff = Math.abs(a2 - a1);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff * 180 / Math.PI;
}

// Draw an SVG arc sector path from vertex center between two adjacent edges
function sectorPath(center: Point, p1: Point, p2: Point, r: number): string {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const s = { x: center.x + r * Math.cos(a1), y: center.y + r * Math.sin(a1) };
  const e = { x: center.x + r * Math.cos(a2), y: center.y + r * Math.sin(a2) };
  const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
  const sweep = diff > 0 ? 1 : 0;
  return `M ${center.x},${center.y} L ${s.x},${s.y} A ${r},${r} 0 ${largeArc},${sweep} ${e.x},${e.y} Z`;
}

// Compute the midpoint position for angle label inside a sector
function sectorLabelPos(center: Point, p1: Point, p2: Point, dist: number): Point {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const mid = a1 + diff / 2;
  return { x: center.x + dist * Math.cos(mid), y: center.y + dist * Math.sin(mid) };
}

interface ProtractorState {
  x: number; y: number; rotation: number; pointerAngle: number;
  snapped: boolean; snappedVertex: number; flipY: number; hasInteracted: boolean;
  _displayAngle?: number;       // clean nominal angle for readout
  _isSnappedToTarget?: boolean; // true when magnetically locked
}

const defaultProtractor = (): ProtractorState => ({
  x: 650, y: 180, rotation: 0, pointerAngle: 90,
  snapped: false, snappedVertex: -1, flipY: 1, hasInteracted: false,
});

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

import {
  exploreEntryHint, allCompleteText,
  guessRecallCorrect, guessRecallWrong, guessCorrectIndex,
} from '../data';

interface ExploreProps {
  guessAnswer: number | null;
  onComplete: () => void;
}

export default function ExploreStage({ guessAnswer, onComplete }: ExploreProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [triIdx, setTriIdx] = useState(0);
  const [measured, setMeasured] = useState<(number | null)[]>([null, null, null]);
  const [prot, setProt] = useState<ProtractorState>(defaultProtractor);
  const [done, setDone] = useState<number[]>([]);
  const [info, setInfo] = useState('');
  const [shaking, setShaking] = useState(false);
  const [entryHint, setEntryHint] = useState(true);
  const [allDoneOverlay, setAllDoneOverlay] = useState<string | null>(null);

  // Entry hint — fade out after 2s
  useEffect(() => {
    if (!entryHint) return;
    const t = setTimeout(() => setEntryHint(false), 2500);
    return () => clearTimeout(t);
  }, [entryHint]);

  const dragRef = useRef<{ mode: string | null; startX: number; startY: number; protX: number; protY: number }>({ mode: null, startX: 0, startY: 0, protX: 0, protY: 0 });
  const protRef = useRef(prot);
  protRef.current = prot;
  const measuredRef = useRef(measured);
  measuredRef.current = measured;

  const tri = TRIANGLES[triIdx];

  const selectTri = useCallback((idx: number) => {
    playSound('click');
    setTriIdx(idx);
    setMeasured([null, null, null]);
    setProt(defaultProtractor());
    setInfo('');
  }, []);

  const snapTo = useCallback((index: number) => {
    if (measuredRef.current[index] !== null) return;
    playSound('click');
    const t = TRIANGLES[protRef.current === prot ? triIdx : triIdx]; // use current triIdx
    const p1 = t.points[index];
    const nextIdx = t.baseEdges[index];
    const p2 = t.points[nextIdx];
    let p3: Point = t.points[0];
    for (let i = 0; i < 3; i++) { if (i !== index && i !== nextIdx) { p3 = t.points[i]; break; } }

    const angleBase = Math.atan2(-(p2.y - p1.y), p2.x - p1.x) * 180 / Math.PI;
    const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

    setProt({
      x: p1.x, y: p1.y, snapped: true, snappedVertex: index,
      flipY: cross > 0 ? -1 : 1, rotation: Math.round(angleBase),
      pointerAngle: 15, hasInteracted: false,
    });
  }, [triIdx, prot]);

  const confirm = useCallback(() => {
    const p = protRef.current;
    if (!p.snapped || p.snappedVertex === -1) return;
    if (p._isSnappedToTarget) {
      const target = TRIANGLES[triIdx].angles[p.snappedVertex];
      playSound('ding');
      setMeasured(prev => {
        const next = [...prev];
        next[p.snappedVertex] = target;
        return next;
      });
      setProt(prev => ({ ...prev, snapped: false, snappedVertex: -1, _isSnappedToTarget: false }));
    } else {
      playSound('wrong');
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  }, [triIdx]);

  const resetTri = useCallback(() => {
    playSound('click');
    setMeasured([null, null, null]);
    setProt(defaultProtractor());
    setInfo('');
  }, []);

  // Check all measured for current triangle
  useEffect(() => {
    if (!measured.every(a => a !== null)) return;
    const newDone = done.includes(triIdx) ? done : [...done, triIdx];
    if (!done.includes(triIdx)) setDone(newDone);

    if (newDone.length >= 3 && !allDoneOverlay) {
      setInfo('');
      setAllDoneOverlay(allCompleteText);
      if (guessAnswer != null) {
        // Story mode: show guess recall
        setTimeout(() => {
          const degreeValues = [90, 180, 270, 360];
          const guessIdx = degreeValues.indexOf(guessAnswer);
          const wasCorrect = guessIdx === guessCorrectIndex;
          const recallText = wasCorrect
            ? guessRecallCorrect
            : guessRecallWrong(`${guessAnswer}°`);
          setAllDoneOverlay(recallText);
        }, 2000);
        setTimeout(() => onComplete(), 4000);
      } else {
        // Practice mode: skip recall, complete after overlay
        setTimeout(() => onComplete(), 2500);
      }
    }
  }, [measured, triIdx, done, guessAnswer, allDoneOverlay, onComplete]);

  const allTrisDone = done.length >= 3;
  const allMeasured = measured.every(a => a !== null);
  const justFinishedTri = allMeasured && !allTrisDone;

  // --- Drag handlers ---
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pt = clientToSvg(svg, clientX, clientY);

    // Check vertex click (skip already-measured vertices so drag falls through)
    const t = TRIANGLES[triIdx];
    for (let i = 0; i < 3; i++) {
      if (measuredRef.current[i] !== null) continue;
      const dx = pt.x - t.points[i].x;
      const dy = pt.y - t.points[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < 35) {
        snapTo(i);
        return;
      }
    }

    const target = (e.target as Element).closest('[data-mode]');
    if (!target) return;
    e.preventDefault();
    const mode = target.getAttribute('data-mode')!;
    dragRef.current = { mode, startX: pt.x, startY: pt.y, protX: protRef.current.x, protY: protRef.current.y };

    if (mode === 'pointer') {
      updatePointer(pt);
    }
  }, [triIdx, snapTo]);

  const updatePointer = useCallback((pt: { x: number; y: number }) => {
    const p = protRef.current;
    const dx = pt.x - p.x;
    const dy = pt.y - p.y;

    // Mouse angle in math coords (Y up): atan2(-dy, dx) gives degrees from +X axis
    const mouseDeg = Math.atan2(-dy, dx) * 180 / Math.PI;

    // The protractor's 0° line is at angle `rotation` in the same coordinate system.
    // The pointer reading = angle from baseline to mouse, measured in the
    // direction the protractor opens (flipY).
    //
    // flipY = 1  → protractor opens upward (counter-clockwise from baseline)
    // flipY = -1 → protractor opens downward (clockwise from baseline)
    let angle = p.flipY * (mouseDeg - p.rotation);

    // Normalize to (-360, 360) then to [0, 360)
    angle = ((angle % 360) + 360) % 360;

    // Clamp to protractor range [0, 180]
    if (angle > 180) {
      angle = angle < 270 ? 180 : 0;
    }

    // Magnetic snap: when near the target, lock pointer to the GEOMETRIC angle
    // so the pointer line visually aligns with the triangle edge.
    // Display value shows the nominal angle (60/90/45/30/120).
    let displayAngle = Math.round(angle);
    let snappedToTarget = false;

    if (p.snapped && p.snappedVertex !== -1) {
      const t = TRIANGLES[triIdx];
      const nominalTarget = t.angles[p.snappedVertex];
      const geoTarget = geoAngleAt(t.points, p.snappedVertex);

      if (Math.abs(angle - geoTarget) <= 10 || Math.abs(angle - nominalTarget) <= 10) {
        angle = geoTarget;  // pointer visually aligns with edge
        displayAngle = nominalTarget; // readout shows clean number
        snappedToTarget = true;
      }
    }

    setProt(prev => ({
      ...prev,
      pointerAngle: snappedToTarget ? angle : Math.round(angle),
      hasInteracted: true,
      // Store display value separately
      _displayAngle: displayAngle,
      _isSnappedToTarget: snappedToTarget,
    }));
  }, [triIdx]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current.mode) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pt = clientToSvg(svg, clientX, clientY);

    if (dragRef.current.mode === 'move') {
      const dx = pt.x - dragRef.current.startX;
      const dy = pt.y - dragRef.current.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const p = protRef.current;

      if (p.snapped && dist < 25) return;
      if (p.snapped) {
        setProt(prev => ({ ...prev, snapped: false, snappedVertex: -1, flipY: 1 }));
      }

      let newX = Math.max(95, Math.min(705, dragRef.current.protX + dx));
      let newY = Math.max(95, Math.min(505, dragRef.current.protY + dy));
      setProt(prev => ({ ...prev, x: newX, y: newY }));

      // Auto-snap (skip already-measured vertices)
      const t = TRIANGLES[triIdx];
      for (let i = 0; i < 3; i++) {
        if (measuredRef.current[i] !== null) continue;
        const sx = newX - t.points[i].x;
        const sy = newY - t.points[i].y;
        if (Math.sqrt(sx * sx + sy * sy) < 30) {
          snapTo(i);
          dragRef.current.startX = pt.x;
          dragRef.current.startY = pt.y;
          dragRef.current.protX = t.points[i].x;
          dragRef.current.protY = t.points[i].y;
          return;
        }
      }
    } else if (dragRef.current.mode === 'pointer') {
      updatePointer(pt);
    }
  }, [triIdx, snapTo, updatePointer]);

  const handleEnd = useCallback(() => { dragRef.current.mode = null; }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => { window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchend', handleEnd); };
  }, [handleEnd]);

  // --- Render helpers ---
  const isCorrect = prot._isSnappedToTarget === true;

  const renderTicks = () => {
    const lines: string[] = [];
    // Counter-rotation so numbers always stay upright in screen space
    // The protractor group applies rotate(-prot.rotation), so we add prot.rotation back
    const counterRot = prot.rotation;
    for (let i = 0; i <= 180; i++) {
      const rad = i * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const x1 = 90 * cos;
      const y1 = prot.flipY * (-90 * sin);
      let len = 4, op = 0.15;
      if (i % 10 === 0) { len = 8; op = 0.35; }
      if (i % 30 === 0) { len = 12; op = 0.7; }
      const x2 = (90 - len) * cos;
      const y2 = prot.flipY * (-(90 - len) * sin);
      lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748B" stroke-width="${i % 30 === 0 ? 1.5 : 1}" opacity="${op}"/>`);
      if (i % 30 === 0) {
        const tx = (90 - 24) * cos;
        const ty = prot.flipY * (-(90 - 24) * sin);
        lines.push(`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="#334155" font-weight="900" transform="rotate(${counterRot}, ${tx}, ${ty})">${i}°</text>`);
      }
    }
    return lines.join('');
  };

  const arcPath = `M 90 0 A 90 90 0 0 ${prot.flipY === 1 ? 0 : 1} -90 0 Z`;

  // Readout position
  let rx = prot.x + 60, ry = prot.y - 100;
  if (prot.snapped && prot.snappedVertex !== -1) {
    const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
    const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
    const dx = cx - prot.x;
    const dy = cy - prot.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0) { rx = prot.x + (dx / d) * 130; ry = prot.y + (dy / d) * 130; }
  }
  rx = Math.max(40, Math.min(760, rx));
  ry = Math.max(30, Math.min(570, ry));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '15px 20px', paddingBottom: 10 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
        {TRIANGLES.map((t, i) => (
          <div
            key={i}
            onClick={() => selectTri(i)}
            style={{
              padding: '12px 24px', minHeight: 44, display: 'flex', alignItems: 'center',
              borderRadius: '12px 12px 0 0', cursor: 'pointer', fontWeight: 700,
              border: '1px solid #E2E8F0', borderBottom: 'none', transition: 'all 0.2s',
              background: done.includes(i) ? '#ECFDF5' : i === triIdx ? 'white' : '#F1F5F9',
              color: done.includes(i) ? '#10B981' : i === triIdx ? '#3d5a80' : '#64748B',
              ...(i === triIdx ? { paddingBottom: 14, marginBottom: -2, zIndex: 5 } : {}),
            }}
          >
            {t.name}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        flexGrow: 1, background: 'white', borderRadius: '0 0 16px 16px',
        position: 'relative', border: '1px solid #E5E7EB', overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Sum display */}
        <div style={{
          position: 'absolute', top: 15, left: 15, background: 'rgba(255,255,255,0.95)',
          padding: '10px 15px', borderRadius: 14, border: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)', zIndex: 30,
        }}>
          {['A', 'B', 'C'].map((l, i) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
              <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}>角 {l}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#293241' }}>
                {measured[i] !== null ? `${measured[i]}°` : '?'}
              </div>
            </div>
          )).reduce<React.ReactNode[]>((acc, el, i) => {
            if (i > 0) acc.push(<div key={`plus-${i}`} style={{ fontSize: 16, fontWeight: 900, color: '#CBD5E1' }}>+</div>);
            acc.push(el);
            return acc;
          }, [])}
          <div style={{ borderLeft: '2px solid #F1F5F9', paddingLeft: 12, marginLeft: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}>總和</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: allMeasured ? '#10B981' : '#3d5a80' }}>
              {measured.some(a => a !== null) ? `${measured.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)}°` : '?'}
            </div>
          </div>
          {allMeasured ? (
            <>
              {/* Reset button */}
              <button onClick={resetTri} style={{
                background: '#3d5a80', color: 'white', border: 'none', borderRadius: 10,
                padding: 8, minHeight: 40, minWidth: 40, cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 3px 0 #2D3E50', marginLeft: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              </button>
              {/* Next triangle button — only when current tri done but not all 3 */}
              {justFinishedTri && (
                <button onClick={() => selectTri((triIdx + 1) % 3)} style={{
                  background: '#10B981', color: 'white', border: 'none', borderRadius: 10,
                  padding: 8, minHeight: 40, minWidth: 40, cursor: 'pointer',
                  boxShadow: '0 3px 0 #065F46', marginLeft: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <button onClick={confirm} style={{
              background: '#3d5a80', color: 'white', border: 'none', borderRadius: 10,
              padding: '8px 16px', minHeight: 44, cursor: 'pointer', fontWeight: 600, fontSize: 14,
              boxShadow: '0 3px 0 #2D3E50', marginLeft: 5,
            }}>確認</button>
          )}
        </div>

        {/* SVG */}
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          style={{ width: '100%', height: '100%', touchAction: 'none', userSelect: 'none' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer><feFuncA type="linear" slope="0.12" /></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Triangle */}
          <polygon points={tri.points.map(p => `${p.x},${p.y}`).join(' ')} fill="#F1F5F9" stroke="#3d5a80" strokeWidth="3" />

          {/* Vertices */}
          {tri.points.map((p, i) => {
            const m = measured[i] !== null;
            const prev = tri.points[(i + 2) % 3];
            const next = tri.points[(i + 1) % 3];
            const v1 = { x: prev.x - p.x, y: prev.y - p.y };
            const v2 = { x: next.x - p.x, y: next.y - p.y };
            const m1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
            const m2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
            const bis = { x: -(v1.x / m1 + v2.x / m2), y: -(v1.y / m1 + v2.y / m2) };
            const bm = Math.sqrt(bis.x ** 2 + bis.y ** 2);
            const lx = p.x + (bis.x / bm) * 42;
            const ly = p.y + (bis.y / bm) * 42;

            if (m) {
              // Measured: show colored sector with angle label
              const sectorR = 90;
              const labelPos = sectorLabelPos(p, prev, next, sectorR * 0.72);
              return (
                <g key={i}>
                  <path
                    d={sectorPath(p, prev, next, sectorR)}
                    fill="#10B981" fillOpacity="0.25"
                    stroke="#10B981" strokeWidth="2"
                  />
                  <text
                    x={labelPos.x} y={labelPos.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="18" fontWeight="900" fill="#065F46"
                  >
                    {measured[i]}°
                  </text>
                  <text x={lx} y={ly + 5} textAnchor="middle" fontSize="16" fontWeight="900" fill="#293241" opacity="0.6">
                    {tri.labels[i]}
                  </text>
                </g>
              );
            }

            // Unmeasured: show clickable circle with "?"
            return (
              <g key={i} onClick={() => snapTo(i)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r="18" fill="white" stroke="#3d5a80" strokeWidth="2.5" />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="#3d5a80">
                  ?
                </text>
                <text x={lx} y={ly + 5} textAnchor="middle" fontSize="16" fontWeight="900" fill="#293241" opacity="0.6">
                  {tri.labels[i]}
                </text>
              </g>
            );
          })}

          {/* Protractor */}
          <g style={shaking ? { animation: 'protractorShake 0.1s ease-in-out 3' } : undefined}>
            <g transform={`translate(${prot.x}, ${prot.y}) rotate(${-prot.rotation})`}>
              <path d={arcPath} fill="rgba(255,255,255,0.92)" stroke="#94A3B8" strokeWidth="1.5" data-mode="move" style={{ cursor: 'grab' }} filter="url(#shadow)" />
              <line x1="-90" y1="0" x2="90" y2="0" stroke="#94A3B8" strokeWidth="1.5" />
              {/* Note: dangerouslySetInnerHTML is safe here — content is generated from numeric loop, not user input */}
              <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: renderTicks() }} />
              <circle cx="0" cy="0" r="5" fill="#3d5a80" />
              <g transform={`rotate(${-prot.flipY * prot.pointerAngle})`}>
                <line x1="0" y1="0" x2="110" y2="0" stroke={isCorrect ? '#10B981' : '#ee6c4d'} strokeWidth="2.5" strokeLinecap="round" />
                <g data-mode="pointer" style={{ cursor: 'pointer' }} transform="translate(110, 0)">
                  <circle r="14" fill="white" stroke={isCorrect ? '#10B981' : '#ee6c4d'} strokeWidth="3" />
                  <circle r="4" fill={isCorrect ? '#10B981' : '#ee6c4d'} />
                </g>
              </g>
            </g>
          </g>

          {/* Readout */}
          {prot.hasInteracted && (
            <>
              <rect x={rx - 32} y={ry - 16} width="64" height="32" rx="16" fill={isCorrect ? '#10B981' : '#ee6c4d'} filter="url(#shadow)" />
              <text x={rx} y={ry + 1} textAnchor="middle" dominantBaseline="central" fontWeight="900" fontSize="17" fill="white">
                {prot._displayAngle ?? Math.round(prot.pointerAngle)}°
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Bottom bar — entry hint only */}
      <div style={{ marginTop: 10, textAlign: 'center', minHeight: '1.5rem' }}>
        {entryHint && (
          <span style={{
            color: '#6B7280', fontSize: 14, fontWeight: 500,
            opacity: entryHint ? 1 : 0, transition: 'opacity 0.5s',
          }}>
            {exploreEntryHint}
          </span>
        )}
      </div>

      {/* All-done overlay (big center text) */}
      {allDoneOverlay && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)', padding: '24px 40px',
            borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#293241', margin: 0, textAlign: 'center' }}>
              {allDoneOverlay}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
