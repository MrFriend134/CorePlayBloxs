import React, { useState } from 'react';

export default function LoginModal({ onClose, onSignup, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { login } = await import('../api').then(m => ({ login: m.auth.login }));
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-auth" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Iniciar sesión</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error">{error}</div>}
          <label>
            Usuario
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus placeholder="Usuario" />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Contraseña" />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="auth-switch">
            ¿No tienes cuenta? <button type="button" className="link-btn" onClick={onSignup}>Regístrate</button>
          </p>
        </form>
      </div>
    </div>
  );
}
