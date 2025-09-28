import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  FileText,
  Calendar,
  MoreVertical
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  totalCustomers: number
  totalOrders: number
  totalInvoices: number
  prevRevenue?: number
  prevExpenses?: number
  prevCustomers?: number
  prevOrders?: number
}

interface RecentActivity {
  id: string
  type: 'order' | 'invoice' | 'customer' | 'payment'
  title: string
  description: string
  amount?: number
  date: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalInvoices: 0,
    prevRevenue: undefined,
    prevExpenses: undefined,
    prevCustomers: undefined,
    prevOrders: undefined,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Date ranges for this month and last month
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Fetch current month
      const [{ count: customersCount }, { data: orders, count: ordersCount }, { count: invoicesCount }, { data: transactions }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString()),
        supabase.from('orders').select('total_amount', { count: 'exact' }).eq('user_id', user!.id).gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString()),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString()),
        supabase.from('financial_transactions').select('type, amount, created_at').eq('user_id', user!.id).gte('created_at', startOfThisMonth.toISOString()).lte('created_at', endOfThisMonth.toISOString()),
      ]);

      // Fetch previous month
      const [{ count: prevCustomers }, { count: prevOrders }, { data: prevTransactions }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', user!.id).gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString()),
        supabase.from('financial_transactions').select('type, amount, created_at').eq('user_id', user!.id).gte('created_at', startOfLastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString()),
      ]);

      // Calculate stats
      const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const prevRevenue = prevTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || undefined;
      const prevExpenses = prevTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || undefined;

      // Get recent activity (still from all time)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          id, total_amount, created_at, status,
          customers(name)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const activity: RecentActivity[] = recentOrders?.map(order => ({
        id: order.id,
        type: 'order' as const,
        title: `New order from ${(order.customers as any)?.name || 'Customer'}`,
        description: `Order #${order.id.slice(-8)} - ${order.status}`,
        amount: order.total_amount,
        date: order.created_at
      })) || [];

      setStats({
        totalRevenue,
        totalExpenses,
        totalCustomers: customersCount || 0,
        totalOrders: ordersCount || 0,
        totalInvoices: invoicesCount || 0,
        prevRevenue,
        prevExpenses,
        prevCustomers: prevCustomers || undefined,
        prevOrders: prevOrders || undefined,
      });

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      icon: () => <span className="text-2xl font-bold">₦</span>,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      prev: stats.prevRevenue,
    },
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      prev: stats.prevExpenses,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      prev: stats.prevCustomers,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      prev: stats.prevOrders,
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar size={20} />
            <span>This Month</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          // Calculate growth only if previous data exists and is not zero
          let growth: number | null = null;
          if (typeof stat.prev === 'number' && stat.prev !== 0) {
            growth = ((stat.value - stat.prev) / stat.prev) * 100;
          }
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {typeof stat.value === 'number' && (stat.title.includes('Revenue') || stat.title.includes('Expenses'))
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()
                  }
                </p>
                <p className="text-sm text-gray-600">{stat.title}</p>
                {growth !== null ? (
                  <div className="flex items-center gap-1">
                    {growth > 0 ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(growth).toFixed(1)}%</span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                ) : (
                  <div className="h-5"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <ShoppingCart size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="font-medium text-gray-900">{formatCurrency(activity.amount)}</p>
                    )}
                    <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Profit Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Profit Overview</h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue - stats.totalExpenses)}
            </p>
            <p className="text-sm text-gray-500">Net Profit</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Revenue</span>
              <span className="text-sm font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.totalRevenue + stats.totalExpenses > 0 
                    ? (stats.totalRevenue / (stats.totalRevenue + stats.totalExpenses)) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Expenses</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.totalRevenue + stats.totalExpenses > 0 
                    ? (stats.totalExpenses / (stats.totalRevenue + stats.totalExpenses)) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}