/* SoftForge — js/main.js: cabeçalho interativo, busca, rodapé e menu móvel.
   Cada página define <body data-root="" | "../" data-page="chave">. */
(() => {
  const HASH = !!window.SF_HASH; // true só na demonstração de arquivo único
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page || "inicio";
  const P = {inicio:["Início","index.html"],processo:["Processo","pages/processo.html"],sistema:["Sistema","pages/sistema.html"],laboratorio:["Laboratório","pages/laboratorio.html"],simulador:["Simulador","pages/simulador.html"],futuro:["Futuro","pages/futuro.html"],sobre:["Quem sou eu","pages/sobre.html"]};
  const url = k => HASH ? "#/" + (k === "inicio" ? "" : k) : root + P[k][1];
  const NAV = ["inicio","processo","sistema","laboratorio","simulador","futuro","sobre"];
  const links = NAV.map(k => `<a class="nav__link" data-k="${k}" href="${url(k)}"${k===page?' aria-current="page"':""}>${P[k][0]}</a>`).join("");
  const IDX = Object.keys(P).map(k => ({t:P[k][0], d:"Página", k})).concat("Requisitos|Levantar o que o sistema deve fazer|processo;Ciclo de vida|As oito etapas do software|processo;Testes|Encontrar erros antes do usuário|processo;Segurança|Autenticação, autorização e proteção de dados|processo;CI/CD|Build, testes e deploy automatizados|processo;Monitoramento|Logs, métricas e alertas|processo;Manutenção|Corrigir e evoluir o software|processo;Arquitetura|Como as partes do sistema se organizam|sistema;Frontend|A interface que o usuário vê|laboratorio;API|A porta de entrada do sistema|laboratorio;Backend|Regras de negócio|laboratorio;Banco de dados|Onde os dados ficam guardados|laboratorio;Simular requisição|Veja um pedido percorrer o sistema|laboratorio;Inteligência artificial|IA no desenvolvimento|futuro;Agentes|Automação com supervisão humana|futuro".split(";").map(s => { const [t,d,k] = s.split("|"); return {t,d,k}; }));
  const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const head = document.getElementById("site-header");
  if (head) head.outerHTML = `<header class="site-header"><div class="container site-header__inner"><a class="brand" href="${url("inicio")}" aria-label="SoftForge, página inicial">Soft<span class="text-gradient">Forge</span></a><nav class="nav" id="menu" aria-label="Principal">${links}</nav><div class="header-tools"><button class="search-btn" type="button" aria-haspopup="dialog">${ICON}<span>Buscar</span></button><button class="present-btn" type="button" aria-pressed="false">Apresentar</button><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu"><span></span><span></span><span></span></button></div></div><div class="scroll-progress" aria-hidden="true"></div></header>`;
  const foot = document.getElementById("site-footer");
  if (foot) foot.outerHTML = `<footer class="site-footer"><div class="container"><div class="site-footer__grid"><div><a class="brand" href="${url("inicio")}">Soft<span class="text-gradient">Forge</span></a><p>Um projeto educativo sobre Engenharia de Software: do problema ao sistema.</p><p class="site-footer__credit">Criado por <strong>Guilherme Eduardo Oliveira</strong> · <a class="site-footer__ig" href="https://www.instagram.com/s2.gui_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Guilherme Eduardo Oliveira (abre em nova aba)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>@s2.gui_</a></p></div><nav class="footer-links" aria-label="Rodapé">${Object.keys(P).map(k => `<a href="${url(k)}">${P[k][0]}</a>`).join("")}</nav></div><div class="site-footer__copy"><span>© 2026 Guilherme Eduardo Oliveira. Todos os direitos reservados.</span><span>Site para fins educativos · Muito Além do Código</span></div></div></footer>`;

  /* Modo de apresentação: navegação por seções na página atual */
  const presentBtn = document.querySelector(".present-btn");
  let presentIndex = 0, presentSections = [];
  const stopPresentation = async () => {
    document.body.classList.remove("presentation-mode");
    presentBtn?.setAttribute("aria-pressed", "false");
    document.querySelector(".presentation-controls")?.remove();
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
  };
  const goToSlide = index => {
    if (!presentSections.length) return;
    presentIndex = Math.max(0, Math.min(index, presentSections.length - 1));
    presentSections[presentIndex].scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
    const counter = document.querySelector(".presentation-counter");
    if (counter) counter.textContent = `${presentIndex + 1} / ${presentSections.length}`;
  };
  const startPresentation = async () => {
    presentSections = [...document.querySelectorAll("main > section")];
    if (!presentSections.length) return;
    presentIndex = 0;
    document.body.classList.add("presentation-mode");
    presentBtn?.setAttribute("aria-pressed", "true");
    const controls = document.createElement("div");
    controls.className = "presentation-controls";
    controls.innerHTML = '<button type="button" data-slide="prev" aria-label="Seção anterior">← Anterior</button><span class="presentation-counter" aria-live="polite">1 / 1</span><button type="button" data-slide="next" aria-label="Próxima seção">Próxima →</button><button type="button" data-slide="exit">Sair ✕</button>';
    document.body.appendChild(controls);
    controls.addEventListener("click", e => {
      const action = e.target.closest("[data-slide]")?.dataset.slide;
      if (action === "prev") goToSlide(presentIndex - 1);
      if (action === "next") goToSlide(presentIndex + 1);
      if (action === "exit") stopPresentation();
    });
    const counter=controls.querySelector(".presentation-counter");
    counter.textContent=`1 / ${presentSections.length}`;
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch {}
    goToSlide(0);
  };
  presentBtn?.addEventListener("click", () => document.body.classList.contains("presentation-mode") ? stopPresentation() : startPresentation());
  document.addEventListener("keydown", e => {
    if (!document.body.classList.contains("presentation-mode")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goToSlide(presentIndex + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goToSlide(presentIndex - 1); }
    if (e.key === "Escape") stopPresentation();
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && document.body.classList.contains("presentation-mode")) {
      document.body.classList.remove("presentation-mode");
      presentBtn?.setAttribute("aria-pressed", "false");
      document.querySelector(".presentation-controls")?.remove();
    }
  });

  /* Menu móvel */
  const btn = document.querySelector(".nav-toggle"), nav = document.getElementById("menu");
  const set = o => { if (!nav || !btn) return; nav.classList.toggle("is-open", o); btn.setAttribute("aria-expanded", o); btn.setAttribute("aria-label", o ? "Fechar menu" : "Abrir menu"); };
  if (btn && nav) {
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("is-open")) { set(false); btn.focus(); } });
    matchMedia("(min-width: 981px)").addEventListener("change", () => set(false));
  }

  /* Progresso de leitura e estado do cabeçalho */
  const hd = document.querySelector(".site-header"), bar = hd.querySelector(".scroll-progress");
  let tick = false;
  const upd = () => { tick = false; const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(scrollY / m, 1) : 0})`; hd.classList.toggle("is-scrolled", scrollY > 8); };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, {passive: true});
  addEventListener("hashchange", upd); upd();

  /* Busca (botão, sem atalhos de teclado globais) */
  const dlg = document.createElement("dialog");
  dlg.className = "search"; dlg.setAttribute("aria-label", "Buscar no site");
  dlg.innerHTML = '<div class="search__bar"><input id="sf-q" type="search" placeholder="Buscar conceitos e páginas" autocomplete="off" aria-label="Buscar"><button class="search__close" type="button" aria-label="Fechar busca">Esc</button></div><ul class="search__list" id="sf-res"></ul>';
  document.body.appendChild(dlg);
  const q = dlg.querySelector("#sf-q"), res = dlg.querySelector("#sf-res");
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const render = () => {
    const t = norm(q.value.trim());
    const hits = (t ? IDX.filter(i => norm(i.t + " " + i.d).includes(t)) : IDX.filter(i => i.d === "Página")).slice(0, 8);
    res.innerHTML = hits.length ? hits.map(i => `<li><a href="${url(i.k)}"><span>${i.t}</span><small>${i.d === "Página" ? "Página" : i.d + " · " + P[i.k][0]}</small></a></li>`).join("") : '<li class="search__empty">Nenhum resultado. Tente “API”, “testes” ou “segurança”.</li>';
  };
  hd.querySelector(".search-btn").addEventListener("click", () => { dlg.showModal(); q.value = ""; render(); q.focus(); });
  dlg.querySelector(".search__close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("a")) dlg.close(); });
  q.addEventListener("input", render);
  dlg.addEventListener("keydown", e => {
    const a = [...res.querySelectorAll("a")], i = a.indexOf(document.activeElement);
    if (e.key === "Enter" && document.activeElement === q && a[0]) a[0].click();
    if (e.key === "ArrowDown") { e.preventDefault(); (a[i + 1] || a[0])?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); i <= 0 ? q.focus() : a[i - 1].focus(); }
  });
})();
