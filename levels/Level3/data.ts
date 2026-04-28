import type { QuizQuestion } from '../../types';

// ═══ SSS 概念檢核 ═══
export const sssQuizQuestions: QuizQuestion[] = [
  {
    id: 'L3Q1',
    text: '圓規在作圖時，最重要的功用是什麼？',
    options: ['測量角度', '把特定的「長度」精確轉移到另一個位置', '畫出筆直的線段'],
    correctIndex: 1,
    explanation: '圓規張開的幅度固定後，畫出來的每一處距離都一樣，是轉移長度的重要工具。',
  },
  {
    id: 'L3Q2',
    text: '已知三角形三邊長 4、5、6，圓規與直尺可以畫出幾種「形狀大小都不同」的三角形？',
    options: ['只有一種', '兩種', '無限多種'],
    correctIndex: 0,
    explanation: '這就是 SSS 性質：三邊固定，畫出來的三角形形狀大小完全唯一。',
  },
  {
    id: 'L3Q3',
    text: '兩個三角形的三條邊都是 3、4、5。這兩個三角形一定全等嗎？',
    options: [
      '一定全等。',
      '不一定，還要看角度。',
      '只有都是直角三角形時才全等。',
    ],
    correctIndex: 0,
    explanation: '這就是 SSS：三條邊都決定了，三角形的形狀跟大小都唯一，所以一定全等。',
  },
  {
    id: 'L3Q4',
    text: '兩個三角形邊長分別是 △ABC：5、12、13 與 △DEF：12、13、5。它們全等嗎？',
    options: ['全等', '不全等'],
    correctIndex: 0,
    explanation: 'SSS 只看三邊長度集合是否對應相等，順序可以重新對應，仍是同一個三角形。',
  },
];

// ═══ SAS 概念檢核 ═══
export const sasQuizQuestions: QuizQuestion[] = [
  {
    id: 'L4Q1',
    text: '△ABC 和 △DEF 中，AB = DE = 5、AC = DF = 7，且 ∠A = ∠D = 40°（剛好就是 AB 與 AC 兩邊夾住的角）。這兩個三角形一定全等嗎？',
    options: [
      '一定全等。',
      '不一定，還要量第三條邊 BC。',
      '不一定，還要再知道 ∠B 或 ∠C。',
    ],
    correctIndex: 0,
    explanation: '兩邊 5、7 加上夾角 40° → SAS，只有一個三角形，所以全等。',
  },
  {
    id: 'L4Q2',
    text: '△ABC：AC = 7、AB = 4、∠A = 30°；△DEF：DF = 7、DE = 4、∠F = 30°。這兩個三角形一定全等嗎？',
    options: [
      '一定全等，數字都一樣。',
      '不一定全等。',
    ],
    correctIndex: 1,
    explanation: '∠A 是夾角（SAS）→ △ABC 唯一；∠F 不是夾角（SSA）→ △DEF 形狀不唯一，故不一定全等。',
  },
  {
    id: 'L4Q3',
    text: '兩條邊長都是 6，但一個三角形的夾角是 30°，另一個三角形的夾角是 90°。它們全等嗎？',
    options: [
      '全等，因為兩條邊長都相同。',
      '不全等，夾角不同，第三邊與整個三角形就會不同。',
    ],
    correctIndex: 1,
    explanation: 'SAS 中夾角是關鍵 — 邊長相同但夾角不同，會畫出形狀大小完全不同的三角形。',
  },
  {
    id: 'L4Q4',
    text: '老師在黑板上畫了一個三角形：AB = 8、AC = 5、∠A = 70°。同學在自己的紙上能畫出形狀大小一模一樣的三角形嗎？',
    options: [
      '可以，根據 SAS 性質。',
      '不行，還要知道 BC 的長度。',
      '不行，還要知道 ∠B 或 ∠C。',
    ],
    correctIndex: 0,
    explanation: 'SAS — AB、AC 兩邊和夾角 ∠A 給定，就能唯一畫出三角形，不需要其他資訊。',
  },
];

// ═══ 全等判斷 概念檢核 ═══
export const judgeQuizQuestions: QuizQuestion[] = [
  {
    id: 'L6Q1',
    text: '兩個三角形形狀完全一樣，但其中一個被翻面了。它們是全等三角形嗎？',
    options: ['全等', '不全等', '要看角度'],
    correctIndex: 0,
    explanation: '翻轉不會改變全等性。只要形狀跟大小一樣，疊得上去就是全等。',
  },
  {
    id: 'L6Q2',
    text: '兩個三角形的三個角都相同，但一個比另一個大很多。它們是全等三角形嗎？',
    options: ['全等', '不全等', '要看邊長'],
    correctIndex: 1,
    explanation: '大小不同就不是全等——這叫做「相似」(形狀一樣但大小不同)。',
  },
  {
    id: 'L6Q3',
    text: '一個三角形旋轉 90° 之後，跟另一個完全重合。它們是全等三角形嗎？',
    options: ['全等', '不全等', '旋轉後才算全等'],
    correctIndex: 0,
    explanation: '旋轉不會改變全等性。只要能疊得上（不論有沒有旋轉、平移、翻轉），就是全等。',
  },
  {
    id: 'L6Q4',
    text: '兩個三角形的三條邊長分別都是 5、7、9。不用實際疊合，可以斷定它們全等嗎？',
    options: ['可以，這就是 SSS 全等', '不一定，還要看角度', '不可以，要疊過才知道'],
    correctIndex: 0,
    explanation: '三條邊對應相等就保證全等——這就是 SSS 判定法。',
  },
];

// ═══ Section routing ═══
export type Section = 'sss' | 'sas' | 'judge';

let _currentSection: Section = 'sss';

export function setCurrentSection(s: Section) { _currentSection = s; }

export function getCurrentQuizQuestions(): QuizQuestion[] {
  switch (_currentSection) {
    case 'sas': return sasQuizQuestions;
    case 'judge': return judgeQuizQuestions;
    default: return sssQuizQuestions;
  }
}

// Legacy export for backward compatibility
export const quizQuestions = sssQuizQuestions;
