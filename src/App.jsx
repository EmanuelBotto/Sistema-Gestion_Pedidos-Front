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
import { getCurrentUserRole, isEmployeeRole } from "./utils/auth";

import "./App.css";

function App() {
  const rol = getCurrentUserRole();
  const isEmpleado = isEmployeeRole(rol);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas con layout */}
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={isEmpleado ? <DashboardEmpleado /> : <Dashboard />} />
          <Route path="productos" element={<Productos />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route
            path="usuarios"
            element={isEmpleado ? <Navigate to="/dashboard" replace /> : <Usuarios />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;