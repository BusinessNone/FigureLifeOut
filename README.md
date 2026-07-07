# 🧭 FigureLifeOut

A tiny, no-nonsense tool for making big life decisions with clarity.

Stuck between two jobs? Two cities? Two versions of your future? FigureLifeOut turns
a hard choice into a clear one using a **weighted decision matrix** — you decide what
matters and how much, score each option honestly, and let the math surface where you're
actually leaning.

**[→ Open `index.html` in your browser](index.html)** — that's it. No install, no build,
no account. Everything stays on your device.

It's also an installable **Progressive Web App**: served over HTTPS (e.g. GitHub Pages),
you can add it to your phone or desktop home screen and it works fully offline, like a
native app — still with zero data leaving your device.

## How it works

1. **Name what matters.** Add the criteria that drive the decision (salary, commute,
   growth, happiness…) and slide each one's weight from 1–10 to reflect how much it counts.
2. **List your options.** The real ones you're torn between.
3. **Score each option** 0–10 on every criterion in the grid.
4. **See where you lean.** Each option gets a weighted score on a 10-point scale, the
   leader is starred, and the banner tells you how decisive the gap is — or when it's a
   near-tie worth trusting your gut on.

The score for each option is the weight-normalized average:

```
score = Σ(rating × weight) / Σ(weight)     → a number from 0 to 10
```

Because it's normalized by total weight, adding criteria or changing weights keeps every
option on the same 0–10 scale, so comparisons stay honest.

### Dealbreakers — fixing weighted-sum's biggest weakness

A plain weighted average is **fully compensatory**: an option that's catastrophic on the
one thing you care about most can still "win" if it's strong everywhere else, because the
average just smooths the disaster away. That's the most common, well-founded complaint
about this class of scoring model.

FigureLifeOut fixes it: mark any criterion as a **dealbreaker**. If an option scores 2 or
below on a dealbreaker, it's **disqualified outright** — shown struck through with a clear
reason, removed from contention for the win — no matter how well it scores everywhere else.
If every option fails a dealbreaker, the app says so plainly instead of quietly crowning a
disqualified option "the winner." A blank (unscored) cell never disqualifies — only an
explicit low score does.

## Features

- ⚖️ Weighted criteria with live-updating results
- 🚫 **Dealbreakers** — mark a criterion as a hard requirement; options that fail it are
  disqualified outright, not just averaged down (see above)
- 📊 Results chart — a weighted bar ranking so the standing reads at a glance
- ◍ **Coverage ring** — the Cerulean360 signature ring gauge, showing how much of the matrix
  you've actually scored; it turns amber when the matrix is too sparse to trust the result yet
- 🧠 **Insight engine** — reasons about your matrix *on your device*: how decisive the
  result is, the single criterion the whole decision **hinges** on, options that are
  **dominated** (beaten on every criterion), whether your criteria actually separate the
  options, and gaps in your scoring. No LLM, no network — just heuristics running locally.
- 🎚️ **Sensitivity analysis** — tells you how *robust* your result is: the smallest single
  weight change that would flip the winner, or a green light that nothing can.
- 🚀 **Starter templates** — begin from a curated set of criteria for common decisions
  (job offer, where to live, big purchase, life crossroads) instead of a blank page.
- 🔥 Heatmap scoring grid — strengths and weaknesses jump out at a glance
- 🫀 **Gut check** — record which way your intuition leans *before* the math, then see
  whether the numbers agree. When they don't, that gap is the most useful thing on screen.
- 📝 Notes & reflections — capture the things a number can't
- ↕️ Sort options by score, or keep entry order while you type
- ⌫ **Reset scores** — clear the whole matrix to re-score from scratch, undoable
- ⧉ Duplicate a decision to explore "what if" scenarios without touching the original
- 🔗 **Shareable links** — copy a link that encodes your whole matrix so someone can open
  it, see it, and tweak it. The data rides in the URL (no server stores it), and your
  private notes and gut pick are deliberately left out of the link.
- ↩️ **Undoable deletes** — removing a decision, criterion, or option surfaces an Undo toast
  and restores it (with its scores) in place; no blocking confirm dialogs
- 🗂 Multiple saved decisions, each showing a last-edited time and sorted most-recent-first
- ↕️ **Reorder criteria & options** — drag by the handle, or focus it and use the arrow
  keys; the matrix columns and rows follow, and the order persists
- ⌨️ **Keyboard-first & accessible** — fly through the score grid with Tab/Enter, reorder
  with arrow keys, a `?` shortcuts overlay, a focus-trapped template dialog that restores
  focus, screen-reader labels on every score cell and live announcements for leader changes
  and reordering, visible focus rings, and `prefers-reduced-motion` support
- 🌗 Light / dark theme
- 📤 Export / import as JSON (portable backups) or export the matrix as CSV
- 📱 Responsive — works on phone and desktop, verified down to a 375px screen
- 🔒 100% local — no server, no tracking, no network calls

## Design

The UI conforms to the **Cerulean360 (C360) design system** — a cerulean accent, token-only
colors (light and dark shipped from the same tokens), the Inter/JetBrains Mono type scale,
quiet 1px chrome, and a single Lucide icon set (no emoji in product UI). The full spec lives
at [`.claude/rules/design-system.md`](.claude/rules/design-system.md) so any agent working in
this repo conforms without being asked.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup and structure |
| `styles.css` | Theme, layout, components |
| `app.js` | State, scoring math, insight engine, rendering — plain vanilla JS |
| `manifest.webmanifest` · `sw.js` | PWA manifest and offline service worker |
| `icon*.png` · `icon.svg` | App icons |
| `.github/workflows/` | CI (tests) and GitHub Pages deploy |
| `tests/e2e.mjs` · `scripts/serve.mjs` | End-to-end tests and a tiny static server |

The **app itself has zero runtime dependencies** — it ships as static files. Playwright is a
dev-only dependency used for testing. Open `index.html`, or serve the folder with any static host.

## Testing

End-to-end tests drive a real headless browser and cover scoring, dealbreaker
disqualification, the insight engine, sensitivity analysis, the gut check, keyboard
navigation, shareable links, persistence, and offline PWA behavior.

```bash
npm install          # dev dependencies: ESLint, Playwright
npx playwright install chromium
npm run lint         # ESLint (flat config)
npm test             # runs tests/e2e.mjs against a local static server
```

CI runs lint and the full test suite on every push and pull request
(`.github/workflows/ci.yml`).

## Deploying

This is a **static site — no Jekyll**. Pushing to `main` triggers the included GitHub
Actions workflow, which uploads the folder as-is (Jekyll is never invoked). To turn it on
once: **repo Settings → Pages → Build and deployment → Source: "GitHub Actions".** The app
then publishes to `https://<user>.github.io/<repo>/` and is installable from there.

A `.nojekyll` file is included so files are always served verbatim, even if Pages is ever
switched to the "Deploy from a branch" source.

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

*A first decision is seeded as an example — delete it once you've had a look.*
