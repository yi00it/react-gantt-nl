/**
 * Date utility functions for Gantt chart calculations
 */

import type { ViewMode, DateRange, GanttTask } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Get start of day (midnight)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of week
 */
export function startOfWeek(date: Date, firstDayOfWeek: 0 | 1 = 1): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get difference between dates in days
 */
export function diffInDays(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / MS_PER_DAY;
}

/**
 * Check if date is weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Format date for display based on view mode
 */
export function formatDate(date: Date, viewMode: ViewMode, locale = 'en-US'): string {
  switch (viewMode) {
    case 'day':
      return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
    case 'week':
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    case 'month':
      return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
    default:
      return date.toLocaleDateString(locale);
  }
}

/**
 * Format date for compact display (used in task list)
 */
export function formatDateCompact(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Get month name
 */
export function getMonthName(date: Date, locale = 'en-US', format: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString(locale, { month: format });
}

/**
 * Get week number of year
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
}

/**
 * Calculate date range from tasks (including baseline dates)
 */
export function calculateDateRange(
  tasks: GanttTask[],
  padding = 7,
  customRange?: { start: Date; end: Date }
): DateRange {
  // Use custom range if provided
  if (customRange) {
    const start = startOfDay(customRange.start);
    const end = endOfDay(customRange.end);
    return {
      start,
      end,
      totalDays: Math.ceil(diffInDays(start, end)),
    };
  }

  // Calculate from tasks
  if (tasks.length === 0) {
    const now = new Date();
    const start = startOfDay(addDays(now, -padding));
    const end = endOfDay(addDays(now, padding));
    return {
      start,
      end,
      totalDays: padding * 2,
    };
  }

  let minDate = tasks[0].start;
  let maxDate = tasks[0].end;

  tasks.forEach((task) => {
    // Check current schedule
    if (task.start < minDate) minDate = task.start;
    if (task.end > maxDate) maxDate = task.end;

    // Check baseline dates (this is why we need this in the library!)
    if (task.baselineStart && task.baselineStart < minDate) {
      minDate = task.baselineStart;
    }
    if (task.baselineEnd && task.baselineEnd > maxDate) {
      maxDate = task.baselineEnd;
    }
  });

  // Add padding
  const start = startOfDay(addDays(minDate, -padding));
  const end = endOfDay(addDays(maxDate, padding));

  return {
    start,
    end,
    totalDays: Math.ceil(diffInDays(start, end)),
  };
}

/**
 * Generate array of dates for grid rendering
 */
export function generateDateGrid(
  dateRange: DateRange,
  viewMode: ViewMode,
  firstDayOfWeek: 0 | 1 = 1
): Date[] {
  const dates: Date[] = [];
  let current = new Date(dateRange.start);

  switch (viewMode) {
    case 'day':
      while (current <= dateRange.end) {
        dates.push(new Date(current));
        current = addDays(current, 1);
      }
      break;

    case 'week':
      current = startOfWeek(current, firstDayOfWeek);
      while (current <= dateRange.end) {
        dates.push(new Date(current));
        current = addWeeks(current, 1);
      }
      break;

    case 'month':
      current = startOfMonth(current);
      while (current <= dateRange.end) {
        dates.push(new Date(current));
        current = addMonths(current, 1);
      }
      break;
  }

  return dates;
}

/**
 * Get column width for a view mode
 */
export function getColumnWidth(viewMode: ViewMode): number {
  switch (viewMode) {
    case 'day':
      return 40;
    case 'week':
      return 120;
    case 'month':
      return 180;
    default:
      return 40;
  }
}

/**
 * Get the unit increment for a view mode (in days)
 */
export function getViewModeUnit(viewMode: ViewMode): number {
  switch (viewMode) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30; // Approximate
    default:
      return 1;
  }
}
