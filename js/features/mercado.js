/* Busca de preço (simulada), referência SINAPI, ida à loja, "você comprou?" e rastreio.
   API: buscarPreco(insumoOuTermo, obraId) abre a aba Buscar preço com o termo · TAB_FNS.mercado(o) · rastreioCard(l) (cartão de Pedidos).
   Ida à loja: mcIrLoja(ob, i) abre a busca real da loja em aba nova e guarda a ida; ao voltar (visibilitychange/blur→focus) pergunta
   "Você comprou?" (mcPerguntar). Sim → pedido em "Pedido enviado" (mcCriarPedido) · Ainda não → cotação vista · Não → motivo.
   Rastreio simulado: com código, um passo a cada MC.intervalo (setTimeout encadeado, um por pedido; para ao entregar). */

/* ---------- catálogo de exemplo: oferta = [loja, embalagem, unidades normalizadas por embalagem, preço da embalagem] ---------- */
const MC_MAT = [
  {id:'cim', re:/cimento|cp-?ii/, nome:'Cimento CP-II 50 kg', busca:'cimento cp ii 50 kg', un:'sc', kg:50, q:10,
   sinapi:{cod:'00001379', p:36.40, desc:'Cimento Portland composto CP II-32'},
   of:[['dep','saco 50 kg',1,35.90],['obramax','saco 50 kg',1,34.90],['cec','saco 50 kg',1,38.90],['leroy','saco 50 kg',1,39.90],['telha','saco 50 kg',1,41.50],['ml','saco 50 kg',1,44.90],['amz','saco 25 kg',.5,24.90]]},
  {id:'bloco', re:/bloco/, nome:'Bloco cerâmico 14×19×29', busca:'bloco cerâmico 14x19x29', un:'un', kg:6.5, q:1000,
   sinapi:{cod:'00007271', p:1.58, desc:'Bloco cerâmico de vedação 14 × 19 × 29 cm'},
   of:[['dep','milheiro',1000,1690],['obramax','unidade',1,1.79],['cec','unidade',1,1.95],['leroy','unidade',1,2.19],['telha','unidade',1,2.09],['ml','palete 500 un',500,1090]]},
  {id:'areia', re:/areia/, nome:'Areia média lavada', busca:'areia média', un:'m³', kg:1500, q:3,
   sinapi:{cod:'00000370', p:128, desc:'Areia média, posto jazida/fornecedor'},
   of:[['dep2','m³ a granel · caçamba',1,118],['dep','m³ a granel',1,135],['ml','big bag 1 m³',1,229],['obramax','saco 20 kg',1/75,5.49],['leroy','saco 20 kg',1/75,6.99]]},
  {id:'brita', re:/brita|pedra britada/, nome:'Brita 1', busca:'brita 1', un:'m³', kg:1400, q:3,
   sinapi:{cod:'00004721', p:118, desc:'Pedra britada nº 1'},
   of:[['dep2','m³ a granel · caçamba',1,112],['dep','m³ a granel',1,126],['ml','big bag 1 m³',1,239],['obramax','saco 20 kg',1/70,5.79],['leroy','saco 20 kg',1/70,6.99]]},
  {id:'aco', re:/\baco\b|vergalh|ca-?50|ferro/, nome:'Aço CA-50 10 mm', busca:'vergalhão ca-50 10mm', un:'kg', kg:1, q:300,
   sinapi:{cod:'00000032', p:7.70, desc:'Aço CA-50, 10,0 mm, vergalhão'}, nota:'O varejo vende em barra de 12 m; cortado e dobrado sai na distribuidora (veja Falta comprar).',
   of:[['dep','barra 12 m · 7,4 kg',7.4,59.90],['obramax','barra 12 m · 7,4 kg',7.4,56.90],['cec','barra 12 m · 7,4 kg',7.4,64.90],['leroy','barra 12 m · 7,4 kg',7.4,69.90],['telha','barra 12 m · 7,4 kg',7.4,67.90],['ml','barra 12 m · 7,4 kg',7.4,62.00]]},
  {id:'telha', re:/telha/, nome:'Telha cerâmica portuguesa', busca:'telha cerâmica portuguesa', un:'un', kg:2.6, q:1000,
   sinapi:{cod:'00007184', p:2.35, desc:'Telha cerâmica tipo portuguesa'},
   of:[['dep','milheiro',1000,2390],['obramax','unidade',1,2.49],['cec','unidade',1,2.79],['leroy','unidade',1,3.19],['telha','unidade',1,2.99],['ml','pacote 100 un',100,289]]},
  {id:'fio', re:/\bcabo\b|\bfio\b|2,5 ?mm/, nome:'Cabo flexível 2,5 mm² · rolo 100 m', busca:'cabo flexível 2,5mm rolo 100m', un:'rolo', kg:3, q:5,
   sinapi:{cod:'00000981', p:210, desc:'Cabo flexível 750 V 2,5 mm² (100 m)'},
   of:[['leroy','rolo 100 m',1,229.90],['telha','rolo 100 m',1,219.90],['cec','rolo 100 m',1,214.90],['obramax','rolo 100 m',1,199.90],['ml','rolo 100 m',1,209],['amz','rolo 100 m',1,236.90],['dep','rolo 100 m',1,225]]},
  {id:'arg', re:/argamassa|ac-?iii/, nome:'Argamassa AC-III 20 kg', busca:'argamassa ac iii 20kg', un:'sc', kg:20, q:20,
   sinapi:{cod:'00037595', p:41.50, desc:'Argamassa colante AC-III'},
   of:[['leroy','saco 20 kg',1,46.90],['telha','saco 20 kg',1,44.90],['cec','saco 20 kg',1,43.90],['obramax','saco 20 kg',1,39.90],['ml','saco 20 kg',1,49.90],['amz','saco 20 kg',1,52.90],['dep','saco 20 kg',1,42.50]]},
  {id:'rejunte', re:/rejunte/, nome:'Rejunte acrílico 1 kg', busca:'rejunte acrílico 1kg', un:'un', kg:1, q:20,
   sinapi:{cod:'00034357', p:26.90, desc:'Rejunte acrílico'},
   of:[['leroy','pote 1 kg',1,31.90],['telha','pote 1 kg',1,29.90],['cec','pote 1 kg',1,28.90],['obramax','pote 1 kg',1,25.90],['ml','pote 1 kg',1,27.50],['amz','pote 1 kg',1,33.90]]},
  {id:'tinta', re:/tinta/, nome:'Tinta acrílica fosca 18 L', busca:'tinta acrílica fosca 18 litros', un:'lata', kg:25, q:6,
   sinapi:{cod:'00007356', p:412, desc:'Tinta acrílica premium, 18 L'},
   of:[['leroy','lata 18 L',1,459.90],['telha','lata 18 L',1,439.90],['cec','lata 18 L',1,429.90],['obramax','lata 18 L',1,389.90],['ml','lata 18 L',1,419],['amz','lata 18 L',1,469.90],['dep','lata 18 L',1,445]]},
  {id:'paraf', re:/parafuso/, nome:'Parafuso 5/16" × 2"', busca:'parafuso 5/16 x 2', un:'un', kg:.03, q:100,
   sinapi:{cod:'00004377', p:0.45, desc:'Parafuso zincado 5/16" × 2"'},
   of:[['dep','unidade',1,.52],['obramax','caixa 100 un',100,41.90],['cec','caixa 100 un',100,48.90],['ml','caixa 100 un',100,39.90],['leroy','caixa 50 un',50,29.90],['telha','caixa 50 un',50,27.90],['amz','caixa 50 un',50,32.90]]},
  {id:'prego', re:/prego/, nome:'Prego 18×27', busca:'prego 18x27', un:'kg', kg:1, q:10,
   sinapi:{cod:'00005075', p:19.80, desc:'Prego de aço polido 18 × 27'},
   of:[['dep','kg',1,20.50],['obramax','pacote 1 kg',1,18.90],['cec','pacote 1 kg',1,21.90],['ml','caixa 5 kg',5,99],['leroy','pacote 1 kg',1,24.90],['telha','pacote 1 kg',1,23.90],['amz','pacote 1 kg',1,27.90]]},
  {id:'led', re:/luminaria|\bled\b/, nome:'Luminária LED de embutir 18 W', busca:'luminária led embutir 18w', un:'un', kg:.4, q:10,
   sinapi:{cod:'00039387', p:52, desc:'Luminária LED de embutir 18 W'},
   of:[['leroy','unidade',1,59.90],['telha','unidade',1,54.90],['cec','unidade',1,56.90],['obramax','unidade',1,47.90],['ml','unidade',1,44.90],['amz','unidade',1,49.90]]},
  {id:'concreto', re:/concreto/, nome:'Concreto usinado fck 25', un:'m³', semLoja:true, sinapi:{cod:'00034494', p:520, desc:'Concreto usinado bombeável fck 25 MPa'}},
];
const MC_REGIAO = {
  'vila-nova':{cep:'13092-150', cidade:'Campinas', dep:'Depósito São Bento', dep2:'Areial Jaguari'},
  'loja-centro':{cep:'13270-210', cidade:'Valinhos', dep:'Depósito Bela Vista', dep2:'Areial Capivari'},
  'galpao':{cep:'13170-000', cidade:'Sumaré', dep:'Depósito Nova Veneza', dep2:'Areial Sumaré'},
};
const mcEnc = t => encodeURIComponent(String(t).trim());
const mcGoogle = q => `https://www.google.com/search?q=${mcEnc(q)}`;
/* URLs de busca genéricas e estáveis. Telhanorte, C&C e Obramax: busca do Google restrita ao site (formato próprio incerto).
   Depósitos da região são de exemplo: abre o mapa com depósitos perto do CEP da obra. */
