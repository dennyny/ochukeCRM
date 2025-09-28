
import React, { useState } from 'react';
import SimpleDateFilter from './SimpleDateFilter';

interface ReportFilterProps {
  onChange: (filters: { startDate: Date; endDate: Date }) => void;
  initialFilters?: { startDate?: Date; endDate?: Date };
}

export default function ReportFilter({ onChange, initialFilters }: ReportFilterProps) {
  const [range, setRange] = useState({
    startDate: initialFilters?.startDate || new Date('2000-01-01T00:00:00Z'),
    endDate: initialFilters?.endDate || new Date(),
  });

  return (
    <div className="flex flex-col gap-4">
      <label className="block font-medium mb-1">Date Range</label>
      <SimpleDateFilter
        value={range}
        onChange={r => {
          setRange(r);
          onChange(r);
        }}
      />
    </div>
  );
}