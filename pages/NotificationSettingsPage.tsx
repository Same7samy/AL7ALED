import React, { useState } from 'react';

interface AppSettings {
  lowStockThreshold: number;
  expiryWarningDays: number;
  customerDebtLimit: number;
}

interface NotificationSettingsPageProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const FormField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex justify-between items-center border-b pb-3">
        <div>
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
        {children}
    </div>
);

const NotificationSettingsPage: React.FC<NotificationSettingsPageProps> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) }));
    };

    const handleSave = () => {
        onSave(formState);
    };

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                 <h2 className="text-lg font-bold text-slate-800">إعدادات الإشعارات والتنبيهات</h2>
                 <FormField
                    label="حد المخزون المنخفض"
                    description="تنبيه عندما تصل كمية المنتج إلى هذا الحد."
                 >
                    <input
                        type="number"
                        name="lowStockThreshold"
                        value={formState.lowStockThreshold || ''}
                        onChange={handleChange}
                        className="w-24 p-2 text-sm border rounded-md text-center"
                    />
                 </FormField>
                  <FormField
                    label="تنبيه انتهاء الصلاحية (بالأيام)"
                    description="تنبيه قبل انتهاء صلاحية المنتج بهذه المدة."
                 >
                    <input
                        type="number"
                        name="expiryWarningDays"
                        value={formState.expiryWarningDays || ''}
                        onChange={handleChange}
                        className="w-24 p-2 text-sm border rounded-md text-center"
                    />
                 </FormField>
                  <FormField
                    label="حد ديون العملاء (ج.م)"
                    description="تنبيه عندما يتجاوز دين العميل هذا المبلغ."
                 >
                    <input
                        type="number"
                        name="customerDebtLimit"
                        value={formState.customerDebtLimit || ''}
                        onChange={handleChange}
                        className="w-24 p-2 text-sm border rounded-md text-center"
                    />
                 </FormField>
            </div>
             <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-primary text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;
