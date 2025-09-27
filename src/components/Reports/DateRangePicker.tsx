import { useState } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangePickerProps {
  onChange: (startDate: Date, endDate: Date) => void;
}

export default function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  const handleOnChange = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    setState([selection as any]);
    if (selection.startDate && selection.endDate) {
      onChange(selection.startDate, selection.endDate);
    }
  }

  return (
    <DateRange
      editableDateInputs={true}
      onChange={handleOnChange}
      moveRangeOnFirstSelection={false}
      ranges={state}
    />
  );
}