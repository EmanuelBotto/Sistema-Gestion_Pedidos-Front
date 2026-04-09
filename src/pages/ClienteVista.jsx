import { Fragment, useEffect, useMemo, useState } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { Modal } from "../components/Modal";
import { api } from "../api";

const SECTION_META = {
  catalogo:  { title: "Catálogo",           subtitle: "HOME · PRODUCTOS DISPONIBLES" },
  carrito:   { title: "Carrito",             subtitle: "RESUMEN · ITEMS SELECCIONADOS" },
  checkout:  { title: "Checkout",            subtitle: "PAGO · CONFIRMACION" },
  historial: { title: "Historial de compras", subtitle: "PEDIDOS · DETALLE POR COMPRA" },
  perfil:    { title: "Perfil",              subtitle: "DATOS · EDICION DE CONTACTO" },
};

export default function ClienteVista() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const segment = pathname.split("/").filter(Boolean).pop() || "catalogo";

  const {
    user,
    clientes,
    refreshClientes,
    pedidos,
    detalles,
    productos,
    setSelectedProductId,
    search,
    setSearch,
    carrito,
    setCarrito,
    loading,
    error,
    checkoutDone,
    setCheckoutDone,
  } = useOutletContext();

  const [detailModalId, setDetailModalId]     = useState(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);
  const [profileForm, setProfileForm]         = useState({ nombre: "", telefono: "", direccion: "", empresa: "" });
  const [savingProfile, setSavingProfile]     = useState(false);

  const meta = SECTION_META[segment] || SECTION_META.catalogo;

  // ── cliente vinculado al usuario logueado ────────────────────────────────
  const clienteActual = useMemo(() => {
    const cid = user?.cliente_id;
    if (cid != null && cid !== "") {
      const fromList = clientes.find((c) => String(c.id) === String(cid));
      if (fromList) return fromList;
      if (user?.cliente && String(user.cliente.id) === String(cid)) return user.cliente;
    }
    if (user?.cliente?.id != null) {
      const fromList = clientes.find((c) => String(c.id) === String(user.cliente.id));
      return fromList ?? user.cliente;
    }
    if (user?.mail) {
      return clientes.find((c) => String(c.mail).toLowerCase() === String(user.mail).toLowerCase()) ?? null;
    }
    return null;
  }, [clientes, user]);

  useEffect(() => {
    if (clienteActual) {
      setProfileForm({
        nombre:    clienteActual.nombre    || "",
        telefono:  clienteActual.telefono  || "",
        direccion: clienteActual.direccion || "",
        empresa:   clienteActual.empresa   || "",
      });
    }
  }, [clienteActual]);

  // ── datos derivados ──────────────────────────────────────────────────────
  const productosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        String(p.nombre || "").toLowerCase().includes(q) ||
        String(p.descripcion || "").toLowerCase().includes(q)
    );
  }, [productos, search]);

  const productoModal = useMemo(
    () => (detailModalId == null ? null : productos.find((p) => String(p.id) === String(detailModalId)) || null),
    [productos, detailModalId]
  );

  const pedidosCliente = useMemo(() => {
    if (!clienteActual?.id) return [];
    return pedidos.filter((p) => String(p.cliente_id) === String(clienteActual.id));
  }, [pedidos, clienteActual]);

  const historialPedidos = useMemo(() => {
    const mapProductos     = new Map(productos.map((p) => [String(p.id), p.nombre]));
    const detallesPorPedido = new Map();
    detalles.forEach((d) => {
      const key = String(d.pedido);
      if (!detallesPorPedido.has(key)) detallesPorPedido.set(key, []);
      detallesPorPedido.get(key).push({
        cantidad:        Number(d.cantidad)       || 0,
        precioUnitario:  Number(d.precio_unitario) || 0,
        subtotal:       (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        nombreProducto:  mapProductos.get(String(d.producto)) || `Producto #${d.producto}`,
      });
    });
    return pedidosCliente
      .map((p) => {
        const items = detallesPorPedido.get(String(p.id)) || [];
        return { ...p, items, total: items.reduce((acc, it) => acc + it.subtotal, 0) };
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [detalles, pedidosCliente, productos]);

  const carritoResumen = useMemo(() => {
    const subtotal = carrito.reduce((acc, it) => acc + Number(it.precio) * Number(it.cantidad), 0);
    const envio    = subtotal > 0 ? 3500 : 0;
    return { subtotal, envio, total: subtotal + envio };
  }, [carrito]);

  // ── acciones ─────────────────────────────────────────────────────────────
  const addToCart = (producto) => {
    setCheckoutDone(false);
    setCarrito((prev) => {
      const exists = prev.find((it) => String(it.id) === String(producto.id));
      if (exists) return prev.map((it) => String(it.id) === String(producto.id) ? { ...it, cantidad: it.cantidad + 1 } : it);
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: Number(producto.precio) || 0, cantidad: 1 }];
    });
  };

  const updateQty = (id, nextQty) => {
    if (nextQty <= 0) { setCarrito((prev) => prev.filter((it) => String(it.id) !== String(id))); return; }
    setCarrito((prev) => prev.map((it) => String(it.id) === String(id) ? { ...it, cantidad: nextQty } : it));
  };

  const handleCheckout = () => {
    if (carrito.length === 0) return;
    setCheckoutDone(true);
    setCarrito([]);
    navigate("/perfil");
  };

  const openDetailModal  = (id) => { setSelectedProductId(id); setDetailModalId(id); };
  const closeDetailModal = ()    => setDetailModalId(null);

  const handleSaveProfile = async () => {
    if (!clienteActual?.id) return;
    if (!profileForm.nombre.trim())    { alert("El nombre es obligatorio"); return; }
    if (!profileForm.telefono.trim() || !profileForm.direccion.trim()) { alert("Teléfono y dirección son obligatorios"); return; }
    setSavingProfile(true);
    try {
      await api.clientes.update(clienteActual.id, {
        nombre:    profileForm.nombre.trim(),
        mail:      clienteActual.mail,
        telefono:  profileForm.telefono.trim(),
        direccion: profileForm.direccion.trim(),
        empresa:   profileForm.empresa.trim() || "",
      });
      await refreshClientes();
      alert("Datos actualizados");
    } catch (e) {
      alert(e.message || "No se pudo guardar");
    } finally {
      setSavingProfile(false);
    }
  };

  const pf = (k) => (e) => setProfileForm((prev) => ({ ...prev, [k]: e.target.value }));

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
        </div>
        {segment === "catalogo" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              style={{ width: 220 }}
            />
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* ── CATÁLOGO ── */}
      {segment === "catalogo" && (
        <>
          {/* stats rápidas */}
          <div className="stats-grid">
            <div className="stat-card info">
              <p className="stat-label">Productos</p>
              <p className="stat-value info">{productos.length}</p>
            </div>
            <div className="stat-card warn">
              <p className="stat-label">En carrito</p>
              <p className="stat-value warn">{carrito.reduce((a, i) => a + i.cantidad, 0)}</p>
            </div>
            <div className="stat-card purple">
              <p className="stat-label">Mis pedidos</p>
              <p className="stat-value purple">{pedidosCliente.length}</p>
            </div>
          </div>

          <div className="card">
            {productosFiltrados.length === 0 ? (
              <div className="empty-state">No hay productos para mostrar.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Descripción</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.nombre}</strong></td>
                        <td style={{ color: "var(--text3)", fontSize: "0.82rem", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.descripcion?.trim() || "—"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                          ${(Number(p.precio) || 0).toFixed(2)}
                        </td>
                        <td>{p.estado || "activo"}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-warn btn-sm" onClick={() => openDetailModal(p.id)}>Ver</button>
                            <button className="btn btn-primary btn-sm" onClick={() => addToCart(p)}>+ Carrito</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* modal detalle producto */}
      {detailModalId != null && (
        <Modal
          title={productoModal?.nombre || "Producto"}
          onClose={closeDetailModal}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={closeDetailModal}>Cerrar</button>
              {productoModal && (
                <button type="button" className="btn btn-primary" onClick={() => { addToCart(productoModal); closeDetailModal(); }}>
                  Agregar al carrito
                </button>
              )}
            </>
          }
        >
          {productoModal ? (
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>{productoModal.descripcion?.trim() || "Sin descripción"}</p>
              <p>Estado: <strong>{productoModal.estado || "activo"}</strong></p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700 }}>
                ${(Number(productoModal.precio) || 0).toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="empty-state">Producto no disponible.</div>
          )}
        </Modal>
      )}

      {/* ── CARRITO ── */}
      {segment === "carrito" && (
        <div className="card">
          {carrito.length === 0 ? (
            <div className="empty-state">Tu carrito está vacío.</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio unit.</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((it) => (
                      <tr key={it.id}>
                        <td>{it.nombre}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>${it.precio.toFixed(2)}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(it.id, it.cantidad - 1)} aria-label="Menos">−</button>
                            <span style={{ minWidth: 28, textAlign: "center" }}>{it.cantidad}</span>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(it.id, it.cantidad + 1)} aria-label="Más">+</button>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>${(it.precio * it.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 4px", flexWrap: "wrap", gap: 12 }}>
                <strong>Total: ${carritoResumen.total.toFixed(2)}</strong>
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/checkout")}>
                  Ir a checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CHECKOUT ── */}
      {segment === "checkout" && (
        <div className="card" style={{ padding: 20, maxWidth: 480 }}>
          {carrito.length === 0 ? (
            <div className="empty-state">No hay ítems para pagar. Agregá productos al carrito.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="stat-card">
                  <p className="stat-label">Subtotal</p>
                  <p className="stat-value">${carritoResumen.subtotal.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Envío</p>
                  <p className="stat-value">${carritoResumen.envio.toFixed(2)}</p>
                </div>
                <div className="stat-card info">
                  <p className="stat-label">Total</p>
                  <p className="stat-value info">${carritoResumen.total.toFixed(2)}</p>
                </div>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>
                Cliente: <strong>{clienteActual?.nombre || user?.mail || "Cliente"}</strong>
                &nbsp;·&nbsp; Pago: Tarjeta (simulado)
              </p>
              <button className="btn btn-primary btn-sm" style={{ width: "fit-content" }} onClick={handleCheckout}>
                Confirmar compra
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {segment === "historial" && (
        <div className="card">
          <h2 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.3px" }}>
            Tus pedidos
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }} />
                  <th>#Pedido</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {historialPedidos.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">No tenés compras registradas.</div></td></tr>
                ) : (
                  historialPedidos.map((p) => (
                    <Fragment key={p.id}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setExpandedPedidoId((id) => (id === p.id ? null : p.id))}
                            aria-expanded={expandedPedidoId === p.id}
                          >
                            {expandedPedidoId === p.id ? "▼" : "▶"}
                          </button>
                        </td>
                        <td>#{p.id}</td>
                        <td style={{ fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                          {p.fecha ? new Date(p.fecha).toLocaleString("es-AR") : "—"}
                        </td>
                        <td>{p.estado?.replace("_", " ") || "pendiente"}</td>
                        <td>{p.items.length}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>${p.total.toFixed(2)}</td>
                      </tr>
                      {expandedPedidoId === p.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--surface2)", padding: "10px 16px" }}>
                            <p style={{ fontWeight: 700, fontSize: "0.78rem", marginBottom: 8 }}>
                              Detalle pedido #{p.id}
                            </p>
                            {p.items.length === 0 ? (
                              <p style={{ fontSize: "0.82rem", color: "var(--text3)", margin: 0 }}>Sin líneas de detalle.</p>
                            ) : (
                              <table style={{ width: "100%", fontSize: "0.82rem" }}>
                                <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Cant.</th>
                                    <th>P. unit.</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.items.map((it, idx) => (
                                    <tr key={`${p.id}-${idx}`}>
                                      <td>{it.nombreProducto}</td>
                                      <td>{it.cantidad}</td>
                                      <td>${it.precioUnitario.toFixed(2)}</td>
                                      <td>${it.subtotal.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PERFIL ── */}
      {segment === "perfil" && (
        <div style={{ display: "grid", gap: 16 }}>
          {checkoutDone && (
            <div className="success">✓ Compra realizada correctamente.</div>
          )}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 4, letterSpacing: "-0.3px" }}>
              Tus datos
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginBottom: 16 }}>
              Podés editar nombre, teléfono, dirección y empresa. El correo no se puede cambiar desde aquí.
            </p>
            {!clienteActual && (
              <div className="error-msg" style={{ marginBottom: 16 }}>
                Tu usuario no tiene un cliente vinculado (<code>cliente_id</code>). Pedile a un administrador que asocie tu cuenta.
              </div>
            )}
            <div className="form-grid" style={{ maxWidth: 480 }}>
              <div className="field">
                <label>Correo (solo lectura)</label>
                <input value={clienteActual?.mail || user?.mail || ""} disabled readOnly />
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Nombre *</label>
                  <input value={profileForm.nombre} onChange={pf("nombre")} placeholder="Nombre completo" />
                </div>
                <div className="field">
                  <label>Empresa</label>
                  <input value={profileForm.empresa} onChange={pf("empresa")} placeholder="Opcional" />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Teléfono *</label>
                  <input value={profileForm.telefono} onChange={pf("telefono")} placeholder="+54 11 0000-0000" />
                </div>
                <div className="field">
                  <label>Dirección *</label>
                  <input value={profileForm.direccion} onChange={pf("direccion")} placeholder="Calle 123, Ciudad" />
                </div>
              </div>
              <div className="actions-cell" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={savingProfile || !clienteActual}
                  onClick={handleSaveProfile}
                >
                  {savingProfile ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
