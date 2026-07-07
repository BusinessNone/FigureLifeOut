# Cerulean360 Design System (C360) — Agent Instructions
Version 1.0 | Owner: Ben Vollmer | Brand: Cerulean360 | Anchor color: Cerulean Blue

## How to use this file
Drop this file into the coding agent's instruction path so every UI it generates conforms without being asked:
- **Claude Code / Claude Cowork:** append to `CLAUDE.md` at repo root, or save as `.claude/rules/design-system.md`
- **Antigravity:** save as a rules file (e.g. `.agent/rules/design-system.md`) or append to the workspace `GEMINI.md`
- **Claude.ai artifacts:** paste into Project instructions

Agents: treat every rule below as a hard constraint unless the user explicitly overrides it in the prompt. When a value is not specified here, derive it from the nearest token. Never invent new hex values, font sizes, or spacing values.

---

## 1. Design intent
Cerulean360 builds **operations-grade software and product consulting deliverables**: consoles, dashboards, calculators, prototypes, and client tools. The aesthetic is a professional instrument with a clear sky-and-sea signature, confident, calm, and legible at density.

Principles, in priority order:
1. **Data first.** Density over whitespace theater. The user is an operator scanning state, not a visitor being sold.
2. **One accent, spent carefully.** Cerulean (#007BA7) marks the primary action, active state, and links. Nothing else gets it.
3. **Monospace for machine identity.** IDs, GUIDs, API names, version numbers, and pipeline stages render in the mono face. Humans read prose; operators read identifiers.
4. **The 360 mark.** The brand signature is the ring: circular progress indicators, ring-shaped KPI gauges, and a thin circular avatar/status treatment are the preferred motif wherever a radial element is legitimate. Use the ring only where it encodes real data (progress, completion, coverage). Never as decoration.
5. **Quiet chrome.** Borders and dividers do structural work. Shadows are for elevation only (menus, dialogs).
6. **Dark mode is first-class,** shipped from day one via tokens, not an inversion filter.

## 2. Design tokens
Define once as CSS custom properties (or the Tailwind theme, Section 10). All component styles reference tokens only. Accent contrast is verified: #007BA7 on white is 4.78:1 and the dark-theme accent #4FB8DE on surface is 7.2:1, both AA-compliant for text.

### 2.1 Color — light theme (default)
```css
:root {
  /* Brand — Cerulean ramp */
  --c360-accent:          #007BA7;  /* primary actions, active nav, links, focus */
  --c360-accent-hover:    #00688C;
  --c360-accent-pressed:  #005775;
  --c360-accent-subtle:   #E8F4F9;  /* selected rows, active tab background */
  --c360-accent-deep:     #2A52BE;  /* secondary brand tone (pigment cerulean blue); charts and gradients only */
  /* Neutrals — cool-tinted to sit with cerulean */
  --c360-bg-canvas:       #F4F6F7;
  --c360-bg-surface:      #FFFFFF;
  --c360-bg-sunken:       #EAEEF0;
  --c360-border:          #D3DADD;
  --c360-border-strong:   #A4B0B5;
  --c360-text-primary:    #1B1B1A;
  --c360-text-secondary:  #5C5C58;
  --c360-text-disabled:   #9EA6A9;
  /* Semantic (status is never conveyed by color alone; pair with icon or label) */
  --c360-success:         #107C10;
  --c360-success-subtle:  #E6F2E6;
  --c360-warning:         #B85C00;
  --c360-warning-subtle:  #FCF0E4;
  --c360-danger:          #C42B1C;
  --c360-danger-subtle:   #FBEAE8;
  --c360-info:            #007BA7;
  --c360-info-subtle:     #E8F4F9;
}
```

### 2.2 Color — dark theme
```css
[data-theme="dark"] {
  --c360-accent:          #4FB8DE;
  --c360-accent-hover:    #6FC5E4;
  --c360-accent-pressed:  #3AA9D3;
  --c360-accent-subtle:   #0B2833;
  --c360-accent-deep:     #6E8FE0;
  --c360-bg-canvas:       #14181A;
  --c360-bg-surface:      #1C2225;
  --c360-bg-sunken:       #101416;
  --c360-border:          #2E383C;
  --c360-border-strong:   #47555B;
  --c360-text-primary:    #ECEFF0;
  --c360-text-secondary:  #A0ABAF;
  --c360-text-disabled:   #616C70;
  --c360-success:         #6CCB5F;
  --c360-success-subtle:  #10290F;
  --c360-warning:         #F0A05A;
  --c360-warning-subtle:  #33200C;
  --c360-danger:          #F1707B;
  --c360-danger-subtle:   #38100D;
  --c360-info:            #4FB8DE;
  --c360-info-subtle:     #0B2833;
}
```

### 2.3 Typography
Cerulean360 is not Microsoft-bound; Inter leads, with Segoe as the Windows fallback.
```css
--c360-font-ui:   "Inter", "Segoe UI Variable", "Segoe UI", -apple-system, system-ui, sans-serif;
--c360-font-mono: "JetBrains Mono", "Cascadia Code", "Consolas", ui-monospace, monospace;
```
Type scale (rem, base 16px). No values outside this scale.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `--c360-type-display` | 1.75rem / 2.25rem | 600 | Page title, one per page |
| `--c360-type-title` | 1.25rem / 1.75rem | 600 | Panel and dialog headers |
| `--c360-type-subtitle` | 1rem / 1.5rem | 600 | Card headers, section labels |
| `--c360-type-body` | 0.875rem / 1.25rem | 400 | Default text, table cells |
| `--c360-type-body-strong` | 0.875rem / 1.25rem | 600 | Emphasis inside body |
| `--c360-type-caption` | 0.75rem / 1rem | 400 | Metadata, timestamps, helper text |
| `--c360-type-mono` | 0.8125rem / 1.25rem | 400 | IDs, GUIDs, code, API names |
| `--c360-type-eyebrow` | 0.6875rem / 1rem | 600, uppercase, 0.06em tracking | Group labels above nav sections and stat cards |

### 2.4 Spacing, radius, elevation, motion
- **Spacing scale (px):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Nothing else. Defaults: buttons 8/16, inputs 8/12, cards 20, table cells 8/12, page gutter 24 (16 on mobile).
- **Radius:** `--c360-radius-sm: 4px` (buttons, inputs, badges), `--c360-radius-md: 8px` (cards, panels), `--c360-radius-lg: 12px` (dialogs), `--c360-radius-full: 9999px` (ring gauges, status badges, avatars only).
- **Elevation:** `--c360-shadow-flyout: 0 4px 16px rgb(0 30 42 / 0.16)` for menus and popovers; `--c360-shadow-dialog: 0 8px 32px rgb(0 30 42 / 0.24)` for modals. Cards get a 1px `--c360-border`, no shadow.
- **Motion:** `--c360-ease: cubic-bezier(0.33, 0, 0.67, 1)`. Durations: 100ms (hover/press), 150ms (expand/collapse), 200ms (dialog/panel enter), 400ms (ring gauge sweep, once, on data load). No entrance animations on page load. Respect `prefers-reduced-motion: reduce` by disabling all non-essential transitions, including the ring sweep.

## 3. Layout — the console shell
Default application frame for any console or dashboard:
```
+--------------------------------------------------------------+
| Header 48px: Cerulean360 wordmark | context switcher | search |
+----------+---------------------------------------------------+
| Sidebar  |  Page header: title + primary action (right)      |
| 240px    |  ------------------------------------------------ |
| collaps- |  Content: 24px gutter, max-width 1440px           |
| ible to  |  Stat/ring cards row -> filters -> table/detail   |
| 48px     |                                                   |
+----------+---------------------------------------------------+
```
- Sidebar: `--c360-bg-surface`, 1px right border, nav items 36px tall, active item gets `--c360-accent-subtle` background plus a 3px accent bar on the left edge. Groups labeled with eyebrow type.
- One primary button per view, top right of the page header.
- Breakpoints: 640 / 1024 / 1440. Below 1024 the sidebar collapses to icons; below 640 it becomes a sheet.
- Content pages never scroll horizontally. Tables scroll internally.

## 4. Components
All interactive components implement every state: default, hover, active/pressed, focus-visible, disabled, and (where async) loading. Focus is always `outline: 2px solid var(--c360-accent); outline-offset: 2px`.

**Button.** Sizes 32/36/40px tall. Variants: Primary (cerulean fill, white text; one per view), Secondary (surface fill, 1px border), Ghost (transparent, text-secondary, for toolbars and table rows), Danger (danger fill, destructive confirmations only). Loading replaces the label with a spinner at fixed width and keeps the button disabled. Labels are verbs: "Deploy", "Save changes", "Export CSV". Never "Submit", "OK", or "Click here".

**Input / Select / Textarea.** 32px tall (40px on touch), `--c360-bg-sunken` well, 1px border, sm radius. Label above in caption weight 600, helper or error text below in caption. Error state: danger border plus a message with an icon, never color alone. Required fields marked; optional fields labeled "(optional)".

**Data table.** The workhorse. Header row: caption type, weight 600, text-secondary; sortable columns show direction on the active sort only. Rows 40px (compact 32px), 1px bottom borders, hover `--c360-bg-sunken`, selected `--c360-accent-subtle`. Identifier columns use mono type. Numeric columns right-aligned with `font-variant-numeric: tabular-nums`. Row actions appear as ghost icon buttons on hover, always keyboard-reachable. Pagination or virtualization above 100 rows. Empty state: icon, one sentence naming the situation, one action.

**Ring gauge (brand signature).** A 3px-stroke circular progress ring in `--c360-accent` over a `--c360-border` track, value centered in display type with tabular figures, label below in eyebrow type. Use for completion, coverage, utilization, and health scores. Semantic recolor allowed (success/warning/danger) when thresholds are defined. One sweep animation on load (400ms), none on update ticks.

**Card / stat card.** Surface, md radius, 1px border, 20px padding. Stat card: eyebrow label, value in display type with tabular figures, delta as a caption badge (success/danger subtle) with a direction glyph. Where the metric is a percentage of a whole, prefer the ring gauge variant.

**Badge.** Pill, caption type, semantic subtle background with matching text color, and a leading dot or icon. Fixed vocabulary where applicable: Healthy, Degraded, Failed, Pending, Running, Blocked.

**Toast.** Bottom right, surface with flyout shadow, semantic accent bar on the left edge, auto-dismiss 5s (errors persist until dismissed). Text states the result in past tense matching the action: "Publish" produces "Published to UAT."

**Dialog.** Max-width 480px (forms) or 720px (content), lg radius, dialog shadow, scrim rgb(0 20 28 / 0.45). Title, body, then actions right-aligned: Secondary "Cancel" plus one Primary. Destructive dialogs name the object being destroyed and use the Danger button.

**Skeletons** for loading regions (pulse animation, sunken color); spinners only inside buttons or inline fetches.

## 5. Data visualization
Chart series order: `#007BA7, #2A52BE, #00A896, #8764B8, #C05299, #B85C00`. Gridlines `--c360-border` at 50% opacity, no chart borders, axis labels in caption type. Tooltips are surface flyouts. KPI deltas always show a direction glyph plus value. Never rely on color alone to distinguish series; use direct labels or distinct markers when series count exceeds three. Donut/radial charts are on-brand but only when parts-of-a-whole is the honest encoding; default to bars for comparison.

## 6. UX writing
- Sentence case everywhere: titles, buttons, labels, nav. No Title Case.
- Name things by what the user controls, not how the system is built.
- Errors state what happened and the fix: "Deployment failed: the UAT connection reference is unbound. Open settings to bind it." Errors never apologize and are never vague.
- No exclamation points, no emoji in product UI, no filler.
- An action keeps its name through the whole flow: the "Publish" button yields a "Published" toast.

## 7. Accessibility floor (non-negotiable)
- WCAG 2.1 AA contrast: 4.5:1 body text, 3:1 large text and UI boundaries. The token pairs above pass; do not lighten them. Accent text on `--c360-accent-subtle` is 4.27:1, so use it for large text and icons only, never body copy.
- Every interactive element keyboard-reachable in logical order, with visible focus (Section 4 outline). Dialogs trap focus and close on Escape.
- Touch targets minimum 40x40px on touch layouts.
- Meaningful icons get accessible names; decorative icons get `aria-hidden`. Ring gauges expose value and label via `role="meter"` with `aria-valuenow`.
- `prefers-reduced-motion` and `prefers-color-scheme` both respected.

## 8. Agent enforcement rules
When generating or editing UI code:
1. **Never hardcode** a hex color, font size, spacing, radius, or shadow. Reference a token. If asked for something the tokens cannot express, add a token first and say so.
2. **Never introduce a new font family** or a second icon set (use Lucide by default; stay with one set per repo) or component library without being asked.
3. **Default stack:** React + Tailwind mapped to these tokens (Section 10), or plain HTML/CSS with the custom properties. For Power Apps: map tokens to theme JSON and modern controls; for PCF controls, import the same CSS variables.
4. **Ship both themes.** Any new surface must render correctly in light and dark before it is done.
5. **Build every state.** A component without hover, focus-visible, disabled, loading, empty, and error states is incomplete.
6. **No decorative motion.** No page-load entrance animations, no parallax, no gradient meshes, no glassmorphism. The single permitted flourish is the ring gauge sweep.
7. **Ring discipline.** Radial elements only where the data is genuinely circular or parts-of-a-whole. If a reviewer could ask "why is this a ring," it should be a bar.
8. **Self-check before finishing:** grep the diff for raw hex values (`#[0-9a-fA-F]{3,8}`) outside token definitions, arbitrary pixel values off the spacing scale, and missing focus styles. Fix before presenting.
9. When the user asks for "a quick prototype", these rules still apply; speed comes from the system, not from abandoning it.

## 9. Do / Don't
| Do | Don't |
|---|---|
| One primary cerulean action per view | Multiple accent-filled buttons competing |
| Ring gauges for completion and coverage | Rings as decoration or logo wallpaper |
| Mono type for IDs, GUIDs, versions | Prose font for machine identifiers |
| 1px borders for card structure | Drop shadows on resting cards |
| Semantic subtle backgrounds for status | Raw red/green fills or color-only status |
| Tabular numerals in tables and KPIs | Proportional figures that misalign |
| `--c360-accent-deep` in charts only | Deep blue leaking into buttons or nav |

## 10. Tailwind mapping (drop-in)
```js
// tailwind.config.js — extend, referencing the CSS variables
export default {
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "var(--c360-accent)", hover: "var(--c360-accent-hover)",
                  pressed: "var(--c360-accent-pressed)", subtle: "var(--c360-accent-subtle)",
                  deep: "var(--c360-accent-deep)" },
        canvas: "var(--c360-bg-canvas)", surface: "var(--c360-bg-surface)",
        sunken: "var(--c360-bg-sunken)",
        line: { DEFAULT: "var(--c360-border)", strong: "var(--c360-border-strong)" },
        ink: { DEFAULT: "var(--c360-text-primary)", soft: "var(--c360-text-secondary)",
               faint: "var(--c360-text-disabled)" },
        success: { DEFAULT: "var(--c360-success)", subtle: "var(--c360-success-subtle)" },
        warning: { DEFAULT: "var(--c360-warning)", subtle: "var(--c360-warning-subtle)" },
        danger:  { DEFAULT: "var(--c360-danger)",  subtle: "var(--c360-danger-subtle)" },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI Variable", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "12px" },
    },
  },
};
```

## 11. Versioning
Changes to tokens are breaking changes. Bump the version header, note the migration in a changelog section at the bottom of this file, and update both themes together.
