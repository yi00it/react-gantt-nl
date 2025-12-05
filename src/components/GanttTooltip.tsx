/**
 * GanttTooltip - Tooltip for task details on hover
 */

import React, { useEffect, useState, useRef } from 'react';
import type { ComputedTask, GanttTheme } from '../types';
import { formatDateCompact } from '../utils/date';

interface GanttTooltipProps {
  task: ComputedTask | null;
  mousePosition: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLElement>;
  theme: Required<GanttTheme>;
  renderContent?: (task: ComputedTask) => React.ReactNode;
}

export function GanttTooltip({
  task,
  mousePosition,
  containerRef,
  theme,
  renderContent,
}: GanttTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate tooltip position
  useEffect(() => {
    if (!task || !mousePosition || !tooltipRef.current || !containerRef.current) {
      return;
    }

    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Default position: to the right and slightly below cursor
    let x = mousePosition.x + 12;
    let y = mousePosition.y + 12;

    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();

    // Adjust if tooltip would go off the right edge
    if (x + tooltipRect.width > containerRect.width) {
      x = mousePosition.x - tooltipRect.width - 12;
    }

    // Adjust if tooltip would go off the bottom edge
    if (y + tooltipRect.height > containerRect.height) {
      y = mousePosition.y - tooltipRect.height - 12;
    }

    // Ensure tooltip stays within container
    x = Math.max(8, Math.min(x, containerRect.width - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, containerRect.height - tooltipRect.height - 8));

    setPosition({ x, y });
  }, [task, mousePosition, containerRef]);

  if (!task || !mousePosition) {
    return null;
  }

  // Custom content renderer
  if (renderContent) {
    return (
      <div
        ref={tooltipRef}
        className="gantt-tooltip"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {renderContent(task)}
      </div>
    );
  }

  // Default tooltip content
  return (
    <div
      ref={tooltipRef}
      className="gantt-tooltip"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: 'none',
        backgroundColor: theme.tooltipBackground,
        color: theme.tooltipText,
        padding: '10px 12px',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: 180,
        fontSize: 12,
      }}
    >
      {/* Task name */}
      <div
        style={{
          fontWeight: 500,
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: `1px solid ${theme.tooltipText}20`,
        }}
      >
        {task.name}
      </div>

      {/* Task details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TooltipRow
          label="Start"
          value={formatDateCompact(task.start)}
          theme={theme}
        />
        <TooltipRow
          label="End"
          value={formatDateCompact(task.end)}
          theme={theme}
        />
        <TooltipRow
          label="Progress"
          value={`${task.progress}%`}
          theme={theme}
        />

        {/* Baseline dates (if exists) */}
        {task.baselineStart && task.baselineEnd && (
          <>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${theme.tooltipText}20`,
                fontSize: 10,
                color: `${theme.tooltipText}80`,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Baseline
            </div>
            <TooltipRow
              label="Start"
              value={formatDateCompact(task.baselineStart)}
              theme={theme}
              muted
            />
            <TooltipRow
              label="End"
              value={formatDateCompact(task.baselineEnd)}
              theme={theme}
              muted
            />
          </>
        )}

        {/* Critical path indicator */}
        {task.isCritical && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${theme.tooltipText}20`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: `${theme.tooltipText}90`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.critical,
              }}
            />
            Critical Path
          </div>
        )}
      </div>
    </div>
  );
}

interface TooltipRowProps {
  label: string;
  value: string;
  theme: Required<GanttTheme>;
  muted?: boolean;
}

function TooltipRow({ label, value, theme, muted }: TooltipRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
      }}
    >
      <span style={{ color: `${theme.tooltipText}70` }}>{label}</span>
      <span
        style={{
          color: muted ? `${theme.tooltipText}70` : theme.tooltipText,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default GanttTooltip;
