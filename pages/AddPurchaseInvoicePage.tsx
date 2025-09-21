
import React, { useState, useMemo } from 'react';
import { Supplier, Product, PurchaseInvoiceItem } from '../types.ts';

interface AddPurchaseInvoicePageProps {
  supplier: Supplier;
  products: Product[];
  onSave: (supplierId: number, items: PurchaseInvoiceItem[], amountPaid: number) => void;
  onCancel: () => void;
  openScanner: (onScan: (barcode: string) => void) => void;
}

const AddPurchaseInvoicePage: React.FC<AddPurchaseInvoicePageProps> = ({ supplier, products, onSave, onCancel, openScanner }) => {
  const [cart, setCart] = useState<PurchaseInvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [newItem, setNewItem] = useState<{ name: string, quantity: number | '', purchasePrice: number | '' }>({ name: '', quantity: '', purchasePrice: '' });

  const cartProductIds = useMemo(() => new Set(cart.map(item => item.productId)), [cart]);
  const cartProductNames = useMemo(() => new Set(cart.map(item => item.name)), [cart]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => 
      !cartProductIds.has(p.id) && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)))
    ).slice(0, 5);
  }, [searchTerm, products, cartProductIds]);

  const addProductToCart = (product: Product) => {
    setCart(prev => [...prev, { productId: product.id, name: product.name, quantity: 1, purchasePrice: product.purchasePrice }]);
    setSearchTerm('');
  };

  const addNewItemToCart = () => {
// FIX: Explicitly convert quantity and purchasePrice to numbers before performing comparisons to resolve type errors.
    if (newItem.name && Number(newItem.quantity) > 0 && Number(newItem.purchasePrice) >= 0 && !cartProductNames.has(newItem.name)) {
      setCart(prev => [...prev, {
          name: newItem.name,
          quantity: Number(newItem.quantity),
          purchasePrice: Number(newItem.purchasePrice)
      }]);
      setNewItem({ name: '', quantity: '', purchasePrice: '' });
    }
  };

  const updateCartItem = (index: number, field: 'quantity' | 'purchasePrice', value: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  
  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleScan = (barcode: string) => {
      const product = products.find(p => p.barcode === barcode && !cartProductIds.has(p.id));
      if (product) {
          addProductToCart(product);
      } else {
          setSearchTerm(barcode); // If not found, put it in search for manual entry or adding as new
      }
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0), [cart]);

  const handleSubmit = () => {
    if(cart.length > 0) {
      onSave(supplier.id, cart, Number(amountPaid) || 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-bold">فاتورة شراء جديدة للمورد: <span className="text-primary">{supplier.name}</span></h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h3 className="font-bold">إضافة أصناف</h3>
        <div className="relative">
          <label className="text-sm text-slate-600">بحث عن منتج مسجل</label>
           <div className="flex">
                <input
                    type="text"
                    placeholder="ابحث بالاسم أو الباركود..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm border rounded-r-md"
                />
                 <button type="button" onClick={() => openScanner(handleScan)} className="bg-slate-200 px-4 rounded-l-md border-t border-b border-l border-slate-300">
                    <i className="fa-solid fa-barcode"></i>
                </button>
           </div>
          {filteredProducts.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md border z-20">
              {filteredProducts.map(p => (
                <li key={p.id} onClick={() => addProductToCart(p)} className="p-2 text-sm cursor-pointer hover:bg-slate-100">{p.name}</li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="text-center my-2"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">أو</span></div>

        <div>
            <label className="text-sm text-slate-600">إضافة صنف جديد غير مسجل</label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,80px,80px,auto] gap-2 mt-1">
                <input type="text" placeholder="اسم الصنف" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} className="p-2 text-sm border rounded-md" />
                <input type="number" placeholder="سعر الشراء" value={newItem.purchasePrice} onChange={e => setNewItem(p => ({...p, purchasePrice: e.target.value === '' ? '' : parseFloat(e.target.value)}))} className="p-2 text-sm border rounded-md" />
                <input type="number" placeholder="الكمية" value={newItem.quantity} onChange={e => setNewItem(p => ({...p, quantity: e.target.value === '' ? '' : parseInt(e.target.value)}))} className="p-2 text-sm border rounded-md" />
                <button onClick={addNewItemToCart} className="bg-slate-600 text-white px-3 rounded-md text-sm">إضافة</button>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h3 className="font-bold">أصناف الفاتورة ({cart.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((item, index) => (
                <div key={item.productId || item.name} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">{item.name}</p>
                        {!item.productId && <p className="text-xs text-amber-600">(منتج غير مسجل)</p>}
                    </div>
                    <input type="number" value={item.purchasePrice} onChange={e => updateCartItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)} className="w-20 p-1 border rounded-md text-center text-sm" placeholder="السعر" />
                    <input type="number" value={item.quantity} onChange={e => updateCartItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-16 p-1 border rounded-md text-center text-sm" placeholder="الكمية" />
                    <button onClick={() => removeCartItem(index)} className="text-red-500"><i className="fa-solid fa-trash-can"></i></button>
                </div>
            ))}
            {cart.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">لم تتم إضافة أصناف بعد.</p>}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
          <div className="flex justify-between items-center font-bold">
            <span>الإجمالي:</span>
            <span>{total.toFixed(2)} ج.م</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm">المبلغ المدفوع:</label>
            <input type="number" placeholder="0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded-md" />
          </div>
          <div className="flex justify-between items-center font-bold text-red-600">
            <span>المبلغ المتبقي:</span>
            <span>{(total - (Number(amountPaid) || 0)).toFixed(2)} ج.م</span>
          </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-md text-sm font-semibold">إلغاء</button>
        <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2.5 rounded-md text-sm font-semibold">حفظ الفاتورة</button>
      </div>

    </div>
  );
};

export default AddPurchaseInvoicePage;