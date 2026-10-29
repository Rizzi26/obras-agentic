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
   ajustar(){ openCheckout(['aco'],{obra:'vila-nova', lote:'PED-0167'}); },
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
   det:'Estrutura (R$ 58.000): <b>executado 62%</b>, <b>pago 75%</b> (R$ 43.500). Proponho segurar R$ 7.540 na próxima medição até o serviço alcançar o pago.',
   feito:'R$ 7.540 retidos na próxima medição da Equipe Silva',
   registro:'Medição da Equipe Silva · estrutura: retenção de R$ 7.540 na próxima (executado 62% × pago 75%)',
   fazer(){ return ()=>{}; },
   ajustar(){ ajustarModal(this, 'Segurar na próxima medição', [['Segurar (R$)','num','7540'],['Avisar','sel',['Equipe Silva por WhatsApp','Só registrar, aviso pessoalmente']]]); },
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
   ajustar(){ openCheckout(['telha'],{obra:'vila-nova', lote:'PED-0163'}); }, ver(){ go('obra','vila-nova',tabDe('pedidos','kanban')); }},
];
PROPOSTAS.forEach(p=>p.st='pendente');
const pendentes = obraId => PROPOSTAS.filter(p=>p.st==='pendente'&&(!obraId||p.obra===obraId));
function prop(id){ return PROPOSTAS.find(p=>p.id===id); }

/* ===================== FILA: prazo, valor, conta e ação de cada proposta =====================
   urg ordena a fila (prazo para decidir + gravidade: o aço acaba em 30/10 e para a equipe, vem primeiro).
   A conta é a do almoxarifado (linhaConta), lida ao vivo; a prosa (det) fica no detalhe. */
const insVN = id => (typeof dados==='function'?dados('vila-nova').inv:INV).find(x=>x.id===id);
/* A conta vem pronta do data.js (contaDe já desconta o que está em cotação). Quando a proposta É o pedido em
   cotação (ex.: PED-0167 do aço), a quantidade dele volta para a conta: é ela que se está aprovando. */
function contaComLote(obraId, invId, lote){
  const k=contaDe(obraId, invId), f=lote&&typeof acharLote==='function'?acharLote(lote):null;
  const q=f&&f.l.inv===invId&&f.l.col===0 ? (f.l.qn||0) : 0;
  return {...k, cotando:k.cotando-q, falta:k.falta+q, comprar:k.comprar+q};
}
const contaInv = (id, lote) => linhaConta(contaComLote('vila-nova', id, lote));
const nota = t => `<div class="ld-nota">${t}</div>`;
const FILA = {
  aco:{urg:1, prazo:'até 30/10', tf:'perda', valor:5040, gasto:5040, acao:'Pedir 600 kg', doc:'PED-0167',
    conta:()=>contaInv('aco','PED-0167')+nota(`a compra é o ${docRef('PED-0167')} (cotado, aguarda você) · a caminho: ${docRef('PED-0158')} da Gerdau, 9 dias atrasado e sem data`)},
  bloco:{urg:2, prazo:'até 31/10', tf:'perda', valor:'evita ≈ R$ 1.460', acao:'Exigir palete', doc:'PED-0162',
    conta:()=>`quebra 15% (190 de 1.240) contra 5% previsto · ${docRef('PED-0162')} sai 31/10 com 9.000 un`},
  cimento:{urg:3, prazo:'até 03/11', tf:'pede', valor:1227, gasto:1227, acao:'Trazer 20 sc e comprar 14',
    conta:()=>{ return contaInv('cim')+nota(`20 sc da Loja Centro a R$ 35,50 (vencem em 25 dias) · 14 sc no Depósito São Bento`); }},
  concreto:{urg:4, prazo:'até 04/11', tf:'pede', valor:'38 m³', acao:'Remarcar para 06/11', doc:'PED-0166',
    conta:()=>`80% de chuva na qui 05/11 · ${docRef('PED-0166')} · a Concrecamp tem vaga na sex, mesmo preço`},
  areia:{urg:5, prazo:'antes do boleto', tf:'pede', valor:'abate R$ 472', acao:'Abater R$ 472', doc:'PED-0157',
    conta:()=>`NF 40 m³ − medido 36 m³ = 4 m³ × R$ 118 · ${docRef('PED-0157')} ${chipFonte({origem:'whatsapp', quem:'Joana M.', hora:'17:31'})}`},
  medicao:{urg:6, prazo:'próx. medição', tf:'pede', valor:'segura R$ 7.540', acao:'Segurar R$ 7.540',
    conta:()=>`Equipe Silva · estrutura R$ 58.000 · executado 62% × pago 75% (R$ 43.500)`},
  armadores:{urg:2.5, prazo:'esta semana', tf:'perda', valor:'−5 dias', acao:'Abrir 2 vagas',
    conta:()=>`vaga aberta desde 01/10 na Equipe Silva · recupera ~5 dias do atraso`},
  telhas:{urg:4.5, prazo:'esta semana', tf:'pede', valor:9165, gasto:9165, acao:'Aprovar R$ 9.165', doc:'PED-0163',
    conta:()=>`${docRef('PED-0163')} aguarda aprovação · comprar agora recupera ~4 dias`},
  porcelanato:{urg:9, prazo:'até 09/12', tf:'info', valor:'18 m²', acao:'Guardar 18 m²',
    conta:()=>`mesmo lote do 60×60 · a obra entrega em 09/12; fica para reposição na garantia`},
};
[...PROPOSTAS, ...PROPOSTAS_PRAZO].forEach(p=>Object.assign(p, FILA[p.id]||{urg:8, prazo:'—', tf:'info', acao:'Aprovar', conta:()=>''}));
const porUrg = (a,b)=>a.urg-b.urg;
/* resolvida nesta sessão = fica no lugar, como feito, com Desfazer */
const naFila = p => p.st==='pendente' || !!p.quando;

