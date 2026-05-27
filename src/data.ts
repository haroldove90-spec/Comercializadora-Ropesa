import { User, Customer, Product, Quote, Order, InventoryAdjustment } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'Laura Gómez', email: 'laura.admin@erp.com', role: 'Administrador', active: true },
  { id: 'user-2', name: 'Carlos Mendoza', email: 'carlos.sales@erp.com', role: 'Ventas', active: true },
  { id: 'user-3', name: 'Miguel Rivas', email: 'miguel.warehouse@erp.com', role: 'Almacén', active: true },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'TecnoHogar S.A. de C.V.',
    rfc: 'THE120803K82',
    phone: '5543219087',
    email: 'contacto@tecnohogar.mx',
    deliveryAddress: 'Av. Juárez 412, Col. Centro, Ciudad de México, CP 06000',
    registrationDate: '2026-01-15',
    totalPurchased: 59150,
  },
  {
    id: 'cust-2',
    name: 'Distribuidora Alfa S.A.',
    rfc: 'DAL991122AA1',
    phone: '8183401299',
    email: 'compras@distalfa.com.mx',
    deliveryAddress: 'Carretera Nacional Km 260, El Uro, Monterrey, NL, CP 64986',
    registrationDate: '2026-02-08',
    totalPurchased: 11600,
  },
  {
    id: 'cust-3',
    name: 'Construcciones del Norte S.A. de C.V.',
    rfc: 'CNO050410TT4',
    phone: '6622156844',
    email: 'admon@construccionesnorte.com',
    deliveryAddress: 'Blvd. Francisco E. Kino 105, Torre Hermosillo, Hermosillo, SON, CP 83104',
    registrationDate: '2026-03-24',
    totalPurchased: 29300,
  },
  {
    id: 'cust-4',
    name: 'Marisela Rodríguez Ruíz',
    rfc: 'RORM890714HN9',
    phone: '3314059911',
    email: 'm.rod.ruiz@outlook.com',
    deliveryAddress: 'Calle Manuel M. Diéguez 45, Col. Ladrón de Guevara, Guadalajara, JAL, CP 44600',
    registrationDate: '2026-04-12',
    totalPurchased: 0,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Laptop Dell Vostro 15.6"',
    sku: 'LAP-DELL-V3',
    category: 'Tecnología',
    minStock: 5,
    stock: 12,
    price: 18500,
    purchaseCost: 13200,
  },
  {
    id: 'prod-2',
    name: 'Monitor LG 27" IPS 4K UHD',
    sku: 'MON-LG-274K',
    category: 'Tecnología',
    minStock: 8,
    stock: 4,
    price: 6800,
    purchaseCost: 4500,
  },
  {
    id: 'prod-3',
    name: 'Teclado Mecánico Gamer RGB',
    sku: 'TEC-MECH-RGB',
    category: 'Accesorios',
    minStock: 15,
    stock: 35,
    price: 1200,
    purchaseCost: 750,
  },
  {
    id: 'prod-4',
    name: 'Cable HDMI 2.1 Ultra High Speed',
    sku: 'CAB-HDMI21',
    category: 'Accesorios',
    minStock: 20,
    stock: 18,
    price: 350,
    purchaseCost: 120,
  },
  {
    id: 'prod-5',
    name: 'Impresora Multifuncional Epson',
    sku: 'IMP-EPS-L3250',
    category: 'Tecnología',
    minStock: 6,
    stock: 10,
    price: 5400,
    purchaseCost: 3800,
  },
  {
    id: 'prod-6',
    name: 'Escritorio Ergonómico de Madera',
    sku: 'MUE-ESC-ERG',
    category: 'Mobiliario',
    minStock: 4,
    stock: 3,
    price: 4200,
    purchaseCost: 2400,
  },
  {
    id: 'prod-7',
    name: 'Silla Eergonómica de Oficina',
    sku: 'MUE-SIL-RECL',
    category: 'Mobiliario',
    minStock: 10,
    stock: 15,
    price: 2900,
    purchaseCost: 1750,
  },
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'COT-001',
    customerId: 'cust-1',
    customerName: 'TecnoHogar S.A. de C.V.',
    date: '2026-05-20',
    items: [
      { productId: 'prod-1', name: 'Laptop Dell Vostro 15.6"', sku: 'LAP-DELL-V3', quantity: 2, price: 18500 },
      { productId: 'prod-2', name: 'Monitor LG 27" IPS 4K UHD', sku: 'MON-LG-274K', quantity: 1, price: 6800 },
    ],
    total: 43800,
    status: 'Convertido',
    createdBy: 'Carlos Mendoza',
  },
  {
    id: 'COT-002',
    customerId: 'cust-2',
    customerName: 'Distribuidora Alfa S.A.',
    date: '2026-05-24',
    items: [
      { productId: 'prod-3', name: 'Teclado Mecánico Gamer RGB', sku: 'TEC-MECH-RGB', quantity: 5, price: 1200 },
      { productId: 'prod-7', name: 'Silla Eergonómica de Oficina', sku: 'MUE-SIL-RECL', quantity: 2, price: 2900 },
    ],
    total: 11800,
    status: 'Pendiente',
    createdBy: 'Carlos Mendoza',
  },
  {
    id: 'COT-003',
    customerId: 'cust-4',
    customerName: 'Marisela Rodríguez Ruíz',
    date: '2026-05-26',
    items: [
      { productId: 'prod-2', name: 'Monitor LG 27" IPS 4K UHD', sku: 'MON-LG-274K', quantity: 2, price: 6800 },
      { productId: 'prod-4', name: 'Cable HDMI 2.1 Ultra High Speed', sku: 'CAB-HDMI21', quantity: 3, price: 350 },
    ],
    total: 14650,
    status: 'Pendiente',
    createdBy: 'Carlos Mendoza',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-001',
    quoteId: 'COT-001',
    customerId: 'cust-1',
    customerName: 'TecnoHogar S.A. de C.V.',
    date: '2026-05-20',
    items: [
      { productId: 'prod-1', name: 'Laptop Dell Vostro 15.6"', sku: 'LAP-DELL-V3', quantity: 2, price: 18500 },
      { productId: 'prod-2', name: 'Monitor LG 27" IPS 4K UHD', sku: 'MON-LG-274K', quantity: 1, price: 6800 },
    ],
    total: 43800,
    status: 'Entregado',
    createdBy: 'Carlos Mendoza',
    deliveryAddress: 'Av. Juárez 412, Col. Centro, Ciudad de México, CP 06000',
    statusLogs: [
      { status: 'Pendiente', date: '2026-05-20 09:00', note: 'Orden creada por conversión de la cotización COT-001.' },
      { status: 'Aprobado', date: '2026-05-20 10:15', note: 'Pago confirmado por Finanzas. Aprobado para envío.' },
      { status: 'En preparación', date: '2026-05-20 12:40', note: 'Preparando paquete en sección Almacén-A.' },
      { status: 'Listo para envío', date: '2026-05-20 15:30', note: 'Listo y empacado con guía de envío DHL-998811.' },
      { status: 'Entregado', date: '2026-05-21 14:15', note: 'Entregado y firmado por recepcionista.' },
    ],
  },
  {
    id: 'PED-002',
    customerId: 'cust-3',
    customerName: 'Construcciones del Norte S.A. de C.V.',
    date: '2026-05-22',
    items: [
      { productId: 'prod-5', name: 'Impresora Multifuncional Epson', sku: 'IMP-EPS-L3250', quantity: 2, price: 5400 },
      { productId: 'prod-1', name: 'Laptop Dell Vostro 15.6"', sku: 'LAP-DELL-V3', quantity: 1, price: 18500 },
    ],
    total: 29300,
    status: 'Pendiente',
    createdBy: 'Laura Gómez',
    deliveryAddress: 'Blvd. Francisco E. Kino 105, Torre Hermosillo, Hermosillo, SON, CP 83104',
    statusLogs: [
      { status: 'Pendiente', date: '2026-05-22 11:30', note: 'Orden registrada directamente por Administración.' },
    ],
  },
  {
    id: 'PED-003',
    customerId: 'cust-2',
    customerName: 'Distribuidora Alfa S.A.',
    date: '2026-05-25',
    items: [
      { productId: 'prod-7', name: 'Silla Eergonómica de Oficina', sku: 'MUE-SIL-RECL', quantity: 4, price: 2900 },
    ],
    total: 11600,
    status: 'Aprobado',
    createdBy: 'Carlos Mendoza',
    deliveryAddress: 'Carretera Nacional Km 260, El Uro, Monterrey, NL, CP 64986',
    statusLogs: [
      { status: 'Pendiente', date: '2026-05-25 14:05', note: 'Orden registrada por el comercial.' },
      { status: 'Aprobado', date: '2026-05-25 14:45', note: 'Venta aprobada para surtido inmediato.' },
    ],
  },
  {
    id: 'PED-004',
    customerId: 'cust-1',
    customerName: 'TecnoHogar S.A. de C.V.',
    date: '2026-05-26',
    items: [
      { productId: 'prod-2', name: 'Monitor LG 27" IPS 4K UHD', sku: 'MON-LG-274K', quantity: 2, price: 6800 },
      { productId: 'prod-4', name: 'Cable HDMI 2.1 Ultra High Speed', sku: 'CAB-HDMI21', quantity: 5, price: 350 },
    ],
    total: 15350,
    status: 'En preparación',
    createdBy: 'Carlos Mendoza',
    deliveryAddress: 'Av. Juárez 412, Col. Centro, Ciudad de México, CP 06000',
    statusLogs: [
      { status: 'Pendiente', date: '2026-05-26 16:30', note: 'Venta urgente para entrega en oficina alterna.' },
      { status: 'Aprobado', date: '2026-05-26 17:00', note: 'Dirección aprobada. Transferencia procesada.' },
      { status: 'En preparación', date: '2026-05-27 08:30', note: 'En mesa de picking - Almacenista Miguel Rivas.' },
    ],
  },
];

