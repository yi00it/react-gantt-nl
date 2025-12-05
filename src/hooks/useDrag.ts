/**
 * useDrag - Hook for handling drag and resize interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ComputedTask, DateRange, ViewMode } from '../types';
import { xToDate, dateToX, snapToGrid } from '../utils/position';
import { startOfDay, addDays, diffInDays } from '../utils/date';

type DragMode = 'move' | 'resize-left' | 'resize-right' | null;

interface DragState {
  task: ComputedTask;
  mode: DragMode;
  startX: number;
  startTaskX: number;
  startTaskWidth: number;
  originalStart: Date;
  originalEnd: Date;
}

interface UseDragOptions {
  dateRange: DateRange;
  chartWidth: number;
  viewMode: ViewMode;
  allowDrag?: boolean;
  allowResize?: boolean;
  onDragStart?: (task: ComputedTask) => void;
  onDragMove?: (task: ComputedTask, newStart: Date, newEnd: Date) => void;
  onDragEnd?: (task: ComputedTask, newStart: Date, newEnd: Date, cancelled: boolean, isResize: boolean) => void;
}

interface UseDragResult {
  isDragging: boolean;
  draggedTask: ComputedTask | null;
  previewStart: Date | null;
  previewEnd: Date | null;
  handleMouseDown: (
    task: ComputedTask,
    event: React.MouseEvent,
    mode: DragMode
  ) => void;
  getDragPreviewX: () => number | null;
  getDragPreviewWidth: () => number | null;
}

export function useDrag({
  dateRange,
  chartWidth,
  viewMode,
  allowDrag = true,
  allowResize = true,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UseDragOptions): UseDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const [previewStart, setPreviewStart] = useState<Date | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Date | null>(null);

  const dragState = useRef<DragState | null>(null);

  // Use refs for values that change during drag to avoid effect re-runs
  const previewStartRef = useRef<Date | null>(null);
  const previewEndRef = useRef<Date | null>(null);
  const dateRangeRef = useRef(dateRange);
  const chartWidthRef = useRef(chartWidth);
  const viewModeRef = useRef(viewMode);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);

  // Keep refs in sync
  dateRangeRef.current = dateRange;
  chartWidthRef.current = chartWidth;
  viewModeRef.current = viewMode;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;

  // Handle mouse down on task bar
  const handleMouseDown = useCallback(
    (task: ComputedTask, event: React.MouseEvent, mode: DragMode) => {
      if (task.isDisabled) return;
      if (!mode) return;
      if (mode === 'move' && !allowDrag) return;
      if ((mode === 'resize-left' || mode === 'resize-right') && !allowResize) return;

      event.preventDefault();
      event.stopPropagation();

      dragState.current = {
        task,
        mode,
        startX: event.clientX,
        startTaskX: task.x,
        startTaskWidth: task.width,
        originalStart: task.start,
        originalEnd: task.end,
      };

      // Update both state and refs
      previewStartRef.current = task.start;
      previewEndRef.current = task.end;
      setIsDragging(true);
      setPreviewStart(task.start);
      setPreviewEnd(task.end);

      onDragStart?.(task);
    },
    [allowDrag, allowResize, onDragStart]
  );

  // Handle mouse move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const state = dragState.current;
      if (!state) return;

      const currentDateRange = dateRangeRef.current;
      const currentChartWidth = chartWidthRef.current;
      const currentViewMode = viewModeRef.current;

      const deltaX = event.clientX - state.startX;
      let newStart: Date;
      let newEnd: Date;

      switch (state.mode) {
        case 'move': {
          // Calculate new position
          const newX = state.startTaskX + deltaX;
          const snappedX = snapToGrid(newX, currentDateRange, currentChartWidth, currentViewMode);
          newStart = xToDate(snappedX, currentDateRange, currentChartWidth);

          // Maintain duration
          const duration = diffInDays(state.originalStart, state.originalEnd);
          newEnd = addDays(newStart, duration);
          break;
        }

        case 'resize-left': {
          // Only change start date
          const newX = state.startTaskX + deltaX;
          const snappedX = snapToGrid(newX, currentDateRange, currentChartWidth, currentViewMode);
          newStart = xToDate(snappedX, currentDateRange, currentChartWidth);
          newEnd = state.originalEnd;

          // Ensure start is before end (minimum 1 day)
          if (newStart >= newEnd) {
            newStart = addDays(newEnd, -1);
          }
          break;
        }

        case 'resize-right': {
          // Only change end date
          const newWidth = state.startTaskWidth + deltaX;
          const newEndX = state.startTaskX + newWidth;
          const snappedEndX = snapToGrid(newEndX, currentDateRange, currentChartWidth, currentViewMode);
          newStart = state.originalStart;
          newEnd = xToDate(snappedEndX, currentDateRange, currentChartWidth);

          // Ensure end is after start (minimum 1 day)
          if (newEnd <= newStart) {
            newEnd = addDays(newStart, 1);
          }
          break;
        }

        default:
          return;
      }

      // Normalize to start of day
      newStart = startOfDay(newStart);
      newEnd = startOfDay(newEnd);

      // Update both refs and state
      previewStartRef.current = newStart;
      previewEndRef.current = newEnd;
      setPreviewStart(newStart);
      setPreviewEnd(newEnd);

      onDragMoveRef.current?.(state.task, newStart, newEnd);
    };

    const handleMouseUp = (_event: MouseEvent) => {
      const state = dragState.current;
      if (!state) return;

      const currentPreviewStart = previewStartRef.current;
      const currentPreviewEnd = previewEndRef.current;

      setIsDragging(false);

      // Determine if actually moved
      const moved =
        currentPreviewStart &&
        currentPreviewEnd &&
        (currentPreviewStart.getTime() !== state.originalStart.getTime() ||
          currentPreviewEnd.getTime() !== state.originalEnd.getTime());

      const isResize = state.mode === 'resize-left' || state.mode === 'resize-right';

      onDragEndRef.current?.(
        state.task,
        currentPreviewStart || state.originalStart,
        currentPreviewEnd || state.originalEnd,
        !moved,
        isResize
      );

      // Clear state
      previewStartRef.current = null;
      previewEndRef.current = null;
      setPreviewStart(null);
      setPreviewEnd(null);
      dragState.current = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const state = dragState.current;
        if (!state) return;

        const isResize = state.mode === 'resize-left' || state.mode === 'resize-right';

        setIsDragging(false);
        previewStartRef.current = null;
        previewEndRef.current = null;
        setPreviewStart(null);
        setPreviewEnd(null);

        onDragEndRef.current?.(state.task, state.originalStart, state.originalEnd, true, isResize);
        dragState.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging]); // Only depend on isDragging - use refs for everything else

  // Get preview X position
  const getDragPreviewX = useCallback(() => {
    if (!previewStart) return null;
    return dateToX(previewStart, dateRange, chartWidth);
  }, [previewStart, dateRange, chartWidth]);

  // Get preview width
  const getDragPreviewWidth = useCallback(() => {
    if (!previewStart || !previewEnd) return null;
    const startX = dateToX(previewStart, dateRange, chartWidth);
    const endX = dateToX(previewEnd, dateRange, chartWidth);
    return endX - startX;
  }, [previewStart, previewEnd, dateRange, chartWidth]);

  return {
    isDragging,
    draggedTask: isDragging && dragState.current ? dragState.current.task : null,
    previewStart,
    previewEnd,
    handleMouseDown,
    getDragPreviewX,
    getDragPreviewWidth,
  };
}

export default useDrag;
