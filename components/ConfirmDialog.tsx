
import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'red' | 'sky';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, confirmColor = 'sky' }) => {
    if (!isOpen) return null;

    const confirmButtonColorClasses = confirmColor === 'red' 
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
        : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            aria-labelledby="confirm-dialog-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
                <div className="p-5">
                    <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-800">{title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{message}</p>
                </div>
                <div className="bg-slate-50 px-5 py-3 flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    >
                        {cancelText || 'إلغاء'}
                    </button>
                     <button 
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonColorClasses}`}
                    >
                        {confirmText || 'تأكيد'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;