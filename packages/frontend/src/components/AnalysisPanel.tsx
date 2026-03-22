import React, { useState } from 'react';
import type { GameMove } from '../hooks/useChessGame';
import type { AnalysisResult } from '@grandmaster-io/shared';

interface AnalysisPanelProps {
  moves: GameMove[];
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  deepAnalysis: boolean;
  onToggleDeepAnalysis: () => void;
  onImportPgn: (pgn: string) => void;
  onSaveGame: () => void;
}

const classificationColors: Record<string, string> = {
  best: 'text-emerald-400',
  excellent: 'text-green-400',
  good: 'text-slate-300',
  inaccuracy: 'text-yellow-400',
  mistake: 'text-orange-400',
  blunder: 'text-red-400',
};

const classificationIcons: Record<string, string> = {
  best: '★',
  excellent: '✓',
  good: '·',
  inaccuracy: '?',
  mistake: '?!',
  blunder: '??',
};

export default function AnalysisPanel({
  moves,
  analysisResult,
  isAnalyzing,
  deepAnalysis,
  onToggleDeepAnalysis,
  onImportPgn,
  onSaveGame,
}: AnalysisPanelProps) {
  const [pgnInput, setPgnInput] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleImport = () => {
    if (pgnInput.trim()) {
      onImportPgn(pgnInput.trim());
      setPgnInput('');
      setShowImport(false);
    }
  };

  const movePairs: Array<[GameMove?, GameMove?]> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Engine Info */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">Engine Analysis</h3>
          <div className="flex items-center gap-1">
            {isAnalyzing && (
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
            <span className="text-xs text-slate-500">
              {isAnalyzing ? 'analyzing...' : analysisResult ? `depth ${analysisResult.depth}` : 'idle'}
            </span>
          </div>
        </div>
        
        {analysisResult && !isAnalyzing && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Best move</span>
              <span className="text-blue-400 font-mono">{analysisResult.bestMove}</span>
            </div>
            {analysisResult.pv.length > 0 && (
              <div className="text-xs text-slate-500 font-mono truncate">
                PV: {analysisResult.pv.slice(0, 5).join(' ')}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500">Deep Analysis</span>
          <button
            onClick={onToggleDeepAnalysis}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              deepAnalysis ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                deepAnalysis ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Move List */}
      <div className="card p-3 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Move List</h3>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {movePairs.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No moves yet</p>
          ) : (
            movePairs.map(([white, black], idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                <span className="text-slate-600 w-6 text-right">{idx + 1}.</span>
                {white && (
                  <span className={`w-20 font-mono ${classificationColors[white.classification]}`}>
                    {white.san}
                    <span className="ml-1 opacity-60">{classificationIcons[white.classification]}</span>
                  </span>
                )}
                {black && (
                  <span className={`w-20 font-mono ${classificationColors[black.classification]}`}>
                    {black.san}
                    <span className="ml-1 opacity-60">{classificationIcons[black.classification]}</span>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card p-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="btn-secondary text-xs flex-1"
          >
            Import PGN
          </button>
          <button
            onClick={onSaveGame}
            className="btn-primary text-xs flex-1"
          >
            Save Game
          </button>
        </div>

        {showImport && (
          <div className="space-y-2">
            <textarea
              value={pgnInput}
              onChange={e => setPgnInput(e.target.value)}
              placeholder="Paste PGN here..."
              className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={handleImport} className="btn-primary text-xs flex-1">Load</button>
              <button onClick={() => setShowImport(false)} className="btn-secondary text-xs flex-1">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
