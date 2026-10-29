/* =====================================================================================================
   BASE DO REDESIGN (design/direcao.md). Este bloco é a referência para quem escreve telas.

   ROTAS (agente no centro; a casca está no fim deste arquivo, em CASCA)
     #c/<sessaoId> ........................ a conversa
     #c/<sessaoId>/v/<chave>[/<obraId>][/cheia]   a conversa com uma visão aberta ao lado (ou em tela cheia)
       chave de obra = chave de TAB_FNS (hoje, componentes, kanban, inventario, entreobras, overview, medicoes,
       prazos, diario, equipe) e leva o obraId; chave global = chave de VIEWS (aprovacoes, estoque, hub), sem obra.
     #campo · #fluxos ..................... páginas inteiras, como antes
     Compatibilidade: #home → #c/geral · #obra/<id>/<tela> → sessão mais recente da obra com a visão <tela> ·
       #obra/<id> → idem com 'hoje' · #obra/<id>/chat → a sessão da obra, sem visão · #aprovacoes/#estoque/#hub →
       Geral com a visão aberta. go(view, obra, tab) continua valendo no código todo: vira abrirVisao na sessão atual.
     Tela nova de obra: TAB_FNS.chave = o => html (+ GRUPOS[i].telas.push(['chave','Rótulo']) para os contadores).
     state.view/obra/tab continuam sendo preenchidos (view 'obra' com a visão de obra aberta) para quem os lê.

   COMPONENTES GLOBAIS (todos devolvem HTML; onclick é sempre uma string de JS, como no resto do protótipo)
     linhaDecisao({prazo, tom, obra, titulo, conta, valor, acao:{label,onclick}, sec:[{label,onclick}], estado, foco, doc})
       prazo 'hoje 17h' · tom 'perda'|'pede'|'caminho'|'ok'|'info' (cor do prazo, padrão 'pede') · obra id ou nome
       conta: texto ou linhaConta(...) · valor: número (vira R$) ou texto · acao: nomeada pela consequência
       ("Aprovar R$ 9.165"); é ocre só com foco:true (uma por lista), senão secundária · sec: botões pequenos
       estado: 'pendente' (padrão) ou {feito:'Aprovado', hora:'08:14', quem:'Rizzi', desfazer:'js'}: a linha fica no lugar.
       Agrupe com listaDecisoes([...linhas]).
     linhaConta({precisa, saldo, aCaminho, cotando, transf, falta, comprar, un, fonte})   (Suprimentos: linhaConta(contaDe(obra, insumo)))
       "precisa X − saldo Y − a caminho Z [− em cotação K] [− transferência T] = falta F → comprar C"; falta e comprar são calculados
       se omitidos; fonte (texto ou chipFonte) vai numa linha abaixo.
     chipFonte({origem, quem, hora})  origem: 'agente'|'whatsapp'|'nf'|'sinapi'|'cotacao'|'projeto'|'tela'
     pill(estado, texto)  estado: 'pede'|'perda'|'caminho'|'ok'|'info' (aceita ok/warn/bad/info/gray). Pill não clica.
     botao(label, onclick, {pri, sm, icone, desab, title})  pri:true = ocre, uma por bloco. Proibido "Avançar".
     docRef('PED-0162' [, texto])  link para o cartão certo (Pedidos da obra, ou Estoque entre obras para TRF);
       ao chegar, o elemento com data-doc="PED-0162" (ou o menor cartão/linha com o código) pisca 1 s.
     kpi({rotulo, valor, contexto, projecao, tom})  no máximo 3 por tela; projecao:true → selo "se aprovar".
     segmento(itens, ativo, {rotulo})  itens [{k, label, n, onclick}]: controle segmentado (2º nível ou filtro).
     val(texto)  nota de validação: faixa fina recolhível, no topo da tela; some com "Notas de validação" desligadas.
     toast(texto) · toastDesfazer(texto, fnDesfazer)  aria-live; "(protótipo) …" sai na variante neutra.
     abrirModal(html) · closeModal() · closeDrawer()  Modal grava, drawer consulta. Preencher #modalBox/#drawerPane e
       ligar a classe 'on' continua valendo: a base põe role="dialog", X, Esc, foco preso e devolvido, rodapé fixo (o
       último .row com botões) e ignora o clique fora quando o modal tem campo de formulário. No celular vira bottom sheet.
   ===================================================================================================== */

/* ===================== ESTADO / ROTAS ===================== */
/* modo 'c' = conversa (+ visão opcional) · 'campo' · 'fluxos'. view/obra/tab são derivados (compatibilidade). */
let state = {modo:'c', sessao:'geral', visao:null, view:'conversa', obra:null, tab:'hoje'};
const PAGINAS = ['campo','fluxos'];
const ehVisaoObra = k => !!(k && TAB_FNS[k]);
const ehVisaoGlobal = k => !!(k && VIEWS[k]) && !['home','obra','conversa',...PAGINAS].includes(k);
function compat(s){
  const v=s.visao, ses=s.modo==='c' && sessoes().find(x=>x.id===s.sessao);
  s.view = s.modo!=='c' ? s.modo : !v ? 'conversa' : v.obra ? 'obra' : v.chave;
  s.obra = (v&&v.obra) || (ses && ses.escopo && ses.escopo!=='geral' ? ses.escopo : null);
  s.tab = v&&v.obra ? v.chave : 'hoje';
  return s;
}
/* Traduz a navegação antiga (view, obra, tab) para o estado novo. op.recente: vindo da URL (#obra/…), usa a sessão
   mais recente da obra (ou a Geral); vindo do código (go), fica na sessão atual e só abre a visão. */
function rota(view, obra, tab, op={}){
  const atual = state.modo==='c' ? state.sessao : (CASCA.ultima||idGeral()), va=state.visao;
  const cheia = op.cheia ?? !!(va && va.cheia), filtro = op.filtro || null;
  if(PAGINAS.includes(view)) return compat({modo:view, sessao:atual, visao:null});
  if(!view || view==='home' || view==='conversa') return compat({modo:'c', sessao:idGeral(), visao:null});
  if(view==='obra'){
    if(!OBRAS.some(o=>o.id===obra)) return compat({modo:'c', sessao:atual, visao:null});
    if(tab==='chat'){ CASCA.focar=true; return compat({modo:'c', sessao:sessaoDaObra(obra), visao:null}); }
    return compat({modo:'c', sessao: op.recente ? sessaoDaObra(obra) : atual, visao:{chave:ehVisaoObra(tab)?tab:'hoje', obra, filtro, cheia}});
  }
  if(ehVisaoGlobal(view)) return compat({modo:'c', sessao: op.recente ? idGeral() : atual, visao:{chave:view, obra:null, filtro, cheia}});
  return compat({modo:'c', sessao:atual, visao:null});
}
function hashDe(s){
  if(s.modo!=='c') return '#'+s.modo;
  const v=s.visao;
  return '#c/'+encodeURIComponent(s.sessao)+(v?'/v/'+v.chave+(v.obra?'/'+v.obra:'')+(v.cheia?'/cheia':''):'');
}
const hashPara = (view, obra, tab) => hashDe(rota(view, obra, tab));
function navegar(trocar){
  CASCA.side=false;
  const h=hashDe(state); if(location.hash!==h) history[trocar?'replaceState':'pushState'](null,'',h);
  render();
  if(CASCA.focar){ CASCA.focar=false; focarCampo(); }
}
function go(view, obra, tab, op){ state=rota(view, obra, tab, op); navegar(); }
window.onhashchange = () => {
  const p=location.hash.slice(1).split('/').map(decodeURIComponent); if(!p[0]) return;
  if(p[0]==='c'){
    const ses = sessoes().some(s=>s.id===p[1]) ? p[1] : idGeral(); let visao=null;
    if(p[2]==='v' && p[3]){ const r=p.slice(4), k=p[3], ob=r[0]&&r[0]!=='cheia' ? r.shift() : null, cheia=r[0]==='cheia';
      if(ehVisaoObra(k)) visao={chave:k, obra:OBRAS.some(o=>o.id===ob)?ob:obraPadrao(ses), filtro:null, cheia};
      else if(ehVisaoGlobal(k)) visao={chave:k, obra:null, filtro:null, cheia};
      const va=state.visao; if(visao && va && va.chave===visao.chave && va.obra===visao.obra) visao.filtro=va.filtro; }
    state=compat({modo:'c', sessao:ses, visao});
  } else state=rota(p[0], p[1], p[2], {recente:true});
  const h=hashDe(state); if(location.hash!==h) history.replaceState(null,'',h);
  CASCA.side=false; render();
  if(CASCA.focar){ CASCA.focar=false; focarCampo(); }
};
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function obra(){ return OBRAS.find(o=>o.id===state.obra); }

/* ===================== TOAST (role=status, aria-live) ===================== */
function mostrarToast(html, ms, neutro){
  const e=$('toast'); clearTimeout(e._t); clearTimeout(e._h);
  e.innerHTML=`<div class="t-in">${html}</div>`; e.classList.toggle('neutro', !!neutro);
  e.style.display='block'; void e.offsetWidth; e.classList.add('on');
  const contar=()=>{ clearTimeout(e._t); e._t=setTimeout(esconderToast, ms); };
  e.onmouseenter=e.onfocusin=()=>clearTimeout(e._t); e.onmouseleave=e.onfocusout=contar;   // pausa no hover e no foco
  contar();
}
function esconderToast(){ const e=$('toast'); e.classList.remove('on'); e._h=setTimeout(()=>{ if(!e.classList.contains('on')) e.style.display='none'; },170); }
function toast(t){ const neutro=/^\(protótipo\)/.test(t); mostrarToast((neutro?icon('info',15):'')+`<span>${esc(t)}</span>`, neutro?2600:3200, neutro); }

/* Humano no loop: toda ação do agente ou do usuário fica registrada (quem, quando, de onde veio).
   A tela de aprovações/registro (js/features/proativo.js) lê daqui; qualquer feature grava aqui. */
const LOG = [
  {quando:'27/10 16:40', obra:'vila-nova', quem:'Joana M.', origem:'WhatsApp', texto:'Baixa de 8 sc de cimento · alvenaria do térreo'},
  {quando:'27/10 09:12', obra:'vila-nova', quem:'Rizzi', origem:'agente', texto:'Aprovou pedido PED-0160 · 120 sc de cimento · Depósito São Bento'},
  {quando:'24/10 18:05', obra:'loja-centro', quem:'Ana P.', origem:'tela', texto:'Recebimento conferido · PED-0109 · porcelanato 60×60'},
];
function registrar(texto, o={}){ LOG.unshift({quando:'28/10 '+new Date().toTimeString().slice(0,5), obra:o.obra||state.obra||'vila-nova', quem:o.quem||'Rizzi', origem:o.origem||'tela', texto}); }
/* Aviso com "Desfazer": use em toda ação que muda dado (aplicar economia, aprovar, transferir). 8 s, pausa no hover/foco. */
function toastDesfazer(msg, desfazer){
  mostrarToast(`<span>${msg}</span>`+(desfazer?`<button type="button" class="t-undo">Desfazer</button>`:''), 8000);
  const b=$('toast').querySelector('.t-undo');
  if(b) b.onclick=()=>{ desfazer(); esconderToast(); registrar('Desfez: '+msg); render(); };
}

/* ===================== COMPONENTES GLOBAIS ===================== */
/* Nota de validação: faixa fina recolhível com visual de pesquisa (não é pendência do produto). */
function val(texto){
  return `<details class="val"><summary>${icon('flask',14)}<span class="vt">Validar</span><span class="vq">${texto}</span>${icon('chevDown',14,'chev')}</summary></details>`;
}
const TOM_PILL = {pede:'warn', perda:'bad', caminho:'info', ok:'ok', info:'gray', warn:'warn', bad:'bad', gray:'gray'};
function pill(estado, texto){ return `<span class="pill ${TOM_PILL[estado]||'gray'}">${texto}</span>`; }
function botao(label, onclick, op={}){
  return `<button type="button" class="btn${op.pri?' amb':''}${op.sm?' sm':''}" onclick="${onclick}"${op.desab?' disabled':''}${op.title?` title="${esc(op.title)}"`:''}>${op.icone?icon(op.icone,15):''}${label}</button>`;
}
const FONTE_IC = {agente:['spark','agente'], whatsapp:['message','WhatsApp'], nf:['receipt','NF-e'], sinapi:['ruler','SINAPI'], cotacao:['cart','cotação'], projeto:['file','projeto'], tela:['list','tela']};
function chipFonte({origem='tela', quem, hora}={}){
  const [ic,nome]=FONTE_IC[String(origem).toLowerCase()]||['info',origem];
  return `<span class="fonte">${icon(ic,13)}<b>${nome}</b>${quem?` · ${quem}`:''}${hora?` · ${hora}`:''}</span>`;
}
function linhaConta({precisa, saldo=0, aCaminho=0, cotando=0, transf=0, falta, comprar, un='', fonte}={}){   // cotando: opcional, "− em cotação K" (Suprimentos)
  const f = falta ?? Math.max(0, precisa - saldo - aCaminho - cotando - transf), c = comprar ?? f, n=v=>num(v)+(un?' '+un:'');
  const t=(r,v)=>`<span class="lc-t"><small>${r}</small>${n(v)}</span>`, op=s=>`<span class="lc-op">${s}</span>`;
  return `<div class="lc"><div class="lc-eq">${t('precisa',precisa)}${op('−')}${t('saldo',saldo)}${op('−')}${t('a caminho',aCaminho)}${cotando?op('−')+t('em cotação',cotando):''}${transf?op('−')+t('transferência',transf):''}${op('=')}<span class="lc-t lc-falta ${f>0?'t-perda':'t-ok'}"><small>falta</small>${n(f)}</span>${op('→')}<span class="lc-t lc-comprar"><small>comprar</small>${n(c)}</span></div>${fonte?`<div class="lc-fonte">${typeof fonte==='string'?`<span class="fonte">${fonte}</span>`:chipFonte(fonte)}</div>`:''}</div>`;
}
function linhaDecisao({prazo='', tom='pede', obra:ob, titulo, conta, valor, acao, sec=[], estado, foco, doc}={}){
  const nomeOb = ob ? (NOME_OBRA[ob]||ob) : '', v = typeof valor==='number' ? brl(valor) : (valor||'');
  const feito = estado && typeof estado==='object' && estado.feito;
  const acts = feito
    ? `<div class="ld-feito">${icon('check',14)}${estado.feito}${estado.hora?' '+estado.hora:''}${estado.quem?' por '+estado.quem:''}${estado.desfazer?` · <button type="button" onclick="${estado.desfazer}">Desfazer</button>`:''}</div>`
    : `${sec.map(s=>botao(s.label, s.onclick, {sm:true})).join('')}${acao?botao(acao.label, acao.onclick, {pri:!!foco}):''}`;
  return `<div class="ld${feito?' feito':''}"${doc?` data-doc="${doc}"`:''}><div class="ld-prazo t-${tom}">${prazo}</div>
    <div class="ld-txt"><div class="ld-tit">${nomeOb?`<span class="ld-obra">${nomeOb} · </span>`:''}${titulo}</div>${conta?`<div class="ld-conta">${conta}</div>`:''}</div>
    <div class="ld-valor">${v}</div><div class="ld-acts">${acts}</div></div>`;
}
const listaDecisoes = linhas => `<div class="ld-lista">${linhas.join('')}</div>`;
function kpi({rotulo, valor, contexto, projecao, tom}={}){
  const cor = {perda:'var(--redInk)', ok:'var(--greenInk)', pede:'var(--amberInk)', caminho:'var(--blueInk)'}[tom];
  return `<div class="card kpi"><div class="l">${rotulo}${projecao?`<span class="proj">${projecao===true?'se aprovar':projecao}</span>`:''}</div><div class="v"${cor?` style="color:${cor}"`:''}>${valor}</div>${contexto?`<div class="s mut">${contexto}</div>`:''}</div>`;
}
function segmento(itens, ativo, op={}){
  return `<div class="seg" role="tablist"${op.rotulo?` aria-label="${esc(op.rotulo)}"`:''}>${itens.map(i=>`<button type="button" role="tab" class="${i.k===ativo?'on':''}" aria-selected="${i.k===ativo}" onclick="${i.onclick}">${i.label}${i.n?`<span class="n" aria-label="${i.n} pendentes">${i.n}</span>`:''}</button>`).join('')}</div>`;
}
/* Referência de documento: PED-xxxx abre Pedidos da obra; TRF-xxxx abre Estoque entre obras. */
function docRef(id, texto){ return `<a class="docref" href="#" onclick="irDoc('${id}');return false">${texto||id}</a>`; }
function irDoc(id){
  closeModal(); closeDrawer();
  const f = /^PED-/.test(id) && typeof acharLote==='function' && acharLote(id);
  if(f) go('obra', f.ob, 'kanban'); else if(/^TRF-/.test(id)) go('estoque');
  setTimeout(()=>destacarDoc(id), 0);
}
function destacarDoc(id){
  const m=$('vsCorpo')||$('main'); let el=m.querySelector(`[data-doc="${id}"]`);
  if(!el) el=[...m.querySelectorAll('.kc,tr,.ld,.card')].filter(e=>e.textContent.includes(id)).sort((a,b)=>a.textContent.length-b.textContent.length)[0];
  if(!el) return;
  m.id==='vsCorpo' ? rolarAte(m, el) : el.scrollIntoView({block:'center'}); el.classList.remove('doc-chegou'); void el.offsetWidth; el.classList.add('doc-chegou');
  setTimeout(()=>el.classList.remove('doc-chegou'), 1100);
}

/* ===================== SIDEBAR ===================== */
/* O ponto de status tem um significado só (sidebar, hub e cabeçalho): vermelho = em risco, verde = no prazo, cinza = em orçamento. */
const stDot = o => o.status==='risco'?'var(--red)':o.status==='ok'?'var(--green)':'#8a938f';
const stTxt = o => o.status==='risco'?'em risco':o.status==='ok'?'no prazo':'em orçamento';
function renderSide(){
  recalcTransf();
  const v=state.visao, emC=state.modo==='c', ss=sessoes(), foco=CASCA.obraFoco=obraFoco();
  const sess = x => { const on=emC && state.sessao===x.id;
    return `<a class="nav sess ${on?'on':''}" href="#c/${encodeURIComponent(x.id)}"${on?' aria-current="page"':''} onclick="abrirSessao('${x.id}');return false" title="${esc(x.titulo)}"><span class="sess-t">${esc(x.titulo)}</span>${x.quando?`<small>${esc(x.quando)}</small>`:''}</a>`; };
  const vis = (k, ob, n, off) => { const on=emC && v && v.chave===k && (v.obra||null)===(ob||null);
    return `<a class="nav vs ${on?'on':''}${off?' off':''}" href="${hashDe({modo:'c', sessao:emC?state.sessao:idGeral(), visao:{chave:k, obra:ob}})}"${on?' aria-current="page"':''}${off?' title="Abre quando o orçamento for aprovado"':''} onclick="abrirVisao('${k}',${ob?`'${ob}'`:'null'});return false">${icon(VISAO_IC[k]||'list')}<span class="sess-t">${rotuloVisao(k)}</span>${n?`<span class="count" aria-label="${n} pendentes">${n}</span>`:''}</a>`; };
  const page = n => { const on=state.modo===n.view, c=n.count&&n.count();
    return `<a class="nav ${on?'on':''}" href="#${n.view}"${on?' aria-current="page"':''} onclick="go('${n.view}');return false">${icon(n.icon)}${n.label}${c?`<span class="count">${c}</span>`:''}</a>`; };
  const geral = ss.filter(x=>!x.escopo || x.escopo==='geral').sort((a,b)=>(b.id===idGeral())-(a.id===idGeral()));
  const ap = NAV_EXTRA.find(n=>n.view==='aprovacoes'), paginas = NAV_EXTRA.filter(n=>PAGINAS.includes(n.view));
  const globais = visoesGlobais().map(k=>vis(k, null, k==='aprovacoes'&&ap&&ap.count ? ap.count() : k==='estoque' ? TRANSF.filter(t=>t.sug>0).length : 0)).join('');
  const of=OBRAS.find(o=>o.id===foco), plan=of&&of.status==='plan', pend=of?pendObra(of):[];
  $('side').innerHTML = `
    <div class="brand"><div class="logo">${icon('spark',17)}</div>Canteiro<span class="tag">protótipo</span></div>
    <button type="button" class="side-nova" onclick="novaSessao(escopoAtual())">${icon('plus',16)}Nova conversa</button>
    <nav class="side-bloco" aria-label="Conversas">
      <div class="sec">Conversas</div>
      ${geral.map(sess).join('')}
      ${OBRAS.map(o=>{ const xs=ss.filter(x=>x.escopo===o.id), n=pendObra(o).length;
        return `<div class="grp" title="${o.nome} · ${stTxt(o)}"><span class="dot" style="background:${stDot(o)}" aria-hidden="true"></span><span class="sess-t">${o.nome}</span>${n?`<span class="count" aria-label="${n} pendências">${n}</span>`:`<small>${o.status==='plan'?'orçando':o.progresso+'%'}</small>`}</div>
          ${xs.length ? xs.map(sess).join('') : `<button type="button" class="nav sess sess-nova" onclick="novaSessao('${o.id}')">${icon('plus',14)}Começar uma conversa</button>`}`; }).join('')}
    </nav>
    <nav class="side-bloco" aria-label="Visões">
      <div class="sec">Visões</div>
      ${globais}
      <div class="vs-sel"><label class="sr-only" for="vsObra">Visões da obra</label>
        <select id="vsObra" onchange="CASCA.obraEscolhida=this.value;renderSide();">${OBRAS.map(o=>`<option value="${o.id}"${o.id===foco?' selected':''}>${o.nome}</option>`).join('')}</select>${icon('chevDown',14)}</div>
      ${of?visoesObra().map(k=>vis(k, of.id, k==='hoje'?pendHoje(of).length:pend.filter(p=>p.tela===k).length, plan&&k!=='hoje')).join(''):''}
    </nav>
    ${paginas.map(page).join('')}
    <button class="newbtn" onclick="openWizard(1)">${icon('plus')}Nova obra</button>
    <div class="sec">Protótipo</div>
    <a class="nav" href="#" role="switch" aria-checked="${document.body.classList.contains('notes')}" onclick="document.body.classList.toggle('notes');renderSide();return false">${icon('flask')}<span>Notas de validação</span><span class="toggle" aria-hidden="true"></span></a>
    ${page({view:'fluxos', icon:'map', label:'Mapa de fluxos'})}
    <div class="fict">${icon('info',14)}<span>Dados fictícios. Nenhum botão compra ou envia nada.</span></div>
    <div class="foot"><div class="av">RZ</div><div>Rizzi<br><span>Construtora RZ · Admin</span></div></div>`;
}

