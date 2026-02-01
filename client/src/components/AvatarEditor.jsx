import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../api';

const SKIN_PRESETS = ['#e8b88a', '#c68642', '#8d5524', '#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3317'];
const ACCESORIOS = [
  { id: 'hat_cap', name: 'Gorra' },
  { id: 'hat_crown', name: 'Corona' },
  { id: 'glasses', name: 'Gafas' },
  { id: 'scarf', name: 'Bufanda' },
  { id: 'wings', name: 'Alas' },
  { id: 'halo', name: 'Halo' },
];

export default function AvatarEditor({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [skinColor, setSkinColor] = useState(user?.avatar?.skinColor || '#e8b88a');
  const [saving, setSaving] = useState(false);
  const owned = user?.avatar?.accessories || [];

  useEffect(() => {
    setSkinColor(user?.avatar?.skinColor || '#e8b88a');
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.updateAvatar({ skinColor });
      refreshUser();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-panel avatar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Personalizar avatar</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body avatar-body">
          <div className="avatar-preview-wrap">
            <div className="avatar-preview" style={{ background: skinColor }}>
              <div className="avatar-head" />
              <div className="avatar-body-simple" />
              {owned.includes('hat_cap') && <div className="acc hat" />}
              {owned.includes('hat_crown') && <div className="acc crown" />}
              {owned.includes('glasses') && <div className="acc glasses" />}
            </div>
          </div>
          <label>
            Color de piel
            <div className="skin-colors">
              {SKIN_PRESETS.map((c) => (
                <button key={c} type="button" className="skin-swatch" style={{ background: c }} onClick={() => setSkinColor(c)} title={c} />
              ))}
            </div>
            <input type="color" value={skinColor} onChange={(e) => setSkinColor(e.target.value)} className="skin-picker" />
          </label>
          <label>Accesorios (compra en Catálogo)</label>
          <div className="accessories-list">
            {ACCESORIOS.map((a) => (
              <div key={a.id} className="acc-badge">
                {owned.includes(a.id) ? a.name : `🔒 ${a.name}`}
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
