// Testes da API do quiz. Rodar: node --experimental-strip-types --test supabase/functions/quiz/quiz.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { handle, memoryStore, BANK, cleanName } from "./index.ts";

const PIN = "segredo123";
const mk = (extra = {}) => ({ store: memoryStore(), env: { ADMIN_PIN: PIN, WA_TOKEN: "t", WA_PHONE_ID: "1", WA_TO: "5500000000000" }, fetch: async () => ({ ok: true, text: async () => "" }), ...extra });
const call = async (d, body, ip = "1.1.1.1") => { const r = await handle(new Request("http://x/", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }), d); return { s: r.status, j: await r.json() }; };
const dev = "aparelho-0001";
// responde tudo; "hits" = quantas certas
async function play(d, nickname, hits = 10, deviceId = dev) {
  const st = await call(d, { action: "start", nickname, deviceId }); assert.equal(st.s, 200);
  let i = 0;
  for (const q of st.j.questions) {
    const meta = BANK.find((x) => x.id === q.id), correctText = meta.o[meta.a];
    const right = q.o.indexOf(correctText), wrong = q.o.findIndex((_, k) => k !== right);
    const r = await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: i < hits ? right : wrong }); assert.equal(r.j.correct, i < hits); i++;
  }
  return { id: st.j.attemptId, fin: await call(d, { action: "finish", attemptId: st.j.attemptId }) };
}

