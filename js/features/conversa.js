/* Agente no centro: as sessões de conversa, as respostas roteirizadas do agente e os 4 cartões.
   Contrato: nota "Agente no centro · contrato". A Casca (core.js) desenha a lista e o campo; daqui saem:
     SESSOES                      [{id, titulo, escopo:'geral'|obraId, quando, msgs:[msg]}]
     renderConversa(sessao)       as mensagens (.msg, filhas diretas de #cvMsgs) · renderMsg(msg): uma mensagem
     responder(texto, sessao)     → Promise<msg[]>; NÃO grava em sessao.msgs (a Casca empurra a do usuário e as devolvidas).
                                  Lê sessao.escopoMsg (@obra) e sessao.contexto ({chave, obra, filtro}, de "Perguntar sobre isto").
     SUGESTOES(sessao)            os chips acima do campo (textos do roteiro, com os números de agora)
   msg = {id, de:'agente'|'voce', hora, html, tools:[...], nivel, cartoes:[html], abrir?:{chave, obra, filtro}}. html e cartoes são getters: são
   relidos a cada render, então a linha aprovada fica no lugar ("Aprovado 08:14 · Desfazer") sem refazer a mensagem.
   Números: todos de data.js / contaDe / pend* / proativo.js (PROPOSTAS, linhaProp, aprovarProp). Nada inventado.
   Usa abrirVisao / novaSessao / trocarEscopo da Casca quando existirem; senão cai no go() antigo. */

/* ===================== MENSAGENS ===================== */
let cvN = 0;
const CV_MSG = {};
const cvHora = () => (typeof hora==='function' ? hora() : new Date().toTimeString().slice(0,5));
function cvMsg(de, {html='', cartoes=[], tools=[], nivel=null, rodape='', hora:h, sessao=null, visao=null}={}){
  const m = {id:'cv'+(++cvN), de, hora:h||cvHora(), tools, nivel, sessaoId:sessao, visao};
  const vivo = v => typeof v==='function' ? v(m) : v;
  Object.defineProperty(m, 'html', {enumerable:true, configurable:true, get:()=>vivo(html)});
  Object.defineProperty(m, 'cartoes', {enumerable:true, configurable:true, get:()=>[].concat(vivo(cartoes)).map(vivo).filter(Boolean)});
  Object.defineProperty(m, 'rodape', {enumerable:true, configurable:true, get:()=>vivo(rodape)});
  CV_MSG[m.id] = m;
  return m;
}
const voce = (t, h) => cvMsg('voce', {html:esc(t), hora:h});

/* ===================== AJUDANTES ===================== */
const cvNorm = t => String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w@\s.,/-]/g,' ').replace(/\s+/g,' ').trim();
const VISAO_NOME = {hoje:'Hoje', componentes:'Falta comprar', kanban:'Pedidos', inventario:'Almoxarifado', entreobras:'Entre obras', overview:'Orçamento',
  medicoes:'Medições', prazos:'Cronograma', diario:'Diário', equipe:'Equipe', estoque:'Estoque entre obras', aprovacoes:'Aprovações'};
