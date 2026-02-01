import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getUser, setUser, saveUsers, getRedemptionCodes, getRedeemedForUser, markCodeRedeemed, saveRedeemed } from '../store.js';

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

export { economyRouter: router };

router.get('/balance', (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = getUser(userId);
  res.json({ robux: user.robux ?? 0 });
});

router.get('/codes', (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const codes = getRedemptionCodes();
  const used = getRedeemedForUser(userId);
  res.json({ codes: Object.keys(codes), used });
});

router.post('/redeem', async (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code required' });
  const codes = getRedemptionCodes();
  const key = Object.keys(codes).find(k => k.toLowerCase() === code.trim().toLowerCase());
  if (!key) return res.status(400).json({ error: 'Invalid code' });
  const used = getRedeemedForUser(userId);
  if (used.includes(key)) return res.status(400).json({ error: 'Code already redeemed' });
  const amount = codes[key];
  const user = getUser(userId);
  user.robux = (user.robux || 0) + amount;
  setUser(userId, user);
  markCodeRedeemed(userId, key);
  await saveUsers();
  await saveRedeemed();
  res.json({ robux: user.robux, added: amount });
});

router.post('/purchase', async (req, res) => {
  const userId = auth(req);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { itemId, cost } = req.body || {};
  if (itemId == null || typeof cost !== 'number' || cost < 0) return res.status(400).json({ error: 'Invalid item or cost' });
  const user = getUser(userId);
  const balance = user.robux || 0;
  if (balance < cost) return res.status(400).json({ error: 'Insufficient robux' });
  user.robux = balance - cost;
  const avatar = user.avatar || {};
  const accessories = avatar.accessories || [];
  if (!accessories.includes(itemId)) accessories.push(itemId);
  user.avatar = { ...avatar, accessories };
  setUser(userId, user);
  await saveUsers();
  res.json({ robux: user.robux, avatar: user.avatar });
});
