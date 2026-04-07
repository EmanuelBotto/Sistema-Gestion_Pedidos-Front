import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState({ productos: 0, clientes: 0, pedidos: 0, movimientos: 0 });
  const [recentMovimientos, setRecentMovimientos] = useState([]);
  const [recentPedidos, setRecentPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.productos.getAll().catch(() => ({ data: [] })),
      api.clientes.getAll().catch(() => ({ data: [] })),
      api.pedidos.getAll().catch(() => ({ data: [] })),
      api.movimientos.getAll().catch(() => ({ data: [] })),
    ]).then(([prod, cli, ped, mov]) => {
      const p = prod.data ?? prod;
      const c = cli.data ?? cli;
      const pe = ped.data ?? ped;
      const m = mov.data ?? mov;
      setStats({ productos: p.length, clientes: c.length, pedidos: pe.length, movimientos: m.length });
      setRecentMovimientos(m.slice(-5).reverse());
      setRecentPedidos(pe.slice(-5).reverse());
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Cargando...</span></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">RESUMEN GENERAL DEL SISTEMA</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green" style={{cursor:'pointer'}} onClick={() => setPage('productos')}>
          <p className="stat-label">Productos</p>
          <p className="stat-value green">{stats.productos}</p>
        </div>
        <div className="stat-card info" style={{cursor:'pointer'}} onClick={() => setPage('clientes')}>
          <p className="stat-label">Clientes</p>
          <p className="stat-value info">{stats.clientes}</p>
        </div>
        <div className="stat-card warn" style={{cursor:'pointer'}} onClick={() => setPage('pedidos')}>
          <p className="stat-label">Pedidos</p>
          <p className="stat-value warn">{stats.pedidos}</p>
        </div>
        <div className="stat-card purple" style={{cursor:'pointer'}} onClick={() => setPage('movimientos')}>
          <p className="stat-label">Movimientos</p>
          <p className="stat-value purple">{stats.movimientos}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.3px' }}>
            Últimos movimientos de stock
          </h2>
          <div className="card">
            {recentMovimientos.length === 0 ? (
              <div className="empty-state">Sin movimientos</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovimientos.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span className={`badge ${m.tipo === 'entrada' ? 'badge-green' : 'badge-danger'}`}>
                          {m.tipo === 'entrada' ? '↑' : '↓'} {m.tipo}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.cantidad}</td>
                      <td>{m.usuario_realizo_movimiento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.3px' }}>
            Últimos pedidos
          </h2>
          <div className="card">
            {recentPedidos.length === 0 ? (
              <div className="empty-state">Sin pedidos</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPedidos.map(p => {
                    const estadoMap = { pendiente: 'badge-warn', en_proceso: 'badge-info', completado: 'badge-green', cancelado: 'badge-danger' };
                    return (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>#{p.id}</span></td>
                        <td>Cliente #{p.cliente_id}</td>
                        <td><span className={`badge ${estadoMap[p.estado] || 'badge-gray'}`}>{p.estado?.replace('_',' ')}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
