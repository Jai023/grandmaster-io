import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Arrow as ChessboardArrow } from 'react-chessboard/dist/chessboard/types';
import { Chess } from 'chess.js';
import toast from 'react-hot-toast';
import type { Arrow } from '@grandmaster-io/shared';

interface StudyRoomProps {
  roomId: string;
  username: string;
}

type WsMessage =
  | { type: 'state'; fen: string; pgn: string; arrows: Arrow[]; participants: string[] }
  | { type: 'move'; fen: string; pgn: string; move: string }
  | { type: 'arrow'; arrows: Arrow[] }
  | { type: 'join'; username: string; participants: string[] }
  | { type: 'leave'; username: string; participants: string[] }
  | { type: 'error'; message: string }
  | { type: 'pong' };

export default function StudyRoom({ roomId, username }: StudyRoomProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const chessRef = useRef(new Chess());

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', roomId, username }));
    };

    ws.onmessage = (e) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(e.data as string) as WsMessage;
      } catch {
        return;
      }

      if (msg.type === 'state') {
        setFen(msg.fen);
        setArrows(msg.arrows);
        setParticipants(msg.participants);
        try {
          chessRef.current.loadPgn(msg.pgn);
        } catch {
          chessRef.current = new Chess(msg.fen);
        }
      } else if (msg.type === 'move') {
        setFen(msg.fen);
        try {
          chessRef.current.loadPgn(msg.pgn);
        } catch {
          chessRef.current = new Chess(msg.fen);
        }
        toast(`${msg.move}`, { icon: '♟', duration: 1500 });
      } else if (msg.type === 'arrow') {
        setArrows(msg.arrows);
      } else if (msg.type === 'join') {
        setParticipants(msg.participants);
        toast(`${msg.username} joined`, { icon: '👋', duration: 2000 });
      } else if (msg.type === 'leave') {
        setParticipants(msg.participants);
        toast(`${msg.username} left`, { duration: 2000 });
      } else if (msg.type === 'error') {
        toast.error(msg.message);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      toast.error('Connection error');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId, username]);

  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    const chess = chessRef.current;
    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (!move) return false;

    const newFen = chess.fen();
    const newPgn = chess.pgn();
    setFen(newFen);

    sendMessage({ type: 'move', fen: newFen, pgn: newPgn, move: move.san });
    return true;
  }, [sendMessage]);

  const handleArrowsChange = useCallback((newArrows: ChessboardArrow[]) => {
    const arrowData: Arrow[] = newArrows.map(([from, to, color]) => ({
      from: from as string,
      to: to as string,
      color: color || '#ff0000',
    }));
    setArrows(arrowData);
    sendMessage({ type: 'arrow', arrows: arrowData });
  }, [sendMessage]);

  const boardArrows: ChessboardArrow[] = arrows.map(a => [a.from, a.to, a.color] as ChessboardArrow);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-slate-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {participants.map(p => (
          <span
            key={p}
            className={`text-xs px-2 py-0.5 rounded-full ${
              p === username ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {p}
          </span>
        ))}
      </div>

      <Chessboard
        position={fen}
        onPieceDrop={handlePieceDrop}
        onArrowsChange={handleArrowsChange as (arrows: ChessboardArrow[]) => void}
        customArrows={boardArrows}
        boardWidth={480}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
        areArrowsAllowed={true}
        animationDuration={150}
      />
    </div>
  );
}