/* ===================== HOME: CHAT GLOBAL ===================== */
function aiMsg(tools, html){ return `<div class="msg ai"><div class="aiav">${icon('spark',20)}</div><div class="bub">${tools?`<div class="tools">${tools.map(t=>`<span>${icon('wrench',12)}${t}</span>`).join('')}</div>`:''}${html}</div></div>`; }
function meMsg(t){ return `<div class="msg me">${t}</div>`; }

function renderHome(){
  const ob = OBRAS[0];
  return `
  <div class="chat" style="height:100vh">
    <div class="top"><h1>Bom dia, Rizzi</h1><span class="crumb">3 obras · 1 em risco de prazo · 2 alertas de estoque</span><span class="sp"></span>
      <button class="btn" onclick="go('hub')">Ver todas as obras</button></div>
    <div class="msgs">
      ${val('A home é um chat que enxerga TODAS as obras. Faz sentido começar o dia por aqui, ou o gerente prefere abrir direto um painel com números?')}
      ${aiMsg(['lendo 3 workspaces','prazos','estoque'], `<b>Resumo de hoje</b><br>
        • <b>Casa Vila Nova</b> — previsão de entrega <b>21 dias depois</b> do prazo. Principal causa: vergalhão da Gerdau 9 dias atrasado + 2 vagas de armador abertas.<br>
        • <b>Reforma Loja Centro</b> — 6 dias adiantada e R$ 5.800 abaixo do orçamento.<br>
        • <b>Estoque</b>: parafuso 5/16" e vergalhão acabam esta semana na Vila Nova.<br>
        <div class="row" style="margin-top:12px"><button class="btn" onclick="go('obra','vila-nova','prazos')">Ver prazos da Vila Nova</button><button class="btn" onclick="go('obra','vila-nova','inventario')">Ver estoque</button></div>`)}
      ${meMsg('comprei 1000 parafusos, tem quantos no inventário? por que só tem 100 restantes, onde gastamos os outros 900?')}
      ${aiMsg(['inventário · Casa Vila Nova','movimentações de parafuso 5/16"'], `Dos <b>1.000 parafusos 5/16" × 2"</b> recebidos em 02/10 (pedido PED-0150), restam <b>100</b>. Os 900 foram baixados assim:
        <table><tr><th>Destino</th><th class="num">Qtd</th><th class="num">% do lote</th></tr>
        <tr><td>Estrutura do telhado — tesouras</td><td class="num">450</td><td class="num">45%</td></tr>
        <tr><td>Portão da garagem</td><td class="num">350</td><td class="num">35%</td></tr>
        <tr><td>Porta principal — batente</td><td class="num">100</td><td class="num">10%</td></tr></table>
        <div class="note"><span style="color:var(--red)">${icon('alert',15)}</span><span>O portão consumiu <b>350</b>, contra <b>180</b> previstos no projeto. Vale confirmar com o Luiz (serralheria) se houve perda ou retrabalho.</span></div>
        O resto da obra ainda precisa de ~<b>480</b>. Com 100 em estoque, falta em ~6 dias.<br><br>
        <div class="note"><span style="color:var(--amber)">${icon('bulb',15)}</span><span><b>Antes de comprar:</b> a <b>Reforma Loja Centro</b> tem 420 parafusos iguais e só vai usar mais 80. Dá para trazer <b>300</b> e ainda deixar 40 de reserva lá, pelo preço que ela pagou (<b>R$ 0,39/un, R$ 117</b>), chegando hoje. Os 80 que faltam eu compro na Ciser junto com o próximo pedido.</span></div>
        <div class="row" style="margin-top:12px"><button class="btn amb" onclick="openTransfer(0)">${icon('swap',15)}Trazer 300 da Loja Centro</button><button class="btn" onclick="toast('Pedido PED-0165 aprovado → coluna Aprovado')">Prefiro comprar 500 novos</button><button class="btn" onclick="openInvItem('paraf')">Ver movimentações</button></div>`)}
      ${meMsg('quanto tempo para acabar a Vila Nova? estamos no prazo? recomendações para otimizar')}
      ${aiMsg(['cronograma','pedidos em trânsito','equipe alocada','histórico de produtividade'], `Pelo ritmo atual (estrutura a 62%), a entrega fica para <b>21/07/2027</b>, <b>21 dias</b> depois do prazo (30/06/2027).<br><br>
        <b>Por que atrasa</b><br>• Fornecedor: vergalhão PED-0158 com 9 dias de atraso → segura a laje (9 dias)<br>• Equipe: 2 armadores faltando desde 01/10 → 8 dias<br>• Clima: chuvas de outubro → 4 dias<br><br>
        <b>O que eu faria (recupera ~15 dias; as trocas de fornecedor ainda economizam ~R$ 3,4 mil)</b><br>
        1. Comprar 120 barras na <i>Aço Forte</i> (entrega em 2 dias, +R$ 300) para não parar a laje enquanto a Gerdau não entrega. <span class="pill ok">−6 dias</span><br>
        2. Contratar os 2 armadores por empreitada até o fim da estrutura. <span class="pill ok">−5 dias</span><br>
        3. Adiantar a compra das telhas de Tatuí (prazo de 10 dias) para já, e não deixar para a semana 39. <span class="pill ok">−4 dias</span><br>
        4. Trocar o bloco cerâmico do Depósito São Bento pela Cerâmica Itu (−R$ 0,27/un × 9.500). <span class="pill info">−R$ 2.565</span><br>
        5. Juntar as compras de cimento restantes num pedido só de 220 sc (frete único). <span class="pill info">−R$ 1.100</span>
        <div class="row" style="margin-top:12px"><button class="btn" onclick="go('obra','vila-nova','prazos')">Abrir aba Prazos</button><button class="btn" onclick="toast('Plano salvo como tarefas na obra')">Transformar em plano de ação</button></div>`)}
    </div>
    <div class="chips">
      ${['Qual obra está mais acima do orçamento?','O que chega amanhã nas obras?','Quem está em campo hoje na Vila Nova?','Vai faltar cimento até a laje?','O que está sobrando numa obra e faltando em outra?','Compare fornecedores de bloco em Campinas'].map(c=>`<button class="chip" onclick="toast('(protótipo) o agente responderia aqui')">${c}</button>`).join('')}
    </div>
    <div class="composer">
      <div><span class="attach">${icon('building',13)}Contexto: todas as obras ${icon('chevDown',13)}</span></div>
      <textarea placeholder="Pergunte sobre qualquer obra, ou peça: 'cria uma obra nova com este projeto'…"></textarea>
      <div class="row"><button class="btn sm">${icon('clip',14)}Anexar projeto / NF / foto</button><span class="sp"></span><button class="btn amb" onclick="toast('(protótipo) enviar')">Enviar ${icon('arrowUp',15)}</button></div>
    </div>
  </div>`;
}

/* ===================== HUB DE OBRAS ===================== */
const prazoPill = o => `<span class="pill ${o.status==='plan'?'gray':o.atraso>0?'bad':'ok'}">${prazoTxt(o)}</span>`;
function renderHub(){
  return `<div class="top"><h1>Todas as obras</h1><span class="sp"></span><button class="btn amb" onclick="openWizard(1)">${icon('plus',15)}Nova obra</button></div>
  <div class="page">
    ${val('Que informação o gerente precisa ver em cada cartão para decidir onde ir primeiro? (prazo, dinheiro, estoque, equipe?)')}
    <div class="grid g3">${OBRAS.map(o=>{
      const plan=o.status==='plan', pctB = plan?0:Math.round(o.gasto/o.budget*100), pend=pendObra(o);
      return `<div class="card wscard" onclick="go('obra','${o.id}','hoje')">
        <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><span style="width:8px;height:8px;border-radius:50%;background:${stDot(o)};margin-top:8px;flex:none" title="${stTxt(o)}"></span><span class="name" style="min-width:0">${o.nome}</span></div>
        <div class="mut sm" style="margin:2px 0 8px 16px">${o.tipo} · ${o.local}</div>
        <div style="margin:0 0 16px 16px">${prazoPill(o)}</div>
        ${pend.length?`<div class="sm" style="margin:0 0 16px;color:var(--amberInk);font-weight:500">Pede você: ${resumoPend(pend).join(' · ')}</div>`:''}
        <div class="row sm"><span>${plan?'Orçamento sendo montado no chat':`Obra ${o.progresso}% · fase <b>${o.fase}</b>`}</span></div>
        <div class="bar" style="margin:8px 0 16px"><i style="width:${o.progresso}%;background:${o.cor}"></i></div>
        <div class="grid g2 sm" style="gap:12px 16px"><div><div class="mut">${plan?'Orçamento-alvo':'Orçamento'}</div><b>${brl(o.budget)}</b></div><div><div class="mut">Gasto</div><b>${plan?'—':brl(o.gasto)}</b> ${plan?'':`<span class="mut">(${pctB}%)</span>`}</div>
        <div><div class="mut">Prazo</div><b>${o.prazo}</b></div><div><div class="mut">Previsão</div><b style="color:${o.atraso>0?'var(--redInk)':o.atraso<0?'var(--greenInk)':'inherit'}">${o.previsao}</b></div></div>
      </div>`}).join('')}</div>
  </div>`;
}

/* ===================== OBRA ===================== */
/* Telas da obra: [chave, ícone, rótulo]. Feature nova entra com TABS.push([...]) + TAB_FNS.chave = fn e se encaixa
   numa aba com GRUPOS[i].telas.push([chave, rótulo]). As setas chamam pelo nome na hora para que uma feature possa
   redefinir a função original (ex.: tabEquipe = function(o){...}). */
const TABS = [['hoje','checkCircle','Hoje'],['componentes','bricks','Falta comprar'],['kanban','package','Pedidos'],['inventario','archive','Almoxarifado'],['entreobras','swap','Entre obras'],['overview','chart','Orçamento'],['prazos','clock','Cronograma'],['equipe','users','Equipe']];
const TAB_FNS = {hoje:o=>tabHoje(o), overview:o=>tabOverview(o), componentes:o=>tabComp(o), kanban:o=>tabKanban(o), inventario:o=>tabInv(o), entreobras:o=>tabEntreObras(o), equipe:o=>tabEquipe(o), prazos:o=>tabPrazos(o)};

/* Abas de 1º nível: 4, cada uma com o contador do que pede ação e as telas como segmento de 2º nível.
   A 1ª tela de cada aba é a que abre por padrão. */
const GRUPOS = [
  {k:'hoje',        label:'Hoje',        icon:'checkCircle', telas:[['hoje','Hoje']],                                                                   pend:o=>pendHoje(o)},
  {k:'suprimentos', label:'Suprimentos', icon:'package',     telas:[['componentes','Falta comprar'],['kanban','Pedidos'],['inventario','Almoxarifado'],['entreobras','Entre obras']], pend:o=>pendSuprimentos(o)},
  {k:'custos',      label:'Custos',      icon:'chart',       telas:[['overview','Orçamento'],['medicoes','Medições']],                             pend:o=>pendCustos(o)},
  {k:'execucao',    label:'Execução',    icon:'clock',       telas:[['prazos','Cronograma'],['diario','Diário'],['equipe','Equipe']],              pend:o=>pendExecucao(o)},
];
const grupoDe = tela => GRUPOS.find(g=>g.telas.some(t=>t[0]===tela));

/* Contadores = o que pede ação nesta obra (não o total de itens). Cada função devolve [{tipo, txt, tela}];
   o contador da aba é o tamanho da lista e o do segmento conta os itens com aquela tela. Só lê dados existentes:
     Hoje ........ propostas do agente pendentes para esta obra (pendentes(obraId), proativo.js)
     Suprimentos . pedidos recebidos com a NF ainda por conferir (última coluna, !conf)
                   + insumos que ainda faltam comprar (contaDe(...).comprar > 0, o critério da faixa do ciclo)
     Custos ...... contratos com pago acima do executado, fora o adiantamento previsto em contrato
                   e o pagamento já segurado (CONTRATOS, gHold, gestao.js)
     Execução .... RDO aguardando confirmação do áudio (RDO) + documentação vencida da equipe, ex. ASO (EQ.docs 'bad') */
const temDados = o => o && o.status!=='plan' && DADOS[o.id];
function pendHoje(o){ return typeof pendentes==='function' ? pendentes(o.id).map(p=>({tipo:'proposta', txt:p.titulo||p.tit||'proposta do agente', tela:'hoje'})) : []; }
function pendSuprimentos(o){
  if(!temDados(o)) return [];
  const d=dados(o.id), ult=KCOLS.length-1;
  const nf=d.lotes.filter(l=>l.col===ult && !l.conf).map(l=>({tipo:'nf', txt:`conferir NF do ${l.id}`, tela:'kanban'}));
  const falta=d.inv.filter(i=>contaDe(o.id,i.id).comprar>0)          // mesmo critério da faixa do ciclo
    .map(i=>({tipo:'falta', txt:`${i.nome}: falta comprar`, tela:'componentes'}));
  return [...nf, ...falta];
}
function pendCustos(o){
  if(!temDados(o) || typeof CONTRATOS==='undefined') return [];
  return (CONTRATOS[o.id]||[]).filter(c=>!c.orc && !c.nota && gPago(c)>gExeR(c) && !(typeof gHold==='function' && gHold(o.id,c))).map(c=>({tipo:'segurar', txt:`${c.emp}: pago acima do executado`, tela:'medicoes'}));
}
function pendExecucao(o){
  if(!temDados(o)) return [];
  const rdo = typeof RDO!=='undefined' ? (RDO[o.id]||[]).filter(r=>r.aguarda).map(r=>({tipo:'rdo', txt:`RDO de ${r.d} aguardando o áudio`, tela:'diario'})) : [];
  const docs = typeof EQ!=='undefined' && EQ[o.id] ? (EQ[o.id].docs||[]).filter(x=>x[2]==='bad').map(x=>({tipo:'doc', txt:`${x[0]}: ${x[1]}`, tela:'equipe'})) : [];
  return [...rdo, ...docs];
}
const pendObra = o => GRUPOS.flatMap(g=>g.pend(o));
const TIPO_PEND = {proposta:['proposta do agente','propostas do agente'], nf:['NF a conferir','NFs a conferir'], falta:['insumo a comprar','insumos a comprar'],
  segurar:['pagamento a segurar','pagamentos a segurar'], rdo:['RDO aguardando','RDOs aguardando'], doc:['documento vencido','documentos vencidos']};
function resumoPend(lista){
  const n={}; lista.forEach(p=>n[p.tipo]=(n[p.tipo]||0)+1);
  return Object.entries(n).map(([t,k])=>`${k} ${(TIPO_PEND[t]||[t,t])[k>1?1:0]}`);
}

/* Hoje: o que pede você nesta obra. Esqueleto da base; a etapa 2 preenche (propostas, 3 números). */
function tabHoje(o){
  if(o.status==='plan') return `<div class="card vazio">${icon('message',26)}<h2>O orçamento do ${o.nome} está no painel do agente</h2>
    <p class="mut">O agente espera as suas respostas para fechar o orçamento. Quando você aprovar, ele cria as etapas, os insumos, os pedidos e o cronograma, e as outras abas abrem.</p>
    ${PAINEL.aberto?'':botao('Abrir o painel do agente','abrirPainel(true)',{pri:true,icone:'message'})}</div>`;
  const linhas = GRUPOS.filter(g=>g.k!=='hoje').map(g=>{ const p=g.pend(o);
    return `<div class="ld"><div class="ld-prazo t-${p.length?'pede':'ok'}">${p.length?p.length+' pendente'+(p.length>1?'s':''):'em dia'}</div>
      <div class="ld-txt"><div class="ld-tit">${g.label}</div><div class="ld-conta">${p.length?resumoPend(p).join(' · '):'nada pede você agora'}</div></div><div class="ld-valor"></div>
      <div class="ld-acts">${botao('Abrir '+g.label.toLowerCase(), `go('obra','${o.id}','${(p[0]||{}).tela||g.telas[0][0]}')`, {sm:true})}</div></div>`; });
  const props = pendHoje(o);
  return `<div class="row" style="margin-bottom:12px"><h2 class="sectit" style="margin:0">O que pede você nesta obra</h2><span class="sp"></span>
      ${props.length?`<a class="link" href="#aprovacoes" onclick="go('aprovacoes');return false">${props.length} ${props.length>1?'propostas':'proposta'} do agente em Aprovações ${icon('arrowRight',13)}</a>`:''}</div>
    ${listaDecisoes(linhas)}`;
}
/* Entre obras: as transferências desta obra (cedidas e recebidas), com a faixa do ciclo. */
function tabEntreObras(o){ return `${cicloFaixa(o.id)}${estoqueCorpo(o.id, 3)}`; }

/* Obra em orçamento (Galpão): só Hoje e o painel do agente; as outras telas esperam o orçamento fechar. */
function emOrcamento(o){
  const nome=(TABS.find(t=>t[0]===state.tab)||[,,'Esta tela'])[2];
  return `<div class="card vazio">${icon('hourglass',26)}<h2>${nome}: disponível depois do orçamento</h2>
    <p class="mut">O ${o.nome} ainda está em orçamento. Quando você aprovar o orçamento no chat, o agente cria as etapas, os insumos, os pedidos e o cronograma desta obra.</p>
    <button class="btn amb" onclick="go('obra','${o.id}','chat')">${icon('message',15)}Continuar o orçamento no chat</button></div>`;
}
function statusObra(o){
  if(o.status==='plan') return `${prazoPill(o)}<span>Orçamento-alvo <b>${brl(o.budget)}</b></span><span class="sepr">·</span><span>${o.tipo}</span><span class="sepr">·</span><span>${o.local}</span>`;
  return `<span><b>${o.fase} ${o.progresso}%</b></span><span class="sepr">·</span><span>entrega prevista <b>${o.previsao}</b> (contrato ${o.prazo})</span>${prazoPill(o)}<span class="sepr">·</span><span>${o.local}</span>`;
}
/* Ações que o chat da obra propõe (todas registram e podem ser desfeitas). */
function cobrarGerdau(){
  registrar('Lembrete criado: cobrar a Gerdau (PED-0158 · 3.200 kg de aço) amanhã às 9h', {obra:'vila-nova', origem:'agente'});
  const e=LOG[0]; toastDesfazer('Lembrete: cobrar a Gerdau amanhã às 9h', ()=>{ const k=LOG.indexOf(e); if(k>=0) LOG.splice(k,1); });
}
function remarcarConcretagem(){
  const l=LOTES.find(x=>x.id==='PED-0166'); if(!l||l.remarcada) return toast('A concretagem já está em sex 06/11 07h');
  const eta=l.eta; l.eta='concretagem sex 06/11 07h (remarcada pela chuva)'; l.remarcada=true;
  registrar('Concretagem da laje do 2º pav. remarcada de qui 05/11 para sex 06/11 07h · PED-0166 · Concrecamp', {obra:'vila-nova', origem:'agente'});
  toastDesfazer('Concretagem remarcada para sex 06/11 07h · Concrecamp confirmou a vaga', ()=>{ l.eta=eta; l.remarcada=false; });
  render();
}
function exigirPalete(){
  const l=LOTES.find(x=>x.id==='PED-0162'); if(!l||l.palete) return toast('Palete já exigido no PED-0162');
  const eta=l.eta; l.palete=true; l.eta=eta+' · palete exigido';
  registrar('Exigido palete na entrega do PED-0162 (9.000 blocos · Cerâmica Itu) · quebra de 15% no PED-0149', {obra:'vila-nova', origem:'agente'});
  toastDesfazer('Cerâmica Itu avisada: o PED-0162 só é recebido em palete', ()=>{ l.eta=eta; l.palete=false; });
  render();
}

/* O antigo painel do agente virou a conversa do centro. PAINEL.aberto = a conversa está à vista (não está em
   tela cheia); abrirPainel leva de volta à conversa e foca o campo. CHATS segue como histórico das sessões da obra
   (usado pelo fallback da casca enquanto js/features/conversa.js não define SESSOES). */
