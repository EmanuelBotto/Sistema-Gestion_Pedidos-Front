import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../api";
import { getCurrentUserRole, getStoredUser, isClientRole } from "../utils/auth";

export default function ClienteLayout() {
  const rol = getCurrentUserRole();
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTiendaData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cliRes, pedRes, detRes, prodRes] = await Promise.all([
        api.clientes.getAll(),
        api.pedidos.getAll(),
        api.detallePedido.getAll(),
        api.productos.getAll(),
      ]);
      const clientesData = cliRes.data ?? cliRes;
      const productosData = prodRes.data ?? prodRes;
      setClientes(clientesData);
      setPedidos(pedRes.data ?? pedRes);
      setDetalles(detRes.data ?? detRes);
      setProductos(productosData);
      setSelectedProductId(productosData[0]?.id ?? null);
    } catch (e) {
      setError(e.message || "No se pudo cargar la tienda");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.auth.me();
      const merged = { ...getStoredUser(), ...data.usuario };
      localStorage.setItem("usuario", JSON.stringify(merged));
      setSessionUser(merged);
    } catch {
      /* sin sesión válida */
    }
  }, []);

  useEffect(() => {
    if (!isClientRole(rol)) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshSession();
      } catch {
        /* ignorar */
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [rol, refreshSession]);

  useEffect(() => {
    if (!isClientRole(rol)) return;
    loadTiendaData();
  }, [rol, loadTiendaData]);

  const refreshClientes = async () => {
    try {
      const cliRes = await api.clientes.getAll();
      setClientes(cliRes.data ?? cliRes);
      await refreshSession();
    } catch {
      /* ignorar */
    }
  };

  if (!isClientRole(rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Outlet
      context={{
        user: sessionUser,
        refreshSession,
        clientes,
        refreshClientes,
        pedidos,
        detalles,
        productos,
        selectedProductId,
        setSelectedProductId,
        search,
        setSearch,
        loading,
        error,
        refreshTiendaData: loadTiendaData,
      }}
    />
  );
}
