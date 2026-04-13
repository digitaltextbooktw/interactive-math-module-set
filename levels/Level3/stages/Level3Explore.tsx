import { useState, useCallback } from 'react';
import ExploreStage from './ExploreStage';
import SASExplore from './SASExplore';
import JudgeExplore from './JudgeExplore';
import { setCurrentSection } from '../data';

type Section = 'menu' | 'sss' | 'sas' | 'judge';

const ENTRIES = [
  { key: 'sss' as const, title: 'SSS', subtitle: '三邊全等', color: '#3d5a80' },
  { key: 'sas' as const, title: 'SAS', subtitle: '兩邊一角全等', color: '#3d5a80' },
  { key: 'judge' as const, title: '全等判斷', subtitle: '綜合判定練習', color: '#3d5a80' },
] as const;

export default function Level3Explore({ onComplete }: { onComplete: () => void }) {
  const [section, setSection] = useState<Section>('menu');

  const pickSection = useCallback((s: 'sss' | 'sas' | 'judge') => {
    setCurrentSection(s);
    setSection(s);
  }, []);

  if (section === 'sss') {
    return <ExploreStage onComplete={onComplete} />;
  }

  if (section === 'sas') {
    return <SASExplore onComplete={onComplete} />;
  }

  if (section === 'judge') {
    return <JudgeExplore onComplete={onComplete} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6 py-8 gap-6"
      style={{ touchAction: 'manipulation' }}
    >
      <h2 className="text-xl font-black text-[#293241]">選擇練習關卡</h2>
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
        {ENTRIES.map(entry => (
          <button
            key={entry.key}
            onClick={() => pickSection(entry.key)}
            className="group bg-white hover:bg-[#e0fbfc] rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-5 min-w-[140px] flex-1 border-2 border-transparent hover:border-[#98c1d9]"
          >
            <span className={`text-2xl font-black text-[#293241] leading-tight ${entry.key !== 'judge' ? 'font-en' : ''}`}>
              {entry.title}
            </span>
            <span className="text-xs font-bold text-[#3d5a80]/60">
              {entry.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
