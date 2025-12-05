/**
 * useScroll - Hook for synchronized scrolling between task list and chart
 */

import { useRef, useCallback, useEffect } from 'react';

interface UseScrollOptions {
  taskListRef: React.RefObject<HTMLElement>;
  chartRef: React.RefObject<HTMLElement>;
}

export function useScroll({ taskListRef, chartRef }: UseScrollOptions) {
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number>();

  // Sync vertical scroll from task list to chart
  const handleTaskListScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    if (!taskListRef.current || !chartRef.current) return;

    isScrollingRef.current = true;
    chartRef.current.scrollTop = taskListRef.current.scrollTop;

    // Reset flag after a short delay
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  }, [taskListRef, chartRef]);

  // Sync vertical scroll from chart to task list
  const handleChartScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    if (!taskListRef.current || !chartRef.current) return;

    isScrollingRef.current = true;
    taskListRef.current.scrollTop = chartRef.current.scrollTop;

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  }, [taskListRef, chartRef]);

  // Set up scroll listeners
  useEffect(() => {
    const taskList = taskListRef.current;
    const chart = chartRef.current;

    if (taskList) {
      taskList.addEventListener('scroll', handleTaskListScroll);
    }
    if (chart) {
      chart.addEventListener('scroll', handleChartScroll);
    }

    return () => {
      if (taskList) {
        taskList.removeEventListener('scroll', handleTaskListScroll);
      }
      if (chart) {
        chart.removeEventListener('scroll', handleChartScroll);
      }
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [taskListRef, chartRef, handleTaskListScroll, handleChartScroll]);

  return {
    handleTaskListScroll,
    handleChartScroll,
  };
}

export default useScroll;
