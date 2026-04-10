import React, { useState, useCallback, useEffect, useRef } from 'react';
import { playSound } from '../../../utils/sound';

interface Point { x: number; y: number; }

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ═══ Coordinates ═══
// Task 1: 3-4-5 triangle as "原件" (5 is base)
const T1_SRC_A = { x: 30, y: 200 };   // base left
const T1_SRC_B = { x: 230, y: 200 };  // base right
const T1_SRC_C = { x: 102, y: 104 };  // apex (AC=3u=120px, BC=4u=160px)
const T1_TGT_A = { x: 310, y: 200 };
const T1_TGT_B = { x: 510, y: 200 };
const T1_LEN = 200; // 5 units

/** Reusable 3-4-5 original triangle (原件) SVG fragment */
const OriginalTriangle = ({ showDots = false }: { showDots?: boolean }) => (
  <g>
    <polygon points={`${T1_SRC_A.x},${T1_SRC_A.y} ${T1_SRC_B.x},${T1_SRC_B.y} ${T1_SRC_C.x},${T1_SRC_C.y}`}
      fill="#98c1d9" fillOpacity="0.08" stroke="#3d5a80" strokeWidth={showDots ? 2.5 : 2} />
    {showDots && <>
      <circle cx={T1_SRC_A.x} cy={T1_SRC_A.y} r="4" fill="#3d5a80" />
      <circle cx={T1_SRC_B.x} cy={T1_SRC_B.y} r="4" fill="#3d5a80" />
      <circle cx={T1_SRC_C.x} cy={T1_SRC_C.y} r="4" fill="#3d5a80" />
    </>}
    <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y - 12} textAnchor="middle" className="font-en" fontSize="11" fontWeight="700" fill="#3d5a80">5</text>
    <text x={(T1_SRC_A.x + T1_SRC_C.x) / 2 - 10} y={(T1_SRC_A.y + T1_SRC_C.y) / 2} textAnchor="end" className="font-en" fontSize="11" fontWeight="700" fill="#3d5a80">3</text>
    <text x={(T1_SRC_B.x + T1_SRC_C.x) / 2 + 10} y={(T1_SRC_B.y + T1_SRC_C.y) / 2} textAnchor="start" className="font-en" fontSize="11" fontWeight="700" fill="#3d5a80">4</text>
    <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y + 40} textAnchor="middle" fontSize="12" fontWeight="900" fill="#3d5a80">原件</text>
  </g>
);

// SSS: a=6, b=5, c=4 (units), 1 unit = 40px
const UNIT = 40;
const SSS_VALS = { a: 5, b: 3, c: 4 };
const SSS_A = SSS_VALS.a * UNIT;
const SSS_B = SSS_VALS.b * UNIT;
const SSS_C = SSS_VALS.c * UNIT;
// SSS builds on the copied base line (right side)
const SSS_LEFT = T1_TGT_A;
const SSS_RIGHT = T1_TGT_B;
const sssCosPAngle = (SSS_B ** 2 + SSS_A ** 2 - SSS_C ** 2) / (2 * SSS_B * SSS_A);
const sssSinPAngle = Math.sqrt(Math.max(0, 1 - sssCosPAngle ** 2));
const SSS_TOP = { x: SSS_LEFT.x + SSS_B * sssCosPAngle, y: SSS_LEFT.y - SSS_B * sssSinPAngle };


// ═══ Animated Compass ═══
// needle = fixed point, pencilTarget = where pencil should go
// spread 0→1 animates the opening
function AnimatedCompass({ needle, pencilTarget, spread, closed }: { needle: Point; pencilTarget: Point; spread: number; closed?: boolean }) {
  const closedGap = 20;
  const dx = pencilTarget.x - needle.x;
  const dy = pencilTarget.y - needle.y;
  const fullDist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / fullDist;
  const uy = dy / fullDist;
  const tipDist = closedGap + (fullDist - closedGap) * spread;
  const px = needle.x + ux * tipDist;
  const py = needle.y + uy * tipDist;
  // 3D-ish perspective: hinge always directly above needle, tilted slightly toward pencil
  const legLen = 75;
  const tiltFactor = 0.25; // how much the hinge leans toward the pencil
  const hingeX = needle.x + (px - needle.x) * tiltFactor;
  const hingeY = needle.y - legLen;
  // Head parts above the hinge
  const headCenterY = hingeY - 12;
  const knobY = headCenterY - 14;
  return (
    <g>
      {/* Needle leg (thicker, closer to viewer in 3D) */}
      <line x1={hingeX} y1={hingeY} x2={needle.x} y2={needle.y}
        stroke="#9E9690" strokeWidth="3.5" strokeLinecap="round" />
      {/* Pencil leg (thinner, further away in 3D) */}
      <line x1={hingeX} y1={hingeY} x2={px} y2={py}
        stroke="#B5AFA9" strokeWidth="2.5" strokeLinecap="round" />
      {/* Hinge bolt */}
      <rect x={hingeX - 5} y={hingeY - 3} width="10" height="6" rx="1.5" fill="#AEA8A3" />
      {/* Neck (hinge → head) */}
      <line x1={hingeX} y1={hingeY} x2={hingeX} y2={headCenterY + 7}
        stroke="#9E9690" strokeWidth="3" strokeLinecap="round" />
      {/* Head ring */}
      <circle cx={hingeX} cy={headCenterY} r="7" fill="none" stroke="#9E9690" strokeWidth="2.5" />
      {/* Knob on top */}
      <rect x={hingeX - 3} y={knobY - 4} width="6" height="8" rx="2" fill="#9E9690" />
      {/* Needle tip (fixed point) */}
      <circle cx={needle.x} cy={needle.y} r="3" fill={closed ? '#ee6c4d' : '#3d5a80'} />
      {/* Pencil tip (drawing point) */}
      {!closed && <circle cx={px} cy={py} r="3" fill="#ee6c4d" />}
    </g>
  );
}

// ═══ Ruler between two points ═══
function RulerTool({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Always 5-unit ruler, 0 on the left
  const units = 5;
  const ux = dx / len;
  const uy = dy / len;
  const rulerLen = units * UNIT;
  const rulerEnd = { x: from.x + ux * rulerLen, y: from.y + uy * rulerLen };
  // Perpendicular pointing downward (for horizontal lines)
  const nx = -dy / len;
  const ny = dx / len;
  const rulerW = 36;
  // Extend beyond 0 and 5 marks so it looks like a real ruler
  const overshoot = 14;
  const bodyStart = { x: from.x - ux * overshoot, y: from.y - uy * overshoot };
  const bodyEnd = { x: rulerEnd.x + ux * overshoot, y: rulerEnd.y + uy * overshoot };
  return (
    <g style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Ruler body with rounded ends */}
      <rect
        x={0} y={0}
        width={Math.sqrt((bodyEnd.x - bodyStart.x) ** 2 + (bodyEnd.y - bodyStart.y) ** 2)}
        height={rulerW}
        rx="4" ry="4"
        fill="#f5f0e6" fillOpacity="0.9" stroke="#8A7F72" strokeWidth="1.5"
        transform={`translate(${bodyStart.x},${bodyStart.y}) rotate(${Math.atan2(bodyEnd.y - bodyStart.y, bodyEnd.x - bodyStart.x) * 180 / Math.PI})`}
      />
      <line x1={from.x} y1={from.y} x2={rulerEnd.x} y2={rulerEnd.y} stroke="#3d5a80" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: units + 1 }, (_, i) => {
        const t = i / units;
        const tickLen = rulerW * 0.3;
        const tx = from.x + ux * rulerLen * t;
        const ty = from.y + uy * rulerLen * t;
        return (
          <g key={i}>
            <line
              x1={tx} y1={ty}
              x2={tx + nx * tickLen} y2={ty + ny * tickLen}
              stroke="#5a5047" strokeWidth="1" />
            <text
              x={tx + nx * (tickLen + 8)} y={ty + ny * (tickLen + 8) + 1}
              textAnchor="middle" className="font-en" fontSize="10" fontWeight="700" fill="#5a5047">{i}</text>
          </g>
        );
      })}
    </g>
  );
}


