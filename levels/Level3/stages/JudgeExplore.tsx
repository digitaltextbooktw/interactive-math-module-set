import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { playSound } from '../../../utils/sound';
import {
  centroid, checkOverlap, computeSnapRotation,
} from '../geometry';
import type { Point, Triangle, OverlapStatus } from '../geometry';

// ═══ Puzzle definitions ═══
interface PuzzleDef {
  id: string;
  fixed: Triangle;
  initialRotation: number;
  initialFlipped: boolean;
  initialOffset: Point; // offset from fixed centroid
  isCongruent: boolean;
  scale: number;
  unlockFlip: boolean;
}

const PUZZLES: PuzzleDef[] = [
  {
    id: 'p1_rotate',
    fixed: [
      { x: 110, y: 290 },
      { x: 240, y: 290 },
      { x: 150, y: 150 },
    ],
    initialRotation: (75 * Math.PI) / 180,
    initialFlipped: false,
    initialOffset: { x: 240, y: -10 },
    isCongruent: true,
    scale: 1,
    unlockFlip: false,
  },
  {
    id: 'p2_flip',
    // Strongly asymmetric scalene triangle: three sides ~164 / 230 / 249 (no two sides
    // close in length → no near-symmetry, so the mirror image cannot be matched by rotation
    // alone. Player MUST press the flip button to align it.
    fixed: [
      { x: 80, y: 290 },    // base left
      { x: 310, y: 285 },   // base right
      { x: 115, y: 130 },   // apex pulled hard to the LEFT (close to base-left)
    ],
    initialRotation: 0,
    initialFlipped: true,
    initialOffset: { x: 250, y: 0 },
    isCongruent: true,
    scale: 1,
    unlockFlip: true,
  },
  {
    id: 'p3_not_congruent',
    fixed: [
      { x: 130, y: 300 },
      { x: 310, y: 300 },
      { x: 230, y: 130 },
    ],
    initialRotation: (30 * Math.PI) / 180,
    initialFlipped: false,
    initialOffset: { x: 220, y: 10 },
    isCongruent: false,
    scale: 0.7,
    unlockFlip: true,
  },
];

