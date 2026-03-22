import React from 'react';

interface EvaluationBarProps {
  evaluation: number; // centipawns, positive = white advantage
  isAnalyzing?: boolean;
}

function formatEval(cp: number): string {
  if (Math.abs(cp) > 9000) {
    const side = cp > 0 ? 'M' : '-M';
    return `${side}${Math.ceil((10000 - Math.abs(cp)) / 100)}`;
  }
  const pawns = cp / 100;
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

function evalToPercent(cp: number): number {
  // Sigmoid-like mapping: 0 cp = 50%, +500 = ~80%, -500 = ~20%
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + (50 * clamped) / (Math.abs(clamped) + 300);
}

export default function EvaluationBar({ evaluation, isAnalyzing }: EvaluationBarProps) {
  const whitePercent = evalToPercent(evaluation);
  const blackPercent = 100 - whitePercent;
  const evalText = formatEval(evaluation);
  const isWhiteAdvantage = evaluation >= 0;

  return (
    <div className="flex flex-col items-center gap-1 h-full">
      <div className="text-xs text-slate-400 font-mono">
        {isAnalyzing ? '...' : (isWhiteAdvantage ? evalText : '')}
      </div>
      <div className="relative flex flex-col w-6 flex-1 rounded overflow-hidden border border-slate-600">
        {/* Black section */}
        <div
          className="bg-slate-900 transition-all duration-500"
          style={{ height: `${blackPercent}%` }}
        />
        {/* White section */}
        <div
          className="bg-slate-100 transition-all duration-500"
          style={{ height: `${whitePercent}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 font-mono">
        {isAnalyzing ? '' : (!isWhiteAdvantage ? evalText : '')}
      </div>
    </div>
  );
}
