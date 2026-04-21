/**
 * Layout.jsx
 * Usa únicamente las clases definidas en App.css — sin estilos inline.
 * Fix: rol leído con useState para evitar race condition post-login.
 */
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  getCurrentUserRole,
  getStoredUser,
  isAdminRole,
  isClientRole,
  isEmployeeRole,
  logout,
} from "../utils/auth";

/* ── Iconos SVG inline (sin dependencias extra) ───────────────────────── */
const Icon = {
  dashboard:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  productos:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  movimientos: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  pedidos:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  clientes:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  usuarios:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  catalogo:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  carrito:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  historial:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><circle cx="12" cy="12" r="10"/></svg>,
  perfil:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

/* ── Menús por rol ────────────────────────────────────────────────────── */
const MENU_ADMIN = [
  { to: "/dashboard",   label: "Dashboard",   Ic: Icon.dashboard   },
  { to: "/productos",   label: "Productos",   Ic: Icon.productos   },
  { to: "/movimientos", label: "Movimientos", Ic: Icon.movimientos },
  { to: "/pedidos",     label: "Pedidos",     Ic: Icon.pedidos     },
  { to: "/clientes",    label: "Clientes",    Ic: Icon.clientes    },
  { to: "/usuarios",    label: "Usuarios",    Ic: Icon.usuarios    },
];
const MENU_EMPLEADO = [
  { to: "/dashboard",   label: "Dashboard",   Ic: Icon.dashboard   },
  { to: "/productos",   label: "Productos",   Ic: Icon.productos   },
  { to: "/movimientos", label: "Movimientos", Ic: Icon.movimientos },
  { to: "/pedidos",     label: "Pedidos",     Ic: Icon.pedidos     },
  { to: "/clientes",    label: "Clientes",    Ic: Icon.clientes    },
];
const MENU_CLIENTE = [
  { to: "/catalogo",  label: "Catálogo",  Ic: Icon.catalogo  },
  { to: "/carrito",   label: "Carrito",   Ic: Icon.carrito   },
  { to: "/historial", label: "Historial", Ic: Icon.historial },
  { to: "/perfil",    label: "Mi perfil", Ic: Icon.perfil    },
];

const ROL_BADGE_CLASS = {
  admin:    "badge badge-danger",
  empleado: "badge badge-info",
  cliente:  "badge badge-success",
};
const ROL_LABEL = { admin: "Admin", empleado: "Empleado", cliente: "Cliente" };

function getMenu(rol) {
  if (isAdminRole(rol))    return MENU_ADMIN;
  if (isEmployeeRole(rol)) return MENU_EMPLEADO;
  if (isClientRole(rol))   return MENU_CLIENTE;
  return [];
}

export default function Layout() {
  const navigate = useNavigate();

  // Rol reactivo: evita race condition cuando el componente se monta
  // justo después del login antes de que localStorage tenga el usuario.
  const [rol,  setRol]  = useState(() => getCurrentUserRole());
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const r = getCurrentUserRole();
    const u = getStoredUser();
    if (r !== rol)  setRol(r);
    if (JSON.stringify(u) !== JSON.stringify(user)) setUser(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menu = getMenu(rol);

  const displayName = user
    ? [user.nombre, user.apellido].filter(Boolean).join(" ") || user.mail || "Usuario"
    : "Usuario";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <span className="sidebar-logo">◆</span>
          <span className="sidebar-title">Sistema</span>
        </div>

        <nav className="sidebar-nav">
          {menu.length === 0 && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.5rem 0.75rem" }}>
              Sin menú disponible
            </span>
          )}
          {menu.map(({ to, label, Ic }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
            >
              <Ic />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName}</span>
              <span className={ROL_BADGE_CLASS[rol] ?? "badge badge-gray"}>
                {ROL_LABEL[rol] ?? rol ?? "—"}
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm sidebar-logout"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <Icon.logout />
          </button>
        </div>

      </aside>

      {/* ── Contenido principal ──────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}
