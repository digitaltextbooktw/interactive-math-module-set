import { useState, useCallback } from 'react';
import { playSound } from '../../../utils/sound';

// === Geometry helpers ===
const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeSector = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, r, endAngle);
  const end = polarToCartesian(x, y, r, startAngle);
  const diff = endAngle - startAngle;
  const largeArc = diff > 180 ? '1' : '0';
  return `M ${x},${y} L ${start.x},${start.y} A ${r},${r} 0 ${largeArc},0 ${end.x},${end.y} Z`;
};

// === Triangle: right angle at B ===
const A = { x: 400, y: 80 };
const B = { x: 400, y: 250 };
const C = { x: 100, y: 250 };
const ExtPoint = { x: 20, y: 250 };
const R = 60;

const angleA_start = 180, angleA_end = 240.5;
const angleB_start = 270, angleB_end = 360;
const angleC_start = 60.5, angleC_end = 90;
const ext_start = 270, ext_end = 420.5;

/*
  Steps (manual):
  0 — static: "三角形 ABC，C 邊延伸出去形成外角"
  1 — ∠C + 外角 = 180°  (highlight C + exterior)
  2 — + ∠A + ∠B + ∠C = 180°
  3 — → 所以：外角 = ∠A + ∠B + fly animation
  4 — fly done, merged gradient, "外角定理" → continue
*/

function sectorOpacity(step: number, sector: 'A' | 'B' | 'C' | 'ext'): number {
  // A and B hidden until step 2
  if (sector === 'A' || sector === 'B') {
    if (step <= 1) return 0;
    if (step >= 4) return 0.2;
    return 0.6;
  }
  if (step === 0) return 0.4;
  if (step === 1) {
    if (sector === 'C' || sector === 'ext') return 0.75;
    return 0.4;
  }
  if (step === 2) {
    if (sector === 'C') return 0.7;
    if (sector === 'ext') return 0.3;
    return 0.4;
  }
  if (sector === 'ext') return step >= 3 ? 0 : 0.4;
  return 0.4;
}

