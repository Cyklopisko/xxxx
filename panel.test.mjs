import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import {
  requests,
  filterRequests,
  spent,
  csvRows,
  escapeHtml,
} from "./public/panel-data.js";

test("Request filters combine model, status, latency and case-insensitive search", () => {
  const filtered = filterRequests(requests, {
    query: "DEMO",
    model: "dawvqBEAST",
    status: "Completed",
    slow: true,
  });
  assert.ok(filtered.length > 0);
  assert.ok(
    filtered.every(
      (r) =>
        r.model === "dawvqBEAST" && r.status === "Completed" && r.latency > 2,
    ),
  );
  assert.equal(
    filterRequests(requests, { query: "not a real request" }).length,
    0,
  );
  assert.equal(new Set(requests.map((r) => r.id)).size, 48);
  assert.equal(spent(requests[0]), 4140);
});
test("User text is escaped and CSV quotes are preserved", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
  assert.ok(
    csvRows([{ ...requests[0], model: 'model"quoted' }]).includes(
      '"model""quoted"',
    ),
  );
});
test("Panel templates ship local assets without captured secrets or application scripts", async () => {
  for (const file of await readdir("public/views")) {
    const html = await readFile(`public/views/${file}`, "utf8");
    assert.ok(!/<script\b/i.test(html), file);
    assert.ok(!/\bsk_[a-zA-Z0-9]{10,}|\b[a-f0-9]{24,64}\b/i.test(html), file);
    assert.ok(!html.includes("Loading tickets…"), file);
    for (const m of html.matchAll(/(?:src|href)="(\/[^"?#]*)(?:[^\"]*)"/g)) {
      if (/\.(svg|png|css|woff2?)$/.test(m[1])) await access(`public${m[1]}`);
    }
  }
  for (const name of [
    "overview",
    "keys",
    "logs",
    "cli",
    "wallet",
    "profile",
    "referrals",
    "support",
    "support-new",
    "request-detail",
    "pricing-dialog",
    "models-dialog",
    "topup-dialog",
    "search-dialog",
  ])
    await access(`public/views/${name}.html`);
});