const MC_LOJA = {
  leroy:  {n:'Leroy Merlin', tipo:'home center', dias:3, frete:[59.9, 899, .06], url:t=>`https://www.leroymerlin.com.br/search?term=${mcEnc(t)}`},
  telha:  {n:'Telhanorte', tipo:'home center', dias:2, frete:[49.9, 699, .05], url:t=>mcGoogle(`${t} site:telhanorte.com.br`)},
  cec:    {n:'C&C', tipo:'home center', dias:3, frete:[54.9, 799, .05], url:t=>mcGoogle(`${t} site:cec.com.br`)},
  obramax:{n:'Obramax', tipo:'atacarejo', dias:2, frete:[89, 1500, .04], url:t=>mcGoogle(`${t} site:obramax.com.br`)},
  ml:     {n:'Mercado Livre', tipo:'marketplace', dias:4, frete:[39.9, 199, .09], pesado:true, url:t=>`https://lista.mercadolivre.com.br/${encodeURIComponent(String(t).trim().replace(/\s+/g,'-'))}`},
  amz:    {n:'Amazon', tipo:'marketplace', dias:3, frete:[29.9, 149, .12], pesado:true, url:t=>`https://www.amazon.com.br/s?k=${mcEnc(t)}`},
  dep:    {n:ob=>MC_REGIAO[ob].dep, regiao:true, dias:1, frete:[60, 1200, 0], url:(t,ob)=>`https://www.google.com/maps/search/${mcEnc('depósito de material de construção '+MC_REGIAO[ob].cep)}`},
  dep2:   {n:ob=>MC_REGIAO[ob].dep2, regiao:true, dias:1, frete:[180, 1e9, 0], url:(t,ob)=>`https://www.google.com/maps/search/${mcEnc('areial '+MC_REGIAO[ob].cidade)}`},
};
const mcLojaNome = (k, ob) => { const n=MC_LOJA[k].n; return typeof n==='function' ? n(ob) : n; };
/* no/na: compara sem acento, porque o nome pode chegar com o acento decomposto (NFD) e o regex falhava. */
const mcNa = loja => (/^(mercado|deposito|areial)/.test(String(loja).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()) ? 'no ' : 'na ')+loja;
const MC_SHOP = t => `https://www.google.com/search?tbm=shop&q=${mcEnc(t)}`;   // "comparar no Google Shopping"

/* ---------- estado ---------- */
const MC = {termo:{}, idas:{}, ida:null, saiu:false, tm:{}, intervalo:20000, ultimoPed:null, rascunho:null};
const mcHash = s => { let h=2166136261; for(const c of String(s)) h=Math.imul(h^c.charCodeAt(0), 16777619); return (h>>>0)/4294967296; };
const mcRef = ob => MC_REGIAO[ob] || MC_REGIAO['vila-nova'];
const mcNorm = t => String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
const mcMat = termo => { const t=mcNorm(termo); return t ? MC_MAT.find(m=>m.re.test(t)) : null; };
const mcUn = (v, un) => `${brl2(v)}/${un}`;
function mcDiaUtil(n){ const d=new Date(2026, HOJE.m-1, HOJE.d); let k=0; while(k<n){ d.setDate(d.getDate()+1); if(d.getDay()%6) k++; } return d; }
const mcDM = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
const mcISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const mcPrazoTxt = n => n<=1 ? `amanhã · ${mcDM(mcDiaUtil(1))}` : `${n} dias úteis · ${mcDM(mcDiaUtil(n))}`;
/* termômetro da SINAPI: referência de custo de obra, não ranking */
function mcFaixa(pct){
  if(pct==null) return {k:'sem', tom:'info', txt:'sem referência'};
  if(pct< -10) return {k:'abaixo', tom:'info', txt:'abaixo da referência'};
  if(pct<=5) return {k:'dentro', tom:'ok', txt:'dentro da referência'};
  if(pct<=20) return {k:'acima', tom:'pede', txt:'acima da referência'};
  return {k:'bem', tom:'pede', txt:'bem acima da referência'};
}
const mcPct = p => (p>0?'+':p<0?'−':'±')+Math.abs(p)+'%';

