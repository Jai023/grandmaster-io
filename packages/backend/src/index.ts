import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import roomsRoutes from './routes/rooms';
import { setupRoomHandler } from './websocket/roomHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grandmaster';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/rooms', roomsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
setupRoomHandler(wss);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
