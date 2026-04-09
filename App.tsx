import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLayoutMode } from './utils/useLayoutMode';
import type { Module, ModuleInfo } from './types';
import {
    AngleBasics,
    AngleRelationships,
    TriangleAngles,
    BasicConstructions,
    Congruence,
    AreaCalculation,
    TriangleInequality,
    ExteriorAngle,
} from './components/modules/AllModules';
import { BookIcon, LightbulbIcon, ChevronLeftIcon } from './components/icons';
import PracticeShell from './components/practice/PracticeShell';
import Level1Explore from './levels/Level1/stages/ExploreStage';
import Level1Quiz from './levels/Level1/stages/QuizStage';
import Level2Explore from './levels/Level2/stages/ExploreStage';
import Level2Quiz from './levels/Level2/stages/QuizStage';
import Level3Explore from './levels/Level3/stages/Level3Explore';
import Level3Quiz from './levels/Level3/stages/QuizStage';

// Map module id → practice components (only for modules that have practice content)
const practiceMap: Record<string, {
    Explore: React.FC<{ onComplete: () => void }>;
    Quiz: React.FC<{ onComplete: (score: number, wrong: number) => void }>;
}> = {
    'triangle-angles': {
        Explore: ({ onComplete }) => <Level1Explore guessAnswer={null} onComplete={onComplete} />,
        Quiz: Level1Quiz,
    },
    'exterior-angle': {
        Explore: Level2Explore,
        Quiz: Level2Quiz,
    },
    'congruence': {
        Explore: Level3Explore,
        Quiz: Level3Quiz,
    },
};

const modules: Module[] = [
    { id: 'angle-basics', title: '角的基本認識', keywords: ['角', '銳角', '鈍角', '直角', '角度'], component: AngleBasics, initialInfo: { title: "角的基本認識", data: [], concept: "", aiTip: "" } },
    { id: 'angle-relationships', title: '角的關係', keywords: ['補角', '互補', '180', '角的關係'], component: AngleRelationships, initialInfo: { title: "角的關係", data: [], concept: "", aiTip: "" } },
    { id: 'triangle-angles', title: '三角形的角', keywords: ['三角形', '內角和', '180'], component: TriangleAngles, initialInfo: { title: "三角形的角", data: [], concept: "", aiTip: "" } },
    { id: 'basic-constructions', title: '基本作圖', keywords: ['作圖', '垂足', '中垂線', '角平分線', '垂直', '平分'], component: BasicConstructions, initialInfo: { title: "基本作圖", data: [], concept: "", aiTip: "" } },
    { id: 'congruence', title: '全等判定', keywords: ['全等', 'SSS', 'SAS', 'ASA', 'AAS', '三角形'], component: Congruence, initialInfo: { title: "全等判定", data: [], concept: "", aiTip: "" } },
    { id: 'area-calculation', title: '面積計算', keywords: ['面積', '公式', '底高', '計算'], component: AreaCalculation, initialInfo: { title: "面積計算", data: [], concept: "", aiTip: "" } },
    { id: 'triangle-inequality', title: '邊長關係', keywords: ['邊長', '三角形不等式', '邊長關係'], component: TriangleInequality, initialInfo: { title: "邊長關係", data: [], concept: "", aiTip: "" } },
    { id: 'exterior-angle', title: '外角關係', keywords: ['外角', '三角形外角'], component: ExteriorAngle, initialInfo: { title: "外角關係", data: [], concept: "", aiTip: "" } },
];

const sections = [
    { id: '3-1', title: '內角與外角', moduleIds: ['angle-basics', 'angle-relationships', 'triangle-angles', 'exterior-angle'] },
    { id: '3-2', title: '基本的尺規作圖', moduleIds: ['basic-constructions'] },
    { id: '3-3', title: '三角形的全等性質', moduleIds: ['congruence'] },
    { id: '3-4', title: '中垂線與角平分線性質', moduleIds: ['area-calculation'] },
    { id: '3-5', title: '三角形的邊角關係', moduleIds: ['triangle-inequality'] },
];

const sectionColors: Record<string, string> = {
    '3-1': '#f7b8a8',  // 最淺
    '3-2': '#f5a08d',  // 淺
    '3-3': '#f28872',  // 中
    '3-4': '#ef7057',  // 深
    '3-5': '#ec5c40',  // 最深
};


