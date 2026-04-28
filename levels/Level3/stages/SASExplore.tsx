import { useState, useCallback, useEffect, useRef } from 'react';
import { playSound } from '../../../utils/sound';

interface Point { x: number; y: number; }

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ═══ Geometry constants ═══
const UNIT = 32; // smaller so two triangles fit side-by-side in build phase
const SAS_VALS = { a: 5, b: 3, angle: 53 }; // 3-4-5 triangle (left vertex angle ≈ 53°)
const sasRad = (SAS_VALS.angle * Math.PI) / 180;

// ── BUILD phase: reference (left half) ──
const REF_LEFT: Point = { x: 60, y: 210 };
const REF_RIGHT: Point = { x: REF_LEFT.x + SAS_VALS.a * UNIT, y: REF_LEFT.y };
const REF_TOP: Point = {
  x: REF_LEFT.x + SAS_VALS.b * UNIT * Math.cos(sasRad),
  y: REF_LEFT.y - SAS_VALS.b * UNIT * Math.sin(sasRad),
};

// ── BUILD phase: player drawing area (right half) ──
const DRAW_LEFT: Point = { x: 320, y: 210 };
const DRAW_RIGHT: Point = { x: DRAW_LEFT.x + SAS_VALS.a * UNIT, y: DRAW_LEFT.y };
const DRAW_TOP: Point = {
  x: DRAW_LEFT.x + SAS_VALS.b * UNIT * Math.cos(sasRad),
  y: DRAW_LEFT.y - SAS_VALS.b * UNIT * Math.sin(sasRad),
};

// ── MODULE phase: centred triangle for uniqueness exploration (sas-locked) ──
const SAS_LEFT: Point = { x: 195, y: 220 };
const SAS_RIGHT: Point = { x: SAS_LEFT.x + SAS_VALS.a * UNIT, y: SAS_LEFT.y };
const SAS_TOP: Point = {
  x: SAS_LEFT.x + SAS_VALS.b * UNIT * Math.cos(sasRad),
  y: SAS_LEFT.y - SAS_VALS.b * UNIT * Math.sin(sasRad),
};
const SAS_B_RADIUS = SAS_VALS.b * UNIT; // arc constraint radius

// ── ANGLE-FREE / ALL-FREE phases: playable triangle shares the centred SAS_*
//    position; the original (5-3-4) ghost overlays in-place so any deviation
//    is immediately visible. ──
const UF_LEFT: Point = SAS_LEFT;
const UF_RIGHT: Point = SAS_RIGHT;
const UF_TOP: Point = SAS_TOP;

// ── LockBadge: small SVG padlock used to show locked / unlocked state on labels.
//    Locked = navy + symmetric closed shackle.
//    Unlocked = warm orange + shackle popped open on the LEFT side. ──
function LockBadge({ x, y, locked }: { x: number; y: number; locked: boolean }) {
  const color = locked ? '#3d5a80' : '#F59E0B';
  // Scale: 960 viewBox → ~16px badge. scale = 16/960 ≈ 0.0167
  const s = 0.0167;
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      {locked ? (
        <g transform={`scale(${s}) translate(-480, 480)`}>
          <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
            fill={color} />
        </g>
      ) : (
        <g transform={`scale(${s}) translate(-480, 480)`}>
          <path d="M240-160h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z"
            fill={color} />
        </g>
      )}
    </g>
  );
}

// ═══ Tool components ═══
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
  const legLen = 75;
  const tiltFactor = 0.25;
  const hingeX = needle.x + (px - needle.x) * tiltFactor;
  const hingeY = needle.y - legLen;
  const headCenterY = hingeY - 12;
  const knobY = headCenterY - 14;
  return (
    <g>
      <line x1={hingeX} y1={hingeY} x2={needle.x} y2={needle.y} stroke="#9E9690" strokeWidth="3.5" strokeLinecap="round" />
      <line x1={hingeX} y1={hingeY} x2={px} y2={py} stroke="#B5AFA9" strokeWidth="2.5" strokeLinecap="round" />
      <rect x={hingeX - 5} y={hingeY - 3} width="10" height="6" rx="1.5" fill="#AEA8A3" />
      <line x1={hingeX} y1={hingeY} x2={hingeX} y2={headCenterY + 7} stroke="#9E9690" strokeWidth="3" strokeLinecap="round" />
      <circle cx={hingeX} cy={headCenterY} r="7" fill="none" stroke="#9E9690" strokeWidth="2.5" />
      <rect x={hingeX - 3} y={knobY - 4} width="6" height="8" rx="2" fill="#9E9690" />
      <circle cx={needle.x} cy={needle.y} r="3" fill={closed ? '#ee6c4d' : '#3d5a80'} />
      {!closed && <circle cx={px} cy={py} r="3" fill="#ee6c4d" />}
    </g>
  );
}

function RulerTool({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const units = 5;
  const ux = dx / len;
  const uy = dy / len;
  const rulerLen = units * UNIT;
  const rulerEnd = { x: from.x + ux * rulerLen, y: from.y + uy * rulerLen };
  const nx = -dy / len;
  const ny = dx / len;
  const rulerW = 36;
  const overshoot = 14;
  const bodyStart = { x: from.x - ux * overshoot, y: from.y - uy * overshoot };
  const bodyEnd = { x: rulerEnd.x + ux * overshoot, y: rulerEnd.y + uy * overshoot };
  return (
    <g style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
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

function ProtractorTool({ center, angle }: { center: Point; angle: number }) {
  const r = 55;
  // Generate tick marks like LV1 (every 1°: small, every 10°: medium, every 30°: long)
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= 180; i++) {
    const rad = (i * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);
    let len = 3, op = 0.15, sw = 0.8;
    if (i % 10 === 0) { len = 6; op = 0.35; sw = 1; }
    if (i % 30 === 0) { len = 10; op = 0.7; sw = 1.5; }
    ticks.push(
      <line key={i}
        x1={center.x + r * cos} y1={center.y + r * sin}
        x2={center.x + (r - len) * cos} y2={center.y + (r - len) * sin}
        stroke="#64748B" strokeWidth={sw} opacity={op} />
    );
  }
  const arcEnd = (() => {
    const rad = (angle * Math.PI) / 180;
    return { x: center.x + r * Math.cos(-rad), y: center.y + r * Math.sin(-rad) };
  })();
  return (
    <g style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Semi-circle body */}
      <path d={`M ${center.x + r},${center.y} A ${r},${r} 0 0,0 ${center.x - r},${center.y} Z`}
        fill="rgba(255,255,255,0.92)" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Baseline */}
      <line x1={center.x - r} y1={center.y} x2={center.x + r} y2={center.y}
        stroke="#94A3B8" strokeWidth="1.5" />
      {/* Tick marks */}
      {ticks}
      {/* Center dot */}
      <circle cx={center.x} cy={center.y} r="4" fill="#3d5a80" />
      {/* Angle label — right side of the arc endpoint */}
      <text x={arcEnd.x + 8} y={arcEnd.y + 8} textAnchor="start" className="font-en" fontSize="11" fill="#3d5a80" fontWeight="900">{angle}°</text>
    </g>
  );
}

// ═══ Phases ═══
type Phase =
  // Pre-construction question
  | 'sas-intro'
  // SAS construction
  | 'sas-step0' | 'sas-step1' | 'sas-step1b' | 'sas-step2' | 'sas-step3'
  // Congruent verification
  | 'sas-congruent'
  // Uniqueness exploration
  | 'sas-question'
  | 'sas-locked'
  | 'sas-locked-reveal'
  | 'sas-angle-free'
  | 'sas-all-free'
  | 'sas-done';

