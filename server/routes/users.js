import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getUser, getUsers, setUser, saveUsers } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coreplayblox-secret-change-in-production';
const router = Router();

function auth(req) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    return getUser(id) ? id : null;
  } catch {
    return null;
  }
}

export { usersRouter: router };

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ users: [] });
  const list = Object.values(getUsers())
    .filter(u => u.username && u.username.toLowerCase().includes(q))
    .slice(0, 20)
    .map(u => ({ id: u.id, username: u.username, avatar: u.avatar }));
  res.json({ users: list });
});

router.get('/:id', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username, avatar: user.avatar, robux: user.robux });
});

router.put('/avatar', async (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { avatar } = req.body || {};
  const user = getUser(userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  user.avatar = { ...(user.avatar || {}), ...avatar };
  setUser(userId, user);
  await saveUsers();
  res.json({ avatar: user.avatar });
});

router.get('/me/friends', (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = getUser(userId);
  const friends = (user && user.friends) || [];
  const list = friends.map(id => getUser(id)).filter(Boolean).map(u => ({ id: u.id, username: u.username, avatar: u.avatar }));
  res.json({ friends: list });
});

router.post('/me/friends', async (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { friendId } = req.body || {};
  const friend = getUser(friendId);
  if (!friend || friendId === userId) return res.status(400).json({ error: 'Invalid friend' });
  const user = getUser(userId);
  const friends = user.friends || [];
  if (friends.includes(friendId)) return res.json({ friends: [...friends] });
  user.friends = [...friends, friendId];
  setUser(userId, user);
  await saveUsers();
  res.json({ friends: user.friends });
});

router.delete('/me/friends/:friendId', async (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = getUser(userId);
  const friends = (user.friends || []).filter(id => id !== req.params.friendId);
  user.friends = friends;
  setUser(userId, user);
  await saveUsers();
  res.json({ friends });
});
