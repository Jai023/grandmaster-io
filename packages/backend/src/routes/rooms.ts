import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface RoomData {
  roomId: string;
  createdBy: string;
  fen: string;
  pgn: string;
  participants: string[];
  arrows: Array<{ from: string; to: string; color: string }>;
  createdAt: Date;
}

// In-memory rooms (in production, use Redis or MongoDB)
const rooms = new Map<string, RoomData>();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { createdBy } = req.body;

  if (!createdBy) {
    res.status(400).json({ error: 'createdBy is required' });
    return;
  }

  const roomId = uuidv4();
  const room: RoomData = {
    roomId,
    createdBy,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    participants: [createdBy],
    arrows: [],
    createdAt: new Date(),
  };

  rooms.set(roomId, room);
  res.status(201).json(room);
});

router.get('/:roomId', async (req: Request, res: Response): Promise<void> => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(room);
});

export { rooms };
export default router;
