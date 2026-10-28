/* Diário de obra (RDO), medição de empreiteiro, orçamento com fonte e confiança, equipe como efetivo do dia.
   Redefine tabOverview, tabEquipe e openWizard do core; registra as abas 'diario' e 'medicoes'. */

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
.g-src{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:var(--muted);background:var(--cream);border:1px solid var(--line2);border-radius:99px;padding:0 8px;white-space:nowrap;line-height:1.7}
.g-src .ic{width:12px;height:12px;vertical-align:0}
.g-conf{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;border-radius:99px;padding:0 8px;line-height:1.7;white-space:nowrap}
.g-conf::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.g-conf.alta{background:var(--greenSoft);color:#3d6a4c} .g-conf.media{background:var(--amberSoft);color:#86621f} .g-conf.baixa{background:var(--redSoft);color:#9a4334}
.g-days{display:flex;flex-direction:column;gap:2px}
.g-day{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:13px}
.g-day:hover{background:var(--cream)} .g-day.on{background:var(--accentSoft);box-shadow:inset 3px 0 0 var(--accent)}
.g-day b{font-variant-numeric:tabular-nums}
.g-fotos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.g-foto{border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#fff}
.g-foto .img{height:96px;display:grid;place-items:center;color:rgba(255,255,255,.85)}
.g-foto .cap{padding:7px 10px;font-size:12px;line-height:1.4}
.g-sec{font:600 12px var(--sans);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:22px 0 8px}
.g-sec:first-child{margin-top:0}
.g-li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line2);font-size:13.5px}
.g-li:last-child{border-bottom:0} .g-li > .ic{margin-top:3px;color:var(--muted)} .g-li .sp{min-width:8px}
.g-clima{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.g-clima > div{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:center}
.g-tw{overflow-x:auto}
.g-econ{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #efdcd0;font-size:13px}
.g-econ:last-of-type{border-bottom:0}
.g-econ input{margin-top:3px;accent-color:var(--accentInk)}
.g-econ.ap{opacity:.6}
.g-path{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px}
.g-path label{border:1px solid var(--line);border-radius:12px;padding:12px 13px;cursor:pointer;font-size:12.5px;line-height:1.45;display:flex;flex-direction:column;gap:5px}
.g-path label:hover{background:var(--cream)} .g-path label.on{border-color:var(--accent);background:var(--accentSoft)}
.g-path input{display:none} .g-path b{font-size:13.5px}
.g-doc{font:12.5px/1.5 var(--sans);color:#111}
.g-doc h1{font:700 20px var(--serif);margin:0}
.g-doc table td,.g-doc table th{padding:5px 8px;font-size:12px;background:none;border-bottom:1px solid #ddd}
.g-doc .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
.g-doc h4{font:600 11.5px var(--sans);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 4px;color:#444}
.g-doc .ass{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px;text-align:center;font-size:11.5px}
.g-doc .ass div{border-top:1px solid #111;padding-top:5px}
.g-doc .fts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.g-doc .fts div{height:70px;border-radius:4px;display:flex;align-items:flex-end;padding:4px 6px;color:#fff;font-size:10px}
@media print{
  body.g-print .app,body.g-print .toast,body.g-print .drawer,body.g-print .g-noprint{display:none!important}
  body.g-print .modal{position:static;display:block;background:none}
  body.g-print .modal .box{width:auto!important;max-width:none;max-height:none;border:0;box-shadow:none;padding:0;overflow:visible}
}`);

/* Modais largos (documento, medição) voltam à largura padrão ao fechar, para não afetar os modais dos outros. */
new MutationObserver(()=>{ if(!$('modal').classList.contains('on')) $('modalBox').style.width=''; }).observe($('modal'),{attributes:true,attributeFilter:['class']});

const gSrc = (t, ic='mic') => `<span class="g-src">${icon(ic,12)}${t}</span>`;
const gConf = c => `<span class="g-conf ${c==='média'?'media':c}">${c}</span>`;
const gPct = (a,b) => Math.round(a/b*100);
function gRerender(){ const m=$('main'), y=m.scrollTop; render(); m.scrollTop=y; }
const gEmBreve = o => `<div class="card row">${icon('info',16)}<span>Disponível depois do orçamento. O ${o.nome} ainda está sendo orçado no chat.</span><span class="sp"></span><a class="link" href="#" onclick="go('obra','${o.id}','chat');return false">Abrir chat ${icon('arrowRight',14)}</a></div>`;

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
    {id:'palete', t:'Exigir palete no PED-0162 (9.000 blocos)', d:'quebra volta de 15% para 5%: 900 blocos × R$ 1,62', v:1458, sel:true},
    {id:'telha', t:'Aprovar o PED-0163 da telha direto de Tatuí esta semana', d:'3.900 × (R$ 2,98 − R$ 2,35); a cotação vence 05/11', v:2457, sel:true},
    {id:'areia', t:'Abater a areia que faltou no PED-0157', d:'4 m³ × R$ 118 do boleto da Porto Jaguari', v:472, sel:true},
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
  const diff = o.previsto - o.budget, dPct = (diff/o.budget*100).toFixed(1).replace('.',',');
  const confV = c => L.filter(x=>x.conf===c).reduce((a,x)=>a+x.prev,0);
  const g = gPct(o.gasto,o.budget), p = o.progresso, gap = g-p;
  const sel = E.filter(e=>e.sel&&!e.ap), selV = sel.reduce((a,e)=>a+e.v,0);
  return `${val('Fonte e selo de confiança por linha bastam para o gerente defender o número diante do cliente? Que margem ele aceita (5%? 10%)?')}
  <div class="callout" style="margin-bottom:18px">${icon('info')}<div><b>Estimativa para decisão.</b> Não substitui o orçamento executivo nem a ART/RRT do responsável técnico. Cada linha diz de onde veio o preço e quanto dá para confiar nele.</div></div>
  <div class="grid g4">
    <div class="card kpi"><div class="l">Orçamento (verba)</div><div class="v">${brl(o.budget)}</div><div class="s mut">no cadastro da obra</div></div>
    <div class="card kpi"><div class="l">Projeção do agente</div><div class="v">${brl(o.previsto)}</div><div class="s" style="color:${diff>0?'var(--red)':'var(--green)'}">${icon(diff>0?'trendUp':'check',14)} ${diff>0?'+':'−'}${brl(Math.abs(diff))} (${diff>0?'+':''}${dPct}%)${aplV?` · ${apl.length} economia${apl.length>1?'s':''} aplicada${apl.length>1?'s':''}`:''}</div></div>
    <div class="card kpi"><div class="l">Já gasto (pago)</div><div class="v">${brl(o.gasto)}</div><div class="s mut">${g}% da verba · obra em ${p}%</div></div>
    <div class="card kpi"><div class="l">Comprometido (pedidos)</div><div class="v">${brl(o.comprometido)}</div><div class="s mut">inclui ${brl(o.comprometido-o.gasto)} a pagar</div></div>
  </div>
  <div class="grid" style="grid-template-columns:minmax(0,1.9fr) minmax(320px,1fr);margin-top:18px;align-items:start">
    <div class="card"><h3>Orçamento por etapa <small>· orçado × projeção, com fonte e confiança</small></h3>
      <div class="g-tw"><table class="sm"><tr><th>Etapa</th><th>Fonte do preço</th><th>Confiança</th><th class="num">Orçado</th><th class="num">Projeção</th><th class="num">Δ</th></tr>
      ${L.map(c=>{ const d=c.proj-c.prev; return `<tr><td>${c.cat}</td><td style="min-width:150px"><div style="white-space:nowrap">${c.fonte}</div><div class="mut" style="font-size:11.5px">${c.det}</div></td><td>${gConf(c.conf)}</td><td class="num">${brl(c.prev)}</td><td class="num">${brl(c.proj)}</td><td class="num" style="color:${d>0?'var(--red)':d<0?'var(--green)':'var(--faint)'}">${d===0?'—':(d>0?'+':'−')+Math.abs(d).toLocaleString('pt-BR')}</td></tr>`;}).join('')}
      ${aplV?`<tr><td colspan="4">Economias aplicadas (${apl.length})</td><td class="num" style="color:var(--green)">−${aplV.toLocaleString('pt-BR')}</td><td></td></tr>`:''}
      <tr><td colspan="3"><b>Total</b></td><td class="num"><b>${brl(prevT)}</b></td><td class="num"><b>${brl(projBase-aplV)}</b></td><td class="num"><b style="color:${projBase-aplV>prevT?'var(--red)':'var(--green)'}">${projBase-aplV>prevT?'+':'−'}${Math.abs(projBase-aplV-prevT).toLocaleString('pt-BR')}</b></td></tr></table></div>
      <div class="row sm" style="margin-top:14px;flex-wrap:wrap;gap:8px 14px"><span class="mut">Da verba:</span>${['alta','média','baixa'].map(c=>`<span class="row" style="gap:6px">${gConf(c)}<b>${gPct(confV(c),prevT)}%</b></span>`).join('')}
        <span class="mut">· selo baixo = preço de tabela sem cotação ou projeto incompleto</span></div>
      <div class="card" style="background:var(--cream);box-shadow:none;padding:12px 14px;margin-top:14px;font-size:12.5px;line-height:1.55">${BDI[o.id]||''}</div>
    </div>
    ${E.length?`<div class="card agentnote"><h3>${icon('spark',17)}A verba é realista?</h3>
      <p style="margin:0 0 12px">${diff>0?`<b>Ainda não.</b> Com os preços de hoje, a obra fecha em <b>${brl(o.previsto)}</b>, <b>${dPct}% acima</b> da verba. ${altas.map(c=>`${c.cat.split(' · ')[0]} (+R$ ${((c.proj-c.prev)/1000).toFixed(1).replace('.',',')} mil: ${c.det.split(' · ').slice(-1)[0]})`).join(' e ')} puxam a alta, e cada dia de atraso custa R$ 242 de administração.`:`<b>Sim.</b> Com as economias aplicadas, a projeção fica <b>${brl(Math.abs(diff))} abaixo</b> da verba.`}</p>
      <b class="sm">Economias encontradas · marque as que quer aplicar</b>
      <div style="margin-top:4px">${E.map(e=>`<label class="g-econ ${e.ap?'ap':''}"><input type="checkbox" ${e.sel||e.ap?'checked':''} ${e.ap?'disabled':''} onchange="gEconSel('${o.id}','${e.id}',this.checked)"><span style="flex:1;min-width:0"><b style="font-weight:500">${e.t}</b><span class="mut" style="display:block;font-size:12px">${e.d}</span>${e.ap?`<span class="pill ok" style="margin-top:4px">${icon('check',12)}aplicada</span> <a href="#" class="sm" style="text-decoration:underline" onclick="gEconReverter('${o.id}','${e.id}');return false">reverter</a>`:''}</span><span class="num" style="color:var(--green)">−${brl(e.v)}</span></label>`).join('')}</div>
      <button class="btn amb" style="margin-top:14px" ${sel.length?'':'disabled style="margin-top:14px;opacity:.5;cursor:default"'} onclick="gEconAplicar('${o.id}')">${sel.length?`Aplicar ${sel.length} de ${E.length} (−${brl(selV)})`:'Marque uma economia'}</button>
      <p class="sm mut" style="margin:10px 0 0">Aplicar muda a projeção e fica no registro, com desfazer.</p></div>`
    :`<div class="card agentnote"><h3>${icon('spark',17)}A verba é realista?</h3><p style="margin:0 0 10px"><b>Sim, com folga.</b> A projeção está <b>${brl(Math.abs(diff))} abaixo</b> da verba e a obra está 6 dias adiantada.</p>
      <p class="sm" style="margin:0 0 12px">Sobras que podem ir para outra obra: cimento 26 sc (vence em 25 dias; usa 4), parafuso 420 (usa 80), porcelanato 60×60 18 m².</p>
      <button class="btn" onclick="go('estoque')">${icon('swap',15)}Ver no Almoxarifado entre obras</button></div>`}
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="card"><h3>Gasto × avanço físico</h3>
      <div class="sm mut">Gasto ${g}% da verba · obra ${p}% concluída</div>
      <div class="split" style="margin:10px 0"><div style="width:${Math.min(g,p)}%;background:var(--green)"></div>${gap>0?`<div style="width:${gap}%;background:var(--red)"></div>`:gap<0?`<div style="width:${-gap}%;background:#9fd0b2"></div>`:''}</div>
      <div class="legend"><span><i style="background:var(--green)"></i>gasto alinhado ao avanço</span>${gap>0?`<span><i style="background:var(--red)"></i>gasto à frente do avanço (${gap} p.p.)</span>`:gap<0?`<span><i style="background:#9fd0b2"></i>avanço à frente do gasto (${-gap} p.p.)</span>`:''}</div>
      <p class="sm" style="margin:12px 0 0">${gap>5?`O dinheiro está <b>${gap} p.p. à frente</b> do serviço: confira pagamentos adiantados (veja Medições).`:gap>0?`O dinheiro está <b>${gap} p.p. à frente</b> do serviço: dentro do normal (até 5 p.p.). Atenção à Equipe Silva, paga acima do executado.`:gap<0?`O serviço está <b>${-gap} p.p. à frente</b> do dinheiro. Há ${brl(o.comprometido-o.gasto)} comprometidos a pagar, então a diferença deve fechar.`:'Gasto e avanço andam juntos.'}</p></div>
    <div class="card"><h3>Etapas</h3>${(o.id==='vila-nova'?FASES.slice(0,5):FASES_LOJA).map(f=>`<div class="row sm" style="margin:8px 0"><span style="width:170px">${f.n}</span><div class="bar sp"><i style="width:${f.pct}%;background:${f.pct===100?'var(--green)':'var(--accentHi)'}"></i></div><span class="mut" style="width:36px;text-align:right">${f.pct}%</span></div>`).join('')}</div>
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
  const cIc = {sol:'sun',nublado:'rain',chuva:'rain'};
  return `${val('O RDO montado a partir do áudio e das fotos do mestre substitui o caderno/planilha de hoje? O cliente quer receber todo dia, toda semana ou só na medição?')}
  <div class="grid" style="grid-template-columns:300px minmax(0,1fr);align-items:start">
    <div class="card" style="padding:14px 12px"><h3 style="padding:0 6px">${icon('book',17)}Diários</h3>
      <div class="g-days">${L.map((x,k)=>`<div class="g-day ${k===i?'on':''}" onclick="gRdoSel['${o.id}']=${k};gRerender()"><b>${x.d}</b><span class="mut" style="font-size:12px;white-space:nowrap">${x.sem}${x.ef?` · ${x.ef} pessoas`:''}</span>${x.aguarda?'<span class="pill warn">aguardando</span>':x.st==='rascunho'?'<span class="pill warn">rascunho</span>':'<span class="pill ok">enviado</span>'}</div>`).join('')}</div>
      <p class="sm mut" style="margin:12px 6px 0;line-height:1.5">O agente monta o RDO com o que a mestre manda (áudio, foto, chamada) e a estação de clima. Você revisa e envia.</p></div>
    <div>${r.clima.map?gRdoFull(o,r):gRdoCurto(o,r)}</div>
  </div>`;
}
function gEf(r){ return r.efetivo.reduce((a,e)=>a+e[3],0); }
function gRdoFull(o,r){
  const ef = gEf(r);
  return `<div class="card">
    <div class="row" style="align-items:flex-start;margin-bottom:16px"><div><div class="mut sm">Relatório diário de obra · ${o.nome}</div><h2 style="margin:2px 0 0;font-size:24px">${r.sem[0].toUpperCase()+r.sem.slice(1)}, ${r.d}/2026</h2></div><span class="sp"></span>
      <span class="pill ${r.st==='enviado'?'ok':'warn'}" style="margin-top:6px">${r.stT}</span></div>
    ${r.aguarda&&o.id==='vila-nova'?`<div class="callout" style="margin-bottom:18px">${icon('mic')}<div><b>Áudio da Joana às 17h40, aguardando confirmação:</b> "Hoje assentamos 180 blocos no eixo B, uns 15 quebraram. Choveu das 3 às 5, parou tudo. Gastei 6 sacos de cimento na argamassa. Aço da Gerdau nada ainda." Quando ela confirmar, os serviços, a baixa e a ocorrência entram aqui.
      <div class="row" style="margin-top:8px;gap:8px"><button class="btn sm" onclick="go('campo')">${icon('message',14)}Ver no WhatsApp da mestre</button><button class="btn sm" onclick="gRdoConfirmarAqui()">Confirmar daqui</button></div></div></div>`:''}
    <div class="g-sec">Clima</div>
    <div class="g-clima">${r.clima.map(c=>`<div><span style="color:${c.ic==='sun'?'var(--amber)':'var(--blue)'};display:flex">${icon(c.ic,22)}</span><div style="min-width:0"><b>${c.p}</b> · ${c.t}<div style="margin-top:3px">${gSrc(c.src,/INMET/.test(c.src)?'info':'mic')}</div></div></div>`).join('')}</div>
    <div class="g-sec">Efetivo · ${ef} pessoas <span style="text-transform:none;letter-spacing:0;font-weight:400">${gSrc(r.efSrc,'message')}</span></div>
    <div class="g-tw"><table class="sm"><tr><th>Função</th><th>Quem</th><th>Vínculo</th><th class="num">Qtd</th></tr>
      ${r.efetivo.map(e=>`<tr><td>${e[0]}</td><td>${e[1]}</td><td class="mut">${e[2]}</td><td class="num">${e[3]}</td></tr>`).join('')}</table></div>
    <div class="g-sec">Serviços executados</div>
    ${r.serv.map(s=>`<div class="g-li">${icon('bricks',15)}<div style="flex:1;min-width:0"><b>${s[0]}</b>${s[1]?' · '+s[1]:''}</div>${gSrc(s[2],s[3])}</div>`).join('')}
    <div class="g-sec">Materiais (baixa e recebimento)</div>
    ${r.mat.map(m=>`<div class="g-li">${icon('package',15)}<div style="flex:1;min-width:0"><b>${m[0]}</b>${m[1]?' · '+m[1]:''}</div>${gSrc(m[2])}</div>`).join('')}
    <div class="g-sec">Ocorrências</div>
    ${r.ocorr.length?'':'<div class="g-li mut">Nenhuma ainda.</div>'}${r.ocorr.map(c=>`<div class="g-li">${icon(c[0],15)}<div style="flex:1;min-width:0">${c[1]}</div>${gSrc(c[2],c[2].startsWith('calculado')?'spark':/pedido/.test(c[2])?'package':'mic')}</div>`).join('')}
    <div class="g-sec">Fotos · ${r.fotos.length}</div>
    <div class="g-fotos">${r.fotos.map(f=>`<div class="g-foto"><div class="img" style="background:linear-gradient(135deg,${f[2]},#2b3330)">${icon('camera',22)}</div><div class="cap"><b style="font-weight:500">${f[0]}</b><div class="mut">${f[1]}</div></div></div>`).join('')}</div>
    <div class="row" style="margin-top:22px;flex-wrap:wrap"><button class="btn" onclick="toast('(protótipo) editar o RDO antes de enviar')">Editar</button><span class="sp"></span>
      <button class="btn" onclick="gRdoPdf('${o.id}',0)">${icon('printer',15)}Gerar PDF para o cliente</button>
      ${r.st==='enviado'?`<span class="pill ok">${icon('check',12)}enviado</span>`:`<button class="btn amb" onclick="gRdoEnviar('${o.id}')">Enviar ao cliente</button>`}</div>
  </div>`;
}
function gRdoCurto(o,r){
  const ic = {sol:'sun',nublado:'rain',chuva:'rain'}[r.clima];
  return `<div class="card">
    <div class="row" style="margin-bottom:12px"><div><div class="mut sm">Relatório diário de obra · ${o.nome}</div><h2 style="margin:2px 0 0;font-size:24px">${r.sem[0].toUpperCase()+r.sem.slice(1)}, ${r.d}/2026</h2></div><span class="sp"></span><span class="pill ok">${icon('check',12)}enviado ao cliente ${r.d} 19h</span></div>
    <div class="g-li">${icon(ic,15)}<div><b>Clima</b> · ${r.clima}</div></div>
    <div class="g-li">${icon('users',15)}<div><b>Efetivo</b> · ${r.ef} pessoas</div></div>
    <div class="g-li">${icon('bricks',15)}<div><b>Resumo</b> · ${r.res}</div></div>
    <div class="row" style="margin-top:18px"><span class="sp"></span><button class="btn" onclick="gRdoPdf('${o.id}',${(RDO[o.id]||[]).indexOf(r)})">${icon('printer',15)}Ver PDF enviado</button></div></div>`;
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
  $('modalBox').style.width='820px';
  $('modalBox').innerHTML = `<div class="row g-noprint" style="margin-bottom:16px"><b>Prévia do PDF</b><span class="mut sm">· formato A4, como o cliente recebe</span><span class="sp"></span><button class="iconbtn" onclick="closeModal()" aria-label="Fechar">${icon('x',18)}</button></div>
  <div class="g-doc" style="border:1px solid var(--line);border-radius:6px;padding:28px 32px">
    <div class="hd"><div><div style="font-size:11px;color:#555">Construtora RZ · Canteiro</div><h1>Relatório Diário de Obra</h1></div><div style="text-align:right">${o.nome}<br>${o.local} · ${r.sem}, ${r.d}/2026</div></div>
    ${full?`<h4>Clima</h4>${r.clima.map(c=>`<div>${c.p}: ${c.t}</div>`).join('')}
    <h4>Efetivo · ${gEf(r)} pessoas</h4><table>${r.efetivo.map(e=>`<tr><td>${e[0]}</td><td>${e[1]}</td><td>${e[2]}</td><td style="text-align:right">${e[3]}</td></tr>`).join('')}</table>
    <h4>Serviços executados</h4>${r.serv.map(s=>`<div>• <b>${s[0]}</b>: ${s[1]}</div>`).join('')}
    <h4>Materiais</h4>${r.mat.map(m=>`<div>• <b>${m[0]}</b>: ${m[1]}</div>`).join('')}
    <h4>Ocorrências</h4>${r.ocorr.map(c=>`<div>• ${c[1]}</div>`).join('')}
    <h4>Registro fotográfico</h4><div class="fts">${r.fotos.map(f=>`<div style="background:linear-gradient(135deg,${f[2]},#2b3330)">${f[0]}</div>`).join('')}</div>`
    :`<h4>Clima</h4><div>${r.clima}</div><h4>Efetivo</h4><div>${r.ef} pessoas</div><h4>Serviços</h4><div>${r.res}</div>`}
    <div class="ass"><div>${o.id==='vila-nova'?'Joana M.':'Ana P.'} · mestre de obras</div><div>Rizzi · gerente da obra</div></div>
    <div style="margin-top:18px;font-size:10.5px;color:#777">Dados registrados pela mestre de obras por WhatsApp (áudio, fotos, chamada) e conferidos pelo gerente. Gerado pelo Canteiro em ${r.d}/2026.</div>
  </div>
  <div class="row g-noprint" style="margin-top:18px"><span class="sp"></span><button class="btn" onclick="closeModal()">Fechar</button><button class="btn amb" onclick="gImprimir()">${icon('printer',15)}Imprimir / salvar PDF</button></div>`;
  $('modal').classList.add('on');
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
function tabMedicoes(o){
  if(o.status==='plan') return gEmBreve(o);
  const C = CONTRATOS[o.id]||[], F = C.filter(c=>!c.orc);
  const tot = k => F.reduce((a,c)=>a+k(c),0);
  const estr = C.find(c=>c.id==='estr');
  const acima = estr ? gPago(estr)-gExeR(estr) : 0;
  return `${val('Medição por % executado de cada empreitada, com retenção de 5% e vales, é como eles pagam hoje? Quem aprova a medição: o gerente, o dono, os dois?')}
  <div class="grid g4">
    <div class="card kpi"><div class="l">Contratado (${F.length} contratos)</div><div class="v">${brl(tot(c=>c.v))}</div><div class="s mut">${C.length>F.length?`+ ${brl(C.filter(c=>c.orc).reduce((a,c)=>a+c.v,0))} a contratar`:'todas as empreitadas fechadas'}</div></div>
    <div class="card kpi"><div class="l">Executado</div><div class="v">${brl(tot(gExeR))}</div><div class="s mut">${gPct(tot(gExeR),tot(c=>c.v))}% do contratado</div></div>
    <div class="card kpi"><div class="l">Pago (medições + vales)</div><div class="v">${brl(tot(gPago))}</div><div class="s" style="color:${tot(gPago)>tot(gExeR)?'var(--red)':'var(--muted)'}">${tot(gPago)>tot(gExeR)?`${brl(tot(gPago)-tot(gExeR))} acima do executado`:'em linha com o executado'}</div></div>
    <div class="card kpi"><div class="l">Retenção 5% guardada</div><div class="v">${brl(F.filter(c=>!c.retSt).reduce((a,c)=>a+gRet(c),0))}</div><div class="s mut">libera na entrega de cada etapa</div></div>
  </div>
  ${estr?`<div class="card alertnote inline" style="margin-top:18px;display:flex;gap:12px;align-items:flex-start">${icon('alert',18)}<div style="flex:1"><b>Equipe Silva · estrutura: pago 75%, executado 62% → ${brl(acima)} acima; segurar o próximo pagamento.</b>
      <div class="sm" style="margin-top:4px">A 3ª medição (30/09) foi paga pelo cronograma, sem conferência em campo, e depois vieram 2 vales. O executado de 62% vem dos RDOs e da conferência da Joana em 27/10. ${estr.hold?'<b>Próximo pagamento segurado</b> até o executado passar de 75%.':''}</div></div>
      ${estr.hold?`<span class="pill bad" style="align-self:center">${icon('pause',12)}segurado</span>`:`<button class="btn" style="align-self:center" onclick="gSegurar('${o.id}')">${icon('pause',15)}Segurar o próximo pagamento</button>`}</div>`:''}
  <div class="card" style="padding:0;margin-top:18px">
    <div class="row" style="padding:16px 20px 12px"><h3 style="margin:0">Contratos de empreitada</h3><span class="sp"></span><button class="btn amb" onclick="gNovaMedicao('${o.id}')">${icon('plus',15)}Nova medição</button></div>
    <div class="g-tw"><table class="sm"><tr><th>Etapa · empreiteiro</th><th class="num">Contratado</th><th style="width:150px">Executado × pago</th><th class="num">Executado</th><th class="num">Pago</th><th class="num">Pago − executado</th><th class="num">Retenção 5%</th><th class="num">Vales</th><th>Situação</th></tr>
    ${C.map(c=>{ if(c.orc) return `<tr><td>${c.etapa}<div class="mut">${c.emp}</div></td><td class="num mut">${brl(c.v)} orçado</td><td colspan="6" class="mut">sem contrato: o agente pode pedir 3 propostas</td><td><button class="btn sm" onclick="registrar('Pediu propostas de empreitada: ${c.etapa}');toast('Pedido de 3 propostas registrado (protótipo)')">Pedir propostas</button></td></tr>`;
      const pg=gPago(c), ex=gExeR(c), d=pg-ex, pp=gPct(pg,c.v);
      return `<tr class="click" onclick="gContrato('${o.id}','${c.id}')"><td><b style="font-weight:500">${c.etapa}</b><div class="mut">${c.emp}</div></td><td class="num">${brl(c.v)}</td>
        <td><div class="bar" style="margin-bottom:4px"><i style="width:${c.exe}%;background:var(--green)"></i></div><div class="bar"><i style="width:${Math.min(100,pp)}%;background:${d>0?'var(--red)':'var(--accentHi)'}"></i></div><div class="mut" style="font-size:11px;margin-top:3px">exec. ${c.exe}% · pago ${pp}%</div></td>
        <td class="num">${brl(ex)}</td><td class="num">${brl(pg)}</td>
        <td class="num" style="color:${d>0?'var(--red)':'var(--faint)'}">${d>0?'+'+brl(d):'—'}${d>0&&c.nota?`<div class="mut" style="font-size:11px;white-space:normal;max-width:150px;margin-left:auto">${c.nota}</div>`:''}</td>
        <td class="num">${c.retSt?`<span class="mut">${brl(gRet(c))}<div style="font-size:11px">${c.retSt}</div></span>`:gRet(c)?brl(gRet(c)):'—'}</td><td class="num">${c.vales?brl(c.vales):'—'}</td>
        <td>${c.hold?`<span class="pill bad">pagamento segurado</span>`:`<span class="pill ${c.exe===100?'ok':c.exe>0?'info':'gray'}">${c.st}</span>`}</td></tr>`;}).join('')}
    </table></div>
    <div class="sm mut" style="padding:10px 20px 16px">Pago = medições aprovadas + vales. De cada medição, 5% fica retido como garantia e só é liberado na entrega da etapa. Clique num contrato para ver o histórico.</div>
  </div>`;
}
function gSegurar(oid){
  const c=CONTRATOS[oid].find(x=>x.id==='estr'); c.hold=true;
  registrar('Segurou o próximo pagamento da Equipe Silva (estrutura) até o executado passar de 75%',{obra:oid});
  gRerender();
  toastDesfazer('Próximo pagamento da Equipe Silva segurado', ()=>{ c.hold=false; });
}
function gContrato(oid,id){
  const c=CONTRATOS[oid].find(x=>x.id===id), pg=gPago(c), ex=gExeR(c);
  $('drawerPane').innerHTML = `<div class="row"><span class="mut sm">Contrato de empreitada</span><span class="sp"></span><button class="iconbtn" onclick="closeDrawer()" aria-label="Fechar">${icon('x',18)}</button></div>
    <h2 style="margin:6px 0 4px">${c.etapa}</h2><div class="mut">${c.emp} · contrato ${brl(c.v)} · preço global</div>
    <div class="grid g3" style="margin:18px 0;gap:10px">
      <div class="card kpi" style="padding:12px 14px"><div class="l">Executado</div><div class="v" style="font-size:22px">${c.exe}%</div><div class="s mut">${brl(ex)}</div></div>
      <div class="card kpi" style="padding:12px 14px"><div class="l">Pago</div><div class="v" style="font-size:22px">${gPct(pg,c.v)}%</div><div class="s mut">${brl(pg)}</div></div>
      <div class="card kpi" style="padding:12px 14px"><div class="l">Retenção 5%</div><div class="v" style="font-size:22px">${brl(gRet(c))}</div><div class="s mut">${c.retSt||'guardada'}</div></div></div>
    <h3 style="font:600 17px var(--serif);margin:22px 0 10px">Histórico</h3>
    ${c.hist.length?`<div class="card" style="padding:0"><table class="sm"><tr><th>Data</th><th>Lançamento</th><th class="num">%</th><th class="num">Valor</th></tr>${c.hist.map(h=>`<tr><td>${h[0]}</td><td>${h[1]}</td><td class="num">${h[3]||'—'}</td><td class="num">${brl(h[2])}</td></tr>`).join('')}</table></div>`:'<p class="mut">Nenhuma medição ainda.</p>'}
    <div class="row" style="margin-top:16px"><button class="btn" onclick="closeDrawer();go('obra','${oid}','diario')">${icon('book',15)}Ver nos diários</button><span class="sp"></span><button class="btn amb" onclick="closeDrawer();gNovaMedicao('${oid}','${c.id}')">Nova medição</button></div>`;
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
tabEquipe = function(o){
  if(o.status==='plan') return gEmBreve(o);
  const e=EQ[o.id], adm=e.adm.reduce((a,x)=>a+x[1],0), med=e.med.reduce((a,x)=>a+x[1],0);
  const vila=o.id==='vila-nova';
  return `${val('A chamada do dia pelo WhatsApp da mestre é confiável? Documentação (ASO, EPI, NR-18) é cobrada pelo gerente ou pelo técnico de segurança?')}
  <div class="grid g4" style="margin-bottom:18px">
    <div class="card kpi"><div class="l">Na obra hoje</div><div class="v">${e.hoje.length} pessoas</div><div class="s mut">chamada às ${e.src.slice(-5)}</div></div>
    <div class="card kpi"><div class="l">Mão de obra em outubro</div><div class="v">${brl(adm+med)}</div><div class="s mut">administração ${brl(adm)} + medições ${brl(med)}</div></div>
    <div class="card kpi"><div class="l">Pendências de documentação</div><div class="v" style="color:${e.docs.some(d=>d[2]==='bad')?'var(--red)':'var(--ink)'}">${e.docs.length}</div><div class="s mut">ASO, EPI, integração NR-18</div></div>
    ${vila?`<div class="card kpi"><div class="l">Vaga aberta</div><div class="v" style="color:var(--red)">2 armadores</div><div class="s" style="color:var(--red)">+8 dias no prazo · desde 01/10</div></div>`
          :`<div class="card kpi"><div class="l">Vagas abertas</div><div class="v">0</div><div class="s mut">obra 6 dias adiantada</div></div>`}
  </div>
  <div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start">
    <div class="card" style="padding:0"><div class="row" style="padding:16px 20px 10px;flex-wrap:wrap"><h3 style="margin:0">Chamada de hoje · 28/10</h3><span class="sp"></span>${gSrc(e.src,'message')}</div>
      <div class="g-tw"><table class="sm"><tr><th>Nome</th><th>Função</th><th>Vínculo</th><th class="num">Chegou</th></tr>
      ${e.hoje.map(p=>`<tr><td><div class="row" style="gap:8px"><div class="av" style="width:26px;height:26px;font-size:10.5px">${p[0].split(' ').map(x=>x[0]).join('').slice(0,2)}</div>${p[0]}</div></td><td>${p[1]}</td><td class="mut">${p[2]}</td><td class="num">${p[3]}</td></tr>`).join('')}
      ${e.fora.map(p=>`<tr><td class="mut"><div class="row" style="gap:8px"><div class="av" style="width:26px;height:26px;font-size:10.5px;background:var(--cream2);color:var(--muted)">${p[0].startsWith('2')?'?':p[0].split(' ').map(x=>x[0]).join('')}</div>${p[0]}</div></td><td class="mut">${p[1]}</td><td colspan="2"><span class="pill ${p[2].startsWith('vaga')?'bad':'gray'}">${p[2]}</span></td></tr>`).join('')}</table></div>
      <div class="sm mut" style="padding:10px 20px 16px">A chamada entra no RDO do dia. <a href="#" style="text-decoration:underline" onclick="go('obra','${o.id}','diario');return false">Ver o diário</a></div></div>
    <div>
      ${vila?`<div class="card alertnote" style="margin-bottom:18px"><h3>${icon('alert',17)}Vaga: 2 armadores na Equipe Silva</h3>
        <p class="sm" style="margin:0 0 12px">Aberta desde 01/10. Sem eles a armação da laje do 2º pav. anda na metade da velocidade: <b>+8 dias</b> no prazo (de 21 dias de atraso previstos). Quem contrata é a Equipe Silva; o agente pode pressionar e sugerir nomes.</p>
        <div class="row" style="flex-wrap:wrap"><button class="btn" onclick="registrar('Cobrou a Equipe Silva pelos 2 armadores',{obra:'vila-nova'});toast('Cobrança enviada ao Antônio Silva pelo WhatsApp (protótipo)')">Cobrar a Equipe Silva</button><button class="btn" onclick="toast('(protótipo) o agente lista armadores que já trabalharam com você')">${icon('spark',14)}Sugerir armadores</button></div></div>`:''}
      <div class="card"><h3>${icon('shield',17)}Documentação</h3>
        ${e.docs.map((d,k)=>`<div class="g-li" style="align-items:flex-start">${icon('file',15)}<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${d[0]}</b><span class="pill ${d[2]}">${d[1]}</span></div><div class="sm mut" style="margin:3px 0 6px">${d[3]}</div>
          <button class="btn sm" onclick="registrar('${d[4]} · ${d[0]}',{obra:'${o.id}'});toast('${d[4]}: registrado (protótipo)')">${d[4]}</button></div></div>`).join('')}
        <p class="sm mut" style="margin:10px 0 0">${icon('checkCircle',13)} ${e.emDia}</p></div>
    </div>
  </div>
  <div class="card" style="margin-top:18px"><h3>Custo de mão de obra em outubro <small>· ${brl(adm+med)}</small></h3>
    <div class="grid g2" style="gap:24px">
      <div><div class="g-sec" style="margin-top:0">Administração própria · ${brl(adm)}/mês</div>${e.adm.map(x=>`<div class="row sm" style="margin:6px 0"><span>${x[0]}</span><span class="sp"></span><b class="num">${brl(x[1])}</b></div>`).join('')}</div>
      <div><div class="g-sec" style="margin-top:0">Medições e vales pagos no mês · ${brl(med)}</div>${e.med.map(x=>`<div class="row sm" style="margin:6px 0"><span>${x[0]}</span><span class="sp"></span><b class="num">${brl(x[1])}</b></div>`).join('')}
        <a class="link sm" href="#" onclick="go('obra','${o.id}','medicoes');return false">Ver medições ${icon('arrowRight',13)}</a></div>
    </div></div>`;
};

/* ===================== NOVA OBRA: 3 CAMINHOS PARA O ORÇAMENTO ===================== */
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
openWizard = function(step){
  const cam = WZ_CAM[wz.caminho] ? wz.caminho : 'pdf', C = WZ_CAM[cam];
  const S=[1,2,3,4].map(n=>`<div class="${n<=step?'on':''}"></div>`).join('');
  let b='';
  if(step===1) b=`<h2 style="margin:0">Nova obra · 1. Projeto</h2><p class="mut sm">Anexe o que tiver: projeto arquitetônico, estrutural, memorial descritivo, planilha do orçamentista, fotos do terreno.</p>
    <div class="drop" onclick="toast('(protótipo) escolher arquivos')">${icon('upload',22)}Arraste PDF, DWG, planilhas, imagens<br><span class="sm">ou <u>escolha arquivos</u></span></div>
    <div style="margin-top:12px"><span class="attach">${icon('file',13)}projeto-arquitetonico.pdf · 22 pág.</span><span class="attach">${icon('file',13)}memorial-descritivo.pdf</span><span class="attach">${icon('file',13)}orcamento-sobrado.xlsx</span></div>
    <label class="l">Nome da obra</label><input class="f" value="Sobrado Jardim Europa">
    <label class="l">Endereço (usado para cotar preços na região)</label><input class="f" value="Rua Holanda, 88 · Jardim Europa · Campinas-SP">`;
  if(step===2) b=`<h2 style="margin:0">2. Descreva a obra</h2><p class="mut sm">Escreva do seu jeito. O agente pergunta o que faltar.</p>
    <textarea class="f" rows="7">Sobrado de 210 m², 3 suítes, laje nos dois pavimentos, telhado aparente com telha cerâmica. Padrão médio-alto: porcelanato 90x90 na área social, esquadrias de alumínio preto. Fundação em estaca (o terreno tem declive de 1,5 m). Quero piscina de 3x6 no fundo. Já tenho a equipe de pedreiros (empreitada), falta elétrica e hidráulica.</textarea>`;
  if(step===3) b=`<h2 style="margin:0">3. Orçamento, prazos e fases</h2>
    <label class="l">De onde vem o orçamento?</label>
    <div class="g-path">${Object.entries(WZ_CAM).map(([k,x])=>`<label class="${k===cam?'on':''}" onclick="wz.caminho='${k}';openWizard(3)"><input type="radio" name="gcam" ${k===cam?'checked':''}><b>${x.t}</b><span class="mut">${x.d}</span><span>${gConf(x.conf)}</span></label>`).join('')}</div>
    <div class="grid g2" style="gap:0 14px"><div><label class="l">Orçamento (verba) total</label><input class="f" value="R$ 780.000"></div><div><label class="l">Margem de segurança</label><select class="f"><option>5%</option><option selected>8%</option><option>10%</option></select></div>
    <div><label class="l">Início</label><input class="f" value="12/01/2027"></div><div><label class="l">Entrega desejada</label><input class="f" value="30/11/2027"></div></div>
    <label class="l">Fases (o agente sugere a partir do projeto; edite à vontade)</label>
    ${['Preliminares e terraplenagem','Fundação (estacas)','Estrutura','Alvenaria','Cobertura','Instalações','Piscina','Acabamento','Entrega'].map(f=>`<span class="attach">${icon('grip',13)}${f}</span>`).join('')}<span class="attach" style="background:none;border:1px dashed #d9d5c9;cursor:pointer" onclick="toast('(protótipo) adicionar fase')">${icon('plus',13)}fase</span>`;
  if(step===4) b=`<h2 style="margin:0">4. O agente está montando o orçamento</h2>
    <div class="row sm mut" style="margin-top:6px;flex-wrap:wrap">Caminho: <b style="color:var(--ink)">${C.t}</b> · ${icon('clock',13)} ${C.tempo}</div>
    <div style="margin:16px 0">${C.passos.map((s,k)=>`<div class="row" style="margin:9px 0;color:${k<C.passos.length-1?'var(--ink2)':'var(--ink)'}"><span style="color:${k<C.passos.length-1?'var(--green)':'var(--accent)'};display:flex">${k<C.passos.length-1?icon('checkCircle',17):icon('loader',17,'spin')}</span>${s}</div>`).join('')}</div>
    <div class="card agentnote inline" style="padding:14px 16px;margin-bottom:14px">${icon('spark',15)}<div><div class="row" style="gap:8px;margin-bottom:4px;flex-wrap:wrap"><b>Prévia: ${C.faixa}</b>${gConf(C.conf)}<span class="sm mut">confiança ${C.conf}</span></div>
      Acima da verba de R$ 780 mil. A piscina e a fundação em estaca pesam mais. Estimativa para decisão: não substitui o orçamento executivo nem a ART.</div></div>
    <div class="card alertnote inline" style="padding:14px 16px;margin-bottom:14px;display:flex;gap:10px">${icon('alert',15)}<div><b>Não consegui medir, confira:</b><ul style="margin:6px 0 0;padding-left:18px">${C.nao.map(n=>`<li>${n}</li>`).join('')}</ul></div></div>
    ${val('Selo de confiança + lista do que não foi medido + tempo honesto: isso faz o gerente confiar mais (ou menos) do que um número único?')}`;
  $('modalBox').innerHTML = `<div class="steps">${S}</div>${b}
    <div class="row" style="margin-top:22px">${step>1?`<button class="btn" onclick="openWizard(${step-1})">${icon('arrowLeft',15)}Voltar</button>`:''}<span class="sp"></span>
    ${step<4?`<button class="btn amb" onclick="openWizard(${step+1})">${step===3?'Gerar orçamento com o agente':'Continuar'} ${icon('arrowRight',15)}</button>`:`<button class="btn amb" onclick="closeModal();go('obra','vila-nova','overview');toast('(protótipo) mostra a Visão geral de uma obra já orçada')">Abrir orçamento completo ${icon('arrowRight',15)}</button>`}</div>`;
  $('modal').classList.add('on');
};
