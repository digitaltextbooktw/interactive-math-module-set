
import React from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Module {
  id: string;
  title: string;
  keywords: string[];
  component: React.FC<{ setInfo: (info: ModuleInfo) => void }>;
  initialInfo: ModuleInfo;
}

export interface ModuleInfo {
  title: string;
  data: { label: string; value: string }[];
  concept: string;
  aiTip: string;
}
