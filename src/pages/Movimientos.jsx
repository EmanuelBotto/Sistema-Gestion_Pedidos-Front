import { useState, useEffect } from 'react';
import { api } from '../api';
import { Modal, ConfirmModal } from '../components/Modal';

const EMPTY = { producto_id: '', tipo: 'entrada', cantidad: '', usuario_realizo_movimiento: '' };

export default function Movimientos({ }) {
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [movRes, prodRes] = await Promise.all([
        api.movimientos.getAll(),
        api.productos.getAll(),
      ]);
      setItems(movRes.data ?? movRes);
      setProductos(prodRes.data ?? prodRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.producto_id) return alert('Seleccioná un producto', 'error');
    if (!form.cantidad || Number(form.cantidad) <= 0) return alert('Cantidad debe ser mayor a 0', 'error');
    if (!form.usuario_realizo_movimiento.trim()) return alert('El usuario es obligatorio', 'error');
    setSaving(true);
    try {
      await api.movimientos.create({ ...form, cantidad: Number(form.cantidad) });
      alert('Movimiento registrado', 'success');
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.movimientos.delete(confirmId);
      alert('Movimiento eliminado', 'success');
      setConfirmId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const getProductoNombre = (id) => productos.find(p => p.id == id)?.nombre || `#${id}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Movimientos de Stock</h1>
          <p className="page-subtitle">HISTORIAL · {items.length} REGISTROS</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Registrar movimiento</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando movimientos...</span></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state">Sin movimientos registrados</div></td></tr>
                ) : items.map(m => (
                  <tr key={m.id}>
                    <td><span style={{fontFamily:'var(--font-mono)', color:'var(--text3)'}}>#{m.id}</span></td>
                    <td>{getProductoNombre(m.producto_id)}</td>
                    <td>
                      <span className={`badge ${m.tipo === 'entrada' ? 'badge-green' : 'badge-danger'}`}>
                        {m.tipo === 'entrada' ? '↑' : '↓'} {m.tipo}
                      </span>
                    </td>
                    <td><span style={{fontFamily:'var(--font-mono)', fontWeight:700}}>{m.cantidad}</span></td>
                    <td>{m.usuario_realizo_movimiento}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text3)'}}>
                      {m.fecha ? new Date(m.fecha).toLocaleString('es-AR') : '—'}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(m.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Registrar movimiento de stock"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field">
              <label>Producto *</label>
              <select value={form.producto_id} onChange={e => setForm(f => ({...f, producto_id: e.target.value}))}>
                <option value="">Seleccioná un producto</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>Tipo *</label>
                <select value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}>
                  <option value="entrada">Entrada ↑</option>
                  <option value="salida">Salida ↓</option>
                </select>
              </div>
              <div className="field">
                <label>Cantidad *</label>
                <input type="number" min="1" value={form.cantidad} onChange={e => setForm(f => ({...f, cantidad: e.target.value}))} placeholder="0" />
              </div>
            </div>
            <div className="field">
              <label>Usuario que realizó el movimiento *</label>
              <input value={form.usuario_realizo_movimiento} onChange={e => setForm(f => ({...f, usuario_realizo_movimiento: e.target.value}))} placeholder="Nombre del usuario" />
            </div>
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message="¿Eliminás este movimiento? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
