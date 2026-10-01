
// ===== CORE DATA & AUTH =====
const LOJAS = ["Trilha da Sorte","A Loteria","Loteria do Francês","Mina de Ouro","Loteria Jatiúca","Casa da Sorte"];
const MODALIDADES = ["LOTOFACIL","MEGASENA","QUINA","LOTOMANIA","TIMEMANIA","DUPLASENA","DIADESORTE","SUPERSETE","LOTECA","FEDERAL"];
const SLUG_MAP = {
  "lotofacil":"lotofacil","megasena":"megasena","mega-sena":"megasena",
  "quina":"quina","lotomania":"lotomania","timemania":"timemania",
  "duplasena":"duplasena","dupla-sena":"duplasena","diadesorte":"diadesorte","dia de sorte":"diadesorte","dia-de-sorte":"diadesorte",
  "supersete":"supersete","super sete":"supersete","super-sete":"supersete","loteca":"loteca","federal":"federal"
};

function normalizeSlug(s){
  s=(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");
  return SLUG_MAP[s]||s;
}

function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function fmtBRL(v){return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function todayStr(){const d=new Date();return d.toLocaleDateString('pt-BR')}
function parseDateBR(s){if(!s)return null;const [d,m,y]=s.split('/').map(Number);if(!d||!m||!y)return null;return new Date(y,m-1,d)}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return String(h)}

const DEFAULT_USUARIOS=[
  {id:"u1",nome:"Administrador",login:"admin",senha_hash:hash("admin 123"),perfil:"Administrador",status:"Ativo",ultimo_acesso:"",permissoes:{resumo:true,boloes:true,registro:true,porBolao:true,consulta:true,bancoDados:true,usuarios:true,exportar:true,importar:true,atualizarPremios:true}},
  {id:"u2",nome:"Gerente",login:"gerente",senha_hash:hash("gerente123"),perfil:"Gerente",status:"Ativo",ultimo_acesso:"",permissoes:{resumo:true,boloes:true,registro:true,porBolao:true,consulta:true,bancoDados:false,usuarios:false,exportar:true,importar:false,atualizarPremios:true}}
];

function seedBoloes(){
  return [
    {id:"b1",modalidade:"LOTOFACIL",total_cotas:20,custo_cota:15, venda_cota:25, status:"Ativo", concurso:"", data_sorteio:"", premio_estimado:null},
    {id:"b2",modalidade:"MEGASENA",total_cotas:50,custo_cota:10, venda_cota:20, status:"Ativo", concurso:"", data_sorteio:"", premio_estimado:null},
    {id:"b3",modalidade:"QUINA",total_cotas:30,custo_cota:8, venda_cota:15, status:"Ativo", concurso:"", data_sorteio:"", premio_estimado:null},
    {id:"b4",modalidade:"LOTOMANIA",total_cotas:40,custo_cota:5, venda_cota:10, status:"Encerrado", concurso:"", data_sorteio:"", premio_estimado:null},
    {id:"b5",modalidade:"TIMEMANIA",total_cotas:25,custo_cota:6, venda_cota:12, status:"Ativo", concurso:"", data_sorteio:"", premio_estimado:null}
  ];
}
function seedRegistros(boloes){
  const regs=[];
  const datas=["01/09/2026","03/09/2026","05/09/2026","08/09/2026","10/09/2026","12/09/2026","15/09/2026","18/09/2026","20/09/2026","22/09/2026"];
  for(let i=0;i<40;i++){
    const b=boloes[i%boloes.length];
    const loja=LOJAS[i%LOJAS.length];
    const origem=LOJAS[(i+2)%LOJAS.length];
    const enviadas=10+ (i%15);
    const sobradas=i%3; const market=i%2;
    const vendidas=Math.max(0,enviadas-sobradas-market);
    regs.push({
      id:uid(), data:datas[i%datas.length], loja, origem_fornecedor:origem,
      bolao_id:b.id, concurso:String(3700+i), data_sorteio:datas[i%datas.length],
      premio_estimado: 1500000 + i*100000,
      enviadas, sobradas, marketplace:market, vendidas
    });
  }
  return regs;
}

function loadLS(key,defVal){try{const v=localStorage.getItem(key);return v?JSON.parse(v):defVal}catch(e){return defVal}}
function saveLS(key,val){localStorage.setItem(key,JSON.stringify(val)); localStorage.setItem('lastSave', new Date().toISOString())}

function getData(){
  let boloes=loadLS('boloes',null); let registros=loadLS('registros',null); let usuarios=loadLS('usuarios',null);
  if(!boloes){boloes=seedBoloes(); saveLS('boloes',boloes)}
  if(!registros){registros=seedRegistros(boloes); saveLS('registros',registros)}
  if(!usuarios){usuarios=DEFAULT_USUARIOS; saveLS('usuarios',usuarios)}
  else {
    const admin=usuarios.find(u=>u.login && u.login.toLowerCase()==='admin');
    if(admin){
      admin.perfil='Administrador';
      admin.status='Ativo';
      admin.senha_hash=hash('admin 123');
      admin.permissoes=Object.fromEntries(['resumo','boloes','registro','porBolao','consulta','bancoDados','usuarios','exportar','importar','atualizarPremios'].map(k=>[k,true]));
      saveLS('usuarios',usuarios);
    }
  }
  return {boloes, registros, usuarios}
}
function saveData(d){ if(d.boloes) saveLS('boloes',d.boloes); if(d.registros) saveLS('registros',d.registros); if(d.usuarios) saveLS('usuarios',d.usuarios) }

function getSession(){try{return JSON.parse(sessionStorage.getItem('session')||'null')}catch{return null}}
function setSession(s){sessionStorage.setItem('session',JSON.stringify(s))}
function clearSession(){sessionStorage.removeItem('session')}
function requireAuth(){
  const s=getSession(); if(!s){location.href='login.html'; return null}
  return s;
}
function checkPermission(s,perm){ if(!s) return false; if(s.perfil==='Administrador') return true; return !!(s.permissoes && s.permissoes[perm]) }

function toast(msg, ms=3000){
  let el=document.getElementById('toast'); if(!el){el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el)}
  el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), ms)
}

