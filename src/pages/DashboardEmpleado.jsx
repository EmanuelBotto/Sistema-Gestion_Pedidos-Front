import { useEffect, useState } from "react";
import { api } from "../api";

export default function DashboardEmpleado() {
  const [resumen, setResumen] = useState({ pedidos: 0, movimientos: 0, clientes: 0 });
<<<<<<< HEAD
=======
  const [clientes, setClientes] = useState([]);
>>>>>>> c768dfc791fa747cfe755a6a0faa503ab3ebc652
  const [ultimosPedidos, setUltimosPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.pedidos.getAll().catch(() => []),
      api.movimientos.getAll().catch(() => []),
      api.clientes.getAll().catch(() => []),
    ]).then(([ped, mov, cli]) => {
      const pedidos = ped?.data ?? ped ?? [];
      const movimientos = mov?.data ?? mov ?? [];
      const clientes = cli?.data ?? cli ?? [];

<<<<<<< HEAD
=======
      setClientes(clientes);
>>>>>>> c768dfc791fa747cfe755a6a0faa503ab3ebc652
      setResumen({
        pedidos: pedidos.length,
        movimientos: movimientos.length,
        clientes: clientes.length,
      });
      setUltimosPedidos(pedidos.slice(-5).reverse());
      setLoading(false);
    });
  }, []);

<<<<<<< HEAD
=======
  const getClienteNombre = (id) => {
    const cliente = clientes.find((c) => c.id == id);
    return cliente?.nombre || `Cliente #${id}`;
  };

>>>>>>> c768dfc791fa747cfe755a6a0faa503ab3ebc652
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Empleado</h1>
          <p className="page-subtitle">OPERACION DIARIA</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card warn">
          <p className="stat-label">Pedidos</p>
          <p className="stat-value warn">{resumen.pedidos}</p>
        </div>
        <div className="stat-card purple">
          <p className="stat-label">Movimientos</p>
          <p className="stat-value purple">{resumen.movimientos}</p>
        </div>
        <div className="stat-card info">
          <p className="stat-label">Clientes</p>
          <p className="stat-value info">{resumen.clientes}</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.3px" }}>
          Ultimos pedidos
        </h2>
        {ultimosPedidos.length === 0 ? (
          <div className="empty-state">Sin pedidos</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPedidos.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
<<<<<<< HEAD
                    <td>Cliente #{p.cliente_id}</td>
=======
                    <td>{getClienteNombre(p.cliente_id)}</td>
>>>>>>> c768dfc791fa747cfe755a6a0faa503ab3ebc652
                    <td>{p.estado?.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
