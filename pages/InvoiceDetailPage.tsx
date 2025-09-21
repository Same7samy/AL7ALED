

import React, { useState, useMemo } from 'react';
import { Invoice, Customer, CartItem } from '../types.ts';
import ConfirmDialog from '../components/ConfirmDialog.tsx';

interface InvoiceDetailPageProps {
  invoice: Invoice;
  customer?: Customer;
  onReturn: (invoiceId: number, itemsToReturn: CartItem[]) => void;
}

const DetailRow: React.FC<{ label: string, value: string | number, isBold?: boolean, color?: string }> = ({ label, value, isBold, color }) => (
    <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{label}:</p>
        <p className={`text-sm ${isBold ? 'font-bold' : ''} ${color || 'text-slate-800'}`}>{value}</p>
    </div>
);


const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({ invoice, customer, onReturn }) => {
  const [itemsToReturn, setItemsToReturn] = useState<Map<number, number>>(new Map());
  const [showConfirm, setShowConfirm] = useState(false);

  const returnedQuantities = useMemo(() => {
    const quantities = new Map<number, number>();
    (invoice.returnedItems || []).forEach(item => {
      quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
    });
    return quantities;
  }, [invoice.returnedItems]);

  const handleQuantityChange = (item: CartItem, quantityStr: string) => {
    const quantity = parseInt(quantityStr) || 0;
    const alreadyReturned = returnedQuantities.get(item.id) || 0;
    const maxReturnable = item.quantity - alreadyReturned;
    const newQuantity = Math.max(0, Math.min(quantity, maxReturnable));

    setItemsToReturn(prev => {
        const newMap = new Map(prev);
        if (newQuantity > 0) {
            newMap.set(item.id, newQuantity);
        } else {
            newMap.delete(item.id);
        }
        return newMap;
    });
  };
  
  const handleConfirmReturn = () => {
    const returnCart: CartItem[] = [];
    itemsToReturn.forEach((quantity, id) => {
        const originalItem = invoice.items.find(i => i.id === id);
        if (originalItem && quantity > 0) {
            returnCart.push({ ...originalItem, quantity });
        }
    });
    if (returnCart.length > 0) {
        onReturn(invoice.id, returnCart);
    }
    setShowConfirm(false);
    setItemsToReturn(new Map());
  };

  const totalReturnValue = useMemo(() => {
    let total = 0;
    itemsToReturn.forEach((quantity, id) => {
        const item = invoice.items.find(i => i.id === id);
        if (item) {
            total += item.price * quantity;
        }
    });
    return total;
  }, [itemsToReturn, invoice.items]);

  const isFullyReturned = invoice.status === 'fully_returned';


  return (
    <>
    {showConfirm && (
        <ConfirmDialog
            isOpen={true}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmReturn}
            title="تأكيد الإرجاع"
            message={`هل أنت متأكد من إرجاع منتجات بقيمة ${totalReturnValue.toFixed(2)} ج.م؟ سيتم تحديث المخزون وحساب العميل.`}
            confirmText="تأكيد الإرجاع"
        />
    )}
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center border-b pb-3">
        <h2 className="text-xl font-bold">فاتورة مبيعات</h2>
        <p className="text-sm text-slate-500">رقم الفاتورة: #{invoice.id}</p>
        <p className="text-sm text-slate-500">
          التاريخ: {new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="border-b pb-3">
            <h3 className="text-base font-bold mb-2">بيانات العميل</h3>
            <DetailRow label="الاسم" value={customer.name} />
            {customer.phone && <DetailRow label="الهاتف" value={customer.phone} />}
        </div>
      )}

      {/* Items List */}
      <div>
        <h3 className="text-base font-bold mb-2">الأصناف المباعة</h3>
        <div className="space-y-2">
            {invoice.items.map(item => (
                <div key={item.id} className="flex items-center space-x-3 space-x-reverse bg-slate-50 p-2 rounded-md">
                    <div className="w-10 h-10 rounded-md flex-shrink-0">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full rounded-md object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-md bg-slate-200 flex items-center justify-center">
                                <i className="fa-solid fa-box-open text-slate-400 text-xl"></i>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x {item.price.toFixed(2)} ج.م</p>
                    </div>
                    <p className="font-bold text-sm text-slate-700">{(item.price * item.quantity).toFixed(2)} ج.م</p>
                </div>
            ))}
        </div>
      </div>

      {/* Returned Items */}
        {invoice.returnedItems && invoice.returnedItems.length > 0 && (
            <div className="border-t pt-3">
                <h3 className="text-base font-bold mb-2 text-amber-700">الأصناف المرتجعة</h3>
                {invoice.returnedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-1">
                        <p>{item.name} <span className="text-xs text-slate-500">(x{item.quantity})</span></p>
                        <p className="font-semibold text-amber-600">-{(item.price * item.quantity).toFixed(2)} ج.م</p>
                    </div>
                ))}
            </div>
        )}

      {/* Financial Summary */}
       <div className="border-t pt-3 space-y-1.5">
            <DetailRow label="المجموع الفرعي" value={`${invoice.subtotal.toFixed(2)} ج.م`} />
            {invoice.discountAmount && invoice.discountAmount > 0 && (
              <DetailRow label={`خصم الكوبون (${invoice.couponCode || 'كوبون'})`} value={`-${invoice.discountAmount.toFixed(2)} ج.م`} color="text-amber-600" />
            )}
             {invoice.manualDiscountAmount && invoice.manualDiscountAmount > 0 && (
              <DetailRow label="خصم يدوي" value={`-${invoice.manualDiscountAmount.toFixed(2)} ج.م`} color="text-amber-600" />
            )}
            {invoice.taxAmount && invoice.taxAmount > 0 && (
              <DetailRow label="ضريبة" value={`+${invoice.taxAmount.toFixed(2)} ج.م`} color="text-green-600" />
            )}
            <DetailRow label="الإجمالي النهائي" value={`${invoice.total.toFixed(2)} ج.م`} isBold />
            <DetailRow label="المبلغ المدفوع" value={`${invoice.paidAmount.toFixed(2)} ج.م`} color="text-green-600" />
            {invoice.debt > 0 && (
                 <DetailRow label="المبلغ المتبقي" value={`${invoice.debt.toFixed(2)} ج.م`} color="text-red-600" isBold />
            )}
            {invoice.change && invoice.change > 0 && (
                <DetailRow label="الباقي للعميل" value={`${invoice.change.toFixed(2)} ج.م`} color="text-primary" isBold />
            )}
            <div className="pt-2 text-center">
              {(invoice.status && invoice.status !== 'completed') ? (
                  <span className={`mt-2 inline-block text-xs font-bold px-3 py-1 rounded-md ${
                      invoice.status === 'fully_returned' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                      {invoice.status === 'fully_returned' ? 'مرتجعة بالكامل' : 'مرتجعة جزئياً'}
                  </span>
              ) : invoice.type === 'credit' ? (
                  <span className="mt-2 inline-block text-xs font-bold px-3 py-1 rounded-md bg-red-100 text-red-700">
                      آجل
                  </span>
              ) : null}
            </div>
      </div>

      {/* Return Section */}
      {!isFullyReturned && (
        <div className="border-t pt-3">
            <h3 className="text-base font-bold mb-2">إرجاع المنتجات</h3>
            <div className="space-y-3">
                {invoice.items.map(item => {
                    const alreadyReturned = returnedQuantities.get(item.id) || 0;
                    const maxReturnable = item.quantity - alreadyReturned;
                    if (maxReturnable <= 0) return null;

                    return (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-slate-500">المتاح للإرجاع: {maxReturnable}</p>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max={maxReturnable}
                                value={itemsToReturn.get(item.id) || ''}
                                onChange={(e) => handleQuantityChange(item, e.target.value)}
                                className="w-20 p-1 border rounded-md text-center"
                                placeholder="0"
                            />
                        </div>
                    )
                })}
            </div>
             {itemsToReturn.size > 0 && (
                <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between font-bold">
                        <span>قيمة المرتجع:</span>
                        <span className="text-amber-600">{totalReturnValue.toFixed(2)} ج.م</span>
                    </div>
                    <button 
                        onClick={() => setShowConfirm(true)}
                        className="w-full mt-2 bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600"
                    >
                        تأكيد الإرجاع
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
    </>
  );
};

export default InvoiceDetailPage;