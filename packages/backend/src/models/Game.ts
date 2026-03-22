import mongoose, { Document, Schema } from 'mongoose';
import type { MoveAnalysis } from '@grandmaster-io/shared';

export interface IGame extends Document {
  userId: mongoose.Types.ObjectId;
  pgn: string;
  white: string;
  black: string;
  result: string;
  date: string;
  opening?: string;
  moves: MoveAnalysis[];
  createdAt: Date;
}

const MoveAnalysisSchema = new Schema<MoveAnalysis>(
  {
    moveNumber: { type: Number, required: true },
    move: { type: String, required: true },
    evaluation: { type: Number, required: true },
    bestMove: { type: String, required: true },
    classification: {
      type: String,
      enum: ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'],
      required: true,
    },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pgn: { type: String, required: true },
    white: { type: String, required: true },
    black: { type: String, required: true },
    result: { type: String, required: true },
    date: { type: String, required: true },
    opening: { type: String },
    moves: [MoveAnalysisSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IGame>('Game', GameSchema);
