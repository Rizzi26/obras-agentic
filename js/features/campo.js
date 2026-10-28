/* WhatsApp do mestre (áudio/foto vira baixa + diário + atraso) e recebimento por NF-e. */

/* ---------- dados próprios da conversa ---------- */
const CAMPO = {st:'pendente', corrigindo:false, blocos:180, quebra:15, cim:6, play:false, pos:0, antes:null};
const AUDIO_TXT = 'Hoje assentamos 180 blocos no eixo B, uns 15 quebraram. Choveu das 3 às 5, parou tudo. Gastei 6 sacos de cimento na argamassa. Aço da Gerdau nada ainda.';

/* item do almoxarifado por id; o bloco é o caso-vitrine do plano (cria se data.js ainda não tiver) */
function invItem(id){
  let i=INV.find(x=>x.id===id);
  if(!i && id==='bloco'){ i={id:'bloco', nome:'Bloco cerâmico 14×19×29', un:'un', ent:4000, sai:1240, nec:15000, cob:'12 dias', st:'warn'}; INV.push(i); }
  return i;
}
const saldo = id => { const i=invItem(id); return i? i.ent-i.sai : 0; };
const fmt = n => n.toLocaleString('pt-BR');
/* Grava pelo contrato do core (baixar / darEntrada) quando existir; senão mexe direto no INV.
   Devolve uma função que desfaz tudo (item, lote e movimentações). */
function fotoDe(...objs){ const c=objs.filter(Boolean).map(o=>[o,Array.isArray(o)?[...o]:{...o}]);
  return ()=>c.forEach(([o,v])=>{ if(Array.isArray(o)){o.length=0;o.push(...v);} else {Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,v);} }); }
const movDe = id => typeof MOV!=='undefined' && MOV ? (MOV[id] = MOV[id]||[]) : null;
function gravarBaixa(invId, q, onde, quem){
  const i=invItem(invId), volta=fotoDe(i, movDe(invId));
  if(typeof baixar==='function') baixar('vila-nova', invId, q, onde, quem); else i.sai+=q;
  return volta;
}
const curvaDe = it => it.abc || CURVA[it.id] || 'C';
const faseAlv = () => FASES.find(f=>f.n.startsWith('Alvenaria'));
/* Avanço lido dos dados: blocos assentados = saídas de MOV.bloco (sem quebra); total da obra = saído + a usar (INV)
   ou COMP. A fase "Alvenaria e reboco" cresce na mesma proporção dos blocos (reboco ainda não começou). */
function avanco(b){
  const i=invItem('bloco'), m=movDe('bloco')||[], f=faseAlv();
  const A=CAMPO.antes?CAMPO.antes.assent:(m.filter(x=>x.t==='Saída').reduce((s,x)=>s-x.q,0)||1050);
  const total=i.nec!=null?(CAMPO.antes?CAMPO.antes.total:i.sai+i.nec):(COMP.find(c=>c.id==='bloco')||{}).qtd;
  const p0=CAMPO.antes?CAMPO.antes.fp:(f?f.pct:6);
  return {A, total, p0, p1:Math.round(p0*(A+b)/A)};
}

ICONS.mic = '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>';
ICONS.play = '<path d="M6 3l14 9-14 9V3z"/>';
ICONS.pause = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
ICONS.phone = '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>';
ICONS.receipt = '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6"/><path d="M16 12H8"/><path d="M13 16H8"/>';
ICONS.checks = '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>';

/* ---------- peças visuais ---------- */
const fotoNF = () => `<div class="wa-nf"><div class="h"><b>DANFE</b><span>NF-e 000.418.233</span></div>
  <div>PORTO DE AREIA JAGUARI LTDA</div><div class="mut">Paulínia · SP</div>
  <div class="ln"><span>Areia média lavada</span><span>40,000 M3</span></div><div class="ln"><span>Vl. unit. 118,00</span><span>4.720,00</span></div>
  <div class="ln tot"><span>TOTAL</span><span>R$ 4.720,00</span></div><div class="bc"></div></div>`;
const fotoServico = () => `<div class="wa-wall" role="img" aria-label="Foto da alvenaria do eixo B"><i></i><span>Eixo B · térreo</span></div>`;
const onda = () => Array.from({length:34},(_,k)=>`<i style="height:${6+Math.round(Math.abs(Math.sin(k*1.7)+Math.sin(k*.6))*7)}px" class="${k/34<CAMPO.pos?'on':''}"></i>`).join('');

