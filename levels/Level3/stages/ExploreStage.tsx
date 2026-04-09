import { useState, useCallback, useEffect, useRef } from 'react';
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

// SAS builds on the same copied base line
const SAS_VALS = { a: 5, b: 4, angle: 50 };
const SAS_A_PX = SAS_VALS.a * UNIT;
const SAS_B_PX = SAS_VALS.b * UNIT;
const SAS_LEFT = T1_TGT_A;
const SAS_RIGHT = T1_TGT_B;
const sasRad = SAS_VALS.angle * Math.PI / 180;
const SAS_TOP = { x: SAS_LEFT.x + SAS_B_PX * Math.cos(sasRad), y: SAS_LEFT.y - SAS_B_PX * Math.sin(sasRad) };

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
  const rulerW = 24;
  return (
    <g style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      <polygon
        points={`${from.x},${from.y} ${rulerEnd.x},${rulerEnd.y} ${rulerEnd.x + nx * rulerW},${rulerEnd.y + ny * rulerW} ${from.x + nx * rulerW},${from.y + ny * rulerW}`}
        fill="#e8e5dc" fillOpacity="0.7" stroke="#B0A898" strokeWidth="1"
      />
      <line x1={from.x} y1={from.y} x2={rulerEnd.x} y2={rulerEnd.y} stroke="#3d5a80" strokeWidth="1" opacity="0.4" />
      {Array.from({ length: units + 1 }, (_, i) => {
        const t = i / units;
        const tickLen = rulerW * 0.45;
        const tx = from.x + ux * rulerLen * t;
        const ty = from.y + uy * rulerLen * t;
        return (
          <g key={i}>
            <line
              x1={tx} y1={ty}
              x2={tx + nx * tickLen} y2={ty + ny * tickLen}
              stroke="#8A7F72" strokeWidth="0.7" />
            <text
              x={tx + nx * (tickLen + 3)} y={ty + ny * (tickLen + 3) + 1}
              textAnchor="middle" fontSize="7" fontWeight="600" fill="#8A7F72">{i}</text>
          </g>
        );
      })}
    </g>
  );
}

// ═══ Protractor ═══
function ProtractorTool({ center, angle }: { center: Point; angle: number }) {
  const r = 40;
  return (
    <g style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      <path d={`M ${center.x + r},${center.y} A ${r},${r} 0 0,0 ${center.x - r},${center.y}`}
        fill="#fef3c7" fillOpacity="0.5" stroke="#d97706" strokeWidth="1" />
      {[0, 30, 60, 90, 120, 150, 180].map(deg => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={deg}
            x1={center.x + r * 0.75 * Math.cos(-rad)} y1={center.y + r * 0.75 * Math.sin(-rad)}
            x2={center.x + r * Math.cos(-rad)} y2={center.y + r * Math.sin(-rad)}
            stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
        );
      })}
      <text x={center.x + 12} y={center.y - r + 5} fontSize="9" fill="#d97706" fontWeight="700">{angle}°</text>
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
  // Task 3: SAS
  | 'task3-step0' | 'task3-step1' | 'task3-step2' | 'task3-step3';

const TASK_NAMES: Record<number, string> = {
  1: '複製線段',
  2: `SSS 作圖　已知三角形邊長分別為 ${SSS_VALS.a}、${SSS_VALS.b}、${SSS_VALS.c}`,
  3: `SAS 作圖　已知：a = ${SAS_VALS.a}、b = ${SAS_VALS.b}、夾角 = ${SAS_VALS.angle}°`,
};

const STEP_HINTS: Record<string, string> = {
  'task1-show': '這是原件——一個 3、4、5 的直角三角形。先來複製底邊！',
  'task1-ruler-src': '用直尺量出底邊長度 = 5',
  'task1-ruler-tgt': '把直尺移到右邊，點擊目標起點畫出長度 5 的線段',
  'task1-done': '底邊複製完成！',
  'task2-ruler': `底邊已複製好了（長度 ${SSS_VALS.a}）。用直尺量出 ${SSS_VALS.b}`,
  'task2-pin': '把圓規的針腳釘在左端點上',
  'task2-step0': `圓規已張開到 ${SSS_VALS.b}，點擊畫弧`,
  'task2-arc1': `半徑 ${SSS_VALS.b} 的弧畫好了！`,
  'task2-pin2': '把圓規的針腳釘在右端點上',
  'task2-open2': `圓規已張開到 ${SSS_VALS.c}，點擊畫弧`,
  'task2-arc2': `半徑 ${SSS_VALS.c} 的弧畫好了！`,
  'task2-step2': '兩弧的交叉點就是第三個頂點 → 點擊交叉點',
  'task2-draw-l': '用直尺把左邊連起來 → 點擊頂點',
  'task2-done-l': '左邊畫好了！',
  'task2-draw-r': '用直尺把右邊連起來 → 點擊頂點',
  'task2-done-r': 'SSS 三角形完成！',
  'task2-congruent': '三邊相等，形狀完全一樣——這就是 SSS 全等！',
  'task2-question': '為什麼三條邊一樣就一定全等？',
  'task2-puzzle': '這是三條邊長分別為 3、4、5 的線段',
  'task2-puzzle-drag': '把 3 和 4 拖到 5 的兩個端點上，拼出三角形',
  'task2-locked': '邊長被鎖定了（3、4、5）。試著拖動任何一個頂點看看？',
  'task2-unlocked': '現在邊長可以變了，拖動頂點看看',
  'task2-sss-done': 'SSS 全等性質確認完成！',
  'task3-step0': '用直尺畫底邊 a → 點擊左端點',
  'task3-step1': `用量角器在左端點量出 ${SAS_VALS.angle}° → 點擊左端點`,
  'task3-step2': `沿著角度方向，用圓規量 b = ${SAS_VALS.b} → 點擊頂點`,
  'task3-step3': '用直尺連接右端點和頂點 → 點擊頂點',
};

