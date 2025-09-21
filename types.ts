export type Page = 'dashboard' | 'products' | 'pos' | 'invoices' | 'customers' | 'suppliers' | 'reports' | 'expenses' | 'settings' | 'addProduct' | 'editProduct' | 'productDetail' | 'notifications' | 'checkout' | 'customerDetail' | 'invoiceDetail' | 'addCustomer' | 'editCustomer' | 'addSupplier' | 'editSupplier' | 'supplierDetail' | 'addPurchaseInvoice' | 'purchaseInvoiceDetail' | 'offers' | 'notificationSettings' | 'customFieldsSettings' | 'cameraScanner' | 'cameraCapture';

export type FieldType = 'text' | 'number' | 'date';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  purchasePrice: number;
  stock: number;
  barcode: string;
  imageUrl: string; // Can be a remote URL or a local base64 data URL
  expiryDate?: string;
  customFields?: { [key: string]: string };
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'expiry_soon' | 'debt_limit';
  message: string;
  read: boolean;
  productId?: number;
  customerId?: number;
}

export interface SalesData {
  name: string;
  sales: number;
}

export interface CustomFieldDef {
  id: string;
  name: string;
  type: FieldType;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

export interface Invoice {
  id: number;
  customerId?: number; // Optional for cash sales without a customer
  items: CartItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  manualDiscountAmount?: number;
  taxAmount?: number;
  total: number;
  paidAmount: number;
  debt: number;
  change?: number; // Change to be given back to the customer
  date: string;
  type: 'cash' | 'credit';
  status?: 'completed' | 'partially_returned' | 'fully_returned';
  returnedItems?: CartItem[];
}

export interface Payment {
  id: number;
  customerId: number;
  amount: number;
  date: string;
}

export interface PurchaseInvoiceItem {
  productId?: number;
  name: string;
  quantity: number;
  purchasePrice: number;
}

export interface PurchaseInvoice {
  id: number;
  supplierId: number;
  items: PurchaseInvoiceItem[];
  total: number;
  amountPaid: number;
  debt: number;
  date: string;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  amount: number;
  date: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Offer {
  id: number;
  name: string;
  description: string;
  barcode?: string;
  items: { 
    productId: number;
    quantity: number;
  }[];
  price: number;
  isActive: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  isActive: boolean;
  minPurchaseAmount?: number;
  expiryDate?: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface AppSettings {
  lowStockThreshold: number;
  expiryWarningDays: number;
  customerDebtLimit: number;
  productCustomFields: CustomFieldDef[];
}

export interface AppData {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  payments: Payment[];
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
  expenses: Expense[];
  offers: Offer[];
  coupons: Coupon[];
  settings: AppSettings;
  notifications?: Notification[]; // Optional for backward compatibility
  toasts?: Toast[]; // Transient state, won't be saved
}
