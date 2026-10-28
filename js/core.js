/* ===================== ESTADO / ROTAS ===================== */
let state = {view:'home', obra:null, tab:'chat'};
function go(view, obra, tab){ state={view, obra:obra||null, tab:tab||'chat'}; location.hash = [view,obra,tab].filter(Boolean).join('/'); render(); }
window.onhashchange = () => { const [v,o,t]=location.hash.slice(1).split('/'); if(v){state={view:v,obra:o||null,tab:t||'chat'}; render();} };
const $ = id => document.getElementById(id);
function toast(t){ const e=$('toast'); e.textContent=t; e.style.display='block'; clearTimeout(e._t); e._t=setTimeout(()=>e.style.display='none',2600); }
function obra(){ return OBRAS.find(o=>o.id===state.obra); }

/* Humano no loop: toda ação do agente ou do usuário fica registrada (quem, quando, de onde veio).
   A tela de aprovações/registro (js/features/proativo.js) lê daqui; qualquer feature grava aqui. */
const LOG = [
  {quando:'27/10 16:40', obra:'vila-nova', quem:'Joana M.', origem:'WhatsApp', texto:'Baixa de 8 sc de cimento · alvenaria do térreo'},
  {quando:'27/10 09:12', obra:'vila-nova', quem:'Rizzi', origem:'agente', texto:'Aprovou pedido PED-0160 · 120 sc de cimento · Depósito São Bento'},
  {quando:'24/10 18:05', obra:'loja-centro', quem:'Ana P.', origem:'tela', texto:'Recebimento conferido · PED-0109 · porcelanato 60×60'},
];
function registrar(texto, o={}){ LOG.unshift({quando:'28/10 '+new Date().toTimeString().slice(0,5), obra:o.obra||state.obra||'vila-nova', quem:o.quem||'Rizzi', origem:o.origem||'tela', texto}); }
/* Aviso com "Desfazer": use em toda ação que muda dado (aplicar economia, aprovar, transferir). */
function toastDesfazer(msg, desfazer){
  const e=$('toast'); e.innerHTML=`<span>${msg}</span>`+(desfazer?` <a href="#" style="margin-left:12px;color:var(--accent);font-weight:600">Desfazer</a>`:'');
  e.style.display='block'; clearTimeout(e._t); e._t=setTimeout(()=>e.style.display='none',6000);
  const a=e.querySelector('a'); if(a) a.onclick=ev=>{ev.preventDefault(); desfazer(); e.style.display='none'; registrar('Desfez: '+msg); render();};
}
function val(texto){ return `<div class="callout val">${icon('flask')}<div><b>Validar com o gerente de obra:</b> ${texto}</div></div>`; }

/* ===================== SIDEBAR ===================== */
function renderSide(){
  const st = o => o.status==='risco'?'var(--red)':o.status==='ok'?'var(--green)':'var(--faint)';
  recalcTransf();
  $('side').innerHTML = `
    <div class="brand"><div class="logo">${icon('spark',22)}</div>Canteiro</div>
    <div class="fict">${icon('info',14)}<span>Protótipo · todos os dados são fictícios e nenhum botão compra ou envia nada.</span></div>
    <a class="nav ${state.view==='home'?'on':''}" href="#home" onclick="go('home');return false">${icon('message')}Início — agente</a>
    <a class="nav ${state.view==='hub'?'on':''}" href="#hub" onclick="go('hub');return false">${icon('building')}Todas as obras</a>
    <a class="nav ${state.view==='estoque'?'on':''}" href="#estoque" onclick="go('estoque');return false">${icon('swap')}Estoque entre obras${TRANSF.filter(t=>t.sug>0).length?`<span class="count">${TRANSF.filter(t=>t.sug>0).length}</span>`:''}</a>
    ${NAV_EXTRA.map(n=>`<a class="nav ${state.view===n.view?'on':''}" href="#${n.view}" onclick="go('${n.view}');return false">${icon(n.icon)}${n.label}${n.count?`<span class="count">${n.count()}</span>`:''}</a>`).join('')}
    <div class="sec">Obras</div>
    ${OBRAS.map(o=>`<a class="nav ${state.obra===o.id?'on':''}" href="#" onclick="go('obra','${o.id}','chat');return false"><span class="dot" style="background:${st(o)}"></span>${o.nome}<small>${o.status==='plan'?'orçando':o.progresso+'%'}</small></a>`).join('')}
    <button class="newbtn" onclick="openWizard(1)">${icon('plus')}Nova obra</button>
    <div class="sec">Protótipo</div>
    <a class="nav" href="#" onclick="document.body.classList.toggle('notes');renderSide();return false">${icon('flask')}<span>Notas de validação: <b id="nt">${document.body.classList.contains('notes')?'ligadas':'desligadas'}</b></span><span class="toggle"></span></a>
    <a class="nav ${state.view==='fluxos'?'on':''}" href="#fluxos" onclick="go('fluxos');return false">${icon('map')}Mapa de fluxos</a>
    <div class="foot"><div class="av">RZ</div><div>Rizzi<br><span class="sm mut">Construtora RZ · Admin</span></div></div>`;
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
  return `<div class="top"><h1>Obras</h1><span class="sp"></span><button class="btn amb" onclick="openWizard(1)">${icon('plus',15)}Nova obra</button></div>
  <div class="page">
    ${val('Que informação o gerente precisa ver em cada cartão para decidir onde ir primeiro? (prazo, dinheiro, estoque, equipe?)')}
    <div class="grid g3">${OBRAS.map(o=>{
      const plan=o.status==='plan', pctB = plan?0:Math.round(o.gasto/o.budget*100);
      return `<div class="card wscard" onclick="go('obra','${o.id}','${plan?'chat':'overview'}')">
        <div class="row" style="align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;background:${o.cor};margin-top:9px;flex:none"></span><span class="name">${o.nome}</span><span class="sp"></span>${prazoPill(o)}</div>
        <div class="mut sm" style="margin:4px 0 18px 18px">${o.tipo} · ${o.local}</div>
        <div class="row sm"><span>${plan?'Orçamento sendo montado no chat':`Obra ${o.progresso}% · fase <b>${o.fase}</b>`}</span></div>
        <div class="bar" style="margin:8px 0 18px"><i style="width:${o.progresso}%;background:${o.cor}"></i></div>
        <div class="grid g2 sm" style="gap:12px 18px"><div><div class="mut">${plan?'Orçamento-alvo':'Orçamento'}</div><b>${brl(o.budget)}</b></div><div><div class="mut">Gasto</div><b>${plan?'—':brl(o.gasto)}</b> ${plan?'':`<span class="mut">(${pctB}%)</span>`}</div>
        <div><div class="mut">Prazo</div><b>${o.prazo}</b></div><div><div class="mut">Previsão</div><b style="color:${o.atraso>0?'var(--red)':o.atraso<0?'var(--green)':'inherit'}">${o.previsao}</b></div></div>
      </div>`}).join('')}</div>
  </div>`;
}