export default function ExploreStage({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('task1-show');
  const [compassSpread, setCompassSpread] = useState(0);
  const [arcSweep, setArcSweep] = useState(0); // 0→1 for arc drawing animation
  const [congruentDone, setCongruentDone] = useState(false); // after trace animation completes

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

  // Uniqueness state (task2-locked / task2-unlocked)
  const UQ_P = { x: 80, y: 250 };
  const UQ_Q = { x: 280, y: 250 };
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

  // Task 3
  const [sasRayShown, setSasRayShown] = useState(false);
  const [sasVertex, setSasVertex] = useState<Point | null>(null);
  const [sasLines, setSasLines] = useState<{ from: Point; to: Point }[]>([]);

  // Compass opening animation for task2-step0
  useEffect(() => {
    if (phase !== 'task2-step0') return;
    setCompassSpread(0);
    let frame = 0;
    const total = 25;
    const id = setInterval(() => {
      frame++;
      setCompassSpread(Math.min(1, frame / total));
      if (frame >= total) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  // Arc sweep animation for task2-arc1
  useEffect(() => {
    if (phase !== 'task2-arc1') return;
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
        }
      }
    }, 16);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase]);

  // Compass opening animation for task2-open2 (right side)
  useEffect(() => {
    if (phase !== 'task2-open2') return;
    setCompassSpread(0);
    let frame = 0;
    const total = 25;
    const id = setInterval(() => {
      frame++;
      setCompassSpread(Math.min(1, frame / total));
      if (frame >= total) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  // Arc sweep animation for task2-arc2 (right side)
  useEffect(() => {
    if (phase !== 'task2-arc2') return;
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
        }
      }
    }, 16);
    return () => { cancelled = true; clearInterval(id); };
  }, [phase]);

  // Congruent animation: trace once (3s), then flash and solidify
  useEffect(() => {
    if (phase !== 'task2-congruent') { setCongruentDone(false); return; }
    setCongruentDone(false);
    const timer = setTimeout(() => setCongruentDone(true), 3500);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleDialogDone = useCallback(() => {
    // No more dialog phases — this is kept for safety
  }, [phase, onComplete]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const click = { x: svgPt.x, y: svgPt.y };

    // Task 1
    if (phase === 'task1-ruler-tgt' && dist(click, T1_TGT_A) < 30) {
      setT1Done(true); playSound('success'); setPhase('task1-done');
    }

    // Task 2: ruler → left arc (b=3) → right arc (c=4) → vertex → connect left → connect right
    if (phase === 'task2-pin' && click.x >= SSS_LEFT.x - 30 && click.x <= SSS_RIGHT.x + 30) {
      playSound('click'); setPhase('task2-step0');
    } else if (phase === 'task2-step0' && click.x >= SSS_LEFT.x - 30 && click.x <= SSS_RIGHT.x + 30) {
      playSound('click'); setPhase('task2-arc1');
    } else if (phase === 'task2-pin2' && click.x >= SSS_LEFT.x - 30 && click.x <= SSS_RIGHT.x + 30) {
      playSound('click'); setPhase('task2-open2');
    } else if (phase === 'task2-open2' && click.x >= SSS_LEFT.x - 30 && click.x <= SSS_RIGHT.x + 30) {
      playSound('click'); setPhase('task2-arc2');
    } else if (phase === 'task2-step2' && dist(click, SSS_TOP) < 35) {
      setSssVertex(SSS_TOP); playSound('click'); setPhase('task2-draw-l');
    } else if (phase === 'task2-draw-l' && dist(click, SSS_TOP) < 35) {
      setSssLines(prev => [...prev, { from: SSS_LEFT, to: SSS_TOP }]); playSound('click'); setPhase('task2-done-l');
    } else if (phase === 'task2-draw-r' && dist(click, SSS_TOP) < 35) {
      setSssLines(prev => [...prev, { from: SSS_RIGHT, to: SSS_TOP }]);
      playSound('success'); setPhase('task2-done-r');
    }

    // Task 3
    if (phase === 'task3-step0' && dist(click, SAS_LEFT) < 30) {
      setSasLines([{ from: SAS_LEFT, to: SAS_RIGHT }]); playSound('click'); setPhase('task3-step1');
    } else if (phase === 'task3-step1' && dist(click, SAS_LEFT) < 30) {
      setSasRayShown(true); playSound('click'); setPhase('task3-step2');
    } else if (phase === 'task3-step2' && dist(click, SAS_TOP) < 35) {
      setSasVertex(SAS_TOP); playSound('click'); setPhase('task3-step3');
    } else if (phase === 'task3-step3' && dist(click, SAS_TOP) < 35) {
      setSasLines(prev => [...prev, { from: SAS_LEFT, to: SAS_TOP }, { from: SAS_RIGHT, to: SAS_TOP }]);
      playSound('success');
      setTimeout(() => onComplete(), 1000);
    }
  }, [phase, onComplete]);

  const isAutoPhase = false;

  // Global step list across all tasks
  const ALL_STEPS: Phase[] = [
    'task1-show', 'task1-ruler-src', 'task1-ruler-tgt', 'task1-done',
    'task2-ruler', 'task2-pin', 'task2-step0', 'task2-arc1', 'task2-pin2', 'task2-open2', 'task2-arc2', 'task2-step2', 'task2-draw-l', 'task2-done-l', 'task2-draw-r', 'task2-done-r', 'task2-congruent',
    'task2-question', 'task2-puzzle', 'task2-puzzle-drag', 'task2-locked', 'task2-unlocked', 'task2-sss-done',
    'task3-step0', 'task3-step1', 'task3-step2', 'task3-step3',
  ];
  const globalIdx = ALL_STEPS.indexOf(phase);
  const canGoPrev = globalIdx > 0 && !isAutoPhase;
  const canGoNext = globalIdx >= 0 && globalIdx < ALL_STEPS.length - 1 && !isAutoPhase;

  // Reset all state for a clean task switch
  const resetTask1 = () => { setT1Done(false); };
  const resetTask2 = () => { setSssLines([]); setSssArcs([]); setSssVertex(null); };
  const resetTask3 = () => { setSasLines([]); setSasRayShown(false); setSasVertex(null); };
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
    // Task 3
    else if (target === 'task3-step0') { resetTask3(); }
    else if (target === 'task3-step1') { resetTask3(); setSasLines([{ from: SAS_LEFT, to: SAS_RIGHT }]); }
    else if (target === 'task3-step2') { resetTask3(); setSasLines([{ from: SAS_LEFT, to: SAS_RIGHT }]); setSasRayShown(true); }
    else if (target === 'task3-step3') { resetTask3(); setSasLines([{ from: SAS_LEFT, to: SAS_RIGHT }]); setSasRayShown(true); setSasVertex(SAS_TOP); }
  }, []);

  // Phases that have useEffect animations — just set the phase, don't apply final state
  const ANIM_PHASES: Phase[] = ['task2-step0', 'task2-open2'];

  const goToPrevStep = useCallback(() => {
    if (globalIdx <= 0) return;
    // Skip over animation-only phases when going back
    let prevIdx = globalIdx - 1;
    while (prevIdx > 0 && ANIM_PHASES.includes(ALL_STEPS[prevIdx])) {
      prevIdx--;
    }
    const prev = ALL_STEPS[prevIdx];
    applyStateForStep(prev);
    playSound('click');
    setPhase(prev);
  }, [globalIdx, applyStateForStep]);

  const goToNextStep = useCallback(() => {
    if (globalIdx < 0 || globalIdx >= ALL_STEPS.length - 1) return;
    const next = ALL_STEPS[globalIdx + 1];
    // For animation phases, set the base state first then let useEffect animate
    applyStateForStep(next);
    playSound('click');
    setPhase(next);
  }, [globalIdx, applyStateForStep]);

  const isDialog = false;
  const dialogLines = null;
  const hintText = STEP_HINTS[phase] ?? '';
  const taskNum = phase.startsWith('task1') ? 1 : phase.startsWith('task2') ? 2 : 3;

  const getTarget = (): Point | null => {
    if (phase === 'task1-ruler-tgt') return T1_TGT_A;
    if (phase === 'task2-pin') return SSS_LEFT;
    if (phase === 'task2-step0') return { x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y };
    if (phase === 'task2-pin2') return SSS_RIGHT;
    if (phase === 'task2-open2') return { x: SSS_RIGHT.x - SSS_C, y: SSS_RIGHT.y };
    if (phase === 'task2-step2' || phase === 'task2-draw-l' || phase === 'task2-draw-r') return SSS_TOP;
    if (phase === 'task3-step0' || phase === 'task3-step1') return SAS_LEFT;
    if (phase === 'task3-step2' || phase === 'task3-step3') return SAS_TOP;
    return null;
  };
  const target = getTarget();

  // SSS exploration modules — full takeover with nav overlay
  const isModulePhase = ['task2-question', 'task2-puzzle', 'task2-puzzle-drag', 'task2-locked', 'task2-unlocked', 'task2-sss-done'].includes(phase);
  if (isModulePhase) {
    const navBtnStyle: React.CSSProperties = {
      height: 34, padding: '0 14px', borderRadius: 8,
      border: '1.5px solid #D1D5DB', background: 'white', color: '#4B5563',
      cursor: 'pointer', fontWeight: 700, fontSize: 14,
      fontFamily: 'var(--font-main)',
      display: 'flex', alignItems: 'center', gap: 4,
    };
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-main)',
        padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)', gap: 'clamp(6px, 1vmin, 10px)', boxSizing: 'border-box' }}>
        {/* Module instruction bar with nav buttons */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
          padding: 'clamp(10px, 2vmin, 16px)', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 900, color: '#293241' }}>
              {TASK_NAMES[taskNum]}
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.6vmin, 14px)', color: pzClosed && phase === 'task2-puzzle-drag' ? '#10B981' : '#64748B', marginTop: 2 }}>
              {pzClosed && phase === 'task2-puzzle-drag' ? '拼好了！跟原件形狀完全一樣。' : hintText}
            </div>
          </div>
          {canGoPrev && (
            <button onClick={goToPrevStep} style={navBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
              上一步
            </button>
          )}
          {canGoNext && (
            <button onClick={goToNextStep} style={navBtnStyle}>
              下一步
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
        </div>

        {/* Question card */}
        {phase === 'task2-question' && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(16px, 3vmin, 32px)',
          }}>
            <div style={{
              background: 'white', borderRadius: 16, padding: '32px 36px',
              maxWidth: 400, textAlign: 'center', border: '1px solid #E5E7EB',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: 'fadeSlideIn 0.3s ease-out',
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: '#293241', marginBottom: 24 }}>
                你用三條邊做出了一模一樣的三角形。
                <br />但為什麼三條邊一樣，就一定是全等三角形？
                <br />有沒有可能做出不同的？
              </div>
              <button onClick={() => { playSound('click'); setPhase('task2-puzzle'); }} style={{
                background: '#ee6c4d', color: 'white', border: 'none',
                borderRadius: 10, padding: '10px 24px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                試試看 →
              </button>
            </div>
          </div>
        )}

        {/* ═══ Puzzle: drag segments freely, snap to base endpoints ═══ */}
        {(phase === 'task2-puzzle' || phase === 'task2-puzzle-drag') && (() => {
          const SNAP = 24;
          const seg3Len = 3 * UNIT; // 120px
          const seg4Len = 4 * UNIT; // 160px
          const toSvg = (e: React.PointerEvent): Point | null => {
            const svg = pzSvgRef.current;
            if (!svg) return null;
            const ctm = svg.getScreenCTM();
            if (!ctm) return null;
            const inv = ctm.inverse();
            return { x: inv.a * e.clientX + inv.c * e.clientY + inv.e, y: inv.b * e.clientX + inv.d * e.clientY + inv.f };
          };
          const clp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
          const onDown = (e: React.PointerEvent, seg: '3' | '4') => {
            if (pzClosed) return;
            e.preventDefault(); e.stopPropagation();
            (e.target as Element).setPointerCapture(e.pointerId);
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
                if (dist(free, otherFree) < 16) {
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
                  <polygon points={`${T1_SRC_A.x},${T1_SRC_A.y} ${T1_SRC_B.x},${T1_SRC_B.y} ${T1_SRC_C.x},${T1_SRC_C.y}`}
                    fill="#98c1d9" fillOpacity="0.08" stroke="#3d5a80" strokeWidth="2" />
                  <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#3d5a80">5</text>
                  <text x={(T1_SRC_A.x + T1_SRC_C.x) / 2 - 10} y={(T1_SRC_A.y + T1_SRC_C.y) / 2} textAnchor="end" fontSize="11" fontWeight="700" fill="#3d5a80">3</text>
                  <text x={(T1_SRC_B.x + T1_SRC_C.x) / 2 + 10} y={(T1_SRC_B.y + T1_SRC_C.y) / 2} textAnchor="start" fontSize="11" fontWeight="700" fill="#3d5a80">4</text>
                  <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y + 40} textAnchor="middle" fontSize="12" fontWeight="900" fill="#3d5a80">原件</text>

                  {phase !== 'task2-puzzle-drag' ? (
                    <>
                      {/* Step 1: Show 3 lines — 5 aligned with original base */}
                      <line x1={340} y1={80} x2={460} y2={80} stroke="#534AB7" strokeWidth={6} strokeLinecap="round" />
                      <text x={400} y={68} textAnchor="middle" fontSize="15" fontWeight="700" fill="#534AB7">3</text>

                      <line x1={330} y1={130} x2={490} y2={130} stroke="#0F6E56" strokeWidth={6} strokeLinecap="round" />
                      <text x={410} y={118} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0F6E56">4</text>

                      <line x1={PZ_BASE_L.x} y1={T1_SRC_A.y} x2={PZ_BASE_R.x} y2={T1_SRC_A.y} stroke="#3d5a80" strokeWidth={6} strokeLinecap="round" />
                      <text x={(PZ_BASE_L.x + PZ_BASE_R.x) / 2} y={T1_SRC_A.y - 12} textAnchor="middle" fontSize="15" fontWeight="700" fill="#3d5a80">5</text>
                    </>
                  ) : (
                    <>
                      {/* Step 2: Base fixed, drag 3 & 4 to snap */}
                      <line x1={PZ_BASE_L.x} y1={PZ_BASE_L.y} x2={PZ_BASE_R.x} y2={PZ_BASE_R.y} stroke="#3d5a80" strokeWidth={6} strokeLinecap="round" />
                      <circle cx={PZ_BASE_L.x} cy={PZ_BASE_L.y} r={5} fill="#3d5a80" />
                      <circle cx={PZ_BASE_R.x} cy={PZ_BASE_R.y} r={5} fill="#3d5a80" />
                      <text x={(PZ_BASE_L.x + PZ_BASE_R.x) / 2} y={PZ_BASE_L.y + 20} textAnchor="middle" fontSize="13" fontWeight="700" fill="#3d5a80">5</text>

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
                      textAnchor="middle" fontSize="14" fontWeight="700" fill="#534AB7" style={{ pointerEvents: 'none' }}>3</text>
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
                      textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F6E56" style={{ pointerEvents: 'none' }}>4</text>
                  </g>

                      {/* Done: filled triangle */}
                      {pzClosed && free3 && (
                        <polygon points={`${PZ_BASE_L.x},${PZ_BASE_L.y} ${PZ_BASE_R.x},${PZ_BASE_R.y} ${free3.x},${free3.y}`}
                          fill="#98c1d9" fillOpacity={0.15} stroke="#3d5a80" strokeWidth={2}
                          style={{ animation: 'fadeSlideIn 0.3s ease-out' }} />
                      )}
                    </>
                  )}
                </svg>

              </div>
          );
        })()}

        {/* ═══ Locked drag: all 3 vertices draggable but locked ═══ */}
        {phase === 'task2-locked' && (() => {
          const [shakeOff, setShakeOff] = [{ x: 0, y: 0 }, (v: Point) => {}]; // placeholder, use uqR for shake
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
          const bMid = { x: (UQ_P.x + UQ_Q.x) / 2, y: UQ_P.y + 18 };
          const lMid = { x: (UQ_P.x + uqR.x) / 2 - 14, y: (UQ_P.y + uqR.y) / 2 };
          const rMid = { x: (UQ_Q.x + uqR.x) / 2 + 14, y: (UQ_Q.y + uqR.y) / 2 };
          // Shake offset applied to all vertices when dragging
          const shk = uqDragRef.current ? { x: uqR.x - UQ_R_FIXED.x, y: uqR.y - UQ_R_FIXED.y } : { x: 0, y: 0 };
          const pShk = { x: UQ_P.x + shk.x, y: UQ_P.y + shk.y };
          const qShk = { x: UQ_Q.x + shk.x, y: UQ_Q.y + shk.y };
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg ref={uqSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}>
                {/* Triangle (shakes together) */}
                <polygon points={`${pShk.x},${pShk.y} ${qShk.x},${qShk.y} ${uqR.x},${uqR.y}`} fill="#98c1d9" fillOpacity={0.1} stroke="#3d5a80" strokeWidth={1.5} />
                <text x={(pShk.x + qShk.x) / 2} y={pShk.y + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="#3d5a80">5</text>
                <text x={(pShk.x + uqR.x) / 2 - 14} y={(pShk.y + uqR.y) / 2} textAnchor="middle" fontSize="13" fontWeight="700" fill="#3d5a80">3</text>
                <text x={(qShk.x + uqR.x) / 2 + 14} y={(qShk.y + uqR.y) / 2} textAnchor="middle" fontSize="13" fontWeight="700" fill="#3d5a80">4</text>
                {/* All 3 draggable vertices (no labels, just dots) */}
                {[pShk, qShk, uqR].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={8} fill="white" stroke="#3d5a80" strokeWidth={2}
                    style={{ cursor: 'grab' }} onPointerDown={onDownL} onPointerMove={onMoveL} onPointerUp={onUpL} />
                ))}
              </svg>
              {uqShowHint && (
                <div style={{ position: 'absolute', bottom: uqShowBtn ? 60 : 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.9)', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                  三條邊的長度鎖死了，頂點只能待在固定位置上。
                </div>
              )}
              {uqShowBtn && (
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                  <button onClick={() => { playSound('click'); setUqR(UQ_R_FIXED); setUqP(UQ_P); setUqQ(UQ_Q); setUqShowHint(false); setUqShowBtn(false); uqDragCount.current = 0; setPhase('task2-unlocked'); }} style={{
                    background: '#ee6c4d', color: 'white', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>如果邊長可以變呢？→</button>
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
            const inv = ctm.inverse();
            return { x: inv.a * e.clientX + inv.c * e.clientY + inv.e, y: inv.b * e.clientX + inv.d * e.clientY + inv.f };
          };
          const onDownU = (e: React.PointerEvent, which: 'p' | 'q' | 'r') => {
            e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId);
            uqDragRef.current = which; playSound('click');
          };
          const onMoveU = (e: React.PointerEvent) => {
            if (!uqDragRef.current) return;
            const pt = toSvg(e);
            if (!pt) return;
            const clamped = { x: Math.max(30, Math.min(520, pt.x)), y: Math.max(30, Math.min(280, pt.y)) };
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
          // Strict match: must be exactly the integer value (tolerance < 0.05)
          const aOk = Math.abs(sA - 5) < 0.05;
          const bOk = Math.abs(sB - 3) < 0.05;
          const cOk = Math.abs(sC - 4) < 0.05;
          const bMid = { x: (uqP.x + uqQ.x) / 2, y: Math.max(uqP.y, uqQ.y) + 18 };
          const lMid = { x: (uqP.x + uqR.x) / 2 - 14, y: (uqP.y + uqR.y) / 2 };
          const rMid = { x: (uqQ.x + uqR.x) / 2 + 14, y: (uqQ.y + uqR.y) / 2 };
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg ref={uqSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}>
                {/* Ghost original (fixed position) */}
                <polygon points={`${UQ_P.x},${UQ_P.y} ${UQ_Q.x},${UQ_Q.y} ${UQ_R_FIXED.x},${UQ_R_FIXED.y}`}
                  fill="#98c1d9" fillOpacity={0.12} stroke="#98c1d9" strokeWidth={1} strokeDasharray="4 3" />
                {/* Current triangle */}
                <line x1={uqP.x} y1={uqP.y} x2={uqQ.x} y2={uqQ.y} stroke={aOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={aOk ? undefined : '4 3'} />
                <line x1={uqP.x} y1={uqP.y} x2={uqR.x} y2={uqR.y} stroke={bOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={bOk ? undefined : '4 3'} />
                <line x1={uqQ.x} y1={uqQ.y} x2={uqR.x} y2={uqR.y} stroke={cOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={1.5} strokeDasharray={cOk ? undefined : '4 3'} />
                <text x={bMid.x} y={bMid.y} textAnchor="middle" fontSize="13" fontWeight="700" fill={aOk ? '#3d5a80' : '#ee6c4d'}>{sA}</text>
                <text x={lMid.x} y={lMid.y} textAnchor="middle" fontSize="13" fontWeight="700" fill={bOk ? '#3d5a80' : '#ee6c4d'}>{sB}</text>
                <text x={rMid.x} y={rMid.y} textAnchor="middle" fontSize="13" fontWeight="700" fill={cOk ? '#3d5a80' : '#ee6c4d'}>{sC}</text>
                {/* All 3 draggable vertices */}
                <circle cx={uqP.x} cy={uqP.y} r={8} fill="white" stroke={aOk && bOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'p')} onPointerMove={onMoveU} onPointerUp={onUpU} />
                <circle cx={uqQ.x} cy={uqQ.y} r={8} fill="white" stroke={aOk && cOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'q')} onPointerMove={onMoveU} onPointerUp={onUpU} />
                <circle cx={uqR.x} cy={uqR.y} r={8} fill="white" stroke={bOk && cOk ? '#3d5a80' : '#ee6c4d'} strokeWidth={2}
                  style={{ cursor: 'grab' }} onPointerDown={e => onDownU(e, 'r')} onPointerMove={onMoveU} onPointerUp={onUpU} />
              </svg>
              {uqShowHint && (
                <div style={{ position: 'absolute', bottom: uqShowBtn ? 60 : 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.9)', color: 'white', borderRadius: 10, padding: '8px 16px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '80%' }}>
                  邊長一變，三角形就變了——跟原來的不一樣了。
                </div>
              )}
              {uqShowBtn && (
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                  <button onClick={() => { playSound('click'); setPhase('task2-sss-done'); }} style={{
                    background: '#3d5a80', color: 'white', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>我懂了 →</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* SSS conclusion */}
        {phase === 'task2-sss-done' && (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            padding: 'clamp(16px, 3vmin, 32px)',
          }}>
            <div style={{
              background: '#E6F1FB', borderRadius: 14, padding: '24px 32px',
              maxWidth: 460, textAlign: 'center',
              animation: 'fadeSlideIn 0.4s ease-out',
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: '#0C447C' }}>
                三條邊的長度固定 → 頂點只有一個位置
                <br /><strong>→ 三角形只有一種</strong>
                <br /><br />邊長一旦改變 → 三角形就不一樣了
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(6px, 1vmin, 10px)',
      fontFamily: 'var(--font-main)', position: 'relative',
    }}>
      {/* Instruction bar */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        padding: 'clamp(14px, 3vmin, 22px) clamp(16px, 3vmin, 24px)',
        flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {!isDialog && (
          <div style={{ fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 900, color: '#293241' }}>
            {TASK_NAMES[taskNum]}
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 'clamp(13px, 2vmin, 16px)', fontWeight: 600, color: '#3d5a80',
        }}>
          {phase === 'task1-done' ? (
            <>
              <span style={{ color: '#10B981', flex: 1 }}>底邊複製完成！</span>
              {canGoPrev && (
                <button onClick={goToPrevStep} style={{
                  height: 'clamp(28px, 4.5vmin, 34px)', padding: '0 12px', borderRadius: 8,
                  border: '1.5px solid #D1D5DB', background: 'white', color: '#4B5563',
                  cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
                  上一步
                </button>
              )}
              {canGoNext && (
                <button onClick={goToNextStep} style={{
                  height: 'clamp(28px, 4.5vmin, 34px)', padding: '0 12px', borderRadius: 8,
                  border: '1.5px solid #D1D5DB', background: 'white', color: '#4B5563',
                  cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  下一步
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </>
          ) : !isDialog ? (
            <>
              <span style={{ flex: 1 }}>{hintText}</span>
              {canGoPrev && (
                <button onClick={goToPrevStep} style={{
                  height: 'clamp(28px, 4.5vmin, 34px)', padding: '0 12px', borderRadius: 8,
                  border: '1.5px solid #D1D5DB', background: 'white', color: '#4B5563',
                  cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
                  上一步
                </button>
              )}
              {canGoNext && (
                <button onClick={goToNextStep} style={{
                  height: 'clamp(28px, 4.5vmin, 34px)', padding: '0 12px', borderRadius: 8,
                  border: '1.5px solid #D1D5DB', background: 'white', color: '#4B5563',
                  cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  下一步
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </>
          ) : (
            <span style={{ color: '#94A3B8' }}>對話中...</span>
          )}
        </div>
      </div>

      {/* SVG */}
      <div style={{
        flex: 1, minHeight: 0, background: 'white', borderRadius: 16,
        border: '1px solid #E5E7EB', overflow: 'hidden',
      }}>
        <svg
          viewBox="0 0 550 320"
          style={{ width: '100%', height: '100%', cursor: target && !isAutoPhase ? 'pointer' : 'default' }}
          onClick={!isAutoPhase ? handleSvgClick : undefined}
        >
          {/* Grid */}
          {Array.from({ length: 14 }, (_, i) => Array.from({ length: 8 }, (_, j) => (
            <circle key={`g${i}-${j}`} cx={20 + i * 40} cy={20 + j * 40} r="1" fill="#E5E7EB" />
          ))).flat()}

          {/* ═══ Task 1 ═══ */}
          {phase.startsWith('task1') && (
            <>
              {/* 3-4-5 triangle (原件) */}
              <polygon points={`${T1_SRC_A.x},${T1_SRC_A.y} ${T1_SRC_B.x},${T1_SRC_B.y} ${T1_SRC_C.x},${T1_SRC_C.y}`}
                fill="#98c1d9" fillOpacity="0.08" stroke="#3d5a80" strokeWidth="2.5" />
              <circle cx={T1_SRC_A.x} cy={T1_SRC_A.y} r="4" fill="#3d5a80" />
              <circle cx={T1_SRC_B.x} cy={T1_SRC_B.y} r="4" fill="#3d5a80" />
              <circle cx={T1_SRC_C.x} cy={T1_SRC_C.y} r="4" fill="#3d5a80" />
              {/* Side labels */}
              <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2 - 20} y={T1_SRC_A.y - 20 + 4}
                textAnchor="middle" fontSize="11" fontWeight="700" fill="#3d5a80">5</text>
              <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y + 60}
                textAnchor="middle" fontSize="13" fontWeight="900" fill="#3d5a80">原件</text>
              <text x={(T1_SRC_A.x + T1_SRC_C.x) / 2 - 10} y={(T1_SRC_A.y + T1_SRC_C.y) / 2}
                textAnchor="end" fontSize="11" fontWeight="700" fill="#3d5a80">3</text>
              <text x={(T1_SRC_B.x + T1_SRC_C.x) / 2 + 10} y={(T1_SRC_B.y + T1_SRC_C.y) / 2}
                textAnchor="start" fontSize="11" fontWeight="700" fill="#3d5a80">4</text>

              {/* Ruler measuring source base */}
              {phase === 'task1-ruler-src' && (
                <RulerTool from={T1_SRC_A} to={T1_SRC_B} />
              )}

              {/* Ruler on target side (stays visible when done) */}
              {(phase === 'task1-ruler-tgt' || phase === 'task1-done') && (
                <RulerTool from={T1_TGT_A} to={T1_TGT_B} />
              )}

              {/* Target area */}
              <line x1={T1_TGT_A.x} y1={T1_TGT_A.y} x2={T1_TGT_B.x} y2={T1_TGT_B.y}
                stroke={t1Done ? '#10B981' : '#CBD5E1'} strokeWidth={t1Done ? 3 : 1.5}
                strokeDasharray={t1Done ? undefined : '5 4'}
                style={t1Done ? { animation: 'fadeSlideIn 0.3s ease-out' } : undefined} />
              <circle cx={T1_TGT_A.x} cy={T1_TGT_A.y} r="4" fill={t1Done ? '#10B981' : '#94A3B8'} />
              {t1Done && <circle cx={T1_TGT_B.x} cy={T1_TGT_B.y} r="4" fill="#10B981" />}
              <text x={(T1_TGT_A.x + T1_TGT_B.x) / 2} y={T1_TGT_A.y + 60}
                textAnchor="middle" fontSize="13" fontWeight="900" fill={t1Done ? '#10B981' : '#94A3B8'}>
                {t1Done ? '複製完成！' : '目標位置'}
              </text>
            </>
          )}

          {/* Task 1 left-side result persists during Task 2 & 3 */}
          {(phase.startsWith('task2') || phase.startsWith('task3')) && !isDialog && (
            <>
              {/* 3-4-5 triangle */}
              <polygon points={`${T1_SRC_A.x},${T1_SRC_A.y} ${T1_SRC_B.x},${T1_SRC_B.y} ${T1_SRC_C.x},${T1_SRC_C.y}`}
                fill="#98c1d9" fillOpacity="0.08" stroke="#3d5a80" strokeWidth="2.5" />
              <circle cx={T1_SRC_A.x} cy={T1_SRC_A.y} r="4" fill="#3d5a80" />
              <circle cx={T1_SRC_B.x} cy={T1_SRC_B.y} r="4" fill="#3d5a80" />
              <circle cx={T1_SRC_C.x} cy={T1_SRC_C.y} r="4" fill="#3d5a80" />
              <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2 - 20} y={T1_SRC_A.y - 20 + 4}
                textAnchor="middle" fontSize="11" fontWeight="700" fill="#3d5a80">5</text>
              <text x={(T1_SRC_A.x + T1_SRC_B.x) / 2} y={T1_SRC_A.y + 60}
                textAnchor="middle" fontSize="13" fontWeight="900" fill="#3d5a80">原件</text>
              <text x={(T1_SRC_A.x + T1_SRC_C.x) / 2 - 10} y={(T1_SRC_A.y + T1_SRC_C.y) / 2}
                textAnchor="end" fontSize="11" fontWeight="700" fill="#3d5a80">3</text>
              <text x={(T1_SRC_B.x + T1_SRC_C.x) / 2 + 10} y={(T1_SRC_B.y + T1_SRC_C.y) / 2}
                textAnchor="start" fontSize="11" fontWeight="700" fill="#3d5a80">4</text>
              {/* Copied base line */}
              <line x1={T1_TGT_A.x} y1={T1_TGT_A.y} x2={T1_TGT_B.x} y2={T1_TGT_B.y}
                stroke="#94A3B8" strokeWidth="2.5" />
              <circle cx={T1_TGT_A.x} cy={T1_TGT_A.y} r="4" fill="#94A3B8" />
              <circle cx={T1_TGT_B.x} cy={T1_TGT_B.y} r="4" fill="#94A3B8" />
            </>
          )}

          {/* ═══ Task 2: SSS ═══ */}
          {phase.startsWith('task2') && !isDialog && (
            <>
              {/* Bottom ruler: hidden during line draw/done phases */}
              {phase !== 'task2-draw-l' && phase !== 'task2-done-l' && phase !== 'task2-draw-r' && phase !== 'task2-done-r' && phase !== 'task2-congruent' && (
                (phase === 'task2-pin2' || phase === 'task2-open2' || phase === 'task2-arc2')
                  ? <RulerTool from={{ x: SSS_LEFT.x + UNIT, y: SSS_LEFT.y }} to={{ x: SSS_RIGHT.x + UNIT, y: SSS_RIGHT.y }} />
                  : <RulerTool from={SSS_LEFT} to={SSS_RIGHT} />
              )}

              {sssLines.map((l, i) => <line key={`sl${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke="#94A3B8" strokeWidth="2.5" />)}

              {/* Side labels on drawn lines */}
              <text x={(SSS_LEFT.x + SSS_RIGHT.x) / 2} y={SSS_LEFT.y - 10}
                textAnchor="middle" fontSize="11" fontWeight="700" fill="#94A3B8">5</text>
              {sssLines.some(l => l.from === SSS_LEFT && l.to === SSS_TOP) && (
                <text x={(SSS_LEFT.x + SSS_TOP.x) / 2 - 10} y={(SSS_LEFT.y + SSS_TOP.y) / 2}
                  textAnchor="end" fontSize="11" fontWeight="700" fill="#94A3B8">3</text>
              )}
              {sssLines.some(l => l.from === SSS_RIGHT && l.to === SSS_TOP) && (
                <text x={(SSS_RIGHT.x + SSS_TOP.x) / 2 + 10} y={(SSS_RIGHT.y + SSS_TOP.y) / 2}
                  textAnchor="start" fontSize="11" fontWeight="700" fill="#94A3B8">4</text>
              )}
              {phase !== 'task2-congruent' && sssArcs.map((arc, i) => {
                const cx = arc.center.x;
                const cy = arc.center.y;
                const r = arc.radius;
                const arcAngle = 110 * Math.PI / 180;
                if (i === 0) {
                  // Left arc: start from right (cx+r), sweep counterclockwise upward
                  const endX = cx + r * Math.cos(-arcAngle);
                  const endY = cy + r * Math.sin(-arcAngle);
                  return (
                    <path key={`sa${i}`}
                      d={`M ${cx + r},${cy} A ${r},${r} 0 0,0 ${endX},${endY}`}
                      fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  );
                } else {
                  // Right arc: start from left (cx-r), sweep clockwise upward
                  const endX = cx + r * Math.cos(Math.PI - arcAngle);
                  const endY = cy - r * Math.sin(Math.PI - arcAngle);
                  return (
                    <path key={`sa${i}`}
                      d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${endX},${endY}`}
                      fill="none" stroke="#7EC8E3" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  );
                }
              })}
              {phase !== 'task2-congruent' && sssVertex && <circle cx={sssVertex.x} cy={sssVertex.y} r="6" fill="#ee6c4d" stroke="white" strokeWidth="2" />}

              {/* Tools */}
              {phase === 'task2-pin' && <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }} spread={0} closed />}
              {phase === 'task2-step0' && <AnimatedCompass needle={SSS_LEFT} pencilTarget={{ x: SSS_LEFT.x + SSS_B, y: SSS_LEFT.y }} spread={compassSpread} />}
              {/* Arc drawing animation: compass rotates from 0° upward to 180° */}
              {phase === 'task2-arc1' && (() => {
                const cx = SSS_LEFT.x;
                const cy = SSS_LEFT.y;
                const r = SSS_B;
                // Sweep from 0 (right) counterclockwise to 110°
                const maxAngle = 110 * Math.PI / 180;
                const angle = arcSweep * maxAngle;
                const px = cx + r * Math.cos(-angle);
                const py = cy + r * Math.sin(-angle);
                // Arc path from (cx+r, cy) to current pencil position
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
                const cx = SSS_RIGHT.x;
                const cy = SSS_RIGHT.y;
                const r = SSS_C;
                const maxAngle = 110 * Math.PI / 180;
                const angle = arcSweep * maxAngle;
                // Start from left of center (π direction), sweep clockwise upward
                const startX = cx - r;
                const startY = cy;
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
                      textAnchor="end" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>3</text>
                    <text x={(SSS_RIGHT.x + SSS_TOP.x) / 2 + 10} y={(SSS_RIGHT.y + SSS_TOP.y) / 2}
                      textAnchor="start" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>4</text>
                    <text x={(SSS_LEFT.x + SSS_RIGHT.x) / 2} y={SSS_LEFT.y - 10}
                      textAnchor="middle" fontSize="11" fontWeight="700" fill={rightColor} style={{ transition: 'fill 0.5s' }}>5</text>

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

          {/* ═══ Task 3: SAS ═══ */}
          {phase.startsWith('task3') && !isDialog && (
            <>
              <text x={SAS_LEFT.x - 14} y={SAS_LEFT.y + 5}
                textAnchor="end" fontSize="13" fontWeight="900" fill="#3d5a80">原件</text>
              <polygon points={`${SAS_LEFT.x},${SAS_LEFT.y} ${SAS_RIGHT.x},${SAS_RIGHT.y} ${SAS_TOP.x},${SAS_TOP.y}`}
                fill="#98c1d9" fillOpacity="0.05" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 3" />
              <text x={(SAS_LEFT.x + SAS_RIGHT.x) / 2} y={SAS_LEFT.y + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#94A3B8">a = {SAS_VALS.a}</text>

              {sasLines.map((l, i) => <line key={`sl${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke="#3d5a80" strokeWidth="2.5" />)}

              {phase === 'task3-step0' && <RulerTool from={SAS_LEFT} to={SAS_RIGHT} />}
              {phase === 'task3-step1' && <ProtractorTool center={SAS_LEFT} angle={SAS_VALS.angle} />}

              {sasRayShown && (
                <>
                  <line x1={SAS_LEFT.x} y1={SAS_LEFT.y} x2={SAS_TOP.x + 30} y2={SAS_TOP.y - 15}
                    stroke="#ee6c4d" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />
                  {(() => {
                    const r = 25;
                    const end = { x: SAS_LEFT.x + r, y: SAS_LEFT.y };
                    const start = { x: SAS_LEFT.x + r * Math.cos(-sasRad), y: SAS_LEFT.y + r * Math.sin(-sasRad) };
                    return <path d={`M ${end.x},${end.y} A ${r},${r} 0 0,0 ${start.x},${start.y}`}
                      fill="none" stroke="#ee6c4d" strokeWidth="1.5" opacity="0.6" />;
                  })()}
                  <text x={SAS_LEFT.x + 32} y={SAS_LEFT.y - 12} fontSize="11" fontWeight="900" fill="#ee6c4d">{SAS_VALS.angle}°</text>
                </>
              )}

              {phase === 'task3-step2' && <AnimatedCompass needle={SAS_LEFT} pencilTarget={SAS_TOP} spread={1} />}
              {phase === 'task3-step3' && sasVertex && <RulerTool from={SAS_RIGHT} to={sasVertex} />}

              {sasVertex && <circle cx={sasVertex.x} cy={sasVertex.y} r="6" fill="#ee6c4d" stroke="white" strokeWidth="2" />}

              {/* Side b label */}
              {sasVertex && (
                <text x={(SAS_LEFT.x + SAS_TOP.x) / 2 - 12} y={(SAS_LEFT.y + SAS_TOP.y) / 2} fontSize="11" fontWeight="700" fill="#534AB7">b = {SAS_VALS.b}</text>
              )}
            </>
          )}

          {/* Pulsing target */}
          {target && !isAutoPhase && (
            <>
              <circle cx={target.x} cy={target.y} r="20"
                fill="none" stroke="#ee6c4d" strokeWidth="2" opacity="0.4"
                style={{ animation: 'pulse-hint 1.5s ease-in-out infinite' }} />
              <circle cx={target.x} cy={target.y} r="8" fill="#ee6c4d" fillOpacity="0.15" />
            </>
          )}
        </svg>
      </div>

    </div>
  );
}
