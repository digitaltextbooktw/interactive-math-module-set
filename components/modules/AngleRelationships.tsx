
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Point, ModuleInfo } from '../../types';

interface AngleRelationshipsProps {
    setInfo: (info: ModuleInfo) => void;
}

const AngleRelationships: React.FC<AngleRelationshipsProps> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [angle, setAngle] = useState(65);
    const [isDragging, setIsDragging] = useState(false);
    
    const centerX = 250;
    const centerY = 170;
    const lineLength = 140;

    const angle1 = Math.round(angle);
    const angle2 = 180 - angle1;

    useEffect(() => {
        setInfo({
            title: "角的關係 - 補角",
            data: [
                { label: "∠1", value: `${angle1}°` },
                { label: "∠2", value: `${angle2}°` },
                { label: "總和", value: `180°` }
            ],
            concept: `互補：當兩角之和為 180° 時，稱這兩個角互為補角。\n圖中直線 L 與射線 M 構成了一組鄰補角。`,
            aiTip: "拖動橘色點，看看兩個角怎麼互補！"
        });
    }, [angle1, angle2, setInfo]);
    
    const getPointOnCircle = (deg: number, radius: number): Point => {
        const rad = deg * (Math.PI / 180);
        return {
            x: centerX + radius * Math.cos(rad),
            y: centerY - radius * Math.sin(rad)
        };
    };

    const handlePoint = getPointOnCircle(angle, lineLength);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const dx = clientX - svgRect.left - (centerX * (svgRect.width / 500));
        const dy = -(clientY - svgRect.top - (centerY * (svgRect.height / 340)));

        let newAngle = Math.atan2(Math.max(0, dy), dx) * (180 / Math.PI);
        if (newAngle < 0) newAngle = 0;
        if (newAngle > 180) newAngle = 180;
        setAngle(newAngle);
    }, [centerX, centerY]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) handleInteraction(e.clientX, e.clientY);
    }, [isDragging, handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (isDragging) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
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
    
    const describeSector = (startDeg: number, endDeg: number, r: number): string => {
        const start = getPointOnCircle(startDeg, r);
        const end = getPointOnCircle(endDeg, r);
        const angleDiff = endDeg - startDeg;
        const largeArcFlag = Math.abs(angleDiff) <= 180 ? "0" : "1";
        return [ "M", centerX, centerY, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "Z" ].join(" ");
    };

    const arc1Path = describeSector(angle, 180, 60);
    const arc2Path = describeSector(0, angle, 60);
    const label1Pos = getPointOnCircle((angle + 180) / 2, 90);
    const label2Pos = getPointOnCircle(angle / 2, 90);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEEEEE] select-none p-4">
            <svg 
                ref={svgRef} 
                viewBox="0 0 500 340" 
                className="w-full h-full max-h-[500px] overflow-visible select-none"
                preserveAspectRatio="xMidYMid meet"
            >
                <line x1="50" y1={centerY} x2="450" y2={centerY} stroke="#3d5a80" strokeWidth="3" />
                <line x1={centerX} y1={centerY} x2={handlePoint.x} y2={handlePoint.y} stroke="#ee6c4d" strokeWidth="3" strokeLinecap="round" />
                <path d={arc1Path} fill="#98c1d9" fillOpacity="0.2" stroke="#98c1d9" strokeWidth="1" />
                <path d={arc2Path} fill="#e0fbfc" fillOpacity="0.3" stroke="#98c1d9" strokeWidth="1" />
                <text x={label1Pos.x} y={label1Pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#3d5a80" className="pointer-events-none">
                    ∠2 = {angle2}°
                </text>
                <text x={label2Pos.x} y={label2Pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#3d5a80" className="pointer-events-none">
                    ∠1 = {angle1}°
                </text>
                <circle cx={centerX} cy={centerY} r="6" fill="#293241" />
                <g 
                    className="cursor-grab active:cursor-grabbing" 
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                >
                    <circle cx={handlePoint.x} cy={handlePoint.y} r="14" fill="white" stroke="#ee6c4d" strokeWidth="3" />
                </g>
                <text x={460} y={centerY + 5} fontSize="16" fill="#293241" className="font-black">L</text>
                <text x={centerX} y={centerY + 25} textAnchor="middle" fontSize="16" fill="#293241" className="font-black">O</text>
            </svg>
        </div>
    );
};

export default AngleRelationships;
