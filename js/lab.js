/* SoftForge — js/lab.js: laboratório de arquitetura (diagrama + simulação didática) */
(() => {
  const root = document.getElementById("lab"); if (!root) return;
  const W = 160, H = 64;
  const C = {
    browser:{n:"Navegador",s:"Frontend",x:0,y:120,f:"É o que o usuário vê e toca: telas, formulários e botões. Envia pedidos para a API e mostra as respostas.",e:["HTML, CSS e JavaScript","Frameworks como React ou Vue","Validação básica de formulários"],r:["Tela lenta ou travada","Validação feita só no cliente, que pode ser burlada","Informações sensíveis expostas no código da página"]},
    api:{n:"API",s:"Porta de entrada",x:200,y:120,f:"Recebe os pedidos, confere quem está pedindo e encaminha para o lugar certo. Define o “contrato” de comunicação.",e:["REST com JSON","GraphQL","Autenticação por token (JWT)"],r:["Token inválido ou expirado (401)","Rota sem verificação de permissão","Excesso de requisições sem limite de uso"]},
    back:{n:"Backend",s:"Regras de negócio",x:400,y:120,f:"Aplica as regras de negócio: quem pode lançar notas, como a média é calculada, o que fazer quando algo dá errado.",e:["Node.js com Express","Java com Spring","Python com Django ou FastAPI"],r:["Regra de negócio implementada errada","Erro não tratado que derruba o servidor","Código lento que acumula pedidos"]},
    db:{n:"Banco de dados",s:"Armazenamento",x:600,y:120,f:"Guarda os dados de forma organizada e permanente: alunos, professores, notas e presença.",e:["PostgreSQL ou MySQL","MongoDB","Backups e réplicas"],r:["Banco indisponível ou lento","Consulta mal escrita, vulnerável a SQL Injection","Perda de dados sem backup"]},
    ext:{n:"Serviços externos",s:"E-mail, pagamentos",x:400,y:270,f:"Outros sistemas dos quais o seu depende, em vez de refazer tudo do zero.",e:["Pagamentos","Envio de e-mails e notificações","Login com Google"],r:["Serviço fora do ar ou lento","Mudança na API do fornecedor","Custo que cresce com o uso"]},
    qa:{n:"Testes e monitoramento",s:"Qualidade e alertas",x:200,y:270,f:"Testes confirmam que o sistema se comporta como esperado. O monitoramento acompanha a saúde dele em produção.",e:["Jest e Cypress","Logs e métricas","Prometheus e Grafana"],r:["Testes que só cobrem o caminho feliz","Alertas demais, que acabam ignorados","Nenhum alerta para falhas importantes"]}
  };
  const cx = k => C[k].x + W / 2, cy = k => C[k].y + H / 2;
  const pre = [["browser","Usuário abre “Minhas notas” e o navegador envia GET /notas.","ok"],["api","API confere o token e encaminha a rota.","ok"],["back","Backend aplica as regras e consulta os dados.","ok"]];
  const S = {
    ok:{l:"Sucesso",s:[...pre,["db","Banco devolve as notas do aluno.","ok"],["back","Backend monta a resposta em JSON.","ok"],["api","API responde 200 OK.","ok"],["browser","Tela atualizada com as notas.","ok"]],r:["ok","Requisição concluída com sucesso."]},
    auth:{l:"Erro: token inválido",s:[pre[0],["api","API rejeita o token: 401 Unauthorized.","err"],["browser","Usuário é levado de volta ao login.","warn"]],r:["err","Bloqueada na API, antes de chegar ao backend. É a segurança funcionando."]},
    db:{l:"Erro: banco indisponível",s:[...pre,["db","Banco não responde dentro do tempo limite.","err"],["qa","Monitoramento detecta a falha e dispara um alerta.","warn"],["back","Backend registra o erro e devolve 503.","warn"],["api","API repassa o 503 Service Unavailable.","warn"],["browser","Tela mostra uma mensagem amigável, sem expor detalhes técnicos.","warn"]],r:["err","Falha controlada: o usuário é avisado e a equipe é alertada."]},
    ext:{l:"Serviço externo lento",s:[...pre,["ext","Serviço de e-mail demora além do limite (timeout).","err"],["back","Backend coloca o envio em uma fila para tentar de novo.","warn"],["api","API responde 202 Accepted.","warn"],["browser","Tela informa que o e-mail será enviado em instantes.","warn"]],r:["warn","Funcionou em parte: a falha externa não derrubou o sistema."]}
  };
  const edge = (a,b,d) => `<line class="e${d?" d":""}" x1="${d?cx(a):C[a].x+W}" y1="${d?C[a].y:cy(a)}" x2="${d?cx(b):C[b].x}" y2="${d?C[b].y+H:cy(b)}"/>`;
  const edges = edge("browser","api")+edge("api","back")+edge("back","db")+`<line class="e" x1="${cx("back")}" y1="${C.back.y+H}" x2="${cx("ext")}" y2="${C.ext.y}"/>`+edge("qa","api",1);
  const nodes = Object.keys(C).map(k => `<g class="n" data-k="${k}" tabindex="0" role="button" aria-label="${C[k].n}"><rect x="${C[k].x}" y="${C[k].y}" width="${W}" height="${H}" rx="14"/><text x="${cx(k)}" y="${C[k].y+28}">${C[k].n}</text><text class="s" x="${cx(k)}" y="${C[k].y+48}">${C[k].s}</text></g>`).join("");
  const chips = Object.keys(C).map(k => `<button class="chip" type="button" data-k="${k}" aria-pressed="false">${C[k].n}</button>`).join("");
  const opts = Object.keys(S).map(k => `<option value="${k}">${S[k].l}</option>`).join("");
  root.innerHTML = `<div class="lab"><div class="card card--static lab__stage"><div class="lab__scroll"><svg viewBox="-6 100 772 250" role="group" aria-label="Diagrama da arquitetura. Selecione um componente."><defs></defs>${edges}${nodes}<g class="dg" id="dg" style="opacity:0"><circle class="dot" r="9"/></g></svg></div><p class="lab__hint">Arraste o diagrama para o lado ou escolha um componente nos botões abaixo.</p><div class="chips" role="group" aria-label="Selecionar componente">${chips}</div><div class="sim"><label>Cenário<select id="sc">${opts}</select></label><button class="btn btn--primary" id="go" type="button">Simular requisição</button></div><ol class="log" id="log" aria-live="polite"></ol><div id="res" aria-live="polite"></div><p class="lab__note">Simulação didática: nenhuma chamada real é feita a servidores.</p></div><aside class="card card--static lab__panel" id="panel" aria-live="polite"></aside></div>`;
  const $ = id => root.querySelector("#" + id), g = k => root.querySelector(`.n[data-k="${k}"]`);
  const li = a => a.map(x => `<li>${x}</li>`).join("");
  const show = k => {
    root.querySelectorAll(".n").forEach(n => n.classList.toggle("is-sel", n.dataset.k === k));
    root.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.k === k));
    const c = C[k]; $("panel").innerHTML = `<span class="eyebrow">Componente</span><h3>${c.n}</h3><p>${c.f}</p><h4>Exemplos</h4><ul>${li(c.e)}</ul><h4>Possíveis falhas</h4><ul>${li(c.r)}</ul>`;
  };
  root.addEventListener("click", e => { const t = e.target.closest("[data-k]"); if (t) show(t.dataset.k); });
  root.addEventListener("keydown", e => { const t = e.target.closest(".n"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(t.dataset.k); } });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const move = k => { const d = $("dg"); d.style.opacity = 1; d.style.transform = `translate(${cx(k)}px,${cy(k)}px)`; };
  let run = 0;
  $("go").addEventListener("click", async () => {
    const id = ++run, sc = S[$("sc").value], d = matchMedia("(prefers-reduced-motion: reduce)").matches ? 350 : 850;
    root.querySelectorAll(".n").forEach(n => n.classList.remove("is-active","is-ok","is-warn","is-err"));
    $("log").innerHTML = ""; $("res").innerHTML = ""; $("go").disabled = $("sc").disabled = true;
    $("dg").style.transition = "none"; move("browser"); void $("dg").getBoundingClientRect(); $("dg").style.transition = "";
    for (const [k, msg, st] of sc.s) {
      if (id !== run) return;
      root.querySelectorAll(".n").forEach(n => n.classList.remove("is-active"));
      move(k); const n = g(k); n.classList.add("is-active");
      $("log").insertAdjacentHTML("beforeend", `<li class="${st}">${msg}</li>`);
      await wait(d);
      n.classList.remove("is-active","is-ok","is-warn","is-err"); n.classList.add("is-" + st);
    }
    $("dg").style.opacity = 0;
    $("res").innerHTML = `<div class="result ${sc.r[0]}" role="status">${sc.r[1]}</div>`;
    $("go").disabled = $("sc").disabled = false;
  });
  show("api");
})();
