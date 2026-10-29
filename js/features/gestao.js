/* Custos e Execução: Hoje da obra, Orçamento, Medições, Diário (RDO), Equipe e o assistente de nova obra.
   Redefine tabHoje, tabOverview, tabEquipe e openWizard do core; registra as telas 'diario' e 'medicoes'.
   O Cronograma (tabPrazos) fica no core.js e usa os ajudantes do plano daqui (gPlano*). */

ICONS.book ||= '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>';
ICONS.receipt ||= '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>';
ICONS.sun ||= '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
ICONS.rain ||= '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>';
ICONS.printer ||= '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>';
ICONS.mic ||= '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>';
ICONS.shield ||= '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>';
ICONS.pause ||= '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>';

TABS.push(['diario','book','Diário'],['medicoes','receipt','Medições']);
TAB_FNS.diario = o => tabDiario(o);
TAB_FNS.medicoes = o => tabMedicoes(o);

addCSS(`
.g-src{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-meta);color:var(--muted);white-space:nowrap}
.g-src .ic{color:var(--muted)}
.g-conf{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;border-radius:99px;padding:1px 9px;line-height:1.65;white-space:nowrap}
.g-conf::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.g-conf.alta{background:var(--greenSoft);color:var(--greenInk)} .g-conf.media{background:var(--amberSoft);color:var(--amberInk)} .g-conf.baixa{background:var(--redSoft);color:var(--redInk)}
.g-h2{font:600 var(--t-sec)/1.3 var(--serif);letter-spacing:-.01em;margin:0}
.g-head{display:flex;align-items:center;gap:var(--s2);margin:0 0 var(--s3)}
.g-head .sp{flex:1}
.g-resp{max-width:62ch;text-wrap:pretty;margin:0 0 var(--s3);line-height:1.55}
.g-kpis{margin:var(--s5) 0 0}
.g-kpis .kpi .v{white-space:nowrap;font-size:clamp(20px,2vw,28px)}
.g-proj{display:inline-block;font:600 12px var(--sans);color:var(--amberInk);background:var(--amberSoft);border-radius:99px;padding:0 8px;margin-left:6px;vertical-align:1px}
.g-nota{font-size:var(--t-meta);color:var(--muted);max-width:62ch;margin:var(--s3) 0 0;line-height:1.5}
.g-lnk{border:0;background:none;padding:0;font:inherit;font-weight:600;color:var(--accentInk);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.g-card-h{padding:16px 20px 12px;display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap}
.g-card-h h3{margin:0}
.g-rodape{padding:12px 20px 16px;border-top:1px solid var(--line2);font-size:var(--t-meta);color:var(--muted);line-height:1.55}
.g-rodape p{margin:6px 0 0;max-width:62ch}
.g-rodape b{color:var(--ink2)}
.g-et b{font-weight:500;color:var(--ink)}
.g-sub{display:block;color:var(--muted)}
/* Orçamento: a decisão primeiro */
.g-econs{border-top:1px solid var(--pineLine);margin-top:var(--s2)}
.g-econ{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--s3);align-items:start;padding:10px 0;border-bottom:1px solid var(--pineLine);cursor:pointer}
.g-econ input{margin:4px 0 0;width:16px;height:16px;accent-color:var(--accentInk)}
.g-econ b{font-weight:500}
.g-econ .mut{display:block;font-size:var(--t-meta);max-width:62ch}
.g-econ-v{font-weight:600;color:var(--greenInk);white-space:nowrap}
.g-econ.ap b{color:var(--muted)}
.g-aplicar{display:flex;align-items:center;gap:var(--s3);flex-wrap:wrap;margin-top:var(--s4)}
.g-delta{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end}
.g-delta i{display:inline-block;height:6px;border-radius:99px;background:var(--amber);opacity:.7}
.g-delta.menos i{background:var(--green)}
/* Medições */
.g-alerta{display:flex;gap:var(--s4);align-items:center;flex-wrap:wrap}
.g-alerta > div{flex:1;min-width:280px}
.g-alerta h3{margin-bottom:6px}
.g-alerta .g-resp{margin:0;font-size:var(--t-meta)}
.g-bars{width:120px}
.g-bars .bar{height:5px;margin-bottom:4px}
.g-bars span{display:block;font-size:var(--t-meta);color:var(--muted);white-space:nowrap}
.g-med td{vertical-align:middle}
.g-med .g-chev{color:var(--muted);margin-left:6px;vertical-align:-3px}
.g-med tr.click:focus-visible td{background:var(--accentSoft);outline:0}
/* Diário */
.g-days{display:flex;flex-direction:column;gap:2px}
.g-day{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:var(--t-meta);border:0;background:none;text-align:left;color:var(--ink);width:100%}
.g-day.on{background:var(--accentSoft);font-weight:600}
.g-day b{font-variant-numeric:tabular-nums}
.g-day .ok{color:var(--muted);display:flex}
@media (hover:hover){ .g-day:not(.on):hover{background:var(--sunk)} }
.g-rev{background:var(--amberSoft);border-radius:8px;padding:12px 16px;margin:0 0 var(--s4);font-size:var(--t-meta);line-height:1.55}
.g-rev p{margin:4px 0 10px;max-width:62ch}
.g-rev b{color:var(--amberInk)}
h3.g-sec{font:600 var(--t-meta)/1.3 var(--sans);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:24px 0 8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
h3.g-sec .g-src{text-transform:none;letter-spacing:0;font-weight:400}
.g-li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line2);font-size:var(--t-body)}
.g-li:last-child{border-bottom:0} .g-li > .ic{margin-top:3px;color:var(--muted);flex:none}
.g-clima{display:grid;grid-template-columns:1fr 1fr;gap:var(--s4)}
.g-clima > div{display:flex;gap:10px;align-items:flex-start}
.g-fotos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s3)}
.g-foto .img{height:96px;border-radius:8px;display:grid;place-items:center;color:rgba(255,255,255,.85)}
.g-foto .cap{padding-top:6px;font-size:var(--t-meta);line-height:1.4}
/* Equipe */
.g-bloq td{background:var(--redSoft)}
.g-bloq .pill{margin-top:4px}
/* Assistente de nova obra */
.g-wz-passos{display:flex;gap:6px;list-style:none;padding:0;margin:4px 0 20px;font-size:var(--t-meta);flex-wrap:wrap}
.g-wz-passos li{display:flex;align-items:center;color:var(--muted)}
.g-wz-passos li + li::before{content:"";width:16px;height:1px;background:var(--line);margin-right:6px}
.g-wz-passos li.on{color:var(--ink);font-weight:600}
.g-wz-passos button{display:inline-flex;align-items:center;gap:4px;border:0;background:none;padding:2px 0;font:inherit;color:var(--accentInk);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.g-path{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px}
.g-path label{border:1px solid var(--line);border-radius:10px;padding:12px 14px;cursor:pointer;font-size:var(--t-meta);line-height:1.45;display:flex;flex-direction:column;gap:6px;position:relative}
.g-path label.on{border-color:var(--accent);background:var(--accentSoft)}
.g-path label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
.g-path input{position:absolute;opacity:0;pointer-events:none}
.g-path b{font-size:var(--t-body)}
@media (hover:hover){ .g-path label:not(.on):hover{background:var(--sunk)} }
.g-resumo{display:grid;grid-template-columns:150px minmax(0,1fr);gap:8px 16px;margin:0;font-size:var(--t-body)}
.g-resumo dt{color:var(--muted);font-size:var(--t-meta);padding-top:2px}
.g-resumo dd{margin:0}
/* Cronograma (tabPrazos, core.js) */
.g-eixo{position:relative;height:22px;font-size:var(--t-meta);color:var(--muted)}
.g-eixo span{position:absolute;top:0;padding-left:4px;border-left:1px solid var(--line);line-height:22px;white-space:nowrap}
.g-eixo .g-hj{border-left:2px solid var(--ink);color:var(--ink);font-weight:600;top:0;z-index:1;background:var(--card);padding:0 4px}
.gantt .gb.plan{background:none;border:1.5px solid #8d9894}
.gantt .g-hoje-l{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--ink)}
.g-causa{display:grid;grid-template-columns:110px minmax(0,1fr) 140px 70px auto;gap:var(--s3);align-items:center;padding:10px 0;border-top:1px solid var(--line2);font-size:var(--t-meta)}
.g-causa:first-of-type{border-top:0}
.g-causa .bar i{background:var(--ink2)}
/* Documento (PDF do RDO) */
.g-doc{font:13px/1.5 var(--sans);color:#111}
.g-doc .tit{font:700 20px var(--serif);margin:0}
.g-doc table td,.g-doc table th{padding:5px 8px;font-size:12px;background:none;border-bottom:1px solid #ddd}
.g-doc .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
.g-doc h4{font:600 12px var(--sans);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 4px;color:#444}
.g-doc .ass{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px;text-align:center;font-size:12px}
.g-doc .ass div{border-top:1px solid #111;padding-top:5px}
.g-doc .fts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.g-doc .fts div{height:70px;border-radius:4px;display:flex;align-items:flex-end;padding:4px 6px;color:#fff;font-size:12px}
.g-doc .rod{margin-top:18px;font-size:12px;color:#555}
@media (max-width:1180px){ .g-fotos{grid-template-columns:repeat(2,minmax(0,1fr))} .g-causa{grid-template-columns:96px minmax(0,1fr) 80px 64px auto} }
@media print{
  body.g-print .app,body.g-print .toast,body.g-print .drawer,body.g-print .g-noprint,body.g-print .dlg-x{display:none!important}
  body.g-print .modal{position:static;display:block;background:none}
  body.g-print .modal .box{width:auto!important;max-width:none;max-height:none;border:0;box-shadow:none;padding:0;overflow:visible}
}`);

/* Modais largos (documento, medição) voltam à largura padrão ao fechar, para não afetar os modais dos outros. */
new MutationObserver(()=>{ if(!$('modal').classList.contains('on')) $('modalBox').style.width=''; }).observe($('modal'),{attributes:true,attributeFilter:['class']});

const gSrc = (t, ic='mic') => `<span class="g-src">${icon(ic,13)}${t}</span>`;
const gHora = () => new Date().toTimeString().slice(0,5);
const gConf = c => `<span class="g-conf ${c==='média'?'media':c}">${c}</span>`;
const gPct = (a,b) => Math.round(a/b*100);
function gRerender(){ const m=$('main'), y=m.scrollTop; render(); m.scrollTop=y; }
const gEmBreve = o => `<div class="card row">${icon('info',16)}<span>Disponível depois do orçamento. O ${o.nome} ainda está sendo orçado no chat.</span><span class="sp"></span><a class="link" href="#" onclick="go('obra','${o.id}','chat');return false">Abrir chat ${icon('arrowRight',14)}</a></div>`;

/* ===================== HOJE: o que pede você nesta obra ===================== */
/* Lê as propostas do agente (PROPOSTAS, proativo.js) e aprova com aprovarProp: a lógica de aprovar e desfazer é a de lá.
   Aqui só se acrescenta, por proposta, a ordem de urgência, o prazo, a conta curta e o nome da ação pela consequência. */
