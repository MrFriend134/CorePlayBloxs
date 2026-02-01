import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api';

const SOCKET_URL = typeof window !== 'undefined' && window.location.port === '5173' ? '' : (typeof window !== 'undefined' ? window.location.origin : '');

export function useSocket(gameId) {
  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !gameId) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-game', gameId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('game-state', ({ you, players: p }) => {
      setMe(you);
      setPlayers(p || []);
    });
    socket.on('player-joined', ({ player }) => {
      setPlayers(prev => [...prev.filter(x => x.socketId !== player.socketId), player]);
    });
    socket.on('player-left', ({ socketId }) => {
      setPlayers(prev => prev.filter(p => p.socketId !== socketId));
    });
    socket.on('player-move', ({ socketId, position, rotation }) => {
      setPlayers(prev => prev.map(p => p.socketId === socketId ? { ...p, position, rotation } : p));
    });
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId]);

  const move = useCallback((position, rotation) => {
    if (socketRef.current?.connected) socketRef.current.emit('move', { position, rotation });
  }, []);

  const sendChat = useCallback((text) => {
    if (socketRef.current?.connected) socketRef.current.emit('chat', text);
  }, []);

  return { connected, me, players, messages, move, sendChat };
}
