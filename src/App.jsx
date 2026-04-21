import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login         from "./components/login";
import ForgotPassword from "./components/forgotPassword";
import Layout        from "./components/Layout";
import Dashboard        from "./pages/Dashboard";
import DashboardEmpleado from "./pages/DashboardEmpleado";
import Productos        from "./pages/Productos";
import Movimientos      from "./pages/Movimientos";
import Pedidos          from "./pages/Pedidos";
import Clientes         from "./pages/Clientes";
import Usuarios         from "./pages/Usuarios";
import ClienteLayout    from "./pages/ClienteLayout";
import ClienteVista     from "./pages/ClienteVista";

import {
  getCurrentUserRole,
  isClientRole,
  isEmployeeRole,
  isAdminRole,
} from "./utils/auth";

import "./App.css";

/**
 * Guarda de ruta: redirige si el rol no cumple la condición.
 * Usage: <RoleGuard allow={isAdminRole} fallback="/dashboard" />
 */
function RoleGuard({ allow, fallback = "/", children }) {
  const rol = getCurrentUserRole();
  return allow(rol) ? children : <Navigate to={fallback} replace />;
}

export default function App() {
  const rol       = getCurrentUserRole();
  const esCliente = isClientRole(rol);
  const esEmpleado = isEmployeeRole(rol);
  const esAdmin   = isAdminRole(rol);

  /** Destino por defecto según rol */
  const home = esCliente ? "/catalogo" : "/dashboard";

  return (
    <Router>
      <Routes>
        {/* ── Públicas ─────────────────────────────────────────────────── */}
        <Route path="/"               element={<Login />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Con Layout (sidebar + navbar) ─────────────────────────── */}
        <Route path="/" element={<Layout />}>

          {/* Dashboard: empleado ve su propio dashboard, admin el completo */}
          <Route
            path="dashboard"
            element={
              esCliente
                ? <Navigate to="/catalogo" replace />
                : esEmpleado
                  ? <DashboardEmpleado />
                  : <Dashboard />
            }
          />

          {/* ── Rutas solo admin y empleado ─────────────────────────── */}
          <Route
            path="productos"
            element={
              esCliente
                ? <Navigate to="/catalogo" replace />
                : <Productos />
            }
          />
          <Route
            path="movimientos"
            element={
              esCliente
                ? <Navigate to="/catalogo" replace />
                : <Movimientos />
            }
          />
          <Route
            path="pedidos"
            element={
              esCliente
                ? <Navigate to="/catalogo" replace />
                : <Pedidos />
            }
          />
          <Route
            path="clientes"
            element={
              esCliente
                ? <Navigate to="/catalogo" replace />
                : <Clientes />
            }
          />

          {/* ── Solo admin ──────────────────────────────────────────── */}
          <Route
            path="usuarios"
            element={
              esAdmin
                ? <Usuarios />
                : <Navigate to={home} replace />
            }
          />

          {/* ── Vista Cliente (catálogo, carrito, checkout, historial, perfil) */}
          <Route element={<ClienteLayout />}>
            <Route path="catalogo"  element={<ClienteVista />} />
            <Route path="carrito"   element={<ClienteVista />} />
            <Route path="checkout"  element={<ClienteVista />} />
            <Route path="historial" element={<ClienteVista />} />
            <Route path="perfil"    element={<ClienteVista />} />
            {/* alias legacy */}
            <Route path="detalle"   element={<Navigate to="/catalogo" replace />} />
          </Route>

          {/* ── mi-cuenta: redirige según rol ───────────────────────── */}
          <Route
            path="mi-cuenta"
            element={<Navigate to={esCliente ? "/perfil" : "/dashboard"} replace />}
          />

          {/* ── Catch-all ───────────────────────────────────────────── */}
          <Route
            path="*"
            element={<Navigate to={home} replace />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
