import { useState } from 'react';

interface SimpleDateFilterProps {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export default function SimpleDateFilter({ value, onChange }: SimpleDateFilterProps) {
  const [start, setStart] = useState(value.startDate.toISOString().slice(0, 10));
  const [end, setEnd] = useState(value.endDate.toISOString().slice(0, 10));

  const handleApply = () => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate <= endDate) {
      onChange({ startDate, endDate });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={start}
        onChange={e => setStart(e.target.value)}
      />
      <span>to</span>
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={end}
        onChange={e => setEnd(e.target.value)}
      />
      <button
        className="ml-2 px-3 py-1 rounded bg-blue-600 text-white"
        onClick={handleApply}
        disabled={new Date(start) > new Date(end)}
      >
        Apply
      </button>
    </div>
  );
}
