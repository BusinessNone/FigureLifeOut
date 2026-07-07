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
  // Delete the seeded decision (dialog auto-accept).
  page.on("dialog", (d) => d.accept());
  await page.click("#delete-decision");
  await page.waitForSelector("#empty-state:not([hidden])");
  await page.reload();
  await page.waitForSelector("#empty-state:not([hidden])");
  assert.equal((await page.$$("#decision-list li")).length, 0, "seeded example resurrected after reload");
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
