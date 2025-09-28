import { useState, useRef } from 'react';
import { DateRangePicker as RDRDateRangePicker, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Props {
  value: { from: Date | null; to: Date | null };
  onChange: (range: { from: Date | null; to: Date | null }) => void;
}

export default function CustomDateRangePicker({ value, onChange }: Props) {
  const [show, setShow] = useState<'from' | 'to' | null>(null);
  const [tempRange, setTempRange] = useState({
    from: value.from,
    to: value.to,
  });
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle date selection
  const handleSelect = (ranges: RangeKeyDict) => {
    const sel = ranges.selection;
  setTempRange({ from: sel.startDate ?? null, to: sel.endDate ?? null });
  };

  // Apply selection and close
  const apply = () => {
    setShow(null);
    if (tempRange.from && tempRange.to && tempRange.from <= tempRange.to) {
      onChange(tempRange);
    }
  };

  // Open calendar for field
  const open = (field: 'from' | 'to') => {
    setShow(field);
  };

  // Format date
  const fmt = (d: Date | null) => d ? d.toLocaleDateString() : '';

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 w-36 cursor-pointer"
          value={fmt(tempRange.from)}
          placeholder="From"
          readOnly
          onClick={() => open('from')}
        />
        <span>to</span>
        <input
          type="text"
          className="border rounded px-2 py-1 w-36 cursor-pointer"
          value={fmt(tempRange.to)}
          placeholder="To"
          readOnly
          onClick={() => open('to')}
        />
      </div>
      {show && (
        <div ref={calendarRef} className="absolute z-20 bg-white shadow-lg mt-2">
          <RDRDateRangePicker
            ranges={[{
              startDate: tempRange.from || new Date(),
              endDate: tempRange.to || new Date(),
              key: 'selection',
            }]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            showDateDisplay={false}
            editableDateInputs={true}
            rangeColors={["#2563eb"]}
            minDate={show === 'to' && tempRange.from ? tempRange.from : undefined}
            maxDate={show === 'from' && tempRange.to ? tempRange.to : undefined}
          />
          <div className="flex justify-end gap-2 p-2">
            <button className="px-3 py-1 rounded bg-gray-200" onClick={() => setShow(null)}>Cancel</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={apply} disabled={!(tempRange.from && tempRange.to && tempRange.from <= tempRange.to)}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
