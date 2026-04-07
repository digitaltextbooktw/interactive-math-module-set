# Interactive Math Module Set

國中幾何互動教學模組集，對應課本第三章「三角形的基本性質」。

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite (dev server port 3000)
- **Styling**: Tailwind CSS (CDN), inline styles
- **Fonts**: Zen Maru Gothic (主字體 `--font-main`), Nunito (數字/英文 `--font-en` / `.font-en`)
- **No state management library** — 使用 React useState/useEffect

## Commands

```bash
npm run dev      # 啟動開發伺服器 (localhost:3000)
npm run build    # 生產建置
npm run preview  # 預覽建置結果
```

## Project Structure

```
index.html          # 入口 HTML，含字體載入、Tailwind CDN、CSS 變數
index.tsx           # React root mount
App.tsx             # 主應用：首頁章節列表、模組頁面、練習模式路由
types.ts            # 共用型別 (Point, Module, ModuleInfo, DialogLine, QuizQuestion)
vite.config.ts      # Vite 設定，含 GEMINI_API_KEY 環境變數注入

components/
  icons.tsx                 # SVG icon 元件 (BookIcon, LightbulbIcon, ChevronLeftIcon 等)
  modules/
    AllModules.tsx           # 統一匯出所有模組
    AngleBasics.tsx          # 角的基本認識（拖動旋轉）
    AngleRelationships.tsx   # 角的關係（補角互補）
    TriangleAngles.tsx       # 三角形的角（內角和 180°）
    BasicConstructions.tsx   # 基本作圖（垂足、中垂線、角平分線）
    Congruence.tsx           # 全等判定（SSS/SAS/ASA/AAS）
    AreaCalculation.tsx      # 面積計算（底×高÷2）
    TriangleInequality.tsx   # 邊長關係（三角不等式）
    ExteriorAngle.tsx        # 外角關係
  practice/
    PracticeShell.tsx        # 練習模式外殼（操作探索 + 概念檢核）

levels/                      # 各模組的練習關卡
  Level1/                    # 三角形的角
  Level2/                    # 外角關係

store/gameState.ts           # 遊戲狀態管理
utils/
  sound.ts                   # 音效工具
  useLayoutMode.ts           # 直橫排版切換 hook
```

## Module Architecture

每個模組元件接收 `setInfo: (info: ModuleInfo) => void`，透過此 callback 向父層回傳：
- `title`: 模組標題
- `data`: 即時數據（如角度、邊長）
- `concept`: 幾何概念說明
- `aiTip`: 操作提示文字

模組內部以 SVG 繪製互動圖形，支援滑鼠與觸控拖曳。

## SVG Visual Style Convention

所有模組遵循統一的視覺樣式（詳見 memory 中的 `module_visual_style_standard.md`）：

### 色彩系統
- 主色 `#3d5a80`（藍灰）、輔色 `#98c1d9`（淺藍）
- 強調色 `#ee6c4d`（橘紅，用於可拖動元素）
- 深色 `#293241`（標題/文字）、亮色 `#e0fbfc`（按鈕文字）

### 控制點
- **可拖動**：r=20, fill white, stroke `#ee6c4d`, strokeWidth 4
- **固定點**：r=20, fill white, stroke `#3d5a80`, strokeWidth 4
- **點標籤**（A/B/C）：`text-2xl font-black`, `textAnchor="middle"` + `dominantBaseline="middle"` + `dy="0.08em"`
- 較小 viewBox (500×400) 的模組縮小至 r=16 / strokeWidth 3

### 圖形元素
- 扇形填色：`fillOpacity="0.2"`，搭配同色 stroke
- 多邊形：`strokeLinejoin="round"`
- 線段端點：`strokeLinecap="round"`
- 角度數字標籤：`font-en font-bold`（Nunito 字體）

### SVG 圖層順序（由底到頂）
扇形 → 線段/多邊形 → 文字標籤 → 控制點圓圈

## Layout

- 首頁：章節分組，點擊進入模組
- 模組頁：左側互動 SVG + 右側資訊面板（直式時上下排列）
- 支援直橫排版自動切換（`useLayoutMode` hook）
- 背景色 `#EEEEEE`（模組區域）、`#293241`（全域背景）

## Notes

- `.env` 中的 `GEMINI_API_KEY` 用於 AI 相關功能
- 截圖 (*.png) 和 `.playwright-mcp/` 已加入 `.gitignore`
- `migrated_prompt_history/` 為舊版 prompt 備份，已忽略