const STEP_HINTS: Record<Phase, string> = {
  'sas-intro': '兩邊＋夾角相同，會全等嗎？動手畫一個來驗證。',
  'sas-step0': '用直尺在右邊畫底邊 a → 點擊左端點',
  'sas-step1': `量角器量出夾角 → 點擊 ${SAS_VALS.angle}° 標籤方向`,
  'sas-step1b': `在 ${SAS_VALS.angle}° 方向標記記號`,
  'sas-step2': `沿方向量出 b = ${SAS_VALS.b} → 點擊頂點畫左側邊`,
  'sas-step3': '點擊頂點，畫右側邊',
  'sas-congruent': '兩邊＋夾角相等 → SAS 全等！',
  'sas-question': '為什麼兩條邊和一個夾角就能鎖定形狀？',
  'sas-locked': '兩邊和夾角都鎖死了。試著拖頂點看看。',
  'sas-locked-reveal': '邊長和夾角固定，頂點只有一個位置。',
  'sas-angle-free': '角度解鎖了。拖頂點試試能不能疊回原件。',
  'sas-all-free': '三個角都一樣，大小變了還算全等嗎？',
  'sas-done': 'SAS 唯一性確認完成！',
};

type ActionType = 'info' | 'action' | 'drag' | 'auto';

const PHASE_ACTION: Record<Phase, ActionType> = {
  'sas-intro': 'info',
  'sas-step0': 'action',
  'sas-step1': 'action',
  'sas-step1b': 'info',
  'sas-step2': 'action',
  'sas-step3': 'action',
  'sas-congruent': 'auto',
  'sas-question': 'info',
  'sas-locked': 'drag',
  'sas-locked-reveal': 'auto',
  'sas-angle-free': 'drag',
  'sas-all-free': 'drag',
  'sas-done': 'info',
};

const ACTION_LABELS: Record<ActionType, { text: string; bg: string; color: string }> = {
  info:   { text: '說明', bg: '#F1F5F9', color: '#64748B' },
  action: { text: '動作', bg: '#FFF7ED', color: '#EA580C' },
  drag:   { text: '拖曳', bg: '#ECFDF5', color: '#10B981' },
  auto:   { text: '播放', bg: '#EFF6FF', color: '#3B82F6' },
};

interface Props {
  onComplete: () => void;
}