/* insumo da obra que bate com o material (para a quantidade e para ligar o pedido ao almoxarifado) */
function mcInsumo(ob, mat){
  if(!mat) return null; const d=dados(ob);
  const c=d.comp.find(x=>mat.re.test(mcNorm(x.nome)) || (x.inv||x.id)===mat.id);
  const i=d.inv.find(x=>mat.re.test(mcNorm(x.nome)) || x.id===mat.id);
  const inv=(c&&(c.inv||c.id))||(i&&i.id); if(!inv) return null;
  return {inv, k:contaDe(ob, inv), nome:(c||i).nome};
}
/* resultados determinísticos por termo: preço da embalagem ±2% (hash do termo + loja), frete pelo peso, prazo pelo CEP */
function mcResultados(termo, ob){
  const mat=mcMat(termo), t=mcNorm(termo);
  if(mat && mat.semLoja) return {mat, semLoja:true, lista:[]};
  const ins=mcInsumo(ob, mat), q=ins&&ins.k.comprar>0 ? ins.k.comprar : (mat?mat.q:1), un=mat?mat.un:'un';
  const ofertas = mat ? mat.of : ['leroy','telha','cec','obramax','ml','amz'].map((k,j)=>[k,'unidade',1, Math.round((40+mcHash(t)*260)*(1+(j-2)*.05)*100)/100]);
  const lista = ofertas.map(([k, emb, fator, preco], i)=>{
    const L=MC_LOJA[k], pk=Math.round(preco*(1+(mcHash(t+k)-.5)*.04)*100)/100, pUn=pk/fator;
    const pacotes=Math.ceil(q/fator-1e-9), sub=pacotes*pk, peso=q*(mat?mat.kg:1);
    const [fixo, gratis, porKg]=L.frete, semGratis=L.pesado && peso>300;
    const frete = !semGratis && sub>=gratis ? 0 : Math.round((fixo + porKg*peso)*100)/100;
    const dias = L.dias + (L.pesado ? Math.ceil(peso/1000) : 0);
    const pct = mat&&mat.sinapi ? Math.round((pUn/mat.sinapi.p-1)*100) : null;
    return {i, k, loja:mcLojaNome(k, ob), regiao:!!L.regiao, tipo:L.regiao?'depósito da região (exemplo)':L.tipo, emb, fator, pk, pUn, pacotes, sub, frete, dias, total:sub+frete, pct, faixa:mcFaixa(pct), q, un};
  }).sort((a,b)=>a.total-b.total);
  return {mat, ins, q, un, lista, busca:mat&&mat.busca || termo};
}
function mcTermoInicial(ob){
  const d=dados(ob), f=d.comp.find(c=>contaDe(ob,c.inv||c.id).comprar>0) || d.comp[0];
  return f ? f.nome : '';
}

/* ---------- abrir a tela ---------- */
function buscarPreco(insumo, obraId){
  const ob=obraId || state.obra || 'vila-nova', d=dados(ob);
  const c=d.comp.find(x=>x.id===insumo || (x.inv||x.id)===insumo), i=d.inv.find(x=>x.id===insumo);
  const termo=(c||i||{}).nome || String(insumo||'');
  MC.termo[ob]=termo;
  abrirVisao('mercado', ob, {filtro:termo});
}
function mcBuscar(ob){ const v=($('mcQ')||{}).value||''; if(!v.trim()){ toast('Escreva o material que você quer cotar'); return; } MC.termo[ob]=v.trim(); render(); }
function mcAtalho(ob, termo){ MC.termo[ob]=termo; render(); setTimeout(()=>{ const e=$('mcRes'); if(e) e.focus({preventScroll:true}); }, 0); }

TAB_FNS.mercado = o => {
  const v=state.visao;
  if(v && v.chave==='mercado' && v.filtro){                       // o filtro da aba é o termo da busca (não um destaque)
    MC.termo[o.id]=v.filtro; v.filtro=null;
    setTimeout(()=>{ const e=$('vsFiltro'); if(e) e.innerHTML=''; }, 0);
  }
  if(MC.termo[o.id]==null) MC.termo[o.id]=mcTermoInicial(o.id);
  const termo=MC.termo[o.id], d=dados(o.id), reg=mcRef(o.id);
  const falta=d.comp.map(c=>({c, k:contaDe(o.id,c.inv||c.id)})).filter(x=>x.k.comprar>0);
  const atalhos=(falta.length?falta:d.comp.map(c=>({c, k:null}))).slice(0,6);
  const chip=x=>`<button type="button" class="chip mc-chip${mcNorm(x.c.nome)===mcNorm(termo)?' on':''}" onclick="mcAtalho('${o.id}','${esc(x.c.nome).replace(/'/g,"\\'")}')">${x.c.nome}${x.k?` <span class="mut">· ${num(x.k.comprar)} ${x.k.un}</span>`:''}</button>`;
  return `${val('Eles compram no varejo (Leroy, Telhanorte, Mercado Livre) para a obra, ou só com o depósito da região? A SINAPI serve de termômetro para eles, ou o que vale é o preço do último pedido?')}
  <div class="mc-sim" role="note">${pill('info', icon('flask',12)+'Resultados simulados no protótipo')}<span>Preços, fretes e prazos abaixo são de exemplo. <b>Ir para a loja</b> abre a busca de verdade, em outra aba.</span></div>
  <form class="mc-busca" onsubmit="mcBuscar('${o.id}');return false" role="search">
    <label class="sr-only" for="mcQ">Material para cotar</label>
    <span class="mc-q">${icon('busca',16)}<input id="mcQ" class="f" type="search" autocomplete="off" value="${esc(termo)}" placeholder="Material, ex.: cimento CP-II 50 kg"></span>
    ${botao('Buscar preço', '', {pri:true}).replace('type="button"','type="submit"')}
  </form>
  ${atalhos.length?`<div class="mc-atalhos"><span class="sm mut">${falta.length?'Em falta na obra':'Insumos da obra'}</span>${atalhos.map(chip).join('')}</div>`:''}
  ${termo?mcResultadosHTML(termo, o.id, reg):`<div class="card sup-vazio">${icon('busca',18)}<span>Escreva um material para comparar o preço nas lojas com a referência SINAPI.</span></div>`}
  ${mcIdasHTML(o.id)}`;
};

