
import React, { useMemo, useState } from 'react';
import { Supplier, PurchaseInvoice, SupplierPayment, Page } from '../types.ts';

interface SuppliersPageProps {
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
  setActivePage: (page: Page) => void;
  setSelectedSupplierId: (id: number | null) => void;
  onDelete: (ids: number[]) => void;
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, purchaseInvoices, supplierPayments, setActivePage, setSelectedSupplierId, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const supplierDebts = useMemo(() => {
    const balances = new Map<number, number>();
    
    purchaseInvoices.forEach(invoice => {
      balances.set(invoice.supplierId, (balances.get(invoice.supplierId) || 0) + invoice.debt);
    });

    supplierPayments.forEach(payment => {
      balances.set(payment.supplierId, (balances.get(payment.supplierId) || 0) - payment.amount);
    });

    return balances;
  }, [purchaseInvoices, supplierPayments]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSuppliers.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSupplierClick = (id: number) => {
    setSelectedSupplierId(id);
    setActivePage('supplierDetail');
  };
  
  const handleOpenAdd = () => {
    setSelectedSupplierId(null);
    setActivePage('addSupplier');
  };
  
  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setActivePage('editSupplier');
  };

  const handleBulkDelete = () => {
    onDelete(selectedIds);
    setSelectedIds([]);
  }

  return (
    <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-1.5">
            <div className="flex items-center w-full sm:w-72 border rounded-md bg-white focus-within:ring-2 focus-within:ring-sky-500">
                <input 
                    type="text" placeholder="ابحث بالاسم أو رقم الهاتف..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm outline-none bg-transparent"
                />
            </div>
             <button onClick={handleOpenAdd} className="bg-sky-600 text-white px-3 py-2 rounded-md shadow-sm hover:bg-sky-700 transition-colors text-sm flex items-center justify-center gap-2">
              <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">إضافة مورد</span>
            </button>
        </div>

      <div className="bg-white p-2 rounded-lg shadow-md flex justify-between items-center text-sm">
        <div className="flex items-center gap-3">
            <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredSuppliers.length && filteredSuppliers.length > 0} className="rounded" />
            <p className="font-semibold text-slate-600">عدد الموردين: <span className="font-bold text-sky-700">{filteredSuppliers.length}</span></p>
        </div>
        {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-trash-can"></i> حذف ({selectedIds.length})
            </button>
        )}
      </div>

      <div className="space-y-2">
        {filteredSuppliers.map(supplier => {
          const debt = supplierDebts.get(supplier.id) || 0;
          return (
            <div 
              key={supplier.id} 
              className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3 space-x-reverse"
            >
              <input type="checkbox" checked={selectedIds.includes(supplier.id)} onChange={() => handleSelect(supplier.id)} className="rounded" />
              <div className="flex-grow cursor-pointer" onClick={() => handleSupplierClick(supplier.id)}>
                <h3 className="font-bold text-sm">{supplier.name}</h3>
                <p className="text-xs text-slate-500">{supplier.phone}</p>
              </div>
              <div className="text-left cursor-pointer" onClick={() => handleSupplierClick(supplier.id)}>
                <p className="text-xs text-slate-500">مستحقات المورد</p>
                <p className={`font-bold text-base ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {debt.toFixed(2)} ج.م
                </p>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => handleOpenEdit(supplier)} className="p-1.5 text-slate-400 hover:text-sky-600" aria-label={`تعديل ${supplier.name}`}><i className="fa-solid fa-pen-to-square"></i></button>
                 <button onClick={() => onDelete([supplier.id])} className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`حذف ${supplier.name}`}><i className="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          );
        })}
         {filteredSuppliers.length === 0 && (
            <p className="text-center text-slate-500 py-8">لا يوجد موردين لعرضهم.</p>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;