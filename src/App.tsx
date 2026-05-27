import { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase } from './data';
import { User, Customer, Product, Quote, Order, InventoryAdjustment } from './types';
import AdminDashboard from './components/AdminDashboard';
import VentasDashboard from './components/VentasDashboard';
import AlmacenDashboard from './components/AlmacenDashboard';
import { 
  Shield, Users, Package, HelpCircle, RefreshCw, 
  Map, Check, X, AlertTriangle, UserCheck
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
  };

  return (
    <div id="erp-root" className="min-h-screen bg-[#0c0c0c] font-sans text-gray-200 selection:bg-emerald-600/30 selection:text-white leading-normal">
      
      {/* 1. TOP GLOBAL EXECUTIVE HEADER BAR */}
      <header className="bg-[#111111] border-b border-gray-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 flex-wrap gap-4 py-2 sm:py-0">
            {/* Branding logo */}
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-inner font-extrabold flex items-center h-9 w-9 justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight">SISTEMA ERP INTEGRAL</h1>
                <p className="text-[10px] text-emerald-400 font-mono tracking-wider">CORP &bull; LOGÍSTICA &bull; CRM</p>
              </div>
            </div>

            {/* Profile simulation selector (Evaluador de Roles) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold hidden md:inline">Simular Perfil:</span>
              
              <div className="flex gap-1.5 bg-[#1a1a1a] p-1 rounded-lg border border-gray-800">
                {users.map(u => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      id={`btn-profile-${u.id}`}
                      onClick={() => handleProfileSwitch(u)}
                      className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                        isCurrent 
                        ? 'bg-emerald-600 text-white shadow-sm font-bold scale-[1.03]' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                      title={`${u.name} (${u.role})`}
                    >
                      <UserCheck size={12} className={isCurrent ? 'opacity-100' : 'opacity-40'} />
                      <span className="max-w-[70px] sm:max-w-none text-ellipsis overflow-hidden whitespace-nowrap">{u.name.split(' ')[0]}</span>
                      <span className="text-[9px] opacity-75 font-mono">({u.role === 'Administrador' ? 'Admin' : u.role})</span>
                    </button>
                  );
                })}
              </div>

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
                <span className="hidden sm:inline font-semibold">Permisos</span>
              </button>

              {/* Factory reset button */}
              <button 
                id="btn-factory-reset"
                onClick={handleResetDatabase}
                className="p-2 bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Restablecer base de datos"
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

      {/* 3. DYNAMIC BODY CONTAINER BASED ON ACTIVE SESSION ROLE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Role Indicator Card */}
        <div className="bg-[#141414] p-4 rounded-xl border border-gray-800 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block font-bold">Sesión Simulada Homologada</span>
              <h2 className="text-sm font-bold text-gray-200">
                {currentUser.name} <span className="text-gray-500 font-medium">({currentUser.email})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Clasificación:</span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              currentUser.role === 'Administrador' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              currentUser.role === 'Ventas' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              Módulo de {currentUser.role === 'Administrador' ? 'Administrador' : currentUser.role === 'Ventas' ? 'Ventas / Comercial' : 'Almacén / Operaciones'} Activo
            </span>
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
