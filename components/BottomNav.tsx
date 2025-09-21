
import React from 'react';
import { Page } from '../types.ts';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
  <li>
    <a
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-2 w-24 h-24 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-white/20 text-white font-bold' 
          : 'text-blue-100 hover:bg-white/10'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </a>
  </li>
);

interface SideNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const handleNavClick = (page: Page) => {
    setActivePage(page);
    setIsOpen(false);
  };
  
  const mainPages: { page: Page; label: string; icon: React.ReactNode; }[] = [
    { page: 'dashboard', label: 'الرئيسية', icon: <i className="fa-solid fa-house"></i> },
    { page: 'products', label: 'المنتجات', icon: <i className="fa-solid fa-cubes"></i> },
    { page: 'pos', label: 'نقطة البيع', icon: <i className="fa-solid fa-cash-register"></i> },
    { page: 'invoices', label: 'الفواتير', icon: <i className="fa-solid fa-file-invoice"></i> },
    { page: 'customers', label: 'العملاء', icon: <i className="fa-solid fa-users"></i> },
    { page: 'suppliers', label: 'الموردين', icon: <i className="fa-solid fa-building"></i> },
    { page: 'reports', label: 'التقارير', icon: <i className="fa-solid fa-chart-pie"></i> },
    { page: 'expenses', label: 'المصروفات', icon: <i className="fa-solid fa-wallet"></i> },
    { page: 'offers', label: 'العروض', icon: <i className="fa-solid fa-tags"></i> },
    { page: 'settings', label: 'الإعدادات', icon: <i className="fa-solid fa-gear"></i> },
  ];

  return (
    <div 
      className={`fixed inset-0 bg-primary z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="القائمة الرئيسية"
    >
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white text-3xl p-2" aria-label="إغلاق القائمة">
            <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="flex flex-col items-center justify-center h-full text-white">
            <h2 className="text-3xl font-bold mb-8">الخالد</h2>
            <nav>
                <ul className="grid grid-cols-3 gap-3">
                    {mainPages.map(({ page, label, icon }) => (
                        <NavItem 
                            key={page}
                            label={label} 
                            icon={icon} 
                            isActive={activePage === page} 
                            onClick={() => handleNavClick(page)} 
                        />
                    ))}
                </ul>
            </nav>
        </div>
    </div>
  );
};

export default SideNav;