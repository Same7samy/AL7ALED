import React, { useState, useMemo } from 'react';
import { Product, Page } from '../types';

interface ProductsPageProps {
  products: Product[];
  setActivePage: (page: Page) => void;
  setSelectedProductId: (id: number | null) => void;
  onDelete: (ids: number[]) => void;
  openScanner: (onScan: (barcode: string) => void) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, setActivePage, setSelectedProductId, onDelete, openScanner }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesSearch = searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleProductClick = (id: number) => {
    setSelectedProductId(id);
    setActivePage('productDetail');
  };

  const handleBulkDelete = () => {
    onDelete(selectedIds);
    setSelectedIds([]); // Clear selection immediately to update UI
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-1.5">
        <div className="flex items-center w-full sm:w-72 border rounded-md bg-white focus-within:ring-2 focus-within:ring-primary">
            <input 
              type="text" placeholder="ابحث بالاسم أو الباركود..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm outline-none bg-transparent"
            />
             <button type="button" onClick={() => openScanner(setSearchTerm)} className="p-2 text-slate-500 hover:text-primary" aria-label="مسح الباركود للبحث">
                <i className="fa-solid fa-barcode"></i>
            </button>
        </div>
        <div className="flex gap-2">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full sm:w-36 p-2 text-sm border rounded-md bg-white">
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'كل التصنيفات' : cat}</option>)}
            </select>
            <button onClick={() => setActivePage('addProduct')} className="bg-primary text-white px-3 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-sm flex items-center justify-center gap-2">
              <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">إضافة منتج</span>
            </button>
        </div>
      </div>
      
      {/* Header and Bulk Actions */}
      <div className="bg-white p-2 rounded-lg shadow-md flex justify-between items-center text-sm">
        <div className="flex items-center gap-3">
            <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} className="rounded" />
            <p className="font-semibold text-slate-600">عدد المنتجات: <span className="font-bold text-primary">{filteredProducts.length}</span></p>
        </div>
        {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-trash-can"></i> حذف ({selectedIds.length})
            </button>
        )}
      </div>

      {/* Products List */}
      <div className="space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-2.5 rounded-lg shadow-md flex items-center space-x-3 space-x-reverse">
            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => handleSelect(product.id)} className="rounded" />
            <div className="w-16 h-16 rounded-md flex-shrink-0 cursor-pointer" onClick={() => handleProductClick(product.id)}>
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full rounded-md object-cover" />
                ) : (
                    <div className="w-full h-full rounded-md bg-slate-200 flex items-center justify-center">
                        <i className="fa-solid fa-box-open text-slate-400 text-2xl"></i>
                    </div>
                )}
            </div>
            <div className="flex-grow cursor-pointer" onClick={() => handleProductClick(product.id)}>
              <h3 className="font-bold text-sm">{product.name}</h3>
              <p className="text-xs text-slate-500">{product.category}</p>
              <p className="text-xs text-slate-400">الباركود: {product.barcode}</p>
            </div>
            <div className="text-left flex flex-col items-end flex-shrink-0">
              <p className="font-bold text-base text-primary">{product.price} ج.م</p>
              <p className="text-xs text-amber-600 mt-1">المخزون: {product.stock}</p>
            </div>
             <button onClick={() => onDelete([product.id])} className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`حذف ${product.name}`}>
                <i className="fa-solid fa-trash-can"></i>
              </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;