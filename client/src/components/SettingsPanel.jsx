import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPanel({ onClose, onAdmin }) {
  const { user, logout } = useAuth();
  const [adminSecret, setAdminSecret] = useState('');

  const handleUnlockAdmin = (e) => {
    e.preventDefault();
    if (adminSecret === 'coreplayblox-admin-secret') {
      onAdmin();
    }
    setAdminSecret('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajustes</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body settings-body">
          <div className="settings-row">
            <span>Usuario</span>
            <strong>{user?.username}</strong>
          </div>
          <button className="btn-secondary" onClick={logout}>Cerrar sesión</button>
          <hr className="settings-hr" />
          <form onSubmit={handleUnlockAdmin} className="admin-unlock">
            <input type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} placeholder="Código admin (secreto)" />
            <button type="submit">Desbloquear admin</button>
          </form>
        </div>
      </div>
    </div>
  );
}
