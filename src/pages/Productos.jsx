import { useState, useEffect } from 'react';
import { api } from '../api';
import { Modal, ConfirmModal } from '../components/Modal';

const EMPTY = { nombre: '', descripcion: '', precio: '', estado: 'activo', imagen: '' };

export default function Productos({ }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (file) => {
    if (!file) {
      setForm((f) => ({ ...f, imagen: '' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, imagen: typeof reader.result === 'string' ? reader.result : '' }));
    };
    reader.onerror = () => alert('No se pudo leer la imagen');
    reader.readAsDataURL(file);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.productos.getAll();
      setItems(res.data ?? res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setModal('form'); };
  const openEdit = (item) => {
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio,
      estado: item.estado || 'activo',
      imagen: item.imagen || '',
    });
    setEditing(item);
    setModal('form');
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return alert('El nombre es obligatorio', 'error');
    if (form.precio === '' || isNaN(form.precio) || Number(form.precio) < 0) return alert('Precio inválido', 'error');
    setSaving(true);
    try {
      const payload = { ...form, precio: Number(form.precio) };
      if (editing) {
        await api.productos.update(editing.id, payload);
        alert('Producto actualizado', 'success');
      } else {
        await api.productos.create(payload);
        alert('Producto creado', 'success');
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.productos.delete(confirmId);
      alert('Producto eliminado', 'success');
      setConfirmId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const estadoBadge = (estado) => {
    const map = { activo: 'badge-green', inactivo: 'badge-danger', agotado: 'badge-warn' };
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">CATÁLOGO · {items.length} ITEMS</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo producto</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando productos...</span></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">Sin productos registrados</div></td></tr>
                ) : items.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.imagen ? (
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ) : (
                        <span style={{ color: 'var(--text3)' }}>—</span>
                      )}
                    </td>
                    <td>{p.nombre}</td>
                    <td>{p.descripcion || <span style={{color:'var(--text3)'}}>—</span>}</td>
                    <td><span style={{color:'var(--accent)', fontFamily:'var(--font-mono)'}}>${Number(p.precio).toFixed(2)}</span></td>
                    <td>{estadoBadge(p.estado)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-warn btn-sm" onClick={() => openEdit(p)}>Editar</button>
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
        <Modal
          title={editing ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field">
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} placeholder="Nombre del producto" />
            </div>
            <div className="field">
              <label>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} placeholder="Descripción opcional" />
            </div>
            <div className="field">
              <label>Imagen (base64)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />
              {form.imagen && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={form.imagen}
                    alt="Vista previa"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
            <div className="form-grid form-grid-2">
              <div className="field">
                <label>Precio *</label>
                <input type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm(f => ({...f, precio: e.target.value}))} placeholder="0.00" />
              </div>
              <div className="field">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="agotado">Agotado</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmModal
          message={<>¿Eliminás el producto <strong>{items.find(i=>i.id===confirmId)?.nombre}</strong>? Esta acción no se puede deshacer.</>}
          onConfirm={handleDelete}
          onClose={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