/* ===================== OBRA ===================== */
const TABS = [['chat','message','Chat'],['overview','chart','Orçamento'],['componentes','bricks','Insumos e compras'],['kanban','package','Pedidos'],['inventario','archive','Almoxarifado'],['equipe','users','Equipe'],['prazos','clock','Prazos']];

/* Abas da obra. Funcionalidade nova entra com TABS.push([...]) e TAB_FNS.chave = fn, num arquivo
   próprio em js/features. As setas chamam pelo nome na hora para que um feature possa redefinir
   a função original (ex.: tabEquipe = function(o){...}). */
const TAB_FNS = {chat:o=>tabChat(o), overview:o=>tabOverview(o), componentes:o=>tabComp(o), kanban:o=>tabKanban(o), inventario:o=>tabInv(o), equipe:o=>tabEquipe(o), prazos:o=>tabPrazos(o)};

/* Obra em orçamento (Galpão): só o chat existe; as outras abas esperam o orçamento fechar. */
function emOrcamento(o){
  const nome=(TABS.find(t=>t[0]===state.tab)||[,,'Esta aba'])[2];
  return `<div class="card vazio">${icon('hourglass',26)}<h3>${nome}: disponível depois do orçamento</h3>
    <p class="mut">O ${o.nome} ainda está em orçamento. Quando você aprovar o orçamento no chat, o agente cria as etapas, os insumos, os pedidos e o cronograma desta obra.</p>
    <button class="btn amb" onclick="go('obra','${o.id}','chat')">${icon('message',15)}Continuar o orçamento no chat</button></div>`;
}
function renderObra(){
  const o = obra();
  const body = (o.status==='plan' && state.tab!=='chat') ? emOrcamento(o) : (TAB_FNS[state.tab]||TAB_FNS.chat)(o);
  return `<div class="top" style="align-items:flex-end"><div><div class="crumb" style="margin-bottom:4px"><a href="#hub" onclick="go('hub');return false">Obras</a> / ${o.local}</div><h1>${o.nome}</h1></div><span style="margin-bottom:5px">${prazoPill(o)}</span><span class="sp"></span>
      <span class="mut sm" style="margin-bottom:6px">${o.status==='plan'?'Em orçamento':`Fase: <b style="color:var(--ink)">${o.fase}</b> · ${o.progresso}%`}</span></div>
    <div class="tabs">${TABS.map(([k,ic,l])=>`<a class="tab ${state.tab===k?'on':''}" href="#" onclick="go('obra','${o.id}','${k}');return false">${icon(ic,15)}${l}</a>`).join('')}</div>
    ${state.tab==='chat'?body:`<div class="page">${body}</div>`}`;
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

function tabChat(o){
  const C = CHATS[o.id] || CHATS['vila-nova'];
  return `<div class="chatwrap">
    <div class="sessions"><button class="btn" style="width:100%;margin-bottom:12px;justify-content:center" onclick="toast('(protótipo) abriria uma sessão nova nesta obra')">${icon('plus',15)}Nova sessão</button>
      ${C.sess.map((s,i)=>`<div class="sess ${i===0?'on':''}"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}
      <div class="sm mut" style="margin-top:18px;padding:0 10px;line-height:1.5">Cada obra tem suas sessões e o histórico fica separado. O agente só enxerga os dados desta obra.</div></div>
    <div class="chat">
      <div class="msgs">${val('Sessões separadas por assunto ("atraso do aço", "concretagem"): é assim que eles pensam, ou preferem um chat único por obra?')}${C.msgs()}</div>
      <div class="composer"><div><span class="attach">${icon('building',13)}Contexto: ${o.nome}</span></div><textarea placeholder="Pergunte sobre esta obra…"></textarea>
      <div class="row"><button class="btn sm" onclick="toast('(protótipo) anexar projeto, NF ou foto')">${icon('clip',14)}Anexar</button><span class="sp"></span><button class="btn amb" onclick="toast('(protótipo) enviar')">Enviar ${icon('arrowUp',15)}</button></div></div>
    </div></div>`;
}
const CHATS = {
  'vila-nova':{sess:[['Atraso do aço (Gerdau)','hoje'],['Concretagem da laje × chuva','hoje'],['Quebra do bloco','27/10'],['Medição da Equipe Silva','26/10'],['Orçamento inicial','03/03']],
    msgs:()=>{ const aco=LOTES.find(l=>l.id==='PED-0167'), conc=LOTES.find(l=>l.id==='PED-0166'), blo=LOTES.find(l=>l.id==='PED-0162');
      const i=INV.find(x=>x.id==='aco'), sal=i.ent-i.sai, cam=aCaminho('vila-nova','aco'), f=faltaDe('vila-nova','aco');
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

function best(c){ return c.forn.reduce((a,b)=>a.p<b.p?a:b); }
/* Quanto falta comprar de um insumo: falta do almoxarifado (precisa − saldo − a caminho) menos o que vem
   por transferência sugerida. Insumo que ainda não está no almoxarifado: projeto − pedidos aprovados. */
function compraDe(obraId, c){
  const d=dados(obraId), invId=c.inv||c.id, i=d.inv.find(x=>x.id===invId);
  const pedido=d.lotes.filter(l=>l.inv===invId&&l.col>=1).reduce((a,l)=>a+(l.receb??l.medido??l.qn??0),0);
  const falta=i? faltaDe(obraId,invId) : Math.max(0,c.qtd-pedido);
  const tr=TRANSF.find(t=>t.inv===invId&&t.destino===obraId&&t.sug>0), trf=tr?Math.min(tr.sug,falta):0;
  return {invId, comprado:i?i.ent+aCaminho(obraId,invId):pedido, falta, trf, compra:falta-trf, cot:emCotacao(obraId,invId)};
}
const SEL = {};
function selComp(obraId){ if(!SEL[obraId]) SEL[obraId]=new Set(dados(obraId).comp.filter(c=>compraDe(obraId,c).compra>0).map(c=>c.id)); return SEL[obraId]; }
function toggleComp(obraId,id,on){ const s=selComp(obraId); on?s.add(id):s.delete(id); const b=$('btnPedido'); if(b) b.innerHTML=`${icon('cart',15)}Gerar pedido de compra (${s.size})`; }
function pedirSel(obraId){ const s=[...selComp(obraId)]; if(!s.length) return toast('Marque pelo menos um insumo'); openCheckout(s,{obra:obraId}); }
function tabComp(o){
  const d=dados(o.id), sel=selComp(o.id);
  return `${val('O nível de detalhe do levantamento (quantidades vindas do projeto) bate com o que eles fazem hoje na planilha? Eles confiariam na quantidade estimada pelo agente, ou querem revisar item a item?')}
  <div class="row" style="margin-bottom:16px"><span class="sectit">Insumos gerados do projeto</span><span class="pill info">${d.comp.length} de ${o.id==='vila-nova'?64:31} insumos</span><span class="mut sm">preços cotados hoje · região de ${o.local.split(' ·')[0]}</span><span class="sp"></span>
    <button class="btn" onclick="toast('(protótipo) exportaria a lista em planilha')">${icon('download',15)}Exportar</button><button class="btn amb" id="btnPedido" onclick="pedirSel('${o.id}')">${icon('cart',15)}Gerar pedido de compra (${sel.size})</button></div>
  <div class="card" style="padding:0"><table>
    <tr><th style="width:30px"></th><th>Insumo</th><th class="num">Qtd. da obra</th><th class="num">Comprado ou a caminho</th><th class="num">Falta comprar</th><th>Fornecedor</th><th class="num">Preço un.</th><th class="num">Total da falta</th><th class="num">Economia vs. 2º</th></tr>
    ${d.comp.map(c=>{const k=compraDe(o.id,c), m=best(c), b=(k.cot&&c.forn.find(f=>f.n===k.cot.forn))||m, s=[...c.forn].sort((x,y)=>x.p-y.p)[1], eco=b===m&&s?(s.p-b.p)*k.compra:0;
      const nota = k.trf?`<div class="sm" style="color:var(--blue)">+ ${num(k.trf)} por transferência</div>`:k.compra>0&&k.cot?`<div class="sm mut">${k.cot.id} em cotação</div>`:'';
      return `<tr class="click" onclick="openComp('${c.id}')"><td><input type="checkbox" style="accent-color:var(--accent)" ${sel.has(c.id)?'checked':''} ${k.compra>0?'':'disabled'} onclick="event.stopPropagation();toggleComp('${o.id}','${c.id}',this.checked)"></td>
      <td><b>${c.nome}</b><div class="sm mut">${c.fase}</div></td><td class="num">${num(c.qtd)} ${c.un}</td><td class="num">${num(k.comprado)}</td>
      <td class="num">${k.compra>0?`<b>${num(k.compra)} ${c.un}</b>`:'<span class="pill ok">nada</span>'}${nota}</td>
      <td>${b.n} <span class="mut sm">· ${b.prazo}</span></td><td class="num">${brl2(b.p)}</td><td class="num"><b>${k.compra>0?brl(b.p*k.compra):'—'}</b></td><td class="num" style="color:var(--green)">${eco>0?brl(eco):b!==m&&k.compra>0?`<span class="sm mut">${m.n.split(' ')[0]} é mais barata, mas ${c.id==='aco'?'está atrasada':'demora mais'}</span>`:'—'}</td></tr>`}).join('')}
  </table></div>
  <p class="sm mut" style="margin-top:12px">Falta comprar = precisa até o fim − saldo no almoxarifado − o que já está pedido − transferência sugerida. Clique num insumo para comparar fornecedores.</p>`;
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
function dropLote(e,col){ moverLote(e.dataTransfer.getData('t'), col); }
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
function cartaoLote(l){
  const acao = l.col<4 ? `<button class="btn sm" title="Avançar para ${KCOLS[l.col+1]}" onclick="avancarLote('${l.id}')">Avançar ${icon('arrowRight',13)}</button>`
    : l.conf ? `<span class="sm row" style="gap:5px;color:var(--green)">${icon('checkCircle',14)}No almoxarifado</span>`
    : `<button class="btn amb sm" onclick="conferirLote('${l.id}')">${icon('file',13)}Conferir NF</button>`;
  return `<div class="kc ${l.late?'late':''} ${l.conf?'done':''}" draggable="${!l.conf}" ondragstart="event.dataTransfer.setData('t','${l.id}')">
    <div class="row sm mut" style="gap:4px;flex-wrap:wrap"><span>${l.id}</span><span class="sp"></span>${l.trf?`<span class="pill info">${icon('swap',12)}transf.</span>`:''}${l.ai?`<span class="pill warn">${icon('spark',12)}sugerido</span>`:''}${l.late?'<span class="pill bad">atrasado</span>':''}</div>
    <b>${l.item}</b><div class="sm mut">${l.q} · ${l.forn}</div>
    <div class="meta"><span>${l.eta}</span><b style="color:var(--ink);margin:0">${brl(l.v)}</b></div>
    <div class="kact">${acao}</div></div>`;
}
function tabKanban(o){
  const L=dados(o.id).lotes, comp=L.filter(l=>l.col>=1&&!l.conf).reduce((a,l)=>a+l.v,0);
  return `${val('Essas 5 etapas são as reais de um pedido? Falta "Pago"? Quem confere no recebimento é a mestre: conferir a NF pelo celular é viável no canteiro?')}
  <div class="row" style="margin-bottom:16px"><span class="sectit">Pedidos da obra</span><span class="mut sm">arraste o cartão ou use "Avançar" · Recebido só entra no Almoxarifado depois de conferir a NF</span><span class="sp"></span>
    <span class="sm mut">Pedidos em aberto: <b style="color:var(--ink)">${brl(comp)}</b></span></div>
  <div class="kb5">${KCOLS.map((c,i)=>{const ls=L.filter(l=>l.col===i);
    return `<div class="col" ondragover="event.preventDefault()" ondrop="dropLote(event,${i})"><h4>${i===4?`<span style="color:var(--green)">${icon('checkCircle',15)}</span>`:''}${c}<small>${ls.length} · ${brl(ls.reduce((a,l)=>a+l.v,0))}</small></h4>
      ${ls.map(cartaoLote).join('')||'<div class="sm mut" style="padding:6px 4px">nenhum pedido</div>'}</div>`}).join('')}</div>`;
}

/* ===================== ALMOXARIFADO ===================== */
/* O que fazer com o item: transferir, comprar o resto (sem contar o que já está pedido) ou ceder a sobra. */
function acaoInv(o,i){
  const falta=faltaDe(o.id,i.id), cot=emCotacao(o.id,i.id);
  const tr=TRANSF.find(x=>x.inv===i.id&&x.destino===o.id&&x.sug>0), sob=TRANSF.find(x=>x.inv===i.id&&x.origem===o.id&&x.sug>0);
  const curta = id => NOME_OBRA[id].replace('Reforma ','').replace('Casa ','');
  if(falta<=0){
    if(sob) return `<span class="pill ok" style="cursor:pointer" onclick="event.stopPropagation();openTransfer('${i.id}')">sobra ${num(sob.max)} · ${num(sob.sug)} podem ir para a ${curta(sob.destino)}</span>`;
    if(i.obs) return `<span class="pill gray">${i.obs}</span>`;
    return '<span class="pill ok">suficiente</span>';
  }
  let h='', resto=falta;
  if(tr){ h+=`<span class="pill info" style="cursor:pointer" onclick="event.stopPropagation();openTransfer('${i.id}')">${icon('swap',12)}${num(tr.sug)} da ${curta(tr.origem)}</span> `; resto-=Math.min(tr.sug,falta); }
  if(resto>0) h+= cot&&cot.qn>=resto ? `<span class="pill warn">comprar ${num(resto)} · ${cot.id}</span>` : `<span class="pill ${i.st==='bad'?'bad':'warn'}">comprar ${num(resto)}</span>`;
  return h;
}
function tabInv(o){
  const d=dados(o.id), inv=d.inv, acabam=inv.filter(i=>i.st==='bad'), quebra=inv.find(i=>i.quebra);
  const sobras=TRANSF.filter(t=>t.origem===o.id&&t.sug>0);
  const chegando=d.lotes.filter(l=>l.col===4&&!l.conf);
  return `${val('Quem dá baixa no material no dia a dia é a mestre, pelo WhatsApp. Registrar "para onde foi" só nos itens curva A (aço, concreto, bloco, cimento, porcelanato) e contar o resto toda semana é viável no canteiro?')}
  <div class="grid g4" style="margin-bottom:24px">
    <div class="card kpi"><div class="l">Itens no almoxarifado</div><div class="v">${d.itensAlmox}</div><div class="s mut">${inv.length} nesta lista: curva A, B e alertas</div></div>
    <div class="card kpi"><div class="l">Valor em estoque</div><div class="v">${brl(d.valorEstoque)}</div><div class="s mut">a preço de compra</div></div>
    <div class="card kpi"><div class="l">Acabam em ≤ 7 dias</div><div class="v" style="color:${acabam.length?'var(--red)':'inherit'}">${acabam.length}</div><div class="s mut">${acabam.map(i=>i.nome.split(' ').slice(0,2).join(' ')).join(', ')||'nenhum'}</div></div>
    ${quebra?`<div class="card kpi" style="cursor:pointer" onclick="openInvItem('${quebra.id}','${o.id}')"><div class="l">Quebra acima do previsto</div><div class="v" style="color:var(--amber)">${quebra.quebra.real}%</div><div class="s mut">${quebra.nome.split(' ').slice(0,2).join(' ')} · previsto ${quebra.quebra.prev}%</div></div>`
      :`<div class="card kpi"><div class="l">Sobra para outras obras</div><div class="v" style="color:var(--green)">${sobras.length}</div><div class="s mut">${sobras.map(t=>`${num(t.sug)} ${t.un} de ${t.item.split(' ')[0].toLowerCase()}`).join(' · ')||'nada'}</div></div>`}
  </div>
  ${chegando.length?`<div class="card alertnote inline" style="margin-bottom:16px;font-size:13px;padding:12px 16px">${icon('truck',15)}<div><b>${chegando.map(l=>l.id).join(', ')}</b> chegou e ainda não foi conferido: ${chegando.map(l=>`${l.item}, ${l.eta}`).join('; ')}. Só entra no saldo depois da conferência. <a class="link" href="#" onclick="conferirLote('${chegando[0].id}');return false">Conferir NF</a></div></div>`:''}
  <div class="row" style="margin-bottom:14px"><span class="sectit">Saldo por item</span><span class="sp"></span><button class="btn" onclick="openBaixa()">${icon('minus',15)}Registrar saída</button><button class="btn" onclick="go('obra','${o.id}','kanban');toast('Entradas vêm de Pedidos: Recebido → Conferir NF')">${icon('plus',15)}Registrar entrada</button><button class="btn" onclick="go('estoque')">${icon('swap',15)}Pedir de outra obra</button></div>
  <div class="card" style="padding:0"><table>
    <tr><th>Item</th><th class="num">Entrou</th><th class="num">Saiu</th><th class="num">Saldo</th><th class="num">A caminho</th><th class="num">Precisa até o fim</th><th class="num">Falta</th><th>Dura</th><th>O que fazer</th></tr>
    ${inv.map(i=>{const s=i.ent-i.sai, cam=aCaminho(o.id,i.id), falta=faltaDe(o.id,i.id);
      return `<tr class="click" onclick="openInvItem('${i.id}','${o.id}')"><td><b>${i.nome}</b> <span class="curva c${i.abc}" title="curva ${i.abc}">${i.abc}</span></td><td class="num">${num(i.ent)} ${i.un}</td><td class="num">${num(i.sai)}</td><td class="num"><b>${num(s)}</b></td>
      <td class="num">${cam?`<span style="color:var(--blue)">${num(cam)}</span>`:'<span class="mut">—</span>'}</td><td class="num">${num(i.nec)}</td>
      <td class="num">${falta>0?`<b style="color:${i.st==='bad'?'var(--red)':'var(--amber)'}">${num(falta)}</b>`:'<span class="mut">0</span>'}</td><td class="sm">${i.cob}</td><td>${acaoInv(o,i)}</td></tr>`}).join('')}
  </table></div>
  <p class="sm mut" style="margin-top:12px">Falta = precisa até o fim − saldo − a caminho. A caminho = pedidos aprovados, enviados, em trânsito ou recebidos sem conferir (vale o medido na obra). Curva A tem baixa com destino; curva C é contada toda semana.</p>`;
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
  /* estoque até o fim: itens do almoxarifado que ainda serão usados + insumos ainda não comprados */
  const linhas=[...d.inv.filter(i=>i.nec>0).map(i=>({nome:i.nome, un:i.un, tem:i.ent-i.sai, cam:aCaminho(o.id,i.id), nec:i.nec, falta:faltaDe(o.id,i.id), acao:acaoInv(o,i)})),
    ...d.comp.filter(c=>!d.inv.find(i=>i.id===(c.inv||c.id))).map(c=>{const k=compraDe(o.id,c); return {nome:c.nome, un:c.un, tem:0, cam:k.comprado, nec:c.qtd, falta:k.falta,
      acao:k.falta>0?`<span class="pill warn">comprar ${num(k.falta)}${k.cot?' · '+k.cot.id:''}</span>${c.id==='telha'?' <span class="pill gray">até 12/11 (frete 10 dias)</span>':''}`:'<span class="pill ok">pedido</span>'};})]
    .sort((a,b)=>(b.falta>0)-(a.falta>0));
  return `${val('A explicação do atraso por causa (fornecedor, equipe, clima) é o que o dono da obra cobra? Quais causas faltam (projeto, aprovação na prefeitura, pagamento)?')}
  <div class="grid g4" style="margin-bottom:18px">
    <div class="card kpi"><div class="l">Prazo contratado</div><div class="v">${o.prazo}</div></div>
    <div class="card kpi"><div class="l">Previsão do agente</div><div class="v" style="color:${atrasa?'var(--red)':'var(--green)'}">${o.previsao}</div><div class="s" style="color:${atrasa?'var(--red)':'var(--green)'}">${prazoTxt(o)}</div></div>
    <div class="card kpi"><div class="l">Fase atual</div><div class="v">${P.faseAtual}</div><div class="s mut">${P.fasePct}% · ${P.faseObs}</div></div>
    ${atrasa?`<div class="card kpi"><div class="l">Com o plano de ação</div><div class="v" style="color:var(--green)">${o.atraso} → ${o.atraso-P.recupera} dias</div><div class="s mut">atraso cai de ${o.atraso} para ${o.atraso-P.recupera} dias</div></div>`
      :`<div class="card kpi"><div class="l">Folga</div><div class="v" style="color:var(--green)">${-o.atraso} dias</div><div class="s mut">entrega ${o.previsao}, prazo ${o.prazo}</div></div>`}
  </div>
  <div class="grid" style="grid-template-columns:1.3fr 1fr">
    <div class="card"><h3>Cronograma por fase <small>· semanas desde ${P.base}</small></h3>
      <div class="legend" style="margin-bottom:16px"><span><i style="background:#dcd8cc"></i>planejado</span><span><i style="background:var(--accentHi)"></i>real / projetado</span><span><i style="background:var(--red);width:2px"></i>hoje (sem. ${hoje})</span></div>
      <div class="gantt">${d.fases.map(f=>`<div>${f.n}<div class="sm mut">${f.pct}%</div></div><div class="gtrack">
        <div class="gb" style="left:${pct(f.ini)}%;width:${pct(f.fim-f.ini)}%;background:#dcd8cc;top:3px;height:7px"></div>
        <div class="gb" style="left:${pct(f.real[0])}%;width:${pct(f.real[1]-f.real[0])}%;background:${f.pct===100?'var(--green)':'var(--accentHi)'};top:13px;height:7px;opacity:${f.pct===0?.45:1}"></div>
        <div class="today" style="left:${pct(hoje)}%"></div></div>`).join('')}</div>
      ${atrasa?`<div class="card agentnote inline" style="margin-top:18px;font-size:13px;padding:14px 16px">${icon('spark',15)}<div><b>Plano de ação: o atraso cai de ${o.atraso} para ${o.atraso-P.recupera} dias</b><br>
        1. Comprar os 600 kg de aço que faltam na Aço Forte (2 dias) e não esperar a Gerdau <span class="pill ok">−6 dias</span><br>
        2. Contratar os 2 armadores por empreitada até o fim da estrutura <span class="pill ok">−5 dias</span><br>
        3. Aprovar já a telha de Tatuí (PED-0163, frete de 10 dias) <span class="pill ok">−4 dias</span><br>
        <span class="mut">A concretagem de qui 05/11 tem 80% de chuva: remarcar para sex 06/11 não muda o prazo, porque a armação só fecha com o aço novo.</span></div></div>`:''}</div>
    <div><div class="card" style="margin-bottom:18px"><h3>${atrasa?'Por que vai atrasar':'Por que está adiantada'}${atrasa?` <small>· ${P.causas.map(c=>'+'+c[2]).join(' ')} = ${o.atraso} dias</small>`:''}</h3>
      ${P.causas.map(c=>`<div style="margin:12px 0"><div class="row sm"><b>${c[0]}</b><span class="sp"></span><b>${c[2]>0?'+':'−'}${Math.abs(c[2])} dias</b></div><div class="sm mut">${c[1]}</div><div class="bar" style="margin-top:6px"><i style="width:${Math.abs(c[2])/totC*100}%;background:${c[3]}"></i></div></div>`).join('')}</div>
  </div></div>
    <div class="card" style="margin-top:18px"><h3>O estoque aguenta até o fim?</h3>
      <table class="sm"><tr><th>Item</th><th class="num">Tem</th><th class="num">A caminho</th><th class="num">Precisa</th><th class="num">Falta</th><th>O que fazer</th></tr>
      ${linhas.map(r=>`<tr><td><b>${r.nome.split(' (')[0]}</b></td><td class="num">${num(r.tem)}</td><td class="num">${r.cam?num(r.cam):'—'}</td><td class="num">${num(r.nec)}</td><td class="num">${r.falta>0?`<b>${num(r.falta)}</b>`:'0'}</td><td>${r.acao}</td></tr>`).join('')}</table>
      <div class="row" style="margin-top:14px"><span class="sm mut">Falta = precisa − tem − a caminho. Nada do que já está pedido entra na sugestão.</span><span class="sp"></span><button class="btn amb" onclick="go('obra','${o.id}','kanban')">Ver pedidos sugeridos</button></div></div>`;
}

/* ===================== DRAWERS / MODAIS ===================== */
function closeDrawer(){ $('drawer').classList.remove('on'); }
function closeModal(){ $('modal').classList.remove('on'); }
function openComp(id){
  const c=insumo(id); if(!c) return toast('Insumo não encontrado');
  const fs=[...c.forn].sort((a,b)=>a.p-b.p), ob=Object.keys(DADOS).find(k=>DADOS[k].comp.includes(c)), k=compraDe(ob,c), q=k.compra>0?k.compra:c.qtd;
  $('drawerPane').innerHTML = `<div class="row"><span class="mut sm">Insumo · ${NOME_OBRA[ob]}</span><span class="sp"></span><button class="iconbtn" onclick="closeDrawer()" aria-label="Fechar">${icon('x',18)}</button></div>
    <h2 style="margin:6px 0 4px">${c.nome}</h2><div class="mut">${c.fase} · obra inteira <b style="color:var(--ink)">${num(c.qtd)} ${c.un}</b> · falta comprar <b style="color:var(--ink)">${num(k.compra)} ${c.un}</b></div>
    <div class="card agentnote inline" style="margin:18px 0;font-size:13px;padding:14px 16px">${icon('spark',15)}<div><b>Como estimei:</b> quantidade tirada do memorial descritivo e das plantas, com a perda média do mercado para este insumo. Falta comprar = precisa − saldo − a caminho${k.trf?` − ${num(k.trf)} por transferência`:''}. <a href="#" style="text-decoration:underline" onclick="toast('(protótipo) abriria o trecho do projeto');return false">ver no projeto</a></div></div>
    <h3 style="font:500 18px var(--serif);margin:22px 0 12px">Onde comprar · ${fs.length} fornecedores na região</h3>
    ${fs.map((f,i)=>`<div class="card" style="margin-bottom:10px;padding:16px 18px;${i===0?'border-color:#bcd0bf':''}"><div class="row"><b>${f.n}</b>${i===0?'<span class="pill ok">melhor preço</span>':''}<span class="sp"></span><b>${brl2(f.p)}</b><span class="mut sm">/${c.un}</span></div>
      <div class="row sm mut" style="margin-top:6px;gap:16px"><span class="row" style="gap:5px">${icon('pin',13)}${f.cid}</span><span class="row" style="gap:5px">${icon('truck',13)}${f.prazo}</span><span class="row" style="gap:5px">${icon('star',13)}${f.nota}</span><span class="sp"></span><span>${num(q)} ${c.un}: <b style="color:var(--ink)">${brl(f.p*q)}</b></span></div>
      <div class="row" style="margin-top:12px;gap:8px">${k.compra>0?`<button class="btn sm" onclick="openCheckout(['${c.id}'],{forn:'${f.n}',obra:'${ob}'})">Pedir aqui</button>`:`<span class="pill ok">nada a comprar agora</span>`}<button class="btn sm" onclick="toast('(protótipo) abriria o WhatsApp do fornecedor')">Contato</button></div></div>`).join('')}
    <p class="sm mut">Preços coletados hoje às 07:40 em sites, catálogos e cotações por WhatsApp. Validade de 48 h.</p>`;
  $('drawer').classList.add('on');
}
function openInvItem(id, obraId){
  const ob=obraId||(state.obra&&DADOS[state.obra]&&dados(state.obra).inv.length?state.obra:'vila-nova'), d=dados(ob);
  const i=d.inv.find(x=>x.id===id)||d.inv[0]; if(!i) return toast('Item não encontrado no almoxarifado');
  const s=i.ent-i.sai, cam=aCaminho(ob,i.id), falta=faltaDe(ob,i.id), C=i.abc==='C';
  const movs=d.mov[i.id]||[{d:'—',t:'Entrada',q:+i.ent,onde:'Recebimentos conferidos',quem:'mestre'},{d:'—',t:'Saída',q:-i.sai,onde:'Várias frentes',quem:'—'}];
  const saidas=movs.filter(m=>m.q<0&&m.t!=='Contagem'), cores=['#5b7a99','#8a7ca8','#5b8364','#b08a4a','#6f8f8a'];
  const cor=(m,k)=>m.t==='Quebra'?'var(--red)':cores[k%cores.length];
  const quebras=saidas.filter(m=>m.t==='Quebra').reduce((a,m)=>a-m.q,0), usados=saidas.filter(m=>m.t!=='Quebra').reduce((a,m)=>a-m.q,0);
  const tr=TRANSF.find(x=>x.inv===i.id&&x.destino===ob&&x.sug>0), cot=emCotacao(ob,i.id);
  closeModal();
  $('drawerPane').innerHTML = `<div class="row"><span class="mut sm">Almoxarifado · ${NOME_OBRA[ob]}</span><span class="sp"></span><button class="iconbtn" onclick="closeDrawer()" aria-label="Fechar">${icon('x',18)}</button></div>
    <h2 style="margin:6px 0 4px">${i.nome} <span class="curva c${i.abc}">${i.abc}</span></h2>
    <div class="mut">Entraram ${num(i.ent)} · saíram ${num(i.sai)} · <b style="color:var(--ink)">saldo ${num(s)} ${i.un}</b>${cam?` · a caminho ${num(cam)}`:''} · precisa ${num(i.nec)} · <b style="color:${falta?'var(--red)':'var(--green)'}">falta ${num(falta)}</b></div>
    ${C?`<div class="card inline" style="margin:18px 0;font-size:13px;padding:14px 16px;background:var(--cream)">${icon('info',15)}<div><b>Curva C: controle por contagem semanal, sem destino.</b> Item barato e de uso espalhado; registrar para onde vai cada unidade vira burocracia. Última contagem: ${i.contagem||'—'}, ${num(s)} ${i.un}.</div></div>`
      :`<h3 style="font:500 18px var(--serif);margin:26px 0 12px">Para onde foi</h3>
    <div class="split" style="height:20px;margin-bottom:12px;border-radius:6px">${saidas.map((m,k)=>`<div style="width:${-m.q/i.ent*100}%;background:${cor(m,k)}" title="${m.onde}"></div>`).join('')}<div style="width:${Math.max(0,s)/i.ent*100}%;background:#dcd8cc"></div></div>
    <div class="sm">${saidas.map((m,k)=>`<div class="row" style="margin:6px 0"><i style="width:9px;height:9px;border-radius:3px;background:${cor(m,k)};flex:none"></i>${m.onde}<span class="sp"></span><b>${num(-m.q)}</b><span class="mut" style="width:42px;text-align:right">${Math.round(-m.q/i.ent*100)}%</span></div>`).join('')}
      <div class="row" style="margin:6px 0"><i style="width:9px;height:9px;border-radius:3px;background:#dcd8cc;flex:none"></i>No almoxarifado<span class="sp"></span><b>${num(s)}</b><span class="mut" style="width:42px;text-align:right">${Math.round(s/i.ent*100)}%</span></div></div>`}
    ${i.quebra?`<div class="card alertnote inline" style="margin:18px 0;font-size:13px;padding:14px 16px">${icon('alert',15)}<div><b>Quebra de ${Math.round(quebras/(quebras+usados)*100)}% contra ${i.quebra.prev}% previsto:</b> de ${num(quebras+usados)} que saíram, ${num(usados)} foram assentados e ${num(quebras)} quebraram. O PED-0149 foi descarregado sem palete.
      ${(()=>{const p=d.lotes.find(l=>l.id==='PED-0162'); return p? (p.palete?`<div style="margin-top:8px"><span class="pill ok">${icon('check',12)}palete exigido no PED-0162</span></div>`:`<div style="margin-top:8px"><button class="btn sm amb" onclick="exigirPalete();openInvItem('${i.id}','${ob}')">Exigir palete no PED-0162 (9.000 un)</button></div>`):'';})()}</div></div>`:''}
    ${i.obs?`<div class="sm mut" style="margin-top:12px">${icon('info',13)} ${i.obs}</div>`:''}
    <h3 style="font:500 18px var(--serif);margin:22px 0 12px">Movimentações</h3>
    <div class="card" style="padding:0"><table class="sm"><tr><th>Data</th><th>Tipo</th><th class="num">Qtd</th><th>${C?'Observação':'Destino / origem'}</th><th>Quem</th></tr>
      ${movs.map(m=>`<tr><td>${m.d}</td><td><span class="pill ${m.q>0?'ok':m.t==='Quebra'?'bad':'gray'}">${m.t}</span></td><td class="num">${m.q>0?'+':''}${num(m.q)}</td><td>${m.onde}</td><td class="mut">${m.quem}</td></tr>`).join('')}</table></div>
    <div class="row" style="margin-top:16px"><button class="btn" onclick="openBaixa('${i.id}')">${icon('minus',15)}${C?'Registrar contagem ou saída':'Registrar saída'}</button>
      ${falta<=0?'<span class="pill ok">estoque cobre até o fim</span>'
        :tr?`<button class="btn amb" onclick="openTransfer('${i.id}')">${icon('swap',15)}Trazer ${num(tr.sug)} da ${NOME_OBRA[tr.origem]}</button>`
        :cot?`<button class="btn amb" onclick="closeDrawer();go('obra','${ob}','kanban');toast('${cot.id} em cotação: ${num(cot.qn)} ${i.un}')">Ver ${cot.id} (${num(cot.qn)} ${i.un})</button>`
        :`<button class="btn amb" onclick="closeDrawer();go('obra','${ob}','componentes')">Pedir os ${num(falta)} ${i.un} que faltam</button>`}</div>`;
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

/* Estoque entre obras */
function renderEstoque(){
  recalcTransf();
  const ativas=TRANSF.filter(t=>t.sug>0), vence=ativas.filter(t=>t.perda);
  const eco=ativas.reduce((a,t)=>a+t.sug*(t.novo-t.custo),0), dias=Math.max(0,...ativas.map(t=>t.dias||0));
  const saldoObra = id => TRF_HIST.reduce((a,h)=>a+(h.de===id?h.v:0)-(h.para===id?h.v:0),0);
  const qtd = t => `${num(t.sug)} ${t.un==='un'?'':t.un+' de '}${t.item.split(' ')[0].toLowerCase()}${t.un==='un'?'s':''}`;
  return `<div class="top"><h1>Estoque entre obras</h1><span class="crumb">o que sobra numa obra e falta em outra · sempre a preço de custo</span></div>
  <div class="page">
    ${val('Ele já faz isso hoje, "no braço", entre obras? Com que frequência? Quem autoriza a saída da obra de origem: o mestre dela, o gerente ou o dono? E quando as obras são de clientes diferentes (o material é do cliente), ainda pode?')}
    <div class="grid g4" style="margin-bottom:18px">
      <div class="card kpi"><div class="l">Material aproveitado</div><div class="v">${ativas.length} ${ativas.length===1?'insumo':'insumos'}</div><div class="s mut">${ativas.map(qtd).join(' · ')||'nenhuma sugestão pendente'}</div></div>
      <div class="card kpi"><div class="l">Deixa de vencer</div><div class="v" style="color:var(--green)">${vence.length?vence.map(t=>`${num(t.sug)} ${t.un}`).join(' + '):'—'}</div><div class="s mut">${vence.map(t=>`${t.item.split(' ')[0].toLowerCase()} da ${NOME_OBRA[t.origem]}, vence em 25 dias`).join('; ')||'nada vencendo'}</div></div>
      <div class="card kpi"><div class="l">Dias ganhos</div><div class="v" style="color:var(--green)">${dias?`até ${dias} dias`:'—'}</div><div class="s mut">${ativas.length?`chega hoje; comprando, levaria de ${Math.min(...ativas.map(t=>t.dias))} a ${dias} dias`:'—'}</div></div>
      <div class="card kpi"><div class="l">Compra evitada</div><div class="v">${brl(ativas.reduce((a,t)=>a+t.sug*t.novo,0))}</div><div class="s mut">a preço novo · ${brl2(eco)} a menos pagando custo</div></div>
    </div>
    <div class="card" style="margin-bottom:18px"><h3>${icon('spark',17)}Transferências sugeridas</h3>
      <div class="sm mut" style="margin:-6px 0 12px">Regra: a obra de origem fica com o que ainda vai usar <b>+ uma reserva de metade disso</b>. Só o que passar disso pode sair. O destino precisa = precisa − saldo − a caminho.</div>
      <table><tr><th>Item</th><th>De → para</th><th class="num">Saldo na origem</th><th class="num">Origem ainda usa</th><th class="num">Reserva</th><th class="num">Pode sair</th><th class="num">Destino precisa</th><th class="num">Preço de custo</th><th class="num">Total</th><th></th></tr>
      ${ativas.map(t=>`<tr><td><b>${t.item}</b>${t.perda?`<div class="sm row" style="gap:5px;color:var(--amber)">${icon('hourglass',13)}vence em 25 dias na origem</div>`:''}</td>
        <td class="sm">${NOME_OBRA[t.origem]}<br><span class="mut">→</span> <b>${NOME_OBRA[t.destino]}</b></td>
        <td class="num">${num(t.saldo)}</td><td class="num">${num(t.usar)}</td><td class="num">${num(t.reserva)}</td><td class="num"><b>${num(t.max)}</b></td><td class="num">${num(t.falta)}</td>
        <td class="num">${brl2(t.custo)}<div class="sm mut">novo: ${brl2(t.novo)}</div></td><td class="num"><b>${brl2(t.sug*t.custo)}</b><div class="sm mut">${num(t.sug)} ${t.un}</div></td>
        <td><button class="btn amb sm" onclick="openTransfer('${t.inv}')">Transferir</button></td></tr>`).join('')||`<tr><td colspan="10" class="mut">Nenhuma sugestão pendente: as transferências pedidas estão no histórico, aguardando o OK da origem.</td></tr>`}</table></div>
    <div class="grid" style="grid-template-columns:1.6fr 1fr">
      <div class="card"><h3>Histórico</h3><table class="sm"><tr><th>Nº</th><th>Data</th><th>Item</th><th>De → para</th><th class="num">Valor (custo)</th><th>Situação</th></tr>
        ${TRF_HIST.map(h=>`<tr><td class="mut">${h.id}</td><td>${h.d}</td><td>${h.item} · ${h.q}</td><td>${NOME_OBRA[h.de]} → ${NOME_OBRA[h.para]}</td><td class="num">${brl2(h.v)}</td><td><span class="pill ${h.st==='Recebida'?'ok':'warn'}">${h.st}</span></td></tr>`).join('')}</table></div>
      <div class="card"><h3>Acerto entre as obras <small>· no orçamento de cada uma</small></h3>
        <div class="sm mut" style="margin-bottom:10px">Quem cede recebe o valor de volta no orçamento; quem recebe lança como gasto de material.</div>
        ${['vila-nova','loja-centro'].map(id=>{const v=saldoObra(id); return `<div class="row" style="margin:10px 0;padding-bottom:10px;border-bottom:1px solid var(--line2)"><span>${NOME_OBRA[id]}</span><span class="sp"></span><b style="font:500 18px var(--serif);color:${v>=0?'var(--green)':'var(--red)'}">${v>=0?'+':'−'}${brl2(Math.abs(v))}</b></div>`}).join('')}
        <div class="sm mut">Positivo: cedeu mais do que recebeu.</div></div>
    </div>
  </div>`;
}
/* openTransfer aceita o id do item ('cim','paraf','prego') ou o índice antigo. */
function acharTransf(k){ recalcTransf(); return typeof k==='number' ? TRANSF[k] : TRANSF.find(t=>t.inv===k); }
function openTransfer(k){
  closeDrawer();
  const t=acharTransf(k);
  if(!t||t.sug<=0){ const h=TRF_HIST.find(x=>x.inv===(t?t.inv:k)&&x.st!=='Recebida');
    return toast(h?`${h.item}: ${h.id} já pedida · ${h.st.toLowerCase()}`:'Nenhuma transferência sugerida para este item agora'); }
  const w=x=>x/t.saldo*100;
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('swap',20)}Transferir entre obras</h2>
    <div class="mut sm">${NOME_OBRA[t.origem]} → <b style="color:var(--ink)">${NOME_OBRA[t.destino]}</b> · ${t.item}</div>
    <div class="card agentnote inline" style="margin:18px 0;font-size:13px;padding:14px 16px">${icon('spark',15)}<div>${t.pq}</div></div>
    <b class="sm">Quanto pode sair sem prejudicar a ${NOME_OBRA[t.origem]}</b>
    <div class="split" style="height:20px;margin:10px 0;border-radius:6px"><div style="width:${w(t.usar)}%;background:#a8a497" title="ainda vai usar"></div><div style="width:${w(t.reserva)}%;background:#d6d2c5" title="reserva"></div><div style="width:${w(t.max)}%;background:var(--green)" title="pode sair"></div></div>
    <div class="legend"><span><i style="background:#a8a497"></i>ainda vai usar: ${num(t.usar)}</span><span><i style="background:#d6d2c5"></i>reserva: ${num(t.reserva)}</span><span><i style="background:var(--green)"></i>pode sair: <b>${num(t.max)}</b> de ${num(t.saldo)} ${t.un}</span></div>
    <div class="grid g2" style="margin-top:6px;gap:0 14px">
      <div><label class="l">Quantidade (máx. ${num(t.max)})</label><input class="f" id="tq" type="number" min="1" max="${t.max}" value="${t.sug}" oninput="trfCalc('${t.inv}')"></div>
      <div><label class="l">Transporte</label><select class="f"><option>Caminhão da construtora (hoje, 15h)</option><option>Equipe da obra destino retira</option><option>Frete terceirizado</option></select></div>
    </div>
    <div id="tcalc"></div>
    <div class="sm mut" style="margin-top:12px">Preço de custo do lote original: <b>${t.lote}</b>. Precisa do OK de <b>${t.resp}</b>; o pedido fica pendente até lá.</div>
    <div class="callout val" style="margin:16px 0 0">${icon('flask')}<div><b>Validar:</b> a reserva de "metade do que ainda vai usar" é conservadora o bastante? Ele quer ajustar por item (cimento ≠ parafuso)?</div></div>
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="confirmTransfer('${t.inv}')">Pedir transferência</button></div>`;
  $('modal').classList.add('on'); trfCalc(t.inv);
}
function trfQtd(t){ return Math.min(t.max, Math.max(0, Math.round(+$('tq').value||0))); }
function trfCalc(k){
  const t=acharTransf(k); if(!t) return;
  const q=trfQtd(t), resto=Math.max(0,t.falta-q);
  $('tcalc').innerHTML = `<table class="sm" style="margin-top:16px">
    <tr><th></th><th class="num">Transferir</th><th class="num">Comprar novo</th></tr>
    <tr><td>Preço por ${t.un}</td><td class="num">${brl2(t.custo)}</td><td class="num">${brl2(t.novo)} <span class="mut">(${t.novoForn})</span></td></tr>
    <tr><td>Total de ${num(q)} ${t.un}</td><td class="num"><b>${brl2(q*t.custo)}</b></td><td class="num">${brl2(q*t.novo)}</td></tr>
    <tr><td>Chega em</td><td class="num"><b>hoje</b></td><td class="num">${t.novoPrazo}</td></tr>
    <tr><td>No orçamento</td><td class="num" colspan="2"><span style="color:var(--red)">${NOME_OBRA[t.destino]} −${brl2(q*t.custo)}</span> · <span style="color:var(--green)">${NOME_OBRA[t.origem]} +${brl2(q*t.custo)}</span></td></tr>
    </table>${resto>0?`<div class="sm" style="margin-top:8px">Ainda faltam <b>${num(resto)} ${t.un}</b> na ${NOME_OBRA[t.destino]}${(()=>{const c=emCotacao(t.destino,t.inv); return c?`: já estão no ${c.id} (em cotação).`:': o agente inclui no próximo pedido de compra.';})()}</div>`:''}`;
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

/* Mapa de fluxos */
function renderFluxos(){
  const F=[
    ['1. Criar obra e orçar','Obras → + Nova obra → anexar projeto → descrever → orçamento, prazo e fases → agente levanta insumos e cota na região → Visão geral: "o orçamento é realista?" + economias',"openWizard(1)"],
    ['2. Do orçamento ao pedido de compra','Insumos e compras → falta comprar (precisa − saldo − a caminho) → comparar fornecedores → pedido de compra → cartão em Pedidos',"go('obra','vila-nova','componentes')"],
    ['3. Acompanhar os pedidos','Pedidos: Em cotação → Aprovado → Pedido enviado → Em trânsito → Recebido → Conferir NF · atraso marcado e alimentando Prazos',"go('obra','vila-nova','kanban')"],
    ['4. Almoxarifado (entra, sai, para onde)','Recebido e conferido vira entrada → baixa com destino nos itens curva A (bloco: 1.050 assentados, 190 quebrados) → contagem semanal na curva C → a caminho e falta por item',"go('obra','vila-nova','inventario')"],
    ['5. Equipe','Empreitadas e administração própria · efetivo do dia · vagas abertas e impacto no prazo',"go('obra','vila-nova','equipe')"],
    ['6. Prazos e riscos','Gantt planejado × real → previsão do agente → atraso por causa (fornecedor +9, equipe +8, clima +4) → plano: atraso cai de 21 para 6 dias → o estoque aguenta?',"go('obra','vila-nova','prazos')"],
    ['7. Estoque entre obras','Agente cruza o que sobra numa obra com o que falta em outra → máximo que pode sair = saldo − o que ainda usa − reserva → transferir a preço de custo → OK do responsável da origem → entra em Pedidos como transferência → acerto no orçamento das duas',"go('estoque')"],
    ['8. Tudo pelo chat','Início (todas as obras) ou chat da obra (sessões separadas): perguntar, receber resposta com dados + botão de ação (aprovar pedido, remarcar concretagem, transferir)',"go('home')"],
  ];
  return `<div class="top"><h1>Mapa de fluxos</h1></div><div class="page"><div class="grid g2">${F.map(f=>`<div class="card wscard" onclick="${f[2]}"><h3>${f[0]}</h3><div class="mut" style="line-height:1.6">${f[1]}</div><div class="link" style="margin-top:12px">abrir no protótipo ${icon('arrowRight',14)}</div></div>`).join('')}</div></div>`;
}

/* ===================== RENDER ===================== */
/* Telas de topo. Feature nova: VIEWS.chave = () => html (e, se quiser, NAV_EXTRA.push({view,icon,label,count})). */
const VIEWS = {home:()=>renderHome(), hub:()=>renderHub(), estoque:()=>renderEstoque(), fluxos:()=>renderFluxos(), obra:()=>obra()?renderObra():renderHome()};
const NAV_EXTRA = [];
function addCSS(css){ const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); }
function render(){
  renderSide();
  const m=$('main');
  m.innerHTML=(VIEWS[state.view]||VIEWS.home)();
  m.scrollTop=0;
  document.dispatchEvent(new Event('rendered'));
}
