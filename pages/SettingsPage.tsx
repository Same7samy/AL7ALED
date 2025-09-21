
import React, { useRef } from 'react';
import { Page } from '../types.ts';

interface SettingsPageProps {
  setActivePage: (page: Page) => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsCard: React.FC<{ icon: string; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
    <div onClick={onClick} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between text-right group cursor-pointer hover:shadow-lg hover:border-primary border border-transparent transition-all duration-200">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <i className={`fa-solid ${icon} fa-lg`}></i>
            </div>
            <div>
                <h2 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">{title}</h2>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
        </div>
        <i className="fa-solid fa-chevron-left text-slate-400 group-hover:text-primary transition-colors"></i>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ setActivePage, onExportData, onImportData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onImportData}
                className="hidden"
                accept=".json"
            />
            <SettingsCard
                icon="fa-bell"
                title="إعدادات الإشعارات"
                description="تحكم في تنبيهات المخزون، الصلاحية، وحدود الديون"
                onClick={() => setActivePage('notificationSettings')}
            />
             <SettingsCard
                icon="fa-list-check"
                title="الحقول المخصصة للمنتجات"
                description="أضف أو أزل حقولاً إضافية لمنتجاتك"
                onClick={() => setActivePage('customFieldsSettings')}
            />
            <div className="border-t pt-4 space-y-4">
                 <SettingsCard
                    icon="fa-file-export"
                    title="تصدير البيانات"
                    description="حفظ نسخة احتياطية من جميع بيانات التطبيق"
                    onClick={onExportData}
                />
                 <SettingsCard
                    icon="fa-file-import"
                    title="استيراد البيانات"
                    description="استعادة البيانات (سيتم استبدال البيانات الحالية)"
                    onClick={() => fileInputRef.current?.click()}
                />
            </div>
        </div>
    );
};

export default SettingsPage;