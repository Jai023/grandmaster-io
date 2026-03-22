import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { MoveAnalysis, AnalysisResult } from '@grandmaster-io/shared';

export type MoveClassification = MoveAnalysis['classification'];

export interface GameMove {
  san: string;
  fen: string;
  evaluation: number;
  bestMove: string;
  classification: MoveClassification;
  moveNumber: number;
}

export interface UseChessGameReturn {
  chess: Chess;
  fen: string;
  pgn: string;
  moves: GameMove[];
  isGameOver: boolean;
  makeMove: (move: string | { from: string; to: string; promotion?: string }) => boolean;
  undoMove: () => void;
  resetGame: () => void;
  importPgn: (pgn: string) => boolean;
  recordMoveAnalysis: (analysis: AnalysisResult, prevEval: number) => void;
  currentEval: number;
  lastMoveClassification: MoveClassification | null;
}

export function classifyMove(prevEval: number, currentEval: number, isWhiteMove: boolean): MoveClassification {
  // Normalize: positive = good for the side that just moved
  const evalForSide = isWhiteMove ? currentEval - prevEval : prevEval - currentEval;
  
  if (evalForSide >= 30) return 'best';
  if (evalForSide >= 0) return 'excellent';
  if (evalForSide >= -50) return 'good';
  if (evalForSide >= -100) return 'inaccuracy';
  if (evalForSide >= -200) return 'mistake';
  return 'blunder';
}

export function useChessGame(): UseChessGameReturn {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [pgn, setPgn] = useState('');
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [currentEval, setCurrentEval] = useState(0);
  const [lastMoveClassification, setLastMoveClassification] = useState<MoveClassification | null>(null);
  const prevEvalRef = useRef(0);
  const moveCountRef = useRef(0);

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }): boolean => {
    const chess = chessRef.current;
    try {
      const result = chess.move(move);
      if (!result) return false;
      
      moveCountRef.current += 1;
      setFen(chess.fen());
      setPgn(chess.pgn());
      
      // Placeholder classification until analysis comes in
      const placeholder: GameMove = {
        san: result.san,
        fen: chess.fen(),
        evaluation: prevEvalRef.current,
        bestMove: '',
        classification: 'good',
        moveNumber: moveCountRef.current,
      };
      setMoves(prev => [...prev, placeholder]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const undoMove = useCallback(() => {
    const chess = chessRef.current;
    chess.undo();
    moveCountRef.current = Math.max(0, moveCountRef.current - 1);
    setFen(chess.fen());
    setPgn(chess.pgn());
    setMoves(prev => prev.slice(0, -1));
  }, []);

  const resetGame = useCallback(() => {
    chessRef.current = new Chess();
    moveCountRef.current = 0;
    prevEvalRef.current = 0;
    setFen(chessRef.current.fen());
    setPgn('');
    setMoves([]);
    setCurrentEval(0);
    setLastMoveClassification(null);
  }, []);

  const importPgn = useCallback((pgnString: string): boolean => {
    try {
      const newChess = new Chess();
      newChess.loadPgn(pgnString);
      chessRef.current = newChess;
      moveCountRef.current = newChess.history().length;
      setFen(newChess.fen());
      setPgn(newChess.pgn());
      
      // Build moves list from history
      const history = newChess.history({ verbose: true });
      const gameMoves: GameMove[] = history.map((move, idx) => ({
        san: move.san,
        fen: move.after,
        evaluation: 0,
        bestMove: '',
        classification: 'good' as MoveClassification,
        moveNumber: idx + 1,
      }));
      setMoves(gameMoves);
      setCurrentEval(0);
      setLastMoveClassification(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const recordMoveAnalysis = useCallback((analysis: AnalysisResult, prevEval: number) => {
    const chess = chessRef.current;
    const history = chess.history();
    if (history.length === 0) return;

    const isWhiteMove = history.length % 2 === 1; // odd moves = white moved
    const classification = classifyMove(prevEval, analysis.evaluation, isWhiteMove);
    
    prevEvalRef.current = analysis.evaluation;
    setCurrentEval(analysis.evaluation);
    setLastMoveClassification(classification);

    setMoves(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.evaluation = analysis.evaluation;
      last.bestMove = analysis.bestMove;
      last.classification = classification;
      updated[updated.length - 1] = last;
      return updated;
    });
  }, []);

  return {
    chess: chessRef.current,
    fen,
    pgn,
    moves,
    isGameOver: chessRef.current.isGameOver(),
    makeMove,
    undoMove,
    resetGame,
    importPgn,
    recordMoveAnalysis,
    currentEval,
    lastMoveClassification,
  };
}
