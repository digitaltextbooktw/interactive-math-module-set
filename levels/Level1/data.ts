import type { DialogLine, QuizQuestion } from '../../types';

// === INTRO（4 句）===
export const introDialog: DialogLine[] = [
  { speaker: 'player', expression: 'surprised', text: '師父！外面星罩碎了——' },
  { speaker: 'laojiao', expression: 'grumpy', text: '我知道，整個村都在晃。你沒受傷就好…咳，我是說，你跑回來也好。' },
  { speaker: 'laojiao', expression: 'thinking', text: '保護整個三角星球的星罩，是幾萬塊三角形撐起來的，每塊的角度都有講究。角度不對的碎片硬塞回去，只會讓裂縫更大。' },
  { speaker: 'laojiao', expression: 'grumpy', text: '所以得先複習基本功。考你——三角形三個內角加起來，幾度？' },
];

// === GUESS 回應 ===
export const guessCorrectDialog: DialogLine[] = [
  { speaker: 'laojiao', expression: 'proud', text: '哦？有概念嘛。不過嘴上說得出來沒用，得親手量過才算真的會。' },
];

export const guessWrongDialog: DialogLine[] = [
  { speaker: 'laojiao', expression: 'grumpy', text: '哼，看來基本功還得練。自己量過就知道了。' },
];

// === EXPLORE ===
export const exploreEntryHint = '桌上三塊碎片，每個角都量一遍。';
export const allCompleteText = '等邊、直角、鈍角——全部都是 180°！';
export const guessRecallCorrect = '猜對了。但親手量出來的感覺不一樣吧？';
export const guessRecallWrong = (val: string) => `之前猜 ${val}——現在知道答案了。`;

export const guessOptions = ['90°', '180°', '270°', '360°'];
export const guessCorrectIndex = 1;

// === REVEAL — 動畫前（2 句）===
export const revealPreAnimDialog: DialogLine[] = [
  { speaker: 'laojiao', expression: 'excited', text: '看到了吧？不管什麼形狀，三個內角永遠加起來 180°。' },
  { speaker: 'laojiao', expression: 'thinking', text: '為什麼？把三個角拼在一起看看——' },
];

// === REVEAL — 動畫後（4 句）===
export const revealPostAnimDialog: DialogLine[] = [
  { speaker: 'laojiao', expression: 'proud', text: '剛好一條直線，180°。這就叫做「三角形內角和定理」。老夫當年也是自己量出來的…量了一百個三角形呢。' },
  { speaker: 'player', expression: 'surprised', text: '一百個！？' },
  { speaker: 'laojiao', expression: 'grumpy', text: '好啦七八個。' },
  { speaker: 'laojiao', expression: 'thinking', text: '重點是——不是 180° 的碎片就是壞的。來，幫我把桌上這幾塊鑑定一下。' },
];

// === QUIZ（4 題）===
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'L1Q1',
    text: '桌上這塊碎片的角度是 50°、60°、70°，是真的三角形嗎？',
    options: ['是，因為 50 + 60 + 70 = 180°', '不是，角度加起來不對'],
    correctIndex: 0,
    explanation: '三個角加起來剛好 180°，是真碎片！',
  },
  {
    id: 'L1Q2',
    text: '再看一塊，角度是 40°、80°、70°，這塊能拼回星罩嗎？',
    options: ['可以，角度沒問題', '不行，角度加起來超過 180°', '要再量一次才知道'],
    correctIndex: 1,
    explanation: '40 + 80 + 70 = 190°，超過 180°，不是真的三角形。',
  },
  {
    id: 'L1Q3',
    text: '這塊缺了一角，只量到 35° 和 65°。缺的那個角應該是多少？',
    options: ['90°', '80°', '100°', '60°'],
    correctIndex: 1,
    explanation: '180 - 35 - 65 = 80°',
  },
  {
    id: 'L1Q4',
    text: '師父問你：一塊碎片有可能同時有兩個 90° 的角嗎？',
    options: ['有可能', '不可能'],
    correctIndex: 1,
    explanation: '90 + 90 = 180，第三個角就是 0°，不存在這種三角形。',
  },
];

// === RESULT 結語 ===
export const resultDialog: Record<'gold' | 'silver' | 'bronze', DialogLine> = {
  gold: { speaker: 'laojiao', expression: 'proud', text: '不錯嘛，沒白教你。斷崖那邊棧道歪了，你去看看。' },
  silver: { speaker: 'laojiao', expression: 'thinking', text: '還行。去斷崖的路上，想想剛才錯的那題。' },
  bronze: { speaker: 'laojiao', expression: 'grumpy', text: '唉…去之前多練練。斷崖的棧道總得有人修。' },
};
