import { useState, useEffect } from 'react';

/**
 * 統一的直橫排版判斷 hook
 * 橫式條件：寬度 >= 768px AND 寬 > 高（landscape）
 * 其餘情況：直式
 */
export function useLayoutMode() {
    const [isLandscape, setIsLandscape] = useState(() => {
        return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    });

    useEffect(() => {
        const update = () => {
            setIsLandscape(window.innerWidth >= 768 && window.innerWidth > window.innerHeight);
        };
        window.addEventListener('resize', update);
        window.addEventListener('orientationchange', () => {
            // orientationchange 後尺寸可能延遲更新，等一個 frame
            setTimeout(update, 100);
        });
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('orientationchange', update);
        };
    }, []);

    return isLandscape;
}
