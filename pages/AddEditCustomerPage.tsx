
import React, { useState, useEffect } from 'react';
import { Customer } from '../types.ts';

interface AddEditCustomerPageProps {
    onSave: (customerData: Omit<Customer, 'id'>, id?: number) => void;
    onCancel: () => void;
    customerToEdit?: Customer;
}

const AddEditCustomerPage: React.FC<AddEditCustomerPageProps> = ({ onSave, onCancel, customerToEdit }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (customerToEdit) {
            setName(customerToEdit.name);
            setPhone(customerToEdit.phone || '');
            setAddress(customerToEdit.address || '');
        }
    }, [customerToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name, phone, address }, customerToEdit?.id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-md max-w-lg mx-auto">
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-slate-700">اسم العميل</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full p-2 text-sm border rounded-md focus:ring-primary focus:border-primary"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">رقم الهاتف (اختياري)</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full p-2 text-sm border rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
                 <div>
                    <label className="text-sm font-medium text-slate-700">العنوان (اختياري)</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 w-full p-2 text-sm border rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
            <div className="flex gap-2 justify-end pt-3 border-t">
                <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold">إلغاء</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold">حفظ</button>
            </div>
        </form>
    );
};

export default AddEditCustomerPage;