/* Uma proposta como linha de decisão (Início, Aprovações; o Hoje da obra chama aprovarProp). */
function linhaProp(p, {comObra=true, foco=false, recusa=false}={}){
  const feito = p.st!=='pendente';
  return linhaDecisao({prazo:p.prazo, tom:feito?'ok':p.tf, obra:comObra?p.obra:null, doc:p.doc,
    titulo:`<a href="#" class="ld-ver" onclick="verProp('${p.id}');return false">${p.tit}</a>`,
    conta: feito ? p.feito : p.conta(), valor:p.valor, foco,
    acao:{label:p.acao, onclick:`aprovarProp('${p.id}')`},
    sec:[...(recusa?[{label:'Recusar', onclick:`recusarProp('${p.id}')`}]:[]), {label:'Ajustar', onclick:`prop('${p.id}').ajustar()`}],
    estado: feito ? {feito:p.st==='recusada'?'Recusado':'Aprovado', hora:p.quando, quem:'Rizzi', desfazer:`desfazerProp('${p.id}')`} : 'pendente'});
}
/* Re-renderiza sem a página pular e devolve o foco ao Desfazer da linha que acabou de mudar. */
function repintar(id){
  typeof manterRolagem==='function' ? manterRolagem(render) : render();
  if(!id) return;
  const b=[...document.querySelectorAll('.ld-feito button')].find(x=>(x.getAttribute('onclick')||'').includes(`'${id}'`));
  if(b) b.focus({preventScroll:true});
}

function aplicarProp(p){
  const undo=p.fazer(); p.st='aprovada'; p.quando=hora();
  registrar(`${p.registro} · aprovado por Rizzi ${p.quando}`, {obra:p.obra, origem:'agente'});
  const e=LOG[0]; p.log=e;
  e.desfazer=()=>{ undo&&undo(); p.st='pendente'; p.quando=null; e.desfeito=true; };
  return e;
}
function aprovarProp(id){
  const p=prop(id); if(!p||p.st!=='pendente') return;
  closeModal(); const e=aplicarProp(p); AP.sel.delete(id);
  repintar(id); toastDesfazer(p.feito, e.desfazer);
}
function desfazerProp(id){
  const p=prop(id), e=p&&p.log; if(!e||e.desfeito) return;
  e.desfazer(); registrar('Desfez: '+(p.st==='pendente'?p.feito:p.tit), {obra:p.obra}); repintar(); toast('Desfeito');
}
/* Recusar pede um motivo curto: vai para o registro e é dado para o agente aprender. */
const MOTIVOS = ['Já resolvi de outro jeito','A conta ou o dado está errado','Agora não, pergunte de novo depois'];
function recusarProp(id){
  const p=prop(id);
  abrirModal(`<h2>Recusar · ${p.tit}</h2>
    <p class="mut ap-meta">${NOME_OBRA[p.obra]} · ${chipFonte({origem:'agente'})} · o motivo vai para o registro e o agente aprende com ele</p>
    <fieldset class="ap-motivos"><legend class="l">Por quê?</legend>
      ${MOTIVOS.map((m,i)=>`<label class="ap-op"><input type="radio" name="apMot" value="${m}"${i===0?' checked':''}><span>${m}</span></label>`).join('')}</fieldset>
    <label class="l" for="apMotTxt">Detalhe (opcional)</label><textarea class="f" id="apMotTxt" rows="2" placeholder="ex.: já pedi à Gerdau por telefone"></textarea>
    <div class="row"><span class="sp"></span>${botao('Recusar e registrar o motivo', `recusarConfirmar('${id}')`, {pri:true})}</div>`);
}
function recusarConfirmar(id){
  const p=prop(id), m=(document.querySelector('input[name=apMot]:checked')||{}).value||MOTIVOS[0], t=$('apMotTxt').value.trim();
  p.st='recusada'; p.quando=hora(); AP.sel.delete(id);
  registrar(`Recusou: ${p.tit} · motivo: ${m}${t?' ('+t+')':''}`, {obra:p.obra, origem:'agente'});
  const e=LOG[0]; p.log=e; e.desfazer=()=>{ p.st='pendente'; p.quando=null; e.desfeito=true; };
  closeModal(); repintar(id); toastDesfazer('Proposta recusada · motivo registrado', e.desfazer);
}
function desfazerLog(i){ const e=LOG[i]; if(!e||!e.desfazer||e.desfeito) return; e.desfazer(); registrar('Desfez: '+e.texto.split(' · aprovado por')[0], {obra:e.obra}); repintar(); toast('Desfeito'); }

/* Detalhe (drawer consulta): a explicação do agente, que saiu da linha. */
function verProp(id){
  const p=prop(id);
  $('drawerPane').innerHTML = `<div class="row"><span class="sp"></span><button class="iconbtn" aria-label="Fechar" onclick="closeDrawer()">${icon('x',18)}</button></div>
    <h2>${p.tit}</h2><p class="mut ap-meta">${NOME_OBRA[p.obra]} · ${chipFonte({origem:'agente'})} · ${p.prazo}</p>
    <div class="ap-conta">${p.st==='pendente'?p.conta():p.feito}</div>
    <p class="ap-det">${p.det}</p>
    <div class="row" style="flex-wrap:wrap">${botao('Abrir onde está', `closeDrawer();prop('${id}').ver()`)}${p.st==='pendente'?botao('Ajustar', `closeDrawer();prop('${id}').ajustar()`)+botao('Recusar', `closeDrawer();recusarProp('${id}')`):''}</div>`;
  $('drawer').classList.add('on');
}

/* Ajustar genérico: o gerente mexe no que o agente propôs e aprova a versão ajustada. */
function ajustarModal(p, titulo, campos){
  abrirModal(`<h2>${titulo}</h2>
    <p class="mut ap-meta">${NOME_OBRA[p.obra]} · ${chipFonte({origem:'agente'})} · ${p.tit}</p>
    <p class="ap-det">${p.det}</p>
    ${campos.map(([l,t,v],k)=>`<label class="l" for="aj${k}">${l}</label>${t==='sel'?`<select class="f" id="aj${k}">${v.map(o=>`<option>${o}</option>`).join('')}</select>`:t==='txt'?`<textarea class="f" id="aj${k}" rows="4" style="resize:vertical">${v}</textarea>`:`<input class="f" id="aj${k}" inputmode="decimal" value="${v}">`}`).join('')}
    <div class="row"><span class="sp"></span>${botao(`Aprovar com ajuste · ${p.acao}`, `aprovarProp('${p.id}')`, {pri:true, icone:'check'})}</div>`);
}

/* ===================== INÍCIO: o briefing é a página; o chat é uma barra no rodapé ===================== */
const HOME = {chat:false};
function abrirConversa(){ HOME.chat=true; repintar(); const c=$('hcMsgs'); if(c) c.scrollTop=c.scrollHeight; const t=$('hcTxt'); if(t) t.focus({preventScroll:true}); }
function fecharConversa(){ HOME.chat=false; repintar(); const b=$('hcAbrir'); if(b) b.focus({preventScroll:true}); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && HOME.chat && state.view==='home' && !$('modal').classList.contains('on') && !$('drawer').classList.contains('on')) fecharConversa(); });

function conversasDeHoje(){ return `
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
  `; }

renderHome = function(){
  const fila = PROPOSTAS.filter(p=>p.brief&&naFila(p)).sort(porUrg);
  const abertas = fila.filter(p=>p.st==='pendente'), n = abertas.length, foco = abertas[0];
  return `<div class="top"><div><h1>Hoje, quarta 28/10</h1><div class="crumb">${n?`${n} ${n>1?'decisões':'decisão'} · a mais urgente vence ${foco.prazo.replace(/^até /,'')}`:'nada pendente'}</div></div></div>
  <div class="page">
    <div class="hm">
      ${val('O gerente quer começar o dia por uma fila de decisões prontas (aprovar / ajustar), em vez de perguntar? Quantas cabem antes de virar ruído?')}
      <div class="hm-h"><h2 class="sectit">Pedem você</h2>${chipFonte({origem:'agente', quem:'3 obras, WhatsApp e previsão do tempo', hora:'07:00'})}<span class="sp"></span><span class="mut sm">nada é feito sem o seu OK</span></div>
      ${fila.length?listaDecisoes(fila.map(p=>linhaProp(p,{foco:p===foco}))):''}
      ${!n?`<p class="hm-vazio">${icon('checkCircle',16)}Fila vazia. O próximo briefing sai amanhã às 7h; se algo urgente chegar pelo WhatsApp, aviso antes.</p>`:''}
      <h2 class="sectit hm-h2">Também hoje</h2>
      <div class="hm-st">
        <a href="#" onclick="go('obra','loja-centro','hoje');return false"><span class="dot" style="background:var(--green)"></span><b>Reforma Loja Centro</b><span>6 dias adiantada e R$ 5.800 abaixo do orçamento</span>${icon('chevRight',15)}</a>
        <a href="#" onclick="go('obra','galpao','hoje');return false"><span class="dot" style="background:#8a938f"></span><b>Galpão Sumaré</b><span>em orçamento, esperando 2 respostas suas</span>${icon('chevRight',15)}</a>
      </div>
    </div>
  </div>
  <div class="hbar${HOME.chat?' on':''}">
    ${HOME.chat?`<div class="hc" role="region" aria-labelledby="hcTit">
      <div class="hc-top"><h2 id="hcTit">Conversa com o agente</h2><span class="mut sm">enxerga as 3 obras</span><span class="sp"></span><button class="iconbtn" aria-label="Recolher conversa" title="Recolher (Esc)" onclick="fecharConversa()">${icon('chevDown',18)}</button></div>
      <div class="msgs hc-msgs" id="hcMsgs">${conversasDeHoje()}</div>
      <div class="hc-chips">${['Qual obra está mais acima do orçamento?','O que chega amanhã nas obras?','Quem está em campo hoje na Vila Nova?'].map(c=>`<button class="chip" onclick="toast('(protótipo) o agente responderia aqui')">${c}</button>`).join('')}</div>
      <div class="hc-comp"><label class="sr-only" for="hcTxt">Mensagem para o agente</label><textarea id="hcTxt" rows="1" placeholder="Pergunte sobre qualquer obra, ou peça: 'pede cotação de 5.000 blocos'…"></textarea>
        <button class="iconbtn" aria-label="Anexar projeto, NF ou foto" onclick="toast('(protótipo) anexar projeto, NF ou foto')">${icon('clip',18)}</button>${botao('Enviar', "toast('(protótipo) enviar')", {pri:true})}</div></div>`
    :`<button class="hbar-in" id="hcAbrir" onclick="abrirConversa()">${icon('spark',16)}<span>Pergunte ou peça ao agente…</span><span class="sp"></span><span class="mut sm">2 conversas de hoje</span>${icon('chevUp',16)}</button>`}
  </div>`;
};
function viraPropostas(){
  const novas=PROPOSTAS_PRAZO.filter(p=>!prop(p.id));
  novas.forEach(p=>{ p.st='pendente'; PROPOSTAS.push(p); });
  toast(novas.length?`${novas.length} propostas novas na fila (aço e concretagem já estavam)`:'Essas propostas já estão na fila');
  AP.aba='pendentes'; HOME.chat=false; setTimeout(()=>go('aprovacoes'),500);
}
ICONS.chevUp = ICONS.chevUp || '<path d="m18 15-6-6-6 6"/>';

/* ===================== APROVAÇÕES: Pendentes · Cotações · Registro ===================== */
const COTACOES = [
  {id:'COT-0011', obra:'vila-nova', inv:'bloco', item:'Bloco cerâmico 14×19×29', q:5690, un:'un', enviada:'hoje 08:10', fecha:'amanhã 10h',
   resp:[{n:'Cerâmica Itu Direto',p:1.62,prazo:'7 dias',obs:'palete incluso',h:'09:02'},{n:'Olaria Sumaré',p:1.74,prazo:'4 dias',obs:'frete à parte',h:'10:40'},{n:'Depósito São Bento',p:1.89,prazo:'2 dias',obs:'palete incluso',h:'11:15'}],
   pend:['Cerâmica Porto Feliz','Tijolar Hortolândia'],
   rec:'Cerâmica Itu Direto', hist:'no PED-0149 veio sem palete e a quebra foi de 15%; agora o palete vem incluso'},
];
const AP = {aba:'pendentes', sel:new Set(), origem:'todas'};
const ORIGENS = [['todas','Todas'],['agente','agente'],['WhatsApp','WhatsApp'],['tela','tela']];
const diasDe = t => parseInt(t,10)||0;
const dataMais = d => { const x=new Date(2026,9,28+d); return String(x.getDate()).padStart(2,'0')+'/'+String(x.getMonth()+1).padStart(2,'0'); };
const gastoDe = ids => ids.reduce((a,id)=>a+((prop(id)||{}).gasto||0),0);

function apAba(k){ AP.aba=k; render(); }
function apSel(id, on){ on?AP.sel.add(id):AP.sel.delete(id); apLote(); }
function apTodas(on){ pendentes().forEach(p=>on?AP.sel.add(p.id):AP.sel.delete(p.id)); repintar(); }
function apLote(){
  const ids=[...AP.sel].filter(id=>(prop(id)||{}).st==='pendente'), n=ids.length, g=gastoDe(ids), b=$('apLote'); if(!b) return;
  b.innerHTML = n ? `<span><b>${n} ${n>1?'selecionadas':'selecionada'}</b>${g?` · compromete ${brl(g)}`:''}</span><span class="sp"></span>${botao('Limpar', 'apTodas(false)', {sm:true})}${botao(`Aprovar ${n}${g?' · '+brl(g):''}`, 'aprovarSelecionadas()', {pri:true, icone:'check'})}`
    : `<span class="mut">Marque as propostas para aprovar de uma vez.</span><span class="sp"></span>${botao(`Selecionar as ${pendentes().length}`, 'apTodas(true)', {sm:true})}`;
  b.classList.toggle('on', !!n);
}
function aprovarSelecionadas(){
  const ps=[...AP.sel].map(prop).filter(p=>p&&p.st==='pendente'); if(!ps.length) return;
  const es=ps.map(aplicarProp), g=gastoDe(ps.map(p=>p.id)); AP.sel.clear(); repintar();
  toastDesfazer(`${ps.length} propostas aprovadas${g?' · '+brl(g):''}`, ()=>es.slice().reverse().forEach(e=>!e.desfeito&&e.desfazer()));
}

function apPendentes(){
  const fila=PROPOSTAS.filter(naFila).sort(porUrg), abertas=fila.filter(p=>p.st==='pendente');
  const porObra=OBRAS.map(o=>[o,fila.filter(p=>p.obra===o.id)]).filter(([,ps])=>ps.length);
  if(!fila.length) return `<p class="hm-vazio">${icon('checkCircle',16)}Nenhuma proposta esperando você.</p>`;
  return `<div class="ap-lote" id="apLote" aria-live="polite"></div>
    ${porObra.map(([o,ps])=>`<h2 class="sectit ap-h"><span class="dot" style="background:${o.cor}"></span>${o.nome}<span class="mut sm">${ps.filter(p=>p.st==='pendente').length} pendentes</span></h2>
    <div class="ld-lista">${ps.map(p=>`<div class="ap-it${p.st!=='pendente'?' feito':''}">${p.st==='pendente'
      ?`<label class="ap-chk" title="Selecionar para aprovar em lote"><input type="checkbox" ${AP.sel.has(p.id)?'checked':''} onchange="apSel('${p.id}',this.checked)" aria-label="Selecionar: ${esc(p.tit)}"></label>`:'<span class="ap-chk"></span>'}
      ${linhaProp(p,{comObra:false, foco:p===abertas[0], recusa:true})}</div>`).join('')}</div>`).join('')}`;
}
function apCotacoes(){
  return COTACOES.map(c=>{
    const rs=[...c.resp].sort((a,b)=>a.p-b.p), barato=rs[0], rapido=[...c.resp].sort((a,b)=>diasDe(a.prazo)-diasDe(b.prazo))[0];
    const rec=c.resp.find(r=>r.n===c.rec)||barato, outro=rs.find(r=>r!==rec), inv=insVN(c.inv), dias=diasDe(rec.prazo);
    const fechar=(r,pri)=>botao(pri?`Fechar com ${r.n.split(' ').slice(0,2).join(' ')} · ${brl(r.p*c.q)}`:'Fechar com este', `openCheckout(['${c.inv}'],{forn:'${r.n}', q:${c.q}})`, {pri, sm:!pri});
    return `<section class="card ap-cot" data-doc="${c.id}">
      <h2 class="sectit">${c.id} · ${c.item} · ${num(c.q)} ${c.un}</h2>
      <p class="mut ap-meta">${NOME_OBRA[c.obra]} · enviada ${c.enviada} a ${c.resp.length+c.pend.length} · ${c.resp.length} responderam · fecha ${c.fecha} ${chipFonte({origem:'cotacao'})}</p>
      ${c.resp.length?`<div class="ap-rec">${icon('spark',16)}<p><b>Recomendo a ${rec.n}.</b> ${outro?`${brl(Math.round((outro.p-rec.p)*c.q))} mais barata que a ${outro.n}`:'menor preço'}, ${rec.obs}${c.hist?` (${c.hist})`:''}; chega em ${rec.prazo} (${dataMais(dias)})${inv?`, antes de o saldo acabar (${inv.cob})`:''}.</p>${fechar(rec,true)}</div>
      <table class="ap-tab"><tr><th>Fornecedor</th><th class="num">Preço un.</th><th class="num">Total</th><th>Chega</th><th>Obs.</th><th></th></tr>
      ${rs.map(r=>`<tr${r===rec?' class="rec"':''}><td><b>${r.n}</b> ${r===barato?pill('info','mais barato'):''}${r===rapido?pill('info','mais rápido'):''}<div class="mut sm">respondeu ${r.h}</div></td><td class="num">${brl2(r.p)}</td><td class="num">${brl(r.p*c.q)}</td><td>${r.prazo} · ${dataMais(diasDe(r.prazo))}</td><td>${r.obs}</td><td class="num">${r===rec?pill('ok','recomendado'):fechar(r,false)}</td></tr>`).join('')}
      ${c.pend.map(n=>`<tr><td class="mut">${n}</td><td colspan="5" class="mut">${icon('clock',13)} aguardando resposta</td></tr>`).join('')}</table>`
      :`<p class="mut">${icon('clock',14)} Nenhuma resposta ainda. As primeiras costumam chegar em 1–3 horas; aviso quando fechar (${c.fecha}).</p>`}
    </section>`; }).join('') || `<p class="hm-vazio">Nenhuma cotação em andamento.</p>`;
}
function apRegistro(){
  const ls=LOG.map((e,i)=>[e,i]).filter(([e])=>AP.origem==='todas'||e.origem===AP.origem);
  return `<div class="subnav">${segmento(ORIGENS.map(([k,l])=>({k, label:l, onclick:`AP.origem='${k}';render()`})), AP.origem, {rotulo:'Filtrar por origem'})}<span class="mut sm">quem fez, quando e de onde veio</span></div>
  <div class="card" style="padding:0"><table class="ap-reg">
    <tr><th style="width:100px">Quando</th><th style="width:130px">Obra</th><th>O que foi feito</th><th style="width:210px">Fonte</th><th style="width:110px"></th></tr>
    ${ls.map(([e,i])=>`<tr class="${e.desfeito?'desfeito':''}"><td class="mut">${e.quando}</td><td>${NOME_OBRA[e.obra]||e.obra}</td><td>${e.desfeito?`<s>${e.texto}</s> ${pill('info','desfeito')}`:e.texto}</td>
      <td>${chipFonte({origem:e.origem, quem:e.quem})}</td><td class="num">${e.desfazer&&!e.desfeito?botao('Desfazer', `desfazerLog(${i})`, {sm:true}):''}</td></tr>`).join('')}
  </table></div>`;
}
VIEWS.aprovacoes = () => {
  const n=pendentes().length;
  return `<div class="top"><div><h1>Aprovações</h1><div class="crumb">${n} ${n===1?'proposta':'propostas'} do agente · tudo o que foi feito fica no registro, com Desfazer</div></div></div>
  <div class="page"><div class="ap">
    ${val('Quem mais aprova além do Rizzi? A Joana (mestre) aprova compras até R$ 5.000 sozinha? O cliente de obra por administração aprova pelo WhatsApp?')}
    <div class="subnav">${segmento([{k:'pendentes',label:'Pendentes',n,onclick:"apAba('pendentes')"},{k:'cotacoes',label:'Cotações',n:COTACOES.length,onclick:"apAba('cotacoes')"},{k:'registro',label:'Registro',onclick:"apAba('registro')"}], AP.aba, {rotulo:'Aprovações'})}</div>
    ${AP.aba==='cotacoes'?apCotacoes():AP.aba==='registro'?apRegistro():apPendentes()}
  </div></div>`;
};
document.addEventListener('rendered', ()=>{ if(state.view==='aprovacoes' && AP.aba==='pendentes') apLote(); });
NAV_EXTRA.push({view:'aprovacoes', icon:'checkCircle', label:'Aprovações', count:()=>pendentes().length});