function mcResultadosHTML(termo, ob, reg){
  const r=mcResultados(termo, ob), m=r.mat;
  if(r.semLoja) return `<section class="sup-bloco" id="mcRes" tabindex="-1"><h3 class="sup-h">${m.nome}</h3><div class="card mc-nota">${icon('info',16)}<span>Concreto usinado não se compra em loja: é programado com a concreteira, por concretagem. Referência SINAPI (exemplo) set/26: <b>${mcUn(m.sinapi.p, m.un)}</b>. As cotações das concreteiras estão em ${docRef('PED-0166')} e em Falta comprar.</span></div></section>`;
  const L=r.lista, menor=L[0], s=m&&m.sinapi, conta={dentro:0, acima:0, bem:0, abaixo:0};
  L.forEach(x=>{ if(conta[x.faixa.k]!=null) conta[x.faixa.k]++; });
  const qTxt = r.ins&&r.ins.k.comprar>0 ? `${num(r.q)} ${r.un} · o que falta na obra` : `${num(r.q)} ${r.un} · quantidade de exemplo`;
  const resumo = s ? [conta.dentro&&`${conta.dentro} dentro`, conta.acima&&`${conta.acima} acima`, conta.bem&&`${conta.bem} bem acima`, conta.abaixo&&`${conta.abaixo} abaixo`].filter(Boolean).join(' · ') : '';
  const linha = x => `<tr><td><b>${x.loja}</b><div class="sm mut">${x.tipo}</div></td>
      <td class="num"><b>${mcUn(x.pUn, r.un)}</b><div class="sm mut">${num(x.pacotes)} × ${x.emb.split(' · ')[0]}${x.fator!==1?` a ${brl2(x.pk)}`:''}</div></td>
      <td>${s?`${pill(x.faixa.tom, `${mcPct(x.pct)} vs SINAPI`)}<div class="sm mut mc-fx">${x.faixa.txt}</div>`:pill('info','sem referência')}</td>
      <td class="num"><b>${brl(x.total)}</b><div class="sm mut">${x.frete?`frete ${brl(x.frete)}`:'frete grátis'} · chega ${mcDM(mcDiaUtil(x.dias))}</div></td>
      <td class="mc-acts">${botao(`${icon('externo',14)}Ir para a loja`, `mcIrLoja('${ob}',${x.i})`, {sm:true, title:`Abre a busca da ${x.loja} em outra aba`})}${menuMais([
        {label:`${icon('check',15)}Já comprei aqui`, onclick:`mcJaComprei('${ob}',${x.i})`},
        {label:`${icon('clip',15)}Guardar como cotação vista`, onclick:`mcGuardar('${ob}',${x.i})`},
        {label:`${icon('busca',15)}Comparar no Google Shopping`, onclick:`window.open('${MC_SHOP(r.busca)}','_blank','noopener')`}], {rotulo:`Mais ações · ${x.loja}`})}</td></tr>`;
  return `<section class="sup-bloco" id="mcRes" tabindex="-1" aria-live="polite">
    <div class="sup-cab"><p class="sup-frase"><b>${m?m.nome:esc(termo)}</b> · ${L.length} lojas · entrega no CEP ${reg.cep} (${reg.cidade})</p><span class="sm mut">total para ${qTxt}</span></div>
    ${m&&m.nota?`<p class="sup-sub">${m.nota}</p>`:''}
    <div class="grid g2 mc-kpis">${kpi({rotulo:'Referência SINAPI SP (exemplo) set/26', valor:s?mcUn(s.p, r.un):'—', contexto:s?`${s.cod} · ${s.desc} · custo de obra, não preço de balcão`:'sem referência SINAPI para este termo no protótipo'})}
      ${kpi({rotulo:'Menor total entregue', valor:brl(menor.total), contexto:`${menor.loja} · ${num(r.q)} ${r.un} com frete · ${mcPrazoTxt(menor.dias)}`})}</div>
    <div class="card sup-tab mc-tab" style="padding:0">
      ${s?mcTermometro(L, s, r.un, resumo):''}
      <table><thead><tr><th>Loja</th><th class="num">Preço por ${r.un}</th><th>vs SINAPI</th><th class="num">Total entregue</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${L.map(linha).join('')}</tbody></table>
      <div class="sup-pe-bloco"><span class="sm mut">Ordenado pelo total entregue (preço × embalagens + frete). A SINAPI é a referência de custo de obra: mostra se o preço está dentro ou acima, não qual loja escolher.</span></div>
    </div></section>`;
}
/* faixa de −20% a +60%: dentro (até +5%), acima (até +20%), bem acima; um ponto por loja */
function mcTermometro(L, s, un, resumo){
  const pos = p => Math.max(0, Math.min(100, (p+20)/80*100));
  const pts = L.map(x=>`<span class="mc-pt mc-${x.faixa.k}${x.pct>60?' fora':''}" style="left:${pos(x.pct)}%" title="${esc(x.loja)} · ${mcPct(x.pct)}"></span>`).join('');
  return `<div class="mc-term"><div class="mc-term-t"><b>Termômetro SINAPI</b><span class="sm mut">${resumo}</span></div>
    <div class="mc-barra" aria-hidden="true"><span class="z z1" style="left:0;width:${pos(5)}%"></span><span class="z z2" style="left:${pos(5)}%;width:${pos(20)-pos(5)}%"></span><span class="z z3" style="left:${pos(20)}%;right:0"></span>
      <span class="mc-ref" style="left:${pos(0)}%"></span>${pts}</div>
    <div class="mc-leg" aria-hidden="true"><span style="left:${pos(0)}%">SINAPI ${mcUn(s.p, un)}</span><span style="left:${pos(20)}%">+20%</span><span style="right:0">+60% ou mais</span></div></div>`;
}

/* ---------- ida à loja e volta ---------- */
function mcNovaIda(ob, i, termo){
  const r=mcResultados(termo||MC.termo[ob]||mcTermoInicial(ob), ob), x=r.lista.find(y=>y.i===i) || r.lista[0]; if(!x) return null;
  const ida={id:'ida'+Date.now()+Math.floor(mcHash(x.loja+Math.random())*1e4), ob, k:x.k, loja:x.loja, termo:r.busca, mat:r.mat?r.mat.nome:termo, matId:r.mat&&r.mat.id,
    inv:r.ins&&r.ins.inv, un:r.un, q:r.q, preco:x.pUn, frete:x.frete, dias:x.dias, hora:hhmm(), estado:'aberta'};
  (MC.idas[ob] ||= []).unshift(ida);
  return ida;
}
function mcIrLoja(ob, i){
  const ida=mcNovaIda(ob, i); if(!ida) return;
  const url=MC_LOJA[ida.k].url(ida.termo, ob);
  registrar(`Abriu a busca ${mcNa(ida.loja).replace(/^n/,'d')} para ver ${ida.mat} · ${mcUn(ida.preco, ida.un)} visto no Canteiro`, {obra:ob});
  MC.ida=ida; MC.saiu=false;
  window.open(url, '_blank', 'noopener');                       // com noopener o retorno é sempre null: a pergunta vem na volta
  render();
}
/* A volta: a aba fica oculta (visibilitychange) ou a janela perde o foco (blur, se a loja abrir em janela) depois de uma ida;
   quando volta a ficar visível/focada, pergunta uma vez. Se o usuário fechar sem responder, a ida fica na lista para responder depois. */
