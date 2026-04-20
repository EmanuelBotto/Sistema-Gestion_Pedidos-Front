import { Fragment, useEffect, useMemo, useState } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { Modal } from "../components/Modal";
import { api } from "../api";

const SECTION_META = {
  catalogo:  { title: "Catálogo",            subtitle: "HOME · PRODUCTOS DISPONIBLES" },
  carrito:   { title: "Carrito",              subtitle: "RESUMEN · ITEMS SELECCIONADOS" },
  checkout:  { title: "Checkout",             subtitle: "PAGO · CONFIRMACIÓN" },
  historial: { title: "Historial de compras", subtitle: "PEDIDOS · DETALLE POR COMPRA" },
  perfil:    { title: "Perfil",               subtitle: "DATOS · EDICIÓN DE CONTACTO" },
};

const ESTADO_BADGE = {
  pendiente:  { label: "Pendiente",  cls: "badge badge-warn"    },
  aprobado:   { label: "Aprobado",   cls: "badge badge-success" },
  enviado:    { label: "Enviado",    cls: "badge badge-info"    },
  entregado:  { label: "Entregado",  cls: "badge badge-success" },
  cancelado:  { label: "Cancelado",  cls: "badge badge-danger"  },
};

function EstadoBadge({ estado }) {
  const e = ESTADO_BADGE[estado] ?? { label: estado ?? "pendiente", cls: "badge badge-warn" };
  return <span className={e.cls}>{e.label}</span>;
}

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

  const [detailModalId, setDetailModalId]       = useState(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);
  const [profileForm, setProfileForm]           = useState({ nombre: "", telefono: "", direccion: "", empresa: "" });
  const [savingProfile, setSavingProfile]       = useState(false);
  const [profileMsg, setProfileMsg]             = useState(null); // { type: 'success'|'error', text }
  const [checkingOut, setCheckingOut]           = useState(false);
  const [checkoutError, setCheckoutError]       = useState("");

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
    const mapProductos      = new Map(productos.map((p) => [String(p.id), p.nombre]));
    const detallesPorPedido = new Map();
    detalles.forEach((d) => {
      const key = String(d.pedido);
      if (!detallesPorPedido.has(key)) detallesPorPedido.set(key, []);
      detallesPorPedido.get(key).push({
        cantidad:       Number(d.cantidad)       || 0,
        precioUnitario: Number(d.precio_unitario) || 0,
        subtotal:      (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        nombreProducto: mapProductos.get(String(d.producto)) || `Producto #${d.producto}`,
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

  const carritoCount = carrito.reduce((acc, it) => acc + it.cantidad, 0);

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

  const handleCheckout = async () => {
    if (carrito.length === 0) return;
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const pedidoRes = await api.pedidos.create({ estado: "pendiente" });
      const nuevoPedido = pedidoRes.data ?? pedidoRes;
      if (!nuevoPedido?.id) throw new Error("No se pudo crear el pedido");
      await Promise.all(
        carrito.map((item) =>
          api.detallePedido.create({
            pedido:          nuevoPedido.id,
            producto:        item.id,
            cantidad:        item.cantidad,
            precio_unitario: item.precio,
          })
        )
      );
      setCarrito([]);
      setCheckoutDone(true);
      navigate("/perfil");
    } catch (e) {
      setCheckoutError(e.message || "No se pudo completar la compra. Intentá de nuevo.");
    } finally {
      setCheckingOut(false);
    }
  };

  const openDetailModal  = (id) => { setSelectedProductId(id); setDetailModalId(id); };
  const closeDetailModal = ()    => setDetailModalId(null);

  const handleSaveProfile = async () => {
    if (!clienteActual?.id) return;
    if (!profileForm.nombre.trim())    { setProfileMsg({ type: "error", text: "El nombre es obligatorio" }); return; }
    if (!profileForm.telefono.trim() || !profileForm.direccion.trim()) {
      setProfileMsg({ type: "error", text: "Teléfono y dirección son obligatorios" });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.clientes.update(clienteActual.id, {
        nombre:    profileForm.nombre.trim(),
        mail:      clienteActual.mail,
        telefono:  profileForm.telefono.trim(),
        direccion: profileForm.direccion.trim(),
        empresa:   profileForm.empresa.trim() || "",
      });
      await refreshClientes();
      setProfileMsg({ type: "success", text: "Datos actualizados correctamente" });
    } catch (e) {
      setProfileMsg({ type: "error", text: e.message || "No se pudo guardar" });
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
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
        </div>
        {/* Buscador sólo en catálogo */}
        {segment === "catalogo" && (
          <div className="cv-search-wrap">
            <input
              className="cv-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
            />
          </div>
        )}
        {/* Badge carrito visible en catálogo */}
        {segment === "catalogo" && carritoCount > 0 && (
          <button className="btn btn-outline cv-cart-btn" onClick={() => navigate("/carrito")}>
            🛒 Carrito
            <span className="cv-cart-badge">{carritoCount}</span>
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* ════════════════════════════════════════
          CATÁLOGO
      ════════════════════════════════════════ */}
      {segment === "catalogo" && (
        <>
          {productosFiltrados.length === 0 ? (
            <div className="card">
              <div className="empty-state">No hay productos para mostrar.</div>
            </div>
          ) : (
            <div className="cv-catalog-grid">
              {productosFiltrados.map((p) => (
                <article key={p.id} className="cv-product-card">
                  <div className="cv-product-thumb" aria-hidden>
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 24h48" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="22" cy="38" r="6" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M36 34l16-10v20H36V34z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="cv-product-body">
                    <p className="cv-product-name">{p.nombre}</p>
                    <p className="cv-product-desc">
                      {p.descripcion?.trim() ? p.descripcion : "Sin descripción"}
                    </p>
                    <p className="cv-product-price">${(Number(p.precio) || 0).toFixed(2)}</p>
                    <div className="cv-product-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetailModal(p.id)}>Ver detalle</button>
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(p)}>+ Agregar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
                <div style={{ display: "grid", gap: 12 }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                    {productoModal.descripcion?.trim() || "Sin descripción"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      Estado: <strong style={{ color: "var(--text)" }}>{productoModal.estado || "activo"}</strong>
                    </span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
                      ${(Number(productoModal.precio) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">Producto no disponible.</div>
              )}
            </Modal>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          CARRITO
      ════════════════════════════════════════ */}
      {segment === "carrito" && (
        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <div className="card">
            {carrito.length === 0 ? (
              <div className="empty-state">
                Tu carrito está vacío.{" "}
                <button className="link-button" onClick={() => navigate("/catalogo")}>Ir al catálogo</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio unit.</th>
                      <th>Cantidad</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((it) => (
                      <tr key={it.id}>
                        <td>{it.nombre}</td>
                        <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.8125rem" }}>
                          ${it.precio.toFixed(2)}
                        </td>
                        <td>
                          <div className="cv-qty-control">
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(it.id, it.cantidad - 1)} aria-label="Menos">−</button>
                            <span className="cv-qty-value">{it.cantidad}</span>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => updateQty(it.id, it.cantidad + 1)} aria-label="Más">+</button>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.8125rem", textAlign: "right" }}>
                          ${(it.precio * it.cantidad).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {carrito.length > 0 && (
            <div className="cv-cart-summary">
              <div className="cv-cart-summary-rows">
                <div className="cv-cart-summary-row">
                  <span>Subtotal</span>
                  <span>${carritoResumen.subtotal.toFixed(2)}</span>
                </div>
                <div className="cv-cart-summary-row">
                  <span>Envío</span>
                  <span>${carritoResumen.envio.toFixed(2)}</span>
                </div>
                <div className="cv-cart-summary-row cv-cart-summary-total">
                  <span>Total</span>
                  <span>${carritoResumen.total.toFixed(2)}</span>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/checkout")}>
                Ir a checkout →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          CHECKOUT
      ════════════════════════════════════════ */}
      {segment === "checkout" && (
        <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
          {carrito.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                No hay ítems para pagar.{" "}
                <button className="link-button" onClick={() => navigate("/catalogo")}>Ir al catálogo</button>
              </div>
            </div>
          ) : (
            <>
              {/* Resumen de productos */}
              <div className="card" style={{ padding: "1rem 1.25rem" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, marginTop: 0 }}>
                  RESUMEN DEL PEDIDO
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {carrito.map((it) => (
                    <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span>{it.nombre} <span style={{ color: "var(--text-muted)" }}>×{it.cantidad}</span></span>
                      <span style={{ fontFamily: "var(--font-mono, monospace)" }}>${(it.precio * it.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="cv-cart-summary">
                <div className="cv-cart-summary-rows">
                  <div className="cv-cart-summary-row">
                    <span>Subtotal</span>
                    <span>${carritoResumen.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="cv-cart-summary-row">
                    <span>Envío</span>
                    <span>${carritoResumen.envio.toFixed(2)}</span>
                  </div>
                  <div className="cv-cart-summary-row cv-cart-summary-total">
                    <span>Total</span>
                    <span>${carritoResumen.total.toFixed(2)}</span>
                  </div>
                </div>

                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
                  Cliente: <strong style={{ color: "var(--text)" }}>{clienteActual?.nombre || user?.mail || "Cliente"}</strong>
                  &nbsp;·&nbsp; Pago: Tarjeta (simulado)
                </p>

                {checkoutError && <div className="error-msg" style={{ marginBottom: 12 }}>{checkoutError}</div>}

                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? "Procesando..." : "✓ Confirmar compra"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          HISTORIAL
      ════════════════════════════════════════ */}
      {segment === "historial" && (
        <div className="card">
          {historialPedidos.length === 0 ? (
            <div className="empty-state">No tenés compras registradas.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} />
                    <th>#Pedido</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "center" }}>Items</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPedidos.map((p) => (
                    <Fragment key={p.id}>
                      <tr className={expandedPedidoId === p.id ? "cv-row-expanded" : ""}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon cv-expand-btn"
                            onClick={() => setExpandedPedidoId((id) => (id === p.id ? null : p.id))}
                            aria-expanded={expandedPedidoId === p.id}
                          >
                            {expandedPedidoId === p.id ? "▼" : "▶"}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600 }}>#{p.id}</td>
                        <td style={{ fontSize: "0.8125rem", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted)" }}>
                          {p.fecha ? new Date(p.fecha).toLocaleString("es-AR") : "—"}
                        </td>
                        <td><EstadoBadge estado={p.estado} /></td>
                        <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{p.items.length}</td>
                        <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.875rem", textAlign: "right", fontWeight: 600 }}>
                          ${p.total.toFixed(2)}
                        </td>
                      </tr>
                      {expandedPedidoId === p.id && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, background: "var(--bg)" }}>
                            <div className="cv-detail-panel">
                              <p className="cv-detail-title">Detalle pedido #{p.id}</p>
                              {p.items.length === 0 ? (
                                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>Sin líneas de detalle.</p>
                              ) : (
                                <table style={{ width: "100%", fontSize: "0.8125rem" }}>
                                  <thead>
                                    <tr>
                                      <th>Producto</th>
                                      <th style={{ textAlign: "center" }}>Cant.</th>
                                      <th style={{ textAlign: "right" }}>P. unit.</th>
                                      <th style={{ textAlign: "right" }}>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.items.map((it, idx) => (
                                      <tr key={`${p.id}-${idx}`}>
                                        <td>{it.nombreProducto}</td>
                                        <td style={{ textAlign: "center" }}>{it.cantidad}</td>
                                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>${it.precioUnitario.toFixed(2)}</td>
                                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>${it.subtotal.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          PERFIL
      ════════════════════════════════════════ */}
      {segment === "perfil" && (
        <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
          {checkoutDone && (
            <div className="success">✓ Tu compra fue registrada correctamente.</div>
          )}

          {!clienteActual && (
            <div className="error-msg">
              Tu usuario no tiene un cliente vinculado (<code>cliente_id</code>). Pedile a un administrador que asocie tu cuenta.
            </div>
          )}

          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-h)", margin: "0 0 4px" }}>
                Tus datos
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>
                Podés editar nombre, teléfono, dirección y empresa. El correo no se puede cambiar desde aquí.
              </p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Correo (solo lectura)</label>
                <input value={clienteActual?.mail || user?.mail || ""} disabled readOnly />
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Nombre *</label>
                  <input value={profileForm.nombre} onChange={pf("nombre")} placeholder="Nombre completo" disabled={!clienteActual} />
                </div>
                <div className="field">
                  <label>Empresa</label>
                  <input value={profileForm.empresa} onChange={pf("empresa")} placeholder="Opcional" disabled={!clienteActual} />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Teléfono *</label>
                  <input value={profileForm.telefono} onChange={pf("telefono")} placeholder="+54 11 0000-0000" disabled={!clienteActual} />
                </div>
                <div className="field">
                  <label>Dirección *</label>
                  <input value={profileForm.direccion} onChange={pf("direccion")} placeholder="Calle 123, Ciudad" disabled={!clienteActual} />
                </div>
              </div>

              {profileMsg && (
                <div className={profileMsg.type === "success" ? "success" : "error"}>
                  {profileMsg.type === "success" ? "✓ " : ""}{profileMsg.text}
                </div>
              )}

              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={savingProfile || !clienteActual}
                  onClick={handleSaveProfile}
                  style={{ width: "auto" }}
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
