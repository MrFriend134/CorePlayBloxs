import React, { useState } from 'react';

export default function SignupModal({ onClose, onLogin, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { register } = await import('../api').then(m => ({ register: m.auth.register }));
      await register(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-auth" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrarse</h2>
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
          </label>
          <label>
            Confirmar contraseña
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repite la contraseña" />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <p className="auth-switch">
            ¿Ya tienes cuenta? <button type="button" className="link-btn" onClick={onLogin}>Inicia sesión</button>
          </p>
        </form>
      </div>
    </div>
  );
}
