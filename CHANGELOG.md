# Changelog

All notable changes to FigureLifeOut are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-07-08

First stable release.

### Added
- Weighted decision matrix: name criteria, weight them 1–10, score options
  0–10, see a live weighted result on a 0–10 scale.
- **Dealbreaker criteria** — mark a criterion as a hard requirement; an
  option scoring 2 or below on it is disqualified outright rather than
  quietly averaged down. A blank cell never disqualifies.
- **Decide** — lock in a decision; scores, weights, criteria, options, and
  notes freeze. **Reopen** unlocks it again, undoably. A decided decision
  prints as a clean one-page record with editing chrome stripped out.
- Local insight engine: decisiveness of the result, the single criterion
  the decision hinges on, dominated options, scoring gaps — computed
  entirely on-device, no LLM, no network.
- Sensitivity analysis: the smallest weight change that would flip the
  winner, or confirmation that nothing can.
- Starter templates (job offer, where to live, big purchase, life
  crossroads) and a gut-check field to compare intuition against the math.
- Results chart, heatmap scoring grid, and the Cerulean360 signature
  coverage ring gauge.
- Shareable links (matrix encoded in the URL, notes and gut pick excluded),
  JSON import/export, and CSV export.
- Multiple saved decisions with last-edited timestamps, duplicate,
  undoable delete/reset, and drag-or-keyboard reordering.
- Full keyboard navigation, screen-reader labels and live announcements,
  a `?` shortcuts overlay, and visible focus rings throughout.
- Light and dark themes built on the Cerulean360 design system.
- Installable Progressive Web App: manifest, offline-capable service
  worker, home-screen icons for iOS/Android/desktop.
- End-to-end test suite (Playwright + Node's test runner) covering
  scoring, dealbreakers, Decide/Reopen, accessibility, persistence, and
  offline behavior, run in CI across Chromium, Firefox, and WebKit.

### Fixed
- A dealbreaker-disqualified option could still rank above the qualifying
  leader when sorting by score.
- WCAG AA contrast failures on disqualified-option text and several
  caption/label colors that misused the disabled-text token.
- A flaky CI test caused by reading a live-region's text before its
  `requestAnimationFrame` update landed.
- Cross-browser CI failures: a clipboard-permission assumption that broke
  on Chromium and WebKit in CI, and a deterministic WebKit/Linux engine
  limitation navigating while offline and service-worker-controlled.
- **Multi-tab data loss** — saving always persisted the whole decisions
  array from memory, so two tabs open at once could silently clobber each
  other's edits. Fixed with a cross-tab merge via the `storage` event.

### Security
- Fixed a stored-XSS path where an imported decision's `id` was trusted
  verbatim instead of always minting a fresh one.
- Neutralized CSV/formula-injection in exported files (CWE-1236).
