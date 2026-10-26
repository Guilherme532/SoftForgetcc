/* SoftForge — js/processo.js: explorador das etapas do ciclo de vida */
(() => {
  const el = document.getElementById("stages"); if (!el) return;
  const S = [
    ["Requisitos","Descobrir quem usa o sistema, o que ele precisa fazer e com quais restrições.",["Requisitos funcionais e não funcionais","Histórias de usuário","Regras de negócio"],"Começar a programar sem entender o problema.","Só a secretaria lança notas e cada aluno vê apenas as suas."],
    ["Arquitetura","Decidir como as partes do sistema se organizam e conversam entre si.",["Diagrama de componentes","Escolha de tecnologias","Modelo de dados"],"Escolher uma arquitetura complexa para um sistema pequeno só porque está na moda.","Front-end, API, back-end e um banco de dados relacional."],
    ["Desenvolvimento","Transformar o projeto em código, em equipe e com histórico de mudanças.",["Código versionado no Git","Revisão por pull request","Padrões de código"],"Trabalhar tudo na mesma branch, sem revisão.","A rota GET /alunos devolve a lista de alunos em JSON."],
    ["Testes","Encontrar erros antes do usuário, de forma repetível e automática.",["Testes unitários e de integração","Relatório de cobertura","Casos de teste de segurança"],"Testar só o caminho feliz.","Um teste confirma que um aluno comum não acessa a área administrativa."],
    ["Segurança","Proteger dados e acessos desde o início, e não só no fim.",["Autenticação e autorização","Validação de entradas","Política de senhas e registro de acessos"],"Deixar a segurança para a última semana do projeto.","Consultas parametrizadas evitam SQL Injection no login."],
    ["Deploy e CI/CD","Automatizar build, testes e entrega para que lançar seja rotina, e não risco.",["Pipeline automatizado","Ambientes de teste e de produção","Plano de reversão (rollback)"],"Fazer deploy manual sem rodar os testes.","Se um teste falha, o deploy é bloqueado automaticamente."],
    ["Monitoramento","Acompanhar o sistema no ar: o que acontece, quão rápido e quando falha.",["Logs","Métricas de desempenho e disponibilidade","Alertas"],"Descobrir o problema só quando o usuário reclama.","Um alerta avisa a equipe quando a API fica lenta demais."],
    ["Manutenção e evolução","Corrigir, adaptar e crescer, porque software real muda o tempo todo.",["Correção de bugs","Novas funcionalidades","Refatoração e redução de dívida técnica"],"Acumular gambiarras até o sistema ficar frágil.","A escola cresce de 100 para 100.000 alunos e a arquitetura precisa acompanhar."]
  ];
  let i = 0;
  el.innerHTML = `<div class="stg"><div class="stg__tabs" role="tablist" aria-label="Etapas do ciclo de vida">${S.map((s,n) => `<button class="stg__tab" role="tab" type="button" id="tab-${n}" data-i="${n}" aria-controls="stp"><b>${String(n+1).padStart(2,"0")}</b>${s[0]}</button>`).join("")}</div><div class="card card--static stg__panel" id="stp" role="tabpanel" tabindex="0"></div></div>`;
  const tabs = [...el.querySelectorAll(".stg__tab")], panel = el.querySelector("#stp");
  const go = (n, focus) => {
    i = Math.max(0, Math.min(S.length - 1, n)); const s = S[i];
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute("aria-labelledby", "tab-" + i);
    panel.innerHTML = `<span class="eyebrow">Etapa ${i+1} de ${S.length}</span><h2>${s[0]}</h2><p>${s[1]}</p><h4>Entregáveis</h4><ul>${s[2].map(x => `<li>${x}</li>`).join("")}</ul><h4>Erro comum</h4><p class="mist">${s[3]}</p><h4>No projeto Campus</h4><p>${s[4]}</p><div class="stg__nav"><button class="btn btn--secondary" type="button" data-d="-1"${i === 0 ? " disabled" : ""}>Anterior</button><button class="btn btn--primary" type="button" data-d="1"${i === S.length - 1 ? " disabled" : ""}>Próxima</button></div>`;
    if (focus) tabs[i].focus();
  };
  el.addEventListener("click", e => { const t = e.target.closest("[data-i]"), d = e.target.closest("[data-d]"); if (t) go(+t.dataset.i); if (d) go(i + +d.dataset.d); });
  el.addEventListener("keydown", e => { if (!e.target.closest(".stg__tab")) return; const k = {ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key]; if (k) { e.preventDefault(); go(i + k, true); } });
  go(0);
})();
