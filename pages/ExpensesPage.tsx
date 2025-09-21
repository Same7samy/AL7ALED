
import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from '../types';
import DateRangePicker, { DateRange } from '../components/DateRangePicker';

interface ExpensesPageProps {
  expenses: Expense[];
  onSave: (data: Omit<Expense, 'id'>, id?: number) => void;
  onDelete: (id: number) => void;
  showConfirmDialog: (dialog: { title: string; message: string; onConfirm: () => void; confirmText?: string; cancelText?: string; confirmColor?: 'red' | 'sky'; }) => void;
}

const ExpenseFormModal: React.FC<{
    expenseToEdit: Expense | null;
    onSave: (expense: Omit<Expense, 'id'>) => void;
    onClose: () => void;
}> = ({ expenseToEdit, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '' as number | '',
        category: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (expenseToEdit) {
            const expenseDate = new Date(expenseToEdit.date);
            const formattedDate = !isNaN(expenseDate.getTime()) ? expenseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

            setFormData({
                description: expenseToEdit.description,
                amount: expenseToEdit.amount,
                category: expenseToEdit.category,
                date: formattedDate,
            });
        }
    }, [expenseToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.description && Number(formData.amount) > 0 && formData.category && formData.date) {
            onSave({
                description: formData.description,
                amount: Number(formData.amount),
                category: formData.category,
                date: formData.date,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">{expenseToEdit ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h2>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-600">الوصف</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full p-2 mt-1 text-sm border rounded-md" placeholder="مثال: فاتورة كهرباء" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-slate-600">المبلغ</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-2 mt-1 text-sm border rounded-md" placeholder="0.00" required step="0.01"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600">التصنيف</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full p-2 mt-1 text-sm border rounded-md" placeholder="مثال: فواتير" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">التاريخ</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 mt-1 text-sm border rounded-md bg-white" required />
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


const ExpensesPage: React.FC<ExpensesPageProps> = ({ expenses, onSave, onDelete, showConfirmDialog }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    });

    const filteredExpenses = useMemo(() => {
        const { start, end } = dateRange;
        return expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                const adjustedExpDate = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
                
                const dateMatch = !start || (adjustedExpDate >= start && adjustedExpDate <= end);
                
                const searchMatch = searchTerm === '' ||
                    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exp.category.toLowerCase().includes(searchTerm.toLowerCase());
                
                return dateMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchTerm, dateRange]);

    const totalFilteredExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [filteredExpenses]);

    const handleSave = (data: Omit<Expense, 'id'>) => {
        onSave(data, expenseToEdit?.id);
        setIsFormOpen(false);
        setExpenseToEdit(null);
    };

    const handleEdit = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        showConfirmDialog({
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف مصروف "${expense.description}"؟`,
            onConfirm: () => {
                onDelete(id);
            },
            confirmText: 'حذف',
            confirmColor: 'red'
        });
    };

    return (
        <div className="space-y-3">
            {isFormOpen && (
                <ExpenseFormModal 
                    expenseToEdit={expenseToEdit}
                    onSave={handleSave}
                    onClose={() => { setIsFormOpen(false); setExpenseToEdit(null); }}
                />
            )}
            
            <div className="space-y-2">
                <input
                    type="text"
                    placeholder="ابحث بالوصف أو التصنيف..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm border rounded-md bg-white"
                />
                <DateRangePicker onChange={setDateRange} />
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-md flex justify-between items-center">
                <p className="font-semibold text-slate-600">إجمالي المصروفات (الفترة المحددة)</p>
                <p className="font-bold text-lg text-red-600">{totalFilteredExpenses.toFixed(2)} ج.م</p>
            </div>
            
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-700">قائمة المصروفات ({filteredExpenses.length})</h2>
                <button onClick={() => { setExpenseToEdit(null); setIsFormOpen(true); }} className="bg-primary text-white px-3 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-sm flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i> <span>إضافة مصروف</span>
                </button>
            </div>
            
            <div className="space-y-2">
                {filteredExpenses.map(exp => (
                    <div key={exp.id} className="bg-white p-3 rounded-lg shadow-md flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <i className="fa-solid fa-arrow-down"></i>
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-sm">{exp.description}</p>
                            <p className="text-xs text-slate-500">{exp.category} - {new Date(exp.date).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-base text-red-600">-{exp.amount.toFixed(2)} ج.م</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => handleEdit(exp)} className="p-1 text-slate-400 hover:text-primary text-xs"><i className="fa-solid fa-pen"></i></button>
                            <button onClick={() => handleDelete(exp.id)} className="p-1 text-slate-400 hover:text-red-600 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                ))}
                {filteredExpenses.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                       <i className="fa-solid fa-folder-open text-5xl"></i>
                       <p className="mt-4 font-semibold">لا توجد مصروفات</p>
                       <p className="text-sm">لم يتم العثور على مصروفات تطابق الفلتر الحالي.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensesPage;
