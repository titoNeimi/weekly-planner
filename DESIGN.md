---
name: Weekly Planner
description: A personal week-at-a-glance task manager. See your week, add tasks, get things done.
colors:
  bg: "oklch(0.978 0.000 0)"
  surface: "oklch(1.000 0.000 0)"
  ink: "oklch(0.175 0.010 150)"
  ink-secondary: "oklch(0.445 0.008 150)"
  ink-muted: "oklch(0.640 0.005 150)"
  border: "oklch(0.918 0.003 150)"
  border-strong: "oklch(0.175 0.010 150)"
  primary: "oklch(0.480 0.120 150)"
  primary-light: "oklch(0.940 0.040 150)"
typography:
  heading:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.01em"
  label-caps:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "oklch(0.380 0.110 150)"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  chip-inactive:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-active-all:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
---

# Design System: Weekly Planner

## 1. Overview

**Creative North Star: "The Good Tool"**

Weekly Planner is designed like a well-made implement: no unnecessary chrome, no decoration for its own sake, quality felt in use rather than announced. The interface disappears into the task. Open it, see your week, add what you need, close it. What stays in mind is the week's shape, not the software.

The visual system is restrained by design. A near-neutral palette keeps attention on the content (tasks, categories, dates), not the shell. The single brand accent — a deep sage, introduced as a directional seed — carries the product's personality without competing with the category colors users assign meaning to. Color earns its place here; it never decorates.

