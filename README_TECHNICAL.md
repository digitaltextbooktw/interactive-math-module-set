# 互動式幾何數學模組集 - 技術開發手冊 (Technical Development Manual)

本文件旨在為開發者（或 AI 協作夥伴）提供本專案的底層技術架構、數學邏輯及座標規範，以便於後續的功能擴展或遊戲化整合。

---

## 1. 系統架構與資料流 (System Architecture & State Flow)

本專案採用 **React 19 + Vite** 架構，核心邏輯在於「互動模組」與「資訊面板」的解耦。

### 1.1 全域狀態流向
*   **父組件 (`App.tsx`)**：負責路由切換、搜尋過濾及維護 `currentInfo` 狀態。
*   **子組件 (Modules)**：每個模組皆接收一個 `setInfo` 回呼函數。
    *   **通訊介面**：`setInfo(info: ModuleInfo)`
    *   **ModuleInfo 結構**：
        ```typescript
        {
          title: string;    // 模組標題
          data: Array<{ label: string, value: string }>; // 數據看板顯示的數值
          concept: string;  // 幾何概念文字說明
          aiTip: string;    // 操作提示
        }
        ```
*   **觸發機制**：模組內部使用 `useEffect` 監聽其核心狀態（如 `angle`, `points`），一旦發生變化即調用 `setInfo` 更新父組件。

---

## 2. SVG 座標規範 (SVG Coordinate System)

所有模組均使用 SVG 作為繪圖引擎，並遵循以下座標規範：

| 模組名稱 | ViewBox 尺寸 | 核心中心點 / 基準線 | 座標轉換邏輯 |
| :--- | :--- | :--- | :--- |
| **AngleBasics** | `600 x 400` | `(220, 200)` | `Math.atan2(-dy, dx)` (Y軸反轉) |
| **AngleRelationships** | `500 x 340` | `(250, 170)` | 水平基準線 `y = 170` |
| **TriangleAngles** | `600 x 400` | 動態頂點 | 邊界限制：`x[40, 560]`, `y[40, 360]` |
| **ExteriorAngle** | `500 x 320` | 動態頂點 | 頂點 B 為主要控制點 |
| **BasicConstructions** | `500 x 400` | 模式切換 | 包含垂足、中垂線、角平分線子座標 |
| **AreaCalculation** | `550 x 400` | `SCALE = 100` | 100 像素 = 1 數學單位 |

---

## 3. 核心數學公式庫 (Core Mathematical Formulas)

### 3.1 角度計算 (Angle Calculation)
*   **兩點間角度**：
    ```typescript
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI);
    ```
*   **三點夾角 (頂點 p1)**：
    ```typescript
    const a1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const a2 = Math.atan2(p3.y - p1.y, p3.x - p1.x);
    let angle = Math.abs((a2 - a1) * (180 / Math.PI));
    if (angle > 180) angle = 360 - angle;
    ```

### 3.2 面積與距離 (Area & Distance)
*   **兩點距離**：`Math.sqrt((x2-x1)**2 + (y2-y1)**2)`
*   **三角形面積 (底高法)**：`(base * height) / 2`
*   **三角形面積 (海龍公式/餘弦定理輔助)**：
    透過三邊長 $a, b, c$ 求 $\cos A = \frac{b^2 + c^2 - a^2}{2bc}$。

### 3.3 幾何判定邏輯
*   **三角形不等式**：`a + b > c && a + c > b && b + c > a`
*   **全等判定 (Congruence)**：
    *   **SSS**: `sides.size === 3`
    *   **SAS**: `sides.size === 2 && angles.size === 1` (且角為兩邊夾角)
    *   **ASA/AAS**: `sides.size === 1 && angles.size === 2`

---

## 4. 遊戲整合建議 (Game Integration Guide)

若要將此專案整合進遊戲，以下是可供外部調用的關鍵變數與邏輯：

### 4.1 碰撞體與觸發器 (Colliders & Triggers)
*   **角度觸發**：在 `AngleBasics` 中，`angle` 變數可直接作為解謎開關（例如：當 `angle === 90` 時開啟門）。
*   **形狀閉合**：在 `TriangleInequality` 中，`canFormTriangle` 布林值可作為物理結構是否穩定的判定。
*   **垂直判定**：在 `BasicConstructions` 中，`isPerpendicular` 可用於判定玩家是否精準放置了建築物件。

### 4.2 互動模式 (Interaction Patterns)
*   **精準拖拽**：所有模組均實現了 `getScreenCTM().inverse()` 轉換，這確保了在不同螢幕尺寸下，滑鼠位置與 SVG 元素能精準對齊。
*   **觸控支援**：已整合 `touchmove` 事件處理，支援行動裝置操作。

### 4.3 擴充方向
*   **物理引擎整合**：可將 `points` 陣列傳遞給 Matter.js 或 P2.js，將幾何圖形轉化為具備質量的物理實體。
*   **動態參數化**：所有模組均支援 `setAngle` 或 `setPoints` 的外部調用，可用於製作自動演示動畫。

---

## 5. 開發注意事項 (Development Notes)
*   **性能優化**：複雜路徑繪製（如 `drawSector`）應封裝在 `useCallback` 中，避免不必要的重繪。
*   **誤差容許**：在進行幾何判定時，建議使用 `Math.abs(a - b) < 0.5` 而非絕對等於，以提升用戶體驗。
