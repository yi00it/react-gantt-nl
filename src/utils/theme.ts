/**
 * Default theme and theme utilities
 */

import type { GanttTheme } from '../types';

/**
 * Default light theme - aligned with Saharos design system
 */
export const defaultTheme: Required<GanttTheme> = {
  primary: '#10b981',           // Saharos accent green
  background: '#ffffff',
  backgroundAlt: '#f9fafb',
  text: '#111827',              // --text-main
  textMuted: '#6b7280',         // --text-muted
  border: '#e5e7eb',
  gridLine: '#f3f4f6',
  taskBar: '#3b82f6',           // Blue - main task color
  taskProgress: '#1d4ed8',      // Darker blue for progress
  baseline: '#d1d5db',          // Light gray for baseline comparison
  critical: '#ef4444',          // Red for critical path
  milestone: '#10b981',         // Green accent for milestones (achievements)
  group: '#475569',             // Slate for group/summary bars
  todayMarker: 'rgba(16, 185, 129, 0.15)', // Accent green with transparency
  weekend: 'rgba(0, 0, 0, 0.02)',
  dependency: '#94a3b8',        // Slate for dependency arrows
  tooltipBackground: '#111827', // --text-main (dark)
  tooltipText: '#f9fafb',       // --text-invert
};

/**
 * Dark theme preset - aligned with Saharos design system
 */
export const darkTheme: Required<GanttTheme> = {
  primary: '#34d399',           // Lighter green for dark mode
  background: '#111827',        // Dark background
  backgroundAlt: '#1f2937',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  border: '#374151',
  gridLine: '#1f2937',
  taskBar: '#60a5fa',           // Lighter blue for dark mode
  taskProgress: '#93c5fd',      // Even lighter blue for progress
  baseline: '#4b5563',          // Medium gray for baseline
  critical: '#f87171',          // Lighter red for dark mode
  milestone: '#34d399',         // Lighter green for milestones
  group: '#6b7280',             // Gray for groups
  todayMarker: 'rgba(52, 211, 153, 0.2)', // Green with transparency
  weekend: 'rgba(255, 255, 255, 0.02)',
  dependency: '#6b7280',
  tooltipBackground: '#374151',
  tooltipText: '#f9fafb',
};

/**
 * Merge user theme with defaults
 */
export function mergeTheme(userTheme?: GanttTheme): Required<GanttTheme> {
  if (!userTheme) return defaultTheme;
  return { ...defaultTheme, ...userTheme };
}

/**
 * Generate CSS custom properties from theme
 */
export function themeToCssVars(theme: Required<GanttTheme>): Record<string, string> {
  return {
    '--gantt-primary': theme.primary,
    '--gantt-background': theme.background,
    '--gantt-background-alt': theme.backgroundAlt,
    '--gantt-text': theme.text,
    '--gantt-text-muted': theme.textMuted,
    '--gantt-border': theme.border,
    '--gantt-grid-line': theme.gridLine,
    '--gantt-task-bar': theme.taskBar,
    '--gantt-task-progress': theme.taskProgress,
    '--gantt-baseline': theme.baseline,
    '--gantt-critical': theme.critical,
    '--gantt-milestone': theme.milestone,
    '--gantt-group': theme.group,
    '--gantt-today-marker': theme.todayMarker,
    '--gantt-weekend': theme.weekend,
    '--gantt-dependency': theme.dependency,
    '--gantt-tooltip-background': theme.tooltipBackground,
    '--gantt-tooltip-text': theme.tooltipText,
  };
}
