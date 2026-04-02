import { useState, useEffect, useRef, useCallback } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { useGame } from '../../../store/gameState';
import { playSound } from '../../../utils/sound';

export interface DialogLine {
  speaker: string;
  expression: string;
  text: string;
}

interface Props {
  lines: DialogLine[];
  onComplete: () => void;
}

export default function DialogEngine({ lines, onComplete }: Props) {
  const { save } = useGame();
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const line = lines[lineIndex];
  const NPC_NAMES: Record<string, string> = {
    laojiao: '老角', lengleng: '稜稜', yuangui: '圓規',
    diedie: '疊疊', xinxin: '心心',
  };
  const speakerName = NPC_NAMES[line?.speaker ?? ''] ?? (save.playerName || '玩家');

  useEffect(() => {
    if (!line) return;
    setDisplayedText('');
    setIsTyping(true);
    let charIdx = 0;

    timerRef.current = setInterval(() => {
      charIdx++;
      setDisplayedText(line.text.substring(0, charIdx));
      playSound('type');
      if (charIdx >= line.text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
      }
    }, 40);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lineIndex, line]);

  const handleClick = useCallback(() => {
    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedText(line.text);
      setIsTyping(false);
    } else {
      if (lineIndex < lines.length - 1) {
        setLineIndex(prev => prev + 1);
      } else {
        onCompleteRef.current();
      }
    }
  }, [isTyping, lineIndex, lines.length, line]);

  if (!line) return null;

  return (
    <div
      onClick={handleClick}
      className="dialog-engine"
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB',
        borderRadius: '16px 16px 0 0', display: 'flex',
        padding: 'clamp(12px, 2.5vmin, 20px)',
        cursor: 'pointer',
        zIndex: 100, boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{
        width: 'clamp(56px, 10vmin, 80px)', height: 'clamp(56px, 10vmin, 80px)',
        marginRight: 'clamp(12px, 2vmin, 20px)', flexShrink: 0,
        background: '#F1F5F9', borderRadius: '50%', border: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <CharacterAvatar speaker={line.speaker} expression={line.expression} />
      </div>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 900, fontSize: 'clamp(0.9rem, 2vmin, 1.2rem)', color: '#293241', marginBottom: 4 }}>
          {speakerName}
        </div>
        <div style={{ fontSize: 'clamp(0.85rem, 2vmin, 1.1rem)', lineHeight: 1.5, color: '#293241' }}>
          {displayedText}
        </div>
      </div>
      {!isTyping && (
        <div style={{
          position: 'absolute', bottom: 10, right: 15, fontSize: '0.9rem',
          color: '#ee6c4d', animation: 'bounce 1s infinite',
        }}>
          繼續 ▶
        </div>
      )}
    </div>
  );
}
