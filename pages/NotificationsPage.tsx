
import React from 'react';
import { Notification, Page } from '../types';

interface NotificationsPageProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    setActivePage: (page: Page) => void;
    setSelectedProductId: (id: number | null) => void;
    setSelectedCustomerId: (id: number | null) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, setNotifications, setActivePage, setSelectedProductId, setSelectedCustomerId }) => {

    React.useEffect(() => {
        // Mark all as read when the page is viewed
        const timer = setTimeout(() => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }, 1500);
        return () => clearTimeout(timer);
    }, [setNotifications]);

    const handleNotificationClick = (notification: Notification) => {
        if (notification.type === 'low_stock' || notification.type === 'expiry_soon') {
            if (notification.productId) {
                setSelectedProductId(notification.productId);
                setActivePage('productDetail');
            }
        } else if (notification.type === 'debt_limit') {
            if (notification.customerId) {
                setSelectedCustomerId(notification.customerId);
                setActivePage('customerDetail');
            }
        }
    };
    
    const getNotificationDetails = (notification: Notification) => {
        switch(notification.type) {
            case 'low_stock':
                return { icon: 'fa-triangle-exclamation', color: 'bg-red-100 text-red-600', title: 'تنبيه: مخزون منخفض' };
            case 'expiry_soon':
                return { icon: 'fa-clock', color: 'bg-amber-100 text-amber-600', title: 'تنبيه: انتهاء صلاحية قريب' };
            case 'debt_limit':
                return { icon: 'fa-file-invoice-dollar', color: 'bg-orange-100 text-orange-600', title: 'تنبيه: تجاوز حد الدين' };
            default:
                return { icon: 'fa-bell', color: 'bg-slate-100 text-slate-600', title: 'إشعار' };
        }
    }


    return (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">مركز الإشعارات</h2>
            {notifications.length === 0 ? (
                <div className="text-center py-10">
                    <div className="text-6xl mb-4 text-sky-200">
                        <i className="fa-solid fa-check-circle fa-2x"></i>
                    </div>
                    <p className="text-slate-500">لا توجد إشعارات جديدة. كل شيء على ما يرام!</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {notifications.map(notification => {
                        const details = getNotificationDetails(notification);
                        return (
                            <li 
                                key={notification.id} 
                                className="p-3 cursor-pointer hover:bg-slate-50 rounded-md transition-colors"
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${details.color}`}>
                                        <i className={`fa-solid ${details.icon}`}></i>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {details.title}
                                        </p>
                                        <p className="text-sm text-slate-600">{notification.message}</p>
                                    </div>
                                    {!notification.read && (
                                        <span className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" aria-label="إشعار غير مقروء"></span>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
};

export default NotificationsPage;
