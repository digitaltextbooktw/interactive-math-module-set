
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Point, ModuleInfo } from '../../types';

const TriangleAngles: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [points, setPoints] = useState<[Point, Point, Point]>([
        { x: 300, y: 80 },
        { x: 100, y: 320 },
        { x: 500, y: 320 },
    ]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    const calculateAngle = useCallback((p1: Point, p2: Point, p3: Point): number => {
        const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const angle2 = Math.atan2(p3.y - p1.y, p3.x - p1.x);
        let angle = Math.abs((angle2 - angle1) * (180 / Math.PI));
        if (angle > 180) angle = 360 - angle;
        return Math.round(angle);
    }, []);

    const angleA = calculateAngle(points[0], points[1], points[2]);
    const angleB = calculateAngle(points[1], points[2], points[0]);
    const angleC = calculateAngle(points[2], points[0], points[1]);
    const totalAngle = angleA + angleB + angleC;

    useEffect(() => {
        setInfo({
            title: "三角形的角",
            data: [
                { label: "∠A", value: `${angleA}°` },
                { label: "∠B", value: `${angleB}°` },
                { label: "∠C", value: `${angleC}°` },
                { label: "內角和", value: `${totalAngle}°` }
            ],
            concept: `三角形的三個內角總和恆為 180°，不論形狀如何改變都成立。`,
            aiTip: "拖動三角形的頂點，觀察三個內角的和！"
        });
    }, [angleA, angleB, angleC, totalAngle, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (draggingIndex === null || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        const newX = Math.max(40, Math.min(560, svgP.x));
        const newY = Math.max(40, Math.min(360, svgP.y));
        
        setPoints(prev => {
            const next = [...prev] as [Point, Point, Point];
            next[draggingIndex] = { x: newX, y: newY };
            return next;
        });
    }, [draggingIndex]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (draggingIndex !== null) {
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [draggingIndex, handleInteraction]);

    const handleMouseUp = useCallback(() => setDraggingIndex(null), []);

    const drawSector = (center: Point, p1: Point, p2: Point, r: number): string => {
        const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
        const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const s = { x: center.x + r * Math.cos(a1), y: center.y + r * Math.sin(a1) };
        const e = { x: center.x + r * Math.cos(a2), y: center.y + r * Math.sin(a2) };
        return `M ${center.x},${center.y} L ${s.x},${s.y} A ${r},${r} 0 ${Math.abs(diff) > Math.PI ? 1 : 0},${diff > 0 ? 1 : 0} ${e.x},${e.y} Z`;
    };

    const getLabelPos = (vertex: Point, p1: Point, p2: Point, dist: number): Point => {
        const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const mid = a1 + diff / 2;
        return { x: vertex.x + dist * Math.cos(mid), y: vertex.y + dist * Math.sin(mid) };
    };

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

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEEEEE] select-none p-4">
            <svg 
                ref={svgRef} 
                viewBox="0 0 600 400" 
                className="w-full h-full overflow-visible select-none"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* 扇形 */}
                <path d={drawSector(points[0], points[1], points[2], 60)} fill="#ee6c4d" fillOpacity="0.2" stroke="#ee6c4d" strokeWidth="1" />
                <path d={drawSector(points[1], points[2], points[0], 60)} fill="#ee6c4d" fillOpacity="0.2" stroke="#ee6c4d" strokeWidth="1" />
                <path d={drawSector(points[2], points[0], points[1], 60)} fill="#ee6c4d" fillOpacity="0.2" stroke="#ee6c4d" strokeWidth="1" />

                <polygon
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="#98c1d9" fillOpacity="0.1" stroke="#3d5a80" strokeWidth="3"
                />

                {/* 度數標籤（三角形內） */}
                {[
                    { pos: getLabelPos(points[0], points[1], points[2], 85), val: angleA },
                    { pos: getLabelPos(points[1], points[2], points[0], 85), val: angleB },
                    { pos: getLabelPos(points[2], points[0], points[1], 85), val: angleC },
                ].map((item, i) => (
                    <text key={`label-${i}`} x={item.pos.x} y={item.pos.y} textAnchor="middle" dominantBaseline="middle" fill="#3d5a80" fontSize="22" className="font-en font-bold pointer-events-none select-none">
                        {item.val}°
                    </text>
                ))}

                {/* 控制點 */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x} cy={p.y} r="20" fill="white" stroke="#ee6c4d" strokeWidth="4"
                            className="cursor-grab active:cursor-grabbing"
                            onMouseDown={() => setDraggingIndex(i)}
                            onTouchStart={() => setDraggingIndex(i)}
                        />
                        <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" fill="#ee6c4d" className="font-black text-2xl pointer-events-none select-none">
                            {['A', 'B', 'C'][i]}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default TriangleAngles;