const PAINEL = { get aberto(){ return state.modo==='c' && !(state.visao && state.visao.cheia); } };
function manterRolagem(fn){ const m=$('main'), y=m.scrollTop; fn(); m.scrollTop=y; }
function abrirPainel(focar){ if(state.modo!=='c') go(state.obra?'obra':'home', state.obra, 'chat'); else if(state.visao && state.visao.cheia) telaCheia(false); if(focar) focarCampo(); }
function fecharPainel(){ if(state.visao) fecharVisao(); }
function alternarPainel(){ abrirPainel(true); }
const CHATS = {
  'vila-nova':{sess:[['Atraso do aço (Gerdau)','hoje'],['Concretagem da laje × chuva','hoje'],['Quebra do bloco','27/10'],['Medição da Equipe Silva','26/10'],['Orçamento inicial','03/03']],
    msgs:()=>{ const aco=LOTES.find(l=>l.id==='PED-0167'), conc=LOTES.find(l=>l.id==='PED-0166'), blo=LOTES.find(l=>l.id==='PED-0162');
      const i=INV.find(x=>x.id==='aco'), sal=i.ent-i.sai, k=contaDe('vila-nova','aco'), cam=k.aCaminho, f=k.faltaSemTransf+k.cotando;   // falta antes de aprovar: inclui o que está em cotação (PED-0167)
      return `
    ${meMsg('a Gerdau confirmou data para o aço?')}
    ${aiMsg(['pedido PED-0158','e-mail do fornecedor','almoxarifado'], `Ainda não. O PED-0158 (3.200 kg de aço cortado e dobrado, R$ 25.280) estava previsto para 19/10 e está <b>9 dias atrasado</b>. Último contato em 24/10: "previsão sem data".<br><br>
      No almoxarifado há <b>${num(sal)} kg</b>: dá até ~30/10 na armação da laje do 2º pav.<br>
      A obra precisa de <b>${num(i.nec)} kg</b> até o fim. Tirando o saldo e os ${num(cam)} kg a caminho, <b>faltam ${num(f)} kg</b> de qualquer jeito. Proposta: comprar esses ${num(f)} kg na <b>Aço Forte</b>, entrega em 2 dias, R$ 8,40/kg = R$ 5.040 (+R$ 300 contra o preço da Gerdau). A laje não para, e não compro nada do que já está pedido.
      <div class="row" style="margin-top:12px">${aco&&aco.col===0?`<button class="btn amb" onclick="moverLote('PED-0167',1)">Aprovar PED-0167 · ${num(f)} kg na Aço Forte</button>`:`<span class="pill ok">${icon('check',12)}PED-0167 ${aco?KCOLS[aco.col].toLowerCase():'pedido'}</span>`}<button class="btn" onclick="cobrarGerdau()">Cobrar a Gerdau amanhã 9h</button><button class="btn" onclick="go('obra','vila-nova','kanban')">Ver em Pedidos</button></div>`)}
    ${meMsg('e a concretagem da laje na quinta, mantém?')}
    ${aiMsg(['previsão do tempo','PED-0166 · Concrecamp','cronograma'], `A previsão para <b>quinta 05/11</b> é de <b>80% de chuva</b>. A concretagem está marcada para as 07h: <b>38 m³ de concreto usinado fck 25 MPa + bomba lança</b>, Concrecamp a R$ 485/m³ (Supermix R$ 498, Polimix R$ 512).<br><br>
      Sugiro <b>remarcar para sexta 06/11, 07h</b>: a Concrecamp tem vaga. Não mexe no prazo, porque a armação só fecha com o aço da Aço Forte, e evita lançar concreto na chuva.
      <div class="row" style="margin-top:12px">${conc&&conc.remarcada?`<span class="pill ok">${icon('check',12)}remarcada para sex 06/11 07h</span>`:`<button class="btn amb" onclick="remarcarConcretagem()">Remarcar para sex 06/11</button><button class="btn" onclick="toast('Mantida qui 05/11 07h · aviso se a previsão piorar')">Manter quinta</button>`}</div>`)}
    ${meMsg('entraram 4.000 blocos semana passada, por que só tem 2.760?')}
    ${aiMsg(['almoxarifado · bloco 14×19×29','movimentações'], `Dos <b>4.000</b> do PED-0149 (Cerâmica Itu, 20/10) saíram <b>1.240</b>: <b>1.050 assentados</b> na alvenaria do térreo (eixos A–C) e <b>190 quebrados</b>. Quebra de <b>15%</b>, contra 5% previsto. 110 quebraram na descarga: o caminhão veio <b>sem palete</b>.<br><br>
      O próximo lote, PED-0162 (9.000 un), sai em 31/10. Sugiro exigir palete na entrega.
      <div class="row" style="margin-top:12px">${blo&&blo.palete?`<span class="pill ok">${icon('check',12)}palete exigido no PED-0162</span>`:`<button class="btn amb" onclick="exigirPalete()">Exigir palete no PED-0162</button>`}<button class="btn" onclick="openInvItem('bloco','vila-nova')">Ver movimentações</button></div>`)}`; }},
  'loja-centro':{sess:[['Sobras para a Vila Nova','hoje'],['Prazo de entrega','22/10'],['Recebimento do porcelanato','24/10'],['Orçamento inicial','10/07']],
    msgs:()=>{ const tc=TRANSF.find(t=>t.inv==='cim'), tp=TRANSF.find(t=>t.inv==='paraf');
      return `
    ${meMsg('o que sobra aqui que dá para mandar para a Vila Nova?')}
    ${aiMsg(['almoxarifado · Loja Centro','almoxarifado · Vila Nova'], `Três coisas sobram aqui:<br>
      • <b>Cimento</b>: 26 sc, vencem em 25 dias e vocês só usam mais 4. Podem sair <b>20</b> (fica uma reserva de 2). A Vila Nova precisa de 34 mesmo contando os 120 a caminho.<br>
      • <b>Parafuso 5/16"</b>: 420, vocês usam mais 80. Podem sair <b>300</b>; a Vila Nova precisa de 380.<br>
      • <b>Porcelanato 60×60</b>: sobraram 18 m². A Vila Nova ainda não comprou piso; deixo anotado como sobra.<br><br>
      Tudo a preço de custo do lote original, com o seu OK.
      <div class="row" style="margin-top:12px">${tc?`<button class="btn amb" onclick="openTransfer('cim')">${icon('swap',15)}Transferir ${tc.sug} sc de cimento</button>`:`<span class="pill info">${icon('swap',12)}cimento já pedido</span>`}${tp?`<button class="btn" onclick="openTransfer('paraf')">${icon('swap',15)}Transferir ${tp.sug} parafusos</button>`:`<span class="pill info">${icon('swap',12)}parafuso já pedido</span>`}</div>`)}
    ${meMsg('estamos no prazo?')}
    ${aiMsg(['cronograma','orçamento','pedidos'], `Sim: <b>6 dias adiantada</b>. A previsão de entrega é <b>09/12</b>, contra 15/12 no contrato. O piso foi assentado em 4 dias (6 previstos) e a elétrica terminou uma semana antes.<br><br>
      Dinheiro: gasto <b>R$ 104.300</b>, projeção <b>R$ 139.200</b>, <b>R$ 5.800 abaixo</b> do orçamento de R$ 145.000. Acabamento em 81%.<br>
      Para fechar: faltam <b>5 rejuntes</b> (PED-0118, em cotação) e <b>6 kg de prego</b> para o forro, que podem vir da Vila Nova. A argamassa AC-III (PED-0112) chega amanhã.
      <div class="row" style="margin-top:12px"><button class="btn" onclick="go('obra','loja-centro','prazos')">Abrir Prazos</button><button class="btn" onclick="openTransfer('prego')">${icon('swap',15)}Pedir 6 kg de prego da Vila Nova</button></div>`)}`; }},
  'galpao':{sess:[['Orçamento inicial','agora']],
    msgs:()=>`
    ${meMsg(`<span class="attach">${icon('file',13)}projeto-galpao-sumare.pdf · 38 pág.</span><span class="attach">${icon('ruler',13)}planta-baixa.dwg</span><br>Galpão logístico 1.200 m², estrutura metálica, piso industrial 5 t/m². Orçamento-alvo R$ 2,4 mi, início em jan/2027, 7 meses. Fases: terraplenagem, fundação, estrutura metálica, fechamento, piso, instalações, entrega.`)}
    ${aiMsg(['lendo projeto (38 pág.)','levantamento de quantitativos','cotando 64 insumos em Sumaré/Campinas'], `Li o projeto. Antes de fechar o orçamento, preciso de 2 respostas:<br>1. O piso de 5 t/m² vai com <b>fibra de aço</b> ou <b>tela soldada</b>? Muda cerca de R$ 90 mil.<br>2. O fechamento lateral é <b>telha termoacústica</b> ou <b>simples</b>?<br><br><span class="mut">Prévia: com as opções mais comuns, o custo fica em R$ 2,51–2,63 mi, <b>5–10% acima do orçamento-alvo</b>. As abas de insumos, pedidos e prazos abrem quando o orçamento for aprovado.</span>`)}`},
};

function tabOverview(o){
  if(o.status==='plan') return `<div class="card row">O orçamento ainda está sendo montado no chat. <a class="link" href="#" onclick="go('obra','galpao','chat');return false">Abrir chat ${icon('arrowRight',14)}</a></div>`;
  const diff = o.previsto - o.budget;
  return `${val('O "budget é realista?" no topo responde a pergunta certa? Que margem de risco um gerente considera aceitável (5%? 10%)?')}
  <div class="grid g4">
    <div class="card kpi"><div class="l">Budget definido</div><div class="v">${brl(o.budget)}</div><div class="s mut">no cadastro da obra</div></div>
    <div class="card kpi"><div class="l">Custo previsto pelo agente</div><div class="v">${brl(o.previsto)}</div><div class="s" style="color:var(--red)">${icon('trendUp',14)} ${brl(diff)} (+${(diff/o.budget*100).toFixed(1)}%)</div></div>
    <div class="card kpi"><div class="l">Já gasto (pago)</div><div class="v">${brl(o.gasto)}</div><div class="s mut">${Math.round(o.gasto/o.budget*100)}% do budget · obra em ${o.progresso}%</div></div>
    <div class="card kpi"><div class="l">Comprometido (pedidos)</div><div class="v">${brl(o.comprometido)}</div><div class="s mut">inclui ${brl(o.comprometido-o.gasto)} a pagar</div></div>
  </div>
  <div class="grid" style="grid-template-columns:1.4fr 1fr;margin-top:18px">
    <div class="card"><h3>Orçamento por etapa <small>· previsto × projeção atual</small></h3>
      <table><tr><th>Etapa</th><th class="num">Orçado em 03/03</th><th class="num">Projeção hoje</th><th class="num">Δ</th></tr>
      ${ORC.map(c=>{ const p=c.prev, r=c.real, d=r-p;
        return `<tr><td>${c.cat}</td><td class="num">${brl(p)}</td><td class="num">${brl(r)}</td><td class="num" style="color:${d>0?'var(--red)':d<0?'var(--green)':'var(--faint)'}">${d===0?'—':(d>0?'+':'')+brl(d).replace('R$ ','')}</td></tr>`}).join('')}
      <tr><td><b>Total</b></td><td class="num"><b>${brl(ORC.reduce((a,c)=>a+c.prev,0))}</b></td><td class="num"><b>${brl(ORC.reduce((a,c)=>a+c.real,0))}</b></td><td></td></tr>
      </table></div>
    <div class="card agentnote"><h3>${icon('spark',17)}O budget é realista?</h3>
      <p style="margin:0 0 14px"><b>Quase.</b> Com os preços de hoje em Campinas, a obra fecha em <b>${brl(o.previsto)}</b>, <b>4,6% acima</b> do budget. O aço (+R$ 6,9 mil) e a alvenaria (+R$ 3,8 mil) puxam a alta.</p>
      <b class="sm">Economias encontradas</b>
      <table class="sm" style="margin-top:6px">
        <tr><td>Bloco: Cerâmica Itu no lugar do São Bento</td><td class="num" style="color:var(--green)">−R$ 2.565</td></tr>
        <tr><td>Cimento em pedido único de 220 sc</td><td class="num" style="color:var(--green)">−R$ 1.100</td></tr>
        <tr><td>Telha direto de Tatuí (comprar antes)</td><td class="num" style="color:var(--green)">−R$ 2.457</td></tr>
        <tr><td>Areia do porto, não do depósito</td><td class="num" style="color:var(--green)">−R$ 952</td></tr>
        <tr><td>Fio: Elétrica Central no lugar da Leroy</td><td class="num" style="color:var(--green)">−R$ 550</td></tr>
        <tr><td><b>Total</b></td><td class="num"><b style="color:var(--green)">−R$ 7.624</b></td></tr>
      </table>
      <p class="sm mut" style="margin:12px 0 0">Mesmo aplicando tudo, ainda faltam ~R$ 20,7 mil. Sugestão: rever o acabamento (porcelanato 90×90 → 60×60 economiza ~R$ 14 mil).</p>
      <button class="btn amb" style="margin-top:14px" onclick="toast('5 economias aplicadas ao orçamento')">Aplicar economias</button></div>
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="card"><h3>Gasto × avanço físico</h3>
      <div class="sm mut">Dinheiro gasto ${Math.round(o.gasto/o.budget*100)}% · obra concluída ${o.progresso}%</div>
      <div class="split" style="margin:10px 0"><div style="width:${o.progresso}%;background:var(--green)"></div><div style="width:${Math.round(o.gasto/o.budget*100)-o.progresso}%;background:var(--red)"></div></div>
      <div class="legend"><span><i style="background:var(--green)"></i>alinhado ao avanço</span><span><i style="background:var(--red)"></i>gasto à frente do avanço (1 p.p.)</span></div></div>
    <div class="card"><h3>Fases</h3>${FASES.slice(0,5).map(f=>`<div class="row sm" style="margin:8px 0"><span style="width:170px">${f.n}</span><div class="bar sp"><i style="width:${f.pct}%;background:${f.pct===100?'var(--green)':'var(--accentHi)'}"></i></div><span class="mut" style="width:36px;text-align:right">${f.pct}%</span></div>`).join('')}</div>
  </div>`;
}

/* ===================== SUPRIMENTOS: ciclo, conta e ações (Dev Suprimentos) =====================
   Faixa do ciclo no topo de Falta comprar, Pedidos, Almoxarifado, Entre obras e #estoque:
   Falta → Em cotação → A caminho → Conferir NF → Sobra, com contagem; clicar leva à tela e ao filtro.
   A conta de cada insumo vem de contaDe (data.js) e é sempre desenhada com linhaConta. */
/* CSS de Suprimentos (tokens da base; um nível de caixa; sem faixa lateral; nada < 12 px). */
addCSS(`
.page:has(> .ciclo){overflow-x:clip}
.ciclo{position:sticky;top:0;z-index:4;display:flex;align-items:stretch;gap:var(--s1);margin:0 calc(-1*var(--s2)) var(--s4);padding:var(--s2);background:var(--bg);border-bottom:1px solid var(--line)}
.ciclo-et{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:var(--s2);padding:6px 10px;border:1px solid transparent;border-radius:8px;background:none;text-align:left;transition:background-color .12s var(--ease),transform .12s var(--ease)}
.ciclo-et:active{transform:scale(.97)}
.ciclo-et.on{background:#fff;border-color:var(--line);box-shadow:var(--shadow)}
.ciclo-n{font:600 var(--t-bloco)/1 var(--serif);font-variant-numeric:tabular-nums;color:var(--muted);min-width:1.1em}
.ciclo-n.t-pede{color:var(--amberInk)} .ciclo-n.t-perda{color:var(--redInk)} .ciclo-n.t-caminho{color:var(--blueInk)}
.ciclo-l{display:flex;flex-direction:column;min-width:0;font-weight:600;font-size:var(--t-body);line-height:1.25;color:var(--ink)}
.ciclo-l small{font-weight:400;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ciclo-l small.t-perda{color:var(--redInk);font-weight:500}
.ciclo-seta{display:flex;align-items:center;color:var(--muted);flex:none}
@media (hover:hover){ .ciclo-et:not(.on):hover{background:rgba(255,255,255,.6)} }
.sup-filtro{display:flex;align-items:center;gap:var(--s2);margin:0 0 var(--s4);font-size:var(--t-meta);color:var(--ink2)}
.sup-filtro .link{border:0;background:none;padding:0;cursor:pointer;margin-left:var(--s1);text-decoration:underline;text-underline-offset:3px}
.sup-cab{display:flex;align-items:center;flex-wrap:wrap;gap:var(--s2) var(--s3);margin:0 0 var(--s4)}
.sup-cab .sup-h{margin:0}
.sup-frase{margin:0;font-size:var(--t-sec);margin-right:auto;max-width:68ch}
.sup-bloco{margin:0 0 var(--s5)}
.sup-h{font:600 var(--t-sec)/1.3 var(--serif);letter-spacing:-.01em;margin:0 0 var(--s3)}
.sup-h .mut{font:400 var(--t-meta) var(--sans);letter-spacing:0}
.sup-sub{margin:calc(-1*var(--s2)) 0 var(--s3);font-size:var(--t-meta);color:var(--muted);max-width:68ch}
.ld-conta .lc{font-size:var(--t-meta);line-height:1.5}
.sup-tab td{vertical-align:top}
.sup-tab td,.sup-tab th{padding:10px 12px}
.sup-tab .lc{font-size:var(--t-meta);line-height:1.45}
.sup-tab .lc-eq{gap:2px 6px}
.sup-tab th.ck,.sup-tab td.ck{width:44px;padding-right:0}
.sup-tab td.ck input{width:16px;height:16px;margin:3px 0 0;accent-color:var(--accent)}
.sup-tab tr.click{cursor:pointer}
@media (hover:hover){ .sup-tab tr.click:hover td{background:#fafbfb} }
.sup-tab td:first-child:not(.ck),.sup-tab td.ck+td{min-width:200px}
.sup-acao{width:1%;white-space:nowrap;text-align:right}
.sup-acao .sm{margin-top:4px}
.sup-tab .t-perda,.kc .t-perda,.sup-bloco .t-perda{color:var(--redInk);font-weight:600}
.sup-tab .t-pede{color:var(--amberInk);font-weight:600}
.sup-pe-bloco{display:flex;align-items:center;gap:var(--s3);padding:12px 20px;border-top:1px solid var(--line2);background:var(--sunk)}
.sup-pe-bloco .sm{max-width:60ch}
.sup-vazio{display:flex;align-items:center;gap:var(--s2);color:var(--greenInk)}
.sup-cob{margin:0 0 var(--s5)}
.sup-cob>summary{display:flex;align-items:center;gap:var(--s2);cursor:pointer;list-style:none;font:600 var(--t-sec)/1.3 var(--serif);letter-spacing:-.01em;margin:0 0 var(--s3);width:max-content;max-width:100%}
.sup-cob>summary::-webkit-details-marker{display:none}
.sup-cob>summary .mut{font:400 var(--t-meta) var(--sans);letter-spacing:0}
.sup-cob .chev,.kb-hist .chev{color:var(--muted);transition:transform .15s var(--ease)}
.sup-cob[open]>summary .chev,.kb-hist[open]>summary .chev{transform:rotate(90deg)}
.sup-kpis{margin:0 0 var(--s5)}
.sup-nota{margin-top:var(--s3);max-width:62ch}
.sup-kb{gap:var(--s2);align-items:start}
.sup-kb .col{min-height:0}
.sup-kb .col h3{margin:0 0 10px;padding:4px 2px 8px;border-bottom:2px solid var(--line);font:600 var(--t-meta)/1.3 var(--sans);letter-spacing:0;display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}
.sup-kb .col h3 small{color:var(--muted);font-weight:400;margin-left:auto;font-size:var(--t-meta)}
.sup-kb .kc{display:flex;flex-direction:column;gap:2px}
.kc-top{display:flex;align-items:center;gap:4px;flex-wrap:wrap;color:var(--muted);margin-bottom:2px}
.kc-id{margin-right:auto;font-variant-numeric:tabular-nums}
.kc-q{color:var(--ink2)}
.kc-ef,.kc-lig{color:var(--muted)}
.kc-lig{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.kc-pe{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-top:8px}
.kc-v{margin:0!important;color:var(--ink);font-weight:600!important;font-variant-numeric:tabular-nums}
.kc-pe .btn{white-space:normal;text-align:left;padding:4px 9px;font-size:var(--t-meta)}
.kb-vazio{margin:0;padding:6px 4px;font-size:var(--t-meta);color:var(--muted)}
.kb-hist{margin-top:var(--s2)}
.kb-hist>summary{display:flex;align-items:center;gap:4px;cursor:pointer;list-style:none;font-size:var(--t-meta);color:var(--ink2);font-weight:500;padding:4px 2px}
.kb-hist>summary::-webkit-details-marker{display:none}
.kb-hist[open]>summary{margin-bottom:var(--s2)}
.cap{margin:var(--s2) 0 0}
.cap .split{height:12px;border-radius:4px;margin-bottom:6px}
.cap.mini .split{height:8px;max-width:360px}
.trf-lista{padding:0}
.trf-l{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:var(--s4);align-items:center;padding:14px 20px;border-top:1px solid var(--line2)}
.trf-l:first-child{border-top:0}
.trf-txt{min-width:0}
.trf-pe{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start}
.trf-ac{margin:0 0 8px;max-width:68ch}
.trf-cmp td:first-child{white-space:nowrap}
.sup-como{margin-top:var(--s3);font-size:var(--t-meta);color:var(--ink2)}
.sup-como summary{display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:var(--muted);font-weight:500}
.sup-como p{margin:6px 0 0;max-width:68ch}
.sup-dconta{margin:var(--s4) 0 0;padding:12px 16px;background:#fff;border:1px solid var(--line);border-radius:8px}
.modal .sup-dconta{background:var(--sunk);border-color:var(--line2)}
.sup-dh{font:600 var(--t-sec)/1.3 var(--serif);letter-spacing:-.01em;margin:var(--s5) 0 var(--s3)}
.sup-nota-ag{margin:var(--s4) 0;font-size:var(--t-meta);padding:12px 16px}
.sup-depois{margin:var(--s3) 0 0;color:var(--ink2)}
.sup-pq{display:flex;gap:var(--s2);align-items:flex-start;margin:var(--s3) 0 0;color:var(--ink2);max-width:68ch}
.sup-pq .ic{color:var(--pine);margin-top:3px}
.sup-forn{padding:0}
.sup-fl{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:var(--s3);align-items:center;padding:12px 16px;border-top:1px solid var(--line2)}
.sup-fl:first-child{border-top:0}
.sup-leg .row{margin:6px 0}
.sup-leg i{width:9px;height:9px;border-radius:3px;flex:none}
.sup-pct{width:42px;text-align:right}
.drawer .pane:has(> .sup-pe){padding-bottom:0}
.sup-pe{position:sticky;bottom:0;z-index:2;display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap;margin:var(--s5) -32px 0;padding:14px 32px 18px;background:#fff;border-top:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){ .ciclo-et:active{transform:none} .sup-cob .chev,.kb-hist .chev{transition:none} }
`);
function best(c){ return c.forn.reduce((a,b)=>a.p<b.p?a:b); }
const ULT = () => KCOLS.length-1;
const curtaObra = id => (NOME_OBRA[id]||id).replace('Reforma ','').replace('Casa ','');
const obrasSup = () => OBRAS.filter(o=>temDados(o)).map(o=>o.id);
function insumosDe(ob){ const d=dados(ob); return [...new Set([...d.comp.map(c=>c.inv||c.id), ...d.inv.map(i=>i.id)])]; }
const SUP = {filtro:null, hash:'', feito:{}};          // filtro da faixa do ciclo (vale só na tela em que foi ligado) e aprovações feitas aqui
const ETAPA_TELA = {falta:'componentes', cotacao:'kanban', caminho:'kanban', nf:'kanban', sobra:'entreobras'};
const ETAPA_NOME = {falta:'Falta', cotacao:'Em cotação', caminho:'A caminho', nf:'Conferir NF', sobra:'Sobra'};
const filtroSup = () => SUP.filtro && SUP.hash===location.hash ? SUP.filtro : null;
document.addEventListener('rendered', ()=>{ if(SUP.filtro && location.hash!==SUP.hash) SUP.filtro=null; });
document.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('.docref')) SUP.filtro=null; }, true);   // link de documento mostra tudo
function cicloDe(ids){
  const r={falta:[], cotacao:[], caminho:[], late:0, nf:[], sobra:[]}, ult=ULT();
  ids.forEach(ob=>{
    insumosDe(ob).forEach(inv=>{ if(contaDe(ob,inv).comprar>0) r.falta.push({ob,inv}); });
    dados(ob).lotes.forEach(l=>{ if(l.conf) return; const x={ob,l};
      if(l.col===0) r.cotacao.push(x); else if(l.col<ult){ r.caminho.push(x); if(l.late) r.late++; } else r.nf.push(x); });
  });
  r.sobra=TRANSF.filter(t=>t.sug>0 && (ids.includes(t.origem)||ids.includes(t.destino)));
  return r;
}
function cicloFaixa(ob){
  const c=cicloDe(ob?[ob]:obrasSup()), f=filtroSup(), n=k=>c[k].length;
  const et=[
    ['falta', 'sem pedido', 'pede'],
    ['cotacao', 'para aprovar', 'pede'],
    ['caminho', c.late?`${c.late} atrasado${c.late>1?'s':''}`:'no prazo', c.late?'perda':'caminho'],
    ['nf', n('nf')?'chegou na obra':'nada chegando', 'pede'],
    ['sobra', 'para outra obra', 'caminho'],
  ];
  return `<nav class="ciclo" aria-label="Ciclo de suprimentos">${et.map(([k,s,tom],i)=>{ const on=f===k, q=n(k);
    return `${i?`<span class="ciclo-seta" aria-hidden="true">${icon('arrowRight',14)}</span>`:''}<button type="button" class="ciclo-et${on?' on':''}" aria-pressed="${on}" onclick="irEtapa(${ob?`'${ob}'`:'null'},'${k}')"><span class="ciclo-n${q?' t-'+tom:''}">${q}</span><span class="ciclo-l">${ETAPA_NOME[k]}<small${k==='caminho'&&c.late?' class="t-perda"':''}>${s}</small></span></button>`; }).join('')}</nav>`;
}
function irEtapa(ob, k){
  if(!ob){
    if(k==='sobra'){ SUP.filtro=null; return state.view==='estoque' ? render() : go('estoque'); }
    const c=cicloDe(obrasSup()); ob=((c[k]||[])[0]||{}).ob||'vila-nova';
  }
  const tela=ETAPA_TELA[k], hash=hashPara('obra', ob, tela);
  if(k==='sobra' || (SUP.filtro===k && SUP.hash===hash && location.hash===hash)) SUP.filtro=null;   // clicar de novo tira o filtro
  else { SUP.filtro=k; SUP.hash=hash; }
  if(location.hash===hash) manterRolagem(render); else go('obra', ob, tela);
}
function limparFiltro(){ SUP.filtro=null; manterRolagem(render); }
const avisoFiltro = k => `<div class="sup-filtro" role="status">${icon('list',14)}Mostrando só <b>${ETAPA_NOME[k]}</b><button type="button" class="link" onclick="limparFiltro()">Mostrar tudo</button></div>`;

/* Pedido: ações nomeadas pela consequência (nunca "Avançar"). Aprovar fica no lugar como "Aprovado 08:14 por Rizzi". */
const PASSO = ['', 'Marcar como enviado', 'Saiu para entrega', 'Marcar como recebido'];
const hhmm = () => new Date().toTimeString().slice(0,5);
function aprovarLote(id){
  const f=acharLote(id); if(!f) return; const l=f.l;
  if(l.col!==0) return toast(`${l.id} já está em ${KCOLS[l.col].toLowerCase()}`);
  const antes={col:l.col, eta:l.eta}; l.col=1; l.eta=ETA_COL[1];
  registrar(`${l.id} · ${l.item}: ${KCOLS[0]} → ${KCOLS[1]} · ${brl(l.v)} · ${l.forn}`, {obra:f.ob});
  const volta=()=>{ Object.assign(l,antes); delete SUP.feito[id]; };
  SUP.feito[id]={feito:'Aprovado', hora:hhmm(), quem:'Rizzi', desfazer:`desfazerAprov('${id}')`, volta};
  toastDesfazer(`${l.id} aprovado · ${brl(l.v)} · ${l.forn}`, volta);
  manterRolagem(render);
}
function desfazerAprov(id){ const f=SUP.feito[id]; if(!f) return; f.volta(); registrar(`Desfez: aprovação do ${id}`); toast(`${id} voltou para Em cotação`); manterRolagem(render); }
function passoLote(id){ const f=acharLote(id); if(!f) return; f.l.col===0 ? aprovarLote(id) : moverLote(id, Math.min(ULT(), f.l.col+1)); }
function cobrarLote(id){
  const f=acharLote(id); if(!f) return; const l=f.l;
  registrar(`Lembrete criado: cobrar ${l.forn} (${l.id} · ${l.q} de ${l.item}) amanhã às 9h`, {obra:f.ob, origem:'agente'});
  const e=LOG[0]; toastDesfazer(`Lembrete: cobrar ${l.forn} amanhã às 9h`, ()=>{ const k=LOG.indexOf(e); if(k>=0) LOG.splice(k,1); });
}
const abateNF = l => l.medido!=null && l.qn>l.medido ? Math.round((l.qn-l.medido)*l.v/l.qn) : 0;
function botaoLote(l, op={}){
  if(l.conf) return '';
  const ult=ULT(), sm=op.sm!==false;
  if(l.col===0) return botao(`Aprovar ${brl(l.v)}`, `aprovarLote('${l.id}')`, {sm, pri:op.pri});
  if(l.col<ult) return botao(PASSO[l.col]||`Mover para ${KCOLS[l.col+1].toLowerCase()}`, `passoLote('${l.id}')`, {sm});
  return botao('Conferir NF', `conferirLote('${l.id}')`, {sm, pri:op.pri!==false, icone:'file'});
}

/* Ação de um item do almoxarifado, na ordem em que pede você. A tabela mostra a 1ª; o drawer, a 1ª no rodapé. */
function acoesItem(ob, invId){
  const d=dados(ob), k=contaDe(ob,invId), ult=ULT(), i=k.item, r=[];
  const nf=d.lotes.find(l=>l.inv===invId&&l.col===ult&&!l.conf);
  const pal=i&&i.quebra && d.lotes.find(l=>l.inv===invId&&!l.conf&&l.palete===false);
  const sob=TRANSF.find(t=>t.inv===invId&&t.origem===ob&&t.sug>0), c=d.comp.find(x=>(x.inv||x.id)===invId);
  if(nf) r.push({label:'Conferir NF', onclick:`conferirLote('${nf.id}')`, doc:nf.id, txt:`${nf.id} chegou`});
  if(pal) r.push({label:`Exigir palete no ${pal.id}`, onclick:`exigirPalete()`, doc:pal.id, txt:`quebra de ${i.quebra.real}%`});
  if(k.cot) r.push({label:`Aprovar ${k.cot.id} · ${brl(k.cot.v)}`, onclick:`aprovarLote('${k.cot.id}')`, doc:k.cot.id, txt:`${k.cot.id} em cotação`});
  if(k.transf) r.push({label:`Trazer ${num(k.transf)} da ${curtaObra(k.tr.origem)}`, onclick:`openTransfer('${invId}')`, txt:`${num(k.transf)} da ${curtaObra(k.tr.origem)}`});
  if(k.comprar>0) r.push({label:`Comprar ${num(k.comprar)} ${k.un}`, onclick:c?`openCheckout(['${c.id}'],{obra:'${ob}'})`:`go('obra','${ob}','componentes')`, txt:`comprar ${num(k.comprar)} ${k.un}`});
  if(sob) r.push({label:`Ceder ${num(sob.sug)} à ${curtaObra(sob.destino)}`, onclick:`openTransfer('${invId}')`, txt:`sobra ${num(sob.sug)} ${k.un}`});
  return r;
}
/* Compatível com quem já lia compraDe/acaoInv (Cronograma, proativo.js): mesma conta de contaDe.
   falta = o que não está no saldo, a caminho nem em cotação · trf = transferência sugerida · compra = o resto. */
function compraDe(obraId, c){
  const invId=c.inv||c.id, k=contaDe(obraId,invId);
  return {invId, comprado:(k.item?k.item.ent:0)+k.aCaminho, falta:k.comprar+k.transf, trf:k.transf, compra:k.comprar, comprar:k.comprar, cot:k.cot, cotando:k.cotando, conta:k};   // compra e comprar já descontam a cotação
}
function acaoInv(o,i){ const a=acoesItem(o.id,i.id); return a.length ? a.map(x=>pill(/Conferir|Exigir/.test(x.label)?'perda':/Trazer|Ceder/.test(x.label)?'caminho':'pede', x.txt)).join(' ') : pill('ok', i.obs||'suficiente'); }
const diasTxt = d => d==null ? '' : d<=0 ? 'acabou' : `${d} d`;
function prazoItem(ob, invId){
  const i=dados(ob).inv.find(x=>x.id===invId), dd=duraDias(i);
  if(dd==null) return {prazo:'aprovar', tom:'pede', dias:null};
  return {prazo: dd<=0?'acabou':/\d\/\d/.test(i.cob)?`acaba ${i.cob.match(/\d{1,2}\/\d{1,2}/)[0]}`:`acaba em ${dd} d`, tom: dd<=7?'perda':'pede', dias:dd};
}
const porDias = (a,b) => (a??1e9)-(b??1e9);

/* Falta comprar: 1º as cotações que esperam você (um clique), depois o que não tem pedido nenhum, e o coberto recolhido. */
const SEL = {};
function selComp(obraId){ if(!SEL[obraId]) SEL[obraId]=new Set(dados(obraId).comp.filter(c=>contaDe(obraId,c.inv||c.id).comprar>0).map(c=>c.id)); return SEL[obraId]; }
function selValida(obraId){ return [...selComp(obraId)].filter(id=>{ const c=dados(obraId).comp.find(x=>x.id===id); return c && contaDe(obraId,c.inv||c.id).comprar>0; }); }
function rotPedido(obraId){
  const d=dados(obraId), ids=selValida(obraId), tot=ids.reduce((a,id)=>{ const c=d.comp.find(x=>x.id===id); return a+best(c).p*contaDe(obraId,c.inv||c.id).comprar; },0);
  return ids.length ? `${icon('cart',15)}Pedir ${ids.length} ${ids.length>1?'insumos':'insumo'} · ${brl(tot)}` : `${icon('cart',15)}Marque um insumo para pedir`;
}
function toggleComp(obraId,id,on){ const s=selComp(obraId); on?s.add(id):s.delete(id); const b=$('btnPedido'); if(b) b.innerHTML=rotPedido(obraId); }
function pedirSel(obraId){ const s=selValida(obraId); if(!s.length) return toast('Marque pelo menos um insumo'); openCheckout(s,{obra:obraId}); }
function fornRec(ob, c){ const k=contaDe(ob,c.inv||c.id); return (k.cot&&c.forn.find(f=>f.n===k.cot.forn))||best(c); }
function tabComp(o){
  const d=dados(o.id), f=filtroSup(), sel=selComp(o.id);
  const its=d.comp.map(c=>({c, inv:c.inv||c.id, k:contaDe(o.id,c.inv||c.id), p:prazoItem(o.id,c.inv||c.id)}));
  const cots=d.lotes.filter(l=>l.col===0||SUP.feito[l.id]).map(l=>({l, p:prazoItem(o.id,l.inv)})).sort((a,b)=>porDias(a.p.dias,b.p.dias));
  const pend=cots.filter(x=>x.l.col===0);
  const falta=its.filter(x=>x.k.comprar>0).sort((a,b)=>porDias(a.p.dias,b.p.dias));
  const cob=its.filter(x=>x.k.comprar<=0 && !cots.some(y=>y.l.inv===x.inv));
  const totFalta=falta.reduce((a,x)=>a+best(x.c).p*x.k.comprar,0);
  const nome = inv => (its.find(x=>x.inv===inv)||{c:{}}).c.nome;
  const cotLinha = ({l,p}) => linhaDecisao({prazo:p.prazo, tom:p.tom, titulo:`${docRef(l.id)} · ${nome(l.inv)||l.item} · ${l.q} · ${l.forn}`,
    conta: l.inv&&d.inv.some(i=>i.id===l.inv) ? linhaConta(contaDe(o.id,l.inv)) : `${l.eta} · o projeto pede ${l.q}, nada no almoxarifado nem a caminho`, valor:l.v,
    acao:{label:`Aprovar ${brl(l.v)}`, onclick:`aprovarLote('${l.id}')`}, foco: l===(pend[0]||{}).l, estado: SUP.feito[l.id]||'pendente'});
  const fornCel = x => { const b=fornRec(o.id,x.c), m=best(x.c), s=[...x.c.forn].sort((p,q)=>p.p-q.p)[1];
    const nota = b===m ? (s?`${brl(Math.round((s.p-b.p)*x.k.comprar))} a menos que o 2º`:'') : `${m.n.split(' ')[0]} é mais barata, mas demora mais`;
    return `${b.n}<div class="sm mut">${brl2(b.p)}/${x.c.un} · ${b.prazo}${nota?` · ${nota}`:''}</div>`; };
  const nomeCel = x => `<b>${x.c.nome}</b><div class="sm mut">${x.c.espec?x.c.espec+' · ':''}${x.c.fase}</div>`;
  return `${cicloFaixa(o.id)}
  ${val('O nível de detalhe do levantamento (quantidades vindas do projeto) bate com o que eles fazem hoje na planilha? Eles confiariam na quantidade estimada pelo agente, ou querem revisar item a item?')}
  ${f?avisoFiltro(f):''}
  <div class="sup-cab"><p class="sup-frase"><b>${falta.length?`${falta.length} ${falta.length>1?'insumos':'insumo'} para comprar · ${brl(totFalta)}`:'Nada para comprar agora'}</b>${pend.length?` · ${pend.length} ${pend.length>1?'cotações esperam':'cotação espera'} você`:''}</p>
    <span class="sm mut">${d.comp.length} de ${o.id==='vila-nova'?64:31} insumos do projeto · preços cotados hoje 07:40</span>
    <button class="btn sm" onclick="toast('(protótipo) exportaria a lista em planilha')">${icon('download',14)}Exportar</button></div>
  ${!f&&cots.length?`<section class="sup-bloco"><h3 class="sup-h">Em cotação, esperando você <span class="mut">(${pend.length})</span></h3>
    <p class="sup-sub">Já estão descontados da falta: aprovar não gera compra em dobro.</p>${listaDecisoes(cots.map(cotLinha))}</section>`:''}
  <section class="sup-bloco"><h3 class="sup-h">Falta comprar <span class="mut">(${falta.length})</span></h3>
    ${falta.length?`<div class="card sup-tab" style="padding:0"><table>
      <thead><tr><th class="ck"><span class="sr-only">Incluir no pedido</span></th><th>Insumo</th><th>Conta</th><th>Fornecedor recomendado</th><th class="num">Total</th></tr></thead>
      <tbody>${falta.map(x=>`<tr class="click" onclick="openComp('${x.c.id}')"><td class="ck"><input type="checkbox" aria-label="Incluir ${esc(x.c.nome)} no pedido" ${sel.has(x.c.id)?'checked':''} onclick="event.stopPropagation();toggleComp('${o.id}','${x.c.id}',this.checked)"></td>
        <td>${nomeCel(x)}</td><td>${linhaConta(x.k)}</td><td>${fornCel(x)}</td><td class="num"><b>${brl(fornRec(o.id,x.c).p*x.k.comprar)}</b></td></tr>`).join('')}</tbody></table>
      <div class="sup-pe-bloco"><span class="sm mut">Comprar = precisa até o fim − saldo − a caminho − em cotação − transferência sugerida. Clique no insumo para comparar fornecedores.</span><span class="sp"></span>
        <button class="btn amb" id="btnPedido" onclick="pedirSel('${o.id}')">${rotPedido(o.id)}</button></div></div>`
      :`<div class="card sup-vazio">${icon('checkCircle',18)}<span>Tudo o que a obra precisa já está no almoxarifado, a caminho, em cotação ou vem de outra obra.</span></div>`}</section>
  ${!f&&cob.length?`<details class="sup-cob"><summary>${icon('chevRight',14,'chev')}Cobertos <span class="mut">(${cob.length})</span><span class="sm mut">· nada a comprar</span></summary>
    <div class="card sup-tab" style="padding:0"><table><thead><tr><th>Insumo</th><th>Conta</th><th>Situação</th></tr></thead><tbody>
    ${cob.map(x=>{ const cam=d.lotes.filter(l=>l.inv===x.inv&&l.col>=1&&!l.conf);
      return `<tr class="click" onclick="openComp('${x.c.id}')"><td>${nomeCel(x)}</td><td>${linhaConta(x.k)}</td><td class="sm">${cam.length?`a caminho: ${cam.map(l=>docRef(l.id)).join(', ')}`:'o saldo cobre até o fim'}</td></tr>`; }).join('')}
    </tbody></table></div></details>`:''}`;
}