const G_HOJE = {
  aco:        {ord:1,  prazo:'hoje',        tom:'perda', acao:'Pedir 600 kg',              valor:5040,  conta:()=>`Gerdau ${docRef('PED-0158')} 9 dias atrasada; o saldo de 140 kg dá até 30/10`},
  bloco:      {ord:3,  prazo:'até 30/10',   tom:'perda', acao:'Exigir palete',             valor:'≈ R$ 1.460', conta:()=>`Quebra de 15% no ${docRef('PED-0149')}, sem palete; o ${docRef('PED-0162')} sai 31/10`},
  medicao:    {ord:4,  prazo:'próx. medição',   tom:'pede',  acao:'Segurar R$ 7.540',          valor:7540,  conta:()=>'Estrutura: pago 75%, executado 62%; retém na próxima medição'},
  areia:      {ord:5,  prazo:'até 31/10',   tom:'pede',  acao:'Abater R$ 472',             valor:472,   conta:()=>`A NF diz 40 m³; a Joana mediu 36 m³ na caçamba · ${docRef('PED-0157')}`},
  cimento:    {ord:6,  prazo:'esta semana', tom:'pede',  acao:'Trazer 20 sc e comprar 14', valor:1227,  conta:()=>'Falta 34 sc; os 26 sc da Loja Centro vencem em 25 dias'},
  concreto:   {ord:7,  prazo:'até 03/11',   tom:'pede',  acao:'Remarcar para sex 06/11',                conta:()=>'80% de chuva na qui 05/11; a Concrecamp tem vaga na sexta, mesmo preço'},
  telhas:     {ord:8,  prazo:'até 05/11',   tom:'pede',  acao:'Aprovar R$ 9.165',          valor:9165,  conta:()=>`${docRef('PED-0163')} parado; frete de 10 dias e a cotação vence 05/11`},
  armadores:  {ord:9,  prazo:'esta semana', tom:'pede',  acao:'Contratar 2 armadores',                  conta:()=>'Vaga aberta desde 01/10 na Equipe Silva; recupera ~5 dias'},
  porcelanato:{ord:20, prazo:'até 09/12',   tom:'info',  acao:'Guardar 18 m²',                          conta:()=>'Sobra do mesmo lote; fica para reposição na garantia'},
};
/* Pendências das outras abas (pendSuprimentos/pendCustos/pendExecucao do core) entram na mesma lista, na ordem de urgência. */
const G_PEND = {
  doc:    {ord:0,   prazo:'hoje',        tom:'perda', acao:'Ver na Equipe',   conta:'Bloqueio: não pode trabalhar até regularizar'},
  nf:     {ord:2,   prazo:'hoje',        tom:'pede',  acao:'Conferir NF',     conta:'Confira antes de liberar o pagamento'},
  rdo:    {ord:2.5, prazo:'hoje 19h',    tom:'pede',  acao:'Revisar o RDO',   conta:'O RDO só vai ao cliente com os fatos do áudio'},
  segurar:{ord:4,   prazo:'até 31/10',   tom:'pede',  acao:'Ver medições',    conta:'Pago acima do executado, sem respaldo no contrato'},
  falta:  {ord:10,  prazo:'esta semana', tom:'pede',  acao:'Ver o que falta', conta:'Sem pedido, cotação nem transferência'},
};
/* Pendência de outra aba que a proposta já resolve não entra de novo na lista (ex.: a NF da areia é a proposta da areia). */
const G_COBRE = {areia:/PED-0157/, cimento:/^Cimento/, aco:/^Aço/, medicao:/Equipe Silva: pago/};
const gTxt = (h, n=110) => { const t=String(h||'').replace(/<[^>]+>/g,''); return t.length>n ? t.slice(0,n-1).replace(/\s\S*$/,'')+'…' : t; };
const gProps = oid => typeof PROPOSTAS!=='undefined' ? PROPOSTAS.filter(p=>p.obra===oid && (p.st==='pendente'||p.st==='aprovada')) : [];
/* Desfazer no lugar: acha a entrada do registro que o aprovarProp gravou e usa o desfazerLog do proativo.js. */
function gDesfazerProp(id){
  const p=prop(id); if(!p) return;
  const i=LOG.findIndex(e=>e.desfazer && !e.desfeito && e.texto.startsWith(p.registro));
  if(i>=0) desfazerLog(i);
}
function gLinhaProp(p, foco){
  const h=G_HOJE[p.id]||{}, feito=p.st==='aprovada';
  return linhaDecisao({prazo:h.prazo||'', tom:h.tom||({bad:'perda',warn:'pede'}[p.tom]||'info'), titulo:p.tit, conta:h.conta?h.conta():gTxt(p.det), valor:h.valor,
    acao:{label:h.acao||'Aprovar', onclick:`aprovarProp('${p.id}',this)`}, sec:[{label:'Ajustar', onclick:`prop('${p.id}').ajustar()`}],
    estado: feito ? {feito:'Aprovado', hora:p.quando, quem:'Rizzi', desfazer:`gDesfazerProp('${p.id}')`} : 'pendente', foco, doc:'prop-'+p.id});
}
function gLinhaPend(o, x, foco){
  const h=G_PEND[x.tipo]||{tom:'pede', acao:'Abrir', conta:''}, g=grupoDe(x.tela), tela=g&&g.telas.find(t=>t[0]===x.tela);
  return linhaDecisao({prazo:h.prazo||'', tom:h.tom, titulo:x.txt[0].toUpperCase()+x.txt.slice(1), conta:`${h.conta}${g?` · ${g.label} › ${tela[1]}`:''}`,
    acao:{label:h.acao, onclick:`go('obra','${o.id}','${x.tela}')`}, foco});
}
tabHoje = function(o){
  if(o.status==='plan') return gHojeOrcando(o);
  const props=gProps(o.id), cobreMed=props.some(p=>p.id==='medicao');
  const cobre=props.map(p=>G_COBRE[p.id]).filter(Boolean);
  const outras=GRUPOS.filter(g=>g.k!=='hoje').flatMap(g=>g.pend(o)).filter(x=>!(x.tipo==='segurar' && cobreMed) && !cobre.some(r=>r.test(x.txt)));
  const itens=[...props.map(p=>({ord:(G_HOJE[p.id]||{}).ord??15, feito:p.st==='aprovada', html:f=>gLinhaProp(p,f)})),
               ...outras.map(x=>({ord:(G_PEND[x.tipo]||{}).ord??12, html:f=>gLinhaPend(o,x,f)}))].sort((a,b)=>a.ord-b.ord);
  const iFoco=itens.findIndex(i=>!i.feito), n=itens.filter(i=>!i.feito).length;
  const lista = itens.length ? itens.map((i,k)=>i.html(k===iFoco))
    : [linhaDecisao({prazo:'em dia', tom:'ok', titulo:'Nada pede você nesta obra agora', conta:'O agente avisa aqui quando algo precisar do seu OK.'})];
  const diff=o.previsto-o.budget;
  return `<div class="g-head"><h2 class="g-h2">O que pede você${n?` · ${n}`:''}</h2><span class="sp"></span>
      <a class="link" href="#aprovacoes" onclick="go('aprovacoes');return false">Aprovações de todas as obras ${icon('arrowRight',13)}</a></div>
    ${listaDecisoes(lista)}
    <div class="grid g2 g-kpis">
      ${kpi({rotulo:'Entrega prevista', valor:o.previsao, contexto:`${prazoTxt(o)} · contrato ${o.prazo}`, tom:o.atraso>0?'perda':'ok'})}
      ${kpi({rotulo:'Custo projetado', valor:brl(o.previsto), contexto:`${diff>0?'+':'−'}${brl(Math.abs(diff))} sobre a verba de ${brl(o.budget)}`, tom:diff>0?'pede':'ok'})}
    </div>`;
};

/* Obra em orçamento (Galpão, ou a criada no assistente): as perguntas do agente e os números do orçamento. */
const G_ORCANDO = {
  galpao:{perguntas:[['Piso de 5 t/m²: fibra de aço ou tela soldada?','Muda cerca de R$ 90 mil no orçamento'],['Fechamento lateral: telha termoacústica ou simples?','Muda o conforto térmico e o preço do fechamento']],
    previa:'R$ 2,51–2,63 mi', previaCtx:'5–10% acima do alvo, com as opções mais comuns', inicio:'jan/2027', duracao:'7 meses'},
};
function gHojeOrcando(o){
  const G=G_ORCANDO[o.id]||{perguntas:[], previa:'—', previaCtx:'o agente ainda está calculando', inicio:o.inicio, duracao:''};
  const lista=G.perguntas.map((q,k)=>linhaDecisao({prazo:'para orçar', tom:'pede', titulo:q[0], conta:q[1], acao:{label:'Responder ao agente', onclick:'abrirPainel(true)'}, foco:k===0}));
  return `<div class="g-head"><h2 class="g-h2">${lista.length?`O agente espera ${lista.length} ${lista.length>1?'respostas suas':'resposta sua'}`:'O agente está montando o orçamento'}</h2></div>
    ${lista.length?listaDecisoes(lista):''}
    <p class="g-nota">Quando você aprovar o orçamento, o agente cria as etapas, os insumos, os pedidos e o cronograma, e as outras abas abrem.</p>
    <div class="grid g2 g-kpis">
      ${kpi({rotulo:'Orçamento-alvo', valor:brl(o.budget), contexto:`${o.tipo} · início ${G.inicio}${G.duracao?', '+G.duracao:''}`})}
      ${kpi({rotulo:'Prévia do agente', valor:G.previa, contexto:G.previaCtx, projecao:'estimativa'})}
    </div>`;
}

/* ===================== CRONOGRAMA: plano de ação (usado por tabPrazos, no core.js) ===================== */
/* [proposta, dias que recupera, tela onde se resolve]. As propostas armadores/telhas nascem em PROPOSTAS_PRAZO (proativo.js);
   ao aprovar daqui, entram na fila e passam pelo mesmo aprovarProp. */
const G_PLANO = [['aco',6],['armadores',5],['telhas',4]];
const gPlanoProp = id => (typeof prop==='function'&&prop(id)) || (typeof PROPOSTAS_PRAZO!=='undefined'&&PROPOSTAS_PRAZO.find(p=>p.id===id));
function gGarantirProp(id){
  if(prop(id)) return prop(id);
  const p=PROPOSTAS_PRAZO.find(x=>x.id===id); if(p){ p.st='pendente'; PROPOSTAS.push(p); } return p;
}
function gPlanoAprovar(id){ gGarantirProp(id); aprovarProp(id); }
function gPlanoAprovarTudo(){
  const ids=G_PLANO.map(x=>x[0]).filter(id=>{ const p=gGarantirProp(id); return p&&p.st==='pendente'; }); if(!ids.length) return;
  ids.forEach(id=>aprovarProp(id));
  const es=ids.map(id=>LOG.find(e=>e.desfazer&&!e.desfeito&&e.texto.startsWith(prop(id).registro)));
  toastDesfazer(`Plano aprovado: ${ids.length} ${ids.length>1?'ações':'ação'} · o atraso previsto cai para 6 dias`, ()=>es.forEach(e=>e&&!e.desfeito&&e.desfazer()));
}
function gPlanoLinhas(){
  return G_PLANO.map(([id,dias])=>{ const p=gPlanoProp(id); if(!p) return '';
    const h=G_HOJE[id]||{}, feito=p.st==='aprovada';
    return linhaDecisao({prazo:`−${dias} dias`, tom:'ok', titulo:p.tit, conta:h.conta?h.conta():gTxt(p.det), valor:h.valor,
      acao:{label:h.acao||'Aprovar', onclick:`gPlanoAprovar('${id}')`},
      estado: feito ? {feito:'Aprovado', hora:p.quando, quem:'Rizzi', desfazer:`gDesfazerProp('${id}')`} : 'pendente', doc:'prop-'+id}); });
}
const gPlanoPendentes = () => G_PLANO.filter(([id])=>{ const p=gPlanoProp(id); return p && (p.st||'pendente')==='pendente'; }).length;

/* ===================== ORÇAMENTO COM FONTE E CONFIANÇA ===================== */
/* Valores (cat/prev/real) vêm de dados(o.id).orc, a fonte única do data.js. Aqui só se acrescenta,
   por linha, de onde veio o preço e quanto dá para confiar nele. */
