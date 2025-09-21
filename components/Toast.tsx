
import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onClose, 300); // Wait for fade out animation to finish
        }, 2700); // Start fade out before removing

        return () => clearTimeout(timer);
    }, [onClose]);
    
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    return (
        <div 
            className={`
                flex items-center gap-3 w-full max-w-sm p-3 rounded-lg shadow-lg text-white pointer-events-auto
                transition-all duration-300 ease-in-out transform
                ${isFadingOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
                ${bgColor}
            `}
            role="alert"
        >
            <i className={`fa-solid ${icon}`}></i>
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};

export default Toast;