function waAudio(){
  return `<div class="wa-audio"><button class="wa-play" onclick="campoPlay()" aria-label="${CAMPO.play?'Pausar':'Ouvir'} áudio">${icon(CAMPO.play?'pause':'play',16)}</button>
    <div class="wa-onda" id="waOnda">${onda()}</div><span class="wa-dur">0:24</span></div>
    <div class="wa-transc"><span>${icon('file',12)}Transcrição</span>"${AUDIO_TXT}"</div>`;
}
function campoPlay(){
  CAMPO.play=!CAMPO.play; clearInterval(CAMPO._t);
  if(CAMPO.play){ if(CAMPO.pos>=1) CAMPO.pos=0;
    CAMPO._t=setInterval(()=>{ CAMPO.pos+=1/48; if(CAMPO.pos>=1){CAMPO.pos=1; CAMPO.play=false; clearInterval(CAMPO._t); toast('Áudio de 0:24 (protótipo: sem som; a transcrição está abaixo)'); render(); return;}
      const w=$('waOnda'); if(w) w.innerHTML=onda(); else clearInterval(CAMPO._t); },500); }
  render();
}

const wa = (lado, hora, html, extra='') => `<div class="wa-m ${lado} ${extra}"><div class="wa-b">${html}<span class="wa-h">${hora}${lado==='eu'?icon('checks',13):''}</span></div></div>`;

function entendi(){
  const b=CAMPO.blocos, q=CAMPO.quebra, tot=b+q, sb=CAMPO.antes?CAMPO.antes.bloco:saldo('bloco'), sc=CAMPO.antes?CAMPO.antes.cim:saldo('cim'), pq=Math.round(q/tot*100), av=avanco(b);
  return `<b>Entendi isto do seu áudio e das fotos:</b>
  <ol class="wa-ol">
    <li><b>Baixa de ${tot} blocos</b> (${b} assentados + ${q} de quebra) · alvenaria do térreo, eixo B. Saldo ${fmt(sb)} → <b>${fmt(sb-tot)}</b>.<br><span class="wa-obs">Quebra hoje ${pq}%, contra 5% previsto.</span></li>
    <li><b>Baixa de ${CAMPO.cim} sc de cimento</b> · argamassa da alvenaria do térreo. Saldo ${sc} → <b>${sc-CAMPO.cim} sc</b>.</li>
    <li><b>RDO de 28/10</b>: 7 pessoas (você, Equipe Silva 4, Carlos, 1 ajudante) · manhã de sol, chuva forte 15h–17h · ${b} blocos no eixo B · foto anexada.</li>
    <li><b>Causa de atraso: clima</b> · alvenaria parada 2 h.</li>
    <li><b>Avanço da alvenaria</b>: ${av.p0}% → ${av.p1}% (blocos assentados ${fmt(av.A)} → ${fmt(av.A+b)} de ${fmt(av.total)}).</li>
    <li><b>Aço Gerdau (PED-0158)</b>: segue sem data, 9 dias atrasado. Saldo de 140 kg dá até ~30/10.</li>
  </ol>`;
}

