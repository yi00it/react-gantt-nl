# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-05

### Added

- Initial release
- Core Gantt chart component with SVG rendering
- Task bar rendering with drag-to-resize and drag-to-move support
- Dependency arrows (finish-to-start, start-to-start, finish-to-finish, start-to-finish)
- Native baseline support for tracking planned vs actual schedules
- Multiple view modes: hour, day, week, month
- Milestone and summary task support
- Progress indicator on task bars
- Dark theme included (`darkTheme`)
- Customizable theming via `GanttTheme`
- Grid with time headers and today marker
- Comprehensive TypeScript types
- Zero runtime dependencies (only React peer dependency)
- Exported utilities for date and position calculations
- Hooks: `useDrag`, `useScroll`
