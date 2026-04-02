import { useState } from 'react';
import DialogEngine from '../../Level1/components/DialogEngine';
import { guessQuestion, guessOptions, guessCorrectIndex, guessCorrectDialog, guessWrongDialog } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (answer: number) => void;
}

export default function GuessStage({ onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleGuess = (idx: number) => {
    playSound('click');
    setSelected(idx);
  };

  if (selected !== null) {
    const lines = selected === guessCorrectIndex ? guessCorrectDialog : guessWrongDialog;
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <DialogEngine lines={lines} onComplete={() => onComplete(selected)} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 'clamp(14px, 3vmin, 20px)', padding: 'clamp(16px, 3vmin, 24px)',
    }}>
      <div style={{ fontSize: 'clamp(1.1rem, 3vmin, 1.5rem)', fontWeight: 900, color: '#293241', textAlign: 'center', lineHeight: 1.5 }}>
        {guessQuestion}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vmin, 12px)', width: '100%', maxWidth: 400 }}>
        {guessOptions.map((label, i) => (
          <button key={i} onClick={() => handleGuess(i)} style={{
            padding: 'clamp(10px, 2vmin, 14px) clamp(14px, 2.5vmin, 20px)',
            fontSize: 'clamp(0.9rem, 2vmin, 1.05rem)', fontWeight: 600,
            border: '2px solid #e5e7eb', borderRadius: 12, cursor: 'pointer',
            background: 'white', color: '#293241', fontFamily: 'inherit',
            textAlign: 'left', transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
