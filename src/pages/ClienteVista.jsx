import { Fragment, useEffect, useMemo, useState } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { Modal } from "../components/Modal";
import { api } from "../api";

const SECTION_META = {
  catalogo: { title: "Tienda", subtitle: "HOME · PRODUCTOS EN STOCK" },
  pedidos: { title: "Pedidos realizados", subtitle: "PEDIDOS · DETALLE POR COMPRA" },
  perfil: { title: "Perfil", subtitle: "DATOS · EDICION DE CONTACTO" },
};

const ESTADO_BADGE = {
  pendiente:  { label: "Pendiente",  cls: "badge badge-warn"    },
  en_proceso: { label: "En proceso", cls: "badge badge-info"    },
  aprobado:   { label: "Aprobado",   cls: "badge badge-success" },
  enviado:    { label: "Enviado",    cls: "badge badge-info"    },
  completado: { label: "Completado", cls: "badge badge-success" },
  entregado:  { label: "Entregado",  cls: "badge badge-success" },
  cancelado:  { label: "Cancelado",  cls: "badge badge-danger"  },
};

function EstadoBadge({ estado }) {
  const e = ESTADO_BADGE[estado] ?? { label: estado ?? "pendiente", cls: "badge badge-warn" };
  return <span className={e.cls}>{e.label}</span>;
}