document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ if(MC.ida) MC.saiu=true; } else mcVoltou(); });
addEventListener('blur', ()=>{ if(MC.ida) MC.saiu=true; });
addEventListener('focus', ()=>mcVoltou());
function mcVoltou(){
  if(!MC.ida || !MC.saiu || document.hidden) return;
  const ida=MC.ida; MC.ida=null; MC.saiu=false;
  setTimeout(()=>{ if(ida.estado==='aberta') mcPerguntar(ida.id); }, 350);
}
function mcSimularVolta(ob='vila-nova', i){ const ida=mcNovaIda(ob, i ?? 0); if(ida){ MC.ida=ida; MC.saiu=true; mcVoltou(); } return ida; }   // demo e testes
const mcAchaIda = id => { for(const L of Object.values(MC.idas)){ const x=L.find(y=>y.id===id); if(x) return x; } return null; };

function mcPerguntar(id){
  const ida=mcAchaIda(id); if(!ida) return;
  abrirModal(`<h2 style="margin:0 0 6px">Você comprou ${mcNa(ida.loja)}?</h2>
    <p class="mut sm" style="margin:0 0 16px">${ida.mat} · você viu ${mcUn(ida.preco, ida.un)} às ${ida.hora} · ${NOME_OBRA[ida.ob]}</p>
    <p class="sm" style="margin:0;max-width:56ch">Se comprou, o pedido entra em <b>Pedidos</b> como "Pedido enviado" e o rastreio vai movendo o cartão até a obra.</p>
    <div class="row" style="margin-top:22px">${botao('Não comprei', `mcNao('${id}')`)}${botao('Ainda não', `mcAindaNao('${id}')`)}<span class="sp"></span>${botao('Sim, comprei', `mcSim('${id}')`, {pri:true})}</div>`);
}
function mcSim(id){
  const ida=mcAchaIda(id); if(!ida) return;
  const n=mcProxPed(), prev=mcISO(mcDiaUtil(ida.dias));
  abrirModal(`<h2 style="margin:0 0 6px">Compra ${mcNa(ida.loja)}</h2>
    <p class="mut sm" style="margin:0 0 4px">${ida.mat} · vira o ${n} em Pedidos, na coluna "Pedido enviado". Só a quantidade é obrigatória.</p>
    <div class="grid g2" style="gap:0 14px">
      <div><label class="l" for="mcCq">Quantidade (${ida.un})</label><input class="f" id="mcCq" type="number" min="0" step="any" inputmode="decimal" value="${ida.q}" required aria-describedby="mcCqErr"><div id="mcCqErr" class="sm t-perda" role="alert"></div></div>
      <div><label class="l" for="mcCp">Preço pago por ${ida.un}</label><input class="f" id="mcCp" type="number" min="0" step="0.01" inputmode="decimal" value="${ida.preco.toFixed(2)}"></div>
      <div><label class="l" for="mcCe">Previsão de entrega</label><input class="f" id="mcCe" type="date" value="${prev}"></div>
      <div><label class="l" for="mcCn">Nº do pedido na loja</label><input class="f" id="mcCn" type="text" autocomplete="off" placeholder="opcional"></div>
    </div>
    <label class="l" for="mcCr">Código de rastreio</label><input class="f" id="mcCr" type="text" autocomplete="off" placeholder="ex.: QB123456789BR · opcional, dá para pôr depois">
    <div class="row" style="margin-top:22px">${botao('Voltar', `mcPerguntar('${id}')`)}<span class="sp"></span>${botao(`Criar ${n}`, `mcCriarPedido('${id}')`, {pri:true})}</div>`);
  setTimeout(()=>{ const e=$('mcCq'); if(e) e.select(); }, 30);
}
function mcProxPed(){ let m=0; Object.values(DADOS).forEach(d=>d.lotes.forEach(l=>{ const k=+String(l.id).replace(/\D/g,''); if(k>m) m=k; })); return 'PED-'+String(m+1).padStart(4,'0'); }
const mcTransp = (cod, k) => /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(cod) ? 'Correios' : k==='ml' ? 'Mercado Envios' : k==='amz' ? 'Amazon' : 'transportadora da loja';
function mcCriarPedido(id, campos){
  const ida=mcAchaIda(id); if(!ida) return;
  const val = k => campos ? campos[k] : (($(k)||{}).value||'').trim();
  const q=+String(val('mcCq')).replace(',','.');
  if(!(q>0)){ const e=$('mcCqErr'); if(e) e.textContent='Informe a quantidade comprada'; const c=$('mcCq'); if(c) c.focus(); return; }
  const p=+String(val('mcCp')||ida.preco).replace(',','.') || ida.preco, ent=val('mcCe'), npl=val('mcCn'), cod=String(val('mcCr')||'').toUpperCase().replace(/\s/g,'');
  const pid=mcProxPed(), d=dados(ida.ob), entTxt=ent ? ent.split('-').reverse().slice(0,2).join('/') : mcDM(mcDiaUtil(ida.dias));
  const l={id:pid, inv:ida.inv||ida.matId, qn:q, un:ida.un, item:ida.mat, q:`${num(q)} ${ida.un}`, forn:ida.loja, v:Math.round(q*p + (ida.frete||0)), eta:`previsto ${entTxt}${npl?` · pedido ${npl}`:''}`, col:2,
    mc:{ida:id, k:ida.k, cod, transp:cod?mcTransp(cod, ida.k):'', npl, passo:0, hist:[{st:'Comprado na loja', fonte:`você · Buscar preço`, hora:hhmm()}]}};
  d.lotes.push(l);
  ida.estado='comprou'; ida.ped=pid; ida.horaR=hhmm();
  registrar(`${pid} criado · ${num(q)} ${ida.un} de ${ida.mat} ${mcNa(ida.loja)} · ${brl(l.v)} · comprado fora do Canteiro${cod?` · rastreio ${cod}`:''}`, {obra:ida.ob});
  MC.ultimoPed=pid;
  if(cod) mcAgendar(pid);
  closeModal();
  toastDesfazer(`${pid} em Pedido enviado · ${ida.loja}${cod?' · rastreio ligado':''}`, ()=>{ mcParar(pid); const k=d.lotes.indexOf(l); if(k>=0) d.lotes.splice(k,1); ida.estado='aberta'; delete ida.ped; });
  render();
  return pid;
}
function mcAindaNao(id){
  const ida=mcAchaIda(id); if(!ida) return; const antes=ida.estado;
  ida.estado='cotacao'; ida.horaR=hhmm(); closeModal();
  registrar(`Cotação vista guardada · ${ida.mat} · ${ida.loja} · ${mcUn(ida.preco, ida.un)}`, {obra:ida.ob});
  toastDesfazer(`Cotação da ${ida.loja} guardada em Buscar preço`, ()=>{ ida.estado=antes; });
  render();
}
const MC_MOTIVO = [['preco','Preço'],['prazo','Prazo'],['frete','Frete'],['outro','Outro']];
function mcNao(id){
  const ida=mcAchaIda(id); if(!ida) return;
  abrirModal(`<h2 style="margin:0 0 6px">Por que não comprou ${mcNa(ida.loja)}?</h2><p class="mut sm" style="margin:0 0 16px">Um toque. Ajuda o agente a sugerir melhor da próxima vez.</p>
    <div class="mc-motivos">${MC_MOTIVO.map(([k,t])=>botao(t, `mcMotivo('${id}','${k}')`)).join('')}</div>
    <div class="row" style="margin-top:22px">${botao('Voltar', `mcPerguntar('${id}')`)}</div>`);
}
function mcMotivo(id, k){
  const ida=mcAchaIda(id); if(!ida) return; const antes=ida.estado, t=(MC_MOTIVO.find(x=>x[0]===k)||[])[1]||k;
  ida.estado='nao'; ida.motivo=t; ida.horaR=hhmm(); closeModal();
  registrar(`Não comprou ${ida.mat} ${mcNa(ida.loja)} · motivo: ${t.toLowerCase()}`, {obra:ida.ob});
  toastDesfazer(`Anotado: não comprou ${mcNa(ida.loja)} (${t.toLowerCase()})`, ()=>{ ida.estado=antes; delete ida.motivo; });
  render();
}
function mcJaComprei(ob, i){ const ida=mcNovaIda(ob, i); if(ida) mcSim(ida.id); }
function mcGuardar(ob, i){ const ida=mcNovaIda(ob, i); if(ida) mcAindaNao(ida.id); }

