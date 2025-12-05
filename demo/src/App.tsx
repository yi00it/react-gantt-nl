import React, { useState, useCallback, useEffect } from 'react';
import {
  Gantt,
  GanttTask,
  GanttDependency,
  GanttColumn,
  GanttConfig,
  GanttTheme,
  ViewMode,
  TaskDateChangeEvent,
  TaskProgressChangeEvent,
  TaskClickEvent,
} from 'react-gantt-nl';

// Helper to create dates relative to today
const today = new Date();
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Initial sample data
const initialTasks: GanttTask[] = [
  {
    id: 'project',
    name: 'Website Redesign Project',
    type: 'group',
    start: addDays(today, -10),
    end: addDays(today, 45),
    progress: 35,
  },
  {
    id: 'phase1',
    name: 'Phase 1: Planning',
    type: 'group',
    start: addDays(today, -10),
    end: addDays(today, 5),
    progress: 100,
    parentId: 'project',
  },
  {
    id: 'task1',
    name: 'Requirements Gathering',
    type: 'task',
    start: addDays(today, -10),
    end: addDays(today, -5),
    progress: 100,
    parentId: 'phase1',
    baselineStart: addDays(today, -12),
    baselineEnd: addDays(today, -7),
  },
  {
    id: 'task2',
    name: 'Stakeholder Interviews',
    type: 'task',
    start: addDays(today, -5),
    end: addDays(today, 0),
    progress: 100,
    parentId: 'phase1',
    baselineStart: addDays(today, -7),
    baselineEnd: addDays(today, -2),
  },
  {
    id: 'milestone1',
    name: 'Planning Complete',
    type: 'milestone',
    start: addDays(today, 5),
    end: addDays(today, 5),
    progress: 0,
    parentId: 'phase1',
    baselineStart: addDays(today, 0),
    baselineEnd: addDays(today, 0),
  },
  {
    id: 'phase2',
    name: 'Phase 2: Design',
    type: 'group',
    start: addDays(today, 6),
    end: addDays(today, 25),
    progress: 40,
    parentId: 'project',
  },
  {
    id: 'task3',
    name: 'Wireframes',
    type: 'task',
    start: addDays(today, 6),
    end: addDays(today, 12),
    progress: 80,
    parentId: 'phase2',
    isCritical: true,
    baselineStart: addDays(today, 3),
    baselineEnd: addDays(today, 9),
  },
  {
    id: 'task4',
    name: 'Visual Design',
    type: 'task',
    start: addDays(today, 10),
    end: addDays(today, 20),
    progress: 30,
    parentId: 'phase2',
    isCritical: true,
    baselineStart: addDays(today, 8),
    baselineEnd: addDays(today, 16),
    color: '#a855f7',
  },
  {
    id: 'task5',
    name: 'Design Review',
    type: 'task',
    start: addDays(today, 20),
    end: addDays(today, 23),
    progress: 0,
    parentId: 'phase2',
    baselineStart: addDays(today, 16),
    baselineEnd: addDays(today, 18),
  },
  {
    id: 'milestone2',
    name: 'Design Approved',
    type: 'milestone',
    start: addDays(today, 25),
    end: addDays(today, 25),
    progress: 0,
    parentId: 'phase2',
  },
  {
    id: 'phase3',
    name: 'Phase 3: Development',
    type: 'group',
    start: addDays(today, 26),
    end: addDays(today, 45),
    progress: 0,
    parentId: 'project',
  },
  {
    id: 'task6',
    name: 'Frontend Development',
    type: 'task',
    start: addDays(today, 26),
    end: addDays(today, 38),
    progress: 0,
    parentId: 'phase3',
    isCritical: true,
    color: '#38bdf8',
  },
  {
    id: 'task7',
    name: 'Backend Development',
    type: 'task',
    start: addDays(today, 26),
    end: addDays(today, 35),
    progress: 0,
    parentId: 'phase3',
    color: '#34d399',
  },
  {
    id: 'task8',
    name: 'Integration Testing',
    type: 'task',
    start: addDays(today, 36),
    end: addDays(today, 42),
    progress: 0,
    parentId: 'phase3',
    isCritical: true,
  },
  {
    id: 'milestone3',
    name: 'Go Live',
    type: 'milestone',
    start: addDays(today, 45),
    end: addDays(today, 45),
    progress: 0,
    parentId: 'phase3',
    isCritical: true,
  },
];

