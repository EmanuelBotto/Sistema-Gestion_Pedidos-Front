import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [mail, setMail] = useState('');
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: mail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al enviar el email');
      }
      setMsg('Te enviamos un email con instrucciones. Revisá tu bandeja.');
    } catch (err) {
      setError(err.message || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Restablecer contraseña</h2>
          <p>Te enviaremos un enlace a tu correo</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {msg   && <p className="auth-success">{msg}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar email'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
