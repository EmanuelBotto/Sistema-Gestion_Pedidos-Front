import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { isClientRole } from '../utils/auth';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ mail: '', contrasenia: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      const destino = isClientRole(data?.usuario?.rol) ? '/catalogo' : '/dashboard';
      navigate(destino);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <p>Ingresá tus credenciales para continuar</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="mail">Correo electrónico</label>
            <input
              id="mail"
              type="mail"
              name="mail"
              placeholder="correo@ejemplo.com"
              value={formData.mail}
              onChange={handleChange}
              required
              autoComplete="mail"
            />
          </div>

          <div className="field">
            <label htmlFor="contrasenia">Contraseña</label>
            <input
              id="contrasenia"
              type="password"
              name="contrasenia"
              placeholder="••••••••"
              value={formData.contrasenia}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/forgot-password')}
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/registro')}
          >
            Crear cuenta nueva
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