const ORC_FONTE = {
  'Serviços preliminares e canteiro':['NF anterior','notas pagas mar–abr/26','alta'],
  'Fundação · material':['NF anterior','etapa encerrada 30/06','alta'],
  'Fundação · empreitada (Equipe Ramos)':['contrato','encerrado e pago 100%','alta'],
  'Estrutura · concreto usinado, aço cortado e dobrado, formas':['cotação recebida','Concrecamp R$ 485/m³ · aço Gerdau em kg','alta'],
  'Estrutura · empreitada (Equipe Silva)':['contrato','preço global','alta'],
  'Alvenaria e reboco · bloco, cimento, areia':['cotação recebida','Cerâmica Itu · quebra de 15% no 1º lote','média'],
  'Alvenaria e reboco · empreitada (Equipe Silva)':['contrato','preço global','alta'],
  'Cobertura · madeira e telha':['cotação recebida','Telhas Tatuí, válida até 05/11','média'],
  'Cobertura · empreitada (Carlos A.)':['contrato','preço global','alta'],
  'Instalações elétricas e hidráulicas · material':['SINAPI SP set/26','sem cotação ainda','média'],
  'Elétrica · empreitada (Paulo R.)':['contrato','começa 04/11','alta'],
  'Hidráulica · empreitada (a contratar)':['SINAPI SP set/26','sem proposta ainda','baixa'],
  'Esquadrias e ferragens':['SINAPI SP set/26','sem quadro de esquadrias fechado','baixa'],
  'Acabamento · material':['SINAPI SP set/26','especificação do cliente pendente','baixa'],
  'Acabamento · assentamento (a contratar)':['SINAPI SP set/26','sem proposta ainda','baixa'],
  'Administração própria (mestre 50% + ajudante)':['folha própria','R$ 7.270/mês · +21 dias de atraso','alta'],
  'Demolição e retirada':['NF anterior','etapa encerrada','alta'],
  'Instalações elétricas':['NF anterior','etapa encerrada','alta'],
  'Hidráulica e ar-condicionado':['NF anterior','etapa encerrada','alta'],
  'Drywall e forro':['contrato','Gesso & Forro Lima, preço global','alta'],
  'Piso porcelanato 60×60 (material + assentamento)':['NF anterior','sobrou 18 m²','alta'],
  'Pintura':['cotação recebida','pintor por empreitada','média'],
  'Fachada e vitrine':['cotação recebida','Vidraçaria Valinhos, entrega 20/11','média'],
  'Administração própria (Ana P., mestre)':['folha própria','6 dias adiantada','alta'],
};
const gOrc = id => ((typeof dados==='function'&&dados(id).orc)||[]).map(c=>{ const f=ORC_FONTE[c.cat]||['sem fonte','confira esta linha','baixa']; return {...c, proj:c.real, fonte:f[0], det:f[1], conf:f[2]}; });
const ECON = {
  'vila-nova':[
    {id:'palete', t:'Exigir palete no PED-0162 (9.000 blocos)', d:'quebra volta de 15% para 5%: 900 blocos × R$ 1,62', v:1458, sel:true, ped:'PED-0162'},
    {id:'telha', t:'Aprovar o PED-0163 da telha direto de Tatuí esta semana', d:'3.900 × (R$ 2,98 − R$ 2,35); a cotação vence 05/11', v:2457, sel:true, ped:'PED-0163'},
    {id:'areia', t:'Abater a areia que faltou no PED-0157', d:'4 m³ × R$ 118 do boleto da Porto Jaguari', v:472, sel:true, ped:'PED-0157'},
    {id:'fio', t:'Cabo 2,5 mm² na Elétrica Central, não na Leroy', d:'22 rolos × (R$ 214 − R$ 189)', v:550, sel:false},
    {id:'porc', t:'Porcelanato 90×90 → 60×60 na área social', d:'muda a especificação: precisa do OK do cliente', v:14000, sel:false},
  ],
};
const BDI = {
  'vila-nova':'<b>BDI 22,5%</b> só nas linhas de fonte SINAPI (o SINAPI vem sem lucro e despesa indireta). Cotações e NFs entram pelo preço pago. <b>Encargos sociais 84,1%</b> (SINAPI SP, horista, não desonerado) sobre a folha própria, já dentro de "Administração da obra". Empreitadas: preço global, encargos por conta do empreiteiro.',
  'loja-centro':'<b>BDI 22,5%</b> só nas linhas de fonte SINAPI (nenhuma nesta obra). <b>Encargos sociais 84,1%</b> sobre a folha própria (Ana P.), dentro de "Administração da obra". Empreitadas por preço global.',
};
const FASES_LOJA = [{n:'Demolição e preliminares',pct:100},{n:'Instalações',pct:100},{n:'Drywall e forro',pct:100},{n:'Revestimentos',pct:85},{n:'Pintura',pct:40}];

tabOverview = function(o){
  if(o.status==='plan') return gEmBreve(o);
  const L = gOrc(o.id), E = ECON[o.id]||[];
  const altas = [...L].sort((x,y)=>(y.proj-y.prev)-(x.proj-x.prev)).slice(0,2).filter(c=>c.proj>c.prev);
  const prevT = L.reduce((a,c)=>a+c.prev,0), projBase = L.reduce((a,c)=>a+c.proj,0);
  const apl = E.filter(e=>e.ap), aplV = apl.reduce((a,e)=>a+e.v,0);
  const diff = o.previsto - o.budget, pctDe = v => (v/o.budget*100).toFixed(1).replace('.',','), dPct = pctDe(diff);
  const confV = c => L.filter(x=>x.conf===c).reduce((a,x)=>a+x.prev,0);
  const g = gPct(o.gasto,o.budget), p = o.progresso, gap = g-p;
  const sel = E.filter(e=>e.sel&&!e.ap), selV = sel.reduce((a,e)=>a+e.v,0), novo = o.previsto-selV, novoD = novo-o.budget;
  const sinal = v => (v>0?'+':'−')+brl(Math.abs(v));
  const maxD = Math.max(1,...L.map(c=>Math.abs(c.proj-c.prev)));
  const decisao = E.length ? `<div class="card agentnote"><h3>${icon('spark',17)}A verba é realista?</h3>
      <p class="g-resp">${diff>0?`<b>Ainda não.</b> Com os preços de hoje, a obra fecha em <b>${brl(o.previsto)}</b>, ${dPct}% acima da verba de ${brl(o.budget)}. ${altas.map(c=>`${c.cat.split(' · ')[0]} (+R$ ${((c.proj-c.prev)/1000).toFixed(1).replace('.',',')} mil)`).join(' e ')} puxam a alta; cada dia de atraso custa R$ 242 de administração.`
        :`<b>Sim.</b> Com as economias aplicadas, a projeção fica <b>${brl(Math.abs(diff))} abaixo</b> da verba.`}</p>
      <div class="g-econs" role="group" aria-label="Economias encontradas">${E.map(e=>`<label class="g-econ${e.ap?' ap':''}"><input type="checkbox" ${e.sel||e.ap?'checked':''} ${e.ap?'disabled':''} onchange="gEconSel('${o.id}','${e.id}',this.checked)">
        <span><b>${e.t}</b><span class="mut">${e.d}${e.ped?` · ${docRef(e.ped)}`:''}</span>${e.ap?`<span class="row" style="gap:8px;margin-top:4px">${pill('ok',icon('check',12)+'aplicada')}<button type="button" class="g-lnk sm" onclick="event.preventDefault();gEconReverter('${o.id}','${e.id}')">Reverter</button></span>`:''}</span>
        <span class="g-econ-v">−${brl(e.v)}</span></label>`).join('')}</div>
      <div class="g-aplicar"><div>${sel.length?`Projeção ${brl(o.previsto)} → <b>${brl(novo)}</b> (${novoD>0?'+':'−'}${pctDe(Math.abs(novoD))}% sobre a verba)<span class="g-proj">se aplicar</span>`:'<span class="mut">Marque as economias que quer aplicar.</span>'}</div><span class="sp"></span>
        ${botao(sel.length?`Aplicar ${sel.length} (−${brl(selV)})`:'Aplicar economias', `gEconAplicar('${o.id}')`, {pri:true, desab:!sel.length})}</div>
      <p class="g-nota">Aplicar muda a projeção e fica no registro, com desfazer.</p></div>`
    : `<div class="card agentnote"><h3>${icon('spark',17)}A verba é realista?</h3>
      <p class="g-resp"><b>Sim, com folga.</b> A projeção está <b>${brl(Math.abs(diff))} abaixo</b> da verba e a obra está 6 dias adiantada. Sobras que podem ir para outra obra: cimento 26 sc (vence em 25 dias; usa 4), parafuso 420 (usa 80), porcelanato 60×60 18 m².</p>
      ${botao('Ver sobras no estoque entre obras', "go('estoque')", {icone:'swap'})}</div>`;
  return `${val('Fonte e selo de confiança por linha bastam para o gerente defender o número diante do cliente? Que margem ele aceita (5%? 10%)?')}
  ${decisao}
  <div class="grid g2 g-kpis">
    ${kpi({rotulo:'Já gasto (pago)', valor:brl(o.gasto), contexto:`${g}% da verba · obra em ${p}%${gap>5?' · dinheiro à frente do serviço':gap>0?` · ${gap} p.p. à frente, normal`:''}`})}
    ${kpi({rotulo:'Comprometido (pedidos)', valor:brl(o.comprometido), contexto:`inclui ${brl(o.comprometido-o.gasto)} a pagar`})}
  </div>
  <div class="card" style="padding:0;margin-top:var(--s5)">
    <div class="g-card-h"><h3>Orçamento por etapa</h3><span class="mut sm">orçado × projeção, com a fonte e a confiança de cada preço</span></div>
    <div class="g-tw"><table class="sm"><tr><th>Etapa</th><th>Fonte do preço</th><th>Confiança</th><th class="num">Orçado</th><th class="num">Projeção</th><th class="num">Diferença</th></tr>
    ${L.map(c=>{ const d=c.proj-c.prev, [et,...sv]=c.cat.split(' · ');
      return `<tr><td class="g-et"><b>${et}</b>${sv.length?`<span class="mut"> · ${sv.join(' · ')}</span>`:''}</td><td style="min-width:150px">${c.fonte}<span class="g-sub">${c.det}</span></td><td>${gConf(c.conf)}</td><td class="num">${brl(c.prev)}</td><td class="num">${brl(c.proj)}</td>
        <td class="num">${d===0?'<span class="mut">—</span>':`<span class="g-delta${d<0?' menos':''}"><i style="width:${Math.max(3,Math.round(Math.abs(d)/maxD*48))}px" aria-hidden="true"></i><span style="color:${d>0?'var(--amberInk)':'var(--greenInk)'}">${sinal(d)}</span></span>`}</td></tr>`;}).join('')}
    ${aplV?`<tr><td colspan="4">Economias aplicadas (${apl.length})</td><td class="num" style="color:var(--greenInk)">−${brl(aplV)}</td><td></td></tr>`:''}
    <tr><td colspan="3"><b>Total</b></td><td class="num"><b>${brl(prevT)}</b></td><td class="num"><b>${brl(projBase-aplV)}</b></td><td class="num"><b style="color:${projBase-aplV>prevT?'var(--amberInk)':'var(--greenInk)'}">${sinal(projBase-aplV-prevT)}</b></td></tr></table></div>
    <div class="g-rodape"><div class="row" style="flex-wrap:wrap;gap:8px 14px"><span>Da verba:</span>${['alta','média','baixa'].map(c=>`<span class="row" style="gap:6px">${gConf(c)}<b>${gPct(confV(c),prevT)}%</b></span>`).join('')}<span>· selo baixo = preço de tabela sem cotação ou projeto incompleto</span></div>
      <p>${BDI[o.id]||''}</p>
      <p><b>Estimativa para decisão.</b> Não substitui o orçamento executivo nem a ART/RRT do responsável técnico.</p></div>
  </div>`;
};
function gEconSel(oid,id,v){ ECON[oid].find(e=>e.id===id).sel=v; gRerender(); }
function gEconAplicar(oid){
  const o=OBRAS.find(x=>x.id===oid), sel=ECON[oid].filter(e=>e.sel&&!e.ap); if(!sel.length) return;
  const v=sel.reduce((a,e)=>a+e.v,0);
  sel.forEach(e=>e.ap=true); o.previsto-=v;
  const msg=`${sel.length} economia${sel.length>1?'s':''} aplicada${sel.length>1?'s':''} (−${brl(v)}) · projeção ${brl(o.previsto)}`;
  registrar(`Aplicou economias no orçamento (−${brl(v)}): ${sel.map(e=>e.t).join('; ')}`,{obra:oid});
  gRerender();
  toastDesfazer(msg, ()=>{ sel.forEach(e=>e.ap=false); o.previsto+=v; });
}
function gEconReverter(oid,id){
  const o=OBRAS.find(x=>x.id===oid), e=ECON[oid].find(x=>x.id===id);
  e.ap=false; e.sel=false; o.previsto+=e.v;
  registrar(`Reverteu economia: ${e.t} (+${brl(e.v)})`,{obra:oid});
  gRerender();
  toastDesfazer(`Economia revertida (+${brl(e.v)})`, ()=>{ e.ap=true; e.sel=true; o.previsto-=e.v; });
}

