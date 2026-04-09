import { useState, useEffect } from 'react';
import { api } from '../api';
import { Modal, ConfirmModal } from '../components/Modal';

const EMPTY = { nombre: '', mail: '', telefono: '', direccion: '', empresa: '' };

export default function Clientes({ }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.clientes.getAll();
      setItems(res.data ?? res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ nombre: item.nombre, mail: item.mail, telefono: item.telefono, direccion: item.direccion, empresa: item.empresa || '' });
    setEditing(item);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return alert('El nombre es obligatorio', 'error');
    if (!form.mail.trim()) return alert('El mail es obligatorio', 'error');
    if (!form.telefono.trim()) return alert('El teléfono es obligatorio', 'error');
    if (!form.direccion.trim()) return alert('La dirección es obligatoria', 'error');
    setSaving(true);
    try {
      if (editing) {
        await api.clientes.update(editing.id, form);
        alert('Cliente actualizado', 'success');
      } else {
        await api.clientes.create(form);
        alert('Cliente creado', 'success');
      }
      setModal(false);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.clientes.delete(confirmId);
      alert('Cliente eliminado', 'success');
      setConfirmId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">DIRECTORIO · {items.length} REGISTRADOS</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando clientes...</span></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Mail</th>
                  <th>Teléfono</th>
                  <th>Empresa</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">Sin clientes registrados</div></td></tr>
                ) : items.map(c => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{c.mail}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{c.telefono}</td>
                    <td>{c.empresa || <span style={{color:'var(--text3)'}}>—</span>}</td>
                    <td style={{maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.direccion}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-warn btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>Eliminar</button>
                      </div>
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
          title={editing ? 'Editar cliente' : 'Nuevo cliente'}
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={f('nombre')} placeholder="Nombre completo" />
              </div>
              <div className="field">
                <label>Empresa</label>
                <input value={form.empresa} onChange={f('empresa')} placeholder="Empresa (opcional)" />
              </div>
            </div>
            <div className="field">
              <label>Mail *</label>
              <input type="email" value={form.mail} onChange={f('mail')} placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>Teléfono *</label>
                <input value={form.telefono} onChange={f('telefono')} placeholder="+54 11 0000-0000" />
              </div>
              <div className="field">
                <label>Dirección *</label>
                <input value={form.direccion} onChange={f('direccion')} placeholder="Calle 123, Ciudad" />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message={<>¿Eliminás al cliente <strong>{items.find(i=>i.id===confirmId)?.nombre}</strong>? Esta acción no se puede deshacer.</>}
          onConfirm={handleDelete}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
