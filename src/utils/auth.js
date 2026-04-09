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

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getCurrentUserRole = () => {
  const fromUser = getStoredUser()?.rol;
  if (fromUser) return fromUser;

  const token = localStorage.getItem("token");
  const payload = decodeJwtPayload(token);
  return payload?.rol || null;
};

export const isEmployeeRole = (rol) => rol === "empleado" || rol === "operador";
export const isClientRole = (rol) => rol === "cliente";
