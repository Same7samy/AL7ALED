

import React, { useState, useMemo } from 'react';
import { Invoice, Customer, Page } from '../types';

interface InvoicesPageProps {
  invoices: Invoice[];
  customers: Customer[];
  setActivePage: (page: Page) => void;
  setSelectedInvoiceId: (id: number | null) => void;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, customers, setActivePage, setSelectedInvoiceId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      if (searchTerm === '') return true;

      const lowerCaseSearch = searchTerm.toLowerCase();
      
      // Search by invoice ID
      if (invoice.id.toString().includes(lowerCaseSearch)) {
        return true;
      }
      
      // Search by customer name
      if (invoice.customerId) {
        const customer = customers.find(c => c.id === invoice.customerId);
        if (customer && customer.name.toLowerCase().includes(lowerCaseSearch)) {
          return true;
        }
      }
      
      // Search by product name in items
      if (invoice.items.some(item => item.name.toLowerCase().includes(lowerCaseSearch))) {
        return true;
      }
      
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, customers, searchTerm]);

  const handleInvoiceClick = (id: number) => {
    setSelectedInvoiceId(id);
    setActivePage('invoiceDetail');
  };

  const getStatusChip = (invoice: Invoice) => {
    if (invoice.status === 'fully_returned' || invoice.status === 'partially_returned') {
      return <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">{invoice.status === 'fully_returned' ? 'مرتجع كلي' : 'مرتجع جزئي'}</span>;
    }
    if (invoice.type === 'credit') {
      return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">آجل</span>;
    }
    return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">نقدي</span>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center w-full border rounded-md bg-white focus-within:ring-2 focus-within:ring-primary mb-1.5">
          <input 
            type="text" placeholder="ابحث برقم الفاتورة، اسم العميل، أو منتج..."
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 text-sm outline-none bg-transparent"
          />
      </div>
      
      <div className="space-y-2">
        {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => {
          const customer = invoice.customerId ? customers.find(c => c.id === invoice.customerId) : null;
          return (
            <div 
              key={invoice.id} 
              className="bg-white p-3 rounded-lg shadow-md cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleInvoiceClick(invoice.id)}
            >
              <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm">فاتورة #{invoice.id}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(invoice.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-1">{customer ? customer.name : 'عميل نقدي'}</p>
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-base text-slate-800">{invoice.total.toFixed(2)} ج.م</p>
                     <div className="mt-2">
                       {getStatusChip(invoice)}
                     </div>
                  </div>
              </div>
            </div>
          );
        }) : (
            <p className="text-center text-slate-500 pt-8">لا توجد فواتير تطابق بحثك.</p>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;