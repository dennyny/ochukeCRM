import { useEffect, useState } from 'react';
import { fetchInventory, updateInventoryItem, InventoryItem } from '../../lib/inventory';

export default function InventoryUpdate() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [id: string]: { quantity?: number; price?: number } }>({});

  const handleEditValueChange = (id: string, field: 'quantity' | 'price', value: number) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    setLoading(true);
    fetchInventory()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id: string, quantity: number, price: number) => {
    setSavingId(id);
    try {
      await updateInventoryItem(id, { quantity, price });
      setItems((prev) => prev.map(item => item.id === id ? { ...item, quantity, price } : item));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Update Inventory</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Quantity</th>
              <th className="px-4 py-2 border-b">Price</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">No inventory items found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 border-b font-medium">{item.name}</td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={typeof editValues[item.id]?.quantity === 'number' ? editValues[item.id].quantity : item.quantity}
                      min={0}
                      onChange={e => handleEditValueChange(item.id, 'quantity', Number(e.target.value))}
                      disabled={savingId === item.id}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={typeof editValues[item.id]?.price === 'number' ? editValues[item.id].price : item.price}
                      min={0}
                      onChange={e => handleEditValueChange(item.id, 'price', Number(e.target.value))}
                      disabled={savingId === item.id}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      disabled={savingId === item.id}
                      onClick={() => handleUpdate(
                        item.id,
                        typeof editValues[item.id]?.quantity === 'number' ? editValues[item.id].quantity : item.quantity,
                        typeof editValues[item.id]?.price === 'number' ? editValues[item.id].price : item.price
                      )}
                    >
                      {savingId === item.id ? 'Saving...' : 'Update'}
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