export default function ClienteVista() {
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
    loading,
    error,
    refreshTiendaData,
  } = useOutletContext();

  const [detailModalId, setDetailModalId]       = useState(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);
  const [profileForm, setProfileForm]           = useState({ nombre: "", telefono: "", direccion: "", empresa: "" });
  const [savingProfile, setSavingProfile]       = useState(false);
  const [profileMsg, setProfileMsg]             = useState(null); // { type: 'success'|'error', text }
  const [carrito, setCarrito]                   = useState({});
  const [savingPedido, setSavingPedido]         = useState(false);
  const [pedidoMsg, setPedidoMsg]               = useState(null); // { type: 'success'|'error', text }

  const meta = SECTION_META[segment] || SECTION_META.catalogo;
  const fmtMoney = (value) => `$${(Number(value) || 0).toFixed(2)}`;

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
    const enStock = productos.filter((p) => {
      if (Number.isFinite(Number(p.stock))) return Number(p.stock) > 0;
      if (Number.isFinite(Number(p.cantidad))) return Number(p.cantidad) > 0;
      if (Number.isFinite(Number(p.stock_actual))) return Number(p.stock_actual) > 0;
      const estado = String(p.estado || "").toLowerCase();
      return estado !== "agotado" && estado !== "inactivo";
    });
    if (!q) return enStock;
    return enStock.filter(
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
    const clienteIdActual = clienteActual?.id ?? user?.cliente_id ?? user?.cliente?.id ?? null;
    if (!clienteIdActual) {
      // Si la API ya filtra por token de cliente, mostramos lo recibido.
      return pedidos;
    }
    return pedidos.filter((p) => {
      const pedidoClienteId = p?.cliente_id ?? p?.cliente ?? p?.id_cliente ?? null;
      return String(pedidoClienteId) === String(clienteIdActual);
    });
  }, [pedidos, clienteActual, user]);

  const historialPedidos = useMemo(() => {
    const mapProductos      = new Map(productos.map((p) => [String(p.id), p.nombre]));
    const detallesPorPedido = new Map();
    detalles.forEach((d) => {
      const pedidoRef = d?.pedido ?? d?.pedido_id ?? d?.id_pedido;
      const productoRef = d?.producto ?? d?.producto_id ?? d?.id_producto;
      const key = String(pedidoRef);
      if (!detallesPorPedido.has(key)) detallesPorPedido.set(key, []);
      detallesPorPedido.get(key).push({
        cantidad:       Number(d.cantidad)       || 0,
        precioUnitario: Number(d.precio_unitario) || 0,
        subtotal:      (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0),
        nombreProducto: mapProductos.get(String(productoRef)) || `Producto #${productoRef ?? "N/D"}`,
      });
    });
    return pedidosCliente
      .map((p) => {
        const items = detallesPorPedido.get(String(p.id)) || [];
        return { ...p, items, total: items.reduce((acc, it) => acc + it.subtotal, 0) };
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [detalles, pedidosCliente, productos]);

  const carritoItems = useMemo(
    () =>
      Object.entries(carrito)
        .map(([productId, cantidad]) => {
          const producto = productos.find((p) => String(p.id) === String(productId));
          if (!producto || cantidad <= 0) return null;
          const precioUnitario = Number(producto.precio) || 0;
          return {
            id: producto.id,
            nombre: producto.nombre || `Producto #${productId}`,
            cantidad,
            precioUnitario,
            subtotal: precioUnitario * cantidad,
          };
        })
        .filter(Boolean),
    [carrito, productos]
  );

  const carritoTotal = useMemo(
    () => carritoItems.reduce((acc, it) => acc + it.subtotal, 0),
    [carritoItems]
  );

  const metricasCliente = useMemo(() => {
    const totalPedidos = historialPedidos.length;
    const totalGastado = historialPedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const pendientes = historialPedidos.filter((p) =>
      ["pendiente", "en_proceso", "aprobado", "enviado"].includes(String(p.estado || "").toLowerCase())
    ).length;
    const ultimoPedido = historialPedidos[0] || null;
    return {
      totalPedidos,
      totalGastado,
      pendientes,
      ultimoPedidoFecha: ultimoPedido?.fecha ? new Date(ultimoPedido.fecha).toLocaleDateString("es-AR") : "Sin pedidos",
    };
  }, [historialPedidos]);

  const pedidosResumen = useMemo(() => {
    const total = historialPedidos.length;
    const totalGastado = historialPedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const promedio = total > 0 ? totalGastado / total : 0;
    const ultimoEstado = total > 0 ? (historialPedidos[0]?.estado || "pendiente") : null;
    return { total, totalGastado, promedio, ultimoEstado };
  }, [historialPedidos]);

  // ── acciones ─────────────────────────────────────────────────────────────
  const openDetailModal  = (id) => { setSelectedProductId(id); setDetailModalId(id); };
  const closeDetailModal = ()    => setDetailModalId(null);
  const setCarritoCantidad = (productId, cantidad) => {
    setCarrito((prev) => {
      const safeCantidad = Math.max(0, Number(cantidad) || 0);
      if (safeCantidad === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: safeCantidad };
    });
    setPedidoMsg(null);
  };
  const addToCarrito = (productId) => {
    setCarrito((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    setPedidoMsg(null);
  };
  const clearCarrito = () => setCarrito({});

  const handleCrearPedido = async () => {
    if (carritoItems.length === 0 || savingPedido) return;
    setSavingPedido(true);
    setPedidoMsg(null);
    try {
      const clienteId = clienteActual?.id ?? user?.cliente_id ?? user?.cliente?.id ?? null;
      const pedidoRes = await api.pedidos.create({ cliente_id: clienteId, estado: "pendiente" });
      const pedidoCreado = pedidoRes?.data ?? pedidoRes;
      if (!pedidoCreado?.id) throw new Error("No se pudo crear el pedido");

      await Promise.all(
        carritoItems.map((it) =>
          api.detallePedido.create({
            pedido: pedidoCreado.id,
            producto: it.id,
            cantidad: it.cantidad,
            precio_unitario: it.precioUnitario,
          })
        )
      );

      clearCarrito();
      await refreshTiendaData?.();
      setPedidoMsg({ type: "success", text: `Pedido #${pedidoCreado.id} generado correctamente` });
    } catch (e) {
      setPedidoMsg({ type: "error", text: e.message || "No se pudo crear el pedido" });
    } finally {
      setSavingPedido(false);
    }
  };

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
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* ════════════════════════════════════════
          CATÁLOGO
      ════════════════════════════════════════ */}
      {segment === "catalogo" && (
        <>
          <div className="cv-summary-inline">
            <span><strong>{metricasCliente.totalPedidos}</strong> pedidos</span>
            <span>·</span>
            <span><strong>{fmtMoney(metricasCliente.totalGastado)}</strong> comprado</span>
            <span>·</span>
            <span><strong>{metricasCliente.pendientes}</strong> en curso</span>
            <span>·</span>
            <span>Ultimo: <strong>{metricasCliente.ultimoPedidoFecha}</strong></span>
          </div>

          {pedidoMsg && (
            <div className={`cv-inline-alert ${pedidoMsg.type === "success" ? "success" : "error"}`} style={{ marginBottom: 12 }}>
              {pedidoMsg.type === "success" ? "✓ " : ""}
              {pedidoMsg.text}
            </div>
          )}

          <div className="cv-catalog-layout">
            <div>
              {productosFiltrados.length === 0 ? (
                <div className="card">
                  <div className="empty-state">No hay productos para mostrar.</div>
                </div>
              ) : (
                <div className="cv-catalog-grid">
                  {productosFiltrados.map((p) => (
                    <article
                      key={p.id}
                      className="cv-product-card cv-product-card-clickable"
                      onClick={() => openDetailModal(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetailModal(p.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalle de ${p.nombre || "producto"}`}
                    >
                      <div className="cv-product-thumb" aria-hidden>
                        {p.imagen ? (
                          <img
                            src={p.imagen}
                            alt={p.nombre}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                          />
                        ) : (
                          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 24h48" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="22" cy="38" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M36 34l16-10v20H36V34z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                      <div className="cv-product-body">
                        <div className="cv-product-head">
                          <p className="cv-product-name">{p.nombre}</p>
                          <span className="badge badge-info">Disponible</span>
                        </div>
                        <p className="cv-product-desc">
                          {p.descripcion?.trim() ? p.descripcion : "Sin descripción"}
                        </p>
                        <div className="cv-product-meta">
                          <p className="cv-product-price">{fmtMoney(p.precio)}</p>
                          <span className="cv-product-stock">
                            Stock: {Number(p.stock ?? p.cantidad ?? p.stock_actual) || "N/D"}
                          </span>
                        </div>
                        <div className="cv-product-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCarrito(p.id);
                            }}
                          >
                            Agregar al carrito
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="cv-cart-sticky-wrap">
              <div className="card cv-cart-card">
                <div className="cv-cart-header">
                  <h2 className="cv-cart-title">Carrito</h2>
                  <div className="cv-cart-header-actions">
                    <span className="badge badge-gray">{carritoItems.length} items</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={carritoItems.length === 0 || savingPedido}
                      onClick={clearCarrito}
                      style={{ width: "auto" }}
                    >
                      Vaciar
                    </button>
                  </div>
                </div>

              {carritoItems.length === 0 ? (
                <div className="cv-cart-empty">
                  <p className="cv-cart-empty-title">Tu carrito esta vacio</p>
                  <p className="cv-cart-empty-text">Agrega productos desde el catalogo para continuar.</p>
                </div>
              ) : (
                <>
                  <div className="cv-cart-list">
                    {carritoItems.map((it) => (
                      <article key={it.id} className="cv-cart-item">
                        <div className="cv-cart-item-top">
                          <p className="cv-cart-item-name">{it.nombre}</p>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCarritoCantidad(it.id, 0)} title="Quitar">
                            ✕
                          </button>
                        </div>
                        <div className="cv-cart-item-meta">
                          <span>{fmtMoney(it.precioUnitario)} c/u</span>
                          <span className="cv-cart-item-subtotal">{fmtMoney(it.subtotal)}</span>
                        </div>
                        <div className="cv-qty-controls">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCarritoCantidad(it.id, it.cantidad - 1)}>−</button>
                          <span>{it.cantidad}</span>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCarritoCantidad(it.id, it.cantidad + 1)}>+</button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="cv-cart-footer">
                    <p className="cv-cart-total">Total: {fmtMoney(carritoTotal)}</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "auto" }}
                      disabled={savingPedido || carritoItems.length === 0}
                      onClick={handleCrearPedido}
                    >
                      {savingPedido ? "Generando pedido..." : "Realizar pedido"}
                    </button>
                  </div>
                </>
              )}
              </div>
            </aside>
          </div>

          {/* modal detalle producto */}
          {detailModalId != null && (
            <Modal
              title={productoModal?.nombre || "Producto"}
              onClose={closeDetailModal}
              footer={
                <>
                  <button type="button" className="btn btn-ghost" onClick={closeDetailModal}>Cerrar</button>
                </>
              }
            >
              {productoModal ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div className="cv-product-thumb" aria-hidden style={{ width: "100%", maxWidth: 280, justifySelf: "center" }}>
                    {productoModal.imagen ? (
                      <img
                        src={productoModal.imagen}
                        alt={productoModal.nombre}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                      />
                    ) : (
                      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 24h48" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="22" cy="38" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M36 34l16-10v20H36V34z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
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
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Stock disponible:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {Number(productoModal.stock ?? productoModal.cantidad ?? productoModal.stock_actual) || "N/D"}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="empty-state">Producto no disponible.</div>
              )}
            </Modal>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          PEDIDOS
      ════════════════════════════════════════ */}
      {segment === "pedidos" && (
        <div className="cv-pedidos-stack">
          <div className="cv-pedidos-hero">
            <article className="cv-pedidos-kpi">
              <span>Pedidos</span>
              <strong>{pedidosResumen.total}</strong>
            </article>
            <article className="cv-pedidos-kpi">
              <span>Total gastado</span>
              <strong>{fmtMoney(pedidosResumen.totalGastado)}</strong>
            </article>
            <article className="cv-pedidos-kpi">
              <span>Ticket promedio</span>
              <strong>{fmtMoney(pedidosResumen.promedio)}</strong>
            </article>
            <article className="cv-pedidos-kpi">
              <span>Ultimo estado</span>
              <strong>{pedidosResumen.ultimoEstado ? <EstadoBadge estado={pedidosResumen.ultimoEstado} /> : "Sin pedidos"}</strong>
            </article>
          </div>

          <div className="card">
            {historialPedidos.length === 0 ? (
              <div className="cv-pedidos-empty">
                <p className="cv-pedidos-empty-title">Todavia no tenes pedidos realizados</p>
                <p className="cv-pedidos-empty-text">Cuando confirmes tu primera compra, vas a poder seguir su estado desde esta seccion.</p>
              </div>
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
                                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>Sin lineas de detalle.</p>
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
        </div>
      )}

      {/* ════════════════════════════════════════
          PERFIL
      ════════════════════════════════════════ */}
      {segment === "perfil" && (
        <div className="cv-profile-wrap">
          {!clienteActual && (
            <div className="error-msg">
              Tu usuario no tiene un cliente vinculado (<code>cliente_id</code>). Pedile a un administrador que asocie tu cuenta.
            </div>
          )}

          <div className="card cv-profile-card">
            <div className="cv-profile-head">
              <div className="cv-profile-avatar" aria-hidden>
                {(profileForm.nombre?.trim()?.[0] || user?.mail?.[0] || "C").toUpperCase()}
              </div>
              <div>
                <h2 className="cv-profile-title">Tus datos</h2>
                <p className="cv-profile-subtitle">
                  Mantené tu información actualizada para agilizar confirmaciones y entregas.
                </p>
              </div>
            </div>

            <p className="cv-profile-note">
                Podés editar nombre, teléfono, dirección y empresa. El correo no se puede cambiar desde aquí.
            </p>

            <div className="form-grid">
              <div className="field">
                <label>Correo (solo lectura)</label>
                <input className="cv-readonly-input" value={clienteActual?.mail || user?.mail || ""} disabled readOnly />
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
                <div className={`cv-inline-alert ${profileMsg.type === "success" ? "success" : "error"}`}>
                  {profileMsg.type === "success" ? "✓ " : ""}{profileMsg.text}
                </div>
              )}

              <div className="cv-profile-actions">
                <button
                  type="button"
                  className="btn btn-primary"
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
