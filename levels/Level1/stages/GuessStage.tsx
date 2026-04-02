import { useState } from 'react';
import DialogEngine from '../components/DialogEngine';
import { guessCorrectDialog, guessWrongDialog, guessOptions, guessCorrectIndex } from '../data';
import { playSound } from '../../../utils/sound';

interface Props {
  onComplete: (answer: number) => void;
}

export default function GuessStage({ onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleGuess = (index: number) => {
    playSound('click');
    setSelected(index);
  };

  if (selected !== null) {
    const isCorrect = selected === guessCorrectIndex;
    const lines = isCorrect ? guessCorrectDialog : guessWrongDialog;
    // Pass the actual degree value (90, 180, 270, 360)
    const degreeValues = [90, 180, 270, 360];
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <DialogEngine lines={lines} onComplete={() => onComplete(degreeValues[selected])} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 'clamp(14px, 3vmin, 20px)',
      padding: 'clamp(16px, 3vmin, 24px)',
    }}>
      <div style={{ fontSize: 'clamp(1.2rem, 3.5vmin, 1.8rem)', fontWeight: 900, color: '#293241', textAlign: 'center' }}>
        一個三角形，三個內角加起來，是幾度？
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(10px, 2vmin, 15px)', width: '100%', maxWidth: 500 }}>
        {guessOptions.map((label, i) => (
          <button
            key={i}
            onClick={() => handleGuess(i)}
            style={{
              padding: 'clamp(10px, 2vmin, 15px) clamp(16px, 3vmin, 25px)',
              fontSize: 'clamp(1rem, 2vmin, 1.2rem)', fontWeight: 700,
              border: 'none', borderRadius: 12, cursor: 'pointer',
              background: '#3d5a80', color: 'white', fontFamily: 'inherit',
              boxShadow: '0 4px 0 rgba(0,0,0,0.1)', transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
