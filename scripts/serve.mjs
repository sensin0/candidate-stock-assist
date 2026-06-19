import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const requested = rawPath === "/" ? "/index.html" : rawPath;
  const target = path.normalize(path.join(appDir, requested));

  if (!target.startsWith(appDir)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  fs.readFile(target, (error, body) => {
    if (error) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": types[path.extname(target)] || "application/octet-stream" });
    res.end(body);
  });
});

server.listen(port, () => {
  console.log(`候補銘柄アシスト: http://localhost:${port}`);
});
