# react-gantt-nl

A lightweight, zero-dependency React Gantt chart with **native baseline support**.

## Features

- **Native Baseline Support** - Baseline bars are first-class citizens, not overlays
- **Drag & Resize** - Intuitive task scheduling with drag and resize
- **Dependencies** - Support for FS, SS, FF, SF dependency types
- **Grouping** - Hierarchical task structure with collapsible groups
- **Critical Path** - Visual highlighting for critical tasks
- **Milestones** - Diamond-shaped milestone markers
- **Customizable** - Theming, custom columns, custom tooltips
- **TypeScript** - Full TypeScript support
- **Zero Dependencies** - Only requires React

## Installation

```bash
npm install react-gantt-nl
# or
yarn add react-gantt-nl
# or
pnpm add react-gantt-nl
```

## Quick Start

```tsx
import { Gantt, GanttTask } from 'react-gantt-nl';

const tasks: GanttTask[] = [
  {
    id: '1',
    name: 'Foundation Work',
    type: 'task',
    start: new Date('2024-01-01'),
    end: new Date('2024-01-15'),
    progress: 50,
    // Baseline dates - renders gray bar below current schedule
    baselineStart: new Date('2024-01-01'),
    baselineEnd: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'Framing',
    type: 'task',
    start: new Date('2024-01-16'),
    end: new Date('2024-01-30'),
    progress: 0,
    dependencies: ['1'],
  },
];

function App() {
  return (
    <Gantt
      tasks={tasks}
      config={{
        viewMode: 'week',
        showBaseline: true,
      }}
      onTaskDateChange={(event) => {
        console.log('Task moved:', event.task.name);
        console.log('New dates:', event.newStart, event.newEnd);
      }}
    />
  );
}
```

## Baseline Support

Unlike other Gantt libraries where baselines are an afterthought, `react-gantt-nl` treats baseline dates as first-class citizens:

```tsx
const task: GanttTask = {
  id: '1',
  name: 'My Task',
  type: 'task',
  // Current schedule
  start: new Date('2024-01-10'),
  end: new Date('2024-01-25'),
  progress: 30,
  // Original baseline (renders as gray bar below)
  baselineStart: new Date('2024-01-01'),
  baselineEnd: new Date('2024-01-15'),
};
```

The baseline bar automatically:
- Uses the same coordinate system as task bars (perfect alignment)
- Extends the date range if baseline dates fall outside current schedule
- Shows variance in the tooltip

## Task Types

```tsx
// Regular task
{ type: 'task', ... }

// Milestone (diamond shape)
{ type: 'milestone', ... }

// Group/Summary (bracket style, aggregates children)
{ type: 'group', ... }
```

## Dependencies

```tsx
const dependencies: GanttDependency[] = [
  { fromId: '1', toId: '2', type: 'finish-to-start' },  // Task 1 must finish before Task 2 starts
  { fromId: '3', toId: '4', type: 'start-to-start' },   // Both start together
  { fromId: '5', toId: '6', type: 'finish-to-finish' }, // Both finish together
];

<Gantt tasks={tasks} dependencies={dependencies} />
```

## Configuration

```tsx
<Gantt
  tasks={tasks}
  config={{
    viewMode: 'week',        // 'day' | 'week' | 'month'
    rowHeight: 40,           // Height of each row
    headerHeight: 50,        // Height of timeline header
    showTaskList: true,      // Show left panel
    taskListWidth: 360,      // Width of left panel
    showBaseline: true,      // Show baseline bars
    showDependencies: true,  // Show dependency arrows
    showTodayMarker: true,   // Show today line
    showWeekends: true,      // Highlight weekends
    allowDrag: true,         // Allow dragging tasks
    allowResize: true,       // Allow resizing tasks
    locale: 'en-US',         // Date formatting locale
    firstDayOfWeek: 1,       // 0 = Sunday, 1 = Monday
    datePadding: 7,          // Days padding around tasks
  }}
/>
```

## Theming

```tsx
<Gantt
  tasks={tasks}
  theme={{
    primary: '#2563eb',
    background: '#ffffff',
    backgroundAlt: '#f9fafb',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e5e7eb',
    taskBar: '#525252',
    taskProgress: '#171717',
    baseline: '#9ca3af',
    critical: '#dc2626',
    // ... see GanttTheme type for all options
  }}
/>
```

### Dark Mode

```tsx
import { Gantt, darkTheme } from 'react-gantt-nl';

<Gantt tasks={tasks} theme={darkTheme} />
```

## Custom Columns

```tsx
const columns: GanttColumn[] = [
  {
    id: 'name',
    header: 'Task',
    width: 200,
  },
  {
    id: 'assignee',
    header: 'Assignee',
    width: 100,
    accessor: (task) => task.payload?.assignee || '-',
  },
  {
    id: 'status',
    header: 'Status',
    width: 80,
    render: (task) => (
      <span className={`status-${task.progress === 100 ? 'done' : 'active'}`}>
        {task.progress === 100 ? 'Done' : 'Active'}
      </span>
    ),
  },
];

<Gantt tasks={tasks} columns={columns} />
```

## Event Handlers

```tsx
<Gantt
  tasks={tasks}
  onTaskDateChange={(event) => {
    // Called when task is dragged or resized
    const { task, newStart, newEnd, isResize } = event;
    updateTaskDates(task.id, newStart, newEnd);
  }}
  onTaskClick={(event) => {
    // Called when task is clicked
    openTaskDetails(event.task.id);
  }}
  onTaskDoubleClick={(event) => {
    // Called when task is double-clicked
    openTaskEditor(event.task.id);
  }}
  onGroupToggle={(taskId, isExpanded) => {
    // Called when group is expanded/collapsed
  }}
/>
```

## API Reference

### GanttTask

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Display name |
| type | 'task' \| 'milestone' \| 'group' | Yes | Task type |
| start | Date | Yes | Start date |
| end | Date | Yes | End date |
| progress | number | Yes | Progress (0-100) |
| baselineStart | Date | No | Baseline start date |
| baselineEnd | Date | No | Baseline end date |
| parentId | string | No | Parent task ID for grouping |
| dependencies | string[] | No | IDs of predecessor tasks |
| isCritical | boolean | No | On critical path |
| isDisabled | boolean | No | Disable interactions |
| color | string | No | Custom bar color |
| payload | object | No | Custom data |

### GanttDependency

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| fromId | string | Yes | Source task ID |
| toId | string | Yes | Target task ID |
| type | DependencyType | Yes | Dependency type |
| lag | number | No | Lag in days |

### DependencyType

- `finish-to-start` - Predecessor must finish before successor starts
- `start-to-start` - Both start together
- `finish-to-finish` - Both finish together
- `start-to-finish` - Predecessor start triggers successor finish

## License

MIT
