---
name: Workspace layout
description: How the sidebar/canvas split is implemented and why PanelGroup was removed
---

The sidebar and main canvas use a plain CSS flexbox row (`<div className="flex-1 flex flex-row min-h-0 overflow-hidden w-full">`).

**Why:** `react-resizable-panels` PanelGroup caused z-index bleed (sidebar content rendered behind the canvas) and couldn't handle non-Panel children (expand-strip button, fragment-wrapped resize handle). These caused hydration and layout bugs.

**How to apply:**
- Sidebar width is stored in `sidebarWidth` state (default 240, min 180, max 420).
- `isResizingRef` + `resizeStartRef` track drag state; `handleResizeMouseDown` attaches window-level mousemove/mouseup listeners.
- The resize handle is a plain 4px div with `cursor-col-resize`, `onMouseDown={handleResizeMouseDown}`.
- Main canvas is `<div className="flex-1 flex flex-col min-w-0 overflow-hidden">` — it gets all remaining space.
- Collapsed expand-strip is a simple button outside the sidebar div, not inside PanelGroup.
- localStorage key for collapsed state: `dd_sidebar_v2`.
