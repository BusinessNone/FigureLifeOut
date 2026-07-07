// End-to-end tests for FigureLifeOut, using the Playwright browser library
// and Node's built-in test runner. No test framework dependency.
//
//   npm test        (installs Playwright, then runs this)
//   node --test tests/
//
// A fresh browser context per test isolates localStorage between cases.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { start } from "../scripts/serve.mjs";

let server, browser, base;

before(async () => {
  server = await start(0);
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((r) => server.close(r));
});

// Open a fresh page (isolated storage) and fail the test on any page error.
async function freshPage(t) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  t.after(async () => {
    assert.equal(errors.length, 0, `page errors: ${errors.join(" | ")}`);
    await ctx.close();
  });
  await page.goto(base + "/");
  await page.waitForSelector("#decision-editor:not([hidden])");
  return page;
}

// Add criteria/options to the active decision.
async function addCriterion(page, name) {
  await page.fill("#criterion-input", name);
  await page.click("#criterion-form button");
}
async function addOption(page, name) {
  await page.fill("#option-input", name);
  await page.click("#option-form button");
}

test("seeded example shows a winner, chart, and robustness readout", async (t) => {
  const page = await freshPage(t);
  assert.equal(await page.textContent(".rb-winner"), "Take the offer");
  assert.ok((await page.$$(".bar-row")).length >= 2, "expected chart bars");
  assert.match(await page.textContent("#robustness"), /result/i);
  // The empty state must be genuinely hidden (not just [hidden] with a
  // display rule overriding it) when a decision is active.
  assert.ok(!(await page.isVisible("#empty-state")), "empty state should be hidden when a decision is open");
});

test("primary action uses the Cerulean360 accent and Lucide icons (no emoji)", async (t) => {
  const page = await freshPage(t);
  // Cerulean accent (#007BA7) on the one primary action.
  assert.equal(await page.$eval("#new-decision", (el) => getComputedStyle(el).backgroundColor), "rgb(0, 123, 167)");
  // Icons are inline SVG, not emoji glyphs.
  assert.ok(await page.$(".brand-mark svg.icon"), "brand mark should be an inline SVG icon");
  const brandText = await page.$eval(".brand-mark", (el) => el.textContent.trim());
  assert.equal(brandText, "", "brand mark should contain no emoji text");
});

test("job template pre-fills criteria and title", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="job"]');
  await page.waitForFunction(() => document.querySelector("#decision-title").value.length > 0);
  assert.equal(await page.inputValue("#decision-title"), "Which job should I take?");
  const crits = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  assert.ok(crits.includes("Compensation"), `criteria were ${crits}`);
});

test("scoring computes a weighted result and reweighting flips the winner", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="blank"]');
  await addCriterion(page, "Cost");
  await addCriterion(page, "Weather");
  await addOption(page, "Austin");
  await addOption(page, "Denver");
  const inputs = await page.$$(".score-cell input");
  assert.equal(inputs.length, 4);
  // Austin: cost 8, weather 6 | Denver: cost 5, weather 9  (equal weights -> tie at 7.0)
  await inputs[0].fill("8"); await inputs[1].fill("6");
  await inputs[2].fill("5"); await inputs[3].fill("9");
  await page.waitForSelector(".rb-winner");
  // Crank Weather weight up, Cost down -> Denver should win.
  const ranges = await page.$$(".chip input[type=range]");
  await ranges[0].evaluate((r) => { r.value = 1; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await ranges[1].evaluate((r) => { r.value = 10; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.waitForFunction(() => document.querySelector(".rb-winner")?.textContent === "Denver");
  assert.equal(await page.textContent(".rb-winner"), "Denver");
});

test("insight engine flags a dominated option and a clear leader", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="blank"]');
  await addCriterion(page, "A");
  await addCriterion(page, "B");
  await addOption(page, "X");
  await addOption(page, "Y");
  const inputs = await page.$$(".score-cell input");
  await inputs[0].fill("9"); await inputs[1].fill("9"); // X
  await inputs[2].fill("3"); await inputs[3].fill("3"); // Y
  await page.waitForSelector(".insight");
  const text = (await page.$$eval(".insight", (els) => els.map((e) => e.textContent))).join(" ");
  assert.match(text, /dominated/i);
  assert.match(text, /clear leader/i);
});

