
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, Customer, Coupon } from '../types.ts';

interface CheckoutPageProps {
  cart: CartItem[];
  customers: Customer[];
  coupon: Coupon | null;
  onConfirm: (
    cart: CartItem[], 
    paidAmount: number, 
    customerId?: number, 
    coupon?: Coupon | null,
    manualDiscount?: { type: 'fixed_amount' | 'percentage', value: number } | null,
    tax?: number | null
  ) => void;
  onCancel: () => void;
  onAddCustomer: (name: string, phone?: string) => Customer;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, customers, coupon, onConfirm, onCancel, onAddCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [manualDiscount, setManualDiscount] = useState({ type: 'fixed_amount' as 'fixed_amount' | 'percentage', value: 0 });
  const [tax, setTax] = useState(0);

  const { subtotal, couponDiscount, manualDiscountAmount, total, taxAmount } = useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    let coupDisc = 0;
    if (coupon) {
      if (coupon.type === 'fixed_amount') {
        coupDisc = coupon.value;
      } else {
        coupDisc = (sub * coupon.value) / 100;
      }
    }
    coupDisc = Math.min(sub, coupDisc);
    const subtotalAfterCoupon = sub - coupDisc;

    let manDisc = 0;
    if (manualDiscount.value > 0) {
      if (manualDiscount.type === 'fixed_amount') {
        manDisc = manualDiscount.value;
      } else {
        manDisc = (subtotalAfterCoupon * manualDiscount.value) / 100;
      }
    }
    manDisc = Math.min(subtotalAfterCoupon, manDisc);

    const subtotalAfterDiscounts = subtotalAfterCoupon - manDisc;
    
    let taxAmt = 0;
    if (tax > 0) {
      taxAmt = (subtotalAfterDiscounts * tax) / 100;
    }

