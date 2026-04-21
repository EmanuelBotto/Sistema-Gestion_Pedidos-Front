/**
 * auth.js  –  Helpers de autenticación y roles
 *
 * Roles del sistema:
 *   admin    → acceso total (dashboard, productos, movimientos, pedidos, clientes, usuarios)
 *   empleado → acceso limitado (dashboard empleado, productos, movimientos, pedidos, clientes)
 *   cliente  → solo vista cliente (catálogo, carrito, checkout, historial, perfil)
 */

export const ROLES = {
  ADMIN:    'admin',
  EMPLEADO: 'empleado',
  CLIENTE:  'cliente',
};

/** Devuelve el token JWT almacenado */
export const getToken = () => {
  try { return localStorage.getItem('token'); } catch { return null; }
};

/** Devuelve el objeto usuario almacenado (parseado) o null */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/** Devuelve el rol del usuario actual o null si no hay sesión */
export const getCurrentUserRole = () => {
  const user = getStoredUser();
  return user?.rol ?? null;
};

/** true si el rol corresponde a cliente */
export const isClientRole  = (rol) => rol === ROLES.CLIENTE;

/** true si el rol corresponde a empleado */
export const isEmployeeRole = (rol) => rol === ROLES.EMPLEADO;

/** true si el rol corresponde a admin */
export const isAdminRole   = (rol) => rol === ROLES.ADMIN;

/** Cierra sesión borrando token y usuario del storage */
export const logout = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  } catch { /* noop */ }
};
