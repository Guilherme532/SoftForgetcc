/* SoftForge — simulador didático de decisões de projeto */
(() => {
  const form = document.getElementById("sim-form");
  const result = document.getElementById("sim-result");
  if (!form || !result) return;
  const score = {
    prazo: {rapido:{prazo:18,custo:8,qualidade:-12,risco:16,label:"Lançar logo"},equilibrado:{prazo:5,custo:2,qualidade:8,risco:-5,label:"Negociar escopo"},seguro:{prazo:-12,custo:-8,qualidade:14,risco:-10,label:"Adiar o lançamento"}},
    qualidade: {baixo:{prazo:8,custo:5,qualidade:-20,risco:18,label:"Testar só no final"},medio:{prazo:0,custo:0,qualidade:8,risco:-5,label:"Testar funções críticas"},alto:{prazo:-5,custo:-4,qualidade:18,risco:-12,label:"Testes contínuos"}},
    seguranca: {baixo:{prazo:4,custo:5,qualidade:-8,risco:22,label:"Deixar para depois"},medio:{prazo:0,custo:0,qualidade:6,risco:-8,label:"Proteções essenciais"},alto:{prazo:-4,custo:-5,qualidade:10,risco:-16,label:"Segurança desde o início"}},
    escopo: {aceitar:{prazo:-10,custo:-12,qualidade:-5,risco:12,label:"Aceitar imediatamente"},avaliar:{prazo:0,custo:0,qualidade:5,risco:-5,label:"Avaliar impacto"},backlog:{prazo:5,custo:4,qualidade:3,risco:-8,label:"Próxima versão"}}
  };
  const clamp = n => Math.max(5, Math.min(95, n));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(form);
    const missing = ["prazo","qualidade","seguranca","escopo"].filter(k => !data.get(k));
    if (missing.length) { form.querySelector(`[name="${missing[0]}"]`).focus(); return; }
    let prazo=62, custo=58, qualidade=60, risco=48;
    const choices=[];
    for (const key of ["prazo","qualidade","seguranca","escopo"]) {
      const item=score[key][data.get(key)]; choices.push(item.label);
      prazo += item.prazo; custo += item.custo; qualidade += item.qualidade; risco += item.risco;
    }
    prazo=clamp(prazo); custo=clamp(custo); qualidade=clamp(qualidade); risco=clamp(risco);
    const outcome = qualidade >= 70 && risco <= 45 ? ["Projeto mais sustentável","As escolhas favorecem qualidade e prevenção de riscos. O custo é investir mais planejamento e validação antes da entrega."] : risco >= 65 || qualidade < 45 ? ["Entrega com riscos elevados","As escolhas priorizam velocidade ou economia imediata, mas aumentam a chance de falhas e retrabalho. Reavalie testes e segurança."] : ["Equilíbrio com pontos de atenção","O plano pode funcionar, mas precisa acompanhar indicadores e ajustar prioridades conforme os riscos aparecem."];
    const metric=(label,value,inverse=false)=>`<div class="sim-metric"><div><span>${label}</span><strong>${value}/100</strong></div><div class="sim-meter"><span style="width:${value}%;"></span></div></div>`;
    result.innerHTML=`<span class="eyebrow">Resultado da simulação</span><h2>${outcome[0]}</h2><p>${outcome[1]}</p><div class="sim-metrics">${metric("Prazo preservado",prazo)}${metric("Controle de custo",custo)}${metric("Qualidade",qualidade)}${metric("Risco",risco)}</div><h3>Decisões tomadas</h3><ul class="sim-decisions">${choices.map(x=>`<li>${x}</li>`).join("")}</ul><p class="sim-disclaimer">Indicadores ilustrativos gerados por regras didáticas. Em projetos reais, métricas dependem de contexto, equipe, requisitos e evidências.</p>`;
    result.hidden=false; result.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  });
  form.addEventListener("reset",()=>{result.hidden=true; result.innerHTML="";});
})();