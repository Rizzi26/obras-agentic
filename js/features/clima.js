/* Clima real (Open-Meteo) e programação de atividades que dependem de tempo bom.
   A previsão real vale SÓ nesta tela (e na intenção de clima da conversa). O briefing e o roteiro da demo
   ("80% de chuva na qui 05/11", proativo.js / conversa.js) continuam fixos: aqui nada é escrito neles.
   Dados: Open-Meteo, grátis, sem chave. Cache em memória e no sessionStorage por 30 min. Sem rede: previsão de exemplo, com aviso. */

/* ===================== OBRAS, REGRAS E PROGRAMAÇÃO (editável) ===================== */
const CLIMA_COORD = {'vila-nova':[-22.9056,-47.0608,'Campinas'], 'loja-centro':[-22.9706,-46.9958,'Valinhos'], 'galpao':[-22.8219,-47.2669,'Sumaré']};
/* Hora com chuva: chance ≥ prob % ou ≥ mm no hora. "Dia seco" (KPI): chuva < 1 mm e chance < 40 %. Chuva forte: ≥ 10 mm no dia. */
const CHUVA_HORA = {prob:50, mm:0.5};
/* Regras por atividade. semChuva:[h antes, h depois] do turno · seco: h secas a partir do início · tMin/tMax/vento: no turno
   · chuvaAntes:{h, mm}: soma de chuva nas h anteriores ao início abaixo de mm. texto: o que aparece na tela. */
const REGRAS_CLIMA = {
  concretagem:   {nome:'Concretagem',            texto:'sem chuva de 6 h antes a 12 h depois; 10–32 °C; vento < 40 km/h', semChuva:[6,12], tMin:10, tMax:32, vento:40},
  cobertura:     {nome:'Cobertura / telhado',    texto:'vento < 40 km/h e sem chuva no período', semChuva:[0,0], vento:40},
  impermeabilizacao:{nome:'Impermeabilização',   texto:'24 h secas a partir do início; acima de 10 °C', seco:24, tMin:10},
  pintura:       {nome:'Pintura externa',        texto:'24 h secas a partir do início; acima de 10 °C', seco:24, tMin:10},
  terraplenagem: {nome:'Terraplenagem',          texto:'sem chuva forte (> 10 mm) nas 48 h anteriores', chuvaAntes:{h:48, mm:10}},
  alvenaria:     {nome:'Alvenaria externa',      texto:'sem chuva no turno', semChuva:[0,0]},
};
/* Atividades programadas (dia, início e duração do turno em horas). Datas de out–nov/2026; se a demo rodar depois disso,
   a programação anda junto com hoje, mantendo a distância a partir de 29/10. */
const ATV_CLIMA = [
  {id:'vn-laje',   obra:'vila-nova',   regra:'concretagem', nome:'Concretagem da laje do 2º pav.', curto:'Concretagem', dia:'2026-11-05', ini:7, dur:6, doc:'PED-0166', det:'38 m³ · Concrecamp + bomba lança'},
  {id:'vn-alv',    obra:'vila-nova',   regra:'alvenaria',   nome:'Alvenaria externa do térreo, eixo D', curto:'Alvenaria ext.', dia:'2026-10-30', ini:7, dur:9, det:'Equipe Silva'},
  {id:'vn-cob',    obra:'vila-nova',   regra:'cobertura',   nome:'Cobertura (telhado)', curto:'Cobertura', dia:'2026-11-13', ini:7, dur:9, det:'depois das telhas, que chegam até 12/11'},
  {id:'lc-pint',   obra:'loja-centro', regra:'pintura',     nome:'Pintura da fachada', curto:'Pintura fachada', dia:'2026-11-04', ini:8, dur:9, det:'2 demãos de acrílica'},
  {id:'gp-terra',  obra:'galpao',      regra:'terraplenagem', nome:'Terraplenagem', curto:'Terraplenagem', dia:'2026-11-09', ini:7, dur:10, det:'prevista · corte e aterro do platô'},
];

/* ===================== ESTADO ===================== */
const CLIMA = {dados:{}, carregando:{}, remarc:{}, mantida:{}, ultima:{}, espera:new Set()};
const CLIMA_TTL = 30*60*1000;
FONTE_IC['open-meteo'] = ['nuvem','Open-Meteo'];
const CL_SEM = ['dom','seg','ter','qua','qui','sex','sáb'];
const clDia = s => { const [a,m,d]=s.split('-').map(Number); return new Date(a,m-1,d); };
const clIso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const clHoje = () => clIso(new Date());
const clDDMM = s => s.slice(8,10)+'/'+s.slice(5,7);
const clRot = s => `${CL_SEM[clDia(s).getDay()]} ${clDDMM(s)}`;
const clMais = (s, n) => { const d=clDia(s); d.setDate(d.getDate()+n); return clIso(d); };
const clHH = h => String(h).padStart(2,'0');
const clFaixa = (ini, dur) => `${clHH(ini)}–${clHH(ini+dur)}h`;
const clNum = (v, c=0) => (v==null||isNaN(v)) ? '—' : Number(v).toLocaleString('pt-BR', {minimumFractionDigits:c, maximumFractionDigits:c});
const clMm = v => v>=10 ? clNum(v) : clNum(v, v>0&&v<10?1:0);

