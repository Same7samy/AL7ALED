import React, { useState } from 'react';
import { CustomFieldDef, FieldType } from '../types.ts';

interface AppSettings {
  productCustomFields: CustomFieldDef[];
}

interface CustomFieldsSettingsPageProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const CustomFieldsSettingsPage: React.FC<CustomFieldsSettingsPageProps> = ({ settings, onSave }) => {
    const [fields, setFields] = useState<CustomFieldDef[]>(settings.productCustomFields);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState<FieldType>('text');

    const handleAddField = () => {
        if (newFieldName.trim()) {
            const newField: CustomFieldDef = {
                id: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
                name: newFieldName.trim(),
                type: newFieldType,
            };
            // Check for duplicate id
            if (!fields.some(f => f.id === newField.id)) {
                 const updatedFields = [...fields, newField];
                 setFields(updatedFields);
                 onSave({ productCustomFields: updatedFields });
                 setNewFieldName('');
            } else {
                // simple alert for now
                alert('اسم الحقل مستخدم بالفعل.');
            }
        }
    };
    
    const handleDeleteField = (id: string) => {
        const updatedFields = fields.filter(field => field.id !== id);
        setFields(updatedFields);
        onSave({ productCustomFields: updatedFields });
    };

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
                <h2 className="text-lg font-bold text-slate-800">إدارة الحقول المخصصة</h2>
                <div className="space-y-2">
                    {fields.map(field => (
                        <div key={field.id} className="bg-slate-50 p-2 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{field.name}</p>
                                <p className="text-xs text-slate-500">النوع: {field.type}</p>
                            </div>
                            <button onClick={() => handleDeleteField(field.id)} className="text-red-500 hover:text-red-700">
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    ))}
                    {fields.length === 0 && <p className="text-center text-slate-400 text-sm py-4">لا توجد حقول مخصصة.</p>}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
                 <h3 className="text-base font-bold text-slate-700">إضافة حقل جديد</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-[1fr,100px,auto] gap-2">
                    <input
                        type="text"
                        placeholder="اسم الحقل (مثال: بلد الصنع)"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        className="w-full p-2 text-sm border rounded-md"
                    />
                    <select
                        value={newFieldType}
                        onChange={e => setNewFieldType(e.target.value as FieldType)}
                        className="w-full p-2 text-sm border rounded-md"
                    >
                        <option value="text">نص</option>
                        <option value="number">رقم</option>
                        <option value="date">تاريخ</option>
                    </select>
                     <button
                        onClick={handleAddField}
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold"
                    >
                        إضافة
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default CustomFieldsSettingsPage;