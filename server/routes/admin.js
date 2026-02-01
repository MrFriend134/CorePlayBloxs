import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getUser, setUser, saveUsers, getUsers } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coreplayblox-secret-change-in-production';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'coreplayblox-admin-secret';

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

export { adminRouter: router };

router.post('/unlock', (req, res) => {
  const { secret } = req.body || {};
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Invalid admin secret' });
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const token = jwt.sign({ id: userId, admin: true }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ adminToken: token });
});

router.post('/set-robux', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.admin) return res.status(403).json({ error: 'Admin only' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const { userId, robux } = req.body || {};
  const amount = typeof robux === 'number' ? robux : parseInt(robux, 10);
  if (!userId || isNaN(amount) || amount < 0) return res.status(400).json({ error: 'userId and valid robux required' });
  const user = getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.robux = amount;
  setUser(userId, user);
  await saveUsers();
  res.json({ userId, robux: user.robux });
});

router.get('/users', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.admin) return res.status(403).json({ error: 'Admin only' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const list = Object.values(getUsers()).map(u => ({ id: u.id, username: u.username, robux: u.robux }));
  res.json({ users: list });
});
