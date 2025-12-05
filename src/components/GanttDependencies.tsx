/**
 * GanttDependencies - Renders dependency arrows between tasks
 */

import { useMemo } from 'react';
import type { ComputedTask, GanttDependency, GanttTheme, DependencyType } from '../types';
import { getBarDimensions } from '../utils/position';

interface GanttDependenciesProps {
  tasks: ComputedTask[];
  dependencies: GanttDependency[];
  rowHeight: number;
  theme: Required<GanttTheme>;
}

export function GanttDependencies({
  tasks,
  dependencies,
  rowHeight,
  theme,
}: GanttDependenciesProps) {
  // Create task lookup map
  const taskMap = useMemo(() => {
    return new Map(tasks.map((t) => [t.id, t]));
  }, [tasks]);

  // Calculate arrow paths
  const arrows = useMemo(() => {
    return dependencies
      .map((dep) => {
        const fromTask = taskMap.get(dep.fromId);
        const toTask = taskMap.get(dep.toId);

        // Skip if either task doesn't exist or isn't visible
        if (!fromTask || !toTask || !fromTask.isVisible || !toTask.isVisible) {
          return null;
        }

        const path = calculateDependencyPath(
          fromTask,
          toTask,
          dep.type,
          rowHeight
        );

        return {
          id: `${dep.fromId}-${dep.toId}`,
          path,
          type: dep.type,
        };
      })
      .filter(Boolean) as Array<{ id: string; path: string; type: DependencyType }>;
  }, [dependencies, taskMap, rowHeight]);

  return (
    <g className="gantt-dependencies">
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="gantt-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,8 L8,4 z"
            fill={theme.dependency}
          />
        </marker>
      </defs>

      {/* Render arrows */}
      {arrows.map(({ id, path }) => (
        <path
          key={id}
          d={path}
          fill="none"
          stroke={theme.dependency}
          strokeWidth={1.5}
          markerEnd="url(#gantt-arrow)"
        />
      ))}
    </g>
  );
}

/**
 * Calculate the SVG path for a dependency arrow
 */
function calculateDependencyPath(
  fromTask: ComputedTask,
  toTask: ComputedTask,
  type: DependencyType,
  rowHeight: number
): string {
  const fromDims = getBarDimensions(fromTask.rowIndex, rowHeight);
  const toDims = getBarDimensions(toTask.rowIndex, rowHeight);

  // Calculate connection points based on dependency type
  let fromX: number;
  let fromY: number;
  let toX: number;
  let toY: number;

  const fromMidY = fromDims.taskBar.y + fromDims.taskBar.height / 2;
  const toMidY = toDims.taskBar.y + toDims.taskBar.height / 2;

  switch (type) {
    case 'finish-to-start':
      // From right edge of predecessor to left edge of successor
      fromX = fromTask.x + fromTask.width;
      fromY = fromMidY;
      toX = toTask.x - 4; // Leave space for arrow
      toY = toMidY;
      break;

    case 'start-to-start':
      // From left edge of both
      fromX = fromTask.x;
      fromY = fromMidY;
      toX = toTask.x - 4;
      toY = toMidY;
      break;

    case 'finish-to-finish':
      // From right edge of both
      fromX = fromTask.x + fromTask.width;
      fromY = fromMidY;
      toX = toTask.x + toTask.width + 4;
      toY = toMidY;
      break;

    case 'start-to-finish':
      // From left edge of predecessor to right edge of successor
      fromX = fromTask.x;
      fromY = fromMidY;
      toX = toTask.x + toTask.width + 4;
      toY = toMidY;
      break;

    default:
      // Default to finish-to-start
      fromX = fromTask.x + fromTask.width;
      fromY = fromMidY;
      toX = toTask.x - 4;
      toY = toMidY;
  }

  // Generate path based on relative positions
  return generateArrowPath(fromX, fromY, toX, toY, type, rowHeight);
}

/**
 * Generate smooth arrow path with proper routing
 */
function generateArrowPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  type: DependencyType,
  rowHeight: number
): string {
  const horizontalGap = 12; // Minimum horizontal space for routing
  const verticalOffset = rowHeight / 2 + 4; // Route above or below tasks

  // Simple case: tasks on same row, direct horizontal connection
  if (Math.abs(fromY - toY) < 5 && toX > fromX + horizontalGap) {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }

  if (type === 'finish-to-start' || type === 'start-to-start') {
    if (toX > fromX + horizontalGap) {
      // Normal case: successor is to the right
      // Route: right, down/up, right
      const midX = fromX + (toX - fromX) / 2;
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
      // Successor starts before predecessor ends - need to route around
      // Determine if we should go above or below
      const goBelow = fromY <= toY;
      const routeY = goBelow
        ? Math.max(fromY, toY) + verticalOffset
        : Math.min(fromY, toY) - verticalOffset;

      return `M ${fromX} ${fromY} L ${fromX + horizontalGap} ${fromY} L ${fromX + horizontalGap} ${routeY} L ${toX - horizontalGap} ${routeY} L ${toX - horizontalGap} ${toY} L ${toX} ${toY}`;
    }
  }

  if (type === 'finish-to-finish') {
    // Both connect from right side
    const maxX = Math.max(fromX, toX) + horizontalGap;
    return `M ${fromX} ${fromY} L ${maxX} ${fromY} L ${maxX} ${toY} L ${toX} ${toY}`;
  }

  if (type === 'start-to-finish') {
    // From left of predecessor to right of successor
    if (fromX < toX - horizontalGap) {
      const midX = fromX + (toX - fromX) / 2;
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
      const goBelow = fromY <= toY;
      const routeY = goBelow
        ? Math.max(fromY, toY) + verticalOffset
        : Math.min(fromY, toY) - verticalOffset;
      return `M ${fromX} ${fromY} L ${fromX - horizontalGap} ${fromY} L ${fromX - horizontalGap} ${routeY} L ${toX + horizontalGap} ${routeY} L ${toX + horizontalGap} ${toY} L ${toX} ${toY}`;
    }
  }

  // Default: simple L-shape path
  const midX = fromX + (toX - fromX) / 2;
  return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
}

export default GanttDependencies;
