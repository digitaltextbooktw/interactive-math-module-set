
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
            concept: `三角形內角和定理：任何三角形的三個內角總和恆等於 180°。`,
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
                <polygon
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="#3d5a80" fillOpacity="0.1" stroke="#3d5a80" strokeWidth="4"
                />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle 
                            cx={p.x} cy={p.y} r="16" fill="white" stroke={draggingIndex === i ? "#ee6c4d" : "#3d5a80"} strokeWidth="4"
                            className="cursor-grab active:cursor-grabbing" 
                            onMouseDown={() => setDraggingIndex(i)} 
                            onTouchStart={() => setDraggingIndex(i)}
                        />
                        <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={draggingIndex === i ? "#ee6c4d" : "#3d5a80"} className="font-black text-xl pointer-events-none">
                            {['A', 'B', 'C'][i]}
                        </text>
                        <text 
                            x={p.x + (p.x < 300 ? -20 : 20)} 
                            y={p.y + (p.y < 200 ? -30 : 40)} 
                            textAnchor="middle" fill="#3d5a80" className="font-bold text-lg pointer-events-none"
                        >
                            {i === 0 ? angleA : (i === 1 ? angleB : angleC)}°
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default TriangleAngles;
