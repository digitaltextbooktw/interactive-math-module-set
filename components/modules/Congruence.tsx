
import React, { useState, useEffect, useMemo } from 'react';
import type { ModuleInfo, Point } from '../../types';

type Selection = {
    sides: Set<number>;
    angles: Set<number>;
};

const triangle1Points: [Point, Point, Point] = [
    { x: 50, y: 280 },  { x: 250, y: 280 }, { x: 150, y: 100 }
];

const triangle2Points: [Point, Point, Point] = [
    { x: 350, y: 280 }, { x: 550, y: 280 }, { x: 450, y: 100 }
];

const getTriangleProperties = (points: [Point, Point, Point]) => {
    const [pA, pB, pC] = points;
    const dist = (p1: Point, p2: Point) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
    const a = dist(pB, pC);
    const b = dist(pA, pC);
    const c = dist(pA, pB);
    const angle = (s1: number, s2: number, sOpp: number) => Math.acos((s1**2 + s2**2 - sOpp**2) / (2 * s1 * s2)) * 180 / Math.PI;
    return { points, sides: [a, b, c], angles: [angle(b, c, a), angle(a, c, b), angle(a, b, c)] };
}

const TriangleDisplay: React.FC<{ triangle: any; selection: Selection; onSelect: (type: 'side' | 'angle', index: number) => void }> = ({ triangle, selection, onSelect }) => {
    const { points } = triangle;
    const sidePoints: [Point, Point][] = [[points[1], points[2]], [points[0], points[2]], [points[0], points[1]]];
    return (
        <g className="select-none">
            <polygon points={points.map((p: Point) => `${p.x},${p.y}`).join(' ')} fill="#98c1d9" fillOpacity="0.15" stroke="#3d5a80" strokeWidth="2" />
            {sidePoints.map((linePoints, i) => (
                <line key={`side-${i}`} x1={linePoints[0].x} y1={linePoints[0].y} x2={linePoints[1].x} y2={linePoints[1].y}
                    stroke={selection.sides.has(i) ? '#ee6c4d' : 'transparent'} strokeWidth="8" strokeLinecap="round" onClick={() => onSelect('side', i)} className="cursor-pointer transition-all hover:stroke-[#98c1d9]/40" />
            ))}
            {points.map((p: Point, i: number) => (
                <circle key={`angle-${i}`} cx={p.x} cy={p.y} r="12"
                    fill={selection.angles.has(i) ? '#ee6c4d' : 'transparent'} fillOpacity="0.8" onClick={() => onSelect('angle', i)} className="cursor-pointer transition-all hover:fill-[#98c1d9]/40" />
            ))}
        </g>
    );
};

const Congruence: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const triangles = useMemo(() => [getTriangleProperties(triangle1Points), getTriangleProperties(triangle2Points)], []);
    const [selection, setSelection] = useState<[Selection, Selection]>([{ sides: new Set(), angles: new Set() }, { sides: new Set(), angles: new Set() }]);
    const [congruence, setCongruence] = useState<string>('選擇三個對應元素');

    const handleSelect = (type: 'side' | 'angle', index: number) => {
        setSelection(prev => {
            const next: [Selection, Selection] = [{ sides: new Set(prev[0].sides), angles: new Set(prev[0].angles) }, { sides: new Set(prev[1].sides), angles: new Set(prev[1].angles) }];
            const s1 = type === 'side' ? next[0].sides : next[0].angles;
            const s2 = type === 'side' ? next[1].sides : next[1].angles;
            if (s1.has(index)) { s1.delete(index); s2.delete(index); }
            else if (next[0].sides.size + next[0].angles.size < 3) { s1.add(index); s2.add(index); }
            return next;
        });
    };
    
    useEffect(() => {
        const [sel] = selection;
        const count = sel.sides.size + sel.angles.size;
        if (count !== 3) { setCongruence('請選擇三個對應邊角'); return; }
        const s = Array.from(sel.sides).sort();
        const a = Array.from(sel.angles).sort();
        if (s.length === 3) setCongruence('SSS 全等');
        else if (s.length === 2 && a.length === 1) {
            const [s1, s2] = s; const ang = a[0];
            if ((s1===0&&s2===1&&ang===2) || (s1===0&&s2===2&&ang===1) || (s1===1&&s2===2&&ang===0)) setCongruence('SAS 全等');
            else setCongruence('不符合全等條件');
        } else if (s.length === 1 && a.length === 2) {
            const side = s[0]; const [a1, a2] = a;
            if ((side===0&&a1===1&&a2===2) || (side===1&&a1===0&&a2===2) || (side===2&&a1===0&&a2===1)) setCongruence('ASA 全等');
            else setCongruence('AAS 全等');
        } else setCongruence('不符合全等條件');
    }, [selection]);

    useEffect(() => {
        setInfo({
            title: "全等判定",
            data: [{ label: "判定性質", value: congruence }],
            concept: "透過比較三個元素，判斷兩個三角形是否完全相同。\n橘色部分代表你當前選擇的對應邊角。",
            aiTip: "點選左邊三角形的邊或角，右邊會同步標記！"
        });
    }, [congruence, setInfo]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#EEEEEE] select-none">
            <svg width="100%" height="400" viewBox="0 0 600 400" className="overflow-visible select-none">
                <TriangleDisplay triangle={triangles[0]} selection={selection[0]} onSelect={handleSelect} />
                <TriangleDisplay triangle={triangles[1]} selection={selection[1]} onSelect={handleSelect} />
                <text x="150" y="330" textAnchor="middle" fill="#3d5a80" className="font-black text-xl select-none">三角形 1</text>
                <text x="450" y="330" textAnchor="middle" fill="#3d5a80" className="font-black text-xl select-none">三角形 2</text>
            </svg>
            <div className="mt-4 select-none">
                <button onClick={() => setSelection([{ sides: new Set(), angles: new Set() }, { sides: new Set(), angles: new Set() }])} className="px-6 py-2 bg-[#3d5a80] text-[#e0fbfc] font-bold rounded-xl shadow-lg hover:bg-[#293241] transition-all">重新選擇</button>
            </div>
        </div>
    );
};

export default Congruence;