function mcIdasHTML(ob){
  const L=MC.idas[ob]||[]; if(!L.length) return '';
  const linha = x => {
    const tit=`${x.mat} · ${x.loja}`, conta=`visto ${mcUn(x.preco, x.un)} às ${x.hora}`;
    if(x.estado==='comprou'){ const f=acharLote(x.ped), l=f&&f.l, u=l&&l.mc&&l.mc.hist[l.mc.hist.length-1];
      return linhaDecisao({prazo:x.horaR||x.hora, tom:'caminho', titulo:`${docRef(x.ped)} · ${tit}`, conta:l?`${l.q} · ${KCOLS[l.col]}${u?` · ${u.st.toLowerCase()}`:''}`:conta, valor:l?l.v:'', doc:x.ped,
        estado:{feito:'Virou pedido', hora:x.horaR}}); }
    if(x.estado==='nao') return linhaDecisao({prazo:x.horaR, tom:'info', titulo:tit, conta:`${conta} · não comprou: ${x.motivo.toLowerCase()}`, estado:{feito:'Não comprou', hora:x.horaR}});
    if(x.estado==='cotacao') return linhaDecisao({prazo:'cotação vista', tom:'info', titulo:tit, conta:`${conta} · frete ${x.frete?brl2(x.frete):'grátis'}`, valor:mcUn(x.preco, x.un),
      acao:{label:'Comprei agora', onclick:`mcSim('${x.id}')`}, sec:[{label:'Não vou comprar', onclick:`mcNao('${x.id}')`}]});
    return linhaDecisao({prazo:'sem resposta', tom:'pede', titulo:tit, conta:`${conta} · você abriu a loja e ainda não disse se comprou`, valor:mcUn(x.preco, x.un),
      acao:{label:'Responder: comprou?', onclick:`mcPerguntar('${x.id}')`}, foco:true});
  };
  return `<section class="sup-bloco"><h3 class="sup-h">Suas idas à loja <span class="mut">(${L.length})</span></h3>${listaDecisoes(L.slice(0,8).map(linha))}</section>`;
}

