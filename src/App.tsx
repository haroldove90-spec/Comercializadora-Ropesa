import { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase } from './data';
import { User, Customer, Product, Quote, Order, InventoryAdjustment } from './types';
import AdminDashboard from './components/AdminDashboard';
import VentasDashboard from './components/VentasDashboard';
import AlmacenDashboard from './components/AlmacenDashboard';
import { 
  Shield, Users, Package, HelpCircle, RefreshCw, 
  Map, Check, X, AlertTriangle, UserCheck, TrendingUp
} from 'lucide-react';

export default function App() {
  // 1. Core Reactive Database States
  const [db, setDb] = useState(() => loadDatabase());
  const [users, setUsers] = useState<User[]>(db.users);
  const [customers, setCustomers] = useState<Customer[]>(db.customers);
  const [products, setProducts] = useState<Product[]>(db.products);
  const [quotes, setQuotes] = useState<Quote[]>(db.quotes);
  const [orders, setOrders] = useState<Order[]>(db.orders);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>(db.adjustments);

  // 2. Active Session Configuration
  const [currentUser, setCurrentUser] = useState<User>(db.users[0]); // Default to Laura Gómez (Admin)
  const [showMatrixHelp, setShowMatrixHelp] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'module'>('home'); // Home by default where role selector lives separated

  // Synchronize dynamic local updates back into Database automatically
  useEffect(() => {
    saveDatabase({ users, customers, products, quotes, orders, adjustments });
  }, [users, customers, products, quotes, orders, adjustments]);

  // Restart data simulator to original factory values
  const handleResetDatabase = () => {
    if (confirm('¿Desea restablecer todos los registros (Pedidos, Ventas, Clientes) a los valores de muestra originales?')) {
      localStorage.clear();
      const fresh = loadDatabase();
      setUsers(fresh.users);
      setCustomers(fresh.customers);
      setProducts(fresh.products);
      setQuotes(fresh.quotes);
      setOrders(fresh.orders);
      setAdjustments(fresh.adjustments);
      setCurrentUser(fresh.users[0]);
      setCurrentView('home');
    }
  };

  // Change user session and role
  const handleProfileSwitch = (selectedUser: User) => {
    // Check if the user is active
    if (!selectedUser.active) {
      alert(`El usuario "${selectedUser.name}" está inactivo actualmente. Puedes reactivarlo en el Panel de Administrador.`);
      return;
    }
    setCurrentUser(selectedUser);
    setCurrentView('module');
  };

  return (
    <div id="erp-root" className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-red-600/10 selection:text-red-600 leading-normal">
      
      {/* 1. TOP GLOBAL EXECUTIVE HEADER BAR */}
      <header className="bg-white border-b border-gray-200 text-gray-900 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4rem] sm:h-16 flex-wrap gap-4 py-3 sm:py-0">
            {/* Branding logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setCurrentView('home')}
              title="Ir al Inicio - Selector de Roles"
            >
              <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-inner font-extrabold flex items-center h-9 w-9 justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-gray-900 font-display">COMERCIALIZADORA ROPESA</h1>
                <p className="text-[10px] text-red-600 font-mono tracking-wider uppercase font-black">Plataforma ERP Corporativa</p>
              </div>
            </div>
 
            {/* Header actions & Portal Navigation */}
            <div className="flex items-center gap-3">
              {currentView === 'module' && (
                <button
                  id="btn-back-home"
                  onClick={() => setCurrentView('home')}
                  className="bg-black hover:bg-gray-900 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.03] active:scale-[0.98]"
                  title="Cambiar de Rol Operativo"
                >
                  <span className="font-bold">← Volver al Inicio</span>
                  <span className="hidden md:inline text-[9px] bg-red-600/20 px-1.5 py-0.5 rounded text-red-500 font-mono">CAMBIAR ROL</span>
                </button>
              )}
 
              {/* Matrix view trigger */}
              <button 
                id="btn-trigger-matrix"
                onClick={() => setShowMatrixHelp(!showMatrixHelp)}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  showMatrixHelp 
                  ? 'bg-red-50 text-red-700 border-red-200 font-bold' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title="Ver Matriz de Permisos"
              >
                <HelpCircle size={15} />
                <span className="hidden sm:inline font-semibold">Matriz de Control</span>
              </button>
 
              {/* Factory reset button */}
              <button 
                id="btn-factory-reset"
                onClick={handleResetDatabase}
                className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                title="Restablecer base de datos completa"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>
 
      {/* 2. DYNAMIC PERMISSIONS VISUAL HEATMAP PANEL */}
      {showMatrixHelp && (
        <section id="permissions-matrix-guide" className="bg-white text-gray-800 py-6 border-b border-gray-200 animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Map className="text-red-600" size={18} />
                <h2 className="font-bold text-sm sm:text-base tracking-tight text-gray-950">Matriz de Control Operativo - Roles y Permisos</h2>
              </div>
              <button 
                onClick={() => setShowMatrixHelp(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X size={18} />
              </button>
            </div>
 
            <p className="text-xs text-gray-550 mb-4 leading-relaxed">
              La plataforma implementa un riguroso control de acceso basado en perfiles (RBAC) para el cuidado fiscal y la protección de márgenes comerciales de proveedor. 
              Utiliza el menú de la barra superior para cambiar de perfil de simulación y auditar el comportamiento de cada módulo de acuerdo a esta tabla:
            </p>
 
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-650 font-semibold uppercase tracking-wider text-[10px] border-b border-gray-200">
                    <th className="px-4 py-2.5">Módulo / Acción Operativa</th>
                    <th className="px-4 py-2.5 text-red-600 font-bold">Administrador (Laura G.)</th>
                    <th className="px-4 py-2.5 text-gray-800 font-semibold">Ventas (Carlos M.)</th>
                    <th className="px-4 py-2.5 font-bold text-gray-900">Almacén (Miguel R.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 bg-white">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Dar de alta clientes</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Crear Cotizaciones comerciales</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Aprobar Pedidos para envío</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Preparar / Despachar Pedidos (Picking)</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-gray-500">Solo ver estatus</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">✓ Sí</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Modificar Stock manualmente</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                    <td className="px-4 py-2 text-red-600 font-semibold">✓ Sí</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Ver Costos Confidenciales y Márgenes $</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">Crear y Editar usuarios</td>
                    <td className="px-4 py-2 text-red-600 font-bold bg-red-50/50">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                    <td className="px-4 py-2 text-rose-600/70">✗ No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 3. DYNAMIC BODY CONTAINER BASED ON ACTIVE SESSION ROLE OR PORTAL HOME */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'home' ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Elegant Welcome Hero */}
            <div className="text-center py-12 px-6 bg-white rounded-2xl border border-gray-200 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <span className="inline-flex px-3 py-1 bg-red-150/10 text-red-600 text-xs font-bold rounded-full font-mono uppercase tracking-widest border border-red-200">
                  Panel de Distribución y CRM Industrial
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight font-display">
                  Portal de Simulación Corporativa Ropesa
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                  Bienvenido al sistema integrado de Comercializadora Ropesa. Para simular los flujos de administración fiscal, CRM o almacén, seleccione una opción a continuación. Puede volver a esta pantalla usando el botón del encabezado.
                </p>
              </div>
            </div>

            {/* Portal Role Access Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="text-red-650" size={18} />
                <h3 className="text-sm uppercase font-extrabold tracking-wider font-display text-gray-900">
                  Seleccione un Portal de Trabajo para Simular
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MÓDULO 1: ADMINISTRADOR */}
                {(() => {
                  const uAdmin = users.find(u => u.role === 'Administrador') || users[0];
                  return (
                    <div 
                      id="card-portal-admin"
                      onClick={() => handleProfileSwitch(uAdmin)}
                      className="p-6 rounded-xl border border-gray-900 bg-gray-950 hover:border-red-600 hover:ring-2 hover:ring-red-600/10 transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-lg hover:-translate-y-1 transform duration-200 overflow-hidden"
                    >
                      {/* Decorative red glow pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-300" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-red-600 rounded-xl text-white shadow-md group-hover:scale-110 transition-all">
                            <Users size={22} />
                          </div>
                          <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            DIRECTORIO MASTER
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white font-display group-hover:text-red-500 transition-colors">
                          Módulo Administrativo
                        </h4>
                        <p className="text-xs text-gray-300 mt-2 leading-relaxed font-sans font-medium">
                          Control financiero completo. Audite márgenes de ganancia, costos unitarios confidenciales de proveedor, administre usuarios comerciales y visualice gráficas de desempeño global.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-900 flex items-center justify-between relative z-10">
                        <div className="text-[11px] text-gray-400">
                          Operador: <span className="text-white font-bold">Laura Gómez</span>
                        </div>
                        <span className="text-xs font-extrabold text-red-500 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
                          Entrar Módulo →
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* MÓDULO 2: VENTAS & CRM */}
                {(() => {
                  const uVentas = users.find(u => u.role === 'Ventas') || users[1] || users[0];
                  return (
                    <div 
                      id="card-portal-ventas"
                      onClick={() => handleProfileSwitch(uVentas)}
                      className="p-6 rounded-xl border border-red-200 bg-gradient-to-br from-red-50/20 via-white to-white hover:border-red-600 hover:ring-2 hover:ring-red-600/10 transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-md hover:-translate-y-1 transform duration-200 overflow-hidden"
                    >
                      {/* Decorative micro strip */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-red-100 rounded-xl text-red-605 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                            <TrendingUp size={22} />
                          </div>
                          <span className="text-[10px] bg-red-600 text-white px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            CRM & EMISIÓN
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-955 font-display group-hover:text-red-600 transition-colors">
                          Módulo Ventas & CRM
                        </h4>
                        <p className="text-xs text-gray-650 mt-2 leading-relaxed font-sans font-medium">
                          Gestione relaciones con clientes comerciales. Capture solicitudes, emita propuestas comerciales / cotizaciones automatizadas y autorice pedidos urgentes para el almacén.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-red-100 flex items-center justify-between">
                        <div className="text-[11px] text-gray-600">
                          Operador: <span className="text-red-700 font-bold">Carlos Mendoza</span>
                        </div>
                        <span className="text-xs font-extrabold text-red-650 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
                          Entrar Módulo →
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* MÓDULO 3: ALMACÉN LOGÍSTICA */}
                {(() => {
                  const uAlmacen = users.find(u => u.role === 'Almacén') || users[2] || users[0];
                  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
                  return (
                    <div 
                      id="card-portal-almacen"
                      onClick={() => handleProfileSwitch(uAlmacen)}
                      className="p-6 rounded-xl border border-red-100 bg-red-50/60 hover:bg-white hover:border-red-650 hover:ring-2 hover:ring-red-600/10 transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-sm hover:shadow-md hover:-translate-y-1 transform duration-200 overflow-hidden"
                    >
                      {/* Decorative border bottom alert bar */}
                      {lowStockCount > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-600 animate-pulse" />
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-white rounded-xl text-red-600 shadow-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all">
                            <Package size={22} />
                          </div>
                          <span className="text-[10px] bg-red-200/50 text-red-800 border border-red-300 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            BODEGA & PACKING
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-red-950 font-display group-hover:text-red-700 transition-colors">
                          Módulo Almacén & Bodega
                        </h4>
                        <p className="text-xs text-gray-700 mt-2 leading-relaxed font-sans font-medium">
                          Operación rápida de almacén físico. Complete surtidos de pedidos pendientes (picking y packing express), asigne guías electrónicas y realice auditoría / ajustes manuales de stock.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-red-200/60 flex items-center justify-between">
                        <div className="text-[11px] text-gray-600 flex items-center gap-1.5">
                          Operador: <span className="text-gray-900 font-extrabold">Miguel Rivas</span>
                          {lowStockCount > 0 && (
                            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" title="Alertas de Stock activas" />
                          )}
                        </div>
                        <span className="text-xs font-extrabold text-red-650 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
                          Entrar Módulo →
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Birds-Eye Stats Panel */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-gray-900 p-6 rounded-2xl shadow-xl text-white">
              <h4 className="text-xs uppercase font-extrabold tracking-wider font-mono text-red-400 mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" /> 
                Métricas del Sistema Integradas en Tiempo Real
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-950/40 rounded-xl border border-red-900/40 relative overflow-hidden group hover:border-red-600 transition-colors">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-600/10 rounded-full blur-lg" />
                  <span className="text-xs text-red-300 block font-medium">Clientes Autorizados</span>
                  <strong className="text-3xl font-extrabold text-red-500 font-display mt-1 block">
                    {customers.length}
                  </strong>
                  <span className="text-[9px] text-gray-400 block mt-1 font-mono">Sincronizado con CRM</span>
                </div>
                
                <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800/80 relative overflow-hidden hover:border-red-600/50 transition-colors">
                  <span className="text-xs text-gray-400 block font-medium">Catálogo SKU</span>
                  <strong className="text-3xl font-extrabold text-white font-display mt-1 block">
                    {products.length}
                  </strong>
                  <span className="text-[9px] text-gray-500 block mt-1 font-mono">Productos listados</span>
                </div>

                <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800/80 relative overflow-hidden hover:border-red-600/50 transition-colors">
                  <span className="text-xs text-gray-400 block font-medium">Pedidos Registrados</span>
                  <strong className="text-3xl font-extrabold text-red-500 font-display mt-1 block">
                    {orders.length}
                  </strong>
                  <span className="text-[9px] text-gray-500 block mt-1 font-mono">Operaciones de flujo</span>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  products.filter(p => p.stock <= p.minStock).length > 0 
                  ? 'bg-red-600/20 border-red-500 text-rose-200' 
                  : 'bg-gray-900/60 border-gray-800 text-gray-400'
                }`}>
                  <span className="text-xs block font-medium">Alertas Stock Mínimo</span>
                  <strong className={`text-3xl font-extrabold font-display mt-1 block ${
                    products.filter(p => p.stock <= p.minStock).length > 0 ? 'text-red-505 font-black text-rose-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse' : 'text-gray-400'
                  }`}>
                    {products.filter(p => p.stock <= p.minStock).length}
                  </strong>
                  <span className="text-[9px] block mt-1 font-mono text-gray-400">Requieren reabastecimiento</span>
                </div>
              </div>
            </div>

            {/* Brief Interactive Permission table right at home */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Map className="text-red-600" size={16} />
                <h4 className="text-xs uppercase font-extrabold tracking-wider font-mono text-gray-900">
                  Auditoría Rápida de Privilegios Corporativos
                </h4>
              </div>
              <p className="text-xs text-gray-600 mb-4 leading-normal font-sans font-medium">
                Comprobador fiscal integrado de Ropesa. Dependiendo de las credenciales del portal actual, las acciones críticas cambiarán:
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[10px]">
                      <th className="px-4 py-3">Proceso Operativo</th>
                      <th className="px-4 py-3 text-red-600 font-extrabold">Director Administrativo</th>
                      <th className="px-4 py-3 text-gray-950 font-bold">Ejecutivo Comercial</th>
                      <th className="px-4 py-3 text-gray-700 font-bold">Operaciones Bodega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-[11px]">
                    <tr>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">Dar de Alta Catálogo y Clientes</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Permitido</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Permitido</td>
                      <td className="px-4 py-2.5 text-red-700/60 font-semibold bg-gray-50/30">✗ Denegado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">Emitir Cotizaciones e Impuestos</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Permitido</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Permitido</td>
                      <td className="px-4 py-2.5 text-red-700/60 font-semibold bg-gray-50/30">✗ Denegado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">Picking / Surtido Físico de Pedidos</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Surtido Máximo</td>
                      <td className="px-4 py-2.5 text-gray-500">Solo ver estatus</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Surtido Máximo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">Ver Márgenes $ y Costo Proveedor</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold bg-red-50/20">✓ Pleno Acceso</td>
                      <td className="px-4 py-2.5 text-red-700/60 font-semibold bg-gray-50/30">✗ Restringido</td>
                      <td className="px-4 py-2.5 text-red-700/60 font-semibold bg-gray-50/30">✗ Restringido</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Role Indicator Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-red-600 block font-black">Simulación de Portal en Ejecución</span>
                  <h2 className="text-sm font-bold text-gray-800">
                    Operando como: <span className="text-gray-950 font-extrabold">{currentUser.name}</span> <span className="text-gray-500 font-mono text-xs">({currentUser.role})</span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  currentUser.role === 'Administrador' ? 'bg-red-50 text-red-600 border border-red-200' :
                  currentUser.role === 'Ventas' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  Consola de {currentUser.role === 'Administrador' ? 'Administrador General' : currentUser.role === 'Ventas' ? 'Ventas & CRM' : 'Operaciones de Almacén'}
                </span>
                
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200 shadow-sm"
                >
                  ← Salir al Inicio
                </button>
              </div>
            </div>

            {/* Dynamic component picker */}
            <div className="transition-all duration-300">
              {currentUser.role === 'Administrador' && (
                <AdminDashboard 
                  users={users}
                  setUsers={setUsers}
                  customers={customers}
                  setCustomers={setCustomers}
                  products={products}
                  setProducts={setProducts}
                  quotes={quotes}
                  orders={orders}
                  adjustments={adjustments}
                  currentUser={currentUser}
                />
              )}

              {currentUser.role === 'Ventas' && (
                <VentasDashboard 
                  products={products}
                  customers={customers}
                  setCustomers={setCustomers}
                  quotes={quotes}
                  setQuotes={setQuotes}
                  orders={orders}
                  setOrders={setOrders}
                  currentUser={currentUser}
                />
              )}

              {currentUser.role === 'Almacén' && (
                <AlmacenDashboard 
                  products={products}
                  setProducts={setProducts}
                  orders={orders}
                  setOrders={setOrders}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  currentUser={currentUser}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER NOTE */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-16 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-extrabold text-gray-800 uppercase tracking-wider font-display text-[11px]">Plataforma ERP Corporativo - Control de Surtido & Facturas</p>
          <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed font-medium">
            Este software simula la operación integral de una empresa comercializadora. 
            Todas las acciones (altas de clientes, cotizaciones de productos, autorizaciones de stock, picking y packing en bodega) 
            persisten inmediatamente en la base de datos local (<code className="font-mono bg-gray-50 text-red-600 px-1 py-0.5 rounded border border-gray-200">localStorage</code>) para su inspección inmediata.
          </p>
          <p className="text-[10px] text-gray-400 font-mono">© 2026 ERP Business Suite. Todos los perfiles resguardados en cumplimiento fiscal.</p>
        </div>
      </footer>
    </div>
  );
}
