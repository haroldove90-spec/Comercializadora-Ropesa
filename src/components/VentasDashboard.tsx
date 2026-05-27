import React, { useState } from 'react';
import { User, Customer, Product, Quote, Order, QuoteItem, OrderItem } from '../types';
import { 
  Plus, Check, X, FileText, Send, ShoppingBag, 
  Search, Users, Sparkles, Printer, Clipboard, Globe2, Mail
} from 'lucide-react';

interface VentasDashboardProps {
  products: Product[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentUser: User;
}

export default function VentasDashboard({
  products,
  customers,
  setCustomers,
  quotes,
  setQuotes,
  orders,
  setOrders,
  currentUser
}: VentasDashboardProps) {
  // Tabs: 'quotes' | 'orders' | 'customers' | 'inventory_lookup'
  const [activeTab, setActiveTab] = useState<'quotes' | 'orders' | 'customers' | 'inventory_lookup'>('quotes');

  // Customer register state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    rfc: '',
    phone: '',
    email: '',
    deliveryAddress: ''
  });

  // Quote builder state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quoteItems, setQuoteItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Selected for viewing details
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Quote | null>(null);
  const [simulatedMailModal, setSimulatedMailModal] = useState<{ isOpen: boolean; emailTo: string; quoteCode: string; contentHtml: string } | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ status: 'success' | 'err'; msg: string } | null>(null);

  const showToast = (status: 'success' | 'err', msg: string) => {
    setToast({ status, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Alta de Cliente Form handler
  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.rfc || !newCustomer.phone || !newCustomer.email || !newCustomer.deliveryAddress) {
      showToast('err', 'Por favor complete todos los datos fiscales.');
      return;
    }

    const newId = `cust-${Date.now()}`;
    const added: Customer = {
      id: newId,
      name: newCustomer.name,
      rfc: newCustomer.rfc.toUpperCase(),
      phone: newCustomer.phone,
      email: newCustomer.email,
      deliveryAddress: newCustomer.deliveryAddress,
      registrationDate: new Date().toISOString().split('T')[0],
      totalPurchased: 0
    };

    const updated = [added, ...customers];
    setCustomers(updated);
    localStorage.setItem('erp_customers', JSON.stringify(updated));

    showToast('success', 'Cliente registrado exitosamente en el catálogo fiscal.');
    setNewCustomer({ name: '', rfc: '', phone: '', email: '', deliveryAddress: '' });
  };

  // 2. Quote Building logic
  const handleAddToQuote = (prodId: string) => {
    const itemIdx = quoteItems.findIndex(i => i.productId === prodId);
    if (itemIdx > -1) {
      const copy = [...quoteItems];
      copy[itemIdx].quantity += 1;
      setQuoteItems(copy);
    } else {
      setQuoteItems([...quoteItems, { productId: prodId, quantity: 1 }]);
    }
    showToast('success', 'Producto agregado a la cotización provisional.');
  };

  const handleUpdateQty = (prodId: string, qty: number) => {
    if (qty <= 0) {
      setQuoteItems(quoteItems.filter(i => i.productId !== prodId));
    } else {
      setQuoteItems(quoteItems.map(i => i.productId === prodId ? { ...i, quantity: qty } : i));
    }
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('err', 'Debes seleccionar un cliente homologado.');
      return;
    }
    if (quoteItems.length === 0) {
      showToast('err', 'La cotización debe tener al menos un artículo del catálogo.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // Convert build items
    const parsedItems: QuoteItem[] = quoteItems.map(qi => {
      const prod = products.find(p => p.id === qi.productId);
      return {
        productId: qi.productId,
        name: prod ? prod.name : 'Artículo no identificado',
        sku: prod ? prod.sku : 'SKU-000',
        quantity: qi.quantity,
        price: prod ? prod.price : 0
      };
    });

    const quoteTotal = parsedItems.reduce((acc, current) => acc + (current.price * current.quantity), 0);
    const quoteCode = `COT-00${quotes.length + 1}`;

    const newQuote: Quote = {
      id: quoteCode,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString().split('T')[0],
      items: parsedItems,
      total: quoteTotal,
      status: 'Pendiente',
      createdBy: currentUser.name
    };

    const updatedQuotes = [newQuote, ...quotes];
    setQuotes(updatedQuotes);
    localStorage.setItem('erp_quotes', JSON.stringify(updatedQuotes));

    showToast('success', `Cotización ${quoteCode} generada con total de $${quoteTotal.toLocaleString('es-MX')}`);
    setQuoteItems([]);
    setSelectedCustomerId('');
  };

  // 3. Convertir Cotización en Pedido con 1 clic
  const handleConvertToOrder = (quote: Quote) => {
    if (quote.status === 'Convertido') {
      showToast('err', 'Esta cotización ya fue convertida a un pedido activo.');
      return;
    }

    const orderId = `PED-0${orders.length + 100}`;
    const client = customers.find(c => c.id === quote.customerId);
    const destAddress = client ? client.deliveryAddress : 'Por registrar al facturar';

    // Verify stock availability alert (doesn't block but informs seller)
    let stockAlert = false;
    quote.items.forEach(qItem => {
      const p = products.find(prod => prod.id === qItem.productId);
      if (p && p.stock < qItem.quantity) {
        stockAlert = true;
      }
    });

    const newOrder: Order = {
      id: orderId,
      quoteId: quote.id,
      customerId: quote.customerId,
      customerName: quote.customerName,
      date: new Date().toISOString().split('T')[0],
      items: quote.items.map(qi => ({
        productId: qi.productId,
        name: qi.name,
        sku: qi.sku,
        quantity: qi.quantity,
        price: qi.price
      })),
      total: quote.total,
      status: 'Aprobado', // Sales executive clicks to place active Approved order for warehousing supply
      createdBy: currentUser.name,
      deliveryAddress: destAddress,
      statusLogs: [
        { 
          status: 'Pendiente', 
          date: new Date().toLocaleString('es-MX').slice(0, 16), 
          note: `Conversión automatizada de cotización ${quote.id} por el ejecutivo ${currentUser.name}` 
        },
        { 
          status: 'Aprobado', 
          date: new Date().toLocaleString('es-MX').slice(0, 16), 
          note: `Venta confirmada por el comercial. Se libera a picking para empaquetado inmediato.` 
        }
      ]
    };

    // Update Quote Status to converted
    const updatedQuotes = quotes.map(q => q.id === quote.id ? { ...q, status: 'Convertido' as const } : q);
    setQuotes(updatedQuotes);
    localStorage.setItem('erp_quotes', JSON.stringify(updatedQuotes));

    // Append to Orders list
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('erp_orders', JSON.stringify(updatedOrders));

    // Update Customer purchase history
    if (client) {
      const updatedCustList = customers.map(c => {
        if (c.id === client.id) {
          return { ...c, totalPurchased: c.totalPurchased + quote.total };
        }
        return c;
      });
      setCustomers(updatedCustList);
      localStorage.setItem('erp_customers', JSON.stringify(updatedCustList));
    }

    let completionMsg = `¡Cotización ${quote.id} convertida en Pedido ${orderId}!`;
    if (stockAlert) {
      completionMsg += ' (Alviso: Artículos superan stock momentáneo)';
    }
    showToast('success', completionMsg);
    if (selectedQuoteDetail?.id === quote.id) {
      setSelectedQuoteDetail({ ...quote, status: 'Convertido' });
    }
  };

  // 4. Download Quote as PDF (Beautiful custom view trigger print)
  const printQuotePDF = (quote: Quote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('err', 'Por favor habilita las ventanas emergentes.');
      return;
    }

    const itemsRows = quote.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px;">${item.sku}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">$${item.price.toLocaleString('es-MX')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 13px;">$${(item.price * item.quantity).toLocaleString('es-MX')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cotización Oficial - ${quote.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; margin: 0; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em; }
            .client-box { background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; text-align: left; padding: 12px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 750; color: #1e293b; font-size: 12px; text-transform: uppercase; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; font-size: 14px; color: #475569; gap: 5px; }
            .grand-total { font-size: 20px; font-weight: bold; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 5px; }
            .footer-notes { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">SISTEMA ERP &bull; COTIZACIÓN</div>
              <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0;">Folio homolagado legal: ${quote.id}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; font-weight: bold; margin: 0;">Fecha: ${quote.date}</p>
              <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0;">Atendido por: ${quote.createdBy}</p>
            </div>
          </div>

          <div class="client-box">
            <div>
              <strong style="font-size: 11px; text-transform: uppercase; color: #4f46e5; display: block; margin-bottom: 5px;">Alineación Fiscal Comprador:</strong>
              <strong style="font-size: 15px; color: #0f172a;">${quote.customerName}</strong>
              <p style="font-size: 12px; color: #475569; font-family: monospace; margin: 5px 0 0 0;">R.F.C.: ${customers.find(c => c.id === quote.customerId)?.rfc || 'N/A'}</p>
            </div>
            <div style="text-align: right; width: 250px;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px;">Dirección de Entrega:</strong>
              <p style="font-size: 12px; color: #475569; margin: 0; line-height: 1.4;">${customers.find(c => c.id === quote.customerId)?.deliveryAddress || 'Guía express registrada en pedido'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU Código</th>
                <th>Descripción del Artículo</th>
                <th style="text-align: center;">Uds.</th>
                <th style="text-align: right;">Precio Unitario</th>
                <th style="text-align: right;">Subtotal ($)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: $${(quote.total / 1.16).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN</div>
            <div>I.V.A (16% Trasladado): $${(quote.total - (quote.total / 1.16)).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN</div>
            <div class="grand-total">Total Neto: $${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} $MXN</div>
          </div>

          <div class="footer-notes">
            <strong>Condiciones de Venta:</strong>
            <br/>1. Los precios mostrados incluyen IVA y están vigentes por un plazo de 15 días hábiles a partir de la fecha de expedición.
            <br/>2. Para habilitar el surtido en almacén, este documento debe convertirse en un pedido formal y confirmarse su transferencia.
            <br/>3. Garantía limitada de fábrica de 1 año directo sobre empaques cerrados.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // 5. Send Quote Email simulation modal trigger
  const triggerEmailSimulation = (quote: Quote) => {
    const cust = customers.find(c => c.id === quote.customerId);
    if (!cust) return;

    setSimulatedMailModal({
      isOpen: true,
      emailTo: cust.email,
      quoteCode: quote.id,
      contentHtml: `Estimado(a) de compras en ${quote.customerName},\n\nAdjunto a este correo encontrará la cotización formal de materiales ${quote.id} por un importe total de $${quote.total.toLocaleString('es-MX')} MXN para su revisión comercial.\n\nAtentamente,\n${quote.createdBy}\nÁrea de Ventas Homologadas`
    });
  };

  return (
    <div id="sales-module" className="space-y-6">
      {/* Dynamic Toast Notifications */}
      {toast && (
        <div id="sales-toast" className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.status === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.status === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Primary header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ejecutivo de Ventas / Comercial</h2>
            <p className="text-xs text-gray-500">Hola {currentUser.name} &bull; Capturar clientes, realizar cotizaciones rápidas y dar seguimiento</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 bg-gray-105 p-1 rounded-lg text-sm">
          <button 
            id="vtab-quotes"
            onClick={() => setActiveTab('quotes')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'quotes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Módulo de Cotizaciones
          </button>
          <button 
            id="vtab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Mis Pedidos Surtidos
          </button>
          <button 
            id="vtab-customers"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Alta de Clientes
          </button>
          <button 
            id="vtab-inventory"
            onClick={() => setActiveTab('inventory_lookup')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === 'inventory_lookup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Consulta Inventario (Solo Lectura)
          </button>
        </nav>
      </div>

      {/* TAB CONTENT RENDERING */}

      {/* TAB A: QUOTATIONS MODULE */}
      {activeTab === 'quotes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of existing quotes */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-105 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Últimas Cotizaciones</h3>
              <p className="text-xs text-gray-500">Seleccione un renglón para descargar PDF o convertir en pedido directo.</p>
            </div>

            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {quotes.map(q => (
                <div 
                  key={q.id} 
                  onClick={() => setSelectedQuoteDetail(q)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedQuoteDetail?.id === q.id 
                    ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' 
                    : 'border-gray-150 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-indigo-650">{q.id}</span>
                    <span className="text-gray-400 font-medium">{q.date}</span>
                  </div>
                  <p className="font-bold text-gray-950 text-sm mt-1.5 line-clamp-1">{q.customerName}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs">
                    <span className="font-bold text-gray-800">${q.total.toLocaleString('es-MX')} MXN</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.status === 'Convertido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.status === 'Convertido' ? '✓ Convertido en Pedido' : 'Pendiente Surtido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Builder or Details view */}
          <div className="lg:col-span-7 space-y-6">
            {/* Create Quote interactive workspace */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Herramienta Comercial</span>
                <h3 className="font-bold text-gray-950 text-base">Cotizador Rápido</h3>
              </div>

              <form onSubmit={handleCreateQuote} className="space-y-4 text-sm">
                {/* Customer select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paso 1: Seleccionar Cliente Homologado</label>
                  <select 
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="">-- Buscar un cliente de la base fiscal --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (RFC: {c.rfc})</option>
                    ))}
                  </select>
                </div>

                {/* Products list visual selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paso 2: Agregar artículos del Catálogo</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Filtrar por nombre para agregar..."
                        value={searchProductQuery}
                        onChange={e => setSearchProductQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 w-full bg-slate-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick-add chips */}
                  <div className="flex flex-wrap gap-2 mt-2 max-h-28 overflow-y-auto pr-1">
                    {products
                      .filter(p => !searchProductQuery || p.name.toLowerCase().includes(searchProductQuery.toLowerCase()))
                      .map(p => (
                        <button 
                          key={p.id}
                          type="button"
                          onClick={() => handleAddToQuote(p.id)}
                          className="text-xs transition-colors bg-slate-100 hover:bg-slate-200 hover:text-indigo-650 border border-gray-200 rounded-lg py-1 px-2.5 text-left flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">{p.name}</span>
                            <span className="text-gray-400 text-[10px] font-mono block">SKU: {p.sku} &bull; ${p.price.toLocaleString('es-MX')}</span>
                          </div>
                          <span className="text-indigo-600 font-bold bg-white px-1.5 rounded border border-gray-205">+</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Cart Table in current builder and live total */}
                {quoteItems.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-3">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-55 border-b border-gray-200 text-gray-500 uppercase text-[9px] font-bold">
                        <tr>
                          <th className="px-3 py-2">Material</th>
                          <th className="px-3 py-2 text-center">Cantidad</th>
                          <th className="px-3 py-2 text-right">Unitario</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {quoteItems.map(qi => {
                          const originalProd = products.find(p => p.id === qi.productId);
                          if (!originalProd) return null;
                          return (
                            <tr key={qi.productId}>
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {originalProd.name}
                                <span className="text-[10px] text-gray-400 font-mono block">SKU: {originalProd.sku}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateQty(qi.productId, qi.quantity - 1)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-1.5 py-0.5 rounded border border-gray-200"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold w-6 text-center">{qi.quantity}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateQty(qi.productId, qi.quantity + 1)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-1.5 py-0.5 rounded border border-gray-200"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">
                                ${originalProd.price.toLocaleString('es-MX')}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900">
                                ${(originalProd.price * qi.quantity).toLocaleString('es-MX')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="bg-indigo-50 p-3 text-right border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-indigo-900 text-xs uppercase">Cotización estimada:</span>
                      <span className="text-sm font-extrabold text-indigo-900">
                        $ {quoteItems.reduce((acc, current) => {
                          const p = products.find(prod => prod.id === current.productId);
                          return acc + (p ? p.price * current.quantity : 0);
                        }, 0).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    disabled={quoteItems.length === 0}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors ${
                      quoteItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Sparkles size={13} />
                    Validar y Generar Cotización
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar detailing selected quote */}
            {selectedQuoteDetail && (
              <div id="quote-preview-sidebar" className="bg-slate-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Vista Previa de Documento</span>
                    <h4 className="font-extrabold text-gray-900 text-base">{selectedQuoteDetail.id}</h4>
                  </div>
                  <button onClick={() => setSelectedQuoteDetail(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Comprador Tributario:</span>
                    <span className="font-bold text-gray-800">{selectedQuoteDetail.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Fecha Registro:</span>
                    <span className="font-bold text-gray-800">{selectedQuoteDetail.date}</span>
                  </div>
                </div>

                {/* Items in selected quote */}
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">Partidas Cotizadas:</span>
                  <div className="space-y-1 bg-white p-2.5 rounded border border-gray-150 max-h-36 overflow-y-auto">
                    {selectedQuoteDetail.items.map(i => (
                      <div key={i.productId} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                        <span className="text-gray-700 font-medium">{i.name} (x{i.quantity})</span>
                        <span className="font-bold text-gray-900">${(i.price * i.quantity).toLocaleString('es-MX')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1.5 font-bold text-indigo-700">
                      <span>Total Neto (Suma):</span>
                      <span>${selectedQuoteDetail.total.toLocaleString('es-MX')} MXN</span>
                    </div>
                  </div>
                </div>

                {/* Operations checklist buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button 
                    id="btn-print-quote"
                    onClick={() => printQuotePDF(selectedQuoteDetail)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-300 hover:bg-gray-105 rounded-lg text-xs font-semibold py-2 text-gray-700 whitespace-nowrap transition-colors"
                  >
                    <Printer size={13} />
                    Imprimir / Descargar PDF
                  </button>
                  <button 
                    id="btn-email-quote"
                    onClick={() => triggerEmailSimulation(selectedQuoteDetail)}
                    className="flex items-center justify-center gap-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold px-3 py-2 transition-colors"
                  >
                    <Mail size={13} />
                    Enviar
                  </button>

                  {/* 1-CLICK CONVERSION BUTTON */}
                  <button 
                    id="btn-convert-quote-order"
                    onClick={() => handleConvertToOrder(selectedQuoteDetail)}
                    className={`w-full flex items-center justify-center gap-1 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-all ${
                      selectedQuoteDetail.status === 'Convertido' 
                      ? 'bg-gray-355 text-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-indigo-600 hover:bg-indigo-700 p-2 text-indigo-950 hover:text-white'
                    }`}
                    disabled={selectedQuoteDetail.status === 'Convertido'}
                  >
                    <ShoppingBag size={13} />
                    {selectedQuoteDetail.status === 'Convertido' ? '¡Ya Convertido en Pedido!' : 'Convertir en Pedido (1-Clic)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB B: MY PLACED ORDERS TRACKING */}
      {activeTab === 'orders' && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Seguimiento de Pedidos y Logística</h3>
            <p className="text-xs text-gray-500">Monitoree en tiempo real el paso del pedido de picking a transporte para informar a su cliente.</p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-gray-205 text-gray-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Código Pedido</th>
                  <th className="px-5 py-3">Cliente Comprador</th>
                  <th className="px-5 py-3">Fecha Generación</th>
                  <th className="px-5 py-3 text-right">Monto Total</th>
                  <th className="px-5 py-3 text-center">Estatus Entrega</th>
                  <th className="px-5 py-3">Dirección de Surtido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/40 text-xs">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{o.id}</td>
                    <td className="px-5 py-3.5 text-gray-900 font-semibold">{o.customerName}</td>
                    <td className="px-5 py-3.5 text-gray-500">{o.date}</td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-gray-950">
                      ${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        o.status === 'Pendiente' ? 'bg-gray-100 text-gray-700' :
                        o.status === 'Aprobado' ? 'bg-sky-100 text-sky-700 font-bold' :
                        o.status === 'En preparación' ? 'bg-amber-100 text-amber-700 font-bold animate-pulse' :
                        o.status === 'Listo para envío' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-800 font-bold'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 line-clamp-1 max-w-xs">{o.deliveryAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: HIGH CLIENT FORMS */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form to enlist new customers */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Nueva Alta de Cliente</h3>
              <p className="text-xs text-gray-500">Formulario homologado para registrar un nuevo comprador en los registros.</p>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Nombre Completo o Razón Social</label>
                  <input 
                    type="text" 
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Ej. Comercializadora Estrella S.A." 
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Registro Federal de Contribuyentes (R.F.C. / Tax ID)</label>
                  <input 
                    type="text" 
                    value={newCustomer.rfc}
                    onChange={e => setNewCustomer({ ...newCustomer, rfc: e.target.value })}
                    placeholder="Ej. CES160803KM5" 
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Teléfono Directo</label>
                  <input 
                    type="tel" 
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="10 dígitos del comprador" 
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Correo Recibo de Facturas</label>
                  <input 
                    type="email" 
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="compras@cliente.com" 
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Dirección Completa de Despacho (Surtido)</label>
                <textarea 
                  rows={3}
                  value={newCustomer.deliveryAddress}
                  onChange={e => setNewCustomer({ ...newCustomer, deliveryAddress: e.target.value })}
                  placeholder="Calle, Número, Colonia, Municipio, Código Postal y Estado" 
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-1 border border-indigo-750 transition-colors"
                >
                  <Plus size={14} />
                  Ingresar Cliente Homologado
                </button>
              </div>
            </form>
          </div>

          {/* Quick List of Registered Customers */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Directorio Homologado</h3>
              <p className="text-xs text-gray-500">Últimos clientes integrados en la base de datos comercial.</p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {customers.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <div className="flex justify-between text-gray-500 font-mono mt-1 text-[10px]">
                    <span>RFC: {c.rfc}</span>
                    <span>Tel: {c.phone}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 line-clamp-1">CP: {c.deliveryAddress}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: READ ONLY INVENTORY FOR COMMERCIAL */}
      {activeTab === 'inventory_lookup' && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Consulta del Stock del Almacén</h3>
              <p className="text-xs text-gray-500">Solo Lectura: Monitoree la disponibilidad comercial. **Precios y costos confidenciales del proveedor están protegidos**.</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-gray-205 text-gray-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">SKU Código</th>
                  <th className="px-5 py-3">Descripción del Material</th>
                  <th className="px-5 py-3">Categoría de Bodega</th>
                  <th className="px-5 py-3 text-right">Precio Venta Público ($)</th>
                  <th className="px-5 py-3 text-center">Disponibilidad en Almacén</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-55/30 text-xs">
                      <td className="px-5 py-3.5 font-mono text-gray-500 font-semibold">{p.sku}</td>
                      <td className="px-5 py-3.5 text-gray-900 font-bold">{p.name}</td>
                      <td className="px-5 py-3.5 text-gray-500 capitalize">{p.category}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-indigo-750">
                        ${p.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-3 py-1 font-bold rounded-lg text-xs inline-block ${
                          p.stock === 0 
                          ? 'bg-rose-100 text-rose-800' 
                          : isLow 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock === 0 ? 'Sin existencias' : `${p.stock} pzas`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMAIL TRANSMISSION SIMULATION DRAWER MODAL */}
      {simulatedMailModal?.isOpen && (
        <div id="email-portal-dialog" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-opacityIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4 mx-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5 text-indigo-650">
                <Globe2 size={18} />
                <span className="font-bold text-sm tracking-tight">Servidor de Correo Interno Surtido</span>
              </div>
              <button 
                onClick={() => setSimulatedMailModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex border-b border-gray-150 pb-2">
                <span className="w-14 font-semibold text-gray-400">Para:</span>
                <span className="font-mono font-bold text-gray-800">{simulatedMailModal.emailTo}</span>
              </div>
              <div className="flex border-b border-gray-150 pb-2">
                <span className="w-14 font-semibold text-gray-400">Asunto:</span>
                <span className="font-semibold text-gray-800">Adjunto: Cotización Oficial Solicitada ({simulatedMailModal.quoteCode})</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-150 rounded-lg text-gray-600 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {simulatedMailModal.contentHtml}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button 
                id="btn-confirm-email"
                onClick={() => {
                  showToast('success', '¡Simulación de correo transferida con éxito al destinatario!');
                  setSimulatedMailModal(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send size={12} />
                Enviar Correo Digital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