    return { 
      subtotal: sub, 
      couponDiscount: coupDisc,
      manualDiscountAmount: manDisc,
      taxAmount: taxAmt,
      total: subtotalAfterDiscounts + taxAmt 
    };
  }, [cart, coupon, manualDiscount, tax]);
  
  useEffect(() => {
    if (total > 0) {
      setPaidAmount(total);
    } else {
      setPaidAmount('');
    }
  }, [total]);

  const difference = (Number(paidAmount) || 0) - total;
  const isCreditSale = difference < 0;
  const cannotProceed = isCreditSale && !selectedCustomer;

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);
  
  const handleAddCustomer = () => {
    if (newCustomerName.trim() === '') return;
    const newCustomer = onAddCustomer(newCustomerName, newCustomerPhone);
    setSelectedCustomer(newCustomer);
    setShowAddForm(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const handleSubmit = () => {
    if(cannotProceed) return;
    onConfirm(cart, Number(paidAmount) || 0, selectedCustomer?.id, coupon, manualDiscount.value > 0 ? manualDiscount : null, tax > 0 ? tax : null);
  };

  return (
    <>
      <div className="space-y-4 bg-white p-4 rounded-lg shadow-md max-w-lg mx-auto">
        <div>
          <h2 className="text-lg font-bold">ملخص الفاتورة</h2>
          <div className="mt-2 space-y-1 border-t pt-2 max-h-40 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <p>{item.name} <span className="text-xs text-slate-500">(x{item.quantity})</span></p>
                <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} ج.م</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 mt-2 border-t pt-2">
              <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal.toFixed(2)} ج.م</span>
              </div>
              {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                      <span>خصم الكوبون ({coupon?.code}):</span>
                      <span>-{couponDiscount.toFixed(2)} ج.م</span>
                  </div>
              )}
              {manualDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                      <span>خصم يدوي:</span>
                      <span>-{manualDiscountAmount.toFixed(2)} ج.م</span>
                  </div>
              )}
              {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                      <span>ضريبة ({tax}%):</span>
                      <span>+{taxAmount.toFixed(2)} ج.م</span>
                  </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
                  <span>الإجمالي:</span>
                  <span>{total.toFixed(2)} ج.م</span>
              </div>
          </div>
        </div>
        
        <div className="border-t pt-3 space-y-3">
            <h3 className="text-base font-semibold">الخصم والضريبة</h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-500">خصم يدوي</label>
                    <div className="flex items-center">
                        <input 
                            type="number"
                            value={manualDiscount.value || ''}
                            onChange={e => setManualDiscount(d => ({ ...d, value: parseFloat(e.target.value) || 0 }))}
                            className="w-full p-2 h-9 text-sm border rounded-r-md"
                            placeholder="0"
                        />
                        <button 
                          type="button" 
                          onClick={() => setManualDiscount(d => ({...d, type: d.type === 'percentage' ? 'fixed_amount' : 'percentage'}))} 
                          className="w-14 h-9 flex-shrink-0 bg-slate-200 text-slate-700 font-bold text-sm rounded-l-md border border-l-0 border-slate-300"
                        >
                            {manualDiscount.type === 'percentage' ? '%' : 'ج.م'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500">ضريبة (%)</label>
                    <input 
                        type="number"
                        value={tax || ''}
                        onChange={e => setTax(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 h-9 text-sm border rounded-md"
                        placeholder="%"
                    />
                </div>
            </div>
        </div>


        <div className="border-t pt-3">
          <h2 className="text-lg font-bold mb-2">العميل (اختياري)</h2>
          {selectedCustomer ? (
              <div className="bg-blue-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                      <p className="font-bold">{selectedCustomer.name}</p>
                      <p className="text-sm text-slate-600">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-sm text-red-600">تغيير</button>
              </div>
          ) : (
              <div className="relative">
                  <input 
                      type="text" 
                      placeholder="ابحث عن عميل بالاسم أو الهاتف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 text-sm border rounded-md"
                  />
                  {searchTerm && filteredCustomers.length > 0 && (
                      <ul className="border rounded-md mt-1 max-h-32 overflow-y-auto z-10 bg-white absolute w-full shadow-lg">
                          {filteredCustomers.map(c => (
                              <li key={c.id} onClick={() => { setSelectedCustomer(c); setSearchTerm(''); }} className="p-2 cursor-pointer hover:bg-slate-100 text-sm">{c.name}</li>
                          ))}
                      </ul>
                  )}
                  
                  <div className="mt-3">
                      {showAddForm ? (
                          <div className="space-y-2 p-3 bg-slate-50 rounded-md">
                              <input type="text" placeholder="اسم العميل الجديد" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                              <input type="text" placeholder="رقم الهاتف (اختياري)" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                              <div className="flex gap-2">
                                  <button onClick={handleAddCustomer} className="bg-primary text-white px-3 py-1 rounded-md text-sm">إضافة</button>
                                  <button onClick={() => setShowAddForm(false)} className="bg-slate-200 px-3 py-1 rounded-md text-sm">إلغاء</button>
                              </div>
                          </div>
                      ) : (
                          <button onClick={() => setShowAddForm(true)} className="text-sm text-primary flex items-center gap-1"><i className="fa-solid fa-plus"></i> إضافة عميل جديد</button>
                      )}
                  </div>
              </div>
          )}
        </div>

        <div className="border-t pt-3">
          <h2 className="text-lg font-bold mb-2">الدفع</h2>
          <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                  <label className="text-xs text-slate-500">المبلغ المدفوع (ج.م)</label>
                  <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded-md" step="0.5" />
              </div>
              <div>
                  <p className="text-xs text-slate-500">{difference >= 0 ? 'الباقي للعميل' : 'المبلغ المتبقي'}</p>
                  <p className={`font-bold text-lg ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(difference).toFixed(2)} ج.م</p>
              </div>
          </div>
          {cannotProceed && (
              <p className="text-xs text-red-600 text-center mt-2">
                البيع الآجل يتطلب تحديد العميل أولاً.
              </p>
          )}
        </div>
        
        <div className="flex gap-2 justify-end pt-2 border-t">
            <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm">إلغاء</button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="bg-primary text-white px-4 py-2 rounded-md text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={cannotProceed}
            >
              تأكيد البيع
            </button>
          </div>
      </div>
    </>
  );
};

export default CheckoutPage;