import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Order {
  id: string
  customer_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  order_date: string
  notes: string | null
}

interface Customer {
  id: string;
  name: string;
}

interface OrderFormProps {
  order: Order | null
  onClose: () => void
  onSuccess: () => void
}

export default function OrderForm({ order, onClose, onSuccess }: OrderFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: order?.customer_id || '',
    total_amount: order?.total_amount || 0,
    status: order?.status || 'pending',
    order_date: order?.order_date || new Date().toISOString().split('T')[0],
    notes: order?.notes || ''
  })
  // Order item state
  const [orderItem, setOrderItem] = useState('');
  const [customOrderItem, setCustomOrderItem] = useState('');

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('user_id', user!.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Helper to generate order ID: Day_time_dayofweek_and 3 random numbers
  const generateOrderId = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'short' });
    const random = Math.floor(100 + Math.random() * 900); // 3 random numbers
    return `${day}_${time}_${dayOfWeek}_${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (order) {
        // Update existing order
        const { error } = await supabase
          .from('orders')
          .update(formData)
          .eq('id', order.id)

        if (error) throw error
      } else {
        // Create new order
        const customOrderId = generateOrderId();
        const { data, error } = await supabase
          .from('orders')
          .insert({
            ...formData,
            custom_order_id: customOrderId,
            user_id: user!.id
          })
          .select('id');

        if (error) throw error;
        const newOrderId = data && data[0]?.id;
        // Insert order item if provided
        const itemName = orderItem === 'custom' ? customOrderItem : orderItem;
        if (newOrderId && itemName) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: newOrderId,
              item_name: itemName,
              quantity: 1,
              unit_price: formData.total_amount,
              total_price: formData.total_amount
            });
          if (itemError) throw itemError;
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Error saving order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOrderItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderItem(e.target.value);
    if (e.target.value !== 'custom') setCustomOrderItem('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {order ? 'Edit Order' : 'Add Order'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Item Selection */}
          <div>
            <label htmlFor="order_item" className="block text-sm font-medium text-gray-700 mb-1">
              Order Item *
            </label>
            <select
              id="order_item"
              name="order_item"
              value={orderItem}
              onChange={handleOrderItemChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              required
            >
              <option value="" disabled>Select an item</option>
              <option value="Shirt">Shirt</option>
              <option value="Suits">Suits</option>
              <option value="Dress">Dress</option>
              <option value="Shoes">Shoes</option>
              <option value="custom">Other (type below)</option>
            </select>
            {orderItem === 'custom' && (
              <input
                type="text"
                placeholder="Type item name"
                value={customOrderItem}
                onChange={e => setCustomOrderItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="" disabled>Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount *
            </label>
            <input
              type="number"
              id="total_amount"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 mb-1">
              Order Date *
            </label>
            <input
              type="date"
              id="order_date"
              name="order_date"
              value={formData.order_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (order ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
