import type { DialogLine, QuizQuestion } from '../../types';

// === INTRO（3 句）===
export const introDialog: DialogLine[] = [
  { speaker: 'player', expression: 'surprised', text: '山脊上好多三角形裂縫…' },
  { speaker: 'lengleng', expression: 'thinking', text: '你得把每道裂縫的角度量清楚才能修補。但有些角在懸崖那邊，過不去。' },
  { speaker: 'lengleng', expression: 'thinking', text: '不過你看——裂縫的邊延伸出去，外面也有一個角。那個角跟裡面的角，有什麼關係？自己試試看。' },
];

// === GUESS ===
export const guessQuestion = '三角形的外角，跟其他內角有什麼關係？';
export const guessOptions = [
  '等於最大的內角',
  '等於相鄰的內角',
  '等於另外兩個內角的和',
  '沒有固定關係',
];
export const guessCorrectIndex = 2;

export const guessCorrectDialog: DialogLine[] = [
  { speaker: 'lengleng', expression: 'proud', text: '有直覺。去驗證。' },
];
export const guessWrongDialog: DialogLine[] = [
  { speaker: 'lengleng', expression: 'thinking', text: '不確定的話，自己拖拖看。' },
];

// === EXPLORE ===
export const exploreEntryHint = '拖動頂點，觀察外角和內角的關係';
export const exploreNudge = '注意到了嗎？∠A + ∠B 和外角的關係…';

export const discoveryQuestion = '∠C外角 = ___';
export const discoveryOptions = ['∠A + ∠B', '∠A + ∠C', '180° - ∠C', '∠A × ∠B'];
export const discoveryCorrectIndex = 0;

// === REVEAL — 動畫前（2 句）===
export const revealPreAnimDialog: DialogLine[] = [
  { speaker: 'lengleng', expression: 'thinking', text: '沒錯。外角等於兩個不相鄰的內角加起來。' },
  { speaker: 'lengleng', expression: 'thinking', text: '為什麼？看好——' },
];

// === REVEAL — 動畫後（2 句）===
export const revealPostAnimDialog: DialogLine[] = [
  { speaker: 'lengleng', expression: 'thinking', text: '這叫「外角定理」。不用冒險去量懸崖那邊的角了。知道另外兩個角，加起來就是外角。' },
  { speaker: 'lengleng', expression: 'proud', text: '現在，用你得到的知識去修裂縫吧！' },
];

// === QUIZ（4 題）===
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'L2Q1',
    text: '三角形的兩個內角分別是 50° 和 70°，外角是多少度？',
    options: ['120°', '110°', '130°', '100°'],
    correctIndex: 0,
    explanation: '外角 = 50 + 70 = 120°',
  },
  {
    id: 'L2Q2',
    text: '三角形的外角是 140°，其中一個內角是 60°，另一個內角是？',
    options: ['80°', '70°', '90°', '60°'],
    correctIndex: 0,
    explanation: '外角 = A + B，所以 B = 140 - 60 = 80°',
  },
  {
    id: 'L2Q3',
    text: '外角有可能比三角形最大的內角還小嗎？',
    options: ['有可能', '不可能'],
    correctIndex: 1,
    explanation: '外角 = 兩個不相鄰內角的和，一定比其中任何一個大。',
  },
  {
    id: 'L2Q4',
    text: '三角形的外角是 90°，其中一個內角是 30°，這個三角形的三個內角分別是？',
    options: ['30°、60°、90°', '30°、90°、45°', '30°、45°、105°', '30°、60°、80°'],
    correctIndex: 0,
    explanation: '外角 90° = A + B，A = 30°，所以 B = 60°。C = 180° - 90° = 90°',
  },
];

// === RESULT 結語 ===
export const resultDialog: Record<'gold' | 'silver' | 'bronze', DialogLine> = {
  gold: { speaker: 'lengleng', expression: 'proud', text: '不錯。接下來是地底鍛造廠。路不好走，祝你好運。' },
  silver: { speaker: 'lengleng', expression: 'thinking', text: '還行。路上再回想吧！' },
  bronze: { speaker: 'lengleng', expression: 'thinking', text: '要多多練習。地底的活更難呢！' },
};