function conversa(){
  const c=CAMPO;
  let h = `<div class="wa-dia">hoje</div>
    ${wa('eu','17:31',`${fotoNF()}<div>Chegou a areia. Medi na caçamba, deu 36</div>`)}
    ${wa('ag','17:31',`Li a NF-e da <b>Porto Jaguari (PED-0157)</b>: 40 m³ de areia média, R$ 4.720. Você mediu 36 m³ → faltam <b>4 m³ = R$ 472</b> a abater do boleto.
      <div class="wa-acts"><button class="wa-btn pri" onclick="openConferencia('PED-0157')">Conferir recebimento</button></div>`)}
    ${wa('eu','17:40',waAudio())}
    ${wa('eu','17:41',`${fotoServico()}`)}`;
  if(c.st==='pendente' && !c.corrigindo){
    h += wa('ag','17:41',`${entendi()}<div class="wa-q">Posso gravar?</div>
      <div class="wa-acts"><button class="wa-btn pri" onclick="campoConfirmar()">${icon('check',14)}Confirmar</button><button class="wa-btn" onclick="CAMPO.corrigindo=true;render()">Corrigir</button></div>`);
  } else if(c.corrigindo){
    h += wa('ag','17:41',`${entendi()}`);
    h += wa('ag','17:42',`O que ficou errado? Ajuste aqui ou mande outro áudio.
      <div class="wa-fix"><label>Blocos assentados<input type="number" min="0" value="${c.blocos}" id="cfB"></label>
        <label>Blocos quebrados<input type="number" min="0" value="${c.quebra}" id="cfQ"></label>
        <label>Cimento (sc)<input type="number" min="0" value="${c.cim}" id="cfC"></label></div>
      <div class="wa-acts"><button class="wa-btn pri" onclick="campoAjustar()">${icon('check',14)}Confirmar com ajuste</button><button class="wa-btn" onclick="CAMPO.corrigindo=false;render()">Cancelar</button></div>`);
  } else {
    h += wa('ag','17:41',entendi(),'feito');
    h += wa('eu','17:42','Confirmar');
    h += wa('ag','17:42',`<b>Gravado.</b> Blocos: saldo <b>${fmt(saldo('bloco'))}</b> · cimento: <b>${saldo('cim')} sc</b> (120 sc chegam 30/10, PED-0160). RDO de hoje preenchido.
      <div class="wa-acts"><button class="wa-btn pri" onclick="go('obra','vila-nova','diario')">${icon('book',14)}Abrir RDO de 28/10</button><button class="wa-btn" onclick="go('obra','vila-nova','inventario')">Ver almoxarifado</button></div>`);
  }
  return h;
}