This system explicitly rejects document-editor complexity (Notion's layered blocks, inline commands, wiki nesting), enterprise task-management theatrics (ticket numbers, status badges, sprint boards), and the generic SaaS dashboard template (gray sidebar, blue primary, identical card grids). The user is planning their week over coffee, not managing a product roadmap.

**Key Characteristics:**
- Near-neutral field with one deliberate accent (deep sage)
- Flat surfaces by default; depth reserved for state (today, modal, sticky nav)
- System typeface now; humanist sans the intended direction
- Category colors are user-owned; system palette stays out of their way
- "Quiet and firm" interactive controls — present but not loud

---

## 2. Colors: The Neutral Field + Sage Direction

The palette is a restrained neutral stack with a single brand accent seeded in sage. Neutrals carry the week grid; sage marks today, primary actions, and focus states.

### Primary

- **Deep Sage** (`oklch(0.480 0.120 150)`): The brand accent — a mid-dark forest green. Used on: the today date indicator (filled circle), primary action buttons, input focus rings, and the active segment of the Week/Month view switcher. White text on all filled surfaces. Never used decoratively. *This is the seeded direction; the current implementation uses gray-900 and should migrate to this value.*

- **Sage Light** (`oklch(0.940 0.040 150)`): A pale sage tint used for focus halos (input box-shadow glow) and hover states on sage-adjacent elements.

### Neutral

- **Page Ground** (`oklch(0.978 0.000 0)`): The page background (Tailwind gray-50 equivalent). Barely off-white so surface cards lift cleanly against it.
- **Surface White** (`oklch(1.000 0.000 0)`): Day columns, modals, the topbar, all card surfaces. Pure white.
- **Ink** (`oklch(0.175 0.010 150)`): Body text and high-emphasis labels. Near-black carrying the faintest sage tint — warmth at the hue level, invisible at a glance, present on close reading. Reaches 7:1+ contrast on white.
- **Ink Secondary** (`oklch(0.445 0.008 150)`): Supporting text, field labels, navigation links, metadata.
- **Ink Muted** (`oklch(0.640 0.005 150)`): Placeholder text, day-number decoration for non-today columns, add-task row labels. Use only at 12px or smaller; do not use as body text (contrast may not reach 4.5:1 at body size).
- **Border** (`oklch(0.918 0.003 150)`): Default dividers and card borders.
- **Border Strong** (`oklch(0.175 0.010 150)`, same as Ink): Today's day-column full border. A bold frame, not a side stripe.

### Named Rules

**The Neutral Field Rule.** The system palette is neutral-with-sage plus one accent. Category colors — the full Tailwind spectrum users assign to their labels — are user-owned. System chrome never competes with them. When a new system element needs color, exhaust neutral and sage before introducing anything else.

**The Today Rule.** The only card-level element that earns the border-strong treatment is today's day column. No other container uses a near-black full border as an accent. The singularity of the treatment is the meaning.

---

## 3. Typography

**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif (current implementation)
**Intended Direction:** A single humanist sans at three weights. Inter (precise, interface-native) or DM Sans (slightly warmer) are the leading candidates. No display/body pairing: one family carries every role.

**Character:** Functional and quiet. The type is a grid for information, not a statement. Headings differentiate by weight and size, not by a competing family. Labels are small and firm, not decorative.

### Hierarchy

- **Heading** (600 weight, 1.25rem / 20px, line-height 1.25): The week date-range label above the grid. The most prominent element on the page.
- **Body** (400 weight, 0.875rem / 14px, line-height 1.5): Task titles in the day columns. The primary reading size. Max line length 65ch in any prose context.
- **Label** (500 weight, 0.75rem / 12px, letter-spacing 0.01em): Task metadata, button text, modal field labels, navigation links.
- **Label Caps** (600 weight, 0.625rem / 10px, letter-spacing 0.08em, uppercase): Day-of-week abbreviations (MON, TUE...) in column headers. Short labels only (4 characters max); never used for sentences.

### Named Rules

**The One Family Rule.** No display typeface. No serif. One well-tuned sans at 400/500/600 carries every typographic role. Adding a second family adds complexity without adding warmth; weight contrast within one family does both more cleanly.

---

## 4. Elevation

The system is flat by default. Depth is a state signal, not an aesthetic default.

Today's day column carries `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` alongside its border-strong border — a whisper of lift, not a dramatic cast shadow. The sticky topbar uses `backdrop-filter: blur(8px)` with `background: rgba(255,255,255,0.80)` as a blur plane; this is purposeful (scroll-context visibility), not decorative glassmorphism. Modals use a `box-shadow: 0 4px 24px rgba(0,0,0,0.12)` to lift the surface above the backdrop clearly.

### Shadow Vocabulary

- **Surface Lift** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08)`): Today's day column only. The only card-level shadow in the system.
- **Modal** (`box-shadow: 0 4px 24px rgba(0,0,0,0.12)`): Centered dialog surfaces floating above the backdrop overlay.
- **Topbar Blur Plane**: `backdrop-filter: blur(8px)` on `background: rgba(255,255,255,0.80)`. Not a shadow; a transparency treatment for the sticky header.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. Elevation appears only as a response to state: today (singular), modals (above the page), sticky nav (above scroll). A new component reaching for a shadow for aesthetic reasons is wrong. Reach for a border or background tint instead.

---

## 5. Components

### Buttons

Quiet and firm: present without competing with content, always legible, no unnecessary chrome.

- **Shape:** Gently rounded (8px). Never pill-shaped; never square.
- **Primary:** Deep sage fill (`oklch(0.480 0.120 150)`), white text, 8px radius, padding 6px 12px, 0.75rem label weight 500. *Direction: current implementation uses gray-900; migrate to sage.*
- **Hover / Active:** Darker sage (`oklch(0.380 0.110 150)`). `transition: background 0.15s ease-out`.
- **Focus:** `outline: 2px solid oklch(0.480 0.120 150); outline-offset: 2px`.
- **Ghost:** Transparent bg, 1px border-gray-200, ink-secondary text. Hover: bg page-ground, ink text.
- **Disabled:** 50% opacity on any variant. `cursor: not-allowed`. No hover treatment.

### Category Chips

The primary filtering surface. The user owns the color system here.

- **Inactive:** Page-ground background, ink-secondary text, rounded-full, padding 4px 12px, 0.75rem medium.
- **Active (All):** Ink fill, white text. The neutral system's primary — not sage, which is reserved for user interaction with *today* and actions.
- **Active (Category):** The category's own Tailwind color class (e.g., `bg-blue-100 text-blue-600`). The system yields the stage entirely.
- **Add Category trigger:** Dashed border, ink-muted text, rounded-full. Hover: border shifts to border-strong territory.

### Day Columns

The signature component. Each day is a card-column with a fixed header and a scrollable task list.

- **Default:** White surface, 1px border, 12px radius, padding 12–16px.
- **Today:** White surface, 1px border-strong (ink), `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`.
- **Day label:** Label Caps style (0.625rem, uppercase, tracked). Ink for today; ink-muted for other days.
- **Date number (default):** Ink-muted, no fill, tabular numerals.
- **Date number (today):** Sage-filled circle (24px diameter), white number, 600 weight 0.75rem.
- **Add task row:** Full-width at the bottom, "＋ add task" in ink-muted, text-left. Hover: bg page-ground, color shifts to ink-secondary.

### Inputs / Fields

- **Style:** 1px border, white bg, 8px radius, padding 6px 12px, 0.875rem body.
- **Focus:** Border shifts to ink-secondary; `box-shadow: 0 0 0 3px oklch(0.940 0.040 150)` (sage-light glow, not a sharp ring).
- **Placeholder:** Ink-muted. Must reach 4.5:1 contrast — verify before shipping.
- **Disabled:** Page-ground bg, lightened border, 50% opacity.

### Navigation (Topbar)

- **Structure:** Sticky, `z-index: 10`, approx 52px height, blur plane.
- **Brand link:** Heading weight (semibold), ink. Hover: ink-secondary.
- **Nav links:** Label (0.875rem), ink-secondary default, ink on active route. No underline by default.
- **User area:** Avatar + name label + sign-out button (ink-muted text, hover bg page-ground).

### View Switcher (Week / Month)

A segmented control, not two separate buttons.

- **Container:** 1px border, 8px radius, `overflow: hidden`.
- **Inactive segment:** Transparent bg, ink-muted text. Hover: bg page-ground, ink-secondary text.
- **Active segment:** Sage fill, white text. *Direction: current implementation uses gray-900; migrate to sage.*

---

## 6. Do's and Don'ts

### Do:
- **Do** use Deep Sage (`oklch(0.480 0.120 150)`) as the sole system accent — today's indicator, primary buttons, focus rings, the active view-switcher segment. Its rarity is the point.
- **Do** keep the surface field flat at rest. Border and background-tint carry hierarchy; shadows respond only to state.
- **Do** preserve the user's color vocabulary. Category chips use user-assigned colors; system components use neutral + sage only.
- **Do** treat today's day column as the only card-level elevated element. Its full border-strong treatment is singular; repeating it elsewhere destroys the signal.
- **Do** use white text on any sage fill — it's a saturated mid-luminance surface (`oklch(0.480 0.120 150)`) and dark text reads as muddy.
- **Do** keep interactive transitions at 150ms with ease-out. Users are in flow; don't make them wait.
- **Do** use Label Caps (uppercase, tracked) only on column headers (MON, TUE...) and short badges. Never on sentences.

### Don't:
- **Don't** make this feel like Notion: no block-based editing affordances, no slash-command menus, no page-within-page nesting, no document-like hierarchy.
- **Don't** add enterprise PM patterns: no ticket numbers, no sprint-board columns, no priority-matrix labels, no "project health" status widgets.
- **Don't** apply the generic SaaS dashboard template: no persistent left sidebar, no blue primary CTA, no identical-card grids with icon + heading + text.
- **Don't** use `border-left` wider than 1px as a colored accent stripe on any card or list item. Side-stripe borders are never intentional here. Rewrite with a full border, a background tint, or nothing.
- **Don't** use `background-clip: text` gradient effects. Text color is solid ink or solid white.
- **Don't** introduce a second system accent color without a clear semantic role. The neutral stack plus one sage is the system. Additional hues belong to category colors (user-owned) or semantic states (error red, warning amber), not system decoration.
- **Don't** use ink-muted (`oklch(0.640 0.005 150)`) for body-size text. It may not reach 4.5:1 on white — it is a placeholder and short-label color only.
- **Don't** add decorative motion or page-load choreography. State changes get 150ms transitions; the page loads into a task.
