import {
  Supplier,
  Product,
  SalesInvoice,
  PurchaseOrder,
  PurchaseInvoice,
  InventoryTransaction,
} from '@/types/billing';

class LocalStorageManager {
  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.getFromStorage<Supplier>('billing_suppliers');
  }

  saveSuppliers(suppliers: Supplier[]): void {
    this.saveToStorage('billing_suppliers', suppliers);
  }

  addSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    suppliers.push(supplier);
    this.saveSuppliers(suppliers);
  }

  updateSupplier(id: string, updatedSupplier: Partial<Supplier>): void {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...updatedSupplier };
      this.saveSuppliers(suppliers);
    }
  }

  deleteSupplier(id: string): void {
    const suppliers = this.getSuppliers().filter(s => s.id !== id);
    this.saveSuppliers(suppliers);
  }

  // Products
  getProducts(): Product[] {
    return this.getFromStorage<Product>('billing_products');
  }

  saveProducts(products: Product[]): void {
    this.saveToStorage('billing_products', products);
  }

  addProduct(product: Product): void {
    const products = this.getProducts();
    products.push(product);
    this.saveProducts(products);
  }

  updateProduct(id: string, updatedProduct: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      this.saveProducts(products);
    }
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // Sales Invoices
  getSalesInvoices(): SalesInvoice[] {
    return this.getFromStorage<SalesInvoice>('billing_sales_invoices');
  }

  saveSalesInvoices(invoices: SalesInvoice[]): void {
    this.saveToStorage('billing_sales_invoices', invoices);
  }

  addSalesInvoice(invoice: SalesInvoice): void {
    const invoices = this.getSalesInvoices();
    invoices.push(invoice);
    this.saveSalesInvoices(invoices);
  }

  updateSalesInvoice(id: string, updatedInvoice: Partial<SalesInvoice>): void {
    const invoices = this.getSalesInvoices();
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updatedInvoice };
      this.saveSalesInvoices(invoices);
    }
  }

  deleteSalesInvoice(id: string): void {
    const invoices = this.getSalesInvoices().filter(i => i.id !== id);
    this.saveSalesInvoices(invoices);
  }

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[] {
    return this.getFromStorage<PurchaseOrder>('billing_purchase_orders');
  }

  savePurchaseOrders(orders: PurchaseOrder[]): void {
    this.saveToStorage('billing_purchase_orders', orders);
  }

  addPurchaseOrder(order: PurchaseOrder): void {
    const orders = this.getPurchaseOrders();
    orders.push(order);
    this.savePurchaseOrders(orders);
  }

  // Purchase Invoices
  getPurchaseInvoices(): PurchaseInvoice[] {
    return this.getFromStorage<PurchaseInvoice>('billing_purchase_invoices');
  }

  savePurchaseInvoices(invoices: PurchaseInvoice[]): void {
    this.saveToStorage('billing_purchase_invoices', invoices);
  }

  addPurchaseInvoice(invoice: PurchaseInvoice): void {
    const invoices = this.getPurchaseInvoices();
    invoices.push(invoice);
    this.savePurchaseInvoices(invoices);
  }

  // Inventory Transactions
  getInventoryTransactions(): InventoryTransaction[] {
    return this.getFromStorage<InventoryTransaction>('billing_inventory_transactions');
  }

  saveInventoryTransactions(transactions: InventoryTransaction[]): void {
    this.saveToStorage('billing_inventory_transactions', transactions);
  }

  addInventoryTransaction(transaction: InventoryTransaction): void {
    const transactions = this.getInventoryTransactions();
    transactions.push(transaction);
    this.saveInventoryTransactions(transactions);
  }


  // Generate unique ID
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Generate sequential invoice numbers
  getNextInvoiceNumber(): string {
    const invoices = this.getSalesInvoices();
    const lastNumber = invoices.length > 0 
      ? Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber.replace(/\D/g, '')) || 0))
      : 0;
    return `INV-${String(lastNumber + 1).padStart(5, '0')}`;
  }

  getNextPurchaseOrderNumber(): string {
    const orders = this.getPurchaseOrders();
    const lastNumber = orders.length > 0 
      ? Math.max(...orders.map(ord => parseInt(ord.orderNumber.replace(/\D/g, '')) || 0))
      : 0;
    return `PO-${String(lastNumber + 1).padStart(4, '0')}`;
  }
}

export const storageManager = new LocalStorageManager();