/* ===================== DADOS: Open-Meteo, cache, exemplo ===================== */
function climaUrl(ob){
  const [la, lo] = CLIMA_COORD[ob];
  return `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=precipitation_probability,precipitation,wind_speed_10m,temperature_2m`+
    `&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo&forecast_days=16&past_days=2`;
}
/* Formato interno: dias [{dia, mm, prob, tmax, tmin, vento}] (de hoje em diante) e horas {t:['AAAA-MM-DDTHH:00'], p, mm, v, c} (inclui as 48 h passadas). */
function climaDeApi(j){
  const D=j.daily, H=j.hourly, hoje=clHoje();
  const dias = D.time.map((dia,i)=>({dia, mm:D.precipitation_sum[i]??0, prob:D.precipitation_probability_max[i]??0, tmax:D.temperature_2m_max[i], tmin:D.temperature_2m_min[i], vento:D.wind_speed_10m_max[i]})).filter(d=>d.dia>=hoje);
  return {dias, h:{t:H.time, p:H.precipitation_probability.map(x=>x??0), mm:H.precipitation.map(x=>x??0), v:H.wind_speed_10m.map(x=>x??0), c:H.temperature_2m}};
}
/* Exemplo embutido (sem rede): 16 dias a partir de hoje, com chuva à tarde nos dias chuvosos e chuva de manhã no dia da concretagem. */
function climaExemplo(ob){
  const hoje=clHoje(), P=[20,10,35,70,30,15,10,80,15,60,90,40,15,10,55,30], M=[0,0,1.2,6,0.8,0,0,14,0,4,22,2,0,0,3,.6];
  const conc = ATV_CLIMA.find(a=>a.regra==='concretagem'), dConc = conc && diaAtv(conc);
  const dias=[], h={t:[], p:[], mm:[], v:[], c:[]};
  for(let i=-2;i<16;i++){
    const dia=clMais(hoje,i), k=(i+16)%16; let prob=P[k], mm=M[k], manha=false;
    if(dConc && dia===dConc){ prob=80; mm=14; manha=true; } else if(dConc && dia===clMais(dConc,1)){ prob=10; mm=0; }
    const tmax=27+(k%5)-(mm>5?3:0), tmin=17+(k%3), vmax=14+(k*7)%22;
    if(i>=0) dias.push({dia, mm, prob, tmax, tmin, vento:vmax});
    for(let x=0;x<24;x++){
      const chove = manha ? x>=6&&x<=12 : x>=14&&x<=18;
      h.t.push(`${dia}T${clHH(x)}:00`); h.p.push(Math.round(chove?prob:prob*.35)); h.mm.push(chove&&mm?+(mm/(manha?7:5)).toFixed(1):0);
      h.v.push(Math.round(vmax*(.45+.55*Math.max(0,Math.sin((x-8)/24*2*Math.PI)))));
      h.c.push(+(tmin+(tmax-tmin)*Math.max(0,Math.sin((x-6)/18*Math.PI))).toFixed(1));
    }
  }
  return {dias, h};
}
function climaIndexar(d){ d.ix={}; d.h.t.forEach((t,i)=>d.ix[t]=i); return d; }
function climaDe(ob){
  if(CLIMA.dados[ob]) return CLIMA.dados[ob];
  try{
    const s=JSON.parse(sessionStorage.getItem('canteiro.clima.'+ob)||'null');
    if(s && Date.now()-s.em<CLIMA_TTL && s.d.dias[0] && s.d.dias[0].dia===clHoje()) return CLIMA.dados[ob]=climaIndexar(s.d);
  }catch(e){}
  climaBuscar(ob);
  return null;
}
function climaBuscar(ob, forcar){
  if(CLIMA.carregando[ob]) return CLIMA.carregando[ob];
  if(forcar){ delete CLIMA.dados[ob]; try{ sessionStorage.removeItem('canteiro.clima.'+ob); }catch(e){} }
  const ctl = typeof AbortController!=='undefined' ? new AbortController() : null, tm = setTimeout(()=>ctl && ctl.abort(), 8000);
  const hora = () => new Date().toTimeString().slice(0,5);
  const p = fetch(climaUrl(ob), ctl?{signal:ctl.signal}:{}).then(r=>{ if(!r.ok) throw Error('HTTP '+r.status); return r.json(); })
    .then(j=>{ const d=climaDeApi(j); if(d.dias.length<7) throw Error('previsão incompleta'); d.em=Date.now(); d.hora=hora();
      try{ sessionStorage.setItem('canteiro.clima.'+ob, JSON.stringify({em:d.em, d})); }catch(e){}
      return d; })
    .catch(()=>Object.assign(climaExemplo(ob), {exemplo:true, em:Date.now(), hora:hora()}))
    .then(d=>{ clearTimeout(tm); CLIMA.dados[ob]=climaIndexar(d); delete CLIMA.carregando[ob]; climaRepintar(ob); return d; });
  return CLIMA.carregando[ob]=p;
}
function climaRepintar(ob){
  const v = typeof state!=='undefined' && state.visao;
  if(v && v.chave==='clima' && v.obra===ob) return typeof desenharVisao==='function' ? desenharVisao() : render();
  if(CLIMA.espera.has(ob)){ CLIMA.espera.delete(ob); if(typeof state!=='undefined' && state.modo==='c' && !state.visao) cvRepintar(); }
}

