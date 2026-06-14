---
name: QA analyst UI
description: How assistant messages in the QA chat are rendered with hero metric cards
---

For every assistant message in the Q&A chat, the rendering logic:
1. Extracts the first prominent number/percentage from the text via regex → shows a **hero card** (large mono number + label + Activity icon, indigo gradient background) above the bubble.
2. Detects "Why important / key takeaway" phrasing → renders a **"Why it matters"** sub-section (indigo border-top, Lightbulb icon) inside the bubble.
3. Detects "Business insight / recommendation / takeaway" phrasing → renders a **"Business insight"** sub-section (emerald border-top, BarChart2 icon) inside the bubble.

**Why:** Plain text responses look flat. The hero card gives users an instant KPI read before reading the full answer.

**How to apply:** The map callback in the QA chat loop changed from arrow-body `(...)` to block-body `{ ... return (...); }`. Both `BarChart2` and `Lightbulb` must be imported from lucide-react (they were added in the June 2026 session).
