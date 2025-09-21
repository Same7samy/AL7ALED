
import React, { useMemo, useState } from 'react';
import { Supplier, PurchaseInvoice, SupplierPayment } from '../types.ts';

interface SupplierDetailPageProps {
  supplier: Supplier;
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
  onPayDebt: (supplierId: number, amount: number) => void;
  onAddPurchaseInvoice: () => void;
  onViewPurchaseInvoice: (invoiceId: number) => void;
}

const SupplierDetailPage: React.FC<SupplierDetailPageProps> = ({ supplier, purchaseInvoices, supplierPayments, onPayDebt, onAddPurchaseInvoice, onViewPurchaseInvoice }) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  const { transactions, totalDebt } = useMemo(() => {
    const supplierInvoices = purchaseInvoices.filter(inv => inv.supplierId === supplier.id);
    const paymentsToSupplier = supplierPayments.filter(pay => pay.supplierId === supplier.id);

    const mappedInvoices = supplierInvoices.map(inv => ({
      ...inv,
      transactionType: 'invoice' as 'invoice',
      description: `فاتورة شراء #${inv.id}`,
    }));
    
    const mappedPayments = paymentsToSupplier.map(pay => ({
      ...pay,
      transactionType: 'payment' as 'payment',
      description: 'دفعة للمورد',
    }));

    const allTransactions = [...mappedInvoices, ...mappedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const debtFromInvoices = supplierInvoices.reduce((sum, inv) => sum + inv.debt, 0);
    const totalPaidViaPayments = paymentsToSupplier.reduce((sum, pay) => sum + pay.amount, 0);

    const finalTotalDebt = debtFromInvoices - totalPaidViaPayments;

    return { transactions: allTransactions, totalDebt: finalTotalDebt };
  }, [supplier.id, purchaseInvoices, supplierPayments]);

  const handlePay = () => {
    const amount = typeof paymentAmount === 'number' ? paymentAmount : parseFloat(paymentAmount);
    if (amount > 0) {
      onPayDebt(supplier.id, amount);
      setPaymentAmount('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">{supplier.name}</h2>
        <p className="text-sm text-slate-500">{supplier.phone}</p>
        <p className="text-sm text-slate-500">{supplier.address}</p>
        <div className={`mt-3 p-3 rounded-md ${totalDebt > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
          <p className="text-xs text-slate-600">إجمالي مستحقات المورد</p>
          <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totalDebt.toFixed(2)} ج.م
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">تسجيل دفعة للمورد</h3>
        <div className="flex gap-2">
            <input 
                type="number"
                placeholder="أدخل المبلغ"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full p-2 text-sm border rounded-md"
                step="0.5"
            />
            <button
                onClick={handlePay}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-bold"
            >
                تسديد
            </button>
        </div>
      </div>
      
       <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">كشف حساب المورد</h3>
            <button onClick={onAddPurchaseInvoice} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-plus"></i> فاتورة شراء
            </button>
        </div>
        <div className="space-y-2">
          {transactions.map(t => {
            const isInvoice = t.transactionType === 'invoice';
            const invoice = isInvoice ? (t as PurchaseInvoice) : null;
            const payment = !isInvoice ? (t as SupplierPayment) : null;

            return (
              <div 
                key={`${t.transactionType}-${t.id}`}
                onClick={() => isInvoice && onViewPurchaseInvoice(t.id)}
                className={`flex justify-between items-center border-b pb-2 ${isInvoice ? 'cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-md' : 'py-2'}`}
              >
                <div>
                  <p className="font-semibold text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(t.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {invoice && ` | مدفوع: ${invoice.amountPaid.toFixed(2)} | متبقي: ${invoice.debt.toFixed(2)}`}
                  </p>
                </div>
                <p className={`font-bold text-sm ${isInvoice ? 'text-red-600' : 'text-green-600'}`}>
                  {isInvoice ? `-${invoice?.total.toFixed(2)}` : `+${payment?.amount.toFixed(2)}`} ج.م
                </p>
              </div>
            );
          })}
          {transactions.length === 0 && <p className="text-slate-500 text-sm text-center py-4">لا توجد معاملات لعرضها.</p>}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailPage;