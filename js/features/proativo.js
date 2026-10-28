/* Agente proativo: briefing da Home, fila de aprovações, proposta/desfazer/registro, pedido de compra.
   Regra: o agente nunca faz sozinho. Tudo vira proposta → Rizzi aprova → registrar() + toastDesfazer(). */

const hora = () => new Date().toTimeString().slice(0,5);
const tabDe = (...ks) => ks.find(k=>TAB_FNS[k]) || ks[0];          // aba pode ter sido renomeada por outro dono
const colDe = (re, fb) => { const i=KCOLS.findIndex(c=>re.test(c)); return i<0?fb:i; };
function lote(id){ return LOTES.find(l=>l.id===id); }
function proxPed(){ const n=Math.max(0,...LOTES.map(l=>+(/^PED-(\d+)/.exec(l.id)||[0,0])[1])); return 'PED-'+String(n+1).padStart(4,'0'); }
function tirarLote(l){ const i=LOTES.indexOf(l); if(i>=0) LOTES.splice(i,1); }
/* Usa o cartão que o agente já sugeriu em Pedidos (ex.: PED-0167 do aço); se não houver, cria. Devolve o desfazer. */
function enviarLote(acha, novo){
  const col=colDe(/Pedido (enviado|feito)/i,2), eta='enviado por WhatsApp '+hora()+' · '+novo.chega;
  const l=LOTES.find(x=>acha(x)&&x.col<col);
  if(l){ const o={col:l.col,eta:l.eta}; l.col=col; l.eta=eta; return ()=>Object.assign(l,o); }
  const n={id:proxPed(), item:novo.item, q:novo.q, forn:novo.forn, v:novo.v, eta, col, ai:true, inv:novo.inv}; LOTES.push(n); return ()=>tirarLote(n);
}
function trocarEta(id, eta){ const l=lote(id); if(!l) return ()=>{}; const old=l.eta; l.eta=eta; return ()=>{ l.eta=old; }; }

/* ===================== PROPOSTAS DO AGENTE (todas as obras) =====================
   fazer() aplica e devolve a função que desfaz. brief:true entra no briefing da Home. */