/* ===================== DIÁRIO DE OBRA (RDO) ===================== */
const RDO = {
  'vila-nova':[
    {d:'28/10', sem:'quarta', st:'rascunho', aguarda:true, stT:'aguardando confirmação do áudio',
     clima:[{p:'Manhã',ic:'sun',t:'Sol, praticável',src:'estação INMET Campinas'},{p:'Tarde',ic:'rain',t:'Chuva forte 15h–17h',src:'estação INMET Campinas'}],
     efetivo:[['Mestre de obras','Joana M.','próprio',1],['Pedreiro','Equipe Silva','empreitada',3],['Meio-oficial','Equipe Silva','empreitada',1],['Carpinteiro (formas da laje)','Carlos A.','subcontratado pela Equipe Silva',1],['Ajudante','Gilmar P.','próprio',1]],
     efSrc:'da chamada da Joana no WhatsApp 07h12',
     serv:[['Formas da laje do 2º pav.','Carlos montou o painel do eixo C (≈ 60% das formas)','da foto do Carlos 10h05','camera'],
           ['Armação da laje','parada: saldo de 140 kg de aço dá até ~30/10','do almoxarifado + PED-0158','package']],
     mat:[['Areia média · PED-0157','recebidos 36 m³ de 40 na NF (medido na caçamba): divergência de R$ 472','da conferência da Joana 08h30']],
     ocorr:[],
     fotos:[['Alvenaria eixo B, 9ª fiada','Joana · 16h02','#8a6f5a'],['Formas da laje, eixo C','Carlos · 10h05','#6b7f6a'],['Chuva 15h10, alvenaria coberta','Joana · 15h10','#5f7488'],['Areia PED-0157 na caçamba','Joana · 08h30','#a08a62']]},
    {d:'27/10', sem:'terça', st:'enviado', clima:'sol', ef:7, res:'Alvenaria eixo A: 210 blocos · formas da laje · 8 sc de cimento'},
    {d:'26/10', sem:'segunda', st:'enviado', clima:'nublado', ef:6, res:'Alvenaria eixo A: 240 blocos · Carlos faltou (consulta médica)'},
    {d:'24/10', sem:'sábado', st:'enviado', clima:'sol', ef:5, res:'Meio período: marcação dos eixos B e C, limpeza'},
    {d:'23/10', sem:'sexta', st:'enviado', clima:'chuva', ef:7, res:'Chuva fraca de manhã · 1ª fiada do eixo A'},
    {d:'22/10', sem:'quinta', st:'enviado', clima:'sol', ef:7, res:'Desforma do 1º pav. · início da alvenaria do térreo'},
    {d:'21/10', sem:'quarta', st:'enviado', clima:'sol', ef:6, res:'Formas da laje do 2º pav. · aço em falta cobrado da Gerdau'},
    {d:'20/10', sem:'terça', st:'enviado', clima:'sol', ef:7, res:'Recebidos 4.000 blocos (PED-0149) descarregados sem palete'},
  ],
  'loja-centro':[
    {d:'28/10', sem:'quarta', st:'rascunho', stT:'rascunho · aguardando o áudio da Ana',
     clima:[{p:'Manhã',ic:'sun',t:'Sol, praticável',src:'estação INMET Campinas'},{p:'Tarde',ic:'rain',t:'Chuva 15h–17h; obra interna, sem parada',src:'da mensagem da Ana 17h05'}],
     efetivo:[['Mestre de obras','Ana P.','próprio',1],['Assentador','Equipe Lima','empreitada',2],['Pintor','Jorge M.','empreitada',1]],
     efSrc:'da chamada da Ana no WhatsApp 07h20',
     serv:[['Porcelanato 60×60 · salão','≈ 85% assentado','da foto da Ana 16h40','camera'],['Pintura · fachada interna','1ª demão','da mensagem da Ana 17h05','message']],
     mat:[['Argamassa AC-III','12 sc · salão','da mensagem da Ana 17h05']],
     ocorr:[['check','Sem ocorrências. Obra 6 dias adiantada.','calculado pelo agente']],
     fotos:[['Salão, porcelanato','Ana · 16h40','#7d8a96'],['Pintura, 1ª demão','Ana · 14h10','#9a8f7a']]},
    {d:'27/10', sem:'terça', st:'enviado', clima:'sol', ef:4, res:'Porcelanato do salão · rejunte do banheiro'},
    {d:'26/10', sem:'segunda', st:'enviado', clima:'nublado', ef:4, res:'Forro concluído · início do porcelanato do salão'},
  ],
};
let gRdoSel = {};
function tabDiario(o){
  if(o.status==='plan') return gEmBreve(o);
  const L = RDO[o.id]||[], i = gRdoSel[o.id]||0, r = L[i];
  return `${val('O RDO montado a partir do áudio e das fotos do mestre substitui o caderno/planilha de hoje? O cliente quer receber todo dia, toda semana ou só na medição?')}
  <div class="grid" style="grid-template-columns:240px minmax(0,1fr);align-items:start">
    <div class="card" style="padding:16px 12px"><h3 style="padding:0 8px">${icon('book',17)}Diários</h3>
      <div class="g-days">${L.map((x,k)=>`<button type="button" class="g-day ${k===i?'on':''}"${k===i?' aria-current="true"':''} onclick="gRdoSel['${o.id}']=${k};gRerender()"><b>${x.d}</b><span class="mut" style="white-space:nowrap">${x.sem}${x.ef?` · ${x.ef} pessoas`:''}</span>${x.aguarda?pill('pede','aguardando'):x.st==='rascunho'?pill('pede','rascunho'):`<span class="ok" title="enviado ao cliente" aria-label="enviado">${icon('check',14)}</span>`}</button>`).join('')}</div>
      <p class="g-nota" style="margin:12px 8px 0">O agente monta o RDO com o que a mestre manda (áudio, foto, chamada) e a estação de clima. Você revisa e envia.</p></div>
    <div>${r.clima.map?gRdoFull(o,r):gRdoCurto(o,r)}</div>
  </div>`;
}
function gEf(r){ return r.efetivo.reduce((a,e)=>a+e[3],0); }
function gRdoFull(o,r){
  const ef = gEf(r), aguarda = !!r.aguarda, vila = o.id==='vila-nova';
  return `<div class="card">
    <div class="row" style="align-items:flex-start;margin-bottom:16px"><div><div class="mut sm">Relatório diário de obra · ${o.nome}</div><h2 style="margin:2px 0 0;font-size:var(--t-bloco)">${r.sem[0].toUpperCase()+r.sem.slice(1)}, ${r.d}/2026</h2></div><span class="sp"></span>
      ${pill(r.st==='enviado'?'ok':'pede', r.stT)}</div>
    ${aguarda&&vila?`<div class="g-rev">${icon('mic',15)} <b>Áudio da Joana às 17h40, aguardando confirmação.</b> Os serviços, a baixa e a ocorrência entram aqui quando ela confirmar.
      <p>"Hoje assentamos 180 blocos no eixo B, uns 15 quebraram. Choveu das 3 às 5, parou tudo. Gastei 6 sacos de cimento na argamassa. Aço da Gerdau nada ainda."</p>
      <div class="row" style="flex-wrap:wrap">${botao('Confirmar o áudio daqui','gRdoConfirmarAqui()',{pri:true,icone:'check'})}${menuMais([{label:`${icon('message',15)}Ver no WhatsApp da mestre`, onclick:"go('campo')"}])}</div></div>`:''}
    <h3 class="g-sec">Clima</h3>
    <div class="g-clima">${r.clima.map(c=>`<div><span style="color:${c.ic==='sun'?'var(--amber)':'var(--blue)'};display:flex">${icon(c.ic,22)}</span><div style="min-width:0"><b>${c.p}</b> · ${c.t}<div style="margin-top:2px">${gSrc(c.src,/INMET/.test(c.src)?'info':'mic')}</div></div></div>`).join('')}</div>
    <h3 class="g-sec">Efetivo · ${ef} pessoas ${gSrc(r.efSrc,'message')}</h3>
    <div class="g-tw"><table class="sm"><tr><th>Função</th><th>Quem</th><th>Vínculo</th><th class="num">Qtd</th></tr>
      ${r.efetivo.map(e=>`<tr><td>${e[0]}</td><td>${e[1]}</td><td class="mut">${e[2]}</td><td class="num">${e[3]}</td></tr>`).join('')}</table></div>
    <h3 class="g-sec">Serviços executados</h3>
    ${r.serv.map(s=>`<div class="g-li">${icon('bricks',15)}<div style="flex:1;min-width:0"><b style="font-weight:500">${s[0]}</b>${s[1]?' · '+s[1]:''}</div>${gSrc(s[2],s[3])}</div>`).join('')}
    <h3 class="g-sec">Materiais (baixa e recebimento)</h3>
    ${r.mat.map(m=>`<div class="g-li">${icon('package',15)}<div style="flex:1;min-width:0"><b style="font-weight:500">${m[0]}</b>${m[1]?' · '+m[1]:''}</div>${gSrc(m[2])}</div>`).join('')}
    <h3 class="g-sec">Ocorrências</h3>
    ${r.ocorr.length?'':'<div class="g-li mut">Nenhuma ainda.</div>'}${r.ocorr.map(c=>`<div class="g-li">${icon(c[0],15)}<div style="flex:1;min-width:0">${c[1]}</div>${gSrc(c[2],c[2].startsWith('calculado')?'spark':/pedido/.test(c[2])?'package':'mic')}</div>`).join('')}
    <h3 class="g-sec">Fotos · ${r.fotos.length}</h3>
    <div class="g-fotos">${r.fotos.map(f=>`<div class="g-foto"><div class="img" style="background:linear-gradient(135deg,${f[2]},#2b3330)">${icon('camera',22)}</div><div class="cap"><b style="font-weight:500">${f[0]}</b><div class="mut">${f[1]}</div></div></div>`).join('')}</div>
    <div class="row" style="margin-top:24px;flex-wrap:wrap"><span class="sp"></span>
      ${menuMais([{label:'Editar', onclick:"toast('(protótipo) editar o RDO antes de enviar')"}, {label:`${icon('printer',15)}Gerar PDF para o cliente`, onclick:`gRdoPdf('${o.id}',0)`}])}
      ${r.st==='enviado'?pill('ok',icon('check',12)+'enviado')
        :aguarda?'':botao('Enviar ao cliente',`gRdoEnviar('${o.id}')`,{pri:true})}</div>
    ${aguarda&&r.st!=='enviado'?`<p class="g-nota" style="text-align:right;max-width:none">O envio libera quando o áudio for confirmado.</p>`:''}
  </div>`;
}
function gRdoCurto(o,r){
  const ic = {sol:'sun',nublado:'rain',chuva:'rain'}[r.clima];
  return `<div class="card">
    <div class="row" style="margin-bottom:12px;align-items:flex-start"><div><div class="mut sm">Relatório diário de obra · ${o.nome}</div><h2 style="margin:2px 0 0;font-size:var(--t-bloco)">${r.sem[0].toUpperCase()+r.sem.slice(1)}, ${r.d}/2026</h2></div><span class="sp"></span>${pill('ok',icon('check',12)+'enviado ao cliente '+r.d+' 19h')}</div>
    <div class="g-li">${icon(ic,15)}<div><b>Clima</b> · ${r.clima}</div></div>
    <div class="g-li">${icon('users',15)}<div><b>Efetivo</b> · ${r.ef} pessoas</div></div>
    <div class="g-li">${icon('bricks',15)}<div><b>Resumo</b> · ${r.res}</div></div>
    <div class="row" style="margin-top:16px"><span class="sp"></span>${botao('Ver PDF enviado',`gRdoPdf('${o.id}',${(RDO[o.id]||[]).indexOf(r)})`,{icone:'printer'})}</div></div>`;
}
/* Gancho para o Dev Campo: quando a mestre confirma o áudio, o RDO do dia recebe os fatos.
   atualizarRDO('28/10', {servicos:[{txt,fonte}], insumos:[{txt,fonte}], ocorrencias:[{txt,fonte}], clima:{tarde:'texto'}}, 'vila-nova')
   Acrescenta ao RDO, tira o "aguardando confirmação" e devolve uma função que desfaz exatamente o que entrou. */
