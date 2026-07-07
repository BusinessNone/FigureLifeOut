// Minimal static file server for local dev and tests. Zero dependencies.
// Run standalone:  node scripts/serve.mjs   (PORT env optional, default 8080)
// Or import { start } for use in tests.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

export function createStaticServer(root = ROOT) {
  return http.createServer(async (req, res) => {
    let pathname = decodeURI((req.url || "/").split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    // Resolve within root; reject traversal.
    const filePath = join(root, normalize(pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    try {
      const buf = await readFile(filePath);
      res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
    }
  });
}

export function start(port = 0, root = ROOT) {
  return new Promise((resolve) => {
    const server = createStaticServer(root);
    server.listen(port, () => resolve(server));
  });
}

// Standalone invocation
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  start(Number(process.env.PORT) || 8080).then((s) => {
    console.log(`FigureLifeOut serving on http://localhost:${s.address().port}`);
  });
}
