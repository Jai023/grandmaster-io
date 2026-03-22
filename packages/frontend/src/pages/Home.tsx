import React, { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ChessBoard from '../components/ChessBoard';
import EvaluationBar from '../components/EvaluationBar';
import AnalysisPanel from '../components/AnalysisPanel';
import MistakeReview from '../components/MistakeReview';
import { useChessGame } from '../hooks/useChessGame';
import { useStockfish } from '../hooks/useStockfish';
import type { AnalysisResult } from '@grandmaster-io/shared';

export default function Home() {
  const {
    fen,
    pgn,
    moves,
    makeMove,
    undoMove,
    resetGame,
    importPgn,
    recordMoveAnalysis,
    currentEval,
    lastMoveClassification,
  } = useChessGame();

  const { analyze, isAnalyzing } = useStockfish();
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showMistakeReview, setShowMistakeReview] = useState(false);
  const [mistakeData, setMistakeData] = useState<{
    fen: string;
    blunderMove: string;
    bestMove: string;
  } | null>(null);
  const prevEvalRef = useRef(0);
  const prevFenRef = useRef(fen);

  const runAnalysis = useCallback(async (currentFen: string) => {
    const depth = deepAnalysis ? 25 : 15;
    try {
      const result = await analyze(currentFen, depth);
      setAnalysisResult(result);
      recordMoveAnalysis(result, prevEvalRef.current);
      prevEvalRef.current = result.evaluation;
    } catch (err) {
      console.error('Analysis error:', err);
    }
  }, [analyze, deepAnalysis, recordMoveAnalysis]);

  const handleMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    const preFen = fen;
    const success = makeMove({ from, to, promotion: promotion || 'q' });
    if (success) {
      prevFenRef.current = preFen;
    }
    return success;
  }, [fen, makeMove]);

  // Auto-analyze after each move
  useEffect(() => {
    runAnalysis(fen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  // Show mistake review for blunders
  useEffect(() => {
    if (lastMoveClassification === 'blunder' && analysisResult && moves.length > 0) {
      const lastMove = moves[moves.length - 1];
      // prevFenRef.current holds the FEN captured just before the blunder was made
      const fenBeforeBlunder = prevFenRef.current || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      setMistakeData({
        fen: fenBeforeBlunder,
        blunderMove: lastMove.san,
        bestMove: lastMove.bestMove || analysisResult.bestMove,
      });
      setShowMistakeReview(true);
    }
  }, [lastMoveClassification, analysisResult, moves]);

  const handleSaveGame = async () => {
    const token = localStorage.getItem('gm_token');
    if (!token) {
      toast.error('Sign in to save games');
      return;
    }

    const gameData = {
      pgn,
      white: 'Player',
      black: 'Opponent',
      result: '*',
      date: new Date().toISOString().split('T')[0],
      moves: moves.map(m => ({
        moveNumber: m.moveNumber,
        move: m.san,
        evaluation: m.evaluation,
        bestMove: m.bestMove || '',
        classification: m.classification,
      })),
    };

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameData),
      });
      if (res.ok) {
        toast.success('Game saved!');
      } else {
        toast.error('Failed to save game');
      }
    } catch {
      toast.error('Failed to save game');
    }
  };

  const arrows = analysisResult && !isAnalyzing
    ? [{
        from: analysisResult.bestMove.slice(0, 2),
        to: analysisResult.bestMove.slice(2, 4),
        color: '#3b82f6',
      }]
    : [];

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-56px)]">
      {/* Evaluation Bar */}
      <div className="w-8 flex flex-col py-2">
        <EvaluationBar evaluation={currentEval} isAnalyzing={isAnalyzing} />
      </div>

      {/* Chess Board */}
      <div className="flex flex-col gap-3">
        <ChessBoard
          fen={fen}
          onMove={handleMove}
          arrows={arrows}
          lastMoveClassification={lastMoveClassification}
          boardWidth={480}
        />
        <div className="flex gap-2">
          <button onClick={undoMove} className="btn-secondary text-sm flex-1">← Undo</button>
          <button onClick={resetGame} className="btn-secondary text-sm flex-1">↺ Reset</button>
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="flex-1 overflow-hidden">
        <AnalysisPanel
          moves={moves}
          analysisResult={analysisResult}
          isAnalyzing={isAnalyzing}
          deepAnalysis={deepAnalysis}
          onToggleDeepAnalysis={() => setDeepAnalysis(d => !d)}
          onImportPgn={(pgnStr) => {
            const success = importPgn(pgnStr);
            if (success) {
              toast.success('PGN loaded successfully');
              setAnalysisResult(null);
              prevEvalRef.current = 0;
            } else {
              toast.error('Invalid PGN format');
            }
          }}
          onSaveGame={handleSaveGame}
        />
      </div>

      {/* Mistake Review Overlay */}
      {showMistakeReview && mistakeData && (
        <MistakeReview
          fen={mistakeData.fen}
          blunderMove={mistakeData.blunderMove}
          bestMove={mistakeData.bestMove}
          onCorrect={() => {
            setShowMistakeReview(false);
            setMistakeData(null);
            toast.success('Well done! Grandmaster move!', { icon: '⭐' });
          }}
          onSkip={() => {
            setShowMistakeReview(false);
            setMistakeData(null);
          }}
        />
      )}
    </div>
  );
}