/* ===================== PEDIDO DE COMPRA ===================== */
/* A conta é a do data.js (compraDe/faltaDe): precisa − saldo − a caminho − transferência, e o que já está
   EM COTAÇÃO fica fora (erro 1 da direção: PED-0163/0164/0167 entravam de novo). o.lote = o pedido sugerido
   que este modal está ajustando (não conta como cotação, é ele mesmo). */
const FORN_PADRAO = {aco:['Aço Forte Comercial','a Gerdau está com o PED-0158 9 dias atrasado']};
const ALCADA = 5000;
const REGIME = {'vila-nova':'Empreitada (preço fechado)', 'loja-centro':'Administração'};
const ENTREGA = {'vila-nova':['Canteiro · R. das Palmeiras, 220','Joana M. (mestre)'], 'loja-centro':['Loja Centro · obra','Ana P. (mestre)']};
let CK = null;

function ckItem(obraId, id, o){
  const d=dados(obraId), c=d.comp.find(x=>x.id===id)||(typeof insumo==='function'&&insumo(id))||COMP.find(x=>x.id===id)||{id, nome:id, un:'un', qtd:o.q||0};
  const invId=c.inv||id, k=contaComLote(obraId, invId, o.lote);
  const forn=c.forn&&c.forn.length?c.forn:[{n:'Fornecedor',p:0,prazo:'—'}], barato=forn.reduce((a,b)=>a.p<b.p?a:b);
  const [pn,pq]=FORN_PADRAO[id]&&!o.forn?FORN_PADRAO[id]:[o.forn||barato.n, o.forn?'escolhido na cotação':'mais barato'];
  const fi=Math.max(0,forn.findIndex(f=>f.n===pn));
  const caminho=d.lotes.filter(l=>l.inv===invId&&l.col>=1&&!l.conf), cots=d.lotes.filter(l=>l.inv===invId&&l.col===0&&l.id!==o.lote);
  const notas=[caminho.length?'a caminho: '+caminho.map(l=>docRef(l.id)+(l.late?' (atrasado)':'')).join(', '):'',
    cots.length?`${cots.map(l=>docRef(l.id)).join(', ')} em cotação · fica fora deste pedido`:'',
    o.lote?`este pedido ajusta o ${docRef(o.lote)}`:'',
    k.transf?`${num(k.transf)} ${k.un} vêm da ${NOME_OBRA[(k.tr||{}).origem]||'outra obra'} por transferência`:''].filter(Boolean);
  return {id, nome:c.nome||k.nome||id, un:c.un||k.un||'un', forn, fi, pq, q:o.q??k.comprar, conta:k, notas};
}
openCheckout = function(ids, o={}){
  closeDrawer();
  const ob = OBRAS.find(x=>x.id===(o.obra||state.obra))||OBRAS[0];
  CK = {obra:ob.id, quem:'Rizzi', lote:o.lote, regime:REGIME[ob.id]||(/admin/i.test(ob.regime||'')?'Administração':'Empreitada (preço fechado)'), itens:ids.map(id=>ckItem(ob.id,id,o))};
  ckTela();
};
const ckPreco = x => x.forn[x.fi].p*x.q;
function ckTot(){ return CK.itens.reduce((a,x)=>a+ckPreco(x),0); }
function ckTitulo(){ const x=CK.itens[0]; return CK.itens.length===1 ? `Pedido · ${x.nome} · ${num(x.q)} ${x.un}` : `Pedido de compra · ${CK.itens.length} insumos`; }
function ckTela(){
  const [ent,rec]=ENTREGA[CK.obra]||ENTREGA['vila-nova'];
  abrirModal(`<h2 id="ckTit">${ckTitulo()}</h2>
    <p class="mut ap-meta">${NOME_OBRA[CK.obra]} · ${chipFonte({origem:'agente'})} quantidade e fornecedor sugeridos · um pedido por fornecedor</p>
    ${CK.itens.map((x,i)=>`<section class="ck-it">
      ${CK.itens.length>1?`<h3>${x.nome}</h3>`:''}
      ${linhaConta(x.conta)}${x.notas.length?`<div class="ld-nota">${x.notas.join(' · ')}</div>`:''}
      <div class="ck-q"><label class="l" for="ckq${i}">Quantidade a pedir</label>
        <div class="ck-step"><button type="button" class="btn" aria-label="Menos" onclick="ckPasso(${i},-1)">${icon('minus',16)}</button><input class="f" id="ckq${i}" type="number" min="0" inputmode="numeric" value="${x.q}" oninput="CK.itens[${i}].q=Math.max(0,+this.value||0);ckCalc()"><button type="button" class="btn" aria-label="Mais" onclick="ckPasso(${i},1)">${icon('plus',16)}</button><span class="mut">${x.un}</span></div></div>
      <fieldset class="ck-forn"><legend class="l">Fornecedor</legend>
        ${x.forn.map((f,j)=>`<label class="ck-op"><input type="radio" name="ckf${i}" ${j===x.fi?'checked':''} onchange="CK.itens[${i}].fi=${j};ckCalc()">
          <span class="ck-n">${f.n}${j===x.fi?` <span class="ck-sug">sugerido · ${x.pq}</span>`:''}</span><span class="ck-p">${brl2(f.p)}/${x.un}</span><span class="ck-pz">${f.prazo}</span><span class="ck-t" id="ckt${i}_${j}"></span></label>`).join('')}
      </fieldset></section>`).join('')}
    <dl class="ck-fatos">
      <div><dt>Entrega</dt><dd>${ent} · recebe e confere ${rec}</dd></div>
      <div><dt>Pagamento</dt><dd>Boleto 28 dias · faturado para Construtora RZ</dd></div>
      <div><dt>Pedido por</dt><dd id="ckQuem"></dd></div>
      <div><dt>Regime</dt><dd>${CK.regime}</dd></div>
    </dl>
    <p class="ck-alc" id="ckalc"></p>
    <div class="row">${botao(`${icon('users',15)}Cotar com 5 fornecedores <span class="mut">· respostas em 1–3 h</span>`, 'ckCotacao()')}<span class="sp"></span><button type="button" class="btn amb" id="ckok" onclick="confirmCheckout()"></button></div>`);
  ckCalc();
}
function ckPasso(i, d){ const x=CK.itens[i], passo=x.q>=1000?100:x.q>=100?10:1; x.q=Math.max(0,x.q+d*passo); $('ckq'+i).value=x.q; ckCalc(); }
function ckQuem(q){ CK.quem=q; ckCalc(); }
function ckRegras(tot){
  const r=[];
  if(tot>ALCADA && CK.quem!=='Rizzi') r.push(['rizzi',`acima de ${brl(ALCADA)}: precisa do OK do Rizzi`]);
  if(/Administra/.test(CK.regime)) r.push(['cliente','obra por administração: o cliente aprova antes de enviar']);
  return r;
}
function ckCalc(){
  CK.itens.forEach((x,i)=>x.forn.forEach((f,j)=>{ const e=$(`ckt${i}_${j}`); if(e) e.textContent=brl2(f.p*x.q); }));
  const tot=ckTot(), r=ckRegras(tot), forns=new Set(CK.itens.filter(x=>x.q>0).map(x=>x.forn[x.fi].n)).size;
  $('ckTit').textContent=ckTitulo();
  $('ckQuem').innerHTML = CK.quem==='Rizzi' ? `Rizzi (admin · sem limite) · <button type="button" class="ck-sim" onclick="ckQuem('Joana M.')">simular como Joana (mestre)</button>`
    : `Joana M. (mestre · até ${brl(ALCADA)}) · <button type="button" class="ck-sim" onclick="ckQuem('Rizzi')">voltar para Rizzi</button>`;
  const ok = tot>ALCADA&&CK.quem==='Rizzi' ? `acima de ${brl(ALCADA)}: este pedido já é o OK do Rizzi` : `dentro da alçada de ${CK.quem} · gera o pedido direto`;
  $('ckalc').className='ck-alc '+(r.length?'t-pede':'t-ok');
  $('ckalc').innerHTML = r.length ? `${icon('alert',15)}${r.map(x=>x[1]).join(' · ')}` : `${icon('checkCircle',15)}${ok}`;
  $('ckok').innerHTML = !tot ? 'Nada a pedir' : r.length ? `Enviar para aprovação · ${brl2(tot)}` : forns>1 ? `Gerar ${forns} pedidos de ${brl2(tot)}` : `Gerar pedido de ${brl2(tot)}`;
  $('ckok').disabled = !tot;
}
confirmCheckout = function(){
  if(!CK) return closeModal();
  const tot=ckTot(), r=ckRegras(tot), itens=CK.itens.filter(x=>x.q>0);
  if(!itens.length) return toast('Nenhuma quantidade para pedir');
  const grupos={}; itens.forEach(x=>{ (grupos[x.forn[x.fi].n] ||= []).push(x); });
  const quem=r.map(x=>x[0]==='rizzi'?'Rizzi':'cliente').join(' e do ');
  const f=CK.lote&&typeof acharLote==='function'?acharLote(CK.lote):null; let reusa=f&&f.l;
  const voltas=[], peds=[], lotes=Object.entries(grupos).map(([forn,xs])=>{
    const v=Math.round(xs.reduce((a,x)=>a+ckPreco(x),0));
    const campos={item:xs.map(x=>x.nome).join(' + '), q:xs.map(x=>num(x.q)+' '+x.un).join(' + '), forn, v,
      eta:r.length?`aguardando OK do ${quem}`:'PDF gerado · falta enviar', col:r.length?colDe(/cota/i,0):colDe(/aprovad/i,1), ai:true};
    if(xs.length===1) Object.assign(campos,{inv:xs[0].id, qn:xs[0].q, un:xs[0].un});
    let l;
    if(reusa && xs.some(x=>x.id===reusa.inv)){ l=reusa; reusa=null; const antes={...l}; Object.assign(l,campos); voltas.push(()=>{ Object.keys(l).forEach(k=>delete l[k]); Object.assign(l,antes); }); }
    else { l={id:proxPed(), ...campos}; (f?f.d.lotes:LOTES).push(l); voltas.push(()=>{ const a=f?f.d.lotes:LOTES, k=a.indexOf(l); if(k>=0) a.splice(k,1); }); }
    peds.push({id:l.id, forn, xs, v}); return l; });
  const txt=peds.map(p=>`${p.id} · ${p.forn} · ${brl(p.v)}`).join(' · ');
  registrar(`Pedido de compra ${r.length?'enviado para aprovação':'gerado'} · ${txt}`, {obra:CK.obra, quem:CK.quem, origem:'tela'});
  const e=LOG[0]; e.desfazer=()=>{ voltas.forEach(v=>v()); e.desfeito=true; };
  if(r.length){ closeModal(); render(); toastDesfazer(`${txt} · aguardando OK do ${quem}`, e.desfazer); return; }
  CK.lotes=lotes; CK.peds=peds;
  const [ent,rec]=ENTREGA[CK.obra]||ENTREGA['vila-nova'];
  abrirModal(`<h2>${peds.length>1?`${peds.length} pedidos gerados`:`Pedido ${peds[0].id} gerado`}</h2>
    <p class="mut ap-meta">Confira o PDF e envie ao fornecedor. O cartão já está em Pedidos. ${chipFonte({origem:'agente', quem:'aprovado por '+CK.quem, hora:hora()})}</p>
    ${peds.map(p=>`<section class="pdf"><div class="row"><b class="pdf-rz">Construtora RZ</b><span class="sp"></span><b>${p.id}</b></div>
      <div class="mut sm">Pedido de compra · 28/10/2026 · ${NOME_OBRA[CK.obra]} · entrega ${ent} · recebe ${rec}</div>
      <div style="margin-top:8px">Para: <b>${p.forn}</b></div>
      <table class="sm" style="margin-top:8px"><tr><th>Insumo</th><th class="num">Qtd</th><th class="num">Preço</th><th class="num">Total</th></tr>
      ${p.xs.map(x=>`<tr><td>${x.nome}</td><td class="num">${num(x.q)} ${x.un}</td><td class="num">${brl2(x.forn[x.fi].p)}</td><td class="num">${brl2(ckPreco(x))}</td></tr>`).join('')}
      <tr><td colspan="3"><b>Total · boleto 28 dias</b></td><td class="num"><b>${brl2(p.xs.reduce((a,x)=>a+ckPreco(x),0))}</b></td></tr></table></section>`).join('')}
    <div class="row" style="flex-wrap:wrap">${botao('Baixar PDF', "toast('(protótipo) baixaria o PDF')", {icone:'download'})}${botao('Enviar depois', `closeModal();go('obra','${CK.obra}','${tabDe('pedidos','kanban')}')`)}<span class="sp"></span>${botao(`Enviar ${peds.length>1?'os pedidos':'ao fornecedor'} por WhatsApp`, 'ckWhats()', {pri:true, icone:'message'})}</div>`);
};
function ckWhats(){
  const ob=CK.obra, ls=CK.lotes, col=colDe(/Pedido (enviado|feito)/i,2), olds=ls.map(l=>({col:l.col,eta:l.eta}));
  ls.forEach(l=>{ l.col=col; l.eta='enviado por WhatsApp '+hora()+' · aguardando confirmação'; });
  registrar(`${ls.map(l=>l.id).join(', ')} enviado${ls.length>1?'s':''} ao fornecedor por WhatsApp (PDF)`, {obra:ob, origem:'WhatsApp'});
  const e=LOG[0]; e.desfazer=()=>{ ls.forEach((l,i)=>Object.assign(l,olds[i])); e.desfeito=true; };
  closeModal(); go('obra',ob,tabDe('pedidos','kanban'));
  toastDesfazer(`${ls.map(l=>l.id).join(', ')} enviado por WhatsApp · coluna "${KCOLS[col]}"`, e.desfazer);
}
/* Cotação assíncrona: o fornecedor responde em horas. Vira um cartão em Pedidos e uma linha em Aprovações › Cotações. */
function ckCotacao(){
  const x=CK.itens[0], id='COT-'+String(11+COTACOES.length).padStart(4,'0');
  const c={id, obra:CK.obra, inv:x.id, item:x.nome, q:x.q, un:x.un, enviada:'hoje '+hora(), fecha:'amanhã 10h', resp:[], pend:['Fornecedor 1','Fornecedor 2','Fornecedor 3','Fornecedor 4','Fornecedor 5'].map((n,i)=>x.forn[i]?.n||['Cerâmica Porto Feliz','Tijolar Hortolândia','Casa do Construtor Sousas','Leroy Merlin D. Pedro','Telhanorte Barão'][i])};
  COTACOES.unshift(c);
  const l={id, inv:x.id, item:x.nome, q:num(x.q)+' '+x.un, forn:'5 fornecedores', v:Math.round(ckPreco(x)), eta:'Cotação enviada a 5 · 0 responderam · fecha amanhã 10h', col:colDe(/cota/i,0), ai:true};
  LOTES.push(l);
  registrar(`Cotação ${id} enviada a 5 fornecedores · ${x.nome} · ${l.q} · fecha amanhã 10h`, {obra:CK.obra, origem:'agente'});
  const e=LOG[0]; e.desfazer=()=>{ tirarLote(l); COTACOES.splice(COTACOES.indexOf(c),1); e.desfeito=true; };
  closeModal(); AP.aba='cotacoes'; go('aprovacoes');
  toastDesfazer('Cotação enviada a 5 fornecedores · as respostas chegam ao longo do dia', e.desfazer);
}

