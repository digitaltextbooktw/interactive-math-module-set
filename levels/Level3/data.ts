import type { QuizQuestion } from '../../types';

export const quizQuestions: QuizQuestion[] = [
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
