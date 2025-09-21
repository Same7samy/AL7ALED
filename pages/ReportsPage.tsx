
import React, { useState, useMemo } from 'react';
import { Invoice, Product, Expense, Customer } from '../types';
import DateRangePicker, { DateRange } from '../components/DateRangePicker';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import DashboardCard from '../components/DashboardCard';

interface ReportsPageProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  customers: Customer[];
}

// Function to format date to YYYY-MM-DD for grouping
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const ReportsPage: React.FC<ReportsPageProps> = ({ invoices, products, expenses, customers }) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  const filteredData = useMemo(() => {
    const { start, end } = dateRange;
    if (!start || !end) return { filteredInvoices: [], filteredExpenses: [] };

    const filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= start && invDate <= end;
    });

    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      // Adjusting expense date to be comparable
      const adjustedExpDate = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
      return adjustedExpDate >= start && adjustedExpDate <= end;
    });
    
    return { filteredInvoices, filteredExpenses };
  }, [invoices, expenses, dateRange]);

  const reportStats = useMemo(() => {
    const { filteredInvoices, filteredExpenses } = filteredData;
    
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalDiscounts = filteredInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0) + (inv.manualDiscountAmount || 0), 0);
    
    const grossProfit = filteredInvoices.reduce((profitSum, inv) => {
      const invoiceProfit = inv.items.reduce((itemSum, item) => {
        return itemSum + (item.price - item.purchasePrice) * item.quantity;
      }, 0);
      return profitSum + invoiceProfit;
    }, 0);

    const netProfit = grossProfit - totalExpenses - totalDiscounts;

    // Top Products
    const productSales = new Map<number, { name: string; quantity: number; total: number }>();
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const existing = productSales.get(item.id);
        const saleAmount = item.price * item.quantity;
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += saleAmount;
        } else {
          productSales.set(item.id, { name: item.name, quantity: item.quantity, total: saleAmount });
        }
      });
    });
    const topProducts = [...productSales.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5);

    // Top Customers
    const customerSales = new Map<number, { name: string; total: number }>();
    filteredInvoices.forEach(inv => {
      if (inv.customerId) {
        const customer = customers.find(c => c.id === inv.customerId);
        if (customer) {
          const existing = customerSales.get(customer.id);
          if (existing) {
            existing.total += inv.total;
          } else {
            customerSales.set(customer.id, { name: customer.name, total: inv.total });
          }
        }
      }
    });
    const topCustomers = [...customerSales.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5);
    
    // Chart Data
    const salesByDay = new Map<string, number>();
    let currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
        salesByDay.set(formatDate(currentDate), 0);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    filteredInvoices.forEach(inv => {
        const day = formatDate(new Date(inv.date));
        salesByDay.set(day, (salesByDay.get(day) || 0) + inv.total);
    });

    const chartData = Array.from(salesByDay.entries()).map(([date, sales]) => ({
      name: new Date(date).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' }),
      sales
    }));

    return { totalSales, totalProfit: grossProfit, totalExpenses, netProfit, topProducts, topCustomers, chartData };
  }, [filteredData, customers, dateRange]);

  return (
    <div className="space-y-4">
      <DateRangePicker onChange={setDateRange} />

      <div className="grid grid-cols-2 gap-3">
        <DashboardCard title="إجمالي المبيعات" value={`${reportStats.totalSales.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-dollar-sign text-white"></i>} color="bg-primary" />
        <DashboardCard title="إجمالي الأرباح" value={`${reportStats.totalProfit.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-hand-holding-dollar text-white"></i>} color="bg-green-500" />
        <DashboardCard title="إجمالي المصروفات" value={`${reportStats.totalExpenses.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-arrow-down text-white"></i>} color="bg-red-500" />
        <DashboardCard title="صافي الربح" value={`${reportStats.netProfit.toFixed(2)} ج.م`} icon={<i className="fa-solid fa-sack-dollar text-white"></i>} color="bg-indigo-500" />
      </div>

       <div className="bg-white p-3 rounded-lg shadow-md">
        <h2 className="text-base font-bold mb-3 text-slate-700">أداء المبيعات</h2>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={reportStats.chartData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-md">
            <h2 className="text-base font-bold mb-3 text-slate-700">أفضل المنتجات مبيعاً</h2>
            <div className="space-y-2">
                {reportStats.topProducts.length > 0 ? reportStats.topProducts.map(([id, data]) => (
                    <div key={id} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                        <p className="font-semibold">{data.name} <span className="text-xs text-slate-400">({data.quantity})</span></p>
                        <p className="font-bold text-primary">{data.total.toFixed(2)} ج.م</p>
                    </div>
                )) : <p className="text-sm text-slate-500 text-center py-4">لا توجد بيانات.</p>}
            </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-md">
            <h2 className="text-base font-bold mb-3 text-slate-700">أهم العملاء</h2>
            <div className="space-y-2">
                {reportStats.topCustomers.length > 0 ? reportStats.topCustomers.map(([id, data]) => (
                    <div key={id} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                        <p className="font-semibold">{data.name}</p>
                        <p className="font-bold text-primary">{data.total.toFixed(2)} ج.م</p>
                    </div>
                 )) : <p className="text-sm text-slate-500 text-center py-4">لا توجد بيانات.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;