function buildInitialPoints(p: PuzzleDef): Triangle {
  const c = centroid(p.fixed);
  return p.fixed.map(pt => {
    let dx = (pt.x - c.x) * p.scale;
    let dy = (pt.y - c.y) * p.scale;
    if (p.initialFlipped) dx = -dx;
    const cos = Math.cos(p.initialRotation);
    const sin = Math.sin(p.initialRotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return { x: c.x + p.initialOffset.x + rx, y: c.y + p.initialOffset.y + ry };
  }) as Triangle;
}

// ═══ Phases ═══
type Phase =
  | 'guess'
  | 'p1' | 'p1-done'
  | 'p2' | 'p2-done'
  | 'p3' | 'p3-done'
  | 'reveal'
  | 'done';

// ═══ Action type system ═══
type ActionType = 'info' | 'action' | 'drag' | 'auto' | 'question';

const PHASE_ACTION: Record<Phase, ActionType> = {
  'guess': 'question',
  'p1': 'drag',
  'p1-done': 'info',
  'p2': 'drag',
  'p2-done': 'info',
  'p3': 'drag',
  'p3-done': 'info',
  'reveal': 'info',
  'done': 'info',
};

const ACTION_LABELS: Record<ActionType, { text: string; bg: string; color: string }> = {
  info:     { text: '說明', bg: '#F1F5F9', color: '#64748B' },
  question: { text: '問題', bg: '#FEF3C7', color: '#D97706' },
  action:   { text: '動作', bg: '#FFF7ED', color: '#EA580C' },
  drag:     { text: '拖曳', bg: '#ECFDF5', color: '#10B981' },
  auto:     { text: '播放', bg: '#EFF6FF', color: '#3B82F6' },
};

const ALL_STEPS: Phase[] = ['guess', 'p1', 'p1-done', 'p2', 'p2-done', 'p3', 'p3-done', 'reveal'];

const PHASE_HINTS: Record<Phase, { title: string; sub: string }> = {
  'guess': {
    title: '先猜猜看',
    sub: '什麼情況下兩個三角形算「完全一樣」？',
  },
  'p1': {
    title: '平移 + 旋轉',
    sub: '拖動右邊三角形疊到左邊上，可拖曳或旋轉。',
  },
  'p1-done': {
    title: '完全重合',
    sub: '旋轉跟平移之後完全重疊，就是全等！',
  },
  'p2': {
    title: '翻轉 + 旋轉',
    sub: '拖跟旋轉疊不上——試試「翻轉」按鈕。',
  },
  'p2-done': {
    title: '完全重合',
    sub: '翻過來也能疊上！翻轉不影響全等。',
  },
  'p3': {
    title: '試試看',
    sub: '同樣的玩法，試試能不能疊上去。',
  },
  'p3-done': {
    title: '疊不上!',
    sub: '角度都對但大小不同——「相似」不是「全等」。',
  },
  'reveal': {
    title: '全等的定義',
    sub: '平移、旋轉、翻轉後疊得上 = 全等。',
  },
  'done': { title: '', sub: '' },
};

const GUESS_OPTIONS = [
  '長得像就算',
  '形狀和大小都要完全相同',
  '擺的方向也要一樣',
  '面積一樣就算',
];
const GUESS_CORRECT = 1;

interface Props { onComplete: () => void; }

export default function ExploreStage({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('guess');
  const [guessIdx, setGuessIdx] = useState<number | null>(null);

  const advance = useCallback((next: Phase) => {
    playSound('click');
    setPhase(next);
  }, []);

  const handleGuess = useCallback((idx: number) => {
    if (guessIdx !== null) return;
    setGuessIdx(idx);
    playSound(idx === GUESS_CORRECT ? 'success' : 'wrong');
  }, [guessIdx]);

  const handlePuzzleComplete = useCallback((puzzleIdx: 0 | 1 | 2) => {
    playSound('success');
    if (puzzleIdx === 0) setPhase('p1-done');
    else if (puzzleIdx === 1) setPhase('p2-done');
    else setPhase('p3-done');
  }, []);

  const handlePuzzleFail = useCallback(() => {
    setPhase('p3-done');
  }, []);

  // ═══ Step navigation ═══
  const globalIdx = ALL_STEPS.indexOf(phase);
  const progress = ((globalIdx + 1) / ALL_STEPS.length) * 100;
  const actionType = PHASE_ACTION[phase];
  const actionLabel = ACTION_LABELS[actionType];

  // Determine if prev/next buttons should be visible
  const canGoPrev = globalIdx > 0;

  // Next button visibility depends on phase
  const showNext = (() => {
    if (phase === 'guess') return guessIdx !== null;
    if (phase === 'p1' || phase === 'p2' || phase === 'p3') return false;
    if (phase === 'p1-done' || phase === 'p2-done' || phase === 'p3-done') return true;
    if (phase === 'reveal') return true;
    return false;
  })();

  const isLastStep = phase === 'reveal';

  // Hint text for the bottom bar
  const displayHint = (() => {
    if (phase === 'guess' && guessIdx !== null) {
      return '選好了！按下一步動手試試。';
    }
    return PHASE_HINTS[phase].sub;
  })();

  const hintColor = '#475569';

  const goToPrevStep = useCallback(() => {
    if (globalIdx <= 0) return;
    const prev = ALL_STEPS[globalIdx - 1];
    playSound('click');
    setPhase(prev);
    // Reset guess state when going back to guess
    if (prev === 'guess') setGuessIdx(null);
  }, [globalIdx]);

  const goToNextStep = useCallback(() => {
    if (phase === 'guess') { advance('p1'); return; }
    if (phase === 'p1-done') { advance('p2'); return; }
    if (phase === 'p2-done') { advance('p3'); return; }
    if (phase === 'p3-done') { advance('reveal'); return; }
    if (phase === 'reveal') { onComplete(); return; }
  }, [phase, advance, onComplete]);

  // ═══ Layout ═══
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      padding: 'clamp(8px, 1.5vmin, 12px) clamp(8px, 2vmin, 16px)',
      gap: 'clamp(6px, 1vmin, 10px)',
      fontFamily: 'var(--font-main)', boxSizing: 'border-box',
      touchAction: 'none',
    }}>
      {/* ─── Content area ─── */}
      {phase === 'guess' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px, 2.5vmin, 20px)',
          padding: 'clamp(16px, 3vmin, 32px)',
          touchAction: 'manipulation',
        }}>
          {/* Question text */}
          <div style={{
            fontSize: 'clamp(18px, 3vmin, 1.5rem)', fontWeight: 800, color: '#293241',
            lineHeight: 1.5, textAlign: 'center', maxWidth: 500,
          }}>
            什麼情況下，兩個三角形算是「完全一樣」？
          </div>
          {/* Options */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(8px, 1.5vmin, 14px)', width: '100%', maxWidth: 500,
          }}>
            {GUESS_OPTIONS.map((opt, i) => {
              let bg = 'white', border = '#e5e7eb', color = '#293241';
              if (guessIdx !== null) {
                if (i === GUESS_CORRECT) { bg = '#d1fae5'; border = '#10B981'; color = '#065f46'; }
                else if (i === guessIdx && i !== GUESS_CORRECT) { bg = '#fee2e2'; border = '#EF4444'; color = '#991b1b'; }
              }
              return (
                <button key={i} onClick={() => handleGuess(i)} style={{
                  padding: 'clamp(14px, 2.5vmin, 20px) clamp(16px, 2.5vmin, 22px)',
                  border: `2px solid ${border}`, borderRadius: 14,
                  background: bg, color, fontFamily: 'inherit', fontWeight: 700,
                  fontSize: 'clamp(16px, 2.5vmin, 1.2rem)', textAlign: 'center',
                  cursor: guessIdx !== null ? 'default' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {opt}
                </button>
              );
            })}
          </div>
          {/* Explanation — pre-reserved space */}
          <div style={{ minHeight: 'clamp(48px, 8vmin, 64px)', width: '100%', maxWidth: 500 }}>
            {guessIdx !== null && (
              <div style={{
                padding: 'clamp(10px, 2vmin, 14px) clamp(14px, 2.5vmin, 20px)', borderRadius: 12,
                background: guessIdx === GUESS_CORRECT ? '#ECFDF5' : '#FEF2F2',
                fontSize: 'clamp(15px, 2.2vmin, 1.1rem)',
                color: guessIdx === GUESS_CORRECT ? '#065f46' : '#991b1b',
                fontWeight: 600, lineHeight: 1.5, textAlign: 'center',
                animation: 'fadeSlideIn 0.3s ease-out',
              }}>
                {guessIdx === GUESS_CORRECT
                  ? '答對了！形狀跟大小都要完全相同才算全等。'
                  : '不一定喔！只有形狀和大小都完全相同才算全等。'}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'p1' && (
        <InteractiveTriangle key="p1" puzzle={PUZZLES[0]}
          onComplete={() => handlePuzzleComplete(0)}
          onFail={() => {}}
          puzzleNum={1} />
      )}
      {phase === 'p1-done' && (
        <PuzzleDoneCard puzzle={PUZZLES[0]} success />
      )}

      {phase === 'p2' && (
        <InteractiveTriangle key="p2" puzzle={PUZZLES[1]}
          onComplete={() => handlePuzzleComplete(1)}
          onFail={() => {}}
          puzzleNum={2} />
      )}
      {phase === 'p2-done' && (
        <PuzzleDoneCard puzzle={PUZZLES[1]} success />
      )}

      {phase === 'p3' && (
        <InteractiveTriangle key="p3" puzzle={PUZZLES[2]}
          onComplete={() => handlePuzzleComplete(2)}
          onFail={handlePuzzleFail}
          puzzleNum={3} />
      )}
      {phase === 'p3-done' && (
        <PuzzleDoneCard puzzle={PUZZLES[2]} success={false} />
      )}

      {phase === 'reveal' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 18,
          padding: 'clamp(16px, 3vmin, 32px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '24px 32px',
            maxWidth: 520, border: '1px solid #E5E7EB',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            animation: 'fadeSlideIn 0.4s ease-out',
          }}>
            <div style={{ fontSize: 16, lineHeight: 1.9, color: '#293241' }}>
              <strong>「全等」</strong>= 不管怎麼平移、旋轉、翻轉，疊得上去就算。
              <br />→ 形狀跟大小都必須完全一樣
              <br />→ 大小不同的「相似」三角形不算全等
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom floating action bar ─── */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        height: 'clamp(60px, 9vmin, 72px)', padding: '0 clamp(14px, 2.5vmin, 20px)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Progress bar at top edge */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E5E7EB', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#ee6c4d', transition: 'width 0.3s ease' }} />
        </div>
        {/* Prev button — ALWAYS rendered, hidden via visibility */}
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
        }}>
          {actionLabel.text}
        </span>
        {/* Hint text */}
        <span style={{ flex: 1, fontSize: 'clamp(15px, 2.5vmin, 18px)', fontWeight: 600, color: hintColor }}>
          {displayHint}
        </span>
        {/* Next/Complete button — ALWAYS rendered, hidden via visibility */}
        <button onClick={(showNext || isLastStep) ? goToNextStep : undefined} style={{
          height: 'clamp(40px, 6vmin, 48px)', padding: '0 clamp(14px, 2.5vmin, 20px)', borderRadius: 10,
          border: 'none', background: isLastStep ? '#10B981' : '#3d5a80', color: 'white',
          cursor: (showNext || isLastStep) ? 'pointer' : 'default', fontWeight: 700, fontSize: 'clamp(15px, 2.5vmin, 18px)',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          visibility: (showNext || isLastStep) ? 'visible' : 'hidden',
        }}>
          {isLastStep ? '完成' : '下一步'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}

