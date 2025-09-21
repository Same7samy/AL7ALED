
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import SideNav from './components/BottomNav.tsx';
import DashboardPage from './pages/Dashboard.tsx';
import ProductsPage from './pages/Products.tsx';
import SalesPOSPage from './pages/SalesPOS.tsx';
import PlaceholderPage from './pages/PlaceholderPage.tsx';
import AddEditProductPage from './pages/AddEditProductPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import CustomersPage from './pages/CustomersPage.tsx';
import SuppliersPage from './pages/SuppliersPage.tsx';
import CheckoutPage from './pages/CreditSalePage.tsx';
import CustomerDetailPage from './pages/CustomerDetailPage.tsx';
import InvoiceDetailPage from './pages/InvoiceDetailPage.tsx';
import { AppData, AppSettings, Page, Product, CustomFieldDef, Notification, CartItem, Customer, Supplier, Invoice, Payment, PurchaseInvoice, PurchaseInvoiceItem, SupplierPayment, Expense, Offer, Coupon, Toast } from './types.ts';
import ConfirmDialog from './components/ConfirmDialog.tsx';
import AddEditCustomerPage from './pages/AddEditCustomerPage.tsx';
import InvoicesPage from './pages/InvoicesPage.tsx';
import AddEditSupplierPage from './pages/AddEditSupplierPage.tsx';
import SupplierDetailPage from './pages/SupplierDetailPage.tsx';
import AddPurchaseInvoicePage from './pages/AddPurchaseInvoicePage.tsx';
import PurchaseInvoiceDetailPage from './pages/PurchaseInvoiceDetailPage.tsx';
import ExpensesPage from './pages/ExpensesPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import OffersPage from './pages/OffersPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import ToastComponent from './components/Toast.tsx';
import CameraScannerPage from './pages/CameraScannerPage.tsx';
import CameraCapturePage from './pages/CameraCapturePage.tsx';
import NotificationSettingsPage from './pages/NotificationSettingsPage.tsx';
import CustomFieldsSettingsPage from './pages/CustomFieldsSettingsPage.tsx';

