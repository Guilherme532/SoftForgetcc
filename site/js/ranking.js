/* SoftForge: ranking do organizador. Protegido por PIN verificado no servidor. */
(() => {
  const root = document.getElementById("board"); if (!root) return;
  const API = (window.SF_CONFIG || {}).api; let pin = "";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = id => root.querySelector("#" + id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function call(body) {
    let r; try { r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); } catch (_) { throw { code: "NETWORK" }; }
    const j = await r.json().catch(() => ({})); if (!r.ok) throw { code: j.error || "SERVER_ERROR" }; return j;
  }
  const ERR = { FORBIDDEN: "PIN incorreto.", TOO_MANY: "Muitas tentativas. Espere 1 minuto.", NETWORK: "Sem conexão com o servidor.", SERVER_ERROR: "Erro no servidor. Tente de novo." };
  function login(msg) {
    root.innerHTML = `<form id="pf" class="quiz-form card card--static" novalidate><label for="pp">PIN do organizador</label><input id="pp" type="password" autocomplete="off" required><p id="pe" class="quiz-error" role="alert" ${msg ? "" : "hidden"}>${esc(msg || "")}</p><button class="btn btn--primary" type="submit">Entrar</button></form>`;
    $("pp").focus();
    $("pf").addEventListener("submit", async e => {
      e.preventDefault(); const v = $("pp").value; try { const d = await call({ action: "ranking", pin: v }); pin = v; panel(d); } catch (x) { login(ERR[x.code] || ERR.SERVER_ERROR); }
    });
  }
  function panel(d) {
    root.innerHTML = `<div class="board-bar"><button id="show" class="btn btn--primary btn--lg" type="button">Mostrar rank</button><button id="hide" class="btn btn--secondary" type="button" hidden>Esconder</button><span id="stats" class="text-muted">Participantes: ${d.participants} · Tentativas: ${d.attempts}</span></div><p id="pe" class="quiz-error" role="alert" hidden></p><ol id="list" class="board-list" aria-live="polite"></ol>`;
    $("show").addEventListener("click", show); $("hide").addEventListener("click", () => { document.body.classList.remove("board-live"); $("list").innerHTML = ""; $("hide").hidden = true; $("stats").hidden = false; });
  }
  async function show() {
    $("show").disabled = true; $("pe").hidden = true;
    try {
      const d = await call({ action: "ranking", pin }); $("stats").hidden = true; $("hide").hidden = false; document.body.classList.add("board-live");
      const L = $("list");
      if (!d.top.length) { L.innerHTML = '<li class="board-empty">Ainda não há resultados.</li>'; return; }
      L.innerHTML = d.top.map(x => `<li class="board-item${x.pos === 1 ? " is-first" : ""}"><span class="board-pos">${x.pos}º</span><span class="board-name">${esc(x.nickname)}</span><span class="board-score">${x.score}/${x.total} · ${Math.round(x.durationMs / 1000)} s</span></li>`).join("");
      const items = [...L.children].reverse(); items.forEach(i => i.classList.add("is-pending"));
      for (const i of items) { if (!reduce) await wait(900); i.classList.remove("is-pending"); }
    } catch (x) { const m = $("pe"); m.hidden = false; m.textContent = ERR[x.code] || ERR.SERVER_ERROR; }
    finally { $("show").disabled = false; $("show").textContent = "Atualizar rank"; }
  }
  if (!API) root.innerHTML = '<p class="quiz-error">API do quiz não configurada (js/config.js).</p>'; else login();
})();
