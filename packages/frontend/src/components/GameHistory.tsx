import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { GameRecord } from '@grandmaster-io/shared';
import toast from 'react-hot-toast';

interface GameHistoryProps {
  token: string | null;
  onLoadGame: (pgn: string) => void;
}

interface BlunderFrequency {
  move: string;
  count: number;
}

export default function GameHistory({ token, onLoadGame }: GameHistoryProps) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [blunders, setBlunders] = useState<BlunderFrequency[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get<GameRecord[]>('/api/games', { headers }),
      axios.get<BlunderFrequency[]>('/api/games/blunders/frequent', { headers }),
    ])
      .then(([gamesRes, blundersRes]) => {
        setGames(gamesRes.data);
        setBlunders(blundersRes.data);
      })
      .catch(() => toast.error('Failed to load game history'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Sign in to view your game history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blunders.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Most Frequent Blunders</h3>
          <div className="flex flex-wrap gap-2">
            {blunders.map(({ move, count }) => (
              <div key={move} className="flex items-center gap-1 bg-red-900/30 border border-red-800 rounded px-2 py-1">
                <span className="text-red-400 font-mono text-sm">{move}</span>
                <span className="text-red-600 text-xs">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {games.length === 0 ? (
          <div className="card p-6 text-center text-slate-500">
            <p>No saved games yet</p>
          </div>
        ) : (
          games.map(game => (
            <div
              key={game._id}
              className="card p-4 flex items-center justify-between hover:border-slate-600 cursor-pointer transition-colors"
              onClick={() => onLoadGame(game.pgn)}
            >
              <div>
                <div className="text-sm font-medium text-slate-200">
                  {game.white} vs {game.black}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {game.result} · {game.date}
                  {game.opening && <span> · {game.opening}</span>}
                </div>
              </div>
              <div className="text-xs text-slate-600">
                {game.moves.length} moves
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
