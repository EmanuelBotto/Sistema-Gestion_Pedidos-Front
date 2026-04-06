import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Movimientos from './pages/Movimientos';
import Pedidos from './pages/Pedidos';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';

const Icons = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  ),
  productos: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z"/><path d="M8 2v12M2 5l6 3 6-3"/>
    </svg>
  ),
  movimientos: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1v14M4 5l4-4 4 4M4 11l4 4 4-4"/>
    </svg>
  ),
  pedidos: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5"/>
      <path d="M5 5h6M5 8h6M5 11h4"/>
    </svg>
  ),
  clientes: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  ),
  usuarios: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.8 2.2-5 5-5h0"/>
      <circle cx="11.5" cy="10" r="2.5"/><path d="M9 14.5h5M11.5 12v5"/>
    </svg>
  ),
  logo: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color:'#C2CDD5'}}>
      <path d="M10 2l8 4v8l-8 4-8-4V6l8-4z"/><path d="M10 2v18M2 6l8 4 8-4"/>
    </svg>
  ),
};

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: Icons.dashboard,   section: 'GENERAL' },
  { id: 'productos',   label: 'Productos',   icon: Icons.productos,   section: 'INVENTARIO' },
  { id: 'movimientos', label: 'Movimientos', icon: Icons.movimientos, section: 'INVENTARIO' },
  { id: 'pedidos',     label: 'Pedidos',     icon: Icons.pedidos,     section: 'VENTAS' },
  { id: 'clientes',    label: 'Clientes',    icon: Icons.clientes,    section: 'VENTAS' },
  { id: 'usuarios',    label: 'Usuarios',    icon: Icons.usuarios,    section: 'SISTEMA' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    const props = { setPage };
    switch (page) {
      case 'dashboard':   return <Dashboard {...props} />;
      case 'productos':   return <Productos {...props} />;
      case 'movimientos': return <Movimientos {...props} />;
      case 'pedidos':     return <Pedidos {...props} />;
      case 'clientes':    return <Clientes {...props} />;
      case 'usuarios':    return <Usuarios {...props} />;
      default:            return <Dashboard {...props} />;
    }
  };

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo">
          <span style={{ width: 20, height: 20, display: 'flex' }}>{Icons.logo}</span>
          StockControl
        </div>
      </header>

      <nav className="sidebar">
        {sections.map(section => (
          <div key={section}>
            <div className="sidebar-section">{section}</div>
            {NAV.filter(n => n.section === section).map(item => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
