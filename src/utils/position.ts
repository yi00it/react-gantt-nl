/**
 * Position calculation utilities for Gantt chart
 *
 * This is the core of the library - consistent position calculations
 * ensure that task bars and baseline bars align perfectly.
 */

import type { ViewMode, DateRange, GanttTask, ComputedTask, GanttConfig } from '../types';
import { getColumnWidth, startOfDay } from './date';

/**
 * Calculate the total chart width based on date range and view mode
 */
export function calculateChartWidth(dateRange: DateRange, viewMode: ViewMode): number {
  const columnWidth = getColumnWidth(viewMode);

  switch (viewMode) {
    case 'day':
      return dateRange.totalDays * columnWidth;
    case 'week':
      return Math.ceil(dateRange.totalDays / 7) * columnWidth;
    case 'month':
      return Math.ceil(dateRange.totalDays / 30) * columnWidth;
    default:
      return dateRange.totalDays * columnWidth;
  }
}

/**
 * Convert a date to X pixel position
 *
 * This is THE key function - used for both task bars and baselines
 * ensuring they use the exact same coordinate system.
 */
export function dateToX(
  date: Date,
  dateRange: DateRange,
  chartWidth: number
): number {
  const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
  const dateMs = date.getTime() - dateRange.start.getTime();
  return (dateMs / totalMs) * chartWidth;
}

/**
 * Convert X pixel position back to a date
 */
export function xToDate(
  x: number,
  dateRange: DateRange,
  chartWidth: number
): Date {
  const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
  const dateMs = (x / chartWidth) * totalMs;
  return new Date(dateRange.start.getTime() + dateMs);
}

/**
 * Calculate bar width from start and end dates
 */
export function calculateBarWidth(
  start: Date,
  end: Date,
  dateRange: DateRange,
  chartWidth: number,
  minWidth = 4
): number {
  const startX = dateToX(start, dateRange, chartWidth);
  const endX = dateToX(end, dateRange, chartWidth);
  return Math.max(endX - startX, minWidth);
}

/**
 * Snap X position to grid based on view mode
 */
export function snapToGrid(
  x: number,
  dateRange: DateRange,
  chartWidth: number,
  viewMode: ViewMode
): number {
  const date = xToDate(x, dateRange, chartWidth);
  let snappedDate: Date;

  switch (viewMode) {
    case 'day':
      snappedDate = startOfDay(date);
      break;
    case 'week':
      // Snap to nearest day
      snappedDate = startOfDay(date);
      break;
    case 'month':
      // Snap to nearest day
      snappedDate = startOfDay(date);
      break;
    default:
      snappedDate = startOfDay(date);
  }

  return dateToX(snappedDate, dateRange, chartWidth);
}

/**
 * Build a flat list of visible tasks with hierarchy info
 */
