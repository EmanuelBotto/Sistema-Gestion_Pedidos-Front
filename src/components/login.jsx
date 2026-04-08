import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      const response = await axios.post(
        `http://localhost:3000/api/auth/login`,
        formData
      );
      localStorage.setItem('token', response.data.token);
      if (response.data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
