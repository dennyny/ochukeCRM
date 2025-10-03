import { useState } from 'react';
import { InventoryItem } from '../../lib/inventory';

interface InventoryFormProps {
  initial?: Partial<InventoryItem>;
  onSubmit: (item: Omit<InventoryItem, 'id' | 'created_at'>) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function InventoryForm({ initial = {}, onSubmit, onCancel, loading }: InventoryFormProps) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [quantity, setQuantity] = useState(initial.quantity || 0);
  const [price, setPrice] = useState(initial.price || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, quantity, price });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Quantity</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          min={0}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price (₦)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          min={0}
          required
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