const PROPOSTAS = [
  {id:'concreto', obra:'vila-nova', brief:true, ic:'clock', tom:'warn', tag:'clima',
   tit:'Remarcar a concretagem da laje para sex 06/11, 07h',
   det:'Previsão de <b>80% de chuva na quinta 05/11</b>. Laje do 2º pav.: 38 m³ de usinado fck 25 MPa + bomba lança na Concrecamp (R$ 485/m³). A Concrecamp tem vaga na sexta, mesmo preço.',
   feito:'Concretagem remarcada para sex 06/11, 07h',
   registro:'Concretagem da laje do 2º pav. remarcada de qui 05/11 para sex 06/11 07h · Concrecamp · 38 m³ + bomba',
   fazer(){ return trocarEta('PED-0166','remarcada: sex 06/11 · 07h'); },
   ajustar(){ ajustarModal(this, 'Nova data da concretagem', [['Data','sel',['sex 06/11 · 07h (Concrecamp tem vaga)','seg 09/11 · 07h','manter qui 05/11 · 07h (risco de chuva)']],['Concreteira','sel',['Concrecamp · R$ 485/m³','Supermix · R$ 498/m³','Polimix · R$ 512/m³']]]); },
   ver(){ go('obra','vila-nova','prazos'); }},
  {id:'aco', obra:'vila-nova', brief:true, ic:'truck', tom:'bad', tag:'fornecedor',
   tit:'Plano B do aço: 600 kg na Aço Forte (chega em 2 dias)',
   det:'PED-0158 da Gerdau (3.200 kg, cortado e dobrado) está <b>9 dias atrasado e sem data</b>. Precisa 3.940 kg até o fim, tem 140, a caminho 3.200 (PED-0158, atrasado) → <b>faltam 600 kg</b>. Peço na Aço Forte, que entrega em 2 dias; o saldo de 140 kg só dá até ~30/10.',
   feito:'Pedido de 600 kg de aço enviado à Aço Forte',
   registro:'Pedido de compra · 600 kg de aço CA-50 cortado e dobrado · Aço Forte Comercial · R$ 5.040 (acima de R$ 5.000)',
   fazer(){ return enviarLote(l=>(l.inv==='aco'||/aço|vergalh/i.test(l.item))&&/Aço Forte/i.test(l.forn), {inv:'aco', item:'Aço CA-50 cortado e dobrado', q:'600 kg', forn:'Aço Forte Comercial', v:5040, chega:'chega 30/10'}); },
   ajustar(){ openCheckout(['aco']); },
   ver(){ go('obra','vila-nova',tabDe('pedidos','kanban')); }},
  {id:'areia', obra:'vila-nova', brief:true, ic:'ruler', tom:'warn', tag:'recebimento',
   tit:'Areia PED-0157: abater R$ 472 do boleto',
   det:'A NF diz <b>40 m³</b>; a Joana mediu <b>36 m³</b> na caçamba. Divergência de 4 m³ × R$ 118 = <b>R$ 472</b>. Aviso o Porto Jaguari e abato do boleto.',
   feito:'Divergência da areia registrada · R$ 472 abatidos do boleto',
   registro:'PED-0157 · areia: NF 40 m³, recebidos 36 m³ · R$ 472 abatidos do boleto · Porto Jaguari avisado',
   fazer(){ return trocarEta('PED-0157','conferido · −4 m³ · R$ 472 abatidos'); },
   ajustar(){ if(typeof openConferencia==='function') openConferencia('PED-0157'); else toast('(protótipo) conferência do recebimento ainda não ligada'); },
   ver(){ if(typeof openConferencia==='function') openConferencia('PED-0157'); else go('obra','vila-nova',tabDe('pedidos','kanban')); }},
  {id:'bloco', obra:'vila-nova', brief:true, ic:'bricks', tom:'bad', tag:'perda',
   tit:'Bloco quebrando 15%: exigir palete no PED-0162',
   det:'Dos 4.000 blocos do PED-0149 (descarregados <b>sem palete</b>), saíram 1.240: 1.050 assentados e <b>190 quebrados</b>. Quebra de 15% contra 5% previsto. O PED-0162 (9.000 un, Cerâmica Itu) sai 31/10: peço descarga em palete.',
   feito:'Cerâmica Itu avisada: PED-0162 com descarga em palete',
   registro:'PED-0162 · 9.000 blocos · exigida descarga em palete (quebra de 15% no PED-0149)',
   fazer(){ return trocarEta('PED-0162','saída 31/10 · descarga em palete'); },
   ajustar(){ ajustarModal(this, 'Mensagem para a Cerâmica Itu', [['Mensagem','txt','Bom dia! No PED-0162 (9.000 blocos 14×19×29, saída 31/10) precisamos da descarga em palete. No último lote, sem palete, perdemos 190 blocos (15%). Confirma? Obrigado, Rizzi · Construtora RZ']]); },
   ver(){ go('obra','vila-nova',tabDe('almoxarifado','inventario')); }},
  {id:'medicao', obra:'vila-nova', brief:true, ic:'users', tom:'warn', tag:'mão de obra',
   tit:'Equipe Silva: R$ 7.540 pagos acima do executado',
   det:'Estrutura (R$ 58.000): <b>executado 62%</b>, <b>pago 75%</b> (R$ 43.500). Proponho reter R$ 7.540 na próxima medição até o serviço alcançar o pago.',
   feito:'R$ 7.540 retidos na próxima medição da Equipe Silva',
   registro:'Medição da Equipe Silva · estrutura: retenção de R$ 7.540 na próxima (executado 62% × pago 75%)',
   fazer(){ return ()=>{}; },
   ajustar(){ ajustarModal(this, 'Retenção na próxima medição', [['Reter (R$)','num','7540'],['Avisar','sel',['Equipe Silva por WhatsApp','Só registrar, aviso pessoalmente']]]); },
   ver(){ go('obra','vila-nova','medicoes'); }},
  {id:'cimento', obra:'vila-nova', brief:true, ic:'swap', tom:'info', tag:'estoque',
   tit:'Cimento: trazer 20 sc da Loja Centro e comprar 14',
   det:'Precisa 200 − saldo 46 − a caminho 120 (PED-0160, chega 30/10) = <b>falta 34 sc</b>. A Loja Centro tem 26 sc que <b>vencem em 25 dias</b> e só usa 4: trago 20 a preço de custo e compro 14 no Depósito São Bento.',
   feito:'20 sc vindo da Loja Centro + 14 sc pedidos',
   registro:'Cimento · transferência de 20 sc da Loja Centro (R$ 35,50/sc) + pedido de 14 sc no Depósito São Bento',
   fazer(){
     const k=TRANSF.findIndex(t=>t.inv==='cim'), t=k>=0?TRANSF.splice(k,1)[0]:null;
     const a={id:'TRF-'+String(TRF_HIST.length+5).padStart(4,'0'), inv:'cim', item:'Cimento CP-II 50 kg', q:'20 sc', forn:'de Reforma Loja Centro', v:710, eta:'aguardando OK da Ana P. · chega hoje', col:colDe(/Pedido (enviado|feito)/i,2), trf:true};
     LOTES.push(a);
     const b=enviarLote(l=>(l.inv==='cim'||/cimento/i.test(l.item))&&l.ai&&!l.trf, {inv:'cim', item:'Cimento CP-II 50 kg', q:'14 sc', forn:'Depósito São Bento', v:517, chega:'chega 30/10'});
     return ()=>{ tirarLote(a); b(); if(t) TRANSF.splice(k,0,t); };
   },
   ajustar(){ if(typeof openTransfer==='function') openTransfer('cim'); },
   ver(){ go('estoque'); }},
  {id:'porcelanato', obra:'loja-centro', ic:'archive', tom:'info', tag:'sobra',
   tit:'Loja Centro: guardar 18 m² de porcelanato como reposição',
   det:'Sobram 18 m² de porcelanato 60×60 do mesmo lote. A obra entrega em 09/12; deixo identificado no almoxarifado para reposição na garantia, em vez de devolver.',
   feito:'18 m² de porcelanato reservados para reposição',
   registro:'Porcelanato 60×60 · 18 m² reservados para reposição na garantia',
   fazer(){ return ()=>{}; },
   ajustar(){ ajustarModal(this, 'Sobra de porcelanato', [['Destino','sel',['Guardar para reposição (garantia)','Devolver ao fornecedor','Oferecer à Casa Vila Nova']]]); },
   ver(){ go('obra','loja-centro',tabDe('almoxarifado','inventario')); }},
];
/* Propostas que nascem da conversa de prazo ("Transformar em propostas"). */
const PROPOSTAS_PRAZO = [
  {id:'armadores', obra:'vila-nova', ic:'users', tom:'bad', tag:'equipe',
   tit:'Contratar 2 armadores por empreitada até o fim da estrutura',
   det:'Vaga aberta desde 01/10 na Equipe Silva. Recupera ~5 dias do atraso.',
   feito:'Vaga de 2 armadores divulgada', registro:'Equipe · 2 armadores por empreitada até o fim da estrutura (−5 dias)',
   fazer(){ return ()=>{}; }, ajustar(){ ajustarModal(this,'Contratação de armadores',[['Quantos','num','2'],['Modelo','sel',['Empreitada até o fim da estrutura','Diária']]]); }, ver(){ go('obra','vila-nova','equipe'); }},
  {id:'telhas', obra:'vila-nova', ic:'package', tom:'info', tag:'prazo',
   tit:'Adiantar a compra das telhas (Tatuí, 10 dias de prazo)',
   det:'PED-0163 está aguardando aprovação; comprar agora em vez da semana 39 recupera ~4 dias.',
   feito:'PED-0163 das telhas aprovado', registro:'PED-0163 · telha portuguesa · compra adiantada (−4 dias)',
   fazer(){ return enviarLote(l=>l.id==='PED-0163', {inv:'telha', item:'Telha portuguesa', q:'3.900 un', forn:'Telhas Tatuí', v:9165, chega:'chega em 10 dias'}); },
   ajustar(){ openCheckout(['telha']); }, ver(){ go('obra','vila-nova',tabDe('pedidos','kanban')); }},
];
PROPOSTAS.forEach(p=>p.st='pendente');
const pendentes = obraId => PROPOSTAS.filter(p=>p.st==='pendente'&&(!obraId||p.obra===obraId));
function prop(id){ return PROPOSTAS.find(p=>p.id===id); }

