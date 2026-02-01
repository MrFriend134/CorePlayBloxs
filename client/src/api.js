const API = '/api';
const getToken = () => localStorage.getItem('cpb_token');

export async function api(path, options = {}) {
  const url = `${API}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const auth = {
  login: (username, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) => api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => api('/auth/me'),
};

export const economy = {
  balance: () => api('/economy/balance'),
  codes: () => api('/economy/codes'),
  redeem: (code) => api('/economy/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  purchase: (itemId, cost) => api('/economy/purchase', { method: 'POST', body: JSON.stringify({ itemId, cost }) }),
};

export const users = {
  search: (q) => api(`/users/search?q=${encodeURIComponent(q)}`),
  get: (id) => api(`/users/${id}`),
  updateAvatar: (avatar) => api('/users/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) }),
  friends: () => api('/users/me/friends'),
  addFriend: (friendId) => api('/users/me/friends', { method: 'POST', body: JSON.stringify({ friendId }) }),
  removeFriend: (friendId) => api(`/users/me/friends/${friendId}`, { method: 'DELETE' }),
};

export const games = {
  list: () => api('/games'),
  search: (q) => api(`/games/search?q=${encodeURIComponent(q)}`),
};

export const admin = {
  unlock: (secret) => api('/admin/unlock', { method: 'POST', body: JSON.stringify({ secret }) }),
  setRobux: (userId, robux) => api('/admin/set-robux', { method: 'POST', body: JSON.stringify({ userId, robux }) }),
  users: () => api('/admin/users'),
};

export { getToken };
