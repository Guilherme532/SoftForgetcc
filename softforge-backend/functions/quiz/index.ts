// SoftForge: API do quiz (Supabase Edge Function, arquivo único).
// Regras importantes: gabarito e nota ficam SÓ aqui; o tempo é medido pelo servidor.
// Ações (POST JSON): start | answer | finish | ranking (esta exige o PIN do organizador).

const BANK: any[] = [
  { id: 1, q: "O cliente pede um sistema \"bem simples\". Qual é o primeiro passo?", o: ["Programar na hora, que é rapidinho", "Perguntar o que \"simples\" significa para ele", "Trocar o nome para \"sistema premium\""], a: 1, e: "Antes de construir, é preciso entender o problema. Isso se chama levantar requisitos." },
  { id: 2, q: "Testar um software antes de lançar é parecido com…", o: ["Provar a comida antes de servir", "Torcer para o cliente gostar", "Servir primeiro e pedir desculpa depois"], a: 0, e: "Testes acham os erros antes de o cliente achar." },
  { id: 3, q: "A arquitetura de um sistema é como…", o: ["A cor do botão", "A planta de uma casa", "O sobrenome do programador"], a: 1, e: "Antes de levantar as paredes, alguém desenha a planta." },
  { id: 4, q: "Lançar uma novidade na sexta, no fim do expediente, é…", o: ["Uma ótima ideia, ninguém vai reclamar", "Um convite para um fim de semana de trabalho", "Obrigatório por lei"], a: 1, e: "Lançar no meio da semana, de manhã, dá tempo de corrigir o que aparecer." },
  { id: 5, q: "Apareceu um bug durante a apresentação. Qual é a reação profissional?", o: ["Sumir da sala", "Dizer que é uma funcionalidade", "Respirar, anotar e corrigir depois"], a: 2, e: "Todo software tem bug. O profissional anota, corrige e segue em frente." },
  { id: 6, q: "Uma API é como…", o: ["Um garçom que leva o pedido à cozinha e traz a resposta", "Um tipo de planilha", "O dono do restaurante"], a: 0, e: "A API leva pedidos de um lado a outro e traz a resposta de volta." },
  { id: 7, q: "O banco de dados de um sistema serve para…", o: ["Decorar a tela", "Guardar as informações para ninguém esquecer", "Deixar tudo mais rápido, sempre"], a: 1, e: "É a memória do sistema: alunos, notas, pedidos, tudo que precisa ficar guardado." },
  { id: 8, q: "Quem deveria ter a chave de todas as portas do prédio?", o: ["Todo mundo, para facilitar", "Só quem precisa de cada porta", "O cachorro do vizinho"], a: 1, e: "Dar a cada pessoa só o acesso de que precisa é uma regra básica de segurança." },
  { id: 9, q: "Uma senha forte é…", o: ["123456, porque é fácil de lembrar", "O nome do seu cachorro", "Longa, difícil de adivinhar e diferente em cada lugar"], a: 2, e: "Senhas longas e únicas são muito mais difíceis de descobrir." },
  { id: 10, q: "Monitoramento é como…", o: ["Um alarme que avisa quando algo quebra", "Um espelho para o sistema se arrumar", "Um feriado para os servidores"], a: 0, e: "Alertas avisam o problema antes de o usuário reclamar." },
  { id: 11, q: "Depois que o site vai ao ar, o trabalho…", o: ["Acaba, hora de comemorar", "Continua: corrigir, melhorar e cuidar", "Passa para o cliente"], a: 1, e: "Software não termina quando é lançado." },
  { id: 12, q: "Dívida técnica é…", o: ["Quando o computador fica devendo no banco", "O preço de fazer correndo e arrumar depois", "Um imposto sobre programadores"], a: 1, e: "Atalhos hoje viram trabalho extra amanhã, com juros." },
  { id: 13, q: "Trabalhar em equipe sem controle de versões é como…", o: ["Todo mundo editando o mesmo trabalho escolar sem saber quem mudou o quê", "Uma festa bem organizada", "Um jogo de futebol com cinco bolas"], a: 0, e: "O Git guarda o histórico e evita que um apague o trabalho do outro." },
  { id: 14, q: "Uma IA escreveu o código. O que fazer?", o: ["Confiar de olhos fechados", "Revisar e testar antes de usar", "Culpar a IA se der errado"], a: 1, e: "A IA ajuda, mas quem responde pelo resultado é a pessoa." },
  { id: 15, q: "Automatizar tarefas repetitivas serve para…", o: ["Roubar o emprego do estagiário", "Evitar erros e liberar tempo para o que importa", "Deixar tudo mais lento de propósito"], a: 1, e: "Máquinas não se cansam, e as pessoas ficam livres para pensar." },
  { id: 16, q: "Qual é a melhor hora de achar um erro?", o: ["Cedo, antes de virar um problema grande", "Só depois do lançamento", "Nunca, ignorância é felicidade"], a: 0, e: "Quanto mais cedo o erro aparece, mais barato é consertar." },
  { id: 17, q: "Programar e fazer engenharia de software são a mesma coisa?", o: ["Sim, é só mudar o nome", "Não: a engenharia também planeja, testa, entrega e cuida", "Só se tiver café"], a: 1, e: "Programar é uma parte. A engenharia cuida do ciclo inteiro." },
  { id: 18, q: "Num bom projeto, o planejamento vem…", o: ["Depois do lançamento", "No fim de semana", "Antes de começar a construir"], a: 2, e: "Planejar cedo evita refazer tudo depois." },
  { id: 19, q: "Se muito mais gente passar a usar o sistema, ele precisa…", o: ["Aguentar o crescimento sem travar", "Fingir que está saindo do ar", "Ser desligado para descansar"], a: 0, e: "Crescer sem travar se chama escalabilidade." },
  { id: 20, q: "Uma boa mensagem de erro para o usuário é…", o: ["Um código misterioso em inglês", "Uma tela azul e silêncio", "Um texto claro dizendo o que houve e o que fazer"], a: 2, e: "Mensagem boa explica o problema em português simples e mostra o caminho." },
];

