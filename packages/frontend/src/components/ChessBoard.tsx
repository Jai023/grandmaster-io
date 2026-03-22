import React, { useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Arrow as ChessboardArrow } from 'react-chessboard/dist/chessboard/types';
import type { Square } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  arrows?: Array<{ from: string; to: string; color: string }>;
  lastMoveClassification?: string | null;
  isLocked?: boolean;
  boardWidth?: number;
}

const classificationFlash: Record<string, string> = {
  blunder: 'ring-4 ring-red-500 ring-opacity-80',
  mistake: 'ring-4 ring-orange-500 ring-opacity-80',
  inaccuracy: 'ring-4 ring-yellow-500 ring-opacity-80',
  best: 'ring-4 ring-emerald-500 ring-opacity-80',
  excellent: 'ring-4 ring-green-500 ring-opacity-60',
};

export default function ChessBoard({
  fen,
  onMove,
  arrows = [],
  lastMoveClassification,
  isLocked = false,
  boardWidth = 480,
}: ChessBoardProps) {
  const boardArrows: ChessboardArrow[] = arrows.map(a => [
    a.from as Square,
    a.to as Square,
    a.color,
  ] as ChessboardArrow);

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (isLocked) return false;
      return onMove(sourceSquare, targetSquare);
    },
    [isLocked, onMove]
  );

  const flashClass = lastMoveClassification
    ? (classificationFlash[lastMoveClassification] ?? '')
    : '';

  return (
    <div className={`rounded-lg overflow-hidden transition-all duration-300 ${flashClass}`}>
      <Chessboard
        position={fen}
        onPieceDrop={handlePieceDrop}
        boardWidth={boardWidth}
        customArrows={boardArrows}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
        areArrowsAllowed={!isLocked}
        arePiecesDraggable={!isLocked}
        animationDuration={150}
      />
    </div>
  );
}
