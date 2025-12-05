/**
 * GanttTaskList - Left panel showing task names and details
 */

import React, { useMemo } from 'react';
import type { ComputedTask, GanttColumn, GanttTheme } from '../types';
import { formatDateCompact } from '../utils/date';

interface GanttTaskListProps {
  tasks: ComputedTask[];
  columns?: GanttColumn[];
  rowHeight: number;
  headerHeight: number;
  width: number;
  theme: Required<GanttTheme>;
  locale?: string;
  selectedTaskId?: string | null;
  hoveredTaskId?: string | null;
  collapsedIds?: Set<string>;
  onTaskClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onTaskDoubleClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onGroupToggle?: (taskId: string) => void;
}

// Default columns
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

export function GanttTaskList({
  tasks,
  columns = defaultColumns,
  rowHeight,
  headerHeight,
  width,
  theme,
  locale = 'en-US',
  selectedTaskId,
  hoveredTaskId,
  collapsedIds = new Set(),
  onTaskClick,
  onTaskDoubleClick,
  onGroupToggle,
}: GanttTaskListProps) {
  // Only render visible tasks
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => t.isVisible);
  }, [tasks]);

  return (
    <div
      className="gantt-task-list"
      style={{
        width: width,
        minWidth: width,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header - borders controlled by parent */}
      <div
        className="gantt-task-list-header"
        style={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: theme.background,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              width: col.width,
              minWidth: col.minWidth,
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

      {/* Rows */}
      <div
        className="gantt-task-list-body"
        style={{ flex: 1, overflow: 'hidden' }}
      >
        {visibleTasks.map((task, index) => (
          <TaskListRow
            key={task.id}
            task={task}
            columns={columns}
            rowHeight={rowHeight}
            rowIndex={index}
            theme={theme}
            locale={locale}
            isSelected={selectedTaskId === task.id}
            isHovered={hoveredTaskId === task.id}
            isCollapsed={collapsedIds.has(task.id)}
            onClick={onTaskClick}
            onDoubleClick={onTaskDoubleClick}
            onToggle={onGroupToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskListRowProps {
  task: ComputedTask;
  columns: GanttColumn[];
  rowHeight: number;
  rowIndex: number;
  theme: Required<GanttTheme>;
  locale: string;
  isSelected: boolean;
  isHovered: boolean;
  isCollapsed: boolean;
  onClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onDoubleClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onToggle?: (taskId: string) => void;
}

function TaskListRow({
  task,
  columns,
  rowHeight,
  rowIndex,
  theme,
  locale: _locale,
  isSelected,
  isHovered,
  isCollapsed,
  onClick,
  onDoubleClick,
  onToggle,
}: TaskListRowProps) {
  const isGroup = task.type === 'group';
  const isEven = rowIndex % 2 === 0;

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(task, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    onDoubleClick?.(task, e);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(task.id);
  };

  return (
    <div
      className="gantt-task-list-row"
      style={{
        height: rowHeight,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isSelected
          ? `${theme.primary}15`
          : isHovered
          ? `${theme.primary}08`
          : isEven
          ? theme.background
          : theme.backgroundAlt,
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {columns.map((col, colIndex) => {
        // Special handling for name column (first column with expander)
        if (colIndex === 0) {
          return (
            <div
              key={col.id}
              style={{
                width: col.width,
                minWidth: col.minWidth,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Indent based on level */}
              <div style={{ width: task.level * 16, flexShrink: 0 }} />

              {/* Expander for groups */}
              {isGroup && (
                <button
                  onClick={handleToggleClick}
                  style={{
                    width: 16,
                    height: 16,
                    padding: 0,
                    marginRight: 4,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textMuted,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                    style={{
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <path d="M2.5 3.5L5 6.5L7.5 3.5H2.5Z" />
                  </svg>
                </button>
              )}

              {/* Spacer for non-groups to align with groups */}
              {!isGroup && task.level > 0 && (
                <div style={{ width: 20, flexShrink: 0 }} />
              )}

              {/* Task name */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isGroup ? 600 : 400,
                  color: isGroup ? theme.text : theme.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={task.name}
              >
                {task.name}
              </span>
            </div>
          );
        }

        // Other columns
        const value = col.render
          ? col.render(task, rowIndex)
          : col.accessor
          ? typeof col.accessor === 'function'
            ? col.accessor(task)
            : (task as any)[col.accessor]
          : '';

        return (
          <div
            key={col.id}
            style={{
              width: col.width,
              minWidth: col.minWidth,
              padding: '0 8px',
              fontSize: 11,
              color: theme.textMuted,
              textAlign: col.align || 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
}

export default GanttTaskList;