const curto = ob => (NOME_OBRA[ob]||ob||'').replace(/^(Casa|Reforma) /,'');
const NIVEL = {consulta:['info','Consulta'], propoe:['pede','Propõe · precisa do seu OK'], documento:['caminho','Gera documento']};
const nivelPill = k => pill(...(NIVEL[k]||NIVEL.consulta));
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const sinal = v => (v>0?'+':v<0?'−':'')+brl(Math.abs(v));
const pctSin = (v, base) => (v>0?'+':v<0?'−':'')+(Math.abs(v)/base*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';

/* Abre a ferramenta como visão ao lado da conversa (Casca); antes dela existir, a tela antiga. */
function cvAbrir(chave, ob, filtro, cheia){
  if(typeof abrirVisao==='function') return abrirVisao(chave, ob||null, {filtro:filtro||'', cheia:!!cheia});
  if(chave==='estoque' || chave==='aprovacoes') return go(chave);
  go('obra', ob||'vila-nova', chave);
  if(filtro && typeof destacarDoc==='function') setTimeout(()=>destacarDoc(filtro), 0);
}
const btnVisao = (chave, ob, filtro, rotulo) => botao(rotulo||`Abrir ${VISAO_NOME[chave]||chave}${ob&&!rotulo?' · '+curto(ob):''}`, `cvAbrir('${chave}',${ob?`'${ob}'`:'null'},'${filtro||''}')`, {sm:true, icone:'arrowRight'});
function cvRepintar(){ typeof repintar==='function' ? repintar() : render(); }

/* Cartão: um nível de caixa só (o fio não tem bolha; o cartão é a caixa). */
function cartao({titulo, sub, nivel, corpo='', rodape='', classe='', icone}){
  return `<article class="cv-cartao ${classe}"><header class="cv-c-h">${icone?`<span class="cv-c-ic">${icon(icone,16)}</span>`:''}<div class="cv-c-t"><h2>${titulo}</h2>${sub?`<div class="cv-c-sub">${sub}</div>`:''}</div>${nivel?nivelPill(nivel):''}</header>
    ${corpo}${rodape?`<footer class="cv-c-f">${rodape}</footer>`:''}</article>`;
}
const tabela = (cab, linhas) => `<div class="cv-tabw"><table class="cv-tab"><thead><tr>${cab.map(c=>`<th${/^#/.test(c)?' class="num"':''}>${c.replace(/^#/,'')}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody></table></div>`;

/* Decisão: as propostas do proativo.js como linhas de decisão (aprovarProp, Ajustar, "Aprovado 08:14 · Desfazer"). */
function cartaoDecisao(ids, {titulo, sub}={}){
  const ps = ids.map(id=>typeof prop==='function'&&prop(id)).filter(Boolean);
  if(!ps.length) return '';
  const abertas = ps.filter(p=>p.st==='pendente'), foco = abertas[0];
  const t = titulo || (abertas.length ? `${abertas.length===1?'Uma decisão':abertas.length+' decisões'} para você` : 'Decidido');
  return cartao({titulo:t, sub:sub||chipFonte({origem:'agente', quem:'nada é feito sem o seu OK'}), nivel:'propoe', classe:'cv-dec',
    corpo:listaDecisoes(ps.map(p=>linhaProp(p,{comObra:new Set(ps.map(x=>x.obra)).size>1, foco:p===foco})))});
}
/* Garante que as propostas do plano de prazo (PROPOSTAS_PRAZO) estejam na fila, como o viraPropostas faz, sem navegar. */
function cvComPlano(){ (typeof PROPOSTAS_PRAZO!=='undefined'?PROPOSTAS_PRAZO:[]).forEach(p=>{ if(!prop(p.id)){ p.st='pendente'; PROPOSTAS.push(p); } }); }

/* ===================== 1. BRIEFING DO DIA (1ª mensagem da Geral) ===================== */
const filaBriefing = () => PROPOSTAS.filter(p=>p.brief&&naFila(p)).sort(porUrg);
function tambemHoje(){
  const lc=OBRAS.find(o=>o.id==='loja-centro'), gp=OBRAS.find(o=>o.id==='galpao'), vn=OBRAS.find(o=>o.id==='vila-nova');
  const ex = typeof pendExecucao==='function' ? pendExecucao(vn) : [];
  const it = [
    `<a href="#" onclick="cvAbrir('hoje','loja-centro');return false"><b>${curto('loja-centro')}</b> ${prazoTxt(lc).toLowerCase()} e ${brl(lc.budget-lc.previsto)} abaixo do orçamento</a>`,
    `<a href="#" onclick="cvAbrir('hoje','galpao');return false"><b>${curto('galpao')}</b> em orçamento${galpaoFaltam()?`, esperando ${galpaoFaltam()>1?'2 respostas suas':'1 resposta sua'}`:', prévia sendo refeita'}</a>`,
    ...ex.map(x=>`<a href="#" onclick="cvAbrir('${x.tela}','vila-nova');return false"><b>${curto('vila-nova')}</b> ${x.txt}</a>`)];
  return `<p class="cv-tambem"><span class="cv-tambem-r">Também hoje</span>${it.join('<span class="cv-sep" aria-hidden="true">·</span>')}</p>`;
}
function msgBriefing(){
  return cvMsg('agente', {hora:'07:00', nivel:'propoe', tools:['pedidos','almoxarifado','medições','previsão do tempo','WhatsApp das obras'],
    html:()=>{ const ab=filaBriefing().filter(p=>p.st==='pendente'), f=ab[0];
      return ab.length ? `Bom dia, Rizzi. <b>${ab.length} ${ab.length>1?'decisões pedem':'decisão pede'} você</b>, na ordem de urgência; a primeira vence ${f.prazo.replace(/^até /,'')}.`
        : `Fila vazia: tudo o que pedia você hoje já foi decidido. O próximo briefing sai amanhã às 7h.`; },
    cartoes:()=>[cartaoDecisao(filaBriefing().map(p=>p.id), {titulo:'Pedem você hoje', sub:chipFonte({origem:'agente', quem:'3 obras, WhatsApp e previsão do tempo', hora:'07:00'})})],
    rodape:()=>tambemHoje()});
}

/* ===================== TEMAS (cada um devolve as mensagens do agente) ===================== */
const semDados = ob => { const o=OBRAS.find(x=>x.id===ob); return !o || o.status==='plan' || !DADOS[ob]; };
function honestoGalpao(){
  return [cvMsg('agente', {nivel:'consulta', tools:['cadastro da obra'], html:`O <b>Galpão Sumaré</b> ainda está em orçamento: não tem almoxarifado, pedidos, equipe nem cronograma para eu consultar.${galpaoFaltam()?` Para fechar o orçamento ${galpaoFaltam()>1?'faltam 2 respostas suas (piso com fibra ou tela; fechamento termoacústico ou simples)':'falta 1 resposta sua'}.`:' As duas respostas do orçamento já estão dadas; a prévia está sendo refeita.'}`,
    cartoes:[cartao({titulo:'Galpão Sumaré · em orçamento', sub:`orçamento-alvo ${brl(2400000)} · prévia R$ 2,51–2,63 mi`, nivel:'consulta', rodape:`${typeof abrirSessao==='function'?botao('Abrir a conversa do orçamento', "abrirSessao('galpao-orc')", {sm:true, icone:'message'}):''}<span class="sp"></span>${btnVisao('hoje','galpao')}`})]})];
}

/* 2. Relatório da fase (documento) */
const CV_REL = {};                                    // enviado ao cliente: {hora}
const ddmm = t => { const m=String(t||'').match(/(\d{1,2})\/(\d{1,2})/); return m ? new Date(2026, +m[2]-1, +m[1]) : null; };
const hojeD = () => new Date(2026, HOJE.m-1, HOJE.d);
const diasAte = d => Math.round((d-hojeD())/864e5);
const SEMANA = ['dom','seg','ter','qua','qui','sex','sáb'];
const dataTxt = d => `${SEMANA[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
const RISCOS_FASE = {'vila-nova':['aco','concreto','bloco','medicao']};
/* O risco dito como risco (a proposta é a resposta a ele); números lidos dos dados. */
const RISCO_TXT = {
  aco:()=>`Aço: Gerdau 9 dias atrasada e sem data; o saldo de ${num(saldoDe('vila-nova','aco'))} kg dá até ~30/10`,
  concreto:()=>`Concretagem da laje com 80% de chuva prevista na qui 05/11`,
  bloco:()=>{ const i=dados('vila-nova').inv.find(x=>x.id==='bloco'); return `Bloco quebrando ${i.quebra.real}% (previsto ${i.quebra.prev}%); o PED-0162 sai 31/10`; },
  medicao:()=>{ const e=EMPREITADAS.find(x=>/Estrutura/.test(x.etapa)); return `${e.equipe}: pago ${e.pago}% × executado ${e.exec}% da estrutura`; },
};
function relDados(ob){
  const o=OBRAS.find(x=>x.id===ob), d=dados(ob), pz=d.prazo;
  const fase = d.fases.find(f=>f.n===pz.faseAtual) || {pct:pz.fasePct};
  const desvios = d.orc.map(r=>({cat:r.cat, dif:r.real-r.prev})).filter(r=>r.dif>0).sort((a,b)=>b.dif-a.dif).slice(0,3);
  const prox = d.lotes.filter(l=>l.col>=1 && !l.conf).map(l=>({l, dt:ddmm(l.eta)})).filter(x=>x.dt && diasAte(x.dt)>=0 && diasAte(x.dt)<=15)
    .map(x=>({dt:x.dt, txt:`${x.l.item} · ${x.l.q}`, doc:x.l.id, est:/remarcad/.test(x.l.eta)?'remarcada':KCOLS[x.l.col].toLowerCase()}));
  const eq = typeof EQ!=='undefined' && EQ[ob];
  (eq?eq.fora:[]).forEach(f=>{ const dt=ddmm(f[2]); if(dt && diasAte(dt)>=0 && diasAte(dt)<=15) prox.push({dt, txt:`${f[0]} · ${f[1].toLowerCase()} começa`, est:'contratado'}); });
  prox.sort((a,b)=>a.dt-b.dt);
  const ids = RISCOS_FASE[ob] || PROPOSTAS.filter(p=>p.obra===ob).map(p=>p.id).slice(0,3);
  const riscos = ids.map(prop).filter(Boolean).map(p=>({txt:RISCO_TXT[p.id]?RISCO_TXT[p.id]():p.tit, ok:p.st!=='pendente', quando:p.quando}));
  (eq?eq.docs:[]).filter(x=>x[2]==='bad').forEach(x=>riscos.push({txt:`${x[0]}: ${x[1]} · não pode trabalhar`, ok:false, bloq:true}));
  riscos.sort((a,b)=>(b.bloq?2:0)-(a.bloq?2:0) || (a.ok?1:0)-(b.ok?1:0));      // bloqueio primeiro; o resolvido por último
  const atrasados = d.lotes.filter(l=>l.late).map(l=>l.id);
  return {o, fase:pz.faseAtual, pct:fase.pct??pz.fasePct, obs:pz.faseObs, causas:pz.causas, recupera:pz.recupera, desvios, prox, riscos, atrasados,
    verba:o.budget, proj:o.previsto, dif:o.previsto-o.budget, gasto:o.gasto, comp:o.comprometido};
}
const relTitulo = r => `Relatório da fase · ${r.fase} ${r.pct}%`;
function relCorpo(r, imp, curto){
  const atr = r.o.atraso, dias = Math.abs(atr);
  const nums = [
    ['Avanço da fase', `${r.pct}%`, r.obs],
    [atr>0?'Atraso previsto':'Adiantada', `${dias} dias`, `entrega ${r.o.previsao} · contrato ${r.o.prazo}`],
    ['Custo projetado', brl(r.proj), `${r.dif>0?'acima':'abaixo'} da verba de ${brl(r.verba)} em ${brl(Math.abs(r.dif))} (${(Math.abs(r.dif)/r.verba*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)`]];
  const tom = (v, ruim) => ruim ? 't-perda' : 't-ok';
  const causas = r.causas.map(c=>`<li><span>${c[0]}</span><span class="cv-c-d">${c[1]}</span><b class="${c[2]>0?'t-perda':'t-ok'}">${c[2]>0?'+':'−'}${Math.abs(c[2])} d</b></li>`).join('');
  const prox = r.prox.length ? r.prox.map(p=>`<li><span class="cv-dt">${dataTxt(p.dt)}</span><span>${p.txt}${p.doc&&!imp?' · '+docRef(p.doc):p.doc?' · '+p.doc:''}</span>${imp?'':pill(p.est==='remarcada'?'pede':'caminho', p.est)}</li>`).join('') : '<li>Nada programado.</li>';
  const rs = curto ? r.riscos.slice(0,3) : r.riscos, resto = r.riscos.length-rs.length;
  const riscos = rs.map(x=>`<li><span>${x.txt}</span>${imp?`<span>${x.ok?'resolvido':'em aberto'}</span>`:x.ok?pill('ok',`resolvido ${x.quando||''}`.trim()):pill(x.bloq?'perda':'pede', x.bloq?'bloqueio':'proposta aguarda seu OK')}</li>`).join('');
  return `<div class="cv-nums">${nums.map(([l,v,s],k)=>`<div><span class="l">${l}</span><span class="v ${k===0?'':tom(0,k===1?atr>0:r.dif>0)}">${v}</span><span class="s">${s}</span></div>`).join('')}</div>
    <section class="cv-sec"><h3>${atr>0?'Por que atrasa':'Por que está adiantada'}</h3><ul class="cv-lista cv-causas">${causas}</ul>
      ${r.recupera?`<p class="cv-nota">Com o plano do cronograma, o atraso cai de ${atr} para ${atr-r.recupera} dias (recupera ${r.recupera}).</p>`:''}</section>
    ${curto?'':`<section class="cv-sec"><h3>Custo: onde passou</h3><ul class="cv-lista">${r.desvios.map(x=>`<li><span>${x.cat}</span><b class="t-perda">+${brl(x.dif)}</b></li>`).join('')||'<li>Nenhuma etapa acima do previsto.</li>'}</ul>
      <p class="cv-nota">Gasto ${brl(r.gasto)} · comprometido ${brl(r.comp)} · projeção ${brl(r.proj)}.</p></section>`}
    <section class="cv-sec"><h3>Próximos 15 dias</h3><ul class="cv-lista">${prox}</ul></section>
    <section class="cv-sec"><h3>Riscos</h3><ul class="cv-lista">${riscos||'<li>Nenhum risco aberto.</li>'}</ul>${resto>0?`<p class="cv-nota">e mais ${resto} no relatório completo (Abrir).</p>`:''}</section>`;
}
function relAcoes(ob){
  const e=CV_REL[ob];
  return `${botao('Abrir', `cvRelAbrir('${ob}')`, {sm:true, icone:'file'})}${botao('PDF', `cvRelPdf('${ob}')`, {sm:true, icone:'printer'})}<span class="sp"></span>${e
    ? `<span class="ld-feito">${icon('check',14)}Enviado ao cliente ${e.hora} · <button type="button" onclick="cvRelDesfazer('${ob}')">Desfazer</button></span>`
    : botao('Enviar ao cliente', `cvRelEnviar('${ob}')`, {pri:true, sm:true})}`;
}
const cartaoRelatorio = ob => () => { const r=relDados(ob);
  return cartao({titulo:relTitulo(r), sub:`${r.o.nome} · ${HOJE.d}/${HOJE.m}/2026 · ${chipFonte({origem:'agente', quem:'cronograma, custos, diário e equipe'})}`, nivel:'documento', icone:'file', classe:'cv-doc',
    corpo:relCorpo(r, false, true), rodape:relAcoes(ob)}); };
function cvRelAbrir(ob){
  const r=relDados(ob);
  abrirModal(`<h2>${relTitulo(r)}</h2><p class="mut sm" style="margin:-4px 0 16px">${r.o.nome} · ${r.o.tipo} · gerado pelo agente em ${HOJE.d}/${HOJE.m}/2026</p>
    <div class="cv-doc-modal">${relCorpo(r)}</div>
    <div class="row" style="margin-top:20px">${botao('Ver o cronograma', `closeModal();cvAbrir('prazos','${ob}')`)}<span class="sp"></span>${botao('PDF', `cvRelPdf('${ob}')`, {icone:'printer'})}${CV_REL[ob]?pill('ok',`enviado ${CV_REL[ob].hora}`):botao('Enviar ao cliente', `closeModal();cvRelEnviar('${ob}')`, {pri:true})}</div>`);
  $('modalBox').style.width='760px';
}
function cvRelPdf(ob){
  const r=relDados(ob);
  abrirModal(`<h2>Prévia do PDF</h2><p class="mut sm g-noprint" style="margin:-4px 0 16px">Formato A4, como o cliente recebe.</p>
  <div class="g-doc cv-pdf"><div class="hd"><div><div style="font-size:12px;color:#555">Construtora RZ · Canteiro</div><div class="tit">${relTitulo(r)}</div></div><div style="text-align:right">${r.o.nome}<br>${r.o.local} · ${HOJE.d}/${HOJE.m}/2026</div></div>
    ${relCorpo(r, true)}
    <div class="ass"><div>${r.o.mestre} · mestre de obras</div><div>Rizzi · gerente da obra</div></div>
    <div class="rod">Montado pelo Canteiro a partir do cronograma, do orçamento, do diário (RDO) e da chamada da equipe. Conferido pelo gerente.</div></div>
  <div class="row g-noprint" style="margin-top:18px"><span class="sp"></span>${botao('Fechar','closeModal()')}${botao('Imprimir / salvar PDF', typeof gImprimir==='function'?'gImprimir()':'window.print()', {pri:true, icone:'printer'})}</div>`);
  $('modalBox').style.width='820px';
}
function cvRelEnviar(ob){
  if(CV_REL[ob]) return;
  const r=relDados(ob); CV_REL[ob]={hora:cvHora()};
  registrar(`${relTitulo(r)} enviado ao cliente (PDF) · ${r.o.nome}`, {obra:ob, origem:'agente'});
  cvRepintar();
  toastDesfazer(`${relTitulo(r)} enviado ao cliente`, ()=>{ delete CV_REL[ob]; });
}
function cvRelDesfazer(ob){ if(!CV_REL[ob]) return; delete CV_REL[ob]; registrar(`Desfez: envio do relatório da fase ao cliente`, {obra:ob}); toast('Desfeito'); cvRepintar(); }

/* Escopo: "Quer continuar numa sessão só da Vila Nova?" */
function cartaoEscopo(m){
  const nome=NOME_OBRA[m.obra];
  if(m.escolha==='sim') return `<p class="cv-escolha">${icon('check',14)}Seguimos na sessão <a href="#" onclick="${typeof abrirSessao==='function'?`abrirSessao('${m.destino}')`:`location.hash='#c/${m.destino}'`};return false">${esc(m.tituloSessao)}</a>, só com os dados da ${nome}.</p>`;
  if(m.escolha==='aqui') return `<p class="cv-escolha">${icon('check',14)}Seguimos aqui na Geral; use @${curto(m.obra)} para falar só dela.</p>`;
  return `<div class="cv-cartao cv-escopocard"><span class="cv-c-ic">${icon('building',16)}</span><div class="cv-c-t"><b>Quer continuar numa sessão só da ${nome}?</b><div class="cv-c-sub">As próximas respostas usam só os dados desta obra; a Geral fica com o briefing.</div></div>
    <div class="cv-escopo-a">${botao('Seguir aqui', `cvEscopo('${m.id}','aqui')`, {sm:true})}${botao('Sim, abrir a sessão', `cvEscopo('${m.id}','sim')`, {sm:true, pri:true})}</div></div>`;
}
function cvEscopo(id, escolha){
  const m=CV_MSG[id]; if(!m || m.escolha) return;
  m.escolha=escolha;
  if(escolha==='sim'){
    const s0=SESSOES.find(s=>s.id===m.sessaoId), sozinha = s0 && s0.id!=='geral' && s0.escopo==='geral' && s0.msgs.filter(x=>x.de==='voce').length<=1;
    if(sozinha){ typeof trocarEscopo==='function' ? trocarEscopo(s0.id, m.obra) : (s0.escopo=m.obra); m.destino=s0.id; return cvRepintar(); }
    const casca = typeof novaSessao==='function';
    let id2 = casca ? novaSessao(m.obra, m.tituloSessao) : null;   // a Casca navega e desenha no próximo microtask
    let s = id2 && SESSOES.find(x=>x.id===id2);
    if(!s){ s={id:id2||('s'+Date.now().toString(36)), titulo:m.tituloSessao, escopo:m.obra, quando:'agora', msgs:[]}; SESSOES.unshift(s); id2=s.id; }
    if(!s.msgs.length) s.msgs.push(...m.levar);
    m.destino=id2;
    if(!casca) render();
    return;
  }
  cvRepintar();
}

/* 3. Bloco: para onde foi */
function temaBloco(){
  const ob='vila-nova', i=dados(ob).inv.find(x=>x.id==='bloco'), mv=dados(ob).mov.bloco||[];
  const ent=mv.filter(x=>x.q>0).reduce((a,x)=>a+x.q,0), ass=mv.filter(x=>x.t==='Saída').reduce((a,x)=>a-x.q,0), qb=mv.filter(x=>x.t==='Quebra').reduce((a,x)=>a-x.q,0);
  const sai=ass+qb, saldo=i.ent-i.sai, tx=pct(qb,sai), prev=(i.quebra||{}).prev||5, p162=LOTES.find(l=>l.id==='PED-0162');
  const nSai = mv.filter(x=>x.t==='Saída').length;
  const linhas = [`<tr><td>Assentados na alvenaria do térreo <span class="mut">· ${nSai} saídas</span></td><td class="num">${num(ass)}</td></tr>`,
    ...mv.filter(x=>x.t==='Quebra').map(x=>`<tr><td>${x.onde} <span class="mut">· ${x.d}</span></td><td class="num t-perda">${num(-x.q)}</td></tr>`)];
  return [cvMsg('agente', {nivel:'consulta', tools:['almoxarifado · bloco 14×19×29','movimentações'], visao:{chave:'inventario', obra:ob, filtro:'bloco'},
    html:`Entraram <b>${num(ent)}</b> (${docRef('PED-0149')}, 20/10, descarregados sem palete) e saíram <b>${num(sai)}</b>: ${num(ass)} assentados e <b>${num(qb)} quebrados</b>. A quebra está em <b>${tx}%</b>, contra ${prev}% previsto.`,
    cartoes:[cartao({titulo:`Bloco 14×19×29 · saldo ${num(saldo)} un`, sub:`entrou ${num(ent)} − saiu ${num(sai)} = ${num(saldo)} · ${chipFonte({origem:'whatsapp', quem:'Joana M.'})}`, nivel:'consulta',
        corpo:tabela(['Para onde foi','#Qtd'], [...linhas, `<tr class="cv-tot"><td>Saldo no almoxarifado</td><td class="num">${num(saldo)}</td></tr>`]),
        rodape:`<span class="cv-f-txt">Assentados batem com a alvenaria; o que não bate é a quebra (${tx}% × ${prev}%).</span><span class="sp"></span>${btnVisao('inventario', ob, 'bloco', 'Ver almoxarifado')}`}),
      cartaoDecisao(['bloco'], {titulo:`Próximo lote: ${p162?num(p162.qn):'9.000'} blocos saem 31/10`})]})];
}

/* Insumo qualquer: a conta e onde ver */
const INSUMO_RE = [[/bloco/,'bloco'],[/cimento/,'cim'],[/\baco\b|ferro|vergalh|ca-?50/,'aco'],[/areia/,'areia'],[/brita/,'brita'],[/parafuso/,'paraf'],[/telha/,'telha'],[/\bcabo|\bfio\b/,'fio'],[/concreto/,'concreto'],[/prego/,'prego'],[/porcelanato/,'porc'],[/rejunte/,'rejunte'],[/argamassa/,'arg'],[/tinta/,'tinta'],[/luminaria|\bled\b/,'led']];
const insumoNoTexto = t => (INSUMO_RE.find(([re])=>re.test(t))||[])[1];
function temaCompra(ob, inv, t=''){
  const k=contaDe(ob, inv), comp=dados(ob).comp.find(c=>(c.inv||c.id)===inv);
  const q=+((t.match(/(\d[\d.]*)\s*(kg|m3|m³|sc|sacos?|un|unidades|rolos?|latas?|blocos?|m2|m²)?/)||[])[1]||'').replace(/\./g,'');
  const nota = q && q!==k.comprar ? ` Você pediu ${num(q)}; a conta dá <b>${num(k.comprar)} ${k.un}</b>, e é isso que eu proporia. No pedido você muda a quantidade.` : '';
  const corpo=`<div class="cv-c-b">${linhaConta({...k, fonte:{origem:'tela', quem:'almoxarifado e pedidos'}})}</div>`;
  const acao = k.comprar>0 && comp ? botao(`Montar pedido de ${num(k.comprar)} ${k.un}`, `openCheckout(['${comp.id}'],{obra:'${ob}'})`, {pri:true, sm:true})
    : k.cot ? `<span class="cv-f-txt">Já está em cotação: ${docRef(k.cot.id)}</span>` : `<span class="cv-f-txt">A conta não pede compra agora.</span>`;
  return [cvMsg('agente', {nivel:k.comprar>0?'propoe':'consulta', tools:['almoxarifado','pedidos','cotações'],
    html: k.comprar>0 ? `Pela conta faltam <b>${num(k.comprar)} ${k.un}</b> de ${k.nome.toLowerCase()} na ${curto(ob)}. Monto o pedido com o fornecedor recomendado; nada é enviado sem o seu OK.${nota}`
      : `Não precisa comprar ${k.nome.toLowerCase()} agora na ${curto(ob)}: o saldo, o que está a caminho e o que está em cotação cobrem o que a obra ainda vai usar.`,
    cartoes:[cartao({titulo:k.nome, sub:NOME_OBRA[ob], nivel:k.comprar>0?'propoe':'consulta', corpo, rodape:`${acao}<span class="sp"></span>${btnVisao('componentes', ob, k.nome.split(' ')[0])}`})]})];
}

/* 5. Pedir o aço (Propõe) */
function temaPedirAco(t){
  const p=prop('aco'), k=contaComLote('vila-nova','aco','PED-0167'), q=+((t.match(/(\d[\d.]*)\s*(kg|quilo)/)||[])[1]||'').replace(/\./g,'');
  const nota = q && q!==k.comprar ? ` Você pediu ${num(q)} kg; a conta dá <b>${num(k.comprar)} kg</b>. Proponho ${num(k.comprar)}; em Ajustar você muda a quantidade.` : '';
  return [cvMsg('agente', {nivel:'propoe', tools:['almoxarifado · aço CA-50','pedidos · PED-0158 e PED-0167','cotações'],
    html:()=> p.st==='pendente'
      ? `A Gerdau (${docRef('PED-0158')}) está 9 dias atrasada e sem data, e o saldo de ${num(saldoDe('vila-nova','aco'))} kg só dá até ~30/10. Deixei o ${docRef('PED-0167')} pronto: <b>${num(k.comprar)} kg na Aço Forte</b>, chega em 2 dias. Só envio com o seu OK.${nota}`
      : `O pedido de 600 kg na Aço Forte já foi aprovado às ${p.quando}. Se quiser voltar atrás, use Desfazer na linha.`,
    cartoes:[cartaoDecisao(['aco'])]})];
}
/* 5. Transferir o cimento da Loja Centro (Propõe) */
function temaCimento(){
  const k=contaDe('vila-nova','cim'), tr=k.tr;
  return [cvMsg('agente', {nivel:'propoe', tools:['almoxarifado · Vila Nova','almoxarifado · Loja Centro','estoque entre obras'],
    html:`Na Vila Nova faltam <b>${num(k.faltaSemTransf)} sc</b> mesmo contando os ${num(k.aCaminho)} a caminho (${docRef('PED-0160')}). A Loja Centro ${tr?`pode ceder <b>${num(tr.sug)} sc</b> a preço de custo (vencem em 25 dias e lá só usam ${num(tr.usar)})`:'já cedeu o que podia'}; o resto eu compro. A Ana P. também confirma a saída.`,
    cartoes:[cartaoDecisao(['cimento']), `<div class="cv-acoes">${btnVisao('entreobras','vila-nova','cimento','Ver estoque entre obras')}</div>`]})];
}

/* 4. O que chega amanhã */
function temaChega(ob){
  const obras = ob ? [ob] : OBRAS.filter(o=>!semDados(o.id)).map(o=>o.id);
  const L = obras.flatMap(o=>dados(o).lotes.filter(l=>l.col>=1 && !l.conf).map(l=>({l, ob:o, dt:ddmm(l.eta)})));
  const am = L.filter(x=>x.dt && diasAte(x.dt)===1), prox = L.filter(x=>x.dt && diasAte(x.dt)>1 && diasAte(x.dt)<=10).sort((a,b)=>a.dt-b.dt), late = L.filter(x=>x.l.late);
  const amanha = new Date(2026, HOJE.m-1, HOJE.d+1);
  const linha = (x, quando, tom) => `<tr><td>${quando}</td><td>${docRef(x.l.id)}</td><td>${x.l.item} · ${x.l.q}</td>${ob?'':`<td>${curto(x.ob)}</td>`}<td>${pill(tom, tom==='perda'?'atrasado':/remarcad/.test(x.l.eta)?'remarcada':KCOLS[x.l.col].toLowerCase())}</td></tr>`;
  const linhas = [...am.map(x=>linha(x,'amanhã','caminho')), ...prox.map(x=>linha(x, dataTxt(x.dt), 'caminho')), ...late.map(x=>linha(x,'sem data','perda'))];
  const onde = ob ? `na ${curto(ob)}` : 'nas obras';
  const nAm = am.length ? `Amanhã (${dataTxt(amanha)}) chega${am.length>1?'m':''} <b>${am.map(x=>`${x.l.item.split(' ')[0].toLowerCase()} (${x.l.q}${ob?'':', '+curto(x.ob)})`).join(' e ')}</b>.` : `Amanhã (${dataTxt(amanha)}) não chega nada ${onde}.`;
  const prox1 = prox[0] ? ` Depois, ${dataTxt(prox[0].dt)}: ${prox[0].l.item.split(' ')[0].toLowerCase()} (${prox[0].l.q}).` : '';
  return [cvMsg('agente', {nivel:'consulta', tools:['pedidos','prazos dos fornecedores'], visao:{chave:'kanban', obra:(am[0]||prox[0]||{}).ob||obras[0]},
    html:`${nAm}${prox1}${late.length?` E o ${docRef(late[0].l.id)} da Gerdau segue sem data.`:''}`,
    cartoes:[cartao({titulo:`Entregas ${onde} · próximos 10 dias`, sub:chipFonte({origem:'tela', quem:'Pedidos'}), nivel:'consulta',
      corpo:linhas.length?tabela(['Quando','Pedido','Item',...(ob?[]:['Obra']),'Estado'], linhas):'<div class="cv-c-b mut">Nenhum pedido a caminho.</div>',
      rodape:`<span class="sp"></span>${obras.filter(o=>L.some(x=>x.ob===o)).map(o=>btnVisao('kanban', o, '', obras.length>1?`Pedidos · ${curto(o)}`:'Abrir Pedidos')).join('')}`})]})];
}

/* 4. Quem está na obra hoje */
function temaEquipe(ob){
  const obras = ob ? [ob] : OBRAS.filter(o=>!semDados(o.id)).map(o=>o.id);
  const cards = obras.filter(o=>typeof EQ!=='undefined' && EQ[o]).map(o=>{
    const e=EQ[o], bloq=new Map(e.docs.filter(x=>x[2]==='bad').map(x=>[x[0],x[1]]));
    const linhas = e.hoje.map(p=>`<tr${bloq.has(p[0])?' class="cv-perda"':''}><td><b class="cv-nm">${p[0]}</b>${bloq.has(p[0])?' '+pill('perda',`${bloq.get(p[0])} · não pode trabalhar`):''}</td><td>${p[1]}</td><td class="num">${p[3]}</td></tr>`);
    const fora = e.fora.length ? `<p class="cv-nota cv-c-b">Fora hoje: ${e.fora.map(f=>`${f[0]} (${f[2]})`).join(' · ')}</p>` : '';
    const cob = typeof gCobrado!=='undefined' && gCobrado[o];
    const dec = bloq.size && typeof gCobrarSilva==='function' ? listaDecisoes([linhaDecisao({prazo:'até sexta', tom:'perda', titulo:'Cobrar a Equipe Silva: ASO do Rafael e os 2 armadores', conta:'Uma mensagem só pelo WhatsApp; sem ASO válido ele não pode trabalhar (NR-7)',
      acao:{label:'Cobrar a Equipe Silva', onclick:`gCobrarSilva('${o}')`}, foco:true, estado:cob?{feito:'Cobrada', hora:cob, quem:'Rizzi'}:'pendente'})]) : '';
    return cartao({titulo:`${curto(o)} · ${e.hoje.length} na obra`, sub:chipFonte({origem:'whatsapp', quem:'chamada da '+(OBRAS.find(x=>x.id===o)||{}).mestre, hora:(e.src.match(/\d{2}h\d{2}/)||[''])[0]}), nivel:bloq.size?'propoe':'consulta',
      corpo:tabela(['Quem','Função','#Chegou'], linhas)+fora+dec, rodape:`<span class="sp"></span>${btnVisao('equipe', o, bloq.size?[...bloq.keys()][0]:'')}`});
  });
  const vn = obras.includes('vila-nova') && EQ['vila-nova'];
  return [cvMsg('agente', {nivel:'consulta', tools:['chamada do WhatsApp','equipe','documentos NR'], visao:{chave:'equipe', obra:obras[0], filtro:vn?'Rafael S.':''},
    html: obras.length>1 ? `Hoje estão <b>${obras.map(o=>`${EQ[o].hoje.length} na ${curto(o)}`).join(' e ')}</b>, pela chamada das mestres.${vn?' Um ponto: o Rafael S. está com o ASO vencido e não pode trabalhar.':''}`
      : `Estão <b>${EQ[obras[0]].hoje.length} pessoas</b> na ${curto(obras[0])} hoje, pela ${EQ[obras[0]].src.replace(/^da /,'')}.${vn?' O Rafael S. está com o ASO vencido: sem ele válido, não pode trabalhar.':''}`,
    cartoes:cards})];
}

/* 4. Estamos no prazo? */
function temaPrazo(ob, m0){
  const obras = ob ? [OBRAS.find(o=>o.id===ob)] : OBRAS;
  const linhas = obras.map(o=>`<tr><td><b class="cv-nm">${o.nome}</b></td><td>${o.status==='plan'?'—':o.previsao}</td><td>${o.prazo}</td><td>${o.status==='plan'?pill('info','em orçamento'):pill(o.atraso>0?'perda':'ok', prazoTxt(o))}</td></tr>`);
  const vn = obras.find(o=>o.id==='vila-nova'), lc = obras.find(o=>o.id==='loja-centro');
  const pz = vn ? PRAZO_VN : lc ? PRAZO_LC : null;
  const causas = pz ? `<section class="cv-sec cv-c-b"><h3>${vn?'Por que a Vila Nova atrasa':'Por que a Loja Centro está adiantada'}</h3><ul class="cv-lista cv-causas">${pz.causas.map(c=>`<li><span>${c[0]}</span><span class="cv-c-d">${c[1]}</span><b class="${c[2]>0?'t-perda':'t-ok'}">${c[2]>0?'+':'−'}${Math.abs(c[2])} d</b></li>`).join('')}</ul></section>` : '';
  const txt = vn ? `A <b>Vila Nova</b> não: entrega prevista em ${vn.previsao}, <b>${vn.atraso} dias</b> depois do contrato. O plano recupera ${PRAZO_VN.recupera} (fica em ${vn.atraso-PRAZO_VN.recupera}).${!ob&&lc?` A Loja Centro está ${prazoTxt(lc).toLowerCase()}.`:''}`
    : lc ? `Sim: a Loja Centro está <b>${prazoTxt(lc).toLowerCase()}</b>, entrega prevista em ${lc.previsao} contra ${lc.prazo}.` : `O Galpão ainda não tem cronograma: está em orçamento.`;
  return [cvMsg('agente', {nivel:vn?'propoe':'consulta', tools:['cronograma','pedidos em trânsito','equipe alocada','previsão do tempo'], html:txt, visao:{chave:'prazos', obra:(vn||lc||{}).id||'vila-nova'},
    cartoes:m=>[cartao({titulo:'Prazo das obras', sub:chipFonte({origem:'tela', quem:'Cronograma'}), nivel:'consulta', corpo:tabela(['Obra','Previsão','Contrato','Situação'], linhas)+causas,
        rodape:`${vn&&!m.plano?botao(`Ver o plano de ${PRAZO_VN.recupera} dias como decisões`, `cvPlano('${m.id}')`, {sm:true, icone:'list'}):''}<span class="sp"></span>${obras.filter(o=>o.status!=='plan').map(o=>btnVisao('prazos', o.id, '', obras.length>1?`Cronograma · ${curto(o.id)}`:'Abrir Cronograma')).join('')}`}),
      m.plano ? cartaoDecisao(['aco','armadores','telhas','concreto'], {titulo:`Plano: o atraso cai de ${vn.atraso} para ${vn.atraso-PRAZO_VN.recupera} dias`}) : '']})];
}
function cvPlano(id){ const m=CV_MSG[id]; if(!m) return; cvComPlano(); m.plano=true; cvRepintar(); }

/* 4. O que sobra (estoque entre obras) */
function temaSobra(ob){
  recalcTransf();
  const ts = TRANSF.filter(t=>(!ob||t.origem===ob) && t.max>0);
  const linhas = ts.map(t=>`<tr><td>${t.item}</td><td class="num">${num(t.saldo)} ${t.un}</td><td class="num">${num(t.usar)}</td><td class="num"><b>${num(t.max)}</b></td><td>${curto(t.destino)}${t.falta>0?` · falta ${num(t.falta)}`:''}</td></tr>`);
  const porc = (!ob||ob==='loja-centro') && dados('loja-centro').inv.find(i=>i.id==='porc');
  if(porc) linhas.push(`<tr><td>${porc.nome}</td><td class="num">${num(porc.ent-porc.sai)} m²</td><td class="num">0</td><td class="num"><b>${num(porc.ent-porc.sai)}</b></td><td>reposição na garantia</td></tr>`);
  const props = ['cimento','porcelanato'].filter(id=>{ const p=prop(id); return p && (!ob||p.obra===ob||id==='cimento'&&ob==='loja-centro'); });
  const par = TRANSF.find(t=>t.inv==='paraf' && (!ob||t.origem===ob) && t.sug>0);
  const dec = listaDecisoes([...props.map(id=>linhaProp(prop(id),{comObra:false, foco:id===props[0]&&prop(id).st==='pendente'})),
    ...(par?[linhaDecisao({prazo:'hoje', tom:'caminho', titulo:`Transferir ${num(par.sug)} parafusos para a ${curto(par.destino)}`, conta:`a preço de custo, R$ ${String(par.custo).replace('.',',')}/un · chega hoje, contra ${par.dias} dias da compra`, valor:brl(par.sug*par.custo), acao:{label:`Transferir ${num(par.sug)}`, onclick:`openTransfer('paraf')`}})]:[])]);
  const nome = ob ? curto(ob) : 'as obras';
  return [cvMsg('agente', {nivel:'propoe', tools:[`almoxarifado · ${ob?curto(ob):'todas as obras'}`,'estoque entre obras'], visao:ob?{chave:'entreobras', obra:ob}:{chave:'estoque', obra:null},
    html: ts.length||porc ? `Sobra${ob?` na ${nome}`:' entre as obras'}: ${[...ts.map(t=>`<b>${num(t.max)} ${t.un}</b> de ${t.item.split(' ')[0].toLowerCase()}`), ...(porc?[`<b>${num(porc.ent-porc.sai)} m²</b> de porcelanato`]:[])].join(', ')}. O que sai é o saldo menos o que a obra ainda usa e uma reserva; vai a preço de custo do lote original.`
      : `Nada sobra${ob?` na ${nome}`:''} agora além da reserva.`,
    cartoes:[cartao({titulo:`O que pode sair${ob?' da '+nome:''}`, sub:chipFonte({origem:'tela', quem:'almoxarifado das duas obras'}), nivel:'consulta',
      corpo:tabela(['Item','#Saldo','#Ainda usa','#Pode sair','Para'], linhas), rodape:`<span class="sp"></span>${btnVisao('entreobras', ob||'vila-nova', '', 'Ver estoque entre obras')}`}),
      props.length||par ? cartao({titulo:'Para decidir', nivel:'propoe', classe:'cv-dec', corpo:dec}) : '']})];
}

/* Propostas avulsas: concretagem, aço (consulta), areia, medição */
function temaProp(id, html, tools, visao){
  const p=prop(id); if(!p) return null;
  return [cvMsg('agente', {nivel:'propoe', tools, html:()=>p.st==='pendente'?html:`${html} <span class="mut">(já decidido às ${p.quando}.)</span>`,
    cartoes:[cartaoDecisao([id]), visao?`<div class="cv-acoes">${btnVisao(visao[0], p.obra, visao[1]||'')}</div>`:'']})];
}
const temaConcreto = () => temaProp('concreto', `A previsão para <b>qui 05/11</b> é de <b>80% de chuva</b>. A concretagem da laje do 2º pav. (${docRef('PED-0166')}, 38 m³ + bomba) está marcada para as 07h; a Concrecamp tem vaga na sexta, mesmo preço.`, ['previsão do tempo','PED-0166 · Concrecamp','cronograma'], ['prazos']);
function temaAco(){
  const l=LOTES.find(x=>x.id==='PED-0158');
  return temaProp('aco', `Ainda não há data. O ${docRef('PED-0158')} (${l.q}, ${brl(l.v)}) está <b>9 dias atrasado</b>, sem nova data desde 24/10. O saldo de <b>${num(saldoDe('vila-nova','aco'))} kg</b> dá até ~30/10.`, ['pedidos · PED-0158','e-mail do fornecedor','almoxarifado'], ['kanban','PED-0158']);
}
const temaAreia = () => temaProp('areia', `A NF do ${docRef('PED-0157')} diz <b>40 m³</b>; a Joana mediu <b>36 m³</b> na caçamba. São 4 m³ × R$ 118 = <b>R$ 472</b> a abater do boleto.`, ['NF-e','WhatsApp da Joana','pedidos'], ['kanban','PED-0157']);
function temaMedicao(){
  const e=EMPREITADAS.find(x=>/Estrutura/.test(x.etapa)), acima=Math.round((e.pago-e.exec)/100*e.valor);
  return temaProp('medicao', `Estrutura da ${e.equipe} (${brl(e.valor)}): executado <b>${e.exec}%</b>, pago <b>${e.pago}%</b> (${brl(e.valor*e.pago/100)}). São <b>${brl(acima)}</b> pagos acima do serviço feito.`, ['medições','contratos de empreitada','diário'], ['medicoes']);
}

/* Orçamento */
function temaOrcamento(ob){
  const obras = (ob ? [OBRAS.find(o=>o.id===ob)] : OBRAS);
  const linhas = obras.map(o=>o.status==='plan' ? `<tr><td><b class="cv-nm">${o.nome}</b></td><td class="num">${brl(o.budget)}</td><td class="num">—</td><td>${pill('info','em orçamento')}</td></tr>`
    : `<tr><td><b class="cv-nm">${o.nome}</b></td><td class="num">${brl(o.budget)}</td><td class="num">${brl(o.previsto)}</td><td>${pill(o.previsto>o.budget?'pede':'ok', `${sinal(o.previsto-o.budget)} (${pctSin(o.previsto-o.budget, o.budget)})`)}</td></tr>`);
  const pior = obras.filter(o=>o.status!=='plan').sort((a,b)=>(b.previsto-b.budget)/b.budget-(a.previsto-a.budget)/a.budget)[0];
  const r = pior && relDados(pior.id);
  return [cvMsg('agente', {nivel:'consulta', tools:['orçamento','medições','pedidos'],
    html: pior ? `${obras.length>1?'A mais acima é a':'A'} <b>${pior.nome}</b>: projeção de ${brl(pior.previsto)} contra verba de ${brl(pior.budget)} (${sinal(pior.previsto-pior.budget)}).${r.desvios[0]?` O maior desvio é ${r.desvios[0].cat.split(' · ')[0].toLowerCase()} (+${brl(r.desvios[0].dif)}).`:''}` : 'O Galpão ainda está em orçamento.',
    cartoes:[cartao({titulo:'Verba × projeção', sub:chipFonte({origem:'tela', quem:'Orçamento'}), nivel:'consulta', corpo:tabela(['Obra','#Verba','#Projeção','Diferença'], linhas),
      rodape:`<span class="sp"></span>${pior?btnVisao('overview', pior.id):''}`})]})];
}

/* Falta comprar */
function temaFalta(ob){
  const its = dados(ob).inv.map(i=>({i, k:contaDe(ob,i.id)})).filter(x=>x.k.comprar>0);
  return [cvMsg('agente', {nivel:'consulta', tools:['almoxarifado','pedidos','cotações'],
    html: its.length ? `Na ${curto(ob)} faltam comprar <b>${its.length} ${its.length>1?'insumos':'insumo'}</b>, já descontando saldo, o que está a caminho, em cotação e as transferências sugeridas.` : `Na ${curto(ob)} não falta comprar nada agora: o que está a caminho e em cotação cobre a obra.`,
    cartoes:[cartao({titulo:`Falta comprar · ${curto(ob)}`, nivel:'consulta', corpo:its.length?tabela(['Insumo','#Falta','Dura'], its.map(x=>`<tr><td>${x.i.nome}</td><td class="num"><b>${num(x.k.comprar)} ${x.k.un}</b></td><td>${x.i.cob}</td></tr>`)):'',
      rodape:`<span class="sp"></span>${btnVisao('componentes', ob)}`})]})];
}

/* Almoxarifado: o que acaba primeiro */
function temaAlmox(ob){
  const its = dados(ob).inv.map(i=>({i, d:duraDias(i)})).filter(x=>x.d!=null && x.d<=10).sort((a,b)=>a.d-b.d);
  return [cvMsg('agente', {nivel:'consulta', tools:['almoxarifado','movimentações'],
    html: its.length ? `Na ${curto(ob)}, <b>${its.length} ${its.length>1?'itens acabam':'item acaba'} em até 10 dias</b>; o primeiro é ${its[0].i.nome.split(' ')[0].toLowerCase()} (${its[0].i.cob}).` : `Na ${curto(ob)} nada acaba nos próximos 10 dias.`,
    cartoes:[cartao({titulo:`Almoxarifado · ${curto(ob)}`, sub:`${dados(ob).itensAlmox} itens · ${brl(dados(ob).valorEstoque)} em estoque`, nivel:'consulta',
      corpo:its.length?tabela(['Item','#Saldo','Dura'], its.map(x=>`<tr><td>${x.i.nome}</td><td class="num">${num(x.i.ent-x.i.sai)} ${x.i.un}</td><td>${pill(x.d<=3?'perda':'pede', diasTxt(x.d))}</td></tr>`)):'',
      rodape:`<span class="sp"></span>${btnVisao('inventario', ob)}`})]})];
}

/* Diário (RDO) */
function temaDiario(ob){
  const r = typeof RDO!=='undefined' && (RDO[ob]||[])[0];
  if(!r) return null;
  return [cvMsg('agente', {nivel:'consulta', tools:['diário (RDO)','áudios e fotos do WhatsApp'],
    html: r.aguarda ? `O RDO de <b>${r.d}</b> está montado, mas <b>aguarda a confirmação do áudio</b> das 17h40; só vai ao cliente com esses fatos.` : `O RDO de ${r.d} está ${r.stT||r.st}.`,
    cartoes:[cartao({titulo:`RDO de ${r.d} · ${curto(ob)}`, sub:r.stT||'', nivel:'documento', icone:'file', rodape:`<span class="sp"></span>${btnVisao('diario', ob, '', 'Abrir Diário')}`})]})];
}

/* Pendências / o que preciso decidir */
function temaPendencias(ob){
  const ps = pendentes(ob).sort(porUrg);
  return [cvMsg('agente', {nivel:'propoe', tools:['aprovações','pedidos','almoxarifado'],
    html: ps.length ? `${ps.length>1?`São <b>${ps.length} decisões</b>`:'É <b>uma decisão</b>'}${ob?` na ${curto(ob)}`:''}, na ordem de urgência.` : `Nada pendente${ob?` na ${curto(ob)}`:''} agora.`,
    cartoes:[ps.length?cartaoDecisao(ps.map(p=>p.id)):'', ob?'':`<div class="cv-acoes">${btnVisao('aprovacoes', null, '', 'Abrir Aprovações')}</div>`]})];
}

/* Não reconhecido: resposta honesta + sugestões */
function temaNaoSei(texto, ob){
  return [cvMsg('agente', {nivel:'consulta', tools:[],
    html:`Não sei responder isso com segurança ainda${ob?` na ${curto(ob)}`:''}, e prefiro não chutar um número. Hoje eu consulto o almoxarifado, os pedidos, o cronograma, o orçamento, as medições, o diário e a equipe; proponho compras e transferências; e monto relatórios.`,
    cartoes:[`<div class="cv-cartao cv-sugbox"><div class="cv-c-sub">Tente uma destas</div><div class="cv-sugs">${cvSugestoes(ob).slice(0,5).map(chipSug).join('')}</div></div>`]})];
}

/* ===================== ROTEADOR (intenção por palavras-chave, tolerante a variação) ===================== */
const OBRA_RE = [[/vila ?nova|\bvn\b/,'vila-nova'],[/loja|centro\b|\blc\b/,'loja-centro'],[/galpao|sumare/,'galpao']];
const obraNoTexto = t => (OBRA_RE.find(([re])=>re.test(t))||[])[1];
const obraDe = v => !v ? null : DADOS[v] ? v : (Object.entries(NOME_OBRA).find(([,n])=>cvNorm(n)===cvNorm(v))||[])[0] || obraNoTexto(cvNorm(v));
const VISAO_RE = [[/almoxarifado|estoque da obra/,'inventario'],[/falta comprar/,'componentes'],[/\bpedidos\b/,'kanban'],[/entre obras/,'entreobras'],[/orcamento/,'overview'],[/medic/,'medicoes'],[/cronograma/,'prazos'],[/diario|\brdo\b/,'diario'],[/\bequipe\b/,'equipe'],[/aprovac/,'aprovacoes']];
/* Contexto da visão aberta: sessao.visao, CV.sobre (perguntarSobre) ou a rota #c/<id>/v/<chave>/<obra>. */
const CV = {sobre:null, sug:[]};
function visaoAberta(sessao){
  if(typeof state!=='undefined' && state.visao && state.visao.chave) return {chave:state.visao.chave, ob:state.visao.obra, filtro:state.visao.filtro};
  if(sessao && sessao.visao) return typeof sessao.visao==='string' ? {chave:sessao.visao, ob:sessao.visaoObra} : {chave:sessao.visao.chave, ob:sessao.visao.obra||sessao.visao.obraId, filtro:sessao.visao.filtro};
  const m = location.hash.match(/^#c\/[^/]+\/v\/([^/]+)\/?([^/]*)/);
  return m ? {chave:m[1], ob:m[2]||null} : null;
}
/* Semente do "Perguntar sobre isto": a Casca pode usar este texto; o roteador reconhece o formato e qualquer variação com o nome da visão. */
function sementeSobre(chave, obraId, filtro){
  CV.sobre = {chave, ob:obraId||null, filtro:filtro||''};
  return `Sobre ${VISAO_NOME[chave]||chave}${obraId?' · '+NOME_OBRA[obraId]:''}${filtro?` (${filtro})`:''}: `;
}
function temaDaVisao(chave, ob, filtro, t){
  const ins = insumoNoTexto(cvNorm(filtro||'')) || insumoNoTexto(t);
  ob = ob || 'vila-nova';
  if(semDados(ob) && !['aprovacoes','estoque','hoje'].includes(chave)) return honestoGalpao();
  switch(chave){
    case 'inventario': return ins==='bloco'&&ob==='vila-nova' ? temaBloco() : ins ? temaCompra(ob, ins) : temaAlmox(ob);
    case 'componentes': return ins ? temaCompra(ob, ins) : temaFalta(ob);
    case 'kanban': return /PED-0158|gerdau/i.test(filtro+t)&&ob==='vila-nova' ? temaAco() : /PED-0157|areia/i.test(filtro+t) ? temaAreia() : temaChega(ob);
    case 'overview': return temaOrcamento(ob);
    case 'medicoes': return ob==='vila-nova' ? temaMedicao() : temaOrcamento(ob);
    case 'prazos': return temaPrazo(ob);
    case 'diario': return temaDiario(ob) || temaNaoSei(t, ob);
    case 'equipe': return temaEquipe(ob);
    case 'entreobras': case 'estoque': return temaSobra(null);
    case 'aprovacoes': return temaPendencias(null);
    case 'hub': return temaPrazo(null);
    case 'hoje': return semDados(ob) ? honestoGalpao() : temaPendencias(ob);
  }
  return null;
}
const INTENCOES = [
  ['relatorio', t=>/relatorio|report|resumo da (fase|obra)|(como|onde) (esta|anda) a (fase|obra)|status da (fase|obra)|situacao da (fase|obra)/.test(t)],
  ['pedirAco', t=>/\baco\b|ferro|vergalh|ca-?50/.test(t) && /\b(pede|pedir|peca|pedi|compra|comprar|compre|encomend\w*|fecha|manda vir|faz o pedido)\b|\d+\s?kg/.test(t)],
  ['cimento', t=>/cimento/.test(t) && /transf|\btra[zg]|manda|puxa|leva|move|da loja|do centro|loja centro/.test(t)],
  ['compra', t=>/\b(pede|pedir|peca|compra|comprar|compre|encomenda|cota|cotar|cotacao de)\b/.test(t) && !!insumoNoTexto(t)],
  ['bloco', t=>/bloco/.test(t)],
  ['chega', t=>/\bchega|chegando|a caminho|vem amanha|\bentregas?\b(?! da obra)|receb\w* amanha|amanha/.test(t) && !/entrega da obra|data de entrega/.test(t)],
  ['equipe', t=>/\bquem\b|equipe|efetivo|presen|trabalhando|em campo|pessoal|funcionari|chamada|\baso\b|rafael/.test(t)],
  ['prazo', t=>/prazo|atras|cronograma|adiant|quando (termina|acaba|fica pronta|entrega)|data de entrega|entrega da obra/.test(t)],
  ['sobra', t=>/sobra|sobrando|sobrou|excedente|ceder|parado no|entre obras/.test(t)],
  ['concreto', t=>/concret|\blaje\b|chuva|bomba/.test(t)],
  ['aco', t=>/\baco\b|gerdau|0158/.test(t)],
  ['areia', t=>/areia|0157|divergencia/.test(t)],
  ['medicao', t=>/medic|equipe silva|paguei|pago acima|empreit/.test(t)],
  ['orcamento', t=>/orcamento|verba|custo|gast|acima do|estour/.test(t)],
  ['diario', t=>/diario|\brdo\b/.test(t)],
  ['falta', t=>/falta comprar|o que falta|precisa comprar/.test(t)],
  ['almox', t=>/almoxarifado|estoque|acaba(m|ndo)?\b/.test(t)],
  ['pendencias', t=>/bom dia|briefing|pendenc|o que (eu )?(tenho|preciso)|aprovar|aprovac|decis|resumo do dia/.test(t)],
];
const VAGO = /sobre isto|sobre isso|sobre esta|sobre essa|^sobre |explica|me resume|resuma|o que (e|significa|quer dizer) isso|o que estou vendo|nesta (tela|visao)/;

function rotear(texto, sessao){
  const t=cvNorm(texto), vis=visaoAberta(sessao);
  /* 6. Perguntar sobre isto: a semente (CV.sobre) ou um texto vago com a visão aberta dá o contexto (visão, obra, filtro) */
  const vNoTexto = (VISAO_RE.find(([re])=>re.test(t))||[])[1];
  const c0 = sessao.contexto && sessao.contexto.chave ? {chave:sessao.contexto.chave, ob:sessao.contexto.obra, filtro:sessao.contexto.filtro} : CV.sobre;
  const ctx = c0 || (VAGO.test(t) ? (vis || (vNoTexto?{chave:vNoTexto}:null)) : null);
  CV.sobre = null;
  const obMsg = obraDe(sessao.escopoMsg) || obraNoTexto(t), obSess = sessao.escopo && sessao.escopo!=='geral' ? sessao.escopo : null;
  const ob = obMsg || (ctx&&ctx.ob) || obSess;
  const k = (INTENCOES.find(([,f])=>f(t))||[])[0];
  if(!k && ctx){ const r=temaDaVisao(ctx.chave, ob, ctx.filtro||'', t); if(r) return r; }
  if(ob==='galpao'){
    /* resposta às perguntas do orçamento escrita no campo ("fibra", "termoacústica"…) */
    const rs=[[/fibra/,'piso',0],[/tela/,'piso',1],[/termo/,'fech',0],[/\bsimples\b/,'fech',1]].filter(([re,kk])=>re.test(t) && !GALPAO_R[kk]);
    const feitos=rs.filter((x,j)=>rs.findIndex(y=>y[1]===x[1])===j).map(([,kk,i])=>galpaoGravar(kk,i)).filter(Boolean);
    if(feitos.length) return [cvMsg('agente', {nivel:'propoe', tools:['orçamento do galpão'], html:`Anotado: ${feitos.map(q=>`<b>${GALPAO_R[q.k].op.toLowerCase()}</b>`).join(' e ')}. Fica no registro; se mudar de ideia, use Desfazer na linha.`}), ...temaGalpaoOrc()];
    if(!k || k==='relatorio' || k==='prazo') return temaGalpaoOrc();
    if(k!=='orcamento' && k!=='pendencias') return honestoGalpao();
  }
  const vn = ob||'vila-nova';
  switch(k){
    case 'relatorio': {
      const o=ob||'vila-nova', r=relDados(o);
      const resp = cvMsg('agente', {nivel:'documento', tools:['cronograma','custos','diário','equipe'], sessao:sessao.id,
        html:`Montei o relatório da fase da <b>${r.o.nome}</b>: a ${r.fase.toLowerCase()} está em <b>${r.pct}%</b>, a obra ${r.o.atraso>0?`deve atrasar <b>${r.o.atraso} dias</b>`:`está ${prazoTxt(r.o).toLowerCase()}`} e o custo projetado fica <b>${brl(Math.abs(r.dif))} ${r.dif>0?'acima':'abaixo'}</b> da verba.`,
        cartoes:[cartaoRelatorio(o)]});
      const out=[resp];
      if(!obSess && sessao.escopo==='geral'){
        const esc0 = cvMsg('agente', {sessao:sessao.id, cartoes:m=>[cartaoEscopo(m)]});
        Object.assign(esc0, {obra:o, tituloSessao:`Relatório da fase · ${r.fase}`, levar:[cvMsgCopia(texto), resp]});
        out.push(esc0);
      }
      return out;
    }
    case 'pedirAco': return temaPedirAco(t);
    case 'cimento': return temaCimento();
    case 'compra': { const i=insumoNoTexto(t), o=dados(vn).inv.some(x=>x.id===i)||dados(vn).comp.some(c=>(c.inv||c.id)===i)?vn:(OBRAS.find(x=>!semDados(x.id)&&(dados(x.id).inv.some(y=>y.id===i)))||{}).id;
      return o ? temaCompra(o, i, t) : temaNaoSei(texto, ob); }
    case 'bloco': return vn==='vila-nova' ? temaBloco() : temaCompra(vn, 'bloco');
    case 'chega': return temaChega(ob);
    case 'equipe': return temaEquipe(ob);
    case 'prazo': return temaPrazo(ob);
    case 'sobra': return temaSobra(ob || (/aqui/.test(t)&&obSess) || null);
    case 'concreto': return temaConcreto();
    case 'aco': return temaAco();
    case 'areia': return temaAreia();
    case 'medicao': return temaMedicao();
    case 'orcamento': return temaOrcamento(ob);
    case 'diario': return temaDiario(vn) || temaNaoSei(texto, ob);
    case 'falta': return temaFalta(vn);
    case 'almox': return temaAlmox(vn);
    case 'pendencias': return temaPendencias(ob);
  }
  /* Pergunta não reconhecida NÃO cai no tema da visão aberta: responder outra coisa com segurança é pior que
     dizer que não sabe. O contexto da visão só vale para texto vago (VAGO) ou vindo do "Perguntar sobre isto". */
  return temaNaoSei(texto, ob);
}
const cvMsgCopia = t => voce(t);

/* Chamado pela Casca ao enviar. A Casca mostra "usando ferramentas…" (≥ 600 ms); aqui o balão ganha o nome das ferramentas. */
function responder(texto, sessao={}){
  let msgs;
  try { msgs = rotear(String(texto||''), sessao||{}); } catch(e){ console.error(e); msgs = temaNaoSei(texto, null); }
  msgs.forEach(m=>{ m.sessaoId = m.sessaoId || sessao.id; m.novo = true; });
  /* Com uma visão já aberta ao lado, ela acompanha a ferramenta que o agente usou; sem visão, a conversa fica inteira e o cartão tem [Abrir]. */
  const v = msgs.find(m=>m.visao);
  if(v && typeof state!=='undefined' && state.visao) v.abrir = v.visao;
  const ts = msgs.flatMap(m=>m.tools||[]).slice(0,3), b = document.querySelector('.msgs [class*="-pensando"] .bub');
  if(b && ts.length) b.innerHTML = `${icon('wrench',14)}usando ${ts.map(esc).join(' · ')}…`;
  return new Promise(ok=>setTimeout(()=>ok(msgs), typeof CASCA!=='undefined' ? 0 : 600));
}

/* ===================== DESENHO ===================== */
function renderMsg(msg){
  if(!msg) return '';
  const novo = msg.novo ? ' cv-entra' : ''; msg.novo = false;
  if(msg.de==='voce') return `<div class="msg me${novo}">${msg.html}</div>`;
  const tools = msg.tools&&msg.tools.length ? `<div class="cv-uso">${icon('wrench',13)}<span class="cv-uso-r">usou</span>${msg.tools.map(t=>`<span class="cv-tool">${t}</span>`).join('<span class="cv-sep" aria-hidden="true">·</span>')}<span class="cv-h">${msg.hora}</span></div>` : '';
  const html = msg.html;
  return `<div class="msg cv-ai${novo}" data-msg="${msg.id||''}"><div class="cv-av" aria-hidden="true">${icon('spark',16)}</div><div class="cv-corpo">${tools}${html?`<div class="cv-txt">${html}</div>`:''}${(msg.cartoes||[]).join('')}${msg.rodape||''}</div></div>`;
}
function renderConversa(sessao){
  return sessao && sessao.msgs ? sessao.msgs.map(renderMsg).join('') : '';     // vazia: a Casca mostra o estado vazio dela
}
/* Sugestões do roteiro (os números saem dos dados: "2.760 blocos" é o saldo de agora). */
function cvSugestoes(ob){
  const b = num(saldoDe('vila-nova','bloco'));
  if(ob==='loja-centro') return ['O que sobra aqui?','Estamos no prazo?','O que chega amanhã?','Quem está na obra hoje?','Quero um relatório da fase'];
  if(ob==='galpao') return [...(GALPAO_R.piso?[]:['Piso com fibra de aço','Piso com tela soldada']), ...(GALPAO_R.fech?[]:['Fechamento termoacústico','Fechamento simples']), 'Qual obra está mais acima do orçamento?'];
  if(ob==='vila-nova') return ['Quero um relatório da fase',`Por que só tem ${b} blocos?`,'O que chega amanhã?','Quem está na obra hoje?','Estamos no prazo?','Pede 600 kg de aço','Transfere o cimento da Loja Centro'];
  return ['Vamos começar pela Vila Nova, quero um relatório da fase da obra',`Por que só tem ${b} blocos?`,'O que chega amanhã?','Quem está na obra hoje?','Estamos no prazo?','@Loja Centro o que sobra?','Pede 600 kg de aço','Transfere o cimento da Loja Centro'];
}
function chipSug(t){ const i=CV.sug.indexOf(t)>=0?CV.sug.indexOf(t):CV.sug.push(t)-1; return `<button type="button" class="cv-chip" onclick="cvUsarSugestao(${i})">${esc(t)}</button>`; }
const SUGESTOES = sessao => cvSugestoes(sessao && sessao.escopo && sessao.escopo!=='geral' ? sessao.escopo : null);
/* Chip: envia direto se a Casca expuser a função de envio; senão põe o texto no campo e foca. */
function cvUsarSugestao(i){
  const t = CV.sug[i]; if(!t) return;
  for(const f of ['enviar','enviarMensagem','enviarConversa']) if(typeof window[f]==='function') return window[f](t);
  const c = document.getElementById('caTxt') || document.getElementById('cvTxt') || document.querySelector('#main textarea');
  if(c){ c.value=t; c.dispatchEvent(new Event('input',{bubbles:true})); c.focus(); }
}

/* ===================== GALPÃO SUMARÉ: o orçamento corre na conversa ===================== */
/* As 2 perguntas do chat do galpão (core.js, CHATS.galpao). Responder grava e o agente refaz a prévia; nada de número novo inventado. */
const GALPAO_Q = [
  {k:'piso', tit:'Piso de 5 t/m²: fibra de aço ou tela soldada?', conta:'muda cerca de R$ 90 mil no orçamento', ops:['Fibra de aço','Tela soldada']},
  {k:'fech', tit:'Fechamento lateral: telha termoacústica ou simples?', conta:'define a telha e a estrutura do fechamento', ops:['Termoacústica','Simples']},
];
const GALPAO_R = {};
const galpaoFaltam = () => GALPAO_Q.filter(q=>!GALPAO_R[q.k]).length;
function galpaoGravar(k, i){
  const q=GALPAO_Q.find(x=>x.k===k); if(!q || GALPAO_R[k]) return null;
  GALPAO_R[k]={op:q.ops[i], hora:cvHora()};
  registrar(`Galpão Sumaré · ${q.tit.split(':')[0]}: ${q.ops[i]}`, {obra:'galpao', origem:'agente'});
  return q;
}
function cvGalpao(k, i){
  const q=galpaoGravar(k, i); if(!q) return;
  cvRepintar();
  toastDesfazer(`${q.ops[i]} anotado para o orçamento do Galpão`, ()=>{ delete GALPAO_R[k]; });
}
function cvGalpaoDesfazer(k){ if(!GALPAO_R[k]) return; delete GALPAO_R[k]; registrar('Desfez: resposta do orçamento do Galpão', {obra:'galpao'}); toast('Desfeito'); cvRepintar(); }
function temaGalpaoOrc(){
  const g=OBRAS.find(o=>o.id==='galpao');
  return [cvMsg('agente', {nivel:'propoe', tools:['lendo projeto (38 pág.)','levantamento de quantitativos','cotando 64 insumos em Sumaré/Campinas'],
    html:()=> galpaoFaltam() ? `Li o projeto. Antes de fechar o orçamento, preciso de ${galpaoFaltam()>1?'2 respostas suas':'mais 1 resposta sua'}. Prévia com as opções mais comuns: <b>R$ 2,51–2,63 mi</b>, 5–10% acima do orçamento-alvo de ${brl(g.budget)}.`
      : `Com as duas respostas, refaço a prévia (hoje <b>R$ 2,51–2,63 mi</b> contra ${brl(g.budget)}) e trago o orçamento para você aprovar. Insumos, pedidos e cronograma abrem depois disso.`,
    cartoes:()=>[cartao({titulo:'Para fechar o orçamento', sub:chipFonte({origem:'projeto', quem:'projeto-galpao-sumare.pdf · 38 pág.'}), nivel:'propoe', classe:'cv-dec',
      corpo:listaDecisoes(GALPAO_Q.map((q,n)=>{ const r=GALPAO_R[q.k];
        return linhaDecisao({prazo:'antes do orçamento', tom:r?'ok':'pede', titulo:q.tit, conta:r?`Respondido: ${r.op}`:q.conta,
          acao:{label:q.ops[0], onclick:`cvGalpao('${q.k}',0)`}, sec:[{label:q.ops[1], onclick:`cvGalpao('${q.k}',1)`}], foco:!r && GALPAO_Q.findIndex(x=>!GALPAO_R[x.k])===n,
          estado:r?{feito:r.op, hora:r.hora, quem:'Rizzi', desfazer:`cvGalpaoDesfazer('${q.k}')`}:'pendente'}); }))})]})];
}

/* ===================== SESSÕES (histórico coerente com data.js) ===================== */
function sessaoCom(id, titulo, escopo, quando, pares){
  const s = {id, titulo, escopo, quando, msgs:[]};
  pares.forEach(([pergunta, h, tema])=>{ s.msgs.push(voce(pergunta, h)); tema().forEach(m=>{ m.hora=h; m.sessaoId=id; s.msgs.push(m); }); });
  return s;
}
const SESSOES = [
  {id:'geral', titulo:'Geral', escopo:'geral', quando:'hoje 07:00', msgs:[msgBriefing()]},
  sessaoCom('vn-aco', 'Atraso do aço (Gerdau)', 'vila-nova', 'hoje 08:12', [['a Gerdau confirmou data para o aço?', '08:12', temaAco]]),
  sessaoCom('vn-concretagem', 'Concretagem da laje × chuva', 'vila-nova', 'hoje 07:40', [['e a concretagem da laje na quinta, mantém?', '07:40', temaConcreto]]),
  sessaoCom('lc-sobras', 'Sobras para a Vila Nova', 'loja-centro', 'hoje 09:05', [['o que sobra aqui que dá para mandar para a Vila Nova?', '09:05', ()=>temaSobra('loja-centro')]]),
  sessaoCom('galpao-orc', 'Orçamento inicial', 'galpao', 'hoje 10:20', [['Galpão logístico 1.200 m², estrutura metálica, piso industrial 5 t/m². Orçamento-alvo R$ 2,4 mi, início em jan/2027, 7 meses. Fases: terraplenagem, fundação, estrutura metálica, fechamento, piso, instalações, entrega.', '10:20', temaGalpaoOrc]]),
];
/* A pergunta do galpão chegou com o projeto anexado (como no chat antigo). */
(()=>{ const m=SESSOES.find(s=>s.id==='galpao-orc').msgs[0], h=m.html;
  Object.defineProperty(m, 'html', {enumerable:true, configurable:true, get:()=>`<span class="attach">${icon('file',13)}projeto-galpao-sumare.pdf · 38 pág.</span> <span class="attach">${icon('ruler',13)}planta-baixa.dwg</span><br>${h}`}); })();
SESSOES[0].msgs[0].sessaoId = 'geral';

/* ===================== ESTILO ===================== */
addCSS(`
.cv-corpo > .cv-cartao{margin-top:0}
.cv-ai{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;align-items:start}
.cv-av{width:28px;height:28px;display:grid;place-items:center;flex:none;background:var(--pine);color:var(--accent);border-radius:7px}
.cv-corpo{display:flex;flex-direction:column;gap:12px;min-width:0}
.cv-uso{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;min-height:28px;font-size:var(--t-meta);color:var(--muted)}
.cv-uso .ic{color:var(--muted)}
.cv-uso-r{color:var(--muted)} .cv-tool{color:var(--ink2)}
.cv-sep{color:var(--muted);opacity:.6}
.cv-h{margin-left:auto;color:var(--muted)}
.cv-txt{max-width:62ch;text-wrap:pretty;line-height:1.6;color:var(--ink);font-variant-numeric:tabular-nums}
.cv-txt b{font-weight:600}
/* cartão: a única caixa do fio */
.cv-cartao{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;container-type:inline-size}
.cv-c-h{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--line2)}
.cv-c-t{flex:1;min-width:0}
.cv-c-h h2{margin:0;font:600 var(--t-sec)/1.3 var(--serif);letter-spacing:-.01em}
.cv-c-sub{font-size:var(--t-meta);color:var(--muted);margin-top:2px;display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;min-width:0}
.cv-c-sub .fonte{white-space:normal;flex-wrap:wrap}
.cv-c-h > .pill{flex:none}
.cv-c-ic{width:28px;height:28px;display:grid;place-items:center;flex:none;border-radius:7px;background:var(--sunk);color:var(--accentInk)}
.cv-c-b{padding:12px 16px}
.cv-c-f{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;border-top:1px solid var(--line2)}
.cv-f-txt{font-size:var(--t-meta);color:var(--muted);max-width:52ch}
.cv-cartao .ld-lista{border:0;box-shadow:none;border-radius:0}
.cv-cartao .ld{padding:12px 16px;grid-template-columns:76px minmax(0,1fr) auto auto;gap:var(--s3)}
.cv-cartao .cv-tabw + .ld-lista,.cv-cartao .cv-nota + .ld-lista{border-top:1px solid var(--line2)}
@container (max-width:620px){
  .cv-c-t{flex:1 1 calc(100% - 48px)}
  .cv-c-h > .pill{margin-left:40px}
  .cv-c-h:not(:has(.cv-c-ic)) > .pill{margin-left:0}
  .cv-cartao .ld{grid-template-columns:64px minmax(0,1fr);gap:4px 12px}
  .cv-cartao .ld-valor{grid-column:2;text-align:left}
  .cv-cartao .ld-acts{grid-column:2;justify-content:flex-start;flex-wrap:wrap}
  .cv-nums{grid-template-columns:1fr!important}
  .cv-nums > div + div{border-left:0!important;border-top:1px solid var(--line2)}
  .cv-causas li{grid-template-columns:minmax(0,1fr) auto!important} .cv-causas .cv-c-d{grid-column:1;grid-row:2}
}
.cv-tabw{overflow-x:auto}
.cv-tab th{background:none;padding:8px 12px}
.cv-tab td{padding:8px 12px;font-size:var(--t-body)}
.cv-tab th:first-child,.cv-tab td:first-child{padding-left:16px}
.cv-tab th:last-child,.cv-tab td:last-child{padding-right:16px}
.cv-tab tr.cv-perda td{background:var(--redSoft)}
.cv-tab tr.cv-tot td{font-weight:600;border-top:1px solid var(--line)}
.cv-nm{font-weight:500}
.cv-acoes{display:flex;gap:8px;flex-wrap:wrap}
/* documento */
.cv-nums{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--line2)}
.cv-nums > div{display:flex;flex-direction:column;gap:2px;padding:12px 16px;min-width:0}
.cv-nums > div + div{border-left:1px solid var(--line2)}
.cv-nums .l{font-size:var(--t-meta);color:var(--muted)}
.cv-nums .v{font:600 var(--t-bloco)/1.2 var(--serif);letter-spacing:-.02em;font-variant-numeric:tabular-nums lining-nums;color:var(--ink)}
.cv-nums .v.t-perda{color:var(--redInk)} .cv-nums .v.t-ok{color:var(--greenInk)}
.cv-nums .s{font-size:var(--t-meta);color:var(--muted);line-height:1.45}
.cv-sec{padding:12px 16px 4px}
.cv-sec + .cv-sec{border-top:1px solid var(--line2)}
.cv-sec h3{margin:0 0 6px;font:600 var(--t-meta)/1.3 var(--sans);letter-spacing:0;color:var(--ink2)}
.cv-lista{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:2px}
.cv-lista li{display:flex;align-items:baseline;gap:8px 12px;font-size:var(--t-body);line-height:1.5;padding:3px 0}
.cv-lista li > span:first-child{flex:1;min-width:0}
.cv-lista li > b,.cv-lista li > .pill{flex:none;white-space:nowrap}
.cv-lista .cv-dt{flex:0 0 72px!important;color:var(--muted);font-size:var(--t-meta)}
.cv-causas li{display:grid;grid-template-columns:96px minmax(0,1fr) auto}
.cv-causas li > span:first-child{font-weight:500}
.cv-c-d{color:var(--muted);font-size:var(--t-meta)}
b.t-perda{color:var(--redInk)} b.t-ok{color:var(--greenInk)}
.cv-nota{font-size:var(--t-meta);color:var(--muted);margin:0 0 8px;max-width:62ch}
.cv-doc-modal{container-type:inline-size;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);margin:0 -4px}
.cv-pdf{border:1px solid var(--line);border-radius:6px;padding:28px 32px}
.cv-pdf .cv-nums,.cv-pdf .cv-sec{padding-left:0;padding-right:0} .cv-pdf .cv-nums > div:first-child{padding-left:0}
.cv-pdf .cv-nums .v{font-size:20px}
/* escopo */
.cv-escopocard{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px}
.cv-escopocard .cv-c-t b{font-weight:600}
.cv-escopo-a{display:flex;gap:8px;margin-left:auto}
.cv-escolha{display:flex;align-items:center;gap:8px;margin:0;font-size:var(--t-meta);color:var(--greenInk);animation:fadeIn .15s var(--ease)}
.cv-escolha a{color:var(--accentInk);text-decoration:underline;text-underline-offset:3px}
/* também hoje */
.cv-tambem{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;margin:0;font-size:var(--t-meta);color:var(--muted);line-height:1.5}
.cv-tambem-r{font-weight:600;color:var(--ink2);margin-right:4px}
.cv-tambem a{color:var(--muted)} .cv-tambem a b{color:var(--ink2);font-weight:500}
/* sugestões */
.cv-sug{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 32px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 32px),transparent)}
.cv-sug::-webkit-scrollbar{display:none}
.cv-sugs{display:flex;flex-wrap:wrap;gap:8px}
.cv-sugbox{padding:12px 16px;display:grid;gap:8px}
.cv-chip{flex:none;border:1px solid var(--line);background:#fff;color:var(--ink2);border-radius:99px;padding:5px 12px;font:500 var(--t-meta)/1.4 var(--sans);white-space:nowrap;cursor:pointer;transition:border-color .12s var(--ease),transform .12s var(--ease)}
.cv-chip:active{transform:scale(.97)}
/* entrada das mensagens novas (só opacidade com movimento reduzido) */
.cv-entra{animation:cvEntra .22s var(--ease) both}
.msg.cv-entra + .msg.cv-entra{animation-delay:.06s}
@keyframes cvEntra{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){ @keyframes cvEntra{from{opacity:0}to{opacity:1}} }
@media (hover:hover){ .cv-chip:hover{border-color:var(--accent);color:var(--ink)} .cv-tambem a:hover b{text-decoration:underline;text-underline-offset:3px} }
`);
