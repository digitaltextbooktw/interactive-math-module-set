import { useState, useCallback } from 'react';
import GuessStage from './stages/GuessStage';
import ExploreStage from './stages/ExploreStage';
import RevealStage from './stages/RevealStage';
import QuizStage from './stages/QuizStage';
import ResultStage from './stages/ResultStage';

type Stage = 'guess' | 'explore' | 'reveal' | 'quiz' | 'result';

interface Props {
  startStage?: string;
  guessAnswer?: number;
  onExit?: () => void;
  onComplete?: () => void;
}

export default function Level1({ startStage, guessAnswer: initialGuess, onExit, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>((startStage as Stage) || 'guess');
  const [guessAnswer, setGuessAnswer] = useState<number | null>(initialGuess ?? null);
  const [result, setResult] = useState({ score: 0, wrong: 0 });
  const [exitAnim, setExitAnim] = useState(false);

  const goTo = useCallback((next: Stage) => {
    setExitAnim(true);
    setTimeout(() => {
      setStage(next);
      setExitAnim(false);
    }, 300);
  }, []);

  const handleGuessComplete = useCallback((answer: number) => {
    setGuessAnswer(answer);
    goTo('explore');
  }, [goTo]);

  const handleQuizComplete = useCallback((score: number, wrong: number) => {
    setResult({ score, wrong });
    goTo('result');
  }, [goTo]);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#F3F4F6', fontFamily: "'Noto Sans TC', sans-serif",
    }}>
      {onExit && (
        <button
          onClick={onExit}
          title="回到星球"
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 200,
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.85)', padding: 0,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <svg viewBox="-14 -14 28 28" width="28" height="28">
            <circle cx="0" cy="0" r="11" fill="#2a3f5f" />
            <polygon points="0,-8 -5,-2 5,-2" fill="#3d5a80" stroke="#67E8F9" strokeWidth="0.5" strokeOpacity="0.6" />
            <polygon points="-5,-2 -8,5 0,2" fill="#98c1d9" stroke="#67E8F9" strokeWidth="0.5" strokeOpacity="0.6" />
            <polygon points="5,-2 8,5 0,2" fill="#e0fbfc" stroke="#67E8F9" strokeWidth="0.5" strokeOpacity="0.6" />
            <polygon points="-8,5 0,9 8,5 0,2" fill="#3d5a80" stroke="#67E8F9" strokeWidth="0.5" strokeOpacity="0.6" />
            <circle cx="0" cy="0" r="11" fill="none" stroke="#98c1d9" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4" />
          </svg>
        </button>
      )}

      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        opacity: exitAnim ? 0 : 1,
        transform: exitAnim ? 'translateX(-30px)' : 'translateX(0)',
        transition: 'all 0.3s ease-in',
        animation: !exitAnim ? 'fadeSlideIn 0.4s ease-out' : undefined,
      }}>
        {stage === 'guess' && <GuessStage onComplete={handleGuessComplete} />}
        {stage === 'explore' && <ExploreStage guessAnswer={guessAnswer} onComplete={() => goTo('reveal')} />}
        {stage === 'reveal' && <RevealStage onComplete={() => goTo('quiz')} />}
        {stage === 'quiz' && <QuizStage onComplete={handleQuizComplete} />}
        {stage === 'result' && (
          <ResultStage
            score={result.score}
            wrong={result.wrong}
            onRestart={() => goTo('quiz')}
            onContinue={() => onComplete?.()}
          />
        )}
      </div>
    </div>
  );
}
