import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUserRole, isAdminRole } from "../utils/auth";

const NAV_ADMIN = [
  { id: "dashboard", label: "Dashboard", section: "GENERAL" },
  { id: "productos", label: "Productos", section: "INVENTARIO" },
  { id: "movimientos", label: "Movimientos", section: "INVENTARIO" },
  { id: "pedidos", label: "Pedidos", section: "VENTAS" },
  { id: "clientes", label: "Clientes", section: "VENTAS" },
  { id: "usuarios", label: "Usuarios", section: "SISTEMA" },
];

const NAV_EMPLEADO = [
  { id: "dashboard", label: "Dashboard", section: "GENERAL" },
  { id: "productos", label: "Productos", section: "INVENTARIO" },
  { id: "movimientos", label: "Movimientos", section: "INVENTARIO" },
  { id: "pedidos", label: "Pedidos", section: "VENTAS" },
  { id: "clientes", label: "Clientes", section: "VENTAS" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const rol = getCurrentUserRole();
  const navItems = isAdminRole(rol) ? NAV_ADMIN : NAV_EMPLEADO;

  const currentPage = location.pathname.replace("/", "") || "dashboard";
  const sections = [...new Set(navItems.map((n) => n.section))];
  const roleLabel = rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : "Sin rol";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">StockControl</div>
        <div className="topbar-actions">
          <span className="topbar-role">{roleLabel}</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <nav className="sidebar">
        {sections.map((section) => (
          <div key={section}>
            <div className="sidebar-section">{section}</div>

            {navItems.filter((n) => n.section === section).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  currentPage === item.id ? "active" : ""
                }`}
                onClick={() => navigate(`/${item.id}`)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