test("sensitivity analysis reports robust vs sensitive results", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="blank"]');
  await addCriterion(page, "A");
  await addCriterion(page, "B");
  await addOption(page, "X");
  await addOption(page, "Y");
  const inputs = await page.$$(".score-cell input");
  // Robust: X dominates decisively.
  await inputs[0].fill("9"); await inputs[1].fill("9");
  await inputs[2].fill("2"); await inputs[3].fill("2");
  await page.waitForFunction(() => /robust/i.test(document.querySelector("#robustness")?.textContent || ""));
  assert.match(await page.getAttribute("#robustness", "class"), /robust/);
  // Sensitive: winner hinges on a single high-weight criterion.
  await inputs[0].fill("10"); await inputs[1].fill("0");
  await inputs[2].fill("0"); await inputs[3].fill("6");
  await page.waitForFunction(() => /sensitive/i.test(document.querySelector("#robustness")?.textContent || ""));
  assert.match(await page.getAttribute("#robustness", "class"), /fragile/);
});

test("gut check compares intuition against the numbers", async (t) => {
  const page = await freshPage(t);
  // Seeded winner is "Take the offer".
  const opts = await page.$$eval("#gut-select option", (els) => els.map((e) => ({ v: e.value, t: e.textContent })));
  const stay = opts.find((o) => o.t === "Stay put").v;
  const take = opts.find((o) => o.t === "Take the offer").v;
  await page.selectOption("#gut-select", stay);
  await page.waitForSelector(".rb-gut.disagree");
  assert.match(await page.textContent(".rb-gut"), /Stay put/);
  await page.selectOption("#gut-select", take);
  await page.waitForSelector(".rb-gut.agree");
  assert.match(await page.textContent(".rb-gut"), /agrees/);
});

test("decisions persist across reload", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="home"]');
  await page.waitForFunction(() => document.querySelector("#decision-title").value === "Where should I live?");
  await page.reload();
  await page.waitForSelector("#decision-list li");
  const titles = await page.$$eval("#decision-list li .li-title", (els) => els.map((e) => e.textContent));
  assert.ok(titles.includes("Where should I live?"), `titles were ${titles}`);
});

test("cleared decisions do not resurrect the seeded example on reload", async (t) => {
  const page = await freshPage(t);
  await page.click("#delete-decision");
  await page.waitForSelector("#empty-state:not([hidden])");
  await page.reload();
  await page.waitForSelector("#empty-state:not([hidden])");
  assert.equal((await page.$$("#decision-list li")).length, 0, "seeded example resurrected after reload");
});

test("deleting a decision can be undone from the toast", async (t) => {
  const page = await freshPage(t);
  await page.click("#delete-decision");
  await page.waitForSelector("#empty-state:not([hidden])");
  await page.click(".toast-action"); // Undo
  await page.waitForSelector("#decision-editor:not([hidden])");
  assert.equal(await page.textContent(".rb-winner"), "Take the offer");
  assert.equal((await page.$$("#decision-list li")).length, 1);
});

test("removing a criterion is undoable and restores its scores", async (t) => {
  const page = await freshPage(t);
  // Seeded decision leads with "Take the offer"; remove the top criterion, then undo.
  const before = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  await page.click("#criteria-list .chip .remove");
  await page.waitForFunction(
    (n) => document.querySelectorAll("#criteria-list .chip-name").length === n - 1,
    before.length
  );
  await page.click(".toast-action"); // Undo
  await page.waitForFunction(
    (n) => document.querySelectorAll("#criteria-list .chip-name").length === n,
    before.length
  );
  const after = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  assert.deepEqual(after, before, "criterion should be restored in place");
  // Scores survived: the weighted winner is unchanged.
  assert.equal(await page.textContent(".rb-winner"), "Take the offer");
});

