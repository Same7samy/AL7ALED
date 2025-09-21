
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import DashboardCard from '../components/DashboardCard';
import { SalesData, Product, Invoice, Page } from '../types';

interface DashboardPageProps {
  products: Product[];
  invoices: Invoice[];
  setActivePage: (page: Page) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ products, invoices, setActivePage }) => {
  const dashboardData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === today.getTime();
    });

    const dailySales = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const dailyProfit = todaysInvoices.reduce((profitSum, inv) => {
      const invoiceProfit = inv.items.reduce((itemSum, item) => {
        return itemSum + (item.price - item.purchasePrice) * item.quantity;
      }, 0);
      return profitSum + invoiceProfit;
    }, 0);

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    const salesByProduct = new Map<number, { id: number; name: string; category: string; imageUrl: string; price: number, purchasePrice: number, stock: number, barcode: string, quantity: number }>();
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const existing = salesByProduct.get(item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          salesByProduct.set(item.id, { 
            id: item.id,
            name: item.name, 
            category: item.category,
            imageUrl: item.imageUrl,
            price: item.price,
            purchasePrice: item.purchasePrice,
            stock: item.stock,
            barcode: item.barcode,
            quantity: item.quantity 
          });
        }
      });
    });

    const bestSellingProducts = [...salesByProduct.values()].sort((a, b) => b.quantity - a.quantity);
    const bestSeller = bestSellingProducts[0] ? bestSellingProducts[0].name : 'لا يوجد';
    
    const weekSalesData: SalesData[] = [];
    const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayName = daysOfWeek[date.getDay()];
        
        const salesForDay = invoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                invDate.setHours(0, 0, 0, 0);
                return invDate.getTime() === date.getTime();
            })
            .reduce((sum, inv) => sum + inv.total, 0);
            
        weekSalesData.push({ name: dayName, sales: salesForDay });
    }

    return {
      dailySales,
      dailyProfit,
      totalStock,
      bestSeller,
      bestSellingProducts: bestSellingProducts.slice(0, 3),
      weekSalesData
    };
  }, [products, invoices]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DashboardCard title="المبيعات اليومية" value={`${dashboardData.dailySales.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-dollar-sign text-white"></i>} color="bg-primary" />
        <DashboardCard title="الأرباح اليومية" value={`${dashboardData.dailyProfit.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-hand-holding-dollar text-white"></i>} color="bg-green-500" />
        <DashboardCard title="المخزون الحالي" value={`${dashboardData.totalStock} قطعة`} icon={<i className="fa-solid fa-box-archive text-white"></i>} color="bg-amber-500" />
        <DashboardCard title="الأكثر مبيعاً" value={dashboardData.bestSeller} icon={<i className="fa-solid fa-star text-white"></i>} color="bg-rose-500" />
      </div>

      <div className="bg-white p-3 rounded-lg shadow-md">
        <h2 className="text-base font-bold mb-3 text-slate-700">مبيعات الأسبوع</h2>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={dashboardData.weekSalesData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '0.5rem', fontFamily: 'Cairo' }}
                cursor={{ fill: 'rgba(0, 110, 255, 0.1)' }}
                formatter={(value: number) => `${value.toFixed(2)} ج.م`}
              />
              <Bar dataKey="sales" fill="#006eff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-3 rounded-lg shadow-md">
        <h2 className="text-base font-bold mb-3 text-slate-700">المنتجات الأكثر مبيعاً هذا الأسبوع</h2>
        <div className="space-y-2">
          {dashboardData.bestSellingProducts.length > 0 ? dashboardData.bestSellingProducts.map(product => (
            <div key={product.id} className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 rounded-md flex-shrink-0">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full rounded-md object-cover" />
                ) : (
                    <div className="w-full h-full rounded-md bg-slate-200 flex items-center justify-center">
                        <i className="fa-solid fa-box-open text-slate-400 text-xl"></i>
                    </div>
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-xs text-slate-500">{product.category}</p>
              </div>
              <div>
                <p className="font-bold text-primary">{product.price.toFixed(2)} ج.م</p>
                <p className="text-xs text-slate-500 text-left">بيع: {product.quantity}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-500 text-center py-4">لا توجد مبيعات لعرضها.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
