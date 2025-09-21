
import React, { useState, useMemo, useEffect } from 'react';
import { Offer, Product, Coupon } from '../types';

interface OffersPageProps {
  offers: Offer[];
  onSaveOffer: (data: Omit<Offer, 'id'>, id?: number) => void;
  onDeleteOffer: (id: number) => void;
  coupons: Coupon[];
  onSaveCoupon: (data: Omit<Coupon, 'id'>, id?: number) => void;
  onDeleteCoupon: (id: number) => void;
  products: Product[];
  showConfirmDialog: (dialog: { title: string; message: string; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmColor?: 'red' | 'sky'; }) => void;
}

const OfferFormModal: React.FC<{
    offerToEdit: Offer | null;
    onSave: (offer: Omit<Offer, 'id'>) => void;
    onClose: () => void;
    products: Product[];
}> = ({ offerToEdit, onSave, onClose, products }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', barcode: '', items: [] as { productId: number, quantity: number }[], price: '' as number | '', isActive: true,
    });
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => { 
        if (offerToEdit) {
// FIX: Explicitly map properties from offerToEdit to formData to resolve type mismatch with optional 'barcode' property.
            setFormData({
                name: offerToEdit.name,
                description: offerToEdit.description,
                barcode: offerToEdit.barcode || '',
                items: offerToEdit.items,
                price: offerToEdit.price,
                isActive: offerToEdit.isActive
            });
        } else {
            setFormData({
                name: '', description: '', barcode: '', items: [], price: '', isActive: true,
            });
        }
    }, [offerToEdit]);

    const availableProducts = useMemo(() => {
        const offerProductIds = new Set(formData.items.map(i => i.productId));
        return products.filter(p => !offerProductIds.has(p.id));
    }, [products, formData.items]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5);
    }, [availableProducts, productSearch]);

    const addProductToOffer = (product: Product) => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { productId: product.id, quantity: 1 }] }));
        setProductSearch('');
    };

    const removeProductFromOffer = (productId: number) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.productId !== productId) }));
    };
    
    const updateItemQuantity = (productId: number, quantity: number) => {
        const newQuantity = Math.max(1, quantity);
        setFormData(prev => ({ ...prev, items: prev.items.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? (value === '' ? '' : parseFloat(value)) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.items.length > 0 && Number(formData.price) > 0) {
            onSave({
                name: formData.name,
                description: formData.description,
                barcode: formData.barcode || undefined,
                items: formData.items,
                price: Number(formData.price),
                isActive: formData.isActive,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b"><h2 className="text-lg font-bold">{offerToEdit ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2></div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input type="text" name="name" placeholder="اسم العرض" value={formData.name} onChange={handleChange} className="w-full p-2 text-sm border rounded-md" required />
                    <textarea name="description" placeholder="وصف العرض (اختياري)" value={formData.description} onChange={handleChange} className="w-full p-2 text-sm border rounded-md h-20" />
                    <input type="text" name="barcode" placeholder="باركود العرض (اختياري)" value={formData.barcode || ''} onChange={handleChange} className="w-full p-2 text-sm border rounded-md" />
                    <input type="number" name="price" placeholder="سعر العرض الإجمالي" value={formData.price} onChange={handleChange} className="w-full p-2 text-sm border rounded-md" required step="0.01" />

                    <div className="border-t pt-3">
                        <h3 className="font-semibold text-sm mb-2">منتجات العرض</h3>
                        <div className="relative">
                           <input type="text" placeholder="ابحث لإضافة منتج..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                           {filteredProducts.length > 0 && (
                               <ul className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md border z-30">
                                   {filteredProducts.map(p => <li key={p.id} onClick={() => addProductToOffer(p)} className="p-2 text-sm cursor-pointer hover:bg-slate-100">{p.name}</li>)}
                               </ul>
                           )}
                        </div>
                        <div className="mt-2 space-y-2">
                           {formData.items.map(item => {
                               const product = products.find(p => p.id === item.productId);
                               if (!product) return null;
                               return (
                                   <div key={item.productId} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                                        <div className="flex-grow">
                                          <p className="font-semibold text-sm">{product.name}</p>
                                          <p className="text-xs text-slate-400">{product.price.toFixed(2)} ج.م</p>
                                        </div>
                                        <input type="number" value={item.quantity} onChange={e => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-16 p-1 border rounded-md text-center text-sm" min="1" />
                                        <button type="button" onClick={() => removeProductFromOffer(item.productId)} className="text-red-500"><i className="fa-solid fa-trash-can"></i></button>
                                   </div>
                               );
                           })}
                           {formData.items.length === 0 && <p className="text-xs text-center text-slate-400 py-2">لم تتم إضافة منتجات بعد.</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData(p => ({...p, isActive: e.target.checked}))} className="rounded" />
                        <label htmlFor="isActive" className="text-sm font-medium">العرض مفعل</label>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold">إلغاء</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold">حفظ</button>
                </div>
            </form>
        </div>
    );
}
const CouponFormModal: React.FC<{
    couponToEdit: Coupon | null;
    onSave: (coupon: Omit<Coupon, 'id'>) => void;
    onClose: () => void;
}> = ({ couponToEdit, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        code: '', type: 'percentage' as 'percentage' | 'fixed_amount', value: '' as number | '', isActive: true, minPurchaseAmount: '' as number | '', expiryDate: '',
    });

    useEffect(() => {
        if (couponToEdit) {
// FIX: Explicitly map properties to avoid spreading 'id' and handle optional/required value mismatches correctly.
            setFormData({
                code: couponToEdit.code,
                type: couponToEdit.type,
                value: couponToEdit.value,
                isActive: couponToEdit.isActive,
                minPurchaseAmount: couponToEdit.minPurchaseAmount ?? '',
                expiryDate: couponToEdit.expiryDate ?? '',
            });
        } else {
            setFormData({
                code: '', type: 'percentage', value: '', isActive: true, minPurchaseAmount: '', expiryDate: '',
            });
        }
    }, [couponToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? (value === '' ? '' : parseFloat(value)) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.code && Number(formData.value) > 0) {
            onSave({
                code: formData.code,
                type: formData.type,
                isActive: formData.isActive,
                expiryDate: formData.expiryDate || undefined,
                value: Number(formData.value),
                minPurchaseAmount: formData.minPurchaseAmount != null && formData.minPurchaseAmount !== '' ? Number(formData.minPurchaseAmount) : undefined,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b"><h2 className="text-lg font-bold">{couponToEdit ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</h2></div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input type="text" name="code" placeholder="كود الخصم (مثال: RAMADAN20)" value={formData.code} onChange={handleChange} className="w-full p-2 text-sm border rounded-md uppercase" required />
                    <div className="grid grid-cols-2 gap-3">
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 text-sm border rounded-md">
                            <option value="percentage">نسبة مئوية (%)</option>
                            <option value="fixed_amount">مبلغ ثابت (ج.م)</option>
                        </select>
                        <input type="number" name="value" placeholder="قيمة الخصم" value={formData.value} onChange={handleChange} className="w-full p-2 text-sm border rounded-md" required step="0.01" />
                    </div>
                     <input type="number" name="minPurchaseAmount" placeholder="الحد الأدنى للفاتورة (اختياري)" value={formData.minPurchaseAmount} onChange={handleChange} className="w-full p-2 text-sm border rounded-md" step="0.01" />
                    <div>
                        <label className="text-xs text-slate-500">تاريخ الانتهاء (اختياري)</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full p-2 mt-1 text-sm border rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isCouponActive" checked={formData.isActive} onChange={e => setFormData(p => ({...p, isActive: e.target.checked}))} className="rounded" />
                        <label htmlFor="isCouponActive" className="text-sm font-medium">الكوبون مفعل</label>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold">إلغاء</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold">حفظ</button>
                </div>
            </form>
        </div>
    );
};


const OffersPage: React.FC<OffersPageProps> = ({ offers, onSaveOffer, onDeleteOffer, coupons, onSaveCoupon, onDeleteCoupon, products, showConfirmDialog }) => {
    const [activeTab, setActiveTab] = useState<'offers' | 'coupons'>('offers');
    const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
    const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null);
    const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
    const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

    const handleSaveOffer = (data: Omit<Offer, 'id'>) => {
        onSaveOffer(data, offerToEdit?.id);
        setIsOfferFormOpen(false); setOfferToEdit(null);
    };

    const handleEditOffer = (offer: Offer) => { setOfferToEdit(offer); setIsOfferFormOpen(true); };

    const handleDeleteOffer = (id: number) => {
        const offer = offers.find(o => o.id === id);
        if (!offer) return;
        showConfirmDialog({ title: 'تأكيد الحذف', message: `هل أنت متأكد من حذف عرض "${offer.name}"؟`, onConfirm: () => onDeleteOffer(id), confirmText: 'حذف', confirmColor: 'red' });
    };

    const handleSaveCoupon = (data: Omit<Coupon, 'id'>) => {
        onSaveCoupon(data, couponToEdit?.id);
        setIsCouponFormOpen(false); setCouponToEdit(null);
    };
    
    const handleEditCoupon = (coupon: Coupon) => { setCouponToEdit(coupon); setIsCouponFormOpen(true); };

    const handleDeleteCoupon = (id: number) => {
        const coupon = coupons.find(c => c.id === id);
        if (!coupon) return;
        showConfirmDialog({ title: 'تأكيد الحذف', message: `هل أنت متأكد من حذف كوبون "${coupon.code}"؟`, onConfirm: () => onDeleteCoupon(id), confirmText: 'حذف', confirmColor: 'red' });
    };
    
    return (
        <div className="space-y-3">
             {isOfferFormOpen && <OfferFormModal offerToEdit={offerToEdit} onSave={handleSaveOffer} onClose={() => { setIsOfferFormOpen(false); setOfferToEdit(null); }} products={products} />}
             {isCouponFormOpen && <CouponFormModal couponToEdit={couponToEdit} onSave={handleSaveCoupon} onClose={() => { setIsCouponFormOpen(false); setCouponToEdit(null); }} />}
            
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('offers')} className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'offers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>العروض</button>
                    <button onClick={() => setActiveTab('coupons')} className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'coupons' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>الكوبونات</button>
                </nav>
            </div>
            
            {activeTab === 'offers' && (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-slate-700">قائمة العروض ({offers.length})</h2>
                        <button onClick={() => { setOfferToEdit(null); setIsOfferFormOpen(true); }} className="bg-primary text-white px-3 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-plus"></i> <span>إضافة عرض</span></button>
                    </div>
                    <div className="space-y-2">
                        {offers.map(offer => (
                            <div key={offer.id} className="bg-white p-3 rounded-lg shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><i className="fa-solid fa-tags"></i></div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm">{offer.name} <span className={`text-xs px-2 py-0.5 rounded-full ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{offer.isActive ? 'مفعل' : 'غير مفعل'}</span></p>
                                        <p className="text-xs text-slate-500">{offer.description}</p>
                                        <div className="text-xs mt-1 border-t pt-1">
                                            {offer.items.map(item => {
                                                const product = products.find(p => p.id === item.productId);
                                                return <span key={item.productId} className="bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 ml-1 inline-block mb-1">{product?.name || 'منتج محذوف'} (x{item.quantity})</span>
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-base text-primary">{offer.price.toFixed(2)} ج.م</p>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleEditOffer(offer)} className="p-1 text-slate-400 hover:text-primary text-xs"><i className="fa-solid fa-pen"></i></button>
                                            <button onClick={() => handleDeleteOffer(offer.id)} className="p-1 text-slate-400 hover:text-red-600 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {offers.length === 0 && <div className="text-center py-10 text-slate-400"><i className="fa-solid fa-tags text-5xl"></i><p className="mt-4 font-semibold">لا توجد عروض</p><p className="text-sm">أضف عرضك الترويجي الأول.</p></div>}
                    </div>
                </>
            )}

            {activeTab === 'coupons' && (
                 <>
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-slate-700">قائمة الكوبونات ({coupons.length})</h2>
                        <button onClick={() => { setCouponToEdit(null); setIsCouponFormOpen(true); }} className="bg-primary text-white px-3 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-sm flex items-center gap-2"><i className="fa-solid fa-plus"></i> <span>إضافة كوبون</span></button>
                    </div>
                     <div className="space-y-2">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="bg-white p-3 rounded-lg shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="fa-solid fa-ticket-simple"></i></div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm">{coupon.code} <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{coupon.isActive ? 'مفعل' : 'غير مفعل'}</span></p>
                                        <p className="text-xs text-slate-500">
                                            {coupon.type === 'percentage' ? `خصم ${coupon.value}%` : `خصم ${coupon.value.toFixed(2)} ج.م`}
                                            {coupon.minPurchaseAmount && `, حد أدنى ${coupon.minPurchaseAmount.toFixed(2)} ج.م`}
                                            {coupon.expiryDate && `, ينتهي في ${coupon.expiryDate}`}
                                        </p>
                                    </div>
                                    <div className="text-left flex-shrink-0">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditCoupon(coupon)} className="p-1 text-slate-400 hover:text-primary text-xs"><i className="fa-solid fa-pen"></i></button>
                                            <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-1 text-slate-400 hover:text-red-600 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {coupons.length === 0 && <div className="text-center py-10 text-slate-400"><i className="fa-solid fa-ticket-simple text-5xl"></i><p className="mt-4 font-semibold">لا توجد كوبونات</p><p className="text-sm">أضف كوبون الخصم الأول.</p></div>}
                    </div>
                </>
            )}
        </div>
    );
};

export default OffersPage;
