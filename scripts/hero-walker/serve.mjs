// Static server: /three/* -> GaitAI/node_modules/three/*, everything else -> this folder.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const three = "C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI/node_modules/three";
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".bvh": "text/plain" };

export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file = url.pathname.startsWith("/three/")
      ? path.join(three, url.pathname.slice(7))
      : path.join(here, url.pathname === "/" ? "render.html" : url.pathname.slice(1));
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server)));
}
