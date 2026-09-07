import React, { useState, useEffect } from 'react';
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
  /** User ID used to fetch the months that have actual data */
  userId?: string;
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

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onChange,
  userId,
}) => {
  const now = getCurrentMonth();
  const isHistorical = currentMonth < now;
  const isFuture = currentMonth > now;

  // Months available in the dropdown — populated from the API.
  // Starts with just the current month so the selector renders immediately.
  const [availableMonths, setAvailableMonths] = useState<string[]>([now]);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/commitments/user/${userId}/months-with-data`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch months with data');
        return res.json() as Promise<string[]>;
      })
      .then(months => {
        // Always ensure the currently-selected month is in the list so the
        // Select value is never "dangling".
        const merged = Array.from(new Set([...months, currentMonth, now])).sort();
        setAvailableMonths(merged);
      })
      .catch(() => {
        // On error keep the safe default — current month always visible
        setAvailableMonths(prev =>
          Array.from(new Set([...prev, currentMonth, now])).sort()
        );
      });
    // Re-fetch whenever userId changes; currentMonth/now are stable references
    // and should not re-trigger this effect to avoid infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // When the user navigates via arrows, ensure the target month is in the list
  // even if it had no prior data (e.g. a future month the user is about to set
  // income for).
  const navigateTo = (month: string) => {
    setAvailableMonths(prev =>
      Array.from(new Set([...prev, month])).sort()
    );
    onChange(month);
  };

  const handlePrev = () => navigateTo(addMonthsToStr(currentMonth, -1));
  const handleNext = () => navigateTo(addMonthsToStr(currentMonth, 1));

  return (
    <div className="flex items-center justify-between gap-2" data-testid="month-selector">
      {/* Previous month arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        aria-label="Previous month"
        data-testid="month-prev"
        className="text-blue-600 touch-target flex-shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Month dropdown */}
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <Select value={currentMonth} onValueChange={onChange}>
          <SelectTrigger
            className="w-full max-w-48 border-0 shadow-none bg-transparent font-semibold text-blue-800 focus:ring-0 focus:ring-offset-0 justify-center gap-2"
            data-testid="month-dropdown-trigger"
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(m => (
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
        className="text-blue-600 touch-target flex-shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

