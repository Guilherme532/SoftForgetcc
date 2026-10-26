// Servidor LOCAL de teste (sem Supabase): node --experimental-strip-types supabase/functions/quiz/dev-server.mjs
// Depois ponha  window.SF_CONFIG = { api: "http://localhost:8787" }  em js/config.js (só para testar).
import http from "node:http";
import { handle, memoryStore } from "./index.ts";
const d = { store: memoryStore(), env: { ADMIN_PIN: process.env.ADMIN_PIN || "demo123" } };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await handle(new Request("http://localhost" + req.url, { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }), d);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log("API de teste em http://localhost:8787  (PIN do ranking: " + d.env.ADMIN_PIN + ")"));
