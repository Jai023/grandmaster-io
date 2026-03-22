import React, { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface MistakeReviewProps {
  fen: string;           // position BEFORE the blunder
  blunderMove: string;   // the bad move played
  bestMove: string;      // engine best move (UCI format e.g. "e2e4")
  onCorrect: () => void;
  onSkip: () => void;
}

export default function MistakeReview({ fen, blunderMove, bestMove, onCorrect, onSkip }: MistakeReviewProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);
    
    if (sourceSquare === from && targetSquare === to) {
      setMessage('✓ Correct! That\'s the Grandmaster move!');
      setTimeout(onCorrect, 1200);
      return true;
    }
    
    setAttempts(a => a + 1);
    setMessage('Not quite — keep looking!');

    // Verify if the move is at least legal
    try {
      const chess = new Chess(fen);
      chess.move({ from: sourceSquare, to: targetSquare });
    } catch {
      // illegal move - ignore
    }
    
    return false;
  }, [bestMove, fen, onCorrect]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-lg w-full space-y-4">
        <div className="text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-red-400">Blunder Detected!</h2>
          <p className="text-slate-400 mt-1">
            You played <span className="text-red-400 font-mono font-bold">{blunderMove}</span>
          </p>
          <p className="text-slate-300 mt-2 text-sm">
            The engine found a much better move. Can you find it?
          </p>
          <p className="text-blue-400 font-semibold mt-1">
            Find the Grandmaster move to continue
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-64 h-64">
            <Chessboard
              position={fen}
              onPieceDrop={handlePieceDrop}
              boardWidth={256}
              areArrowsAllowed={false}
            />
          </div>
        </div>

        {message && (
          <div className={`text-center text-sm font-medium ${message.includes('✓') ? 'text-green-400' : 'text-yellow-400'}`}>
            {message}
          </div>
        )}

        {attempts >= 3 && (
          <p className="text-center text-xs text-slate-500">
            Hint: The best move starts from{' '}
            <span className="text-blue-400 font-mono">{bestMove.slice(0, 2)}</span>
          </p>
        )}

        <div className="flex justify-center">
          <button onClick={onSkip} className="btn-secondary text-sm">
            Skip (show best move)
          </button>
        </div>
      </div>
    </div>
  );
}
