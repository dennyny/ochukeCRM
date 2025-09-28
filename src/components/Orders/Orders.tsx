import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, ShoppingCart } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import OrderForm from './OrderForm'

interface Order {
  id: string
  custom_order_id?: string
  customer_id: string
  customer_name?: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  order_date: string
  notes: string | null
  created_at: string
  user_id: string
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (user) {
      fetchOrders()
    } else {
      setLoading(false);
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, custom_order_id, customer_id, total_amount, status, order_date, notes, created_at, user_id, customers(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Map customer name from join
      const ordersWithCustomer = (data || []).map((order: any) => ({
        ...order,
        customer_name: order.customers?.name || ''
      }))
      setOrders(ordersWithCustomer)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) throw error
      setOrders(orders.filter(o => o.id !== id))
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  const filteredOrders = orders.filter(order =>
    (order.custom_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your orders</p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Order
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{order.custom_order_id || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{order.customer_name || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{order.total_amount}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{order.status}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingOrder(order)
                            setShowForm(true)
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No orders match your search criteria.' : 'Get started by adding your first order.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingOrder(null)
                  setShowForm(true)
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Order
              </button>
            )}
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm
          order={editingOrder}
          onClose={() => {
            setShowForm(false)
            setEditingOrder(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingOrder(null)
            fetchOrders()
          }}
        />
      )}
    </div>
  )
}