// ═══ Puzzle-done static view ═══
// Shows the two triangles perfectly overlapped at the original (fixed) position,
// so the player still sees the result of the puzzle they just solved while reading
// the conclusion in the hint banner. Continue button now lives in the bottom bar.
function PuzzleDoneCard({ puzzle, success }: { puzzle: PuzzleDef; success: boolean }) {
  const pts = puzzle.fixed.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <div style={{
      flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      <svg viewBox="0 0 560 400" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* Original (navy filled) */}
        <polygon points={pts}
          fill="#98c1d9" fillOpacity={0.35}
          stroke="#3d5a80" strokeWidth={3}
          strokeLinejoin="round" />
        {/* Operated triangle overlaying the original — orange outline only,
            so both shapes are visible at once */}
        {success && (
          <polygon points={pts}
            fill="none"
            stroke="#ee6c4d" strokeWidth={3}
            strokeDasharray="6 5"
            strokeLinejoin="round"
            style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
        )}
        {!success && (
          // For the non-congruent puzzle: show the operated (smaller) triangle
          // beside the original to make the size mismatch visible.
          (() => {
            const c = centroid(puzzle.fixed);
            const scale = puzzle.scale ?? 0.7;
            const operatedPts = puzzle.fixed
              .map(p => `${c.x + (p.x - c.x) * scale},${c.y + (p.y - c.y) * scale}`)
              .join(' ');
            return (
              <polygon points={operatedPts}
                fill="#fed7aa" fillOpacity={0.35}
                stroke="#ee6c4d" strokeWidth={3}
                strokeLinejoin="round"
                style={{ animation: 'fadeSlideIn 0.4s ease-out' }} />
            );
          })()
        )}
      </svg>
    </div>
  );
}

