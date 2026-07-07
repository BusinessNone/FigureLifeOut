# 🧭 FigureLifeOut

A tiny, no-nonsense tool for making big life decisions with clarity.

Stuck between two jobs? Two cities? Two versions of your future? FigureLifeOut turns
a hard choice into a clear one using a **weighted decision matrix** — you decide what
matters and how much, score each option honestly, and let the math surface where you're
actually leaning.

**[→ Open `index.html` in your browser](index.html)** — that's it. No install, no build,
no account. Everything stays on your device.

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

## Features

- ⚖️ Weighted criteria with live-updating results
- 📊 Results chart — a weighted bar ranking so the standing reads at a glance
- 🧠 **Insight engine** — reasons about your matrix *on your device*: how decisive the
  result is, the single criterion the whole decision **hinges** on, options that are
  **dominated** (beaten on every criterion), whether your criteria actually separate the
  options, and gaps in your scoring. No LLM, no network — just heuristics running locally.
- 🔥 Heatmap scoring grid — strengths and weaknesses jump out at a glance
- 🫀 **Gut check** — record which way your intuition leans *before* the math, then see
  whether the numbers agree. When they don't, that gap is the most useful thing on screen.
- 📝 Notes & reflections — capture the things a number can't
- ↕️ Sort options by score, or keep entry order while you type
- ⧉ Duplicate a decision to explore "what if" scenarios without touching the original
- 🗂 Multiple saved decisions, kept in your browser's local storage
- 🌗 Light / dark theme
- 📤 Export / import as JSON (portable backups) or export the matrix as CSV
- 📱 Responsive — works on phone and desktop
- 🔒 100% local — no server, no tracking, no network calls

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup and structure |
| `styles.css` | Theme, layout, components |
| `app.js` | State, scoring math, rendering — plain vanilla JS |

No dependencies. Open the file, or serve the folder with any static host.

---

*A first decision is seeded as an example — delete it once you've had a look.*
