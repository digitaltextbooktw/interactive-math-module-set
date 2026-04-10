import { useState } from 'react';
import ExploreStage from './ExploreStage';
import ExteriorAngleAnim from './ExteriorAngleAnim';

export default function Level2Explore({ onComplete }: { onComplete: () => void }) {
  const [section, setSection] = useState<'explore' | 'anim'>('explore');

  if (section === 'explore') {
    return <ExploreStage onComplete={() => setSection('anim')} />;
  }

  return <ExteriorAngleAnim onComplete={onComplete} onBack={() => setSection('explore')} />;
}
