import React, { useState } from 'react';

type PracticeStage = 'explore' | 'quiz' | 'done';

interface PracticeShellProps {
  ExploreComponent: React.FC<{ onComplete: () => void }>;
  QuizComponent: React.FC<{ onComplete: (score: number, wrong: number) => void }>;
  onExit: () => void;
}

export default function PracticeShell({ ExploreComponent, QuizComponent, onExit }: PracticeShellProps) {
  const [stage, setStage] = useState<PracticeStage>('explore');
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  if (stage === 'explore') {
    return <ExploreComponent onComplete={() => setStage('quiz')} />;
  }

  if (stage === 'quiz') {
    return (
      <QuizComponent onComplete={(score, wrong) => {
        setResult({ score, total: score + wrong });
        setStage('done');
      }} />
    );
  }

  // Done screen
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: '#F8FAFC',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '40px 48px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textAlign: 'center',
        maxWidth: 400, width: '90%',
      }}>
        <div style={{
          fontSize: 48, marginBottom: 12,
          filter: result && result.score === result.total ? 'none' : 'saturate(0.6)',
        }}>
          {result && result.score === result.total ? '🎉' : '📝'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#293241', marginBottom: 8 }}>
          練習完成
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#64748B', marginBottom: 28 }}>
          答對 <span style={{ color: '#10B981', fontSize: 20 }}>{result?.score ?? 0}</span> / {result?.total ?? 0} 題
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => { setStage('explore'); setResult(null); }}
            style={{
              background: '#3d5a80', color: 'white', border: 'none', borderRadius: 12,
              padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 3px 0 #2D3E50',
            }}
          >
            再試一次
          </button>
          <button
            onClick={onExit}
            style={{
              background: 'white', color: '#3d5a80', border: '2px solid #3d5a80',
              borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            返回自由操作
          </button>
        </div>
      </div>
    </div>
  );
}
