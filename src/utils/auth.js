const decodeJwtPayload = (token) => {
  try {
    const payload = token?.split(".")?.[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const ROLE_ALIASES = {
  administrador: "admin",
  administrator: "admin",
  empleado: "empleado",
  operador: "operador",
  cliente: "cliente",
  client: "cliente",
  admin: "admin",
  viewer: "viewer",
  visualizador: "viewer",
};

export const normalizeRole = (rol) => {
  const raw = String(rol ?? "").trim().toLowerCase();
  return ROLE_ALIASES[raw] || raw || null;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getCurrentUserRole = () => {
  const fromUser = normalizeRole(getStoredUser()?.rol);
  if (fromUser) return fromUser;

  const token = localStorage.getItem("token");
  const payload = decodeJwtPayload(token);
  return normalizeRole(payload?.rol);
};

export const isEmployeeRole = (rol) => {
  const role = normalizeRole(rol);
  return role === "empleado" || role === "operador";
};

export const isAdminRole = (rol) => normalizeRole(rol) === "admin";
export const isClientRole = (rol) => normalizeRole(rol) === "cliente";
