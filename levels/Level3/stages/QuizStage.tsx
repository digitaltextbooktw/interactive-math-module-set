import { useState, useCallback, useRef, useMemo } from 'react';
import { getCurrentQuizQuestions } from '../data';
import type { QuizQuestion } from '../../../types';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (score: number, wrong: number) => void;
}

function QuizIllustration({ qIndex, answered, questions }: { qIndex: number; answered: number | null; questions: QuizQuestion[] }) {
  const q = questions[qIndex];
  if (!q || (!q.id.startsWith('L3') && !q.id.startsWith('L4'))) return null;
  const borderColor = answered !== null ? (answered === q.correctIndex ? '#10B981' : '#EF4444') : '#3d5a80';

  // SAS 區塊（L4Q1 ~ L4Q4）
  if (q.id.startsWith('L4')) {
    switch (q.id) {
      case 'L4Q1': {
        // SAS: 兩個三角形 AB=5（橫底）、AC=7（向右上 40°）、夾角 ∠A=40°
        // 比例 15/單位 → AB = 75, AC = 105
        // 左三角形：A=(30,115), B=(105,115), C=A+105·(cos40°, -sin40°) ≈ (110.4, 47.5)
        // 右三角形：平移 +200 → A'=(230,115), B'=(305,115), C'=(310.4, 47.5)
        return (
          <svg viewBox="0 0 360 145" width="360" height="145" style={{ maxWidth: '100%', height: 'auto' }}>
            {/* 左三角形 */}
            <polygon points="30,115 105,115 110.4,47.5" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* AB = 5（底） */}
            <text x="67.5" y="132" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
            {/* AC = 7（左斜邊） */}
            <text x="58" y="80" textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">7</text>
            {/* 40° 弧在 A：從 +x 方向到 (cos40°, -sin40°) 方向 */}
            <path d="M 48 115 A 18 18 0 0 0 43.79 103.43" fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x="56" y="108" fontSize="12" fontWeight="900" className="font-en" fill="#ee6c4d">40°</text>

            {/* ≅? */}
            <text x="180" y="85" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ee6c4d">≅?</text>

            {/* 右三角形（同形狀） */}
            <polygon points="230,115 305,115 310.4,47.5" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            <text x="267.5" y="132" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
            <text x="258" y="80" textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">7</text>
            <path d="M 248 115 A 18 18 0 0 0 243.79 103.43" fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x="256" y="108" fontSize="12" fontWeight="900" className="font-en" fill="#ee6c4d">40°</text>
          </svg>
        );
      }

      case 'L4Q2': {
        // △ABC（SAS）vs △DEF（SSA）— 同樣 4、7、30° 但角的位置不同 → 形狀不同
        // 比例 15/單位
        // 左 △ABC：A=(20,115), B=(80,115)[AB=60=4], C=A+105·(cos30°,-sin30°)=(110.93,62.5)
        //   BC ≈ 4.06 → 60.9px ✓
        // 右 △DEF：F=(190,115)（角的位置）, E=F+(120,0)=(310,115)[FE=120=8],
        //   D=F+105·(cos30°,-sin30°)=(280.93,62.5)
        //   DE = √((310-280.93)²+(115-62.5)²) = √(844.7+2756.25) ≈ 60 = 4 ✓
        //   DF = 105 = 7 ✓
        return (
          <svg viewBox="0 0 360 150" width="360" height="150" style={{ maxWidth: '100%', height: 'auto' }}>
            {/* 左 △ABC（SAS：∠A 夾在 AB 與 AC 之間） */}
            <polygon points="20,115 80,115 110.93,62.5" fill="#dbeafe" fillOpacity="0.5" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* 30° 弧在 A */}
            <path d="M 38 115 A 18 18 0 0 0 35.59 106" fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x="46" y="108" fontSize="11" fontWeight="900" className="font-en" fill="#ee6c4d">30°</text>
            {/* AB = 4（底） */}
            <text x="50" y="130" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">4</text>
            {/* AC = 7（斜邊） */}
            <text x="55" y="82" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">7</text>
            {/* 頂點 A、B、C */}
            <circle cx="20" cy="115" r="2.5" fill="#293241" />
            <circle cx="80" cy="115" r="2.5" fill="#293241" />
            <circle cx="110.93" cy="62.5" r="2.5" fill="#293241" />
            <text x="14" y="123" textAnchor="end" fontSize="11" fontWeight="900" fill="#293241">A</text>
            <text x="83" y="125" fontSize="11" fontWeight="900" fill="#293241">B</text>
            <text x="115" y="62" fontSize="11" fontWeight="900" fill="#293241">C</text>

            {/* ≅? */}
            <text x="150" y="92" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ee6c4d">≅?</text>

            {/* 右 △DEF（SSA：∠F 不在 DE 和 DF 的交點） */}
            <polygon points="190,115 310,115 280.93,62.5" fill="#fed7aa" fillOpacity="0.4" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* 30° 弧在 F（介於 FE 與 FD 之間） */}
            <path d="M 208 115 A 18 18 0 0 0 205.59 106" fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x="216" y="108" fontSize="11" fontWeight="900" className="font-en" fill="#ee6c4d">30°</text>
            {/* DF = 7（左斜邊：F 到 D） */}
            <text x="225" y="82" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">7</text>
            {/* DE = 4（右斜邊：D 到 E） */}
            <text x="305" y="82" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">4</text>
            {/* 頂點 F、E、D */}
            <circle cx="190" cy="115" r="2.5" fill="#293241" />
            <circle cx="310" cy="115" r="2.5" fill="#293241" />
            <circle cx="280.93" cy="62.5" r="2.5" fill="#293241" />
            <text x="184" y="123" textAnchor="end" fontSize="11" fontWeight="900" fill="#293241">F</text>
            <text x="313" y="125" fontSize="11" fontWeight="900" fill="#293241">E</text>
            <text x="285" y="58" fontSize="11" fontWeight="900" fill="#293241">D</text>
          </svg>
        );
      }

      case 'L4Q3':
        // SAS: 邊 6、6 但夾角 30° vs 90°
        return (
          <svg viewBox="0 0 360 145" width="360" height="145" style={{ maxWidth: '100%', height: 'auto' }}>
            {/* 左：頂角 30° 細長等腰三角形（頂點在上） */}
            {/* 頂點 (90, 30)，邊長 80，半夾角 15° */}
            {/* 左下 = (90 - 80·sin15°, 30 + 80·cos15°) ≈ (69.3, 107.3) */}
            {/* 右下 = (110.7, 107.3) */}
            <polygon points="90,30 69.3,107.3 110.7,107.3" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* 30° 弧在頂點 */}
            <path d="M 84 50 A 20 20 0 0 0 96 50" fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x="90" y="65" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#ee6c4d">30°</text>
            {/* 邊長 6 */}
            <text x="62" y="68" textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">6</text>
            <text x="118" y="68" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">6</text>

            {/* ≅? 中央 */}
            <text x="180" y="80" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ee6c4d">≅?</text>

            {/* 右：頂角 90° 直角等腰三角形 */}
            {/* 頂點 (270, 30)，邊長 65，半夾角 45° */}
            {/* 左下 = (270 - 65·sin45°, 30 + 65·cos45°) ≈ (224.0, 75.96) */}
            {/* 右下 = (316.0, 75.96) */}
            <polygon points="270,30 224.0,75.96 316.0,75.96" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* 90° 直角符號 */}
            <path d="M 261 39 L 270 48 L 279 39" fill="none" stroke="#ee6c4d" strokeWidth="1.6" />
            <text x="270" y="63" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#ee6c4d">90°</text>
            {/* 邊長 6 */}
            <text x="237" y="48" textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">6</text>
            <text x="303" y="48" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">6</text>
          </svg>
        );

      case 'L4Q4': {
        // SAS: △ABC, AB=8, AC=5, ∠A=70°（單一三角形「唯一？」）
        // viewBox 280×145
        // A(60, 120), B(180, 120) → AB=120(=8，比例 15/單位)
        // C = A + 75·(cos(-70°), sin(-70°)) = A + (25.65, -70.48) = (85.65, 49.52)
        const Ax = 60, Ay = 120;
        const Bx = 180, By = 120;
        const Cx = 85.65, Cy = 49.52;
        return (
          <svg viewBox="0 0 280 145" width="280" height="145" style={{ maxWidth: '100%', height: 'auto' }}>
            <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`} fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
            {/* 70° 弧在 A */}
            <path d={`M ${Ax + 22} ${Ay} A 22 22 0 0 0 ${Ax + 22 * 0.342} ${Ay - 22 * 0.940}`} fill="none" stroke="#ee6c4d" strokeWidth="2" />
            <text x={Ax + 30} y={Ay - 10} fontSize="13" fontWeight="900" className="font-en" fill="#ee6c4d">70°</text>
            {/* AB = 8 */}
            <text x={(Ax + Bx) / 2} y={Ay + 17} textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">8</text>
            {/* AC = 5 */}
            <text x={(Ax + Cx) / 2 - 10} y={(Ay + Cy) / 2 + 4} textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
            {/* 頂點 A、B、C */}
            <circle cx={Ax} cy={Ay} r="3" fill="#293241" />
            <circle cx={Bx} cy={By} r="3" fill="#293241" />
            <circle cx={Cx} cy={Cy} r="3" fill="#293241" />
            <text x={Ax - 12} y={Ay + 5} fontSize="13" fontWeight="900" fill="#293241">A</text>
            <text x={Bx + 6} y={By + 5} fontSize="13" fontWeight="900" fill="#293241">B</text>
            <text x={Cx - 4} y={Cy - 6} textAnchor="end" fontSize="13" fontWeight="900" fill="#293241">C</text>
            {/* 唯一？ */}
            <text x="225" y="80" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ee6c4d">唯一？</text>
          </svg>
        );
      }

      default:
        return null;
    }
  }

  // SSS 區塊（L3Q1 ~ L3Q4）— 沿用既有 qIndex 對應
  switch (qIndex) {
    case 0: {
      // Compass on a segment — needle on the right endpoint
      const needleX = 170, needleY = 110;
      const pencilX = 110, pencilY = 110;
      const hingeX = needleX + (pencilX - needleX) * 0.25;
      const hingeY = needleY - 65;
      const headY = hingeY - 12;
      const knobY = headY - 14;
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          {/* Segment */}
          <line x1="40" y1="110" x2="170" y2="110" stroke="#3d5a80" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy="110" r="4" fill="#3d5a80" />
          <circle cx="170" cy="110" r="4" fill="#3d5a80" />
          {/* Compass: needle leg */}
          <line x1={hingeX} y1={hingeY} x2={needleX} y2={needleY}
            stroke="#9E9690" strokeWidth="3" strokeLinecap="round" />
          {/* Compass: pencil leg */}
          <line x1={hingeX} y1={hingeY} x2={pencilX} y2={pencilY}
            stroke="#B5AFA9" strokeWidth="2.2" strokeLinecap="round" />
          {/* Hinge bolt */}
          <rect x={hingeX - 4} y={hingeY - 2.5} width="8" height="5" rx="1.5" fill="#AEA8A3" />
          {/* Neck */}
          <line x1={hingeX} y1={hingeY} x2={hingeX} y2={headY + 6}
            stroke="#9E9690" strokeWidth="2.5" strokeLinecap="round" />
          {/* Head ring */}
          <circle cx={hingeX} cy={headY} r="6" fill="none" stroke="#9E9690" strokeWidth="2" />
          {/* Knob */}
          <rect x={hingeX - 2.5} y={knobY - 3} width="5" height="7" rx="1.5" fill="#9E9690" />
        </svg>
      );
    }
    case 1:
      // SSS: three sides labeled
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="40,120 160,120 110,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <text x="100" y="138" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">6</text>
          <text x="58" y="68" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
          <text x="148" y="68" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">4</text>
          <text x="100" y="85" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ee6c4d">唯一？</text>
        </svg>
      );
    case 2: {
      // L3Q3: two 3-4-5 right triangles, right one mirrored — same three sides ⇒ SSS congruent
      return (
        <svg viewBox="0 0 360 145" width="360" height="145" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Left triangle: apex A (right angle), B bottom-left, C bottom-right */}
          <polygon points="66,62 30,110 130,110" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 61.2 68.4 L 67.6 73.2 L 72.4 66.8" fill="none" stroke={borderColor} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="37" y="82" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">3</text>
          <text x="106" y="80" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">4</text>
          <text x="80" y="128" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>

          {/* ≅? in the middle */}
          <text x="180" y="92" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ee6c4d">≅?</text>

          {/* Right triangle: mirror of the left one — apex A', B' bottom-right, C' bottom-left */}
          <polygon points="294,62 330,110 230,110" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 298.8 68.4 L 292.4 73.2 L 287.6 66.8" fill="none" stroke={borderColor} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="254" y="80" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">4</text>
          <text x="323" y="82" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">3</text>
          <text x="280" y="128" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
        </svg>
      );
    }
    case 3: {
      // L3Q4: △ABC (5,12,13) vs △DEF (12,13,5) — both 5-12-13 right triangles, mirrored
      return (
        <svg viewBox="0 65 380 95" width="380" height="95" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Left triangle: A top-left, B bottom-left (right angle), C bottom-right */}
          <polygon points="30,80 30,130 150,130" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 38 130 L 38 122 L 30 122" fill="none" stroke={borderColor} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="22" y="110" textAnchor="end" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
          <text x="90" y="148" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">12</text>
          <text x="96" y="97" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">13</text>

          {/* ≅? in the middle */}
          <text x="190" y="115" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ee6c4d">≅?</text>

          {/* Right triangle (mirrored): F top-right, D bottom-right (right angle), E bottom-left */}
          {/* DE = 12 (bottom), EF = 13 (hypotenuse), FD = 5 (right vertical) */}
          <polygon points="350,80 350,130 230,130" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 342 130 L 342 122 L 350 122" fill="none" stroke={borderColor} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="358" y="110" textAnchor="start" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
          <text x="290" y="148" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">12</text>
          <text x="284" y="97" textAnchor="middle" fontSize="14" fontWeight="900" className="font-en" fill="#3d5a80">13</text>
        </svg>
      );
    }
    default:
      return null;
  }
}

function NavArrow({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  const color = disabled ? '#CBD5E1' : '#3d5a80';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
        padding: 4, opacity: disabled ? 0.3 : 1, transition: 'opacity 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 28" width="20" height="24">
        {direction === 'left'
          ? <path d="M17 4 L7 14 L17 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M7 4 L17 14 L7 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </button>
  );
}

export default function QuizStage({ onComplete }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quizQuestions = useMemo(() => getCurrentQuizQuestions(), []);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => quizQuestions.map(() => null));
  const [results, setResults] = useState<(boolean | null)[]>(() => quizQuestions.map(() => null));
  const [slideDir, setSlideDir] = useState<'in' | 'out' | null>('in');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const transitionRef = useRef(false);

  const q = quizQuestions[qIdx];
  const answered = answers[qIdx];

  const handleAnswer = useCallback((idx: number) => {
    if (answered !== null) return;
    const isCorrect = idx === quizQuestions[qIdx].correctIndex;

    if (isCorrect) playSound('success');
    else playSound('wrong');

    setAnswers(prev => { const n = [...prev]; n[qIdx] = idx; return n; });
    setResults(prev => { const n = [...prev]; n[qIdx] = isCorrect; return n; });
  }, [answered, qIdx]);

  const allAnswered = answers.every(a => a !== null);

  const handleFinish = useCallback(() => {
    const finalScore = answers.filter((a, i) => a === quizQuestions[i].correctIndex).length;
    const finalWrong = quizQuestions.length - finalScore;
    onCompleteRef.current(finalScore, finalWrong);
  }, [answers]);

  const goTo = useCallback((dir: 'prev' | 'next') => {
    if (transitionRef.current) return;
    const target = dir === 'prev' ? qIdx - 1 : qIdx + 1;
    if (target < 0 || target >= quizQuestions.length) return;
    transitionRef.current = true;
    setSlideDir('out');
    setTimeout(() => {
      setQIdx(target);
      setSlideDir('in');
      transitionRef.current = false;
    }, 200);
  }, [qIdx]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 'clamp(12px, 2.5vmin, 20px) clamp(12px, 2.5vmin, 20px) clamp(10px, 2vmin, 15px)', touchAction: 'manipulation' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(10px, 2vmin, 16px)' }}>
        <span style={{ fontWeight: 900, fontSize: 'clamp(15px, 2.5vmin, 18px)', color: '#293241' }}>概念檢核</span>
        <span style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)', color: '#94A3B8' }}>{qIdx + 1} / {quizQuestions.length}</span>
      </div>

      {/* Card area with arrows */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minHeight: 0 }}>
        <NavArrow direction="left" disabled={qIdx === 0} onClick={() => goTo('prev')} />

        <div style={{
          flex: '0 1 auto', maxWidth: 820, width: '100%', margin: '0 auto',
          background: 'white', borderRadius: 24,
          padding: 'clamp(16px, 3.5vmin, 24px) clamp(16px, 4vmin, 32px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
          display: 'flex', flexDirection: 'column',
          animation: slideDir === 'in' ? 'fadeSlideIn 0.3s ease-out' : slideDir === 'out' ? 'fadeSlideOut 0.3s ease-in forwards' : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(10px, 2vmin, 16px)' }}>
            <QuizIllustration qIndex={qIdx} answered={answered} questions={quizQuestions} />
          </div>
          <div style={{ fontSize: 'clamp(18px, 3vmin, 1.6rem)', fontWeight: 800, marginBottom: 'clamp(12px, 2.5vmin, 20px)', color: '#293241', lineHeight: 1.5 }}>
            {q.text}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(8px, 1.5vmin, 14px)' }}>
            {q.options.map((opt, i) => {
              let bg = 'white';
              let borderColor = '#e5e7eb';
              let color = '#293241';

              if (answered !== null) {
                if (i === q.correctIndex) {
                  bg = '#d1fae5'; borderColor = '#10B981'; color = '#065f46';
                } else if (i === answered && i !== q.correctIndex) {
                  bg = '#fee2e2'; borderColor = '#EF4444'; color = '#991b1b';
                }
              }

              const hasDegree = /°/.test(opt);
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={hasDegree ? 'font-en' : ''}
                  style={{
                    padding: 'clamp(12px, 2vmin, 18px) clamp(14px, 2.5vmin, 22px)',
                    border: `2px solid ${borderColor}`, borderRadius: 14,
                    cursor: answered !== null ? 'default' : 'pointer', fontWeight: 700,
                    fontSize: 'clamp(16px, 2.5vmin, 1.3rem)',
                    textAlign: 'center', background: bg, color, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {/* Explanation — pre-reserved space, always in flow so card height stays fixed */}
          <div style={{ minHeight: 'clamp(56px, 10vmin, 80px)', marginTop: 'clamp(10px, 2vmin, 14px)' }}>
            {answered !== null && (
              <div style={{
                padding: 'clamp(10px, 2vmin, 14px) clamp(14px, 2.5vmin, 20px)', borderRadius: 12,
                background: answered === q.correctIndex ? '#ECFDF5' : '#FEF2F2',
                fontSize: 'clamp(15px, 2.2vmin, 1.1rem)', color: answered === q.correctIndex ? '#065f46' : '#991b1b',
                fontWeight: 600, lineHeight: 1.5,
                animation: 'fadeSlideIn 0.3s ease-out',
              }}>
                {q.explanation}
              </div>
            )}
          </div>
        </div>

        {/* Right: next arrow, or checkmark when all answered on last question */}
        {allAnswered && qIdx === quizQuestions.length - 1 ? (
          <button onClick={handleFinish} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 40 40" width="36" height="36">
              <circle cx="20" cy="20" r="18" fill="#3d5a80" />
              <path d="M12 20 L18 26 L28 14" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <NavArrow direction="right" disabled={qIdx === quizQuestions.length - 1} onClick={() => goTo('next')} />
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 'clamp(8px, 1.5vmin, 16px)' }}>
        {results.map((r, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: r === true ? '#10B981' : r === false ? '#EF4444' : 'transparent',
            border: `2px solid ${r === true ? '#10B981' : r === false ? '#EF4444' : i === qIdx ? '#3d5a80' : '#CBD5E1'}`,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}
