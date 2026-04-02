
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ModuleInfo, Point } from '../../types';

const ExteriorAngle: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [points, setPoints] = useState<[Point, Point, Point]>([
        { x: 100, y: 250 }, { x: 350, y: 250 }, { x: 200, y: 100 }
    ]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    const [A, C, B] = points;
    const D: Point = { x: C.x + 100, y: C.y };

    const calculateAngles = () => {
        const dist = (p1: Point, p2: Point) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
        const c_len = dist(A, B); const a_len = dist(B, C); const b_len = dist(A, C);
        const angA = Math.acos((c_len**2 + b_len**2 - a_len**2) / (2 * c_len * b_len)) * 180 / Math.PI;
        const angB = Math.acos((c_len**2 + a_len**2 - b_len**2) / (2 * c_len * a_len)) * 180 / Math.PI;
        return { A: Math.round(angA), B: Math.round(angB), Ext: Math.round(angA + angB) };
    };

    const angles = calculateAngles();

    useEffect(() => {
        setInfo({
            title: "外角關係",
            data: [
                { label: "∠A", value: `${angles.A}°` },
                { label: "∠B", value: `${angles.B}°` },
                { label: "外角 ∠C", value: `${angles.Ext}°` }
            ],
            concept: "三角形外角定理：三角形任一外角的度數等於兩個不相鄰內角的和。\n圖中橘色標示的為外角部分。",
            aiTip: "拖動橘色頂點 B 改變形狀。注意 ∠A + ∠B 永遠等於外側橘色區域的角度。"
        });
    }, [angles, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (draggingIndex === null || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        const next = [...points] as [Point, Point, Point];
        next[draggingIndex] = { 
            x: Math.max(20, Math.min(480, svgP.x)), 
            y: Math.max(20, Math.min(300, svgP.y)) 
        };
        setPoints(next);
    }, [draggingIndex, points]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (draggingIndex !== null) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, [draggingIndex, handleInteraction]);

    const handleMouseUp = useCallback(() => setDraggingIndex(null), []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp, handleTouchMove]);

    const drawSector = (center: Point, p1: Point, p2: Point, r: number) => {
        const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
        const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const s = {x: center.x + r * Math.cos(a1), y: center.y + r * Math.sin(a1)};
        const e = {x: center.x + r * Math.cos(a2), y: center.y + r * Math.sin(a2)};
        return `M ${center.x},${center.y} L ${s.x},${s.y} A ${r},${r} 0 ${Math.abs(diff) > Math.PI ? 1 : 0},${diff > 0 ? 1 : 0} ${e.x},${e.y} Z`;
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#EEEEEE] select-none">
            <svg ref={svgRef} width="100%" height="320" viewBox="0 0 500 320" className="overflow-visible select-none">
                <line x1={A.x} y1={A.y} x2={D.x} y2={D.y} stroke="#3d5a80" strokeWidth="4" />
                <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#98c1d9" fillOpacity="0.2" stroke="#3d5a80" strokeWidth="3" />
                <path d={drawSector(A, C, B, 45)} fill="#98c1d9" fillOpacity="0.4" stroke="#3d5a80" strokeWidth="1" />
                <path d={drawSector(B, A, C, 45)} fill="#98c1d9" fillOpacity="0.4" stroke="#3d5a80" strokeWidth="1" />
                <path d={drawSector(C, D, B, 50)} fill="#ee6c4d" fillOpacity="0.6" stroke="#ee6c4d" strokeWidth="2" />
                <circle 
                    cx={B.x} cy={B.y} r="14" fill="white" stroke="#ee6c4d" strokeWidth="4" 
                    onMouseDown={() => setDraggingIndex(2)} 
                    onTouchStart={() => setDraggingIndex(2)}
                    className="cursor-grab active:cursor-grabbing shadow-xl" 
                />
                <text x={B.x} y={B.y} textAnchor="middle" dominantBaseline="middle" fill="#ee6c4d" className="font-black text-xs select-none pointer-events-none">B</text>
                <text x={A.x - 20} y={A.y + 5} fill="#3d5a80" className="font-black select-none">A</text>
                <text x={C.x} y={C.y + 30} fill="#3d5a80" className="font-black select-none" textAnchor="middle">C</text>
                <text x={A.x + 55} y={A.y - 10} fill="#3d5a80" className="font-bold text-lg select-none">{angles.A}°</text>
                <text x={B.x} y={B.y - 30} textAnchor="middle" fill="#3d5a80" className="font-bold text-lg select-none">{angles.B}°</text>
                <text x={C.x + 60} y={C.y - 15} fill="#ee6c4d" className="font-black text-2xl select-none">{angles.Ext}°</text>
            </svg>
            <div className="mt-10 text-2xl font-black text-[#ee6c4d] bg-white border-2 border-[#ee6c4d] px-10 py-4 rounded-3xl shadow-xl select-none">
                外角 {angles.Ext}° = {angles.A}° + {angles.B}°
            </div>
        </div>
    );
};

export default ExteriorAngle;
