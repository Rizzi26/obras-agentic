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

const wa = (lado, hora, html, extra='') => `<div class="wa-m ${lado} ${extra}"><div class="wa-b">${html}<span class="wa-h">${hora}${lado==='eu'?icon('checks',14):''}</span></div></div>`;

/* ---------- o que o agente entendeu: "Vou gravar" (cada linha sai com um toque) e "Para você saber" ---------- */
CAMPO.fora = new Set();
function itensGravar(){
  const b=CAMPO.blocos, q=CAMPO.quebra, tot=b+q, A=CAMPO.antes, sb=A?A.bloco:saldo('bloco'), sc=A?A.cim:saldo('cim'), av=avanco(b);
  return [
    {k:'bloco', tit:`Bloco −${fmt(tot)}`, det:`${b} assentados + ${q} quebrados · eixo B · saldo ${fmt(sb)} → ${fmt(sb-tot)}`},
    {k:'cim', tit:`Cimento −${CAMPO.cim} sc`, det:`argamassa da alvenaria · saldo ${sc} → ${sc-CAMPO.cim} sc`},
    {k:'rdo', tit:'RDO de 28/10', det:`7 pessoas · sol de manhã, chuva 15h–17h · ${b} blocos no eixo B · foto`},
    {k:'atraso', tit:'Atraso: clima', det:'alvenaria parada 2 h pela chuva'},
    {k:'avanco', tit:`Alvenaria ${av.p0}% → ${av.p1}%`, det:`${fmt(av.A)} → ${fmt(av.A+b)} de ${fmt(av.total)} blocos assentados`},
  ];
}
const vai = k => !CAMPO.fora.has(k);
function campoTirar(k){ CAMPO.fora.has(k)?CAMPO.fora.delete(k):CAMPO.fora.add(k); render(); }
function entendi(editavel){
  const q=CAMPO.quebra, pq=Math.round(q/(CAMPO.blocos+q)*100), its=itensGravar();
  return `${pq>5?`<div class="wa-alerta">${icon('alert',16)}<span>Quebra hoje <b>${pq}%</b>, contra 5% previsto</span></div>`:''}
  <div class="wa-sec">${editavel?'Vou gravar':'Gravado'}</div>
  <ul class="wa-grav">${its.filter(x=>editavel||vai(x.k)).map(x=>`<li class="${vai(x.k)?'':'fora'}"><div><b>${x.tit}</b><span>${x.det}</span></div>${editavel?`<button type="button" class="wa-x" onclick="campoTirar('${x.k}')" aria-label="${vai(x.k)?'Não gravar':'Gravar de novo'}: ${x.tit}">${vai(x.k)?icon('x',18):'voltar'}</button>`:''}</li>`).join('')}</ul>
  <div class="wa-sec">Para você saber</div>
  <p class="wa-saber">Aço da Gerdau (PED-0158) segue sem data, 9 dias atrasado. O saldo de 140 kg dá até ~30/10.</p>`;
}

function conversa(){
  const c=CAMPO, n=itensGravar().filter(x=>vai(x.k)).length;
  let h = `<div class="wa-dia">hoje</div>
    ${wa('eu','17:31',`${fotoNF()}<div>Chegou a areia. Medi na caçamba, deu 36</div>`)}
    ${wa('ag','17:31',`Li a NF-e da <b>Porto Jaguari (PED-0157)</b>: 40 m³ de areia média, R$ 4.720. Você mediu 36 m³ → faltam <b>4 m³ = R$ 472</b> a abater do boleto.
      <div class="wa-acts"><button class="wa-btn pri" onclick="openConferencia('PED-0157')">Conferir a NF</button></div>`)}
    ${wa('eu','17:40',waAudio())}
    ${wa('eu','17:41',`${fotoServico()}`)}`;
  if(c.st==='pendente' && !c.corrigindo){
    h += wa('ag','17:41',`<b>Entendi isto do seu áudio e das fotos.</b> Toque no × para tirar o que não vale.${entendi(true)}
      <div class="wa-acts col"><button class="wa-btn pri big" onclick="campoConfirmar()"${n?'':' disabled'}>${icon('check',18)}${n?`Confirmar e gravar ${n}`:'Nada para gravar'}</button><button class="wa-btn" onclick="CAMPO.corrigindo=true;render()">Corrigir os números</button></div>`);
  } else if(c.corrigindo){
    const passo=(id,l,v)=>`<div class="wa-fix-l"><label for="${id}">${l}</label><div class="wa-step"><button type="button" class="wa-btn" aria-label="Menos" onclick="campoPasso('${id}',-1)">${icon('minus',18)}</button><input id="${id}" type="number" min="0" inputmode="numeric" value="${v}"><button type="button" class="wa-btn" aria-label="Mais" onclick="campoPasso('${id}',1)">${icon('plus',18)}</button></div></div>`;
    h += wa('ag','17:42',`O que ficou errado? Ajuste aqui ou mande outro áudio.
      <div class="wa-fix">${passo('cfB','Blocos assentados',c.blocos)}${passo('cfQ','Blocos quebrados',c.quebra)}${passo('cfC','Cimento (sacos)',c.cim)}</div>
      <div class="wa-acts col"><button class="wa-btn pri big" onclick="campoAjustar()">${icon('check',18)}Confirmar com ajuste</button><button class="wa-btn" onclick="CAMPO.corrigindo=false;render()">Voltar sem mudar</button></div>`);
  } else {
    h += wa('eu','17:42','Confirmar');
    h += wa('ag','17:42',`${entendi(false)}<p class="wa-ok">${icon('checkCircle',16)}<span>Gravado às ${c.hora||'17:42'}.${vai('bloco')?` Blocos: saldo <b>${fmt(saldo('bloco'))}</b>.`:''}${vai('cim')?` Cimento: <b>${saldo('cim')} sc</b> (120 sc chegam 30/10, PED-0160).`:''}</span></p>
      <div class="wa-acts col">${vai('rdo')||vai('atraso')?`<button class="wa-btn pri" onclick="go('obra','vila-nova','diario')">${icon('book',16)}Abrir RDO de 28/10</button>`:''}<button class="wa-btn" onclick="go('obra','vila-nova','inventario')">Ver almoxarifado</button></div>`);
  }
  return h;
}