function flattenTasks(
  tasks: GanttTask[],
  collapsedIds: Set<string>
): Array<{ task: GanttTask; level: number; isVisible: boolean }> {
  const result: Array<{ task: GanttTask; level: number; isVisible: boolean }> = [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Find root tasks (no parent or parent doesn't exist)
  const rootTasks = tasks.filter(
    (t) => !t.parentId || !taskMap.has(t.parentId)
  );

  function addTask(task: GanttTask, level: number, parentVisible: boolean) {
    const isCollapsed = collapsedIds.has(task.id);
    const isVisible = parentVisible;

    result.push({ task, level, isVisible });

    // Find children
    const children = tasks.filter((t) => t.parentId === task.id);
    children.forEach((child) => {
      addTask(child, level + 1, isVisible && !isCollapsed);
    });
  }

  rootTasks.forEach((task) => addTask(task, 0, true));

  return result;
}

/**
 * Compute all task positions
 *
 * This function calculates X, width, and row positions for all tasks
 * including their baseline bars.
 */
export function computeTaskPositions(
  tasks: GanttTask[],
  dateRange: DateRange,
  chartWidth: number,
  _config: GanttConfig,
  collapsedIds: Set<string> = new Set()
): ComputedTask[] {
  const flatTasks = flattenTasks(tasks, collapsedIds);

  let visibleRowIndex = 0;

  return flatTasks.map(({ task, level, isVisible }) => {
    const x = dateToX(task.start, dateRange, chartWidth);
    const width = calculateBarWidth(task.start, task.end, dateRange, chartWidth);

    // Calculate baseline positions if baseline dates exist
    let baselineX: number | undefined;
    let baselineWidth: number | undefined;

    if (task.baselineStart && task.baselineEnd) {
      baselineX = dateToX(task.baselineStart, dateRange, chartWidth);
      baselineWidth = calculateBarWidth(
        task.baselineStart,
        task.baselineEnd,
        dateRange,
        chartWidth
      );
    }

    const rowIndex = isVisible ? visibleRowIndex : -1;
    if (isVisible) {
      visibleRowIndex++;
    }

    return {
      ...task,
      x,
      width,
      rowIndex,
      baselineX,
      baselineWidth,
      level,
      isCollapsed: collapsedIds.has(task.id),
      isVisible,
    };
  });
}

/**
 * Get Y position for a row
 */
export function getRowY(rowIndex: number, rowHeight: number): number {
  return rowIndex * rowHeight;
}

/**
 * Get the center Y position of a task bar within its row
 */
export function getTaskBarY(
  rowIndex: number,
  rowHeight: number,
  barHeight: number
): number {
  // Center the bar vertically in the row, but offset slightly up to make room for baseline
  const centerY = rowIndex * rowHeight + (rowHeight - barHeight) / 2;
  return centerY - 4; // Offset up to make room for baseline below
}

/**
 * Get Y position for baseline bar (directly below task bar)
 */
export function getBaselineBarY(
  rowIndex: number,
  rowHeight: number,
  taskBarHeight: number,
  _baselineBarHeight: number,
  gap = 2
): number {
  const taskBarY = getTaskBarY(rowIndex, rowHeight, taskBarHeight);
  return taskBarY + taskBarHeight + gap;
}

/**
 * Get task bar dimensions
 */
export interface BarDimensions {
  taskBar: {
    height: number;
    y: number;
    cornerRadius: number;
  };
  baselineBar: {
    height: number;
    y: number;
    cornerRadius: number;
  };
  progressBar: {
    height: number;
    y: number;
  };
}

export function getBarDimensions(
  rowIndex: number,
  rowHeight: number
): BarDimensions {
  const taskBarHeight = Math.min(rowHeight * 0.45, 20);
  const baselineBarHeight = Math.min(rowHeight * 0.2, 8);

  return {
    taskBar: {
      height: taskBarHeight,
      y: getTaskBarY(rowIndex, rowHeight, taskBarHeight),
      cornerRadius: 3,
    },
    baselineBar: {
      height: baselineBarHeight,
      y: getBaselineBarY(rowIndex, rowHeight, taskBarHeight, baselineBarHeight),
      cornerRadius: 2,
    },
    progressBar: {
      height: taskBarHeight,
      y: getTaskBarY(rowIndex, rowHeight, taskBarHeight),
    },
  };
}

/**
 * Check if a point is within a task bar
 */
export function isPointInTaskBar(
  x: number,
  y: number,
  task: ComputedTask,
  rowHeight: number
): boolean {
  const dims = getBarDimensions(task.rowIndex, rowHeight);
  return (
    x >= task.x &&
    x <= task.x + task.width &&
    y >= dims.taskBar.y &&
    y <= dims.taskBar.y + dims.taskBar.height
  );
}

/**
 * Determine if mouse is on left edge (for resize)
 */
export function isOnLeftEdge(
  x: number,
  task: ComputedTask,
  threshold = 8
): boolean {
  return x >= task.x && x <= task.x + threshold;
}

/**
 * Determine if mouse is on right edge (for resize)
 */
export function isOnRightEdge(
  x: number,
  task: ComputedTask,
  threshold = 8
): boolean {
  const rightEdge = task.x + task.width;
  return x >= rightEdge - threshold && x <= rightEdge;
}

/**
 * Get cursor style based on position
 */
export function getCursorStyle(
  x: number,
  task: ComputedTask,
  allowResize: boolean
): 'ew-resize' | 'move' | 'pointer' {
  if (!allowResize) return 'pointer';

  if (isOnLeftEdge(x, task) || isOnRightEdge(x, task)) {
    return 'ew-resize';
  }

  return 'move';
}
