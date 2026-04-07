
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Point, ModuleInfo } from '../../types';

type ConstructionMode = 'foot' | 'bisector' | 'angle-bisector';

// 顏色常數
const COLORS = {
    main: '#3d5a80',
    aux: '#98c1d9',
    fill: 'rgba(152, 193, 217, 0.2)',
    text: '#293241',
    highlight: '#ee6c4d',
    white: '#EEEEEE'
};

const PerpendicularFoot: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [pointB, setPointB] = useState<Point>({ x: 250, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const lineY = 300;
    const pointA: Point = { x: 200, y: lineY };

    const angleRad = Math.atan2(pointA.y - pointB.y, pointB.x - pointA.x);
    const angleDeg = Math.round(angleRad * 180 / Math.PI);
    const isPerpendicular = Math.abs(angleDeg - 90) < 2;

    useEffect(() => {
        setInfo({
            title: "基本作圖 - 垂線",
            data: isPerpendicular
                ? [{ label: "關係", value: "垂直 (⊥)" }]
                : [{ label: "夾角", value: `${angleDeg}°` }],
            concept: "從直線外一點向直線作垂直線，垂線與直線的交點稱為垂足。",
            aiTip: "拖動點 B，試著讓 AB 和直線 L 垂直！"
        });
    }, [angleDeg, isPerpendicular, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!isDragging || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        let newX = svgP.x;
        let newY = Math.min(svgP.y, lineY - 40);

        // 接近垂直時吸附（用水平偏移比高度判斷，避免遠處難觸發）
        const hDist = Math.abs(newX - pointA.x);
        const vDist = pointA.y - newY;
        if (vDist > 20 && hDist / vDist < Math.tan(5 * Math.PI / 180)) {
            newX = pointA.x;
        }

        setPointB({ x: newX, y: newY });
    }, [isDragging, lineY]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (isDragging) {
            e.preventDefault();
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [isDragging, handleInteraction]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 500 400" className="overflow-visible select-none">
            <line x1="50" y1={lineY} x2="450" y2={lineY} stroke={COLORS.main} strokeWidth="4" />
            <text x="460" y={lineY + 5} fill={COLORS.main} className="font-bold text-lg select-none">L</text>
            
            <line x1={pointA.x} y1={pointA.y} x2={pointB.x} y2={pointB.y} stroke={isPerpendicular ? COLORS.highlight : COLORS.aux} strokeWidth="3" strokeDasharray={isPerpendicular ? "0" : "6"}/>

            {isPerpendicular && (
                <g className="select-none">
                    <path d={`M ${pointA.x} ${pointA.y - 35} L ${pointA.x + 35} ${pointA.y - 35} L ${pointA.x + 35} ${pointA.y}`} fill="none" stroke={COLORS.highlight} strokeWidth="3" />
                    <text x={pointA.x + 42} y={pointA.y - 45} fill={COLORS.highlight} className="font-black text-xl select-none">A 為垂足</text>
                </g>
            )}
            
            <circle cx={pointA.x} cy={pointA.y} r="16" fill="white" stroke={COLORS.main} strokeWidth="3" />
            <text x={pointA.x} y={pointA.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" fill={COLORS.main} className="font-black text-lg select-none pointer-events-none">A</text>

            <g
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                className="cursor-grab active:cursor-grabbing"
            >
                <circle cx={pointB.x} cy={pointB.y} r="16" fill="white" stroke={COLORS.highlight} strokeWidth="3" />
                <text x={pointB.x} y={pointB.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" className="font-black select-none pointer-events-none text-lg" fill={COLORS.highlight}>B</text>
            </g>
        </svg>
    );
};

const PerpendicularBisector: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [pointA, setPointA] = useState<Point>({ x: 120, y: 220 });
    const [pointB, setPointB] = useState<Point>({ x: 380, y: 180 });
    const [draggingPoint, setDraggingPoint] = useState<'A' | 'B' | null>(null);
    const [showBisector, setShowBisector] = useState(false);

    const midpoint: Point = {
        x: (pointA.x + pointB.x) / 2,
        y: (pointA.y + pointB.y) / 2,
    };

    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const unitDx = dx / length;
    const unitDy = dy / length;
    const perpDx = -unitDy;
    const perpDy = unitDx;

    const bisectorHalfLength = 130;

    const raSize = 15;
    const raP1x = midpoint.x + unitDx * raSize;
    const raP1y = midpoint.y + unitDy * raSize;
    const raP2x = midpoint.x + unitDx * raSize + perpDx * raSize;
    const raP2y = midpoint.y + unitDy * raSize + perpDy * raSize;
    const raP3x = midpoint.x + perpDx * raSize;
    const raP3y = midpoint.y + perpDy * raSize;

    useEffect(() => {
        setInfo({
            title: "基本作圖 - 中垂線",
            data: [
                { label: "AB 長度", value: `${Math.round(length / 10)}` },
                { label: "性質", value: "垂直且平分" }
            ],
            concept: "通過線段中點 M、且與線段垂直的直線，稱為中垂線。中垂線上的任一點到線段兩端等距。",
            aiTip: "拖動點 A 或點 B 改變線段，按按鈕顯示中垂線！"
        });
    }, [length, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!draggingPoint || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        const x = Math.max(40, Math.min(460, svgP.x));
        const y = Math.max(40, Math.min(360, svgP.y));

        if (draggingPoint === 'A') setPointA({ x, y });
        else setPointB({ x, y });
    }, [draggingPoint]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (draggingPoint) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, [draggingPoint, handleInteraction]);

    useEffect(() => {
        const handleMouseUp = () => setDraggingPoint(null);
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
    }, [handleMouseMove, handleTouchMove]);

    return (
        <div className="relative w-full h-full flex flex-col bg-[#EEEEEE] select-none">
             <div className="flex-1 relative">
                <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 500 400" className="select-none overflow-visible">
                    <line x1={pointA.x} y1={pointA.y} x2={pointB.x} y2={pointB.y} stroke={COLORS.main} strokeWidth="4" strokeLinecap="round" />

                    {showBisector && (
                        <>
                            <line x1={midpoint.x + perpDx * bisectorHalfLength} y1={midpoint.y + perpDy * bisectorHalfLength} 
                                  x2={midpoint.x - perpDx * bisectorHalfLength} y2={midpoint.y - perpDy * bisectorHalfLength} 
                                  stroke={COLORS.highlight} strokeWidth="3" strokeDasharray="8" />
                            <path d={`M ${raP1x} ${raP1y} L ${raP2x} ${raP2y} L ${raP3x} ${raP3y}`} fill="none" stroke={COLORS.highlight} strokeWidth="2" />

                            {/* 等長標記 */}
                            {(() => {
                                const tickLen = 8;
                                const mA = { x: (pointA.x + midpoint.x) / 2, y: (pointA.y + midpoint.y) / 2 };
                                const mB = { x: (pointB.x + midpoint.x) / 2, y: (pointB.y + midpoint.y) / 2 };
                                return [mA, mB].map((m, i) => (
                                    <line key={i} x1={m.x + perpDx * tickLen} y1={m.y + perpDy * tickLen} x2={m.x - perpDx * tickLen} y2={m.y - perpDy * tickLen} stroke={COLORS.main} strokeWidth="2.5" strokeLinecap="round" />
                                ));
                            })()}

                        </>
                    )}

                    <circle cx={midpoint.x} cy={midpoint.y} r="6" fill={COLORS.highlight} />
                    <text x={midpoint.x + 12 * perpDx} y={midpoint.y - 12 * perpDy - 5} fill={COLORS.text} className="font-black text-lg select-none">M</text>

                    <g
                        onMouseDown={() => setDraggingPoint('A')}
                        onTouchStart={() => setDraggingPoint('A')}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        <circle cx={pointA.x} cy={pointA.y} r="16" fill="white" stroke={COLORS.highlight} strokeWidth="3" />
                        <text x={pointA.x} y={pointA.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" className="font-black text-lg select-none pointer-events-none" fill={COLORS.highlight}>A</text>
                    </g>
                    <g
                        onMouseDown={() => setDraggingPoint('B')}
                        onTouchStart={() => setDraggingPoint('B')}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        <circle cx={pointB.x} cy={pointB.y} r="16" fill="white" stroke={COLORS.highlight} strokeWidth="3" />
                        <text x={pointB.x} y={pointB.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" className="font-black text-lg select-none pointer-events-none" fill={COLORS.highlight}>B</text>
                    </g>
                </svg>
                
                <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
                    <button 
                        onClick={() => setShowBisector(!showBisector)} 
                        className="pointer-events-auto px-10 py-3 font-bold rounded-2xl shadow-xl transition-all w-64 bg-[#ee6c4d] text-white hover:bg-[#d85c3d] hover:scale-105 active:scale-95"
                    >
                        {showBisector ? "隱藏中垂線" : "顯示中垂線"}
                    </button>
                </div>
             </div>
        </div>
    );
};

const AngleBisector: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const center: Point = { x: 250, y: 250 };
    const radius = 130;
    const [points, setPoints] = useState<[Point, Point]>([
        { x: center.x + radius, y: center.y },
        { x: center.x + radius * Math.cos(Math.PI/3), y: center.y - radius * Math.sin(Math.PI/3) }
    ]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [showBisector, setShowBisector] = useState(false);

    const getAngle = (p: Point) => Math.atan2(center.y - p.y, p.x - center.x) * 180 / Math.PI;
    const angleA = getAngle(points[0]);
    const angleB = getAngle(points[1]);
    let totalAngle = Math.abs(angleA - angleB);
    if (totalAngle > 180) totalAngle = 360 - totalAngle;
    const halfAngle = totalAngle / 2;

    useEffect(() => {
        setInfo({
            title: "基本作圖 - 角平分線",
            data: [
                { label: "∠AOB", value: `${Math.round(totalAngle)}°` },
                { label: "平分角", value: `${Math.round(halfAngle)}°` }
            ],
            concept: "從角的頂點出發，將角平分成兩個相等部分的射線，稱為角平分線。",
            aiTip: "拖動點 A 或點 B 改變角度，按按鈕看角平分線！"
        });
    }, [totalAngle, halfAngle, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (draggingIndex === null || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        const dx = svgP.x - center.x;
        const dy = svgP.y - center.y;
        const newAngleRad = Math.atan2(dy, dx);
        
        const next = [...points] as [Point, Point];
        next[draggingIndex] = {
            x: center.x + radius * Math.cos(newAngleRad),
            y: center.y + radius * Math.sin(newAngleRad)
        };
        setPoints(next);
    }, [draggingIndex, center, radius, points]);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (draggingIndex !== null) {
            e.preventDefault();
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [draggingIndex, handleInteraction]);

    useEffect(() => {
        const handleMouseUp = () => setDraggingIndex(null);
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
    }, [handleMouseMove, handleTouchMove]);

    // 計算角平分線方向：取兩射線的角度平均（走較小弧）
    let bisectorAngle: number;
    {
        let diff = angleB - angleA;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        bisectorAngle = angleA + diff / 2;
    }
    
    const describeArc = (r: number, start: number, end: number) => {
        const startRad = (360 - start) * Math.PI / 180;
        const endRad = (360 - end) * Math.PI / 180;
        const p1 = { x: center.x + r * Math.cos(startRad), y: center.y + r * Math.sin(startRad) };
        const p2 = { x: center.x + r * Math.cos(endRad), y: center.y + r * Math.sin(endRad) };
        const largeArcFlag = Math.abs(end - start) > 180 ? "1" : "0";
        const sweepFlag = end > start ? "0" : "1";
        return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${p2.x} ${p2.y}`;
    }

    return (
        <div className="relative w-full h-full flex flex-col bg-[#EEEEEE] select-none">
             <div className="flex-1 relative">
                <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 500 400" className="select-none overflow-visible">
                    <line x1={center.x} y1={center.y} x2={points[0].x} y2={points[0].y} stroke={COLORS.main} strokeWidth="4" strokeLinecap="round" />
                    <line x1={center.x} y1={center.y} x2={points[1].x} y2={points[1].y} stroke={COLORS.main} strokeWidth="4" strokeLinecap="round" />

                    {showBisector && (
                        <>
                            <line x1={center.x} y1={center.y}
                                  x2={center.x + (radius + 40) * Math.cos(bisectorAngle * Math.PI / 180)}
                                  y2={center.y - (radius + 40) * Math.sin(bisectorAngle * Math.PI / 180)}
                                  stroke="#74a5c2" strokeWidth="3" strokeDasharray="8" />
                            <path d={describeArc(40, angleA, bisectorAngle)} fill="none" stroke={COLORS.highlight} strokeWidth="2.5" />
                            <path d={describeArc(46, angleA, bisectorAngle)} fill="none" stroke={COLORS.highlight} strokeWidth="2.5" />
                            <path d={describeArc(40, bisectorAngle, angleB)} fill="none" stroke={COLORS.highlight} strokeWidth="2.5" />
                            <path d={describeArc(46, bisectorAngle, angleB)} fill="none" stroke={COLORS.highlight} strokeWidth="2.5" />
                        </>
                    )}

                    <circle cx={center.x} cy={center.y} r="16" fill="white" stroke={COLORS.main} strokeWidth="3" />
                    <text x={center.x} y={center.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" fill={COLORS.main} className="font-black text-lg select-none pointer-events-none">O</text>

                    {points.map((p, i) => (
                        <g
                            key={i}
                            onMouseDown={() => setDraggingIndex(i)}
                            onTouchStart={() => setDraggingIndex(i)}
                            className="cursor-grab active:cursor-grabbing"
                        >
                            <circle cx={p.x} cy={p.y} r="16" fill="white" stroke={COLORS.highlight} strokeWidth="3" />
                            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" dy="0.08em" className="font-black select-none pointer-events-none text-lg" fill={COLORS.highlight}>{i === 0 ? 'A' : 'B'}</text>
                        </g>
                    ))}
                </svg>
                
                <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
                    <button 
                        onClick={() => setShowBisector(!showBisector)} 
                        className="pointer-events-auto px-10 py-3 font-bold rounded-2xl shadow-xl transition-all w-64 bg-[#ee6c4d] text-white hover:bg-[#d85c3d] hover:scale-105 active:scale-95"
                    >
                        {showBisector ? "隱藏角平分線" : "顯示角平分線"}
                    </button>
                </div>
             </div>
        </div>
    );
};

const BasicConstructions: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const [mode, setMode] = useState<ConstructionMode>('foot');
    const tabs: {id: ConstructionMode, name: string}[] = [
        { id: 'foot', name: '垂線' },
        { id: 'bisector', name: '中垂線' },
        { id: 'angle-bisector', name: '角平分線' }
    ];

    return (
        <div className="w-full h-full flex flex-col bg-[#EEEEEE] select-none">
            <div className="flex justify-center border-b border-[#98c1d9]/30 p-4 bg-[#3d5a80]/5 gap-4 select-none">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setMode(tab.id)} className={`px-8 py-3 font-bold rounded-2xl transition-all ${mode === tab.id ? 'bg-[#3d5a80] text-[#e0fbfc] shadow-lg' : 'text-[#3d5a80] hover:bg-[#98c1d9]/20'}`}>
                        {tab.name}
                    </button>
                ))}
            </div>
            <div className="flex-grow select-none relative">
                {mode === 'foot' && <PerpendicularFoot setInfo={setInfo} />}
                {mode === 'bisector' && <PerpendicularBisector setInfo={setInfo} />}
                {mode === 'angle-bisector' && <AngleBisector setInfo={setInfo} />}
            </div>
        </div>
    );
};

export default BasicConstructions;
