/* FigureLifeOut — a weighted decision matrix.
 * State lives entirely in localStorage. No network, no build step. */

(() => {
  "use strict";

  const STORE_KEY = "figurelifeout.v1";
  const THEME_KEY = "figurelifeout.theme";

  /* ---------- Lucide icons (inlined; one set per repo, per C360) ---------- */
  const ICONS = {
    compass: `<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>`,
    moon: `<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
    target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    search: `<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`,
    pencil: `<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`,
    "sliders-horizontal": `<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>`,
    "circle-check": `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
    "circle-x": `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`,
    scale: `<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>`,
    award: `<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>`,
    briefcase: `<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>`,
    house: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
    "shopping-cart": `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`,
    "file-pen": `<path d="M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z"/>`,
    "heart-pulse": `<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>`,
    "grip-vertical": `<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>`,
    x: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    keyboard: `<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>`,
    clock: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
  };
  function icon(name, cls) {
    return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  /* ---------- tiny id + storage helpers ---------- */
  let _seq = 0;
  const uid = () => `${Date.now().toString(36)}${(_seq++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

  // Shared sanitizers — used both for data loaded from storage/import and
  // for imported share links, so malformed values can never propagate NaN
  // into the scoring math or the literal string "undefined" into an input.
  const clampWeight = (w) => Math.max(1, Math.min(10, Math.round(Number(w)) || 5));
  const clampScore = (v) => Math.max(0, Math.min(10, Math.round(Number(v))));
  const cleanStr = (s, max) => (typeof s === "string" ? s : String(s ?? "")).slice(0, max);

  const load = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { decisions: [], activeId: null };
      const data = JSON.parse(raw);
      if (!Array.isArray(data.decisions)) return { decisions: [], activeId: null };
      // A single corrupt entry (e.g. hand-edited localStorage) should not
      // wipe every other saved decision — filter, then normalize what's left.
      data.decisions = data.decisions.filter((d) => d && typeof d === "object").map(normalizeDecision);
      return data;
    } catch {
      return { decisions: [], activeId: null };
    }
  };

  const save = () => {
    // Stamp the active decision as edited (covers the vast majority of mutations).
    const a = state.decisions.find((d) => d.id === state.activeId);
    if (a) a.updatedAt = Date.now();
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      toast("Couldn't save — storage may be full.");
    }
  };

  const state = load();
  let sortByScore = false; // matrix view preference (session-only)

  /* Starter templates — curated criteria with sensible default weights. */
  const TEMPLATES = [
    { id: "blank", icon: "file-pen", name: "Blank", desc: "Start from scratch", title: "", criteria: [] },
    {
      id: "job", icon: "briefcase", name: "Job offer", desc: "Weigh a role or offer",
      title: "Which job should I take?",
      criteria: [["Compensation", 8], ["Work-life balance", 8], ["Growth & learning", 7], ["Team & culture", 7], ["Commute / location", 5]],
    },
    {
      id: "home", icon: "house", name: "Where to live", desc: "Compare places to live",
      title: "Where should I live?",
      criteria: [["Cost of living", 8], ["Career opportunities", 7], ["Climate & surroundings", 6], ["Close to people I love", 7], ["Lifestyle & things to do", 6]],
    },
    {
      id: "buy", icon: "shopping-cart", name: "Big purchase", desc: "A car, gadget, anything pricey",
      title: "Which one should I buy?",
      criteria: [["Price / value", 8], ["Quality & reliability", 8], ["Features I actually need", 7], ["Longevity / resale", 5]],
    },
    {
      id: "life", icon: "compass", name: "Life crossroads", desc: "A major life direction",
      title: "What should I do?",
      criteria: [["Happiness & fulfillment", 9], ["Financial impact", 7], ["Impact on relationships", 7], ["Growth & challenge", 6], ["Alignment with my values", 8]],
    },
  ];

  /* ---------- DOM refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const el = {
    list: $("#decision-list"),
    newBtn: $("#new-decision"),
    emptyNew: $("#empty-new"),
    empty: $("#empty-state"),
    editor: $("#decision-editor"),
    title: $("#decision-title"),
    deleteBtn: $("#delete-decision"),
    duplicateBtn: $("#duplicate-decision"),
    shareBtn: $("#share-decision"),
    banner: $("#result-banner"),
    gutCheck: $("#gut-check"),
    gutSelect: $("#gut-select"),
    insightWrap: $("#insight-wrap"),
    chart: $("#results-chart"),
    insights: $("#insights-list"),
    robustness: $("#robustness"),
    coverage: $("#coverage"),
    modal: $("#template-modal"),
    modalClose: $("#modal-close"),
    templateGrid: $("#template-grid"),
    helpBtn: $("#help-btn"),
    helpModal: $("#help-modal"),
    helpClose: $("#help-close"),
    notes: $("#notes-input"),
    sortToggle: $("#sort-toggle"),
    resetScores: $("#reset-scores"),
    csvBtn: $("#csv-btn"),
    criteria: $("#criteria-list"),
    critForm: $("#criterion-form"),
    critInput: $("#criterion-input"),
    options: $("#options-list"),
    optForm: $("#option-form"),
    optInput: $("#option-input"),
    matrix: $("#matrix"),
    matrixEmpty: $("#matrix-empty"),
    themeToggle: $("#theme-toggle"),
    toast: $("#toast"),
    live: $("#live"),
    exportBtn: $("#export-btn"),
    importBtn: $("#import-btn"),
    importFile: $("#import-file"),
  };

  /* ---------- model helpers ---------- */
  const active = () => state.decisions.find((d) => d.id === state.activeId) || null;

  function makeDecision() {
    return {
      id: uid(),
      title: "",
      criteria: [], // { id, name, weight }
      options: [],  // { id, name }
      scores: {},   // scores[optionId][criterionId] = 0..10
      notes: "",
      gut: null,    // optionId the user's intuition favors
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /* Backfill fields on decisions loaded from older saves. */
  function normalizeDecision(d) {
    if (typeof d.title !== "string") d.title = "";
    if (typeof d.notes !== "string") d.notes = "";
    if (!("gut" in d)) d.gut = null;
    if (!Array.isArray(d.criteria)) d.criteria = [];
    if (!Array.isArray(d.options)) d.options = [];
    // Sanitize each criterion/option to a known shape; assign a fresh id to
    // any entry missing one (e.g. hand-edited or older-format JSON) so
    // scores (keyed by id) never silently orphan.
    d.criteria = d.criteria
      .filter((c) => c && typeof c === "object")
      .map((c) => ({ id: typeof c.id === "string" && c.id ? c.id : uid(), name: cleanStr(c.name, 40), weight: clampWeight(c.weight) }));
    d.options = d.options
      .filter((o) => o && typeof o === "object")
      .map((o) => ({ id: typeof o.id === "string" && o.id ? o.id : uid(), name: cleanStr(o.name, 40) }));
    const critIds = new Set(d.criteria.map((c) => c.id));
    const optIds = new Set(d.options.map((o) => o.id));
    const rawScores = d.scores && typeof d.scores === "object" ? d.scores : {};
    const scores = {};
    for (const optId of Object.keys(rawScores)) {
      if (!optIds.has(optId) || !rawScores[optId] || typeof rawScores[optId] !== "object") continue;
      for (const critId of Object.keys(rawScores[optId])) {
        if (!critIds.has(critId)) continue;
        const v = rawScores[optId][critId];
        if (Number.isFinite(Number(v))) (scores[optId] || (scores[optId] = {}))[critId] = clampScore(v);
      }
    }
    d.scores = scores;
    if (!Number.isFinite(d.createdAt)) d.createdAt = Date.now();
    if (!Number.isFinite(d.updatedAt)) d.updatedAt = d.createdAt;
    return d;
  }

  // Compact relative time, e.g. "just now", "5m ago", "3d ago".
  function relTime(ts) {
    if (!ts) return "";
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return "just now";
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const dd = Math.round(h / 24);
    if (dd < 7) return `${dd}d ago`;
    const w = Math.round(dd / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.round(dd / 30);
    if (mo < 12) return `${mo}mo ago`;
    return `${Math.round(dd / 365)}y ago`;
  }

  /* A subtle low/mid/high tint for a 0–10 score, using semantic subtle
     tokens so it stays on-palette and theme-aware. */
  function heatColor(score) {
    if (!Number.isFinite(score)) return "";
    if (score <= 3) return "var(--c360-danger-subtle)";
    if (score <= 6) return "var(--c360-warning-subtle)";
    return "var(--c360-success-subtle)";
  }

  /* Weighted result: for each option, sum(score * weight) / sum(weight) → 0..10 scale */
  function computeResults(d) {
    const totalWeight = d.criteria.reduce((s, c) => s + c.weight, 0);
    const rows = d.options.map((opt) => {
      let acc = 0;
      for (const c of d.criteria) {
        const raw = d.scores[opt.id]?.[c.id];
        const score = Number.isFinite(raw) ? raw : 0;
        acc += score * c.weight;
      }
      const normalized = totalWeight > 0 ? acc / totalWeight : 0;
      return { opt, total: acc, normalized };
    });
    rows.sort((a, b) => b.total - a.total);
    return { rows, totalWeight };
  }

  const scoreOf = (d, optId, critId) => {
    const v = d.scores[optId]?.[critId];
    return Number.isFinite(v) ? v : 0;
  };

  /* Winning option id if a given criterion were dropped — powers "swing criterion" detection. */
  function winnerWithout(d, excludeCritId) {
    const crits = d.criteria.filter((c) => c.id !== excludeCritId);
    const tw = crits.reduce((s, c) => s + c.weight, 0);
    if (tw === 0 || d.options.length === 0) return null;
    let best = null, bestScore = -1;
    for (const o of d.options) {
      let acc = 0;
      for (const c of crits) acc += scoreOf(d, o.id, c.id) * c.weight;
      if (acc > bestScore) { bestScore = acc; best = o.id; }
    }
    return best;
  }

  /* Winner id if one criterion's weight were changed to newWeight. */
  function winnerWith(d, critId, newWeight) {
    let best = null, bestScore = -1;
    for (const o of d.options) {
      let acc = 0;
      for (const c of d.criteria) {
        const w = c.id === critId ? newWeight : c.weight;
        acc += scoreOf(d, o.id, c.id) * w;
      }
      if (acc > bestScore) { bestScore = acc; best = o.id; }
    }
    return best;
  }

  /* Sensitivity: the smallest single weight change that flips the winner, if any. */
  function sensitivity(d) {
    const { rows, totalWeight } = computeResults(d);
    if (rows.length < 2 || totalWeight === 0 || rows[0].total <= 0) return null;
    const winner = rows[0].opt.id;
    let best = null; // { crit, from, to, newWinner, delta }
    for (const c of d.criteria) {
      for (let w = 1; w <= 10; w++) {
        if (w === c.weight) continue;
        if (winnerWith(d, c.id, w) !== winner) {
          const delta = Math.abs(w - c.weight);
          if (!best || delta < best.delta) best = { crit: c, from: c.weight, to: w, delta };
        }
      }
    }
    if (!best) return { robust: true };
    const newWinner = winnerWith(d, best.crit.id, best.to);
    return {
      robust: false,
      crit: best.crit.name,
      from: best.from,
      to: best.to,
      newWinnerName: d.options.find((o) => o.id === newWinner)?.name || "another option",
    };
  }

  /* ---------- local insight engine (no network, pure heuristics) ---------- */
  function analyze(d) {
    const out = [];
    const { rows, totalWeight } = computeResults(d);
    if (rows.length === 0 || d.criteria.length === 0 || totalWeight === 0) return out;

    const scored = rows.some((r) => r.total > 0);
    if (!scored) return out;

    const nameById = new Map(d.options.map((o) => [o.id, o.name]));
    const leader = rows[0];
    const runner = rows[1];

    // 1) Decisiveness of the result
    if (rows.length >= 2) {
      const margin = leader.normalized - runner.normalized;
      if (margin < 0.3) {
        out.push({ tone: "warn", icon: "scale", html: `<strong>Photo finish.</strong> “${escapeHtml(leader.opt.name)}” and “${escapeHtml(runner.opt.name)}” are within ${margin.toFixed(1)} of each other — the math won't decide this one for you.` });
      } else if (margin >= 1.8) {
        out.push({ tone: "good", icon: "circle-check", html: `<strong>Clear leader.</strong> “${escapeHtml(leader.opt.name)}” is a decisive ${margin.toFixed(1)} points ahead — a robust result.` });
      }
    }

    // 2) Swing criterion — the one thing the whole decision hinges on
    if (rows.length >= 2 && d.criteria.length >= 2) {
      let swing = null;
      for (const c of d.criteria) {
        if (winnerWithout(d, c.id) !== leader.opt.id) { swing = c; break; }
      }
      if (swing) {
        out.push({ tone: "info", icon: "target", html: `<strong>This hinges on “${escapeHtml(swing.name)}.”</strong> Drop that one criterion and a different option wins. Make sure you scored it honestly.` });
      }
    }

    // 3) Dominated option — beaten or matched on every criterion by another
    for (const a of d.options) {
      for (const b of d.options) {
        if (a.id === b.id) continue;
        const everyGE = d.criteria.every((c) => scoreOf(d, b.id, c.id) >= scoreOf(d, a.id, c.id));
        const someGT = d.criteria.some((c) => scoreOf(d, b.id, c.id) > scoreOf(d, a.id, c.id));
        if (everyGE && someGT) {
          out.push({ tone: "info", icon: "circle-x", html: `<strong>“${escapeHtml(a.name)}” is dominated.</strong> “${escapeHtml(b.name)}” matches or beats it on every criterion — you can probably take it off the table.` });
          break;
        }
      }
      if (out.filter((i) => i.icon === "circle-x").length) break; // one is enough
    }

    // 4) Options barely differ — criteria aren't discriminating
    if (rows.length >= 2) {
      const spread = leader.normalized - rows[rows.length - 1].normalized;
      if (spread < 0.6) {
        out.push({ tone: "warn", icon: "search", html: `<strong>Your options score almost the same.</strong> Either they're genuinely equivalent, or you're missing a criterion that actually separates them.` });
      }
    }

    // 5) Incomplete scoring
    let blanks = 0, cells = 0;
    for (const o of d.options) for (const c of d.criteria) { cells++; if (!Number.isFinite(d.scores[o.id]?.[c.id])) blanks++; }
    if (blanks > 0 && blanks < cells) {
      out.push({ tone: "warn", icon: "pencil", html: `<strong>${blanks} of ${cells} scores are blank.</strong> They're counting as 0 — fill them in for a fairer comparison.` });
    }

    // 6) Flat weighting nudge
    if (d.criteria.length >= 3 && d.criteria.every((c) => c.weight === d.criteria[0].weight)) {
      out.push({ tone: "info", icon: "sliders-horizontal", html: `<strong>Every criterion is weighted equally.</strong> If some matter more than others, adjust the weights to sharpen the result.` });
    }

    void nameById;
    return out.slice(0, 5);
  }

  /* ---------- rendering ---------- */
  function render() {
    renderSidebar();
    const d = active();
    if (!d) {
      el.editor.hidden = true;
      el.empty.hidden = false;
      return;
    }
    el.empty.hidden = true;
    el.editor.hidden = false;
    el.title.value = d.title;
    el.notes.value = d.notes || "";
    renderCriteria(d);
    renderOptions(d);
    renderGutCheck(d);
    renderMatrix(d);
    renderBanner(d);
    renderInsights(d);
    renderCoverage(d);
  }

  function renderGutCheck(d) {
    if (d.options.length === 0) {
      el.gutCheck.hidden = true;
      return;
    }
    el.gutCheck.hidden = false;
    // Keep the user's pick only if it still points to a live option.
    if (d.gut && !d.options.some((o) => o.id === d.gut)) d.gut = null;
    let html = `<option value="">No pick yet</option>`;
    for (const o of d.options) {
      html += `<option value="${o.id}"${o.id === d.gut ? " selected" : ""}>${escapeHtml(o.name)}</option>`;
    }
    el.gutSelect.innerHTML = html;
  }

  function renderSidebar() {
    el.list.innerHTML = "";
    if (state.decisions.length === 0) return;
    // Most recently edited first.
    const ordered = [...state.decisions].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    for (const d of ordered) {
      const li = document.createElement("li");
      li.className = d.id === state.activeId ? "active" : "";
      const { rows } = computeResults(d);
      const leader = rows[0];
      const leadLabel = leader && leader.total > 0 ? leader.opt.name : "";
      const time = relTime(d.updatedAt);
      li.innerHTML = `<span class="li-main"><span class="li-title">${escapeHtml(d.title || "Untitled decision")}</span>` +
        (time ? `<span class="li-time">${time}</span>` : "") +
        `</span>` +
        (leadLabel ? `<span class="li-lead" title="Leading: ${escapeHtml(leadLabel)}">${icon("award")}</span>` : "");
      li.addEventListener("click", () => {
        state.activeId = d.id;
        save();
        render();
      });
      el.list.appendChild(li);
    }
  }

  /* ---------- reordering (drag + keyboard) for criteria/options ---------- */
  let dragId = null;

  function reorderArr(arr, fromId, toId, after) {
    const from = arr.findIndex((x) => x.id === fromId);
    if (from < 0) return;
    const [item] = arr.splice(from, 1);
    const to = arr.findIndex((x) => x.id === toId);
    if (to < 0) { arr.push(item); return; }
    arr.splice(after ? to + 1 : to, 0, item);
  }

  function moveInArr(arr, id, delta) {
    const i = arr.findIndex((x) => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= arr.length) return false;
    const [item] = arr.splice(i, 1);
    arr.splice(j, 0, item);
    return true;
  }

  const dropAfter = (e, li) => {
    const r = li.getBoundingClientRect();
    return e.clientY - r.top > r.height / 2;
  };
  const clearDropMarks = (listEl) =>
    listEl.querySelectorAll(".drop-before, .drop-after")
      .forEach((x) => x.classList.remove("drop-before", "drop-after"));

  // Wire a chip for reorder. Operates on d[key] live so it survives re-renders.
  function makeReorderable(li, handle, d, key, id, listEl) {
    li.dataset.id = id;
    handle.setAttribute("draggable", "true");

    handle.addEventListener("dragstart", (e) => {
      dragId = id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.setDragImage(li, 12, 12);
    });
    handle.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      clearDropMarks(listEl);
      dragId = null;
    });
    handle.addEventListener("keydown", (e) => {
      const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      if (!delta) return;
      e.preventDefault();
      if (moveInArr(d[key], id, delta)) {
        save();
        render();
        const moved = listEl.querySelector(`.chip[data-id="${id}"] .chip-handle`);
        if (moved) moved.focus();
        const arr = d[key];
        const pos = arr.findIndex((x) => x.id === id);
        const item = arr[pos];
        if (item) announce(`${item.name} moved to position ${pos + 1} of ${arr.length}`);
      }
    });

    li.addEventListener("dragover", (e) => {
      if (dragId === null || dragId === id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      clearDropMarks(listEl);
      li.classList.add(dropAfter(e, li) ? "drop-after" : "drop-before");
    });
    li.addEventListener("drop", (e) => {
      if (dragId === null || dragId === id) return;
      e.preventDefault();
      reorderArr(d[key], dragId, id, dropAfter(e, li));
      save();
      render();
    });
  }

  function renderCriteria(d) {
    el.criteria.innerHTML = "";
    for (const c of d.criteria) {
      const li = document.createElement("li");
      li.className = "chip";
      li.innerHTML = `
        <button class="chip-handle" aria-label="Reorder ${escapeHtml(c.name)}" title="Drag to reorder, or focus and use arrow keys">${icon("grip-vertical")}</button>
        <span class="chip-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="weight-control">
          <input type="range" min="1" max="10" value="${c.weight}" aria-label="Weight for ${escapeHtml(c.name)}" />
          <span class="weight-val">${c.weight}</span>
        </span>
        <button class="remove" title="Remove" aria-label="Remove ${escapeHtml(c.name)}">${icon("x")}</button>`;
      makeReorderable(li, li.querySelector(".chip-handle"), d, "criteria", c.id, el.criteria);
      const range = li.querySelector("input");
      const val = li.querySelector(".weight-val");
      range.addEventListener("input", () => {
        c.weight = Number(range.value);
        val.textContent = c.weight;
        save();
        renderMatrix(d);
        renderBanner(d);
        renderInsights(d);
        renderSidebar();
      });
      li.querySelector(".remove").addEventListener("click", () => {
        const idx = d.criteria.findIndex((x) => x.id === c.id);
        const removedScores = {};
        for (const optId in d.scores) {
          if (d.scores[optId] && Number.isFinite(d.scores[optId][c.id])) {
            removedScores[optId] = d.scores[optId][c.id];
            delete d.scores[optId][c.id];
          }
        }
        d.criteria = d.criteria.filter((x) => x.id !== c.id);
        save();
        render();
        toast(`Removed “${c.name}.”`, {
          label: "Undo",
          fn: () => {
            d.criteria.splice(Math.min(idx, d.criteria.length), 0, c);
            for (const optId in removedScores) {
              (d.scores[optId] || (d.scores[optId] = {}))[c.id] = removedScores[optId];
            }
            save();
            render();
          },
        });
      });
      el.criteria.appendChild(li);
    }
  }

  function renderOptions(d) {
    el.options.innerHTML = "";
    for (const o of d.options) {
      const li = document.createElement("li");
      li.className = "chip";
      li.innerHTML = `
        <button class="chip-handle" aria-label="Reorder ${escapeHtml(o.name)}" title="Drag to reorder, or focus and use arrow keys">${icon("grip-vertical")}</button>
        <span class="chip-name" title="${escapeHtml(o.name)}">${escapeHtml(o.name)}</span>
        <button class="remove" title="Remove" aria-label="Remove ${escapeHtml(o.name)}">${icon("x")}</button>`;
      makeReorderable(li, li.querySelector(".chip-handle"), d, "options", o.id, el.options);
      li.querySelector(".remove").addEventListener("click", () => {
        const idx = d.options.findIndex((x) => x.id === o.id);
        const removedScores = d.scores[o.id];
        d.options = d.options.filter((x) => x.id !== o.id);
        delete d.scores[o.id];
        save();
        render();
        toast(`Removed “${o.name}.”`, {
          label: "Undo",
          fn: () => {
            d.options.splice(Math.min(idx, d.options.length), 0, o);
            if (removedScores) d.scores[o.id] = removedScores;
            save();
            render();
          },
        });
      });
      el.options.appendChild(li);
    }
  }

  function renderMatrix(d) {
    const hasGrid = d.criteria.length > 0 && d.options.length > 0;
    el.matrix.hidden = !hasGrid;
    el.matrixEmpty.hidden = hasGrid;
    if (!hasGrid) {
      el.matrix.innerHTML = "";
      return;
    }

    const { rows } = computeResults(d);
    const leaderId = rows.length && rows[0].total > 0 ? rows[0].opt.id : null;
    const normById = new Map(rows.map((r) => [r.opt.id, r.normalized]));

    // Header
    let html = "<thead><tr><th></th>";
    for (const c of d.criteria) {
      html += `<th class="crit-head">${escapeHtml(c.name)}<span class="cw">×${c.weight}</span></th>`;
    }
    html += `<th class="total-head">Score</th></tr></thead><tbody>`;

    // Sorting by score is opt-in; default keeps entry order so the grid doesn't jump while typing.
    const ordered = sortByScore
      ? [...d.options].sort((a, b) => (normById.get(b.id) || 0) - (normById.get(a.id) || 0))
      : d.options;

    ordered.forEach((o, ri) => {
      const isLeader = o.id === leaderId;
      const star = isLeader ? `<span class="lead-star">${icon("award")}</span>` : "";
      html += `<tr class="${isLeader ? "leader" : ""}"><th>${star}${escapeHtml(o.name)}</th>`;
      d.criteria.forEach((c, ci) => {
        const v = d.scores[o.id]?.[c.id];
        const val = Number.isFinite(v) ? v : "";
        const bg = Number.isFinite(v) ? ` style="background:${heatColor(v)}"` : "";
        html += `<td class="score-cell"><input type="number" min="0" max="10" step="1"
          data-opt="${o.id}" data-crit="${c.id}" data-r="${ri}" data-c="${ci}"
          aria-label="${escapeHtml(o.name)} — ${escapeHtml(c.name)}" value="${val}" placeholder="0"${bg} /></td>`;
      });
      const norm = normById.get(o.id) || 0;
      html += `<td class="total-cell">${norm.toFixed(1)}</td></tr>`;
    });
    html += "</tbody>";
    el.matrix.innerHTML = html;

    // Wire score inputs
    el.matrix.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        const optId = input.dataset.opt;
        const critId = input.dataset.crit;
        let n = parseInt(input.value, 10);
        if (!Number.isFinite(n)) {
          if (!d.scores[optId]) d.scores[optId] = {};
          delete d.scores[optId][critId];
          input.style.background = "";
        } else {
          n = Math.max(0, Math.min(10, n));
          if (!d.scores[optId]) d.scores[optId] = {};
          d.scores[optId][critId] = n;
          input.style.background = heatColor(n);
        }
        save();
        updateTotals(d);
        renderBanner(d);
        renderInsights(d);
        renderCoverage(d);
        renderSidebar();
      });

      // Enter advances down the column, wrapping to the top of the next one —
      // fast keyboard scoring. (Arrow keys keep their native increment behavior.)
      input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const nCols = d.criteria.length;
        const nRows = ordered.length;
        let r = Number(input.dataset.r) + 1;
        let c = Number(input.dataset.c);
        if (r >= nRows) { r = 0; c = (c + 1) % nCols; }
        const next = el.matrix.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
        if (next) { next.focus(); next.select(); }
      });
    });
  }

  /* Update just the totals column + leader highlight without rebuilding inputs (keeps focus). */
  function updateTotals(d) {
    const { rows } = computeResults(d);
    const leaderId = rows.length && rows[0].total > 0 ? rows[0].opt.id : null;
    const normById = new Map(rows.map((r) => [r.opt.id, r.normalized]));
    el.matrix.querySelectorAll("tbody tr").forEach((tr) => {
      const th = tr.querySelector("th");
      const totalCell = tr.querySelector(".total-cell");
      const firstInput = tr.querySelector("input[data-opt]");
      if (!firstInput) return;
      const optId = firstInput.dataset.opt;
      totalCell.textContent = (normById.get(optId) || 0).toFixed(1);
      tr.classList.toggle("leader", optId === leaderId);
      void th; // leader star handled by CSS
    });
  }

  // Ring gauge: share of option×criterion cells that have a score.
  // Sweeps once (400ms) on first appearance; updates jump without animation.
  let coverageSwept = false;
  const RING_C = 2 * Math.PI * 17; // circumference for r=17

  function renderCoverage(d) {
    const total = d.options.length * d.criteria.length;
    if (total === 0) {
      el.coverage.hidden = true;
      coverageSwept = false;
      return;
    }
    el.coverage.hidden = false;
    let filled = 0;
    for (const o of d.options) {
      for (const c of d.criteria) {
        if (Number.isFinite(d.scores[o.id]?.[c.id])) filled++;
      }
    }
    const pct = Math.round((filled / total) * 100);
    const prog = el.coverage.querySelector(".ring-progress");
    const offset = RING_C * (1 - pct / 100);

    el.coverage.querySelector(".ring-val").textContent = `${pct}%`;
    el.coverage.setAttribute("aria-valuenow", String(pct));
    el.coverage.title = `${filled} of ${total} scores entered`;
    el.coverage.classList.remove("low", "full");
    if (pct >= 100) el.coverage.classList.add("full");
    else if (pct < 60) el.coverage.classList.add("low");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!coverageSwept && !reduce) {
      prog.style.transition = "none";
      prog.style.strokeDashoffset = String(RING_C); // start empty
      void prog.getBoundingClientRect(); // force reflow
      prog.style.transition = "stroke-dashoffset 400ms var(--c360-ease)";
      requestAnimationFrame(() => { prog.style.strokeDashoffset = String(offset); });
      coverageSwept = true;
    } else {
      prog.style.transition = "none";
      prog.style.strokeDashoffset = String(offset);
    }
  }

  function renderInsights(d) {
    const { rows, totalWeight } = computeResults(d);
    const scored = rows.some((r) => r.total > 0);
    if (!scored || totalWeight === 0 || d.options.length === 0) {
      el.insightWrap.hidden = true;
      return;
    }
    el.insightWrap.hidden = false;

    // Bar chart (sorted best-first) on a fixed 0–10 scale
    const leaderId = rows[0].opt.id;
    el.chart.innerHTML = rows.map((r) => {
      const pct = Math.max(0, Math.min(100, (r.normalized / 10) * 100));
      const isLeader = r.opt.id === leaderId && r.total > 0;
      return `<div class="bar-row ${isLeader ? "leader" : ""}">
        <div class="bar-label"><span class="bl-name" title="${escapeHtml(r.opt.name)}">${isLeader ? icon("award") : ""}${escapeHtml(r.opt.name)}</span><span class="bl-val">${r.normalized.toFixed(1)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");

    // Robustness / sensitivity readout
    const sens = sensitivity(d);
    if (!sens) {
      el.robustness.hidden = true;
    } else if (sens.robust) {
      el.robustness.hidden = false;
      el.robustness.className = "robustness robust";
      el.robustness.innerHTML = `<span class="rob-dot"></span><span class="rob-text"><strong>Robust result</strong> — no single weight change flips the winner.</span>`;
    } else {
      el.robustness.hidden = false;
      el.robustness.className = "robustness fragile";
      const dir = sens.to > sens.from ? "up" : "down";
      el.robustness.innerHTML = `<span class="rob-dot"></span><span class="rob-text"><strong>Sensitive result</strong> — nudge “${escapeHtml(sens.crit)}” ${dir} from ${sens.from} to ${sens.to} and it flips to “${escapeHtml(sens.newWinnerName)}.”</span>`;
    }

    // Insight cards
    const insights = analyze(d);
    if (insights.length === 0) {
      el.insights.innerHTML = `<li class="insights-empty">Score a few more cells and insights will appear here.</li>`;
    } else {
      el.insights.innerHTML = insights.map((i) =>
        `<li class="insight ${i.tone}"><span class="ins-icon">${icon(i.icon)}</span><span>${i.html}</span></li>`
      ).join("");
    }
  }

  // Tracks the last winner announced per decision, so screen readers hear
  // "X is now leading" only when the leader actually changes, not every keystroke.
  const lastAnnouncedWinner = {};

  function renderBanner(d) {
    const { rows, totalWeight } = computeResults(d);
    const scored = rows.some((r) => r.total > 0);
    if (!scored || d.options.length === 0 || totalWeight === 0) {
      el.banner.hidden = true;
      delete lastAnnouncedWinner[d.id];
      return;
    }
    const winner = rows[0];
    if (lastAnnouncedWinner[d.id] && lastAnnouncedWinner[d.id] !== winner.opt.id) {
      announce(`${winner.opt.name} is now leading.`);
    }
    lastAnnouncedWinner[d.id] = winner.opt.id;
    const runnerUp = rows[1];
    const margin = runnerUp ? winner.normalized - runnerUp.normalized : null;
    let sub;
    if (rows.length === 1) {
      sub = `Scored ${winner.normalized.toFixed(1)} / 10 on what matters to you.`;
    } else if (margin !== null && margin < 0.3) {
      sub = `It's close — just ${margin.toFixed(1)} ahead of “${escapeHtml(runnerUp.opt.name)}”. Trust your gut on the tie-breaker.`;
    } else {
      sub = `Ahead of “${escapeHtml(runnerUp.opt.name)}” by ${margin.toFixed(1)} points on a 10-point scale.`;
    }
    // Compare the numbers against the user's recorded gut pick, if any.
    let gutLine = "";
    if (d.gut) {
      const gutName = d.options.find((o) => o.id === d.gut)?.name;
      if (gutName) {
        if (d.gut === winner.opt.id) {
          gutLine = `<div class="rb-gut agree">${icon("heart-pulse")} Your gut agrees with the numbers.</div>`;
        } else {
          gutLine = `<div class="rb-gut disagree">${icon("heart-pulse")} Your gut says “${escapeHtml(gutName)}” — worth asking what the numbers are missing.</div>`;
        }
      }
    }

    el.banner.innerHTML = `
      <span class="rb-emoji">${margin !== null && margin < 0.3 ? icon("scale") : icon("award")}</span>
      <div class="rb-text">
        <h3>Leaning toward</h3>
        <div class="rb-winner">${escapeHtml(winner.opt.name)}</div>
        <div class="rb-sub">${sub}</div>
        ${gutLine}
      </div>`;
    el.banner.hidden = false;
  }

  /* ---------- actions ---------- */
  let modalReturnFocus = null;

  function openTemplateModal() {
    modalReturnFocus = document.activeElement;
    el.templateGrid.innerHTML = TEMPLATES.map((t) => `
      <button class="template-card" data-tpl="${t.id}">
        <span class="tc-icon">${icon(t.icon)}</span>
        <span><span class="tc-name">${escapeHtml(t.name)}</span><span class="tc-desc">${escapeHtml(t.desc)}</span></span>
      </button>`).join("");
    el.templateGrid.querySelectorAll(".template-card").forEach((btn) => {
      btn.addEventListener("click", () => createFromTemplate(btn.dataset.tpl));
    });
    el.modal.hidden = false;
    // Move focus into the dialog for keyboard and screen-reader users.
    (el.templateGrid.querySelector(".template-card") || el.modalClose).focus();
  }

  function closeTemplateModal() {
    el.modal.hidden = true;
    if (modalReturnFocus && typeof modalReturnFocus.focus === "function") modalReturnFocus.focus();
    modalReturnFocus = null;
  }

  function openHelp() {
    modalReturnFocus = document.activeElement;
    el.helpModal.hidden = false;
    el.helpClose.focus();
  }
  function closeHelp() {
    el.helpModal.hidden = true;
    if (modalReturnFocus && typeof modalReturnFocus.focus === "function") modalReturnFocus.focus();
    modalReturnFocus = null;
  }

  // Keep Tab focus inside an open dialog.
  function attachTabTrap(modalEl) {
    modalEl.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        modalEl.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
      ).filter((x) => !x.disabled && x.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  attachTabTrap(el.modal);
  attachTabTrap(el.helpModal);

  function createFromTemplate(tplId) {
    const t = TEMPLATES.find((x) => x.id === tplId) || TEMPLATES[0];
    const d = makeDecision();
    d.title = t.title || "";
    d.criteria = t.criteria.map(([name, weight]) => ({ id: uid(), name, weight }));
    state.decisions.push(d);
    state.activeId = d.id;
    save();
    closeTemplateModal();
    render();
    // Blank starts with the title; templates jump you straight to adding options.
    if (t.id === "blank") el.title.focus();
    else el.optInput.focus();
  }

  function seedExampleIfEmpty() {
    // Seed the walkthrough example only once, ever. If the user has decisions
    // (or already saw it and cleared them), mark it done so it never resurrects.
    if (state.seeded) return;
    if (state.decisions.length > 0) { state.seeded = true; save(); return; }
    const d = makeDecision();
    d.title = "Should I take the new job?";
    const crit = [
      ["Salary", 8], ["Work-life balance", 9], ["Growth", 7], ["Commute", 5],
    ].map(([name, weight]) => ({ id: uid(), name, weight }));
    const opts = [
      { id: uid(), name: "Take the offer" },
      { id: uid(), name: "Stay put" },
    ];
    d.criteria = crit;
    d.options = opts;
    d.scores = {
      [opts[0].id]: { [crit[0].id]: 9, [crit[1].id]: 5, [crit[2].id]: 9, [crit[3].id]: 4 },
      [opts[1].id]: { [crit[0].id]: 6, [crit[1].id]: 8, [crit[2].id]: 4, [crit[3].id]: 9 },
    };
    state.decisions.push(d);
    state.activeId = d.id;
    state.seeded = true;
    save();
  }

  function duplicateDecision() {
    const d = active();
    if (!d) return;
    const copy = JSON.parse(JSON.stringify(d));
    copy.id = uid();
    copy.title = (d.title || "Untitled decision") + " (copy)";
    copy.gut = null;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    state.decisions.push(copy);
    state.activeId = copy.id;
    save();
    render();
    toast("Duplicated — tweak away without losing the original.");
  }

  /* ---------- shareable links (data rides in the URL; no server) ---------- */
  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  // Compact payload; deliberately omits notes and gut pick to keep them private.
  function encodeDecision(d) {
    const payload = {
      t: d.title,
      c: d.criteria.map((c) => [c.name, c.weight]),
      o: d.options.map((o) => o.name),
      s: d.options.map((o) => d.criteria.map((c) => {
        const v = d.scores[o.id]?.[c.id];
        return Number.isFinite(v) ? v : null;
      })),
    };
    return b64urlEncode(JSON.stringify(payload));
  }

  function decodeDecision(str) {
    const p = JSON.parse(b64urlDecode(str));
    const d = makeDecision();
    d.title = typeof p.t === "string" ? p.t : "";
    d.criteria = (Array.isArray(p.c) ? p.c : []).map(([name, weight]) => ({
      id: uid(), name: String(name).slice(0, 40), weight: clampWeight(weight),
    }));
    d.options = (Array.isArray(p.o) ? p.o : []).map((name) => ({ id: uid(), name: String(name).slice(0, 40) }));
    d.scores = {};
    (Array.isArray(p.s) ? p.s : []).forEach((row, oi) => {
      const opt = d.options[oi];
      if (!opt || !Array.isArray(row)) return;
      row.forEach((val, ci) => {
        const crit = d.criteria[ci];
        if (crit && Number.isFinite(val)) {
          (d.scores[opt.id] || (d.scores[opt.id] = {}))[crit.id] = clampScore(val);
        }
      });
    });
    return d;
  }

  async function copyLink(url) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch { /* fall through */ }
    return false;
  }

  function shareDecision() {
    const d = active();
    if (!d) return;
    if (d.criteria.length === 0 && d.options.length === 0) {
      toast("Add some criteria and options first.");
      return;
    }
    const url = location.origin + location.pathname + "#d=" + encodeDecision(d);
    copyLink(url).then((ok) => {
      if (ok) toast("Share link copied — your notes & gut pick stay private.");
      else window.prompt("Copy this share link:", url);
    });
  }

  // Import a decision embedded in the URL hash, as a fresh copy. Returns true if one was found.
  function importFromHash() {
    const m = location.hash.match(/[#&]d=([^&]+)/);
    if (!m) return false;
    try {
      const d = decodeDecision(m[1]);
      d.title = d.title ? `${d.title} (shared)` : "Shared decision";
      state.decisions.push(d);
      state.activeId = d.id;
      state.seeded = true; // don't also seed the example
      save();
      history.replaceState(null, "", location.pathname + location.search);
      return true;
    } catch {
      return false;
    }
  }

  function exportCsv() {
    const d = active();
    if (!d || d.criteria.length === 0 || d.options.length === 0) {
      toast("Add options and criteria first.");
      return;
    }
    const { rows } = computeResults(d);
    const normById = new Map(rows.map((r) => [r.opt.id, r.normalized]));
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const header = ["Option", ...d.criteria.map((c) => `${c.name} (x${c.weight})`), "Weighted score"];
    const lines = [header.map(esc).join(",")];
    for (const o of d.options) {
      const cells = d.criteria.map((c) => {
        const v = d.scores[o.id]?.[c.id];
        return Number.isFinite(v) ? v : 0;
      });
      lines.push([esc(o.name), ...cells, (normById.get(o.id) || 0).toFixed(2)].join(","));
    }
    downloadBlob(lines.join("\n"), "text/csv", `${slug(d.title || "decision")}.csv`);
    toast("Exported CSV.");
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "decision";
  }

  function downloadBlob(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- import / export ---------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "figurelifeout-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported your decisions.");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      // Build and validate the imported list in a local array first — state
      // is only touched once everything has succeeded, so a malformed file
      // can never leave partially-mutated data sitting in memory to be
      // silently persisted by some later, unrelated save().
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch {
        toast("That file isn't valid JSON.");
        return;
      }
      if (!parsed || !Array.isArray(parsed.decisions)) {
        toast("That file didn't look like a FigureLifeOut backup.");
        return;
      }
      const imported = [];
      let skipped = 0;
      for (const raw of parsed.decisions) {
        if (!raw || typeof raw !== "object") { skipped++; continue; }
        try {
          const d = normalizeDecision({ ...raw, id: uid() });
          imported.push(d);
        } catch {
          skipped++;
        }
      }
      if (imported.length === 0) {
        toast("That file didn't look like a FigureLifeOut backup.");
        return;
      }
      state.decisions.push(...imported);
      state.activeId = imported[imported.length - 1].id;
      save();
      render();
      const n = imported.length;
      const suffix = skipped > 0 ? ` (${skipped} skipped)` : "";
      toast(`Imported ${n} decision${n === 1 ? "" : "s"}${suffix}.`);
    };
    reader.onerror = () => toast("Couldn't read that file.");
    reader.readAsText(file);
  }

  /* ---------- misc ---------- */
  let toastTimer = null;
  // action (optional): { label, fn } renders an inline button (e.g. Undo).
  function toast(msg, action) {
    const t = el.toast;
    t.innerHTML = `<span class="toast-msg"></span>`;
    t.querySelector(".toast-msg").textContent = msg;
    if (action) {
      const btn = document.createElement("button");
      btn.className = "toast-action";
      btn.textContent = action.label;
      btn.addEventListener("click", () => {
        clearTimeout(toastTimer);
        t.hidden = true;
        action.fn();
      });
      t.appendChild(btn);
    }
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
  }

  // Announce to screen readers via the polite live region.
  function announce(msg) {
    el.live.textContent = "";
    // Next tick so repeated identical messages are still read.
    requestAnimationFrame(() => { el.live.textContent = msg; });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.themeToggle.innerHTML = theme === "dark" ? icon("sun") : icon("moon");
    el.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }

  /* ---------- events ---------- */
  el.newBtn.addEventListener("click", openTemplateModal);
  el.emptyNew.addEventListener("click", openTemplateModal);
  el.modalClose.addEventListener("click", closeTemplateModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeTemplateModal(); });

  el.helpBtn.addEventListener("click", openHelp);
  el.helpClose.addEventListener("click", closeHelp);
  el.helpModal.addEventListener("click", (e) => { if (e.target === el.helpModal) closeHelp(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!el.modal.hidden) closeTemplateModal();
      else if (!el.helpModal.hidden) closeHelp();
      return;
    }
    // "?" opens help, unless a dialog is open or the user is typing.
    if (e.key === "?") {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (typing || !el.modal.hidden || !el.helpModal.hidden) return;
      e.preventDefault();
      openHelp();
    }
  });

  el.title.addEventListener("input", () => {
    const d = active();
    if (!d) return;
    d.title = el.title.value;
    save();
    renderSidebar();
  });

  el.duplicateBtn.addEventListener("click", duplicateDecision);
  el.shareBtn.addEventListener("click", shareDecision);

  el.notes.addEventListener("input", () => {
    const d = active();
    if (!d) return;
    d.notes = el.notes.value;
    save();
  });

  el.gutSelect.addEventListener("change", () => {
    const d = active();
    if (!d) return;
    d.gut = el.gutSelect.value || null;
    save();
    renderBanner(d);
  });

  el.sortToggle.addEventListener("click", () => {
    sortByScore = !sortByScore;
    el.sortToggle.classList.toggle("active", sortByScore);
    const d = active();
    if (d) renderMatrix(d);
  });

  el.csvBtn.addEventListener("click", exportCsv);

  el.resetScores.addEventListener("click", () => {
    const d = active();
    if (!d) return;
    const hasAny = Object.values(d.scores).some((row) => Object.values(row || {}).some((v) => Number.isFinite(v)));
    if (!hasAny) {
      toast("There are no scores to reset.");
      return;
    }
    const backup = JSON.parse(JSON.stringify(d.scores));
    d.scores = {};
    save();
    render();
    toast("Cleared all scores.", {
      label: "Undo",
      fn: () => {
        d.scores = backup;
        save();
        render();
      },
    });
  });

  el.deleteBtn.addEventListener("click", () => {
    const d = active();
    if (!d) return;
    const idx = state.decisions.findIndex((x) => x.id === d.id);
    state.decisions = state.decisions.filter((x) => x.id !== d.id);
    state.activeId = state.decisions[0]?.id || null;
    save();
    render();
    toast(`Deleted “${d.title || "Untitled decision"}.”`, {
      label: "Undo",
      fn: () => {
        state.decisions.splice(Math.min(idx, state.decisions.length), 0, d);
        state.activeId = d.id;
        save();
        render();
        toast("Restored.");
      },
    });
  });

  el.critForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = active();
    if (!d) return;
    const name = el.critInput.value.trim();
    if (!name) return;
    d.criteria.push({ id: uid(), name, weight: 5 });
    el.critInput.value = "";
    save();
    render();
  });

  el.optForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = active();
    if (!d) return;
    const name = el.optInput.value.trim();
    if (!name) return;
    d.options.push({ id: uid(), name });
    el.optInput.value = "";
    save();
    render();
  });

  el.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  el.exportBtn.addEventListener("click", exportData);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = "";
  });

  /* ---------- boot ---------- */
  (function init() {
    let theme = "light";
    try {
      theme = localStorage.getItem(THEME_KEY)
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch { /* ignore */ }
    applyTheme(theme);

    const imported = importFromHash();
    if (!imported) seedExampleIfEmpty();
    if (!active() && state.decisions.length) state.activeId = state.decisions[0].id;
    render();
    if (imported) toast("Imported a shared decision as a copy.");
  })();
})();
