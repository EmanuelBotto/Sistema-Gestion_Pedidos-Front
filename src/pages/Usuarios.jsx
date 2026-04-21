import { useState, useEffect } from 'react';
import { api } from '../api';
import { Modal, ConfirmModal } from '../components/Modal';

const ROLES = ['admin', 'operador', 'cliente'];
const EMPTY = { nombre: '', apellido: '', mail: '', contrasenia: '', rol: 'cliente' };

export default function Usuarios({ }) {
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
      const res = await api.usuarios.getAll();
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
    setForm({ nombre: item.nombre, apellido: item.apellido, mail: item.mail, contrasenia: '', rol: item.rol });
    setEditing(item);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return alert('El nombre es obligatorio', 'error');
    if (!form.apellido.trim()) return alert('El apellido es obligatorio', 'error');
    if (!form.mail.trim()) return alert('El mail es obligatorio', 'error');
    if (!editing && !form.contrasenia.trim()) return alert('La contraseña es obligatoria', 'error');
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.contrasenia) delete payload.contrasenia;
        await api.usuarios.update(editing.id, payload);
        alert('Usuario actualizado', 'success');
      } else {
        await api.usuarios.create(form);
        alert('Usuario creado', 'success');
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
      await api.usuarios.delete(confirmId);
      alert('Usuario eliminado', 'success');
      setConfirmId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const rolBadge = (rol) => {
    const map = { admin: 'badge-danger', operador: 'badge-info', cliente: 'badge-gray' };
    return <span className={`badge ${map[rol] || 'badge-gray'}`}>{rol}</span>;
  };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">ACCESO · {items.length} CUENTAS</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo usuario</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando usuarios...</span></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Mail</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state">Sin usuarios registrados</div></td></tr>
                ) : items.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{u.mail}</td>
                    <td>{rolBadge(u.rol)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-warn btn-sm" onClick={() => openEdit(u)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(u.id)}>Eliminar</button>
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
          title={editing ? 'Editar usuario' : 'Nuevo usuario'}
          onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={f('nombre')} placeholder="Nombre" />
              </div>
              <div className="field">
                <label>Apellido *</label>
                <input value={form.apellido} onChange={f('apellido')} placeholder="Apellido" />
              </div>
            </div>
            <div className="field">
              <label>Mail *</label>
              <input type="email" value={form.mail} onChange={f('mail')} placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                <input type="password" value={form.contrasenia} onChange={f('contrasenia')} placeholder="••••••••" />
              </div>
              <div className="field">
                <label>Rol *</label>
                <select value={form.rol} onChange={f('rol')}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message={<>¿Eliminás al usuario <strong>{items.find(i=>i.id===confirmId)?.nombre}</strong>? Esta acción no se puede deshacer.</>}
          onConfirm={handleDelete}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