test("score cells have screen-reader labels and Enter advances the grid", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="blank"]');
  await addCriterion(page, "A");
  await addCriterion(page, "B");
  await addOption(page, "X");
  await addOption(page, "Y");

  // Accessible label: option — criterion.
  assert.equal(await page.getAttribute('input[data-r="0"][data-c="0"]', "aria-label"), "X — A");

  // Enter moves down a column, then wraps to the top of the next column.
  await page.focus('input[data-r="0"][data-c="0"]');
  await page.keyboard.type("5");
  await page.keyboard.press("Enter");
  let pos = await page.evaluate(() => ({ r: document.activeElement.dataset.r, c: document.activeElement.dataset.c }));
  assert.deepEqual(pos, { r: "1", c: "0" });
  await page.keyboard.press("Enter"); // bottom of column 0 -> top of column 1
  pos = await page.evaluate(() => ({ r: document.activeElement.dataset.r, c: document.activeElement.dataset.c }));
  assert.deepEqual(pos, { r: "0", c: "1" });
});

test("coverage ring gauge tracks how much of the matrix is scored", async (t) => {
  const page = await freshPage(t);
  await page.click("#new-decision");
  await page.click('.template-card[data-tpl="blank"]');
  await addCriterion(page, "A");
  await addCriterion(page, "B");
  await addOption(page, "X");
  await addOption(page, "Y");
  assert.equal(await page.getAttribute("#coverage", "role"), "meter");
  await page.waitForFunction(() => document.querySelector("#coverage")?.getAttribute("aria-valuenow") === "0");
  const inputs = await page.$$(".score-cell input");
  await inputs[0].fill("5"); await inputs[1].fill("5"); // 2 of 4
  await page.waitForFunction(() => document.querySelector("#coverage").getAttribute("aria-valuenow") === "50");
  await inputs[2].fill("5"); await inputs[3].fill("5"); // 4 of 4
  await page.waitForFunction(() => document.querySelector("#coverage").getAttribute("aria-valuenow") === "100");
  assert.ok(await page.evaluate(() => document.querySelector("#coverage").classList.contains("full")), "100% should get the 'full' class");
});

test("criteria reorder by keyboard, update the matrix, and persist", async (t) => {
  const page = await freshPage(t);
  const before = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  // Focus the first criterion's drag handle and move it down one.
  await page.locator("#criteria-list .chip .chip-handle").first().focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(
    (first) => document.querySelector("#criteria-list .chip-name")?.textContent !== first,
    before[0]
  );
  const after = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  assert.equal(after[0], before[1], "second criterion moved to first");
  assert.equal(after[1], before[0], "first criterion moved to second");
  // Matrix column order reflects the new criteria order.
  const cols = await page.$$eval("#matrix thead th.crit-head", (els) => els.map((e) => e.childNodes[0].textContent.trim()));
  assert.equal(cols[0], before[1]);
  // Persists across reload.
  await page.reload();
  await page.waitForSelector("#criteria-list .chip-name");
  const reloaded = await page.$$eval("#criteria-list .chip-name", (els) => els.map((e) => e.textContent));
  assert.deepEqual(reloaded, after, "reordering should persist");
});

