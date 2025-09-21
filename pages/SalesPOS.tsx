
import React, { useState, useCallback, useMemo } from 'react';
import { Product, CartItem, Offer, Coupon } from '../types';

type SearchResult = 
    | { type: 'product'; data: Product }
    | { type: 'offer'; data: Offer };

interface SalesPOSPageProps {
    products: Product[];
    offers: Offer[];
    coupons: Coupon[];
    onCheckout: (
        cart: CartItem[], 
        coupon: Coupon | null
    ) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    openScanner: (onScan: (barcode: string) => void) => void;
}

const SalesPOSPage: React.FC<SalesPOSPageProps> = ({ products, offers, coupons, onCheckout, showToast, openScanner }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowerCaseSearch = searchTerm.toLowerCase();
        const results: SearchResult[] = [];

        products.filter(p =>
            p.stock > 0 && (
                p.name.toLowerCase().includes(lowerCaseSearch) ||
                (p.barcode && p.barcode.includes(searchTerm))
            )
        ).forEach(p => results.push({ type: 'product', data: p }));

        offers.filter(o =>
            o.isActive && (
                o.name.toLowerCase().includes(lowerCaseSearch) ||
                (o.barcode && o.barcode.includes(searchTerm))
            )
        ).forEach(o => results.push({ type: 'offer', data: o }));
        
        results.sort((a, b) => a.data.name.localeCompare(b.data.name));

        return results.slice(0, 5);
    }, [products, offers, searchTerm]);

    const updateQuantity = useCallback((productId: number, newQuantity: number) => {
        setCart(currentCart => {
            const itemIndex = currentCart.findIndex(item => item.id === productId);
            if (itemIndex === -1) return currentCart;

            const product = products.find(p => p.id === productId);
            if (!product) return currentCart;
            
            if (newQuantity > product.stock) {
                 showToast(`الكمية القصوى لـ "${product.name}" هي ${product.stock}`, 'error');
                 newQuantity = product.stock;
            }

            if (newQuantity <= 0) {
                return currentCart.filter(item => item.id !== productId);
            }

            const newCart = [...currentCart];
            newCart[itemIndex] = { ...newCart[itemIndex], quantity: newQuantity };
            return newCart;
        });
    }, [products, showToast]);

    const addProductToCart = useCallback((product: Product) => {
        const existingItem = cart.find(item => item.id === product.id && item.price === product.price);
        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
             if (product.stock < 1) {
                showToast(`نفذ مخزون "${product.name}"`, 'error');
                return;
            }
            setCart(prevCart => [{ ...product, quantity: 1 }, ...prevCart]);
        }
    }, [cart, updateQuantity, showToast]);
    
    const addOfferToCart = useCallback((offer: Offer) => {
        for (const item of offer.items) {
            const product = products.find(p => p.id === item.productId);
            const neededQuantity = item.quantity;
            if (!product || product.stock < neededQuantity) {
                showToast(`لا يوجد مخزون كافٍ من "${product?.name}" لإضافة العرض`, 'error');
                return;
            }
        }
        
        const originalTotalPrice = offer.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        if (originalTotalPrice === 0) {
            showToast(`خطأ في حساب سعر العرض "${offer.name}"`, 'error');
            return;
        }

        const discountRatio = offer.price / originalTotalPrice;
        
        setCart(currentCart => {
            let newCart = [...currentCart];
            
            offer.items.forEach(item => {
                const product = products.find(p => p.id === item.productId)!;
                const discountedPrice = product.price * discountRatio;
                
                const existingCartItemIndex = newCart.findIndex(ci => ci.id === product.id && ci.price === discountedPrice);

                if (existingCartItemIndex !== -1) {
                    newCart[existingCartItemIndex].quantity += item.quantity;
                } else {
                    newCart.unshift({
                        ...product,
                        price: discountedPrice,
                        quantity: item.quantity
                    });
                }
            });
            return newCart;
        });
    }, [products, setCart, showToast]);

    const handleScan = (barcode: string) => {
        const offer = offers.find(o => o.barcode === barcode && o.isActive);
        if (offer) {
            addOfferToCart(offer);
            return;
        }
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addProductToCart(product);
        } else {
            showToast("لم يتم العثور على منتج أو عرض بهذا الباركود", 'error');
        }
    };

    const handleSearchResultClick = (result: SearchResult) => {
        setSearchTerm('');
        if (result.type === 'product') {
            addProductToCart(result.data);
        } else {
            addOfferToCart(result.data);
        }
    };
    
    const handleCheckout = () => {
        if (cart.length === 0) {
            showToast("يرجى إضافة منتجات إلى السلة أولاً", 'error');
            return;
        }
        onCheckout(cart, appliedCoupon);
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const { couponDiscount, finalTotal } = useMemo(() => {
        let sub = subtotal;
        let coupDisc = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'fixed_amount') {
                coupDisc = appliedCoupon.value;
            } else {
                coupDisc = (sub * appliedCoupon.value) / 100;
            }
        }
        coupDisc = Math.min(sub, coupDisc);
        sub -= coupDisc;
        
        return { couponDiscount: coupDisc, finalTotal: sub };
    }, [subtotal, appliedCoupon]);
    
    const handleApplyCoupon = () => {
        const code = couponCode.trim().toLowerCase();
        if (!code) return;

        const coupon = coupons.find(c => c.code.toLowerCase() === code);
        if (!coupon) {
            showToast('كوبون غير صالح', 'error');
            return;
        }
        if (!coupon.isActive) {
            showToast('هذا الكوبون غير فعال حالياً', 'error');
            return;
        }
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            showToast('هذا الكوبون قد انتهت صلاحيته', 'error');
            return;
        }
        if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
            showToast(`يجب أن تكون قيمة المشتريات ${coupon.minPurchaseAmount.toFixed(2)} ج.م على الأقل`, 'error');
            return;
        }
        setAppliedCoupon(coupon);
        showToast('تم تطبيق الكوبون بنجاح');
    };

    const removeItem = (id: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    return (
        <div className="h-[calc(100vh-5.5rem)] flex flex-col">
            <div className="flex-shrink-0 mb-2.5 relative">
                <div className="flex items-center w-full border rounded-md bg-white focus-within:ring-2 focus-within:ring-primary">
                    <input 
                        type="text" placeholder="ابحث بالاسم أو امسح الباركود..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 text-sm outline-none bg-transparent"
                    />
                    <button type="button" onClick={() => openScanner(handleScan)} className="p-2 text-slate-500 hover:text-primary" aria-label="مسح الباركود للبحث">
                        <i className="fa-solid fa-barcode"></i>
                    </button>
                </div>
                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-md border z-20">
                        {searchResults.length > 0 ? (
                            searchResults.map(result => (
                                <div key={`${result.type}-${result.data.id}`} onClick={() => handleSearchResultClick(result)} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-slate-100 border-b last:border-b-0">
                                    <div className="w-8 h-8 rounded-md flex-shrink-0 bg-slate-200 flex items-center justify-center">
                                      {result.type === 'product' && (result.data as Product).imageUrl ? <img src={(result.data as Product).imageUrl} alt={result.data.name} className="w-full h-full object-cover rounded-md" /> : <i className={`fa-solid ${result.type === 'offer' ? 'fa-tags text-amber-500' : 'fa-box-open text-slate-400'}`}></i> }
                                    </div>
                                    <p className="text-sm font-semibold">{result.data.name}</p>
                                    <p className="text-sm text-primary ml-auto">{result.data.price.toFixed(2)} ج.م</p>
                                </div>
                            ))
                        ) : (
                            <p className="p-3 text-sm text-slate-500 text-center">لا توجد نتائج مطابقة.</p>
                        )}
                    </div>
                )}
            </div>

            <main className="flex-grow overflow-y-auto pr-1 pb-40">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-400">
                        <i className="fa-solid fa-cart-shopping text-5xl"></i>
                        <p className="mt-4 font-semibold text-lg">السلة فارغة</p>
                        <p className="text-sm">استخدم البحث أو الماسح الضوئي لإضافة منتجات</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow-md p-2 flex items-center space-x-3 space-x-reverse">
                            <div className="w-16 h-16 rounded-md flex-shrink-0">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full rounded-md object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-md bg-slate-200 flex items-center justify-center">
                                        <i className="fa-solid fa-box-open text-slate-400 text-2xl"></i>
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm font-semibold">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.price.toFixed(2)} ج.م</p>
                                 <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-md bg-slate-200 text-lg font-bold flex items-center justify-center leading-none">-</button>
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val > 0) {
                                            updateQuantity(item.id, val);
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val) || val < 1) {
                                            updateQuantity(item.id, 1);
                                        }
                                      }}
                                      className="font-bold text-base text-slate-700 w-12 h-7 text-center border-slate-200 border rounded-md p-1"
                                    />
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-md bg-slate-200 text-lg font-bold flex items-center justify-center leading-none">+</button>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="font-bold text-base text-slate-800">{(item.price * item.quantity).toFixed(2)}</p>
                                <button onClick={() => removeItem(item.id)} className="text-red-500 mt-2 text-sm"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
            </main>

             {cart.length > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-3 z-10 space-y-2">
                    <div>
                        {appliedCoupon ? (
                            <div className="bg-slate-50 p-2 rounded-md flex justify-between items-center text-xs">
                                <div>
                                    <p className="font-semibold text-green-600">كوبون: {appliedCoupon.code}</p>
                                </div>
                                <button onClick={() => setAppliedCoupon(null)} className="text-red-500 font-bold">إزالة</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="كود الخصم" className="w-full p-2 text-sm border rounded-md" />
                                <button onClick={handleApplyCoupon} className="bg-slate-700 text-white px-3 rounded-md text-xs">تطبيق</button>
                            </div>
                        )}
                    </div>
                   <div className="flex justify-between items-center text-sm">
                        <div className="space-y-0.5">
                           <p>المجموع الفرعي: <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span></p>
                           {couponDiscount > 0 && <p className="text-red-600">خصم الكوبون: -{couponDiscount.toFixed(2)} ج.م</p>}
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500">الإجمالي</p>
                            <p className="font-bold text-xl">{finalTotal.toFixed(2)} ج.م</p>
                        </div>
                   </div>
                   <button 
                        onClick={handleCheckout}
                        className="w-full bg-primary text-white py-3 px-8 rounded-md shadow-lg hover:bg-blue-800 transition-colors text-base font-bold"
                    >
                        إتمام البيع
                    </button>
                </footer>
            )}
        
        </div>
    );
};

export default SalesPOSPage;
