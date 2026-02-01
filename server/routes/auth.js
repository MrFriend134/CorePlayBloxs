import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser, setUser, saveUsers, getUser } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coreplayblox-secret-change-in-production';
const router = Router();

export { authRouter: router };

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const u = getUserByUsername(username);
    if (u) return res.status(409).json({ error: 'Username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const user = createUser(username.trim(), hash);
    await saveUsers();
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, robux: user.robux, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = getUserByUsername(username);
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, robux: user.robux, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = getUser(id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: { id: user.id, username: user.username, robux: user.robux, avatar: user.avatar } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
