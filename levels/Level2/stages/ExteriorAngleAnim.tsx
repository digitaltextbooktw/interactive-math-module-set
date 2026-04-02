import { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/sound';

// === Geometry helpers ===

interface Point { x: number; y: number; }

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

// Angle bisector direction (average of two edge directions from center)
function bisectorAngle(center: Point, p1: Point, p2: Point): number {
  const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
  const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a1 + diff / 2;
}

function calcFlyTransform(
  fromCenter: Point,
  toCenter: Point,
  fromAngle: number,
  toAngle: number,
) {
  const tx = toCenter.x - fromCenter.x;
  const ty = toCenter.y - fromCenter.y;
  const rotate = (toAngle - fromAngle) * 180 / Math.PI;
  return {
    transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
    transformOrigin: `${fromCenter.x}px ${fromCenter.y}px`,
  };
}

// === Triangle geometry ===
const A: Point = { x: 120, y: 80 };
const B: Point = { x: 450, y: 250 };
const C: Point = { x: 120, y: 250 };
const extPt: Point = { x: 20, y: 250 }; // extension line left endpoint

const SECTOR_R = 45;
const SECTOR_R_C = 40;

const sectorA = drawSector(A, C, B, SECTOR_R);
const sectorB = drawSector(B, A, C, SECTOR_R);
const sectorC = drawSector(C, A, extPt, SECTOR_R_C);
const sectorExt = drawSector(C, extPt, B, SECTOR_R_C);

// Bisector angles for fly transform
const bisA = bisectorAngle(A, C, B);
const bisB = bisectorAngle(B, A, C);
// External angle: split into left half (for A) and right half (for B)
const extEdge1Angle = Math.atan2(extPt.y - C.y, extPt.x - C.x); // left direction
const extEdge2Angle = Math.atan2(B.y - C.y, B.x - C.x); // toward B
let extFullDiff = extEdge2Angle - extEdge1Angle;
while (extFullDiff > Math.PI) extFullDiff -= 2 * Math.PI;
while (extFullDiff < -Math.PI) extFullDiff += 2 * Math.PI;
const extBisMidLeft = extEdge1Angle + extFullDiff * 0.25; // target for A
const extBisMidRight = extEdge1Angle + extFullDiff * 0.75; // target for B

const flyA = calcFlyTransform(A, C, bisA, extBisMidLeft);
const flyB = calcFlyTransform(B, C, bisB, extBisMidRight);

// Label positions (outside triangle)
function labelPos(vertex: Point, offset: number, angle: number): Point {
  return { x: vertex.x + offset * Math.cos(angle), y: vertex.y + offset * Math.sin(angle) };
}
const lblA = labelPos(A, 22, -Math.PI / 2); // above
const lblB = labelPos(B, 22, 0); // right
const lblC = labelPos(C, 22, Math.PI * 0.75); // bottom-left

export default function ExteriorAngleAnim({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [showConclusion, setShowConclusion] = useState(false);
  const [cFlash, setCFlash] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [key, setKey] = useState(0); // for replay

  const runTimeline = useCallback(() => {
    const t: ReturnType<typeof setTimeout>[] = [];

    // Step 0: 0s → 1.5s (static display)
    t.push(setTimeout(() => setStep(1), 1500));

    // Step 1: 1.5s → 3.5s (C + ext = 180°)
    t.push(setTimeout(() => {
      setStep(2);
      // Flash ∠C
      setCFlash(true);
      setTimeout(() => setCFlash(false), 600);
    }, 3500));

    // Step 2: 3.5s → show conclusion at 4.3s
    t.push(setTimeout(() => setShowConclusion(true), 4300));

    // Step 3: 6s (A+B fly into ext)
    t.push(setTimeout(() => {
      setStep(3);
    }, 6000));

    // Step 4: 8s (finish, ding)
    t.push(setTimeout(() => {
      setStep(4);
      playSound('ding');
    }, 8000));

    // Can continue at 8.5s
    t.push(setTimeout(() => setCanContinue(true), 8500));

    return t;
  }, []);

  useEffect(() => {
    const timers = runTimeline();
    return () => timers.forEach(clearTimeout);
  }, [runTimeline, key]);

  const handleReplay = useCallback(() => {
    setStep(0);
    setShowConclusion(false);
    setCFlash(false);
    setCanContinue(false);
    setKey(k => k + 1);
  }, []);

  // Opacity helpers
  const abDimmed = step === 1; // step 1: A,B fade
  const abOpacity = abDimmed ? 0.15 : 0.6;
  const cExtHighlight = step === 1;
  const cOpacity = cExtHighlight ? 0.8 : 0.5;
  const extOpacity = cExtHighlight ? 0.8 : 0.6;
  const flying = step >= 3;
  const done = step >= 4;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 'clamp(8px, 1.5vmin, 14px)', padding: 'clamp(8px, 2vmin, 16px)',
    }}>
      {/* SVG */}
      <svg viewBox="0 0 600 280" style={{ width: '100%', maxWidth: 600, overflow: 'visible', flexShrink: 0 }}>
        {/* Extension line */}
        <line x1={extPt.x} y1={extPt.y} x2={C.x} y2={C.y}
          stroke="#993C1D" strokeWidth="1.5" strokeDasharray="6 4"
          style={{
            opacity: step === 1 ? 1 : 0.6,
            transition: 'opacity 0.3s',
          }}
        />

        {/* Triangle */}
        <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="#98c1d9" fillOpacity="0.1" stroke="#3d5a80" strokeWidth="2"
          strokeDasharray={flying && !done ? '6 4' : 'none'}
          style={{ transition: 'stroke-dasharray 0.3s' }}
        />

        {/* ∠C sector */}
        <path d={sectorC} fill="#85B7EB" stroke="#185FA5" strokeWidth="1"
          style={{
            fillOpacity: cOpacity,
            transition: 'fill-opacity 0.5s',
            transform: cFlash ? 'scale(1.15)' : 'scale(1)',
            transformOrigin: `${C.x}px ${C.y}px`,
          }}
        />

        {/* Exterior angle sector */}
        <path d={sectorExt} fill="#F0997B" stroke="#993C1D" strokeWidth="1.5"
          style={{
            fillOpacity: done ? 0 : extOpacity,
            transition: 'fill-opacity 0.5s',
          }}
        />

        {/* ∠A sector */}
        <g style={{
          opacity: done ? 0.3 : 1,
          transition: 'opacity 0.5s',
          ...(flying ? {
            transform: flyA.transform,
            transformOrigin: flyA.transformOrigin,
          } : {}),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.5s, 0.8s',
          transitionTimingFunction: 'ease-out, ease-in-out',
        }}>
          <path d={sectorA} fill="#AFA9EC" stroke="#534AB7" strokeWidth="1"
            style={{ fillOpacity: abOpacity, transition: 'fill-opacity 0.5s' }}
          />
        </g>

        {/* ∠B sector */}
        <g style={{
          opacity: done ? 0.3 : 1,
          transition: 'opacity 0.5s',
          ...(flying ? {
            transform: flyB.transform,
            transformOrigin: flyB.transformOrigin,
          } : {}),
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.5s, 0.8s',
          transitionTimingFunction: 'ease-out, ease-in-out',
        }}>
          <path d={sectorB} fill="#5DCAA5" stroke="#0F6E56" strokeWidth="1"
            style={{ fillOpacity: abOpacity, transition: 'fill-opacity 0.5s' }}
          />
        </g>

        {/* A+B merged in exterior (visible after fly) */}
        {done && (
          <>
            <path d={sectorExt} fill="url(#mergedGrad)" stroke="#993C1D" strokeWidth="1.5"
              fillOpacity="0.7" style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
            <defs>
              <linearGradient id="mergedGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#AFA9EC" />
                <stop offset="100%" stopColor="#5DCAA5" />
              </linearGradient>
            </defs>
          </>
        )}

        {/* Vertex labels */}
        <text x={lblA.x} y={lblA.y} textAnchor="middle" fontSize="13" fontWeight="900" fill="#534AB7">A</text>
        <text x={lblB.x} y={lblB.y} textAnchor="start" fontSize="13" fontWeight="900" fill="#0F6E56">B</text>
        <text x={lblC.x} y={lblC.y} textAnchor="middle" fontSize="13" fontWeight="900" fill="#185FA5">C</text>
        <text x={extPt.x - 5} y={extPt.y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#993C1D">外角</text>
      </svg>

      {/* Equation area (HTML for multi-color text) */}
      <div style={{
        textAlign: 'center', minHeight: 80,
        fontSize: 'clamp(13px, 2vmin, 16px)', fontWeight: 700, lineHeight: 2,
        fontFamily: "'Noto Sans TC', sans-serif",
      }}>
        {step === 0 && (
          <div style={{ color: '#3d5a80', animation: 'fadeSlideIn 0.4s ease-out' }}>
            三角形 ABC，C 邊延伸出去形成外角
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
            <span style={{ color: '#185FA5' }}>∠C</span>
            {' + '}
            <span style={{ color: '#993C1D' }}>外角</span>
            {' = '}
            <strong style={{ color: '#293241' }}>180°</strong>
            <span style={{ color: '#94A3B8' }}>（同一條直線）</span>
          </div>
        )}

        {step >= 2 && step < 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'auto auto auto',
              gap: '0 6px', alignItems: 'center', animation: 'fadeSlideIn 0.3s ease-out',
            }}>
              <span style={{ textAlign: 'right' }}>
                <span style={{ color: '#185FA5', transition: 'transform 0.3s', display: 'inline-block', transform: cFlash ? 'scale(1.3)' : 'scale(1)' }}>∠C</span>
                {' + '}
                <span style={{ color: '#993C1D' }}>外角</span>
              </span>
              <span>=</span>
              <strong style={{ color: '#293241' }}>180°</strong>

              <span style={{ textAlign: 'right' }}>
                <span style={{ color: '#534AB7' }}>∠A</span>
                {' + '}
                <span style={{ color: '#0F6E56' }}>∠B</span>
                {' + '}
                <span style={{ color: '#185FA5', transition: 'transform 0.3s', display: 'inline-block', transform: cFlash ? 'scale(1.3)' : 'scale(1)' }}>∠C</span>
              </span>
              <span>=</span>
              <strong style={{ color: '#293241' }}>180°</strong>
            </div>

            {showConclusion && (
              <div style={{ marginTop: 4, animation: 'fadeSlideIn 0.4s ease-out', fontSize: 'clamp(14px, 2.2vmin, 17px)' }}>
                → 所以：
                <span style={{ color: '#993C1D' }}>外角</span>
                {' = '}
                <span style={{ color: '#534AB7' }}>∠A</span>
                {' + '}
                <span style={{ color: '#0F6E56' }}>∠B</span>
              </div>
            )}
          </div>
        )}

        {step >= 4 && (
          <div style={{ animation: 'fadeSlideIn 0.4s ease-out', fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 900 }}>
            <span style={{ color: '#293241' }}>外角定理：</span>
            <span style={{ color: '#993C1D' }}>外角</span>
            {' = 兩個不相鄰內角之和'}
          </div>
        )}
      </div>

      {/* Buttons */}
      {canContinue && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleReplay} style={{
            height: 'clamp(36px, 6vmin, 44px)', padding: '0 20px', borderRadius: 12,
            border: '2px solid #3d5a80', background: 'white', color: '#3d5a80',
            cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(13px, 2vmin, 15px)',
            fontFamily: 'inherit',
          }}>
            重播
          </button>
          <button onClick={onComplete} style={{
            height: 'clamp(36px, 6vmin, 44px)', padding: '0 20px', borderRadius: 12,
            border: 'none', background: '#3d5a80', color: 'white',
            cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(13px, 2vmin, 15px)',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            繼續
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