/* ---------- gravar de verdade ---------- */
function campoPasso(id, d){ const e=$(id); e.value=Math.max(0,(parseInt(e.value,10)||0)+d); }
function campoAjustar(){
  const n=id=>Math.max(0,parseInt($(id).value,10)||0);
  CAMPO.blocos=n('cfB'); CAMPO.quebra=n('cfQ'); CAMPO.cim=n('cfC'); CAMPO.corrigindo=false;
  registrar(`Corrigiu a leitura do áudio: ${CAMPO.blocos} blocos + ${CAMPO.quebra} quebra, ${CAMPO.cim} sc cimento`, {obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'});
  campoConfirmar();
}
function campoConfirmar(){
  const ci=invItem('cim'), f=faseAlv(), tot=CAMPO.blocos+CAMPO.quebra;
  const fp=f?f.pct:null, av=avanco(CAMPO.blocos); CAMPO.antes={bloco:saldo('bloco'), cim:saldo('cim'), assent:av.A, total:av.total, fp:av.p0};
  const o={obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'}, feito=[];
  const v1=vai('bloco')?gravarBaixa('bloco', tot, 'Alvenaria do térreo · eixo B', 'Joana M. (WhatsApp)'):()=>{};
  if(vai('bloco')){ registrar(`Baixa de ${tot} blocos (${CAMPO.blocos} + ${CAMPO.quebra} de quebra) · alvenaria do térreo, eixo B`, o); feito.push(`${tot} blocos`); }
  const v2=ci&&vai('cim')?gravarBaixa('cim', CAMPO.cim, 'Argamassa · alvenaria do térreo', 'Joana M. (WhatsApp)'):()=>{};
  if(vai('cim')){ registrar(`Baixa de ${CAMPO.cim} sc de cimento · argamassa da alvenaria do térreo`, o); feito.push(`${CAMPO.cim} sc de cimento`); }
  if(vai('avanco') && f && f.pct<av.p1) f.pct=av.p1;
  if(vai('avanco')) registrar(`Avanço da alvenaria ${av.p0}% → ${av.p1}% (${fmt(av.A+CAMPO.blocos)} blocos assentados)`, o);
  if(vai('rdo')){ registrar('RDO de 28/10 preenchido pelo áudio · 7 pessoas · 180 blocos no eixo B', o); feito.push('RDO de 28/10'); }
  if(vai('atraso')) registrar('Causa de atraso: clima · chuva 15h–17h parou a alvenaria 2 h', o);
  /* RDO do dia (aba Diário, do Dev Gestão): grava o que a Joana disse; desfaz pelo retorno ou por {desfazer:true} */
  const fonte='áudio da Joana 17h40', temRDO=typeof atualizarRDO==='function' && (vai('rdo')||vai('atraso'));
  const rdo=temRDO ? atualizarRDO('28/10', {
    servicos:vai('rdo')?[{txt:`Alvenaria do térreo · eixo B: ${CAMPO.blocos} blocos assentados`, fonte}]:[],
    insumos:vai('rdo')?[...(vai('bloco')?[{txt:`Bloco cerâmico 14×19×29: ${tot} un (${CAMPO.blocos} + ${CAMPO.quebra} de quebra)`, fonte}]:[]), ...(vai('cim')?[{txt:`Cimento CP-II: ${CAMPO.cim} sc na argamassa`, fonte}]:[])]:[],
    ocorrencias:[...(vai('atraso')?[{txt:'Chuva forte 15h–17h parou a alvenaria por 2 h (causa de atraso: clima)', fonte}]:[]), ...(vai('rdo')?[{txt:'Aço da Gerdau (PED-0158) não chegou', fonte}]:[])]}) : null;
  const v3=()=>{ if(!temRDO) return; if(typeof rdo==='function') rdo(); else atualizarRDO('28/10', null, {desfazer:true}); };
  CAMPO.st='gravado'; CAMPO.hora=horaCampo(); render();
  toastDesfazer(`Gravado: ${feito.join(', ')||'avanço e atraso'}`, ()=>{
    v3(); v2(); v1(); if(f) f.pct=fp; CAMPO.st='pendente'; CAMPO.antes=null; });
}
const horaCampo = () => new Date().toTimeString().slice(0,5);

/* ---------- tela ---------- */
/* painel do desktop: o efeito no sistema ao vivo, antes → depois */
function efeito(){
  const g=CAMPO.st==='gravado', A=CAMPO.antes, tot=CAMPO.blocos+CAMPO.quebra, av=avanco(CAMPO.blocos), l=LOTES.find(x=>x.id==='PED-0157');
  const sb=g?A.bloco:saldo('bloco'), sc=g?A.cim:saldo('cim');
  const lin=(ic,rot,antes,depois,k,link)=>{ const on=!k||vai(k);
    return `<li>${icon(ic,16)}<div><b>${rot}</b><div class="ef-v"><span>${antes}</span>${on?`${icon('arrowRight',14)}<span class="${g?'ef-ok':'ef-se'}">${depois}</span>`:'<span class="mut">não será gravado</span>'}</div></div>${link||''}</li>`; };
  return `<section class="card ef"><h2>O que esta conversa alimenta</h2>
    <p class="mut sm">${g?`${icon('checkCircle',14)} gravado às ${CAMPO.hora} pela Joana`:'aguarda a Joana confirmar · o valor da direita é o que fica'}</p>
    <ul>
      ${lin('archive','Almoxarifado · bloco',`${fmt(sb)} un`,`${fmt(g?saldo('bloco'):sb-tot)} un`,'bloco')}
      ${lin('archive','Almoxarifado · cimento',`${sc} sc`,`${g?saldo('cim'):sc-CAMPO.cim} sc`,'cim')}
      ${lin('book','RDO de 28/10','vazio','preenchido pelo áudio','rdo',`<a class="link" href="#" onclick="go('obra','vila-nova','diario');return false">abrir</a>`)}
      ${lin('clock','Causas de atraso','—','clima · 2 h','atraso')}
      ${lin('chart','Avanço da alvenaria',`${av.p0}%`,`${av.p1}%`,'avanco')}
      ${lin('receipt','Recebimento PED-0157',l&&l.conf?'conferido':'40 m³ na NF, 36 medidos',l&&l.conf?l.eta:'R$ 472 a abater',null,l&&l.conf?'':`<a class="link" href="#" onclick="openConferencia('PED-0157');return false">conferir</a>`)}
    </ul></section>`;
}
VIEWS.campo = () => `<div class="top campo-top"><div><div class="crumb">Casa Vila Nova · mestre de obras</div><h1>Campo · WhatsApp</h1>
    <p class="campo-sub">Sem formulário: a Joana manda áudio e foto pelo WhatsApp, como já faz. O agente transforma em baixa, RDO, atraso e avanço, e só grava depois que ela confirma.</p></div></div>
  <div class="page campo-page">
    <div class="campo-wrap">
      <div class="phone"><div class="phone-in">
        <div class="wa-top"><div class="wa-av">${icon('spark',18)}</div><div class="wa-id"><b>Canteiro</b><small>agente da Casa Vila Nova</small></div><span class="sp"></span>
          <button type="button" class="wa-saida" onclick="openBaixa()">${icon('minus',16)}Registrar saída</button></div>
        <div class="wa-body" id="waBody">${conversa()}</div>
        <div class="wa-comp"><button type="button" class="wa-ico" onclick="toast('(protótipo) abre a câmera para foto de NF ou de serviço')" aria-label="Foto">${icon('camera',22)}</button>
          <label class="sr-only" for="waInp">Mensagem</label><input class="wa-inp" id="waInp" type="text" placeholder="Mensagem" enterkeyhint="send" autocomplete="off"><button type="button" class="wa-mic" onclick="toast('(protótipo) segure para gravar um áudio')" aria-label="Gravar áudio">${icon('mic',22)}</button></div>
      </div></div>
      <div class="campo-side">
        ${efeito()}
        ${val('A Joana manda áudio no fim do dia ou ao longo dele? Confirmar no WhatsApp (um toque) é aceitável, ou ela prefere que grave direto e avise?')}
        <p class="sm mut">${icon('phone',14)} Abra esta tela no celular: ela funciona em tela cheia, como a Joana vê.</p>
      </div>
    </div></div>`;
NAV_EXTRA.push({view:'campo', icon:'phone', label:'Campo · WhatsApp', count:()=>CAMPO.st==='pendente'?1:0});
ICONS.book = ICONS.book || '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>';

/* celular: a página vai sob o notch (safe-area) e a barra de status pega a cor do cabeçalho do WhatsApp */
(()=>{ const v=document.querySelector('meta[name=viewport]'); if(v && !/viewport-fit/.test(v.content)) v.content+=', viewport-fit=cover';
  if(!document.querySelector('meta[name=theme-color]')){ const m=document.createElement('meta'); m.name='theme-color'; m.content='#e7eaea'; document.head.appendChild(m); } })();
/* rola a conversa para o fim e libera a rota no celular */
document.addEventListener('rendered',()=>{
  const c=state.view==='campo'; document.body.classList.toggle('campo-mode', c);
  const t=document.querySelector('meta[name=theme-color]'); if(t) t.content = c ? '#1c2a27' : '#e7eaea';
  const w=$('waBody'); if(w && !CAMPO.play) w.scrollTop=w.scrollHeight;
});

/* ---------- recebimento por NF-e: uma ação de conclusão; a divergência é uma escolha dentro dela ---------- */
const INV_DO_LOTE = l => /areia/i.test(l.item)?'areia':/cimento/i.test(l.item)?'cim':/bloco/i.test(l.item)?'bloco':/brita/i.test(l.item)?'brita':/parafuso/i.test(l.item)?'paraf':/prego/i.test(l.item)?'prego':/vergalh|aço/i.test(l.item)?'aco':null;
const CONF = {abater:true};
function openConferencia(idLote){
  const l=LOTES.find(x=>x.id===idLote)||(typeof acharLote==='function'&&(acharLote(idLote)||{}).l); if(!l){ toast('Pedido não encontrado'); return; }
  closeDrawer();
  const {qn, un} = qtdLote(l), areia = idLote==='PED-0157', rec = l.medido ?? (areia?36:qn);
  if(l.conf){
    abrirModal(`<h2>Recebimento ${l.id} já conferido</h2><p class="mut">${l.item} · ${l.eta}</p>
      <div class="row"><span class="sp"></span>${botao('Fechar', 'closeModal()')}</div>`); return;
  }
  CONF.abater=true;
  abrirModal(`<h2>Conferir NF · ${l.id}</h2>
    <p class="mut conf-meta">${l.item} · ${l.forn} · confere Joana M. (mestre), que recebe na obra</p>
    <div class="conf-nums">
      <div><span>Na NF</span><b>${fmt(qn)} ${un}</b></div>
      <div><label for="confRec">Recebido</label><span class="conf-in"><input class="f" id="confRec" type="number" min="0" inputmode="decimal" value="${rec}" oninput="confCalc('${l.id}')"><span>${un}</span></span></div>
      <div><span>Diferença</span><b id="confDif"></b></div>
    </div>
    <div id="confEsc"></div>
    <div class="conf-src">
      <div class="conf-nf">${fotoNF().replace('Areia média lavada', areia?'Areia média lavada':l.item).replace('40,000 M3', areia?'40,000 M3':(fmt(qn)+' '+un).toUpperCase()).replace(/4\.720,00/g, l.v.toLocaleString('pt-BR',{minimumFractionDigits:2}))}</div>
      <div><p class="conf-li">${chipFonte({origem:'nf', quem:'foto da DANFE no WhatsApp', hora:'17:31'})}</p>
        <p class="mut conf-li">Chave conferida na SEFAZ (35261009…4418)</p>
        ${areia?`<p class="conf-li">${icon('camera',15)} Foto da caçamba: 36 m³ medidos</p>`:''}
        ${botao('Chave ou XML', "toast('(protótipo) colar chave de 44 dígitos ou anexar XML')", {sm:true, icone:'upload'})}</div>
    </div>
    <div class="row"><span class="sp"></span><button type="button" class="btn amb" id="confOk" onclick="confGravar('${l.id}')"></button></div>`);
  confCalc(idLote);
}
const qtdLote = l => ({qn: l.qn ?? parseFloat(l.q.replace(/\./g,'').replace(',','.')), un: l.un || l.q.replace(/^[\d.,]+\s*/,'')});
function confDados(id){
  const l=LOTES.find(x=>x.id===id)||acharLote(id).l, {qn,un}=qtdLote(l);
  const rec=Math.max(0,parseFloat($('confRec').value)||0), dif=qn-rec, abat=Math.round(Math.max(0,dif)*l.v/qn);
  return {l,qn,un,rec,dif,abat};
}
function confCalc(id){
  const {un,dif,abat,l,qn,rec}=confDados(id);
  $('confDif').innerHTML = dif>0?`<span class="t-pede">−${fmt(dif)} ${un}</span>`:dif<0?`+${fmt(-dif)} ${un}`:`<span class="t-ok">bate</span>`;
  $('confEsc').innerHTML = dif>0
    ? `<fieldset class="conf-esc"><legend class="l">Faltam ${fmt(dif)} ${un} × ${brl(Math.round(l.v/qn))} = ${brl(abat)}. O que fazer?</legend>
        <label class="ap-op"><input type="radio" name="confAb" ${CONF.abater?'checked':''} onchange="CONF.abater=true;confCalc('${id}')"><span><b>Abater ${brl(abat)} do boleto</b> · fica ${brl(l.v-abat)}; a foto vai para o fornecedor</span></label>
        <label class="ap-op"><input type="radio" name="confAb" ${CONF.abater?'':'checked'} onchange="CONF.abater=false;confCalc('${id}')"><span>Aceitar sem abater</span></label></fieldset>`
    : `<p class="mut">Quantidade confere com a NF. A entrada vai para o almoxarifado.</p>`;
  $('confOk').textContent = dif>0&&CONF.abater ? `Abater ${brl(abat)} e dar entrada de ${fmt(rec)} ${un}` : `Dar entrada de ${fmt(rec)} ${un}`;
}
function confGravar(id){
  const {l,qn,un,rec,dif,abat}=confDados(id), invId=l.inv||INV_DO_LOTE(l), i=invItem(invId), div=CONF.abater&&dif>0;
  const volta=fotoDe(l, i, movDe(invId));
  const eta=`no almoxarifado · ${fmt(rec)} ${un} recebidos`+(div?` · ${brl(abat)} abatidos do boleto`:'');
  if(typeof darEntrada==='function') darEntrada(id, rec, div?{divergencia:`${fmt(dif)} ${un} a menos que a NF · ${brl(abat)} abatidos do boleto (foto da caçamba)`}:{});
  else { if(i) i.ent+=rec; l.col=KCOLS.length-1; l.conf=true; if(div) l.v-=abat; }
  l.eta=eta; if(div) l.abatido=abat;
  registrar(`Recebimento ${l.id} · ${l.item}: ${fmt(rec)} ${un} de ${fmt(qn)} ${un} na NF`+(div?` · divergência registrada, ${brl(abat)} abatidos do boleto`:dif>0?' · aceito sem abatimento':''), {obra:'vila-nova', origem:'WhatsApp', quem:'Joana M.'});
  closeModal(); render();
  toastDesfazer(div?`Entrada de ${fmt(rec)} ${un} · ${brl(abat)} a abater do boleto`:`Entrada de ${fmt(rec)} ${un} no almoxarifado`, volta);
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
  abrirModal(`<h2>Registrar saída</h2><p class="mut conf-meta">3 toques: item, quantidade, frente de serviço.</p>
    <p class="l">1 · Item <span class="mut">· os mais usados</span></p>
    <div class="bx-chips">${usados.map(x=>`<button type="button" class="bx-chip ${x.id===it.id?'on':''}" aria-pressed="${x.id===it.id}" onclick="BX.item='${x.id}';openBaixa()">${x.nome.replace(/ 50 kg| 14×19×29| 5\/16" × 2"/,'')}<small>saldo ${fmt(x.ent-x.sai)} ${x.un}</small></button>`).join('')}</div>
    <label class="l" for="bxQ">2 · Quantidade <span class="mut">· a última foi ${BX_ULT[it.id]||1}</span></label>
    <div class="bx-q"><button type="button" class="btn" aria-label="Menos" onclick="bxPasso(-1)">${icon('minus',18)}</button><input class="f" id="bxQ" type="number" min="1" inputmode="numeric" value="${BX_ULT[it.id]||1}" oninput="bxCalc()"><button type="button" class="btn" aria-label="Mais" onclick="bxPasso(1)">${icon('plus',18)}</button><span class="bx-saldo" id="bxSaldo" aria-live="polite"></span></div>
    ${a?`<p class="l">3 · Frente de serviço <span class="mut">· obrigatória para item curva A</span></p>
      <div class="bx-chips">${BX_FRENTES.map(f=>`<button type="button" class="bx-chip ${f===BX.frente?'on':''}" aria-pressed="${f===BX.frente}" onclick="BX.frente=this.dataset.f;openBaixa()" data-f="${f}">${f}</button>`).join('')}</div>`
      :`<p class="mut bx-c">${icon('info',14)} Item curva ${curvaDe(it)}: sem destino. O controle é pela contagem semanal.</p>`}
    ${state.view==='campo'?'':`<p class="bx-wa">${icon('mic',16)}<span>Ou mande um áudio no WhatsApp: "usei 6 sacos de cimento na alvenaria".</span><a class="link" href="#" onclick="closeModal();go('campo');return false">abrir</a></p>`}
    <div class="row"><span class="sp"></span><button type="button" class="btn amb" id="bxOk" onclick="bxGravar()"></button></div>`);
  bxCalc();
}
function bxPasso(d){ const e=$('bxQ'); e.value=Math.max(1,(parseInt(e.value,10)||0)+d); bxCalc(); }
function bxCalc(){
  const it=invItem(BX.item), q=Math.max(0,parseInt($('bxQ').value,10)||0), s=it.ent-it.sai, ok=q>0&&q<=s;
  $('bxSaldo').innerHTML = q>s ? `<span class="t-perda">saldo é ${fmt(s)} ${it.un}</span>` : `saldo ${fmt(s)} → <b>${fmt(s-q)}</b> ${it.un}`;
  $('bxOk').textContent = q ? `Registrar saída de ${fmt(q)} ${it.un}` : 'Informe a quantidade';
  $('bxOk').disabled = !ok;
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
.campo-sub{margin:6px 0 0;max-width:68ch;color:var(--ink2);font-size:var(--t-body)}
.campo-wrap{display:grid;grid-template-columns:400px minmax(300px,460px);gap:var(--s6);align-items:start}
.phone{width:400px;height:min(800px,calc(100vh - 170px));min-height:580px;border-radius:44px;background:#121816;padding:12px;box-shadow:0 30px 60px rgba(26,32,30,.18)}
.phone-in{height:100%;border-radius:34px;overflow:hidden;display:flex;flex-direction:column;background:#ece5dd}
.phone button{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.wa-top{display:flex;align-items:center;gap:10px;padding:12px 12px 10px 14px;background:var(--pine);color:#fff}
.wa-id{min-width:0} .wa-id b{display:block;font-size:16px;line-height:1.25}
.wa-top small{display:block;font-size:13px;color:#c9d5d1;font-weight:400}
.wa-av{width:36px;height:36px;border-radius:50%;background:var(--accent);color:var(--pine);display:grid;place-items:center;flex:none}
.wa-saida{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:1px solid rgba(255,255,255,.55);border-radius:99px;background:none;color:#fff;font:600 14px var(--sans);white-space:nowrap;transition:transform .12s var(--ease)}
.wa-ico{border:0;background:none;color:var(--ink2);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none}
.wa-body{flex:1;overflow:auto;overscroll-behavior:contain;padding:12px 10px;display:flex;flex-direction:column;gap:8px;font-size:16px;line-height:1.45;color:var(--ink)}
.wa-dia{align-self:center;background:#fff;border-radius:8px;padding:2px 12px;font-size:13px;color:#4a524f;margin-bottom:4px}
.wa-m{display:flex} .wa-m.eu{justify-content:flex-end}
.wa-b{max-width:88%;background:#fff;border-radius:10px;padding:8px 10px 6px;position:relative}
.wa-m.eu .wa-b{background:#e2f0d9}
.wa-h{display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:13px;color:#4a524f;margin-top:2px}
.wa-h .ic{color:#2f6f9f}
.wa-alerta{display:flex;align-items:center;gap:8px;margin:8px 0 2px;padding:8px 10px;border-radius:8px;background:var(--amberSoft);color:var(--amberInk)}
.wa-sec{margin:12px 0 4px;font-size:13px;font-weight:600;color:#4a524f;text-transform:uppercase;letter-spacing:.04em}
.wa-grav{list-style:none;margin:0;padding:0;border-top:1px solid var(--line2)}
.wa-grav li{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line2)}
.wa-grav li > div{flex:1;min-width:0} .wa-grav b{display:block;font-weight:600} .wa-grav span{display:block;font-size:14px;color:var(--ink2)}
.wa-grav li.fora b,.wa-grav li.fora span{text-decoration:line-through;color:#4a524f}
.wa-x{flex:none;min-width:44px;height:44px;border:0;border-radius:50%;background:none;color:var(--ink2);display:grid;place-items:center;font:600 14px var(--sans);transition:transform .12s var(--ease)}
.wa-grav li.fora .wa-x{border-radius:99px;color:var(--accentInk);text-decoration:underline;text-underline-offset:3px}
.wa-saber{margin:0;color:var(--ink2)}
.wa-ok{display:flex;gap:8px;align-items:flex-start;margin:10px 0 0} .wa-ok .ic{color:var(--greenInk);flex:none;margin-top:3px}
.wa-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px} .wa-acts.col{flex-direction:column}
.wa-btn{min-height:44px;border:1px solid #b8c2be;background:#fff;color:var(--ink);border-radius:99px;padding:0 18px;font:500 15px var(--sans);display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:transform .12s var(--ease)}
.wa-btn.pri{background:var(--pine);color:#fff;border-color:var(--pine);font-weight:600}
.wa-btn.big{min-height:48px;font-size:16px}
.wa-btn[disabled]{opacity:.55}
.wa-btn:active,.wa-x:active,.wa-saida:active,.wa-mic:active,.wa-ico:active,.wa-play:active{transform:scale(.97)}
.wa-audio{display:flex;align-items:center;gap:8px;min-width:240px}
.wa-play{width:44px;height:44px;border-radius:50%;border:0;background:var(--pine);color:#fff;display:grid;place-items:center;flex:none;transition:transform .12s var(--ease)}
.wa-onda{display:flex;align-items:center;gap:2px;height:30px;flex:1} .wa-onda i{width:3px;border-radius:2px;background:#8fa39b} .wa-onda i.on{background:var(--pine)}
.wa-dur{font-size:13px;color:#4a524f}
.wa-transc{margin-top:6px;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.7);font-size:15px;color:var(--ink2);font-style:italic}
.wa-transc span{display:flex;align-items:center;gap:4px;font-style:normal;font-size:13px;color:#4a524f;font-weight:600;margin-bottom:2px}
.wa-nf{background:#f6f5ef;border-radius:3px;padding:8px 10px;font:12px/1.45 ui-monospace,Menlo,monospace;color:#333;margin-bottom:6px;transform:rotate(-1deg)}
.wa-nf .h{display:flex;justify-content:space-between;border-bottom:1px dashed #bbb;padding-bottom:3px;margin-bottom:3px}
.wa-nf .ln{display:flex;justify-content:space-between;gap:10px} .wa-nf .tot{border-top:1px dashed #bbb;margin-top:3px;padding-top:3px;font-weight:700}
.wa-nf .mut{color:#555}
.wa-nf .bc{height:16px;margin-top:6px;background:repeating-linear-gradient(90deg,#333 0 2px,transparent 2px 4px,#333 4px 5px,transparent 5px 8px)}
.wa-wall{width:240px;height:150px;border-radius:7px;position:relative;overflow:hidden;background:linear-gradient(#b9c6cf 0 38%,transparent 38%)}
.wa-wall i{position:absolute;left:0;right:0;bottom:0;height:62%;background:
  repeating-linear-gradient(0deg,#d8d2c4 0 3px,transparent 3px 22px),
  repeating-linear-gradient(90deg,#d8d2c4 0 3px,transparent 3px 44px),#b5643f}
.wa-wall span{position:absolute;left:8px;bottom:6px;color:#fff;font-size:13px;background:rgba(0,0,0,.6);padding:1px 6px;border-radius:5px}
.wa-fix{display:grid;gap:10px;margin-top:10px}
.wa-fix-l label{display:block;font-size:14px;color:var(--ink2);margin-bottom:4px}
.wa-step{display:flex;align-items:center;gap:6px}
.wa-step .wa-btn{width:44px;padding:0;flex:none}
.wa-step input{flex:1;min-width:0;height:44px;padding:0 10px;border:1px solid #b8c2be;border-radius:10px;font:600 18px var(--sans);text-align:center;color:var(--ink);background:#fff}
.wa-comp{display:flex;align-items:center;gap:6px;padding:8px;background:#f0f0f0}
.wa-inp{flex:1;min-width:0;height:44px;border:0;background:#fff;border-radius:99px;padding:0 16px;font:16px var(--sans);color:var(--ink)}
.wa-inp::placeholder{color:#575f5c}
.wa-mic{width:48px;height:48px;border-radius:50%;border:0;background:var(--pine);color:#fff;display:grid;place-items:center;flex:none;transition:transform .12s var(--ease)}
.campo-side{display:flex;flex-direction:column;gap:var(--s4)}
.campo-side .card{margin:0}
.ef h2{margin:0;font-size:var(--t-sec)}
.ef > p{margin:4px 0 var(--s3);display:flex;align-items:center;gap:6px}
.ef ul{list-style:none;margin:0;padding:0}
.ef li{display:flex;gap:var(--s3);align-items:flex-start;padding:10px 0;border-top:1px solid var(--line2)}
.ef li > .ic{margin-top:3px;color:var(--muted);flex:none} .ef li > div{flex:1;min-width:0}
.ef-v{display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px;font-size:var(--t-meta);color:var(--muted)}
.ef-v .ic{color:var(--muted)} .ef-se{color:var(--ink);font-weight:600} .ef-ok{color:var(--greenInk);font-weight:600}
/* modais do campo: conferência e baixa */
.conf-meta{font-size:var(--t-meta);margin:4px 0 var(--s4)}
.conf-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4);padding:var(--s3) 0;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2)}
.conf-nums > div > span,.conf-nums label{display:block;font-size:var(--t-meta);color:var(--muted);margin-bottom:4px}
.conf-nums b{font:600 var(--t-bloco)/1.2 var(--serif)}
.conf-in{display:flex;align-items:center;gap:6px} .conf-in span{color:var(--muted)} .conf-in input.f::-webkit-inner-spin-button,.wa-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.conf-in input.f{width:100px;height:44px;font:600 18px var(--sans);text-align:right}
.t-pede{color:var(--amberInk)} .t-ok{color:var(--greenInk)} .t-perda{color:var(--redInk)}
.conf-esc{border:0;padding:0;margin:var(--s3) 0 0;display:grid;gap:var(--s2)} .conf-esc legend{padding:0;color:var(--ink);font-weight:600}
.conf-src{display:grid;grid-template-columns:230px 1fr;gap:var(--s4);margin-top:var(--s4);align-items:start}
.conf-li{margin:0 0 var(--s2);display:flex;align-items:center;gap:6px;font-size:var(--t-meta)}
.conf-nf .wa-nf{transform:none;margin:0}
.bx-chips{display:flex;flex-wrap:wrap;gap:var(--s2)}
.bx-chip{min-height:44px;border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;text-align:left;font:500 var(--t-body) var(--sans);color:var(--ink);transition:transform .12s var(--ease)}
.bx-chip small{display:block;font-weight:400;color:var(--muted);font-size:var(--t-meta)}
.bx-chip.on{border-color:var(--accent);background:var(--accentSoft);color:var(--accentInk)}
.bx-chip:active{transform:scale(.97)}
.bx-q{display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap}
.bx-q .btn{width:44px;height:44px;padding:0}
.bx-q input.f{width:110px;height:44px;font:600 18px var(--sans);text-align:right}
.bx-saldo{color:var(--muted)} .bx-saldo b{color:var(--ink)}
.bx-c{display:flex;align-items:center;gap:6px;margin-top:var(--s4)}
.bx-wa{display:flex;align-items:center;gap:8px;margin:var(--s5) 0 0;padding:var(--s3) 0 0;border-top:1px solid var(--line2);font-size:var(--t-meta);color:var(--ink2)}
.bx-wa .link{margin-left:auto}
p.l{display:block;font-size:var(--t-meta);color:var(--muted);margin:14px 0 5px;font-weight:500}
@media (hover:hover){
  .wa-btn:hover{background:#f3f5f4} .wa-btn.pri:hover{background:#26382f}
  .wa-saida:hover{background:rgba(255,255,255,.1)} .wa-x:hover{background:var(--sunk)} .bx-chip:hover{border-color:#b9c2bf}
}
@media (prefers-reduced-motion:reduce){ .wa-btn:active,.wa-x:active,.wa-saida:active,.wa-mic:active,.wa-ico:active,.wa-play:active,.bx-chip:active{transform:none} }
/* celular: só a rota #campo passa pelo aviso de "abra num computador", em tela cheia, sem sidebar */
@media (max-width:1099px){
  html:has(body.campo-mode){-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;overscroll-behavior:none}
  body.campo-mode{overscroll-behavior:none}
  body.campo-mode #gate{display:none!important}
  body.campo-mode .app{display:block!important;height:100vh;height:100dvh}
  body.campo-mode .side,body.campo-mode .campo-top,body.campo-mode .campo-side{display:none}
  body.campo-mode .main{height:100%}
  body.campo-mode .page.campo-page{padding:0;height:100%}
  body.campo-mode .campo-wrap{display:block;height:100%}
  body.campo-mode .phone{width:100%;height:100%;min-height:0;border-radius:0;padding:0;box-shadow:none}
  body.campo-mode .phone-in{border-radius:0}
  body.campo-mode .wa-top{padding-top:max(10px,env(safe-area-inset-top));padding-left:max(14px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right))}
  body.campo-mode .wa-comp{padding-bottom:max(8px,env(safe-area-inset-bottom));padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}
  body.campo-mode .wa-b{max-width:92%}
  body.campo-mode .modal.on{display:grid!important} body.campo-mode .drawer.on{display:flex!important}
  body.campo-mode .toast[style*="block"]{display:block!important;width:max-content;max-width:92vw}
  body.campo-mode .toast{bottom:calc(72px + env(safe-area-inset-bottom,0px));font-size:16px}
  body.campo-mode .toast .t-undo{min-height:44px;padding:0 10px}
  body.campo-mode .modal .box{padding:22px 18px 0;font-size:16px}
  body.campo-mode .modal .box .btn{min-height:44px}
  body.campo-mode .modal .dlg-x{width:44px;height:44px;top:10px;right:10px}
  body.campo-mode .modal .box > .row:last-child .btn.amb{flex:1 1 100%;min-height:48px;font-size:16px}
  body.campo-mode .modal input.f,body.campo-mode .modal select.f,body.campo-mode .modal textarea.f{font-size:16px}
  body.campo-mode .conf-src{grid-template-columns:1fr}
  body.campo-mode .conf-nums{gap:var(--s3)}
  body.campo-mode .conf-nums b{font-size:20px}
  body.campo-mode .conf-in input.f{width:76px}
}
`);
