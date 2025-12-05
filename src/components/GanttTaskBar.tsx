/**
 * GanttTaskBar - Renders a single task bar with baseline support
 *
 * This component handles:
 * - Current schedule bar (colored)
 * - Baseline bar (gray, below current bar)
 * - Progress indicator
 * - Milestone rendering
 * - Group/summary bar rendering
 * - Critical path highlighting
 */

import React, { useMemo } from 'react';
import type { ComputedTask, GanttTheme } from '../types';
import { getBarDimensions } from '../utils/position';

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface GanttTaskBarProps {
  task: ComputedTask;
  rowHeight: number;
  theme: Required<GanttTheme>;
  showBaseline?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onMouseEnter?: (task: ComputedTask, event: React.MouseEvent) => void;
  onMouseLeave?: (task: ComputedTask, event: React.MouseEvent) => void;
  onClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onDoubleClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onDragStart?: (task: ComputedTask, event: React.MouseEvent, mode: DragMode) => void;
}

export function GanttTaskBar({
  task,
  rowHeight,
  theme,
  showBaseline = true,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
  onDragStart,
}: GanttTaskBarProps) {
  const dims = useMemo(
    () => getBarDimensions(task.rowIndex, rowHeight),
    [task.rowIndex, rowHeight]
  );

  // Get colors based on task state
  const colors = useMemo(() => {
    // Custom colors from task styles take priority
    const baseColor = task.styles?.backgroundColor || task.color || theme.taskBar;
    const progressColor = task.styles?.progressColor || theme.taskProgress;
    const baselineColor = task.styles?.baselineColor || theme.baseline;

    // Critical path override
    if (task.isCritical) {
      return {
        bar: theme.critical,
        progress: adjustColor(theme.critical, 0.3),
        baseline: baselineColor,
      };
    }

    // Group tasks
    if (task.type === 'group') {
      return {
        bar: theme.group,
        progress: adjustColor(theme.group, 0.3),
        baseline: baselineColor,
      };
    }

    return {
      bar: baseColor,
      progress: progressColor,
      baseline: baselineColor,
    };
  }, [task, theme]);

  // Event handlers
  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter?.(task, e);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    onMouseLeave?.(task, e);
  };

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(task, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    onDoubleClick?.(task, e);
  };

  const handleDragStart = (mode: DragMode) => (e: React.MouseEvent) => {
    if (task.isDisabled) return;
    onDragStart?.(task, e, mode);
  };

  // Don't render invisible tasks
  if (!task.isVisible) return null;

  // Render milestone (diamond shape)
  if (task.type === 'milestone') {
    return (
      <g
        className="gantt-task-milestone"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Baseline milestone (if exists) */}
        {showBaseline && task.baselineX !== undefined && (
          <polygon
            points={getMilestonePoints(
              task.baselineX,
              dims.baselineBar.y + dims.baselineBar.height / 2,
              dims.baselineBar.height * 0.8
            )}
            fill={colors.baseline}
          />
        )}

        {/* Current milestone */}
        <polygon
          points={getMilestonePoints(
            task.x,
            dims.taskBar.y + dims.taskBar.height / 2,
            dims.taskBar.height * 0.8
          )}
          fill={task.isCritical ? theme.critical : theme.milestone}
          stroke={isSelected || isHovered ? theme.primary : 'none'}
          strokeWidth={isSelected || isHovered ? 2 : 0}
        />
      </g>
    );
  }

  // Render group/summary bar (bracket style)
  if (task.type === 'group') {
    const groupHeight = dims.taskBar.height * 0.4;
    const y = dims.taskBar.y + dims.taskBar.height - groupHeight;

    return (
      <g
        className="gantt-task-group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Baseline group bar (if exists) */}
        {showBaseline && task.baselineX !== undefined && task.baselineWidth !== undefined && (
          <g className="gantt-task-baseline">
            <rect
              x={task.baselineX}
              y={dims.baselineBar.y}
              width={task.baselineWidth}
              height={dims.baselineBar.height}
              rx={dims.baselineBar.cornerRadius}
              fill={colors.baseline}
            />
          </g>
        )}

        {/* Main group bar */}
        <rect
          x={task.x}
          y={y}
          width={task.width}
          height={groupHeight}
          fill={colors.bar}
        />

        {/* Left bracket */}
        <rect
          x={task.x}
          y={y}
          width={3}
          height={groupHeight + 4}
          fill={colors.bar}
        />

        {/* Right bracket */}
        <rect
          x={task.x + task.width - 3}
          y={y}
          width={3}
          height={groupHeight + 4}
          fill={colors.bar}
        />

        {/* Progress */}
        {task.progress > 0 && (
          <rect
            x={task.x}
            y={y + groupHeight - 2}
            width={(task.width * task.progress) / 100}
            height={2}
            fill={colors.progress}
          />
        )}
      </g>
    );
  }

  // Render normal task bar
  const progressWidth = (task.width * task.progress) / 100;

  return (
    <g
      className="gantt-task-bar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart('move')}
      style={{ cursor: task.isDisabled ? 'default' : 'grab' }}
    >
      {/* ========== BASELINE BAR ========== */}
      {/* This is rendered FIRST (below task bar in z-order) */}
      {showBaseline && task.baselineX !== undefined && task.baselineWidth !== undefined && (
        <rect
          className="gantt-task-baseline-bar"
          x={task.baselineX}
          y={dims.baselineBar.y}
          width={task.baselineWidth}
          height={dims.baselineBar.height}
          rx={dims.baselineBar.cornerRadius}
          fill={colors.baseline}
        />
      )}

      {/* ========== CURRENT SCHEDULE BAR ========== */}
      {/* Background bar */}
      <rect
        className="gantt-task-bar-bg"
        x={task.x}
        y={dims.taskBar.y}
        width={task.width}
        height={dims.taskBar.height}
        rx={dims.taskBar.cornerRadius}
        fill={colors.bar}
        stroke={isSelected ? theme.primary : isHovered ? theme.primary : 'none'}
        strokeWidth={isSelected ? 2 : isHovered ? 1 : 0}
        opacity={isHovered ? 0.9 : 1}
      />

      {/* Progress bar */}
      {task.progress > 0 && (
        <rect
          className="gantt-task-bar-progress"
          x={task.x}
          y={dims.taskBar.y}
          width={progressWidth}
          height={dims.taskBar.height}
          rx={dims.taskBar.cornerRadius}
          fill={colors.progress}
          // Clip right side if not 100%
          clipPath={
            task.progress < 100
              ? `inset(0 ${task.width - progressWidth}px 0 0 round ${dims.taskBar.cornerRadius}px)`
              : undefined
          }
        />
      )}

      {/* Progress bar right edge fix (for partial progress) */}
      {task.progress > 0 && task.progress < 100 && (
        <rect
          className="gantt-task-bar-progress-edge"
          x={task.x + progressWidth - 2}
          y={dims.taskBar.y}
          width={2}
          height={dims.taskBar.height}
          fill={colors.progress}
        />
      )}

      {/* Resize handles (invisible, just for hit area) */}
      {!task.isDisabled && (
        <>
          {/* Left resize handle */}
          <rect
            className="gantt-task-resize-left"
            x={task.x}
            y={dims.taskBar.y}
            width={8}
            height={dims.taskBar.height}
            fill="transparent"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart('resize-left')(e);
            }}
          />
          {/* Right resize handle */}
          <rect
            className="gantt-task-resize-right"
            x={task.x + task.width - 8}
            y={dims.taskBar.y}
            width={8}
            height={dims.taskBar.height}
            fill="transparent"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart('resize-right')(e);
            }}
          />
        </>
      )}
    </g>
  );
}

