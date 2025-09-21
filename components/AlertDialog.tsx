import React from 'react';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            aria-labelledby="alert-dialog-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
                <div className="p-5">
                    <h2 id="alert-dialog-title" className="text-lg font-bold text-slate-800">{title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{message}</p>
                </div>
                <div className="bg-slate-50 px-5 py-3 flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        حسناً
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertDialog;
