import { WebSocketServer, WebSocket } from 'ws';
import { rooms } from '../routes/rooms';

interface RoomClient {
  ws: WebSocket;
  roomId: string;
  username: string;
}

const roomClients = new Map<string, Set<RoomClient>>();

type WsMessage =
  | { type: 'join'; roomId: string; username: string }
  | { type: 'move'; fen: string; pgn: string; move: string }
  | { type: 'arrow'; arrows: Array<{ from: string; to: string; color: string }> }
  | { type: 'ping' };

function broadcast(roomId: string, message: object, excludeWs?: WebSocket) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

export function setupRoomHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    let currentClient: RoomClient | null = null;

    ws.on('message', (raw) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw.toString()) as WsMessage;
      } catch {
        return;
      }

      if (msg.type === 'join') {
        const { roomId, username } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }

        currentClient = { ws, roomId, username };

        if (!roomClients.has(roomId)) {
          roomClients.set(roomId, new Set());
        }
        roomClients.get(roomId)!.add(currentClient);

        if (!room.participants.includes(username)) {
          room.participants.push(username);
        }

        // Send current state to the new joiner
        ws.send(JSON.stringify({
          type: 'state',
          fen: room.fen,
          pgn: room.pgn,
          arrows: room.arrows,
          participants: room.participants,
        }));

        // Notify others
        broadcast(roomId, {
          type: 'join',
          username,
          participants: room.participants,
        }, ws);

      } else if (msg.type === 'move' && currentClient) {
        const { roomId } = currentClient;
        const room = rooms.get(roomId);
        if (!room) return;

        room.fen = msg.fen;
        room.pgn = msg.pgn;

        broadcast(roomId, {
          type: 'move',
          fen: msg.fen,
          pgn: msg.pgn,
          move: msg.move,
        }, ws);

      } else if (msg.type === 'arrow' && currentClient) {
        const { roomId } = currentClient;
        const room = rooms.get(roomId);
        if (!room) return;

        room.arrows = msg.arrows;

        broadcast(roomId, {
          type: 'arrow',
          arrows: msg.arrows,
        }, ws);

      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    });

    ws.on('close', () => {
      if (!currentClient) return;
      const { roomId, username } = currentClient;
      const clients = roomClients.get(roomId);
      if (clients) {
        clients.delete(currentClient);
        if (clients.size === 0) {
          roomClients.delete(roomId);
        }
      }

      const room = rooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter(p => p !== username);
        broadcast(roomId, {
          type: 'leave',
          username,
          participants: room.participants,
        });
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });
}
