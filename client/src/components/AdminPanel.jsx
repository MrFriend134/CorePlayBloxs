import React, { useState, useEffect } from 'react';
import { admin } from '../api';

const ADMIN_SECRET = 'coreplayblox-admin-secret';

export default function AdminPanel({ onClose }) {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [users, setUsers] = useState([]);
  const [setUserId, setSetUserId] = useState('');
  const [setRobux, setSetRobux] = useState('');
  const [message, setMessage] = useState('');

  const unlock = async (e) => {
    e.preventDefault();
    if (secret !== ADMIN_SECRET) {
      setMessage('Código incorrecto');
      return;
    }
    try {
      const { adminToken: t } = await admin.unlock(secret);
      setAdminToken(t);
      setUnlocked(true);
      setMessage('');
    } catch (err) {
      setMessage(err.message || 'Error');
    }
  };

  useEffect(() => {
    if (!unlocked || !adminToken) return;
    const orig = localStorage.getItem('cpb_token');
    localStorage.setItem('cpb_token', adminToken);
    admin.users()
      .then(({ users: u }) => setUsers(u || []))
      .catch(() => setUsers([]))
      .finally(() => {
        if (orig) localStorage.setItem('cpb_token', orig); else localStorage.removeItem('cpb_token');
      });
  }, [unlocked, adminToken]);

  const setRobuxForUser = async (e) => {
    e.preventDefault();
    if (!adminToken || !setUserId || setRobux === '') return;
    const token = localStorage.getItem('cpb_token');
    localStorage.setItem('cpb_token', adminToken);
    try {
      await admin.setRobux(setUserId, Number(setRobux));
      setMessage(`Robux actualizado para ${setUserId}`);
      setUsers(prev => prev.map(u => u.id === setUserId ? { ...u, robux: Number(setRobux) } : u));
    } catch (err) {
      setMessage(err.message || 'Error');
    } finally {
      localStorage.setItem('cpb_token', token);
    }
  };

  if (!unlocked) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Admin</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <form onSubmit={unlock} className="modal-body">
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Código admin" />
            <button type="submit">Desbloquear</button>
            {message && <p className="form-error">{message}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-panel admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Consola Admin</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body admin-body">
          <h3>Setear Robux</h3>
          <form onSubmit={setRobuxForUser} className="admin-form">
            <input type="text" value={setUserId} onChange={(e) => setSetUserId(e.target.value)} placeholder="User ID" />
            <input type="number" value={setRobux} onChange={(e) => setSetRobux(e.target.value)} placeholder="Cantidad" min="0" />
            <button type="submit">Setear</button>
          </form>
          {message && <p className="success-msg">{message}</p>}
          <h3>Usuarios</h3>
          <div className="admin-users-list">
            {users.map((u) => (
              <div key={u.id} className="admin-user-row">
                <span>{u.username}</span>
                <span>{u.id}</span>
                <span className="robux-amount">◆ {u.robux}</span>
                <button type="button" className="btn-small" onClick={() => { setSetUserId(u.id); setSetRobux(u.robux); }}>Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
