import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function ClienteVista() {
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
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
        setClientes(clientesData);
        setPedidos(pedRes.data ?? pedRes);
        setDetalles(detRes.data ?? detRes);
        setProductos(prodRes.data ?? prodRes);
        setClienteId(clientesData[0]?.id ? String(clientesData[0].id) : "");
      } catch (e) {
        setError(e.message || "No se pudo cargar la vista del cliente");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const clienteActual = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)) || null,
    [clientes, clienteId]
  );

  const pedidosCliente = useMemo(
    () => pedidos.filter((p) => String(p.cliente_id) === String(clienteId)),
    [pedidos, clienteId]
  );

  const historialPedidos = useMemo(() => {
    const mapProductos = new Map(productos.map((p) => [String(p.id), p.nombre]));
    const detallesPorPedido = new Map();

    detalles.forEach((d) => {
      const pedidoKey = String(d.pedido);
      if (!detallesPorPedido.has(pedidoKey)) detallesPorPedido.set(pedidoKey, []);
      detallesPorPedido.get(pedidoKey).push({
        id: d.id,
        cantidad: Number(d.cantidad) || 0,
        precioUnitario: Number(d.precio_unitario) || 0,
        subtotal: (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        nombreProducto: mapProductos.get(String(d.producto)) || `Producto #${d.producto}`,
      });
    });

    return pedidosCliente
      .map((p) => {
        const items = detallesPorPedido.get(String(p.id)) || [];
        const total = items.reduce((acc, it) => acc + it.subtotal, 0);
        return { ...p, items, total };
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [detalles, pedidosCliente, productos]);

  const productosComprados = useMemo(() => {
    const acumulado = new Map();

    historialPedidos.forEach((pedido) => {
      pedido.items.forEach((item) => {
        const key = item.nombreProducto;
        if (!acumulado.has(key)) {
          acumulado.set(key, {
            nombre: key,
            cantidad: 0,
            importe: 0,
            compras: 0,
          });
        }
        const actual = acumulado.get(key);
        actual.cantidad += item.cantidad;
        actual.importe += item.subtotal;
        actual.compras += 1;
      });
    });

    return Array.from(acumulado.values()).sort((a, b) => b.importe - a.importe);
  }, [historialPedidos]);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner" />
          <span>Cargando vista de cliente...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi cuenta</h1>
          <p className="page-subtitle">PRODUCTOS COMPRADOS E HISTORIAL</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field" style={{ maxWidth: 380 }}>
          <label>Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {clienteActual && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>{clienteActual.nombre}</h3>
          <p style={{ margin: "6px 0", color: "var(--text-muted)" }}>
            {clienteActual.mail} · {clienteActual.telefono}
          </p>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{clienteActual.direccion}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Productos comprados</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad total</th>
                <th>Veces comprado</th>
                <th>Importe total</th>
              </tr>
            </thead>
            <tbody>
              {productosComprados.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">Este cliente todavia no tiene compras.</div>
                  </td>
                </tr>
              ) : (
                productosComprados.map((p) => (
                  <tr key={p.nombre}>
                    <td>{p.nombre}</td>
                    <td>{p.cantidad}</td>
                    <td>{p.compras}</td>
                    <td>${p.importe.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Historial de pedidos</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {historialPedidos.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Este cliente no tiene historial de pedidos.</div>
                  </td>
                </tr>
              ) : (
                historialPedidos.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.fecha ? new Date(p.fecha).toLocaleString("es-AR") : "—"}</td>
                    <td>{p.estado || "pendiente"}</td>
                    <td>{p.items.length}</td>
                    <td>${p.total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