/* ---------- gravar de verdade ---------- */
function campoAjustar(){
  const n=id=>Math.max(0,parseInt($(id).value,10)||0);
  CAMPO.blocos=n('cfB'); CAMPO.quebra=n('cfQ'); CAMPO.cim=n('cfC'); CAMPO.corrigindo=false;
  registrar(`Corrigiu a leitura do áudio: ${CAMPO.blocos} blocos + ${CAMPO.quebra} quebra, ${CAMPO.cim} sc cimento`, {obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'});
  campoConfirmar();
}
function campoConfirmar(){
  const b=invItem('bloco'), ci=invItem('cim'), f=faseAlv(), tot=CAMPO.blocos+CAMPO.quebra;
  const fp=f?f.pct:null, av=avanco(CAMPO.blocos); CAMPO.antes={bloco:saldo('bloco'), cim:saldo('cim'), assent:av.A, total:av.total, fp:av.p0};
  const v1=gravarBaixa('bloco', tot, 'Alvenaria do térreo · eixo B', 'Joana M. (WhatsApp)');
  const v2=ci?gravarBaixa('cim', CAMPO.cim, 'Argamassa · alvenaria do térreo', 'Joana M. (WhatsApp)'):()=>{};
  if(f && f.pct<av.p1) f.pct=av.p1;
  const o={obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'};
  registrar(`Baixa de ${tot} blocos (${CAMPO.blocos} + ${CAMPO.quebra} de quebra) · alvenaria do térreo, eixo B`, o);
  registrar(`Baixa de ${CAMPO.cim} sc de cimento · argamassa da alvenaria do térreo`, o);
  registrar('RDO de 28/10 preenchido pelo áudio · chuva 15h–17h parou a alvenaria 2 h (causa de atraso: clima)', o);
  /* RDO do dia (aba Diário, do Dev Gestão): grava o que a Joana disse; desfaz pelo retorno ou por {desfazer:true} */
  const fonte='áudio da Joana 17h40', temRDO=typeof atualizarRDO==='function';
  const rdo=temRDO ? atualizarRDO('28/10', {
    servicos:[{txt:`Alvenaria do térreo · eixo B: ${CAMPO.blocos} blocos assentados`, fonte}],
    insumos:[{txt:`Bloco cerâmico 14×19×29: ${tot} un (${CAMPO.blocos} + ${CAMPO.quebra} de quebra)`, fonte}, {txt:`Cimento CP-II: ${CAMPO.cim} sc na argamassa`, fonte}],
    ocorrencias:[{txt:'Chuva forte 15h–17h parou a alvenaria por 2 h (causa de atraso: clima)', fonte}, {txt:'Aço da Gerdau (PED-0158) não chegou', fonte}]}) : null;
  const v3=()=>{ if(!temRDO) return; if(typeof rdo==='function') rdo(); else atualizarRDO('28/10', null, {desfazer:true}); };
  CAMPO.st='gravado'; render();
  toastDesfazer(`Gravado: ${tot} blocos e ${CAMPO.cim} sc de cimento · RDO de 28/10`, ()=>{
    v3(); v2(); v1(); if(f) f.pct=fp; CAMPO.st='pendente'; CAMPO.antes=null; });
}

/* ---------- tela ---------- */
VIEWS.campo = () => {
  const lote=LOTES.find(l=>l.id==='PED-0157');
  return `<div class="top campo-top"><div><div class="crumb">Casa Vila Nova · mestre de obras</div><h1>Campo · WhatsApp</h1></div></div>
  <div class="page campo-page">
    <div class="campo-wrap">
      <div class="phone"><div class="phone-in">
        <div class="wa-top"><div class="wa-av">${icon('spark',18)}</div><div><b>Canteiro</b><small>agente da Casa Vila Nova</small></div><span class="sp"></span>
          <button class="wa-ico" onclick="openBaixa()" aria-label="Registrar saída sem áudio">${icon('minus',18)}</button></div>
        <div class="wa-body" id="waBody">${conversa()}</div>
        <div class="wa-comp"><button class="wa-ico" onclick="toast('Abre a câmera para foto de NF ou de serviço (protótipo)')" aria-label="Foto">${icon('camera',20)}</button>
          <div class="wa-inp">Mensagem</div><button class="wa-mic" onclick="toast('Segure para gravar um áudio (protótipo)')" aria-label="Gravar áudio">${icon('mic',20)}</button></div>
      </div></div>
      <div class="campo-side">
        <div class="card agentnote inline" style="font-size:13.5px">${icon('spark',16)}<div><b>Sem formulário.</b> A Joana manda áudio e foto pelo WhatsApp, como já faz hoje. O agente transforma em baixa no almoxarifado, RDO, causa de atraso e avanço, e só grava depois que ela confirma.</div></div>
        <div class="card"><h3>${icon('file',17)}O que esta conversa alimenta</h3>
          <div class="campo-li">${icon('archive',15)}<div><b>Almoxarifado</b><div class="sm mut">Bloco: saldo ${fmt(saldo('bloco'))} un · cimento: ${saldo('cim')} sc</div></div><span class="sp"></span><span class="pill ${CAMPO.st==='gravado'?'ok':'warn'}">${CAMPO.st==='gravado'?'gravado':'aguarda a Joana'}</span></div>
          <div class="campo-li">${icon('book',15)}<div><b>RDO de 28/10</b><div class="sm mut">clima, efetivo, serviço do dia, foto</div></div><span class="sp"></span><a class="link" href="#" onclick="go('obra','vila-nova','diario');return false">abrir</a></div>
          <div class="campo-li">${icon('clock',15)}<div><b>Causas de atraso</b><div class="sm mut">clima · alvenaria parada 2 h hoje</div></div></div>
          <div class="campo-li">${icon('receipt',15)}<div><b>Recebimento PED-0157</b><div class="sm mut">${lote&&lote.conf?lote.eta:'40 m³ na NF, 36 recebidos · R$ 472 a abater'}</div></div><span class="sp"></span><a class="link" href="#" onclick="openConferencia('PED-0157');return false">conferir</a></div>
        </div>
        ${val('A Joana manda áudio no fim do dia ou ao longo dele? Confirmar no WhatsApp (um toque) é aceitável, ou ela prefere que grave direto e avise?')}
        <p class="sm mut">${icon('phone',14)} Abra esta tela no celular: ela funciona em tela cheia, como a Joana vê.</p>
      </div>
    </div></div>`;
};
NAV_EXTRA.push({view:'campo', icon:'phone', label:'Campo · WhatsApp', count:()=>CAMPO.st==='pendente'?1:0});
ICONS.book = ICONS.book || '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>';

/* rola a conversa para o fim e libera a rota no celular */
document.addEventListener('rendered',()=>{
  document.body.classList.toggle('campo-mode', state.view==='campo');
  const w=$('waBody'); if(w && !CAMPO.play) w.scrollTop=w.scrollHeight;
});

/* ---------- recebimento por NF-e ---------- */
const INV_DO_LOTE = l => /areia/i.test(l.item)?'areia':/cimento/i.test(l.item)?'cim':/bloco/i.test(l.item)?'bloco':/brita/i.test(l.item)?'brita':/parafuso/i.test(l.item)?'paraf':/prego/i.test(l.item)?'prego':/vergalh|aço/i.test(l.item)?'aco':null;
function openConferencia(idLote){
  const l=LOTES.find(x=>x.id===idLote); if(!l){ toast('Pedido não encontrado'); return; }
  closeDrawer();
  const {qn, un} = qtdLote(l), areia = idLote==='PED-0157', rec = l.medido ?? (areia?36:qn);
  if(l.conf){
    $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('checkCircle',22)}Recebimento ${l.id} já conferido</h2><div class="mut">${l.item} · ${l.eta}</div>
      <div class="row" style="margin-top:22px"><span class="sp"></span><button class="btn" onclick="closeModal()">Fechar</button></div>`;
    $('modal').classList.add('on'); return;
  }
  $('modalBox').innerHTML = `<h2 style="margin:0 0 6px">${icon('receipt',22)}Conferir recebimento · ${l.id}</h2>
    <div class="mut sm">${l.item} · ${l.forn} · conferido por Joana M. (mestre), que recebe na obra</div>
    <div class="conf-src">
      <div class="conf-nf">${fotoNF().replace('Areia média lavada', areia?'Areia média lavada':l.item).replace('40,000 M3', areia?'40,000 M3':(fmt(qn)+' '+un).toUpperCase()).replace(/4\.720,00/g, l.v.toLocaleString('pt-BR',{minimumFractionDigits:2}))}</div>
      <div class="sm"><div class="row" style="gap:6px">${icon('spark',14)}<b>O agente leu a NF-e</b></div>
        <div class="mut" style="margin:4px 0 10px">Foto da DANFE enviada no WhatsApp às 17:31 · chave conferida na SEFAZ (35261009…4418)</div>
        <button class="btn sm" onclick="toast('Colar chave de 44 dígitos ou anexar XML (protótipo)')">${icon('upload',14)}Chave ou XML</button>
        ${areia?`<div class="row" style="gap:6px;margin-top:12px">${icon('camera',14)}<span>Foto da caçamba: 36 m³ medidos</span></div>`:''}</div>
    </div>
    <div class="card" style="padding:0;margin-top:16px"><table class="conf-tab">
      <tr><th>Item</th><th class="num">Pedido</th><th class="num">Na NF</th><th class="num">Recebido</th><th class="num">Diferença</th></tr>
      <tr><td><b>${l.item}</b></td><td class="num">${fmt(qn)} ${un}</td><td class="num">${fmt(qn)} ${un}</td>
        <td class="num"><input class="f conf-q" id="confRec" type="number" value="${rec}" oninput="confCalc('${l.id}')"></td><td class="num" id="confDif"></td></tr>
    </table></div>
    <div id="confMsg" style="margin-top:14px"></div>
    <div class="row conf-acts" style="margin-top:20px;flex-wrap:wrap"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="confAceitar" onclick="confGravar('${l.id}',false)">Aceitar e dar entrada</button>
      <button class="btn amb" id="confDiv" onclick="confGravar('${l.id}',true)">Registrar divergência e abater do boleto</button></div>`;
  $('modal').classList.add('on'); confCalc(idLote);
}
const qtdLote = l => ({qn: l.qn ?? parseFloat(l.q.replace(/\./g,'').replace(',','.')), un: l.un || l.q.replace(/^[\d.,]+\s*/,'')});
function confDados(id){
  const l=LOTES.find(x=>x.id===id), {qn,un}=qtdLote(l);
  const rec=Math.max(0,parseFloat($('confRec').value)||0), dif=qn-rec, abat=Math.round(Math.max(0,dif)*l.v/qn);
  return {l,qn,un,rec,dif,abat};
}
function confCalc(id){
  const {un,dif,abat,l,qn}=confDados(id);
  $('confDif').innerHTML = dif>0?`<b style="color:var(--red)">−${fmt(dif)} ${un}</b>`:dif<0?`<b>+${fmt(-dif)} ${un}</b>`:'<span class="pill ok">bate</span>';
  $('confMsg').innerHTML = dif>0
    ? `<div class="card alertnote inline" style="font-size:13px;padding:12px 14px">${icon('alert',15)}<div><b>Faltam ${fmt(dif)} ${un}</b> × ${brl(Math.round(l.v/qn))} = <b>${brl(abat)}</b> a abater do boleto de ${brl(l.v)} (fica ${brl(l.v-abat)}). A foto vai junto para o fornecedor.</div></div>`
    : `<div class="sm mut">Quantidade confere com a NF. A entrada vai para o almoxarifado.</div>`;
  $('confDiv').style.display = dif>0?'':'none';
}
function confGravar(id, abater){
  const {l,qn,un,rec,dif,abat}=confDados(id), invId=l.inv||INV_DO_LOTE(l), i=invItem(invId), div=abater&&dif>0;
  const volta=fotoDe(l, i, movDe(invId));
  const eta=`no almoxarifado · ${fmt(rec)} ${un} recebidos`+(div?` · ${brl(abat)} abatidos do boleto`:'');
  if(typeof darEntrada==='function') darEntrada(id, rec, div?{divergencia:`${fmt(dif)} ${un} a menos que a NF · ${brl(abat)} abatidos do boleto (foto da caçamba)`}:{});
  else { if(i) i.ent+=rec; l.col=KCOLS.length-1; l.conf=true; if(div) l.v-=abat; }
  l.eta=eta; if(div) l.abatido=abat;
  registrar(`Recebimento ${l.id} · ${l.item}: ${fmt(rec)} ${un} de ${fmt(qn)} ${un} na NF`+(abater&&dif>0?` · divergência registrada, ${brl(abat)} abatidos do boleto`:dif>0?' · aceito sem abatimento':''), {obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'});
  closeModal(); render();
  toastDesfazer(abater&&dif>0?`Entrada de ${fmt(rec)} ${un} · ${brl(abat)} a abater do boleto`:`Entrada de ${fmt(rec)} ${un} no almoxarifado`, volta);
}

/* ---------- registrar saída em 3 toques ---------- */
const CURVA = {aco:'A', bloco:'A', cim:'A', concreto:'A', porc:'A', areia:'B', brita:'B', prego:'C', paraf:'C'};
const BX_ULT = {bloco:195, cim:6, areia:2, brita:1, prego:3, paraf:40, aco:20};
const BX_FRENTES = ['Alvenaria do térreo · eixo B','Alvenaria do térreo · eixo C','Formas da laje do 2º pav.','Estrutura · pilares','Reboco interno'];
let BX = {item:'bloco', frente:BX_FRENTES[0]};
function openBaixa(item){
  closeDrawer(); if(item) BX.item=item;
  const usados=['bloco','cim','areia','prego','paraf','brita'].map(invItem).filter(Boolean);
  const it=invItem(BX.item)||usados[0], a=curvaDe(it)==='A';
  $('modalBox').innerHTML = `<h2 style="margin:0 0 4px">Registrar saída</h2><div class="mut sm">3 toques: item, quantidade, frente de serviço.</div>
    <label class="l">1 · Item <span class="mut">(os mais usados)</span></label>
    <div class="bx-chips">${usados.map(x=>`<button class="bx-chip ${x.id===it.id?'on':''}" onclick="BX.item='${x.id}';openBaixa()">${x.nome.replace(/ 50 kg| 14×19×29| 5\/16" × 2"/,'')}<small>saldo ${fmt(x.ent-x.sai)} ${x.un}</small></button>`).join('')}</div>
    <label class="l">2 · Quantidade <span class="mut">(a última foi ${BX_ULT[it.id]||1})</span></label>
    <div class="row" style="gap:8px"><input class="f" id="bxQ" type="number" min="1" inputmode="numeric" value="${BX_ULT[it.id]||1}" style="max-width:140px;font-size:17px"><span class="mut">${it.un} · saldo ${fmt(it.ent-it.sai)}</span></div>
    ${a?`<label class="l">3 · Frente de serviço <span class="pill warn" style="margin-left:4px">obrigatório · item curva A</span></label>
      <div class="bx-chips">${BX_FRENTES.map(f=>`<button class="bx-chip ${f===BX.frente?'on':''}" onclick="BX.frente=this.dataset.f;openBaixa()" data-f="${f}">${f}</button>`).join('')}</div>`
      :`<div class="sm mut" style="margin-top:14px">${icon('info',13)} Item curva ${curvaDe(it)}: sem destino. O controle é pela contagem semanal.</div>`}
    <div class="bx-wa">${icon('mic',16)}<span>Ou mande um áudio no WhatsApp: "usei 6 sacos de cimento na alvenaria".</span><a class="link" href="#" onclick="closeModal();go('campo');return false">abrir</a></div>
    <div class="row" style="margin-top:18px"><span class="sp"></span><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn amb" onclick="bxGravar()">Registrar saída</button></div>`;
  $('modal').classList.add('on');
}
function bxGravar(){
  const it=invItem(BX.item), q=Math.max(0,parseInt($('bxQ').value,10)||0), a=curvaDe(it)==='A';
  if(!q){ toast('Informe a quantidade'); return; }
  if(q>it.ent-it.sai){ toast(`Saldo é ${fmt(it.ent-it.sai)} ${it.un}`); return; }
  const volta=gravarBaixa(it.id, q, a?BX.frente:'—', 'Rizzi'); BX_ULT[it.id]=q;
  registrar(`Baixa de ${fmt(q)} ${it.un} · ${it.nome}`+(a?` · ${BX.frente}`:''), {obra:'vila-nova'});
  closeModal(); render();
  toastDesfazer(`Saída de ${fmt(q)} ${it.un} registrada · saldo ${fmt(it.ent-it.sai)}`, volta);
}

/* ---------- estilo ---------- */
addCSS(`
.campo-wrap{display:grid;grid-template-columns:400px minmax(280px,440px);gap:36px;align-items:start}
.phone{width:400px;height:min(780px,calc(100vh - 150px));min-height:560px;border-radius:44px;background:#121816;padding:12px;box-shadow:0 30px 60px rgba(26,32,30,.18)}
.phone-in{height:100%;border-radius:34px;overflow:hidden;display:flex;flex-direction:column;background:#ece5dd}
.wa-top{display:flex;align-items:center;gap:10px;padding:14px 14px 10px;background:var(--pine);color:#fff}
.wa-top small{display:block;font-size:11.5px;color:#b9c7c2;font-weight:400}
.wa-av{width:34px;height:34px;border-radius:50%;background:var(--accent);color:var(--pine);display:grid;place-items:center;flex:none}
.wa-ico{border:0;background:none;color:inherit;padding:6px;border-radius:50%;display:grid;place-items:center}
.wa-body{flex:1;overflow:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.45}
.wa-dia{align-self:center;background:#fff;border-radius:8px;padding:2px 10px;font-size:11.5px;color:var(--muted);margin-bottom:4px}
.wa-m{display:flex} .wa-m.eu{justify-content:flex-end}
.wa-b{max-width:86%;background:#fff;border-radius:10px;padding:7px 9px 5px;box-shadow:0 1px 1px rgba(0,0,0,.08);position:relative}
.wa-m.eu .wa-b{background:#e2f0d9}
.wa-m.feito .wa-b{opacity:.75}
.wa-h{display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:10.5px;color:var(--faint);margin-top:2px}
.wa-h .ic{color:#4f9bd9}
.wa-ol{margin:6px 0 0;padding-left:18px} .wa-ol li{margin:0 0 6px}
.wa-obs{color:var(--red);font-size:12.5px}
.wa-q{margin-top:4px;font-weight:600}
.wa-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.wa-btn{border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 13px;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:5px}
.wa-btn.pri{background:var(--pine);color:#fff;border-color:var(--pine)}
.wa-audio{display:flex;align-items:center;gap:8px;min-width:230px}
.wa-play{width:34px;height:34px;border-radius:50%;border:0;background:var(--pine);color:#fff;display:grid;place-items:center;flex:none}
.wa-onda{display:flex;align-items:center;gap:2px;height:30px;flex:1} .wa-onda i{width:3px;border-radius:2px;background:#a9b9b2} .wa-onda i.on{background:var(--pine)}
.wa-dur{font-size:11.5px;color:var(--muted)}
.wa-transc{margin-top:6px;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.65);font-size:12.5px;color:var(--ink2);font-style:italic}
.wa-transc span{display:flex;align-items:center;gap:4px;font-style:normal;font-size:11px;color:var(--muted);font-weight:600;margin-bottom:2px}
.wa-nf{background:#fbfbf8;border:1px solid #ddd;border-radius:6px;padding:8px 10px;font:11px/1.45 ui-monospace,Menlo,monospace;color:#333;margin-bottom:6px;transform:rotate(-1deg)}
.wa-nf .h{display:flex;justify-content:space-between;border-bottom:1px dashed #bbb;padding-bottom:3px;margin-bottom:3px}
.wa-nf .ln{display:flex;justify-content:space-between;gap:10px} .wa-nf .tot{border-top:1px dashed #bbb;margin-top:3px;padding-top:3px;font-weight:700}
.wa-nf .bc{height:16px;margin-top:6px;background:repeating-linear-gradient(90deg,#333 0 2px,transparent 2px 4px,#333 4px 5px,transparent 5px 8px)}
.wa-wall{width:240px;height:150px;border-radius:7px;position:relative;overflow:hidden;background:linear-gradient(#b9c6cf 0 38%,transparent 38%)}
.wa-wall i{position:absolute;left:0;right:0;bottom:0;height:62%;background:
  repeating-linear-gradient(0deg,#d8d2c4 0 3px,transparent 3px 22px),
  repeating-linear-gradient(90deg,#d8d2c4 0 3px,transparent 3px 44px),#b5643f}
.wa-wall span{position:absolute;left:8px;bottom:6px;color:#fff;font-size:11px;background:rgba(0,0,0,.4);padding:1px 6px;border-radius:5px}
.wa-fix{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px} .wa-fix label{font-size:11.5px;color:var(--muted)}
.wa-fix input{width:100%;margin-top:2px;padding:6px;border:1px solid var(--line);border-radius:7px;font:inherit;font-size:14px}
.wa-comp{display:flex;align-items:center;gap:6px;padding:8px;background:#f0f0f0}
.wa-inp{flex:1;background:#fff;border-radius:99px;padding:8px 14px;color:var(--faint)}
.wa-mic{width:40px;height:40px;border-radius:50%;border:0;background:var(--pine);color:#fff;display:grid;place-items:center}
.campo-side{display:flex;flex-direction:column;gap:16px}
.campo-side .card{margin:0} .campo-side .callout{margin:0}
.campo-li{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line2)} .campo-li:first-of-type{border-top:0}
.campo-li > .ic{margin-top:3px;color:var(--muted)}
.conf-src{display:grid;grid-template-columns:230px 1fr;gap:18px;margin-top:18px;align-items:start}
.conf-nf .wa-nf{transform:none;margin:0}
input.f.conf-q{width:90px;text-align:right;padding:5px 8px}
.bx-chips{display:flex;flex-wrap:wrap;gap:8px}
.bx-chip{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;text-align:left;font-size:13.5px;font-weight:500}
.bx-chip small{display:block;font-weight:400;color:var(--muted);font-size:11.5px}
.bx-chip.on{border-color:var(--accent);background:var(--accentSoft);color:var(--accentInk)}
.bx-wa{display:flex;align-items:center;gap:8px;margin-top:20px;padding:10px 12px;border-radius:10px;background:var(--pineSoft);font-size:13px}
.bx-wa .link{margin-left:auto}
/* celular: só a rota #campo passa pelo aviso de "abra num computador", em tela cheia, sem sidebar */
@media (max-width:1099px){
  body.campo-mode #gate{display:none!important}
  body.campo-mode .app{display:block!important;height:100vh;height:100dvh}
  body.campo-mode .side,body.campo-mode .campo-top,body.campo-mode .campo-side{display:none}
  body.campo-mode .main{height:100%}
  body.campo-mode .page.campo-page{padding:0;height:100%}
  body.campo-mode .campo-wrap{display:block;height:100%}
  body.campo-mode .phone{width:100%;height:100%;min-height:0;border-radius:0;padding:0;box-shadow:none}
  body.campo-mode .phone-in{border-radius:0}
  body.campo-mode .modal.on{display:grid!important} body.campo-mode .drawer.on{display:flex!important}
  body.campo-mode .toast[style*="block"]{display:block!important;width:max-content;max-width:92vw}
  body.campo-mode .modal .box{padding:22px 18px;max-height:94vh}
  body.campo-mode .conf-src{grid-template-columns:1fr}
  body.campo-mode .conf-tab th,body.campo-mode .conf-tab td{padding:8px 6px;font-size:12.5px}
  body.campo-mode input.f.conf-q{width:58px}
  body.campo-mode .conf-acts .btn{flex:1 1 100%;justify-content:center}
}
`);