/* ===================== AVALIAÇÃO ===================== */
/* Dia efetivo da atividade: remarcada > programada (ou deslocada para frente se a data já passou da previsão). */
function diaAtv(a){
  const r=CLIMA.remarc[a.id]; if(r) return r.dia;
  const hoje=clHoje();
  if(a.dia>=hoje) return a.dia;
  const off=Math.round((clDia(a.dia)-clDia('2026-10-29'))/864e5); return clMais(hoje, Math.max(1, off));
}
const iniAtv = a => (CLIMA.remarc[a.id]||{}).ini ?? a.ini;
const chuvosa = (d, i) => d.h.p[i]>=CHUVA_HORA.prob || d.h.mm[i]>=CHUVA_HORA.mm;
/* → {ok, falhas:[texto], prob (máx no período de chuva), motivo:{tipo, v}, completo} ou null (fora da previsão) */
function avaliar(d, regra, dia, ini, dur){
  const R=REGRAS_CLIMA[regra], a=d.ix[`${dia}T${clHH(ini)}:00`]; if(a==null) return null;
  const N=d.h.t.length, turno=[a, a+dur-1], falhas=[]; let prob=0, motivo=null, completo=true;
  const faixa = (i0, i1, f) => { if(i1>=N) completo=false; for(let i=Math.max(0,i0); i<=Math.min(N-1,i1); i++) f(i); };
  const rangeChuva = R.semChuva ? [a-R.semChuva[0], turno[1]+R.semChuva[1]] : R.seco ? [a, a+Math.max(dur,R.seco)-1] : null;
  if(rangeChuva){ let n=0; faixa(rangeChuva[0], rangeChuva[1], i=>{ prob=Math.max(prob, d.h.p[i]); if(chuvosa(d,i)) n++; });
    if(n){ falhas.push(`chuva em ${n} h do período (até ${prob}%)`); motivo={tipo:'chuva', v:prob}; } }
  else faixa(turno[0], turno[1], i=>prob=Math.max(prob, d.h.p[i]));
  let tmin=99, tmax=-99, vmax=0; faixa(turno[0], turno[1], i=>{ tmin=Math.min(tmin,d.h.c[i]); tmax=Math.max(tmax,d.h.c[i]); vmax=Math.max(vmax,d.h.v[i]); });
  if(R.tMin!=null && tmin<R.tMin){ falhas.push(`frio: ${clNum(tmin)} °C`); motivo=motivo||{tipo:'frio', v:tmin}; }
  if(R.tMax!=null && tmax>R.tMax){ falhas.push(`calor: ${clNum(tmax)} °C`); motivo=motivo||{tipo:'calor', v:tmax}; }
  if(R.vento!=null && vmax>=R.vento){ falhas.push(`vento de ${clNum(vmax)} km/h`); motivo=motivo||{tipo:'vento', v:vmax}; }
  if(R.chuvaAntes){ let s=0; for(let i=Math.max(0,a-R.chuvaAntes.h); i<a; i++) s+=d.h.mm[i];
    if(s>R.chuvaAntes.mm){ falhas.push(`${clMm(s)} mm de chuva nas ${R.chuvaAntes.h} h antes`); motivo=motivo||{tipo:'encharcado', v:s}; } }
  return {ok:!falhas.length && completo, falhas, prob, motivo, completo, tmin, tmax, vmax};
}
/* Janelas boas: por dia, o primeiro início que passa na regra (o horário da atividade primeiro, depois 06–13h). */
function janelas(d, a){
  const agora=new Date().getHours(), hoje=clHoje(), dur=a.dur, out={};
  for(const x of d.dias){
    const ini=[a.ini, 6,7,8,9,10,11,12,13].find(h=>h+dur<=19 && (x.dia>hoje || h>agora) && (avaliar(d, a.regra, x.dia, h, dur)||{}).ok);
    if(ini!=null) out[x.dia]=ini;
  }
  return out;
}
/* A melhor janela para remarcar: a primeira depois do dia marcado; se não houver, a mais próxima antes (a partir de amanhã). */
function melhorJanela(js, dia){
  const ds=Object.keys(js).sort(), dep=ds.find(x=>x>dia), antes=ds.filter(x=>x<dia && x>clHoje()).pop();
  const k = dep || antes; return k ? {dia:k, ini:js[k]} : null;
}
function situacao(ob){
  const d=climaDe(ob); if(!d) return null;
  return ATV_CLIMA.filter(a=>a.obra===ob).map(a=>{
    const dia=diaAtv(a), ini=iniAtv(a), av=avaliar(d, a.regra, dia, ini, a.dur), js=janelas(d, a);
    const conflito = !!av && !av.ok && av.completo && !CLIMA.mantida[a.id];
    return {a, dia, ini, av, js, conflito, melhor:conflito?melhorJanela(js, dia):null};
  }).sort((x,y)=>x.dia<y.dia?-1:1);
}
const motivoTxt = m => !m ? 'tempo ruim' : m.tipo==='chuva' ? `${m.v}% de chuva` : m.tipo==='vento' ? `vento de ${clNum(m.v)} km/h` : m.tipo==='calor' ? `${clNum(m.v)} °C` : m.tipo==='frio' ? `${clNum(m.v)} °C` : `${clMm(m.v)} mm nas 48 h antes`;
/* Frase da decisão: "cai em 94% de chuva", "pega vento de 45 km/h", "pega o terreno encharcado (26 mm nas 48 h antes)" */
const motivoFrase = m => !m ? 'cai em tempo ruim' : m.tipo==='chuva' ? `cai em ${motivoTxt(m)}` : m.tipo==='encharcado' ? `pega o terreno encharcado (${motivoTxt(m)})` : `pega ${motivoTxt(m)}`;