export default function ExteriorAngleAnim({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const handlePrev = useCallback(() => {
    setStep(s => Math.max(0, s >= 4 ? 3 : s - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(s => s + 1);
    } else if (step === 3) {
      setStep(4);
      playSound('ding');
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const flying = step >= 3;
  const done = step >= 4;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(8px, 1.5vmin, 12px)',
      fontFamily: 'var(--font-main)',
    }}>
      {/* SVG */}
      <div style={{
        flex: 1, minHeight: 0, background: 'white', borderRadius: 16,
        border: '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        <svg viewBox="0 0 500 300" style={{ width: '100%', height: '100%' }}>
          {/* Extension line */}
          <line x1={C.x} y1={C.y} x2={ExtPoint.x} y2={ExtPoint.y}
            stroke="#98c1d9" strokeWidth="2" strokeDasharray="6,4"
            style={{ opacity: step >= 1 ? 0.8 : 0.4, transition: 'opacity 0.5s' }}
          />

          {/* Triangle */}
          <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="#98c1d9" fillOpacity="0.1" stroke="#3d5a80" strokeWidth="2"
            style={{ strokeDasharray: flying ? '6,4' : 'none', opacity: flying ? 0.5 : 1, transition: 'all 0.5s' }}
          />

          {/* Right angle marker at B */}
          <polyline points={`${B.x - 14},${B.y} ${B.x - 14},${B.y - 14} ${B.x},${B.y - 14}`}
            fill="none" stroke="#3d5a80" strokeWidth="1.5" opacity="0.4" />

          {/* ∠C sector */}
          <path d={describeSector(C.x, C.y, R, angleC_start, angleC_end)}
            fill="#85B7EB" stroke="#185FA5" strokeWidth="1.5"
            style={{ fillOpacity: sectorOpacity(step, 'C'), transition: 'all 0.5s' }}
          />

          {/* Exterior angle sector — orange-red */}
          <path d={describeSector(C.x, C.y, R, ext_start, ext_end)}
            fill="#F0997B" stroke="#993C1D" strokeWidth="1.5"
            style={{ fillOpacity: done ? 0 : sectorOpacity(step, 'ext'), transition: 'all 0.6s' }}
          />

          {/* ∠A — flies to C */}
          <path d={describeSector(A.x, A.y, R, angleA_start, angleA_end)}
            fill="#AFA9EC" stroke="#534AB7" strokeWidth="1.5"
            style={{
              fillOpacity: sectorOpacity(step, 'A'),
              transform: flying ? `translate(${C.x - A.x}px, ${C.y - A.y}px) rotate(180deg)` : 'translate(0,0) rotate(0deg)',
              transformOrigin: `${A.x}px ${A.y}px`,
              transition: 'all 0.8s ease-in-out',
            }}
          />

          {/* ∠B — flies to C */}
          <path d={describeSector(B.x, B.y, R, angleB_start, angleB_end)}
            fill="#5DCAA5" stroke="#0F6E56" strokeWidth="1.5"
            style={{
              fillOpacity: sectorOpacity(step, 'B'),
              transform: flying ? `translate(${C.x - B.x}px, ${C.y - B.y}px) rotate(0deg)` : 'translate(0,0) rotate(0deg)',
              transformOrigin: `${B.x}px ${B.y}px`,
              transition: 'all 0.8s ease-in-out',
            }}
          />

          {/* Merged gradient after fly */}
          {done && (
            <>
              <defs>
                <linearGradient id="extGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#AFA9EC" />
                  <stop offset="100%" stopColor="#5DCAA5" />
                </linearGradient>
              </defs>
              <path d={describeSector(C.x, C.y, R, ext_start, ext_end)}
                fill="url(#extGrad)" stroke="#993C1D" strokeWidth="1.5" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
              />
            </>
          )}

          {/* Labels */}
          <text x={A.x} y={A.y - 14} fill="#534AB7" fontSize="14" fontWeight="900" textAnchor="middle">A</text>
          <text x={B.x + 16} y={B.y + 5} fill="#0F6E56" fontSize="14" fontWeight="900">B</text>
          <text x={C.x - 8} y={C.y + 20} fill="#185FA5" fontSize="14" fontWeight="900">C</text>
          <text x={50} y={180} fill="#993C1D" fontSize="12" fontWeight="700">外角</text>
        </svg>
      </div>

      {/* Bottom bar: prev | equations | next/continue */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        height: 'clamp(90px, 14vmin, 120px)',
        padding: '0 clamp(12px, 2vmin, 18px)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 'clamp(14px, 2.2vmin, 17px)', fontWeight: 700, lineHeight: 1.8,
        color: '#293241', flexShrink: 0,
      }}>
        {/* Left: prev */}
        <button onClick={step > 0 ? handlePrev : undefined} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
          cursor: step > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, padding: 0, visibility: step > 0 ? 'visible' : 'hidden',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        {/* Center: equations */}
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {step === 0 && (
            <div style={{ color: '#3d5a80' }}>
              三角形 ABC，C 邊延伸出去形成外角
            </div>
          )}

          {step >= 1 && (
            <div>
              <span style={{ color: '#185FA5' }}>∠C</span>
              {' + '}
              <span style={{ color: '#993C1D' }}>外角</span>
              {' = '}
              <strong>180°</strong>
            </div>
          )}

          {step >= 2 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              <span style={{ color: '#534AB7' }}>∠A</span>
              {' + '}
              <span style={{ color: '#0F6E56' }}>∠B</span>
              {' + '}
              <span style={{ color: '#185FA5' }}>∠C</span>
              {' = '}
              <strong>180°</strong>
            </div>
          )}

          {step >= 3 && step < 4 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              → 所以：
              <span style={{ color: '#993C1D' }}>外角</span>
              {' = '}
              <span style={{ color: '#534AB7' }}>∠A</span>
              {' + '}
              <span style={{ color: '#0F6E56' }}>∠B</span>
            </div>
          )}

          {step >= 4 && (
            <div style={{ fontWeight: 900, animation: 'fadeSlideIn 0.4s ease-out' }}>
              <span style={{ color: '#ee6c4d' }}>外角定理：</span>
              外角 = 兩個不相鄰內角之和
            </div>
          )}
        </div>

        {/* Right: next / continue */}
        {step < 4 ? (
          <button onClick={handleNext} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, padding: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        ) : (
          <button onClick={onComplete} style={{
            height: 'clamp(40px, 6vmin, 48px)', padding: '0 clamp(14px, 2.5vmin, 20px)', borderRadius: 10,
            border: 'none', background: '#3d5a80', color: 'white',
            cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(15px, 2.5vmin, 18px)',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            繼續
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
