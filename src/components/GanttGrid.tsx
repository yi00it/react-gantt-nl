/**
 * GanttGrid - Renders the timeline grid background
 */

import React, { useMemo } from 'react';
import type { ViewMode, DateRange, GanttTheme } from '../types';
import {
  generateDateGrid,
  formatDate,
  isWeekend,
  isToday,
  getColumnWidth,
  getMonthName,
} from '../utils/date';
import { dateToX, calculateChartWidth } from '../utils/position';

interface GanttGridProps {
  dateRange: DateRange;
  viewMode: ViewMode;
  rowCount: number;
  rowHeight: number;
  headerHeight: number;
  theme: Required<GanttTheme>;
  locale?: string;
  firstDayOfWeek?: 0 | 1;
  showWeekends?: boolean;
  showTodayMarker?: boolean;
  extraHeight?: number;
}

export function GanttGrid({
  dateRange,
  viewMode,
  rowCount,
  rowHeight,
  headerHeight: _headerHeight,
  theme,
  locale: _locale = 'en-US',
  firstDayOfWeek = 1,
  showWeekends = true,
  showTodayMarker = true,
  extraHeight = 0,
}: GanttGridProps) {
  const chartWidth = calculateChartWidth(dateRange, viewMode);
  const chartHeight = rowCount * rowHeight + extraHeight;
  const columnWidth = getColumnWidth(viewMode);

  // Generate grid dates
  const gridDates = useMemo(
    () => generateDateGrid(dateRange, viewMode, firstDayOfWeek),
    [dateRange, viewMode, firstDayOfWeek]
  );

  // Generate row backgrounds (zebra striping)
  const rowBackgrounds = useMemo(() => {
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < rowCount; i++) {
      rows.push(
        <rect
          key={`row-${i}`}
          x={0}
          y={i * rowHeight}
          width={chartWidth}
          height={rowHeight}
          fill={i % 2 === 0 ? theme.background : theme.backgroundAlt}
        />
      );
    }
    return rows;
  }, [rowCount, rowHeight, chartWidth, theme]);

  // Generate weekend backgrounds (for day view)
  const weekendBackgrounds = useMemo(() => {
    if (!showWeekends || viewMode !== 'day') return null;

    const weekends: React.ReactNode[] = [];
    gridDates.forEach((date, index) => {
      if (isWeekend(date)) {
        weekends.push(
          <rect
            key={`weekend-${index}`}
            x={index * columnWidth}
            y={0}
            width={columnWidth}
            height={chartHeight}
            fill={theme.weekend}
          />
        );
      }
    });
    return weekends;
  }, [showWeekends, viewMode, gridDates, columnWidth, chartHeight, theme]);

  // Generate vertical grid lines (skip first line at x=0 to avoid double border)
  const verticalLines = useMemo(() => {
    return gridDates.slice(1).map((_, index) => (
      <line
        key={`vline-${index + 1}`}
        x1={(index + 1) * columnWidth}
        y1={0}
        x2={(index + 1) * columnWidth}
        y2={chartHeight}
        stroke={theme.gridLine}
        strokeWidth={1}
      />
    ));
  }, [gridDates, columnWidth, chartHeight, theme]);

  // Generate horizontal grid lines (skip first and last to avoid double borders)
  const horizontalLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let i = 1; i < rowCount; i++) {
      lines.push(
        <line
          key={`hline-${i}`}
          x1={0}
          y1={i * rowHeight}
          x2={chartWidth}
          y2={i * rowHeight}
          stroke={theme.gridLine}
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, [rowCount, rowHeight, chartWidth, theme]);

  // Today marker
  const todayMarker = useMemo(() => {
    if (!showTodayMarker) return null;

    const today = new Date();
    if (today < dateRange.start || today > dateRange.end) return null;

    const x = dateToX(today, dateRange, chartWidth);
    return (
      <g>
        <rect
          x={x - 1}
          y={0}
          width={2}
          height={chartHeight}
          fill={theme.primary}
          opacity={0.3}
        />
        <line
          x1={x}
          y1={0}
          x2={x}
          y2={chartHeight}
          stroke={theme.primary}
          strokeWidth={1}
          strokeDasharray="4 2"
        />
      </g>
    );
  }, [showTodayMarker, dateRange, chartWidth, chartHeight, theme]);

  return (
    <g className="gantt-grid">
      {/* Row backgrounds */}
      <g className="gantt-grid-rows">{rowBackgrounds}</g>

      {/* Weekend backgrounds */}
      {weekendBackgrounds && (
        <g className="gantt-grid-weekends">{weekendBackgrounds}</g>
      )}

      {/* Vertical lines */}
      <g className="gantt-grid-vlines">{verticalLines}</g>

      {/* Horizontal lines */}
      <g className="gantt-grid-hlines">{horizontalLines}</g>

      {/* Today marker */}
      {todayMarker && <g className="gantt-grid-today">{todayMarker}</g>}
    </g>
  );
}

