import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'


interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
}

interface Order {
  id: string;
  custom_order_id?: string;
  total_amount?: number;
}

interface Customer {
  id: string;
  name: string;
  custom_customer_id?: string;
}

interface InvoiceFormProps {
  invoice: Invoice | null
  onClose: () => void
  onSuccess: () => void
}

export default function InvoiceForm({ invoice, onClose, onSuccess }: InvoiceFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    order_id: invoice?.order_id || '',
    invoice_number: invoice?.invoice_number || '',
    amount: invoice?.amount || 0,
    status: invoice?.status || 'draft',
    due_date: invoice?.due_date || new Date().toISOString().split('T')[0],
  })
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  // Fetch all customers for the user
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, custom_customer_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch orders for selected customer
  useEffect(() => {
    if (selectedCustomer && user) {
      fetchOrdersForCustomer(selectedCustomer.id);
    } else {
      setOrders([]);
    }
  }, [selectedCustomer, user]);

  // Auto-select first order when orders are loaded for a selected customer
  useEffect(() => {
    if (selectedCustomer && orders.length > 0) {
      setFormData(prev => ({
        ...prev,
        order_id: orders[0].id,
        amount: orders[0].total_amount || 0
      }));
    }
  }, [orders, selectedCustomer]);

  const fetchOrdersForCustomer = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, custom_order_id, total_amount')
        .eq('user_id', user!.id)
        .eq('customer_id', customerId);
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null);
    if (!formData.order_id) {
      setFormError('Please select an order for this invoice.');
      return;
    }
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
    } catch (error: any) {
      let message = 'Error saving invoice. Please try again.';
      if (error && error.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      console.error('Error saving invoice:', error);
      setFormError(message);
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

  // Handle customer search and selection
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setShowSuggestions(true);
    setSelectedCustomer(null);
    setFormData(prev => ({ ...prev, order_id: '', amount: 0 }));
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.name} (${customer.custom_customer_id || customer.id.slice(0, 6)})`);
    setShowSuggestions(false);
    setFormData(prev => ({ ...prev, order_id: '', amount: 0 }));
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
          {formError && (
            <div className="text-red-600 text-sm mb-2">{formError}</div>
          )}
          {/* Customer Search/Select */}
          <div className="relative">
            <label htmlFor="customer_search" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <input
              id="customer_search"
              type="text"
              ref={searchRef}
              value={customerSearch}
              onChange={handleCustomerSearch}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
              placeholder="Type to search customer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {showSuggestions && customerSearch && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-40 overflow-y-auto shadow-lg">
                {customers.filter(c => {
                  const search = customerSearch.toLowerCase();
                  return c.name.toLowerCase().includes(search) ||
                    (c.custom_customer_id || '').toLowerCase().includes(search) ||
                    c.name.split(' ').some(part => part.toLowerCase().includes(search));
                }).map(c => (
                  <li
                    key={c.id}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                    onClick={() => handleSelectCustomer(c)}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{c.custom_customer_id || c.id.slice(0, 6)}</span>
                  </li>
                ))}
                {customers.filter(c => {
                  const search = customerSearch.toLowerCase();
                  return c.name.toLowerCase().includes(search) ||
                    (c.custom_customer_id || '').toLowerCase().includes(search) ||
                    c.name.split(' ').some(part => part.toLowerCase().includes(search));
                }).length === 0 && (
                  <li className="px-4 py-2 text-gray-400">No customers found</li>
                )}
              </ul>
            )}
          </div>

          {/* Order Dropdown (filtered by customer) */}
          <div>
            <label htmlFor="order_id" className="block text-sm font-medium text-gray-700 mb-1">
              Order *
            </label>
            <select
              id="order_id"
              name="order_id"
              value={formData.order_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!selectedCustomer}
            >
              <option value="" disabled>{selectedCustomer ? 'Select an order' : 'Select a customer first'}</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>{order.custom_order_id || order.id}</option>
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