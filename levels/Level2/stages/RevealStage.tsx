import { useState, useCallback } from 'react';
import DialogEngine from '../../Level1/components/DialogEngine';
import { revealPreAnimDialog, revealPostAnimDialog } from '../data';
import ExteriorAngleAnim from './ExteriorAngleAnim';

type Phase = 'pre-dialog' | 'animation' | 'post-dialog';

export default function RevealStage({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('pre-dialog');

  const handlePreDone = useCallback(() => setPhase('animation'), []);
  const handleAnimDone = useCallback(() => setPhase('post-dialog'), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {phase === 'pre-dialog' && <DialogEngine lines={revealPreAnimDialog} onComplete={handlePreDone} />}
      {phase === 'animation' && <ExteriorAngleAnim onComplete={handleAnimDone} />}
      {phase === 'post-dialog' && <DialogEngine lines={revealPostAnimDialog} onComplete={onComplete} />}
    </div>
  );
}