/* ===================== AÇÕES ===================== */
function climaRemarcar(id, dia, ini){
  const a=ATV_CLIMA.find(x=>x.id===id); if(!a) return;
  const de={dia:diaAtv(a), ini:iniAtv(a)}, ant=CLIMA.remarc[a.id];
  CLIMA.remarc[id]={dia, ini, de, hora:hhmm()};
  CLIMA.ultima[a.obra]={id, tipo:'remarc', hora:hhmm()};
  const txt=`${a.nome} remarcada: ${clRot(de.dia)} → ${clRot(dia)}, ${clFaixa(ini, a.dur)}`;
  registrar(`${txt} (previsão Open-Meteo)`, {obra:a.obra, origem:'tela'});
  toastDesfazer(txt, ()=>{ ant ? CLIMA.remarc[id]=ant : delete CLIMA.remarc[id]; delete CLIMA.ultima[a.obra]; });
  manterRolagem(render);
}
function climaManter(id){
  const a=ATV_CLIMA.find(x=>x.id===id); if(!a) return;
  CLIMA.mantida[id]=true; CLIMA.ultima[a.obra]={id, tipo:'mantida', hora:hhmm()};
  const txt=`${a.nome}: mantida em ${clRot(diaAtv(a))} apesar da previsão`;
  registrar(txt, {obra:a.obra, origem:'tela'});
  toastDesfazer(txt, ()=>{ delete CLIMA.mantida[id]; delete CLIMA.ultima[a.obra]; });
  manterRolagem(render);
}
function climaDesfazer(ob){
  const u=CLIMA.ultima[ob]; if(!u) return; const a=ATV_CLIMA.find(x=>x.id===u.id);
  if(u.tipo==='remarc'){ const r=CLIMA.remarc[u.id]; delete CLIMA.remarc[u.id]; registrar(`Desfez: remarcação de ${a.nome} (volta para ${clRot(r.de.dia)})`, {obra:ob}); }
  else { delete CLIMA.mantida[u.id]; registrar(`Desfez: ${a.nome} mantida`, {obra:ob}); }
  delete CLIMA.ultima[ob]; toast('Desfeito'); manterRolagem(render);
}
function climaAtualizar(ob){ climaBuscar(ob, true); manterRolagem(render); }

