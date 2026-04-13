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
    text: '已知三角形的三邊長分別是 4、5、6，能確定唯一的三角形嗎？',
    options: ['可以，三邊長度確定後，三角形的形狀只會有一種。', '不行，同樣的三邊長，可能拼出形狀完全不同的三角形。'],
    correctIndex: 0,
    explanation: '這就是 SSS 性質：三邊長度固定，三角形就絕對唯一。',
  },
  {
    id: 'L3Q3',
    text: '已知兩邊長 5 和 7，夾角是 60°，這樣能確定唯一的三角形嗎？',
    options: ['可以，兩邊長加上夾角，三角形形狀就固定了。', '不行，這些資訊太少，三角形大小會跑掉。'],
    correctIndex: 0,
    explanation: '這就是 SAS 性質：兩邊和夾角固定，頂點的位置就唯一確定了。',
  },
  {
    id: 'L3Q4',
    text: '如果只規定三個角分別是 40°、60°、80°，沒規定邊長，這些三角形一定全等嗎？',
    options: ['一定全等，角度對了形狀就對了。', '不一定，形狀一樣但大小可能不同。'],
    correctIndex: 1,
    explanation: '這就是 AAA 不全等：角度固定只能決定形狀，無法決定大小（會縮放）！',
  },
];

// ═══ SAS 概念檢核 ═══
export const sasQuizQuestions: QuizQuestion[] = [
  {
    id: 'L4Q1',
    text: '兩個三角形：邊長都是 5 跟 7，而且這兩條邊夾的角都是 60°。這兩個三角形一定全等嗎？',
    options: [
      '一定全等。',
      '不一定，還要知道第三條邊。',
      '不一定，還要知道另外兩個角。',
    ],
    correctIndex: 0,
    explanation: '這就是 SAS：兩條邊長和它們的夾角都決定了，三角形就只有一種，所以一定全等。',
  },
  {
    id: 'L4Q2',
    text: '兩個三角形的三個角都是 40°、60°、80°。這兩個三角形一定全等嗎？',
    options: [
      '一定全等，因為角度都一樣。',
      '不一定，大小可能不一樣（像是放大縮小）。',
      '不一定，還要看其中一條邊。',
    ],
    correctIndex: 1,
    explanation: '三個角相等只能保證「形狀一樣」，但大小可以放大縮小。這叫相似，不是全等。AAA 不能用來判定全等。',
  },
  {
    id: 'L4Q3',
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
    id: 'L4Q4',
    text: '把一個三角形紙片翻面、旋轉、或搬到另一個位置，它跟原本的三角形還算全等嗎？',
    options: [
      '算，翻面、旋轉、搬位置都不會改變形狀跟大小。',
      '只有搬位置算，翻面跟旋轉就不算了。',
      '只要動過，就不算同一個三角形了。',
    ],
    correctIndex: 0,
    explanation: '全等的意思就是「形狀跟大小完全一樣」。翻面、旋轉、平移都不會改變形狀和大小，所以仍然全等。',
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
