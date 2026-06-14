---
name: Homepage clean start
description: App no longer auto-loads seed data; shows HomeLandingView on fresh open
---

The `useEffect` that previously called `setCurrentPayload(chaupalInsightsSeed)` as a fallback was changed to do nothing when no saved session exists. Result: new users (or cleared localStorage) see the `HomeLandingView` with Upload Dataset + Create Dashboard CTAs instead of a pre-populated Chaupal Insights dashboard.

**Why:** The reference design spec called for a clean, empty homepage. Preloaded data confused the "getting started" flow.

**How to apply:** If a seed/demo dashboard is ever needed again, add it as an explicit user action (e.g. "Load sample data" button in HomeLandingView), not as a silent fallback in the startup effect. `chaupalInsightsSeed` was removed from the App.tsx import; `recentChaupalSessions` is still imported and used in the sidebar recent-sessions panel.