// ═══ Phases ═══
type Phase =
  // Task 1: copy base of 3-4-5 triangle
  | 'task1-show'             // show triangle, identify the base
  | 'task1-ruler-src'        // ruler measures base = 5
  | 'task1-ruler-tgt'        // ruler moves to target, click to draw
  | 'task1-done'             // line drawn, success
  // Task 2: SSS
  | 'task2-ruler'                                                    // ruler measures 3
  | 'task2-pin'                                                      // compass pinned, closed
  | 'task2-step0'                                                    // compass opens to 3
  | 'task2-arc1'                                                     // animate arc from left (r=3), stays after done
  | 'task2-ruler2'                                                   // ruler measures right edge = 4
  | 'task2-pin2'                                                     // compass pinned at right, closed
  | 'task2-open2'                                                    // compass opens to 4
  | 'task2-arc2'                                                     // animate arc from right (r=4)
  | 'task2-step2'                                                    // click intersection vertex
  | 'task2-draw-l'                                                   // ruler on left side, click to draw
  | 'task2-done-l'                                                   // ruler gone, gray left line visible
  | 'task2-draw-r'                                                   // ruler on right side, click to draw
  | 'task2-done-r'                                                   // ruler gone, gray right line visible
  | 'task2-congruent'                                                // show congruent animation
  // SSS uniqueness exploration
  | 'task2-question'                                                 // popup: why SSS = congruent?
  | 'task2-puzzle'                                                   // show 3 line segments
  | 'task2-puzzle-drag'                                              // drag segments to form triangle
  | 'task2-locked'                                                   // locked drag: R can't move
  | 'task2-unlocked'                                                 // free drag: R moves, not congruent
  | 'task2-sss-done'                                                 // conclusion card
;

const TASK_NAMES: Record<number, string> = {
  1: '複製線段',
  2: `SSS 作圖　已知三角形邊長分別為 ${SSS_VALS.a}、${SSS_VALS.b}、${SSS_VALS.c}`,
};

// Phase action types for consistent UI behavior
type ActionType = 'info' | 'action' | 'drag' | 'auto';

const PHASE_ACTION: Record<Phase, ActionType> = {
  'task1-show': 'info',
  'task1-ruler-src': 'info',
  'task1-ruler-tgt': 'action',
  'task1-done': 'info',
  'task2-ruler': 'info',
  'task2-pin': 'action',
  'task2-step0': 'auto',
  'task2-arc1': 'action',
  'task2-ruler2': 'info',
  'task2-pin2': 'action',
  'task2-open2': 'auto',
  'task2-arc2': 'action',
  'task2-step2': 'action',
  'task2-draw-l': 'action',
  'task2-done-l': 'info',
  'task2-draw-r': 'action',
  'task2-done-r': 'info',
  'task2-congruent': 'auto',
  'task2-question': 'info',
  'task2-puzzle': 'info',
  'task2-puzzle-drag': 'drag',
  'task2-locked': 'drag',
  'task2-unlocked': 'drag',
  'task2-sss-done': 'info',
};

const ACTION_LABELS: Record<ActionType, { text: string; bg: string; color: string }> = {
  info:   { text: '說明', bg: '#F1F5F9', color: '#64748B' },
  action: { text: '動作', bg: '#FFF7ED', color: '#EA580C' },
  drag:   { text: '拖曳', bg: '#F0FDF4', color: '#16A34A' },
  auto:   { text: '播放', bg: '#EFF6FF', color: '#3B82F6' },
};

const STEP_HINTS: Record<string, string> = {
  'task1-show':        '這是 3-4-5 直角三角形（原件）。來複製底邊吧！',
  'task1-ruler-src':   '直尺量出底邊 = 5',
  'task1-ruler-tgt':   '點擊右側的起點，畫出底邊',
  'task1-done':        '底邊複製完成！',
  'task2-ruler':       `直尺量出左邊 = ${SSS_VALS.b}`,
  'task2-pin':         '點擊左端點，釘上圓規',
  'task2-step0':       '圓規張開中⋯⋯',
  'task2-arc1':        '點擊圓規，畫弧',
  'task2-ruler2':      `直尺量出右邊 = ${SSS_VALS.c}`,
  'task2-pin2':        '點擊右端點，釘上圓規',
  'task2-open2':       '圓規張開中⋯⋯',
  'task2-arc2':        '點擊圓規，畫弧',
  'task2-step2':       '點擊兩弧的交叉點（第三頂點）',
  'task2-draw-l':      '點擊頂點，用直尺連左邊',
  'task2-done-l':      '左邊連好了！',
  'task2-draw-r':      '點擊頂點，用直尺連右邊',
  'task2-done-r':      'SSS 三角形完成！',
  'task2-congruent':   '三邊相等 → 形狀完全一樣 = SSS 全等！',
  'task2-question':    '為什麼三條邊一樣就一定全等？',
  'task2-puzzle':      '三條邊長分別為 3、4、5 的線段',
  'task2-puzzle-drag': '拖動 3 和 4 到底邊的端點上',
  'task2-locked':      '邊長鎖定了！拖動頂點試試？',
  'task2-unlocked':    '邊長可以變了，自由拖動頂點看看',
  'task2-sss-done':    'SSS 全等性質確認完成！',
};

