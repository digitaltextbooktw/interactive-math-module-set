import { useState, useCallback, useRef } from 'react';
import { quizQuestions } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (score: number, wrong: number) => void;
}

// Triangle illustrations for each quiz question
function QuizIllustration({ qIndex, answered }: { qIndex: number; answered: number | null }) {
  const borderColor = answered !== null ? (answered === quizQuestions[qIndex].correctIndex ? '#10B981' : '#EF4444') : '#3d5a80';
  switch (qIndex) {
    case 0: // 50° + 70° → ext = ?
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 100,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="95" y="52" fontSize="12" fontWeight="900" fill="#3d5a80">50°</text>
          <text x="68" y="100" fontSize="12" fontWeight="900" fill="#3d5a80">70°</text>
          <text x="172" y="100" fontSize="14" fontWeight="900" fill="#ee6c4d">?°</text>
        </svg>
      );
    case 1: // ext = 140°, A = 60° → B = ?
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 80,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="78" y="52" fontSize="12" fontWeight="900" fill="#3d5a80">60°</text>
          <text x="68" y="100" fontSize="12" fontWeight="900" fill="#94A3B8">?°</text>
          <text x="172" y="100" fontSize="13" fontWeight="900" fill="#ee6c4d">140°</text>
        </svg>
      );
    case 2: // Thinking question
      return (
        <svg viewBox="0 0 200 130" width="200" height="120">
          <polygon points="40,110 160,110 120,25" fill="#F1F5F9" stroke={borderColor} strokeWidth="2" />
          <line x1="160" y1="110" x2="195" y2="110" stroke="#3d5a80" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="105" y="72" fontSize="24" fontWeight="900" fill="#94A3B8">?</text>
        </svg>
      );
    case 3: // ext = 90°, A = 30°, find all
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

export default function QuizStage({ onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [results, setResults] = useState<(boolean | null)[]>(quizQuestions.map(() => null));
  const [slideDir, setSlideDir] = useState<'in' | 'out' | null>('in');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const q = quizQuestions[qIdx];

  const handleAnswer = useCallback((idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    const isCorrect = idx === q.correctIndex;
    if (isCorrect) { playSound('success'); setScore(s => s + 1); }
    else { playSound('wrong'); setWrong(w => w + 1); }
    setResults(prev => { const n = [...prev]; n[qIdx] = isCorrect; return n; });

    setTimeout(() => {
      if (qIdx < quizQuestions.length - 1) {
        setSlideDir('out');
        setTimeout(() => { setQIdx(i => i + 1); setAnswered(null); setSlideDir('in'); }, 300);
      } else {
        const fs = isCorrect ? score + 1 : score;
        const fw = !isCorrect ? wrong + 1 : wrong;
        onCompleteRef.current(fs, fw);
      }
    }, 2000);
  }, [answered, q, qIdx, score, wrong]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 20px 15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: '#293241' }}>概念檢核</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#94A3B8' }}>{qIdx + 1} / {quizQuestions.length}</span>
      </div>

      <div style={{
        flex: 1, background: 'white', borderRadius: 24, padding: '24px 28px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
        animation: slideDir === 'in' ? 'fadeSlideIn 0.3s ease-out' : slideDir === 'out' ? 'fadeSlideOut 0.3s ease-in forwards' : undefined,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, flexShrink: 0 }}>
          <QuizIllustration qIndex={qIdx} answered={answered} />
        </div>
        <div style={{ fontSize: 'clamp(18px, 3vmin, 1.6rem)', fontWeight: 800, marginBottom: 'clamp(14px, 3vmin, 24px)', color: '#293241', lineHeight: 1.5, flexShrink: 0 }}>
          {q.text}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(8px, 1.5vmin, 14px)', flexShrink: 0 }}>
          {q.options.map((opt, i) => {
            let bg = 'white', border = '#e5e7eb', color = '#293241', icon = '';
            if (answered !== null) {
              if (i === q.correctIndex) { bg = '#d1fae5'; border = '#10B981'; color = '#065f46'; icon = ''; }
              else if (i === answered && i !== q.correctIndex) { bg = '#fee2e2'; border = '#EF4444'; color = '#991b1b'; icon = ''; }
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} style={{
                padding: 'clamp(12px, 2vmin, 18px) clamp(14px, 2.5vmin, 22px)',
                border: `2px solid ${border}`, borderRadius: 14,
                cursor: answered !== null ? 'default' : 'pointer', fontWeight: 700,
                fontSize: 'clamp(16px, 2.5vmin, 1.3rem)',
                textAlign: 'center', background: bg, color, fontFamily: 'inherit', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {opt}{icon}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', marginTop: 'clamp(12px, 2vmin, 18px)', minHeight: 0 }}>
          {answered !== null && (
            <div style={{
              padding: 'clamp(10px, 2vmin, 16px) clamp(14px, 2.5vmin, 20px)', borderRadius: 12, width: '100%',
              background: answered === q.correctIndex ? '#ECFDF5' : '#FEF2F2',
              fontSize: 'clamp(15px, 2.2vmin, 1.1rem)', color: answered === q.correctIndex ? '#065f46' : '#991b1b',
              fontWeight: 600, lineHeight: 1.5, animation: 'fadeSlideIn 0.3s ease-out',
            }}>
              {q.explanation}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: r === true ? '#10B981' : r === false ? '#EF4444' : 'transparent',
            border: `2px solid ${r === true ? '#10B981' : r === false ? '#EF4444' : '#CBD5E1'}`,
          }} />
        ))}
      </div>
    </div>
  );
}