/**
 * Generate diamond points for milestone
 */
function getMilestonePoints(cx: number, cy: number, size: number): string {
  const half = size / 2;
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;
}

/**
 * Adjust color brightness/opacity
 */
function adjustColor(color: string, factor: number): string {
  // Simple implementation - for production, use a proper color library
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * (1 + factor));
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * (1 + factor));
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * (1 + factor));
    return `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
  }
  return color;
}

/**
 * Render all task bars
 */
interface GanttTaskBarsProps {
  tasks: ComputedTask[];
  rowHeight: number;
  theme: Required<GanttTheme>;
  showBaseline?: boolean;
  selectedTaskId?: string | null;
  hoveredTaskId?: string | null;
  onTaskMouseEnter?: (task: ComputedTask, event: React.MouseEvent) => void;
  onTaskMouseLeave?: (task: ComputedTask, event: React.MouseEvent) => void;
  onTaskClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onTaskDoubleClick?: (task: ComputedTask, event: React.MouseEvent) => void;
  onTaskDragStart?: (task: ComputedTask, event: React.MouseEvent, mode: DragMode) => void;
}

export function GanttTaskBars({
  tasks,
  rowHeight,
  theme,
  showBaseline = true,
  selectedTaskId,
  hoveredTaskId,
  onTaskMouseEnter,
  onTaskMouseLeave,
  onTaskClick,
  onTaskDoubleClick,
  onTaskDragStart,
}: GanttTaskBarsProps) {
  return (
    <g className="gantt-task-bars">
      {tasks.map((task) => (
        <GanttTaskBar
          key={task.id}
          task={task}
          rowHeight={rowHeight}
          theme={theme}
          showBaseline={showBaseline}
          isSelected={selectedTaskId === task.id}
          isHovered={hoveredTaskId === task.id}
          onMouseEnter={onTaskMouseEnter}
          onMouseLeave={onTaskMouseLeave}
          onClick={onTaskClick}
          onDoubleClick={onTaskDoubleClick}
          onDragStart={onTaskDragStart}
        />
      ))}
    </g>
  );
}

export default GanttTaskBar;