// --- IndexedDB Helpers ---
const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('alkhaled-db', 1);
    request.onupgradeneeded = () => {
        request.result.createObjectStore('keyval');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

async function idbGet<T>(key: IDBValidKey): Promise<T | undefined> {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function idbSet(key: IDBValidKey, value: any): Promise<void> {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// --- File System Access API Helpers ---
const DATA_FILE_NAME = 'alkhaled-data.json';
const DIR_HANDLE_KEY = 'dirHandle';

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    // FIX: Cast to `any` and define options inline to handle missing File System Access API types
    // in the TypeScript environment. This avoids errors for `FileSystemHandlePermissionDescriptor`,
    // `queryPermission`, and `requestPermission`.
    const options: { mode: 'readwrite' } = { mode: 'readwrite' };
    if ((await (handle as any).queryPermission(options)) === 'granted') {
        return true;
    }
    if ((await (handle as any).requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

// --- Default App Data ---
const defaultSettings: AppSettings = {
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    customerDebtLimit: 1000,
    productCustomFields: [{ id: 'supplier', name: 'المورد', type: 'text' }],
};

const initialAppData: AppData = {
  products: [],
  customers: [],
  suppliers: [],
  invoices: [],
  payments: [],
  purchaseInvoices: [],
  supplierPayments: [],
  expenses: [],
  offers: [],
  coupons: [],
  settings: defaultSettings,
};


const PermissionRequestScreen: React.FC<{onRequest: () => void; onFallback: () => void;}> = ({ onRequest, onFallback }) => (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
            <h1 className="text-3xl font-bold text-primary mb-2">مرحباً بك في الخالد</h1>
            <p className="text-slate-600 mb-6">للحصول على أفضل تجربة وتأمين بياناتك، يحتاج التطبيق إلى الوصول لمجلد على جهازك لحفظ واسترجاع البيانات. هذا يضمن أن بياناتك ملكك دائمًا ومتاحة حتى بدون انترنت.</p>
            <div className="space-y-3">
                 <button onClick={onRequest} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-lg flex items-center justify-center gap-3">
                    <i className="fa-solid fa-folder-open"></i>
                    <span>اختيار مجلد لحفظ البيانات</span>
                </button>
                 <button onClick={onFallback} className="w-full bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                    المتابعة باستخدام تخزين المتصفح
                </button>
            </div>
             <p className="text-xs text-slate-400 mt-4">بياناتك آمنة ولا يتم مشاركتها أو رفعها على الإنترنت.</p>
        </div>
    </div>
);

const App: React.FC = () => {
  // --- New State Management ---
  const [appData, setAppData] = useState<AppData | null>(null);
  const [status, setStatus] = useState<'loading' | 'needs-permission' | 'ready'>('loading');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [storageMode, setStorageMode] = useState<'fs' | 'indexeddb'>('indexeddb');
  const isInitialLoad = useRef(true);
  const hasFSSupport = 'showDirectoryPicker' in window;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (!appData) return;
    const newToast: Toast = { id: Date.now(), message, type };
    setAppData(d => d ? ({ ...d, toasts: [...(d.toasts || []), newToast] }) : null);

    setTimeout(() => {
        setAppData(d => {
            if (!d) return null;
            const currentToasts = d.toasts || [];
            return { ...d, toasts: currentToasts.filter(t => t.id !== newToast.id) };
        });
    }, 3000);
  };

  // --- Data Loading Effect ---
  useEffect(() => {
    const loadData = async () => {
      let loadedData: AppData | null = null;
      let handle: FileSystemDirectoryHandle | undefined;
      
      if (hasFSSupport) {
        handle = await idbGet<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
        if (handle && await verifyPermission(handle)) {
          setDirHandle(handle);
          setStorageMode('fs');
          try {
            const fileHandle = await handle.getFileHandle(DATA_FILE_NAME);
            const file = await fileHandle.getFile();
            const text = await file.text();
            loadedData = JSON.parse(text);
          } catch (e) {
            console.warn("Data file not found, will create new one on save.");
          }
        } else {
          setStatus('needs-permission');
          return;
        }
      } 
      
      if (!handle) { // Fallback for no FS support or no handle found
        setStorageMode('indexeddb');
        loadedData = await idbGet<AppData>('appData');
      }

      setAppData({ ...initialAppData, ...loadedData, toasts: [] });
      setStatus('ready');
    };
    loadData();
  }, [hasFSSupport]);

  // --- Data Saving Effect (Debounced) ---
  useEffect(() => {
    if (isInitialLoad.current || !appData) {
      if (appData) isInitialLoad.current = false;
      return;
    }

    const handler = setTimeout(async () => {
      if (!appData) return;
      // Create a savable version of appData without transient state
      const dataToSave = { ...appData };
      delete (dataToSave as any).toasts; // Don't persist toasts

      if (storageMode === 'fs' && dirHandle) {
        try {
          const fileHandle = await dirHandle.getFileHandle(DATA_FILE_NAME, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(dataToSave, null, 2));
          await writable.close();
        } catch (e) {
          console.error("Error saving to file system:", e);
          showToast("فشل حفظ البيانات في الملف", "error");
        }
      } else {
        await idbSet('appData', dataToSave);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(handler);
  }, [appData, storageMode, dirHandle]);


  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedPurchaseInvoiceId, setSelectedPurchaseInvoiceId] = useState<number | null>(null);
  const [checkoutCart, setCheckoutCart] = useState<CartItem[] | null>(null);
  const [checkoutCoupon, setCheckoutCoupon] = useState<Coupon | null>(null);
  
  const [productsToCreate, setProductsToCreate] = useState<PurchaseInvoiceItem[]>([]);
  const [productDataForCreation, setProductDataForCreation] = useState<Partial<Omit<Product, 'id'>> | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; onClose?: () => void; confirmText?: string; cancelText?: string; confirmColor?: 'red' | 'sky'; } | null>(null);
  
  const [scannerCallback, setScannerCallback] = useState<{ onScan: (barcode: string) => void } | null>(null);
  const [pageBeforeScanner, setPageBeforeScanner] = useState<Page>('dashboard');
  
  const [photoCaptureCallback, setPhotoCaptureCallback] = useState<{ onCapture: (dataUrl: string) => void } | null>(null);
  const [pageBeforePhotoCapture, setPageBeforePhotoCapture] = useState<Page>('addProduct');

  // --- Permission Handlers ---
  const handleRequestPermission = async () => {
      try {
          // FIX: Cast `window` to `any` to access the non-standard `showDirectoryPicker` method
          // which may be missing from default TypeScript DOM type definitions.
          const handle = await (window as any).showDirectoryPicker();
          await idbSet(DIR_HANDLE_KEY, handle);
          setDirHandle(handle);
          setStorageMode('fs');
          setStatus('loading');
          window.location.reload(); // Easiest way to re-trigger loading logic
      } catch (e) {
          console.error("Directory picker error:", e);
          showToast("لم يتم تحديد مجلد.", "error");
      }
  };

  const handleUseBrowserStorage = async () => {
      setStorageMode('indexeddb');
      const loadedData = await idbGet<AppData>('appData');
      setAppData({ ...initialAppData, ...loadedData, toasts: [] });
      setStatus('ready');
  };

  const customerDebts = useMemo(() => {
    if (!appData) return new Map();
    const balances = new Map<number, number>();
    appData.invoices.forEach(invoice => {
        if (invoice.customerId) {
            balances.set(invoice.customerId, (balances.get(invoice.customerId) || 0) + invoice.debt);
        }
    });
    appData.payments.forEach(payment => {
        if (balances.has(payment.customerId)) {
            balances.set(payment.customerId, (balances.get(payment.customerId)!) - payment.amount);
        }
    });
    return balances;
  }, [appData?.invoices, appData?.payments]);

  useEffect(() => {
    if (!appData) return;
    const generateNotifications = () => {
        const newNotifications: Notification[] = [];
        const { lowStockThreshold, expiryWarningDays, customerDebtLimit } = appData.settings;
        
        const expiryThresholdDate = new Date();
        expiryThresholdDate.setDate(expiryThresholdDate.getDate() + expiryWarningDays);

        appData.products.forEach(p => {
            if (p.stock > 0 && p.stock <= lowStockThreshold) {
                newNotifications.push({ id: `low-stock-${p.id}`, type: 'low_stock', message: `المخزون شارف على الانتهاء لـ "${p.name}". الكمية المتبقية: ${p.stock}`, read: false, productId: p.id });
            }
            if (p.expiryDate) {
                const expiry = new Date(p.expiryDate);
                if (expiry > new Date() && expiry <= expiryThresholdDate) {
                     newNotifications.push({ id: `expiry-${p.id}`, type: 'expiry_soon', message: `صلاحية منتج "${p.name}" ستنتهي قريباً بتاريخ ${p.expiryDate}.`, read: false, productId: p.id });
                }
            }
        });

        if (customerDebtLimit > 0) {
            appData.customers.forEach(customer => {
                const debt = customerDebts.get(customer.id) || 0;
                if (debt >= customerDebtLimit) {
                    newNotifications.push({ id: `debt-limit-${customer.id}`, type: 'debt_limit', message: `تجاوز العميل "${customer.name}" حد الدين المسموح به. الدين الحالي: ${debt.toFixed(2)} ج.م`, read: false, customerId: customer.id });
                }
            });
        }
        
        setAppData(d => d ? { ...d, notifications: newNotifications } : null);
    };

    generateNotifications();
  }, [appData?.products, appData?.customers, customerDebts, appData?.settings]);
  

  const openScanner = (onScan: (barcode: string) => void) => {
      setPageBeforeScanner(activePage);
      setScannerCallback({ onScan });
      setActivePage('cameraScanner');
  };

  const handleScanSuccess = (barcode: string) => {
      if (scannerCallback) scannerCallback.onScan(barcode);
      setActivePage(pageBeforeScanner);
      setScannerCallback(null);
  };

  const handleScannerClose = () => {
      setActivePage(pageBeforeScanner);
      setScannerCallback(null);
  };
  
  const openCameraForCapture = (onCapture: (dataUrl: string) => void) => {
      setPageBeforePhotoCapture(activePage);
      setPhotoCaptureCallback({ onCapture });
      setActivePage('cameraCapture');
  };

  const handlePhotoCaptureSuccess = (dataUrl: string) => {
      if (photoCaptureCallback) photoCaptureCallback.onCapture(dataUrl);
      setActivePage(pageBeforePhotoCapture);
      setPhotoCaptureCallback(null);
  };

  const handlePhotoCaptureClose = () => {
      setActivePage(pageBeforePhotoCapture);
      setPhotoCaptureCallback(null);
  };
  
 const updateStock = useCallback((cart: CartItem[]) => {
    setAppData(d => {
        if (!d) return null;
        const newProducts = [...d.products];
        cart.forEach(cartItem => {
            const productIndex = newProducts.findIndex(p => p.id === cartItem.id);
            if (productIndex !== -1) {
                newProducts[productIndex].stock -= cartItem.quantity;
            }
        });
        return { ...d, products: newProducts };
    });
  }, []);

 const startProductCreationFlow = (items: PurchaseInvoiceItem[]) => {
    const [first, ...rest] = items;
    if (!first) return;
    setProductsToCreate(rest);
    setProductDataForCreation({ name: first.name, purchasePrice: first.purchasePrice, stock: first.quantity });
    setActivePage('addProduct');
};

  const handleSaveProduct = (productData: Omit<Product, 'id'>) => {
    setAppData(d => {
        if (!d) return null;
        let newProducts;
        if (activePage === 'addProduct') {
            const newProduct = { ...productData, id: Date.now() };
            newProducts = [newProduct, ...d.products];
        } else if (['editProduct', 'productDetail'].includes(activePage) && selectedProductId !== null) {
            newProducts = d.products.map(p => p.id === selectedProductId ? { ...productData, id: selectedProductId } : p);
        } else {
            return d;
        }
        return { ...d, products: newProducts };
    });
    
    if (activePage === 'addProduct' && productsToCreate.length > 0) {
        startProductCreationFlow(productsToCreate);
    } else {
        setProductDataForCreation(null);
        if(productDataForCreation) setActivePage('supplierDetail');
        else setActivePage('products');
    }
    setSelectedProductId(null);
    showToast('تم حفظ المنتج بنجاح');
  };
  
  const handleDeleteProducts = (idsToDelete: number[]) => {
    if (!appData) return;
    const productsToDelete = appData.products.filter(p => idsToDelete.includes(p.id));
    if (productsToDelete.length === 0) return;
    const title = `تأكيد الحذف`;
    const message = `هل أنت متأكد من حذف ${idsToDelete.length > 1 ? `${idsToDelete.length} منتجات` : `منتج "${productsToDelete[0]?.name}"`}؟ لا يمكن التراجع عن هذا الإجراء.`;

    setConfirmDialog({
        title, message,
        onConfirm: () => {
            setAppData(d => d ? { ...d, products: d.products.filter(p => !idsToDelete.includes(p.id)) } : null);
            setConfirmDialog(null);
            showToast(idsToDelete.length > 1 ? 'تم حذف المنتجات بنجاح' : 'تم حذف المنتج بنجاح');
            if (activePage === 'productDetail') {
              setActivePage('products');
              setSelectedProductId(null);
            }
        },
        confirmText: 'تأكيد الحذف', confirmColor: 'red'
    });
  };

  const handleStartCheckout = (cart: CartItem[], coupon: Coupon | null) => {
    setCheckoutCart(cart);
    setCheckoutCoupon(coupon);
    setActivePage('checkout');
};
  
const handleCompleteSale = (cart: CartItem[], paidAmount: number, customerId?: number, coupon?: Coupon | null, manualDiscount?: { type: 'fixed_amount' | 'percentage', value: number } | null, tax?: number | null) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (coupon) discountAmount = Math.min(subtotal, coupon.type === 'fixed_amount' ? coupon.value : (subtotal * coupon.value) / 100);
    const subtotalAfterCoupon = subtotal - discountAmount;
    let manualDiscountAmount = 0;
    if (manualDiscount && manualDiscount.value > 0) manualDiscountAmount = Math.min(subtotalAfterCoupon, manualDiscount.type === 'fixed_amount' ? manualDiscount.value : (subtotalAfterCoupon * manualDiscount.value) / 100);
    const subtotalAfterDiscounts = subtotalAfterCoupon - manualDiscountAmount;
    let taxAmount = 0;
    if (tax && tax > 0) taxAmount = (subtotalAfterDiscounts * tax) / 100;
    const total = subtotalAfterDiscounts + taxAmount;
    const debt = Math.max(0, total - paidAmount);
    const change = Math.max(0, paidAmount - total);
    
    const newInvoice: Invoice = { id: Date.now(), customerId, items: cart, subtotal, discountAmount: discountAmount > 0 ? discountAmount : undefined, couponCode: coupon?.code, manualDiscountAmount: manualDiscountAmount > 0 ? manualDiscountAmount : undefined, taxAmount: taxAmount > 0 ? taxAmount : undefined, total, paidAmount, debt, change, date: new Date().toISOString(), type: debt > 0 ? 'credit' : 'cash', status: 'completed' };
  
    setAppData(d => d ? { ...d, invoices: [...d.invoices, newInvoice] } : null);
    updateStock(cart);
    setCheckoutCart(null);
    setCheckoutCoupon(null);
    setActivePage('pos');
    let message = "تم البيع بنجاح!";
    if (change > 0) message += ` الباقي للعميل: ${change.toFixed(2)} ج.م.`;
    showToast(message);
  };

  const handleReturnItems = (invoiceId: number, itemsToReturn: CartItem[]) => {
    setAppData((d: AppData | null) => {
        if (!d) return null;
        const updatedProducts = [...d.products];
        itemsToReturn.forEach(returnedItem => {
            const productIndex = updatedProducts.findIndex(p => p.id === returnedItem.id);
            if (productIndex !== -1) updatedProducts[productIndex].stock += returnedItem.quantity;
        });
        
        const updatedInvoices = d.invoices.map(inv => {
            if (inv.id === invoiceId) {
                const newReturnedItemsMap = new Map<number, CartItem>();
                [...(inv.returnedItems || []), ...itemsToReturn].forEach(item => {
                    const existing = newReturnedItemsMap.get(item.id);
                    if (existing) existing.quantity += item.quantity; else newReturnedItemsMap.set(item.id, { ...item });
                });
                const newReturnedItems = Array.from(newReturnedItemsMap.values());
                const isFullyReturned = inv.items.every(item => (newReturnedItems.find(i => i.id === item.id)?.quantity || 0) >= item.quantity);
                const returnedValue = itemsToReturn.reduce((sum, item) => sum + item.price * item.quantity, 0);
                // FIX: Explicitly type `newStatus` to prevent TypeScript from inferring it as a generic `string`,
                // ensuring it matches the `Invoice['status']` type.
                const newStatus: 'fully_returned' | 'partially_returned' = isFullyReturned ? 'fully_returned' : 'partially_returned';
                return { ...inv, returnedItems: newReturnedItems, status: newStatus, debt: Math.max(0, inv.debt - returnedValue) };
            }
            return inv;
        });
        return { ...d, products: updatedProducts, invoices: updatedInvoices };
    });
    const returnedValue = itemsToReturn.reduce((sum, item) => sum + item.price * item.quantity, 0);
    showToast(`تم إرجاع منتجات بقيمة ${returnedValue.toFixed(2)} ج.م.`);
};

  const handleSaveCustomer = (customerData: Omit<Customer, 'id'>, id?: number) => {
    setAppData(d => {
        if(!d) return null;
        if(id) return { ...d, customers: d.customers.map(c => c.id === id ? { ...customerData, id } : c) };
        const newCustomer = { ...customerData, id: Date.now() };
        return { ...d, customers: [newCustomer, ...d.customers]};
    });
    setActivePage('customers');
    setSelectedCustomerId(null);
    showToast('تم حفظ بيانات العميل');
  };

  const handleDeleteCustomers = (idsToDelete: number[]) => {
      setConfirmDialog({
          title: `تأكيد الحذف`, message: `هل أنت متأكد من حذف ${idsToDelete.length} ${idsToDelete.length > 1 ? 'عملاء' : 'عميل'}؟`,
          onConfirm: () => {
              setAppData(d => d ? { ...d, customers: d.customers.filter(c => !idsToDelete.includes(c.id)) } : null);
              setConfirmDialog(null);
              showToast('تم حذف العملاء بنجاح');
          }, confirmText: 'تأكيد الحذف', confirmColor: 'red'
      });
  };

  const handleAddCustomer = (name: string, phone?: string): Customer => {
    const newCustomer: Customer = { id: Date.now(), name, phone };
    setAppData(d => d ? { ...d, customers: [...d.customers, newCustomer] } : null);
    showToast(`تم إضافة العميل "${name}" بنجاح`);
    return newCustomer;
  };

  const handlePayDebt = (customerId: number, amount: number) => {
    const newPayment: Payment = { id: Date.now(), customerId, amount, date: new Date().toISOString() };
    setAppData(d => d ? { ...d, payments: [...d.payments, newPayment] } : null);
    showToast("تم تسجيل الدفعة بنجاح");
  };

  const handleSaveSupplier = (supplierData: Omit<Supplier, 'id'>, id?: number) => {
    setAppData(d => {
        if(!d) return null;
        if (id) return { ...d, suppliers: d.suppliers.map(s => s.id === id ? { ...supplierData, id } : s) };
        const newSupplier = { ...supplierData, id: Date.now() };
        return { ...d, suppliers: [newSupplier, ...d.suppliers] };
    });
    setActivePage('suppliers');
    setSelectedSupplierId(null);
    showToast('تم حفظ بيانات المورد');
  };

  const handleDeleteSuppliers = (idsToDelete: number[]) => {
    setConfirmDialog({
        title: `تأكيد الحذف`, message: `هل أنت متأكد من حذف ${idsToDelete.length} ${idsToDelete.length > 1 ? 'موردين' : 'مورد'}؟`,
        onConfirm: () => {
            setAppData(d => d ? { ...d, suppliers: d.suppliers.filter(s => !idsToDelete.includes(s.id)) } : null);
            setConfirmDialog(null);
            showToast('تم حذف الموردين بنجاح');
        }, confirmText: 'تأكيد الحذف', confirmColor: 'red'
    });
  };

  const handleSavePurchaseInvoice = (supplierId: number, items: PurchaseInvoiceItem[], amountPaid: number) => {
    const total = items.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
    const newPurchaseInvoice: PurchaseInvoice = { id: Date.now(), supplierId, items, total, amountPaid, debt: total - amountPaid, date: new Date().toISOString() };
    const existingItems = items.filter(item => item.productId !== undefined);
    const newItems = items.filter(item => item.productId === undefined);

    setAppData(d => {
        if (!d) return null;
        const updatedProducts = [...d.products];
        if (existingItems.length > 0) {
            existingItems.forEach(item => {
                const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) updatedProducts[productIndex].stock += item.quantity;
            });
        }
        return { ...d, purchaseInvoices: [...d.purchaseInvoices, newPurchaseInvoice], products: updatedProducts };
    });

    const finish = () => { showToast("تم تسجيل فاتورة الشراء بنجاح"); setActivePage('supplierDetail'); };

    if (newItems.length > 0) {
        setConfirmDialog({
            title: "إضافة منتجات جديدة", message: `الفاتورة تحتوي على ${newItems.length} منتجات جديدة. هل تريد إضافتها الآن؟`,
            onConfirm: () => { setConfirmDialog(null); startProductCreationFlow(newItems); },
            onClose: () => { setConfirmDialog(null); finish(); }, confirmText: "نعم، أضفها", cancelText: "لاحقاً"
        });
    } else {
        finish();
    }
  };

  const handlePaySupplierDebt = (supplierId: number, amount: number) => {
    const newPayment: SupplierPayment = { id: Date.now(), supplierId, amount, date: new Date().toISOString() };
    setAppData(d => d ? { ...d, supplierPayments: [...d.supplierPayments, newPayment] } : null);
    showToast("تم تسجيل دفعة للمورد بنجاح");
  };

  const handleSaveExpense = (data: Omit<Expense, 'id'>, id?: number) => {
    setAppData(d => {
        if(!d) return null;
        if (id) return { ...d, expenses: d.expenses.map(exp => exp.id === id ? { ...data, id } : exp) };
        return { ...d, expenses: [{ ...data, id: Date.now() }, ...d.expenses] };
    });
    showToast('تم حفظ المصروف بنجاح');
  };

  const handleDeleteExpense = (id: number) => {
    setAppData(d => d ? { ...d, expenses: d.expenses.filter(exp => exp.id !== id) } : null);
    showToast('تم حذف المصروف بنجاح');
  };

  const handleSaveOffer = (data: Omit<Offer, 'id'>, id?: number) => {
    setAppData(d => {
        if(!d) return null;
        if (id) return { ...d, offers: d.offers.map(o => o.id === id ? { ...data, id } : o) };
        return { ...d, offers: [{ ...data, id: Date.now() }, ...d.offers] };
    });
    showToast('تم حفظ العرض بنجاح');
  };

  const handleDeleteOffer = (id: number) => {
    setAppData(d => d ? { ...d, offers: d.offers.filter(o => o.id !== id) } : null);
    showToast('تم حذف العرض بنجاح');
  };

  const handleSaveCoupon = (data: Omit<Coupon, 'id'>, id?: number) => {
    const couponData = { ...data, code: data.code.toUpperCase() };
    setAppData(d => {
        if(!d) return null;
        if (id) return { ...d, coupons: d.coupons.map(c => c.id === id ? { ...couponData, id } : c) };
        return { ...d, coupons: [{ ...couponData, id: Date.now() }, ...d.coupons] };
    });
    showToast('تم حفظ الكوبون بنجاح');
  };

  const handleDeleteCoupon = (id: number) => {
    setAppData(d => d ? { ...d, coupons: d.coupons.filter(c => c.id !== id) } : null);
    showToast('تم حذف الكوبون بنجاح');
  };

  const handleExportData = () => {
    if (!appData) return;
    const jsonString = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alkhaled-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير البيانات بنجاح');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setConfirmDialog({
          title: "تأكيد استيراد البيانات", message: "سيؤدي هذا إلى استبدال جميع البيانات الحالية. هل أنت متأكد؟",
          confirmText: "نعم، قم بالاستيراد", confirmColor: 'red',
          onConfirm: () => {
              const reader = new FileReader();
              reader.onload = (event) => {
                  try {
                      const data = JSON.parse(event.target?.result as string);
                      const requiredKeys = ['products', 'customers', 'suppliers', 'invoices', 'settings'];
                      if (requiredKeys.some(key => !(key in data))) throw new Error(`ملف غير صالح.`);
                      setAppData({ ...initialAppData, ...data });
                      showToast('تم استيراد البيانات بنجاح');
                  } catch (error: any) {
                      showToast(`فشل الاستيراد: ${error.message}`, 'error');
                  } finally {
                      setConfirmDialog(null);
                  }
              };
              reader.readAsText(file);
          },
          onClose: () => setConfirmDialog(null)
      });
      e.target.value = '';
  };
  
  const handleBack = () => {
    if (['addProduct', 'editProduct'].includes(activePage)) {
      if(productDataForCreation) { setProductsToCreate([]); setProductDataForCreation(null); setActivePage('supplierDetail'); return; }
      setActivePage(selectedProductId ? 'productDetail' : 'products');
    } else if (activePage === 'productDetail') { setActivePage('products'); setSelectedProductId(null);
    } else if (activePage === 'notifications') { setActivePage('dashboard');
    } else if (activePage === 'checkout') { setActivePage('pos'); setCheckoutCart(null); setCheckoutCoupon(null);
    } else if (activePage === 'customerDetail') { setActivePage('customers'); setSelectedCustomerId(null);
    } else if (activePage === 'invoiceDetail') { if (selectedCustomerId) setActivePage('customerDetail'); else setActivePage('invoices'); setSelectedInvoiceId(null);
    } else if (['addCustomer', 'editCustomer'].includes(activePage)) { setActivePage('customers'); setSelectedCustomerId(null);
    } else if (['addSupplier', 'editSupplier'].includes(activePage)) { setActivePage('suppliers'); setSelectedSupplierId(null);
    } else if (activePage === 'supplierDetail') { setActivePage('suppliers'); setSelectedSupplierId(null);
    } else if (activePage === 'addPurchaseInvoice') { setActivePage('supplierDetail');
    } else if (activePage === 'purchaseInvoiceDetail') { setActivePage('supplierDetail'); setSelectedPurchaseInvoiceId(null);
    } else if (activePage === 'cameraScanner') { handleScannerClose();
    } else if (activePage === 'cameraCapture') { handlePhotoCaptureClose();
    } else if (['notificationSettings', 'customFieldsSettings'].includes(activePage)) { setActivePage('settings'); }
  };
  
  if (status === 'loading') {
    return <div className="fixed inset-0 bg-slate-50 flex items-center justify-center"><div className="text-primary font-bold">جاري تحميل البيانات...</div></div>;
  }
  if (status === 'needs-permission') {
    return <PermissionRequestScreen onRequest={handleRequestPermission} onFallback={handleUseBrowserStorage} />;
  }
  if (!appData) {
     return <div className="fixed inset-0 bg-slate-50 flex items-center justify-center"><div className="text-red-500 font-bold">حدث خطأ في تحميل البيانات.</div></div>;
  }

  const { products, customers, suppliers, invoices, payments, purchaseInvoices, supplierPayments, expenses, offers, coupons, settings, notifications = [], toasts = [] } = appData;
  
  const renderPage = () => {
    const productToShow = selectedProductId ? products.find(p => p.id === selectedProductId) : undefined;
    const customerToShow = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : undefined;
    const supplierToShow = selectedSupplierId ? suppliers.find(s => s.id === selectedSupplierId) : undefined;
    const invoiceToShow = selectedInvoiceId ? invoices.find(i => i.id === selectedInvoiceId) : undefined;
    const invoiceCustomer = invoiceToShow?.customerId ? customers.find(c => c.id === invoiceToShow.customerId) : undefined;
    const purchaseInvoiceToShow = selectedPurchaseInvoiceId ? purchaseInvoices.find(p => p.id === selectedPurchaseInvoiceId) : undefined;
    const purchaseInvoiceSupplier = purchaseInvoiceToShow ? suppliers.find(s => s.id === purchaseInvoiceToShow.supplierId) : undefined;

    switch (activePage) {
      case 'dashboard': return <DashboardPage products={products} invoices={invoices} setActivePage={setActivePage} />;
      case 'products': return <ProductsPage products={products} setActivePage={setActivePage} setSelectedProductId={setSelectedProductId} onDelete={handleDeleteProducts} openScanner={openScanner} />;
      case 'pos': return <SalesPOSPage products={products} offers={offers} coupons={coupons} onCheckout={handleStartCheckout} showToast={showToast} openScanner={openScanner} />;
      case 'productDetail': return productToShow ? <ProductDetailPage product={productToShow} setActivePage={setActivePage} setSelectedProductId={setSelectedProductId} onDelete={handleDeleteProducts} customFieldDefs={settings.productCustomFields} /> : <ProductsPage products={products} setActivePage={setActivePage} setSelectedProductId={setSelectedProductId} onDelete={handleDeleteProducts} openScanner={openScanner} />;
      case 'notifications': return <NotificationsPage notifications={notifications} setNotifications={(updater) => setAppData(d => d ? { ...d, notifications: typeof updater === 'function' ? updater(d.notifications || []) : updater } : null)} setActivePage={setActivePage} setSelectedProductId={setSelectedProductId} setSelectedCustomerId={setSelectedCustomerId} />;
      case 'addProduct':
      case 'editProduct': return <AddEditProductPage onSave={handleSaveProduct} onCancel={handleBack} productToEdit={productToShow} productDataForCreation={productDataForCreation} customFieldDefs={settings.productCustomFields} openScanner={openScanner} openCamera={openCameraForCapture} />;
      case 'invoices': return <InvoicesPage invoices={invoices} customers={customers} setActivePage={setActivePage} setSelectedInvoiceId={setSelectedInvoiceId} />;
      case 'customers': return <CustomersPage customers={customers} invoices={invoices} payments={payments} setActivePage={setActivePage} setSelectedCustomerId={setSelectedCustomerId} onDelete={handleDeleteCustomers} />;
      case 'addCustomer':
      case 'editCustomer': return <AddEditCustomerPage onSave={handleSaveCustomer} onCancel={handleBack} customerToEdit={activePage === 'editCustomer' ? customerToShow : undefined} />;
      case 'suppliers': return <SuppliersPage suppliers={suppliers} purchaseInvoices={purchaseInvoices} supplierPayments={supplierPayments} setActivePage={setActivePage} setSelectedSupplierId={setSelectedSupplierId} onDelete={handleDeleteSuppliers} />;
      case 'addSupplier':
      case 'editSupplier': return <AddEditSupplierPage onSave={handleSaveSupplier} onCancel={handleBack} supplierToEdit={activePage === 'editSupplier' ? supplierToShow : undefined} />;
      case 'supplierDetail': return supplierToShow ? <SupplierDetailPage supplier={supplierToShow} purchaseInvoices={purchaseInvoices} supplierPayments={supplierPayments} onPayDebt={handlePaySupplierDebt} onAddPurchaseInvoice={() => setActivePage('addPurchaseInvoice')} onViewPurchaseInvoice={(id) => { setSelectedPurchaseInvoiceId(id); setActivePage('purchaseInvoiceDetail'); }} /> : <SuppliersPage suppliers={suppliers} purchaseInvoices={purchaseInvoices} supplierPayments={supplierPayments} setActivePage={setActivePage} setSelectedSupplierId={setSelectedSupplierId} onDelete={handleDeleteSuppliers}/>;
      case 'addPurchaseInvoice': return supplierToShow ? <AddPurchaseInvoicePage supplier={supplierToShow} products={products} onSave={handleSavePurchaseInvoice} onCancel={() => setActivePage('supplierDetail')} openScanner={openScanner} /> : <PlaceholderPage title="المورد غير محدد" />;
      case 'purchaseInvoiceDetail': return purchaseInvoiceToShow && purchaseInvoiceSupplier ? <PurchaseInvoiceDetailPage invoice={purchaseInvoiceToShow} supplier={purchaseInvoiceSupplier} products={products} /> : <PlaceholderPage title="فاتورة الشراء غير موجودة" />;
      case 'customerDetail': return customerToShow ? <CustomerDetailPage customer={customerToShow} invoices={invoices} payments={payments} onPayDebt={handlePayDebt} onViewInvoice={(id) => { setSelectedInvoiceId(id); setActivePage('invoiceDetail'); }} /> : <CustomersPage customers={customers} invoices={invoices} payments={payments} setActivePage={setActivePage} setSelectedCustomerId={setSelectedCustomerId} onDelete={handleDeleteCustomers} />;
      case 'invoiceDetail': return invoiceToShow ? <InvoiceDetailPage invoice={invoiceToShow} customer={invoiceCustomer} onReturn={handleReturnItems} /> : <PlaceholderPage title="الفاتورة غير موجودة" />;
      case 'checkout': return checkoutCart ? <CheckoutPage cart={checkoutCart} coupon={checkoutCoupon} customers={customers} onConfirm={handleCompleteSale} onCancel={() => { setCheckoutCart(null); setCheckoutCoupon(null); setActivePage('pos'); }} onAddCustomer={handleAddCustomer} /> : <SalesPOSPage products={products} offers={offers} coupons={coupons} onCheckout={handleStartCheckout} showToast={showToast} openScanner={openScanner}/>;
      case 'reports': return <ReportsPage invoices={invoices} products={products} expenses={expenses} customers={customers} />;
      case 'expenses': return <ExpensesPage expenses={expenses} onSave={handleSaveExpense} onDelete={handleDeleteExpense} showConfirmDialog={setConfirmDialog} />;
      case 'offers': return <OffersPage offers={offers} onSaveOffer={handleSaveOffer} onDeleteOffer={handleDeleteOffer} coupons={coupons} onSaveCoupon={handleSaveCoupon} onDeleteCoupon={handleDeleteCoupon} products={products} showConfirmDialog={setConfirmDialog} />;
      case 'settings': return <SettingsPage setActivePage={setActivePage} onExportData={handleExportData} onImportData={handleImportData} />;
      case 'notificationSettings': return <NotificationSettingsPage settings={settings} onSave={(newSettings) => { setAppData(d => d ? { ...d, settings: {...d.settings, ...newSettings}} : null); showToast('تم حفظ الإعدادات بنجاح'); }} />;
      case 'customFieldsSettings': return <CustomFieldsSettingsPage settings={settings} onSave={(newSettings) => { setAppData(d => d ? { ...d, settings: {...d.settings, ...newSettings}} : null); showToast('تم حفظ الإعدادات بنجاح'); }} />;
      case 'cameraScanner': return <CameraScannerPage onScan={handleScanSuccess} onClose={handleScannerClose} />;
      case 'cameraCapture': return <CameraCapturePage onCapture={handlePhotoCaptureSuccess} onClose={handlePhotoCaptureClose} />;
      default: return <DashboardPage products={products} invoices={invoices} setActivePage={setActivePage} />;
    }
  };

  const getPageTitle = (page: Page): string => {
    const supplierToEdit = selectedSupplierId ? suppliers.find(s => s.id === selectedSupplierId) : undefined;
    const titles: { [key in Page]?: string } = {
      dashboard: 'لوحة التحكم', products: 'المنتجات', pos: 'نقطة البيع', invoices: 'الفواتير', customers: 'العملاء', suppliers: 'الموردين', reports: 'التقارير', expenses: 'المصروفات', offers: 'العروض والكوبونات', settings: 'الإعدادات', addProduct: 'إضافة منتج', editProduct: 'تعديل منتج', productDetail: 'تفاصيل المنتج', notifications: 'الإشعارات', checkout: 'إتمام البيع', customerDetail: 'تفاصيل العميل', invoiceDetail: 'تفاصيل الفاتورة', addCustomer: 'إضافة عميل', editCustomer: 'تعديل عميل', addSupplier: 'إضافة مورد', editSupplier: 'تعديل مورد', supplierDetail: supplierToEdit?.name || 'تفاصيل المورد', addPurchaseInvoice: 'فاتورة شراء جديدة', purchaseInvoiceDetail: 'تفاصيل فاتورة شراء', cameraScanner: 'مسح الباركود', cameraCapture: 'التقاط صورة', notificationSettings: 'إعدادات الإشعارات', customFieldsSettings: 'الحقول المخصصة',
    };
    return titles[page] || 'الخالد';
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const subPages: Page[] = ['addProduct', 'editProduct', 'productDetail', 'notifications', 'checkout', 'customerDetail', 'invoiceDetail', 'addCustomer', 'editCustomer', 'addSupplier', 'editSupplier', 'supplierDetail', 'addPurchaseInvoice', 'purchaseInvoiceDetail', 'notificationSettings', 'customFieldsSettings', 'cameraScanner', 'cameraCapture'];
  const isSubPage = subPages.includes(activePage);

  return (
    <div className="font-sans bg-slate-50 min-h-screen text-slate-800">
      <header className="bg-primary text-white shadow-md fixed top-0 right-0 left-0 z-20 h-14 flex items-center justify-between px-3">
        <div className="flex items-center">
            {isSubPage ? ( <button onClick={handleBack} className="p-2 -ml-2 text-xl" aria-label="العودة"><i className="fa-solid fa-arrow-right"></i></button> ) : ( <h1 className="text-lg font-bold">الخالد</h1> )}
            <span className="mx-2 text-blue-300">|</span>
            <h2 className="text-base font-semibold text-blue-100">{getPageTitle(activePage)}</h2>
        </div>
        <div className="flex items-center gap-1">
             <button onClick={() => setActivePage('notifications')} className="p-2 relative text-xl" aria-label={`لديك ${unreadCount} إشعارات جديدة`}>
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && (<span className="absolute top-1.5 right-1.5 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>)}
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-xl" aria-label="فتح القائمة"><i className="fa-solid fa-bars"></i></button>
        </div>
      </header>
      
      <SideNav activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="pt-16 p-3 pb-24">{renderPage()}</main>
      
      <div className="fixed bottom-4 right-4 left-4 z-50 flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map(toast => (<ToastComponent key={toast.id} message={toast.message} type={toast.type} onClose={() => setAppData(d => d ? { ...d, toasts: (d.toasts || []).filter(t => t.id !== toast.id) } : null)} />))}
      </div>

      {confirmDialog && (<ConfirmDialog isOpen={!!confirmDialog} onClose={() => confirmDialog.onClose ? confirmDialog.onClose() : setConfirmDialog(null)} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} confirmText={confirmDialog.confirmText} cancelText={confirmDialog.cancelText} confirmColor={confirmDialog.confirmColor} />)}
    </div>
  );
};

export default App;