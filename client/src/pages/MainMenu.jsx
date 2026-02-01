import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { games as gamesApi, users as usersApi } from '../api';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';
import SettingsPanel from '../components/SettingsPanel';
import FriendsPanel from '../components/FriendsPanel';
import AvatarEditor from '../components/AvatarEditor';
import Catalog from '../components/Catalog';
import RobuxPanel from '../components/RobuxPanel';
import AdminPanel from '../components/AdminPanel';
import '../styles/MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ games: [], users: [] });
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showRobux, setShowRobux] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    gamesApi.list().then(({ games: g }) => setGames(g || [])).catch(() => setGames([]));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ games: [], users: [] });
      return;
    }
    const t = setTimeout(() => {
      Promise.all([
        gamesApi.search(searchQuery).then(r => r.games || []).catch(() => []),
        user ? usersApi.search(searchQuery).then(r => r.users || []).catch(() => []) : Promise.resolve([]),
      ]).then(([gamesList, usersList]) => setSearchResults({ games: gamesList, users: usersList }));
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery, user]);

  const handlePlay = (gameId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    navigate(`/play/${gameId || 'lobby'}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo">CorePlayBlox</div>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="main-menu">
      <header className="menu-header">
        <div className="logo-wrap" onClick={() => setShowCatalog(false)}>
          <span className="logo">CorePlayBlox</span>
        </div>
        <div className="search-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar juegos o jugadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {(searchResults.games.length > 0 || searchResults.users.length > 0) && (
            <div className="search-dropdown">
              {searchResults.games.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">Juegos</div>
                  {searchResults.games.slice(0, 5).map((g) => (
                    <div key={g.id} className="search-item" onClick={() => { handlePlay(g.id); setSearchQuery(''); setSearchResults({ games: [], users: [] }); }}>
                      {g.name}
                    </div>
                  ))}
                </div>
              )}
              {searchResults.users.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">Jugadores</div>
                  {searchResults.users.slice(0, 5).map((u) => (
                    <div key={u.id} className="search-item" onClick={() => { setSearchQuery(''); setSearchResults({ games: [], users: [] }); }}>
                      {u.username}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="menu-nav">
          {user ? (
            <>
              <button className="nav-btn" onClick={() => setShowAvatar(true)}>Avatar</button>
              <button className="nav-btn" onClick={() => setShowCatalog(true)}>Catálogo</button>
              <button className="nav-btn robux-btn" onClick={() => setShowRobux(true)}>
                <span className="robux-icon">◆</span> {user.robux ?? 0}
              </button>
              <button className="nav-btn" onClick={() => setShowFriends(true)}>Amigos</button>
              <button className="nav-btn" onClick={() => setShowSettings(true)}>Ajustes</button>
              <button className="nav-btn primary" onClick={() => handlePlay('lobby')}>Jugar</button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => setShowLogin(true)}>Iniciar sesión</button>
              <button className="nav-btn primary" onClick={() => setShowSignup(true)}>Registrarse</button>
            </>
          )}
        </nav>
      </header>

      <main className="menu-content">
        {showCatalog ? (
          <Catalog onClose={() => setShowCatalog(false)} />
        ) : (
          <>
            <section className="hero">
              <h1>Juega, Crea, Explora</h1>
              <p>Entra a mundos 3D multijugador al instante</p>
              <button className="play-cta" onClick={() => handlePlay('lobby')}>
                {user ? 'Jugar ahora' : 'Explorar (inicia sesión para jugar)'}
              </button>
            </section>
            <section className="games-section">
              <h2>Juegos destacados</h2>
              <div className="games-grid">
                {games.map((game) => (
                  <div key={game.id} className="game-card" onClick={() => handlePlay(game.id)}>
                    <div className="game-card-thumb" style={{ background: 'linear-gradient(135deg, var(--cpb-card), var(--cpb-green-dark))' }} />
                    <div className="game-card-info">
                      <h3>{game.name}</h3>
                      <p>{game.description}</p>
                      <button className="game-play-btn">Play</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="quick-actions">
              <button className="quick-btn" onClick={() => navigate('/editor')}>Crear mapa (Editor)</button>
            </section>
          </>
        )}
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSignup={() => { setShowLogin(false); setShowSignup(true); }} onSuccess={() => { setShowLogin(false); refreshUser(); }} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} onLogin={() => { setShowSignup(false); setShowLogin(true); }} onSuccess={() => { setShowSignup(false); refreshUser(); }} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} onAdmin={() => { setShowSettings(false); setShowAdmin(true); }} />}
      {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}
      {showAvatar && <AvatarEditor onClose={() => { setShowAvatar(false); refreshUser(); }} />}
      {showRobux && <RobuxPanel onClose={() => { setShowRobux(false); refreshUser(); }} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
