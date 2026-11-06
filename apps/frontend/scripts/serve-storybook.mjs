import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../storybook-static",
);
const port = Number(process.env.STORYBOOK_PORT || 6006);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let uri = decodeURIComponent(url.pathname);
    if (uri.endsWith("/")) uri += "index.html";
    const filePath = path.resolve(root, "." + uri);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": mime[ext] || "application/octet-stream" });
    res.end(fs.readFileSync(filePath));
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`storybook-static on http://127.0.0.1:${port}`);
  });
