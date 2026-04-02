const XIAOJIN_EXPRESSIONS: Record<string, { eyes: string; mouth: string }> = {
  happy: { eyes: '<path d="M30 31 Q34 27 38 31" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M42 31 Q46 27 50 31" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<path d="M33 43 Q40 49 47 43" stroke="#293241" stroke-width="2" fill="none"/>' },
  excited: { eyes: '<path d="M29 30 Q34 25 39 30" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M41 30 Q46 25 51 30" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<ellipse cx="40" cy="45" rx="6" ry="4.5" fill="#293241"/>' },
  thinking: { eyes: '<circle cx="33" cy="31" r="2.5" fill="#293241"/><circle cx="47" cy="31" r="2.5" fill="#293241"/>', mouth: '<path d="M36 44 Q42 42 46 45" stroke="#293241" stroke-width="2" fill="none"/>' },
  surprised: { eyes: '<circle cx="33" cy="32" r="4" fill="none" stroke="#293241" stroke-width="2.5"/><circle cx="33" cy="32" r="1.5" fill="#293241"/><circle cx="47" cy="32" r="4" fill="none" stroke="#293241" stroke-width="2.5"/><circle cx="47" cy="32" r="1.5" fill="#293241"/>', mouth: '<circle cx="40" cy="46" r="3.5" fill="#293241"/>' },
  grumpy: { eyes: '<line x1="28" y1="28" x2="36" y2="31" stroke="#293241" stroke-width="2.5"/><circle cx="33" cy="33" r="2.5" fill="#293241"/><line x1="52" y1="28" x2="44" y2="31" stroke="#293241" stroke-width="2.5"/><circle cx="47" cy="33" r="2.5" fill="#293241"/>', mouth: '<line x1="35" y1="45" x2="45" y2="45" stroke="#293241" stroke-width="2"/>' },
  proud: { eyes: '<path d="M29 33 Q34 30 39 33" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M41 33 Q46 30 51 33" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<path d="M34 43 Q40 48 46 43" stroke="#293241" stroke-width="2" fill="none"/>' },
};

const LAOJIAO_EXPRESSIONS: Record<string, { eyes: string; mouth: string }> = {
  happy: { eyes: '<path d="M30 31 Q34 27 38 31" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M42 31 Q46 27 50 31" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<path d="M30 50 Q40 58 50 50" stroke="white" stroke-width="2.5" fill="none"/>' },
  excited: { eyes: '<path d="M29 30 Q34 25 39 30" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M41 30 Q46 25 51 30" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<path d="M30 50 Q40 62 50 50" stroke="white" stroke-width="4" fill="none"/>' },
  thinking: { eyes: '<circle cx="33" cy="31" r="2.5" fill="#293241"/><circle cx="47" cy="31" r="2.5" fill="#293241"/>', mouth: '<path d="M30 50 Q40 54 50 50" stroke="white" stroke-width="2.5" fill="none"/>' },
  surprised: { eyes: '<circle cx="33" cy="32" r="4" fill="none" stroke="#293241" stroke-width="2.5"/><circle cx="33" cy="32" r="1.5" fill="#293241"/><circle cx="47" cy="32" r="4" fill="none" stroke="#293241" stroke-width="2.5"/><circle cx="47" cy="32" r="1.5" fill="#293241"/>', mouth: '<circle cx="40" cy="55" r="5" fill="white"/>' },
  grumpy: { eyes: '<line x1="28" y1="28" x2="36" y2="31" stroke="#293241" stroke-width="2.5"/><circle cx="33" cy="33" r="2.5" fill="#293241"/><line x1="52" y1="28" x2="44" y2="31" stroke="#293241" stroke-width="2.5"/><circle cx="47" cy="33" r="2.5" fill="#293241"/>', mouth: '<path d="M30 55 Q40 50 50 55" stroke="white" stroke-width="2.5" fill="none"/>' },
  proud: { eyes: '<path d="M29 33 Q34 30 39 33" stroke="#293241" stroke-width="2.5" fill="none"/><path d="M41 33 Q46 30 51 33" stroke="#293241" stroke-width="2.5" fill="none"/>', mouth: '<path d="M30 50 Q40 58 50 50" stroke="white" stroke-width="2.5" fill="none"/>' },
};

interface Props {
  speaker: string;
  expression: string;
}

export default function CharacterAvatar({ speaker, expression }: Props) {
  const expData = speaker === 'laojiao'
    ? (LAOJIAO_EXPRESSIONS[expression] || LAOJIAO_EXPRESSIONS.happy)
    : (XIAOJIN_EXPRESSIONS[expression] || XIAOJIN_EXPRESSIONS.happy);

  // 稜稜 — cool blue-gray mountain patrol
  if (speaker === 'lengleng') {
    return (
      <svg className="w-full h-full" viewBox="0 0 80 100">
        <ellipse cx="40" cy="75" rx="18" ry="12" fill="#475569" />
        <circle cx="40" cy="34" r="26" fill="#94A3B8" />
        {/* Sharp angular features */}
        <polygon points="28,20 40,10 52,20" fill="#64748B" opacity="0.5" />
        <g dangerouslySetInnerHTML={{ __html: expData.eyes }} />
        <g dangerouslySetInnerHTML={{ __html: expData.mouth }} />
      </svg>
    );
  }

  if (speaker === 'laojiao') {
    return (
      <svg className="w-full h-full" viewBox="0 0 80 100">
        <ellipse cx="40" cy="75" rx="18" ry="12" fill="#EA580C" />
        <circle cx="40" cy="34" r="26" fill="#FB923C" />
        <path d="M22 28 A12 12 0 0 1 40 28" stroke="#6B7280" strokeWidth="2" fill="none" />
        <path d="M40 28 A12 12 0 0 1 58 28" stroke="#6B7280" strokeWidth="2" fill="none" />
        <line x1="14" y1="28" x2="22" y2="28" stroke="#6B7280" strokeWidth="1.5" />
        <line x1="58" y1="28" x2="66" y2="28" stroke="#6B7280" strokeWidth="1.5" />
        <g dangerouslySetInnerHTML={{ __html: expData.eyes }} />
        <g dangerouslySetInnerHTML={{ __html: expData.mouth }} />
      </svg>
    );
  }

  return (
    <svg className="w-full h-full" viewBox="0 0 80 100">
      <ellipse cx="40" cy="75" rx="18" ry="12" fill="#F59E0B" />
      <polygon points="40,67 35,77 45,77" fill="#92400E" />
      <circle cx="40" cy="34" r="26" fill="#FBBF24" />
      <circle cx="24" cy="40" r="4.5" fill="#FCA5A5" opacity="0.6" />
      <circle cx="56" cy="40" r="4.5" fill="#FCA5A5" opacity="0.6" />
      <g dangerouslySetInnerHTML={{ __html: expData.eyes }} />
      <g dangerouslySetInnerHTML={{ __html: expData.mouth }} />
    </svg>
  );
}
