import React, { useState, useEffect } from 'react';
import { Product, CustomFieldDef } from '../types';

interface AddEditProductPageProps {
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
  productToEdit?: Product;
  productDataForCreation?: Partial<Omit<Product, 'id'>> | null;
  customFieldDefs: CustomFieldDef[];
  openScanner: (onScan: (barcode: string) => void) => void;
  openCamera: (onCapture: (dataUrl: string) => void) => void;
}

const initialState: Omit<Product, 'id'> = {
  name: '',
  category: '',
  price: 0,
  purchasePrice: 0,
  stock: 0,
  barcode: '',
  imageUrl: '',
  expiryDate: '',
  customFields: {},
};

// Helper component for consistent form fields
const FormField: React.FC<{ label: string; icon: string; children: React.ReactNode }> = ({ label, icon, children }) => (
    <div>
        <label className="flex items-center text-sm font-medium text-slate-600 mb-1">
            <i className={`fa-solid ${icon} w-4 text-center text-slate-400 ml-2`}></i>
            {label}
        </label>
        {children}
    </div>
);

const AddEditProductPage: React.FC<AddEditProductPageProps> = ({ onSave, onCancel, productToEdit, productDataForCreation, customFieldDefs, openScanner, openCamera }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  useEffect(() => {
    const initial = productDataForCreation ? { ...initialState, ...productDataForCreation } : initialState;
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        expiryDate: productToEdit.expiryDate ? productToEdit.expiryDate.split('T')[0] : '',
        customFields: productToEdit.customFields || {},
      });
      if(productToEdit.imageUrl) {
        setImagePreview(productToEdit.imageUrl);
      }
    } else {
      setFormData(initial);
      setImagePreview(null);
    }
  }, [productToEdit, productDataForCreation]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' && value !== '' ? parseFloat(value) : value }));
  };
  
  const handleCustomFieldChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, imageUrl: result }));
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCapture = (dataUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    setImagePreview(dataUrl);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      stock: Number(formData.stock) || 0,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3 pb-4">
        
        {/* Main Card */}
        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="relative group w-full sm:w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden text-center text-slate-400 transition-colors">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div>
                                <i className="fa-solid fa-image text-3xl"></i>
                                <span className="text-xs block mt-1">صورة المنتج</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <label htmlFor="image-upload" className="cursor-pointer p-2 rounded-full hover:bg-white/20" title="تحميل صورة">
                                <i className="fa-solid fa-upload fa-lg"></i>
                            </label>
                            <button type="button" onClick={() => openCamera(handlePhotoCapture)} className="cursor-pointer p-2 rounded-full hover:bg-white/20" title="التقاط صورة">
                                <i className="fa-solid fa-camera fa-lg"></i>
                            </button>
                        </div>
                    </div>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <div className="flex-grow w-full">
                    <FormField label="اسم المنتج" icon="fa-tag">
                        <input type="text" name="name" placeholder="مثال: مياه غازية" value={formData.name} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md" required />
                    </FormField>
                </div>
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                <FormField label="سعر البيع" icon="fa-dollar-sign">
                     <input type="number" name="price" placeholder="0.00" value={formData.price || ''} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md" step="0.01" required />
                </FormField>
                 <FormField label="سعر الشراء" icon="fa-money-bill-wave">
                    <input type="number" name="purchasePrice" placeholder="0.00" value={formData.purchasePrice || ''} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md" step="0.01" />
                </FormField>
                <FormField label="الكمية بالمخزون" icon="fa-boxes-stacked">
                    <input type="number" name="stock" placeholder="0" value={formData.stock || ''} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md" />
                </FormField>
                <FormField label="الباركود" icon="fa-barcode">
                    <div className="flex">
                        <input type="text" name="barcode" placeholder="امسح أو أدخل الباركود" value={formData.barcode} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-r-md" />
                        <button type="button" onClick={() => openScanner((barcode) => setFormData(prev => ({...prev, barcode})))} className="bg-slate-200 px-4 rounded-l-md border-t border-b border-l border-slate-300">
                            <i className="fa-solid fa-barcode"></i>
                        </button>
                    </div>
                </FormField>
                 <FormField label="التصنيف" icon="fa-folder-open">
                 <input type="text" name="category" placeholder="مثال: مشروبات" value={formData.category} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md" />
                </FormField>
                <FormField label="تاريخ الإنتهاء" icon="fa-calendar-times">
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full p-2.5 text-sm border rounded-md bg-white" />
                </FormField>
            </div>
             {customFieldDefs.length > 0 && <div className="border-t pt-4 grid grid-cols-2 gap-4">
                {customFieldDefs.map(field => (
                    <FormField key={field.id} label={field.name} icon="fa-plus-square">
                        <input
                            type={field.type}
                            value={formData.customFields?.[field.id] || ''}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full p-2.5 text-sm border rounded-md bg-white"
                        />
                    </FormField>
                ))}
            </div>}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-md text-sm font-semibold">إلغاء</button>
          <button type="submit" className="bg-sky-600 text-white px-6 py-2.5 rounded-md text-sm font-semibold">حفظ المنتج</button>
        </div>
      </form>
    </>
  );
};

export default AddEditProductPage;