/* ===================== PEDIDOS ===================== */
const ETA_COL = ['em cotação','aprovado hoje','pedido enviado hoje','saiu para entrega','recebido hoje · conferir NF'];
function moverLote(id, col){
  const f=acharLote(id); if(!f) return; const l=f.l;
  if(l.conf) return toast(`${l.id} já foi conferido e está no almoxarifado`);
  if(col===l.col) return;
  const antes={col:l.col, eta:l.eta}; l.col=col; l.eta=ETA_COL[col];
  registrar(`${l.id} · ${l.item}: ${KCOLS[antes.col]} → ${KCOLS[col]}`, {obra:f.ob});
  toastDesfazer(`${l.id} → ${KCOLS[col]}${col===4?' · falta conferir a NF':''}`, ()=>Object.assign(l,antes));
  render();
}
function avancarLote(id){ const f=acharLote(id); if(f) moverLote(id, Math.min(KCOLS.length-1, f.l.col+1)); }
function dropLote(e,col){ const id=e.dataTransfer.getData('t'), f=acharLote(id); if(f && f.l.col===0 && col===1) return aprovarLote(id); moverLote(id, col); }
/* Recebido → conferir a NF. A conferência completa (NF-e, divergência, abatimento) é do js/features/campo.js. */
function conferirLote(id){
  if(typeof window.openConferencia==='function') return window.openConferencia(id);
  const {l}=acharLote(id);
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">Conferir recebimento · ${l.id}</h2><div class="mut sm">${l.item} · ${l.forn}</div>
    <label class="l">Quantidade recebida (${l.un})</label><input class="f" id="confQ" type="number" value="${l.medido??l.qn}">
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="conferirSimples('${l.id}')">Conferir e dar entrada</button></div>`;
  $('modal').classList.add('on');
}
function conferirSimples(id){
  const {l,ob}=acharLote(id), q=Math.max(0,+$('confQ').value||0), volta=darEntrada(id,q);
  registrar(`Recebimento ${l.id} conferido · ${num(q)} ${l.un} de ${l.item} no almoxarifado`, {obra:ob});
  closeModal(); toastDesfazer(`${num(q)} ${l.un} de ${l.item} entraram no almoxarifado`, volta); render();
}
/* Pedidos ligados ao mesmo insumo (atrasado ↔ plano B, resto da transferência). */
const ligadosDe = (L, l) => l.inv ? L.filter(x=>x!==l && x.inv===l.inv && !x.conf) : [];
function cartaoLote(l){
  const L=(acharLote(l.id)||{d:{lotes:[]}}).d.lotes, ab=abateNF(l), lig=ligadosDe(L,l);
  const pills=`${l.late?pill('perda','atrasado'):''}${l.trf?pill('caminho',icon('swap',12)+'transferência'):''}${l.ai?pill('info',icon('spark',12)+'sugerido'):''}${l.conf?pill('ok',icon('check',12)+'no almoxarifado'):''}`;
  return `<article class="kc${l.late?' late':''}${l.conf?' done':''}" data-doc="${l.id}" draggable="${!l.conf}" ondragstart="event.dataTransfer.setData('t','${l.id}')">
    <div class="kc-top"><span class="kc-id">${l.id}</span>${pills}</div>
    <b>${l.item}</b><div class="kc-q">${l.q} · ${l.forn}</div>
    <div class="kc-ef">${ab?`<span class="t-perda">abate ${brl(ab)}</span> · ${num(l.medido)} de ${num(l.qn)} ${l.un} medidos`:l.eta}</div>
    ${lig.length?`<div class="kc-lig">${icon('swap',12)}ligado a ${lig.map(x=>docRef(x.id)).join(', ')}</div>`:''}
    <div class="kc-pe"><b class="kc-v">${brl(l.v)}</b>${botaoLote(l,{pri:false})}</div></article>`;
}
const ordemLotes = ls => [...ls].sort((a,b)=>(b.late?1:0)-(a.late?1:0));
function tabKanban(o){
  const L=dados(o.id).lotes, f=filtroSup(), ult=ULT();
  const aberto=L.filter(l=>l.col>=1&&!l.conf).reduce((a,l)=>a+l.v,0), nf=L.filter(l=>l.col===ult&&!l.conf), late=L.filter(l=>l.late&&!l.conf), conf=L.filter(l=>l.conf);
  const cols=KCOLS.map((c,i)=>i).filter(i=>!f || (f==='cotacao'&&i===0) || (f==='caminho'&&i>0&&i<ult) || (f==='nf'&&i===ult));
  const urg=[
    ...nf.map((l,k)=>{ const ab=abateNF(l); return linhaDecisao({prazo:/hoje/.test(l.eta)?'chegou hoje':'na obra', tom:'pede', titulo:`Conferir NF do ${docRef(l.id)} · ${l.item}`,
      conta: ab?`${num(l.medido)} ${l.un} medidos contra ${num(l.qn)} na NF · ${l.forn}`:`${l.q} · ${l.forn}`, valor: ab?`−${brl(ab)}`:l.v,
      acao:{label:'Conferir NF', onclick:`conferirLote('${l.id}')`}, foco:k===0}); }),
    ...late.map(l=>{ const b=ligadosDe(L,l).find(x=>x.col===0), m=String(l.eta).match(/(\d+) dias? atrasad/);
      return linhaDecisao({prazo:m?`${m[1]} dias atrasado`:'atrasado', tom:'perda', titulo:`${docRef(l.id)} · ${l.item} · ${l.q}`,
        conta:`${l.forn} · ${l.eta}${b?` · plano B: ${docRef(b.id)} em cotação`:''}`, valor:l.v,
        acao:{label:`Cobrar ${l.forn.split(' ')[0]}`, onclick:`cobrarLote('${l.id}')`}, sec:b?[{label:`Aprovar plano B ${brl(b.v)}`, onclick:`aprovarLote('${b.id}')`}]:[], foco:!nf.length}); }),
  ];
  return `${cicloFaixa(o.id)}
  ${val('Essas 5 etapas são as reais de um pedido? Falta "Pago"? Quem confere no recebimento é a mestre: conferir a NF pelo celular é viável no canteiro?')}
  ${f?avisoFiltro(f):''}
  <div class="sup-cab"><p class="sup-frase"><b>Pedidos em aberto ${brl(aberto)}</b>${late.length?` · ${late.length} atrasado${late.length>1?'s':''}`:''}${nf.length?` · ${nf.length} para conferir`:''}</p></div>
  ${!f&&urg.length?`<section class="sup-bloco"><h3 class="sup-h">Pede você agora</h3>${listaDecisoes(urg)}</section>`:''}
  <div class="kb5 sup-kb" style="grid-template-columns:repeat(${cols.length},minmax(0,1fr))">${cols.map(i=>{ const ls=ordemLotes(L.filter(l=>l.col===i&&!l.conf)), hist=i===ult?conf:[];
    return `<section class="col" ondragover="event.preventDefault()" ondrop="dropLote(event,${i})" aria-labelledby="kbc${i}"><h3 id="kbc${i}">${i===ult?'Conferir NF':KCOLS[i]}<small>${ls.length} · ${brl(ls.reduce((a,l)=>a+l.v,0))}</small></h3>
      ${ls.map(cartaoLote).join('')||'<p class="kb-vazio">nenhum pedido</p>'}
      ${hist.length?`<details class="kb-hist"><summary>${icon('chevRight',13,'chev')}${hist.length} conferido${hist.length>1?'s':''} · no almoxarifado</summary>${hist.map(cartaoLote).join('')}</details>`:''}</section>`; }).join('')}</div>`;
}

/* ===================== ALMOXARIFADO ===================== */
function tabInv(o){
  const d=dados(o.id), inv=d.inv, f=filtroSup(), ult=ULT();
  const its=inv.map(i=>({i, k:contaDe(o.id,i.id), a:acoesItem(o.id,i.id), dias:duraDias(i)}));
  const acabam=its.filter(x=>x.dias!=null&&x.dias<=7).sort((a,b)=>a.dias-b.dias);       // erro 2: pela duração, não por st
  const trab=its.filter(x=>x.a.length||(x.dias!=null&&x.dias<=7)).sort((a,b)=>porDias(a.dias,b.dias)), cob=its.filter(x=>!trab.includes(x));
  const sobras=TRANSF.filter(t=>t.origem===o.id&&t.sug>0), nf=d.lotes.filter(l=>l.col===ult&&!l.conf), quebra=inv.find(i=>i.quebra);
  const pal=quebra&&d.lotes.find(l=>l.inv===quebra.id&&!l.conf&&l.palete!==undefined);
  const nomeCurto = i => i.nome.split(' ')[0];
  const durTxt = x => x.dias==null?`<span class="mut">${x.i.cob}</span>`:`<span class="${x.dias<=2?'t-perda':x.dias<=7?'t-pede':''}">${x.i.cob}</span>`;
  const alertas=[
    ...nf.map((l,k)=>{ const ab=abateNF(l); return linhaDecisao({prazo:/hoje/.test(l.eta)?'chegou hoje':'na obra', tom:'pede', titulo:`Conferir NF do ${docRef(l.id)} · ${l.item}`,
      conta:(ab?`${num(l.medido)} ${l.un} medidos na caçamba contra ${num(l.qn)} na NF`:`${l.q} · ${l.forn}`)+' · só entra no saldo depois de conferir', valor:ab?`−${brl(ab)}`:l.v,
      acao:{label:'Conferir NF', onclick:`conferirLote('${l.id}')`}, foco:k===0}); }),
    ...(quebra&&pal?[(()=>{ const sa=(d.mov[quebra.id]||[]).filter(m=>m.q<0&&m.t!=='Contagem'), qb=sa.filter(m=>m.t==='Quebra').reduce((a,m)=>a-m.q,0);
      return linhaDecisao({prazo:pal.palete?'resolvido':String(pal.eta).split(' · ')[0], tom:pal.palete?'ok':'perda', titulo:`${quebra.nome}: quebra de ${quebra.quebra.real}% contra ${quebra.quebra.prev}% previsto`,
        conta:`${num(qb)} ${quebra.un} quebrados · a entrega anterior veio sem palete · a próxima é o ${docRef(pal.id)}`, valor:'',
        acao:{label:`Exigir palete no ${pal.id}`, onclick:'exigirPalete()'}, foco:!nf.length, estado:pal.palete?{feito:'Palete exigido'}:'pendente'}); })()]:[]),
  ];
  const linha = x => { const a=x.a[0];
    return `<tr class="click" onclick="openInvItem('${x.i.id}','${o.id}')"><td><b>${x.i.nome}</b> <span class="curva c${x.i.abc}" title="curva ${x.i.abc}" aria-label="curva ${x.i.abc}">${x.i.abc}</span><div class="sm mut">${x.i.obs||(x.i.abc==='C'?`contagem semanal · ${x.i.contagem||'—'}`:x.a.slice(1).map(y=>y.txt).join(' · ')||'baixa com destino')}</div></td>
      <td class="sm">${durTxt(x)}</td><td>${linhaConta(x.k)}</td>
      <td class="sup-acao">${a?`<button type="button" class="btn sm" onclick="event.stopPropagation();${a.onclick}">${a.label}</button>${x.a[1]?`<div class="sm mut">depois: ${x.a[1].txt}</div>`:''}`:''}</td></tr>`; };
  const cab = `<thead><tr><th>Item</th><th>Dura</th><th>Conta</th><th><span class="sr-only">Ação</span></th></tr></thead>`;
  return `${cicloFaixa(o.id)}
  ${val('Quem dá baixa no material no dia a dia é a mestre, pelo WhatsApp. Registrar "para onde foi" só nos itens curva A (aço, concreto, bloco, cimento, porcelanato) e contar o resto toda semana é viável no canteiro?')}
  ${f?avisoFiltro(f):''}
  <div class="grid g3 sup-kpis">
    ${kpi({rotulo:'Acabam em ≤ 7 dias', valor:acabam.length, tom:acabam.length?'perda':undefined, contexto:acabam.map(x=>`${nomeCurto(x.i)} ${/\d\/\d/.test(x.i.cob)?'até '+x.i.cob.match(/\d{1,2}\/\d{1,2}/)[0]:x.dias<=0?'acabou':'≈ '+x.dias+' d'}`).join(' · ')||'nenhum'})}
    ${kpi({rotulo:'Sobra para outras obras', valor:sobras.length, contexto:sobras.map(t=>`${num(t.sug)} ${t.un} de ${t.item.split(' ')[0].toLowerCase()} → ${curtaObra(t.destino)}`).join(' · ')||'nada sobrando agora'})}
    ${kpi({rotulo:'Em estoque', valor:brl(d.valorEstoque), contexto:`${d.itensAlmox} itens · a preço de compra`})}
  </div>
  ${alertas.length?`<section class="sup-bloco"><h3 class="sup-h">Pede você agora</h3>${listaDecisoes(alertas)}</section>`:''}
  <section class="sup-bloco"><div class="sup-cab"><h3 class="sup-h">Vai acabar ou pede ação <span class="mut">(${trab.length})</span></h3><span class="sp"></span>
    <span class="sm mut">a mestre registra as saídas pelo WhatsApp</span><button class="btn sm" onclick="openBaixa()">${icon('minus',14)}Registrar saída</button></div>
    <div class="card sup-tab" style="padding:0"><table>${cab}<tbody>${trab.map(linha).join('')||'<tr><td colspan="4" class="mut">Nada acaba nos próximos 7 dias e nada pede você.</td></tr>'}</tbody></table></div></section>
  ${cob.length?`<details class="sup-cob"><summary>${icon('chevRight',14,'chev')}Cobertos <span class="mut">(${cob.length})</span><span class="sm mut">· o estoque e o que está a caminho cobrem até o fim</span></summary>
    <div class="card sup-tab" style="padding:0"><table>${cab}<tbody>${cob.map(linha).join('')}</tbody></table></div></details>`:''}
  <p class="sm mut sup-nota">Falta = precisa até o fim − saldo − a caminho − em cotação. A caminho = pedidos aprovados, enviados, em trânsito ou recebidos sem conferir (vale o medido na obra). Curva A tem baixa com destino; curva C é contada toda semana.</p>`;
}

function tabEquipe(o){
  return `${val('A equipe entra e sai o tempo todo. O kanban "vaga → mobilização → em campo → desmobilizado" reflete isso? Empreiteiro e diarista precisam ser tratados diferente?')}
  <div class="grid g4" style="margin-bottom:24px">
    <div class="card kpi"><div class="l">Em campo hoje</div><div class="v">12 pessoas</div><div class="s mut">7 cadastros, 2 deles equipes</div></div>
    <div class="card kpi"><div class="l">Custo de mão de obra / mês</div><div class="v">R$ 41.600</div><div class="s mut">previsto R$ 39.000</div></div>
    <div class="card kpi"><div class="l">Vagas abertas</div><div class="v" style="color:var(--red)">2</div><div class="s mut">armador · desde 01/10</div></div>
    <div class="card kpi"><div class="l">Impacto no prazo</div><div class="v" style="color:var(--red)">+8 dias</div><div class="s mut">pela falta de armadores</div></div>
  </div>
  <div class="kb" style="grid-auto-columns:280px">${EQUIPE.cols.map((c,i)=>{const ps=EQUIPE.ppl.filter(p=>p.col===i);
    return `<div class="col"><h4>${c}<small>${ps.length}</small></h4>${ps.map(p=>`<div class="kc ${p.alert?'late':''}"><div class="row"><div class="av" style="background:${p.alert?'var(--redSoft)':'var(--cream2)'};color:${p.alert?'var(--red)':'var(--ink2)'}">${p.alert?'?':p.n.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><b style="margin:0">${p.n}</b><div class="sm mut">${p.f}</div></div></div><div class="meta"><span>${p.nota||''}</span><span>${p.c}</span></div></div>`).join('')}
      ${i===0?`<button class="btn sm" style="width:100%;justify-content:center" onclick="toast('Agente sugere 3 armadores da sua rede')">${icon('spark',14)}Sugerir profissionais</button>`:''}</div>`}).join('')}</div>`;
}

function tabPrazos(o){
  const d=dados(o.id), P=d.prazo; if(!P) return emOrcamento(o);
  const W=P.W, hoje=P.hoje, pct=x=>x/W*100, atrasa=o.atraso>0;
  const totC=Math.max(1,P.causas.reduce((a,c)=>a+Math.abs(c[2]),0));
  /* eixo de datas: um traço por mês desde a data-base (W semanas); rótulo a cada 1 ou 2 meses, com o ano em janeiro */
  const [bd,bm,ba]=P.base.split('/').map(Number), b0=new Date(ba,bm-1,bd), tot=W*7*864e5, MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const meses=[]; for(let t=new Date(ba,bm,1), k=0; t-b0<tot; t=new Date(t.getFullYear(),t.getMonth()+1,1), k++) meses.push({x:(t-b0)/tot*100, l:MES[t.getMonth()]+(t.getMonth()===0?'/'+String(t.getFullYear()).slice(2):''), k});
  const passo=W>40?2:1, dHoje=new Date(+b0+hoje*7*864e5), hojeTxt=`${String(dHoje.getDate()).padStart(2,'0')}/${String(dHoje.getMonth()+1).padStart(2,'0')}`;
  const eixo=`<div class="g-eixo" aria-hidden="true"><span style="left:0">${MES[bm-1]}</span>${meses.filter(m=>m.k%passo===passo-1||/\//.test(m.l)).filter(m=>Math.abs(m.x-pct(hoje))>6&&m.x<96).map(m=>`<span style="left:${m.x}%">${m.l}</span>`).join('')}<span class="g-hj" style="left:${pct(hoje)}%">hoje ${hojeTxt}</span></div>`;
  /* estoque até o fim: itens do almoxarifado que ainda serão usados + insumos ainda não comprados */
  const linhas=[...d.inv.filter(i=>i.nec>0).map(i=>({nome:i.nome, un:i.un, tem:i.ent-i.sai, cam:aCaminho(o.id,i.id), nec:i.nec, falta:faltaDe(o.id,i.id), acao:acaoInv(o,i)})),
    ...d.comp.filter(c=>!d.inv.find(i=>i.id===(c.inv||c.id))).map(c=>{const k=compraDe(o.id,c); return {nome:c.nome, un:c.un, tem:0, cam:k.comprado, nec:c.qtd, falta:k.falta,
      acao:k.falta>0?`<span class="pill warn">comprar ${num(k.falta)}${k.cot?' · '+k.cot.id:''}</span>${c.id==='telha'?' <span class="pill gray">até 12/11 (frete 10 dias)</span>':''}`:'<span class="pill ok">pedido</span>'};})]
    .sort((a,b)=>(b.falta>0)-(a.falta>0));
  const comPlano = typeof gPlanoLinhas==='function' && atrasa && o.id==='vila-nova', faltam = comPlano ? gPlanoPendentes() : 0;
  const plano = comPlano ? `<div class="card" style="margin-bottom:var(--s5)"><div class="row" style="flex-wrap:wrap;margin-bottom:var(--s3)"><h3 style="margin:0">${faltam?`Plano: o atraso cai de ${o.atraso} para ${o.atraso-P.recupera} dias se você aprovar`:`Plano aprovado: o atraso previsto cai de ${o.atraso} para ${o.atraso-P.recupera} dias`}</h3><span class="sp"></span>
      ${faltam?botao(`Aprovar o plano (${faltam} ${faltam>1?'ações':'ação'})`,'gPlanoAprovarTudo()',{pri:true,icone:'check'}):''}</div>
      ${listaDecisoes(gPlanoLinhas())}
      <p class="g-nota">A concretagem de qui 05/11 tem 80% de chuva: remarcar para sex 06/11 não muda o prazo, porque a armação só fecha com o aço novo.</p></div>` : '';
  const TELA_CAUSA={Fornecedor:'kanban', Equipe:'equipe', Clima:'diario'};
  return `${val('A explicação do atraso por causa (fornecedor, equipe, clima) é o que o dono da obra cobra? Quais causas faltam (projeto, aprovação na prefeitura, pagamento)?')}
  ${plano}
  <div class="grid g3 g-kpis" style="margin:0 0 var(--s5)">
    ${kpi({rotulo:'Prazo contratado', valor:o.prazo, contexto:`início ${o.inicio}`})}
    ${kpi({rotulo:'Previsão do agente', valor:o.previsao, contexto:prazoTxt(o), tom:atrasa?'perda':'ok'})}
    ${kpi({rotulo:'Fase atual', valor:P.faseAtual, contexto:`${P.fasePct}% · ${P.faseObs}`})}
  </div>
  <div class="card"><h3>Cronograma por fase</h3>
    <div class="legend" style="margin-bottom:var(--s4)"><span><i style="background:none;border:1.5px solid #8d9894"></i>planejado</span><span><i style="background:var(--accentHi)"></i>real e projetado</span><span><i style="background:var(--green)"></i>concluída</span><span><i style="background:var(--ink);width:2px"></i>hoje</span></div>
    <div class="gantt"><div></div>${eixo}${d.fases.map(f=>`<div>${f.n}<div class="sm mut">${f.pct}%</div></div><div class="gtrack">
      <div class="gb plan" style="left:${pct(f.ini)}%;width:${pct(f.fim-f.ini)}%;top:3px;height:8px"></div>
      <div class="gb" style="left:${pct(f.real[0])}%;width:${pct(f.real[1]-f.real[0])}%;background:${f.pct===100?'var(--green)':'var(--accentHi)'};top:13px;height:8px;opacity:${f.pct===0?.5:1}"></div>
      <div class="g-hoje-l" style="left:${pct(hoje)}%"></div></div>`).join('')}</div></div>
  <div class="card" style="margin-top:var(--s5)"><h3>${atrasa?'Por que vai atrasar':'Por que está adiantada'} <small>· ${P.causas.map(c=>(c[2]>0?'+':'−')+Math.abs(c[2])).join(' ')} = ${Math.abs(o.atraso)} dias</small></h3>
    ${P.causas.map(c=>`<div class="g-causa"><b>${c[0]}</b><span class="mut">${c[1]}</span><div class="bar"><i style="width:${Math.abs(c[2])/totC*100}%"></i></div><b class="num">${c[2]>0?'+':'−'}${Math.abs(c[2])} dias</b>${TELA_CAUSA[c[0]]?`<a class="link" href="#" onclick="go('obra','${o.id}','${TELA_CAUSA[c[0]]}');return false">Resolver ${icon('arrowRight',13)}</a>`:'<span></span>'}</div>`).join('')}</div>
  <div class="card" style="margin-top:var(--s5)"><h3>O estoque aguenta até o fim?</h3>
    <table class="sm"><tr><th>Item</th><th class="num">Tem</th><th class="num">A caminho</th><th class="num">Precisa</th><th class="num">Falta</th><th>O que fazer</th></tr>
    ${linhas.map(r=>`<tr><td><b>${r.nome.split(' (')[0]}</b></td><td class="num">${num(r.tem)}</td><td class="num">${r.cam?num(r.cam):'—'}</td><td class="num">${num(r.nec)}</td><td class="num">${r.falta>0?`<b>${num(r.falta)}</b>`:'0'}</td><td>${r.acao}</td></tr>`).join('')}</table>
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><span class="sm mut">Falta = precisa − tem − a caminho. Nada do que já está pedido entra na sugestão.</span><span class="sp"></span>${botao('Ver pedidos sugeridos',`go('obra','${o.id}','kanban')`)}</div></div>`;
}

/* ===================== DRAWERS / MODAIS ===================== */
/* Modal grava, drawer consulta. As telas preenchem #modalBox/#drawerPane e ligam a classe 'on' (ou usam abrirModal);
   a base observa a classe e cuida da acessibilidade: role="dialog" (no index.html), título ligado por aria-labelledby,
   X, foco no 1º campo (ou na caixa), Tab preso dentro, Esc fecha, e o foco volta a quem abriu. */
function closeDrawer(){ $('drawer').classList.remove('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function abrirModal(html){ $('modalBox').innerHTML=html; $('modal').classList.add('on'); }
/* Clicar fora fecha o modal só quando ele não tem formulário (assistente, medição, conferência não perdem o que foi digitado). */
function foraDoModal(){ if($('modalBox').querySelector('input,select,textarea')) return $('modalBox').focus(); closeModal(); }
const DLG = {};
const caixaDe = tipo => tipo==='modal' ? $('modalBox') : $('drawerPane');
function focaveis(el){ return [...el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(x=>x.getClientRects().length); }
function prepararDialogo(tipo, abrindo){
  const box=caixaDe(tipo);
  if(tipo==='modal' && !box.querySelector(':scope > .dlg-x')) box.insertAdjacentHTML('afterbegin', `<button type="button" class="iconbtn dlg-x" aria-label="Fechar" title="Fechar (Esc)" onclick="closeModal()">${icon('x',18)}</button>`);
  const h=box.querySelector('h2'); if(h){ h.id=tipo+'Tit'; box.setAttribute('aria-labelledby',h.id); } else box.removeAttribute('aria-labelledby');
  if(abrindo || !box.contains(document.activeElement)){
    const alvo = tipo==='modal' && box.querySelector('input.f:not([readonly]),select.f,textarea.f');
    (alvo || box).focus({preventScroll:true});
  }
}
function vigiarDialogo(tipo){
  const wrap=$(tipo), box=caixaDe(tipo);
  new MutationObserver(()=>{ const on=wrap.classList.contains('on');
    if(on && !DLG[tipo]){ const a=document.activeElement; DLG[tipo]={volta: a && a!==document.body && !wrap.contains(a) ? a : null}; prepararDialogo(tipo, true); }
    else if(!on && DLG[tipo]){ const v=DLG[tipo].volta; delete DLG[tipo]; if(v && document.contains(v) && !$('modal').classList.contains('on')) v.focus({preventScroll:true}); }
  }).observe(wrap, {attributes:true, attributeFilter:['class']});
  new MutationObserver(()=>{ if(wrap.classList.contains('on') && DLG[tipo]) prepararDialogo(tipo, false); }).observe(box, {childList:true});
}
vigiarDialogo('modal'); vigiarDialogo('drawer');
document.addEventListener('keydown', e=>{
  const topo = $('modal').classList.contains('on') ? 'modal' : $('drawer').classList.contains('on') ? 'drawer' : null;
  if(e.key==='Escape'){ if(topo==='modal') closeModal(); else if(topo==='drawer') closeDrawer(); else escCasca(e); return; }
  if(e.key==='Tab' && topo){
    const box=caixaDe(topo), f=focaveis(box); if(!f.length){ e.preventDefault(); box.focus(); return; }
    const a=f[0], z=f[f.length-1], at=document.activeElement;
    if(!box.contains(at)){ e.preventDefault(); a.focus(); }
    else if(e.shiftKey && (at===a || at===box)){ e.preventDefault(); z.focus(); }
    else if(!e.shiftKey && at===z){ e.preventDefault(); a.focus(); }
    return;
  }
  if(e.key==='/' && !topo && state.modo==='c' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable){ e.preventDefault(); if(state.visao&&state.visao.cheia) telaCheia(false); focarCampo('/'); }
});
/* Drawers de Suprimentos: cabeçalho com a linha de conta, corpo e rodapé de ação fixo (.sup-pe). */
function cabDrawer(rotulo, titulo, sub, conta){
  return `<div class="row"><span class="mut sm">${rotulo}</span><span class="sp"></span><button class="iconbtn" onclick="closeDrawer()" aria-label="Fechar">${icon('x',18)}</button></div>
    <h2 style="margin:6px 0 4px">${titulo}</h2>${sub?`<div class="mut sm">${sub}</div>`:''}<div class="sup-dconta">${conta}</div>`;
}
function openComp(id){
  const c=insumo(id); if(!c) return toast('Insumo não encontrado');
  const ob=Object.keys(DADOS).find(k=>DADOS[k].comp.includes(c)), inv=c.inv||c.id, k=contaDe(ob,inv), rec=fornRec(ob,c);
  const fs=[rec, ...[...c.forn].sort((a,b)=>a.p-b.p).filter(f=>f!==rec)], q=k.comprar>0?k.comprar:(k.cot?k.cot.qn:0), m=best(c);
  const pe = k.comprar>0 ? `${botao('Ver no almoxarifado', `closeDrawer();go('obra','${ob}','inventario')`, {})}<span class="sp"></span>${botao(`Pedir ${num(k.comprar)} ${c.un} · ${brl(rec.p*k.comprar)}`, `openCheckout(['${c.id}'],{forn:'${esc(rec.n)}',obra:'${ob}'})`, {pri:true, icone:'cart'})}`
    : k.cot ? `${pill('pede',`${k.cot.id} em cotação`)}<span class="sp"></span>${botao(`Aprovar ${k.cot.id} · ${brl(k.cot.v)}`, `aprovarLote('${k.cot.id}');openComp('${c.id}')`, {pri:true})}`
    : `${pill('ok','nada a comprar agora')}<span class="sp"></span>${botao('Ver no almoxarifado', `closeDrawer();go('obra','${ob}','inventario')`, {})}`;
  $('drawerPane').innerHTML = `${cabDrawer(`Insumo · ${NOME_OBRA[ob]}`, c.nome, `${c.espec?c.espec+' · ':''}${c.fase} · projeto: ${num(c.qtd)} ${c.un} na obra inteira`,
      linhaConta({...k, fonte:k.cot?`${k.cot.id} em cotação já descontado`:k.tr?`${num(k.transf)} ${c.un} vêm da ${NOME_OBRA[k.tr.origem]}`:''}))}
    <div class="card agentnote inline sup-nota-ag">${icon('spark',15)}<div><b>Como estimei:</b> quantidade tirada do memorial descritivo e das plantas, com a perda média do mercado para este insumo. <a href="#" class="link" onclick="toast('(protótipo) abriria o trecho do projeto');return false">ver no projeto</a></div></div>
    <h3 class="sup-dh">Onde comprar · ${fs.length} fornecedores na região</h3>
    <div class="card sup-forn">${fs.map((f,i)=>`<div class="sup-fl"><div class="sup-fn"><b>${f.n}</b> ${i===0?pill('ok',f===m?'melhor preço':'recomendado'):''}
        <div class="sm mut">${f.cid} · ${f.prazo} · nota ${String(f.nota).replace('.',',')}${i===0&&f!==m?` · ${m.n.split(' ')[0]} é mais barata, mas demora mais`:''}</div></div>
      <div class="num"><b>${brl2(f.p)}</b><span class="sm mut">/${c.un}</span>${q?`<div class="sm mut">${num(q)} ${c.un}: ${brl(f.p*q)}</div>`:''}</div>
      <button class="iconbtn" aria-label="Falar com ${esc(f.n)} no WhatsApp" title="Contato" onclick="toast('(protótipo) abriria o WhatsApp do fornecedor')">${icon('message',16)}</button></div>`).join('')}</div>
    <p class="sm mut">${chipFonte({origem:'cotacao', quem:'sites, catálogos e WhatsApp', hora:'hoje 07:40'})} · validade de 48 h</p>
    <div class="sup-pe">${pe}</div>`;
  $('drawer').classList.add('on');
}
function openInvItem(id, obraId){
  const ob=obraId||(state.obra&&DADOS[state.obra]&&dados(state.obra).inv.length?state.obra:'vila-nova'), d=dados(ob);
  const i=d.inv.find(x=>x.id===id)||d.inv[0]; if(!i) return toast('Item não encontrado no almoxarifado');
  const s=i.ent-i.sai, k=contaDe(ob,i.id), C=i.abc==='C', ac=acoesItem(ob,i.id);
  const movs=d.mov[i.id]||[{d:'—',t:'Entrada',q:+i.ent,onde:'Recebimentos conferidos',quem:'mestre'},{d:'—',t:'Saída',q:-i.sai,onde:'Várias frentes',quem:'—'}];
  const saidas=movs.filter(m=>m.q<0&&m.t!=='Contagem'), cor=m=>m.t==='Quebra'?'var(--red)':'var(--grayInk)';
  const quebras=saidas.filter(m=>m.t==='Quebra').reduce((a,m)=>a-m.q,0), usados=saidas.filter(m=>m.t!=='Quebra').reduce((a,m)=>a-m.q,0);
  const pal=i.quebra && d.lotes.find(l=>l.inv===i.id&&!l.conf&&l.palete!==undefined);
  closeModal();
  const fica=!/openTransfer|openCheckout|conferirLote|go\(/.test((ac[0]||{}).onclick||'');      // ação que não sai do drawer: redesenha no lugar
  const pe = `${botao(C?'Registrar contagem ou saída':'Registrar saída', `openBaixa('${i.id}')`, {icone:'minus'})}<span class="sp"></span>`+
    (ac[0] ? botao(ac[0].label, `${ac[0].onclick}${fica?`;openInvItem('${i.id}','${ob}')`:''}`, {pri:true}) : pill('ok','estoque cobre até o fim'));
  $('drawerPane').innerHTML = `${cabDrawer(`Almoxarifado · ${NOME_OBRA[ob]}`, `${i.nome} <span class="curva c${i.abc}" aria-label="curva ${i.abc}">${i.abc}</span>`,
      `entraram ${num(i.ent)} · saíram ${num(i.sai)} ${i.un} · dura ${i.cob}`, linhaConta({...k, fonte:k.cot?`${k.cot.id} em cotação já descontado`:''}))}
    ${ac.length>1?`<p class="sm sup-depois">Também pede você: ${ac.slice(1).map(a=>a.doc?a.txt.replace(a.doc,docRef(a.doc)):a.txt).join(' · ')}</p>`:''}
    ${C?`<div class="card inline sup-nota-ag" style="background:var(--sunk)">${icon('info',15)}<div><b>Curva C: controle por contagem semanal, sem destino.</b> Item barato e de uso espalhado; registrar para onde vai cada unidade vira burocracia. Última contagem: ${i.contagem||'—'}, ${num(s)} ${i.un}.</div></div>`
      :`<h3 class="sup-dh">Para onde foi</h3>
    <div class="split" style="height:16px;margin-bottom:12px;border-radius:6px" role="img" aria-label="${num(usados)} usados, ${num(quebras)} quebrados, ${num(Math.max(0,s))} no almoxarifado">${saidas.map(m=>`<div style="width:${-m.q/i.ent*100}%;background:${cor(m)}" title="${esc(m.onde)}"></div>`).join('')}<div style="width:${Math.max(0,s)/i.ent*100}%;background:var(--line)"></div></div>
    <div class="sm sup-leg">${saidas.map(m=>`<div class="row"><i style="background:${cor(m)}"></i>${m.onde}<span class="sp"></span><b>${num(-m.q)}</b><span class="mut sup-pct">${Math.round(-m.q/i.ent*100)}%</span></div>`).join('')}
      <div class="row"><i style="background:var(--line)"></i>No almoxarifado<span class="sp"></span><b>${num(s)}</b><span class="mut sup-pct">${Math.round(s/i.ent*100)}%</span></div></div>`}
    ${i.quebra?`<div class="card alertnote inline sup-nota-ag">${icon('alert',15)}<div><b>Quebra de ${Math.round(quebras/(quebras+usados)*100)}% contra ${i.quebra.prev}% previsto:</b> de ${num(quebras+usados)} que saíram, ${num(usados)} foram assentados e ${num(quebras)} quebraram. O PED-0149 foi descarregado sem palete.${pal&&pal.palete?` ${pill('ok',icon('check',12)+'palete exigido no '+pal.id)}`:''}</div></div>`:''}
    ${i.obs?`<div class="sm mut" style="margin-top:12px">${icon('info',13)} ${i.obs}</div>`:''}
    <h3 class="sup-dh">Movimentações</h3>
    <div class="card" style="padding:0"><table class="sm"><thead><tr><th>Data</th><th>Tipo</th><th class="num">Qtd</th><th>${C?'Observação':'Destino / origem'}</th><th>Quem</th></tr></thead><tbody>
      ${movs.map(m=>`<tr><td>${m.d}</td><td>${pill(m.q>0?'ok':m.t==='Quebra'?'perda':'info', m.t)}</td><td class="num">${m.q>0?'+':''}${num(m.q)}</td><td>${String(m.onde).replace(/(PED|TRF)-\d{4}/g, x=>docRef(x))}</td><td class="mut">${m.quem}</td></tr>`).join('')}</tbody></table></div>
    <div class="sup-pe">${pe}</div>`;
  $('drawer').classList.add('on');
}
function openBaixa(){
  closeDrawer();
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">Registrar saída de material</h2><div class="mut sm">Feito pelo celular no canteiro, ou é só falar no chat: "usei 40 parafusos na porta dos fundos".</div>
    <label class="l">Item</label><select class="f"><option>Parafuso 5/16" × 2" (saldo 100)</option><option>Cimento CP-II 50 kg (saldo 46)</option></select>
    <div class="grid g2" style="gap:0 14px"><div><label class="l">Quantidade</label><input class="f" value="40"></div><div><label class="l">Data</label><input class="f" value="28/10/2026"></div></div>
    <label class="l">Para onde foi (frente de serviço)</label><select class="f"><option>Porta dos fundos</option><option>Porta principal</option><option>Portão da garagem</option><option>Estrutura do telhado</option><option>+ nova frente…</option></select>
    <label class="l">Retirado por</label><select class="f"><option>Equipe carpintaria</option><option>Serralheria (Luiz)</option></select>
    <label class="l">Foto (opcional)</label><div class="drop" style="padding:16px">${icon('camera',20)}tirar foto</div>
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="closeModal();toast('Saída registrada · saldo 60')">Registrar</button></div>`;
  $('modal').classList.add('on');
}
function openCheckout(ids){
  closeDrawer();
  const its = ids.map(id=>{const c=COMP.find(x=>x.id===id); const b=id==='aco'?c.forn[1]:best(c); const q=id==='aco'?120:id==='paraf'?500:id==='bloco'?9500:220; return {c,b,q};});
  const tot = its.reduce((a,x)=>a+x.b.p*x.q,0);
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('cart',20)}Comprar pelo Canteiro</h2><div class="mut sm">Casa Vila Nova · os pedidos entram no Kanban na coluna "Pedido feito"</div>
    <table style="margin:18px 0"><tr><th>Item</th><th>Fornecedor</th><th class="num">Qtd</th><th class="num">Total</th></tr>
    ${its.map(x=>`<tr><td>${x.c.nome}</td><td>${x.b.n}<div class="sm mut row" style="gap:5px">${icon('truck',13)}${x.b.prazo}</div></td><td class="num"><input class="f" style="width:80px;text-align:right" value="${x.q}"></td><td class="num">${brl(x.b.p*x.q)}</td></tr>`).join('')}
    <tr><td colspan="3"><b>Total</b></td><td class="num"><b>${brl(tot)}</b></td></tr></table>
    <div class="grid g2 sm" style="gap:12px"><div class="card" style="background:var(--bg);padding:14px 16px"><div class="mut">Budget após a compra</div><b>${brl(286400+tot)} comprometidos de ${brl(620000)}</b></div>
    <div class="card" style="background:var(--bg);padding:14px 16px"><div class="mut">Entrega</div><b>Canteiro · R. das Palmeiras, 220</b><div class="mut">recebe: Marcos (almox.)</div></div></div>
    <label class="l">Pagamento</label><select class="f"><option>Boleto 28 dias (faturado para Construtora RZ)</option><option>Pix</option><option>Cartão corporativo</option></select>
    <div class="callout val" style="margin:16px 0 0">${icon('flask')}<div><b>Validar:</b> eles comprariam dentro da plataforma, ou só querem a cotação e fecham por telefone/WhatsApp com o fornecedor? Precisa de aprovação de outra pessoa acima de um valor?</div></div>
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="confirmCheckout()">Confirmar pedido</button></div>`;
  $('modal').classList.add('on');
}
function confirmCheckout(){ closeModal(); toast('Pedidos criados → Kanban · Pedido feito'); setTimeout(()=>go('obra','vila-nova','kanban'),700); }

/* Wizard: nova obra */
let wz={};
function openWizard(step){
  const S=[1,2,3,4].map(n=>`<div class="${n<=step?'on':''}"></div>`).join('');
  let b='';
  if(step===1) b=`<h2 style="margin:0">Nova obra · 1. Projeto</h2><p class="mut sm">Anexe o que tiver: projeto arquitetônico, estrutural, memorial descritivo, fotos do terreno.</p>
    <div class="drop">${icon('upload',22)}Arraste PDF, DWG, imagens<br><span class="sm">ou <u>escolha arquivos</u></span></div>
    <div style="margin-top:12px"><span class="attach">${icon('file',13)}projeto-arquitetonico.pdf · 22 pág.</span><span class="attach">${icon('file',13)}memorial-descritivo.pdf</span><span class="attach">${icon('ruler',13)}estrutural.dwg</span></div>
    <label class="l">Nome da obra</label><input class="f" value="Sobrado Jardim Europa">
    <label class="l">Endereço (usado para cotar preços na região)</label><input class="f" value="Rua Holanda, 88 · Jardim Europa · Campinas-SP">`;
  if(step===2) b=`<h2 style="margin:0">2. Descreva a obra</h2><p class="mut sm">Escreva do seu jeito. O agente pergunta o que faltar.</p>
    <textarea class="f" rows="7">Sobrado de 210 m², 3 suítes, laje nos dois pavimentos, telhado aparente com telha cerâmica. Padrão médio-alto: porcelanato 90x90 na área social, esquadrias de alumínio preto. Fundação em estaca (o terreno tem declive de 1,5 m). Quero piscina de 3x6 no fundo. Já tenho a equipe de pedreiros (empreitada), falta elétrica e hidráulica.</textarea>`;
  if(step===3) b=`<h2 style="margin:0">3. Budget, prazos e fases</h2>
    <div class="grid g2" style="gap:0 14px"><div><label class="l">Budget total</label><input class="f" value="R$ 780.000"></div><div><label class="l">Margem de segurança</label><select class="f"><option>5%</option><option selected>8%</option><option>10%</option></select></div>
    <div><label class="l">Início</label><input class="f" value="12/01/2027"></div><div><label class="l">Entrega desejada</label><input class="f" value="30/11/2027"></div></div>
    <label class="l">Fases (o agente sugere a partir do projeto; edite à vontade)</label>
    ${['Preliminares e terraplenagem','Fundação (estacas)','Estrutura','Alvenaria','Cobertura','Instalações','Piscina','Acabamento','Entrega'].map(f=>`<span class="attach">${icon('grip',13)}${f}</span>`).join('')}<span class="attach" style="background:none;border:1px dashed #d9d5c9">${icon('plus',13)}fase</span>`;
  if(step===4) b=`<h2 style="margin:0">4. O agente está montando o orçamento</h2>
    <div style="margin:20px 0">${[['Lendo 3 arquivos do projeto','ok'],['Levantando quantitativos (71 itens)','ok'],['Cotando preços em Campinas (214 ofertas, 19 fornecedores)','ok'],['Montando cronograma por fase','ok'],['Comparando com o budget','run']].map(s=>`<div class="row" style="margin:10px 0;color:${s[1]==='ok'?'var(--ink2)':'var(--ink)'}"><span style="color:${s[1]==='ok'?'var(--green)':'var(--accent)'};display:flex">${s[1]==='ok'?icon('checkCircle',17):icon('loader',17,'spin')}</span>${s[0]}</div>`).join('')}</div>
    <div class="card agentnote inline" style="padding:14px 16px;margin-bottom:16px">${icon('spark',15)}<div><b>Prévia:</b> custo estimado <b>R$ 812–846 mil</b>, <b>4–8% acima</b> do budget. A piscina (R$ 58 mil) e a fundação em estaca (R$ 41 mil) pesam mais. Achei <b>R$ 23 mil</b> de economia em fornecedores. O prazo de 10,5 meses é <b>realista</b> se a cobertura começar até a semana 24.</div></div>
    ${val('O gerente confiaria numa estimativa gerada em minutos? O que ele precisaria ver para acreditar (memória de cálculo, fonte dos preços, comparação com uma obra anterior)?')}`;
  $('modalBox').innerHTML = `<div class="steps">${S}</div>${b}
    <div class="row" style="margin-top:22px">${step>1?`<button class="btn" onclick="openWizard(${step-1})">${icon('arrowLeft',15)}Voltar</button>`:''}<span class="sp"></span>
    ${step<4?`<button class="btn amb" onclick="openWizard(${step+1})">${step===3?'Gerar orçamento com o agente':'Continuar'} ${icon('arrowRight',15)}</button>`:`<button class="btn amb" onclick="closeModal();go('obra','vila-nova','overview');toast('(protótipo) abre a Visão geral da obra criada')">Abrir orçamento completo ${icon('arrowRight',15)}</button>`}</div>`;
  $('modal').classList.add('on');
}

/* Estoque entre obras. #estoque mostra todas; a aba Entre obras da obra filtra as transferências dela.
   Verbo por direção: "Trazer" olhando do destino, "Ceder" olhando da origem; o modal sempre "Pedir transferência de N". */
function barraCap(t, op={}){
  const w=x=>t.saldo?x/t.saldo*100:0;
  return `<div class="cap${op.mini?' mini':''}" role="img" aria-label="${t.item} na ${NOME_OBRA[t.origem]}: usa ${num(t.usar)}, reserva ${num(t.reserva)}, pode sair ${num(t.max)} de ${num(t.saldo)} ${t.un}">
    <div class="split"><div style="width:${w(t.usar)}%;background:var(--grayInk)"></div><div style="width:${w(t.reserva)}%;background:var(--line)"></div><div style="width:${w(t.max)}%;background:var(--blue)"></div></div>
    <div class="legend"><span><i style="background:var(--grayInk)"></i>usa ${num(t.usar)}</span><span><i style="background:var(--line)"></i>reserva ${num(t.reserva)}</span><span><i style="background:var(--blue)"></i>pode sair <b>${num(t.max)}</b> de ${num(t.saldo)} ${t.un}</span></div></div>`;
}
const nomeItem = t => t.item.split(' ')[0].toLowerCase();
function estoqueCorpo(ob, h){
  recalcTransf();
  const H=`h${h}`, ativas=TRANSF.filter(t=>t.sug>0&&(!ob||t.origem===ob||t.destino===ob)), vence=ativas.filter(t=>t.perda);
  const hist=TRF_HIST.filter(x=>!ob||x.de===ob||x.para===ob), pedidas=hist.filter(x=>x.st!=='Recebida'), feitas=hist.filter(x=>x.st==='Recebida');
  const eco=ativas.reduce((a,t)=>a+t.sug*(t.novo-t.custo),0), dias=Math.max(0,...ativas.map(t=>t.dias||0));
  const saldoObra=id=>TRF_HIST.reduce((a,x)=>a+(x.de===id?x.v:0)-(x.para===id?x.v:0),0);
  const verbo=t=>ob&&t.origem===ob?'Ceder':'Trazer';
  const sug=t=>`<div class="trf-l">
      <div class="trf-txt"><div><b>${verbo(t)} ${num(t.sug)} ${t.un} de ${nomeItem(t)}</b> <span class="mut">· ${curtaObra(t.origem)} → ${curtaObra(t.destino)}</span>${t.perda?` ${pill('pede',icon('hourglass',12)+'vence em 25 dias na origem')}`:''}</div>
        <div class="sm mut">${t.item} · a ${curtaObra(t.destino)} precisa de ${num(t.falta)} ${t.un} · chega hoje, comprando levaria ${t.novoPrazo}</div>${barraCap(t,{mini:true})}</div>
      <div class="num trf-v"><b>${brl2(t.sug*t.custo)}</b><div class="sm mut">novo: ${brl2(t.sug*t.novo)}</div></div>
      <div>${botao(`${verbo(t)} ${num(t.sug)} ${t.un}`, `openTransfer('${t.inv}')`, {sm:true, pri:t===ativas[0], icone:'swap'})}</div></div>`;
  const histTab=xs=>`<table class="sm"><thead><tr><th>Nº</th><th>Data</th><th>Item</th><th>De → para</th><th class="num">Valor (custo)</th><th>Situação</th></tr></thead><tbody>
    ${xs.map(x=>`<tr data-doc="${x.id}"><td>${docRef(x.id)}</td><td>${x.d}</td><td>${x.item} · ${x.q}</td><td>${curtaObra(x.de)} → ${curtaObra(x.para)}</td><td class="num">${brl2(x.v)}</td><td>${pill(x.st==='Recebida'?'ok':'caminho',x.st)}</td></tr>`).join('')}</tbody></table>`;
  return `<div class="grid g3 sup-kpis">
      ${kpi({rotulo:'Compra evitada', projecao:true, valor:brl(ativas.reduce((a,t)=>a+t.sug*t.novo,0)), contexto:ativas.length?`a preço novo · ${brl2(eco)} a menos pagando o custo`:'nenhuma sugestão pendente'})}
      ${kpi({rotulo:'Dias ganhos', projecao:true, valor:dias?`até ${dias} dias`:'—', contexto:ativas.length?`chega hoje; comprando, levaria de ${Math.min(...ativas.map(t=>t.dias))} a ${dias} dias`:'—'})}
      ${kpi({rotulo:'Deixa de vencer', projecao:true, valor:vence.length?vence.map(t=>`${num(t.sug)} ${t.un}`).join(' + '):'—', contexto:vence.map(t=>`${nomeItem(t)} da ${curtaObra(t.origem)}, vence em 25 dias`).join('; ')||'nada vencendo'})}
    </div>
    <section class="sup-bloco"><${H} class="sup-h">Transferências sugeridas <span class="mut">(${ativas.length})</span></${H}>
      <p class="sup-sub">${ativas.length?`${ativas.length} ${ativas.length>1?'sobras podem':'sobra pode'} cobrir faltas: ${ativas.map(nomeItem).join(', ')}. Sempre a preço de custo do lote original.`:'Nenhuma sobra cobre falta hoje · próxima checagem amanhã às 6h.'}</p>
      ${ativas.length?`<div class="card trf-lista">${ativas.map(sug).join('')}</div>`:''}
      <details class="sup-como"><summary>${icon('info',14)}Como calculo o que pode sair</summary><p>A obra de origem fica com o que ainda vai usar <b>mais uma reserva de metade disso</b>. Só o que passar disso pode sair. O destino precisa = precisa − saldo − a caminho − em cotação.</p></details></section>
    ${pedidas.length?`<section class="sup-bloco"><${H} class="sup-h">Pedidas, esperando a origem <span class="mut">(${pedidas.length})</span></${H}><div class="card" style="padding:0">${histTab(pedidas)}</div></section>`:''}
    <div class="grid trf-pe">
      <section><${H} class="sup-h">Histórico</${H}><div class="card" style="padding:0">${histTab(feitas)}</div></section>
      <section><${H} class="sup-h">Acerto entre as obras</${H}><div class="card">
        <p class="sm mut" style="margin:0 0 8px">Quem cede recebe o valor de volta no orçamento; quem recebe lança como gasto de material.</p>
        ${['vila-nova','loja-centro'].filter(id=>!ob||id===ob).map(id=>{ const v=saldoObra(id); return `<p class="trf-ac"><b>${curtaObra(id)}</b> ${v>=0?'cedeu':'recebeu'} <b>${brl2(Math.abs(v))}</b> a mais do que ${v>=0?'recebeu':'cedeu'}.</p>`; }).join('')}</div></section>
    </div>`;
}
function renderEstoque(){
  return `<div class="top"><h1>Estoque entre obras</h1><span class="crumb">o que sobra numa obra e falta em outra · sempre a preço de custo</span></div>
  <div class="page">${cicloFaixa(null)}
    ${val('Ele já faz isso hoje, "no braço", entre obras? Com que frequência? Quem autoriza a saída da obra de origem: o mestre dela, o gerente ou o dono? E quando as obras são de clientes diferentes (o material é do cliente), ainda pode?')}
    ${estoqueCorpo(null, 2)}</div>`;
}
/* openTransfer aceita o id do item ('cim','paraf','prego') ou o índice antigo. */
function acharTransf(k){ recalcTransf(); return typeof k==='number' ? TRANSF[k] : TRANSF.find(t=>t.inv===k); }
function openTransfer(k){
  closeDrawer();
  const t=acharTransf(k);
  if(!t||t.sug<=0){ const h=TRF_HIST.find(x=>x.inv===(t?t.inv:k)&&x.st!=='Recebida');
    return toast(h?`${h.item}: ${h.id} já pedida · ${h.st.toLowerCase()}`:'Nenhuma transferência sugerida para este item agora'); }
  const quem=t.resp.split(' (')[0];
  $('modalBox').innerHTML = `<h2 style="margin:0 0 4px">${icon('swap',20)}${state.view==='obra'&&state.obra===t.origem?`Ceder ${nomeItem(t)} à ${curtaObra(t.destino)}`:`Trazer ${nomeItem(t)} da ${curtaObra(t.origem)}`}</h2>
    <div class="mut sm">${NOME_OBRA[t.origem]} → <b style="color:var(--ink)">${NOME_OBRA[t.destino]}</b> · ${t.item}</div>
    <div class="sup-dconta" id="tconta"></div>
    <p class="sm sup-pq">${icon('spark',14)}<span>${t.pq}</span></p>
    <h3 class="sup-dh">Quanto pode sair sem faltar na ${curtaObra(t.origem)}</h3>
    ${barraCap(t)}
    <div class="grid g2" style="margin-top:12px;gap:0 16px">
      <div><label class="l" for="tq">Quantidade (máx. ${num(t.max)} ${t.un})</label><input class="f" id="tq" type="number" min="1" max="${t.max}" value="${t.sug}" oninput="trfCalc('${t.inv}')"></div>
      <div><label class="l" for="ttr">Transporte</label><select class="f" id="ttr"><option>Caminhão da construtora (hoje, 15h)</option><option>Equipe da obra destino retira</option><option>Frete terceirizado</option></select></div>
    </div>
    <div id="tcalc"></div>
    ${val('A reserva de "metade do que ainda vai usar" é conservadora o bastante? Ele quer ajustar por item (cimento ≠ parafuso)?')}
    <div class="row"><span class="sm mut">Vai para ${quem} aprovar · preço do lote ${t.lote.split(' · ')[0]}</span><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" id="tok" onclick="confirmTransfer('${t.inv}')">Pedir transferência</button></div>`;
  $('modal').classList.add('on'); trfCalc(t.inv);
}
function trfQtd(t){ return Math.min(t.max, Math.max(0, Math.round(+$('tq').value||0))); }
function trfCalc(k){
  const t=acharTransf(k); if(!t) return;
  const q=trfQtd(t), c=contaDe(t.destino,t.inv), resto=Math.max(0,t.falta-q), cot=emCotacao(t.destino,t.inv);
  $('tconta').innerHTML = linhaConta({...c, transf:q, falta:undefined, comprar:undefined, fonte:`na ${NOME_OBRA[t.destino]}, com ${num(q)} ${t.un} desta transferência`});
  $('tok').textContent = q ? `Pedir transferência de ${num(q)} ${t.un}` : 'Pedir transferência';
  $('tcalc').innerHTML = `<table class="sm trf-cmp" style="margin-top:16px"><thead>
    <tr><th></th><th class="num">Transferir</th><th class="num">Comprar novo</th></tr></thead><tbody>
    <tr><td>Preço por ${t.un}</td><td class="num">${brl2(t.custo)}</td><td class="num">${brl2(t.novo)} <span class="mut">(${t.novoForn})</span></td></tr>
    <tr><td>Total de ${num(q)} ${t.un}</td><td class="num"><b>${brl2(q*t.custo)}</b></td><td class="num">${brl2(q*t.novo)}</td></tr>
    <tr><td>Chega em</td><td class="num"><b>hoje</b></td><td class="num">${t.novoPrazo}</td></tr>
    <tr><td>No orçamento</td><td class="num" colspan="2">${curtaObra(t.destino)} lança ${brl2(q*t.custo)} de material · ${curtaObra(t.origem)} recebe ${brl2(q*t.custo)} de volta</td></tr>
    </tbody></table>${resto>0?`<p class="sm" style="margin:8px 0 0">Ainda faltam <b>${num(resto)} ${t.un}</b> na ${NOME_OBRA[t.destino]}${cot?`: já estão no ${docRef(cot.id)} (em cotação).`:`: o agente inclui no próximo pedido de compra. <a href="#" class="link" onclick="closeModal();go('obra','${t.destino}','componentes');return false">ver em Falta comprar ${icon('arrowRight',13)}</a>`}</p>`:''}`;
}
function confirmTransfer(k){
  const t=acharTransf(k); if(!t) return closeModal();
  const q=trfQtd(t); if(!q) return toast('Quantidade precisa ser maior que zero');
  const n=Math.max(4,...TRF_HIST.map(h=>+h.id.slice(4)))+1, id='TRF-'+String(n).padStart(4,'0'), quem=t.resp.split(' (')[0];
  const h={id, d:'28/10', inv:t.inv, qn:q, item:t.item, q:num(q)+' '+t.un, de:t.origem, para:t.destino, v:q*t.custo, st:'Aguardando OK da origem'};
  const l={id, inv:t.inv, qn:q, un:t.un, item:t.item, q:num(q)+' '+t.un, forn:'de '+NOME_OBRA[t.origem], v:Math.round(q*t.custo), eta:`aguardando OK de ${quem} · chega hoje`, col:2, trf:true, origem:t.origem};
  const lotes=dados(t.destino).lotes, pos=TRANSF.indexOf(t);
  TRF_HIST.unshift(h); lotes.push(l); TRANSF.splice(pos,1); recalcTransf(); closeModal();
  registrar(`Transferência ${id} pedida · ${num(q)} ${t.un} de ${t.item} · ${NOME_OBRA[t.origem]} → ${NOME_OBRA[t.destino]}`, {obra:t.destino});
  toastDesfazer(`${id} pedida · ${quem} foi avisada`, ()=>{ TRF_HIST.splice(TRF_HIST.indexOf(h),1); lotes.splice(lotes.indexOf(l),1); TRANSF.splice(pos,0,t); recalcTransf(); });
  render();
}

/* Mapa de fluxos: os 14 do FLUXOS.md (mesma numeração), agrupados pelos blocos do roteiro da conversa. */
const FLUXOS = [
  {n:1,  t:'Briefing do dia', d:'6 coisas pedem você hoje, cada uma com Aprovar, Ajustar e Desfazer', onde:'Início', ir:"go('home')", b:0},
  {n:2,  t:'Aprovações e registro', d:'fila de propostas de todas as obras; quem aprovou o quê, de onde veio, desfazer', onde:'Aprovações', ir:"go('aprovacoes')", b:0},
  {n:3,  t:'WhatsApp do mestre', d:'o áudio vira baixa de material, diário, causa de atraso e avanço; o mestre confirma num toque', onde:'Campo · WhatsApp', ir:"go('campo')", b:1},
  {n:12, t:'Diário de obra (RDO)', d:'montado do áudio, das fotos e do clima, cada fato com a sua fonte; PDF para o cliente', onde:'Execução › Diário', ir:"go('obra','vila-nova','diario')", b:1},
  {n:10, t:'Equipe', d:'chamada do dia, ASO, EPI e NR-18, vaga de armador e o impacto no prazo', onde:'Execução › Equipe', ir:"go('obra','vila-nova','equipe')", b:1},
  {n:7,  t:'Insumos e pedido de compra', d:'falta = precisa − saldo − a caminho; fornecedor comparado; alçada; envio por WhatsApp', onde:'Suprimentos › Falta comprar', ir:"go('obra','vila-nova','componentes')", b:2},
  {n:8,  t:'Pedidos', d:'Em cotação → Aprovado → Pedido enviado → Em trânsito → Recebido', onde:'Suprimentos › Pedidos', ir:"go('obra','vila-nova','kanban')", b:2},
  {n:4,  t:'Recebimento por NF-e', d:'pedido × NF × recebido (areia: 40 na NF, 36 na caçamba) e abatimento de R$ 472 no boleto', onde:'Suprimentos › Pedidos › Conferir NF', ir:"typeof openConferencia==='function'?openConferencia('PED-0157'):go('obra','vila-nova','kanban')", b:2},
  {n:9,  t:'Almoxarifado', d:'saldo, a caminho, falta e curva ABC; bloco com 15% de quebra contra 5% previstos', onde:'Suprimentos › Almoxarifado', ir:"go('obra','vila-nova','inventario')", b:2},
  {n:14, t:'Estoque entre obras', d:'transferir sobra a preço de custo sem prejudicar a obra de origem', onde:'Estoque entre obras', ir:"go('estoque')", b:2},
  {n:13, t:'Medição de empreiteiro', d:'contratado × executado × pago; Equipe Silva: pago 75%, executado 62%', onde:'Custos › Medições', ir:"go('obra','vila-nova','medicoes')", b:2},
  {n:5,  t:'Criar obra e orçar', d:'planilha, estimativa por m² (CUB/SINAPI) ou extração do PDF, com selo de confiança', onde:'+ Nova obra', ir:'openWizard(1)', b:3},
  {n:6,  t:'Orçamento com fonte', d:'cada linha com origem e confiança, BDI e encargos, economias que se escolhem e se desfazem', onde:'Custos › Orçamento', ir:"go('obra','vila-nova','overview')", b:3},
  {n:11, t:'Prazos', d:'planejado × real, atraso por causa, plano que leva o atraso de 21 para 6 dias', onde:'Execução › Cronograma', ir:"go('obra','vila-nova','prazos')", b:3},
];
const BLOCOS_FLUXO = ['Briefing e aprovações','Celular do mestre','NF, almoxarifado e medição','Orçamento e prazos'];
function renderFluxos(){
  return `<div class="top"><h1>Mapa de fluxos</h1><span class="crumb">${FLUXOS.length} fluxos do FLUXOS.md, na ordem do roteiro da conversa</span></div><div class="page">
    ${BLOCOS_FLUXO.map((b,i)=>`<section class="card fluxos"><h2>${b}</h2>
      ${FLUXOS.filter(f=>f.b===i).map(f=>`<button type="button" class="fluxo" onclick="${f.ir}"><span class="fn">${f.n}</span><span><span class="ft">${f.t}</span><span class="fd" style="display:block">${f.d}</span></span><span class="fo">${f.onde}</span>${icon('chevRight',16)}</button>`).join('')}</section>`).join('')}</div>`;
}

/* ===================== RENDER ===================== */
/* Visões globais: VIEWS.chave = () => html (sem obra). Página inteira: PAGINAS (campo, fluxos). */
const VIEWS = {hub:()=>renderHub(), estoque:()=>renderEstoque(), fluxos:()=>renderFluxos()};
const NAV_EXTRA = [];
function addCSS(css){ const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }
function render(){
  compat(state);
  if(state.modo==='c') CASCA.ultima=state.sessao;
  renderSide();
  const app=document.querySelector('.app'), m=$('main');
  app.classList.toggle('side-aberta', !!CASCA.side);
  if(state.modo!=='c'){
    app.classList.remove('com-visao','vs-cheia');
    m.className='main'; m.innerHTML=(VIEWS[state.modo]||VIEWS.fluxos)(); m.scrollTop=0;
    const vs=$('visao'); vs.hidden=true; vs.innerHTML=''; vs.dataset.k='';
  } else { desenharConversa(); desenharVisao(); }
  document.dispatchEvent(new Event('rendered'));
}

/* ===================== CASCA: AGENTE NO CENTRO =====================
   Esquerda: conversas (Geral + sessões por obra) e visões · centro: a conversa · direita: a visão aberta.
   API para js/features/conversa.js (contrato "Agente no centro"):
     SESSOES (da Conversa) · renderConversa(sessao) → html das mensagens · renderMsg(msg) → html de uma mensagem
     responder(texto, sessao) → Promise<msg[]>  (a casca já empurrou {de:'voce', html} em sessao.msgs e põe as
       respostas em seguida; sessao.escopoMsg = obraId do @obra, ou null; sessao.contexto = {chave, obra, filtro}
       quando a pergunta veio de "Perguntar sobre isto")
     abrirVisao(chave, obraId, {filtro, cheia}) · fecharVisao() · telaCheia(on) · perguntarSobre(chave, obraId, filtro)
     trocarEscopo(sessaoId, escopo) · novaSessao(escopo, titulo) → id · abrirSessao(id) · sessaoAtual()
     SUGESTOES (opcional, da Conversa): array de textos ou função(sessao) → array; são os chips acima do campo.
     msg.abrir = {chave, obra, filtro} (opcional): a casca abre essa visão quando a mensagem chega.
   Enquanto a Conversa não define SESSOES/renderConversa/responder, um fallback simples (CHATS + briefing) segura a casca. */
const CASCA = {ultima:null, obraFoco:null, obraEscolhida:null, side:false, focar:false, ctx:null, pensando:false, rascunho:''};
ICONS.maximize = ICONS.maximize || '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>';
ICONS.minimize = ICONS.minimize || '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/><path d="m3 21 7-7"/>';
ICONS.panel = ICONS.panel || '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>';
ICONS.book = ICONS.book || '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>';

const VISAO_ROT = {hoje:'Hoje', componentes:'Falta comprar', kanban:'Pedidos', inventario:'Almoxarifado', entreobras:'Entre obras', overview:'Orçamento', medicoes:'Medições', prazos:'Cronograma', diario:'Diário', equipe:'Equipe', aprovacoes:'Aprovações', estoque:'Estoque entre obras', hub:'Todas as obras'};
const VISAO_IC = {hoje:'checkCircle', componentes:'bricks', kanban:'package', inventario:'archive', entreobras:'swap', overview:'chart', medicoes:'ruler', prazos:'clock', diario:'book', equipe:'users', aprovacoes:'checkCircle', estoque:'swap', hub:'building'};
const VISAO_ALIAS = {hoje:'pendencias resumo', componentes:'comprar compras insumos falta', kanban:'pedidos compras entregas chega', inventario:'almoxarifado estoque saldo', entreobras:'transferencia sobra', overview:'orcamento custos verba', medicoes:'medicao empreiteiro pagamento', prazos:'cronograma prazo atraso', diario:'diario rdo', equipe:'equipe pessoal aso', aprovacoes:'aprovacoes pendencias propostas', estoque:'estoque entre obras transferencia', hub:'obras todas'};
const ORDEM_VISOES = ['hoje','componentes','kanban','inventario','overview','medicoes','prazos','diario','equipe'];
const visoesObra = () => [...ORDEM_VISOES.filter(k=>TAB_FNS[k]), ...Object.keys(TAB_FNS).filter(k=>!ORDEM_VISOES.includes(k) && k!=='entreobras')];
const visoesGlobais = () => ['aprovacoes','estoque','hub'].filter(ehVisaoGlobal).concat(Object.keys(VIEWS).filter(k=>ehVisaoGlobal(k) && !['aprovacoes','estoque','hub'].includes(k)));
function rotuloVisao(k){ if(VISAO_ROT[k]) return VISAO_ROT[k]; const g=GRUPOS.flatMap(x=>x.telas).find(t=>t[0]===k), t=TABS.find(t=>t[0]===k); return (g&&g[1])||(t&&t[2])||k; }
const semAcento = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const nomeObra = id => (OBRAS.find(o=>o.id===id)||{}).nome || id;

/* ---------- sessões (da Conversa; fallback enquanto ela não chega) ---------- */
let SESSOES_FB = null;
function sessoes(){
  if(typeof SESSOES!=='undefined' && Array.isArray(SESSOES)) return SESSOES;
  if(!SESSOES_FB) SESSOES_FB=[{id:'geral', titulo:'Geral · briefing de hoje', escopo:'geral', quando:'07:00', msgs:[], fb:'geral'}];
  if(typeof CHATS!=='undefined') OBRAS.forEach(o=>{ const C=CHATS[o.id]; if(!C || SESSOES_FB.some(x=>x.escopo===o.id && x.fb)) return;
    C.sess.forEach(([t,q],i)=>SESSOES_FB.push({id:o.id+'-'+i, titulo:t, escopo:o.id, quando:q, msgs:[], fb:i===0?o.id:'vazia'})); });
  return SESSOES_FB;
}
const idGeral = () => { const ss=sessoes(); return (ss.find(x=>x.id==='geral')||ss.find(x=>!x.escopo||x.escopo==='geral')||ss[0]||{id:'geral'}).id; };
function sessaoAtual(){ const ss=sessoes(); return ss.find(x=>x.id===state.sessao) || ss.find(x=>x.id===idGeral()) || {id:'geral', titulo:'Geral', escopo:'geral', msgs:[]}; }
function sessaoDaObra(obraId){ const x=sessoes().find(s=>s.escopo===obraId); return x ? x.id : criarSessao(obraId); }
function escopoAtual(){ const s=sessaoAtual(); return s.escopo || 'geral'; }
function obraPadrao(sesId){ const s=sessoes().find(x=>x.id===sesId); return s && s.escopo && s.escopo!=='geral' ? s.escopo : CASCA.obraFoco || OBRAS[0].id; }
function obraFoco(){
  if(CASCA.obraEscolhida && OBRAS.some(o=>o.id===CASCA.obraEscolhida)) return CASCA.obraEscolhida;
  const v=state.visao; if(v && v.obra) return v.obra;
  const e=state.modo==='c' && escopoAtual(); return e && e!=='geral' ? e : (CASCA.obraFoco && OBRAS.some(o=>o.id===CASCA.obraFoco) ? CASCA.obraFoco : OBRAS[0].id);
}
function criarSessao(escopo, titulo){
  const id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  sessoes().unshift({id, titulo: titulo || (escopo&&escopo!=='geral' ? `Nova conversa · ${curtaObra(escopo)}` : 'Nova conversa'), escopo: escopo||'geral', quando:'agora', msgs:[]});
  return id;
}

/* ---------- API pública ---------- */
function abrirSessao(id){ state=compat({modo:'c', sessao:id, visao:state.modo==='c'?state.visao:null}); CASCA.obraEscolhida=null; navegar(); }
function novaSessao(escopo, titulo){
  const id=criarSessao(escopo, titulo);
  state=compat({modo:'c', sessao:id, visao:state.modo==='c'?state.visao:null}); CASCA.obraEscolhida=null; CASCA.side=false;
  history.pushState(null,'',hashDe(state));
  queueMicrotask(()=>{ render(); focarCampo(); });            // quem chamou pode pôr mensagens na sessão antes de desenhar
  return id;
}
function trocarEscopo(sessaoId, escopo){
  const s=sessoes().find(x=>x.id===sessaoId); if(!s) return null;
  s.escopo = escopo || 'geral'; CASCA.obraEscolhida=null;
  if(state.sessao===sessaoId && state.modo==='c') render(); else renderSide();
  return s;
}
function abrirVisao(chave, obraId, op={}){
  const va=state.visao, cheia = op.cheia ?? !!(va && va.cheia), ses = state.modo==='c' ? state.sessao : (CASCA.ultima||idGeral());
  let visao;
  if(ehVisaoObra(chave)) visao={chave, obra: OBRAS.some(o=>o.id===obraId) ? obraId : obraPadrao(ses), filtro:op.filtro||null, cheia};
  else if(ehVisaoGlobal(chave)) visao={chave, obra:null, filtro:op.filtro||null, cheia};
  else return toast('Essa visão não existe neste protótipo');
  const mesma = va && va.chave===visao.chave && va.obra===visao.obra;
  if(mesma && !('filtro' in op)) visao.filtro=va.filtro;
  CASCA.obraEscolhida=null;
  state=compat({modo:'c', sessao:ses, visao}); navegar(mesma);
}
function fecharVisao(){
  if(!state.visao) return;
  state=compat({...state, visao:null}); navegar();
  focarCampo();
}
function telaCheia(on){
  const v=state.visao; if(!v) return;
  on = on===undefined ? !v.cheia : !!on; if(on===v.cheia) return;
  state=compat({...state, visao:{...v, cheia:on}}); navegar(true);
  const b=document.querySelector(on?'.vs-volta':'.vs-cheia-btn'); if(b) b.focus({preventScroll:true});
}
function perguntarSobre(chave, obraId, filtro){
  const v=state.visao||{}; chave=chave||v.chave; obraId = obraId===undefined ? v.obra : obraId; filtro = filtro===undefined ? v.filtro : filtro;
  if(v.cheia) telaCheia(false);
  if(state.modo!=='c'){ state=compat({modo:'c', sessao:CASCA.ultima||idGeral(), visao:null}); navegar(); }
  CASCA.ctx = chave ? {chave, obra:obraId||null, filtro:filtro||null} : null;
  const t=$('caTxt'); if(!t) return;
  t.value = !chave ? '' : typeof sementeSobre==='function' ? sementeSobre(chave, obraId||null, filtro||'')
    : `Sobre ${rotuloVisao(chave)}${obraId?' · '+curtaObra(obraId):''}${filtro?' · '+filtro:''}: `;
  CASCA.rascunho=t.value;
  campoMudou(); focarCampo();
}
function focarCampo(inserir){
  const t=$('caTxt'); if(!t) return;
  if(inserir){ const a=t.selectionStart??t.value.length; t.setRangeText(inserir, a, t.selectionEnd??a, 'end'); campoMudou(); }
  t.focus({preventScroll:true}); if(!inserir) t.setSelectionRange(t.value.length, t.value.length);
}
function alternarSide(){ CASCA.side=!CASCA.side; document.querySelector('.app').classList.toggle('side-aberta', CASCA.side); if(CASCA.side){ const a=$('side').querySelector('.nav.on,.nav'); if(a) a.focus(); } }
function limparFiltroVisao(){ if(!state.visao) return; state.visao={...state.visao, filtro:null}; render(); }
/* Esc (sem diálogo aberto): fecha o menu, a lateral sobreposta, sai da tela cheia ou fecha a visão. */
function escCasca(e){
  if(fecharMenus()) return;
  if(CASCA.side){ alternarSide(); return; }
  const a=document.activeElement; if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.value) return;
  if(state.modo!=='c' || !state.visao) return;
  state.visao.cheia ? telaCheia(false) : fecharVisao();
}

/* ---------- a conversa (centro) ---------- */
function msgFB(m){ return m.de==='voce' ? meMsg(m.html) : aiMsg(m.tools&&m.tools.length?m.tools:null, m.html+(m.cartoes||[]).join('')); }
function briefingFB(){
  if(typeof PROPOSTAS==='undefined') return aiMsg(null, '<b>Bom dia, Rizzi.</b> O briefing do dia aparece aqui.');
  const fila=PROPOSTAS.filter(p=>p.brief&&naFila(p)).sort(porUrg), ab=fila.filter(p=>p.st==='pendente');
  return aiMsg(['propostas do agente','3 obras','previsão do tempo'], `<b>Bom dia, Rizzi.</b> ${ab.length?`${ab.length} ${ab.length>1?'decisões pedem':'decisão pede'} você hoje, a mais urgente primeiro.`:'Nada pede você agora.'}
    <div class="ca-cartao">${listaDecisoes(fila.map(p=>linhaProp(p,{foco:p===ab[0]})))}</div>`);
}
function mensagensHTML(s){
  if(typeof renderConversa==='function') return renderConversa(s);
  const um = typeof renderMsg==='function' ? renderMsg : msgFB;
  const antes = s.fb==='geral' ? briefingFB() : s.fb && s.fb!=='vazia' && typeof CHATS!=='undefined' && CHATS[s.fb] ? CHATS[s.fb].msgs() : '';
  return antes + s.msgs.map(um).join('');
}
const pensandoHTML = () => `<div class="msg ai ca-pensando" role="status"><div class="aiav">${icon('spark',20)}</div><div class="bub">${icon('wrench',14)}usando ferramentas…</div></div>`;
function vazioHTML(s){
  const e=s.escopo&&s.escopo!=='geral' ? nomeObra(s.escopo) : null;
  return `<div class="ca-vazio"><div class="aiav">${icon('spark',20)}</div><h2>${e?`Conversa sobre a ${e}`:'Conversa nova'}</h2>
    <p>${e?`O agente olha só os dados da ${e}.`:'O agente enxerga todas as obras.'} Escreva <b>@</b> para perguntar sobre outra obra só nesta mensagem, ou <b>/</b> para abrir uma visão ao lado.</p></div>`;
}
const SUGESTOES_PADRAO = ['vamos começar pela Vila Nova, quero um relatório da fase da obra','por que só tem 2.760 blocos?','o que chega amanhã?','quem está na obra hoje?','estamos no prazo?','@Loja Centro o que sobra?','pede 600 kg de aço','transfere o cimento da Loja Centro'];
function sugestoes(s){ const g = typeof SUGESTOES!=='undefined' ? SUGESTOES : SUGESTOES_PADRAO; const l = typeof g==='function' ? g(s) : g; return Array.isArray(l) ? l : []; }
function escopoBotao(s){
  const o=s.escopo&&s.escopo!=='geral' && OBRAS.find(x=>x.id===s.escopo);
  return `<button type="button" class="ca-escopo" id="caEscopo" aria-haspopup="menu" aria-expanded="false" aria-controls="caEscopoMenu" onclick="menuEscopo()">
    ${o?`<span class="dot" style="background:${stDot(o)}" aria-hidden="true"></span>${o.nome}`:`${icon('building',14)}Todas as obras`}${icon('chevDown',14)}</button>
    <div class="ca-menu-pop" id="caEscopoMenu" role="menu" aria-label="Escopo da conversa" hidden>
      ${[{id:'geral', nome:'Todas as obras'}, ...OBRAS].map(x=>{ const on=(s.escopo||'geral')===x.id;
        return `<button type="button" role="menuitemradio" aria-checked="${on}" onclick="escolherEscopo('${x.id}')">${x.id==='geral'?icon('building',14):`<span class="dot" style="background:${stDot(x)}" aria-hidden="true"></span>`}<span>${x.nome}</span>${x.id==='geral'?'<small>enxerga as 3 obras</small>':`<small>${stTxt(x)}</small>`}${on?icon('check',14):''}</button>`; }).join('')}
    </div>`;
}
function desenharConversa(){
  const s=sessaoAtual(), m=$('main');
  if(!m.classList.contains('ca')){
    m.className='main ca';
    m.innerHTML = `<header class="ca-top" id="caTop"></header>
      <div class="msgs ca-msgs" id="caMsgs" tabindex="-1" aria-label="Mensagens"></div>
      <div class="ca-pe">
        <div class="chips" id="caChips" aria-label="Sugestões"></div>
        <div class="composer ca-comp">
          <div class="ca-ac" id="caAc" role="listbox" aria-label="Sugestões do campo" hidden></div>
          <div class="ca-ctx" id="caCtx"></div>
          <label class="sr-only" for="caTxt">Mensagem para o agente</label>
          <textarea id="caTxt" rows="1" autocomplete="off" aria-autocomplete="list" aria-controls="caAc" aria-expanded="false"></textarea>
          <div class="row"><button type="button" class="iconbtn" aria-label="Anexar projeto, NF ou foto" title="Anexar projeto, NF ou foto" onclick="toast('(protótipo) anexar projeto, NF ou foto')">${icon('clip',18)}</button>
            <span class="ca-dica"><kbd>@</kbd> obra <kbd>/</kbd> visão</span><span class="sp"></span>
            <button type="button" class="btn amb sm" id="caEnviar" onclick="enviarCampo()">Enviar ${icon('arrowUp',14)}</button></div>
        </div>
      </div>`;
    ligarCampo();
  }
  const top=$('caTop');
  top.innerHTML = `<button type="button" class="iconbtn ca-side" aria-label="Mostrar conversas e visões" aria-expanded="${!!CASCA.side}" onclick="alternarSide()">${icon('panel',18)}</button>
    <div class="ca-id">${escopoBotao(s)}<h1 title="${esc(s.titulo)}">${esc(s.titulo)}</h1></div><span class="sp"></span>
    <button type="button" class="btn sm" onclick="novaSessao(escopoAtual())">${icon('plus',14)}Nova conversa</button>`;
  const box=$('caMsgs'), k=s.id+':'+s.msgs.length+':'+(CASCA.pensando?1:0), mesma=box.dataset.k===k, mesmaSes=box.dataset.s===s.id, y=box.scrollTop;
  const corpo=mensagensHTML(s);
  const pensa = CASCA.pensando && !(typeof renderPensando==='function' && typeof responder==='function');   // o responder da Conversa desenha o próprio
  box.innerHTML = `<h2 class="sr-only">Mensagens</h2>` + (corpo.trim() ? corpo : vazioHTML(s)) + (pensa ? pensandoHTML() : '');
  box.dataset.k=k; box.dataset.s=s.id;
  if(mesma) box.scrollTop=y; else rolarParaUltima(box, mesmaSes);
  const chips = typeof renderSugestoes==='function' ? renderSugestoes(s) : sugestoes(s).map(c=>`<button type="button" class="chip" onclick="enviar(this.textContent)">${esc(c)}</button>`).join('');
  $('caChips').innerHTML = chips; $('caChips').hidden = !chips;
  const t=$('caTxt'), e=s.escopo&&s.escopo!=='geral' ? curtaObra(s.escopo) : null;
  t.placeholder = e ? `Pergunte ou peça sobre a ${e}…` : 'Pergunte ou peça sobre qualquer obra…';
  if(t.value!==CASCA.rascunho && document.activeElement!==t) t.value=CASCA.rascunho;
  campoMudou(true);
}
/* Mostra o começo da última resposta (não o fim): o gerente lê de cima. */
function rolarParaUltima(box, suave){
  const raiz=box.querySelector(':scope > .cv-fio')||box, ms=[...raiz.children].filter(x=>!x.matches('.val,.callout,.sr-only')), u=ms[ms.length-1]; if(!u) return;
  const eu=[...ms].reverse().find(x=>x.classList.contains('me')), alvo = u.classList.contains('me')||!eu ? u : eu;
  const fim=box.scrollHeight-box.clientHeight, y=Math.min(fim, Math.max(0, alvo.offsetTop - box.offsetTop - 16));
  const topo = alvo.offsetTop - box.offsetTop + alvo.offsetHeight <= box.clientHeight ? fim : y;
  box.scrollTo({top:topo, behavior: suave && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto'});
}

/* ---------- campo: @obra (escopo da mensagem) e /visão (abre a visão) ---------- */
const AC = {itens:[], i:0, tipo:null, ini:0};
function aliasesObra(o){ return [o.nome, curtaObra(o.id), o.id].filter(Boolean); }
function obraDoTexto(t){
  const n=semAcento(t); let melhor=null;
  OBRAS.forEach(o=>aliasesObra(o).forEach(a=>{ const k='@'+semAcento(a); const i=n.indexOf(k);
    if(i>=0 && !/[a-z0-9]/.test(n[i+k.length]||'') && (!melhor || a.length>melhor.a.length)) melhor={o, a}; }));
  return melhor && melhor.o.id;
}
function marcarMencoes(html){
  let h=html; OBRAS.forEach(o=>aliasesObra(o).sort((a,b)=>b.length-a.length).forEach(a=>{ h=h.replace(new RegExp('@'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\wÀ-ú])','gi'), x=>`<span class="mencao">${x}</span>`); }));
  return h.replace(/<span class="mencao">(<span class="mencao">)+/g,'<span class="mencao">').replace(/(<\/span>)+(?=<\/span>)/g,'');
}
function ligarCampo(){
  const t=$('caTxt');
  t.addEventListener('input', ()=>{ CASCA.rascunho=t.value; campoMudou(); });
  t.addEventListener('click', ()=>acAtualizar());
  t.addEventListener('blur', ()=>setTimeout(()=>{ if(document.activeElement!==t) acFechar(); }, 120));
  t.addEventListener('keydown', e=>{
    if(!$('caAc').hidden && AC.itens.length){
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); AC.i=(AC.i+(e.key==='ArrowDown'?1:-1)+AC.itens.length)%AC.itens.length; acDesenhar(); return; }
      if((e.key==='Enter'&&!e.shiftKey)||e.key==='Tab'){ e.preventDefault(); acEscolher(AC.i); return; }
      if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); acFechar(); return; }
    }
    if(e.key==='Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); enviarCampo(); }
  });
  t.addEventListener('keyup', e=>{ if(/^Arrow(Left|Right)$|^Home$|^End$/.test(e.key)) acAtualizar(); });
}
function campoMudou(semMenu){
  const t=$('caTxt'); if(!t) return;
  t.style.height='auto'; t.style.height=Math.min(180, t.scrollHeight)+'px';
  const ob=obraDoTexto(t.value), c=CASCA.ctx, s=sessaoAtual(), partes=[];
  if(c) partes.push(`<span class="ca-tag">${icon(VISAO_IC[c.chave]||'list',13)}Sobre ${rotuloVisao(c.chave)}${c.obra?' · '+curtaObra(c.obra):''}${c.filtro?' · '+esc(c.filtro):''}<button type="button" aria-label="Tirar o contexto da visão" onclick="CASCA.ctx=null;campoMudou(true)">${icon('x',12)}</button></span>`);
  if(ob && ob!==s.escopo) partes.push(`<span class="ca-tag">${icon('building',13)}Só nesta mensagem: ${curtaObra(ob)}</span>`);
  $('caCtx').innerHTML=partes.join(''); $('caCtx').hidden=!partes.length;
  $('caEnviar').disabled = !t.value.trim() || CASCA.pensando;
  if(!semMenu) acAtualizar();
}
function acAtualizar(){
  const t=$('caTxt'), antes=t.value.slice(0, t.selectionStart);
  const ma=/(^|\s)@([\p{L}\d-]*(?: [\p{L}\d-]*)?)$/u.exec(antes), mb=/(^|\s)\/([\p{L}\d-]*)$/u.exec(antes);
  if(ma){
    const q=semAcento(ma[2]).trim();
    AC.tipo='@'; AC.ini=antes.length-ma[2].length-1;
    AC.itens=OBRAS.filter(o=>!q || aliasesObra(o).some(a=>semAcento(a).includes(q)) || q.split(' ').every(w=>semAcento(o.nome).includes(w)))
      .map(o=>({rot:o.nome, dica:stTxt(o), dot:stDot(o), valor:o.id}));
  } else if(mb){
    const q=semAcento(mb[2]), ob=obraDoTexto(t.value) || (escopoAtual()!=='geral' ? escopoAtual() : obraFoco());
    AC.tipo='/'; AC.ini=antes.length-mb[2].length-1;
    AC.itens=[...visoesObra().map(k=>({k, ob})), ...visoesGlobais().map(k=>({k, ob:null}))]
      .filter(x=>!q || semAcento(rotuloVisao(x.k)+' '+x.k+' '+(VISAO_ALIAS[x.k]||'')).includes(q))
      .map(x=>({rot:rotuloVisao(x.k), dica:x.ob?curtaObra(x.ob):'todas as obras', ic:VISAO_IC[x.k]||'list', valor:x}));
  } else return acFechar();
  if(!AC.itens.length) return acFechar();
  AC.i=Math.min(AC.i, AC.itens.length-1); acDesenhar();
}
function acDesenhar(){
  const b=$('caAc'), t=$('caTxt');
  b.innerHTML = `<div class="cab" aria-hidden="true">${AC.tipo==='@'?'Perguntar sobre a obra':'Abrir a visão ao lado'}</div>`+AC.itens.map((x,i)=>`<div role="option" id="caAc${i}" aria-selected="${i===AC.i}" onmousedown="event.preventDefault()" onclick="acEscolher(${i})">${x.dot?`<span class="dot" style="background:${x.dot}" aria-hidden="true"></span>`:icon(x.ic,15)}<span>${x.rot}</span><span class="h">${x.dica}</span></div>`).join('');
  b.hidden=false; t.setAttribute('aria-expanded','true'); t.setAttribute('aria-activedescendant','caAc'+AC.i);
  const el=$('caAc'+AC.i); if(el) el.scrollIntoView({block:'nearest'});
}
function acFechar(){ const b=$('caAc'), t=$('caTxt'); if(!b||b.hidden) return false; b.hidden=true; AC.itens=[]; AC.i=0; t.setAttribute('aria-expanded','false'); t.removeAttribute('aria-activedescendant'); return true; }
function acEscolher(i){
  const x=AC.itens[i], t=$('caTxt'); if(!x) return;
  const fim=t.selectionStart;
  if(AC.tipo==='@'){ t.setRangeText('@'+curtaObra(x.valor)+' ', AC.ini, fim, 'end'); }
  else { t.setRangeText('', AC.ini, fim, 'end'); t.value=t.value.replace(/\s{2,}/g,' '); abrirVisao(x.valor.k, x.valor.ob); }
  CASCA.rascunho=t.value; acFechar(); campoMudou(true); t.focus({preventScroll:true});
}
function fecharMenus(){ const m=$('caEscopoMenu'); if(m && !m.hidden){ m.hidden=true; const b=$('caEscopo'); b.setAttribute('aria-expanded','false'); b.focus(); return true; } return acFechar(); }
function menuEscopo(){
  const m=$('caEscopoMenu'), b=$('caEscopo'), abrir=m.hidden; m.hidden=!abrir; b.setAttribute('aria-expanded', abrir);
  if(abrir){ const on=m.querySelector('[aria-checked=true]')||m.querySelector('button'); on.focus(); }
}
function escolherEscopo(id){ const s=sessaoAtual(); trocarEscopo(s.id, id); const b=$('caEscopo'); if(b) b.focus(); }
document.addEventListener('keydown', e=>{
  const m=$('caEscopoMenu'); if(!m || m.hidden || !m.contains(document.activeElement)) return;
  const bs=[...m.querySelectorAll('button')], i=bs.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus(); }
  else if(e.key==='Home'||e.key==='End'){ e.preventDefault(); bs[e.key==='Home'?0:bs.length-1].focus(); }
  else if(e.key==='Tab'){ m.hidden=true; $('caEscopo').setAttribute('aria-expanded','false'); }
});
document.addEventListener('mousedown', e=>{ const m=$('caEscopoMenu'); if(m && !m.hidden && !e.target.closest('#caEscopoMenu,#caEscopo')){ m.hidden=true; $('caEscopo').setAttribute('aria-expanded','false'); } });

const esperar = ms => new Promise(r=>setTimeout(r, ms));
function enviarMensagem(texto){ return enviar(texto); }       // nome que os chips da Conversa procuram
function enviarCampo(){ const t=$('caTxt'); if(t) enviar(t.value); }
async function enviar(texto){
  texto=String(texto||'').trim(); if(!texto || CASCA.pensando) return;
  const cmd=/^\/(\S+)\s*$/.exec(texto);                         // "/almoxarifado" sozinho: abre a visão, não vai ao agente
  if(cmd){ const q=semAcento(cmd[1]), k=[...visoesObra(), ...visoesGlobais()].find(k=>semAcento(rotuloVisao(k)+' '+k+' '+(VISAO_ALIAS[k]||'')).includes(q));
    if(k){ const t=$('caTxt'); t.value=''; CASCA.rascunho=''; campoMudou(true); abrirVisao(k, ehVisaoObra(k)?(escopoAtual()!=='geral'?escopoAtual():obraFoco()):null); return; } }
  if(state.modo!=='c'){ state=compat({modo:'c', sessao:CASCA.ultima||idGeral(), visao:null}); navegar(); }
  const s=sessaoAtual(), t=$('caTxt');
  s.escopoMsg = obraDoTexto(texto) || null;
  if(CASCA.ctx) s.contexto=CASCA.ctx; else delete s.contexto;
  s.visao = state.visao ? {chave:state.visao.chave, obra:state.visao.obra, filtro:state.visao.filtro} : null;   // a Conversa lê a visão aberta daqui
  s.msgs.push({de:'voce', hora:hhmm(), html:marcarMencoes(esc(texto))});
  CASCA.ctx=null; CASCA.rascunho=''; if(t){ t.value=''; }
  CASCA.pensando=true; render();
  const t0=performance.now(); let novas;
  try{ novas = typeof responder==='function' ? await responder(texto, s)
         : [{de:'agente', html:'Ainda não sei responder isso neste protótipo. Tente uma das sugestões acima do campo.'}]; }
  catch(err){ console.error(err); novas=[{de:'agente', html:'Não consegui responder agora. Tente de novo em instantes.'}]; }
  await esperar(Math.max(0, 600-(performance.now()-t0)));
  CASCA.pensando=false;
  (Array.isArray(novas)?novas:[novas]).filter(Boolean).forEach(m=>s.msgs.push(m));
  s.quando='agora';
  const abrir=[...(novas||[])].reverse().find(m=>m&&m.abrir);
  render();
  if(abrir && abrir.abrir) abrirVisao(abrir.abrir.chave, abrir.abrir.obra, {filtro:abrir.abrir.filtro});
  focarCampo();
}

/* ---------- a visão aberta (direita / tela cheia) ---------- */
function statusCurto(o){ return o.status==='plan' ? 'em orçamento' : o.atraso>0 ? `<span class="vs-atraso">${o.atraso} dias de atraso</span>` : stTxt(o); }
function visaoHTML(v){
  const o=v.obra && OBRAS.find(x=>x.id===v.obra), rot=rotuloVisao(v.chave);
  const corpo = o ? `<div class="page vs-page">${(o.status==='plan' && v.chave!=='hoje') ? emOrcamento(o) : (TAB_FNS[v.chave]||TAB_FNS.hoje)(o)}</div>` : (VIEWS[v.chave]||VIEWS.hub)();
  const arg = `'${v.chave}',${o?`'${o.id}'`:'null'}`;
  return `<header class="vs-top">
      ${v.cheia?`<button type="button" class="btn sm vs-volta" onclick="telaCheia(false)">${icon('arrowLeft',15)}Voltar à conversa</button>`:''}
      <div class="vs-id"><div class="vs-obra">${o?`<span class="dot" style="background:${stDot(o)}" aria-hidden="true"></span><span>${o.nome}</span><span class="sepr" aria-hidden="true">·</span><span>${statusCurto(o)}</span>`:'<span>Todas as obras</span>'}</div>
        <h2 id="vsTit">${icon(VISAO_IC[v.chave]||'list',17)}${rot}</h2></div>
      <span class="sp"></span>
      <button type="button" class="btn sm" onclick="perguntarSobre(${arg},${v.filtro?`'${esc(v.filtro).replace(/'/g,'&#39;')}'`:'null'})">${icon('message',14)}Perguntar sobre isto</button>
      <button type="button" class="iconbtn vs-cheia-btn" aria-pressed="${!!v.cheia}" aria-label="${v.cheia?'Sair da tela cheia':'Tela cheia'}" title="${v.cheia?'Sair da tela cheia':'Tela cheia'}" onclick="telaCheia(${!v.cheia})">${icon(v.cheia?'minimize':'maximize',17)}</button>
      <button type="button" class="iconbtn" aria-label="Fechar a visão" title="Fechar (Esc)" onclick="fecharVisao()">${icon('x',18)}</button>
    </header>
    ${v.filtro?`<div class="vs-filtro" role="status">${icon('list',14)}<span>Destacando <b>${esc(v.filtro)}</b></span><button type="button" class="link" onclick="limparFiltroVisao()">Tirar o destaque</button></div>`:''}
    <div class="vs-corpo" id="vsCorpo">${corpo}</div>`;
}
function desenharVisao(){
  const v=state.visao, el=$('visao'), app=document.querySelector('.app');
  app.classList.toggle('com-visao', !!v); app.classList.toggle('vs-cheia', !!(v&&v.cheia));
  if(!v){ el.hidden=true; el.innerHTML=''; el.dataset.k=''; return; }
  const k=v.chave+'/'+(v.obra||''), c0=$('vsCorpo'), mesma=el.dataset.k===k, y=mesma&&c0?c0.scrollTop:0, abriu=el.hidden;
  const foco=document.activeElement, idFoco=foco && el.contains(foco) && foco.id;
  el.hidden=false; el.innerHTML=visaoHTML(v); el.dataset.k=k;
  if(abriu){ el.classList.remove('entra'); void el.offsetWidth; el.classList.add('entra'); }
  const c=$('vsCorpo'); c.scrollTop=y;
  if(v.filtro) realcar(c, v.filtro, mesma);
  if(idFoco && $(idFoco)) $(idFoco).focus({preventScroll:true});
}
/* filtro livre: destaca as menores linhas/cartões que contêm o texto (sem acento, sem caixa) e rola até a primeira. */
/* Rola só o contêiner (scrollIntoView também rolaria body/.app e a página inteira desceria). */
function rolarAte(c, el){ const y=el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - (c.clientHeight - Math.min(el.offsetHeight, c.clientHeight))/2; c.scrollTop=Math.max(0, y); }
function realcar(c, filtro, semRolar){
  const q=semAcento(filtro).trim(); if(!q) return;
  const cand=[...c.querySelectorAll('tr,.ld,.kc,li,.ap-it,.card,.wscard')].filter(x=>semAcento(x.textContent).includes(q));
  const min=cand.filter(x=>!cand.some(y=>y!==x && x.contains(y)));
  min.forEach(x=>x.classList.add('vs-realce'));
  if(min[0] && !semRolar) rolarAte(c, min[0]);
}
document.addEventListener('click', e=>{ const a=e.target.closest && e.target.closest('#side a.nav, #side button.nav'); if(a && CASCA.side){ CASCA.side=false; } }, true);
