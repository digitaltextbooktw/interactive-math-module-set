import { useState, useCallback, useRef } from 'react';
import { quizQuestions } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (score: number, wrong: number) => void;
}

function QuizIllustration({ qIndex, answered }: { qIndex: number; answered: number | null }) {
  const borderColor = answered !== null ? (answered === quizQuestions[qIndex].correctIndex ? '#10B981' : '#EF4444') : '#3d5a80';
  switch (qIndex) {
    case 0:
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 100,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="95" y="52" fontSize="12" fontWeight="900" fill="#3d5a80">50°</text>
          <text x="68" y="100" fontSize="12" fontWeight="900" fill="#3d5a80">70°</text>
          <text x="172" y="100" fontSize="14" fontWeight="900" fill="#ee6c4d">?°</text>
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 80,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="78" y="52" fontSize="12" fontWeight="900" fill="#3d5a80">60°</text>
          <text x="68" y="100" fontSize="12" fontWeight="900" fill="#94A3B8">?°</text>
          <text x="172" y="100" fontSize="13" fontWeight="900" fill="#ee6c4d">140°</text>
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 120,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="105" y="72" fontSize="24" fontWeight="900" fill="#94A3B8">?</text>
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="30,110 160,110 160,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="65" y="100" fontSize="12" fontWeight="900" fill="#3d5a80">30°</text>
          <text x="145" y="58" fontSize="11" fontWeight="900" fill="#94A3B8">?°</text>
          <text x="172" y="100" fontSize="13" fontWeight="900" fill="#ee6c4d">90°</text>
        </svg>
      );
    default: return null;
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 20px 15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: '#293241' }}>概念檢核</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#94A3B8' }}>{qIdx + 1} / {quizQuestions.length}</span>
      </div>

      {/* Card area with arrows */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minHeight: 0 }}>
        <NavArrow direction="left" disabled={qIdx === 0} onClick={() => goTo('prev')} />

        <div style={{
          flex: '0 1 auto', maxWidth: 820, width: '100%', margin: '0 auto',
          background: 'white', borderRadius: 24, padding: '24px 34px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
          display: 'flex', flexDirection: 'column',
          animation: slideDir === 'in' ? 'fadeSlideIn 0.3s ease-out' : slideDir === 'out' ? 'fadeSlideOut 0.3s ease-in forwards' : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <QuizIllustration qIndex={qIdx} answered={answered} />
          </div>
          <div style={{ fontSize: 'clamp(20px, 3.5vmin, 1.8rem)', fontWeight: 800, marginBottom: 'clamp(14px, 3vmin, 22px)', color: '#293241', lineHeight: 1.5 }}>
            {q.text}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(10px, 2vmin, 14px)' }}>
            {q.options.map((opt, i) => {
              let bg = 'white', border = '#e5e7eb', color = '#293241';
              if (answered !== null) {
                if (i === q.correctIndex) { bg = '#d1fae5'; border = '#10B981'; color = '#065f46'; }
                else if (i === answered && i !== q.correctIndex) { bg = '#fee2e2'; border = '#EF4444'; color = '#991b1b'; }
              }
              const hasDegree = /°/.test(opt);
              return (
                <button key={i} onClick={() => handleAnswer(i)} className={hasDegree ? 'font-en' : ''} style={{
                  padding: 'clamp(14px, 2.5vmin, 20px) clamp(16px, 3vmin, 26px)',
                  border: `2px solid ${border}`, borderRadius: 14,
                  cursor: answered !== null ? 'default' : 'pointer', fontWeight: 700,
                  fontSize: 'clamp(18px, 3vmin, 1.4rem)',
                  textAlign: 'center', background: bg, color, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {opt}
                </button>
              );
            })}
          </div>
          {/* Explanation — fixed height reservation so options never move */}
          <div style={{ minHeight: 60, marginTop: 'clamp(10px, 2vmin, 16px)' }}>
            {answered !== null && (
              <div style={{
                padding: 'clamp(10px, 2vmin, 14px) clamp(14px, 2.5vmin, 20px)', borderRadius: 12,
                background: answered === q.correctIndex ? '#ECFDF5' : '#FEF2F2',
                fontSize: 'clamp(16px, 2.5vmin, 1.2rem)', color: answered === q.correctIndex ? '#065f46' : '#991b1b',
                fontWeight: 600, lineHeight: 1.5, animation: 'fadeSlideIn 0.3s ease-out',
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14 }}>
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