/**
 * Separate header component for the timeline
 */
export function GanttGridHeader({
  dateRange,
  viewMode,
  headerHeight,
  theme,
  locale = 'en-US',
  firstDayOfWeek = 1,
}: Omit<GanttGridProps, 'rowCount' | 'rowHeight' | 'showWeekends' | 'showTodayMarker'>) {
  const chartWidth = calculateChartWidth(dateRange, viewMode);
  const columnWidth = getColumnWidth(viewMode);

  const gridDates = useMemo(
    () => generateDateGrid(dateRange, viewMode, firstDayOfWeek),
    [dateRange, viewMode, firstDayOfWeek]
  );

  // Determine if we need a two-row header
  const hasTwoRows = viewMode === 'day' || viewMode === 'week';
  const topRowHeight = hasTwoRows ? headerHeight * 0.4 : 0;
  const bottomRowHeight = hasTwoRows ? headerHeight * 0.6 : headerHeight;

  return (
    <svg
      width={chartWidth}
      height={headerHeight}
      className="gantt-grid-header"
      style={{ display: 'block' }}
    >
      {/* Header background */}
      <rect
        x={0}
        y={0}
        width={chartWidth}
        height={headerHeight}
        fill={theme.background}
      />

      {/* Top row labels (months) */}
      {hasTwoRows && (
        <g className="gantt-header-top">
          {(() => {
            const labels: React.ReactNode[] = [];
            let currentMonth = -1;
            let monthStartX = 0;

            gridDates.forEach((date, index) => {
              const month = date.getMonth();
              const x = index * columnWidth;

              if (month !== currentMonth) {
                if (currentMonth !== -1 && index > 0) {
                  // Draw separator
                  labels.push(
                    <line
                      key={`sep-${index}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={topRowHeight}
                      stroke={theme.border}
                      strokeWidth={1}
                    />
                  );
                }
                currentMonth = month;
                monthStartX = x;
              }

              // Add label at month start
              if (date.getDate() <= 7 || index === 0) {
                const monthWidth = gridDates.filter(
                  (d) => d.getMonth() === month && d.getFullYear() === date.getFullYear()
                ).length * columnWidth;

                if (monthWidth > 60) {
                  labels.push(
                    <text
                      key={`month-${month}-${date.getFullYear()}`}
                      x={monthStartX + 8}
                      y={topRowHeight - 6}
                      fontSize={11}
                      fill={theme.textMuted}
                      fontWeight={500}
                    >
                      {getMonthName(date, locale, 'short')} {date.getFullYear()}
                    </text>
                  );
                }
              }
            });

            return labels;
          })()}
        </g>
      )}

      {/* Row separator */}
      {hasTwoRows && (
        <line
          x1={0}
          y1={topRowHeight}
          x2={chartWidth}
          y2={topRowHeight}
          stroke={theme.border}
          strokeWidth={1}
        />
      )}

      {/* Bottom row labels (days/weeks/months) */}
      <g className="gantt-header-bottom">
        {gridDates.map((date, index) => {
          const x = index * columnWidth;
          const label = formatDate(date, viewMode, locale);
          const isWeekendDay = isWeekend(date);
          const isTodayDay = isToday(date);

          return (
            <g key={`cell-${index}`}>
              {/* Cell separator - skip first one (x=0) to avoid double border */}
              {index > 0 && (
                <line
                  x1={x}
                  y1={hasTwoRows ? topRowHeight : 0}
                  x2={x}
                  y2={headerHeight}
                  stroke={theme.gridLine}
                  strokeWidth={1}
                />
              )}
              {/* Label */}
              <text
                x={x + columnWidth / 2}
                y={hasTwoRows ? topRowHeight + bottomRowHeight / 2 + 4 : headerHeight / 2 + 4}
                fontSize={11}
                fill={isTodayDay ? theme.primary : isWeekendDay ? theme.textMuted : theme.text}
                fontWeight={isTodayDay ? 600 : 400}
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default GanttGrid;
