
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ModuleInfo, Point } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from '../icons';

const AreaCalculation: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [A] = useState<Point>({ x: 100, y: 300 });
    const [B, setB] = useState<Point>({ x: 250, y: 100 });
    const [C, setC] = useState<Point>({ x: 400, y: 300 });
    const [draggingPoint, setDraggingPoint] = useState<'B' | 'C' | null>(null);
    const [step, setStep] = useState(0);

    const rawBase = C.x - A.x;
    const rawHeight = A.y - B.y;
    const SCALE = 100;
    const base = Number((rawBase / SCALE).toFixed(1));
    const height = Number((rawHeight / SCALE).toFixed(1));
    const area = Number(((base * height) / 2).toFixed(2));
    const D = { x: B.x + rawBase, y: B.y };

    useEffect(() => {
        setInfo({
            title: "面積計算",
            data: [
                { label: "底", value: base.toString() },
                { label: "高", value: height.toString() },
                { label: "面積", value: area.toString() }
            ],
            concept: `三角形面積公式：(底 × 高) / 2\n這可以看作是將兩個全等的三角形拼合後所成平行四邊形的一半。`,
            aiTip: "使用下方按鈕逐步探索。橘色線條強調當前計算中使用的關鍵維度。"
        });
    }, [base, height, area, setInfo]);
    
    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!draggingPoint || !svgRef.current) return;
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        
        if (draggingPoint === 'B') setB({ x: svgP.x, y: svgP.y });
        else if (draggingPoint === 'C') setC({ x: Math.max(A.x + 20, svgP.x), y: A.y });
    }, [draggingPoint, A.x, A.y]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (draggingPoint) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, [draggingPoint, handleInteraction]);

    const handleMouseUp = useCallback(() => setDraggingPoint(null), []);

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
    
    const steps = ["初始三角形", "拼成平行四邊形", "標示底與高", "平行四邊形面積", "三角形面積為一半"];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#EEEEEE] select-none">
            <svg ref={svgRef} width="100%" height="350" viewBox="0 0 550 400" className="overflow-visible select-none">
                <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#98c1d9" fillOpacity="0.2" stroke="#3d5a80" strokeWidth="3" />
                {step >= 1 && (
                    <polygon points={`${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`} fill="#e0fbfc" fillOpacity="0.3" stroke="#98c1d9" strokeWidth="2" strokeDasharray="6" style={{ opacity: step >= 4 ? 0.3 : 1, transition: 'opacity 0.5s' }} />
                )}
                {step >= 2 && (
                    <>
                        <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="#ee6c4d" strokeWidth="5" strokeLinecap="round" />
                        <text x={(A.x + C.x) / 2} y={A.y + 35} fill="#ee6c4d" className="font-black text-xl select-none" textAnchor="middle">底: {base}</text>
                        <line x1={B.x} y1={B.y} x2={B.x} y2={A.y} stroke="#ee6c4d" strokeWidth="4" strokeDasharray="8" strokeLinecap="round" />
                        <text x={B.x + 15} y={(B.y + A.y) / 2} fill="#ee6c4d" className="font-black text-xl select-none">高: {height}</text>
                    </>
                )}
                <circle 
                    cx={B.x} cy={B.y} r="12" 
                    onMouseDown={() => setDraggingPoint('B')} 
                    onTouchStart={() => setDraggingPoint('B')}
                    className="cursor-grab active:cursor-grabbing shadow-xl" 
                    fill="white" stroke="#3d5a80" strokeWidth="4" 
                />
                <circle 
                    cx={C.x} cy={C.y} r="12" 
                    onMouseDown={() => setDraggingPoint('C')} 
                    onTouchStart={() => setDraggingPoint('C')}
                    className="cursor-grab active:cursor-grabbing shadow-xl" 
                    fill="white" stroke="#3d5a80" strokeWidth="4" 
                />
                <circle cx={A.x} cy={A.y} r="6" fill="#293241" />
                <text x="275" y="40" textAnchor="middle" className="text-2xl font-black fill-[#293241] select-none">
                    {step === 3 && `平行四邊形面積 = ${base} × ${height} = ${(base*height).toFixed(2)}`}
                    {step >= 4 && `三角形面積 = ${(base*height).toFixed(2)} / 2 = ${area}`}
                </text>
            </svg>
             <div className="flex items-center space-x-6 mt-8 select-none">
                <button onClick={() => setStep(prev => Math.max(0, prev - 1))} className="p-4 rounded-2xl bg-white border border-[#3d5a80]/12 shadow-md hover:bg-[#e0fbfc] transition-all"><ChevronLeftIcon className="w-8 h-8 text-[#3d5a80]" /></button>
                <div className="font-black px-10 py-4 bg-[#3d5a80] text-[#e0fbfc] rounded-3xl text-xl min-w-[280px] text-center shadow-2xl border border-[#98c1d9]/30 select-none">
                    {steps[step]}
                </div>
                <button onClick={() => setStep(prev => Math.min(4, prev + 1))} className="p-4 rounded-2xl bg-white border border-[#3d5a80]/12 shadow-md hover:bg-[#e0fbfc] transition-all"><ChevronRightIcon className="w-8 h-8 text-[#3d5a80]" /></button>
                <button onClick={() => setStep(0)} className="p-4 rounded-2xl bg-[#ee6c4d] shadow-xl hover:scale-105 transition-all"><RotateCcwIcon className="w-8 h-8 text-white" /></button>
            </div>
        </div>
    );
};

export default AreaCalculation;
