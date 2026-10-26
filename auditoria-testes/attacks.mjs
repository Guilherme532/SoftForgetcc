import { handle, memoryStore, BANK, cleanName } from "/tmp/audit/backend/functions/quiz/index.ts";
let sent = 0;
const mk = (o = {}) => ({ store: memoryStore(), env: { ADMIN_PIN: "segredo123", WA_TOKEN: "t", WA_PHONE_ID: "1", WA_TO: "55" }, fetch: async () => { sent++; return { ok: true, text: async () => "" }; }, ...o });
const call = async (d, b, h = {}, raw) => { const r = await handle(new Request("http://x/", { method: "POST", headers: h, body: raw ?? JSON.stringify(b) }), d); return { s: r.status, j: await r.json().catch(() => null), h: r.headers }; };
const out = (k, v) => console.log(k.padEnd(34), typeof v === "string" ? v : JSON.stringify(v));

// A. bot que aprende o gabarito e depois faz 10/10
{ const d = mk(), known = new Map(); let reqs = 0;
  const run = async (name, dev, use) => { const st = await call(d, { action: "start", nickname: name, deviceId: dev }); reqs++; if (st.s !== 200) return st;
    for (const q of st.j.questions) { const ch = use && known.has(q.q) ? q.o.indexOf(known.get(q.q)) : 0; const r = await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: ch }); reqs++; known.set(q.q, q.o[r.j.correctIndex]); }
    reqs++; return call(d, { action: "finish", attemptId: st.j.attemptId }); };
  let n = 0; while (known.size < 20 && n < 40) { await run("aprende" + n, "aparelho-aprende-" + n, false); n++; }
  const f = await run("hacker", "aparelho-hacker-1", true);
  out("A1 tentativas p/ aprender 20/20", n); out("A2 requisições até então", reqs);
  out("A3 tentativa do bot", { nota: f.j.score + "/" + f.j.total, tempo_ms: f.j.durationMs });
  const rk = await call(d, { action: "ranking", pin: "segredo123" }); out("A4 1º lugar do ranking", rk.j.top[0]);
  const before = sent; for (let i = 0; i < 100; i++) await run("flood" + i, "aparelho-flood-" + i, true);
  out("B  avisos de WhatsApp disparados por 100 tentativas automáticas", sent - before);
}
// C. reserva de nomes sem terminar a tentativa (inclusive expiradas)
{ let t = 0; const d = mk({ now: () => t }); const nomes = ["ana", "joao", "maria", "pedro", "lucas", "julia"];
  for (const [i, n] of nomes.entries()) await call(d, { action: "start", nickname: n, deviceId: "squatter-device-" + i });
  t += 3 * 3600_000; // 3 h depois: todas as tentativas expiraram
  const r = await call(d, { action: "start", nickname: "Maria", deviceId: "pessoa-real-0001" }); out("C  'Maria' real, 3h depois, tentativas expiradas", { status: r.s, erro: r.j.error }); }
// D. corrida: mesmo nome, aparelhos diferentes, ao mesmo tempo
{ const d = mk(); const [a, b] = await Promise.all([call(d, { action: "start", nickname: "Corrida", deviceId: "aparelho-X-0001" }), call(d, { action: "start", nickname: "Corrida", deviceId: "aparelho-Y-0002" })]);
  out("D  dois starts simultâneos, mesmo nome", { a: a.s, b: b.s, tentativas_gravadas: (await d.store.byKey("corrida")).length }); }
// E. respostas simultâneas à mesma pergunta (store em memória; produção tem PK em answers)
{ const d = mk(); const st = await call(d, { action: "start", nickname: "Dupla", deviceId: "aparelho-D-0001" }); const q = st.j.questions[0], m = BANK.find((x) => x.id === q.id), right = q.o.indexOf(m.o[m.a]);
  await Promise.all(Array.from({ length: 10 }, () => call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: right })));
  const f = await call(d, { action: "finish", attemptId: st.j.attemptId }); out("E  10 respostas simultâneas à 1ª pergunta -> finish", { status: f.s, resultado: f.j }); }
// F. corpos estranhos
for (const raw of ["null", "[]", "123", '"x"', "{}", '{"action":"start"}']) { const r = await call(mk(), null, {}, raw); out("F  corpo " + raw, r.s + " " + (r.j && r.j.error)); }
// G. WhatsApp pendurado
{ const d = mk({ fetch: () => new Promise(() => {}) }); const st = await call(d, { action: "start", nickname: "Lento", deviceId: "aparelho-L-0001" });
  for (const q of st.j.questions) { const m = BANK.find((x) => x.id === q.id); await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: q.o.indexOf(m.o[m.a]) }); }
  const t0 = Date.now(); const r = await Promise.race([call(d, { action: "finish", attemptId: st.j.attemptId }), new Promise((res) => setTimeout(() => res("SEM RESPOSTA em 3 s"), 3000))]);
  out("G  finish com Meta sem responder (sem waitUntil)", typeof r === "string" ? r : "respondeu em " + (Date.now() - t0) + " ms"); }
// H. bloqueio de PIN com cabeçalho X-Forwarded-For variável
{ const d = mk(); let s429 = 0; for (let i = 0; i < 20; i++) { const r = await call(d, { action: "ranking", pin: "chute" + i }, { "x-forwarded-for": "10.0.0." + i }); if (r.s === 429) s429++; }
  const d2 = mk(); let b429 = 0; for (let i = 0; i < 20; i++) { const r = await call(d2, { action: "ranking", pin: "chute" + i }, { "x-forwarded-for": "10.0.0.1" }); if (r.s === 429) b429++; }
  out("H  20 chutes de PIN, cabeçalho XFF mudando", { bloqueios_429: s429 }); out("H  20 chutes de PIN, mesmo IP", { bloqueios_429: b429 }); }
// I. nomes de usuário maliciosos
for (const n of ['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', "javascript:alert(1)", "'; DROP TABLE attempts;--", "ＡＢＣ", "Аna", "\u202Eana", "a\u200Bna", "Ana😀", "Иван", "日本語", "x".repeat(21), "../../etc"]) { const c = cleanName(n); out("I  nome " + JSON.stringify(n).slice(0, 34), c.error ? c.error : "ACEITO key=" + JSON.stringify(c.key)); }
// L/N. erro interno e vazamento de campos
{ const d = mk(); d.store.byKey = async () => { throw new Error("SEGREDO-INTERNO postgres://user:pass@host"); }; const r = await call(d, { action: "start", nickname: "Erro", deviceId: "aparelho-E-00001" }); out("L  resposta a erro interno", { status: r.s, corpo: r.j, vazou: JSON.stringify(r.j).includes("SEGREDO") }); }
{ const d = mk(); const st = await call(d, { action: "start", nickname: "Campos", deviceId: "aparelho-C-00001" }); out("N1 chaves devolvidas por start", Object.keys(st.j)); out("N2 CORS", st.h.get("access-control-allow-origin")); }
