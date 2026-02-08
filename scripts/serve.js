import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 5173);
const ROOT = process.cwd();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer((req, res) => {
  const rawPath = req.url === "/" ? "/index.html" : req.url || "/index.html";
  const safePath = normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(ROOT, safePath);

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath);
  const type = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