const gRdoDesf = {};
function atualizarRDO(dia, patch, opt){
  const obraId = typeof opt==='string' ? opt : (opt&&opt.obra)||'vila-nova';
  if(opt&&opt.desfazer){ const d=gRdoDesf[obraId+dia]; if(d) d(); return ()=>{}; }
  patch=patch||{};
  const r=(RDO[obraId]||[]).find(x=>x.d===dia); if(!r||!r.clima.map) return ()=>{};
  const fonte=f=>!f?'do áudio da mestre':/^áudio/i.test(f)?'do '+f:/^(foto|chamada|conferência|mensagem)/i.test(f)?'da '+f:f, ic=f=>/foto/.test(f||'')?'camera':'mic';
  const add={serv:(patch.servicos||[]).map(x=>[x.txt,'',fonte(x.fonte),ic(x.fonte)]),
             mat:(patch.insumos||[]).map(x=>[x.txt,'',fonte(x.fonte)]),
             ocorr:(patch.ocorrencias||[]).map(x=>[/chuva/i.test(x.txt)?'rain':/aço|gerdau|ped-/i.test(x.txt)?'truck':'alert',x.txt,fonte(x.fonte)])};
  Object.keys(add).forEach(k=>r[k].push(...add[k]));
  const antes={aguarda:r.aguarda, stT:r.stT, tarde:r.clima[1]&&{...r.clima[1]}};
  if(patch.clima?.tarde&&r.clima[1]) Object.assign(r.clima[1],{t:patch.clima.tarde,src:fonte(patch.clima.fonte)});
  r.aguarda=false; if(r.st!=='enviado') r.stT='rascunho · pronto para enviar';
  if(state.view==='obra'&&state.tab==='diario') gRerender();
  const desf=()=>{ Object.keys(add).forEach(k=>add[k].forEach(it=>{const i=r[k].indexOf(it); if(i>=0) r[k].splice(i,1);})); r.aguarda=antes.aguarda; r.stT=antes.stT; if(antes.tarde) r.clima[1]=antes.tarde; delete gRdoDesf[obraId+dia]; };
  gRdoDesf[obraId+dia]=desf;
  return desf;
}
function gRdoConfirmarAqui(){
  const f='do áudio da Joana 17h40';
  const desf=atualizarRDO('28/10',{
    servicos:[{txt:'Alvenaria do térreo, eixo B: 180 blocos assentados, 15 quebrados; parou 2 h pela chuva',fonte:f}],
    insumos:[{txt:'Bloco cerâmico 14×19×29: 195 un (180 + 15 de quebra) · alvenaria do térreo',fonte:f},{txt:'Cimento CP-II 50 kg: 6 sc na argamassa · alvenaria do térreo',fonte:f}],
    ocorrencias:[{txt:'Chuva 15h–17h parou a alvenaria por 2 h. Entra como causa de atraso: clima.',fonte:f},{txt:'Aço da Gerdau (PED-0158, 3.200 kg) não chegou: 9 dias atrasado, sem data.',fonte:f},{txt:'Quebra de bloco hoje 15 de 195 (7,7%); no lote acumula 15% contra 5% previsto.',fonte:'calculado pelo agente'}],
    clima:{tarde:'Chuva forte 15h–17h, impraticável 2 h',fonte:f}});
  registrar('Confirmou o áudio da Joana (17h40) no RDO de 28/10',{obra:'vila-nova'});
  toastDesfazer('Áudio da Joana confirmado no RDO de 28/10', desf);
}
function gRdoEnviar(oid){
  const r=RDO[oid][0], st=r.st, stT=r.stT;
  if(r.aguarda) return toast('Confirme o áudio da mestre antes de enviar o RDO ao cliente');
  r.st='enviado'; r.stT='enviado ao cliente 28/10 18h';
  registrar(`RDO de 28/10 enviado ao cliente (PDF)`,{obra:oid});
  gRerender();
  toastDesfazer('RDO de 28/10 enviado ao cliente', ()=>{ r.st=st; r.stT=stT; });
}
function gRdoPdf(oid,i){
  const o=OBRAS.find(x=>x.id===oid), r=RDO[oid][i], full=!!r.clima.map;
  abrirModal(`<h2>Prévia do PDF</h2><p class="mut sm g-noprint" style="margin:-4px 0 16px">Formato A4, como o cliente recebe.</p>
  <div class="g-doc" style="border:1px solid var(--line);border-radius:6px;padding:28px 32px">
    <div class="hd"><div><div style="font-size:12px;color:#555">Construtora RZ · Canteiro</div><div class="tit">Relatório Diário de Obra</div></div><div style="text-align:right">${o.nome}<br>${o.local} · ${r.sem}, ${r.d}/2026</div></div>
    ${full?`<h4>Clima</h4>${r.clima.map(c=>`<div>${c.p}: ${c.t}</div>`).join('')}
    <h4>Efetivo · ${gEf(r)} pessoas</h4><table>${r.efetivo.map(e=>`<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td><td style="text-align:right">${e[3]}</td></tr>`).join('')}</table>
    <h4>Serviços executados</h4>${r.serv.map(s=>`<div>• <b>${s[0]}</b>${s[1]?': '+s[1]:''}</div>`).join('')}
    <h4>Materiais</h4>${r.mat.map(m=>`<div>• <b>${m[0]}</b>${m[1]?': '+m[1]:''}</div>`).join('')}
    <h4>Ocorrências</h4>${r.ocorr.map(c=>`<div>• ${c[1]}</div>`).join('')||'<div>Nenhuma.</div>'}
    <h4>Registro fotográfico</h4><div class="fts">${r.fotos.map(f=>`<div style="background:linear-gradient(135deg,${f[2]},#2b3330)">${f[0]}</div>`).join('')}</div>`
    :`<h4>Clima</h4><div>${r.clima}</div><h4>Efetivo</h4><div>${r.ef} pessoas</div><h4>Serviços</h4><div>${r.res}</div>`}
    <div class="ass"><div>${o.id==='vila-nova'?'Joana M.':'Ana P.'} · mestre de obras</div><div>Rizzi · gerente da obra</div></div>
    <div class="rod">Dados registrados pela mestre de obras por WhatsApp (áudio, fotos, chamada) e conferidos pelo gerente. Gerado pelo Canteiro em ${r.d}/2026.</div>
  </div>
  <div class="row g-noprint" style="margin-top:18px"><span class="sp"></span>${botao('Fechar','closeModal()')}${botao('Imprimir / salvar PDF','gImprimir()',{pri:true,icone:'printer'})}</div>`);
  $('modalBox').style.width='820px';
}
function gImprimir(){ document.body.classList.add('g-print'); window.print(); setTimeout(()=>document.body.classList.remove('g-print'),500); }

/* ===================== MEDIÇÕES DE EMPREITEIRO ===================== */
/* pago = medições aprovadas (bruto) + vales. Da medição, 5% fica retido como garantia até a entrega da etapa. */
const CONTRATOS = {
  'vila-nova':[
    {id:'fund', etapa:'Fundação', emp:'Equipe Ramos', v:26500, exe:100, med:26500, vales:0, retSt:'liberada 30/06', st:'encerrada 30/06',
     hist:[['30/04','1ª medição',13250,'50%'],['31/05','2ª medição',7950,'30%'],['30/06','3ª medição (final)',5300,'20%'],['30/06','Retenção liberada',1325,'']]},
    {id:'estr', etapa:'Estrutura (formas, armação, concretagem)', emp:'Equipe Silva', v:58000, exe:62, med:40500, vales:3000, st:'em andamento',
     hist:[['31/07','1ª medição',11600,'20%'],['31/08','2ª medição',14500,'25%'],['30/09','3ª medição · paga pelo cronograma, sem conferência em campo',14400,'24,8%'],['10/10','Vale (quinzena)',1500,''],['24/10','Vale (quinzena)',1500,'']]},
    {id:'alv', etapa:'Alvenaria e reboco', emp:'Equipe Silva', v:46000, exe:6, med:0, vales:4600, st:'em andamento', nota:'adiantamento de mobilização previsto no contrato',
     hist:[['15/10','Vale de mobilização (contrato, cláusula 4)',4600,'']]},
    {id:'ele', etapa:'Elétrica', emp:'Paulo R.', v:18000, exe:0, med:0, vales:0, st:'começa 04/11', hist:[]},
    {id:'cob', etapa:'Cobertura (carpintaria)', emp:'Carlos A.', v:16000, exe:0, med:0, vales:0, st:'não iniciada', hist:[]},
    {id:'hid', etapa:'Hidráulica', emp:'a contratar', v:14000, orc:true, st:'orçado'},
    {id:'acab', etapa:'Acabamento / assentamento', emp:'a contratar', v:32000, orc:true, st:'orçado'},
  ],
  'loja-centro':[
    {id:'forro', etapa:'Drywall e forro', emp:'Gesso & Forro Lima', v:14000, exe:100, med:14000, vales:0, st:'concluída 16/10', hist:[['30/09','1ª medição',8400,'60%'],['16/10','2ª medição (final)',5600,'40%']]},
    {id:'rev', etapa:'Assentamento de porcelanato', emp:'Equipe Lima', v:9500, exe:85, med:7600, vales:0, st:'em andamento', hist:[['20/10','1ª medição',7600,'80%']]},
    {id:'pint', etapa:'Pintura', emp:'Jorge M.', v:6800, exe:40, med:2040, vales:500, st:'em andamento', hist:[['24/10','1ª medição',2040,'30%'],['26/10','Vale',500,'']]},
  ],
};
const gPago = c => (c.med||0)+(c.vales||0);
const gExeR = c => Math.round(c.v*c.exe/100);
const gRet = c => Math.round((c.med||0)*0.05);
/* O "segurar" da estrutura é a mesma decisão da proposta 'medicao' do agente (proativo.js): se ela está na fila, aprovar daqui
   chama aprovarProp; sem proposta, segura direto. Os dois caminhos registram e têm desfazer. */