/* ---------- rastreio simulado ---------- */
const MC_PASSOS = [{st:'Postado', col:2}, {st:'Em trânsito', col:3}, {st:'Saiu para entrega', col:3}, {st:'Entregue', col:4}];
const mcR = l => (l.mc ||= {hist:[], passo:0});
function mcParar(id){ clearTimeout(MC.tm[id]); delete MC.tm[id]; }
function mcAgendar(id){
  mcParar(id); const f=acharLote(id); if(!f) return; const r=mcR(f.l);
  if(!r.cod || r.pausado || f.l.conf || f.l.col>=ULT() || r.passo>=MC_PASSOS.length) return;
  MC.tm[id]=setTimeout(()=>{ delete MC.tm[id]; mcPasso(id); }, MC.intervalo);
}
const mcNaTela = () => state.visao && ['kanban','mercado','hoje'].includes(state.visao.chave) && !$('modal').classList.contains('on');
/* aplica um movimento ao cartão e guarda o "antes" para desfazer o último */
function mcMover(l, ob, {st, col, fonte, origem, quem, det, eta}){
  const r=mcR(l), antes={col:l.col, eta:l.eta, passo:r.passo};
  if(col!=null) l.col=Math.max(l.col, col);
  l.eta = eta || `${st.toLowerCase()} · ${fonte}`;
  r.hist.push({st, fonte, det, hora:hhmm(), antes});
  registrar(`${l.id} · ${l.item}: ${st}${col!=null&&antes.col!==l.col?` (${KCOLS[antes.col]} → ${KCOLS[l.col]})`:''} · movido por: ${fonte}`, {obra:ob, origem:origem||'agente', quem:quem||fonte});
  if(l.col>=ULT()) mcParar(l.id);
}
function mcPasso(id){
  const f=acharLote(id); if(!f) return mcParar(id); const l=f.l, r=mcR(l);
  if(l.conf || l.col>=ULT() || r.passo>=MC_PASSOS.length) return mcParar(id);
  const p=MC_PASSOS[r.passo], fonte=`rastreio ${r.transp||'da loja'}`;
  mcMover(l, f.ob, {...p, fonte, origem:'agente', quem:r.transp||'rastreio', eta:p.col===4?`entregue ${hhmm()} · conferir NF`:undefined});
  r.passo++;
  mcAgendar(id);
  if(mcNaTela()){ render(); toastDesfazer(`${id} · ${p.st.toLowerCase()} · ${fonte}`, ()=>mcVoltaUltimo(id, true)); }
}
/* desfaz o último movimento e pausa o rastreio (senão ele refaria o passo em 20 s) */
function mcVoltaUltimo(id, silencioso){
  const f=acharLote(id); if(!f) return; const l=f.l, r=mcR(l), u=r.hist[r.hist.length-1];
  if(!u || !u.antes) return;
  r.hist.pop(); l.col=u.antes.col; l.eta=u.antes.eta; r.passo=u.antes.passo;
  if(r.cod){ r.pausado=true; mcParar(id); }
  if(!silencioso){ registrar(`Desfez: ${l.id} · ${u.st} (${u.fonte})${r.cod?' · rastreio pausado':''}`, {obra:f.ob}); toast(`${l.id} voltou para ${KCOLS[l.col]}${r.cod?' · rastreio pausado':''}`); render(); }
}
function mcRetomar(id){ const f=acharLote(id); if(!f) return; mcR(f.l).pausado=false; registrar(`${id} · rastreio retomado`, {obra:f.ob}); mcAgendar(id); toast(`Rastreio do ${id} retomado`); render(); }
function mcSinalNF(id){
  const f=acharLote(id); if(!f) return; const nf=4500+Math.floor(mcHash(id)*900);
  mcMover(f.l, f.ob, {st:'Faturado', col:2, fonte:'NF-e contra o CNPJ da obra', origem:'NF-e', quem:f.l.forn, det:`NF ${nf}`, eta:`faturado · NF-e ${nf}`});
  toastDesfazer(`${id} faturado · NF-e ${nf} contra o CNPJ da obra`, ()=>mcVoltaUltimo(id, true)); render();
}
function mcSinalMestre(id){
  const f=acharLote(id); if(!f) return; const ms=(OBRAS.find(o=>o.id===f.ob)||{}).mestre||'mestre';
  mcMover(f.l, f.ob, {st:'Chegou na obra', col:ULT(), fonte:`WhatsApp · ${ms}`, origem:'WhatsApp', quem:ms, eta:`chegou ${hhmm()} · conferir NF`});
  mcParar(id);
  toastDesfazer(`${id} → Recebido · ${ms} avisou no WhatsApp`, ()=>mcVoltaUltimo(id, true)); render();
}
function mcAddRastreio(id){
  const f=acharLote(id); if(!f) return;
  abrirModal(`<h2 style="margin:0 0 6px">Rastreio do ${id}</h2><p class="mut sm" style="margin:0 0 4px">${f.l.item} · ${f.l.forn}. Com o código, as atualizações movem o cartão sozinhas.</p>
    <label class="l" for="mcRc">Código de rastreio</label><input class="f" id="mcRc" type="text" autocomplete="off" placeholder="ex.: QB123456789BR"><div id="mcRcErr" class="sm t-perda" role="alert"></div>
    <div class="row" style="margin-top:22px"><span class="sp"></span>${botao('Cancelar', 'closeModal()')}${botao('Ligar rastreio', `mcSalvarRastreio('${id}')`, {pri:true})}</div>`);
  setTimeout(()=>{ const e=$('mcRc'); if(e) e.focus(); }, 30);
}
function mcSalvarRastreio(id, codigo){
  const f=acharLote(id); if(!f) return; const cod=String(codigo ?? ($('mcRc')||{}).value ?? '').toUpperCase().replace(/\s/g,'');
  if(!cod){ const e=$('mcRcErr'); if(e) e.textContent='Cole o código que a loja mandou'; return; }
  const r=mcR(f.l), antes={cod:r.cod, transp:r.transp, passo:r.passo};
  r.cod=cod; r.transp=mcTransp(cod, r.k); r.pausado=false; if(f.l.col>=3 && !r.passo) r.passo=1;
  registrar(`${id} · rastreio ligado · ${r.transp} ${cod}`, {obra:f.ob});
  mcAgendar(id); closeModal();
  toastDesfazer(`Rastreio ${r.transp} ligado ao ${id}`, ()=>{ mcParar(id); Object.assign(r, antes); });
  render();
}
/* no cartão do pedido: a última atualização e a fonte; sem código, "Adicionar rastreio"; os outros sinais no "⋯" (demo) */
function rastreioCard(l){
  if(!l || l.conf || l.col<1) return '';
  const r=l.mc||{hist:[]}, u=r.hist[r.hist.length-1], ult=l.col>=ULT();
  const acompanhando = r.cod && !ult && !r.pausado && MC.tm[l.id];
  const its=[
    !ult && !(u&&u.st==='Faturado') && {label:`${icon('receipt',15)}Simular: NF emitida`, onclick:`mcSinalNF('${l.id}')`},
    !ult && {label:`${icon('message',15)}Simular: mestre avisou que chegou`, onclick:`mcSinalMestre('${l.id}')`},
    r.cod && !ult && (r.pausado ? {label:`${icon('truck',15)}Retomar rastreio`, onclick:`mcRetomar('${l.id}')`} : {label:`${icon('clock',15)}Próxima atualização agora`, onclick:`mcPasso('${l.id}')`}),
  ];
  const ultimo = u ? `<div class="mc-rt-u"><span class="mc-rt-st">${icon(u.fonte.startsWith('WhatsApp')?'message':u.fonte.startsWith('NF')?'receipt':'truck',13)}<b>${u.st}</b>${u.det?` · ${u.det}`:''}</span>
      <span class="mc-rt-f">movido por: ${u.fonte} · ${u.hora}${u.antes?` · <button type="button" class="link" onclick="event.stopPropagation();mcVoltaUltimo('${l.id}')">Desfazer</button>`:''}</span></div>` : '';
  const estado = r.cod ? `<span class="mc-rt-f">${r.transp} ${r.cod}${ult?'':r.pausado?' · pausado':acompanhando?' · acompanhando':''}</span>`
    : ult || l.col<2 ? '' : `<button type="button" class="link mc-rt-add" onclick="event.stopPropagation();mcAddRastreio('${l.id}')">Adicionar rastreio</button>`;
  if(!ultimo && !estado && !its.some(Boolean)) return '';
  return `<div class="mc-rt">${ultimo}<div class="mc-rt-l">${estado}<span class="sp"></span>${menuMais(its, {rotulo:`Sinais do ${l.id}`})}</div></div>`;
}

