
import React, { useState } from 'react';
import { Product, Page, CustomFieldDef } from '../types';

interface ProductDetailPageProps {
    product: Product;
    setActivePage: (page: Page) => void;
    setSelectedProductId: (id: number | null) => void;
    onDelete: (ids: number[]) => void;
    customFieldDefs: CustomFieldDef[];
}

const DetailItem: React.FC<{ label: string; value: string | number | undefined; className?: string }> = ({ label, value, className }) => (
    (value || value === 0) ? (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-sm font-semibold ${className}`}>{value}</p>
        </div>
    ) : null
);

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, setActivePage, setSelectedProductId, onDelete, customFieldDefs }) => {
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    
    const handleEdit = () => {
        setSelectedProductId(product.id);
        setActivePage('editProduct');
    };
    
    const canOpenViewer = !!product.imageUrl;
    
    const customFieldsToDisplay = customFieldDefs
        .map(def => ({
            def,
            value: product.customFields?.[def.id]
        }))
        .filter(field => field.value);


    return (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
            {isImageViewerOpen && canOpenViewer && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setImageViewerOpen(false)}
                >
                    <button onClick={() => setImageViewerOpen(false)} className="absolute top-4 right-4 text-white text-2xl">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full rounded-lg" />
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <div 
                    className={`w-full sm:w-40 h-40 rounded-lg flex-shrink-0 ${canOpenViewer ? 'cursor-pointer' : ''}`}
                    onClick={() => canOpenViewer && setImageViewerOpen(true)}
                >
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full rounded-lg object-cover" />
                    ) : (
                        <div className="w-full h-full rounded-lg bg-slate-200 flex items-center justify-center">
                            <i className="fa-solid fa-box-open text-slate-400 text-5xl"></i>
                        </div>
                    )}
                </div>

                <div className="flex-grow">
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    <p className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{product.category}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                         <DetailItem label="سعر البيع" value={`${product.price} ج.م`} className="text-sky-600" />
                         <DetailItem label="سعر الشراء" value={`${product.purchasePrice} ج.م`} />
                         <DetailItem label="المخزون الحالي" value={product.stock} className={product.stock < 10 ? "text-red-600" : "text-slate-800"} />
                         <DetailItem label="تاريخ الإنتهاء" value={product.expiryDate} className="text-red-500" />
                         <DetailItem label="الباركود" value={product.barcode} />
                    </div>
                </div>
            </div>
            
            {customFieldsToDisplay.length > 0 && (
                <div className="border-t pt-3">
                    <h3 className="text-base font-bold mb-2">معلومات إضافية</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {customFieldsToDisplay.map(({ def, value }) => (
                            <DetailItem key={def.id} label={def.name} value={value} />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t">
                <button onClick={() => onDelete([product.id])} className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm flex items-center gap-2">
                    <i className="fa-solid fa-trash-can"></i> حذف
                </button>
                <button onClick={handleEdit} className="bg-sky-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
                    <i className="fa-solid fa-pen-to-square"></i> تعديل
                </button>
            </div>
        </div>
    );
};

export default ProductDetailPage;
