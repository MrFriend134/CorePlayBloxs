import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { economy } from '../api';

const ITEMS = [
  { id: 'hat_cap', name: 'Gorra', price: 500, thumb: '🧢' },
  { id: 'hat_crown', name: 'Corona', price: 2000, thumb: '👑' },
  { id: 'glasses', name: 'Gafas', price: 800, thumb: '🕶️' },
  { id: 'scarf', name: 'Bufanda', price: 600, thumb: '🧣' },
  { id: 'wings', name: 'Alas', price: 5000, thumb: '🪽' },
  { id: 'halo', name: 'Halo', price: 3500, thumb: '😇' },
];

export default function Catalog({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [purchasing, setPurchasing] = useState(null);

  const owned = (user?.avatar?.accessories || []);

  const buy = async (item) => {
    if (owned.includes(item.id)) return;
    setPurchasing(item.id);
    try {
      await economy.purchase(item.id, item.price);
      refreshUser();
    } catch (err) {
      alert(err.message || 'Error al comprar');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="catalog-wrap">
      <div className="catalog-header">
        <h2>Catálogo</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="catalog-grid">
        {ITEMS.map((item) => (
          <div key={item.id} className="catalog-item">
            <div className="catalog-item-thumb">{item.thumb}</div>
            <h3>{item.name}</h3>
            <p className="price"><span className="robux-icon">◆</span> {item.price}</p>
            {owned.includes(item.id) ? (
              <span className="owned">En tu inventario</span>
            ) : (
              <button className="btn-primary btn-small" onClick={() => buy(item)} disabled={purchasing === item.id || (user?.robux ?? 0) < item.price}>
                {purchasing === item.id ? '...' : 'Comprar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
