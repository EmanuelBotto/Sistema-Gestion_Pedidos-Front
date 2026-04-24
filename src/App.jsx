import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import ForgotPassword from "./components/forgotPassword";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import DashboardEmpleado from "./pages/DashboardEmpleado";
import ClienteLayout from "./pages/ClienteLayout";
import ClienteVista from "./pages/ClienteVista";
import Productos from "./pages/Productos";
import Movimientos from "./pages/Movimientos";
import Pedidos from "./pages/Pedidos";
import Clientes from "./pages/Clientes";
import Usuarios from "./pages/Usuarios";
import { getCurrentUserRole, isAdminRole, isClientRole, isEmployeeRole } from "./utils/auth";

import "./App.css";

function App() {
  const rol = getCurrentUserRole();
  const isEmpleado = isEmployeeRole(rol);
  const isAdmin = isAdminRole(rol);
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
          <Route
            path="dashboard"
            element={
              isCliente ? <Navigate to="/catalogo" replace /> : isEmpleado ? <DashboardEmpleado /> : <Dashboard />
            }
          />
          {!isCliente ? (
            <>
              <Route path="productos" element={<Productos />} />
              <Route path="movimientos" element={<Movimientos />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route
                path="usuarios"
                element={isAdmin ? <Usuarios /> : <Navigate to="/dashboard" replace />}
              />
            </>
          ) : (
            <Route element={<ClienteLayout />}>
              <Route path="catalogo" element={<ClienteVista />} />
              <Route path="pedidos" element={<ClienteVista />} />
              <Route path="perfil" element={<ClienteVista />} />
              <Route path="historial" element={<Navigate to="/pedidos" replace />} />
              <Route path="carrito" element={<Navigate to="/catalogo" replace />} />
              <Route path="checkout" element={<Navigate to="/catalogo" replace />} />
            </Route>
          )}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
