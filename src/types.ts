export type UserRole = 'Administrador' | 'Ventas' | 'Almacén';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  rfc: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  registrationDate: string;
  totalPurchased: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  minStock: number;
  stock: number;
  price: number; // Precio de Venta
  purchaseCost: number; // Costo de compra (Administrador Only)
}

export interface QuoteItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: QuoteItem[];
  total: number;
  status: 'Pendiente' | 'Convertido' | 'Rechazado';
  createdBy: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface OrderStatusLog {
  status: OrderStatus;
  date: string;
  note: string;
}

export type OrderStatus = 'Pendiente' | 'Aprobado' | 'En preparación' | 'Listo para envío' | 'Entregado';

export interface Order {
  id: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdBy: string;
  deliveryAddress: string;
  statusLogs: OrderStatusLog[];
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}
