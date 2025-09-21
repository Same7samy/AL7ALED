

import React from 'react';
import { PurchaseInvoice, Supplier, Product } from '../types.ts';

interface PurchaseInvoiceDetailPageProps {
  invoice: PurchaseInvoice;
  supplier: Supplier;
  products: Product[];
}

const DetailRow: React.FC<{ label: string, value: string | number, isBold?: boolean, color?: string }> = ({ label, value, isBold, color }) => (
    <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{label}:</p>
        <p className={`text-sm ${isBold ? 'font-bold' : ''} ${color || 'text-slate-800'}`}>{value}</p>
    </div>
);

const PurchaseInvoiceDetailPage: React.FC<PurchaseInvoiceDetailPageProps> = ({ invoice, supplier, products }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center border-b pb-3">
        <h2 className="text-xl font-bold">فاتورة شراء</h2>
        <p className="text-sm text-slate-500">رقم الفاتورة: #{invoice.id}</p>
        <p className="text-sm text-slate-500">
          التاريخ: {new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Supplier Info */}
      <div className="border-b pb-3">
          <h3 className="text-base font-bold mb-2">بيانات المورد</h3>
          <DetailRow label="الاسم" value={supplier.name} />
          {supplier.phone && <DetailRow label="الهاتف" value={supplier.phone} />}
      </div>

      {/* Items List */}
      <div>
        <h3 className="text-base font-bold mb-2">الأصناف</h3>
        <div className="space-y-2">
            {invoice.items.map((item, index) => {
              const isNowRegistered = !item.productId && products.some(p => p.name === item.name);
              return (
                <div key={item.productId || index} className="flex items-center space-x-3 space-x-reverse bg-slate-50 p-2 rounded-md">
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">
                          {item.name} 
                           {!item.productId && (
                              isNowRegistered 
                              ? <span className="text-xs text-green-600 font-normal ml-1">(مسجل)</span>
                              : <span className="text-xs text-amber-600 font-normal ml-1">(منتج غير مسجل)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{item.quantity} x {item.purchasePrice.toFixed(2)} ج.م</p>
                    </div>
                    <p className="font-bold text-sm text-slate-700">{(item.purchasePrice * item.quantity).toFixed(2)} ج.م</p>
                </div>
            )})}
        </div>
      </div>

      {/* Financial Summary */}
       <div className="border-t pt-3 space-y-1.5">
            <DetailRow label="الإجمالي" value={`${invoice.total.toFixed(2)} ج.م`} isBold />
            <DetailRow label="المبلغ المدفوع" value={`${invoice.amountPaid.toFixed(2)} ج.م`} color="text-green-600" />
            {invoice.debt > 0 && (
                 <DetailRow label="المبلغ المتبقي" value={`${invoice.debt.toFixed(2)} ج.م`} color="text-red-600" isBold />
            )}
      </div>
    </div>
  );
};

export default PurchaseInvoiceDetailPage;