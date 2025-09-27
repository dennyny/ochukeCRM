import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import KpiCard from './KpiCard';
import DateRangePicker from './DateRangePicker';
import { downloadCsv } from '../../lib/csv';
import { Users, ShoppingCart, FileText, DollarSign } from 'lucide-react';

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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, startDate, endDate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [customers, orders, invoices, transactions] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', user.id).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('orders').select('*').eq('user_id', user.id).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('invoices').select('*').eq('user_id', user.id).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('financial_transactions').select('*').eq('user_id', user.id).gte('transaction_date', startDate.toISOString()).lte('transaction_date', endDate.toISOString()),
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

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setStartDate(startDate);
    setEndDate(endDate);
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
      };
    }

    const totalRevenue = data.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = data.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return {
      totalCustomers: data.customers.length,
      totalOrders: data.orders.length,
      totalRevenue,
      totalExpenses,
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Total Customers" value={kpis.totalCustomers} icon={<Users />} />
        <KpiCard title="Total Orders" value={kpis.totalOrders} icon={<ShoppingCart />} />
        <KpiCard title="Total Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} icon={<DollarSign />} />
        <KpiCard title="Total Expenses" value={`$${kpis.totalExpenses.toFixed(2)}`} icon={<DollarSign />} />
      </div>

      <div className="mb-6">
        <DateRangePicker onChange={handleDateRangeChange} />
      </div>

      {/* You can add tables here to display the data */}
    </div>
  );
}