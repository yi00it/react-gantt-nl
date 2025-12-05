/**
 * Gantt - Main component that orchestrates all parts
 *
 * @saharos/react-gantt
 */

import React, { useMemo, useState, useRef, useCallback } from 'react';
import type {
  GanttProps,
  GanttConfig,
  ComputedTask,
  DateRange,
  GanttColumn,
} from '../types';
import { calculateDateRange, formatDateCompact } from '../utils/date';
import { computeTaskPositions, calculateChartWidth } from '../utils/position';
import { mergeTheme, themeToCssVars } from '../utils/theme';
import { GanttGrid, GanttGridHeader } from './GanttGrid';
import { GanttTaskBars } from './GanttTaskBar';
import { GanttDependencies } from './GanttDependencies';
import { GanttTaskList } from './GanttTaskList';
import { GanttTooltip } from './GanttTooltip';
import { useDrag } from '../hooks/useDrag';

// Default configuration
const defaultConfig: Required<GanttConfig> = {
  viewMode: 'week',
  rowHeight: 40,
  headerHeight: 50,
  showTaskList: true,
  taskListWidth: 360,
  showBaseline: true,
  showDependencies: true,
  showTodayMarker: true,
  showWeekends: true,
  allowDrag: true,
  allowResize: true,
  allowProgressChange: true,
  locale: 'en-US',
  firstDayOfWeek: 1,
  dateRange: undefined as any,
  datePadding: 7,
};

// Default columns for task list
const defaultColumns: GanttColumn[] = [
  {
    id: 'name',
    header: 'Task Name',
    width: 200,
    minWidth: 100,
  },
  {
    id: 'start',
    header: 'Start',
    width: 80,
    align: 'center',
    accessor: (task) => formatDateCompact(task.start),
  },
  {
    id: 'end',
    header: 'End',
    width: 80,
    align: 'center',
    accessor: (task) => formatDateCompact(task.end),
  },
];

