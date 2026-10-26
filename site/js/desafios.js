/* SoftForge: quiz com servidor. Nome de usuário, correção e tempo ficam no servidor. */
(() => {
  const root = document.getElementById("quiz"); if (!root) return;
  const API = (window.SF_CONFIG || {}).api;
  const MSG = { INVALID_NAME: "Use de 2 a 20 caracteres: letras, números, espaço, _ . ou -.", NAME_BLOCKED: "Esse nome não é permitido. Escolha outro.", NAME_TAKEN: "Esse nome já está em uso. Escolha outro.", MAX_ATTEMPTS: "Você já usou as suas 2 tentativas.", EXPIRED: "O tempo desta tentativa acabou. Comece de novo.", FINISHED: "Esta tentativa já terminou.", NETWORK: "Sem conexão com o servidor. Verifique a internet e tente de novo.", SERVER_ERROR: "Algo deu errado no servidor. Tente de novo em instantes." };
  const say = c => MSG[c] || MSG.SERVER_ERROR;
  const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, "0")).join("");
  const device = (() => { try { let d = localStorage.getItem("sf-device"); if (!d) { d = uid(); localStorage.setItem("sf-device", d); } return d; } catch (_) { return uid(); } })();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = id => root.querySelector("#" + id);
  const motion = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  async function call(body) {
    let r; try { r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); } catch (_) { throw { code: "NETWORK" }; }
    const j = await r.json().catch(() => ({})); if (!r.ok) throw { code: j.error || "SERVER_ERROR" }; return j;
  }
  const HOME = window.SF_HASH ? "#/" : "../index.html"; // SF_HASH só existe na demonstração de página única
  let nick = "", S = null;

  function viewOff() { root.innerHTML = '<span class="eyebrow">Quiz</span><h2>Quiz indisponível no momento</h2><p>O servidor do quiz ainda não foi configurado. Volte mais tarde.</p>'; }

  function viewName(err) {
    root.innerHTML = `<span class="eyebrow">Antes de começar</span><h2>Qual é o seu nome?</h2><p class="quiz-note">Use só o primeiro nome ou um apelido. Ele serve apenas para registrar a sua pontuação. Os dados são apagados depois do evento.</p><form id="qf" class="quiz-form" novalidate><label for="qn">Nome de usuário</label><input id="qn" maxlength="20" autocomplete="off" value="${esc(nick)}" required><p id="qe" class="quiz-error" role="alert" ${err ? "" : "hidden"}>${err ? esc(err) : ""}</p><button class="btn btn--primary btn--lg" type="submit">Começar o quiz</button></form>`;
    $("qn").focus();
    $("qf").addEventListener("submit", async e => {
      e.preventDefault(); nick = $("qn").value.trim(); const b = $("qf").querySelector("button"); b.disabled = true;
      try { await begin(); } catch (x) { viewName(say(x.code)); }
    });
  }

  async function begin() {
    const r = await call({ action: "start", nickname: nick, deviceId: device });
    S = { id: r.attemptId, qs: r.questions, done: new Set(r.answered || []), i: 0, hits: 0 };
    S.i = S.qs.findIndex(q => !S.done.has(q.id));
    if (S.i === -1) return finish(); viewQ();
  }

  function viewQ() {
    const q = S.qs[S.i], last = S.i === S.qs.length - 1;
    root.innerHTML = `<div class="quiz-top"><span class="eyebrow">Pergunta ${S.i + 1} de ${S.qs.length}</span><span class="quiz-score">Jogador: ${esc(nick)}</span></div><div class="quiz-progress" aria-hidden="true"><span style="width:${S.i / S.qs.length * 100}%"></span></div><h2 id="qq" tabindex="-1">${esc(q.q)}</h2><div class="quiz-options">${q.o.map((o, k) => `<button type="button" class="quiz-option" data-k="${k}"><span class="quiz-option__letter">${String.fromCharCode(65 + k)}</span><span>${esc(o)}</span></button>`).join("")}</div><p id="qerr" class="quiz-error" role="alert" hidden></p><div id="qfb" class="quiz-feedback" aria-live="polite" hidden></div><div class="btn-group quiz-actions"><button id="qnext" class="btn btn--primary" type="button" disabled>${last ? "Ver resultado" : "Próxima pergunta"}</button></div>`;
    $("qq").focus({ preventScroll: true });
    const opts = [...root.querySelectorAll(".quiz-option")];
    root.querySelector(".quiz-options").addEventListener("click", async e => {
      const b = e.target.closest(".quiz-option"); if (!b || b.disabled) return;
      opts.forEach(x => x.disabled = true); $("qerr").hidden = true;
      try {
        const r = await call({ action: "answer", attemptId: S.id, qid: q.id, choice: Number(b.dataset.k) });
        S.done.add(q.id); if (r.correct) S.hits++;
        opts[r.correctIndex].classList.add("is-correct"); if (!r.correct) opts[r.chosen].classList.add("is-wrong");
        const fb = $("qfb"); fb.hidden = false; fb.className = "quiz-feedback " + (r.correct ? "is-correct" : "is-wrong");
        fb.innerHTML = `<strong>${r.correct ? "Resposta correta." : "Ainda não."}</strong><p>${esc(r.explanation)}</p>`;
        $("qnext").disabled = false; $("qnext").focus();
      } catch (x) { opts.forEach(o => o.disabled = false); const m = $("qerr"); m.hidden = false; m.textContent = say(x.code) + (x.code === "NETWORK" ? " Clique na resposta de novo para reenviar." : ""); if (x.code === "EXPIRED" || x.code === "FINISHED") { viewName(say(x.code)); } }
    });
    $("qnext").addEventListener("click", () => {
      S.i = S.qs.findIndex((x, k) => k > S.i && !S.done.has(x.id));
      if (S.i === -1) return finish(); viewQ(); root.scrollIntoView({ behavior: motion, block: "nearest" });
    });
  }

  async function finish() {
    root.innerHTML = '<span class="eyebrow">Quase lá</span><h2>Calculando o seu resultado…</h2>';
    try { viewResult(await call({ action: "finish", attemptId: S.id })); }
    catch (x) { root.innerHTML = `<span class="eyebrow">Quase lá</span><h2>Não consegui buscar o resultado</h2><p class="quiz-error" role="alert">${esc(say(x.code))}</p><button id="retry" class="btn btn--primary" type="button">Tentar de novo</button>`; $("retry").addEventListener("click", finish); }
  }

  const PG = k => window.SF_HASH ? "#/" + k : k + ".html"; // links para as páginas do site (modo demonstração usa #/)
  function viewResult(r) {
    const score = Number(r.score), total = Number(r.total), s = Math.round(Number(r.durationMs) / 1000), t = s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
    const msg = score >= 9 ? "Lendário! Você devia estar apresentando este TCC." : score >= 7 ? "Mandou muito bem!" : score >= 4 ? "Dá pro gasto. Releia o site e tente de novo." : "Hmm… sem problema. Todo software também nasce com bug.";
    const rev = Array.isArray(r.review) ? r.review : [], topics = Array.isArray(r.topics) ? r.topics : [];
    const items = rev.map((x, i) => `<li class="rv-item ${x.ok ? "is-correct" : "is-wrong"}"><span class="rv-mark" aria-hidden="true">${x.ok ? "✓" : "✗"}</span><div><p class="rv-q"><strong>${i + 1}. ${esc(x.q)}</strong></p><p><span class="rv-tag">${x.ok ? "Você acertou" : "Você errou"}</span> Sua resposta: ${esc(x.chosen ?? "sem resposta")}</p>${x.ok ? "" : `<p>Resposta certa: <strong>${esc(x.correct)}</strong></p>`}<p class="rv-exp">${esc(x.explanation)}</p></div></li>`).join("");
    const topicsHtml = !rev.length ? "" : topics.length ? `<h3 class="quiz-h">Assuntos para revisar</h3><ul class="rv-topics">${topics.map(x => `<li><a class="tag" href="${PG(String(x.page).replace(/[^a-z]/g, ""))}">${esc(x.name)}</a></li>`).join("")}</ul>` : '<p class="quiz-note"><strong>Nada para revisar.</strong> Você acertou tudo.</p>';
    root.innerHTML = `<span class="eyebrow">Desafio concluído</span><h2>${esc(nick)}, você fez</h2><p class="quiz-result__score">${score}<small> de ${total}</small></p><p class="quiz-result__msg"><strong>${msg}</strong></p><p class="quiz-note">Tempo: ${t}. O ranking é exibido apenas pelo organizador, no telão.</p>${topicsHtml}${rev.length ? `<details class="quiz-review" open><summary>Suas respostas</summary><ol class="rv-list">${items}</ol></details>` : ""}<div id="qerr" class="quiz-error" role="alert" hidden></div><div class="btn-group quiz-actions"><button id="again" class="btn btn--primary" type="button">Jogar de novo</button><a class="btn btn--secondary" href="${HOME}">Voltar ao início</a></div>`;
    $("again").addEventListener("click", async () => { try { await begin(); } catch (x) { const m = $("qerr"); m.hidden = false; m.textContent = say(x.code); if (x.code === "MAX_ATTEMPTS") $("again").disabled = true; } });
  }

  if (!API) viewOff(); else viewName();
})();
