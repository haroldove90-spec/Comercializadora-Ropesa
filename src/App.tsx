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
    <div id="erp-root" className="min-h-screen bg-[#0c0c0c] font-sans text-gray-200 selection:bg-emerald-600/30 selection:text-white leading-normal">
      
      {/* 1. TOP GLOBAL EXECUTIVE HEADER BAR */}
      <header className="bg-[#111111] border-b border-gray-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4rem] sm:h-16 flex-wrap gap-4 py-3 sm:py-0">
            {/* Branding logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setCurrentView('home')}
              title="Ir al Inicio - Selector de Roles"
            >
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-inner font-extrabold flex items-center h-9 w-9 justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white font-display">COMERCIALIZADORA ROPESA</h1>
                <p className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-semibold">Plataforma ERP Corporativa</p>
              </div>
            </div>

            {/* Header actions & Portal Navigation */}
            <div className="flex items-center gap-3">
              {currentView === 'module' && (
                <button
                  id="btn-back-home"
                  onClick={() => setCurrentView('home')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-lg hover:scale-[1.03] active:scale-[0.98]"
                  title="Cambiar de Rol Operativo"
                >
                  <span className="font-bold">← Volver al Inicio</span>
                  <span className="hidden md:inline text-[9px] bg-black/10 px-1.5 py-0.5 rounded text-black/80 font-mono">CAMBIAR ROL</span>
                </button>
              )}

              {/* Matrix view trigger */}
              <button 
                id="btn-trigger-matrix"
                onClick={() => setShowMatrixHelp(!showMatrixHelp)}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  showMatrixHelp 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                  : 'bg-[#1a1a1a] text-gray-300 border-gray-800 hover:bg-white/5'
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
                className="p-2 bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
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
        <section id="permissions-matrix-guide" className="bg-[#141414] text-gray-200 py-6 border-b border-gray-800 animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Map className="text-emerald-400" size={18} />
                <h2 className="font-bold text-sm sm:text-base tracking-tight">Matriz de Control Operativo - Roles y Permisos</h2>
              </div>
              <button 
                onClick={() => setShowMatrixHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              La plataforma implementa un riguroso control de acceso basado en perfiles (RBAC) para el cuidado fiscal y la protección de márgenes comerciales de proveedor. 
              Utiliza el menú de la barra superior para cambiar de perfil de simulación y auditar el comportamiento de cada módulo de acuerdo a esta tabla:
            </p>

            <div className="overflow-x-auto rounded-lg border border-gray-850">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-gray-850">
                    <th className="px-4 py-2.5">Módulo / Acción Operativa</th>
                    <th className="px-4 py-2.5">Administrador (Laura G.)</th>
                    <th className="px-4 py-2.5">Ventas / Comercial (Carlos M.)</th>
                    <th className="px-4 py-2.5 font-bold text-gray-200">Almacén (Miguel R.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#161616]/45">
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Dar de alta clientes</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold flex items-center gap-1">✓ Sí</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Crear Cotizaciones comerciales</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Aprobar Pedidos para envío</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Preparar / Despachar Pedidos (Picking)</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-amber-500">Solo ver estatus</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Modificar Stock manualmente</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Ver Costos Confidenciales y Márgenes $</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-gray-300">Crear y Editar usuarios</td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">✓ Sí</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
                    <td className="px-4 py-2 text-rose-400 opacity-70">✗ No</td>
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
            <div className="text-center py-10 px-6 bg-[#111111] rounded-2xl border border-gray-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <span className="inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full font-mono uppercase tracking-widest border border-emerald-500/20">
                  Panel de Distribución y CRM Industrial
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                  Portal de Simulación Corporativa Ropesa
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto">
                  Bienvenido al sistema integrado de Comercializadora Ropesa. Para simular los flujos de administración fiscal, CRM o almacén, seleccione una opción a continuación. Puede volver a esta pantalla usando el botón del encabezado.
                </p>
              </div>
            </div>

            {/* Portal Role Access Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="text-emerald-400" size={18} />
                <h3 className="text-sm uppercase font-extrabold tracking-wider font-display text-gray-300">
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
                      className="p-6 rounded-xl border border-gray-800 bg-[#141414] hover:border-emerald-500/50 hover:bg-[#181818] transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transform duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-455 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                            <Users size={22} />
                          </div>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            DIRECTORIO MASTER
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                          Módulo Administrativo
                        </h4>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">
                          Control financiero completo. Audite márgenes de ganancia, costos unitarios confidenciales de proveedor, administre usuarios comerciales y visualice gráficas de desempeño global.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-850 flex items-center justify-between">
                        <div className="text-[11px] text-gray-500">
                          Operador: <span className="text-gray-300 font-semibold">Laura Gómez</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
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
                      className="p-6 rounded-xl border border-gray-800 bg-[#141414] hover:border-cyan-500/50 hover:bg-[#181818] transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-1 transform duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                            <TrendingUp size={22} />
                          </div>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            CRM & EMISIÓN
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white font-display group-hover:text-cyan-400 transition-colors">
                          Módulo Ventas & CRM
                        </h4>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">
                          Gestione relaciones con clientes comerciales. Capture solicitudes, emita propuestas comerciales / cotizaciones automatizadas y autorice pedidos urgentes para el almacén.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-850 flex items-center justify-between">
                        <div className="text-[11px] text-gray-500">
                          Operador: <span className="text-gray-300 font-semibold">Carlos Mendoza</span>
                        </div>
                        <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
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
                      className="p-6 rounded-xl border border-gray-800 bg-[#141414] hover:border-amber-500/50 hover:bg-[#181818] transition-all cursor-pointer relative group flex flex-col justify-between min-h-[250px] shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1 transform duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all">
                            <Package size={22} />
                          </div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                            BODEGA & PACKING
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white font-display group-hover:text-amber-400 transition-colors">
                          Módulo Almacén & Bodega
                        </h4>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">
                          Operación rápida de almacén físico. Complete surtidos de pedidos pendientes (picking y packing express), asigne guías electrónicas y realice auditoría / ajustes manuales de stock.
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-850 flex items-center justify-between">
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          Operador: <span className="text-gray-300 font-semibold">Miguel Rivas</span>
                          {lowStockCount > 0 && (
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Alertas de Stock activas" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1.5 transform transition-transform flex items-center gap-1">
                          Entrar Módulo →
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Birds-Eye Stats Panel */}
            <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl">
              <h4 className="text-xs uppercase font-bold tracking-wider font-mono text-gray-400 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 
                Métricas del Sistema Integradas en Tiempo Real
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#161616] rounded-xl border border-gray-850">
                  <span className="text-xs text-gray-500 block">Clientes Autorizados</span>
                  <strong className="text-2xl font-extrabold text-emerald-400 font-display mt-1 block">
                    {customers.length}
                  </strong>
                  <span className="text-[9px] text-gray-600 block mt-1">Sincronizado con CRM</span>
                </div>
                <div className="p-4 bg-[#161616] rounded-xl border border-gray-850">
                  <span className="text-xs text-gray-500 block">Catálogo SKU</span>
                  <strong className="text-2xl font-extrabold text-white font-display mt-1 block">
                    {products.length}
                  </strong>
                  <span className="text-[9px] text-gray-600 block mt-1">Productos listados</span>
                </div>
                <div className="p-4 bg-[#161616] rounded-xl border border-gray-850">
                  <span className="text-xs text-gray-500 block">Pedidos Registrados</span>
                  <strong className="text-2xl font-extrabold text-cyan-400 font-display mt-1 block">
                    {orders.length}
                  </strong>
                  <span className="text-[9px] text-gray-600 block mt-1">Operaciones de flujo</span>
                </div>
                <div className="p-4 bg-[#161616] rounded-xl border border-gray-850">
                  <span className="text-xs text-gray-500 block">Alertas Stock Mínimo</span>
                  <strong className={`text-2xl font-extrabold font-display mt-1 block ${products.filter(p => p.stock <= p.minStock).length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {products.filter(p => p.stock <= p.minStock).length}
                  </strong>
                  <span className="text-[9px] text-gray-600 block mt-1">Requieren reabastecimiento</span>
                </div>
              </div>
            </div>

            {/* Brief Interactive Permission table right at home */}
            <div className="bg-[#111111] border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Map className="text-emerald-400" size={16} />
                <h4 className="text-xs uppercase font-extrabold tracking-wider font-mono text-gray-300">
                  Auditoría Rápida de Privilegios Corporativos
                </h4>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-normal font-sans">
                Comprobador fiscal integrado de Ropesa. Dependiendo de las credenciales del portal actual, las acciones críticas cambiarán:
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-850">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1c1c1c] text-gray-450 font-semibold border-b border-gray-800 text-[10px]">
                      <th className="px-4 py-2">Proceso Operativo</th>
                      <th className="px-4 py-2 text-emerald-400">Director Administrativo</th>
                      <th className="px-4 py-2 text-cyan-400">Ejecutivo Comercial</th>
                      <th className="px-4 py-2 text-amber-500">Operaciones Bodega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 bg-[#141414] text-[11px]">
                    <tr>
                      <td className="px-4 py-2 text-gray-300">Dar de Alta Catálogo y Clientes</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Permitido</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Permitido</td>
                      <td className="px-4 py-2 text-rose-500">✗ Denegado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-300">Emitir Cotizaciones e Impuestos</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Permitido</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Permitido</td>
                      <td className="px-4 py-2 text-rose-500">✗ Denegado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-300">Picking / Surtido Físico de Pedidos</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Surtido Máximo</td>
                      <td className="px-4 py-2 text-gray-500">Solo ver estatus</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Surtido Máximo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-300">Ver Márgenes $ y Costo Proveedor</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">✓ Pleno Acceso</td>
                      <td className="px-4 py-2 text-rose-500 font-semibold">✗ Restringido</td>
                      <td className="px-4 py-2 text-rose-500 font-semibold">✗ Restringido</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Role Indicator Card */}
            <div className="bg-[#141414] p-4 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">Simulación de Portal en Ejecución</span>
                  <h2 className="text-sm font-bold text-gray-200">
                    Operando como: <span className="text-white font-extrabold">{currentUser.name}</span> <span className="text-gray-500 font-mono text-xs">({currentUser.role})</span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  currentUser.role === 'Administrador' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  currentUser.role === 'Ventas' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Consola de {currentUser.role === 'Administrador' ? 'Administrador General' : currentUser.role === 'Ventas' ? 'Ventas & CRM' : 'Operaciones de Almacén'}
                </span>
                
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-700 hover:border-gray-600"
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
      <footer className="bg-[#111111] border-t border-gray-800 py-8 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-semibold text-gray-400">Plataforma ERP Corporativo - Control de Surtido & Facturas</p>
          <p className="max-w-2xl mx-auto text-gray-500 leading-relaxed">
            Este software simula la operación integral de una empresa comercializadora. 
            Todas las acciones (altas de clientes, cotizaciones de productos, autorizaciones de stock, picking y packing en bodega) 
            persisten inmediatamente en la base de datos local (<code className="font-mono bg-[#1a1a1a] text-emerald-400 px-1 py-0.5 rounded border border-gray-800">localStorage</code>) para su inspección inmediata.
          </p>
          <p className="text-[10px] text-gray-600">© 2026 ERP Business Suite. Todos los perfiles resguardados en cumplimiento fiscal.</p>
        </div>
      </footer>
    </div>
  );
}
