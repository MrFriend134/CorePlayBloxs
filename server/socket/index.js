import jwt from 'jsonwebtoken';
import { getUser } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coreplayblox-secret-change-in-production';

const rooms = new Map(); // gameId -> Set(socketId)
const players = new Map(); // socketId -> { id, username, avatar, gameId, position, rotation }

function getPlayer(socketId) {
  return players.get(socketId) || null;
}

function getRoom(gameId) {
  if (!rooms.has(gameId)) rooms.set(gameId, new Set());
  return rooms.get(gameId);
}

export function initSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Auth required'));
    try {
      const { id } = jwt.verify(token, JWT_SECRET);
      const user = getUser(id);
      if (!user) return next(new Error('User not found'));
      socket.userId = id;
      socket.username = user.username;
      socket.avatar = user.avatar || {};
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-game', (gameId) => {
      const prev = getPlayer(socket.id);
      if (prev && prev.gameId) {
        const room = getRoom(prev.gameId);
        room.delete(socket.id);
        socket.leave(prev.gameId);
        socket.to(prev.gameId).emit('player-left', { socketId: socket.id, player: prev });
      }
      const game = gameId || 'lobby';
      const room = getRoom(game);
      room.add(socket.id);
      socket.join(game);
      const player = {
        socketId: socket.id,
        id: socket.userId,
        username: socket.username,
        avatar: socket.avatar,
        gameId: game,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      };
      players.set(socket.id, player);
      const othersInRoom = [...room].filter(sid => sid !== socket.id).map(sid => getPlayer(sid)).filter(Boolean);
      socket.emit('game-state', { you: player, players: othersInRoom });
      socket.to(game).emit('player-joined', { player });
    });

    socket.on('move', (data) => {
      const p = getPlayer(socket.id);
      if (!p) return;
      if (data.position) p.position = data.position;
      if (data.rotation) p.rotation = data.rotation;
      socket.to(p.gameId).emit('player-move', { socketId: socket.id, position: p.position, rotation: p.rotation });
    });

    socket.on('chat', (message) => {
      const p = getPlayer(socket.id);
      const gameId = (p && p.gameId) || 'lobby';
      const text = (message && typeof message === 'string' ? message : (message && message.text)) || '';
      if (!text.trim()) return;
      io.to(gameId).emit('chat-message', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        text: text.trim().slice(0, 500),
        ts: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      const p = getPlayer(socket.id);
      if (p && p.gameId) {
        const room = getRoom(p.gameId);
        room.delete(socket.id);
        socket.to(p.gameId).emit('player-left', { socketId: socket.id, player: p });
      }
      players.delete(socket.id);
    });
  });
}
