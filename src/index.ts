/**
 * @saharos/react-gantt
 *
 * A lightweight, fully-featured React Gantt chart with native baseline support.
 *
 * @example
 * ```tsx
 * import { Gantt } from '@saharos/react-gantt';
 *
 * const tasks = [
 *   {
 *     id: '1',
 *     name: 'Foundation Work',
 *     type: 'task',
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-15'),
 *     progress: 50,
 *     // Baseline dates - will render gray bar below current bar
 *     baselineStart: new Date('2024-01-01'),
 *     baselineEnd: new Date('2024-01-10'),
 *   },
 * ];
 *
 * function App() {
 *   return (
 *     <Gantt
 *       tasks={tasks}
 *       config={{ showBaseline: true }}
 *       onTaskDateChange={(event) => console.log(event)}
 *     />
 *   );
 * }
 * ```
 */

// Main component
export { Gantt } from './components/Gantt';

// Sub-components (for advanced usage)
export {
  GanttGrid,
  GanttGridHeader,
  GanttTaskBar,
  GanttTaskBars,
  GanttTaskList,
  GanttDependencies,
  GanttTooltip,
} from './components';

// Hooks
export { useDrag, useScroll } from './hooks';

// Utilities
export {
  // Date utilities
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  diffInDays,
  isWeekend,
  isSameDay,
  isToday,
  formatDate,
  formatDateCompact,
  calculateDateRange,
  generateDateGrid,
  getColumnWidth,

  // Position utilities
  dateToX,
  xToDate,
  calculateBarWidth,
  calculateChartWidth,
  computeTaskPositions,
  getRowY,
  getTaskBarY,
  getBaselineBarY,
  getBarDimensions,
} from './utils';

// Theme utilities
export { defaultTheme, darkTheme, mergeTheme, themeToCssVars } from './utils/theme';

// Types
export type {
  // Core types
  ViewMode,
  TaskType,
  DependencyType,

  // Task and dependency
  GanttTask,
  GanttDependency,
  TaskStyles,

  // Column definition
  GanttColumn,

  // Events
  TaskDateChangeEvent,
  TaskProgressChangeEvent,
  TaskClickEvent,
  TaskDoubleClickEvent,
  GanttEventHandlers,

  // Configuration
  GanttConfig,
  GanttTheme,

  // Component props
  GanttProps,

  // Internal types (for advanced usage)
  ComputedTask,
  DateRange,
  GridCell,
} from './types';

// Re-export BarDimensions from position utils
export type { BarDimensions } from './utils/position';
