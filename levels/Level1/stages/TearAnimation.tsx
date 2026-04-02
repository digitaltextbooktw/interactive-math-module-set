import { useState, useCallback, useEffect } from 'react';
import { playSound } from '../../../utils/sound';

interface Point { x: number; y: number; }

const COLORS = [
  { fill: '#AFA9EC', stroke: '#534AB7', label: 'A' },
  { fill: '#5DCAA5', stroke: '#0F6E56', label: 'B' },
  { fill: '#F0997B', stroke: '#993C1D', label: 'C' },
];

interface TriDef {
  name: string;
  pts: [Point, Point, Point];
  angles: [number, number, number];
}

const TRIS: TriDef[] = [
  { name: '等邊', pts: [{ x: 140, y: 55 }, { x: 55, y: 195 }, { x: 225, y: 195 }], angles: [60, 60, 60] },
  { name: '直角', pts: [{ x: 75, y: 195 }, { x: 75, y: 65 }, { x: 220, y: 195 }], angles: [90, 45, 45] },
  { name: '鈍角', pts: [{ x: 55, y: 195 }, { x: 175, y: 80 }, { x: 270, y: 195 }], angles: [30, 120, 30] },
];

const toRad = (d: number) => d * Math.PI / 180;

// Draw an angle arc at a vertex (always curves INWARD toward centroid)
function angleArc(vertex: Point, prev: Point, next: Point, centroid: Point, r: number, color: string) {
  const a1 = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
  const a2 = Math.atan2(next.y - vertex.y, next.x - vertex.x);
  const p1 = { x: vertex.x + r * Math.cos(a1), y: vertex.y + r * Math.sin(a1) };
  const p2 = { x: vertex.x + r * Math.cos(a2), y: vertex.y + r * Math.sin(a2) };

  // Determine sweep direction: the arc should curve toward the centroid
  // Try sweep=0, check if midpoint is closer to centroid than sweep=1
  const midA_cw = (a1 + a2) / 2; // avg angle
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const sweep = diff > 0 ? 1 : 0;

  return (
    <path
      d={`M ${p1.x},${p1.y} A ${r},${r} 0 0,${sweep} ${p2.x},${p2.y}`}
      fill="none" stroke={color} strokeWidth="1.5" opacity="0.7"
    />
  );
}

// Label position inside the triangle (toward centroid from vertex)
function innerLabelPos(vertex: Point, centroid: Point, dist: number) {
  const dx = centroid.x - vertex.x;
  const dy = centroid.y - vertex.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: vertex.x + (dx / len) * dist, y: vertex.y + (dy / len) * dist };
}

function triCentroid(pts: [Point, Point, Point]): Point {
  return { x: (pts[0].x + pts[1].x + pts[2].x) / 3, y: (pts[0].y + pts[1].y + pts[2].y) / 3 };
}

// Assembly wedge on the line — arc curves UPWARD (toward tip = away from line)
function assemblyWedge(angles: number[], idx: number, cx: number, ly: number, r: number) {
  let cumBefore = 0;
  for (let j = 0; j < idx; j++) cumBefore += angles[j];
  const startD = 180 - cumBefore;
  const endD = startD - angles[idx];
  const lp = { x: cx + r * Math.cos(toRad(startD)), y: ly - r * Math.sin(toRad(startD)) };
  const rp = { x: cx + r * Math.cos(toRad(endD)), y: ly - r * Math.sin(toRad(endD)) };
  const midD = (startD + endD) / 2;
  const labelInner = { x: cx + r * 0.42 * Math.cos(toRad(midD)), y: ly - r * 0.42 * Math.sin(toRad(midD)) };
  const labelBelow = { x: cx + r * 0.55 * Math.cos(toRad(midD)), y: ly + 16 };

  // Arc: from startD to endD, curving UPWARD (away from baseline)
  // Since startD > endD and we go counter-clockwise in math coords (= clockwise in SVG),
  // sweep=1 curves upward
  const arcR = r * 0.28;
  const arcStart = { x: cx + arcR * Math.cos(toRad(startD)), y: ly - arcR * Math.sin(toRad(startD)) };
  const arcEnd = { x: cx + arcR * Math.cos(toRad(endD)), y: ly - arcR * Math.sin(toRad(endD)) };
  const arcPath = `M ${arcStart.x},${arcStart.y} A ${arcR},${arcR} 0 0,1 ${arcEnd.x},${arcEnd.y}`;

  return { points: `${cx},${ly} ${lp.x},${lp.y} ${rp.x},${rp.y}`, labelInner, labelBelow, arcPath };
}

