import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import ForgotPassword from "./components/forgotPassword";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import DashboardEmpleado from "./pages/DashboardEmpleado";
import Productos from "./pages/Productos";
import Movimientos from "./pages/Movimientos";
import Pedidos from "./pages/Pedidos";
import Clientes from "./pages/Clientes";
import Usuarios from "./pages/Usuarios";
import ClienteLayout from "./pages/ClienteLayout";
import ClienteVista from "./pages/ClienteVista";
import { getCurrentUserRole, isClientRole, isEmployeeRole } from "./utils/auth";

import "./App.css";

function App() {
  const rol = getCurrentUserRole();
  const isEmpleado = isEmployeeRole(rol);
  const isCliente = isClientRole(rol);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas con layout */}
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={isCliente ? <Navigate to="/catalogo" replace /> : isEmpleado ? <DashboardEmpleado /> : <Dashboard />} />
          <Route path="productos" element={isCliente ? <Navigate to="/catalogo" replace /> : <Productos />} />
          <Route path="movimientos" element={isCliente ? <Navigate to="/catalogo" replace /> : <Movimientos />} />
          <Route path="pedidos" element={isCliente ? <Navigate to="/catalogo" replace /> : <Pedidos />} />
          <Route path="clientes" element={isCliente ? <Navigate to="/catalogo" replace /> : <Clientes />} />
          <Route
            path="mi-cuenta"
            element={<Navigate to={isCliente ? "/catalogo" : "/dashboard"} replace />}
          />
          <Route element={<ClienteLayout />}>
            <Route path="catalogo" element={<ClienteVista />} />
            <Route path="detalle" element={<Navigate to="/catalogo" replace />} />
            <Route path="carrito" element={<ClienteVista />} />
            <Route path="checkout" element={<ClienteVista />} />
            <Route path="historial" element={<ClienteVista />} />
            <Route path="perfil" element={<ClienteVista />} />
          </Route>
          <Route
            path="usuarios"
            element={isCliente || isEmpleado ? <Navigate to="/dashboard" replace /> : <Usuarios />}
          />
          <Route
            path="*"
            element={<Navigate to={isCliente ? "/catalogo" : "/dashboard"} replace />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;