test("template modal moves focus in and restores it on close", async (t) => {
  const page = await freshPage(t);
  await page.focus("#new-decision");
  await page.keyboard.press("Enter"); // open via keyboard
  await page.waitForSelector("#template-modal:not([hidden])");
  assert.ok(
    await page.evaluate(() => document.activeElement.classList.contains("template-card")),
    "focus should move to the first template card"
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector("#template-modal", { state: "hidden" });
  assert.equal(await page.evaluate(() => document.activeElement.id), "new-decision", "focus should return to the trigger");
});

test("share link round-trips a decision and keeps notes private", async (t) => {
  const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  t.after(() => ctx.close());
  await page.goto(base + "/");
  await page.waitForSelector("#decision-editor:not([hidden])");

  // Add a private note, then copy the share link.
  await page.fill("#notes-input", "SECRET reflection");
  await page.click("#share-decision");
  await page.waitForSelector("#toast:not([hidden])");
  const url = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(url, /#d=/, "share URL should contain encoded payload");
  assert.ok(!url.includes("SECRET"), "notes must not be embedded in the link");

  // A recipient opens the link as a fresh load; it imports the decision as a copy.
  const recipientCtx = await browser.newContext();
  const recipient = await recipientCtx.newPage();
  t.after(() => recipientCtx.close());
  await recipient.goto(url);
  await recipient.waitForSelector("#decision-editor:not([hidden])");
  await recipient.waitForFunction(() => /\(shared\)/.test(document.querySelector("#decision-title")?.value || ""));
  assert.match(await recipient.inputValue("#decision-title"), /Should I take the new job\? \(shared\)/);
  assert.equal(await recipient.textContent(".rb-winner"), "Take the offer");
  assert.equal(await recipient.inputValue("#notes-input"), "", "imported copy should have no notes");
  // Hash is stripped so a reload won't re-import.
  assert.ok(!recipient.url().includes("#d="), "hash should be cleared after import");
});

test("keyboard shortcuts help opens via ? and button, closes on Escape", async (t) => {
  const page = await freshPage(t);
  // Opens with the "?" key (not while typing).
  await page.keyboard.press("Shift+Slash");
  await page.waitForSelector("#help-modal:not([hidden])");
  assert.ok((await page.$$eval(".shortcut-list > div", (els) => els.length)) >= 4, "should list shortcuts");
  // Escape closes and restores focus behaviour.
  await page.keyboard.press("Escape");
  await page.waitForSelector("#help-modal", { state: "hidden" });
  // Also opens via the header button.
  await page.click("#help-btn");
  await page.waitForSelector("#help-modal:not([hidden])");
  assert.ok(await page.evaluate(() => document.activeElement.id === "help-close"), "focus moves into the dialog");
  await page.click("#help-close");
  await page.waitForSelector("#help-modal", { state: "hidden" });

  // "?" must NOT trigger while typing in a field.
  await page.fill("#criterion-input", "a?b");
  assert.ok(await page.$("#help-modal[hidden]"), "help stays closed while typing");
});

test("editor actions stay on-screen on a narrow (mobile) viewport", async (t) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 } });
  const page = await ctx.newPage();
  t.after(() => ctx.close());
  await page.goto(base + "/");
  await page.waitForSelector("#decision-editor:not([hidden])");
  for (const id of ["#share-decision", "#duplicate-decision", "#delete-decision"]) {
    const right = await page.$eval(id, (el) => el.getBoundingClientRect().right);
    assert.ok(right <= 375, `${id} should be within the 375px viewport (right=${Math.round(right)})`);
  }
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.ok(!hScroll, "page must not scroll horizontally on mobile");
});

test("PWA: manifest, service worker, and offline reload", async (t) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  t.after(() => ctx.close());
  await page.goto(base + "/");
  const man = await page.evaluate(async () => {
    const r = await fetch(document.querySelector("link[rel=manifest]").href);
    return { ok: r.ok, json: await r.json() };
  });
  assert.ok(man.ok);
  assert.equal(man.json.name, "FigureLifeOut");
  assert.equal(man.json.icons.length, 3);

  // Wait for the worker to finish activating (ready can resolve mid-activation).
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const w = reg.active;
    if (!w) return "none";
    if (w.state !== "activated") {
      await new Promise((res) => w.addEventListener("statechange", () => w.state === "activated" && res()));
    }
    return w.state;
  });
  assert.equal(swState, "activated");

  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector(".brand h1");
  assert.equal(await page.textContent(".brand h1"), "FigureLifeOut");
  await ctx.setOffline(false);
});
