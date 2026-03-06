import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onChange: (month: string) => void;
  /** Number of past months to show in the dropdown (default: 24) */
  pastMonthsCount?: number;
  /** Number of future months to show in the dropdown (default: 3) */
  futureMonthsCount?: number;
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function addMonthsToStr(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Builds the list of selectable months for the dropdown. */
function buildMonthOptions(pastCount: number, futureCount: number): string[] {
  const now = getCurrentMonth();
  const options: string[] = [];
  for (let i = pastCount; i >= 1; i--) {
    options.push(addMonthsToStr(now, -i));
  }
  options.push(now);
  for (let i = 1; i <= futureCount; i++) {
    options.push(addMonthsToStr(now, i));
  }
  return options;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onChange,
  pastMonthsCount = 24,
  futureMonthsCount = 3,
}) => {
  const monthOptions = buildMonthOptions(pastMonthsCount, futureMonthsCount);
  const now = getCurrentMonth();
  const isHistorical = currentMonth < now;
  const isFuture = currentMonth > now;

  const handlePrev = () => onChange(addMonthsToStr(currentMonth, -1));
  const handleNext = () => onChange(addMonthsToStr(currentMonth, 1));

  return (
    <div className="flex items-center justify-between gap-2" data-testid="month-selector">
      {/* Previous month arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        aria-label="Previous month"
        data-testid="month-prev"
        className="text-blue-600"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Month dropdown */}
      <div className="flex flex-col items-center gap-1">
        <Select value={currentMonth} onValueChange={onChange}>
          <SelectTrigger
            className="w-48 border-0 shadow-none bg-transparent font-semibold text-blue-800 focus:ring-0 focus:ring-offset-0 justify-center gap-2"
            data-testid="month-dropdown-trigger"
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m} value={m}>
                {formatMonthLabel(m)}
                {m === now && (
                  <span className="ml-2 text-xs text-blue-500 font-normal">current</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Contextual badge */}
        {currentMonth === now && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
            Current Month
          </span>
        )}
        {isHistorical && (
          <span
            className="text-xs bg-amber-100 text-amber-700 rounded px-2 py-0.5"
            data-testid="historical-badge"
          >
            Historical View
          </span>
        )}
        {isFuture && (
          <span className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-0.5">
            Future Month
          </span>
        )}
      </div>

      {/* Next month arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        aria-label="Next month"
        data-testid="month-next"
        className="text-blue-600"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
