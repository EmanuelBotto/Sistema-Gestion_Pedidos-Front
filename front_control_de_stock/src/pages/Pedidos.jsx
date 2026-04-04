import { useState, useEffect } from 'react';
import { api } from '../api';
import { Modal, ConfirmModal } from '../components/Modal';

const EMPTY_CREATE = { cliente_id: '' };
const ESTADOS = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

export default function Pedidos({ toast }) {
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pedRes, cliRes] = await Promise.all([
        api.pedidos.getAll(),
        api.clientes.getAll(),
      ]);
      setItems(pedRes.data ?? pedRes);
      setClientes(cliRes.data ?? cliRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_CREATE); setEditing(null); setModal('form'); };
  const openEdit = (item) => { setForm({ estado: item.estado || 'pendiente' }); setEditing(item); setModal('edit'); };

  const handleCreate = async () => {
    if (!form.cliente_id) return toast('Seleccioná un cliente', 'error');
    setSaving(true);
    try {
      await api.pedidos.create({ cliente_id: form.cliente_id });
      toast('Pedido creado', 'success');
      setModal(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.estado) return toast('El estado es obligatorio', 'error');
    setSaving(true);
    try {
      await api.pedidos.update(editing.id, { estado: form.estado });
      toast('Estado actualizado', 'success');
      setModal(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.pedidos.delete(confirmId);
      toast('Pedido eliminado', 'success');
      setConfirmId(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const getClienteNombre = (id) => {
    const c = clientes.find(c => c.id == id);
    return c ? c.nombre : `Cliente #${id}`;
  };

  const estadoBadge = (estado) => {
    const map = {
      pendiente: 'badge-warn',
      en_proceso: 'badge-info',
      completado: 'badge-green',
      cancelado: 'badge-danger',
    };
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado?.replace('_', ' ')}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">ÓRDENES · {items.length} TOTAL</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo pedido</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando pedidos...</span></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state">Sin pedidos registrados</div></td></tr>
                ) : items.map(p => (
                  <tr key={p.id}>
                    <td><span style={{fontFamily:'var(--font-mono)', color:'var(--text3)'}}>#{p.id}</span></td>
                    <td>{getClienteNombre(p.cliente_id)}</td>
                    <td>{estadoBadge(p.estado)}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text3)'}}>
                      {p.fecha ? new Date(p.fecha).toLocaleString('es-AR') : '—'}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-warn btn-sm" onClick={() => openEdit(p)}>Estado</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <Modal title="Nuevo pedido" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creando...' : 'Crear pedido'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="field">
              <label>Cliente *</label>
              <select value={form.cliente_id} onChange={e => setForm(f => ({...f, cliente_id: e.target.value}))}>
                <option value="">Seleccioná un cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'edit' && editing && (
        <Modal title={`Actualizar estado — Pedido #${editing.id}`} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar estado'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="field">
              <label>Estado *</label>
              <select value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}>
                {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message={<>¿Eliminás el pedido <strong>#{confirmId}</strong>? Esta acción no se puede deshacer.</>}
          onConfirm={handleDelete}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
