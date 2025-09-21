
import React, { useMemo, useState } from 'react';
import { Customer, Invoice, Page, Payment } from '../types.ts';

interface CustomersPageProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  setActivePage: (page: Page) => void;
  setSelectedCustomerId: (id: number | null) => void;
  onDelete: (ids: number[]) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, invoices, payments, setActivePage, setSelectedCustomerId, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const customerDebts = useMemo(() => {
    const balances = new Map<number, number>();
    
    invoices.forEach(invoice => {
      if (invoice.customerId) {
        balances.set(invoice.customerId, (balances.get(invoice.customerId) || 0) + invoice.debt);
      }
    });

    payments.forEach(payment => {
      if (payment.customerId) {
        balances.set(payment.customerId, (balances.get(payment.customerId) || 0) - payment.amount);
      }
    });

    return balances;
  }, [invoices, payments]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleCustomerClick = (id: number) => {
    setSelectedCustomerId(id);
    setActivePage('customerDetail');
  };
  
  const handleOpenAdd = () => {
    setSelectedCustomerId(null);
    setActivePage('addCustomer');
  };
  
  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setActivePage('editCustomer');
  };

  const handleBulkDelete = () => {
    onDelete(selectedIds);
    setSelectedIds([]);
  }

  return (
    <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-1.5">
            <div className="flex items-center w-full sm:w-72 border rounded-md bg-white focus-within:ring-2 focus-within:ring-primary">
                <input 
                    type="text" placeholder="ابحث بالاسم أو رقم الهاتف..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm outline-none bg-transparent"
                />
            </div>
             <button onClick={handleOpenAdd} className="bg-primary text-white px-3 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-sm flex items-center justify-center gap-2">
              <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">إضافة عميل</span>
            </button>
        </div>

      <div className="bg-white p-2 rounded-lg shadow-md flex justify-between items-center text-sm">
        <div className="flex items-center gap-3">
            <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0} className="rounded" />
            <p className="font-semibold text-slate-600">عدد العملاء: <span className="font-bold text-primary">{filteredCustomers.length}</span></p>
        </div>
        {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-trash-can"></i> حذف ({selectedIds.length})
            </button>
        )}
      </div>

      <div className="space-y-2">
        {filteredCustomers.map(customer => {
          const debt = customerDebts.get(customer.id) || 0;
          return (
            <div 
              key={customer.id} 
              className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3 space-x-reverse"
            >
              <input type="checkbox" checked={selectedIds.includes(customer.id)} onChange={() => handleSelect(customer.id)} className="rounded" />
              <div className="flex-grow cursor-pointer" onClick={() => handleCustomerClick(customer.id)}>
                <h3 className="font-bold text-sm">{customer.name}</h3>
                <p className="text-xs text-slate-500">{customer.phone}</p>
              </div>
              <div className="text-left cursor-pointer" onClick={() => handleCustomerClick(customer.id)}>
                <p className="text-xs text-slate-500">الدين الحالي</p>
                <p className={`font-bold text-base ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {debt.toFixed(2)} ج.م
                </p>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => handleOpenEdit(customer)} className="p-1.5 text-slate-400 hover:text-primary" aria-label={`تعديل ${customer.name}`}><i className="fa-solid fa-pen-to-square"></i></button>
                 <button onClick={() => onDelete([customer.id])} className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`حذف ${customer.name}`}><i className="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomersPage;