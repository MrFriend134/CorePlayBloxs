import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const REDEEMED_FILE = join(DATA_DIR, 'redeemed.json');

const REDEMPTION_CODES = {
  MRFLOWERS: 3000,
  MrFriend: 10000,
  TheBestDev: 200000,
  pepiato123: 400000000,
  Dell: 10000000000000,
  OSFTHEBEST: 90,
};

let users = {};
let redeemed = {}; // { userId: [code1, code2] }

export async function loadDataStore() {
  await mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  try {
    const u = await readFile(USERS_FILE, 'utf8');
    users = JSON.parse(u);
  } catch {
    users = {};
  }
  try {
    const r = await readFile(REDEEMED_FILE, 'utf8');
    redeemed = JSON.parse(r);
  } catch {
    redeemed = {};
  }
  return { users, redeemed };
}

export async function saveUsers() {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function saveRedeemed() {
  await writeFile(REDEEMED_FILE, JSON.stringify(redeemed, null, 2), 'utf8');
}

export function getUsers() {
  return users;
}

export function getUser(id) {
  return users[id] || null;
}

export function getUserByUsername(username) {
  const lower = (username || '').toLowerCase();
  return Object.values(users).find(u => (u.username || '').toLowerCase() === lower) || null;
}

export function setUser(id, data) {
  if (!users[id]) users[id] = { id, username: '', passwordHash: '', robux: 0, avatar: {}, createdAt: Date.now() };
  Object.assign(users[id], data);
  return users[id];
}

export function createUser(username, passwordHash) {
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const user = setUser(id, { username, passwordHash, robux: 0, avatar: { skinColor: '#e8b88a', accessories: [] }, createdAt: Date.now() });
  return user;
}

export function getRedemptionCodes() {
  return { ...REDEMPTION_CODES };
}

export function getRedeemedForUser(userId) {
  return redeemed[userId] || [];
}

export function markCodeRedeemed(userId, code) {
  if (!redeemed[userId]) redeemed[userId] = [];
  if (!redeemed[userId].includes(code)) redeemed[userId].push(code);
  return redeemed[userId];
}

export { REDEMPTION_CODES };