export default function ExploreStage({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('task1-show');
  const [compassSpread, setCompassSpread] = useState(0);
  const [arcSweep, setArcSweep] = useState(0); // 0→1 for arc drawing animation
  const [arcTriggered, setArcTriggered] = useState(false); // user clicked compass to start arc
  const [congruentDone, setCongruentDone] = useState(false); // after trace animation completes
  const [animDone, setAnimDone] = useState(false); // tracks whether auto-phase animation finished

  // Task 1
  const [t1Done, setT1Done] = useState(false);

  // Task 2
  const [sssArcs, setSssArcs] = useState<{ center: Point; radius: number }[]>([]);
  const [sssVertex, setSssVertex] = useState<Point | null>(null);
  const [sssLines, setSssLines] = useState<{ from: Point; to: Point }[]>([]);

  // Puzzle state (task2-puzzle): guided step-by-step
  // Base is fixed at right-side copied line position. User attaches seg3 then seg4.
  const PZ_BASE_L: Point = { x: 310, y: 200 }; // aligned with original triangle base
  const PZ_BASE_R: Point = { x: 510, y: 200 };
  // Compute target apex for reference overlay
  const pzCosA = (25 + 9 - 16) / (2 * 5 * 3); // 0.6
  const pzSinA = Math.sqrt(1 - pzCosA * pzCosA); // 0.8
  const PZ_APEX: Point = { x: PZ_BASE_L.x + 3 * UNIT * pzCosA, y: PZ_BASE_L.y - 3 * UNIT * pzSinA };
  // pzStarted is now derived from phase === 'task2-puzzle-drag'
  const [pz3, setPz3] = useState({ p1: { x: 340, y: 100 }, p2: { x: 460, y: 100 } });
  const [pz4, setPz4] = useState({ p1: { x: 360, y: 160 }, p2: { x: 520, y: 160 } });
  const [pz3Snap, setPz3Snap] = useState<'p1' | 'p2' | null>(null); // which end snapped to BASE_L
  const [pz4Snap, setPz4Snap] = useState<'p1' | 'p2' | null>(null); // which end snapped to BASE_R
  const [pzClosed, setPzClosed] = useState(false);
  const pzDragRef = useRef<{ seg: '3' | '4'; startMouse: Point; startP1: Point; startP2: Point } | null>(null);
  const pzSvgRef = useRef<SVGSVGElement>(null);

  // Uniqueness state (task2-locked / task2-unlocked) — right side of split layout
  const UQ_P = { x: 310, y: 200 };
  const UQ_Q = { x: 510, y: 200 };
  const uqD = 200; // dist P-Q
  const uqA2 = (120 * 120 - 160 * 160 + uqD * uqD) / (2 * uqD); // 72
  const uqH = Math.sqrt(120 * 120 - uqA2 * uqA2); // 96
  const UQ_R_FIXED: Point = { x: UQ_P.x + uqA2 * (UQ_Q.x - UQ_P.x) / uqD, y: UQ_P.y - uqH * (UQ_Q.x - UQ_P.x) / uqD };
  const [uqR, setUqR] = useState<Point>(UQ_R_FIXED);
  const [uqP, setUqP] = useState<Point>(UQ_P);
  const [uqQ, setUqQ] = useState<Point>(UQ_Q);
  const [uqArcFlash, setUqArcFlash] = useState(false);
  const [uqShowHint, setUqShowHint] = useState(false);
  const [uqShowBtn, setUqShowBtn] = useState(false);
  const uqDragRef = useRef<null | 'p' | 'q' | 'r'>(null);
  const uqDragCount = useRef(0);
  const uqSvgRef = useRef<SVGSVGElement>(null);


  // Reset animDone and arcTriggered when phase changes
  useEffect(() => {
    setAnimDone(false);
    setArcTriggered(false);
  }, [phase]);

  // Compass opening animation for task2-step0
  useEffect(() => {
    if (phase !== 'task2-step0') return;
    setCompassSpread(0);
    let frame = 0;
    const total = 25;
    const id = setInterval(() => {
      frame++;
      setCompassSpread(Math.min(1, frame / total));
      if (frame >= total) { clearInterval(id); setAnimDone(true); }
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  // Arc sweep animation for task2-arc1 (triggered by click)
  useEffect(() => {
    if (phase !== 'task2-arc1' || !arcTriggered) return;
    setArcSweep(0);
    let cancelled = false;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame++;
      setArcSweep(Math.min(1, frame / total));
      if (frame >= total) {
        clearInterval(id);
        if (!cancelled) {
          setSssArcs([{ center: SSS_LEFT, radius: SSS_B }]);
          setAnimDone(true);
        }
      }
    }, 16);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase, arcTriggered]);

  // Compass opening animation for task2-open2 (right side)
  useEffect(() => {
    if (phase !== 'task2-open2') return;
    setCompassSpread(0);
    let frame = 0;
    const total = 25;
    const id = setInterval(() => {
      frame++;
      setCompassSpread(Math.min(1, frame / total));
      if (frame >= total) { clearInterval(id); setAnimDone(true); }
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  // Arc sweep animation for task2-arc2 (right side, triggered by click)
  useEffect(() => {
    if (phase !== 'task2-arc2' || !arcTriggered) return;
    setArcSweep(0);
    let cancelled = false;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame++;
      setArcSweep(Math.min(1, frame / total));
      if (frame >= total) {
        clearInterval(id);
        if (!cancelled) {
          setSssArcs(prev => prev.length < 2 ? [...prev, { center: SSS_RIGHT, radius: SSS_C }] : prev);
          setAnimDone(true);
        }
      }
    }, 16);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase, arcTriggered]);

  // Congruent animation: trace once (3s), then flash and solidify
  useEffect(() => {
    if (phase !== 'task2-congruent') { setCongruentDone(false); return; }
    setCongruentDone(false);
    const timer = setTimeout(() => { setCongruentDone(true); setAnimDone(true); }, 3500);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const click = { x: svgPt.x, y: svgPt.y };

    // Task 1
    if (phase === 'task1-ruler-tgt' && dist(click, T1_TGT_A) < 40) {
      setT1Done(true); playSound('success'); setPhase('task1-done');
    }

    // Task 2: pin → arc → vertex → connect
    // Compass hit test: check needle, pencil tip, and hinge
    const compassHit = (needle: Point, pencilTarget: Point, click: Point) => {
      const tiltFactor = 0.25;
      const hinge = { x: needle.x + (pencilTarget.x - needle.x) * tiltFactor, y: needle.y - 75 };
      return dist(click, needle) < 40 || dist(click, pencilTarget) < 40 || dist(click, hinge) < 40;
    };
    if (phase === 'task2-arc1' && !arcTriggered && compassHit(SSS_LEFT, { x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }, click)) {
      playSound('click'); setArcTriggered(true);
    } else if (phase === 'task2-arc2' && !arcTriggered && compassHit(SSS_RIGHT, { x: SSS_RIGHT.x - SSS_C, y: SSS_RIGHT.y }, click)) {
      playSound('click'); setArcTriggered(true);
    } else if (phase === 'task2-pin' && dist(click, SSS_LEFT) < 40) {
      playSound('click'); setPhase('task2-step0');
    } else if (phase === 'task2-pin2' && dist(click, SSS_RIGHT) < 40) {
      playSound('click'); setPhase('task2-open2');
    } else if (phase === 'task2-step2' && dist(click, SSS_TOP) < 40) {
      setSssVertex(SSS_TOP); playSound('click'); setPhase('task2-draw-l');
    } else if (phase === 'task2-draw-l' && dist(click, SSS_TOP) < 40) {
      setSssLines(prev => [...prev, { from: SSS_LEFT, to: SSS_TOP }]); playSound('click'); setPhase('task2-done-l');
    } else if (phase === 'task2-draw-r' && dist(click, SSS_TOP) < 40) {
      setSssLines(prev => [...prev, { from: SSS_RIGHT, to: SSS_TOP }]);
      playSound('success'); setPhase('task2-done-r');
    }

  }, [phase, arcTriggered, onComplete]);

  // Global step list across all tasks
  const ALL_STEPS: Phase[] = [
    'task1-show', 'task1-ruler-src', 'task1-ruler-tgt', 'task1-done',
    'task2-ruler', 'task2-pin', 'task2-step0', 'task2-arc1', 'task2-ruler2', 'task2-pin2', 'task2-open2', 'task2-arc2', 'task2-step2', 'task2-draw-l', 'task2-done-l', 'task2-draw-r', 'task2-done-r', 'task2-congruent',
    'task2-question', 'task2-puzzle', 'task2-puzzle-drag', 'task2-locked', 'task2-unlocked', 'task2-sss-done',
  ];
  const globalIdx = ALL_STEPS.indexOf(phase);
  const phaseAction = PHASE_ACTION[phase];
  // Drag phases: show next button when task-specific condition is met
  const dragDone = (phase === 'task2-puzzle-drag' && pzClosed)
    || (phase === 'task2-locked' && uqShowBtn)
    || (phase === 'task2-unlocked' && uqShowBtn);
  const canGoPrev = globalIdx > 0;
  const canGoNext = globalIdx >= 0 && globalIdx < ALL_STEPS.length - 1
    && (phaseAction === 'info' || (phaseAction === 'auto' && animDone) || (phaseAction === 'drag' && dragDone)
      || ((phase === 'task2-arc1' || phase === 'task2-arc2') && animDone));

  // Reset all state for a clean task switch
  const resetTask1 = () => { setT1Done(false); };
  const resetTask2 = () => { setSssLines([]); setSssArcs([]); setSssVertex(null); };
  const resetPuzzle = () => {
    setPzClosed(false);
    setPz3Snap(null); setPz4Snap(null);
    setPz3({ p1: { x: 340, y: 100 }, p2: { x: 460, y: 100 } });
    setPz4({ p1: { x: 360, y: 160 }, p2: { x: 520, y: 160 } });
  };
  const resetUnique = () => {
    setUqR(UQ_R_FIXED); setUqP(UQ_P); setUqQ(UQ_Q);
    setUqArcFlash(false); setUqShowHint(false); setUqShowBtn(false);
    uqDragCount.current = 0; uqDragRef.current = null;
  };

  // Apply cumulative state so the target step renders correctly
  const applyStateForStep = useCallback((target: Phase) => {
    // Task 1
    if (target === 'task1-show') { resetTask1(); }
    else if (target === 'task1-ruler-src') { resetTask1(); }
    else if (target === 'task1-ruler-tgt') { resetTask1(); }
    else if (target === 'task1-done') { resetTask1(); setT1Done(true); }
    // Task 2
    else if (target === 'task2-ruler') { resetTask2(); setCompassSpread(0); setArcSweep(0); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-pin') { resetTask2(); setCompassSpread(0); setArcSweep(0); }
    else if (target === 'task2-step0') { resetTask2(); setCompassSpread(0); setArcSweep(0); }
    else if (target === 'task2-arc1') { resetTask2(); setCompassSpread(1); setArcSweep(0); }
    else if (target === 'task2-ruler2') { setSssLines([]); setSssVertex(null); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }]); setCompassSpread(0); setArcSweep(0); }
    else if (target === 'task2-pin2') { setSssLines([]); setSssVertex(null); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }]); setCompassSpread(0); setArcSweep(0); }
    else if (target === 'task2-open2') { setSssLines([]); setSssVertex(null); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }]); setCompassSpread(0); setArcSweep(0); }
    else if (target === 'task2-arc2') { setSssLines([]); setSssVertex(null); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }]); setCompassSpread(1); setArcSweep(0); }
    else if (target === 'task2-step2') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); }
    else if (target === 'task2-draw-l') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); setSssVertex(SSS_TOP); }
    else if (target === 'task2-done-l') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); setSssVertex(SSS_TOP); setSssLines([{ from: SSS_LEFT, to: SSS_TOP }]); }
    else if (target === 'task2-draw-r') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); setSssVertex(SSS_TOP); setSssLines([{ from: SSS_LEFT, to: SSS_TOP }]); }
    else if (target === 'task2-done-r') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); setSssVertex(SSS_TOP); setSssLines([{ from: SSS_LEFT, to: SSS_TOP }, { from: SSS_RIGHT, to: SSS_TOP }]); }
    else if (target === 'task2-congruent') { resetTask2(); setSssArcs([{ center: SSS_LEFT, radius: SSS_B }, { center: SSS_RIGHT, radius: SSS_C }]); setSssVertex(SSS_TOP); setSssLines([{ from: SSS_LEFT, to: SSS_TOP }, { from: SSS_RIGHT, to: SSS_TOP }]); }
    else if (target === 'task2-question') { resetTask2(); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-puzzle') { resetTask2(); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-puzzle-drag') { resetTask2(); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-locked') { resetTask2(); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-unlocked') { resetTask2(); resetPuzzle(); resetUnique(); }
    else if (target === 'task2-sss-done') { resetTask2(); resetPuzzle(); resetUnique(); }
  }, []);

  const goToPrevStep = useCallback(() => {
    if (globalIdx <= 0) return;
    // Skip auto phases when going back
    let prevIdx = globalIdx - 1;
    while (prevIdx > 0 && PHASE_ACTION[ALL_STEPS[prevIdx]] === 'auto') prevIdx--;
    const prev = ALL_STEPS[prevIdx];
    applyStateForStep(prev);
    playSound('click');
    setPhase(prev);
  }, [globalIdx, applyStateForStep]);

  const goToNextStep = useCallback(() => {
    if (globalIdx < 0 || globalIdx >= ALL_STEPS.length - 1) return;
    const next = ALL_STEPS[globalIdx + 1];
    applyStateForStep(next);
    playSound('click');
    setPhase(next);
  }, [globalIdx, applyStateForStep]);

  const isLastStep = globalIdx === ALL_STEPS.length - 1;

  // Check if unlocked triangle matches 3-4-5
  const uqSides = [dist(uqP, uqQ) / UNIT, dist(uqP, uqR) / UNIT, dist(uqQ, uqR) / UNIT]
    .map(s => Math.round(s * 10) / 10).sort((a, b) => a - b);
  const uqIsInt = (v: number) => Math.abs(v - Math.round(v)) < 0.001;
  const uqAllMatch = uqIsInt(uqSides[0]) && uqIsInt(uqSides[1]) && uqIsInt(uqSides[2])
    && Math.round(uqSides[0]) === 3 && Math.round(uqSides[1]) === 4 && Math.round(uqSides[2]) === 5;

  const hintText = STEP_HINTS[phase] ?? '';
  const taskNum = phase.startsWith('task1') ? 1 : 2;
  const actionLabel = (phaseAction === 'auto' && animDone) || (phaseAction === 'drag' && dragDone) ? ACTION_LABELS.info : ACTION_LABELS[phaseAction];

  const getTarget = (): Point | null => {
    // Only show pulsing target for action phases (click-svg)
    if (phaseAction !== 'action') return null;
    if (phase === 'task1-ruler-tgt') return T1_TGT_A;
    if (phase === 'task2-pin') return SSS_LEFT;
    if (phase === 'task2-pin2') return SSS_RIGHT;
    if (phase === 'task2-step2' || phase === 'task2-draw-l' || phase === 'task2-draw-r') return SSS_TOP;
    return null;
  };
  const target = getTarget();

  // SSS exploration modules — full takeover with nav overlay
  const isModulePhase = ['task2-question', 'task2-puzzle', 'task2-puzzle-drag', 'task2-locked', 'task2-unlocked', 'task2-sss-done'].includes(phase);
  if (isModulePhase) {
    const moduleActionLabel = (phaseAction === 'drag' && dragDone) ? ACTION_LABELS.info : ACTION_LABELS[phaseAction];
    const moduleHint = pzClosed && phase === 'task2-puzzle-drag' ? '拼好了！跟原件形狀完全一樣。' : hintText;
    const moduleHintColor = pzClosed && phase === 'task2-puzzle-drag' ? '#10B981' : '#3d5a80';
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-main)',
        padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)', gap: 'clamp(6px, 1vmin, 10px)', boxSizing: 'border-box',
        touchAction: 'none' }}>

        {/* Question card — inline, not modal */}
        {phase === 'task2-question' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'clamp(16px, 4vmin, 40px) clamp(20px, 5vmin, 48px)',
            background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
            animation: 'fadeSlideIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: 'clamp(16px, 2.8vmin, 20px)', lineHeight: 1.8, color: '#293241', textAlign: 'center' }}>
              你用三條邊做出了一模一樣的三角形。
              <br />但為什麼三條邊一樣，就一定是全等三角形？
              <br />有沒有可能做出不同的？
            </div>
          </div>
        )}

        {/* ═══ Puzzle: drag segments freely, snap to base endpoints ═══ */}
        {(phase === 'task2-puzzle' || phase === 'task2-puzzle-drag') && (() => {
          const SNAP = 14;
          const seg3Len = 3 * UNIT; // 120px
          const seg4Len = 4 * UNIT; // 160px
          const toSvg = (e: React.PointerEvent): Point | null => {
            const svg = pzSvgRef.current;
            if (!svg) return null;
            const ctm = svg.getScreenCTM();
            if (!ctm) return null;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const svgPt = pt.matrixTransform(ctm.inverse());
            return { x: svgPt.x, y: svgPt.y };
          };
          const clp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
          const onDown = (e: React.PointerEvent, seg: '3' | '4') => {
            if (pzClosed) return;
            e.preventDefault(); e.stopPropagation();
            // Capture on SVG so onPointerMove/onPointerUp on SVG still fire
            pzSvgRef.current?.setPointerCapture(e.pointerId);
            const pt = toSvg(e);
            if (!pt) return;
            const cur = seg === '3' ? pz3 : pz4;
            pzDragRef.current = { seg, startMouse: pt, startP1: { ...cur.p1 }, startP2: { ...cur.p2 } };
          };
          const onMove = (e: React.PointerEvent) => {
            const d = pzDragRef.current;
            if (!d) return;
            const pt = toSvg(e);
            if (!pt) return;
            const segLen = d.seg === '3' ? seg3Len : seg4Len;
            const snap = d.seg === '3' ? pz3Snap : pz4Snap;
            const setCur = d.seg === '3' ? setPz3 : setPz4;
            const target = d.seg === '3' ? PZ_BASE_L : PZ_BASE_R;

            if (snap) {
              // Snapped: rotate around anchor point
              const ang = Math.atan2(pt.y - target.y, pt.x - target.x);
              const free = { x: clp(target.x + segLen * Math.cos(ang), 10, 540), y: clp(target.y + segLen * Math.sin(ang), 10, 310) };
              setCur(snap === 'p1' ? { p1: target, p2: free } : { p1: free, p2: target });
              // Check triangle closure with updated position
              const otherSnap = d.seg === '3' ? pz4Snap : pz3Snap;
              if (otherSnap && !pzClosed) {
                const otherSeg = d.seg === '3' ? pz4 : pz3;
                const otherTarget = d.seg === '3' ? PZ_BASE_R : PZ_BASE_L;
                const otherFree = otherSnap === 'p1' ? otherSeg.p2 : otherSeg.p1;
                if (dist(free, otherFree) < 10) {
                  const avg = { x: (free.x + otherFree.x) / 2, y: (free.y + otherFree.y) / 2 };
                  setCur(snap === 'p1' ? { p1: target, p2: avg } : { p1: avg, p2: target });
                  const setOther = d.seg === '3' ? setPz4 : setPz3;
                  setOther(otherSnap === 'p1' ? { p1: otherTarget, p2: avg } : { p1: avg, p2: otherTarget });
                  setPzClosed(true); playSound('success'); pzDragRef.current = null;
                }
              }
            } else {
              // Not snapped: translate entire segment
              const dx = pt.x - d.startMouse.x, dy = pt.y - d.startMouse.y;
              const np1 = { x: clp(d.startP1.x + dx, 10, 540), y: clp(d.startP1.y + dy, 10, 310) };
              const np2 = { x: clp(d.startP2.x + dx, 10, 540), y: clp(d.startP2.y + dy, 10, 310) };
              setCur({ p1: np1, p2: np2 });
              // Check if either end gets near target snap point
              const setSnap = d.seg === '3' ? setPz3Snap : setPz4Snap;
              if (dist(np1, target) < SNAP) {
                const ang = Math.atan2(np2.y - target.y, np2.x - target.x);
                setCur({ p1: target, p2: { x: target.x + segLen * Math.cos(ang), y: target.y + segLen * Math.sin(ang) } });
                setSnap('p1'); playSound('click');
              } else if (dist(np2, target) < SNAP) {
                const ang = Math.atan2(np1.y - target.y, np1.x - target.x);
                setCur({ p1: { x: target.x + segLen * Math.cos(ang), y: target.y + segLen * Math.sin(ang) }, p2: target });
                setSnap('p2'); playSound('click');
              }
            }
          };
          const onUp = () => { pzDragRef.current = null; };
          const free3 = pz3Snap ? (pz3Snap === 'p1' ? pz3.p2 : pz3.p1) : null;
          const free4 = pz4Snap ? (pz4Snap === 'p1' ? pz4.p2 : pz4.p1) : null;
          const hint = !pz3Snap && !pz4Snap ? '拖動線段，把端點靠近底邊兩端會自動吸附'
            : !pz3Snap || !pz4Snap ? '再把另一條也接上去'
            : !pzClosed ? '轉動線段，讓兩個自由端碰在一起'
            : '拼好了！跟原件完全一樣。';

          return (
              <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
                <svg ref={pzSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                  onPointerMove={phase === 'task2-puzzle-drag' ? onMove : undefined} onPointerUp={phase === 'task2-puzzle-drag' ? onUp : undefined} onPointerLeave={phase === 'task2-puzzle-drag' ? onUp : undefined}>

                  {/* Left: original triangle */}
                  <OriginalTriangle />

                  {phase !== 'task2-puzzle-drag' ? (
                    <>
                      {/* Step 1: Show 3 lines — 5 aligned with original base */}
                      <line x1={340} y1={80} x2={460} y2={80} stroke="#534AB7" strokeWidth={6} strokeLinecap="round" />
                      <text x={400} y={68} textAnchor="middle" className="font-en" fontSize="15" fontWeight="700" fill="#534AB7">3</text>

                      <line x1={330} y1={130} x2={490} y2={130} stroke="#0F6E56" strokeWidth={6} strokeLinecap="round" />
                      <text x={410} y={118} textAnchor="middle" className="font-en" fontSize="15" fontWeight="700" fill="#0F6E56">4</text>

                      <line x1={PZ_BASE_L.x} y1={T1_SRC_A.y} x2={PZ_BASE_R.x} y2={T1_SRC_A.y} stroke="#3d5a80" strokeWidth={6} strokeLinecap="round" />
                      <text x={(PZ_BASE_L.x + PZ_BASE_R.x) / 2} y={T1_SRC_A.y - 12} textAnchor="middle" className="font-en" fontSize="15" fontWeight="700" fill="#3d5a80">5</text>
                    </>
                  ) : (
                    <>
                      {/* Step 2: Base fixed, drag 3 & 4 to snap */}
                      <line x1={PZ_BASE_L.x} y1={PZ_BASE_L.y} x2={PZ_BASE_R.x} y2={PZ_BASE_R.y} stroke="#3d5a80" strokeWidth={6} strokeLinecap="round" />
                      <circle cx={PZ_BASE_L.x} cy={PZ_BASE_L.y} r={5} fill="#3d5a80" />
                      <circle cx={PZ_BASE_R.x} cy={PZ_BASE_R.y} r={5} fill="#3d5a80" />
                      <text x={(PZ_BASE_L.x + PZ_BASE_R.x) / 2} y={PZ_BASE_L.y + 20} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill="#3d5a80">5</text>

                      {/* Pulsing snap hints — purple for 3, green for 4 */}
                  {!pz3Snap && (
                    <circle cx={PZ_BASE_L.x} cy={PZ_BASE_L.y} r={18} fill="none" stroke="#534AB7" strokeWidth={2} opacity={0.4}
                      style={{ animation: 'pulse-hint 1.5s ease-in-out infinite' }} />
                  )}
                  {!pz4Snap && (
                    <circle cx={PZ_BASE_R.x} cy={PZ_BASE_R.y} r={18} fill="none" stroke="#0F6E56" strokeWidth={2} opacity={0.4}
                      style={{ animation: 'pulse-hint 1.5s ease-in-out infinite' }} />
                  )}
                  {pz3Snap && pz4Snap && !pzClosed && free3 && free4 && (
                    <>
                      <circle cx={free3.x} cy={free3.y} r={20} fill="none" stroke="#ee6c4d" strokeWidth={2} opacity={0.3}
                        style={{ animation: 'pulse-hint 1.5s ease-in-out infinite' }} />
                      <circle cx={free4.x} cy={free4.y} r={20} fill="none" stroke="#ee6c4d" strokeWidth={2} opacity={0.3}
                        style={{ animation: 'pulse-hint 1.2s ease-in-out infinite' }} />
                    </>
                  )}

                  {/* Segment 3 (purple) — always visible, drag body */}
                  <g>
                    <line x1={pz3.p1.x} y1={pz3.p1.y} x2={pz3.p2.x} y2={pz3.p2.y}
                      stroke="transparent" strokeWidth={28} strokeLinecap="round"
                      style={{ cursor: pzClosed ? 'default' : 'grab' }}
                      onPointerDown={e => onDown(e, '3')} />
                    <line x1={pz3.p1.x} y1={pz3.p1.y} x2={pz3.p2.x} y2={pz3.p2.y}
                      stroke="#534AB7" strokeWidth={6} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                    <text x={(pz3.p1.x + pz3.p2.x) / 2} y={(pz3.p1.y + pz3.p2.y) / 2 - 10}
                      textAnchor="middle" className="font-en" fontSize="14" fontWeight="700" fill="#534AB7" style={{ pointerEvents: 'none' }}>3</text>
                  </g>

                  {/* Segment 4 (teal) — always visible, drag body */}
                  <g>
                    <line x1={pz4.p1.x} y1={pz4.p1.y} x2={pz4.p2.x} y2={pz4.p2.y}
                      stroke="transparent" strokeWidth={28} strokeLinecap="round"
                      style={{ cursor: pzClosed ? 'default' : 'grab' }}
                      onPointerDown={e => onDown(e, '4')} />
                    <line x1={pz4.p1.x} y1={pz4.p1.y} x2={pz4.p2.x} y2={pz4.p2.y}
                      stroke="#0F6E56" strokeWidth={6} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                    <text x={(pz4.p1.x + pz4.p2.x) / 2} y={(pz4.p1.y + pz4.p2.y) / 2 - 10}
                      textAnchor="middle" className="font-en" fontSize="14" fontWeight="700" fill="#0F6E56" style={{ pointerEvents: 'none' }}>4</text>
                  </g>

                      {/* Done: filled triangle with draw-on stroke */}
                      {pzClosed && free3 && (() => {
                        const perim = Math.round(
                          dist(PZ_BASE_L, PZ_BASE_R) + dist(PZ_BASE_R, free3) + dist(free3, PZ_BASE_L)
                        );
                        return (
                          <>
                            <polygon points={`${PZ_BASE_L.x},${PZ_BASE_L.y} ${PZ_BASE_R.x},${PZ_BASE_R.y} ${free3.x},${free3.y}`}
                              fill="#98c1d9" fillOpacity={0} stroke="none"
                              style={{ animation: 'puzzleFill 0.6s ease-out 0.8s forwards' }} />
                            <polygon points={`${PZ_BASE_L.x},${PZ_BASE_L.y} ${PZ_BASE_R.x},${PZ_BASE_R.y} ${free3.x},${free3.y}`}
                              fill="none" stroke="#3d5a80" strokeWidth={2.5}
                              strokeDasharray={perim} strokeDashoffset={perim}
                              style={{ animation: 'drawLine 1s ease-out forwards' }} />
                          </>
                        );
                      })()}
                    </>
                  )}
                </svg>

              </div>
          );
        })()}

        {/* ═══ Locked drag: all 3 vertices draggable but locked ═══ */}
        {phase === 'task2-locked' && (() => {
          const onDownL = (e: React.PointerEvent) => {
            e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId);
            uqDragRef.current = 'r'; playSound('click');
          };
          const onMoveL = (e: React.PointerEvent) => {
            if (!uqDragRef.current) return;
            const ox = (Math.random() - 0.5) * 4, oy = (Math.random() - 0.5) * 4;
            setUqR({ x: UQ_R_FIXED.x + ox, y: UQ_R_FIXED.y + oy });
            setUqArcFlash(true); setTimeout(() => setUqArcFlash(false), 150);
          };
          const onUpL = () => {
            if (!uqDragRef.current) return;
            uqDragRef.current = null; setUqR(UQ_R_FIXED);
            uqDragCount.current++;
            if (uqDragCount.current >= 3) setUqShowHint(true);
            if (uqDragCount.current >= 5) setUqShowBtn(true);
          };
          // Shake offset applied to all vertices when dragging
          const shk = uqDragRef.current ? { x: uqR.x - UQ_R_FIXED.x, y: uqR.y - UQ_R_FIXED.y } : { x: 0, y: 0 };
          const pShk = { x: UQ_P.x + shk.x, y: UQ_P.y + shk.y };
          const qShk = { x: UQ_Q.x + shk.x, y: UQ_Q.y + shk.y };
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg ref={uqSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}>
                {/* Left: original triangle (原件) */}
                <OriginalTriangle />

                {/* Right: triangle (shakes together) */}
                <polygon points={`${pShk.x},${pShk.y} ${qShk.x},${qShk.y} ${uqR.x},${uqR.y}`} fill="#98c1d9" fillOpacity={0.1} stroke="#3d5a80" strokeWidth={1.5} />
                <text x={(pShk.x + qShk.x) / 2} y={pShk.y + 18} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill="#3d5a80">5</text>
                <text x={(pShk.x + uqR.x) / 2 - 14} y={(pShk.y + uqR.y) / 2} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill="#3d5a80">3</text>
                <text x={(qShk.x + uqR.x) / 2 + 14} y={(qShk.y + uqR.y) / 2} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill="#3d5a80">4</text>
                {/* All 3 draggable vertices (no labels, just dots) */}
                {[pShk, qShk, uqR].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={8} fill="white" stroke="#ee6c4d" strokeWidth={2}
                    style={{ cursor: 'grab' }} onPointerDown={onDownL} onPointerMove={onMoveL} onPointerUp={onUpL} />
                ))}
              </svg>
              {uqShowHint && (
                <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.9)', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                  三條邊的長度鎖死了，頂點只能待在固定位置上。
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ Unlocked drag: vertices move freely ═══ */}
        {phase === 'task2-unlocked' && (() => {
          const toSvg = (e: React.PointerEvent): Point | null => {
            const svg = uqSvgRef.current;
            if (!svg) return null;
            const ctm = svg.getScreenCTM();
            if (!ctm) return null;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const svgPt = pt.matrixTransform(ctm.inverse());
            return { x: svgPt.x, y: svgPt.y };
          };
          const onDownU = (e: React.PointerEvent, which: 'p' | 'q' | 'r') => {
            e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId);
            uqDragRef.current = which; playSound('click');
          };
          const onMoveU = (e: React.PointerEvent) => {
            if (!uqDragRef.current) return;
            const pt = toSvg(e);
            if (!pt) return;
            const clamped = { x: Math.max(280, Math.min(540, pt.x)), y: Math.max(30, Math.min(290, pt.y)) };
            if (uqDragRef.current === 'p') setUqP(clamped);
            else if (uqDragRef.current === 'q') setUqQ(clamped);
            else setUqR(clamped);
          };
          const onUpU = () => {
            if (!uqDragRef.current) return;
            uqDragRef.current = null;
            uqDragCount.current++;
            if (uqDragCount.current >= 3) setUqShowHint(true);
            if (uqDragCount.current >= 5) setUqShowBtn(true);
          };
          // Compute all 3 side lengths
          const sA = Math.round(dist(uqP, uqQ) / UNIT * 10) / 10; // base
          const sB = Math.round(dist(uqP, uqR) / UNIT * 10) / 10; // left
          const sC = Math.round(dist(uqQ, uqR) / UNIT * 10) / 10; // right
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg ref={uqSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                onPointerMove={onMoveU} onPointerUp={onUpU}>
                {/* Left: original triangle (原件) */}
                <OriginalTriangle />

                {/* Right: ghost original (fixed position, dashed) */}
                <polygon points={`${UQ_P.x},${UQ_P.y} ${UQ_Q.x},${UQ_Q.y} ${UQ_R_FIXED.x},${UQ_R_FIXED.y}`}
                  fill="#98c1d9" fillOpacity={0.12} stroke="#98c1d9" strokeWidth={1} strokeDasharray="4 3" />
                {/* Right: current triangle */}
                <line x1={uqP.x} y1={uqP.y} x2={uqQ.x} y2={uqQ.y} stroke={uqAllMatch ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={uqAllMatch ? undefined : '4 3'} />
                <line x1={uqP.x} y1={uqP.y} x2={uqR.x} y2={uqR.y} stroke={uqAllMatch ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={uqAllMatch ? undefined : '4 3'} />
                <line x1={uqQ.x} y1={uqQ.y} x2={uqR.x} y2={uqR.y} stroke={uqAllMatch ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={uqAllMatch ? undefined : '4 3'} />
                <text x={(uqP.x + uqQ.x) / 2} y={Math.max(uqP.y, uqQ.y) + 18} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill={uqAllMatch ? '#3d5a80' : '#ee6c4d'}>{sA}</text>
                <text x={(uqP.x + uqR.x) / 2 - 14} y={(uqP.y + uqR.y) / 2} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill={uqAllMatch ? '#3d5a80' : '#ee6c4d'}>{sB}</text>
                <text x={(uqQ.x + uqR.x) / 2 + 14} y={(uqQ.y + uqR.y) / 2} textAnchor="middle" className="font-en" fontSize="13" fontWeight="700" fill={uqAllMatch ? '#3d5a80' : '#ee6c4d'}>{sC}</text>
                {/* All 3 draggable vertices */}
                <circle cx={uqP.x} cy={uqP.y} r={8} fill="white" stroke="#ee6c4d" strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'p')} />
                <circle cx={uqQ.x} cy={uqQ.y} r={8} fill="white" stroke="#ee6c4d" strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'q')} />
                <circle cx={uqR.x} cy={uqR.y} r={8} fill="white" stroke="#ee6c4d" strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'r')} />
              </svg>
              {(uqShowHint || uqAllMatch) && (
                <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                  background: uqAllMatch ? 'rgba(16,185,129,0.9)' : 'rgba(41,50,65,0.9)', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                  {uqAllMatch ? '當兩個三角形邊長相同，就會是全等三角形' : '邊長一變，三角形就變了——跟原來的不一樣了。'}
                </div>
              )}
            </div>
          );
        })()}

        {/* SSS conclusion */}
        {phase === 'task2-sss-done' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 4vmin, 40px) clamp(20px, 5vmin, 48px)',
            background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
            animation: 'fadeSlideIn 0.4s ease-out',
          }}>
            <div style={{ fontSize: 'clamp(16px, 2.8vmin, 20px)', lineHeight: 1.8, color: '#293241', textAlign: 'center' }}>
              三條邊的長度固定 → 頂點只有一個位置
              <br /><strong>→ 三角形只有一種</strong>
              <br /><br />邊長一旦改變 → 三角形就不一樣了
            </div>
          </div>
        )}

        {/* Bottom floating action bar for module phases */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
          height: 'clamp(60px, 9vmin, 72px)', padding: '0 clamp(14px, 2.5vmin, 20px)',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
        }}>
          {/* Progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E5E7EB', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((globalIdx + 1) / ALL_STEPS.length) * 100}%`, background: '#ee6c4d', transition: 'width 0.3s ease' }} />
          </div>
          {/* Prev button — always rendered to reserve space, hidden when not available */}
          <button onClick={canGoPrev ? goToPrevStep : undefined} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
            cursor: canGoPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, padding: 0, visibility: canGoPrev ? 'visible' : 'hidden',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          {/* Pill label */}
          <span style={{
            padding: '2px 10px', borderRadius: 6, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 700,
            background: moduleActionLabel.bg, color: moduleActionLabel.color, flexShrink: 0, whiteSpace: 'nowrap',
          }}>{moduleActionLabel.text}</span>
          {/* Hint text */}
          <span style={{ flex: 1, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 600, color: moduleHintColor }}>
            {moduleHint}
          </span>
          {/* Next / Complete button — always rendered to reserve space */}
          <button onClick={isLastStep ? onComplete : canGoNext ? goToNextStep : undefined} style={{
            height: 'clamp(40px, 6vmin, 48px)', padding: '0 clamp(14px, 2.5vmin, 20px)', borderRadius: 10,
            border: 'none', background: isLastStep ? '#10B981' : '#3d5a80', color: 'white',
            cursor: (canGoNext || isLastStep) ? 'pointer' : 'default', fontWeight: 700, fontSize: 'clamp(15px, 2.5vmin, 18px)',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            visibility: (canGoNext || isLastStep) ? 'visible' : 'hidden',
          }}>
            {isLastStep ? '完成' : '下一步'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(6px, 1vmin, 10px)',
      fontFamily: 'var(--font-main)', position: 'relative',
      touchAction: 'none',
    }}>
      {/* SVG — now first (top), instruction bar moved to bottom */}
      <div style={{
        flex: 1, minHeight: 0, background: 'white', borderRadius: 16,
        border: '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        <svg
          viewBox="0 0 550 320"
          style={{ width: '100%', height: '100%', cursor: target ? 'pointer' : 'default', touchAction: 'none' }}
          onClick={phaseAction === 'action' ? handleSvgClick : undefined}
        >

          {/* ═══ Task 1 ═══ */}
          {phase.startsWith('task1') && (
            <>
              <OriginalTriangle showDots />

              {/* Ruler measuring source base */}
              {phase === 'task1-ruler-src' && (
                <RulerTool from={T1_SRC_A} to={T1_SRC_B} />
              )}

              {/* Ruler on target side (stays visible when done) */}
              {(phase === 'task1-ruler-tgt' || phase === 'task1-done') && (
                <RulerTool from={T1_TGT_A} to={T1_TGT_B} />
              )}

              {/* Target area — dashed guide, then draw-on animation left→right when done */}
              {!t1Done && (
                <line x1={T1_TGT_A.x} y1={T1_TGT_A.y} x2={T1_TGT_B.x} y2={T1_TGT_B.y}
                  stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5 4" />
              )}
              {t1Done && (
                <line x1={T1_TGT_A.x} y1={T1_TGT_A.y} x2={T1_TGT_B.x} y2={T1_TGT_B.y}
                  stroke="#10B981" strokeWidth={3}
                  strokeDasharray={T1_LEN} strokeDashoffset={T1_LEN}
                  style={{ animation: 'drawLine 0.8s ease-out forwards' }} />
              )}
              <circle cx={T1_TGT_A.x} cy={T1_TGT_A.y} r="4" fill={t1Done ? '#10B981' : '#94A3B8'} />
              {t1Done && <circle cx={T1_TGT_B.x} cy={T1_TGT_B.y} r="4" fill="#10B981" />}
              <text x={(T1_TGT_A.x + T1_TGT_B.x) / 2} y={T1_TGT_A.y + 60}
                textAnchor="middle" fontSize="13" fontWeight="900" fill={t1Done ? '#10B981' : '#94A3B8'}>
                {t1Done ? '複製完成！' : '目標位置'}
              </text>
            </>
          )}

          {/* Task 1 left-side result persists during Task 2 & 3 */}
          {phase.startsWith('task2') && (
            <>
              <OriginalTriangle showDots />
              {/* Copied base line */}
              <line x1={T1_TGT_A.x} y1={T1_TGT_A.y} x2={T1_TGT_B.x} y2={T1_TGT_B.y}
                stroke="#94A3B8" strokeWidth="2.5" />
              <circle cx={T1_TGT_A.x} cy={T1_TGT_A.y} r="4" fill="#94A3B8" />
              <circle cx={T1_TGT_B.x} cy={T1_TGT_B.y} r="4" fill="#94A3B8" />
            </>
          )}

          {/* ═══ Task 2: SSS ═══ */}
          {phase.startsWith('task2') && (
            <>
              {/* Ruler on original triangle left edge (length 3) during task2-ruler */}
              {phase === 'task2-ruler' && (
                <RulerTool from={T1_SRC_A} to={T1_SRC_C} />
              )}
              {/* Ruler on original triangle right edge (length 4) during task2-ruler2 */}
              {phase === 'task2-ruler2' && (
                <RulerTool from={T1_SRC_B} to={T1_SRC_C} />
              )}
              {/* Bottom ruler: hidden during ruler/pin/line draw/done phases */}
              {phase !== 'task2-ruler' && phase !== 'task2-ruler2' && phase !== 'task2-pin' && phase !== 'task2-pin2' && phase !== 'task2-step2' && phase !== 'task2-draw-l' && phase !== 'task2-done-l' && phase !== 'task2-draw-r' && phase !== 'task2-done-r' && phase !== 'task2-congruent' && (
                (phase === 'task2-open2' || phase === 'task2-arc2')
                  ? <RulerTool from={{ x: SSS_LEFT.x + UNIT, y: SSS_LEFT.y }} to={{ x: SSS_RIGHT.x + UNIT, y: SSS_RIGHT.y }} />
                  : <RulerTool from={SSS_LEFT} to={SSS_RIGHT} />
              )}

              {sssLines.map((l, i) => {
                const isNewLeft = phase === 'task2-done-l' && l.from === SSS_LEFT && l.to === SSS_TOP;
                const isNewRight = phase === 'task2-done-r' && l.from === SSS_RIGHT && l.to === SSS_TOP;
                const lineLen = Math.round(dist(l.from, l.to));
                if (isNewLeft || isNewRight) {
                  return (
                    <line key={`sl${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
                      stroke="#ee6c4d" strokeWidth="3"
                      strokeDasharray={lineLen} strokeDashoffset={lineLen}
                      style={{ animation: `drawLine 0.8s ease-out forwards` }} />
                  );
                }
                return <line key={`sl${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke="#94A3B8" strokeWidth="2.5" />;
              })}

              {/* Side labels on drawn lines */}
              <text x={(SSS_LEFT.x + SSS_RIGHT.x) / 2} y={SSS_LEFT.y - 10}
                textAnchor="middle" className="font-en" fontSize="11" fontWeight="700" fill="#94A3B8">5</text>
              {sssLines.some(l => l.from === SSS_LEFT && l.to === SSS_TOP) && (
                <text x={(SSS_LEFT.x + SSS_TOP.x) / 2 - 10} y={(SSS_LEFT.y + SSS_TOP.y) / 2}
                  textAnchor="end" className="font-en" fontSize="11" fontWeight="700" fill="#94A3B8">3</text>
              )}
              {sssLines.some(l => l.from === SSS_RIGHT && l.to === SSS_TOP) && (
                <text x={(SSS_RIGHT.x + SSS_TOP.x) / 2 + 10} y={(SSS_RIGHT.y + SSS_TOP.y) / 2}
                  textAnchor="start" className="font-en" fontSize="11" fontWeight="700" fill="#94A3B8">4</text>
              )}
              {phase !== 'task2-congruent' && sssArcs.map((arc, i) => {
                // Hide the arc that's currently being animated (avoid double render)
                if (i === 0 && phase === 'task2-arc1') return null;
                if (i === 1 && phase === 'task2-arc2') return null;
                const cx = arc.center.x;
                const cy = arc.center.y;
                const r = arc.radius;
                const arcAngle = (i === 0 ? 90 : 70) * Math.PI / 180;
                if (i === 0) {
                  const endX = cx + r * Math.cos(-arcAngle);
                  const endY = cy + r * Math.sin(-arcAngle);
                  return (
                    <path key={`sa${i}`}
                      d={`M ${cx + r},${cy} A ${r},${r} 0 0,0 ${endX},${endY}`}
                      fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  );
                } else {
                  const endX = cx + r * Math.cos(Math.PI - arcAngle);
                  const endY = cy - r * Math.sin(Math.PI - arcAngle);
                  return (
                    <path key={`sa${i}`}
                      d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${endX},${endY}`}
                      fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  );
                }
              })}
              {phase !== 'task2-congruent' && sssVertex && <circle cx={sssVertex.x} cy={sssVertex.y} r="5" fill="#ee6c4d" />}

              {/* Tools */}
              {phase === 'task2-pin' && <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }} spread={0} closed />}
              {phase === 'task2-step0' && <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }} spread={compassSpread} />}
              {/* Arc drawing animation: idle compass until clicked, then sweep */}
              {phase === 'task2-arc1' && (() => {
                if (!arcTriggered) {
                  return <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }} spread={1} />;
                }
                const cx = SSS_LEFT.x, cy = SSS_LEFT.y, r = SSS_B;
                const maxAngle = 90 * Math.PI / 180;
                const angle = arcSweep * maxAngle;
                const px = cx + r * Math.cos(-angle);
                const py = cy + r * Math.sin(-angle);
                const largeArc = angle > Math.PI ? 1 : 0;
                const arcPath = arcSweep > 0.01
                  ? `M ${cx + r},${cy} A ${r},${r} 0 ${largeArc},0 ${px},${py}`
                  : '';
                return (
                  <>
                    <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: px, y: py }} spread={1} />
                    {arcPath && <path d={arcPath} fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />}
                  </>
                );
              })()}
              {/* Right side compass: pin2 → open2 → arc2 */}
              {phase === 'task2-pin2' && <AnimatedCompass needle={SSS_RIGHT} pencilTarget={{ x: SSS_RIGHT.x - SSS_C, y: SSS_RIGHT.y }} spread={0} closed />}
              {phase === 'task2-open2' && <AnimatedCompass needle={SSS_RIGHT} pencilTarget={{ x: SSS_RIGHT.x - SSS_C, y: SSS_RIGHT.y }} spread={compassSpread} />}
              {phase === 'task2-arc2' && (() => {
                if (!arcTriggered) {
                  return <AnimatedCompass needle={SSS_RIGHT} pencilTarget={{ x: SSS_RIGHT.x - SSS_C, y: SSS_RIGHT.y }} spread={1} />;
                }
                const cx = SSS_RIGHT.x, cy = SSS_RIGHT.y, r = SSS_C;
                const maxAngle = 70 * Math.PI / 180;
                const angle = arcSweep * maxAngle;
                const startX = cx - r, startY = cy;
                const px = cx + r * Math.cos(Math.PI - angle);
                const py = cy - r * Math.sin(Math.PI - angle);
                const largeArc = angle > Math.PI ? 1 : 0;
                const arcPath = arcSweep > 0.01
                  ? `M ${startX},${startY} A ${r},${r} 0 ${largeArc},1 ${px},${py}`
                  : '';
                return (
                  <>
                    <AnimatedCompass needle={SSS_RIGHT} pencilTarget={{ x: px, y: py }} spread={1} />
                    {arcPath && <path d={arcPath} fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />}
                  </>
                );
              })()}
              {phase === 'task2-draw-l' && sssVertex && <RulerTool from={SSS_LEFT} to={sssVertex} />}
              {phase === 'task2-draw-r' && sssVertex && <RulerTool from={SSS_RIGHT} to={sssVertex} />}

              {/* Congruent animation */}
              {phase === 'task2-congruent' && (() => {
                const leftTri = `M ${T1_SRC_A.x},${T1_SRC_A.y} L ${T1_SRC_C.x},${T1_SRC_C.y} L ${T1_SRC_B.x},${T1_SRC_B.y} Z`;
                const rightTri = `M ${SSS_LEFT.x},${SSS_LEFT.y} L ${SSS_TOP.x},${SSS_TOP.y} L ${SSS_RIGHT.x},${SSS_RIGHT.y} Z`;
                const perim = SSS_B + SSS_C + SSS_A;
                const rightColor = congruentDone ? '#3d5a80' : '#94A3B8';
                return (
                  <>
                    {/* Right triangle solid (gray → dark blue after animation) */}
                    <polygon points={`${SSS_LEFT.x},${SSS_LEFT.y} ${SSS_TOP.x},${SSS_TOP.y} ${SSS_RIGHT.x},${SSS_RIGHT.y}`}
                      fill={congruentDone ? '#98c1d9' : 'none'} fillOpacity="0.08"
                      stroke={rightColor} strokeWidth="2.5"
                      style={{ transition: 'stroke 0.5s, fill 0.5s' }} />
                    {/* Vertex dots */}
                    <circle cx={SSS_LEFT.x} cy={SSS_LEFT.y} r="4" fill={rightColor} style={{ transition: 'fill 0.5s' }} />
                    <circle cx={SSS_RIGHT.x} cy={SSS_RIGHT.y} r="4" fill={rightColor} style={{ transition: 'fill 0.5s' }} />
                    <circle cx={SSS_TOP.x} cy={SSS_TOP.y} r="4" fill={rightColor} style={{ transition: 'fill 0.5s' }} />
                    {/* Side labels */}
                    <text x={(SSS_LEFT.x + SSS_TOP.x) / 2 - 10} y={(SSS_LEFT.y + SSS_TOP.y) / 2}
                      textAnchor="end" className="font-en" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>3</text>
                    <text x={(SSS_RIGHT.x + SSS_TOP.x) / 2 + 10} y={(SSS_RIGHT.y + SSS_TOP.y) / 2}
                      textAnchor="start" className="font-en" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>4</text>
                    <text x={(SSS_LEFT.x + SSS_RIGHT.x) / 2} y={SSS_LEFT.y - 10}
                      textAnchor="middle" className="font-en" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>5</text>

                    {/* Tracing animation (only before done) */}
                    {!congruentDone && (
                      <>
                        {/* Stroke trails behind the dot — both use linear timing */}
                        <path d={leftTri} fill="none" stroke="#67E8F9" strokeWidth="3"
                          strokeDasharray={perim} strokeDashoffset={perim}
                          style={{ animation: 'traceStroke 3s linear forwards' }} />
                        <path d={rightTri} fill="none" stroke="#67E8F9" strokeWidth="3"
                          strokeDasharray={perim} strokeDashoffset={perim}
                          style={{ animation: 'traceStroke 3s linear forwards' }} />
                        {/* Dots lead the way */}
                        <circle r="5" fill="#67E8F9"
                          style={{ offsetPath: `path('${leftTri}')`, animation: 'traceDot 3s linear forwards' } as React.CSSProperties} />
                        <circle r="5" fill="#67E8F9"
                          style={{ offsetPath: `path('${rightTri}')`, animation: 'traceDot 3s linear forwards' } as React.CSSProperties} />
                      </>
                    )}

                    {/* Glow fill when done */}
                    {congruentDone && (
                      <>
                        <polygon points={`${T1_SRC_A.x},${T1_SRC_A.y} ${T1_SRC_C.x},${T1_SRC_C.y} ${T1_SRC_B.x},${T1_SRC_B.y}`}
                          fill="#67E8F9" stroke="none"
                          style={{ animation: 'glowFill 1s ease-out forwards' }} />
                        <polygon points={`${SSS_LEFT.x},${SSS_LEFT.y} ${SSS_TOP.x},${SSS_TOP.y} ${SSS_RIGHT.x},${SSS_RIGHT.y}`}
                          fill="#67E8F9" stroke="none"
                          style={{ animation: 'glowFill 1s ease-out forwards' }} />
                      </>
                    )}

                    {/* Label */}
                    <text x={(SSS_LEFT.x + SSS_RIGHT.x) / 2} y={SSS_LEFT.y + 60}
                      textAnchor="middle" fontSize="13" fontWeight="900" fill="#3d5a80"
                      style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                      全等三角形
                    </text>
                  </>
                );
              })()}
            </>
          )}


          {/* Pulsing target for action phases */}
          {target && (
            <>
              <circle cx={target.x} cy={target.y} r="20"
                fill="none" stroke="#ee6c4d" strokeWidth="2" opacity="0.4"
                style={{ animation: 'pulse-hint 1.5s ease-in-out infinite' }} />
              <circle cx={target.x} cy={target.y} r="8" fill="#ee6c4d" fillOpacity="0.15" />
            </>
          )}
        </svg>
      </div>

      {/* Bottom floating action bar */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        height: 'clamp(60px, 9vmin, 72px)', padding: '0 clamp(14px, 2.5vmin, 20px)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E5E7EB', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((globalIdx + 1) / ALL_STEPS.length) * 100}%`, background: '#ee6c4d', transition: 'width 0.3s ease' }} />
        </div>
        {/* Prev button — always rendered to reserve space, hidden when not available */}
        <button onClick={canGoPrev ? goToPrevStep : undefined} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
          cursor: canGoPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, padding: 0, visibility: canGoPrev ? 'visible' : 'hidden',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {/* Pill label */}
        <span style={{
          padding: '2px 10px', borderRadius: 6, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 700,
          background: actionLabel.bg, color: actionLabel.color, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{actionLabel.text}</span>
        {/* Task name + hint */}
        <span style={{ flex: 1, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 600, color: '#3d5a80', lineHeight: 1.4 }}>
          {hintText}
        </span>
        {/* Next button — always rendered to reserve space */}
        <button onClick={canGoNext ? goToNextStep : undefined} style={{
          height: 'clamp(40px, 6vmin, 48px)', padding: '0 clamp(14px, 2.5vmin, 20px)', borderRadius: 10,
          border: 'none', background: '#3d5a80', color: 'white',
          cursor: canGoNext ? 'pointer' : 'default', fontWeight: 700, fontSize: 'clamp(15px, 2.5vmin, 18px)',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          visibility: canGoNext ? 'visible' : 'hidden',
        }}>
          下一步
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}
