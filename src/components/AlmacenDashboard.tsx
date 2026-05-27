import React, { useState } from 'react';
import { User, Product, Order, InventoryAdjustment } from '../types';
import { 
  Package, Plus, AlertTriangle, Play, ClipboardCheck, ArrowUpRight, 
  ArrowDownRight, Check, X, Box, ArrowRight, Truck, Eye
} from 'lucide-react';

interface AlmacenDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  adjustments: InventoryAdjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<InventoryAdjustment[]>>;
  currentUser: User;
}

export default function AlmacenDashboard({
  products,
  setProducts,
  orders,
  setOrders,
  adjustments,
  setAdjustments,
  currentUser
}: AlmacenDashboardProps) {
  // Tabs: 'inventory_control' | 'low_stock' | 'fulfillment'
  const [activeTab, setActiveTab] = useState<'inventory_control' | 'low_stock' | 'fulfillment'>('inventory_control');

  // Product CRUD states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState(5);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdPrice, setNewProdPrice] = useState(100);

  // Stock Adjustment states
  const [adjustmentTargetProduct, setAdjustmentTargetProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Surtimiento states
  const [selectedFulfillmentOrder, setSelectedFulfillmentOrder] = useState<Order | null>(null);
  // Track checked items physically as picking list
  const [checkedPickingItems, setCheckedPickingItems] = useState<Record<string, boolean>>({});

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'ok' | 'fail'; msg: string } | null>(null);

  const triggerToast = (type: 'ok' | 'fail', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. ADD NEW PRODUCT CRUD
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || !newProdCategory) {
      triggerToast('fail', 'Por favor rellene todos los campos del producto.');
      return;
    }

    // SKU uniqueness control
    if (products.some(p => p.sku === newProdSku.toUpperCase())) {
      triggerToast('fail', 'El SKU ya está registrado en la base de datos.');
      return;
    }

    const uniqueId = `prod-${Date.now()}`;
    const autoCost = Math.round(newProdPrice * 0.65); // Dynamic auto purchase cost for admin margins tracking (protected from warehouse staff)
    
    const newProduct: Product = {
      id: uniqueId,
      name: newProdName,
      sku: newProdSku.toUpperCase(),
      category: newProdCategory,
      minStock: newProdMinStock,
      stock: newProdStock,
      price: newProdPrice,
      purchaseCost: autoCost // auto estimated to satisfy permissions matrix
    };

    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem('erp_products', JSON.stringify(updated));

    triggerToast('ok', `Producto "${newProduct.name}" agregado con éxito.`);
    setShowAddProductModal(false);
    
    // Clear fields
    setNewProdName('');
    setNewProdSku('');
    setNewProdCategory('');
    setNewProdMinStock(5);
    setNewProdStock(10);
    setNewProdPrice(100);
  };

  // 2. ADJUST STOCK DIRECTLY IN STORAGE
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentTargetProduct || adjustmentQty <= 0 || !adjustmentReason) {
      triggerToast('fail', 'Especifica una cantidad válida y motivo de auditoría.');
      return;
    }

    // Verify stock deduction safety
    if (adjustmentType === 'Salida' && adjustmentQty > adjustmentTargetProduct.stock) {
      triggerToast('fail', `La salida (${adjustmentQty}) supera el stock existente (${adjustmentTargetProduct.stock} uds).`);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === adjustmentTargetProduct.id) {
        const delta = adjustmentType === 'Entrada' ? adjustmentQty : -adjustmentQty;
        return {
          ...p,
          stock: Math.max(0, p.stock + delta)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem('erp_products', JSON.stringify(updatedProducts));

    // Register log in adjustments table
    const newAdjustmentObj: InventoryAdjustment = {
      id: `ADJ-00${adjustments.length + 1}`,
      productId: adjustmentTargetProduct.id,
      productName: adjustmentTargetProduct.name,
      sku: adjustmentTargetProduct.sku,
      type: adjustmentType,
      quantity: adjustmentQty,
      reason: adjustmentReason,
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      user: currentUser.name
    };

    const updatedAdjusts = [newAdjustmentObj, ...adjustments];
    setAdjustments(updatedAdjusts);
    localStorage.setItem('erp_adjustments', JSON.stringify(updatedAdjusts));

    triggerToast('ok', `Ajuste (${adjustmentType}) aplicado correctamenete.`);
    setAdjustmentTargetProduct(null);
    setAdjustmentQty(1);
    setAdjustmentReason('');
  };

  // 3. FULFILLMENT & LOGISTICS CHANGES
  const updateFulfillmentStatus = (orderId: string, currentStatus: string, nextStatus: typeof orders[number]['status']) => {
    let note = '';
    if (nextStatus === 'En preparación') {
      note = `Pedido asignado a mesa de picking. Almacenista asignado: ${currentUser.name}. Empieza recolección física.`;
    } else if (nextStatus === 'Listo para envío') {
      note = `Picking yPacking completado. Paquete sellado y flejado. Listo para recolección por paquetería express.`;
    } else if (nextStatus === 'Entregado') {
      note = `Confirmación logística: Producto arribó exitosamente en domicilio y se obtuvo firma de conformidad.`;
    }

    // Deduct stock physically from database only upon transition to Packing "En preparación" or "Listo para envío"
    let stockError = false;
    let productsListWithCostDeductions = [...products];

    if (nextStatus === 'En preparación' && currentStatus === 'Aprobado') {
      // Find the specific order to inspect quantites
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        // Evaluate stock on each item before packing
        targetOrder.items.forEach(oItem => {
          const matchedDbProduct = productsListWithCostDeductions.find(p => p.id === oItem.productId);
          if (matchedDbProduct) {
            if (matchedDbProduct.stock < oItem.quantity) {
              stockError = true;
            }
          }
        });

        if (!stockError) {
          // Deduct from db
          productsListWithCostDeductions = productsListWithCostDeductions.map(dbP => {
            const ordItem = targetOrder.items.find(ot => ot.productId === dbP.id);
            if (ordItem) {
              return { ...dbP, stock: Math.max(0, dbP.stock - ordItem.quantity) };
            }
            return dbP;
          });
          setProducts(productsListWithCostDeductions);
          localStorage.setItem('erp_products', JSON.stringify(productsListWithCostDeductions));
        }
      }
    }

    if (stockError) {
      triggerToast('fail', 'No se puede surtir: Algunos productos en el pedido superan el stock físico disponible en bodega.');
      return;
    }

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          statusLogs: [
            ...o.statusLogs,
            { status: nextStatus, date: new Date().toISOString().substring(0, 16).replace('T', ' '), note }
          ]
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('erp_orders', JSON.stringify(updatedOrders));
    triggerToast('ok', `Estatus del Pedido ${orderId} actualizado a: ${nextStatus}.`);

    // Keep active preview updated
    const updatedSelected = updatedOrders.find(o => o.id === orderId);
    if (updatedSelected) {
      setSelectedFulfillmentOrder(updatedSelected);
    }
  };

  // Helper trigger picking list tick
  const handleTogglePickCheck = (productId: string) => {
    setCheckedPickingItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Inactive/Active states for picking fulfilment
  const activeIncomingFulfillments = orders.filter(o => o.status === 'Aprobado' || o.status === 'En preparación');
  const historicalFulfillments = orders.filter(o => o.status === 'Listo para envío' || o.status === 'Entregado' || o.status === 'Pendiente');

  return (
    <div id="warehouse-module" className="space-y-6">
      {/* Toast notifier */}
      {toast && (
        <div id="warehouse-toast" className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'ok' ? <Check size={18} /> : <X size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Module Title Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Encargado de Almacén / Operaciones</h2>
            <p className="text-xs text-gray-500">Hola {currentUser.name} &bull; Control del inventario físico, embalaje express y administración de surtido</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 bg-gray-105 p-1 rounded-lg text-sm">
          <button 
            id="alab-inventory"
            onClick={() => setActiveTab('inventory_control')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'inventory_control' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Gestión de Inventario (CRUD)
          </button>
          <button 
            id="alab-low-stock"
            onClick={() => setActiveTab('low_stock')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'low_stock' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Alertas Reabastecimiento
          </button>
          <button 
            id="alab-fulfill"
            onClick={() => {
              setActiveTab('fulfillment');
              setSelectedFulfillmentOrder(null);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'fulfillment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Surtido de Pedidos ({activeIncomingFulfillments.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: INVENTORY CONTROL AND ADJUSTMENTS */}
      {activeTab === 'inventory_control' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Ingreso y Modificación de Catálogos</h3>
                <p className="text-xs text-gray-500">Registre nuevos productos homologados o reasigne stock físico por entradas de proveedor o mermas.</p>
              </div>
              <button 
                id="btn-trigger-add-prod"
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                <Plus size={14} />
                Nuevo Material / Producto
              </button>
            </div>

            {/* NEW PRODUCT POPUP COMPONENT (CRUD) */}
            {showAddProductModal && (
              <div id="add-product-container" className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-150 animate-fadeIn space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-150/40 pb-1.5">
                  <span className="font-bold text-indigo-950 text-xs uppercase tracking-wide">Alta de Nuevo Producto homologado</span>
                  <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 text-xs">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Nombre Comercial</label>
                    <input 
                      type="text" 
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      placeholder="Ej. Gabinete Gamer NZXT" 
                      className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">SKU Código de Gomas</label>
                    <input 
                      type="text" 
                      value={newProdSku}
                      onChange={e => setNewProdSku(e.target.value)}
                      placeholder="Ej. GAB-NZXT-H5" 
                      className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Categoría Bodega</label>
                    <input 
                      type="text" 
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value)}
                      placeholder="Ej. Tecnología" 
                      className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Stock Mínimo Alerta</label>
                    <input 
                      type="number" 
                      value={newProdMinStock}
                      onChange={e => setNewProdMinStock(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Stock Inicial de Entrada</label>
                    <input 
                      type="number" 
                      value={newProdStock}
                      onChange={e => setNewProdStock(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Precio Venta Público</label>
                    <div className="flex gap-1">
                      <input 
                        type="number" 
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        min={1}
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-indigo-600 text-white font-bold p-1.5 px-3 rounded hover:bg-indigo-750 transition-colors"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Inventory control listing table with adjustments trigger */}
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-gray-205 text-gray-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3">Código SKU</th>
                    <th className="px-5 py-3">Descripción Oficial</th>
                    <th className="px-5 py-3">Categoría</th>
                    <th className="px-5 py-3 text-center">Física Actual</th>
                    <th className="px-5 py-3 text-center">Mínimo Alerta</th>
                    <th className="px-5 py-3 text-right">Precio Venta Público</th>
                    <th className="px-5 py-3 text-right">Acciones de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {products.map(p => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-55/30 text-xs">
                        <td className="px-5 py-3.5 font-mono text-gray-500 font-semibold">{p.sku}</td>
                        <td className="px-5 py-3.5 text-gray-900 font-bold">{p.name}</td>
                        <td className="px-5 py-3.5 text-gray-500 capitalize">{p.category}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded font-extrabold ${isLow ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                            {p.stock} pzas
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-500 font-medium">{p.minStock} pzas</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-600">
                          ${p.price.toLocaleString('es-MX')} MXN
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            id={`btn-adjust-${p.sku}`}
                            onClick={() => {
                              setAdjustmentTargetProduct(p);
                              setAdjustmentType('Entrada');
                              setAdjustmentReason('');
                              setAdjustmentQty(1);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 font-bold text-[11px] rounded transition-colors"
                          >
                            Ajustar Stock (Entrada/Merma)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REAL TIME MANUAL ADJUSTMENT WORKSPACE DOCK */}
          {adjustmentTargetProduct && (
            <div id="adjustment-dock" className="bg-slate-50 p-5 rounded-xl border-2 border-indigo-150 shadow-sm space-y-4 animate-scaleUp">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest block">Consola de Ajuste Físico</span>
                  <h4 className="font-extrabold text-gray-950 text-base">{adjustmentTargetProduct.name}</h4>
                  <p className="text-xs text-gray-500 font-mono">Código SKU: {adjustmentTargetProduct.sku} | Existencia actual: {adjustmentTargetProduct.stock} uds</p>
                </div>
                <button 
                  onClick={() => setAdjustmentTargetProduct(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplyAdjustment} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">1. Dirección de Ajuste</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setAdjustmentType('Entrada')}
                      className={`flex items-center justify-center gap-1 p-2 rounded-lg font-bold border transition-all ${
                        adjustmentType === 'Entrada' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold' 
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowUpRight size={14} />
                      + Entrada
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAdjustmentType('Salida')}
                      className={`flex items-center justify-center gap-1 p-2 rounded-lg font-bold border transition-all ${
                        adjustmentType === 'Salida' 
                        ? 'bg-rose-50 text-rose-800 border-rose-400 font-bold' 
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowDownRight size={14} />
                      - Merma / Baja
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 font-bold mb-1">2. Volumen a Ajustar</label>
                  <input 
                    type="number"
                    min={1}
                    value={adjustmentQty}
                    onChange={e => setAdjustmentQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-bold mb-1">3. Motivo Justificado & Confirmar</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ej. Compra directa / Ajuste de merma rota"
                      value={adjustmentReason}
                      onChange={e => setAdjustmentReason(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold w-32 rounded-lg py-2 shadow transition-colors"
                    >
                      Aplicar Ajuste
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRITICAL LOW STOCK REPLENISHMENT DIRECTORY */}
      {activeTab === 'low_stock' && (
        <div className="bg-white p-5 rounded-xl border border-gray-105 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-901 text-base">Alerta de Reabastecimiento Crítico</h3>
            <p className="text-xs text-gray-500">Muestrario de gomas y herramientas cuya existencia se desliza debajo del límite comercial prudente.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.filter(p => p.stock <= p.minStock).length === 0 ? (
              <div className="col-span-full bg-emerald-50 p-6 border border-emerald-200 rounded-xl text-center">
                <Check className="mx-auto text-emerald-600 mb-2" size={28} />
                <h4 className="font-bold text-emerald-800 text-sm">Bodega al 100% Capacitada</h4>
                <p className="text-xs text-emerald-600 leading-normal mt-0.5">Todos los materiales catalogados cuentan con existencias superiores a sus límites mínimos.</p>
              </div>
            ) : (
              products
                .filter(p => p.stock <= p.minStock)
                .map(p => {
                  const needed = p.minStock - p.stock + 5; // Re-order recommendation
                  return (
                    <div key={p.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex flex-col justify-between space-y-3 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <code className="text-[10px] font-bold font-mono text-amber-800 bg-amber-100/60 px-2 py-0.2 rounded">{p.sku}</code>
                          <span className="text-[10px] text-gray-400 italic">Mínimo: {p.minStock}</span>
                        </div>
                        <h4 className="font-bold text-gray-901 text-xs mt-2 line-clamp-1">{p.name}</h4>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-xl font-black text-rose-600">{p.stock}</span>
                          <span className="text-xs text-gray-500 font-medium">piezas en bodega</span>
                        </div>
                      </div>

                      <div className="border-t border-amber-250/50 pt-2 text-[10px] leading-relaxed text-gray-600">
                        <strong className="text-indigo-700 block">Sugerencia de Recompra:</strong>
                        Se recomiendan pedir <strong className="font-bold">{needed} uds</strong> comerciales para restaurar el flujo en anaquel.
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGISTICAL PICKING & FULFILLMENT */}
      {activeTab === 'fulfillment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incoming orders queue to fulfill */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Órdenes Por Surtir</h3>
              <p className="text-xs text-gray-500">Pedidos autorizados por venta listos para la mesa de empaquetado.</p>
            </div>

            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {activeIncomingFulfillments.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-gray-250 rounded-xl text-gray-400 text-xs">
                  <Box className="mx-auto mb-2 opacity-50 stroke-none fill-indigo-200" size={32} />
                  Ningún pedido espera surtido en bodega.
                </div>
              ) : (
                activeIncomingFulfillments.map(o => (
                  <div 
                    key={o.id}
                    onClick={() => {
                      setSelectedFulfillmentOrder(o);
                      setCheckedPickingItems({});
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedFulfillmentOrder?.id === o.id 
                      ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' 
                      : 'border-gray-150 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-indigo-750">{o.id}</span>
                      <span className="text-gray-400 font-medium">{o.date}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-xs mt-1.5 leading-relaxed truncate">{o.customerName}</p>
                    <div className="flex justify-between items-center text-[10px] mt-3 pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-500">{o.items.reduce((acc, current) => acc + current.quantity, 0)} artículos</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-extrabold">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE FULL DETAILS FULFILLMENT WORKSPACE */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
            {selectedFulfillmentOrder ? (
              <div className="space-y-4 text-xs text-gray-700">
                <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Mesa de Packing y Flejado</span>
                    <h4 className="font-extrabold text-gray-950 text-base">{selectedFulfillmentOrder.id}</h4>
                    <p className="text-[10px] text-gray-400">Capturado: {selectedFulfillmentOrder.date} &bull; Estatus: {selectedFulfillmentOrder.status}</p>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    {/* Status Logistics quick updates triggers */}
                    {selectedFulfillmentOrder.status === 'Aprobado' && (
                      <button 
                        id="btn-picking-process"
                        onClick={() => updateFulfillmentStatus(selectedFulfillmentOrder.id, selectedFulfillmentOrder.status, 'En preparación')}
                        className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-lg py-2 px-3.5 shadow-sm transition-all"
                      >
                        <Play size={11} />
                        Iniciar Surtido / Empaque
                      </button>
                    )}
                    {selectedFulfillmentOrder.status === 'En preparación' && (
                      <button 
                        id="btn-ready-carrier"
                        onClick={() => {
                          // Check if all packed
                          const allChecked = selectedFulfillmentOrder.items.every(i => checkedPickingItems[i.productId]);
                          if (!allChecked && !confirm('¿Desea marcar listo el paquete sin haber tildado todos los artículos de la lista?')) {
                            return;
                          }
                          updateFulfillmentStatus(selectedFulfillmentOrder.id, selectedFulfillmentOrder.status, 'Listo para envío');
                        }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg py-2 px-3.5 shadow-sm transition-all"
                      >
                        <Check size={11} />
                        Flejado Terminado &bull; Listo para envío
                      </button>
                    )}
                    {selectedFulfillmentOrder.status === 'Listo para envío' && (
                      <button 
                        id="btn-delivered"
                        onClick={() => updateFulfillmentStatus(selectedFulfillmentOrder.id, selectedFulfillmentOrder.status, 'Entregado')}
                        className="flex items-center gap-1 bg-sky-650 hover:bg-sky-700 text-white font-extrabold rounded-lg py-2 px-3.5 shadow-sm"
                      >
                        <Truck size={11} />
                        Despachar &bull; Reportar Entregado
                      </button>
                    )}
                    {selectedFulfillmentOrder.status === 'Entregado' && (
                      <span className="text-emerald-700 font-extrabold px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-1 text-[11px]">
                        ✓ Entregado con Conformidad
                      </span>
                    )}
                  </div>
                </div>

                {/* Cliente / Destinatario Desglose */}
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-150 space-y-1.5 leading-normal">
                  <p className="font-bold text-gray-901">Recibe: {selectedFulfillmentOrder.customerName}</p>
                  <p className="text-gray-600"><strong className="font-semibold text-gray-500">Domicilio Fiscal:</strong> {selectedFulfillmentOrder.deliveryAddress}</p>
                </div>

                {/* INTERACTIVE PACKING LIST */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-200 pb-1">
                    <span>Lista de Empaque (Picking Check)</span>
                    <span className="text-indigo-600">Confirma para sellar</span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedFulfillmentOrder.items.map(pItem => {
                      const isChecked = !!checkedPickingItems[pItem.productId];
                      return (
                        <div 
                          key={pItem.productId} 
                          onClick={() => handleTogglePickCheck(pItem.productId)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked 
                            ? 'bg-emerald-50/40 border-emerald-300' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {}} // handled by click
                              className="rounded border-gray-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 pointer-events-none"
                            />
                            <div>
                              <p className={`font-bold ${isChecked ? 'line-through text-gray-400' : 'text-gray-900'}`}>{pItem.name}</p>
                              <code className="text-[10px] font-mono text-gray-400 block mt-0.5">SKU: {pItem.sku}</code>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs font-black text-gray-950 bg-slate-100 px-2.5 py-1 rounded-full">
                              Cantidad: {pItem.quantity} pzas
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Logistics Trace History */}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Histórico de Movimiento Logístico</span>
                  <div className="space-y-2 max-h-24 overflow-y-auto pr-1 pl-1">
                    {selectedFulfillmentOrder.statusLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 text-[10px]">
                        <span className="text-gray-400 font-mono font-bold">[{log.date}]</span>
                        <p className="text-gray-600">
                          <strong className="text-gray-900 font-bold">{log.status}:</strong> {log.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                <ClipboardCheck size={36} className="text-indigo-200 mb-2" />
                <p className="text-sm font-semibold">Consola Lista de Empaque</p>
                <p className="text-xs max-w-xs">Seleccione un pedido por surtir del menú izquierdo para auditar piezas e imprimir checklists.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