const gPropMed = oid => oid==='vila-nova' && typeof prop==='function' ? prop('medicao') : null;
const gHold = (oid,c) => !!c.hold || (c.id==='estr' && (gPropMed(oid)||{}).st==='aprovada');
function tabMedicoes(o){
  if(o.status==='plan') return gEmBreve(o);
  const C = CONTRATOS[o.id]||[], F = C.filter(c=>!c.orc), A = C.filter(c=>c.orc);
  const tot = k => F.reduce((a,c)=>a+k(c),0);
  const estr = C.find(c=>c.id==='estr'), acima = estr ? gPago(estr)-gExeR(estr) : 0, hold = estr && gHold(o.id,estr);
  const sem = F.filter(c=>!c.nota).reduce((a,c)=>a+Math.max(0,gPago(c)-gExeR(c)),0), prev = F.filter(c=>c.nota).reduce((a,c)=>a+Math.max(0,gPago(c)-gExeR(c)),0);
  const alerta = !estr||acima<=0 ? '' : hold
    ? `<div class="card g-alerta"><div><h3>${icon('pause',17)}Próximo pagamento da Equipe Silva segurado</h3><p class="g-resp">Retém ${brl(acima)} na próxima medição da estrutura, até o executado passar de ${gPct(gPago(estr),estr.v)}%.</p></div>
        <div class="ld-feito">${icon('check',14)}Segurado · <button type="button" onclick="gLiberar('${o.id}')">Desfazer</button></div></div>`
    : `<div class="card alertnote g-alerta"><div><h3>${icon('alert',17)}Equipe Silva · estrutura: pago ${gPct(gPago(estr),estr.v)}%, executado ${estr.exe}% → ${brl(acima)} acima</h3>
        <p class="g-resp">A 3ª medição (30/09) foi paga pelo cronograma, sem conferência em campo, e depois vieram 2 vales. O executado de 62% vem dos RDOs e da conferência da Joana em 27/10.</p></div>
        ${botao(`Segurar ${brl(acima)}`, `gSegurar('${o.id}')`, {pri:true, icone:'pause'})}</div>`;
  const linha = c => { const pg=gPago(c), ex=gExeR(c), d=pg-ex, pp=gPct(pg,c.v), perda=d>0&&!c.nota;
    return `<tr class="click" tabindex="0" onclick="gContrato('${o.id}','${c.id}')" onkeydown="if(event.key==='Enter')gContrato('${o.id}','${c.id}')">
      <td><b style="font-weight:500">${c.etapa}</b><span class="g-sub">${c.emp}</span></td><td class="num">${brl(c.v)}</td>
      <td><div class="g-bars"><div class="bar"><i style="width:${c.exe}%;background:var(--green)"></i></div><div class="bar"><i style="width:${Math.min(100,pp)}%;background:${perda?'var(--red)':'var(--accentHi)'}"></i></div><span>exec. ${c.exe}% · pago ${pp}%</span></div></td>
      <td class="num">${d>0?`<span style="color:${perda?'var(--redInk)':'var(--muted)'};font-weight:${perda?600:400}">+${brl(d)}</span>${c.nota?`<span class="g-sub" title="${c.nota}">previsto no contrato</span>`:''}`:'<span class="mut">—</span>'}</td>
      <td class="num">${c.retSt?`<span class="mut">${brl(gRet(c))}<span class="g-sub">${c.retSt}</span></span>`:gRet(c)?brl(gRet(c)):'<span class="mut">—</span>'}</td>
      <td style="white-space:nowrap">${gHold(o.id,c)?pill('pede',icon('pause',12)+'pagamento segurado'):pill(c.exe===100?'ok':c.exe>0?'caminho':'info', c.st)}${icon('chevRight',16,'g-chev')}</td></tr>`; };
  return `${val('Medição por % executado de cada empreitada, com retenção de 5% e vales, é como eles pagam hoje? Quem aprova a medição: o gerente, o dono, os dois?')}
  ${alerta}
  <div class="grid g2 g-kpis">
    ${kpi({rotulo:'Executado', valor:brl(tot(gExeR)), contexto:`${gPct(tot(gExeR),tot(c=>c.v))}% de ${brl(tot(c=>c.v))} contratados em ${F.length} contratos${A.length?` · + ${brl(A.reduce((a,c)=>a+c.v,0))} a contratar`:''}`})}
    ${kpi({rotulo:'Pago (medições + vales)', valor:brl(tot(gPago)), contexto:sem?`<span><span style="color:var(--redInk)">${brl(sem)} acima do executado</span>${prev?`<br>+ ${brl(prev)} de adiantamento previsto`:''}</span>`:prev?`${brl(prev)} de adiantamento previsto no contrato`:'em linha com o executado'})}
  </div>
  <div class="card" style="padding:0;margin-top:var(--s5)">
    <div class="g-card-h"><h3>Contratos de empreitada</h3><span class="sp"></span>${botao('Nova medição',`gNovaMedicao('${o.id}')`,{icone:'plus',sm:true})}</div>
    <div class="g-tw"><table class="sm g-med"><tr><th>Etapa · empreiteiro</th><th class="num">Contratado</th><th>Executado × pago</th><th class="num">Pago − executado</th><th class="num">Retenção 5%</th><th>Situação</th></tr>
    ${F.map(linha).join('')}</table></div>
    <div class="g-rodape">Pago = medições aprovadas + vales. De cada medição, 5% fica retido como garantia até a entrega da etapa. Vales e histórico ficam no detalhe de cada contrato.</div>
  </div>
  ${A.length?`<div class="card" style="margin-top:var(--s5)"><h3>A contratar</h3>${listaDecisoes(A.map(c=>linhaDecisao({prazo:'sem contrato', tom:'info', titulo:`${c.etapa}`, conta:'Orçado; o agente pede 3 propostas de empreiteiros da região', valor:`${brl(c.v)} orçado`,
      acao:{label:'Pedir 3 propostas', onclick:`gPedirPropostas('${o.id}','${c.id}')`}, estado:c.pedido?{feito:'Pedido', hora:c.pedido, quem:'Rizzi', desfazer:`gPedirPropostas('${o.id}','${c.id}',true)`}:'pendente'})))}</div>`:''}`;
}
function gSegurar(oid){
  const p=gPropMed(oid); if(p&&p.st==='pendente') return aprovarProp('medicao');
  const c=CONTRATOS[oid].find(x=>x.id==='estr'); c.hold=true;
  registrar('Segurou o próximo pagamento da Equipe Silva (estrutura) até o executado passar de 75%',{obra:oid});
  gRerender();
  toastDesfazer('Próximo pagamento da Equipe Silva segurado', ()=>{ c.hold=false; });
}
function gLiberar(oid){
  const c=CONTRATOS[oid].find(x=>x.id==='estr');
  if(c.hold){ c.hold=false; registrar('Desfez: segurar o próximo pagamento da Equipe Silva (estrutura)',{obra:oid}); gRerender(); toast('Desfeito'); }
  else gDesfazerProp('medicao');
}
function gPedirPropostas(oid,id,desfazer){
  const c=CONTRATOS[oid].find(x=>x.id===id);
  if(desfazer){ c.pedido=null; registrar(`Desfez: pedido de propostas de empreitada · ${c.etapa}`,{obra:oid}); gRerender(); return toast('Desfeito'); }
  c.pedido=gHora();
  registrar(`Pediu 3 propostas de empreitada: ${c.etapa} (orçado ${brl(c.v)})`,{obra:oid});
  gRerender();
  toastDesfazer(`Pedido de 3 propostas · ${c.etapa}`, ()=>{ c.pedido=null; });
}
function gContrato(oid,id){
  const c=CONTRATOS[oid].find(x=>x.id===id), pg=gPago(c), ex=gExeR(c), d=pg-ex;
  $('drawerPane').innerHTML = `<div class="row"><span class="mut sm">Contrato de empreitada</span><span class="sp"></span><button class="iconbtn" onclick="closeDrawer()" aria-label="Fechar">${icon('x',18)}</button></div>
    <h2 style="margin:6px 0 4px">${c.etapa}</h2><div class="mut">${c.emp} · contrato ${brl(c.v)} · preço global</div>
    <div class="card" style="margin:16px 0 0;padding:16px 20px">
      <div class="g-resumo" style="grid-template-columns:1fr auto">
        <dt>Executado (${c.exe}%)</dt><dd class="num">${brl(ex)}</dd>
        <dt>Medições aprovadas</dt><dd class="num">${brl(c.med||0)}</dd>
        <dt>Vales</dt><dd class="num">${c.vales?brl(c.vales):'—'}</dd>
        <dt>Pago (${gPct(pg,c.v)}%)</dt><dd class="num"><b>${brl(pg)}</b></dd>
        <dt>Pago − executado</dt><dd class="num" style="color:${d>0&&!c.nota?'var(--redInk)':'inherit'}">${d>0?'+'+brl(d):'—'}</dd>
        <dt>Retenção 5%</dt><dd class="num">${brl(gRet(c))} <span class="mut sm">· ${c.retSt||'guardada'}</span></dd>
      </div>${c.nota?`<p class="g-nota">${c.nota}.</p>`:''}</div>
    <h3 style="margin:24px 0 10px">Histórico</h3>
    ${c.hist.length?`<div class="card" style="padding:0"><table class="sm"><tr><th>Data</th><th>Lançamento</th><th class="num">%</th><th class="num">Valor</th></tr>${c.hist.map(h=>`<tr><td>${h[0]}</td><td>${h[1]}</td><td class="num">${h[3]||'—'}</td><td class="num">${brl(h[2])}</td></tr>`).join('')}</table></div>`:'<p class="mut">Nenhuma medição ainda.</p>'}
    <div class="row" style="margin-top:16px">${botao('Ver nos diários',`closeDrawer();go('obra','${oid}','diario')`,{icone:'book'})}<span class="sp"></span>${botao('Nova medição',`closeDrawer();gNovaMedicao('${oid}','${c.id}')`,{pri:true})}</div>`;
  $('drawer').classList.add('on');
}
/* Itens da medição: peso de cada serviço no contrato e % executado acumulado (padrão vem dos RDOs). */
const MED_ITENS = {
  estr:[['Formas',30,90],['Armação',35,55],['Concretagem',35,45]],
  alv:[['Alvenaria de vedação',60,10],['Chapisco e reboco',40,0]],
  fund:[['Fundação completa',100,100]], ele:[['Infraestrutura e fiação',100,0]], cob:[['Estrutura de madeira e telhamento',100,0]],
  forro:[['Forro e drywall',100,100]], rev:[['Porcelanato',100,85]], pint:[['Pintura',100,40]],
};
let gNm = {};
function gNovaMedicao(oid,cid){
  closeDrawer();
  const F=CONTRATOS[oid].filter(c=>!c.orc), c=F.find(x=>x.id===cid)||F.find(x=>x.id==='estr')||F[0];
  gNm={oid, cid:c.id, it:(MED_ITENS[c.id]||[['Serviço',100,c.exe]]).map(x=>[...x])};
  $('modalBox').style.width='700px';
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('receipt',20)}Nova medição</h2><div class="mut sm">${OBRAS.find(o=>o.id===oid).nome} · período 01/10 a 31/10 · o % executado vem dos RDOs; ajuste se a conferência em campo disser outra coisa</div>
    <label class="l">Contrato</label><select class="f" onchange="gNovaMedicao('${oid}',this.value)">${F.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${x.etapa} · ${x.emp} · ${brl(x.v)}</option>`).join('')}</select>
    <table class="sm" style="margin-top:14px"><tr><th>Serviço</th><th class="num">Peso no contrato</th><th class="num">% executado acumulado</th></tr>
      ${gNm.it.map((x,k)=>`<tr><td>${x[0]}</td><td class="num">${x[1]}%</td><td class="num"><input class="f" style="width:80px;text-align:right" type="number" min="0" max="100" value="${x[2]}" oninput="gNm.it[${k}][2]=Math.max(0,Math.min(100,+this.value||0));gNmCalc()"> %</td></tr>`).join('')}</table>
    <div id="gNmRes" style="margin-top:14px"></div>
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" id="gNmBtn" onclick="gNmRegistrar()">Registrar medição</button></div>`;
  $('modal').classList.add('on'); gNmCalc();
}
function gNmCalc(){
  const c=CONTRATOS[gNm.oid].find(x=>x.id===gNm.cid);
  const exe=gNm.it.reduce((a,x)=>a+x[1]*x[2]/100,0), exR=Math.round(c.v*exe/100);
  const bruto=exR-(c.med||0), vale=c.vales||0;
  const liq=(bruto>0?Math.round(bruto*0.95):bruto)-vale;
  gNm.exe=Math.round(exe); gNm.bruto=bruto; gNm.liq=liq;
  const linha=(l,v,cor)=>`<div class="row sm" style="margin:5px 0"><span>${l}</span><span class="sp"></span><b class="num" style="${cor?'color:'+cor:''}">${v}</b></div>`;
  $('gNmRes').innerHTML = `<div class="card" style="background:var(--cream);box-shadow:none;padding:14px 16px">
    ${linha(`Executado acumulado (${exe.toFixed(1).replace('.',',')}%)`, brl(exR))}
    ${linha('Já medido antes', '−'+brl(c.med||0))}
    ${linha('Valor bruto desta medição', (bruto<0?'−':'')+brl(Math.abs(bruto)), bruto<0?'var(--red)':'')}
    ${bruto>0?linha('Retenção 5% (garantia)', '−'+brl(Math.round(bruto*0.05))):''}
    ${linha('Vales já pagos a descontar', vale?'−'+brl(vale):'—')}
    <div style="border-top:1px solid var(--line);margin:8px 0"></div>
    ${linha('A pagar nesta medição', liq>0?brl(liq):'R$ 0', liq>0?'var(--ink)':'var(--red)')}</div>
    ${liq<=0?`<div class="card alertnote inline" style="margin-top:12px;font-size:13px;padding:12px 14px;display:flex;gap:10px">${icon('alert',15)}<div><b>Nada a pagar.</b> O que já foi pago (${brl(gPago(c))}) cobre o executado; faltam ${brl(Math.abs(liq))} de serviço para empatar. O agente avisa quando o executado passar de ${gPct(gPago(c),c.v)}%.</div></div>`:''}`;
}
function gNmRegistrar(){
  const c=CONTRATOS[gNm.oid].find(x=>x.id===gNm.cid), antes={exe:c.exe, med:c.med, vales:c.vales, hist:c.hist.length};
  c.exe=gNm.exe;
  if(gNm.liq>0){ c.med+=gNm.bruto; c.hist.push(['28/10',`${c.hist.filter(h=>h[1].includes('medição')).length+1}ª medição`,gNm.bruto,'']); c.vales=0; }
  else c.hist.push(['28/10',`Medição de conferência: executado ${gNm.exe}%, nada a pagar`,0,'']);
  const msg = gNm.liq>0?`Medição registrada · ${c.emp} · a pagar ${brl(gNm.liq)}`:`Medição registrada · ${c.emp} · executado ${gNm.exe}%, nada a pagar`;
  registrar(`${msg} (${c.etapa})`,{obra:gNm.oid});
  closeModal(); gRerender();
  toastDesfazer(msg, ()=>{ Object.assign(c,{exe:antes.exe,med:antes.med,vales:antes.vales}); c.hist.length=antes.hist; });
}

