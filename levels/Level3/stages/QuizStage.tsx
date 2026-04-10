import { useState, useCallback, useRef } from 'react';
import { quizQuestions } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (score: number, wrong: number) => void;
}

function QuizIllustration({ qIndex, answered }: { qIndex: number; answered: number | null }) {
  const borderColor = answered !== null ? (answered === quizQuestions[qIndex].correctIndex ? '#10B981' : '#EF4444') : '#3d5a80';
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
    case 2:
      // SAS: two sides + included angle
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="40,120 160,120 90,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <text x="100" y="138" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">5</text>
          <text x="50" y="68" textAnchor="middle" fontSize="13" fontWeight="900" className="font-en" fill="#3d5a80">7</text>
          {/* Angle arc at bottom-left: from base direction (right) to left-edge direction (up-right) */}
          <path d="M 60 120 A 20 20 0 0 0 49 102" fill="none" stroke="#ee6c4d" strokeWidth="2" />
          <text x="64" y="109" fontSize="12" fontWeight="900" className="font-en" fill="#ee6c4d">60°</text>
        </svg>
      );
    case 3:
      // AAA: three angles, different sizes
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          {/* Small triangle */}
          <polygon points="30,110 90,110 60,65" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
          <text x="60" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94A3B8">小</text>
          {/* Large triangle */}
          <polygon points="80,120 190,120 135,30" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" strokeLinejoin="round" />
          <text x="135" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94A3B8">大</text>
          {/* Angles */}
          <text x="130" y="50" fontSize="11" fontWeight="900" className="font-en" fill="#3d5a80">40°</text>
          <text x="95" y="112" fontSize="11" fontWeight="900" className="font-en" fill="#3d5a80">60°</text>
          <text x="172" y="112" fontSize="11" fontWeight="900" className="font-en" fill="#3d5a80">80°</text>
          <text x="135" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ee6c4d">全等？</text>
        </svg>
      );
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
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(quizQuestions.map(() => null));
  const [results, setResults] = useState<(boolean | null)[]>(quizQuestions.map(() => null));
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
            <QuizIllustration qIndex={qIdx} answered={answered} />
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
          {/* Explanation — fixed height reservation so options never move */}
          <div style={{ minHeight: 56, marginTop: 'clamp(10px, 2vmin, 14px)' }}>
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