const initialDependencies: GanttDependency[] = [
  { fromId: 'task1', toId: 'task2', type: 'finish-to-start' },
  { fromId: 'task2', toId: 'milestone1', type: 'finish-to-start', lag: 5 },
  { fromId: 'milestone1', toId: 'task3', type: 'finish-to-start', lag: 1 },
  { fromId: 'task3', toId: 'task4', type: 'start-to-start', lag: 4 },
  { fromId: 'task4', toId: 'task5', type: 'finish-to-start' },
  { fromId: 'task5', toId: 'milestone2', type: 'finish-to-start', lag: 2 },
  { fromId: 'milestone2', toId: 'task6', type: 'finish-to-start', lag: 1 },
  { fromId: 'milestone2', toId: 'task7', type: 'finish-to-start', lag: 1 },
  { fromId: 'task6', toId: 'task8', type: 'finish-to-finish', lag: 4 },
  { fromId: 'task7', toId: 'task8', type: 'finish-to-start', lag: 1 },
  { fromId: 'task8', toId: 'milestone3', type: 'finish-to-start', lag: 3 },
];

// Custom columns factory (needs isDarkMode)
const getCustomColumns = (isDarkMode: boolean): GanttColumn[] => [
  {
    id: 'name',
    header: 'Task Name',
    width: 200,
    minWidth: 150,
  },
  {
    id: 'progress',
    header: 'Progress',
    width: 100,
    align: 'center',
    render: (task) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          flex: 1,
          height: '6px',
          background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${task.progress}%`,
            height: '100%',
            background: task.progress === 100
              ? 'linear-gradient(90deg, #34d399, #10b981)'
              : 'linear-gradient(90deg, #38bdf8, #818cf8)',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: task.progress === 100 ? '#10b981' : isDarkMode ? 'rgba(255,255,255,0.6)' : '#64748b',
          minWidth: '32px',
        }}>
          {task.progress}%
        </span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    width: 90,
    align: 'center',
    render: (task) => {
      const status = task.progress === 100 ? 'Done' : task.progress > 0 ? 'Active' : 'Todo';
      const darkStyles: Record<string, React.CSSProperties> = {
        Done: {
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.1))',
          color: '#34d399',
          border: '1px solid rgba(52, 211, 153, 0.3)',
        },
        Active: {
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.1))',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        },
        Todo: {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      };
      const lightStyles: Record<string, React.CSSProperties> = {
        Done: {
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1))',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
        Active: {
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.1))',
          color: '#0284c7',
          border: '1px solid rgba(14, 165, 233, 0.3)',
        },
        Todo: {
          background: 'rgba(0, 0, 0, 0.04)',
          color: '#64748b',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      };
      const styles = isDarkMode ? darkStyles : lightStyles;
      return (
        <span style={{
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          ...styles[status],
        }}>
          {status}
        </span>
      );
    },
  },
];

// Custom dark theme
const darkStudioTheme: GanttTheme = {
  primary: '#38bdf8',
  background: '#12121a',
  backgroundAlt: '#16161f',
  text: '#f0f0f5',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.08)',
  gridLine: 'rgba(255, 255, 255, 0.04)',
  taskBar: '#38bdf8',
  taskProgress: '#818cf8',
  baseline: 'rgba(255, 255, 255, 0.15)',
  critical: '#f472b6',
  milestone: '#a855f7',
  group: '#64748b',
  todayMarker: 'rgba(251, 146, 60, 0.3)',
  weekend: 'rgba(255, 255, 255, 0.02)',
  dependency: 'rgba(255, 255, 255, 0.25)',
  tooltipBackground: '#1e1e2e',
  tooltipText: '#f0f0f5',
};

// Custom light theme
const lightStudioTheme: GanttTheme = {
  primary: '#0ea5e9',
  background: '#ffffff',
  backgroundAlt: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  gridLine: '#f1f5f9',
  taskBar: '#0ea5e9',
  taskProgress: '#6366f1',
  baseline: '#cbd5e1',
  critical: '#ec4899',
  milestone: '#8b5cf6',
  group: '#475569',
  todayMarker: 'rgba(249, 115, 22, 0.2)',
  weekend: 'rgba(0, 0, 0, 0.02)',
  dependency: '#94a3b8',
  tooltipBackground: '#1e293b',
  tooltipText: '#f8fafc',
};

// Feature badges data
const features = [
  { icon: '0', label: 'Zero Dependencies', color: '#34d399' },
  { icon: '⚡', label: 'Baseline Support', color: '#38bdf8' },
  { icon: '↔', label: 'Drag & Resize', color: '#a855f7' },
  { icon: '◇', label: '4 Dependency Types', color: '#f472b6' },
];

function App() {
  const [tasks, setTasks] = useState<GanttTask[]>(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showTaskList, setShowTaskList] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 15));
  }, []);

  const config: GanttConfig = {
    viewMode,
    showBaseline,
    showDependencies,
    showTaskList,
    showTodayMarker: true,
    showWeekends: true,
    allowDrag: true,
    allowResize: true,
    allowProgressChange: true,
    rowHeight: 44,
    taskListWidth: 400,
  };

  const handleTaskDateChange = useCallback((event: TaskDateChangeEvent) => {
    const { task, newStart, newEnd, isResize } = event;
    const action = isResize ? 'Resized' : 'Moved';
    addEvent(`${action} "${task.name}" to ${newStart.toLocaleDateString()} - ${newEnd.toLocaleDateString()}`);
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id ? { ...t, start: newStart, end: newEnd } : t
      )
    );
  }, [addEvent]);

  const handleTaskProgressChange = useCallback((event: TaskProgressChangeEvent) => {
    const { task, newProgress } = event;
    addEvent(`Updated "${task.name}" progress to ${newProgress}%`);
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id ? { ...t, progress: newProgress } : t
      )
    );
  }, [addEvent]);

  const handleTaskClick = useCallback((event: TaskClickEvent) => {
    addEvent(`Clicked "${event.task.name}"`);
  }, [addEvent]);

  const handleTaskDoubleClick = useCallback((event: TaskClickEvent) => {
    addEvent(`Double-clicked "${event.task.name}"`);
  }, [addEvent]);

  const handleGroupToggle = useCallback((taskId: string, isExpanded: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      addEvent(`${isExpanded ? 'Expanded' : 'Collapsed'} "${task.name}"`);
    }
  }, [tasks, addEvent]);

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode ? '#0a0a0f' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.5s ease',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 20s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 25s ease-in-out infinite reverse',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '60%',
          width: '30vw',
          height: '30vw',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(244, 114, 182, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse-glow 15s ease-in-out infinite',
          filter: 'blur(50px)',
        }} />
        {/* Grain texture overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: isDarkMode ? 0.03 : 0.02,
          mixBlendMode: 'overlay',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '32px 40px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {/* Hero Header */}
        <header style={{
          marginBottom: '40px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 800,
              color: isDarkMode ? '#f0f0f5' : '#0f172a',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              transition: 'color 0.3s ease',
            }}>
              React Gantt Next Level Chart
            </h1>
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
              marginTop: '6px',
            }}>
              Interactive Demo
            </p>
          </div>

          <p style={{
            fontSize: '18px',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#475569',
            maxWidth: '600px',
            lineHeight: 1.6,
            fontWeight: 300,
          }}>
            A lightweight, zero-dependency React Gantt chart with{' '}
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0ea5e9', fontWeight: 500 }}>native baseline support</span>
          </p>

          {/* Feature badges */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}>
            {features.map((feature, index) => (
              <div
                key={feature.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: '100px',
                  fontSize: '13px',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + index * 0.08}s`,
                }}
              >
                <span style={{
                  color: feature.color,
                  fontWeight: 700,
                  fontSize: '14px',
                }}>{feature.icon}</span>
                {feature.label}
              </div>
            ))}
          </div>
        </header>

        {/* Controls Panel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '24px',
          padding: '16px 24px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '16px',
          flexWrap: 'wrap',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}>
          {/* Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>Theme</span>
            <div style={{
              display: 'flex',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '10px',
              padding: '4px',
              gap: '4px',
            }}>
              {[
                { mode: 'light', icon: '☀️' },
                { mode: 'dark', icon: '🌙' },
              ].map(({ mode, icon }) => (
                <button
                  key={mode}
                  onClick={() => setIsDarkMode(mode === 'dark')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: (isDarkMode && mode === 'dark') || (!isDarkMode && mode === 'light')
                      ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
                      : 'transparent',
                    color: (isDarkMode && mode === 'dark') || (!isDarkMode && mode === 'light')
                      ? 'white'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            width: '1px',
            height: '24px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }} />

          {/* View Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>View</span>
            <div style={{
              display: 'flex',
              background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '10px',
              padding: '4px',
              gap: '4px',
            }}>
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: viewMode === mode
                      ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
                      : 'transparent',
                    color: viewMode === mode ? 'white' : isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            width: '1px',
            height: '24px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }} />

          {/* Toggle switches */}
          {[
            { label: 'Baseline', value: showBaseline, setter: setShowBaseline },
            { label: 'Dependencies', value: showDependencies, setter: setShowDependencies },
            { label: 'Task List', value: showTaskList, setter: setShowTaskList },
          ].map((toggle) => (
            <label
              key={toggle.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div
                onClick={() => toggle.setter(!toggle.value)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: toggle.value
                    ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
                    : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: toggle.value ? '23px' : '3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }} />
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: toggle.value
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#0f172a'
                  : isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8',
                transition: 'color 0.2s ease',
              }}>
                {toggle.label}
              </span>
            </label>
          ))}
        </div>

        {/* Gantt Chart Container */}
        <div style={{
          background: isDarkMode ? 'rgba(18, 18, 26, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: isDarkMode
            ? '0 25px 80px -20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
            : '0 25px 80px -20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.98)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
        }}>
          <Gantt
            tasks={tasks}
            dependencies={initialDependencies}
            columns={getCustomColumns(isDarkMode)}
            config={config}
            theme={isDarkMode ? darkStudioTheme : lightStudioTheme}
            onTaskDateChange={handleTaskDateChange}
            onTaskProgressChange={handleTaskProgressChange}
            onTaskClick={handleTaskClick}
            onTaskDoubleClick={handleTaskDoubleClick}
            onGroupToggle={handleGroupToggle}
            style={{ height: '520px' }}
          />
        </div>

        {/* Event Log */}
        <div style={{
          marginTop: '24px',
          padding: '20px 24px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: '16px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
          boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: eventLog.length > 0 ? '#34d399' : isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
              boxShadow: eventLog.length > 0 ? '0 0 12px rgba(52, 211, 153, 0.5)' : 'none',
              transition: 'all 0.3s ease',
            }} />
            <h3 style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#475569',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Event Log
            </h3>
            {eventLog.length > 0 && (
              <span style={{
                fontSize: '11px',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8',
                marginLeft: 'auto',
              }}>
                {eventLog.length} events
              </span>
            )}
          </div>

          <div style={{
            maxHeight: '140px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
          }}>
            {eventLog.length === 0 ? (
              <div style={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : '#94a3b8',
                fontStyle: 'italic',
                padding: '8px 0',
              }}>
                Interact with the chart to see events here...
              </div>
            ) : (
              eventLog.map((event, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    background: index === 0
                      ? isDarkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.1)'
                      : 'transparent',
                    borderRadius: '8px',
                    color: index === 0
                      ? isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#0f172a'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748b',
                    borderLeft: index === 0 ? '2px solid #38bdf8' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {event}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.6s ease 0.6s',
        }}>
          <p style={{
            fontSize: '13px',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8',
          }}>
            Built with React • Zero Dependencies • TypeScript
          </p>
          <a
            href="https://github.com/yi00it/react-gantt-nl"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '10px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#475569',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