export default function ExploreStage({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('sas-intro');
  const [congruentDone, setCongruentDone] = useState(false);

  // SAS construction state
  const [sasRayShown, setSasRayShown] = useState(false);
  const [sasVertex, setSasVertex] = useState<Point | null>(null);
  const [sasLines, setSasLines] = useState<{ from: Point; to: Point }[]>([]);

  // Locked phase state
  const [lockDragCount, setLockDragCount] = useState(0);
  const [lockShake, setLockShake] = useState<{ idx: 0 | 1 | 2 | null; off: Point }>({ idx: null, off: { x: 0, y: 0 } });
  // Progressive reveal stages:
  //   none → distance (固定線段沿底邊顯示)
  //        → sweeping (線段繞左端點從 0° 動畫旋轉到 53°)
  //        → done (停在 53°，浮動 hint 出現)
  const [lockRevealStage, setLockRevealStage] = useState<'none' | 'distance' | 'sweeping' | 'done'>('none');
  const [lockSweepAngle, setLockSweepAngle] = useState(0); // degrees, 0 → 53
  const [lockShowBtn, setLockShowBtn] = useState(false);
  const [lockHint, setLockHint] = useState('');
  const lockDragRef = useRef<0 | 1 | 2 | null>(null);

  // Angle-free phase state (vertex slides on arc; ghost original overlays in-place)
  const [afTop, setAfTop] = useState<Point>(UF_TOP);
  const [afDragCount, setAfDragCount] = useState(0);
  const [afShowBtn, setAfShowBtn] = useState(false);
  const afDragRef = useRef<number | null>(null); // active pointerId
  const afSvgRef = useRef<SVGSVGElement>(null);
  const afTimerStartedRef = useRef(false);

  // AAA phase state (角度全部固定，整體可縮放 → 大小可變但不算全等)
  const [aaaScale, setAaaScale] = useState(1);
  const [aaaDragCount, setAaaDragCount] = useState(0);
  const [aaaShowDone, setAaaShowDone] = useState(false);
  const aaaDragRef = useRef<{ startRadius: number; startScale: number; pointerId: number; centroidX: number; centroidY: number } | null>(null);
  const aaaSvgRef = useRef<SVGSVGElement>(null);
  const aaaTimerStartedRef = useRef(false);

  // ═══ Congruent animation ═══
  useEffect(() => {
    if (phase !== 'sas-congruent') { setCongruentDone(false); return; }
    setCongruentDone(false);
    const timer = setTimeout(() => setCongruentDone(true), 3500);
    return () => clearTimeout(timer);
  }, [phase]);

  // ═══ Locked phase: reset state on entry ═══
  useEffect(() => {
    if (phase !== 'sas-locked' && phase !== 'sas-locked-reveal') {
      setLockDragCount(0); setLockRevealStage('none'); setLockSweepAngle(0);
      setLockShowBtn(false); setLockHint(''); setLockShake({ idx: null, off: { x: 0, y: 0 } });
      lockDragRef.current = null;
    }
  }, [phase]);

  // ═══ Locked-reveal phase: start animation on entry ═══
  useEffect(() => {
    if (phase !== 'sas-locked-reveal') return;
    setLockRevealStage('distance');
    setLockSweepAngle(0);
  }, [phase]);

  // Drive the stage transitions: distance → (1.2s pause) → sweeping → (~1.8s anim) → done
  useEffect(() => {
    if (lockRevealStage === 'distance') {
      const t = setTimeout(() => setLockRevealStage('sweeping'), 1200);
      return () => clearTimeout(t);
    }
    if (lockRevealStage === 'sweeping') {
      // Use requestAnimationFrame for smooth 60fps animation (avoids the jagged setInterval feel)
      const startTime = performance.now();
      const duration = 1800;
      let rafId = 0;
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        // Ease-out cubic for a more natural sweep
        const eased = 1 - Math.pow(1 - t, 3);
        setLockSweepAngle(53 * eased);
        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          setLockSweepAngle(53);
          setLockRevealStage('done');
        }
      };
      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }
  }, [lockRevealStage]);

  // ═══ Click handler for SAS construction ═══
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const click = { x: svgPt.x, y: svgPt.y };

    if (phase === 'sas-step0' && dist(click, DRAW_LEFT) < 30) {
      setSasLines([{ from: DRAW_LEFT, to: DRAW_RIGHT }]); playSound('click');
      // Animation plays, next button appears
    } else if (phase === 'sas-step1' && dist(click, { x: DRAW_LEFT.x + 40 * Math.cos(-sasRad), y: DRAW_LEFT.y + 40 * Math.sin(-sasRad) }) < 35) {
      setSasRayShown(true); playSound('click'); setPhase('sas-step1b');
    } else if (phase === 'sas-step2' && dist(click, DRAW_TOP) < 35) {
      // Draw left side with animation, next button appears after
      setSasVertex(DRAW_TOP);
      setSasLines(prev => [...prev, { from: DRAW_LEFT, to: DRAW_TOP }]);
      playSound('click');
    } else if (phase === 'sas-step3' && dist(click, DRAW_TOP) < 35) {
      setSasLines(prev => [...prev, { from: DRAW_RIGHT, to: DRAW_TOP }]);
      playSound('success');
    }
  }, [phase]);

  // ═══ Step navigation (上一步 / 下一步) ═══
  const ALL_STEPS: Phase[] = [
    'sas-intro',
    'sas-step0', 'sas-step1', 'sas-step1b', 'sas-step2', 'sas-step3', 'sas-congruent',
    'sas-question', 'sas-locked', 'sas-locked-reveal', 'sas-angle-free', 'sas-all-free', 'sas-done',
  ];
  const globalIdx = ALL_STEPS.indexOf(phase);
  const canGoPrev = globalIdx > 0;
  const canGoNext = globalIdx >= 0 && globalIdx < ALL_STEPS.length - 1;

  const resetSasBuild = () => { setSasLines([]); setSasRayShown(false); setSasVertex(null); };
  const resetLocked = () => {
    setLockDragCount(0); setLockRevealStage('none'); setLockSweepAngle(0);
    setLockShowBtn(false); setLockHint(''); setLockShake({ idx: null, off: { x: 0, y: 0 } });
    lockDragRef.current = null;
  };
  const resetAngleFree = () => {
    setAfTop(UF_TOP); setAfDragCount(0); setAfShowBtn(false);
    afDragRef.current = null; afTimerStartedRef.current = false;
  };
  const resetAaa = () => {
    setAaaScale(1); setAaaDragCount(0); setAaaShowDone(false);
    aaaDragRef.current = null; aaaTimerStartedRef.current = false;
  };

  const applyStateForStep = useCallback((target: Phase) => {
    if (target === 'sas-intro') { resetSasBuild(); }
    else if (target === 'sas-step0') { resetSasBuild(); }
    else if (target === 'sas-step1') { resetSasBuild(); setSasLines([{ from: DRAW_LEFT, to: DRAW_RIGHT }]); }
    else if (target === 'sas-step1b') { resetSasBuild(); setSasLines([{ from: DRAW_LEFT, to: DRAW_RIGHT }]); setSasRayShown(true); }
    else if (target === 'sas-step2') { resetSasBuild(); setSasLines([{ from: DRAW_LEFT, to: DRAW_RIGHT }]); setSasRayShown(true); }
    else if (target === 'sas-step3') { resetSasBuild(); setSasLines([{ from: DRAW_LEFT, to: DRAW_RIGHT }, { from: DRAW_LEFT, to: DRAW_TOP }]); setSasRayShown(true); setSasVertex(DRAW_TOP); }
    else if (target === 'sas-congruent') {
      setSasLines([
        { from: DRAW_LEFT, to: DRAW_RIGHT },
        { from: DRAW_LEFT, to: DRAW_TOP },
        { from: DRAW_RIGHT, to: DRAW_TOP },
      ]);
      setSasRayShown(true); setSasVertex(DRAW_TOP);
    }
    else if (target === 'sas-question') { /* nothing — pure popup */ }
    else if (target === 'sas-locked') { resetLocked(); }
    else if (target === 'sas-locked-reveal') { resetLocked(); }
    else if (target === 'sas-angle-free') { resetAngleFree(); }
    else if (target === 'sas-all-free') { resetAaa(); }
    else if (target === 'sas-done') { /* nothing */ }
  }, []);

  const goToPrevStep = useCallback(() => {
    if (globalIdx <= 0) return;
    const prev = ALL_STEPS[globalIdx - 1];
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

  // ═══ Locked phase drag handlers ═══
  const onLockDown = useCallback((idx: 0 | 1 | 2) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    lockDragRef.current = idx;
    playSound('click');
  }, []);

  const onLockMove = useCallback((e: React.PointerEvent) => {
    if (lockDragRef.current === null) return;
    const ox = (Math.random() - 0.5) * 4;
    const oy = (Math.random() - 0.5) * 4;
    setLockShake({ idx: lockDragRef.current, off: { x: ox, y: oy } });
  }, []);

  const onLockUp = useCallback(() => {
    if (lockDragRef.current === null) return;
    lockDragRef.current = null;
    setLockShake({ idx: null, off: { x: 0, y: 0 } });
    setLockDragCount(c => c + 1);
  }, []);

  // ═══ Angle-free phase drag handlers ═══
  const afToSvg = (e: React.PointerEvent): Point | null => {
    const svg = afSvgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    return { x: inv.a * e.clientX + inv.c * e.clientY + inv.e, y: inv.b * e.clientX + inv.d * e.clientY + inv.f };
  };

  const onAfDown = useCallback((e: React.PointerEvent) => {
    if (afDragRef.current !== null) return; // ignore second finger
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    afDragRef.current = e.pointerId;
    playSound('click');
  }, []);

  const onAfMove = useCallback((e: React.PointerEvent) => {
    if (afDragRef.current !== e.pointerId) return;
    const pt = afToSvg(e);
    if (!pt) return;
    // Constrain to arc (radius = SAS_B_RADIUS centered at UF_LEFT)
    let angle = Math.atan2(pt.y - UF_LEFT.y, pt.x - UF_LEFT.x);
    if (angle > 0) angle = angle > Math.PI / 2 ? -Math.PI : 0;
    angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
    setAfTop({
      x: UF_LEFT.x + SAS_B_RADIUS * Math.cos(angle),
      y: UF_LEFT.y + SAS_B_RADIUS * Math.sin(angle),
    });
  }, []);

  const onAfUp = useCallback((e: React.PointerEvent) => {
    if (afDragRef.current !== e.pointerId) return;
    afDragRef.current = null;
    // First drag → start a short 1s countdown to unlock the next-step button.
    // Using a ref so subsequent drags do NOT reset the timer.
    if (!afTimerStartedRef.current) {
      afTimerStartedRef.current = true;
      setTimeout(() => setAfShowBtn(true), 1000);
    }
    setAfDragCount(c => c + 1);
  }, []);

  // ═══ AAA phase drag handlers (radial drag → uniform scale around triangle centroid) ═══
  // Drag the pointer away from the centroid → larger; toward the centroid → smaller.
  // Works for both mouse and touch via PointerEvents, and is direction-agnostic so it
  // matches the user's intent regardless of which vertex they grab.
  const onAaaDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (aaaDragRef.current) return; // ignore second finger
    e.preventDefault();
    const svg = e.currentTarget;
    try { svg.setPointerCapture(e.pointerId); } catch { /* noop */ }
    // Convert the (fixed) viewBox-space centroid to screen coords once at drag start
    const ctm = svg.getScreenCTM();
    const cxVB = (UF_LEFT.x + UF_RIGHT.x + UF_TOP.x) / 3;
    const cyVB = (UF_LEFT.y + UF_RIGHT.y + UF_TOP.y) / 3;
    let centroidX = e.clientX, centroidY = e.clientY;
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = cxVB; pt.y = cyVB;
      const screen = pt.matrixTransform(ctm);
      centroidX = screen.x;
      centroidY = screen.y;
    }
    const r0 = Math.hypot(e.clientX - centroidX, e.clientY - centroidY);
    aaaDragRef.current = {
      startRadius: Math.max(r0, 12), // floor avoids extreme ratios when grabbing near centroid
      startScale: aaaScale,
      pointerId: e.pointerId,
      centroidX, centroidY,
    };
    playSound('click');
  }, [aaaScale]);

  const onAaaMove = useCallback((e: React.PointerEvent) => {
    const drag = aaaDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const r = Math.hypot(e.clientX - drag.centroidX, e.clientY - drag.centroidY);
    const newScale = Math.max(0.5, Math.min(2.5, drag.startScale * (r / drag.startRadius)));
    setAaaScale(newScale);
  }, []);

  const onAaaUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!aaaDragRef.current || aaaDragRef.current.pointerId !== e.pointerId) return;
    aaaDragRef.current = null;
    if (e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }
    // First drag → start a short 1s countdown. Subsequent drags don't reset it.
    if (!aaaTimerStartedRef.current) {
      aaaTimerStartedRef.current = true;
      setTimeout(() => setAaaShowDone(true), 1000);
    }
    setAaaDragCount(c => c + 1);
  }, []);

  const hintText = STEP_HINTS[phase] ?? '';
  const isLastStep = phase === 'sas-done';
  const phaseAction = PHASE_ACTION[phase];

  // Gating: next button visibility per phase
  const showNext = (() => {
    if (isLastStep) return true; // show green "完成"
    if (!canGoNext) return false;
    // Build steps: user clicks SVG, next appears after line is drawn
    if (phase === 'sas-step0') return sasLines.length >= 1;
    if (phase === 'sas-step1') return false;
    if (phase === 'sas-step2') return sasLines.length >= 2;
    if (phase === 'sas-step3') return sasLines.length >= 3;
    if (phase === 'sas-congruent') return congruentDone;
    if (phase === 'sas-locked') return true;
    if (phase === 'sas-locked-reveal') return lockRevealStage === 'done';
    if (phase === 'sas-angle-free') return afShowBtn;
    if (phase === 'sas-all-free') return aaaShowDone;
    return true; // sas-intro, sas-question, sas-done
  })();

  const actionLabel = ACTION_LABELS[phaseAction];

  // Compute included angle from current points (for angle-free / all-free)
  const calcAngleAt = (vertex: Point, a: Point, b: Point) => {
    const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
    const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const m1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const m2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
    if (m1 < 0.01 || m2 < 0.01) return 0;
    const c = Math.max(-1, Math.min(1, dot / (m1 * m2)));
    return Math.round((Math.acos(c) * 180) / Math.PI);
  };

  // ═══ Unified target for build-phase click hint ═══
  // step1 target: the 53° mark position on the protractor arc (same as X-cross mark)
  const STEP1_TARGET: Point = {
    x: DRAW_LEFT.x + 40 * Math.cos(-sasRad),
    y: DRAW_LEFT.y + 40 * Math.sin(-sasRad),
  };
  const getTarget = (): Point | null => {
    if (phase === 'sas-step0') return DRAW_LEFT;
    if (phase === 'sas-step1') return STEP1_TARGET;
    if (phase === 'sas-step2' || phase === 'sas-step3') return DRAW_TOP;
    return null;
  };
  const target = getTarget();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(6px, 1vmin, 10px)',
      fontFamily: 'var(--font-main)', position: 'relative',
      touchAction: 'none',
    }}>
      {/* ═══ Content area (flex:1) ═══ */}

      {/* ─── Question popup ─── */}
      {phase === 'sas-question' && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(16px, 3vmin, 32px)', touchAction: 'manipulation',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '32px 36px',
            maxWidth: 420, textAlign: 'center', border: '1px solid #E5E7EB',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            animation: 'fadeSlideIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: 16, lineHeight: 1.8, color: '#293241' }}>
              你用兩條邊和一個夾角
              <br />做出了一模一樣的三角形。
              <br /><br />但為什麼這三個條件
              <br />就能鎖定三角形的形狀？
            </div>
          </div>
        </div>
      )}

      {/* ─── Locked: drag-impossible + progressive reveal ─── */}
      {(phase === 'sas-locked' || phase === 'sas-locked-reveal') && (() => {
        const verts: Point[] = [SAS_LEFT, SAS_RIGHT, SAS_TOP];
          // Apply shake offset only to the dragged vertex (and its two adjacent edges visually flash)
          const renderVerts = verts.map((v, i) => i === lockShake.idx
            ? { x: v.x + lockShake.off.x, y: v.y + lockShake.off.y } : v);
          const vL = renderVerts[0], vR = renderVerts[1], vT = renderVerts[2];
          const edgeFlash = (a: 0 | 1 | 2, b: 0 | 1 | 2) =>
            lockShake.idx !== null && (lockShake.idx === a || lockShake.idx === b);
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}>
                {/* Triangle fill */}
                <polygon points={`${vL.x},${vL.y} ${vR.x},${vR.y} ${vT.x},${vT.y}`}
                  fill="#98c1d9" fillOpacity={0.12} stroke="none" />

                {/* Edges — always dark blue-gray, thicken slightly on reveal */}
                {(() => {
                  const revealed = lockRevealStage === 'done';
                  const sasSideStroke = revealed ? '#d9562a' : '#3d5a80';
                  const sasSideWidth = revealed ? 3 : 2;
                  return (
                    <>
                      <line x1={vL.x} y1={vL.y} x2={vR.x} y2={vR.y}
                        stroke={sasSideStroke} strokeWidth={sasSideWidth}
                        style={{ transition: 'stroke 0.4s' }} />
                      <line x1={vL.x} y1={vL.y} x2={vT.x} y2={vT.y}
                        stroke={sasSideStroke} strokeWidth={sasSideWidth}
                        style={{ transition: 'stroke 0.4s' }} />
                      <line x1={vR.x} y1={vR.y} x2={vT.x} y2={vT.y}
                        stroke="#3d5a80" strokeWidth={2} />
                    </>
                  );
                })()}

                {/* Side length labels */}
                <text x={(vL.x + vR.x) / 2} y={vL.y + 18} textAnchor="middle" fontSize="13" className="font-en" fontWeight="700" fill="#3d5a80">{SAS_VALS.a}</text>
                <text x={(vL.x + vT.x) / 2 - 26} y={(vL.y + vT.y) / 2} textAnchor="middle" fontSize="13" className="font-en" fontWeight="700" fill="#3d5a80">{SAS_VALS.b}</text>

                {/* Included angle wedge + 53° label — always shown in navy, since the
                    angle is part of the locked condition. The reveal animation only adds
                    the orange "夾角固定" call-out alongside it. */}
                {(() => {
                  const r = 22;
                  const end = { x: vL.x + r, y: vL.y };
                  const start = { x: vL.x + r * Math.cos(-sasRad), y: vL.y + r * Math.sin(-sasRad) };
                  return (
                    <>
                      <path d={`M ${end.x},${end.y} A ${r},${r} 0 0,0 ${start.x},${start.y}`}
                        fill="none" stroke="#3d5a80" strokeWidth="1.5" opacity="0.8" />
                      <text x={vL.x + 28} y={vL.y - 6}
                        className="font-en" fontSize="11" fontWeight="700" fill="#3d5a80">53°</text>
                    </>
                  );
                })()}

                {/* ─── Progressive reveal: animated radius segment ─── */}
                {/* Stage 1: distance segment along base (angle = 0)
                    Stage 2: rotates from 0° to 53°
                    Stage 3: lands on apex (only then are the labels shown) */}
                {lockRevealStage !== 'none' && (() => {
                  const radLen = SAS_VALS.b * UNIT; // 96 px
                  const angRad = -lockSweepAngle * Math.PI / 180;
                  const segEnd = {
                    x: SAS_LEFT.x + radLen * Math.cos(angRad),
                    y: SAS_LEFT.y + radLen * Math.sin(angRad),
                  };
                  // Trailing arc from 0° → current sweep angle
                  const arcStartX = SAS_LEFT.x + radLen;
                  const arcStartY = SAS_LEFT.y;
                  const arcPath = lockSweepAngle > 0.5
                    ? `M ${arcStartX},${arcStartY} A ${radLen},${radLen} 0 0,0 ${segEnd.x},${segEnd.y}`
                    : '';
                  return (
                    <g style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
                      {/* Trailing arc — shows the path swept so far */}
                      {arcPath && (
                        <path d={arcPath} fill="none"
                          stroke="#ee6c4d" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4" />
                      )}
                      {/* The radius segment itself — solid orange line of length b */}
                      <line x1={SAS_LEFT.x} y1={SAS_LEFT.y} x2={segEnd.x} y2={segEnd.y}
                        stroke="#ee6c4d" strokeWidth="2.5" opacity="0.75" />
                      {/* Endpoint dot — emphasises "this is the apex" */}
                      <circle cx={segEnd.x} cy={segEnd.y} r="5"
                        fill="#ee6c4d" stroke="white" strokeWidth="1.5" opacity="0.9" />

                      {/* All three reveal labels appear together once the sweep finishes */}
                      {lockRevealStage === 'done' && (() => {
                        // "距離固定" — outside b edge, north-west direction, well clear of the b=3 label
                        const bMid = { x: (SAS_LEFT.x + SAS_TOP.x) / 2, y: (SAS_LEFT.y + SAS_TOP.y) / 2 };
                        const distLabel = { x: bMid.x - 38, y: bMid.y - 28 };
                        return (
                          <g style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
                            <text x={distLabel.x} y={distLabel.y}
                              textAnchor="middle" fontSize="12" fontWeight="700" fill="#ee6c4d" opacity="0.85">
                              距離固定
                            </text>
                            {/* "夾角固定" — sits inside the angle wedge area, slightly left.
                                The 53° number is already drawn in navy on the wedge itself, so this
                                call-out only adds the "fixed" annotation without repeating the value. */}
                            <text x={SAS_LEFT.x + 50} y={SAS_LEFT.y - 18}
                              textAnchor="start" fontSize="12" fontWeight="700" fill="#ee6c4d" opacity="0.85">
                              夾角固定
                            </text>
                            {/* "唯一頂點" — above the apex, regular weight */}
                            <text x={SAS_TOP.x + 12} y={SAS_TOP.y - 4}
                              textAnchor="start" fontSize="12" fontWeight="600" fill="#ee6c4d" opacity="0.9">
                              唯一頂點
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })()}

                {/* Three draggable vertex points — small dots, with a larger transparent
                    hit area so dragging is still easy. After the reveal completes, the
                    LEFT endpoint (vL) and the APEX (vT) both glow deep orange to
                    emphasise the SAS conclusion. The right endpoint stays navy. */}
                {([SAS_LEFT, SAS_RIGHT, SAS_TOP] as Point[]).map((_, i) => {
                  const rv = renderVerts[i];
                  const isDragging = lockShake.idx === i;
                  const revealed = lockRevealStage === 'done';
                  const isLeft = i === 0;
                  const isApex = i === 2;
                  const highlight = revealed && (isLeft || isApex);
                  const dotColor = isDragging ? '#ee6c4d' : highlight ? '#d9562a' : '#3d5a80';
                  return (
                    <g key={i}>
                      <circle cx={rv.x} cy={rv.y} r={16}
                        fill="transparent"
                        style={{ cursor: phase === 'sas-locked' ? 'grab' : 'default' }}
                        onPointerDown={phase === 'sas-locked' ? onLockDown(i as 0 | 1 | 2) : undefined}
                        onPointerMove={phase === 'sas-locked' ? onLockMove : undefined}
                        onPointerUp={phase === 'sas-locked' ? onLockUp : undefined}
                        onPointerCancel={phase === 'sas-locked' ? onLockUp : undefined}
                      />
                      <circle cx={rv.x} cy={rv.y} r={5}
                        fill={dotColor} pointerEvents="none"
                        style={{ transition: 'fill 0.2s' }} />
                    </g>
                  );
                })}
              </svg>

              {/* Floating hint — fixed at bottom centre. Continues into the
                  "如果角度可以變呢？" prompt once the reveal completes. */}
              {lockHint && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.92)', color: 'white', borderRadius: 10,
                  padding: '10px 18px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '88%',
                  lineHeight: 1.5,
                  animation: 'fadeSlideIn 0.3s ease-out',
                }}>
                  {lockHint}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── Angle-free: vertex slides on arc; original ghost overlays in-place ─── */}
        {phase === 'sas-angle-free' && (() => {
          const curAngle = calcAngleAt(UF_LEFT, UF_RIGHT, afTop);
          const sB = Math.round((dist(UF_LEFT, afTop) / UNIT) * 10) / 10;
          // Upper-half arc (constraint visualisation)
          const arcStart = -Math.PI + 0.1;
          const arcEnd = -0.1;
          const arcStartPt = { x: UF_LEFT.x + SAS_B_RADIUS * Math.cos(arcStart), y: UF_LEFT.y + SAS_B_RADIUS * Math.sin(arcStart) };
          const arcEndPt = { x: UF_LEFT.x + SAS_B_RADIUS * Math.cos(arcEnd), y: UF_LEFT.y + SAS_B_RADIUS * Math.sin(arcEnd) };
          // Has the player moved away from the original?
          const offFromOrig = dist(afTop, UF_TOP) > 4;
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              <svg ref={afSvgRef} viewBox="0 0 550 320" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                onPointerMove={onAfMove} onPointerUp={onAfUp} onPointerLeave={onAfUp}>
                {/* ─── Original (5-3-4) ghost — pinned at the same position so any deviation overlays directly ─── */}
                <polygon points={`${UF_LEFT.x},${UF_LEFT.y} ${UF_RIGHT.x},${UF_RIGHT.y} ${UF_TOP.x},${UF_TOP.y}`}
                  fill="#98c1d9" fillOpacity={0.22} stroke="#3d5a80" strokeWidth="1.8" strokeDasharray="5 3" />
                <circle cx={UF_TOP.x} cy={UF_TOP.y} r="3.5" fill="#3d5a80" opacity="0.6" />

                {/* ─── Upper-half arc constraint (dashed) ─── */}
                <path d={`M ${arcStartPt.x},${arcStartPt.y} A ${SAS_B_RADIUS},${SAS_B_RADIUS} 0 0,1 ${arcEndPt.x},${arcEndPt.y}`}
                  fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />

                {/* Player triangle (orange — overlays the ghost) */}
                <polygon points={`${UF_LEFT.x},${UF_LEFT.y} ${UF_RIGHT.x},${UF_RIGHT.y} ${afTop.x},${afTop.y}`}
                  fill="#fed7aa" fillOpacity={0.25} stroke="#ee6c4d" strokeWidth={2} />

                {/* Side a (locked) */}
                <g>
                  <text x={(UF_LEFT.x + UF_RIGHT.x) / 2 - 10} y={UF_LEFT.y + 18}
                    textAnchor="end" fontSize="13" className="font-en" fontWeight="700" fill="#3d5a80">{SAS_VALS.a}</text>
                  <LockBadge x={(UF_LEFT.x + UF_RIGHT.x) / 2 + 4} y={UF_LEFT.y + 13} locked={true} />
                </g>
                {/* Side b (locked) */}
                <g>
                  <text x={(UF_LEFT.x + afTop.x) / 2 - 22} y={(UF_LEFT.y + afTop.y) / 2}
                    textAnchor="end" fontSize="13" className="font-en" fontWeight="700" fill="#3d5a80">{sB}</text>
                  <LockBadge x={(UF_LEFT.x + afTop.x) / 2 - 8} y={(UF_LEFT.y + afTop.y) / 2 - 5} locked={true} />
                </g>
                {/* Angle (changing — orange, unlocked). LockBadge sits ABOVE the angle text so it never overlaps the number. */}
                {(() => {
                  const r = 24;
                  const ang = Math.atan2(afTop.y - UF_LEFT.y, afTop.x - UF_LEFT.x);
                  const end = { x: UF_LEFT.x + r, y: UF_LEFT.y };
                  const start = { x: UF_LEFT.x + r * Math.cos(ang), y: UF_LEFT.y + r * Math.sin(ang) };
                  return (
                    <>
                      <path d={`M ${end.x},${end.y} A ${r},${r} 0 0,0 ${start.x},${start.y}`}
                        fill="#fef3c7" fillOpacity="0.6" stroke="#ee6c4d" strokeWidth="1.5" />
                      <text x={UF_LEFT.x + 32} y={UF_LEFT.y - 8} fontSize="12" className="font-en" fontWeight="900" fill="#ee6c4d">{curAngle}°</text>
                      {/* LockBadge sits above-right of the number (raised so it doesn't sit ON the angle) */}
                      <LockBadge x={UF_LEFT.x + 70} y={UF_LEFT.y - 18} locked={false} />
                    </>
                  );
                })()}

                {/* Fixed endpoints */}
                <circle cx={UF_LEFT.x} cy={UF_LEFT.y} r={6} fill="#3d5a80" />
                <circle cx={UF_RIGHT.x} cy={UF_RIGHT.y} r={6} fill="#3d5a80" />

                {/* Draggable top vertex */}
                <circle cx={afTop.x} cy={afTop.y} r={10}
                  fill="white" stroke="#ee6c4d" strokeWidth={3}
                  style={{ cursor: 'grab' }}
                  onPointerDown={onAfDown}
                />
              </svg>

              {/* Floating hint — fixed at bottom centre. Single message; the next-step
                  button unlocks 5 seconds after the first drag. */}
              {afDragCount >= 1 && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.92)', color: 'white', borderRadius: 10,
                  padding: '10px 18px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '88%',
                  lineHeight: 1.5,
                  animation: 'fadeSlideIn 0.3s ease-out',
                }}>
                  夾角一變，就不全等了！
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── AAA: 三個角固定，整體可縮放 → 大小變但不全等 ─── */}
        {phase === 'sas-all-free' && (() => {
          // Triangle scales uniformly around its centroid; angles stay 53° / 90° / 37°.
          const center = {
            x: (UF_LEFT.x + UF_RIGHT.x + UF_TOP.x) / 3,
            y: (UF_LEFT.y + UF_RIGHT.y + UF_TOP.y) / 3,
          };
          const scaled = (p: Point) => ({
            x: center.x + (p.x - center.x) * aaaScale,
            y: center.y + (p.y - center.y) * aaaScale,
          });
          const sL = scaled(UF_LEFT);
          const sR = scaled(UF_RIGHT);
          const sT = scaled(UF_TOP);
          return (
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', position: 'relative' }}>
              {(() => null)()}
              <svg ref={aaaSvgRef} viewBox="0 0 550 320"
                style={{
                  width: '100%', height: '100%', display: 'block',
                  touchAction: 'none',
                  cursor: aaaDragRef.current ? 'grabbing' : 'grab',
                }}
                onPointerDown={onAaaDown}
                onPointerMove={onAaaMove}
                onPointerUp={onAaaUp}
                onPointerCancel={onAaaUp}>
                {/* ─── Original (5-3-4) ghost — only shown once the player actually
                    deviates from scale = 1. Ghost overlays in-place. ─── */}
                {Math.abs(aaaScale - 1) > 0.005 && (
                  <polygon points={`${UF_LEFT.x},${UF_LEFT.y} ${UF_RIGHT.x},${UF_RIGHT.y} ${UF_TOP.x},${UF_TOP.y}`}
                    fill="#98c1d9" fillOpacity={0.22} stroke="#3d5a80" strokeWidth="1.8" strokeDasharray="5 3" />
                )}

                {/* ─── AAA triangle: navy until the player touches it, orange the moment
                    scale departs from 1 (so the colour switch happens DURING the drag, not on release). ─── */}
                {(() => {
                  const touched = Math.abs(aaaScale - 1) > 0.005;
                  return (
                    <polygon points={`${sL.x},${sL.y} ${sR.x},${sR.y} ${sT.x},${sT.y}`}
                      fill={touched ? '#fed7aa' : '#98c1d9'}
                      fillOpacity={touched ? 0.2 : 0.22}
                      stroke={touched ? '#ee6c4d' : '#3d5a80'}
                      strokeWidth={2.5}
                      pointerEvents="none"
                      style={{ transition: 'stroke 0.2s, fill 0.2s' }}
                    />
                  );
                })()}

                {/* ─── Angle labels (LOCKED — fixed regardless of scale).
                    Number + navy LockBadge sit INSIDE each vertex. ─── */}
                {(() => {
                  // Centroid for direction calculations
                  const cx = (sL.x + sR.x + sT.x) / 3;
                  const cy = (sL.y + sR.y + sT.y) / 3;
                  // Offset labels well inward toward centroid
                  const inset = 40;
                  const labelPos = (v: Point) => {
                    const dx = cx - v.x, dy = cy - v.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    return { x: v.x + dx / d * inset, y: v.y + dy / d * inset };
                  };
                  const lL = labelPos(sL), lR = labelPos(sR), lT = labelPos(sT);
                  return (
                    <>
                      {/* left vertex: 53° (inside) */}
                      <g pointerEvents="none">
                        <text x={lL.x - 6} y={lL.y + 4} textAnchor="middle"
                          fontSize="12" className="font-en" fontWeight="900" fill="#3d5a80">53°</text>
                        <LockBadge x={lL.x + 12} y={lL.y - 1} locked={true} />
                      </g>
                      {/* apex: 90° (inside) */}
                      <g pointerEvents="none">
                        <text x={lT.x - 7} y={lT.y - 5} textAnchor="middle"
                          fontSize="12" className="font-en" fontWeight="900" fill="#3d5a80">90°</text>
                        <LockBadge x={lT.x + 11} y={lT.y - 10} locked={true} />
                      </g>
                      {/* right vertex: 37° (inside) */}
                      <g pointerEvents="none">
                        <text x={lR.x - 6} y={lR.y + 4} textAnchor="middle"
                          fontSize="12" className="font-en" fontWeight="900" fill="#3d5a80">37°</text>
                        <LockBadge x={lR.x + 12} y={lR.y - 1} locked={true} />
                      </g>
                    </>
                  );
                })()}

                {/* Vertices — colour follows the same touched/untouched state */}
                {(() => {
                  const vc = Math.abs(aaaScale - 1) > 0.005 ? '#ee6c4d' : '#3d5a80';
                  return (
                    <>
                      <circle cx={sL.x} cy={sL.y} r={6} fill={vc} pointerEvents="none"
                        style={{ transition: 'fill 0.2s' }} />
                      <circle cx={sR.x} cy={sR.y} r={6} fill={vc} pointerEvents="none"
                        style={{ transition: 'fill 0.2s' }} />
                      <circle cx={sT.x} cy={sT.y} r={6} fill={vc} pointerEvents="none"
                        style={{ transition: 'fill 0.2s' }} />
                    </>
                  );
                })()}
              </svg>

              {/* Floating hint — single message; the next-step button unlocks 5s after the first drag */}
              {aaaDragCount >= 1 && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(41,50,65,0.92)', color: 'white', borderRadius: 10,
                  padding: '10px 18px', fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: '88%',
                  lineHeight: 1.5,
                  animation: 'fadeSlideIn 0.3s ease-out',
                }}>
                  三個角都對，但邊長跟原件不同——就不算全等！
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── Conclusion ─── */}
        {phase === 'sas-done' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            padding: 'clamp(16px, 3vmin, 32px)',
          }}>
            <div style={{
              background: 'white', borderRadius: 14, padding: '24px 32px',
              maxWidth: 480, textAlign: 'center', border: '1px solid #E5E7EB',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: 'fadeSlideIn 0.4s ease-out',
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.9, color: '#293241' }}>
                兩條邊 + 夾角固定
                <br />→ 方向定了，距離定了
                <br />→ 頂點只有一個位置
                <br /><strong>→ 三角形只有一種</strong>
                <br /><br />任何一個條件改變 → 三角形就變了
              </div>
            </div>
          </div>
        )}

      {/* ═══ BUILD PHASE: SVG canvas (sas-intro + sas-step0~3 + sas-congruent) ═══ */}
      {(phase === 'sas-intro' || phase.startsWith('sas-step') || phase === 'sas-congruent') && (
        <div style={{
          flex: 1, minHeight: 0, background: 'white', borderRadius: 16,
          border: '1px solid #E5E7EB', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 550 320"
            style={{ width: '100%', height: '100%', cursor: target ? 'pointer' : 'default', touchAction: 'none' }}
            onClick={handleSvgClick}
          >
          {/* ═══ LEFT: Reference triangle (always shown, fully marked) ═══ */}
          {(() => {
            const r = 22;
            const angEnd = { x: REF_LEFT.x + r, y: REF_LEFT.y };
            const angStart = { x: REF_LEFT.x + r * Math.cos(-sasRad), y: REF_LEFT.y + r * Math.sin(-sasRad) };
            return (
              <g>
                <polygon
                  points={`${REF_LEFT.x},${REF_LEFT.y} ${REF_RIGHT.x},${REF_RIGHT.y} ${REF_TOP.x},${REF_TOP.y}`}
                  fill="#98c1d9" fillOpacity="0.18"
                  stroke="#3d5a80" strokeWidth="2.5"
                />
                {/* Vertices */}
                <circle cx={REF_LEFT.x} cy={REF_LEFT.y} r="3.5" fill="#3d5a80" />
                <circle cx={REF_RIGHT.x} cy={REF_RIGHT.y} r="3.5" fill="#3d5a80" />
                <circle cx={REF_TOP.x} cy={REF_TOP.y} r="3.5" fill="#3d5a80" />
                {/* Side a label (bottom) */}
                <text x={(REF_LEFT.x + REF_RIGHT.x) / 2} y={REF_LEFT.y + 18}
                  textAnchor="middle" fontSize="12" className="font-en" fontWeight="900" fill="#3d5a80">a = {SAS_VALS.a}</text>
                {/* Side b label (left edge) */}
                <text x={(REF_LEFT.x + REF_TOP.x) / 2 - 14} y={(REF_LEFT.y + REF_TOP.y) / 2}
                  textAnchor="end" fontSize="12" className="font-en" fontWeight="900" fill="#3d5a80">b = {SAS_VALS.b}</text>
                {/* Included angle wedge + label */}
                <path d={`M ${angEnd.x},${angEnd.y} A ${r},${r} 0 0,0 ${angStart.x},${angStart.y}`}
                  fill="#fef3c7" fillOpacity="0.7" stroke="#d97706" strokeWidth="1.5" />
                <text x={REF_LEFT.x + 28} y={REF_LEFT.y - 8}
                  fontSize="11" className="font-en" fontWeight="900" fill="#d97706">{SAS_VALS.angle}°</text>
              </g>
            );
          })()}

          {/* ═══ RIGHT: Player drawing area ═══ */}
          {/* Drawn lines (non-animated) — below tools */}
          {sasLines.map((l, i) => {
            const isStep0Anim = i === 0 && phase === 'sas-step0' && sasLines.length === 1;
            const isStep2Anim = i === sasLines.length - 1 && phase === 'sas-step2' && sasLines.length >= 2;
            const isStep3Anim = i === sasLines.length - 1 && phase === 'sas-step3' && sasLines.length >= 3;
            if (isStep0Anim || isStep2Anim || isStep3Anim) return null; // rendered after ruler for layer order
            // Line is "active" only while its draw animation just played in THIS step
            // step0 draws line 0, step2 draws line 1, step3 draws line 2
            const activeInStep =
              (phase === 'sas-step0' && i === 0) ||
              (phase === 'sas-step2' && i === 1) ||
              (phase === 'sas-step3' && i === 2);
            const lineColor = phase === 'sas-congruent'
              ? (congruentDone ? '#3d5a80' : '#94A3B8')
              : (activeInStep ? '#ee6c4d' : '#3d5a80');
            return (
              <line key={`sl${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
                stroke={lineColor}
                strokeWidth="2.5"
                style={{ transition: 'stroke 0.5s' }} />
            );
          })}

          {/* Tools per step */}
          {phase === 'sas-step0' && <RulerTool from={DRAW_LEFT} to={DRAW_RIGHT} />}

          {/* Animated bottom line (step0) — rendered ABOVE the ruler */}
          {phase === 'sas-step0' && sasLines.length >= 1 && (() => {
            const l = sasLines[0];
            const lineLen = dist(l.from, l.to);
            return (
              <line x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
                stroke="#ee6c4d" strokeWidth="2.5"
                strokeDasharray={lineLen} strokeDashoffset={lineLen}
                style={{ animation: 'drawLine 0.8s ease-out forwards' }} />
            );
          })()}

          {phase === 'sas-step1' && <ProtractorTool center={DRAW_LEFT} angle={SAS_VALS.angle} />}

          {/* Direction mark — X-cross at the 53° position on the protractor arc.
              Appears with fadeIn on step1b, persists through step2/3. */}
          {sasRayShown && phase !== 'sas-congruent' && (() => {
            const PROTRACTOR_R = 40;
            const markPt = {
              x: DRAW_LEFT.x + PROTRACTOR_R * Math.cos(-sasRad),
              y: DRAW_LEFT.y + PROTRACTOR_R * Math.sin(-sasRad),
            };
            const crossSize = 5;
            return (
              <g>
                {/* 53° angle wedge at origin */}
                {(() => {
                  const r = 25;
                  const end = { x: DRAW_LEFT.x + r, y: DRAW_LEFT.y };
                  const start = { x: DRAW_LEFT.x + r * Math.cos(-sasRad), y: DRAW_LEFT.y + r * Math.sin(-sasRad) };
                  return (
                    <>
                      <path d={`M ${end.x},${end.y} A ${r},${r} 0 0,0 ${start.x},${start.y}`}
                        fill="none" stroke="#ee6c4d" strokeWidth="1.5" opacity="0.5" />
                      {/* 53° label — right side of arc */}
                      <text x={start.x + 8} y={start.y + 8}
                        textAnchor="start" fontSize="11" className="font-en" fontWeight="900" fill="#ee6c4d" opacity="0.7">{SAS_VALS.angle}°</text>
                    </>
                  );
                })()}
                {/* X-cross direction mark */}
                <line x1={markPt.x - crossSize} y1={markPt.y - crossSize} x2={markPt.x + crossSize} y2={markPt.y + crossSize}
                  stroke="#ee6c4d" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <line x1={markPt.x + crossSize} y1={markPt.y - crossSize} x2={markPt.x - crossSize} y2={markPt.y + crossSize}
                  stroke="#ee6c4d" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              </g>
            );
          })()}

          {/* Step 2: ruler aligned with the marked direction */}
          {phase === 'sas-step2' && (() => {
            // Use a point along the 53° direction to set ruler orientation
            const rulerEnd = {
              x: DRAW_LEFT.x + 5 * UNIT * Math.cos(-sasRad),
              y: DRAW_LEFT.y + 5 * UNIT * Math.sin(-sasRad),
            };
            return <RulerTool from={DRAW_LEFT} to={rulerEnd} />;
          })()}
          {phase === 'sas-step3' && sasVertex && <RulerTool from={DRAW_RIGHT} to={sasVertex} />}

          {/* Animated left-side line (step2) — rendered ABOVE the ruler */}
          {phase === 'sas-step2' && sasLines.length >= 2 && (() => {
            const l = sasLines[sasLines.length - 1];
            const lineLen = dist(l.from, l.to);
            return (
              <line x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
                stroke="#ee6c4d" strokeWidth="2.5"
                strokeDasharray={lineLen} strokeDashoffset={lineLen}
                style={{ animation: 'drawLine 0.8s ease-out forwards' }} />
            );
          })()}

          {/* Animated third line (step3) — rendered ABOVE the ruler */}
          {phase === 'sas-step3' && sasLines.length >= 3 && (() => {
            const l = sasLines[sasLines.length - 1];
            const lineLen = dist(l.from, l.to);
            return (
              <line x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y}
                stroke="#ee6c4d" strokeWidth="2.5"
                strokeDasharray={lineLen} strokeDashoffset={lineLen}
                style={{ animation: 'drawLine 0.8s ease-out forwards' }} />
            );
          })()}

          {/* Base endpoint dots — above all tools/rulers */}
          {phase !== 'sas-intro' && phase !== 'sas-congruent' && (() => {
            const baseDone = sasLines.length >= 1;
            const pastBase = phase !== 'sas-step0';
            // Left endpoint: orange during step0~step2 (origin for protractor/compass), dark gray at step3
            const leftFill = !baseDone ? '#94A3B8' : (phase === 'sas-step3' ? '#3d5a80' : '#ee6c4d');
            // Right endpoint: orange during step0 and step3 (it's the active point), dark gray in between
            const rightFill = (phase === 'sas-step0' || phase === 'sas-step3') ? '#ee6c4d' : '#3d5a80';
            return (
              <>
                <circle cx={DRAW_LEFT.x} cy={DRAW_LEFT.y} r="4" fill={leftFill} />
                {baseDone && (
                  <circle cx={DRAW_RIGHT.x} cy={DRAW_RIGHT.y} r="4" fill={rightFill} />
                )}
              </>
            );
          })()}

          {sasVertex && phase !== 'sas-congruent' && (
            <circle cx={sasVertex.x} cy={sasVertex.y} r="6" fill="#ee6c4d" />
          )}

          {/* x = 5 (base) + y = 3 (left side) labels — appear once player has connected the apex */}
          {sasVertex && phase !== 'sas-congruent' && (
            <>
              <text x={(DRAW_LEFT.x + DRAW_RIGHT.x) / 2} y={DRAW_LEFT.y + 18}
                textAnchor="middle" fontSize="12" className="font-en" fontWeight="900" fill="#ee6c4d">x = {SAS_VALS.a}</text>
              <text x={(DRAW_LEFT.x + DRAW_TOP.x) / 2 - 14} y={(DRAW_LEFT.y + DRAW_TOP.y) / 2}
                textAnchor="end" fontSize="12" className="font-en" fontWeight="900" fill="#ee6c4d">y = {SAS_VALS.b}</text>
            </>
          )}

          {/* ═══ Congruent verification animation: trace BOTH triangles ═══ */}
          {phase === 'sas-congruent' && (() => {
            const refTri = `M ${REF_LEFT.x},${REF_LEFT.y} L ${REF_TOP.x},${REF_TOP.y} L ${REF_RIGHT.x},${REF_RIGHT.y} Z`;
            const drawTri = `M ${DRAW_LEFT.x},${DRAW_LEFT.y} L ${DRAW_TOP.x},${DRAW_TOP.y} L ${DRAW_RIGHT.x},${DRAW_RIGHT.y} Z`;
            const perim = SAS_VALS.a * UNIT + SAS_VALS.b * UNIT + dist(DRAW_RIGHT, DRAW_TOP);
            return (
              <>
                {/* Player drawing solid (gray → blue after animation) */}
                <polygon
                  points={`${DRAW_LEFT.x},${DRAW_LEFT.y} ${DRAW_RIGHT.x},${DRAW_RIGHT.y} ${DRAW_TOP.x},${DRAW_TOP.y}`}
                  fill={congruentDone ? '#98c1d9' : 'none'} fillOpacity="0.18"
                  stroke={congruentDone ? '#3d5a80' : '#94A3B8'} strokeWidth="2.5"
                  style={{ transition: 'all 0.5s' }} />
                <circle cx={DRAW_LEFT.x} cy={DRAW_LEFT.y} r="4" fill={congruentDone ? '#3d5a80' : '#94A3B8'} />
                <circle cx={DRAW_RIGHT.x} cy={DRAW_RIGHT.y} r="4" fill={congruentDone ? '#3d5a80' : '#94A3B8'} />
                <circle cx={DRAW_TOP.x} cy={DRAW_TOP.y} r="4" fill={congruentDone ? '#3d5a80' : '#94A3B8'} />
                <text x={(DRAW_LEFT.x + DRAW_RIGHT.x) / 2} y={DRAW_LEFT.y + 18} textAnchor="middle"
                  className="font-en" fontSize="12" fontWeight="900" fill={congruentDone ? '#3d5a80' : '#94A3B8'}>x = {SAS_VALS.a}</text>
                <text x={(DRAW_LEFT.x + DRAW_TOP.x) / 2 - 14} y={(DRAW_LEFT.y + DRAW_TOP.y) / 2}
                  textAnchor="end" className="font-en" fontSize="12" fontWeight="900" fill={congruentDone ? '#3d5a80' : '#94A3B8'}>y = {SAS_VALS.b}</text>
                {(() => {
                  const r = 22;
                  const end = { x: DRAW_LEFT.x + r, y: DRAW_LEFT.y };
                  const start = { x: DRAW_LEFT.x + r * Math.cos(-sasRad), y: DRAW_LEFT.y + r * Math.sin(-sasRad) };
                  return <path d={`M ${end.x},${end.y} A ${r},${r} 0 0,0 ${start.x},${start.y}`}
                    fill="none" stroke={congruentDone ? '#d97706' : '#94A3B8'} strokeWidth="1.5" />;
                })()}
                <text x={DRAW_LEFT.x + 28} y={DRAW_LEFT.y - 8}
                  className="font-en" fontSize="11" fontWeight="900" fill={congruentDone ? '#d97706' : '#94A3B8'}>{SAS_VALS.angle}°</text>

                {/* Trace animation: draw both triangle outlines simultaneously */}
                {!congruentDone && (
                  <>
                    <path d={refTri} fill="none" stroke="#67E8F9" strokeWidth="3"
                      strokeDasharray={perim} strokeDashoffset={perim}
                      style={{ animation: `traceStroke 3s linear forwards` }} />
                    <path d={drawTri} fill="none" stroke="#67E8F9" strokeWidth="3"
                      strokeDasharray={perim} strokeDashoffset={perim}
                      style={{ animation: `traceStroke 3s linear forwards` }} />
                  </>
                )}

                {/* Glow flash on done — both triangles light up together */}
                {congruentDone && (
                  <>
                    <polygon points={`${REF_LEFT.x},${REF_LEFT.y} ${REF_TOP.x},${REF_TOP.y} ${REF_RIGHT.x},${REF_RIGHT.y}`}
                      fill="#67E8F9" stroke="none"
                      style={{ animation: 'glowFill 1s ease-out forwards' }} />
                    <polygon points={`${DRAW_LEFT.x},${DRAW_LEFT.y} ${DRAW_TOP.x},${DRAW_TOP.y} ${DRAW_RIGHT.x},${DRAW_RIGHT.y}`}
                      fill="#67E8F9" stroke="none"
                      style={{ animation: 'glowFill 1s ease-out forwards' }} />
                  </>
                )}

                {/* Label centred under drawing area */}
                <text x={(DRAW_LEFT.x + DRAW_RIGHT.x) / 2} y={DRAW_LEFT.y + 50}
                  textAnchor="middle" fontSize="13" fontWeight="900" fill="#3d5a80"
                  style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
                  全等三角形
                </text>
              </>
            );
          })()}

          {/* Pulsing target (click hint) */}
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
      )}

      {/* ═══ Bottom floating action bar ═══ */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        height: 'clamp(60px, 9vmin, 72px)', padding: '0 clamp(14px, 2.5vmin, 20px)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Progress bar at top edge */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E5E7EB', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((globalIdx + 1) / ALL_STEPS.length) * 100}%`, background: '#ee6c4d', transition: 'width 0.3s ease' }} />
        </div>
        {/* Prev button — always rendered to reserve space, hidden via visibility when N/A */}
        <button onClick={canGoPrev ? goToPrevStep : undefined} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
          cursor: canGoPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, padding: 0, visibility: canGoPrev ? 'visible' : 'hidden',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {/* Action type pill label */}
        <span style={{
          padding: '2px 10px', borderRadius: 6, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 700,
          background: actionLabel.bg, color: actionLabel.color, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{actionLabel.text}</span>
        {/* Hint text */}
        <span style={{ flex: 1, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 600, color: '#3d5a80', lineHeight: 1.4 }}>
          {hintText}
        </span>
        {/* Next/Complete button — always rendered to reserve space, hidden via visibility */}
        <button onClick={isLastStep ? () => { playSound('click'); onComplete(); } : showNext ? goToNextStep : undefined} style={{
          height: 'clamp(40px, 6vmin, 48px)', padding: '0 clamp(14px, 2.5vmin, 20px)', borderRadius: 10,
          border: 'none', background: isLastStep ? '#10B981' : '#3d5a80', color: 'white',
          cursor: showNext ? 'pointer' : 'default', fontWeight: 700, fontSize: 'clamp(15px, 2.5vmin, 18px)',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          visibility: showNext ? 'visible' : 'hidden',
        }}>
          {isLastStep ? '完成' : '下一步'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}
