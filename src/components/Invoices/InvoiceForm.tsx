import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  due_date: string
}

interface Order {
  id: string;
  custom_order_id?: string;
  total_amount?: number;
  customer_id?: string;
  customers?: { name: string; custom_customer_id?: string };
}

interface InvoiceFormProps {
  invoice: Invoice | null
  onClose: () => void
  onSuccess: () => void
}

export default function InvoiceForm({ invoice, onClose, onSuccess }: InvoiceFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<{name: string, custom_customer_id?: string}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{name: string, custom_customer_id?: string} | null>(null);
  const [formData, setFormData] = useState({
    order_id: invoice?.order_id || '',
    invoice_number: invoice?.invoice_number || '',
    amount: invoice?.amount || 0,
    status: invoice?.status || 'draft',
    due_date: invoice?.due_date || new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Update customer suggestions as user types
  useEffect(() => {
    if (orderSearch.trim() === '') {
      setCustomerSuggestions([]);
      setSelectedCustomer(null);
      return;
    }
    // Get unique customer names from orders
    const uniqueCustomers: {[key: string]: {name: string, custom_customer_id?: string}} = {};
    orders.forEach(order => {
      if (order.customers?.name) {
        const key = order.customers.name + (order.customers.custom_customer_id || '');
        if (!uniqueCustomers[key] && order.customers.name.toLowerCase().includes(orderSearch.toLowerCase())) {
          uniqueCustomers[key] = {
            name: order.customers.name,
            custom_customer_id: order.customers.custom_customer_id
          };
        }
      }
    });
    setCustomerSuggestions(Object.values(uniqueCustomers));
  }, [orderSearch, orders]);

  // Auto-select order if search narrows to one order or customer is selected
  useEffect(() => {
    if (!invoice) {
      let filtered = orders;
      if (selectedCustomer) {
        filtered = orders.filter(order => order.customers?.name === selectedCustomer.name && order.customers?.custom_customer_id === selectedCustomer.custom_customer_id);
      } else if (orderSearch.trim() !== '') {
        filtered = orders.filter(order => {
          const name = order.customers?.name?.toLowerCase() || '';
          return name.includes(orderSearch.toLowerCase());
        });
      }
      if (filtered.length === 1 && formData.order_id !== filtered[0].id) {
        setFormData(prev => ({
          ...prev,
          order_id: filtered[0].id,
          amount: filtered[0].total_amount || 0
        }));
      }
    }
  }, [orderSearch, orders, selectedCustomer]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, custom_order_id, total_amount, customer_id, customers(name, custom_customer_id)')
        .eq('user_id', user!.id);

      if (error) throw error;
      // Fix: customers is returned as array, but we want a single object
      setOrders(
        (data || []).map(order => ({
          ...order,
          customers: Array.isArray(order.customers) ? order.customers[0] : order.customers
        }))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let invoiceId = invoice?.id;
      let paidNow = false;
      if (invoice) {
        // Update existing invoice
        const { data, error } = await supabase
          .from('invoices')
          .update(formData)
          .eq('id', invoice.id)
          .select('id, status');

        if (error) throw error;
        // If status changed to paid
        if (data && data[0]?.status === 'paid' && invoice.status !== 'paid') {
          paidNow = true;
        }
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            ...formData,
            user_id: user!.id
          })
          .select('id, status');

        if (error) throw error;
        invoiceId = data && data[0]?.id;
        if (data && data[0]?.status === 'paid') {
          paidNow = true;
        }
      }

      // If invoice is paid, add to finances
      if (paidNow && invoiceId) {
        await supabase.from('financial_transactions').insert({
          type: 'income',
          amount: formData.amount,
          category: 'Invoice Payment',
          description: `Invoice ${formData.invoice_number} paid`,
          transaction_date: new Date().toISOString(),
          user_id: user!.id
        });
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Error saving invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate invoice number: INV-yyyyMMdd-HHmmss-3random
  const generateInvoiceNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0,10).replace(/-/g, '');
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const random = Math.floor(100 + Math.random() * 900);
    return `INV-${date}-${time}-${random}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // If order_id changes, auto-populate amount
    if (name === 'order_id') {
      const selectedOrder = orders.find(order => order.id === value);
      setFormData(prev => ({
        ...prev,
        order_id: value,
        amount: selectedOrder?.total_amount || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Auto-generate invoice number for new invoice
  useEffect(() => {
    if (!invoice) {
      setFormData(prev => ({
        ...prev,
        invoice_number: generateInvoiceNumber()
      }));
    }
    // eslint-disable-next-line
  }, [invoice]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {invoice ? 'Edit Invoice' : 'Add Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="order_id" className="block text-sm font-medium text-gray-700 mb-1">
              Order (search by customer name) *
            </label>
            <input
              type="text"
              placeholder="Search customer name..."
              value={orderSearch}
              onChange={e => {
                setOrderSearch(e.target.value);
                setSelectedCustomer(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              autoComplete="off"
            />
            {/* Customer suggestions dropdown */}
            {customerSuggestions.length > 0 && (
              <ul className="border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto mb-2 z-10 relative">
                {customerSuggestions.map((customer, idx) => (
                  <li
                    key={customer.name + (customer.custom_customer_id || '')}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setOrderSearch(customer.name);
                    }}
                  >
                    {customer.name}
                    {customer.custom_customer_id ? ` (${customer.custom_customer_id})` : ''}
                  </li>
                ))}
              </ul>
            )}
            <select
              id="order_id"
              name="order_id"
              value={formData.order_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="" disabled>Select an order</option>
              {orders
                .filter(order => {
                  if (selectedCustomer) {
                    return order.customers?.name === selectedCustomer.name && order.customers?.custom_customer_id === selectedCustomer.custom_customer_id;
                  }
                  const name = order.customers?.name?.toLowerCase() || '';
                  return orderSearch.trim() === '' || name.includes(orderSearch.toLowerCase());
                })
                .map(order => (
                  <option key={order.id} value={order.id}>
                    {order.customers?.name || 'Unknown'}
                    {order.customers?.custom_customer_id ? ` (${order.customers.custom_customer_id})` : ''}
                    {' - '}
                    {order.custom_order_id || order.id}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number *
            </label>
            <input
              type="text"
              id="invoice_number"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
              {loading ? 'Saving...' : (invoice ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}