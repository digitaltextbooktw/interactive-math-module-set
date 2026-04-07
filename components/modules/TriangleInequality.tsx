
import React, { useState, useEffect } from 'react';
import type { ModuleInfo } from '../../types';

const TriangleInequality: React.FC<{ setInfo: (info: ModuleInfo) => void }> = ({ setInfo }) => {
    const [sideA, setSideA] = useState(15);
    const [sideB, setSideB] = useState(12);
    const [sideC, setSideC] = useState(20);
    const [checked, setChecked] = useState(false);

    const canFormTriangle = sideA + sideB > sideC && sideA + sideC > sideB && sideB + sideC > sideA;

    useEffect(() => {
        setInfo({
            title: "邊長關係",
            data: [
                { label: "邊 a", value: sideA.toString() },
                { label: "邊 b", value: sideB.toString() },
                { label: "邊 c", value: sideC.toString() },
            ],
            concept: "三角形任意兩邊之和必須大於第三邊，三條線段才能圍成三角形。",
            aiTip: "拖動滑桿改變邊長，按按鈕看能不能組成三角形！"
        });
    }, [sideA, sideB, sideC, setInfo]);

    const TriangleVisualization = () => {
        const svgWidth = 500;
        const svgHeight = 260;

        const sorted = [
            { val: sideA, color: '#3d5a80', label: 'a' },
            { val: sideB, color: '#3d5a80', label: 'b' },
            { val: sideC, color: '#3d5a80', label: 'c' }
        ].sort((a, b) => a.val - b.val);

        if (!checked) {
            const scale = 300 / Math.max(sideA, sideB, sideC, 1);
            return (
                <svg width="100%" height="100%" viewBox="0 0 500 260" className="select-none overflow-visible">
                    <line x1="100" y1="60" x2={100 + sideA * scale} y2="60" stroke="#3d5a80" strokeWidth="6" strokeLinecap="round" />
                    <line x1="100" y1="130" x2={100 + sideB * scale} y2="130" stroke="#3d5a80" strokeWidth="6" strokeLinecap="round" />
                    <line x1="100" y1="200" x2={100 + sideC * scale} y2="200" stroke="#3d5a80" strokeWidth="6" strokeLinecap="round" />
                    <text x="60" y="65" fill="#3d5a80" className="font-black text-xl">a</text>
                    <text x="60" y="135" fill="#3d5a80" className="font-black text-xl">b</text>
                    <text x="60" y="205" fill="#3d5a80" className="font-black text-xl">c</text>
                </svg>
            );
        }

        if (canFormTriangle) {
            const scale = 180 / Math.max(sideA, sideB, sideC);
            const angleA_real = Math.acos((sideB**2 + sideC**2 - sideA**2) / (2 * sideB * sideC));
            const pA = { x: (svgWidth - sideC * scale) / 2, y: 200 };
            const pB = { x: pA.x + sideC * scale, y: pA.y };
            const pC = { x: pA.x + sideB * scale * Math.cos(angleA_real), y: pA.y - sideB * scale * Math.sin(angleA_real) };
            return (
                <svg width="100%" height="100%" viewBox="0 0 500 260" className="select-none overflow-visible">
                    <polygon points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`} fill="#98c1d9" fillOpacity="0.2" stroke="#3d5a80" strokeWidth="3" strokeLinejoin="round" />
                    <g transform="translate(250, 40)">
                         <circle r="12" fill="#3d5a80" />
                         <path d="M-6 0 L-2 4 L6 -4" fill="none" stroke="white" strokeWidth="3" />
                         <text x="20" y="7" fill="#3d5a80" className="font-black text-xl">滿足構成條件</text>
                    </g>
                </svg>
            );
        } else {
            const maxVal = sorted[2].val;
            const scale = 360 / maxVal;
            const startX = (svgWidth - maxVal * scale) / 2;
            const yTop = 100;
            const yBottom = 170;
            const sumShort = sorted[0].val + sorted[1].val;
            const x1_end = startX + sorted[0].val * scale;
            const x2_end = startX + sumShort * scale;
            const xMax_end = startX + maxVal * scale;

            return (
                <svg width="100%" height="100%" viewBox="0 0 500 260" className="select-none overflow-visible">
                    <line x1={startX} y1={yTop} x2={x1_end} y2={yTop} stroke="#3d5a80" strokeWidth="6" strokeLinecap="round" />
                    <line x1={x1_end} y1={yTop} x2={x2_end} y2={yTop} stroke="#98c1d9" strokeWidth="6" strokeLinecap="round" />
                    <line x1={x2_end} y1={yTop} x2={xMax_end} y2={yTop} stroke="#ee6c4d" strokeWidth="3" strokeDasharray="6,4" />
                    <line x1={startX} y1={yBottom} x2={xMax_end} y2={yBottom} stroke="#293241" strokeWidth="6" strokeLinecap="round" />
                    <g transform="translate(250, 40)">
                         <circle r="12" fill="#f87171" />
                         <line x1="-5" y1="-5" x2="5" y2="5" stroke="white" strokeWidth="3" />
                         <line x1="5" y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="3" />
                         <text x="20" y="7" fill="#f87171" className="font-black text-xl">無法構成三角形</text>
                    </g>
                    <text x={svgWidth / 2} y={240} fontSize="18" fill="#3d5a80" textAnchor="middle" className="font-en font-bold">
                        兩短邊之和 ({sorted[0].val} + {sorted[1].val} = {sumShort}) ≤ 最長邊 ({maxVal})
                    </text>
                </svg>
            );
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#EEEEEE] select-none">
            <div className="flex flex-col items-center justify-start p-4 sm:p-6 space-y-4">
                <div className="w-full max-w-md space-y-4 shrink-0">
                    {[
                        { val: sideA, set: setSideA, label: 'a' },
                        { val: sideB, set: setSideB, label: 'b' },
                        { val: sideC, set: setSideC, label: 'c' }
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-white/40">
                            <span className="w-6 font-black text-lg text-[#3d5a80]">{s.label}</span>
                            <input type="range" min="1" max="50" value={s.val} onChange={(e) => {
                                if (s.label === 'a') setSideA(+e.target.value);
                                if (s.label === 'b') setSideB(+e.target.value);
                                if (s.label === 'c') setSideC(+e.target.value);
                                setChecked(false);
                            }} className="flex-1 h-2 bg-[#3d5a80]/10 rounded-xl appearance-none cursor-pointer accent-[#ee6c4d]" />
                            <span className="w-12 text-right font-mono font-black text-base text-[#293241]">{s.val}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => setChecked(!checked)} className="shrink-0 px-8 py-3 bg-[#ee6c4d] text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-all">
                    {checked ? "重新配置" : "驗證邊長關係"}
                </button>

                <div className="w-full min-h-[260px] flex items-center justify-center border-t border-[#3d5a80]/5 mt-4">
                    <TriangleVisualization />
                </div>
            </div>
        </div>
    );
};

export default TriangleInequality;
