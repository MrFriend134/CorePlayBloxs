import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../api';

export default function FriendsPanel({ onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.friends().then(({ friends: f }) => setFriends(f || [])).catch(() => setFriends([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      usersApi.search(search).then(({ users: u }) => setSearchResults((u || []).filter(x => x.id !== user?.id && !friends.some(f => f.id === x.id)))).catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search, user?.id, friends]);

  const addFriend = (friendId) => {
    usersApi.addFriend(friendId).then(({ friends: f }) => setFriends(f)).catch(() => {});
    setSearch('');
    setSearchResults([]);
  };

  const removeFriend = (friendId) => {
    usersApi.removeFriend(friendId).then(({ friends: f }) => setFriends(f)).catch(() => {});
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Amigos</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body friends-body">
          <input type="text" className="search-input" placeholder="Buscar jugadores para agregar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {searchResults.length > 0 && (
            <ul className="friends-search-list">
              {searchResults.map((u) => (
                <li key={u.id}>
                  <span>{u.username}</span>
                  <button className="btn-small primary" onClick={() => addFriend(u.id)}>Agregar</button>
                </li>
              ))}
            </ul>
          )}
          <h3>Tu lista</h3>
          {loading ? <p>Cargando...</p> : friends.length === 0 ? <p className="muted">No tienes amigos agregados.</p> : (
            <ul className="friends-list">
              {friends.map((f) => (
                <li key={f.id}>
                  <span>{f.username}</span>
                  <button className="btn-small" onClick={() => removeFriend(f.id)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