/* ===================== EQUIPE: CHAMADA DO DIA ===================== */
const EQ = {
  'vila-nova':{
    hoje:[['Joana M.','Mestre de obras','próprio · 50% nesta obra','06h55'],['Antônio Silva','Pedreiro · encarregado','Equipe Silva (empreitada)','07h02'],['Edson R.','Pedreiro','Equipe Silva','07h02'],['Marcelo T.','Pedreiro','Equipe Silva','07h05'],
          ['Rafael S.','Meio-oficial','Equipe Silva','07h10'],['Carlos A.','Carpinteiro · formas da laje','subcontratado pela Equipe Silva','07h00'],['Gilmar P.','Ajudante','próprio · R$ 160/dia','07h00']],
    src:'da chamada da Joana no WhatsApp 07h12',
    fora:[['Paulo R.','Eletricista','começa 04/11'],['2 armadores','Equipe Silva','vaga aberta desde 01/10']],
    docs:[['Rafael S.','ASO vencido em 15/10','bad','Sem ASO válido não pode trabalhar (NR-7). Pedir à Equipe Silva até sexta.','Cobrar a Equipe Silva'],
          ['Gilmar P.','Ficha de EPI sem assinatura','warn','Botina e luvas entregues em 20/10; falta assinar a ficha (NR-6).','Mandar ficha para assinar'],
          ['Paulo R.','Integração NR-18 e ASO','warn','Começa 04/11: integração antes do 1º dia e ASO admissional.','Agendar integração 03/11 07h']],
    emDia:'Joana, Antônio, Edson, Marcelo e Carlos com ASO, ficha de EPI e integração em dia.',
    adm:[['Joana M. · mestre (50% nesta obra)',3750],['Gilmar P. · ajudante (22 dias × R$ 160)',3520]],
    med:[['Equipe Silva · estrutura · vale 10/10',1500],['Equipe Silva · estrutura · vale 24/10',1500],['Equipe Silva · alvenaria · mobilização 15/10',4600]],
  },
  'loja-centro':{
    hoje:[['Ana P.','Mestre de obras','próprio','07h05'],['Wesley L.','Assentador','Equipe Lima (empreitada)','07h20'],['Davi L.','Assentador','Equipe Lima','07h20'],['Jorge M.','Pintor','empreitada','07h30']],
    src:'da chamada da Ana no WhatsApp 07h20',
    fora:[], docs:[['Jorge M.','Ficha de EPI sem assinatura','warn','Máscara PFF2 entregue em 24/10; falta assinar a ficha (NR-6).','Mandar ficha para assinar']],
    emDia:'Ana, Wesley e Davi com ASO, ficha de EPI e integração em dia.',
    adm:[['Ana P. · mestre',2200]],
    med:[['Equipe Lima · porcelanato · 1ª medição 20/10',7600],['Gesso & Forro Lima · 2ª medição 16/10',5600],['Jorge M. · pintura · 1ª medição e vale',2540]],
  },
};
/* Ações da equipe: uma cobrança só à Equipe Silva (ASO do Rafael + 2 armadores) e as de documentação, todas com registro e desfazer. */
const gCobrado = {}, gDocFeito = {};
function gCobrarSilva(oid){
  gCobrado[oid]=gHora();
  registrar('Cobrou a Equipe Silva pelo WhatsApp: ASO do Rafael S. (vencido em 15/10) e os 2 armadores da vaga aberta desde 01/10',{obra:oid});
  gRerender();
  toastDesfazer('Equipe Silva cobrada: ASO do Rafael e 2 armadores', ()=>{ delete gCobrado[oid]; });
}
function gDocAcao(oid,k,desfazer){
  const d=EQ[oid].docs[k], key=oid+':'+k;
  if(desfazer){ delete gDocFeito[key]; registrar(`Desfez: ${d[4]} · ${d[0]}`,{obra:oid}); gRerender(); return toast('Desfeito'); }
  gDocFeito[key]=gHora();
  registrar(`${d[4]} · ${d[0]} (${d[1]})`,{obra:oid});
  gRerender();
  toastDesfazer(`${d[4]} · ${d[0]}`, ()=>{ delete gDocFeito[key]; });
}
tabEquipe = function(o){
  if(o.status==='plan') return gEmBreve(o);
  const e=EQ[o.id], adm=e.adm.reduce((a,x)=>a+x[1],0), med=e.med.reduce((a,x)=>a+x[1],0), vila=o.id==='vila-nova';
  const bloq = nome => e.docs.find(d=>d[0]===nome && d[2]==='bad');
  const hoje = [...e.hoje].sort((a,b)=>!!bloq(b[0])-!!bloq(a[0])), nBloq = hoje.filter(p=>bloq(p[0])).length;
  const cob = gCobrado[o.id];
  const pede = [
    ...(vila?[linhaDecisao({prazo:'+8 dias', tom:'pede', titulo:'Vaga de 2 armadores na Equipe Silva', conta:'Aberta desde 01/10; sem eles a armação da laje anda na metade. A cobrança vai junto com a do ASO do Rafael.',
      acao:{label:'Sugerir armadores', onclick:"toast('(protótipo) o agente lista armadores que já trabalharam com você')"}})]:[]),
    ...e.docs.map((d,k)=>[d,k]).filter(([d])=>d[2]!=='bad').map(([d,k])=>{ const f=gDocFeito[o.id+':'+k];
      return linhaDecisao({prazo:/04\/11|03\/11/.test(d[3])?'até 03/11':'esta semana', tom:'pede', titulo:`${d[0]}: ${d[1]}`, conta:d[3],
        acao:{label:d[4], onclick:`gDocAcao('${o.id}',${k})`}, estado:f?{feito:'Feito', hora:f, quem:'Rizzi', desfazer:`gDocAcao('${o.id}',${k},true)`}:'pendente'}); })];
  return `${val('A chamada do dia pelo WhatsApp da mestre é confiável? Documentação (ASO, EPI, NR-18) é cobrada pelo gerente ou pelo técnico de segurança?')}
  <div class="card" style="padding:0"><div class="g-card-h"><h3>Chamada de hoje · 28/10</h3><span class="sp"></span>${gSrc(e.src,'message')}</div>
      <div class="g-tw"><table class="sm"><tr><th>Nome</th><th>Função</th><th>Vínculo</th><th class="num">Chegou</th></tr>
      ${hoje.map(p=>{ const b=bloq(p[0]);
        return `<tr${b?' class="g-bloq"':''}><td><b style="font-weight:500">${p[0]}</b>${b?`<div>${pill('perda',`${b[1]} · não pode trabalhar`)}</div><div style="margin-top:8px">${cob?`<span class="ld-feito">${icon('check',14)}Equipe Silva cobrada ${cob}</span>`:botao('Cobrar a Equipe Silva',`gCobrarSilva('${o.id}')`,{sm:true, pri:true, title:'Uma mensagem só: ASO do Rafael e os 2 armadores'})}</div>`:''}</td>
          <td>${p[1]}</td><td class="mut">${p[2]}</td><td class="num">${p[3]}</td></tr>`; }).join('')}
      ${e.fora.map(p=>`<tr><td class="mut">${p[0]}</td><td class="mut">${p[1]}</td><td colspan="2">${pill(p[2].startsWith('vaga')?'pede':'info', p[2])}</td></tr>`).join('')}</table></div>
      <div class="g-rodape">${nBloq?`${nBloq} ${nBloq>1?'pessoas não podem':'pessoa não pode'} trabalhar até regularizar (NR-7). `:''}A chamada entra no RDO do dia. <a href="#" class="link" onclick="go('obra','${o.id}','diario');return false">Ver o diário</a></div></div>
  <div class="card" style="margin-top:var(--s5)"><h3>${icon('shield',17)}Pede você</h3>
      ${pede.length?listaDecisoes(pede):'<p class="mut">Nada pendente.</p>'}
      <p class="g-nota">${icon('checkCircle',13)} ${e.emDia}</p></div>
  <div class="grid g2 g-kpis">
    ${kpi({rotulo:'Mão de obra em outubro', valor:brl(adm+med), contexto:`administração ${brl(adm)} + medições e vales ${brl(med)}`})}
    ${kpi({rotulo:vila?'Prazo perdido por falta de gente':'Vagas abertas', valor:vila?'+8 dias':'0', contexto:vila?'dos 21 de atraso previstos':`obra ${-o.atraso} dias adiantada`, tom:vila?'pede':'ok'})}
  </div>`;
};