/* ---------- conversa: "quanto custa <material>", "busca preço de…", "onde comprar…", "compara com a sinapi" ---------- */
const MC_INTENT = /quanto (custa|ta|esta|sai)|busca(r)? (o )?preco|pesquisa(r)? (o )?preco|cota(r)? (o )?preco|preco d[aoe]s? |onde (eu )?compr|sinapi/;
function mcTermoDoTexto(t, ob){
  let s=' '+t+' ';
  s=s.replace(/@\S+/g,' ').replace(/\b(na|da|para a|pra) (obra )?(casa )?(vila nova|loja centro|reforma loja centro|galpao( sumare)?)\b/g,' ')
     .replace(/quanto (custa|ta|esta|sai)|busca(r)? (o )?preco( de| do| da)?|pesquisa(r)? (o )?preco( de| do| da)?|cota(r)? (o )?preco( de| do| da)?|preco d[aoe]s?|onde (eu )?compr(o|ar|a)?|compara(r)? com a sinapi|(com|na|vs|versus) (a )?sinapi|sinapi/g,' ')
     .replace(/\b(o|a|os|as|um|uma|de|do|da|e|me|por favor|hoje|agora|saco|preco)\b/g,' ').replace(/[?.,!]/g,' ').replace(/\s+/g,' ').trim();
  return s || mcTermoInicial(ob);
}
CV_EXT.push({nome:'mercado', casa:t=>MC_INTENT.test(t), responde:(t, sessao, obX)=>{
  const ob=obX && obX!=='galpao' ? obX : 'vila-nova', termo=mcTermoDoTexto(t, ob), r=mcResultados(termo, ob), m=r.mat, s=m&&m.sinapi;
  const nomeT=m?m.nome:termo, abrir=btnVisao('mercado', ob, termo, 'Abrir Buscar preço');
  if(r.semLoja) return [cvMsg('agente', {nivel:'consulta', tools:['SINAPI (exemplo)'], html:`Concreto usinado não se compra em loja: é programado com a concreteira. A referência SINAPI (exemplo) set/26 é <b>${mcUn(s.p, m.un)}</b>; a cotação da Concrecamp está no ${docRef('PED-0166')}.`})];
  const top=r.lista.slice(0,3), tem=x=>s?`${pill(x.faixa.tom, `${mcPct(x.pct)} vs SINAPI`)}`:pill('info','sem referência');
  const corpo=tabela(['Loja','#Preço','vs SINAPI','#Total entregue'], top.map(x=>`<tr><td>${x.loja}<div class="sm mut">${x.emb} · ${mcPrazoTxt(x.dias)}</div></td><td class="num">${mcUn(x.pUn, r.un)}</td><td>${tem(x)}</td><td class="num"><b>${brl(x.total)}</b></td></tr>`))
    + `<div class="cv-c-b sm mut">${s?`${chipFonte({origem:'sinapi', quem:'SP · exemplo set/26'})} · referência ${mcUn(s.p, r.un)} (${s.cod})`:'Sem referência SINAPI para este termo no protótipo.'} · resultados simulados</div>`;
  const dentro=r.lista.filter(x=>x.faixa.k==='dentro').length;
  return [cvMsg('agente', {nivel:'consulta', tools:['busca de preço (simulada)','SINAPI (exemplo)'],
    html:`${nomeT}: o menor total entregue no CEP ${mcRef(ob).cep} fica em <b>${brl(top[0].total)}</b> ${mcNa(top[0].loja)}, para ${num(r.q)} ${r.un}${r.ins&&r.ins.k.comprar>0?' (o que falta na obra)':''}.${s?` Pela SINAPI (exemplo), ${dentro} de ${r.lista.length} lojas estão dentro da referência de ${mcUn(s.p, r.un)}.`:''} Os preços são simulados no protótipo; na tela você abre a busca de verdade em cada loja.`,
    cartoes:[cartao({titulo:`Preço de ${nomeT}`, sub:`${curto(ob)} · ${r.lista.length} lojas · ordenado pelo total com frete`, nivel:'consulta', corpo, rodape:`<span class="sp"></span>${abrir}`})]})];
}});

addCSS(`
.mc-sim{display:flex;align-items:center;flex-wrap:wrap;gap:var(--s2) var(--s3);margin:0 0 var(--s4);font-size:var(--t-meta);color:var(--ink2)}
.mc-busca{display:flex;gap:var(--s2);align-items:stretch;margin:0 0 var(--s3);max-width:760px}
.mc-q{position:relative;flex:1;display:flex;align-items:center}
.mc-q .ic{position:absolute;left:12px;color:var(--muted);pointer-events:none}
.mc-q input.f{padding-left:38px;min-height:40px;font-size:var(--t-body)}
.mc-atalhos{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 var(--s5)}
.mc-atalhos>.sm{margin-right:var(--s1)}
.mc-chip.on{border-color:var(--accent);background:var(--accentSoft);color:var(--ink)}
.mc-kpis{gap:var(--s3);margin:0 0 var(--s3)}
.mc-kpis .kpi .s{font-size:var(--t-meta)}
.mc-tab table{width:100%}
.mc-tab td.mc-acts{white-space:nowrap;text-align:right;width:1%}
.mc-tab td.mc-acts .btn{margin-right:6px}
@container visao (max-width:900px){ .mc-tab .mc-fx{display:none} .mc-tab td,.mc-tab th{padding:10px 8px} .mc-tab td:first-child{min-width:0} .mc-tab td.num .sm{white-space:normal} }
.mc-term{padding:var(--s4) var(--s4) var(--s5);border-bottom:1px solid var(--line2)}
.mc-term-t{display:flex;align-items:baseline;gap:var(--s3);flex-wrap:wrap;margin:0 0 var(--s3);font-size:var(--t-body)}
.mc-barra{position:relative;height:10px;border-radius:var(--rp);background:var(--sunk);margin:0 6px}
.mc-barra .z{position:absolute;top:0;bottom:0}
.mc-barra .z1{background:var(--greenSoft);border-radius:var(--rp) 0 0 var(--rp)}
.mc-barra .z2{background:var(--amberSoft)}
.mc-barra .z3{background:#f6d79a;border-radius:0 var(--rp) var(--rp) 0}
.mc-ref{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--ink2);border-radius:2px}
.mc-pt{position:absolute;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 2px rgba(20,40,34,.25)}
.mc-pt.mc-dentro{background:var(--green)} .mc-pt.mc-acima{background:var(--amber)} .mc-pt.mc-bem{background:var(--amberInk)} .mc-pt.mc-abaixo{background:var(--gray)}
.mc-pt.fora{border-radius:3px}
.mc-leg{position:relative;height:18px;margin:6px 6px 0;font-size:var(--t-meta);color:var(--muted)}
.mc-leg span{position:absolute;white-space:nowrap;transform:translateX(-50%)}
.mc-leg span:last-child{transform:none}
#mcRes:focus{outline:none}
.mc-nota{display:flex;gap:var(--s2);align-items:flex-start;max-width:80ch}
.mc-motivos{display:flex;flex-wrap:wrap;gap:var(--s2)}
.mc-motivos .btn{min-width:96px;justify-content:center}
.mc-rt{margin-top:6px;padding-top:6px;border-top:1px solid var(--line2);display:flex;flex-direction:column;gap:2px}
.mc-rt-u{display:flex;flex-direction:column;gap:1px}
.mc-rt-st{display:inline-flex;align-items:center;gap:5px;color:var(--blueInk)}
.mc-rt-st b{display:inline;margin:0;font-weight:600}
.mc-rt-f{color:var(--muted);font-size:var(--t-meta)}
.mc-rt-l{display:flex;align-items:center;gap:6px;min-height:28px}
.mc-rt .link{white-space:nowrap;text-align:left;border:0;background:none;padding:0;color:var(--accentInk);text-decoration:underline;text-underline-offset:3px;font-size:var(--t-meta)}
@media (max-width:1180px){ .mc-tab td.mc-acts .btn{padding-inline:10px} }
`);
