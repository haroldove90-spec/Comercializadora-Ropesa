import React, { useState } from 'react';
import { User, Customer, Product, Quote, Order, InventoryAdjustment, UserRole } from '../types';
import { 
  Users, Package, TrendingUp, AlertTriangle, UserPlus, 
  Trash2, Edit, Check, X, FileSpreadsheet, FileText, 
  Printer, DollarSign, ArrowUpRight, BarChart3, ListFilter, Eye, Percent
} from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  quotes: Quote[];
  orders: Order[];
  adjustments: InventoryAdjustment[];
  currentUser: User;
}

export default function AdminDashboard({
  users,
  setUsers,
  customers,
  setCustomers,
  products,
  setProducts,
  quotes,
  orders,
  adjustments,
  currentUser
}: AdminDashboardProps) {
  // Tabs: 'overview' | 'users' | 'customers' | 'inventory' | 'orders' | 'reports'
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'customers' | 'inventory' | 'orders' | 'reports'>('overview');

  // User Management State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState<{ name: string; email: string; role: UserRole; active: boolean }>({
    name: '',
    email: '',
    role: 'Ventas',
    active: true
  });
  const [editUserForm, setEditUserForm] = useState<{ name: string; email: string; role: UserRole; active: boolean }>({
    name: '',
    email: '',
    role: 'Ventas',
    active: true
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Selected entities for histories / details
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Notification state
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const triggerNotif = (type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4000);
  };

  // ----------------------------------------------------
  // CALCULATIONS / STATS
  // ----------------------------------------------------
  // Low stock calculation
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Sales calculations
  const totalSalesVolume = orders.reduce((sum, order) => {
    return sum + order.total;
  }, 0);

  // Total costs of delivered or active orders
  const totalCostVolume = orders.reduce((sum, order) => {
    // Calculate total cost for each order based on product cost and quantity sold
    const orderCost = order.items.reduce((itemSum, item) => {
      const originalProduct = products.find(p => p.id === item.productId);
      const productCost = originalProduct ? originalProduct.purchaseCost : (item.price * 0.7); // Fallback to 70% cost
      return itemSum + (productCost * item.quantity);
    }, 0);
    return sum + orderCost;
  }, 0);

  const netProfit = totalSalesVolume - totalCostVolume;
  const netMarginPercent = totalSalesVolume > 0 ? (netProfit / totalSalesVolume) * 100 : 0;

  // Best Selling products calculations
  const productSalesMap: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, sku: item.sku, units: 0, revenue: 0 };
      }
      productSalesMap[item.productId].units += item.quantity;
      productSalesMap[item.productId].revenue += item.quantity * item.price;
    });
  });

  const sortedBestSellers = Object.values(productSalesMap).sort((a, b) => b.units - a.units).slice(0, 5);

  // Month Sales approximation (e.g. Sales by date grouping)
  const salesByDate: Record<string, number> = {};
  orders.forEach(order => {
    // Date format is YYYY-MM-DD
    const dateKey = order.date.split('T')[0] || order.date;
    salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.total;
  });

  const sortedDates = Object.keys(salesByDate).sort().slice(-7); // Keep last 7 active dates

  // ----------------------------------------------------
  // USER ACTIONS
  // ----------------------------------------------------
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) {
      triggerNotif('error', 'Por favor llena todos los campos necesarios.');
      return;
    }
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      active: newUserForm.active,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('erp_users', JSON.stringify(updatedUsers));
    setNewUserForm({ name: '', email: '', role: 'Ventas', active: true });
    setShowAddUserModal(false);
    triggerNotif('success', `Usuario "${newUser.name}" creado con éxito.`);
  };

  const handleStartEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active
    });
  };

  const handleSaveEditUser = (id: string) => {
    const updated = users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          name: editUserForm.name,
          email: editUserForm.email,
          role: editUserForm.role,
          active: editUserForm.active
        };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('erp_users', JSON.stringify(updated));
    setEditingUserId(null);
    triggerNotif('success', 'Usuario actualizado correctamente.');
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUser.id) {
      triggerNotif('error', 'No puedes eliminar tu propio usuario actual.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('erp_users', JSON.stringify(updated));
      triggerNotif('success', 'Usuario eliminado de la base de datos.');
    }
  };

  // ----------------------------------------------------
  // EXPORTS UTILITY
  // ----------------------------------------------------
  const exportToCSV = (type: 'sales' | 'inventory' | 'customers') => {
    let csvContent = '\uFEFF'; // UTF-8 BOM so Excel opens accents beautifully
    let fileName = '';

    if (type === 'sales') {
      fileName = 'Reporte_Ventas_Global.csv';
      csvContent += 'ID Pedido,Cliente,Fecha,Estatus,Total,Creado Por,Artículos\n';
      orders.forEach(o => {
        const itemSummary = o.items.map(i => `${i.name} (${i.quantity} pzas)`).join(' | ');
        csvContent += `"${o.id}","${o.customerName}","${o.date}","${o.status}",${o.total},"${o.createdBy}","${itemSummary}"\n`;
      });
    } else if (type === 'inventory') {
      fileName = 'Reporte_Inventario_Costos.csv';
      csvContent += 'SKU,Producto,Categoría,Stock Actual,Stock Mínimo,Costo Compra ($),Precio Venta ($),Margen Utilidad ($),Margen (%)\n';
      products.forEach(p => {
        const marginVal = p.price - p.purchaseCost;
        const marginPct = ((marginVal / p.price) * 100).toFixed(1);
        csvContent += `"${p.sku}","${p.name}","${p.category}",${p.stock},${p.minStock},${p.purchaseCost},${p.price},${marginVal},${marginPct}%\n`;
      });
    } else if (type === 'customers') {
      fileName = 'Reporte_Clientes_Historial.csv';
      csvContent += 'ID Cliente,Nombre/Razón Social,RFC,Teléfono,Correo,Dirección,Fecha Registro,Total Comprado ($)\n';
      customers.forEach(c => {
        csvContent += `"${c.id}","${c.name}","${c.rfc}","${c.phone}","${c.email}","${c.deliveryAddress}","${c.registrationDate}",${c.totalPurchased}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotif('success', `Exportación exitosa: ${fileName}`);
  };

  // Standard printing feature
  const handlePrint = (title: string, dataHtml: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerNotif('error', 'Por favor habilita las ventanas emergentes para imprimir.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #1e293b; }
            .date { font-size: 12px; margin-bottom: 25px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #1e293b; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .totals { float: right; font-size: 16px; font-weight: bold; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; }
            .alert-pill { background: #fef2f2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 12px; border: 1px solid #fca5a5; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="date">Reporte Oficial de Sistema ERP &bull; Sincronizado: ${new Date().toLocaleDateString('es-MX')} - ${new Date().toLocaleTimeString('es-MX')}</div>
          ${dataHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Allow resource load time
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const printSalesReport = () => {
    let html = `
      <table>
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estatus</th>
            <th>Total ($)</th>
            <th>Vendedor</th>
          </tr>
        </thead>
        <tbody>
    `;
    orders.forEach(o => {
      html += `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td>${o.date}</td>
          <td><span style="padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px;">${o.status}</span></td>
          <td>$${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          <td>${o.createdBy}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div class="totals">
        Total Volumen de Ventas: $${totalSalesVolume.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
        <br/><span style="font-size: 13px; font-weight: normal; color: #64748b;">Margen de Utilidad Neto: ${netMarginPercent.toFixed(1)}%</span>
      </div>
    `;
    handlePrint('REPORTE GLOBAL DE VENTAS Y OPERACIONES', html);
  };

  const printInventoryReport = () => {
    let html = `
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre del Producto</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
            <th>Stock Mín.</th>
            <th>Costo Compra ($)</th>
            <th>Precio Venta ($)</th>
            <th>Margen %</th>
          </tr>
        </thead>
        <tbody>
    `;
    products.forEach(p => {
      const marginVal = p.price - p.purchaseCost;
      const marginPct = p.price > 0 ? ((marginVal / p.price) * 100).toFixed(1) : '0';
      const isLowStock = p.stock <= p.minStock;
      html += `
        <tr>
          <td><code>${p.sku}</code></td>
          <td>${p.name} ${isLowStock ? '<span class="alert-pill">Stock Bajo</span>' : ''}</td>
          <td>${p.category}</td>
          <td style="${isLowStock ? 'color: #ef4444; font-weight: bold;' : ''}">${p.stock}</td>
          <td>${p.minStock}</td>
          <td>$${p.purchaseCost.toLocaleString('es-MX')}</td>
          <td>$${p.price.toLocaleString('es-MX')}</td>
          <td>${marginPct}%</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
    `;
    handlePrint('REPORTE GLOBAL DE INVENTARIO Y MÁRGENES', html);
  };

  return (
    <div id="admin-module" className="space-y-6">
      {/* Toast Notifications */}
      {notif && (
        <div id="admin-toast" className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white font-medium transition-all duration-300 transform translate-y-0 ${notif.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {notif.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Module Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Módulo de Administrador</h2>
            <p className="text-xs text-gray-500">Hola {currentUser.name} &bull; Acceso total sin restricciones</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg text-sm">
          <button 
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Dashboard Global
          </button>
          <button 
            id="tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Gestión Personal
          </button>
          <button 
            id="tab-customers"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Clientes
          </button>
          <button 
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Inventario & Costos
          </button>
          <button 
            id="tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Operaciones
          </button>
          <button 
            id="tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Reportes
          </button>
        </nav>
      </div>

      {/* TABS CONTENT */}

      {/* T1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div id="stat-sales" className="bg-gradient-to-br from-red-50/30 via-white to-white p-5 rounded-xl border border-red-150 shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Ventas Mensuales</span>
                <span className="text-2xl font-black text-gray-950 block mt-1">
                  ${totalSalesVolume.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full inline-block mt-2 font-black">
                  +14.2% vs mes anterior
                </span>
              </div>
              <div className="p-3 bg-red-650 text-white rounded-lg shadow-sm">
                <DollarSign size={20} />
              </div>
            </div>

            <div id="stat-margin" className="bg-gradient-to-br from-gray-50 via-white to-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Margen Neto Operativo</span>
                <span className="text-2xl font-black text-gray-900 block mt-1">
                  ${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-black bg-gray-150 px-2.5 py-0.5 rounded-full inline-block mt-2 font-mono font-bold">
                  {netMarginPercent.toFixed(1)}% Margen Neto
                </span>
              </div>
              <div className="p-3 bg-black text-white rounded-lg">
                <Percent size={20} />
              </div>
            </div>

            <div id="stat-active-customers" className="bg-gradient-to-br from-white to-red-50/10 p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Clientes Registrados</span>
                <span className="text-2xl font-black text-gray-950 block mt-1">{customers.length}</span>
                <span className="text-xs text-red-600 font-bold inline-block mt-2">
                  100% activos comerciales
                </span>
              </div>
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg">
                <Users size={20} />
              </div>
            </div>

            <div id="stat-stock-alert" className={`p-5 rounded-xl border shadow-sm flex items-start justify-between transition-all duration-200 ${
              lowStockProducts.length > 0 
                ? 'border-red-300 bg-red-50/70 text-red-950 animate-pulse' 
                : 'border-gray-200 bg-white'
            }`}>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Alertas de Stock Bajo</span>
                <span className={`text-2xl font-black block mt-1 ${lowStockProducts.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {lowStockProducts.length}
                </span>
                <span className={`text-xs inline-block mt-2 font-bold ${lowStockProducts.length > 0 ? 'text-red-905 uppercase tracking-wide' : 'text-gray-500'}`}>
                  {lowStockProducts.length > 0 ? '⚠️ Reaperturar Surtido' : 'Inventario óptimo'}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${lowStockProducts.length > 0 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-550'}`}>
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Chart SVG */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Tendencia de Ventas ($)</h3>
                  <p className="text-xs text-gray-500">Facturación diaria actual en pesos mexicanos</p>
                </div>
                <BarChart3 className="text-indigo-500" size={18} />
              </div>

              {/* Custom SVG Line bar visualization */}
              <div className="h-56 w-full flex items-end justify-between px-2 pt-4 border-b border-l border-gray-200">
                {sortedDates.length === 0 ? (
                  <div className="m-auto text-gray-400 text-sm">No hay datos históricos recientes</div>
                ) : (
                  sortedDates.map((date, idx) => {
                    const totalDateVal = salesByDate[date] || 0;
                    // Max height dynamic scaling
                    const maxVal = Math.max(...Object.values(salesByDate), 10000);
                    const percentHeight = Math.max(10, Math.min(95, (totalDateVal / maxVal) * 100));

                    return (
                      <div key={date} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                        <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          $ {totalDateVal.toLocaleString('es-MX')}
                        </div>
                        <div 
                          className="w-10 bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all cursor-pointer"
                          style={{ height: `${percentHeight}%` }}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-2 transform rotate-12 origin-top-left font-mono whitespace-nowrap">
                          {date}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-8 text-xs text-indigo-600 flex items-center justify-end gap-1 font-semibold">
                <span>Indicadores en tiempo real</span>
                <ArrowUpRight size={14} />
              </div>
            </div>

            {/* Best Sellers and Stock alerts */}
            <div className="space-y-6 lg:col-span-5">
              {/* Product list */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-3">Productos Más Vendidos</h3>
                <div className="space-y-3">
                  {sortedBestSellers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin datos de compras aún.</p>
                  ) : (
                    sortedBestSellers.map((item, idx) => (
                      <div key={item.sku} className="flex items-center justify-between p-2 hover:bg-gray-55 rounded-lg text-sm transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{item.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{item.units} uds</p>
                          <p className="text-[11px] text-indigo-600">${item.revenue.toLocaleString('es-MX')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Low stock alerts panel (quick overview) */}
              <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-amber-900 text-base">Alerta Crítica Stock</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                    {lowStockProducts.length} productos
                  </span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {lowStockProducts.length === 0 ? (
                    <p className="text-sm text-emerald-600 text-center py-2">✓ Almacén en estado excelente</p>
                  ) : (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-xs border border-amber-100">
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-gray-500 font-mono">SKU: {p.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-700">Stock: {p.stock}</p>
                          <p className="text-gray-400">Mínimo: {p.minStock}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* T2: USER ACCESS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Personal Autorizado del Sistema</h3>
              <p className="text-sm text-gray-500">Crea, edita o deshabilita los accesos de tus vendedores y almacenistas.</p>
            </div>
            <button 
              id="btn-add-user-modal"
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <UserPlus size={16} />
              Crear Nuevo Usuario
            </button>
          </div>

          {/* User addition Modal inside page block */}
          {showAddUserModal && (
            <div id="add-user-form-container" className="bg-slate-50 p-4 rounded-xl border border-indigo-100 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 text-sm">Registrar Nuevo Usuario del Sistema</span>
                <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={newUserForm.name}
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Ej. Juan Pérez" 
                    className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="Ej. juan@empresa.com" 
                    className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rol Operativo</label>
                  <select 
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Ventas">Ejecutivo de Ventas</option>
                    <option value="Almacén">Encargado de Almacén</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estatus</label>
                    <select 
                      value={newUserForm.active ? 'true' : 'false'}
                      onChange={e => setNewUserForm({ ...newUserForm, active: e.target.value === 'true' })}
                      className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg h-9"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User Table list */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Correo Electrónico</th>
                  <th className="px-6 py-3">Rol del Sistema</th>
                  <th className="px-6 py-3">Estatus</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-250">
                {users.map(u => {
                  const isEditing = editingUserId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="bg-white border rounded p-1 text-sm w-full"
                            value={editUserForm.name}
                            onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                          />
                        ) : (
                          u.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {isEditing ? (
                          <input 
                            type="email" 
                            className="bg-white border rounded p-1 text-xs w-full"
                            value={editUserForm.email}
                            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                          />
                        ) : (
                          u.email
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select 
                            className="bg-white border rounded p-1 text-xs"
                            value={editUserForm.role}
                            onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Ventas">Ventas</option>
                            <option value="Almacén">Almacén</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'Ventas' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            className="bg-white border rounded p-1 text-xs"
                            value={editUserForm.active ? 'true' : 'false'}
                            onChange={e => setEditUserForm({ ...editUserForm, active: e.target.value === 'true' })}
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div id={`actions-user-${u.id}`} className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleSaveEditUser(u.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Guardar Cambios"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => setEditingUserId(null)}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleStartEditUser(u)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Editar Acceso"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Eliminar Usuario"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* T3: CLIENTS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Módulo de Clientes</h3>
              <p className="text-sm text-gray-500">Historial comercial, registros del RFC e indicadores de consumo.</p>
            </div>
            {/* Search filter */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por RFC, Nombre..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-52 sm:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Clientes Table */}
            <div className="lg:col-span-8 border border-gray-200 rounded-lg overflow-x-auto h-[450px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                  <tr className="text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="px-4 py-3">Nombre / Razón Social</th>
                    <th className="px-4 py-3">R.F.C / Tax ID</th>
                    <th className="px-4 py-3 text-right">Monto Total Comprado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.rfc.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map(c => (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-indigo-50/20 cursor-pointer ${selectedCustomer?.id === c.id ? 'bg-indigo-50/50 font-medium' : ''}`}
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <td className="px-4 py-3.5 text-gray-900 font-semibold">{c.name}</td>
                        <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{c.rfc}</td>
                        <td className="px-4 py-3.5 text-right text-gray-900 font-bold">
                          ${c.totalPurchased.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button 
                            id={`view-cust-${c.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                            }}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} />
                            Ver Ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Ficha Cliente & Reporte de compras */}
            <div className="lg:col-span-4 bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4">
              {selectedCustomer ? (
                <>
                  <div className="border-b border-gray-200 pb-3">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Ficha de Cliente ERP</span>
                    <h4 className="text-base font-bold text-gray-950 mt-1">{selectedCustomer.name}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selectedCustomer.id} | RFC: {selectedCustomer.rfc}</p>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block">Teléfono de contacto:</span>
                      <span className="text-gray-800 font-medium">{selectedCustomer.phone}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Correo electrónico:</span>
                      <span className="text-gray-800 font-mono text-xs">{selectedCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Dirección de Entrega Surtidos:</span>
                      <span className="text-gray-700 text-xs leading-relaxed font-sans">{selectedCustomer.deliveryAddress}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Fecha alta comercial:</span>
                      <span className="text-gray-800 font-medium">{selectedCustomer.registrationDate}</span>
                    </div>
                    <div className="p-3 bg-indigo-100 text-indigo-900 rounded-lg">
                      <span className="text-xs text-indigo-700 block uppercase font-bold tracking-wider">Total Acumulado Compras:</span>
                      <span className="text-lg font-bold">${selectedCustomer.totalPurchased.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Orders List of customer */}
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-t border-gray-200 pt-3">Historial de Compras</h5>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {orders.filter(o => o.customerId === selectedCustomer.id).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Sin pedidos colocados en el sistema.</p>
                      ) : (
                        orders
                          .filter(o => o.customerId === selectedCustomer.id)
                          .map(o => (
                            <div key={o.id} className="flex justify-between items-center bg-white p-2 text-xs rounded border border-gray-150">
                              <div>
                                <p className="font-semibold text-gray-900">{o.id}</p>
                                <p className="text-gray-400 font-mono text-[10px]">{o.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-950">${o.total.toLocaleString('es-MX')}</p>
                                <span className="inline-block scale-90 px-1.5 py-0.2 px-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-150 rounded">
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                  <Users size={32} className="stroke-none fill-indigo-200/50 mb-2" />
                  <p className="text-sm font-semibold">Selecciona un cliente de la lista</p>
                  <p className="text-xs">Para visualizar la información detallada con su historial de consumo global.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* T4: INVENTORY MÁRGENES / AJUSTES */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Módulo de Control de Costos e Inventario</h3>
              <p className="text-sm text-gray-500">Privilegios de Administrador: Análisis de costos del proveedor, márgenes netos de ganancia y trazabilidad de mermas.</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por SKU, Nombre..."
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-52 sm:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Products Margins */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trazabilidad de Utilidades unitarias</span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-semibold tracking-wider border-b border-gray-200">
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Existencia</th>
                      <th className="px-4 py-3 text-right">Costo Unitario ($)</th>
                      <th className="px-4 py-3 text-right">Precio Venta ($)</th>
                      <th className="px-4 py-3 text-right">Margen Neto ($)</th>
                      <th className="px-4 py-3 text-right">Margen (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-250">
                    {products
                      .filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.sku.toLowerCase().includes(inventorySearch.toLowerCase()))
                      .map(p => {
                        const marginValue = p.price - p.purchaseCost;
                        const marginPct = p.price > 0 ? (marginValue / p.price) * 100 : 0;
                        const isLow = p.stock <= p.minStock;

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500">{p.sku}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900 block">{p.name}</span>
                              <span className="text-xs text-gray-400 capitalize">{p.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-bold inline-flex items-center gap-1 ${isLow ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full' : 'text-gray-800'}`}>
                                {p.stock} pzas
                                {isLow && <AlertTriangle size={12} />}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 font-semibold">
                              ${p.purchaseCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-800 font-semibold">
                              ${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-700 font-bold">
                              +${marginValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded font-extrabold text-xs inline-block ${
                                marginPct >= 40 ? 'bg-emerald-100 text-emerald-800' : 
                                marginPct >= 25 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {marginPct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bitácora de Ajustes en Bodegas */}
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Autorizaciones e Historial de Ajustes</h4>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">Registro de entradas por importaciones/mermas físicas procesadas en el almacén por personal operativo.</p>
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {adjustments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No hay ajustes manuales registrados aún.</p>
                ) : (
                  adjustments.map(adj => (
                    <div key={adj.id} className="bg-white p-3.5 rounded-lg border border-gray-150 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gray-600 text-[10px]">{adj.id}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          adj.type === 'Entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {adj.type === 'Entrada' ? '+ Entrada Mercancía' : '- Salida / Ajuste'}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 text-xs mt-1">{adj.productName}</p>
                      <div className="flex justify-between text-gray-500 font-medium">
                        <span>SKU: {adj.sku}</span>
                        <span className="font-bold text-gray-900">{adj.quantity} uds</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded text-gray-600 leading-normal border border-gray-200 mt-1">
                        &ldquo;{adj.reason}&rdquo;
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-200">
                        <span>Registro: {adj.user}</span>
                        <span>{adj.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* T5: GLOBAL TRANSACTIONS (SUPERVISOR) */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Supervisor Global de Operaciones</h3>
              <p className="text-sm text-gray-500">Revisión de todos los pedidos y cotizaciones registradas por el personal de venta, sin restricciones de usuario.</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar pedido por ID, Cliente..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-52 sm:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Orders supervisor table */}
            <div className="lg:col-span-8 border border-gray-200 rounded-lg overflow-x-auto h-[450px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10 text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Fecha Captura</th>
                    <th className="px-4 py-3 text-right">Total ($)</th>
                    <th className="px-4 py-3">Estatus</th>
                    <th className="px-4 py-3">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders
                    .filter(o => o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase()))
                    .map(o => (
                      <tr 
                        key={o.id} 
                        className={`hover:bg-indigo-50/20 cursor-pointer ${selectedOrder?.id === o.id ? 'bg-indigo-50/50 font-semibold' : ''}`}
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-700">{o.id}</td>
                        <td className="px-4 py-3.5 text-gray-900">{o.customerName}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs">{o.date}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-950">
                          ${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            o.status === 'Pendiente' ? 'bg-gray-100 text-gray-700' :
                            o.status === 'Aprobado' ? 'bg-sky-100 text-sky-700 font-bold' :
                            o.status === 'En preparación' ? 'bg-amber-100 text-amber-700 font-bold animate-pulse' :
                            o.status === 'Listo para envío' ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 font-medium text-xs">{o.createdBy}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Order details block */}
            <div className="lg:col-span-4 bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4 text-sm">
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Inspección de Transmisión</span>
                    <h4 className="text-base font-bold text-gray-950 mt-1">Pedido {selectedOrder.id}</h4>
                    <p className="text-xs text-gray-500">Capturado por: {selectedOrder.createdBy} &bull; {selectedOrder.date}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 block">Razón Social Cliente:</span>
                    <span className="font-bold text-gray-900 block">{selectedOrder.customerName}</span>
                    <span className="text-xs text-gray-500 block">Dirección de despacho:</span>
                    <span className="text-xs text-gray-600 block pl-2 bg-white p-1.5 rounded border border-gray-100">{selectedOrder.deliveryAddress}</span>
                  </div>

                  {/* Products packed list in current order */}
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Mesa de Surtido - Artículos:</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedOrder.items.map(item => (
                        <div key={item.productId} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-gray-150">
                          <div>
                            <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                            <p className="text-gray-400 font-mono text-[9px]">SKU: {item.sku} &bull; ${item.price.toLocaleString('es-MX')} unit.</p>
                          </div>
                          <span className="font-bold text-indigo-700 ml-1">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-100 text-indigo-950 rounded-lg flex justify-between items-center">
                    <span className="font-bold uppercase text-[11px] tracking-wide text-indigo-700">Total Transacción:</span>
                    <span className="text-lg font-bold">${selectedOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Order Status logs timeline */}
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Línea de Tiempo del Pedido</span>
                    <div className="space-y-3 pl-1">
                      {selectedOrder.statusLogs.map((log, i) => (
                        <div key={i} className="flex gap-2 text-xs relative">
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                            {i < selectedOrder.statusLogs.length - 1 && <span className="w-0.5 flex-1 bg-indigo-200"></span>}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{log.status} <span className="font-normal text-[9px] text-gray-400 font-mono">({log.date})</span></p>
                            <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">{log.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                  <FileText size={32} className="stroke-none fill-indigo-200/50 mb-2" />
                  <p className="text-sm font-semibold">Selecciona un pedido</p>
                  <p className="text-xs">Para desplegar la bitácora de empaque y estatus de logística en tiempo real.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* T6: EXPÒRTERS & REPORTS MODULE */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Central de Inteligencia y Exportaciones</h3>
            <p className="text-sm text-gray-500">Descarga a Excel de forma nativa o genera impresiones PDF oficiales con un solo clic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Card Reports */}
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-base">Reporte de Ventas Globales</h4>
                <p className="text-xs text-gray-500 leading-normal">Detallado de facturación, desglose por fecha de pedido, estatus logístico y ejecutivo de venta a cargo.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => exportToCSV('sales')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors border border-emerald-750"
                >
                  <FileSpreadsheet size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={printSalesReport}
                  className="flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-indigo-750"
                >
                  <Printer size={14} />
                  Imprimir PDF
                </button>
              </div>
            </div>

            {/* Inventory Card Reports */}
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-base">Reporte de Inventario y Costos</h4>
                <p className="text-xs text-gray-500 leading-normal">Trazabilidad de mermas, stock actual, costos de proveedor reservados de fábrica y cálculo neto de margen de rentabilidad.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => exportToCSV('inventory')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors border border-emerald-750"
                >
                  <FileSpreadsheet size={14} />
                  Exportar CSV
                </button>
                <button 
                  onClick={printInventoryReport}
                  className="flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-indigo-750"
                >
                  <Printer size={14} />
                  Imprimir PDF
                </button>
              </div>
            </div>

            {/* Clients Directory Reports */}
            <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="bg-teal-100 text-teal-700 p-2.5 rounded-lg w-10 h-10 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-base">Directorio Fiscal de Clientes</h4>
                <p className="text-xs text-gray-500 leading-normal">Base consolidada de RFC, teléfonos, correos verificados, cuentas de entrega de mercancía y facturación histórica acumulada.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => exportToCSV('customers')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors border border-emerald-750 w-full"
                >
                  <FileSpreadsheet size={14} />
                  Exportar Directorio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