/* ===================== NOVA OBRA: assistente em 4 passos ===================== */
const WZ_CAM = {
  planilha:{t:'Importar a planilha do orçamentista', d:'Excel ou CSV, SINAPI ou próprio. O agente mapeia as colunas e cota os insumos.', conf:'alta', faixa:'R$ 818–834 mil', tempo:'≈ 10 min para conferir o mapeamento das colunas',
    passos:['Lendo orcamento-sobrado.xlsx (312 linhas)','Mapeando colunas: código, descrição, un, qtd, preço','Atualizando 64 insumos com cotação de Campinas','Montando cronograma por fase'],
    nao:['14 linhas sem unidade (ex.: "verba piscina"): confira','Composição própria "estaca Ø30" sem preço unitário']},
  m2:{t:'Estimativa por m² e padrão', d:'210 m², padrão médio-alto. Usa CUB/SINAPI de set/26 e ajusta para o que o CUB não cobre.', conf:'baixa', faixa:'R$ 756–861 mil', tempo:'imediato, mas a faixa é larga (±15%)',
    passos:['CUB R8-A Sinduscon-SP set/26 × 210 m²','Somando o que o CUB não cobre: fundação em estaca, piscina, BDI','Montando cronograma por fase'],
    nao:['Fundação em estaca: sem sondagem, usei média de terreno com declive','Piscina 3×6: preço de mercado, sem projeto','Nenhum quantitativo real: serve para decidir se vale a pena, não para comprar']},
  pdf:{t:'Extrair do PDF só o que dá para medir', d:'Áreas de piso, paredes e cobertura da planta. O resto vem por m² e fica marcado.', conf:'média', faixa:'R$ 798–846 mil', tempo:'20–40 min de leitura + ≈ 1 h sua para conferir',
    passos:['Lendo projeto-arquitetonico.pdf (22 pág.) e memorial','Medindo áreas: piso 210 m², paredes 486 m², cobertura 132 m²','Cotando 38 insumos medidos em Campinas','Estimando por m² o que não deu para medir'],
    nao:['Fundação: sem projeto estrutural de estacas','Instalações elétricas e hidráulicas: sem projetos complementares','Esquadrias: sem quadro de esquadrias','Piscina: só aparece no memorial, sem desenho']},
};
const WZ_PASSOS = ['Projeto','A obra','Orçamento','Revisar e criar'];
const WZ_PADRAO = {nome:'Sobrado Jardim Europa', end:'Rua Holanda, 88 · Jardim Europa · Campinas-SP', verba:'R$ 780.000', margem:'8%', ini:'12/01/2027', fim:'30/11/2027',
  desc:'Sobrado de 210 m², 3 suítes, laje nos dois pavimentos, telhado aparente com telha cerâmica. Padrão médio-alto: porcelanato 90x90 na área social, esquadrias de alumínio preto. Fundação em estaca (o terreno tem declive de 1,5 m). Quero piscina de 3x6 no fundo. Já tenho a equipe de pedreiros (empreitada), falta elétrica e hidráulica.'};
openWizard = function(step){
  step = Math.max(1, Math.min(4, +step||1));
  Object.keys(WZ_PADRAO).forEach(k=>{ if(wz[k]==null) wz[k]=WZ_PADRAO[k]; });
  const cam = WZ_CAM[wz.caminho] ? wz.caminho : 'pdf', C = WZ_CAM[cam];
  const campo = (rot,k) => `<label class="l" for="wz-${k}">${rot}</label><input class="f" id="wz-${k}" value="${esc(wz[k])}" oninput="wz.${k}=this.value">`;
  const passos = `<ol class="g-wz-passos" aria-label="Passos">${WZ_PASSOS.map((t,k)=>{ const n=k+1;
    return `<li class="${n===step?'on':''}">${n<step?`<button type="button" onclick="openWizard(${n})">${icon('check',13)}${n}. ${t}</button>`:`<span${n===step?' aria-current="step"':''}>${n}. ${t}</span>`}</li>`; }).join('')}</ol>`;
  let b='';
  if(step===1) b=`<p class="mut sm" style="margin:0 0 12px">Anexe o que tiver: projeto arquitetônico, estrutural, memorial descritivo, planilha do orçamentista, fotos do terreno.</p>
    <div class="drop" role="button" tabindex="0" onclick="toast('(protótipo) escolher arquivos')">${icon('upload',22)}Arraste PDF, DWG, planilhas, imagens<br><span class="sm">ou <u>escolha arquivos</u></span></div>
    <div style="margin-top:12px"><span class="attach">${icon('file',13)}projeto-arquitetonico.pdf · 22 pág.</span><span class="attach">${icon('file',13)}memorial-descritivo.pdf</span><span class="attach">${icon('file',13)}orcamento-sobrado.xlsx</span></div>
    ${campo('Nome da obra','nome')}${campo('Endereço (usado para cotar preços na região)','end')}`;
  if(step===2) b=`<label class="l" for="wz-desc" style="margin-top:0">Descreva a obra do seu jeito. O agente pergunta o que faltar.</label>
    <textarea class="f" id="wz-desc" rows="6" oninput="wz.desc=this.value">${esc(wz.desc)}</textarea>
    <div class="grid g2" style="gap:0 14px"><div>${campo('Orçamento (verba) total','verba')}</div><div><label class="l" for="wz-margem">Margem de segurança</label><select class="f" id="wz-margem" onchange="wz.margem=this.value">${['5%','8%','10%'].map(m=>`<option${m===wz.margem?' selected':''}>${m}</option>`).join('')}</select></div>
    <div>${campo('Início','ini')}</div><div>${campo('Entrega desejada','fim')}</div></div>`;
  if(step===3) b=`<fieldset style="border:0;padding:0;margin:0"><legend class="l" style="margin-top:0">De onde vem o orçamento? Muda a confiança e o tempo.</legend>
    <div class="g-path">${Object.entries(WZ_CAM).map(([k,x])=>`<label class="${k===cam?'on':''}"><input type="radio" name="gcam" value="${k}" ${k===cam?'checked':''} onchange="wz.caminho='${k}';openWizard(3)"><b>${x.t}</b><span class="mut">${x.d}</span><span>${gConf(x.conf)}</span></label>`).join('')}</div></fieldset>
    <dl class="g-resumo" style="margin-top:16px"><dt>Prévia esperada</dt><dd>${C.faixa} · confiança ${C.conf}</dd><dt>Tempo</dt><dd>${C.tempo}</dd></dl>`;
  if(step===4) b=`<dl class="g-resumo">
      <dt>Obra</dt><dd><b>${esc(wz.nome)}</b></dd><dt>Endereço</dt><dd>${esc(wz.end)}</dd>
      <dt>Verba</dt><dd>${esc(wz.verba)} · margem ${esc(wz.margem)}</dd><dt>Datas</dt><dd>${esc(wz.ini)} → ${esc(wz.fim)}</dd>
      <dt>Orçamento</dt><dd>${C.t} ${gConf(C.conf)}</dd><dt>Prévia</dt><dd>${C.faixa}<span class="g-proj">estimativa</span></dd><dt>Tempo</dt><dd>${C.tempo}</dd></dl>
    <h3 style="margin:20px 0 6px;font-size:var(--t-sec)">O agente não vai conseguir medir</h3>
    <ul style="margin:0;padding-left:18px;font-size:var(--t-meta);line-height:1.6">${C.nao.map(n=>`<li>${n}</li>`).join('')}</ul>
    <p class="g-nota">A obra entra na lista como "em orçamento" e o agente monta o orçamento no painel dela; as fases e o cronograma ele propõe a partir do projeto. Estimativa para decisão: não substitui o orçamento executivo nem a ART.</p>
    ${val('Selo de confiança + lista do que não foi medido + tempo honesto: isso faz o gerente confiar mais (ou menos) do que um número único?')}`;
  const prox = ['','Descrever a obra','Escolher o orçamento','Revisar a obra'];
  $('modalBox').style.width='700px';
  abrirModal(`<h2>Nova obra</h2>${passos}${b}
    <div class="row" style="margin-top:22px">${step>1?botao('Voltar',`openWizard(${step-1})`,{icone:'arrowLeft'}):botao('Cancelar','closeModal()')}<span class="sp"></span>
    ${step<4?botao(`${prox[step]} ${icon('arrowRight',15)}`,`openWizard(${step+1})`,{pri:true}):botao('Criar a obra e orçar com o agente','gCriarObra()',{pri:true,icone:'spark'})}</div>`);
};
/* Cria o esqueleto da obra nova (estado "em orçamento", como o Galpão) e abre o Hoje dela com o painel do agente. */
function gCriarObra(){
  const C=WZ_CAM[wz.caminho]||WZ_CAM.pdf, nome=String(wz.nome||'Obra nova').trim()||'Obra nova';
  let id=nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'obra-nova';
  while(OBRAS.some(o=>o.id===id)) id+='-2';
  const cid=(String(wz.end).split('·').pop()||'').trim().replace(/-([A-Z]{2})$/,' · $1')||'—';
  const o={id, nome, tipo:'Residencial · 210 m²', local:cid, cor:'#6b7f6a', mestre:'—', regime:'empreitada', budget:+String(wz.verba).replace(/\D/g,'')||0, previsto:null, comprometido:0, gasto:0,
    fase:'Em orçamento', progresso:0, inicio:wz.ini, prazo:wz.fim, previsao:'—', atraso:0, status:'plan'};
  OBRAS.push(o); NOME_OBRA[id]=nome;
  DADOS[id]={inv:[], lotes:[], orc:[], comp:[], fases:[], mov:{}, empreitadas:[], adm:{itens:[],mes:0}, prazo:null, valorEstoque:0, itensAlmox:0};
  G_ORCANDO[id]={perguntas:C.nao.map(n=>{ const [a,...r]=n.split(':'); return [`Conferir: ${a.trim()}`, r.join(':').trim()||'O agente precisa da sua confirmação']; }),
    previa:C.faixa, previaCtx:`confiança ${C.conf} · ${C.t.toLowerCase()}`, inicio:wz.ini, duracao:`entrega desejada ${wz.fim}`};
  CHATS[id]={sess:[['Orçamento inicial','agora']], msgs:()=>`
    ${meMsg(`<span class="attach">${icon('file',13)}projeto-arquitetonico.pdf · 22 pág.</span><span class="attach">${icon('file',13)}memorial-descritivo.pdf</span><span class="attach">${icon('file',13)}orcamento-sobrado.xlsx</span><br>${esc(wz.desc||'')}`)}
    ${aiMsg(C.passos, `Estou montando o orçamento: <b>${C.t.toLowerCase()}</b>.<br>${C.passos.map((s,k)=>`${k<C.passos.length-1?'✓':'…'} ${s}`).join('<br>')}<br><br>
      Prévia: <b>${C.faixa}</b>, confiança ${C.conf}, contra a verba de ${esc(wz.verba)}. Não consegui medir:<br>${C.nao.map(n=>'• '+n).join('<br>')}`)}`};
  registrar(`Criou a obra ${nome} · orçamento: ${C.t.toLowerCase()} · verba ${wz.verba}`,{obra:id});
  const dados0={...wz}; wz={};
  closeModal(); go('obra',id,'hoje');
  toastDesfazer(`${nome} criada · o agente está montando o orçamento`, ()=>{
    const k=OBRAS.indexOf(o); if(k>=0) OBRAS.splice(k,1);
    delete NOME_OBRA[id]; delete DADOS[id]; delete G_ORCANDO[id]; delete CHATS[id]; wz=dados0;
    if(state.obra===id){ state=rota('hub'); history.replaceState(null,'','#hub'); }
  });
}
