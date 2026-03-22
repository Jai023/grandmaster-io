import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Game from '../models/Game';
import mongoose from 'mongoose';

const router = Router();

const gamesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

router.post('/', gamesLimiter, authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { pgn, white, black, result, date, opening, moves } = req.body;

  if (!pgn || !white || !black || !result || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const game = new Game({
      userId: new mongoose.Types.ObjectId(req.userId),
      pgn,
      white,
      black,
      result,
      date,
      opening,
      moves: moves || [],
    });
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save game' });
  }
});

router.get('/', gamesLimiter, authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const games = await Game.find({ userId: new mongoose.Types.ObjectId(req.userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/blunders/frequent', gamesLimiter, authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const games = await Game.find({ userId: new mongoose.Types.ObjectId(req.userId) });

    const blunderCounts: Record<string, number> = {};
    for (const game of games) {
      for (const moveAnalysis of game.moves) {
        if (moveAnalysis.classification === 'blunder') {
          const key = moveAnalysis.move;
          blunderCounts[key] = (blunderCounts[key] || 0) + 1;
        }
      }
    }

    const sorted = Object.entries(blunderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([move, count]) => ({ move, count }));

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blunders' });
  }
});

router.get('/:id', gamesLimiter, async (req, res): Promise<void> => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

export default router;
