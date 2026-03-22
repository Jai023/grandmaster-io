export interface User {
  _id?: string;
  username: string;
  email: string;
  createdAt?: Date;
}

export interface MoveAnalysis {
  moveNumber: number;
  move: string;
  evaluation: number;
  bestMove: string;
  classification: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export interface GameRecord {
  _id?: string;
  userId?: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  date: string;
  opening?: string;
  moves: MoveAnalysis[];
  createdAt?: Date;
}

export interface Arrow {
  from: string;
  to: string;
  color: string;
}

export interface StudyRoom {
  _id?: string;
  roomId: string;
  createdBy: string;
  fen: string;
  pgn: string;
  participants: string[];
  arrows: Arrow[];
  createdAt?: Date;
}

export interface AnalysisResult {
  fen: string;
  bestMove: string;
  evaluation: number;
  depth: number;
  pv: string[];
}
