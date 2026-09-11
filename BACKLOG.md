# Weekly Planner — Dashboard Backlog

Ideas from a dashboard/UX pass, turned into a prioritized backlog. Grouped by priority; each item tags its category and a rough effort (S/M/L). IDs match the interactive version of this board: https://claude.ai/code/artifact/9e5555a3-6f81-436f-a272-f01b0492ba88

## High Priority

- **L1 — [Layout] Today hero panel** — Dedicated panel for today: greeting, task count, quick-add — instead of today buried in the scroll. (Effort: M)
- **L5 — [Layout] Sticky quick-add bar** — Always-visible "Add a task…" input that expands into the full form, replacing the modal as the only entry point. (Effort: S)
- **P1 — [Productivity] Overdue banner + bulk reschedule** — Dismissible banner for overdue tasks with a one-click "push all to today," instead of a badge buried behind a click. (Effort: S)
- **T1 — [Team] Separate "assigned to me" section** — Split team tasks from personal ones instead of blending them into one list with a small badge. (Effort: M)
- **N1 — [Integrations] AI natural-language quick-add** — Parse "call John Friday 3pm, work" into title/date/time/category on the existing add-task form. (Effort: M)
- **N4 — [Integrations] GitHub: link issues/PRs to tasks** — Attach a GitHub issue or PR URL to a task; show its live status (open / review / merged) inline. (Effort: L)
- **N6 — [Integrations] Google Calendar two-way sync** — Push events to Google Calendar and pull busy blocks back in — the highest-leverage integration for a planner. (Effort: L)

## Medium Priority

- **L2 — [Layout] Week strip on dashboard** — Compact 7-day dot strip above the list so `/dashboard` and `/agenda` cross-link without switching pages. (Effort: M)
- **L3 — [Layout] Two-column desktop layout** — Main task column plus a sidebar (mini calendar, categories, overdue) on wide screens, instead of one centered column. (Effort: L)
- **P2 — [Productivity] Search / jump-to-task** — Cmd+K-style filter across titles and notes as personal and team task volume grows. (Effort: M)
- **P3 — [Productivity] Bulk actions on past tasks** — Mark-all-done / clear-all for the collapsed past section instead of one row at a time. (Effort: S)
- **P4 — [Productivity] Drag-to-reschedule** — Drag a task onto another day in week/month view, or a "reschedule" action in the existing context menu. (Effort: L)
- **P5 — [Productivity] Time-block / hour view** — Vertical timeline for days with timed events, using the time data already captured on creation. (Effort: L)
- **I1 — [Insights] Weekly progress summary** — Small stat row: tasks completed vs. planned this week, days fully cleared. (Effort: M)
- **T2 — [Team] Reminder status indicator** — Surface `reminderSentAt` / `reminderAt` as an icon so the Discord reminder pipeline is visible in the UI. (Effort: S)
- **T3 — [Team] Avatars on week grid** — Show assignee avatars on `DayColumn` so team leads can scan workload at a glance. (Effort: S)
- **T4 — [Team] Unassigned task inbox** — Small widget listing team tasks with no `assignedToId` — surfaces work that could fall through the cracks. (Effort: M)
- **C1 — [Customization] Dark mode** — Full dark theme — the existing Tailwind setup makes token-based theming straightforward. (Effort: M)
- **X1 — [Polish] Undo toast on delete/complete** — Undo action button on the existing sonner toasts instead of a silent, irreversible action. (Effort: S)
- **X2 — [Polish] Keyboard shortcuts** — `n` for new task, `/` for search, arrow keys to move between days. (Effort: M)
- **N2 — [Integrations] AI auto-categorization** — Suggest a category for new tasks from title and notes, confirmed with one tap. (Effort: M)
- **N3 — [Integrations] AI weekly planning assistant** — Chat-style weekly review: surfaces overdue items, suggests reschedules, drafts a digest. (Effort: L)
- **N5 — [Integrations] GitHub: auto-create tasks from assigned issues** — A webhook creates a task when an issue is assigned to you, mirroring the Discord OAuth pattern already in place. (Effort: M)
- **N8 — [Integrations] Email digest** — Daily or weekly agenda email, reusing the reminder cron job's scheduling. (Effort: M)

## Low Priority

- **L4 — [Layout] Category rail on desktop** — Persistent left-side category list once the chip row stops fitting on one line. (Effort: M)
- **I2 — [Insights] Category breakdown chart** — Tiny bar or donut showing the week's split across categories, reusing the existing color palette. (Effort: S)
- **I3 — [Insights] Completion streaks** — Optional streak counter. Flag before building — may not fit the app's clean, un-gamified tone. (Effort: M)
- **C2 — [Customization] Week start preference** — Mon vs. Sun as a per-user setting; small `Profile.weekStartsOn` addition. (Effort: S)
- **C3 — [Customization] Density toggle** — Comfortable vs. compact spacing for heavier task lists. (Effort: S)
- **C4 — [Customization] Pinned categories** — Favorite categories shown first regardless of creation order. (Effort: S)
- **X3 — [Polish] Empty state variety** — Context-specific empty states instead of one generic "nothing planned" message. (Effort: S)
- **X4 — [Polish] Inline "tomorrow" shortcut** — One-tap add-for-tomorrow next to the today quick-add, since `formatDateLabel` already special-cases it. (Effort: S)
- **N7 — [Integrations] Slack integration** — Mirror the existing Discord bot (reminders, channel routing) for teams on Slack instead of Discord. (Effort: L)
- **N9 — [Integrations] Generic webhooks / Zapier** — Outbound webhook on task events so power users can wire the planner into anything. (Effort: M)
- **N10 — [Integrations] Browser quick-capture** — Extension or bookmarklet to send the current page or selection into the planner as a task. (Effort: M)
- **N11 — [Integrations] Notion / Todoist import** — One-time importer for people migrating an existing list in. (Effort: M)

## Integrations — notes

Discord already proves the pattern here — OAuth to link an external account, a background job for reminders, a message API for output (see `api/discord/callback` and the reminder cron). Everything in the Integrations rows above reuses some piece of that shape.

- **AI** is the cheapest way in: a text field is already the whole interface for adding a task, so parsing free text server-side before it hits the existing add-task API (N1) is small and self-contained. Auto-categorization (N2) and a weekly digest assistant (N3) are the same call used differently — confirm-only at first, more autonomous as it earns trust. All three need a model API key and prompt design, no new infrastructure.
- **GitHub** fits because this reads as a planner for people who write code — a task that's really "review PR #142" is more useful showing that PR's live status inline (N4), and an assigned issue creating its own task (N5) removes a manual step entirely. Both need a GitHub App / OAuth flow and a webhook receiver — new surface area, but a known shape.
- **Everything else** — calendar, Slack, email, webhooks — is about meeting people in the tool they already live in. Calendar sync (N6) has the widest reach for a planner specifically; Slack (N7) mostly duplicates what the Discord bot already does unless the team is actually on Slack instead.
