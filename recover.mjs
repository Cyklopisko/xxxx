import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://dawvq.com";
const routes = [
  "/",
  "/login",
  "/register",
  "/support",
  "/terms",
  "/products",
  "/panel",
];
const pending = new Set();
const saved = new Set();
function discover(text) {
  for (const match of text.matchAll(
    /(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)["']?\)/g,
  )) {
    const raw = match[1] || match[2];
    const url = new URL(raw, origin);
    if (
      url.origin === origin &&
      /\.(?:css|js|svg|png|jpe?g|webp|woff2?|ico)(?:\?|$)/i.test(url.href)
    )
      pending.add(url.pathname + url.search);
  }
}
for (const route of routes) {
  const response = await fetch(origin + route);
  if (!response.ok) throw new Error(`${route}: ${response.status}`);
  const html = await response.text();
  const name = route === "/" ? "index" : route.slice(1);
  await mkdir("recovery", { recursive: true });
  await writeFile(`recovery/${name}.html`, html);
  discover(html);
  let clean = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b(?=[^>]*as="script")[^>]*>/gi, "");
  clean = clean.replace(
    "</body>",
    '<script type="module" src="/app.js"></script></body>',
  );
  await mkdir("public", { recursive: true });
  await writeFile(`public/${name}.html`, clean);
  console.log(
    `${route}: ${html.length} bytes, final ${new URL(response.url).pathname}`,
  );
}
while ([...pending].some((url) => !saved.has(url))) {
  const batch = [...pending].filter((url) => !saved.has(url));
  await Promise.all(
    batch.map(async (url) => {
      saved.add(url);
      const response = await fetch(origin + url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const pathname = new URL(origin + url).pathname;
      const destination = path.join(
        pathname.endsWith(".js") ? "recovery" : "public",
        pathname,
      );
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
      if (pathname.endsWith(".css")) discover(bytes.toString());
    }),
  );
}
console.log(`Recovered ${saved.size} public assets.`);
