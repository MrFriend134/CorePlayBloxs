import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { economy } from '../api';

const CODES_LIST = ['MRFLOWERS', 'MrFriend', 'TheBestDev', 'pepiato123', 'Dell', 'OSFTHEBEST'];

export default function RobuxPanel({ onClose, refreshUser }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const redeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setMessage('');
    setLoading(true);
    try {
      const res = await economy.redeem(code.trim());
      setMessage(`¡Canjeado! +${res.added} Robux. Total: ${res.robux}`);
      setCode('');
      refreshUser?.();
    } catch (err) {
      setMessage(err.message || 'Código inválido o ya usado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>◆ Robux</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body robux-body">
          <div className="robux-balance">
            Tu saldo: <strong className="robux-amount"><span className="robux-icon">◆</span> {user?.robux ?? 0}</strong>
          </div>
          <hr />
          <h3>Canjear código</h3>
          <form onSubmit={redeem} className="redeem-form">
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '...' : 'Canjear'}</button>
          </form>
          {message && <p className={message.startsWith('¡') ? 'success-msg' : 'form-error'}>{message}</p>}
          <p className="muted small">Códigos de ejemplo (solo para pruebas): MRFLOWERS, MrFriend, TheBestDev, pepiato123, Dell, OSFTHEBEST</p>
        </div>
      </div>
    </div>
  );
}