// Assunto de cada pergunta e a página do site onde ele é explicado (usado em "assuntos para revisar").
const TOPICS: any = {
  requisitos: { name: "Requisitos", page: "processo" }, arquitetura: { name: "Arquitetura", page: "sistema" },
  api: { name: "APIs", page: "laboratorio" }, banco: { name: "Banco de dados", page: "laboratorio" },
  testes: { name: "Testes", page: "processo" }, seguranca: { name: "Segurança", page: "processo" },
  deploy: { name: "Deploy e CI/CD", page: "processo" }, monitoramento: { name: "Monitoramento", page: "processo" },
  manutencao: { name: "Manutenção e evolução", page: "processo" }, equipe: { name: "Equipe e controle de versões", page: "processo" },
  ia: { name: "IA no desenvolvimento", page: "futuro" }, engenharia: { name: "Engenharia de software", page: "processo" },
};
const TOPIC_OF: any = { 1: "requisitos", 2: "testes", 3: "arquitetura", 4: "deploy", 5: "manutencao", 6: "api", 7: "banco", 8: "seguranca", 9: "seguranca", 10: "monitoramento", 11: "manutencao", 12: "manutencao", 13: "equipe", 14: "ia", 15: "deploy", 16: "testes", 17: "engenharia", 18: "requisitos", 19: "arquitetura", 20: "requisitos" };