function aprovarProp(id, btn){
  const p=prop(id); if(!p||p.st!=='pendente') return;
  const vai=()=>{
    closeModal();
    const undo=p.fazer(); p.st='aprovada'; p.quando=hora();
    registrar(`${p.registro} · sugerido pelo agente · aprovado por Rizzi ${p.quando}`, {obra:p.obra, origem:'agente'});
    const e=LOG[0];
    e.desfazer=()=>{ undo&&undo(); p.st='pendente'; e.desfeito=true; };
    render();
    toastDesfazer(p.feito, e.desfazer);
  };
  const el=btn&&btn.closest('.bi'); if(el){ el.classList.add('saindo'); setTimeout(vai,220); } else vai();
}
function recusarProp(id){ const p=prop(id); p.st='recusada';
  registrar(`Recusou: ${p.tit} · sugerido pelo agente`, {obra:p.obra, origem:'agente'});
  const e=LOG[0]; e.desfazer=()=>{ p.st='pendente'; e.desfeito=true; };
  render(); toastDesfazer('Proposta recusada', e.desfazer); }
function desfazerLog(i){ const e=LOG[i]; if(!e||!e.desfazer||e.desfeito) return; e.desfazer(); registrar('Desfez: '+e.texto.split(' · sugerido')[0], {obra:e.obra}); render(); toast('Desfeito'); }

