export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  unit: string;
  hsn?: string;
  taxRate: number;
  createdAt: Date;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  mrp: number;
  taxRate: number;
  amount: number;
}


export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  otherCharges?: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'paid' | 'overdue';
  notes?: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: Date;
  expectedDate?: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'pending' | 'sent' | 'received' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'pending' | 'paid';
  notes?: string;
  createdAt: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
  date: Date;
  createdAt: Date;
}


export interface TaxDetail {
  name: string;
  rate: number;
  amount: number;
}