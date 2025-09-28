import { useState, useEffect } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangePickerProps {
  onChange: (startDate: Date, endDate: Date) => void;
  startDate: Date;
  endDate: Date;
}

export default function DateRangePicker({ onChange, startDate, endDate }: DateRangePickerProps) {
  const [state, setState] = useState([
    {
      startDate,
      endDate,
      key: 'selection'
    }
  ]);

  // Keep picker in sync with parent state
  useEffect(() => {
    setState([{
      startDate,
      endDate,
      key: 'selection'
    }]);
  }, [startDate, endDate]);

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