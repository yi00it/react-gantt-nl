/**
 * @saharos/react-gantt - Type definitions
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * View mode for the Gantt chart timeline
 */
export type ViewMode = 'day' | 'week' | 'month';

/**
 * Task type - determines rendering style
 */
export type TaskType = 'task' | 'milestone' | 'group';

/**
 * Dependency type between tasks
 */
export type DependencyType =
  | 'finish-to-start'   // FS: Predecessor must finish before successor starts
  | 'start-to-start'    // SS: Both start together
  | 'finish-to-finish'  // FF: Both finish together
  | 'start-to-finish';  // SF: Predecessor start triggers successor finish

// ============================================================================
// Task Definition
// ============================================================================

/**
 * Core task data structure
 * Baseline dates are first-class citizens, not an afterthought
 */
export interface GanttTask {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Task type */
  type: TaskType;

  /** Start date (current schedule) */
  start: Date;

  /** End date (current schedule) */
  end: Date;

  /** Progress percentage (0-100) */
  progress: number;

  /**
   * Baseline start date (original planned schedule)
   * When set, baseline bar will be rendered
   */
  baselineStart?: Date;

  /**
   * Baseline end date (original planned schedule)
   * When set, baseline bar will be rendered
   */
  baselineEnd?: Date;

  /** Parent task ID for grouping */
  parentId?: string;

  /** Task IDs this task depends on */
  dependencies?: string[];

  /** Whether this task is on the critical path */
  isCritical?: boolean;

  /** Whether this task is disabled (no interactions) */
  isDisabled?: boolean;

  /** Custom color for the task bar */
  color?: string;

  /** Custom styles */
  styles?: TaskStyles;

  /** Any additional data */
  payload?: Record<string, unknown>;
}

/**
 * Custom styles for a task
 */
export interface TaskStyles {
  /** Background color */
  backgroundColor?: string;
  /** Progress bar color */
  progressColor?: string;
  /** Baseline bar color */
  baselineColor?: string;
  /** Text color */
  textColor?: string;
}

// ============================================================================
// Dependency Definition
// ============================================================================

/**
 * Dependency between two tasks
 */
export interface GanttDependency {
  /** Source task ID */
  fromId: string;

  /** Target task ID */
  toId: string;

  /** Type of dependency */
  type: DependencyType;

  /** Lag in days (positive = delay, negative = lead) */
  lag?: number;
}

// ============================================================================
// Column Definition (for task list)
// ============================================================================

/**
 * Column definition for the task list panel
 */
export interface GanttColumn<T = GanttTask> {
  /** Unique column ID */
  id: string;

  /** Column header text */
  header: string;

  /** Column width in pixels */
  width: number;

  /** Minimum width */
  minWidth?: number;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';

  /** Custom cell renderer */
  render?: (task: T, rowIndex: number) => React.ReactNode;

  /** Accessor function or property key */
  accessor?: keyof T | ((task: T) => React.ReactNode);
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Task date change event (from drag or resize)
 */
export interface TaskDateChangeEvent {
  task: GanttTask;
  newStart: Date;
  newEnd: Date;
  /** Whether this was a resize (true) or move (false) */
  isResize: boolean;
}

/**
 * Task progress change event
 */
export interface TaskProgressChangeEvent {
  task: GanttTask;
  newProgress: number;
}

/**
 * Task click event
 */
export interface TaskClickEvent {
  task: GanttTask;
  event: React.MouseEvent;
}

/**
 * Task double-click event
 */
export interface TaskDoubleClickEvent {
  task: GanttTask;
  event: React.MouseEvent;
}

/**
 * Event handlers for Gantt interactions
 */
export interface GanttEventHandlers {
  /** Called when task dates change (drag or resize) */
  onTaskDateChange?: (event: TaskDateChangeEvent) => void | Promise<void>;

  /** Called when task progress changes */
  onTaskProgressChange?: (event: TaskProgressChangeEvent) => void | Promise<void>;

  /** Called when a task is clicked */
  onTaskClick?: (event: TaskClickEvent) => void;

  /** Called when a task is double-clicked */
  onTaskDoubleClick?: (event: TaskDoubleClickEvent) => void;