addCSS(`
/* Início */
.hm,.ap{max-width:1040px}
.hm-h{display:flex;align-items:center;flex-wrap:wrap;gap:var(--s2) var(--s3);margin:0 0 var(--s3)}
.hm-h h2,.hm-h2,.ap-h{margin:0}
.hm-h2{margin:var(--s6) 0 var(--s3)}
.ld-ver{color:inherit;text-decoration:none}
.ld-ver:focus-visible{text-decoration:underline}
.ld-conta .lc{font-size:var(--t-meta);line-height:1.5} .ld-conta .lc-eq{gap:2px 6px}
.ld-nota{font-size:var(--t-meta);color:var(--muted);margin-top:2px;max-width:68ch}
.ld-conta .fonte{margin-left:4px}
.hm-vazio{display:flex;align-items:center;gap:var(--s2);padding:var(--s4) 20px;background:#fff;border:1px solid var(--line);border-radius:var(--r);margin:0}
.hm-vazio .ic{color:var(--greenInk)}
.hm-st{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}
.hm-st a{display:flex;align-items:center;gap:var(--s3);padding:12px 20px;border-top:1px solid var(--line2);color:var(--ink)}
.hm-st a:first-child{border-top:0} .hm-st a span:not(.dot){color:var(--muted)} .hm-st a .ic{margin-left:auto;color:var(--muted)}
.hm-st .dot{width:8px;height:8px;border-radius:50%;flex:none}
/* barra do chat no rodapé: uma linha; abre a conversa no lugar */
.hbar{position:sticky;bottom:0;z-index:5;padding:var(--s3) var(--s6) var(--s4);background:linear-gradient(transparent,var(--bg) 40%)}
.hbar-in{display:flex;align-items:center;gap:var(--s2);width:100%;max-width:1040px;min-height:48px;padding:0 var(--s4);border:1px solid #c3cbc8;border-radius:12px;background:#fff;color:var(--ink2);font:inherit;text-align:left;box-shadow:var(--shadow)}
.hbar-in .ic:first-child{color:var(--accentInk)}
.hc{max-width:1040px;background:#fff;border:1px solid #c3cbc8;border-radius:14px;box-shadow:0 18px 50px rgba(23,32,29,.16);display:flex;flex-direction:column;max-height:min(70vh,640px);animation:sheetIn .2s var(--ease)}
.hc-top{display:flex;align-items:center;gap:var(--s2);padding:12px 16px;border-bottom:1px solid var(--line2)}
.hc-top h2{margin:0;font-size:var(--t-sec)}
.hc .hc-msgs{flex:1;padding:20px 24px;gap:20px;overscroll-behavior:contain}
.hc-chips{display:flex;gap:var(--s2);flex-wrap:wrap;padding:0 16px 8px}
.hc-comp{display:flex;align-items:flex-end;gap:var(--s2);padding:10px 12px 12px 16px;border-top:1px solid var(--line2)}
.hc-comp textarea{flex:1;border:0;outline:0;resize:none;font:15px/1.5 var(--sans);color:var(--ink);background:none;padding:8px 0;min-height:40px}
.hc-comp textarea::placeholder{color:var(--muted)}
@media (hover:hover){ .hbar-in:hover{border-color:var(--accent)} .hm-st a:hover{background:#fafbfb} .ld-ver:hover{text-decoration:underline} .ap-op:hover,.ck-op:hover{border-color:#b9c2bf} }
/* Aprovações */
.ap-h{display:flex;align-items:center;gap:var(--s2);margin:var(--s5) 0 var(--s3)}
.ap-h .dot{width:8px;height:8px;border-radius:50%}
.ap-h .mut{font:400 var(--t-meta) var(--sans)}
.ap-it{display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;border-top:1px solid var(--line2)}
.ap-it:first-child{border-top:0}
.ap-it .ld{border-top:0;padding-left:4px}
.ap-chk{display:grid;place-items:center;align-self:stretch;min-height:44px;padding-left:12px;cursor:pointer}
.ap-chk input{width:18px;height:18px;accent-color:var(--pine);margin:0;cursor:pointer}
.ap-lote{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap;min-height:52px;padding:8px 12px 8px 16px;margin:0 0 var(--s2);background:#fff;border:1px solid var(--line);border-radius:var(--r)}
.ap-lote.on{border-color:var(--accent);background:var(--accentSoft)}
.ap-meta{font-size:var(--t-meta);margin:4px 0 var(--s4);display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}
.ap-det{max-width:68ch;text-wrap:pretty;color:var(--ink2);margin:var(--s3) 0 var(--s4)}
.ap-conta{padding:var(--s3) 0;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2)}
.ap-motivos{border:0;padding:0;margin:0;display:grid;gap:var(--s2)}
.ap-motivos legend{padding:0}
.ap-op{display:flex;align-items:center;gap:var(--s3);min-height:44px;padding:0 var(--s3);border:1px solid var(--line);border-radius:8px;cursor:pointer}
.ap-op:has(input:checked){border-color:var(--accent);background:var(--accentSoft)}
.ap-op input{accent-color:var(--pine);width:18px;height:18px;margin:0}
.ap-cot{padding:20px 24px;margin-bottom:var(--s4)}
.ap-cot h2{margin:0}
.ap-rec{display:flex;align-items:center;gap:var(--s3);padding:var(--s3) 0 var(--s4);border-bottom:1px solid var(--line2)}
.ap-rec > .ic{color:var(--accentInk);flex:none;align-self:flex-start;margin-top:3px}
.ap-rec p{margin:0;flex:1;max-width:68ch;text-wrap:pretty}
.ap-tab{margin-top:var(--s2)} .ap-tab tr.rec td{background:var(--sunk)} .ap-tab .pill{margin-left:4px}
.ap-reg tr.desfeito td{color:var(--muted)}
/* Pedido de compra */
.ck-it{padding:var(--s4) 0;border-top:1px solid var(--line2)}
.ck-it:first-of-type{border-top:0;padding-top:var(--s2)}
.ck-it h3{margin:0 0 var(--s2);font-size:var(--t-sec)}
.ck-step{display:flex;align-items:center;gap:var(--s2)}
.ck-step .btn{width:44px;height:44px;padding:0}
.ck-step input.f{width:120px;height:44px;text-align:right;font-size:16px}
.ck-forn{border:0;padding:0;margin:0;display:grid;gap:6px}
.ck-forn legend{padding:0}
.ck-q{margin-bottom:var(--s3)}
.ck-step input.f::-webkit-inner-spin-button,.bx-q input.f::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.ck-step input.f,.bx-q input.f,.conf-in input.f{-moz-appearance:textfield}
.ck-op{display:grid;grid-template-columns:20px minmax(0,1fr) auto auto 96px;align-items:center;gap:var(--s3);min-height:44px;padding:6px var(--s3);border:1px solid var(--line);border-radius:8px;cursor:pointer}
.ck-op:has(input:checked){border-color:var(--accent);background:var(--accentSoft)}
.ck-op input{accent-color:var(--pine);width:18px;height:18px;margin:0}
.ck-n{font-weight:500} .ck-sug{font-weight:400;font-size:var(--t-meta);color:var(--accentInk)}
.ck-p,.ck-t{text-align:right;white-space:nowrap} .ck-pz{color:var(--muted);white-space:nowrap} .ck-t{font-weight:600}
.ck-fatos{margin:var(--s2) 0 0;padding:var(--s3) 0 0;border-top:1px solid var(--line2);display:grid;gap:4px}
.ck-fatos div{display:grid;grid-template-columns:110px 1fr;gap:var(--s3)} .ck-fatos dt{color:var(--muted)} .ck-fatos dd{margin:0}
.ck-sim{border:0;background:none;padding:0;font:inherit;color:var(--accentInk);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ck-alc{display:flex;align-items:center;gap:var(--s2);margin:var(--s3) 0 0;font-weight:500}
.ck-alc.t-ok{color:var(--greenInk)} .ck-alc.t-pede{color:var(--amberInk)}
.pdf{padding:var(--s4) 0;border-top:1px solid var(--line2)}
.pdf-rz{font-family:var(--serif);font-size:var(--t-sec)}
`);
