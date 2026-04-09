import { useState } from 'react';
import ExploreStage from './ExploreStage';
import RevealStage from './RevealStage';

export default function Level3Explore({ onComplete }: { onComplete: () => void }) {
  const [section, setSection] = useState<'construct' | 'reveal'>('construct');

  if (section === 'construct') {
    return <ExploreStage onComplete={() => setSection('reveal')} />;
  }

  return <RevealStage onComplete={onComplete} />;
}
