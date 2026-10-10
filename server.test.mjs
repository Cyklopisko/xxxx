import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "./server.mjs";

test("Recovered pages and all local assets resolve, without production scripts", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of [
      "/",
      "/login",
      "/register",
      "/terms",
      "/products",
      "/panel",
      "/support",
    ]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert.ok(!/<script[^>]+src="(?:https?:|\/_next)/.test(html));
      for (const match of html.matchAll(
        /(?:src|href)="(\/[^"#?]*)(?:[^\"]*)"/g,
      )) {
        const url = match[1];
        assert.equal(
          (await fetch(origin + url)).status,
          200,
          `${route}: ${url}`,
        );
      }
    }
    assert.equal(
      (
        await fetch(origin + "/api/access/claim", {
          method: "POST",
          body: "{}",
        })
      ).status,
      405,
    );
    assert.equal((await fetch(origin + "/missing")).status, 404);
    assert.notEqual((await fetch(origin + "/..%5cpackage.json")).status, 200);
    const js = await readFile(
      new URL("./public/app.js", import.meta.url),
      "utf8",
    );
    assert.ok(!js.includes("localStorage.setItem"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