test("nomes: validação e filtro", () => {
  assert.equal(cleanName("A").error, "INVALID_NAME");
  assert.equal(cleanName("a".repeat(21)).error, "INVALID_NAME");
  assert.equal(cleanName("<b>x</b>").error, "INVALID_NAME");
  assert.equal(cleanName("p0rra").error, "NAME_BLOCKED");
  assert.equal(cleanName("  João   Silva ").name, "João Silva");
  assert.equal(cleanName("JOAO silva").key, cleanName("João Silva").key);
});
test("start: 10 perguntas sem gabarito nem explicação, alternativas embaralhadas", async () => {
  const d = mk(); const r = await call(d, { action: "start", nickname: "Ana", deviceId: dev });
  assert.equal(r.j.questions.length, 10);
  assert.ok(!JSON.stringify(r.j).includes('"a"') && !JSON.stringify(r.j).includes("explanation") && !JSON.stringify(r.j).includes('"e"'));
  const pos = new Set();
  for (let n = 0; n < 60; n++) { const x = await call(mk(), { action: "start", nickname: "Ana", deviceId: dev }); const q = x.j.questions.find((q) => q.id === 6); if (q) pos.add(q.o.indexOf(BANK[5].o[BANK[5].a])); }
  assert.ok(pos.size >= 2, "a alternativa certa deve mudar de posição entre tentativas");
});
test("jogo completo: nota, tempo no servidor e aviso", async () => {
  let t = 1_000_000, calls = 0; const d = mk({ now: () => t, fetch: async (u, o) => { calls++; assert.match(o.body, /Ana fez 7\/10/); return { ok: true, text: async () => "" }; } });
  const st = await call(d, { action: "start", nickname: "Ana", deviceId: dev }); t += 52_000;
  for (const [i, q] of st.j.questions.entries()) { const m = BANK.find((x) => x.id === q.id), right = q.o.indexOf(m.o[m.a]); await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: i < 7 ? right : (right + 1) % 3 }); }
  const f = await call(d, { action: "finish", attemptId: st.j.attemptId });
  assert.deepEqual([f.j.score, f.j.total, f.j.durationMs], [7, 10, 52_000]); assert.equal(calls, 1);
  assert.equal(d.store._notifications[0].status, "sent");
  assert.equal((await call(d, { action: "finish", attemptId: st.j.attemptId })).j.score, 7); assert.equal(calls, 1);
});
test("falha do WhatsApp não derruba o quiz", async () => {
  const d = mk({ fetch: async () => { throw new Error("rede"); } }); const { fin } = await play(d, "Beto", 10);
  assert.equal(fin.s, 200); assert.equal(fin.j.score, 10); assert.equal(d.store._notifications[0].status, "failed");
});
test("sem credenciais do WhatsApp: aviso 'skipped', quiz normal", async () => {
  const d = mk({ env: { ADMIN_PIN: PIN } }); await play(d, "Caio", 5); assert.equal(d.store._notifications[0].status, "skipped");
});
test("resposta não pode ser alterada nem repetida", async () => {
  const d = mk(); const st = await call(d, { action: "start", nickname: "Duda", deviceId: dev }); const q = st.j.questions[0];
  const m = BANK.find((x) => x.id === q.id), right = q.o.indexOf(m.o[m.a]), wrong = (right + 1) % 3;
  assert.equal((await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: wrong })).j.correct, false);
  const again = await call(d, { action: "answer", attemptId: st.j.attemptId, qid: q.id, choice: right }); assert.equal(again.j.correct, false); assert.equal(again.j.repeat, true);
});
test("finish exige todas as respostas; pergunta fora do sorteio é recusada", async () => {
  const d = mk(); const st = await call(d, { action: "start", nickname: "Edu", deviceId: dev });
  assert.equal((await call(d, { action: "finish", attemptId: st.j.attemptId })).j.error, "INCOMPLETE");
  const outside = BANK.map((q) => q.id).find((id) => !st.j.questions.some((q) => q.id === id));
  assert.equal((await call(d, { action: "answer", attemptId: st.j.attemptId, qid: outside, choice: 0 })).s, 400);
  assert.equal((await call(d, { action: "answer", attemptId: st.j.attemptId, qid: st.j.questions[0].id, choice: 9 })).s, 400);
});
test("nome repetido é recusado; mesmo aparelho pode repetir; terceira tentativa não", async () => {
  const d = mk(); await play(d, "Fabi", 3, "aparelho-A001");
  assert.equal((await call(d, { action: "start", nickname: "fabi", deviceId: "aparelho-B002" })).j.error, "NAME_TAKEN");
  await play(d, "Fabi", 8, "aparelho-A001");
  assert.equal((await call(d, { action: "start", nickname: "Fabi", deviceId: "aparelho-A001" })).j.error, "MAX_ATTEMPTS");
});
test("recarregar no meio retoma a mesma tentativa (não gasta tentativa)", async () => {
  const d = mk(); const a = await call(d, { action: "start", nickname: "Gus", deviceId: dev }); const q = a.j.questions[0];
  await call(d, { action: "answer", attemptId: a.j.attemptId, qid: q.id, choice: 0 });
  const b = await call(d, { action: "start", nickname: "Gus", deviceId: dev });
  assert.equal(b.j.attemptId, a.j.attemptId); assert.deepEqual(b.j.answered, [q.id]); assert.equal(b.j.resumed, true);
});
test("tentativa expira após 30 minutos", async () => {
  let t = 0; const d = mk({ now: () => t }); const a = await call(d, { action: "start", nickname: "Hana", deviceId: dev }); t += 31 * 60_000;
  assert.equal((await call(d, { action: "answer", attemptId: a.j.attemptId, qid: a.j.questions[0].id, choice: 0 })).s, 410);
});
test("ranking: exige PIN, bloqueia força bruta e ordena (nota, depois tempo)", async () => {
  let t = 0; const d = mk({ now: () => t });
  const run = async (name, hits, secs, devc) => { const s = await call(d, { action: "start", nickname: name, deviceId: devc }); t += secs * 1000;
    for (const [i, q] of s.j.questions.entries()) { const m = BANK.find((x) => x.id === q.id), right = q.o.indexOf(m.o[m.a]); await call(d, { action: "answer", attemptId: s.j.attemptId, qid: q.id, choice: i < hits ? right : (right + 1) % 3 }); }
    await call(d, { action: "finish", attemptId: s.j.attemptId }); };
  await run("Lia", 9, 40, "aparelho-L001"); await run("Meg", 9, 30, "aparelho-M001"); await run("Noa", 10, 90, "aparelho-N001");
  await run("Ola", 4, 20, "aparelho-O001"); await run("Pri", 6, 25, "aparelho-P001"); await run("Qui", 5, 25, "aparelho-Q001"); await run("Lia", 2, 10, "aparelho-L001");
  assert.equal((await call(d, { action: "ranking" })).s, 403);
  const r = await call(d, { action: "ranking", pin: PIN }); assert.equal(r.s, 200);
  assert.deepEqual(r.j.top.map((x) => x.nickname), ["Noa", "Meg", "Lia", "Pri", "Qui"]); assert.equal(r.j.participants, 6); assert.equal(r.j.attempts, 7);
  for (let i = 0; i < 6; i++) await call(d, { action: "ranking", pin: "errado" }, "9.9.9.9");
  assert.equal((await call(d, { action: "ranking", pin: PIN }, "9.9.9.9")).s, 429);
  assert.equal((await call(d, { action: "ranking", pin: PIN }, "2.2.2.2")).s, 200);
});
test("sem ADMIN_PIN configurado, o ranking fica trancado", async () => {
  const d = mk({ env: {} }); assert.equal((await call(d, { action: "ranking", pin: "" })).s, 403);
});
test("entradas inválidas", async () => {
  const d = mk(); assert.equal((await handle(new Request("http://x/", { method: "POST", body: "{nao é json" }), d)).status, 400);
  assert.equal((await handle(new Request("http://x/", { method: "GET" }), d)).status, 405);
  assert.equal((await call(d, { action: "start", nickname: "Ivo", deviceId: "x" })).s, 400);
  assert.equal((await call(d, { action: "xyz" })).s, 400);
});

test("finish devolve a revisão das respostas e os assuntos para revisar", async () => {
  const d = mk(); const { id, fin } = await play(d, "Rev", 7);
  assert.equal(fin.j.review.length, 10); assert.equal(fin.j.review.filter((r) => r.ok).length, 7);
  for (const r of fin.j.review) { assert.ok(r.q && r.correct && r.explanation); assert.equal(r.ok, r.chosen === r.correct); }
  assert.ok(fin.j.topics.length >= 1 && fin.j.topics.every((t) => t.name && /^[a-z]+$/.test(t.page)));
  const again = await call(d, { action: "finish", attemptId: id }); assert.equal(again.j.review.length, 10); assert.equal(again.j.score, 7);
  const perfect = await play(d, "Gabi", 10); assert.deepEqual(perfect.fin.j.topics, []); assert.ok(perfect.fin.j.review.every((r) => r.ok));
});
test("revisão não aparece antes de terminar", async () => {
  const d = mk(); const st = await call(d, { action: "start", nickname: "Cedo", deviceId: dev });
  const f = await call(d, { action: "finish", attemptId: st.j.attemptId }); assert.equal(f.j.review, undefined); assert.equal(f.j.error, "INCOMPLETE");
});
