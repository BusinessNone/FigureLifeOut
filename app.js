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
    banner: $("#result-banner"),
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
      createdAt: Date.now(),
    };
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
    renderCriteria(d);
    renderOptions(d);
    renderMatrix(d);
    renderBanner(d);
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

    // Rows (keep option order stable, not sorted, so the grid doesn't jump while typing)
    for (const o of d.options) {
      const isLeader = o.id === leaderId;
      html += `<tr class="${isLeader ? "leader" : ""}"><th>${escapeHtml(o.name)}</th>`;
      for (const c of d.criteria) {
        const v = d.scores[o.id]?.[c.id];
        const val = Number.isFinite(v) ? v : "";
        html += `<td class="score-cell"><input type="number" min="0" max="10" step="1"
          data-opt="${o.id}" data-crit="${c.id}" value="${val}" placeholder="0" /></td>`;
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
        } else {
          n = Math.max(0, Math.min(10, n));
          if (!d.scores[optId]) d.scores[optId] = {};
          d.scores[optId][critId] = n;
        }
        save();
        updateTotals(d);
        renderBanner(d);
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
    el.banner.innerHTML = `
      <span class="rb-emoji">${margin !== null && margin < 0.3 ? "⚖️" : "✨"}</span>
      <div class="rb-text">
        <h3>Leaning toward</h3>
        <div class="rb-winner">${escapeHtml(winner.opt.name)}</div>
        <div class="rb-sub">${sub}</div>
      </div>`;
    el.banner.hidden = false;
  }

  /* ---------- actions ---------- */
  function createDecision() {
    const d = makeDecision();
    state.decisions.push(d);
    state.activeId = d.id;
    save();
    render();
    el.title.focus();
  }

  function seedExampleIfEmpty() {
    if (state.decisions.length > 0) return;
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
    save();
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
  el.newBtn.addEventListener("click", createDecision);
  el.emptyNew.addEventListener("click", createDecision);

  el.title.addEventListener("input", () => {
    const d = active();
    if (!d) return;
    d.title = el.title.value;
    save();
    renderSidebar();
  });

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
