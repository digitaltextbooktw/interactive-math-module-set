import { useState, useCallback, useRef } from 'react';
import { quizQuestions } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (score: number, wrong: number) => void;
}

// Triangle SVG illustrations for each question
function QuizTriangle({ qIndex, answered }: { qIndex: number; answered: number | null }) {
  const correct = quizQuestions[qIndex].correctIndex;
  const isRight = answered === correct;
  const borderColor = answered !== null ? (isRight ? '#10B981' : '#EF4444') : '#3d5a80';

  switch (qIndex) {
    case 0: // 50° + 60° + 70°
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="100,15 30,125 170,125" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" />
          <text x="100" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#534AB7">50°</text>
          <text x="45" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0F6E56">60°</text>
          <text x="155" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#993C1D">70°</text>
        </svg>
      );
    case 1: // 40° + 80° + 70°
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="80,15 20,125 180,125" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" />
          <text x="80" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#534AB7">40°</text>
          <text x="35" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0F6E56">80°</text>
          <text x="160" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#993C1D">70°</text>
        </svg>
      );
    case 2: // 35° + 65° + ?°
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="110,15 30,125 170,125" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" />
          <text x="110" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#94A3B8">?°</text>
          <text x="45" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0F6E56">35°</text>
          <text x="155" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#993C1D">65°</text>
          {/* Dashed missing corner */}
          <line x1="75" y1="30" x2="110" y2="15" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>
      );
    case 3: // Thinking question
      return (
        <svg viewBox="0 0 200 140" width="200" height="140">
          <polygon points="100,20 30,125 170,125" fill="#F1F5F9" stroke={borderColor} strokeWidth="2.5" />
          <text x="100" y="45" textAnchor="middle" fontSize="13" fontWeight="900" fill="#534AB7">90°</text>
          <text x="50" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0F6E56">90°</text>
          <text x="148" y="118" textAnchor="middle" fontSize="13" fontWeight="900" fill="#94A3B8">0°?</text>
          {/* X mark */}
          <line x1="80" y1="70" x2="120" y2="100" stroke="#EF4444" strokeWidth="3" opacity="0.3" />
          <line x1="120" y1="70" x2="80" y2="100" stroke="#EF4444" strokeWidth="3" opacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
}

export default function QuizStage({ onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [results, setResults] = useState<(boolean | null)[]>([null, null, null, null]);
  const [slideDir, setSlideDir] = useState<'in' | 'out' | null>('in');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const q = quizQuestions[qIdx];

  const handleAnswer = useCallback((idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    const isCorrect = idx === q.correctIndex;

    if (isCorrect) {
      playSound('success');
      setScore(s => s + 1);
    } else {
      playSound('wrong');
      setWrong(w => w + 1);
    }

    setResults(prev => { const next = [...prev]; next[qIdx] = isCorrect; return next; });

    setTimeout(() => {
      if (qIdx < quizQuestions.length - 1) {
        setSlideDir('out');
        setTimeout(() => {
          setQIdx(i => i + 1);
          setAnswered(null);
          setSlideDir('in');
        }, 300);
      } else {
        const finalScore = isCorrect ? score + 1 : score;
        const finalWrong = !isCorrect ? wrong + 1 : wrong;
        onCompleteRef.current(finalScore, finalWrong);
      }
    }, 2000);
  }, [answered, q, qIdx, score, wrong]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 'clamp(12px, 2.5vmin, 20px) clamp(12px, 2.5vmin, 20px) clamp(10px, 2vmin, 15px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(10px, 2vmin, 16px)' }}>
        <span style={{ fontWeight: 900, fontSize: 'clamp(15px, 2.5vmin, 18px)', color: '#293241' }}>碎片鑑定</span>
        <span style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.8vmin, 14px)', color: '#94A3B8' }}>{qIdx + 1} / {quizQuestions.length}</span>
      </div>

      {/* Card */}
      <div style={{
        flex: 1, background: 'white', borderRadius: 24,
        padding: 'clamp(16px, 3.5vmin, 28px) clamp(16px, 4vmin, 32px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
        display: 'flex', flexDirection: 'column', overflow: 'auto',
        animation: slideDir === 'in' ? 'fadeSlideIn 0.3s ease-out' : slideDir === 'out' ? 'fadeSlideOut 0.3s ease-in forwards' : undefined,
      }}>
        {/* Triangle illustration */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(12px, 2.5vmin, 20px)' }}>
          <QuizTriangle qIndex={qIdx} answered={answered} />
        </div>

        {/* Question */}
        <div style={{ fontSize: 'clamp(14px, 2vmin, 1.2rem)', fontWeight: 700, marginBottom: 'clamp(12px, 2.5vmin, 20px)', color: '#293241', lineHeight: 1.5 }}>
          {q.text}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vmin, 10px)' }}>
          {q.options.map((opt, i) => {
            let bg = 'white';
            let borderColor = '#e5e7eb';
            let color = '#293241';
            let icon = '';

            if (answered !== null) {
              if (i === q.correctIndex) {
                bg = '#d1fae5'; borderColor = '#10B981'; color = '#065f46'; icon = ' ✓';
              } else if (i === answered && i !== q.correctIndex) {
                bg = '#fee2e2'; borderColor = '#EF4444'; color = '#991b1b'; icon = ' ✗';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  padding: 'clamp(10px, 1.8vmin, 14px) clamp(12px, 2vmin, 18px)',
                  border: `2px solid ${borderColor}`, borderRadius: 12,
                  cursor: answered !== null ? 'default' : 'pointer', fontWeight: 600,
                  fontSize: 'clamp(13px, 1.8vmin, 1rem)',
                  textAlign: 'left', background: bg, color, fontFamily: 'inherit', transition: 'all 0.2s',
                  minHeight: 'clamp(36px, 5.5vmin, 44px)',
                }}
              >
                {opt}{icon}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{
            marginTop: 'clamp(10px, 2vmin, 16px)', padding: 'clamp(8px, 1.5vmin, 12px) clamp(10px, 2vmin, 16px)', borderRadius: 10,
            background: answered === q.correctIndex ? '#ECFDF5' : '#FEF2F2',
            fontSize: 'clamp(13px, 1.8vmin, 0.95rem)', color: answered === q.correctIndex ? '#065f46' : '#991b1b',
            fontWeight: 500, lineHeight: 1.5,
            animation: 'fadeSlideIn 0.3s ease-out',
          }}>
            {q.explanation}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: r === true ? '#10B981' : r === false ? '#EF4444' : 'transparent',
            border: `2px solid ${r === true ? '#10B981' : r === false ? '#EF4444' : '#CBD5E1'}`,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}