// ═══ Interactive triangle puzzle (one puzzle at a time) ═══
interface InteractiveProps {
  puzzle: PuzzleDef;
  onComplete: () => void;
  onFail: () => void;
  puzzleNum: number;
}

function InteractiveTriangle({ puzzle, onComplete, onFail, puzzleNum }: InteractiveProps) {
  // Compute initial points once
  const initialPoints = useMemo(() => buildInitialPoints(puzzle), [puzzle]);
  const initialCentroid = useMemo(() => centroid(initialPoints), [initialPoints]);

  // Transform state
  const [cx, setCx] = useState(initialCentroid.x);
  const [cy, setCy] = useState(initialCentroid.y);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [overlapStatus, setOverlapStatus] = useState<OverlapStatus>('far');
  const [failAttempts, setFailAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [rejectFlash, setRejectFlash] = useState(false);
  const [failTriggered, setFailTriggered] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    mode: 'translate' | 'rotate' | null;
    startSx: number;
    startSy: number;
    startCx: number;
    startCy: number;
    startRot: number;
    startMouseAngle: number;
  }>({ mode: null, startSx: 0, startSy: 0, startCx: 0, startCy: 0, startRot: 0, startMouseAngle: 0 });

  // Convert client → SVG coords
  const toSvg = useCallback((clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    return {
      x: inv.a * clientX + inv.c * clientY + inv.e,
      y: inv.b * clientX + inv.d * clientY + inv.f,
    };
  }, []);

  // Compute actual points: apply flip + rotation around base centroid, then translate to (cx, cy)
  const baseCentroid = initialCentroid;
  const actualPoints = useMemo((): Triangle => {
    return initialPoints.map(p => {
      let dx = p.x - baseCentroid.x;
      let dy = p.y - baseCentroid.y;
      if (flipped) dx = -dx;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return { x: cx + rx, y: cy + ry };
    }) as Triangle;
  }, [initialPoints, baseCentroid, cx, cy, rotation, flipped]);

  // Rotate handle position (offset 70px above current centroid, rotated)
  const rotateHandle = useMemo((): Point => {
    const handleDist = 70;
    return {
      x: cx + handleDist * Math.cos(rotation - Math.PI / 2),
      y: cy + handleDist * Math.sin(rotation - Math.PI / 2),
    };
  }, [cx, cy, rotation]);

  // ═══ Pointer handlers ═══
  const onBodyDown = useCallback((e: React.PointerEvent) => {
    if (isSnapping || completed) return;
    e.preventDefault();
    const sp = toSvg(e.clientX, e.clientY);
    if (!sp) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode: 'translate',
      startSx: sp.x, startSy: sp.y,
      startCx: cx, startCy: cy,
      startRot: rotation, startMouseAngle: 0,
    };
    playSound('click');
  }, [isSnapping, completed, toSvg, cx, cy, rotation]);

  const onRotateDown = useCallback((e: React.PointerEvent) => {
    if (isSnapping || completed) return;
    e.preventDefault();
    e.stopPropagation();
    const sp = toSvg(e.clientX, e.clientY);
    if (!sp) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const mouseAngle = Math.atan2(sp.y - cy, sp.x - cx);
    dragRef.current = {
      mode: 'rotate',
      startSx: sp.x, startSy: sp.y,
      startCx: cx, startCy: cy,
      startRot: rotation, startMouseAngle: mouseAngle,
    };
    playSound('click');
  }, [isSnapping, completed, toSvg, cx, cy, rotation]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (snappingRef.current) return;
    const d = dragRef.current;
    if (!d.mode) return;
    const sp = toSvg(e.clientX, e.clientY);
    if (!sp) return;
    if (d.mode === 'translate') {
      const dx = sp.x - d.startSx;
      const dy = sp.y - d.startSy;
      setCx(d.startCx + dx);
      setCy(d.startCy + dy);
    } else {
      const newAngle = Math.atan2(sp.y - d.startCy, sp.x - d.startCx);
      const delta = newAngle - d.startMouseAngle;
      setRotation(d.startRot + delta);
    }
  }, [toSvg]);

  const onUp = useCallback(() => {
    dragRef.current.mode = null;
  }, []);

  const flip = useCallback(() => {
    if (isSnapping || completed || !puzzle.unlockFlip) return;
    setFlipped(f => !f);
    playSound('click');
  }, [isSnapping, completed, puzzle.unlockFlip]);

  const reset = useCallback(() => {
    if (isSnapping) return;
    setCx(initialCentroid.x);
    setCy(initialCentroid.y);
    setRotation(0);
    setFlipped(false);
    playSound('click');
  }, [isSnapping, initialCentroid]);

  // ═══ Snap animation ═══
  // Use refs to avoid stale closures and dependency loops
  const cxRef = useRef(cx); cxRef.current = cx;
  const cyRef = useRef(cy); cyRef.current = cy;
  const rotRef = useRef(rotation); rotRef.current = rotation;
  const onCompleteRef = useRef(onComplete); onCompleteRef.current = onComplete;

  const snapTo = useCallback((targetCx: number, targetCy: number, targetRot: number) => {
    dragRef.current.mode = null; // stop any active drag immediately
    setIsSnapping(true);
    const sCx = cxRef.current, sCy = cyRef.current, sRot = rotRef.current;
    const startTime = performance.now();
    const duration = 350;
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - (1 - t) ** 3;
      setCx(sCx + (targetCx - sCx) * ease);
      setCy(sCy + (targetCy - sCy) * ease);
      setRotation(sRot + (targetRot - sRot) * ease);
      if (t < 1) requestAnimationFrame(animate);
      else {
        setCompleted(true);
        setTimeout(() => onCompleteRef.current(), 2500);
      }
    };
    requestAnimationFrame(animate);
  }, []); // stable — no deps, uses refs

  // ═══ Overlap detection ═══
  const snappingRef = useRef(false);
  useEffect(() => {
    if (completed || isSnapping || snappingRef.current) return;
    const result = checkOverlap(puzzle.fixed, actualPoints, puzzle.isCongruent);
    setOverlapStatus(result.status);

    if (result.status === 'close' && puzzle.isCongruent) {
      // Prevent re-triggering
      snappingRef.current = true;
      const fixedC = centroid(puzzle.fixed);
      const extraRot = computeSnapRotation(puzzle.fixed, actualPoints, result.pairs);
      snapTo(fixedC.x, fixedC.y, rotRef.current + extraRot);
    } else if (result.status === 'near' && !puzzle.isCongruent && result.centroidDist < 60) {
      setRejectFlash(true);
      setTimeout(() => setRejectFlash(false), 400);
      setFailAttempts(prev => prev + 1);
    }
  }, [actualPoints, completed, isSnapping, puzzle, snapTo]);

  // ═══ Non-congruent timer + fail trigger ═══
  useEffect(() => {
    if (puzzle.isCongruent || completed) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [puzzle.isCongruent, completed]);

  useEffect(() => {
    if (puzzle.isCongruent || completed || failTriggered) return;
    if (failAttempts >= 3 || elapsed >= 20) {
      setFailTriggered(true);
      // Give the player ~2.5s to read the failure message before advancing.
      setTimeout(onFail, 2500);
    }
  }, [failAttempts, elapsed, puzzle.isCongruent, completed, failTriggered, onFail]);

  // ═══ Visual states ═══
  const fixedStroke = completed ? '#4ade80' : '#3d5a80';
  const fixedStrokeWidth = completed ? 4 : 3;
  const operatedStroke = rejectFlash ? '#f87171' : completed ? '#4ade80' : '#ee6c4d';
  const operatedStrokeWidth = rejectFlash ? 5 : completed ? 4 : 2.5;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 10, userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}>
      {/* SVG canvas */}
      <div style={{
        flex: 1, background: 'white', borderRadius: 14, border: '1px solid #E5E7EB',
        overflow: 'hidden', position: 'relative', touchAction: 'none',
      }}>
        <svg ref={svgRef} viewBox="0 0 560 400"
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onPointerCancel={onUp}
        >
          {/* Background grid for spatial reference */}
          {Array.from({ length: 15 }, (_, i) => Array.from({ length: 11 }, (_, j) => (
            <circle key={`g${i}-${j}`} cx={20 + i * 40} cy={20 + j * 40} r="1" fill="#E5E7EB" />
          ))).flat()}

          {/* Fixed (original) triangle */}
          <polygon
            points={puzzle.fixed.map(p => `${p.x},${p.y}`).join(' ')}
            fill="#98c1d9" fillOpacity={0.22}
            stroke={fixedStroke} strokeWidth={fixedStrokeWidth}
            strokeLinejoin="round"
            style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
          />
          <text x={centroid(puzzle.fixed).x} y={centroid(puzzle.fixed).y + 5}
            textAnchor="middle" fontSize="13" fontWeight="900" fill="#3d5a80">原件</text>

          {/* Operated triangle */}
          <polygon
            points={actualPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="white" fillOpacity={0.85}
            stroke={operatedStroke} strokeWidth={operatedStrokeWidth}
            strokeLinejoin="round"
            style={{ cursor: completed || isSnapping ? 'default' : 'grab', transition: 'stroke 0.2s' }}
            onPointerDown={onBodyDown}
          />

          {/* Rotate handle — dashed line from centroid + orange circle with white rotate icon */}
          {!completed && !isSnapping && (
            <>
              <line x1={cx} y1={cy} x2={rotateHandle.x} y2={rotateHandle.y}
                stroke="#ee6c4d" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4}
                pointerEvents="none" />
              <g style={{ cursor: 'grab' }} onPointerDown={onRotateDown}>
                <circle cx={rotateHandle.x} cy={rotateHandle.y} r={14}
                  fill="#ee6c4d" stroke="white" strokeWidth={2} />
                {/* Material rotate icon scaled to fit (960→24 viewBox, centered in circle) */}
                <g transform={`translate(${rotateHandle.x},${rotateHandle.y}) scale(0.022) translate(-480, 480)`}
                  pointerEvents="none">
                  <path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z"
                    fill="white" />
                </g>
              </g>
            </>
          )}

          {/* Success ripple */}
          {completed && (() => {
            const c = centroid(puzzle.fixed);
            return (
              <circle cx={c.x} cy={c.y} r="20" fill="none" stroke="#4ade80" strokeWidth="3" opacity="0.8"
                style={{ animation: 'ripple-expand 0.8s ease-out forwards' }} />
            );
          })()}
        </svg>

        {/* Overlay hint for non-congruent fail */}
        {!puzzle.isCongruent && failAttempts >= 1 && !completed && (
          <div style={{
            position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(248,113,113,0.95)', color: 'white', borderRadius: 10,
            padding: '6px 14px', fontSize: 13, fontWeight: 600,
          }}>
            疊不上去——大小不一樣
          </div>
        )}

        {/* Flip button — inside the container, bottom-center */}
        {puzzle.unlockFlip && !completed && !isSnapping && (
          <button onClick={flip}
            style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              width: 48, height: 48, borderRadius: 14,
              border: 'none', cursor: 'pointer',
              background: '#ee6c4d', color: 'white',
              fontWeight: 900, fontSize: 20,
              boxShadow: '0 2px 8px rgba(238,108,77,0.3)',
              touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            ↔
          </button>
        )}
      </div>
    </div>
  );
}
