import { useEffect, useState } from 'react';
import { fetchInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, InventoryItem } from '../../lib/inventory';
import InventoryForm from './InventoryForm';

const LOW_STOCK_THRESHOLD = 5;


export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const loadInventory = () => {
    setLoading(true);
    fetchInventory()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (item: Omit<InventoryItem, 'id' | 'created_at'>) => {
    setFormLoading(true);
    try {
      await addInventoryItem(item);
      setShowForm(false);
      loadInventory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (item: Omit<InventoryItem, 'id' | 'created_at'>) => {
    if (!editItem) return;
    setFormLoading(true);
    try {
      await updateInventoryItem(editItem.id, item);
      setEditItem(null);
      setShowForm(false);
      loadInventory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    try {
      await deleteInventoryItem(id);
      loadInventory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="mb-4">
        {showForm ? (
          <InventoryForm
            initial={editItem || {}}
            onSubmit={editItem ? handleEdit : handleAdd}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
            loading={formLoading}
          />
        ) : (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => { setShowForm(true); setEditItem(null); }}
          >
            Add Inventory Item
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Description</th>
              <th className="px-4 py-2 border-b">Quantity</th>
              <th className="px-4 py-2 border-b">Price</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">No inventory items found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={item.quantity <= LOW_STOCK_THRESHOLD ? 'bg-red-50' : ''}>
                  <td className="px-4 py-2 border-b font-medium">{item.name}</td>
                  <td className="px-4 py-2 border-b">{item.description || '-'}</td>
                  <td className={`px-4 py-2 border-b font-semibold ${item.quantity <= LOW_STOCK_THRESHOLD ? 'text-red-600' : ''}`}>{item.quantity}</td>
                  <td className="px-4 py-2 border-b">₦{item.price.toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => { setEditItem(item); setShowForm(true); }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
