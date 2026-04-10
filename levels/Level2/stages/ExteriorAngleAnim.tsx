import { useState, useCallback, useEffect } from 'react';
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


// Extension line length for animation
const EXT_LINE_LEN = C.x - ExtPoint.x; // 80px

// Step 6: equation layout — = sign aligned across rows
const EQ_R = 32;
const EQ_Y1 = 70, EQ_Y2 = 155, EQ_Y3 = 240;
const EQ_S = 40;       // spacing between elements
const EQ_EQ_X = 260;   // aligned = x position
const A_ROTATE = -180;
const B_SHIFT = 20;    // B sector shift right (sector extends left)

/*
  Steps (manual, 0-6):
  0 — intro anim: extension line draws out + exterior sector appears
  1 — ∠C + 外角 = 180° (both highlighted 0.9)
  2 — ∠A ∠B appear, 180° label, no ext line. Bottom: 三角形內角和為 180°
  3 — bottom: ∠A + ∠B + ∠C = 180°, no ext line
  4 — ext line back, ∠A ∠B fly to C, triangle dashes. Bottom: → 所以…
  5 — merged gradient + "外角 = ∠A + ∠B" label. Bottom: 所以外角…
  6 — equation layout + 外角定理 + 繼續
*/

export default function ExteriorAngleAnim({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) {
  const [step, setStep] = useState(0);
  const [introAnim, setIntroAnim] = useState(0); // 0=idle, 1=line drawing, 2=sector appearing, 3=done
  const [introKey, setIntroKey] = useState(0);

  // Step 0 intro animation
  useEffect(() => {
    if (step !== 0) { setIntroAnim(0); return; }
    setIntroAnim(0);
    const t1 = setTimeout(() => setIntroAnim(1), 400);  // start line draw
    const t2 = setTimeout(() => setIntroAnim(2), 1600);  // line done, sector appears
    const t3 = setTimeout(() => setIntroAnim(3), 2800);  // all done
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [step, introKey]);

  const handlePrev = useCallback(() => {
    if (step === 0) {
      if (onBack) onBack();
      else setIntroKey(k => k + 1);
    } else {
      setStep(s => Math.max(0, s >= 6 ? 5 : s - 1));
    }
  }, [step, onBack]);

  const handleNext = useCallback(() => {
    if (step < 5) {
      setStep(s => s + 1);
    } else if (step === 5) {
      setStep(6);
      playSound('ding');
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const flying = step >= 4;
  const showAB = step >= 2 && step <= 5;
  const showExtLine = step <= 1 || step >= 4;
  const showExtSector = step <= 1 || step >= 5;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(8px, 1.5vmin, 12px)',
      fontFamily: 'var(--font-main)',
    }}>
      <div style={{
        flex: 1, minHeight: 0, background: 'white', borderRadius: 16,
        border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative',
      }}>
        <svg viewBox="0 0 500 300" style={{ width: '100%', height: '100%' }}>

          {step <= 5 && (
            <>
              {/* Extension line — animated draw in step 0, toggle visibility by step */}
              {showExtLine && (
                <line key={`ext-${introKey}`} x1={C.x} y1={C.y} x2={ExtPoint.x} y2={ExtPoint.y}
                  stroke="#ee6c4d" strokeWidth="2.5" strokeDasharray={EXT_LINE_LEN}
                  strokeDashoffset={step === 0 && introAnim < 2 ? EXT_LINE_LEN - (introAnim >= 1 ? EXT_LINE_LEN : 0) : 0}
                  style={{
                    opacity: step >= 1 ? 0.9 : 0.7,
                    transition: step === 0 ? `stroke-dashoffset 0.7s ease-out, opacity 0.5s` : 'opacity 0.5s',
                  }}
                />
              )}

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
                style={{
                  fillOpacity: step === 0 ? 0.5 : step === 1 ? 0.9 : step >= 2 ? 0.5 : 0.5,
                  transition: 'all 0.5s',
                }}
              />

              {/* Exterior angle sector — step 0 animated (fill+stroke together), step 1 highlighted, hidden 2-3, back at 5 */}
              <path d={describeSector(C.x, C.y, R, ext_start, ext_end)}
                fill="#F0997B" stroke="#993C1D" strokeWidth="1.5"
                style={{
                  opacity: showExtSector
                    ? (step === 0 ? (introAnim >= 2 ? 1 : 0) : 1)
                    : 0,
                  fillOpacity: step === 1 ? 0.9 : 0.3,
                  pointerEvents: showExtSector ? 'auto' : 'none',
                  transition: 'opacity 1s ease-out, fill-opacity 0.6s',
                }}
              />

              {/* ∠A — rendered from step 2, flies at step 4 */}
              {showAB && (
                <path d={describeSector(A.x, A.y, R, angleA_start, angleA_end)}
                  fill="#AFA9EC" stroke="#534AB7" strokeWidth="1.5"
                  style={{
                    fillOpacity: step === 4 ? 0.5 : step >= 5 ? 0.6 : 0.6,
                    transform: flying ? `translate(${C.x - A.x}px, ${C.y - A.y}px) rotate(180deg)` : 'translate(0,0) rotate(0deg)',
                    transformOrigin: `${A.x}px ${A.y}px`,
                    transition: 'fill-opacity 0.5s, transform 1.4s ease-in-out',
                  }}
                />
              )}

              {/* ∠B — rendered from step 2, flies at step 4 */}
              {showAB && (
                <path d={describeSector(B.x, B.y, R, angleB_start, angleB_end)}
                  fill="#5DCAA5" stroke="#0F6E56" strokeWidth="1.5"
                  style={{
                    fillOpacity: step === 4 ? 0.5 : step >= 5 ? 0.6 : 0.6,
                    transform: flying ? `translate(${C.x - B.x}px, ${C.y - B.y}px) rotate(0deg)` : 'translate(0,0) rotate(0deg)',
                    transformOrigin: `${B.x}px ${B.y}px`,
                    transition: 'fill-opacity 0.5s, transform 1.4s ease-in-out',
                  }}
                />
              )}

              {/* Red overlay on A+B sectors — step 5 only, slightly larger */}
              {step === 5 && (
                <path d={describeSector(C.x, C.y, 80, ext_start, ext_end)}
                  fill="#ee6c4d" stroke="#993C1D" strokeWidth="1.5" fillOpacity="0.25"
                  style={{ animation: 'fadeSlideIn 0.5s ease-out' }}
                />
              )}


              {/* 180° label inside triangle (step 3) */}
              {step === 3 && (
                <text x={(A.x + B.x + C.x) / 3} y={(A.y + B.y + C.y) / 3 + 5} textAnchor="middle"
                  className="font-en" fontSize="20" fontWeight="900" fill="#3d5a80"
                  style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
                  180°
                </text>
              )}

              {/* Vertex labels */}
              <text x={A.x} y={A.y - 14} fill="#534AB7" fontSize="14" fontWeight="900" textAnchor="middle">A</text>
              <text x={B.x + 16} y={B.y + 5} fill="#0F6E56" fontSize="14" fontWeight="900">B</text>
              <text x={C.x - 8} y={C.y + 20} fill="#185FA5" fontSize="14" fontWeight="900">C</text>

              {/* 外角 label — visible step 0 (after anim) and step 1 */}
              {((step === 0 && introAnim >= 2) || step === 1) && (
                <text x={50} y={180} fill="#993C1D" fontSize="12" fontWeight="700"
                  style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>外角</text>
              )}

              {/* Step 5: "外角 = ∠A + ∠B" label — above ext sector */}
              {step === 5 && (
                <text x={45} y={165} fill="#993C1D" fontSize="13" fontWeight="900"
                  style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
                  外角 = ∠A + ∠B
                </text>
              )}
            </>
          )}

          {/* === Step 6: Equation layout (= aligned at EQ_EQ_X) === */}
          {step >= 6 && (
            <>
              {/* Row 1: 外角 + ∠C = 180° */}
              <path d={describeSector(EQ_EQ_X - 3 * EQ_S, EQ_Y1, EQ_R, ext_start, ext_end)}
                fill="#F0997B" stroke="#993C1D" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
              <text x={EQ_EQ_X - 3 * EQ_S - 4} y={EQ_Y1 - 12} textAnchor="middle" fontSize="9" fontWeight="900" fill="#993C1D">外角</text>
              <text x={EQ_EQ_X - 2 * EQ_S} y={EQ_Y1 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">+</text>
              <path d={describeSector(EQ_EQ_X - EQ_S -10, EQ_Y1, EQ_R, angleC_start, angleC_end)}
                fill="#85B7EB" stroke="#185FA5" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out 0.1s both' }} />
              <text x={EQ_EQ_X - EQ_S - 15} y={EQ_Y1 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#185FA5">C</text>
              <text x={EQ_EQ_X} y={EQ_Y1 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">=</text>
              <text x={EQ_EQ_X + EQ_S} y={EQ_Y1 + 7} textAnchor="middle" className="font-en" fontSize="20" fontWeight="900" fill="#293241">180°</text>

              {/* Row 2: ∠A + ∠B + ∠C = 180° */}
              <g style={{ transform: `rotate(${A_ROTATE}deg)`, transformOrigin: `${EQ_EQ_X - 5 * EQ_S}px ${EQ_Y2}px` }}>
                <path d={describeSector(EQ_EQ_X - 5 * EQ_S, EQ_Y2, EQ_R, angleA_start, angleA_end)}
                  fill="#AFA9EC" stroke="#534AB7" strokeWidth="0.8" fillOpacity="0.6"
                  style={{ animation: 'fadeSlideIn 0.4s ease-out 0.15s both' }} />
              </g>
              <text x={EQ_EQ_X - 5 * EQ_S - 8} y={EQ_Y2 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#534AB7">A</text>
              <text x={EQ_EQ_X - 4 * EQ_S} y={EQ_Y2 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">+</text>
              <path d={describeSector(EQ_EQ_X - 3 * EQ_S + B_SHIFT, EQ_Y2, EQ_R, angleB_start, angleB_end)}
                fill="#5DCAA5" stroke="#0F6E56" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out 0.2s both' }} />
              <text x={EQ_EQ_X - 3 * EQ_S + B_SHIFT - 40} y={EQ_Y2 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#0F6E56">B</text>
              <text x={EQ_EQ_X - 2 * EQ_S} y={EQ_Y2 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">+</text>
              <path d={describeSector(EQ_EQ_X - EQ_S -10, EQ_Y2, EQ_R, angleC_start, angleC_end)}
                fill="#85B7EB" stroke="#185FA5" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out 0.25s both' }} />
              <text x={EQ_EQ_X - EQ_S -15} y={EQ_Y2 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#185FA5">C</text>
              <text x={EQ_EQ_X} y={EQ_Y2 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">=</text>
              <text x={EQ_EQ_X + EQ_S} y={EQ_Y2 + 7} textAnchor="middle" className="font-en" fontSize="20" fontWeight="900" fill="#293241">180°</text>

              {/* Row 3: 外角 = ∠A + ∠B */}
              <path d={describeSector(EQ_EQ_X - EQ_S, EQ_Y3, EQ_R, ext_start, ext_end)}
                fill="#F0997B" stroke="#993C1D" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out 0.3s both' }} />
              <text x={EQ_EQ_X - EQ_S - 4} y={EQ_Y3 - 12} textAnchor="middle" fontSize="9" fontWeight="900" fill="#993C1D">外角</text>
              <text x={EQ_EQ_X} y={EQ_Y3 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">=</text>
              <g style={{ transform: `rotate(${A_ROTATE}deg)`, transformOrigin: `${EQ_EQ_X + EQ_S}px ${EQ_Y3}px` }}>
                <path d={describeSector(EQ_EQ_X + EQ_S, EQ_Y3, EQ_R, angleA_start, angleA_end)}
                  fill="#AFA9EC" stroke="#534AB7" strokeWidth="0.8" fillOpacity="0.6"
                  style={{ animation: 'fadeSlideIn 0.4s ease-out 0.35s both' }} />
              </g>
              <text x={EQ_EQ_X + EQ_S - 8} y={EQ_Y3 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#534AB7">A</text>
              <text x={EQ_EQ_X + 2 * EQ_S} y={EQ_Y3 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#293241">+</text>
              <path d={describeSector(EQ_EQ_X + 3 * EQ_S + B_SHIFT, EQ_Y3, EQ_R, angleB_start, angleB_end)}
                fill="#5DCAA5" stroke="#0F6E56" strokeWidth="0.8" fillOpacity="0.6"
                style={{ animation: 'fadeSlideIn 0.4s ease-out 0.4s both' }} />
              <text x={EQ_EQ_X + 3 * EQ_S + B_SHIFT - 40} y={EQ_Y3 + 2} textAnchor="end" fontSize="12" fontWeight="900" fill="#0F6E56">B</text>
            </>
          )}
        </svg>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        height: 'clamp(90px, 14vmin, 120px)',
        padding: '0 clamp(12px, 2vmin, 18px)',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 'clamp(17px, 2.8vmin, 22px)', fontWeight: 700, lineHeight: 1.8,
        color: '#293241', flexShrink: 0,
      }}>
        {/* Prev / replay */}
        <button onClick={handlePrev} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, padding: 0,
          visibility: step === 0 ? (introAnim >= 3 ? 'visible' : 'hidden') : 'visible',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {step === 0 && (
            <div style={{ color: '#3d5a80' }}>三角形 ABC，C 邊延伸出去形成外角</div>
          )}
          {step === 1 && (
            <div>
              <span style={{ color: '#185FA5' }}>∠C</span>{' + '}<span style={{ color: '#993C1D' }}>外角</span>{' = '}<strong>180°</strong>
            </div>
          )}
          {step === 2 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>三角形內角和為 180°</div>
          )}
          {step === 3 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              <span style={{ color: '#534AB7' }}>∠A</span>{' + '}<span style={{ color: '#0F6E56' }}>∠B</span>{' + '}<span style={{ color: '#185FA5' }}>∠C</span>{' = '}<strong>180°</strong>
            </div>
          )}
          {step === 4 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              <span style={{ color: '#534AB7' }}>∠A</span>{' + '}<span style={{ color: '#0F6E56' }}>∠B</span>{' + '}<span style={{ color: '#185FA5' }}>∠C</span>{' = '}<span style={{ color: '#993C1D' }}>外角</span>{' + '}<span style={{ color: '#185FA5' }}>∠C</span>
            </div>
          )}
          {step === 5 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              所以：<span style={{ color: '#993C1D' }}>外角</span>{' = '}<span style={{ color: '#534AB7' }}>∠A</span>{' + '}<span style={{ color: '#0F6E56' }}>∠B</span>
            </div>
          )}
          {step >= 6 && (
            <div style={{ fontWeight: 900, animation: 'fadeSlideIn 0.4s ease-out' }}>
              <span style={{ color: '#ee6c4d' }}>外角定理：</span>外角 = 兩個不相鄰內角之和
            </div>
          )}
        </div>

        {step < 6 ? (
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
            cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(17px, 2.8vmin, 22px)',
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