const App: React.FC = () => {
    const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
    const [currentInfo, setCurrentInfo] = useState<ModuleInfo>(modules[0].initialInfo);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [practiceMode, setPracticeMode] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const isLandscape = useLayoutMode();

    const handleSelectModule = (index: number) => {
        setSelectedModuleIndex(index);
        setCurrentInfo(modules[index].initialInfo);
        setSearchQuery('');
        setIsSearchFocused(false);
        setPracticeMode(false);
    };

    const handleBackToHome = () => {
        setSelectedModuleIndex(null);
        setPracticeMode(false);
    };

    const selectedModuleId = selectedModuleIndex !== null ? modules[selectedModuleIndex].id : null;
    const hasPractice = selectedModuleId !== null && selectedModuleId in practiceMap;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ===== 兩列佈局：上排 3-1 的 4 個，下排 3-2~3-5 各 1 個 =====
    const topRow = sections[0]; // 3-1
    const bottomRow = sections.slice(1); // 3-2 ~ 3-5

    const isModuleVisible = (id: string) => {
        if (!searchQuery.trim()) return true;
        const m = modules.find(mod => mod.id === id);
        if (!m) return false;
        const q = searchQuery.toLowerCase();
        // 搜尋模組本身的標題和關鍵字
        if (m.title.toLowerCase().includes(q) || m.keywords.some(k => k.toLowerCase().includes(q))) return true;
        // 搜尋章節編號或章節標題（如 "3-1"、"內角"）
        const sec = sections.find(s => s.moduleIds.includes(id));
        if (sec && (sec.id.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q))) return true;
        return false;
    };

    const isSectionVisible = (sectionId: string) => {
        if (!searchQuery.trim()) return true;
        const sec = sections.find(s => s.id === sectionId);
        if (!sec) return false;
        return sec.moduleIds.some(id => isModuleVisible(id));
    };

    const renderCard = (id: string, color: string) => {
        const m = modules.find(mod => mod.id === id)!;
        const index = modules.indexOf(m);
        const visible = isModuleVisible(id);
        return (
            <button key={id} onClick={() => handleSelectModule(index)}
                className={`group bg-[#EEEEEE] hover:bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center gap-1.5 text-center w-full h-full px-2 py-3 ${visible ? '' : 'opacity-20 pointer-events-none'}`}
            >
                <span className="text-lg font-black text-[#293241] leading-tight">
                    {m.title}
                </span>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {m.keywords.slice(0, 2).map(k => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#3d5a80]/15 text-[#3d5a80] font-black border border-[#3d5a80]/20">
                            #{k}
                        </span>
                    ))}
                </div>
            </button>
        );
    };

    // ===== 入口首頁 =====
    if (selectedModuleIndex === null) {
        return (
            <div className="bg-[#293241] min-h-[100dvh] flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 py-8">
                {/* 搜尋列 */}
                <div className="w-full max-w-md mb-10 relative" ref={searchRef}>
                    <div className={`flex items-center bg-[#3d5a80] rounded-full px-6 py-3 shadow-2xl border-2 transition-all duration-300 ${isSearchFocused ? 'border-[#98c1d9]' : 'border-[#98c1d9]/20'}`}>
                        <svg className="w-5 h-5 text-[#98c1d9] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="搜尋數學模組..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            className="bg-transparent text-[#e0fbfc] font-bold text-base focus:outline-none w-full placeholder-[#98c1d9]/50"
                        />
                    </div>
                </div>

                {/* 模組卡片：2 列 × 4 欄，統一大小 */}
                <div className="w-full max-w-4xl flex flex-col gap-8">
                    {/* 上排：3-1 內角與外角 */}
                    <div>
                        <h2 className={`text-sm font-medium mb-2.5 flex items-center gap-2 transition-opacity duration-300 ${isSectionVisible(topRow.id) ? '' : 'opacity-20'}`} style={{ color: sectionColors[topRow.id] }}>
                            <span className="text-xs font-medium">{topRow.id}</span>
                            {topRow.title}
                        </h2>
                        <div className={`grid ${isLandscape ? 'grid-cols-4' : 'grid-cols-2'} gap-4`} style={{ gridAutoRows: '1fr' }}>
                            {topRow.moduleIds.map(id => (
                                <div key={id} className="aspect-[4/3]">
                                    {renderCard(id, sectionColors[topRow.id])}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 下排：3-2 ~ 3-5 各一個 */}
                    <div className={`grid ${isLandscape ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
                        {bottomRow.map(sec => (
                            <div key={sec.id}>
                                <h2 className={`text-sm font-medium mb-2.5 flex items-center gap-2 truncate transition-opacity duration-300 ${isSectionVisible(sec.id) ? '' : 'opacity-20'}`} style={{ color: sectionColors[sec.id] }}>
                                    <span className="text-xs font-medium shrink-0">{sec.id}</span>
                                    <span className="truncate">{sec.title}</span>
                                </h2>
                                <div className="aspect-[4/3]">
                                    {renderCard(sec.moduleIds[0], sectionColors[sec.id])}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ===== 模組內頁 =====
    const CurrentModuleComponent = modules[selectedModuleIndex].component;
    const practice = selectedModuleId ? practiceMap[selectedModuleId] : undefined;

    // --- Top toolbar (full-width, shared by both modes) ---
    const renderTopBar = () => (
        <div className="flex items-center gap-3 shrink-0 mb-4 z-[60]">
            <button
                onClick={handleBackToHome}
                className="bg-[#3d5a80] hover:bg-[#98c1d9] text-[#e0fbfc] hover:text-[#293241] rounded-full p-2.5 transition-colors shadow-lg shrink-0"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-[#e0fbfc] text-lg font-black truncate">
                {modules[selectedModuleIndex].title}
            </h1>
            {hasPractice && (
                <div className="flex bg-[#3d5a80] rounded-full p-1 shadow-lg ml-auto shrink-0">
                    <button
                        onClick={() => setPracticeMode(false)}
                        className={`px-4 pt-[9px] pb-2 rounded-full text-sm font-semibold leading-none transition-all duration-200 ${
                            !practiceMode
                                ? 'bg-[#e0fbfc] text-[#293241] shadow-md'
                                : 'text-[#98c1d9] hover:text-[#e0fbfc]'
                        }`}
                    >
                        自由操作
                    </button>
                    <button
                        onClick={() => setPracticeMode(true)}
                        className={`px-4 pt-[9px] pb-2 rounded-full text-sm font-semibold leading-none transition-all duration-200 ${
                            practiceMode
                                ? 'bg-[#ee6c4d] text-white shadow-md'
                                : 'text-[#98c1d9] hover:text-[#e0fbfc]'
                        }`}
                    >
                        練習模式
                    </button>
                </div>
            )}
        </div>
    );

    // --- Practice mode: full-width ---
    if (practiceMode && practice) {
        return (
            <div className={`bg-[#293241] min-h-[100dvh] ${isLandscape ? 'h-[100dvh] overflow-hidden' : 'overflow-y-auto'} flex flex-col p-4 sm:p-5 text-[#293241]`}>
                {renderTopBar()}
                <main className="flex-1 max-w-7xl mx-auto w-full min-h-0">
                    <section className="bg-[#EEEEEE] rounded-[1.5rem] shadow-xl overflow-hidden relative h-full border border-white/20">
                        <PracticeShell
                            ExploreComponent={practice.Explore}
                            QuizComponent={practice.Quiz}
                            onExit={() => setPracticeMode(false)}
                        />
                    </section>
                </main>
            </div>
        );
    }

    // --- Sandbox mode: two-column layout ---
    return (
        <div className={`bg-[#293241] min-h-[100dvh] ${isLandscape ? 'h-[100dvh] overflow-hidden' : 'overflow-y-auto'} flex flex-col p-4 sm:p-5 text-[#293241]`}>

            {/* 頂部工具列：返回 + 標題 + 模式切換 */}
            {renderTopBar()}

            {/* 主要內容區域 */}
            <main className={`flex-1 flex ${isLandscape ? 'flex-row' : 'flex-col'} gap-4 max-w-7xl mx-auto w-full min-h-0`}>

                {/* 左側：數學模組互動區 */}
                <div className={`flex-[60] flex flex-col ${isLandscape ? '' : 'min-h-[320px]'}`}>
                    <section className={`bg-[#EEEEEE] rounded-[1.5rem] shadow-xl overflow-hidden relative flex-1 border border-white/20 ${isLandscape ? 'max-h-[calc(100vh-120px)]' : ''}`}>
                        <CurrentModuleComponent key={modules[selectedModuleIndex].id} setInfo={setCurrentInfo} />
                    </section>
                </div>

                {/* 右側：側邊資訊欄 */}
                <aside className={`flex-[40] flex flex-col gap-4 ${isLandscape ? 'max-w-[380px]' : ''} min-h-0 relative z-[55]`}>

                    {/* 數據看板 */}
                    <div className="bg-[#EEEEEE] rounded-[1.5rem] p-5 shadow-lg border-l-[8px] border-[#ee6c4d] shrink-0">
                        <div className="space-y-2">
                            {currentInfo.data.map(item => (
                                <div key={item.label} className="flex justify-between items-center border-b border-[#3d5a80]/5 pb-1">
                                    <span className="text-base font-bold text-[#3d5a80]/80">{item.label}</span>
                                    <span className={`font-black text-[#ee6c4d] ${/^[\d.°%+\-×÷=\s\/]+$/.test(item.value) ? 'text-xl font-en' : 'text-base'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 概念與提示區域 */}
                    <div className={`flex-1 flex flex-col gap-4 ${isLandscape ? 'overflow-y-auto pr-1' : 'pr-0'} min-h-0`}>
                        <div className={`bg-[#293241] rounded-[1.5rem] p-5 border border-[#3d5a80] shadow-md ${isLandscape ? 'shrink' : 'shrink-0'}`}>
                            <div className="flex items-center gap-2 text-[#ee6c4d] mb-2">
                                <BookIcon className="w-5 h-5" />
                                <span className="font-black text-xl">幾何概念</span>
                            </div>
                            <p className="text-base text-[#e0fbfc] leading-relaxed font-medium whitespace-pre-line">
                                {currentInfo.concept}
                            </p>
                        </div>

                        <div className={`bg-[#293241] rounded-[1.5rem] p-5 border border-[#3d5a80] shadow-md ${isLandscape ? 'shrink' : 'shrink-0 mb-4'}`}>
                            <div className="flex items-center gap-2 text-[#ee6c4d] mb-2">
                                <LightbulbIcon className="w-5 h-5" />
                                <span className="font-black text-xl">操作提示</span>
                            </div>
                            <p className="text-base text-[#e0fbfc] leading-relaxed font-medium">
                                {currentInfo.aiTip}
                            </p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default App;