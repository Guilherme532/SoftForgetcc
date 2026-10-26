import { handle, memoryStore } from "/tmp/audit/backend/functions/quiz/index.ts";
const d = { store: memoryStore(), env: { ADMIN_PIN: "segredo123" } };
const call = async (b) => { const r = await handle(new Request("http://x/", { method: "POST", body: JSON.stringify(b) }), d); return { s: r.status, j: await r.json() }; };
let ok = 0; for (let i = 0; i < 8; i++) { const r = await call({ action: "start", nickname: "nome" + i, deviceId: "mesmo-aparelho-0001" }); if (r.s === 200) ok++; }
console.log("M  8 nomes diferentes no MESMO aparelho, tentativas aceitas:", ok, "(limite de 2 é por nome, não por pessoa/aparelho)");
