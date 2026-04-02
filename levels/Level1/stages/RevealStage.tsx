import { useState, useCallback } from 'react';
import DialogEngine from '../components/DialogEngine';
import { revealPreAnimDialog, revealPostAnimDialog } from '../data';
import TearAnimation from './TearAnimation';

type Phase = 'pre-dialog' | 'tear-anim' | 'post-dialog';

export default function RevealStage({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('pre-dialog');

  const handlePreDone = useCallback(() => setPhase('tear-anim'), []);
  const handleTearDone = useCallback(() => setPhase('post-dialog'), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {phase === 'pre-dialog' && (
        <DialogEngine lines={revealPreAnimDialog} onComplete={handlePreDone} />
      )}
      {phase === 'tear-anim' && (
        <TearAnimation onComplete={handleTearDone} />
      )}
      {phase === 'post-dialog' && (
        <DialogEngine lines={revealPostAnimDialog} onComplete={onComplete} />
      )}
    </div>
  );
}