/* ===================== TELA ===================== */
function iconeDia(x){ return x.mm>=1 || x.prob>=60 ? 'chuva' : x.vento>=40 ? 'vento' : x.prob>=30 ? 'nuvem' : 'sol'; }
const textoIcone = {chuva:'chuva', vento:'vento forte', nuvem:'nublado', sol:'sol'};
function climaEsqueleto(o){
  const cel = n => Array.from({length:n}, ()=>'<i class="cl-sk"></i>').join('');
  return `<div class="cl-cab"><p class="cl-real">${icon('nuvem',16)}<span>Buscando a previsão real de ${CLIMA_COORD[o.id][2]} para os próximos 16 dias…</span></p></div>
    <div class="cl-sk-dec" aria-hidden="true"><i class="cl-sk w60"></i><i class="cl-sk w40"></i></div>
    <div class="card cl-faixa-card" aria-busy="true"><h3>Próximos 16 dias</h3><div class="cl-sk-grid" aria-hidden="true">${cel(16*4)}</div></div>`;
}
function climaDecisao(o, sit){
  const u=CLIMA.ultima[o.id], linhas=[];
  if(u){ const a=ATV_CLIMA.find(x=>x.id===u.id), r=CLIMA.remarc[u.id];
    linhas.push(linhaDecisao({prazo:clRot(diaAtv(a)), tom:'ok', titulo:u.tipo==='remarc' ? `${a.nome}: de ${clRot(r.de.dia)} para ${clRot(r.dia)}, ${clFaixa(r.ini, a.dur)}` : `${a.nome}: mantida em ${clRot(diaAtv(a))}`,
      conta:a.doc?`${docRef(a.doc)} · ${a.det}`:a.det, estado:{feito:u.tipo==='remarc'?'Remarcada':'Mantida', hora:u.hora, quem:'Rizzi', desfazer:`climaDesfazer('${o.id}')`}})); }
  const s = sit.find(x=>x.conflito);
  if(s){
    const {a}=s, m=s.melhor;
    const titulo = `${a.nome} marcada para ${clRot(s.dia)} ${motivoFrase(s.av.motivo)}. ${m?`Melhor janela: ${clRot(m.dia)}, ${clFaixa(m.ini, a.dur)}. Remarcar?`:'Nenhuma janela boa nos 16 dias.'}`;
    linhas.push(linhaDecisao({prazo:clRot(s.dia), tom:'pede', titulo, foco:true, doc:a.doc,
      conta:`${REGRAS_CLIMA[a.regra].nome}: ${REGRAS_CLIMA[a.regra].texto}. Previsto: ${s.av.falhas.join('; ')}.${a.doc?' '+docRef(a.doc)+' · '+a.det:''}`,
      acao: m ? {label:`Remarcar para ${clRot(m.dia)}`, onclick:`climaRemarcar('${a.id}','${m.dia}',${m.ini})`} : {label:'Manter a data', onclick:`climaManter('${a.id}')`},
      sec:[m?{label:'Manter a data mesmo assim', onclick:`climaManter('${a.id}')`}:null, {label:'Perguntar ao agente sobre isto', onclick:`perguntarSobre('clima','${o.id}')`}].filter(Boolean)}));
  } else if(!u) linhas.push(linhaDecisao({prazo:'16 dias', tom:'ok', titulo:'Nenhuma atividade cai em dia ruim nos próximos 16 dias', conta:'Conferido contra a regra de cada atividade, hora a hora.'}));
  return listaDecisoes(linhas);
}
function climaFaixa(o, d, sit){
  const hoje=clHoje(), dias=d.dias.slice(0,16), col=x=>`${x.dia===hoje?' hj':''}${clDia(x.dia).getDay()===0?' dom':''}`;
  const linha = (rot, f, cls='') => `<div class="cl-rot${cls}">${rot}</div>${dias.map(x=>`<div class="cl-c${col(x)}${cls}">${f(x)}</div>`).join('')}`;
  const cab = `<div class="cl-rot cl-h"><span class="sr-only">Dia</span></div>${dias.map(x=>`<div class="cl-c cl-h${col(x)}"><b>${x.dia===hoje?'hoje':CL_SEM[clDia(x.dia).getDay()]}</b><span>${clDDMM(x.dia)}</span></div>`).join('')}`;
  const ic = linha('<span class="sr-only">Tempo</span>', x=>{ const k=iconeDia(x); return `<span class="cl-ic cl-${k}" title="${textoIcone[k]}" aria-label="${textoIcone[k]}">${icon(k,18)}</span>`; });
  const atvs = sit.map(s=>{
    const R=REGRAS_CLIMA[s.a.regra];
    return `<div class="cl-rot cl-atv" title="${esc(s.a.nome+' · '+R.texto)}"><b>${s.a.curto}</b><span>${clRot(s.dia)}</span></div>${dias.map(x=>{
      const boa=x.dia in s.js, marc=x.dia===s.dia, ruim=marc && s.av && !s.av.ok;
      const cls = marc ? (ruim?' cl-ruim':' cl-boa cl-marc') : boa ? ' cl-boa' : '';
      const lab = `${s.a.curto}, ${clRot(x.dia)}: ${marc?'dia marcado, ':''}${boa?'janela boa '+clFaixa(s.js[x.dia], s.a.dur):ruim?'tempo ruim':'fora da regra'}`;
      return `<div class="cl-c cl-j${col(x)}"><span class="cl-m${cls}" title="${esc(lab)}" aria-label="${esc(lab)}">${ruim?icon('alert',13):marc?icon('check',13):''}</span></div>`; }).join('')}`;
  }).join('');
  return `<div class="card cl-faixa-card"><h3>Próximos 16 dias <small>· ${CLIMA_COORD[o.id][2]} · chuva, máxima e mínima, vento</small></h3>
    <div class="cl-scroll"><div class="cl-grid" style="--n:${dias.length}">${cab}${ic}
      ${linha('Chuva <small>mm</small>', x=>`<span class="${x.mm>=10?'cl-forte':''}">${clMm(x.mm)}</span>`)}
      ${linha('Chance', x=>`<span class="${x.prob>=60?'cl-alta':''}">${x.prob}%</span>`)}
      ${linha('Máx · mín', x=>`<span>${clNum(x.tmax)}°</span><span class="mut">${clNum(x.tmin)}°</span>`, ' cl-t')}
      ${linha('Vento <small>km/h</small>', x=>`<span class="${x.vento>=40?'cl-forte':''}">${clNum(x.vento)}</span>`)}
      <div class="cl-div"></div>${atvs}</div></div>
    <div class="legend cl-leg"><span><i class="cl-m cl-boa"></i>janela boa pela regra</span><span><i class="cl-m cl-boa cl-marc"></i>dia marcado, tempo bom</span><span><i class="cl-m cl-ruim"></i>dia marcado, tempo ruim</span></div></div>`;
}
function climaTabela(o, sit){
  return `<div class="card"><h3>Atividades que dependem do tempo <small>· regra de cada uma</small></h3>
    <table class="sm cl-tab"><thead><tr><th>Atividade</th><th>Marcada</th><th>Regra</th><th>Situação</th><th>Próximas janelas</th></tr></thead><tbody>
    ${sit.map(s=>{ const R=REGRAS_CLIMA[s.a.regra], prox=Object.keys(s.js).sort().filter(x=>x!==s.dia).slice(0,3);
      const st = !s.av ? pill('gray','fora da previsão') : s.av.ok ? pill('ok','tempo bom') : CLIMA.mantida[s.a.id] ? pill('pede','mantida no dia ruim') : !s.av.completo ? pill('gray','previsão incompleta') : pill('pede', motivoTxt(s.av.motivo));
      return `<tr><td><b>${s.a.nome}</b><div class="mut">${s.a.doc?docRef(s.a.doc)+' · ':''}${s.a.det}</div></td><td class="num">${clRot(s.dia)}<div class="mut">${clFaixa(s.ini, s.a.dur)}</div></td><td class="cl-regra">${R.texto}</td><td>${st}</td>
        <td class="num">${prox.length?prox.map(x=>`${clRot(x)} <span class="mut">${clHH(s.js[x])}h</span>`).join('<br>'):'<span class="mut">nenhuma em 16 dias</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function climaKpis(d){
  const sete=d.dias.slice(0,7), secos=sete.filter(x=>x.mm<1 && x.prob<40).length, forte=d.dias.find(x=>x.mm>=10);
  return `<div class="grid g2 cl-kpis">${kpi({rotulo:'Dias secos nos próximos 7', valor:`${secos} de 7`, contexto:'chuva abaixo de 1 mm e chance abaixo de 40%', tom:secos>=4?'ok':undefined})}
    ${kpi({rotulo:'Próxima chuva forte', valor:forte?(forte.dia===clHoje()?'hoje':clRot(forte.dia)):'nenhuma', contexto:forte?`${clMm(forte.mm)} mm no dia · ${forte.prob}% de chance`:'nada acima de 10 mm em 16 dias'})}</div>`;
}
TAB_FNS.clima = o => {
  if(!CLIMA_COORD[o.id]) return `<p class="mut">Sem coordenadas para esta obra.</p>`;
  const d=climaDe(o.id); if(!d) return climaEsqueleto(o);
  const sit=situacao(o.id), fim=d.dias[Math.min(15, d.dias.length-1)].dia;
  const fonte = chipFonte({origem:'open-meteo', quem:d.exemplo?'exemplo':CLIMA_COORD[o.id][2], hora:`atualizado ${d.hora}`});
  return `<div class="cl-cab">
      <p class="cl-real">${icon('nuvem',16)}<span>${d.exemplo?'Previsão de exemplo':'Previsão real'}, de hoje (${clRot(d.dias[0].dia)}) a ${clRot(fim)}. Vale só nesta tela: o briefing e o roteiro da demo seguem com a previsão fixa.</span></p>
      <span class="sp"></span>${fonte}<button type="button" class="link" onclick="climaAtualizar('${o.id}')">Atualizar</button></div>
    ${d.exemplo?`<div class="callout cl-off" role="status">${icon('alert',15)}<span><b>Sem conexão: mostrando previsão de exemplo.</b> As janelas abaixo não valem para decidir. <button type="button" class="link" onclick="climaAtualizar('${o.id}')">Tentar de novo</button></span></div>`:''}
    ${climaDecisao(o, sit)}
    ${climaKpis(d)}
    ${climaFaixa(o, d, sit)}
    ${climaTabela(o, sit)}`;
};
/* O Galpão está em orçamento e a base mostra "em orçamento" nas outras telas; o Clima vale para ele (a terraplenagem é a primeira frente). */
/* (o core já deixa o clima aparecer em obra em orçamento) */

addCSS(`
.cl-cab{display:flex;align-items:center;gap:var(--s3);flex-wrap:wrap;margin:0 0 var(--s4)}
.cl-real{display:flex;align-items:flex-start;gap:var(--s2);margin:0;font-size:var(--t-meta);color:var(--ink2);max-width:68ch;text-wrap:pretty}
.cl-real .ic{color:var(--blueInk);flex:none;margin-top:1px}
.cl-cab .link{border:0;background:none;padding:0}
.cl-off{margin-bottom:var(--s4)} .cl-off .link{border:0;background:none;padding:0;margin-left:6px}
.cl-kpis{margin:var(--s5) 0}
.cl-faixa-card{margin-bottom:var(--s5)}
.cl-scroll{overflow-x:auto;margin:0 -8px;padding:0 8px}
.cl-grid{display:grid;grid-template-columns:96px repeat(var(--n),minmax(36px,1fr));font-size:var(--t-meta);font-variant-numeric:tabular-nums lining-nums;min-width:calc(96px + var(--n)*38px);column-gap:2px}
.cl-rot{display:flex;align-items:center;gap:4px;padding:5px 8px 5px 0;color:var(--muted);white-space:nowrap}
.cl-rot small{font-size:12px;color:var(--muted)}
.cl-c{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px 0;white-space:nowrap;text-align:center;color:var(--ink2);line-height:1.3}
.cl-c.hj{background:var(--sunk)}
.cl-c.cl-h{padding-top:2px} .cl-c.cl-h b{font-weight:600;color:var(--ink)} .cl-c.cl-h span{color:var(--muted);font-size:12px}
.cl-c.dom.cl-h b{color:var(--muted)}
.cl-grid>.cl-h:first-child,.cl-c.cl-h:nth-child(2){border-top-left-radius:8px}
.cl-c.cl-t{gap:0}
.cl-ic{display:inline-flex;color:var(--grayInk)} .cl-ic.cl-chuva{color:var(--blueInk)} .cl-ic.cl-sol{color:var(--accentInk)} .cl-ic.cl-vento{color:var(--ink2)}
.cl-forte{font-weight:600;color:var(--blueInk)} .cl-alta{font-weight:600;color:var(--ink)}
.cl-div{grid-column:1/-1;border-top:1px solid var(--line2);margin:6px 0 4px}
.cl-atv{flex-direction:column;align-items:flex-start;gap:0;line-height:1.3}
.cl-atv b{font-weight:600;color:var(--ink);font-size:var(--t-meta)} .cl-atv span{font-size:12px}
.cl-j{padding:3px 2px}
.cl-m{display:inline-grid;place-items:center;width:100%;max-width:34px;height:22px;border-radius:6px;background:transparent}
.cl-m.cl-boa{background:var(--greenSoft);color:var(--greenInk)}
.cl-m.cl-marc{box-shadow:inset 0 0 0 1.5px var(--greenInk)}
.cl-m.cl-ruim{background:var(--amberSoft);color:var(--amberInk);box-shadow:inset 0 0 0 1.5px var(--amberInk)}
.cl-leg{margin-top:var(--s3);display:flex;gap:var(--s4);flex-wrap:wrap;font-size:var(--t-meta);color:var(--muted)}
.cl-leg span{display:inline-flex;align-items:center;gap:6px} .cl-leg .cl-m{width:22px;height:14px;border-radius:4px}
.cl-tab td{vertical-align:top} .cl-tab .cl-regra{color:var(--ink2);max-width:32ch}
.cl-sk{display:block;height:12px;border-radius:6px;background:var(--line2);animation:clPulso 1.2s ease-in-out infinite alternate}
.cl-sk.w60{width:60%;height:14px} .cl-sk.w40{width:40%;margin-top:8px}
.cl-sk-dec{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px 20px;margin-bottom:var(--s5)}
.cl-sk-grid{display:grid;grid-template-columns:repeat(16,1fr);gap:10px 6px}
.cl-sk-grid .cl-sk{height:18px}
@keyframes clPulso{from{opacity:.55}to{opacity:1}}
@media (prefers-reduced-motion:reduce){ .cl-sk{animation:none} }
.cv-clima .cv-tab td{vertical-align:top}
`);

/* ===================== CONVERSA: "vai chover?", "dá para concretar esta semana?" ===================== */
const CLIMA_RE = /como (esta|vai|fica|anda) o tempo|\bvai chover\b|\bchover\b|previsao|\bclima\b|janela (boa |de tempo |para|pra)|tempo (bom|seco|firme)|da (pra|para) (concretar|pintar|cobrir|fazer o telhado|terraplen)|telhado .*(chuva|vento|tempo)|chuva (essa|esta|nesta|na proxima) semana/;
function cvClimaCartao(ob, m){
  const d=climaDe(ob);
  if(!d){ CLIMA.espera.add(ob); return cartao({titulo:`Previsão · ${curto(ob)}`, sub:chipFonte({origem:'open-meteo', quem:'buscando…'}), nivel:'consulta', classe:'cv-clima', corpo:`<p class="mut" style="margin:0">Buscando a previsão real de ${CLIMA_COORD[ob][2]}…</p>`}); }
  const sit=situacao(ob), sem=clMais(clHoje(), 6);
  const linhas = sit.map(s=>{ const js=Object.keys(s.js).filter(x=>x<=sem).sort();
    return `<tr><td><b class="cv-nm">${s.a.curto}</b></td><td>${clRot(s.dia)}${s.conflito?' '+pill('pede', motivoTxt(s.av.motivo)):''}</td><td>${js.length?js.slice(0,4).map(clRot).join(', '):'<span class="mut">nenhuma nesta semana</span>'}</td></tr>`; });
  return cartao({titulo:`Janelas da semana · ${curto(ob)}`, sub:chipFonte({origem:'open-meteo', quem:d.exemplo?'exemplo, sem conexão':CLIMA_COORD[ob][2], hora:`atualizado ${d.hora}`}), nivel:'consulta', classe:'cv-clima',
    corpo:tabela(['Atividade','Marcada','Janelas boas até '+clRot(sem)], linhas), rodape:`<span class="sp"></span>${botao('Abrir Clima', `abrirVisao('clima','${ob}')`, {sm:true, icone:'arrowRight'})}`});
}
function cvClimaTexto(ob){
  const d=climaDe(ob); if(!d) return `Vou olhar a previsão real (Open-Meteo) para ${curto(ob)} e cruzar com o que está marcado.`;
  const s=situacao(ob), c=s.find(x=>x.conflito), dias=d.dias.slice(0,7), secos=dias.filter(x=>x.mm<1 && x.prob<40).length;
  return `${d.exemplo?'<b>Sem conexão</b>: uso a previsão de exemplo. ':'Pela previsão real (Open-Meteo), de hoje em diante: '}${secos} dos próximos 7 dias são secos em ${CLIMA_COORD[ob][2]}. `+
    (c ? `A <b>${c.a.nome[0].toLowerCase()+c.a.nome.slice(1)}</b> marcada para <b>${clRot(c.dia)}</b> <b>${motivoFrase(c.av.motivo)}</b>${c.melhor?`; a melhor janela é <b>${clRot(c.melhor.dia)}, ${clFaixa(c.melhor.ini, c.a.dur)}</b>`:''}.` : `Nenhuma atividade marcada cai em dia ruim.`)+
    ` <span class="mut">O briefing segue com a previsão fixa da demo.</span>`;
}
if(typeof CV_EXT!=='undefined') CV_EXT.push({nome:'clima', casa:t=>CLIMA_RE.test(t),
  responde:(t, sessao, ob)=>{ ob = CLIMA_COORD[ob] ? ob : 'vila-nova'; climaDe(ob);
    return [cvMsg('agente', {nivel:'consulta', tools:['previsão do tempo · Open-Meteo','programação da obra'], visao:{chave:'clima', obra:ob},
      html:()=>cvClimaTexto(ob), cartoes:m=>[cvClimaCartao(ob, m)]})]; }});
