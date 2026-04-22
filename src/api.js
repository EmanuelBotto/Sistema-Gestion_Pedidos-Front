// Cambiá VITE_API_URL en tu .env para producción
// En desarrollo apunta a http://localhost:3000
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const authHeaders = () => {
  try {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.error || err.message || 'Error en la solicitud');
  }
  if (res.status === 204) return null;
  return res.json();
};

// --- Auth ---
export const api = {
  auth: {
    me: () => request('/api/auth/me'),
  },
  productos: {
    getAll: () => request('/api/productos'),
    getById: (id) => request(`/api/productos/${id}`),
    create: (data) => request('/api/productos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/productos/${id}`, { method: 'DELETE' }),
  },
  pedidos: {
    getAll: () => request('/api/pedidos'),
    getById: (id) => request(`/api/pedidos/${id}`),
    create: (data) => request('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/pedidos/${id}`, { method: 'DELETE' }),
  },
  detallePedido: {
    getAll: () => request('/api/detalle-pedido'),
    getById: (id) => request(`/api/detalle-pedido/${id}`),
    create: (data) => request('/api/detalle-pedido', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/detalle-pedido/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/detalle-pedido/${id}`, { method: 'DELETE' }),
  },
  movimientos: {
    getAll: () => request('/api/movimientos-stock'),
    getById: (id) => request(`/api/movimientos-stock/${id}`),
    create: (data) => request('/api/movimientos-stock', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/movimientos-stock/${id}`, { method: 'DELETE' }),
  },
  clientes: {
    getAll: () => request('/api/clientes'),
    getById: (id) => request(`/api/clientes/${id}`),
    create: (data) => request('/api/clientes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/clientes/${id}`, { method: 'DELETE' }),
  },
  usuarios: {
    getAll: () => request('/api/usuarios'),
    getById: (id) => request(`/api/usuarios/${id}`),
    create: (data) => request('/api/usuarios', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/usuarios/${id}`, { method: 'DELETE' }),
  },
};