export const INITIAL_ADJUSTMENTS: InventoryAdjustment[] = [
  {
    id: 'ADJ-001',
    productId: 'prod-2',
    productName: 'Monitor LG 27" IPS 4K UHD',
    sku: 'MON-LG-274K',
    type: 'Entrada',
    quantity: 10,
    reason: 'Compra a proveedor autorizada y recibida',
    date: '2026-05-15 11:20',
    user: 'Laura Gómez',
  },
  {
    id: 'ADJ-002',
    productId: 'prod-7',
    productName: 'Silla Eergonómica de Oficina',
    sku: 'MUE-SIL-RECL',
    type: 'Salida',
    quantity: 1,
    reason: 'Merma - Pistón de elevación dañado en bodega',
    date: '2026-05-18 16:45',
    user: 'Miguel Rivas',
  },
];

// Helper functions for persistent local storage database
export const loadDatabase = () => {
  const getOrInit = <T>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved) as T;
      } catch (e) {
        console.error(`Error loading state for ${key}`, e);
      }
    }
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  };

  return {
    users: getOrInit<User[]>('erp_users', INITIAL_USERS),
    customers: getOrInit<Customer[]>('erp_customers', INITIAL_CUSTOMERS),
    products: getOrInit<Product[]>('erp_products', INITIAL_PRODUCTS),
    quotes: getOrInit<Quote[]>('erp_quotes', INITIAL_QUOTES),
    orders: getOrInit<Order[]>('erp_orders', INITIAL_ORDERS),
    adjustments: getOrInit<InventoryAdjustment[]>('erp_adjustments', INITIAL_ADJUSTMENTS),
  };
};

export const saveDatabase = (db: {
  users?: User[];
  customers?: Customer[];
  products?: Product[];
  quotes?: Quote[];
  orders?: Order[];
  adjustments?: InventoryAdjustment[];
}) => {
  if (db.users) localStorage.setItem('erp_users', JSON.stringify(db.users));
  if (db.customers) localStorage.setItem('erp_customers', JSON.stringify(db.customers));
  if (db.products) localStorage.setItem('erp_products', JSON.stringify(db.products));
  if (db.quotes) localStorage.setItem('erp_quotes', JSON.stringify(db.quotes));
  if (db.orders) localStorage.setItem('erp_orders', JSON.stringify(db.orders));
  if (db.adjustments) localStorage.setItem('erp_adjustments', JSON.stringify(db.adjustments));
};
