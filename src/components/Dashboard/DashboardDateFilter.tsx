import { Calendar } from 'lucide-react'

interface DateFilterProps {
  selected: 'this-month' | 'all-time'
  onFilterChange: (filter: 'this-month' | 'all-time') => void
}

export function DashboardDateFilter({ selected, onFilterChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <select
        className="border rounded px-2 py-1 text-sm"
        value={selected}
        onChange={e => onFilterChange(e.target.value as 'this-month' | 'all-time')}
      >
        <option value="this-month">This Month</option>
        <option value="all-time">All Time</option>
      </select>
    </div>
  )
}