export function Gantt({
  tasks,
  dependencies = [],
  columns = defaultColumns,
  config: userConfig,
  theme: userTheme,
  className,
  style,
  isLoading,
  emptyState,
  renderTooltip,
  renderTaskBar: _renderTaskBar,
  onTaskDateChange,
  onTaskProgressChange: _onTaskProgressChange,
  onTaskClick,
  onTaskDoubleClick,
  onGroupToggle,
  onViewModeChange: _onViewModeChange,
}: GanttProps) {
  // Merge config with defaults
  const config = useMemo(
    () => ({ ...defaultConfig, ...userConfig }),
    [userConfig]
  );

  // Merge theme with defaults
  const theme = useMemo(() => mergeTheme(userTheme), [userTheme]);

  // CSS custom properties
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const taskListContentRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const chartHeaderRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  // State
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate date range
  const dateRange: DateRange = useMemo(
    () => calculateDateRange(tasks, config.datePadding, config.dateRange),
    [tasks, config.datePadding, config.dateRange]
  );

  // Calculate chart dimensions
  const chartWidth = useMemo(
    () => calculateChartWidth(dateRange, config.viewMode),
    [dateRange, config.viewMode]
  );

  // Compute task positions
  const computedTasks = useMemo(
    () => computeTaskPositions(tasks, dateRange, chartWidth, config, collapsedIds),
    [tasks, dateRange, chartWidth, config, collapsedIds]
  );

  // Visible tasks only
  const visibleTasks = useMemo(
    () => computedTasks.filter((t) => t.isVisible),
    [computedTasks]
  );

  // Convert dependencies to internal format with typing
  const internalDependencies = useMemo(
    () =>
      dependencies.map((dep) => ({
        ...dep,
        type: dep.type || 'finish-to-start',
      })),
    [dependencies]
  );

  // Drag handling
  const {
    isDragging,
    draggedTask,
    previewStart: _previewStart,
    previewEnd: _previewEnd,
    handleMouseDown: handleDragMouseDown,
    getDragPreviewX,
    getDragPreviewWidth,
  } = useDrag({
    dateRange,
    chartWidth,
    viewMode: config.viewMode,
    allowDrag: config.allowDrag,
    allowResize: config.allowResize,
    onDragEnd: (task, newStart, newEnd, cancelled, isResize) => {
      if (!cancelled && onTaskDateChange) {
        onTaskDateChange({
          task,
          newStart,
          newEnd,
          isResize,
        });
      }
    },
  });

  // Hovered task for tooltip
  const hoveredTask = useMemo(
    () => visibleTasks.find((t) => t.id === hoveredTaskId) || null,
    [visibleTasks, hoveredTaskId]
  );

  // Event handlers
  const handleTaskMouseEnter = useCallback(
    (task: ComputedTask, event: React.MouseEvent) => {
      if (isDragging) return;
      setHoveredTaskId(task.id);
      setMousePosition({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
    },
    [isDragging]
  );

  const handleTaskMouseLeave = useCallback(() => {
    setHoveredTaskId(null);
    setMousePosition(null);
  }, []);

  const handleTaskClick = useCallback(
    (task: ComputedTask, event: React.MouseEvent) => {
      if (task.type === 'group') return;

      setSelectedTaskId(task.id);
      onTaskClick?.({ task, event });
    },
    [onTaskClick]
  );

  const handleTaskDoubleClick = useCallback(
    (task: ComputedTask, event: React.MouseEvent) => {
      if (task.type === 'group') return;

      onTaskDoubleClick?.({ task, event });
    },
    [onTaskDoubleClick]
  );

  const handleGroupToggle = useCallback(
    (taskId: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });
      onGroupToggle?.(taskId, !collapsedIds.has(taskId));
    },
    [collapsedIds, onGroupToggle]
  );

  // Handle drag start from task bar (move or resize)
  const handleTaskDragStart = useCallback(
    (task: ComputedTask, event: React.MouseEvent, mode: 'move' | 'resize-left' | 'resize-right') => {
      if (task.isDisabled || task.type === 'group') return;
      handleDragMouseDown(task, event, mode);
    },
    [handleDragMouseDown]
  );

  // Synchronized scroll handler - chart body scrolls vertically only
  const handleChartScroll = useCallback((event: React.UIEvent) => {
    const target = event.target as HTMLElement;
    // Sync vertical scroll with task list using transform (no scrollbar)
    if (taskListContentRef.current) {
      taskListContentRef.current.style.transform = `translateY(-${target.scrollTop}px)`;
    }
  }, []);

  // Horizontal scroll handler - syncs header, chart body, and scrollbar
  const handleHorizontalScroll = useCallback((event: React.UIEvent) => {
    const target = event.target as HTMLElement;
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = target.scrollLeft;
    }
    if (chartHeaderRef.current) {
      chartHeaderRef.current.scrollLeft = target.scrollLeft;
    }
  }, []);

  // Empty state
  if (tasks.length === 0 && !isLoading) {
    return (
      <div
        className={`gantt-container ${className || ''}`}
        style={{
          ...cssVars,
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          backgroundColor: theme.background,
          color: theme.textMuted,
        }}
      >
        {emptyState || (
          <div style={{ textAlign: 'center' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ marginBottom: 12, opacity: 0.5 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>No tasks to display</p>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`gantt-container ${className || ''}`}
        style={{
          ...cssVars,
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          backgroundColor: theme.background,
          color: theme.textMuted,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: `2px solid ${theme.border}`,
              borderTopColor: theme.primary,
              borderRadius: '50%',
              animation: 'gantt-spin 0.8s linear infinite',
              marginBottom: 12,
            }}
          />
          <p style={{ margin: 0, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Add extra padding for baseline bar of last row when baselines are shown
  const baselinePadding = config.showBaseline ? Math.ceil(config.rowHeight * 0.3) : 0;
  const chartHeight = visibleTasks.length * config.rowHeight + baselinePadding;

  return (
    <div
      ref={containerRef}
      className={`gantt-container ${className || ''}`}
      style={{
        ...cssVars,
        ...style,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Keyframe animation for loading spinner */}
      <style>{`
        @keyframes gantt-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Main container with task list and chart */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Task List */}
        {config.showTaskList && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: config.taskListWidth,
              flexShrink: 0,
              borderRight: `1px solid ${theme.border}`,
              minHeight: 0,
            }}
          >
            {/* Task list header */}
            <div
              style={{
                height: config.headerHeight,
                display: 'flex',
                alignItems: 'flex-end',
                backgroundColor: theme.background,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {columns.map((col) => (
                <div
                  key={col.id}
                  style={{
                    width: col.width,
                    padding: '0 8px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.header}
                </div>
              ))}
            </div>

            {/* Task list body - no scrollbar, position synced with chart via transform */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                minHeight: 0,
                position: 'relative',
              }}
            >
              <div
                ref={taskListContentRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  willChange: 'transform',
                }}
              >
                <GanttTaskList
                  tasks={computedTasks}
                  columns={columns}
                  rowHeight={config.rowHeight}
                  headerHeight={0}
                  width={config.taskListWidth}
                  theme={theme}
                  locale={config.locale}
                  selectedTaskId={selectedTaskId}
                  hoveredTaskId={hoveredTaskId}
                  collapsedIds={collapsedIds}
                  onTaskClick={handleTaskClick}
                  onTaskDoubleClick={handleTaskDoubleClick}
                  onGroupToggle={handleGroupToggle}
                />
              </div>
            </div>

            {/* Spacer to align with horizontal scrollbar */}
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${theme.border}`,
                backgroundColor: theme.backgroundAlt || theme.background,
                height: 17, // Native scrollbar height
              }}
            />
          </div>
        )}

        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Chart header (timeline) - sticky, synced with horizontal scroll */}
          <div style={{
            overflow: 'hidden',
            flexShrink: 0,
            height: config.headerHeight,
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <div
              ref={chartHeaderRef}
              style={{
                height: '100%',
                overflowX: 'hidden',
                overflowY: 'hidden',
              }}
            >
              <GanttGridHeader
                dateRange={dateRange}
                viewMode={config.viewMode}
                headerHeight={config.headerHeight}
                theme={theme}
                locale={config.locale}
                firstDayOfWeek={config.firstDayOfWeek}
              />
            </div>
          </div>

          {/* Chart body - vertical scroll only */}
          <div
            ref={chartScrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              position: 'relative',
              minHeight: 0,
            }}
            onScroll={handleChartScroll}
          >
            <svg
              width={chartWidth}
              height={chartHeight}
              style={{ display: 'block' }}
            >
              {/* Grid background */}
              <GanttGrid
                dateRange={dateRange}
                viewMode={config.viewMode}
                rowCount={visibleTasks.length}
                rowHeight={config.rowHeight}
                headerHeight={0}
                theme={theme}
                locale={config.locale}
                firstDayOfWeek={config.firstDayOfWeek}
                showWeekends={config.showWeekends}
                showTodayMarker={config.showTodayMarker}
                extraHeight={baselinePadding}
              />

              {/* Dependencies */}
              {config.showDependencies && (
                <GanttDependencies
                  tasks={visibleTasks}
                  dependencies={internalDependencies}
                  rowHeight={config.rowHeight}
                  theme={theme}
                />
              )}

              {/* Task bars */}
              <GanttTaskBars
                tasks={visibleTasks}
                rowHeight={config.rowHeight}
                theme={theme}
                showBaseline={config.showBaseline}
                selectedTaskId={selectedTaskId}
                hoveredTaskId={hoveredTaskId}
                onTaskMouseEnter={handleTaskMouseEnter}
                onTaskMouseLeave={handleTaskMouseLeave}
                onTaskClick={handleTaskClick}
                onTaskDoubleClick={handleTaskDoubleClick}
                onTaskDragStart={handleTaskDragStart}
              />

              {/* Drag preview */}
              {isDragging && draggedTask && (
                <rect
                  x={getDragPreviewX() ?? 0}
                  y={draggedTask.rowIndex * config.rowHeight + 8}
                  width={getDragPreviewWidth() ?? 0}
                  height={config.rowHeight * 0.45}
                  rx={3}
                  fill={theme.primary}
                  opacity={0.3}
                  stroke={theme.primary}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              )}
            </svg>

            {/* Tooltip */}
            <GanttTooltip
              task={hoveredTask}
              mousePosition={mousePosition}
              containerRef={chartScrollRef as React.RefObject<HTMLElement>}
              theme={theme}
              renderContent={renderTooltip}
            />
          </div>

          {/* Horizontal scrollbar - always visible at bottom */}
          <div
            ref={horizontalScrollRef}
            style={{
              overflowX: 'scroll',
              overflowY: 'hidden',
              flexShrink: 0,
              borderTop: `1px solid ${theme.border}`,
              backgroundColor: theme.backgroundAlt || theme.background,
              minHeight: 17,
            }}
            onScroll={handleHorizontalScroll}
          >
            <div style={{ width: chartWidth, height: 17 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gantt;
