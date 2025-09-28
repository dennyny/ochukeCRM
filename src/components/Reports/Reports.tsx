import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import KpiCard from './KpiCard';
import ReportFilter, { ReportFilterState } from './ReportFilter';
import { downloadCsv } from '../../lib/csv';
import { Users, ShoppingCart, FileText, DollarSign } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

interface ReportData {
  customers: any[];
  orders: any[];
  invoices: any[];
  transactions: any[];
}

export default function Reports() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  // Filter state: startDate, endDate, extensible for more
  const [filters, setFilters] = useState<ReportFilterState>({
    startDate: new Date('2000-01-01T00:00:00Z'),
    endDate: new Date(),
  });


  useEffect(() => {
    if (
      user &&
      filters.startDate &&
      filters.endDate &&
      filters.startDate <= filters.endDate
    ) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    // Ensure full day range
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    try {
      const [customers, orders, invoices, transactions] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
        supabase.from('orders').select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
        supabase.from('invoices').select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
        supabase.from('financial_transactions').select('*').eq('user_id', user.id).gte('transaction_date', start.toISOString()).lte('transaction_date', end.toISOString()),
      ]);

      setData({
        customers: customers.data || [],
        orders: orders.data || [],
        invoices: invoices.data || [],
        transactions: transactions.data || [],
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes from ReportFilter
  const handleFilterChange = (newFilters: ReportFilterState) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    if (data) {
      downloadCsv(data.customers, 'customers.csv');
      downloadCsv(data.orders, 'orders.csv');
      downloadCsv(data.invoices, 'invoices.csv');
      downloadCsv(data.transactions, 'transactions.csv');
    }
  };

  const calculateKpis = () => {
    if (!data) {
      return {
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
      };
    }

    const totalRevenue = data.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = data.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalProfit = totalRevenue - totalExpenses;

    return {
      totalCustomers: data.customers.length,
      totalOrders: data.orders.length,
      totalRevenue,
      totalExpenses,
      totalProfit,
    };
  };

  const kpis = calculateKpis();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Pie chart data for expense categories
  const expenseCategories = (data?.transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const pieData = {
    labels: Object.keys(expenseCategories),
    datasets: [{
      data: Object.values(expenseCategories),
      backgroundColor: [
        '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#facc15', '#38bdf8'
      ],
    }],
  };

  // Column chart data for most sold order items
  const itemSales: Record<string, number> = {};
  (data?.orders || []).forEach(order => {
    if (order.items) {
      order.items.forEach((item: any) => {
        itemSales[item.name] = (itemSales[item.name] || 0) + (item.quantity || 1);
      });
    }
  });
  const barData = {
    labels: Object.keys(itemSales),
    datasets: [{
      label: 'Quantity Sold',
      data: Object.values(itemSales),
      backgroundColor: '#60a5fa',
    }],
  };

  const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Key metrics and data at a glance</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <KpiCard title="Total Customers" value={kpis.totalCustomers} icon={<Users />} />
        <KpiCard title="Total Orders" value={kpis.totalOrders} icon={<ShoppingCart />} />
        <KpiCard title="Total Revenue" value={formatNaira(kpis.totalRevenue)} icon={<DollarSign />} />
        <KpiCard title="Total Expenses" value={formatNaira(kpis.totalExpenses)} icon={<DollarSign />} />
        <KpiCard title="Total Profit" value={formatNaira(kpis.totalProfit)} icon={<DollarSign />} />
      </div>

      <div className="mb-6">
        <ReportFilter onChange={handleFilterChange} initialFilters={filters} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
          <Pie data={pieData} />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Most Sold Order Items</h2>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
}