  /** Called when a group is expanded/collapsed */
  onGroupToggle?: (taskId: string, isExpanded: boolean) => void;

  /** Called when view mode changes */
  onViewModeChange?: (viewMode: ViewMode) => void;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Gantt chart configuration options
 */
export interface GanttConfig {
  /** View mode */
  viewMode?: ViewMode;

  /** Row height in pixels */
  rowHeight?: number;

  /** Header height in pixels */
  headerHeight?: number;

  /** Whether to show the task list panel */
  showTaskList?: boolean;

  /** Task list panel width */
  taskListWidth?: number;

  /** Whether to show baseline bars */
  showBaseline?: boolean;

  /** Whether to show dependency arrows */
  showDependencies?: boolean;

  /** Whether to show today marker */
  showTodayMarker?: boolean;

  /** Whether to show weekends with different background */
  showWeekends?: boolean;

  /** Whether tasks can be dragged */
  allowDrag?: boolean;

  /** Whether tasks can be resized */
  allowResize?: boolean;

  /** Whether progress can be changed by dragging */
  allowProgressChange?: boolean;

  /** Locale for date formatting */
  locale?: string;

  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;

  /** Custom date range (if not provided, calculated from tasks) */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** Padding days before first task and after last task */
  datePadding?: number;
}

// ============================================================================
// Theme
// ============================================================================

/**
 * Theme colors for the Gantt chart
 */
export interface GanttTheme {
  /** Primary/accent color */
  primary?: string;

  /** Background color */
  background?: string;

  /** Alternate row background */
  backgroundAlt?: string;

  /** Text color */
  text?: string;

  /** Muted text color */
  textMuted?: string;

  /** Border color */
  border?: string;

  /** Grid line color */
  gridLine?: string;

  /** Default task bar color */
  taskBar?: string;

  /** Task bar progress color */
  taskProgress?: string;

  /** Baseline bar color */
  baseline?: string;

  /** Critical path color */
  critical?: string;

  /** Milestone color */
  milestone?: string;

  /** Group/summary bar color */
  group?: string;

  /** Today marker color */
  todayMarker?: string;

  /** Weekend background color */
  weekend?: string;

  /** Dependency arrow color */
  dependency?: string;

  /** Tooltip background */
  tooltipBackground?: string;

  /** Tooltip text color */
  tooltipText?: string;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Main Gantt component props
 */
export interface GanttProps extends GanttEventHandlers {
  /** Array of tasks to display */
  tasks: GanttTask[];

  /** Dependencies between tasks */
  dependencies?: GanttDependency[];

  /** Column definitions for task list */
  columns?: GanttColumn[];

  /** Configuration options */
  config?: GanttConfig;

  /** Theme overrides */
  theme?: GanttTheme;

  /** Additional CSS class */
  className?: string;

  /** Inline styles */
  style?: React.CSSProperties;

  /** Loading state */
  isLoading?: boolean;

  /** Custom empty state */
  emptyState?: React.ReactNode;

  /** Custom tooltip renderer */
  renderTooltip?: (task: GanttTask) => React.ReactNode;

  /** Custom task bar renderer */
  renderTaskBar?: (task: GanttTask, defaultBar: React.ReactNode) => React.ReactNode;
}

// ============================================================================
// Internal Types (exported for advanced usage)
// ============================================================================

/**
 * Computed task with position data
 */
export interface ComputedTask extends GanttTask {
  /** X position in pixels */
  x: number;

  /** Width in pixels */
  width: number;

  /** Y position (row index) */
  rowIndex: number;

  /** Baseline X position (if baseline exists) */
  baselineX?: number;

  /** Baseline width (if baseline exists) */
  baselineWidth?: number;

  /** Nesting level for groups */
  level: number;

  /** Whether children are collapsed */
  isCollapsed?: boolean;

  /** Whether this task is visible (not hidden by collapsed parent) */
  isVisible: boolean;
}

/**
 * Date range for the chart
 */
export interface DateRange {
  start: Date;
  end: Date;
  /** Total days in range */
  totalDays: number;
}

/**
 * Grid cell information
 */
export interface GridCell {
  date: Date;
  x: number;
  width: number;
  isWeekend: boolean;
  isToday: boolean;
  label: string;
}
