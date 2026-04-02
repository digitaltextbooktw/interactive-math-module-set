import { useState, useEffect } from 'react';
import { playSound } from '../../../utils/sound';
import { resultDialog } from '../data';
import CharacterAvatar from '../../Level1/components/CharacterAvatar';

interface Props {
  score: number;
  wrong: number;
  onRestart: () => void;
  onContinue: () => void;
}

export default function ResultStage({ score, wrong, onRestart, onContinue }: Props) {
  const [shieldVisible, setShieldVisible] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  const grade: 'gold' | 'silver' | 'bronze' = wrong === 0 ? 'gold' : wrong === 1 ? 'silver' : 'bronze';
  const triColor = grade === 'gold' ? '#FBBF24' : grade === 'silver' ? '#94A3B8' : '#B45309';
  const dialog = resultDialog[grade];

  useEffect(() => {
    const t1 = setTimeout(() => { setShieldVisible(true); playSound('ding'); }, 300);
    const t2 = setTimeout(() => setScoreVisible(true), 1800);
    const t3 = setTimeout(() => setDialogVisible(true), 2400);
    const t4 = setTimeout(() => setButtonsVisible(true), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', padding: 20, gap: 8,
    }}>
      <div style={{
        width: 150, height: 150, marginBottom: 8,
        opacity: shieldVisible ? 1 : 0,
        transform: shieldVisible ? 'scale(1)' : 'scale(0.7)',
        transition: 'all 0.8s ease-out',
      }}>
        <svg viewBox="0 0 100 100" width="150" height="150">
          <defs>
            <filter id="triGlow2"><feGaussianBlur stdDeviation="3" /></filter>
            <linearGradient id="shimmer2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0">
                <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="15%" stopColor="white" stopOpacity="0.5">
                <animate attributeName="offset" values="-0.35;1.65" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="30%" stopColor="white" stopOpacity="0">
                <animate attributeName="offset" values="-0.2;1.8" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <path d="M50 8 L90 23 L90 58 C90 78 50 93 50 93 C50 93 10 78 10 58 L10 23 Z"
            fill="none" stroke="#3d5a80" strokeWidth="2.5" opacity="0.3" />
          <polygon points="50,28 32,58 68,58" fill={triColor}
            style={{ opacity: shieldVisible ? 1 : 0, transform: shieldVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out 0.3s', transformOrigin: '50px 45px' }} />
          <polygon points="50,28 32,58 68,58" fill="url(#shimmer2)"
            style={{ opacity: shieldVisible ? 0.6 : 0, transition: 'opacity 0.5s ease-out 1.5s' }} />
        </svg>
      </div>

      <div style={{ opacity: scoreVisible ? 1 : 0, transform: scoreVisible ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.5s ease-out', fontSize: '1.1rem', color: '#3d5a80', fontWeight: 900 }}>
        答對 {score}/4 題
      </div>

      <div style={{
        opacity: dialogVisible ? 1 : 0, transform: dialogVisible ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.5s ease-out',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(255,255,255,0.95)', border: '1px solid #E5E7EB',
        borderRadius: 16, padding: '14px 20px', marginTop: 8, maxWidth: 460, width: '100%',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      }}>
        <div style={{ width: 56, height: 56, flexShrink: 0 }}>
          <CharacterAvatar speaker={dialog.speaker} expression={dialog.expression} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: '#293241', marginBottom: 2 }}>稜稜</div>
          <div style={{ fontSize: 15, color: '#293241', lineHeight: 1.5 }}>{dialog.text}</div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 12, marginTop: 16,
        opacity: buttonsVisible ? 1 : 0, transition: 'opacity 0.4s ease-out',
      }}>
        <button onClick={onRestart} style={{
          width: 48, height: 48, borderRadius: 12, border: '2px solid #E5E7EB',
          background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button onClick={onContinue} style={{
          width: 48, height: 48, borderRadius: 12, border: 'none',
          background: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
