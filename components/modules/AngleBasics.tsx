
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ModuleInfo, Point } from '../../types';

interface AngleBasicsProps {
    setInfo: (info: ModuleInfo) => void;
}

const AngleBasics: React.FC<AngleBasicsProps> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [angle, setAngle] = useState(45);
    const [isDragging, setIsDragging] = useState(false);

    const centerX = 300;
    const centerY = 200;
    const radius = 130;

    const getAngleType = useCallback((deg: number) => {
        if (deg === 0) return { name: "零角" };
        if (deg > 0 && deg < 90) return { name: "銳角" };
        if (Math.abs(deg - 90) < 0.5) return { name: "直角" };
        if (deg > 90 && deg < 180) return { name: "鈍角" };
        if (Math.abs(deg - 180) < 0.5) return { name: "平角" };
        if (deg > 180 && deg < 360) return { name: "反角" };
        if (Math.abs(deg - 360) < 0.5) return { name: "周角" };
        return { name: "角度" };
    }, []);
    
    const angleType = getAngleType(angle);

    useEffect(() => {
        setInfo({
            title: "角的基本認識",
            data: [
                { label: "∠AOB", value: `${angle}°` },
                { label: "類型", value: angleType.name }
            ],
            concept: `● 銳角：0° < θ < 90°\n● 直角：θ = 90°\n● 鈍角：90° < θ < 180°\n● 平角：θ = 180°`,
            aiTip: "拖動橘色的 A 點，看看角度怎麼變！"
        });
    }, [angle, angleType.name, setInfo]);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        const dx = svgP.x - centerX;
        const dy = -(svgP.y - centerY); 
        
        let newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (newAngle < 0) newAngle += 360;
        setAngle(Math.round(newAngle));
    }, [centerX, centerY]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) handleInteraction(e.clientX, e.clientY);
    }, [isDragging, handleInteraction]);

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

    const rad = (angle * Math.PI) / 180;
    const ax = centerX + (radius + 40) * Math.cos(-rad);
    const ay = centerY + (radius + 40) * Math.sin(-rad);

    const drawSector = () => {
        if (angle === 0) return null;
        if (angle === 360) {
            return <circle cx={centerX} cy={centerY} r={radius} fill="#98c1d9" fillOpacity="0.2" stroke="#98c1d9" strokeWidth="1" />;
        }
        const largeArcFlag = angle > 180 ? 1 : 0;
        const endX = centerX + radius * Math.cos(-rad);
        const endY = centerY + radius * Math.sin(-rad);
        const startX = centerX + radius;
        const startY = centerY;
        
        const d = [
            "M", centerX, centerY,
            "L", startX, startY,
            "A", radius, radius, 0, largeArcFlag, 0, endX, endY,
            "Z"
        ].join(" ");
        
        return <path d={d} fill="#98c1d9" fillOpacity="0.2" stroke="#98c1d9" strokeWidth="1" />;
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#EEEEEE] select-none p-4 sm:p-6 overflow-hidden">
            {/* 主要旋轉區域 */}
            <div className="flex-1 relative overflow-visible min-h-0">
                <svg
                    ref={svgRef}
                    viewBox="0 0 600 400"
                    className="w-full h-full select-none overflow-visible"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {drawSector()}

                    {/* 扇形內度數標籤 */}
                    {angle > 0 && (() => {
                        const midRad = (angle / 2) * Math.PI / 180;
                        const labelDist = Math.min(radius * 0.45, 60);
                        const lx = centerX + labelDist * Math.cos(-midRad);
                        const ly = centerY + labelDist * Math.sin(-midRad);
                        return (
                            <text
                                x={lx} y={ly}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#3d5a80"
                                className="font-black select-none pointer-events-none" style={{ fontSize: '28px' }}
                            >
                                {angle}°
                            </text>
                        );
                    })()}

                    {/* 基準線 OB */}
                    <line
                        x1={centerX} y1={centerY}
                        x2={centerX + radius + 40} y2={centerY}
                        stroke="#3d5a80" strokeWidth="4" strokeLinecap="round"
                    />
                    <text x={centerX + radius + 65} y={centerY + 5} fill="#3d5a80" className="font-black text-2xl select-none">B</text>

                    {/* 動態線 OA */}
                    <line
                        x1={centerX} y1={centerY}
                        x2={ax} y2={ay}
                        stroke="#ee6c4d" strokeWidth="6" strokeLinecap="round"
                    />

                    {/* 頂點 O */}
                    <circle cx={centerX} cy={centerY} r="8" fill="#293241" />
                    <text x={centerX} y={centerY + 40} textAnchor="middle" fill="#293241" className="font-black text-2xl select-none">O</text>

                    {/* 控制點 A */}
                    <g
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)}
                    >
                        <circle cx={ax} cy={ay} r="20" fill="white" stroke="#ee6c4d" strokeWidth="4" className="shadow-lg" />
                        <text
                            x={ax}
                            y={ay}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ee6c4d"
                            className="font-black text-xl select-none pointer-events-none"
                        >
                            A
                        </text>
                    </g>
                </svg>

            </div>

            {/* 下排快速控制列 */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-3 border-t border-[#3d5a80]/10 shrink-0">
                {[45, 90, 135, 180].map(val => (
                    <button
                        key={val}
                        onClick={() => setAngle(val)}
                        className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-base sm:text-lg font-black transition-all border-2 ${
                            angle === val
                            ? 'bg-[#ee6c4d] border-[#ee6c4d] text-white shadow-lg scale-105'
                            : 'bg-white border-[#98c1d9]/50 text-[#3d5a80] hover:border-[#98c1d9] active:scale-95 shadow-sm'
                        }`}
                    >
                        {val}°
                    </button>
                ))}
                <button
                    onClick={() => setAngle(0)}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-bold text-[#3d5a80]/60 hover:text-[#ee6c4d] transition-colors"
                >
                    重設 0°
                </button>
            </div>
        </div>
    );
};

export default AngleBasics;