function calcPrejuizo(r,bolao){
  const custo=bolao? bolao.custo_cota:0; const venda=bolao? bolao.venda_cota:0;
  const totalCusto=(r.enviadas||0)*custo; const totalVenda=(r.vendidas||0)*venda;
  const preju = totalCusto - totalVenda;
  return preju>0? preju:0;
}
function calcLucro(r,bolao){
  const custo=bolao? bolao.custo_cota:0; const venda=bolao? bolao.venda_cota:0;
  const totalCusto=(r.enviadas||0)*custo; const totalVenda=(r.vendidas||0)*venda;
  const lucro = totalVenda - totalCusto;
  return lucro>0? lucro:0;
}

// ===== CAIXA API com fallbacks =====
async function fetchConcursoCaixa(modalidade, concurso){
  const slug=normalizeSlug(modalidade);
  const primary=`https://servicebus2.caixa.gov.br/portaldeloterias/api/${slug}/${concurso}`;
  const urls=[
    primary,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(primary)}`,
    `https://corsproxy.io/?${encodeURIComponent(primary)}`
  ];
  let lastErr=null;
  for(let i=0;i<urls.length;i++){
    const url=urls[i];
    console.log(`[Caixa API] Tentativa ${i+1}: ${url}`);
    try{
      const res=await fetch(url,{headers:{'Accept':'application/json'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      console.log('[Caixa API] Sucesso', data);
      // Normaliza campos
      return {
        dataApuracao: data.dataApuracao || data.dataProximoConcurso || data.dataApuracaoStr || "",
        valorEstimado: data.valorEstimadoProximoConcurso || data.valorAcumuladoProximoConcurso || data.valorEstimado || null,
        raw: data
      };
    }catch(e){
      console.warn(`[Caixa API] Falha tentativa ${i+1}:`, e.message);
      lastErr=e;
    }
  }
  throw lastErr || new Error("Falha ao buscar concurso");
}

function exportCSV(rows, filename){
  const header=Object.keys(rows[0]||{});
  const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

function renderTopbar(active){
  const s=getSession(); if(!s) return;
  const navItems=[
    {id:'resumo',label:'Resumo',href:'index.html',perm:'resumo'},
    {id:'boloes',label:'Bolões',href:'boloes.html',perm:'boloes'},
    {id:'registro',label:'Registro',href:'registro.html',perm:'registro'},
    {id:'porbolao',label:'Por Bolão',href:'por-bolao.html',perm:'porBolao'},
    {id:'consulta',label:'Consulta',href:'consulta.html',perm:'consulta'},
    {id:'banco',label:'Banco de Dados',href:'banco-dados.html',perm:'bancoDados'},
    {id:'usuarios',label:'Usuários',href:'usuarios.html',perm:'usuarios'}
  ];
  const navHtml=navItems.filter(it=> s.perfil==='Administrador' || (s.permissoes&&s.permissoes[it.perm]) || it.id==='resumo').map(it=>`<a href="${it.href}" class="${active===it.id?'active':''}">${it.label}</a>`).join('');
  const top=document.getElementById('topbar');
  if(!top) return;
  top.innerHTML=`<div class="brand"><img src="img/logo.jpg" alt="logo"><span>Sua Loteria</span><nav class="nav" style="margin-left:12px">${navHtml}</nav></div><div class="user"><span>${s.nome} (${s.perfil})</span><button class="btn" onclick="logout()">Sair</button></div>`;
}
function logout(){clearSession(); location.href='login.html'}

function formatDateInputToBR(v){ if(!v) return ""; const [y,m,d]=v.split('-'); return `${d}/${m}/${y}` }
function formatBRToInput(v){ if(!v) return ""; const parts=v.split('/'); if(parts.length!==3) return ""; return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}` }
