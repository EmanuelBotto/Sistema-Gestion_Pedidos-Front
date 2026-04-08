import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUserRole, isEmployeeRole } from "../utils/auth";

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
  const navItems = isEmployeeRole(rol) ? NAV_EMPLEADO : NAV_ADMIN;

  const currentPage = location.pathname.replace("/", "") || "dashboard";
  const sections = [...new Set(navItems.map((n) => n.section))];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">StockControl</div>
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