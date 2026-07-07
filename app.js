/* FigureLifeOut — a weighted decision matrix.
 * State lives entirely in localStorage. No network, no build step. */

(() => {
  "use strict";

  const STORE_KEY = "figurelifeout.v1";
  const THEME_KEY = "figurelifeout.theme";

  /* ---------- tiny id + storage helpers ---------- */
  let _seq = 0;
  const uid = () => `${Date.now().toString(36)}${(_seq++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

  const load = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { decisions: [], activeId: null };
      const data = JSON.parse(raw);
      if (!Array.isArray(data.decisions)) return { decisions: [], activeId: null };
      data.decisions.forEach(normalizeDecision);
      return data;
    } catch {
      return { decisions: [], activeId: null };
    }
  };

  const save = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      toast("Couldn't save — storage may be full.");
    }
  };

  let state = load();
  let sortByScore = false; // matrix view preference (session-only)

  /* Starter templates — curated criteria with sensible default weights. */
  const TEMPLATES = [
    { id: "blank", icon: "📝", name: "Blank", desc: "Start from scratch", title: "", criteria: [] },
    {
      id: "job", icon: "💼", name: "Job offer", desc: "Weigh a role or offer",
      title: "Which job should I take?",
      criteria: [["Compensation", 8], ["Work-life balance", 8], ["Growth & learning", 7], ["Team & culture", 7], ["Commute / location", 5]],
    },
    {
      id: "home", icon: "🏡", name: "Where to live", desc: "Compare places to live",
      title: "Where should I live?",
      criteria: [["Cost of living", 8], ["Career opportunities", 7], ["Climate & surroundings", 6], ["Close to people I love", 7], ["Lifestyle & things to do", 6]],
    },
    {
      id: "buy", icon: "🛒", name: "Big purchase", desc: "A car, gadget, anything pricey",
      title: "Which one should I buy?",
      criteria: [["Price / value", 8], ["Quality & reliability", 8], ["Features I actually need", 7], ["Longevity / resale", 5]],
    },
    {
      id: "life", icon: "🧭", name: "Life crossroads", desc: "A major life direction",
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
    banner: $("#result-banner"),
    gutCheck: $("#gut-check"),
    gutSelect: $("#gut-select"),
    insightWrap: $("#insight-wrap"),
    chart: $("#results-chart"),
    insights: $("#insights-list"),
    robustness: $("#robustness"),
    modal: $("#template-modal"),
    modalClose: $("#modal-close"),
    templateGrid: $("#template-grid"),
    notes: $("#notes-input"),
    sortToggle: $("#sort-toggle"),
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
    };
  }

  /* Backfill fields on decisions loaded from older saves. */
  function normalizeDecision(d) {
    if (typeof d.notes !== "string") d.notes = "";
    if (!("gut" in d)) d.gut = null;
    if (!d.scores || typeof d.scores !== "object") d.scores = {};
    if (!Array.isArray(d.criteria)) d.criteria = [];
    if (!Array.isArray(d.options)) d.options = [];
    return d;
  }

  /* A subtle red→amber→green tint for a 0–10 score; theme-agnostic. */
  function heatColor(score) {
    if (!Number.isFinite(score)) return "";
    const hue = (Math.max(0, Math.min(10, score)) / 10) * 130; // 0=red, 130=green
    return `hsl(${hue} 65% 45% / 0.16)`;
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
        out.push({ tone: "warn", icon: "⚖️", html: `<strong>Photo finish.</strong> “${escapeHtml(leader.opt.name)}” and “${escapeHtml(runner.opt.name)}” are within ${margin.toFixed(1)} of each other — the math won't decide this one for you.` });
      } else if (margin >= 1.8) {
        out.push({ tone: "good", icon: "✅", html: `<strong>Clear leader.</strong> “${escapeHtml(leader.opt.name)}” is a decisive ${margin.toFixed(1)} points ahead — a robust result.` });
      }
    }

    // 2) Swing criterion — the one thing the whole decision hinges on
    if (rows.length >= 2 && d.criteria.length >= 2) {
      let swing = null;
      for (const c of d.criteria) {
        if (winnerWithout(d, c.id) !== leader.opt.id) { swing = c; break; }
      }
      if (swing) {
        out.push({ tone: "info", icon: "🎯", html: `<strong>This hinges on “${escapeHtml(swing.name)}.”</strong> Drop that one criterion and a different option wins. Make sure you scored it honestly.` });
      }
    }

    // 3) Dominated option — beaten or matched on every criterion by another
    for (const a of d.options) {
      for (const b of d.options) {
        if (a.id === b.id) continue;
        const everyGE = d.criteria.every((c) => scoreOf(d, b.id, c.id) >= scoreOf(d, a.id, c.id));
        const someGT = d.criteria.some((c) => scoreOf(d, b.id, c.id) > scoreOf(d, a.id, c.id));
        if (everyGE && someGT) {
          out.push({ tone: "info", icon: "🧹", html: `<strong>“${escapeHtml(a.name)}” is dominated.</strong> “${escapeHtml(b.name)}” matches or beats it on every criterion — you can probably take it off the table.` });
          break;
        }
      }
      if (out.filter((i) => i.icon === "🧹").length) break; // one is enough
    }

    // 4) Options barely differ — criteria aren't discriminating
    if (rows.length >= 2) {
      const spread = leader.normalized - rows[rows.length - 1].normalized;
      if (spread < 0.6) {
        out.push({ tone: "warn", icon: "🔍", html: `<strong>Your options score almost the same.</strong> Either they're genuinely equivalent, or you're missing a criterion that actually separates them.` });
      }
    }

    // 5) Incomplete scoring
    let blanks = 0, cells = 0;
    for (const o of d.options) for (const c of d.criteria) { cells++; if (!Number.isFinite(d.scores[o.id]?.[c.id])) blanks++; }
    if (blanks > 0 && blanks < cells) {
      out.push({ tone: "warn", icon: "✏️", html: `<strong>${blanks} of ${cells} scores are blank.</strong> They're counting as 0 — fill them in for a fairer comparison.` });
    }

    // 6) Flat weighting nudge
    if (d.criteria.length >= 3 && d.criteria.every((c) => c.weight === d.criteria[0].weight)) {
      out.push({ tone: "info", icon: "🎚️", html: `<strong>Every criterion is weighted equally.</strong> If some matter more than others, adjust the weights to sharpen the result.` });
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
    // Most recent first
    const ordered = [...state.decisions].sort((a, b) => b.createdAt - a.createdAt);
    for (const d of ordered) {
      const li = document.createElement("li");
      li.className = d.id === state.activeId ? "active" : "";
      const { rows } = computeResults(d);
      const leader = rows[0];
      const leadLabel = leader && leader.total > 0 ? leader.opt.name : "";
      li.innerHTML = `<span class="li-title">${escapeHtml(d.title || "Untitled decision")}</span>` +
        (leadLabel ? `<span class="li-lead" title="Leading: ${escapeHtml(leadLabel)}">★</span>` : "");
      li.addEventListener("click", () => {
        state.activeId = d.id;
        save();
        render();
      });
      el.list.appendChild(li);
    }
  }

  function renderCriteria(d) {
    el.criteria.innerHTML = "";
    for (const c of d.criteria) {
      const li = document.createElement("li");
      li.className = "chip";
      li.innerHTML = `
        <span class="chip-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="weight-control">
          <input type="range" min="1" max="10" value="${c.weight}" aria-label="Weight for ${escapeHtml(c.name)}" />
          <span class="weight-val">${c.weight}</span>
        </span>
        <button class="remove" title="Remove" aria-label="Remove ${escapeHtml(c.name)}">×</button>`;
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
        d.criteria = d.criteria.filter((x) => x.id !== c.id);
        for (const optId in d.scores) delete d.scores[optId]?.[c.id];
        save();
        render();
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
        <span class="chip-name" title="${escapeHtml(o.name)}">${escapeHtml(o.name)}</span>
        <button class="remove" title="Remove" aria-label="Remove ${escapeHtml(o.name)}">×</button>`;
      li.querySelector(".remove").addEventListener("click", () => {
        d.options = d.options.filter((x) => x.id !== o.id);
        delete d.scores[o.id];
        save();
        render();
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

    for (const o of ordered) {
      const isLeader = o.id === leaderId;
      html += `<tr class="${isLeader ? "leader" : ""}"><th>${escapeHtml(o.name)}</th>`;
      for (const c of d.criteria) {
        const v = d.scores[o.id]?.[c.id];
        const val = Number.isFinite(v) ? v : "";
        const bg = Number.isFinite(v) ? ` style="background:${heatColor(v)}"` : "";
        html += `<td class="score-cell"><input type="number" min="0" max="10" step="1"
          data-opt="${o.id}" data-crit="${c.id}" value="${val}" placeholder="0"${bg} /></td>`;
      }
      const norm = normById.get(o.id) || 0;
      html += `<td class="total-cell">${norm.toFixed(1)}</td></tr>`;
    }
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
        renderSidebar();
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
        <div class="bar-label"><span class="bl-name" title="${escapeHtml(r.opt.name)}">${escapeHtml(r.opt.name)}</span><span class="bl-val">${r.normalized.toFixed(1)}</span></div>
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
        `<li class="insight ${i.tone}"><span class="ins-icon">${i.icon}</span><span>${i.html}</span></li>`
      ).join("");
    }
  }

  function renderBanner(d) {
    const { rows, totalWeight } = computeResults(d);
    const scored = rows.some((r) => r.total > 0);
    if (!scored || d.options.length === 0 || totalWeight === 0) {
      el.banner.hidden = true;
      return;
    }
    const winner = rows[0];
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
          gutLine = `<div class="rb-gut agree">🫀 Your gut agrees with the numbers.</div>`;
        } else {
          gutLine = `<div class="rb-gut disagree">🫀 Your gut says “${escapeHtml(gutName)}” — worth asking what the numbers are missing.</div>`;
        }
      }
    }

    el.banner.innerHTML = `
      <span class="rb-emoji">${margin !== null && margin < 0.3 ? "⚖️" : "✨"}</span>
      <div class="rb-text">
        <h3>Leaning toward</h3>
        <div class="rb-winner">${escapeHtml(winner.opt.name)}</div>
        <div class="rb-sub">${sub}</div>
        ${gutLine}
      </div>`;
    el.banner.hidden = false;
  }

  /* ---------- actions ---------- */
  function openTemplateModal() {
    el.templateGrid.innerHTML = TEMPLATES.map((t) => `
      <button class="template-card" data-tpl="${t.id}">
        <span class="tc-icon">${t.icon}</span>
        <span><span class="tc-name">${escapeHtml(t.name)}</span><span class="tc-desc">${escapeHtml(t.desc)}</span></span>
      </button>`).join("");
    el.templateGrid.querySelectorAll(".template-card").forEach((btn) => {
      btn.addEventListener("click", () => createFromTemplate(btn.dataset.tpl));
    });
    el.modal.hidden = false;
  }

  function closeTemplateModal() { el.modal.hidden = true; }

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
    state.decisions.push(copy);
    state.activeId = copy.id;
    save();
    render();
    toast("Duplicated — tweak away without losing the original.");
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
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.decisions)) throw new Error("bad shape");
        // Merge imported decisions with fresh ids to avoid collisions
        for (const d of data.decisions) {
          d.id = uid();
          normalizeDecision(d);
          state.decisions.push(d);
        }
        state.activeId = state.decisions[state.decisions.length - 1]?.id || null;
        save();
        render();
        toast(`Imported ${data.decisions.length} decision${data.decisions.length === 1 ? "" : "s"}.`);
      } catch {
        toast("That file didn't look like a FigureLifeOut backup.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- misc ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }

  /* ---------- events ---------- */
  el.newBtn.addEventListener("click", openTemplateModal);
  el.emptyNew.addEventListener("click", openTemplateModal);
  el.modalClose.addEventListener("click", closeTemplateModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeTemplateModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.modal.hidden) closeTemplateModal(); });

  el.title.addEventListener("input", () => {
    const d = active();
    if (!d) return;
    d.title = el.title.value;
    save();
    renderSidebar();
  });

  el.duplicateBtn.addEventListener("click", duplicateDecision);

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

  el.deleteBtn.addEventListener("click", () => {
    const d = active();
    if (!d) return;
    if (!confirm(`Delete “${d.title || "Untitled decision"}”? This can't be undone.`)) return;
    state.decisions = state.decisions.filter((x) => x.id !== d.id);
    state.activeId = state.decisions[0]?.id || null;
    save();
    render();
    toast("Decision deleted.");
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

    seedExampleIfEmpty();
    if (!active() && state.decisions.length) state.activeId = state.decisions[0].id;
    render();
  })();
})();