/* Ajustar genérico: o gerente mexe no que o agente propôs e aprova a versão ajustada. */
function ajustarModal(p, titulo, campos){
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon(p.ic,20)} ${titulo}</h2>
    <div class="mut sm">${NOME_OBRA[p.obra]} · ${icon('spark',13)} sugerido pelo agente</div>
    <div class="card agentnote inline" style="margin:16px 0 4px;font-size:13px;padding:14px 16px">${icon('spark',15)}<div>${p.det}</div></div>
    ${campos.map(([l,t,v])=>`<label class="l">${l}</label>${t==='sel'?`<select class="f">${v.map(o=>`<option>${o}</option>`).join('')}</select>`:t==='txt'?`<textarea class="f" rows="4" style="resize:vertical">${v}</textarea>`:`<input class="f" value="${v}">`}`).join('')}
    <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="aprovarProp('${p.id}')">${icon('check',15)}Aprovar ajustado</button></div>`;
  $('modal').classList.add('on');
}

/* Um item da fila (briefing e aprovações usam o mesmo). */
function itemProp(p, comObra, recusa){
  const cor={bad:'var(--red)',warn:'var(--amber)',info:'var(--blue)'}[p.tom]||'var(--muted)';
  return `<div class="bi">
    <div class="bic" style="color:${cor}">${icon(p.ic,18)}</div>
    <div class="bit"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${p.tit}</b>${comObra?`<span class="pill gray">${NOME_OBRA[p.obra]}</span>`:''}</div>
      <div class="sm" style="color:var(--ink2);margin-top:3px">${p.det}</div>
      <div class="sug">${icon('spark',12)}sugerido pelo agente · ${p.tag} · aguardando você</div>
      <div class="row" style="gap:6px;margin-top:10px">
        <button class="btn amb sm" onclick="aprovarProp('${p.id}',this)">${icon('check',14)}Aprovar</button>
        <button class="btn sm" onclick="prop('${p.id}').ajustar()">Ajustar</button>
        <button class="btn sm" onclick="prop('${p.id}').ver()">Ver</button>
        ${recusa?`<span class="sp"></span><button class="btn sm" style="color:var(--muted)" onclick="recusarProp('${p.id}')">Recusar</button>`:''}
      </div></div></div>`;
}

/* ===================== HOME: BRIEFING + CHAT ===================== */
renderHome = function(){
  const fila = PROPOSTAS.filter(p=>p.brief&&p.st==='pendente');
  const feitos = PROPOSTAS.filter(p=>p.brief&&p.st==='aprovada');
  const n = fila.length;
  return `
  <div class="chat" style="height:100vh">
    <div class="top"><h1>Bom dia, Rizzi</h1><span class="crumb">quarta, 28/10 · ${n?`${n} ${n>1?'coisas pedem':'coisa pede'} você hoje`:'nada pendente'}</span><span class="sp"></span>
      <button class="btn" onclick="go('aprovacoes')">${icon('checkCircle',15)}Aprovações e registro</button><button class="btn" onclick="go('hub')">Ver todas as obras</button></div>
    <div class="msgs">
      ${val('O gerente quer começar o dia por uma fila de decisões prontas (aprovar / ajustar), em vez de perguntar? Quantas cabem antes de virar ruído?')}
      ${aiMsg(['3 obras','14 pedidos','WhatsApp da Joana','previsão do tempo','medições'], `
        <div class="brief-h"><b>Bom dia, Rizzi. ${n?`${n} ${n>1?'coisas pedem':'coisa pede'} você hoje.`:'Tudo aprovado por hoje.'}</b>
        <span class="mut sm">Já deixei cada uma pronta. Nada é feito sem o seu OK, e tudo fica no registro com "Desfazer".</span></div>
        ${n?`<div class="bl">${fila.map(p=>itemProp(p)).join('')}</div>`:`<div class="note"><span style="color:var(--green)">${icon('checkCircle',15)}</span><span>Fila vazia. O próximo briefing sai amanhã às 7h; se algo urgente chegar pelo WhatsApp, aviso antes.</span></div>`}
        ${feitos.length?`<div class="sm mut" style="margin-top:10px">${icon('check',13)} Aprovado hoje: ${feitos.map(p=>`${p.feito} <span class="mut">(${p.quando})</span>`).join(' · ')} · <a class="link" href="#aprovacoes" onclick="go('aprovacoes');return false">ver registro</a></div>`:''}
        <div class="sm mut" style="margin-top:12px">Também: <b>Reforma Loja Centro</b> 6 dias adiantada e R$ 5.800 abaixo do orçamento. <b>Galpão Sumaré</b> em orçamento, esperando 2 respostas suas.</div>`)}
      ${meMsg('comprei 4.000 blocos, por que já saíram 1.240 se a alvenaria está em 6%?')}
      ${aiMsg(['almoxarifado · Casa Vila Nova','movimentações do bloco 14×19×29','RDO e áudios da Joana'], `Os <b>4.000 blocos</b> entraram em 20/10 (PED-0149, Cerâmica Itu), descarregados <b>sem palete</b>. As 1.240 saídas foram:
        <table><tr><th>Destino</th><th class="num">Qtd</th><th class="num">% das saídas</th></tr>
        <tr><td>Alvenaria do térreo · eixos A–C (assentados)</td><td class="num">1.050</td><td class="num">85%</td></tr>
        <tr><td>Quebra (descarga, transporte e corte)</td><td class="num">190</td><td class="num">15%</td></tr>
        <tr><td><b>Saldo no almoxarifado</b></td><td class="num"><b>2.760</b></td><td></td></tr></table>
        Os 1.050 assentados batem com os 6% da alvenaria. O que não bate é a <b>quebra: 15% contra 5% previsto</b>. Só hoje a Joana mandou áudio: "uns 15 quebraram" em 180.
        <div class="note"><span style="color:var(--amber)">${icon('bulb',15)}</span><span><b>Próximo lote:</b> o PED-0162 (9.000 blocos) sai 31/10. Com descarga em palete, a quebra de 15% para 5% evita perder ~900 blocos (≈ R$ 1.460).</span></div>
        <div class="row" style="margin-top:12px">${prop('bloco').st==='pendente'?`<button class="btn amb" onclick="aprovarProp('bloco')">${icon('check',15)}Exigir palete no PED-0162</button>`:`<span class="pill ok">${icon('check',12)}palete exigido no PED-0162</span>`}<button class="btn" onclick="go('obra','vila-nova','${tabDe('almoxarifado','inventario')}')">Ver movimentações</button></div>`)}
      ${meMsg('quanto tempo para acabar a Vila Nova? estamos no prazo?')}
      ${aiMsg(['cronograma','pedidos em trânsito','equipe alocada','previsão do tempo'], `Pelo ritmo atual (estrutura a 62%), a entrega fica para <b>21/07/2027</b>, <b>21 dias</b> depois do prazo (30/06/2027).<br><br>
        <b>Por que atrasa</b><br>• Fornecedor: aço da Gerdau (PED-0158) 9 dias atrasado → <b>+9 dias</b><br>• Equipe: 2 armadores faltando desde 01/10 → <b>+8 dias</b><br>• Clima: chuvas de outubro → <b>+4 dias</b><br><br>
        <b>O que eu faria (recupera ~15 dias: o atraso cai de 21 para 6 dias)</b><br>
        1. 600 kg de aço na Aço Forte, em 2 dias, sem esperar a Gerdau. <span class="pill ok">−6 dias</span><br>
        2. Contratar os 2 armadores por empreitada até o fim da estrutura. <span class="pill ok">−5 dias</span><br>
        3. Adiantar a compra das telhas de Tatuí (10 dias de prazo). <span class="pill ok">−4 dias</span><br>
        E remarcar a concretagem para sexta, para a chuva de quinta não somar mais atraso.
        <div class="row" style="margin-top:12px"><button class="btn amb" onclick="viraPropostas()">${icon('list',15)}Transformar em propostas</button><button class="btn" onclick="go('obra','vila-nova','prazos')">Abrir Prazos</button></div>`)}
    </div>
    <div class="chips">
      ${['Qual obra está mais acima do orçamento?','O que chega amanhã nas obras?','Quem está em campo hoje na Vila Nova?','Quanto já paguei à Equipe Silva?','O que sobra numa obra e falta em outra?'].map(c=>`<button class="chip" onclick="toast('(protótipo) o agente responderia aqui')">${c}</button>`).join('')}
    </div>
    <div class="composer">
      <div><span class="attach">${icon('building',13)}Contexto: todas as obras ${icon('chevDown',13)}</span></div>
      <textarea placeholder="Pergunte sobre qualquer obra, ou peça: 'pede cotação de 5.000 blocos'…"></textarea>
      <div class="row"><button class="btn sm" onclick="toast('(protótipo) anexar projeto, NF ou foto')">${icon('clip',14)}Anexar projeto / NF / foto</button><span class="sp"></span><button class="btn amb" onclick="toast('(protótipo) enviar')">Enviar ${icon('arrowUp',15)}</button></div>
    </div>
  </div>`;
};
function viraPropostas(){
  const novas=PROPOSTAS_PRAZO.filter(p=>!prop(p.id));
  novas.forEach(p=>{ p.st='pendente'; PROPOSTAS.push(p); });
  toast(novas.length?`${novas.length} propostas novas na fila (aço e concretagem já estavam)`:'Essas propostas já estão na fila');
  setTimeout(()=>go('aprovacoes'),500);
}

/* ===================== VIEW: APROVAÇÕES + REGISTRO ===================== */
const COTACOES = [
  {id:'COT-0011', obra:'vila-nova', item:'Bloco cerâmico 14×19×29', q:5690, un:'un', enviada:'hoje 08:10', fecha:'amanhã 10h',
   resp:[{n:'Cerâmica Itu Direto',p:1.62,prazo:'7 dias',obs:'palete incluso',h:'09:02'},{n:'Olaria Sumaré',p:1.74,prazo:'4 dias',obs:'frete à parte',h:'10:40'},{n:'Depósito São Bento',p:1.89,prazo:'2 dias',obs:'palete incluso',h:'11:15'}],
   pend:['Cerâmica Porto Feliz','Tijolar Hortolândia']},
];
const ORIGEM_IC = {agente:'spark', WhatsApp:'message', tela:'list'};
VIEWS.aprovacoes = () => {
  const fila=pendentes();
  const porObra=OBRAS.map(o=>[o,fila.filter(p=>p.obra===o.id)]).filter(([,ps])=>ps.length);
  return `<div class="top"><h1>Aprovações</h1><span class="crumb">${fila.length} propostas do agente · ${porObra.length} ${porObra.length===1?'obra':'obras'} · tudo o que foi feito fica no registro</span></div>
  <div class="page">
    ${val('Quem mais aprova além do Rizzi? A Joana (mestre) aprova compras até R$ 5.000 sozinha? O cliente de obra por administração aprova pelo WhatsApp?')}
    <div class="sectit" style="margin-bottom:12px">Fila de propostas</div>
    ${porObra.length?porObra.map(([o,ps])=>`<div class="card" style="padding:6px 20px 10px;margin-bottom:14px"><div class="row" style="padding:12px 0 4px"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${o.cor}"></span><b>${o.nome}</b><span class="mut sm">${ps.length} ${ps.length>1?'propostas':'proposta'}</span></div>
      <div class="bl">${ps.map(p=>itemProp(p,false,true)).join('')}</div></div>`).join('')
      :`<div class="card row" style="color:var(--green)">${icon('checkCircle',18)}<span style="color:var(--ink)">Nenhuma proposta esperando você.</span></div>`}
    <div class="sectit" style="margin:26px 0 12px">Cotações em andamento <span class="mut sm" style="font-weight:400">· fornecedor responde em horas, não na hora</span></div>
    ${COTACOES.map(c=>`<div class="card" style="margin-bottom:14px"><div class="row" style="flex-wrap:wrap"><b>${c.id} · ${c.item} · ${c.q.toLocaleString('pt-BR')} ${c.un}</b><span class="pill info">${icon('hourglass',12)}enviada a ${c.resp.length+c.pend.length} · ${c.resp.length} responderam · fecha ${c.fecha}</span><span class="sp"></span><span class="mut sm">${NOME_OBRA[c.obra]} · enviada ${c.enviada}</span></div>
      ${c.resp.length?`<table class="sm" style="margin-top:12px"><tr><th>Fornecedor</th><th class="num">Preço un.</th><th class="num">Total</th><th>Prazo</th><th>Obs.</th><th>Respondeu</th><th></th></tr>
      ${[...c.resp].sort((a,b)=>a.p-b.p).map((r,i)=>`<tr><td>${r.n}${i===0?' <span class="pill ok">melhor</span>':''}</td><td class="num">${brl2(r.p)}</td><td class="num">${brl(r.p*c.q)}</td><td>${r.prazo}</td><td class="mut">${r.obs}</td><td class="mut">${r.h}</td><td><button class="btn sm" onclick="openCheckout(['${c.item.startsWith('Bloco')?'bloco':'cim'}'],{forn:'${r.n}', q:${c.q}})">Fechar com este</button></td></tr>`).join('')}
      ${c.pend.map(n=>`<tr><td class="mut">${n}</td><td colspan="6" class="mut">${icon('clock',12)} aguardando resposta</td></tr>`).join('')}</table>`:`<div class="mut sm" style="margin-top:10px">${icon('clock',13)} Nenhuma resposta ainda. Normalmente as primeiras chegam em 1–3 horas; aviso quando fechar (${c.fecha}).</div>`}
    </div>`).join('')}
    <div class="sectit" style="margin:26px 0 12px">Registro <span class="mut sm" style="font-weight:400">· quem fez, quando e de onde veio</span></div>
    <div class="card" style="padding:0"><table class="sm">
      <tr><th style="width:110px">Quando</th><th>Obra</th><th>O que foi feito</th><th>Quem</th><th>Origem</th><th></th></tr>
      ${LOG.map((e,i)=>`<tr style="${e.desfeito?'opacity:.5':''}"><td class="mut">${e.quando}</td><td>${NOME_OBRA[e.obra]||e.obra}</td><td>${e.desfeito?'<s>':''}${e.texto}${e.desfeito?'</s>':''}</td><td>${e.quem}</td>
        <td><span class="pill ${e.origem==='agente'?'warn':e.origem==='WhatsApp'?'ok':'gray'}">${icon(ORIGEM_IC[e.origem]||'list',12)}${e.origem==='agente'?'agente':e.origem}</span></td>
        <td>${e.desfazer&&!e.desfeito?`<button class="btn sm" onclick="desfazerLog(${i})">Desfazer</button>`:''}</td></tr>`).join('')}
    </table></div>
  </div>`;
};
NAV_EXTRA.push({view:'aprovacoes', icon:'checkCircle', label:'Aprovações', count:()=>pendentes().length});

/* ===================== PEDIDO DE COMPRA ===================== */
/* falta = precisa − saldo − a caminho (nunca compra o que já está pedido). trf = o que vem de outra obra. */
const NEC = {
  cim:{un:'sc', precisa:200, saldo:46, caminho:120, trf:20, conta:'a caminho: PED-0160 (120 sc, chega 30/10) · 20 sc vêm da Loja Centro'},
  paraf:{precisa:480, saldo:100, caminho:0, trf:300, conta:'curva C · 300 vêm da Loja Centro'},
};
/* Demais insumos: lê do almoxarifado (contrato do Dev Credibilidade: insumo, aCaminho, dados). */
function necDados(obraId, id, c){
  const d=typeof dados==='function'?dados(obraId):null;
  const i=(d&&d.inv||INV).find(x=>x.id===id);
  if(!i) return NEC_FB[id]||{precisa:c.qtd||0, saldo:0, caminho:0};
  const caminho=typeof aCaminho==='function'?aCaminho(obraId,id):0;
  return {precisa:i.nec, saldo:i.ent-i.sai, caminho, un:i.un, conta:caminho?'a caminho: '+LOTES.filter(l=>l.inv===id&&l.col<colDe(/receb|entregue/i,4)&&l.col>=colDe(/aprovad/i,1)).map(l=>l.id+(l.late?' atrasado':'')).join(', '):''};
}
/* Fornecedor padrão quando o mais barato não serve (Gerdau está com o PED-0158 atrasado). Preços vêm de COMP. */
const FORN_PADRAO = {aco:'Aço Forte Comercial'};
const NEC_FB = {bloco:{precisa:17450, saldo:2760, caminho:9000, conta:'precisa = 18.500 do projeto − 1.050 já assentados · a caminho: PED-0162'}};
const ALCADA = 5000;
const REGIME = {'vila-nova':'Empreitada (preço fechado)', 'loja-centro':'Administração'};
let CK = null;

openCheckout = function(ids, o={}){
  closeDrawer();
  const ob = OBRAS.find(x=>x.id===(o.obra||state.obra))||OBRAS[0];
  const CK0=ob.id;
  CK = {obra:ob.id, quem:'Rizzi', regime:ob.regime||REGIME[ob.id]||'Empreitada (preço fechado)', itens:ids.map(id=>{
    const c=(typeof dados==='function'&&dados(CK0).comp||[]).find(x=>x.id===id)||(typeof insumo==='function'&&insumo(id))||COMP.find(x=>x.id===id)||{}, n=NEC[id]||necDados(CK0, id, c);
    const forn=n.forn||c.forn||[{n:'Fornecedor',p:0,prazo:'—'}];
    const escolhido=o.forn||FORN_PADRAO[id]||(forn.reduce((a,b)=>a.p<b.p?a:b)).n;
    const falta=Math.max(0,n.precisa-n.saldo-n.caminho), q=o.q??Math.max(0,falta-(n.trf||0));
    return {id, nome:n.nome||c.nome||id, un:n.un||c.un||'un', forn, fi:Math.max(0,forn.findIndex(f=>f.n===escolhido)), q, n, falta};
  })};
  ckTela();
};
function ckTot(){ return CK.itens.reduce((a,x)=>a+x.forn[x.fi].p*x.q,0); }
function ckTela(){
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('cart',20)}Pedido de compra</h2><div class="mut sm">${NOME_OBRA[CK.obra]} · um pedido por fornecedor · ${icon('spark',12)} quantidades sugeridas pelo agente</div>
    <table style="margin:16px 0 6px"><tr><th>Insumo</th><th>Fornecedor</th><th class="num">Qtd</th><th class="num">Total</th></tr>
    ${CK.itens.map((x,i)=>`<tr><td style="border-bottom:0"><b>${x.nome}</b></td>
      <td style="border-bottom:0"><select class="f" style="margin:0;min-width:190px" onchange="CK.itens[${i}].fi=this.selectedIndex;ckCalc()">${x.forn.map((f,j)=>`<option ${j===x.fi?'selected':''}>${f.n} · ${brl2(f.p)}/${x.un} · ${f.prazo}</option>`).join('')}</select></td>
      <td class="num" style="border-bottom:0;white-space:nowrap"><input class="f" style="margin:0;width:90px;text-align:right" type="number" min="0" value="${x.q}" oninput="CK.itens[${i}].q=Math.max(0,+this.value||0);ckCalc()"> <span class="sm mut">${x.un}</span></td>
      <td class="num" style="border-bottom:0" id="ckt${i}"></td></tr>
      <tr><td colspan="4" style="padding-top:0"><div class="sm mut">precisa ${x.n.precisa.toLocaleString('pt-BR')} − saldo ${x.n.saldo.toLocaleString('pt-BR')} − a caminho ${x.n.caminho.toLocaleString('pt-BR')} = <b style="color:var(--ink)">falta ${x.falta.toLocaleString('pt-BR')} ${x.un}</b>${x.n.trf?` · ${x.n.trf} por transferência`:''}</div>${x.n.conta?`<div class="sm mut" style="font-size:11.5px">${x.n.conta}</div>`:''}</td></tr>`).join('')}
    <tr><td colspan="3"><b>Total</b></td><td class="num"><b id="cktot"></b></td></tr></table>
    <div class="grid g2" style="gap:0 14px"><div><label class="l">Quem está pedindo</label><select class="f" onchange="CK.quem=this.value;ckCalc()"><option value="Rizzi">Rizzi (admin · sem limite)</option><option value="Joana M.">Joana M. (mestre · até ${brl(ALCADA)})</option></select></div>
      <div><label class="l">Regime da obra</label><select class="f" onchange="CK.regime=this.value;ckCalc()">${['Empreitada (preço fechado)','Administração'].map(r=>`<option ${r===CK.regime?'selected':''}>${r}</option>`).join('')}</select></div></div>
    <div id="ckalc" style="margin-top:14px"></div>
    <div class="grid g2 sm" style="gap:12px;margin-top:14px"><div class="card" style="background:var(--bg);padding:12px 16px"><div class="mut">Entrega</div><b>Canteiro · R. das Palmeiras, 220</b><div class="mut">recebe e confere: Joana M. (mestre)</div></div>
      <div class="card" style="background:var(--bg);padding:12px 16px"><div class="mut">Pagamento</div><b>Boleto 28 dias</b><div class="mut">faturado para Construtora RZ</div></div></div>
    <div class="row" style="margin-top:22px"><button class="btn" onclick="ckCotacao()">${icon('users',15)}Pedir cotação a 5 fornecedores</button><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" id="ckok" onclick="confirmCheckout()"></button></div>`;
  $('modal').classList.add('on'); ckCalc();
}
function ckRegras(tot){
  const r=[];
  if(tot>ALCADA && CK.quem!=='Rizzi') r.push(['rizzi',`Acima de ${brl(ALCADA)}: precisa do OK do Rizzi`]);
  if(/Administra/.test(CK.regime)) r.push(['cliente','Obra por administração: o cliente aprova antes de enviar']);
  return r;
}
function ckCalc(){
  CK.itens.forEach((x,i)=>$('ckt'+i).textContent=brl2(x.forn[x.fi].p*x.q));
  const tot=ckTot(), r=ckRegras(tot); $('cktot').textContent=brl2(tot);
  const ok = tot>ALCADA&&CK.quem==='Rizzi' ? `Acima de ${brl(ALCADA)}: este pedido já é o OK do Rizzi` : tot<=ALCADA ? `Dentro da alçada de ${CK.quem} (até ${brl(ALCADA)} sem aprovação)` : '';
  $('ckalc').innerHTML = `<div class="card sm" style="padding:12px 16px;background:${r.length?'var(--amberSoft)':'var(--greenSoft)'};border-color:transparent">
    <b>Alçada</b> · ${r.length?r.map(x=>`${icon('alert',13)} ${x[1]}`).join(' · '):`${icon('checkCircle',13)} ${ok}`}${r.length&&ok?` · ${ok}`:''}</div>`;
  $('ckok').innerHTML = r.length ? `Enviar para aprovação ${icon('arrowRight',15)}` : `Gerar pedido ${icon('arrowRight',15)}`;
}
confirmCheckout = function(){
  if(!CK) return closeModal();
  const tot=ckTot(), r=ckRegras(tot), itens=CK.itens.filter(x=>x.q>0);
  if(!itens.length) return toast('Nenhuma quantidade para pedir');
  const grupos={}; itens.forEach(x=>{ (grupos[x.forn[x.fi].n] ||= []).push(x); });
  const quem=r.map(x=>x[0]==='rizzi'?'Rizzi':'cliente').join(' e do ');
  const peds=[], lotes=Object.entries(grupos).map(([forn,xs])=>{
    const p={id:proxPed(), forn, xs, v:Math.round(xs.reduce((a,x)=>a+x.forn[x.fi].p*x.q,0))}; peds.push(p);
    const l={id:p.id, inv:xs.length===1?xs[0].id:undefined, item:p.xs.map(x=>x.nome).join(' + '), q:p.xs.map(x=>x.q.toLocaleString('pt-BR')+' '+x.un).join(' + '), forn:p.forn, v:p.v,
    eta:r.length?`aguardando OK do ${quem}`:'PDF gerado · falta enviar', col:r.length?colDe(/cota/i,0):colDe(/aprovad/i,1), ai:true}; LOTES.push(l); return l; });
  const txt=peds.map(p=>`${p.id} · ${p.forn} · ${brl(p.v)}`).join(' · ');
  registrar(`Pedido de compra ${r.length?'enviado para aprovação':'gerado'} · ${txt}`, {obra:CK.obra, quem:CK.quem, origem:'tela'});
  const e=LOG[0]; e.desfazer=()=>{ lotes.forEach(tirarLote); e.desfeito=true; };
  if(r.length){ closeModal(); toastDesfazer(`${txt} · aguardando OK do ${quem}`, e.desfazer); return; }
  CK.lotes=lotes; CK.peds=peds;
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('file',20)}Pedido gerado</h2><div class="mut sm">Confira o PDF e envie ao fornecedor. O cartão já está em Pedidos.</div>
    ${peds.map(p=>`<div class="pdf"><div class="row"><b style="font-family:var(--serif);font-size:16px">Construtora RZ</b><span class="sp"></span><b>${p.id}</b></div>
      <div class="sm mut">Pedido de compra · 28/10/2026 · ${NOME_OBRA[CK.obra]} · entrega R. das Palmeiras, 220 · recebe Joana M.</div>
      <div class="sm" style="margin-top:8px">Para: <b>${p.forn}</b></div>
      <table class="sm" style="margin-top:8px"><tr><th>Insumo</th><th class="num">Qtd</th><th class="num">Preço</th><th class="num">Total</th></tr>
      ${p.xs.map(x=>`<tr><td>${x.nome}</td><td class="num">${x.q.toLocaleString('pt-BR')} ${x.un}</td><td class="num">${brl2(x.forn[x.fi].p)}</td><td class="num">${brl2(x.forn[x.fi].p*x.q)}</td></tr>`).join('')}
      <tr><td colspan="3"><b>Total · boleto 28 dias</b></td><td class="num"><b>${brl2(p.xs.reduce((a,x)=>a+x.forn[x.fi].p*x.q,0))}</b></td></tr></table>
      <div class="sm mut" style="margin-top:6px">${icon('spark',12)} sugerido pelo agente · aprovado por ${CK.quem} ${hora()}</div></div>`).join('')}
    <div class="row" style="margin-top:20px"><button class="btn" onclick="toast('(protótipo) baixaria o PDF')">${icon('download',15)}Baixar PDF</button><span class="sp"></span><button class="btn" onclick="closeModal();go('obra','${CK.obra}','${tabDe('pedidos','kanban')}')">Enviar depois</button><button class="btn amb" onclick="ckWhats()">${icon('message',15)}Enviar ao fornecedor por WhatsApp</button></div>`;
};
function ckWhats(){
  const ob=CK.obra, ls=CK.lotes, col=colDe(/Pedido (enviado|feito)/i,2), olds=ls.map(l=>({col:l.col,eta:l.eta}));
  ls.forEach(l=>{ l.col=col; l.eta='enviado por WhatsApp '+hora()+' · aguardando confirmação'; });
  registrar(`${ls.map(l=>l.id).join(', ')} enviado${ls.length>1?'s':''} ao fornecedor por WhatsApp (PDF)`, {obra:ob, origem:'WhatsApp'});
  const e=LOG[0]; e.desfazer=()=>{ ls.forEach((l,i)=>Object.assign(l,olds[i])); e.desfeito=true; };
  closeModal(); go('obra',ob,tabDe('pedidos','kanban'));
  toastDesfazer(`${ls.map(l=>l.id).join(', ')} enviado por WhatsApp · coluna "${KCOLS[col]}"`, e.desfazer);
}
/* Cotação assíncrona: o fornecedor responde em horas. Vira um cartão em Pedidos e uma linha em Aprovações. */
function ckCotacao(){
  const x=CK.itens[0], id='COT-'+String(11+COTACOES.length).padStart(4,'0');
  const c={id, obra:CK.obra, item:x.nome, q:x.q, un:x.un, enviada:'hoje '+hora(), fecha:'amanhã 10h', resp:[], pend:['Fornecedor 1','Fornecedor 2','Fornecedor 3','Fornecedor 4','Fornecedor 5'].map((n,i)=>x.forn[i]?.n||['Cerâmica Porto Feliz','Tijolar Hortolândia','Casa do Construtor Sousas','Leroy Merlin D. Pedro','Telhanorte Barão'][i])};
  COTACOES.unshift(c);
  const l={id, item:x.nome, q:x.q.toLocaleString('pt-BR')+' '+x.un, forn:'5 fornecedores', v:Math.round(x.forn[x.fi].p*x.q), eta:'Cotação enviada a 5 · 0 responderam · fecha amanhã 10h', col:colDe(/cota/i,0), ai:true};
  LOTES.push(l);
  registrar(`Cotação ${id} enviada a 5 fornecedores · ${x.nome} · ${l.q} · fecha amanhã 10h`, {obra:CK.obra, origem:'agente'});
  const e=LOG[0]; e.desfazer=()=>{ tirarLote(l); COTACOES.splice(COTACOES.indexOf(c),1); e.desfeito=true; };
  closeModal(); go('aprovacoes');
  toastDesfazer('Cotação enviada a 5 fornecedores · as respostas chegam ao longo do dia', e.desfazer);
}

addCSS(`
.brief-h{display:flex;flex-direction:column;gap:2px;margin-bottom:12px}
.brief-h b{font-family:var(--serif);font-size:19px;font-weight:600}
.bl{display:flex;flex-direction:column;border-top:1px solid var(--line2)}
.bi{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid var(--line2);transition:opacity .2s,transform .2s}
.bi:last-child{border-bottom:0}
.bi.saindo{opacity:0;transform:translateX(24px)}
.bic{width:34px;height:34px;border-radius:9px;background:var(--cream);display:grid;place-items:center}
.bit b{font-weight:600}
.bi .sug{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--accentInk);margin-top:6px}
.pdf{background:#fff;border:1px solid var(--line);border-radius:6px;padding:18px 20px;margin-top:14px;box-shadow:var(--shadow)}
`);
