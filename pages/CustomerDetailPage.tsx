
import React, { useMemo, useState } from 'react';
import { Customer, Invoice, Payment } from '../types';

interface CustomerDetailPageProps {
  customer: Customer;
  invoices: Invoice[];
  payments: Payment[];
  onPayDebt: (customerId: number, amount: number) => void;
  onViewInvoice: (invoiceId: number) => void;
}

const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customer, invoices, payments, onPayDebt, onViewInvoice }) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  const { transactions, totalDebt } = useMemo(() => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const customerPayments = payments.filter(pay => pay.customerId === customer.id);

    const mappedInvoices = customerInvoices.map(inv => ({
      ...inv,
      transactionType: 'invoice' as 'invoice',
      description: `فاتورة #${inv.id}`,
    }));
    
    const mappedPayments = customerPayments.map(pay => ({
      ...pay,
      transactionType: 'payment' as 'payment',
      description: 'دفعة سداد',
    }));

    const allTransactions = [...mappedInvoices, ...mappedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const debtFromInvoices = customerInvoices.reduce((sum, inv) => sum + inv.debt, 0);
    const totalPaidViaPayments = customerPayments.reduce((sum, pay) => sum + pay.amount, 0);

    const finalTotalDebt = debtFromInvoices - totalPaidViaPayments;

    return { transactions: allTransactions, totalDebt: finalTotalDebt };
  }, [customer.id, invoices, payments]);

  const handlePay = () => {
    const amount = Number(paymentAmount);
    if (amount > 0) {
      onPayDebt(customer.id, amount);
      setPaymentAmount('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">{customer.name}</h2>
        <p className="text-sm text-slate-500">{customer.phone}</p>
        <div className={`mt-3 p-3 rounded-md ${totalDebt > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
          <p className="text-xs text-slate-600">إجمالي الدين الحالي</p>
          <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totalDebt.toFixed(2)} ج.م
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">تسديد دفعة</h3>
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
                className="bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-bold"
            >
                تسديد
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">كشف حساب</h3>
        <div className="space-y-2">
          {transactions.map(t => {
            const isInvoice = t.transactionType === 'invoice';
            const invoice = isInvoice ? (t as Invoice) : null;
            const payment = !isInvoice ? (t as Payment) : null;

            return (
              <div 
                key={`${t.transactionType}-${t.id}`}
                onClick={() => isInvoice && onViewInvoice(t.id)}
                className={`flex justify-between items-center border-b pb-2 ${isInvoice ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <div>
                  <p className="font-semibold text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(t.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {invoice && ` | مدفوع: ${invoice.paidAmount.toFixed(2)} | متبقي: ${invoice.debt.toFixed(2)}`}
                  </p>
                </div>
                <p className={`font-bold text-sm ${!isInvoice ? 'text-green-600' : 'text-red-600'}`}>
                  {payment ? `+${payment.amount.toFixed(2)}` : `-${invoice?.total.toFixed(2)}`} ج.م
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

export default CustomerDetailPage;