const ASM_CX = 440;
const ASM_LY = 170;
const ASM_R = 65;

function TriStep({ tri, onDone }: { tri: TriDef; onDone: () => void }) {
  const [tornAngles, setTornAngles] = useState<Set<number>>(new Set());
  const allTorn = tornAngles.size === 3;
  const centroid = triCentroid(tri.pts);

  const handleTear = useCallback((vi: number) => {
    if (tornAngles.has(vi)) return;
    playSound('click');
    setTornAngles(prev => new Set(prev).add(vi));
  }, [tornAngles]);

  useEffect(() => {
    if (!allTorn) return;
    playSound('ding');
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [allTorn, onDone]);

  const WEDGE_SCALE = 0.3;
  const ARC_R = 18;

  return (
    <g>
      {/* Original triangle */}
      <polygon
        points={tri.pts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="#F1F5F9" stroke="#3d5a80" strokeWidth="1.5"
        strokeDasharray={tornAngles.size > 0 ? '4 3' : 'none'}
        opacity={allTorn ? 0.15 : 0.5}
      />

      {/* Angle arcs + degree labels INSIDE the triangle */}
      {[0, 1, 2].map(vi => {
        const v = tri.pts[vi];
        const prev = tri.pts[(vi + 2) % 3];
        const next = tri.pts[(vi + 1) % 3];
        const lpos = innerLabelPos(v, centroid, ARC_R + 16);
        const isTorn = tornAngles.has(vi);
        return (
          <g key={`arc-${vi}`} opacity={isTorn ? 0.25 : 0.8}>
            {angleArc(v, prev, next, centroid, ARC_R, COLORS[vi].stroke)}
            <text x={lpos.x} y={lpos.y + 4} textAnchor="middle"
              fontSize="10" fontWeight="900" fill={COLORS[vi].stroke}>
              {tri.angles[vi]}°
            </text>
          </g>
        );
      })}

      {/* Vertex labels OUTSIDE (away from centroid) */}
      {tri.pts.map((p, vi) => {
        const away = innerLabelPos(p, centroid, -18); // negative = away from centroid
        return (
          <text key={`vlbl-${vi}`} x={away.x} y={away.y + 4}
            textAnchor="middle" fontSize="12" fontWeight="900"
            fill={COLORS[vi].stroke} opacity="0.6">
            {COLORS[vi].label}
          </text>
        );
      })}

      {/* Clickable wedges on triangle */}
      {[0, 1, 2].map(vi => {
        if (tornAngles.has(vi)) return null;
        const v = tri.pts[vi];
        const prev = tri.pts[(vi + 2) % 3];
        const next = tri.pts[(vi + 1) % 3];
        const toP = { x: v.x + (prev.x - v.x) * WEDGE_SCALE, y: v.y + (prev.y - v.y) * WEDGE_SCALE };
        const toN = { x: v.x + (next.x - v.x) * WEDGE_SCALE, y: v.y + (next.y - v.y) * WEDGE_SCALE };
        return (
          <g key={`click-${vi}`} onClick={() => handleTear(vi)} style={{ cursor: 'pointer' }}>
            <polygon points={`${v.x},${v.y} ${toP.x},${toP.y} ${toN.x},${toN.y}`}
              fill={COLORS[vi].fill} stroke={COLORS[vi].stroke} strokeWidth="1.5"
              strokeLinejoin="round" opacity="0.8" />
          </g>
        );
      })}

      {/* Torn gaps */}
      {[...tornAngles].map(vi => {
        const v = tri.pts[vi];
        const prev = tri.pts[(vi + 2) % 3];
        const next = tri.pts[(vi + 1) % 3];
        const toP = { x: v.x + (prev.x - v.x) * WEDGE_SCALE, y: v.y + (prev.y - v.y) * WEDGE_SCALE };
        const toN = { x: v.x + (next.x - v.x) * WEDGE_SCALE, y: v.y + (next.y - v.y) * WEDGE_SCALE };
        return (
          <polygon key={`gap-${vi}`} points={`${v.x},${v.y} ${toP.x},${toP.y} ${toN.x},${toN.y}`}
            fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
        );
      })}

      {/* ── Assembly area ── */}
      <line x1={ASM_CX - ASM_R - 10} y1={ASM_LY} x2={ASM_CX + ASM_R + 10} y2={ASM_LY}
        stroke={allTorn ? '#10B981' : '#CBD5E1'} strokeWidth={allTorn ? 2 : 1.5}
        strokeDasharray={allTorn ? 'none' : '5 4'} />

      {[...tornAngles].map(vi => {
        const w = assemblyWedge(tri.angles as number[], vi, ASM_CX, ASM_LY, ASM_R);
        return (
          <g key={`asm-${vi}`} style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
            <polygon points={w.points}
              fill={COLORS[vi].fill} stroke={COLORS[vi].stroke} strokeWidth="1.5" strokeLinejoin="round" />
            <path d={w.arcPath} fill="none" stroke={COLORS[vi].stroke} strokeWidth="1.5" opacity="0.7" />
            <text x={w.labelInner.x} y={w.labelInner.y + 4}
              textAnchor="middle" fontSize="11" fontWeight="900" fill={COLORS[vi].stroke}>
              {tri.angles[vi]}°
            </text>
            <text x={w.labelBelow.x} y={w.labelBelow.y}
              textAnchor="middle" fontSize="11" fontWeight="900" fill={COLORS[vi].stroke} opacity="0.7">
              {COLORS[vi].label}
            </text>
          </g>
        );
      })}

      {allTorn && (
        <text x={ASM_CX} y={ASM_LY + 38}
          textAnchor="middle" fontSize="18" fontWeight="900" fill="#10B981"
          style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
          = 180°
        </text>
      )}

      <text x={140} y={215} textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748B">
        {tri.name}三角形
      </text>
    </g>
  );
}

export default function TearAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState('點一個角，把它拆出來');

  const handleStepDone = useCallback(() => {
    if (step < 2) {
      setStep(s => s + 1);
      setHint(step === 0 ? '再試一個形狀' : '最後一個！');
    } else {
      setStep(3);
      setHint('');
    }
  }, [step]);

  // Final summary — bigger wedges, no "重播" text, use icon button
  if (step === 3) {
    const FINAL_R = 52;
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 }}>
        {TRIS.map((tr, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, fontWeight: 700, fontSize: 13, color: '#64748B', textAlign: 'right' }}>{tr.name}</span>
            <svg viewBox="0 0 240 85" width="250" height="80">
              <line x1="5" y1="58" x2="235" y2="58" stroke="#10B981" strokeWidth="2" />
              {tr.angles.map((a, ai) => {
                const w = assemblyWedge(tr.angles as number[], ai, 120, 58, FINAL_R);
                return (
                  <g key={ai}>
                    <polygon points={w.points} fill={COLORS[ai].fill} stroke={COLORS[ai].stroke} strokeWidth="1.5" strokeLinejoin="round" />
                    <path d={w.arcPath} fill="none" stroke={COLORS[ai].stroke} strokeWidth="1.2" opacity="0.6" />
                    <text x={w.labelInner.x} y={w.labelInner.y + 3} textAnchor="middle" fontSize="10" fontWeight="900" fill={COLORS[ai].stroke}>{a}°</text>
                    <text x={w.labelBelow.x} y={w.labelBelow.y + 2} textAnchor="middle" fontSize="10" fontWeight="900" fill={COLORS[ai].stroke} opacity="0.6">{COLORS[ai].label}</text>
                  </g>
                );
              })}
            </svg>
            <span style={{ fontWeight: 900, fontSize: 15, color: '#10B981' }}>= 180°</span>
          </div>
        ))}
        <p style={{ fontSize: '1rem', fontWeight: 900, color: '#293241', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
          三角形的內角和，可以拼成 180° 的直線！
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {/* Replay button — icon only */}
          <button onClick={() => { setStep(0); setHint('點一個角，把它拆來'); }} style={{
            width: 44, height: 44, borderRadius: 12, border: '2px solid #E5E7EB',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button onClick={onComplete} style={{
            padding: '10px 24px', borderRadius: 12, border: 'none',
            background: '#3d5a80', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>繼續 →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 600 260" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        <TriStep key={step} tri={TRIS[step]} onDone={handleStepDone} />
      </svg>

      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {TRIS.map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < step ? '#10B981' : i === step ? '#ee6c4d' : '#CBD5E1',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {hint && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(41,50,65,0.9)', color: 'white', padding: '8px 20px',
          borderRadius: 30, fontWeight: 700, fontSize: 14, pointerEvents: 'none',
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