const QUIZ_SIZE = 10, MAX_ATTEMPTS = 2, TTL_MS = 30 * 60 * 1000;
const BLOCKED = ["porra", "caralho", "puta", "merda", "buceta", "fdp", "arrombado", "cuzao"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
const J = (o: any, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
const byId = (id: number) => BANK.find((q) => q.id === id);
const rnd = (n: number) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const shuffle = (arr: any[]) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function cleanName(raw: any) {
  const name = String(raw ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 20 || !/^[\p{L}\p{N} _.-]+$/u.test(name)) return { error: "INVALID_NAME" };
  const key = strip(name).replace(/[^a-z0-9]/g, "");
  const leet = key.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s");
  if (!key || BLOCKED.some((w) => leet.includes(w))) return { error: "NAME_BLOCKED" };
  return { name, key };
}

const fails = new Map<string, { n: number; t: number }>();
function pinOk(env: any, pin: any, ip: string, now: number) {
  const f = fails.get(ip);
  if (f && now - f.t < 60000 && f.n >= 5) return "TOO_MANY";
  const want = String(env.ADMIN_PIN ?? "");
  let ok = want.length >= 6 && String(pin ?? "").length === want.length;
  if (ok) { let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ String(pin).charCodeAt(i); ok = d === 0; }
  if (ok) { fails.delete(ip); return "OK"; }
  fails.set(ip, { n: f && now - f.t < 60000 ? f.n + 1 : 1, t: now });
  return "FORBIDDEN";
}

async function notify(d: any, id: string, text: string) {
  const env = d.env || {}; let status = "skipped", detail = "";
  if (env.WA_TOKEN && env.WA_PHONE_ID && env.WA_TO) {
    try {
      const r = await (d.fetch || fetch)(`https://graph.facebook.com/${env.WA_API_VERSION || "v21.0"}/${env.WA_PHONE_ID}/messages`, {
        method: "POST", headers: { authorization: `Bearer ${env.WA_TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: env.WA_TO, type: "text", text: { body: text } }),
      });
      status = r.ok ? "sent" : "failed"; if (!r.ok) detail = String(await r.text()).slice(0, 300);
    } catch (e) { status = "failed"; detail = String(e).slice(0, 300); }
  }
  try { await d.store.log({ attempt_id: id, channel: "whatsapp", status, detail }); } catch (_) { /* aviso nunca derruba o quiz */ }
}

// Revisão para quem terminou: sua resposta, a certa, a explicação e os assuntos dos erros.
function review(a: any, ans: any[]) {
  const got = new Map(ans.map((x: any) => [x.qid, x]));
  const items = a.plan.map((p: any) => {
    const q = byId(p.qid), x: any = got.get(p.qid), opts = p.order.map((i: number) => q.o[i]);
    return { q: q.q, chosen: x ? opts[x.chosen] ?? null : null, correct: opts[p.order.indexOf(q.a)], ok: !!(x && x.correct), explanation: q.e, topic: TOPIC_OF[q.id] };
  });
  const seen = new Set<string>(), topics: any[] = [];
  for (const it of items) if (!it.ok && !seen.has(it.topic)) { seen.add(it.topic); topics.push(TOPICS[it.topic]); }
  return { review: items.map(({ topic, ...r }: any) => r), topics };
}

const view = (a: any) => a.plan.map((p: any) => { const q = byId(p.qid); return { id: q.id, q: q.q, o: p.order.map((i: number) => q.o[i]) }; });

export async function handle(req: Request, d: any): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return J({ error: "BAD_REQUEST" }, 405);
  let b: any;
  try { const t = await req.text(); if (t.length > 4000) throw 0; b = JSON.parse(t); } catch (_) { return J({ error: "BAD_REQUEST" }, 400); }
  const st = d.store, now = (d.now ? d.now() : Date.now()), iso = (t: number) => new Date(t).toISOString();
  try {
    if (b.action === "start") {
      const c: any = cleanName(b.nickname); if (c.error) return J({ error: c.error }, 400);
      const dev = String(b.deviceId ?? "").slice(0, 64); if (dev.length < 8) return J({ error: "BAD_REQUEST" }, 400);
      const prev = await st.byKey(c.key);
      if (prev.length && !prev.some((a: any) => a.device_id === dev)) return J({ error: "NAME_TAKEN" }, 409);
      const open = prev.find((a: any) => a.device_id === dev && a.status === "active" && now - Date.parse(a.started_at) < TTL_MS);
      if (open) { const done = (await st.answers(open.id)).map((x: any) => x.qid); return J({ attemptId: open.id, questions: view(open), answered: done, resumed: true }); }
      if (prev.length >= MAX_ATTEMPTS) return J({ error: "MAX_ATTEMPTS" }, 429);
      const plan = shuffle(BANK).slice(0, QUIZ_SIZE).map((q: any) => ({ qid: q.id, order: shuffle(q.o.map((_: any, i: number) => i)) }));
      const a = { id: crypto.randomUUID(), nickname: c.name, nickname_key: c.key, device_id: dev, plan, status: "active", started_at: iso(now) };
      await st.insert(a);
      return J({ attemptId: a.id, questions: view(a), answered: [] });
    }
    if (b.action === "answer") {
      const a = await st.get(String(b.attemptId ?? "")); if (!a) return J({ error: "NOT_FOUND" }, 404);
      if (a.status !== "active") return J({ error: "FINISHED" }, 409);
      if (now - Date.parse(a.started_at) > TTL_MS) return J({ error: "EXPIRED" }, 410);
      const p = a.plan.find((x: any) => x.qid === b.qid); const ch = Number(b.choice);
      if (!p || !Number.isInteger(ch) || ch < 0 || ch >= p.order.length) return J({ error: "BAD_REQUEST" }, 400);
      const q = byId(p.qid), right = p.order.indexOf(q.a), had = await st.answer(a.id, p.qid);
      if (had) return J({ correct: had.correct, chosen: had.chosen, correctIndex: right, explanation: q.e, repeat: true });
      const correct = ch === right; await st.addAnswer({ attempt_id: a.id, qid: p.qid, chosen: ch, correct });
      return J({ correct, chosen: ch, correctIndex: right, explanation: q.e });
    }
    if (b.action === "finish") {
      const a = await st.get(String(b.attemptId ?? "")); if (!a) return J({ error: "NOT_FOUND" }, 404);
      if (a.status === "finished") return J({ score: a.score, total: a.total, durationMs: a.duration_ms, ...review(a, await st.answers(a.id)) });
      if (now - Date.parse(a.started_at) > TTL_MS) return J({ error: "EXPIRED" }, 410);
      const ans = await st.answers(a.id); if (ans.length < a.plan.length) return J({ error: "INCOMPLETE" }, 400);
      const score = ans.filter((x: any) => x.correct).length, ms = now - Date.parse(a.started_at);
      await st.update(a.id, { status: "finished", score, total: a.plan.length, duration_ms: ms, finished_at: iso(now) });
      const job = notify(d, a.id, `SoftForge: ${a.nickname} fez ${score}/${a.plan.length} em ${Math.round(ms / 1000)}s`);
      if (d.waitUntil) d.waitUntil(job); else await job;
      return J({ score, total: a.plan.length, durationMs: ms, ...review(a, ans) });
    }
    if (b.action === "ranking") {
      // o último valor é o que o proxy confiável acrescenta; o primeiro pode ser forjado pelo cliente
      const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "?").split(",").pop()!.trim();
      const r = pinOk(d.env || {}, b.pin, ip, now);
      if (r === "TOO_MANY") return J({ error: "TOO_MANY" }, 429);
      if (r !== "OK") return J({ error: "FORBIDDEN" }, 403);
      const rows = await st.finished(), best = new Map<string, any>();
      for (const x of rows) { const o = best.get(x.nickname_key); if (!o || x.score > o.score || (x.score === o.score && x.duration_ms < o.duration_ms)) best.set(x.nickname_key, x); }
      const top = [...best.values()].sort((x, y) => y.score - x.score || x.duration_ms - y.duration_ms).slice(0, 5)
        .map((x, i) => ({ pos: i + 1, nickname: x.nickname, score: x.score, total: x.total, durationMs: x.duration_ms }));
      return J({ top, participants: best.size, attempts: rows.length });
    }
    return J({ error: "BAD_REQUEST" }, 400);
  } catch (e) { console.error(e); return J({ error: "SERVER_ERROR" }, 500); }
}

export function supabaseStore(sb: any) {
  const ok = (r: any) => { if (r.error) throw new Error(r.error.message); return r.data; };
  return {
    byKey: async (k: string) => ok(await sb.from("attempts").select("*").eq("nickname_key", k)),
    get: async (id: string) => ok(await sb.from("attempts").select("*").eq("id", id).maybeSingle()),
    insert: async (a: any) => ok(await sb.from("attempts").insert(a)),
    update: async (id: string, p: any) => ok(await sb.from("attempts").update(p).eq("id", id)),
    answer: async (id: string, q: number) => ok(await sb.from("answers").select("*").eq("attempt_id", id).eq("qid", q).maybeSingle()),
    addAnswer: async (a: any) => ok(await sb.from("answers").insert(a)),
    answers: async (id: string) => ok(await sb.from("answers").select("*").eq("attempt_id", id)),
    finished: async () => ok(await sb.from("attempts").select("nickname,nickname_key,score,total,duration_ms").eq("status", "finished")),
    log: async (n: any) => ok(await sb.from("notifications").insert(n)),
  };
}

export function memoryStore() {
  const A = new Map<string, any>(), N: any[] = [], X: any[] = [];
  return {
    byKey: async (k: string) => [...A.values()].filter((a) => a.nickname_key === k),
    get: async (id: string) => A.get(id) ?? null,
    insert: async (a: any) => { A.set(a.id, { ...a }); },
    update: async (id: string, p: any) => { Object.assign(A.get(id), p); },
    answer: async (id: string, q: number) => X.find((x) => x.attempt_id === id && x.qid === q) ?? null,
    addAnswer: async (a: any) => { X.push({ ...a }); },
    answers: async (id: string) => X.filter((x) => x.attempt_id === id),
    finished: async () => [...A.values()].filter((a) => a.status === "finished"),
    log: async (n: any) => { N.push(n); },
    _notifications: N,
  };
}

export { BANK };

// Execução real no Supabase (no navegador e nos testes, "Deno" não existe e isto é ignorado).
const D: any = (globalThis as any).Deno;
if (D && D.serve) {
  let store: any;
  D.serve(async (req: Request) => {
    if (!store) {
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      store = supabaseStore(createClient(D.env.get("SUPABASE_URL"), D.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } }));
    }
    return handle(req, { store, env: D.env.toObject(), waitUntil: (globalThis as any).EdgeRuntime?.waitUntil?.bind((globalThis as any).EdgeRuntime) });
  });
}
