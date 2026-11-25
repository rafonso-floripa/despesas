'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');

// Ícones de traço (estilo Lucide, licença ISC/MIT)
const ICONES = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  seta: '<path d="m9 18 6-6-6-6"/>',
  busca: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  arquivo: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',
  clipe: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  nuvem: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 14 2 2 4-4"/>',
  nuvemoff: '<path d="m2 2 20 20"/><path d="M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.2"/><path d="M21.53 16.11A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10.22 5.1"/>',
  celular: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  enviar: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  aberto: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  editar: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  lixo: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pasta: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  recibo: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  copiar: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  externo: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  chave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  compartilhar: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
};
const ico = (n, t = 20) => `<svg class="i" viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

const LIMITE_ITENS = 20;   // máximo de itens por reembolso no Agidesk
const LIMITE_MB = 20;      // tamanho máximo de cada anexo no Agidesk
const COMPRIMIR_MB = 1.5;  // fotos acima disso são reduzidas (comprovante continua legível)
const TIPOS_OK = ['image/jpeg', 'image/png', 'application/pdf'];
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
const STATUS = { aberto: 'Aberto', fechado: 'Fechado', enviado: 'Enviado' };

// ---------- utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const novoId = () => (window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const go = p => { location.hash = '#' + p; };
// Moeda do relatório: reais (padrão) ou dólar. Um relatório tem uma moeda só.
const MOEDAS = { BRL: { simbolo: 'R$', nome: 'Reais (R$)' }, USD: { simbolo: 'US$', nome: 'Dólares (US$)' } };
const moedaDe = r => (r?.moeda === 'USD' ? 'USD' : 'BRL');
const simbolo = r => MOEDAS[moedaDe(r)].simbolo;
const brl = (c, m = 'BRL') => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: m });
const valorInput = c => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));
const dataBR = iso => (iso ? iso.split('-').reverse().join('/') : '');
const soma = l => l.reduce((s, d) => s + d.valor, 0);
const dataHora = ts => (ts ? new Date(ts).toLocaleDateString('pt-BR') : '');
const valorH = (c, m) => `<span class="v">${brl(c, m)}</span>`; // valor que o 👁 esconde

// Olho do cabeçalho: mostra/esconde os valores (preferência deste aparelho)
function aplicarOlho(trocar) {
  let o = false;
  try { o = localStorage.getItem('ocultarValores') === '1'; if (trocar) { o = !o; localStorage.setItem('ocultarValores', o ? '1' : '0'); } } catch { /* sem storage */ }
  document.body.classList.toggle('ocultar', o);
  const b = $('#olho');
  const svg = p => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const olho = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
  // macaquinho tapando os olhos: orelhas, cabeça, duas mãos sobre os olhos e boca
  const macaco = '<circle cx="3.8" cy="11.5" r="2.3"/><circle cx="20.2" cy="11.5" r="2.3"/><circle cx="12" cy="12.5" r="7.8"/>' +
    '<rect x="5.6" y="8.4" width="5.6" height="4.4" rx="2.2"/><rect x="12.8" y="8.4" width="5.6" height="4.4" rx="2.2"/>' +
    '<path d="M9.8 16.6q2.2 1.6 4.4 0"/>';
  b.innerHTML = o ? '<span class="mac">🙈</span>' : svg(olho); // emoji clareado (ver .mac no CSS)
  b.title = o ? 'Mostrar valores' : 'Esconder valores';
}
$('#olho').onclick = () => aplicarOlho(true);
$('#cfg').onclick = () => go('/config');
aplicarOlho();

function hojeISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function mesAnoAtual() {
  const d = new Date();
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
// Aceita "125,90", "1.234,56", "1234.56", "R$ 80" → centavos
function lerValor(txt) {
  let t = String(txt || '').replace(/R\$|\s/g, '');
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : NaN;
}

let urlsAtivas = [];
function objURL(blob) { const u = URL.createObjectURL(blob); urlsAtivas.push(u); return u; }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2500);
}
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); }
  catch {
    const a = document.createElement('textarea');
    a.value = txt; document.body.appendChild(a); a.select();
    document.execCommand('copy'); a.remove();
  }
  toast('Copiado');
}
function topo(titulo, voltar) {
  $('#titulo').textContent = titulo;
  const b = $('#voltar');
  b.hidden = !voltar;
  b.onclick = () => go(voltar || '/');
  $('#cfg').hidden = !!voltar || location.hash.startsWith('#/config');
}
function opcoes(lista, sel, vazio) {
  const itens = sel && !lista.includes(sel) ? [...lista, sel] : lista;
  return (vazio != null ? `<option value="">${esc(vazio)}</option>` : '') +
    itens.map(v => `<option${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
}

// Grava só alguns campos, relendo o registro (evita apagar edições feitas durante o envio)
async function salvarCampos(store, id, campos, condicao) {
  const o = await dbGet(store, id);
  if (!o) return null;
  if (condicao && !condicao(o)) return o;
  Object.assign(o, campos);
  await dbPut(store, o);
  return o;
}
// Qualquer mudança no relatório ou nas despesas → planilha do Drive precisa ser atualizada
async function marcarAlterado(rid) {
  const r = await dbGet('relatorios', rid);
  if (!r) return;
  r.versao = (r.versao || 0) + 1;
  await dbPut('relatorios', r);
  agendarSync();
}

async function nomeColaborador() {
  const c = await dbGet('config', 'nome');
  return c ? c.valor : '';
}
// Padrão do financeiro: "Reembolso - Colaborador - mês/ano - Projeto/Evento".
// mês/ano = mês do envio ao Agidesk, a não ser que o usuário tenha digitado outro;
// final = nome do relatório (ou o evento, se não houver nome).
function tituloRelatorio(r, nome) {
  const quando = r.enviadoEm ? new Date(r.enviadoEm) : new Date();
  const mesAno = r.mesAnoManual ? r.mesAno : String(quando.getMonth() + 1).padStart(2, '0') + '/' + quando.getFullYear();
  const fim = r.apelido || r.evento;
  return `Reembolso - ${nome || '<seu nome>'} - ${mesAno}` + (fim ? ` - ${fim}` : '') + (moedaDe(r) === 'USD' ? ' (USD)' : '');
}
// "23/11/2026" → "2026-11-23" (ou null se a data não existir)
function lerData(txt) {
  const m = String(txt || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m.map(Number);
  const dt = new Date(a, mes - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d || a < 2000) return null;
  return `${a}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
// Campo Observações do Agidesk: só o aviso de dólar (se for o caso) e as observações
// que o usuário escreveu. Item sem observação não aparece; sem nada, o campo vai vazio.
function linhasObs(p, r) {
  const l = p.map((d, i) => (d.obs ? `Item ${i + 1} - ${dataBR(d.data)} - ${d.obs}` : null)).filter(Boolean);
  return moedaDe(r) === 'USD' ? ['Todos os valores deste pedido estão em dólar americano (US$).', ...l] : l;
}
async function despesasDe(rid) {
  const l = await dbByIndex('despesas', 'relatorioId', rid);
  return l.sort((a, b) => a.data.localeCompare(b.data) || a.criadoEm - b.criadoEm);
}
const temAnexo = d => !!(d.arquivoId || d.driveFileId);

// Converte HEIC/WebP etc. para JPEG e reduz imagens grandes
function converterJPEG(file, maxLado = 4000, qualidade = 0.85) {
  return new Promise((res, rej) => {
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const k = Math.min(1, maxLado / Math.max(w, h));
      w = Math.round(w * k); h = Math.round(h * k);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(u);
      c.toBlob(b => (b ? res(b) : rej(new Error('Não foi possível converter a imagem.'))), 'image/jpeg', qualidade);
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Não foi possível ler a imagem. Use JPEG, PNG ou PDF.')); };
    img.src = u;
  });
}
async function prepararArquivo(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  let tipo = file.type || { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' }[ext] || '';
  let blob = file;
  let nome = file.name || 'comprovante';
  const paraJPEG = async lado => {
    blob = await converterJPEG(blob, lado);
    tipo = 'image/jpeg';
    nome = nome.replace(/\.[^.]+$/, '') + '.jpg';
  };
  if (tipo.startsWith('image/') && !TIPOS_OK.includes(tipo)) await paraJPEG(2000);
  if (!TIPOS_OK.includes(tipo)) throw new Error('Formato não aceito. Use JPEG, PNG ou PDF.');
  if (tipo.startsWith('image/') && blob.size > COMPRIMIR_MB * 1048576) await paraJPEG(2000);
  if (blob.size > LIMITE_MB * 1048576) throw new Error(`Arquivo maior que ${LIMITE_MB} MB.`);
  return { blob, nome, tipo, tamanho: blob.size };
}

// ---------- telas ----------
async function telaLista() {
  const nome = await nomeColaborador();
  if (!nome) return go('/config');
  topo('Despesas');
  const todos = await dbAll('relatorios');
  const por = {};
  (await dbAll('despesas')).forEach(d => (por[d.relatorioId] ||= []).push(d));
  const abertos = todos.filter(r => r.status === 'aberto').sort((a, b) => b.criadoEm - a.criadoEm);
  const fechados = todos.filter(r => r.status !== 'aberto').sort((a, b) => (b.fechadoEm || 0) - (a.fechadoEm || 0));

  // painel: quanto falta enviar e quanto já foi enviado no ano (separado por moeda)
  const ano = new Date().getFullYear();
  const totais = lista => lista.reduce((t, r) => { t[moedaDe(r)] += soma(por[r.id] || []); return t; }, { BRL: 0, USD: 0 });
  const aEnviar = totais(todos.filter(r => r.status !== 'enviado'));
  const enviados = totais(todos.filter(r => r.status === 'enviado' && new Date(r.enviadoEm || 0).getFullYear() === ano));
  const tot = t => `${valorH(t.BRL, 'BRL')}${t.USD ? `<small>${valorH(t.USD, 'USD')}</small>` : ''}`;

  const row = r => {
    const l = por[r.id] || [];
    const datas = l.map(d => d.data).sort();
    const periodo = datas.length ? dataBR(datas[0]).slice(0, 5) + (datas.at(-1) !== datas[0] ? ' a ' + dataBR(datas.at(-1)).slice(0, 5) : '') + '/' + datas[0].slice(0, 4) : 'Sem despesas';
    const nums = (r.agidesk?.atendimentos || []).filter(a => a?.id).map(a => a.id);
    const ic = r.status === 'enviado' ? `<span class="ic ok">${ico('check')}</span>`
      : r.status === 'fechado' ? `<span class="ic neutro">${ico('cadeado')}</span>` : `<span class="ic">${ico('recibo')}</span>`;
    const situacao = r.status === 'aberto' ? `${periodo} · ${l.length} despesa${l.length === 1 ? '' : 's'}`
      : `Fechado em ${dataHora(r.fechadoEm)} · ${r.status === 'enviado' ? 'Agidesk nº ' + nums.join(', ') : nums.length ? 'envio incompleto' : 'não enviado'}`;
    const busca = [tituloRelatorio(r, nome), r.apelido, r.evento, periodo, ...datas.map(dataBR), dataHora(r.fechadoEm), nums.join(' '), ...l.map(d => d.descricao)].join(' ');
    return `
      <a class="row" href="#/r/${r.id}" data-busca="${esc(normal(busca))}">
        ${ic}
        <span class="meio"><strong>${esc(r.apelido || r.evento || 'Relatório ' + r.mesAno)}</strong>
          <span class="sub">${esc(situacao)}</span>
          ${moedaDe(r) === 'USD' || r.status !== 'aberto' ? `<span class="chips">${r.status !== 'aberto' ? `<span class="chip ${r.status}">${STATUS[r.status]}</span>` : ''}${moedaDe(r) === 'USD' ? '<span class="chip moeda">US$</span>' : ''}</span>` : ''}
        </span>
        <span class="dir"><strong>${valorH(soma(l), moedaDe(r))}</strong></span>
        <span class="seta">${ico('seta', 18)}</span>
      </a>`;
  };
  const grupo = (id, lista, vazio) => `
    <div id="${id}" data-aba="${id}">
      ${lista.length ? `<div class="grupo">${lista.map(row).join('')}</div>` : ''}
      <p class="vazio vazio-g" ${lista.length ? 'hidden' : ''}>${vazio}</p>
    </div>`;

  app.innerHTML = `
    <div id="sync"></div>
    ${todos.length ? `
      <div class="painel">
        <div class="card"><div class="rot">A enviar</div><div class="val">${tot(aEnviar)}</div></div>
        <div class="card"><div class="rot">Enviado em ${ano}</div><div class="val">${tot(enviados)}</div></div>
      </div>
      <div class="busca">${ico('busca', 18)}<input id="busca" type="search" value="${esc(buscaAtual)}" placeholder="Buscar por nome, despesa ou data"></div>
      <div class="seg" role="tablist">
        <button type="button" data-tab="abertos">Abertos<span class="n" id="n-abertos">${abertos.length}</span></button>
        <button type="button" data-tab="fechados">Fechados<span class="n" id="n-fechados">${fechados.length}</span></button>
      </div>
      ${grupo('abertos', abertos, 'Nenhum relatório aberto. Toque em <b>Novo relatório</b> para começar.')}
      ${grupo('fechados', fechados, 'Nenhum relatório fechado ainda.')}` : `
      <div class="vazio">${ico('recibo', 56)}<strong>Nenhum relatório ainda</strong>Crie um no início da viagem e vá incluindo as despesas à medida que acontecem.</div>`}
    <div class="barra"><a class="btn primario" href="#/novo">${ico('plus')} Novo relatório</a></div>`;

  const mostrarAba = () => {
    $$('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === abaAtual));
    $$('[data-aba]').forEach(g => { g.hidden = g.dataset.aba !== abaAtual; });
  };
  const filtrar = () => {
    buscaAtual = $('#busca').value;
    const termos = buscaAtual.split(/\s+/).map(normal).filter(Boolean);
    $$('[data-aba]').forEach(g => {
      let n = 0;
      $$('[data-busca]', g).forEach(c => { const ok = termos.every(t => c.dataset.busca.includes(t)); c.hidden = !ok; n += ok; });
      $('#n-' + g.dataset.aba).textContent = n;
      const grp = $('.grupo', g); if (grp) grp.hidden = n === 0;
      const v = $('.vazio-g', g); v.hidden = n > 0;
      if (termos.length && !n) v.textContent = 'Nada encontrado.';
    });
  };
  if (todos.length) {
    $$('[data-tab]').forEach(b => { b.onclick = () => { abaAtual = b.dataset.tab; mostrarAba(); }; });
    $('#busca').oninput = filtrar;
    mostrarAba();
    if (buscaAtual) filtrar();
  }
  mostrarSync();
}
let abaAtual = 'abertos';
let buscaAtual = '';

async function telaConfig() {
  const nome = await nomeColaborador();
  const raiz = await dbGet('config', 'driveRaiz');
  const ag = await agConfig();
  topo('Configurações', nome ? '/' : null);
  let uso = '';
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate();
    uso = `Espaço usado neste aparelho: ${(e.usage / 1048576).toFixed(1)} MB`;
  }
  app.innerHTML = `
    <h2>Perfil</h2>
    <form id="f" class="card">
      <label>Seu nome <span class="opc">(vai no título do reembolso)</span>
        <input name="nome" required value="${esc(nome)}" placeholder="Ex.: Ricardo Afonso" autocomplete="name"></label>
      <button class="btn primario">Salvar</button>
    </form>
    <h2>Google Drive</h2>
    <section class="card">
      <div class="row" style="padding:0 0 14px">
        <span class="ic ${raiz ? 'ok' : ''}">${ico('pasta')}</span>
        <span class="meio"><strong>${raiz ? esc(raiz.valor.nome) : 'Nenhuma pasta escolhida'}</strong><span class="sub">${raiz ? 'Pasta dos reembolsos' : 'Os comprovantes ficam só no celular'}</span></span>
      </div>
      <button id="pasta" class="btn">${raiz ? 'Trocar pasta' : 'Conectar e escolher a pasta'}</button>
      <p class="dica">Cada relatório vira uma subpasta "AAAA-MM-DD-Nome" com os comprovantes e uma planilha. A cópia no celular é apagada depois que o Drive confirma o recebimento. O app só enxerga o que ele mesmo cria.</p>
    </section>
    <h2>Agidesk</h2>
    <form id="fag" class="card">
      <div class="row" style="padding:0 0 14px">
        <span class="ic ${ag ? 'ok' : ''}">${ico('ticket')}</span>
        <span class="meio"><strong>${ag ? esc(ag.contatoNome) : 'Não conectado'}</strong><span class="sub">${ag ? 'Contato ' + ag.contatoId + ' · envio automático ativo' : 'Sem conexão, o envio é feito copiando e colando'}</span></span>
      </div>
      <label>E-mail no Agidesk
        <input name="email" type="email" required value="${esc(ag?.email || '')}" placeholder="nome@realcloud.com.br" autocomplete="email"></label>
      <label>Chave de acesso
        <input name="chave" type="password" required value="${esc(ag?.chave || '')}" autocomplete="off"></label>
      <button class="btn primario">${ag ? 'Atualizar' : 'Conectar'}</button>
      ${ag ? `<button type="button" id="agsair" class="btn fantasma">Desconectar</button>` : ''}
      <p class="dica">No Agidesk: "Oi, Usuário" → Meus dados → Relações → Chaves de acesso. A chave fica só neste aparelho.</p>
    </form>
    <p class="dica" style="text-align:center">${uso}</p>`;
  $('#fag').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, b = f.querySelector('button');
    b.disabled = true; b.textContent = 'Conectando…';
    try {
      const v = await agConectar(f.chave.value.trim(), f.email.value.trim());
      await atualizarListas();
      toast('Agidesk conectado: ' + v.contatoNome);
      rota();
    } catch (err) { alert(err.message); b.disabled = false; b.textContent = 'Conectar'; }
  };
  $('#agsair')?.addEventListener('click', async () => {
    if (!confirm('Apagar a chave do Agidesk deste aparelho?')) return;
    await dbDel('config', 'agidesk');
    rota();
  });
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const v = e.target.nome.value.trim();
    if (!v) return;
    await dbPut('config', { chave: 'nome', valor: v });
    navigator.storage?.persist?.();
    for (const r of await dbAll('relatorios')) await marcarAlterado(r.id); // título mudou
    toast('Salvo');
    go('/');
  };
  $('#pasta').onclick = escolherPasta;
}

async function telaRelatorioForm(r) {
  const novo = !r;
  r = r || { mesAno: mesAnoAtual(), evento: '', centro: '', apelido: '', moeda: 'BRL' };
  const temDesp = !novo && (await despesasDe(r.id)).length > 0;
  topo(novo ? 'Novo relatório' : 'Editar relatório', novo ? '/' : `/r/${r.id}`);
  app.innerHTML = `
    <form id="f" class="card">
      <div class="form-sec">Identificação</div>
      <label>Nome da viagem <span class="opc">(vai no título e na pasta do Drive)</span>
        <input name="apelido" value="${esc(r.apelido)}" placeholder="Ex.: Visita a Clientes SP"></label>
      <label>Mês/ano
        <input name="mesAno" required inputmode="numeric" value="${esc(r.mesAnoManual ? r.mesAno : mesAnoAtual())}" placeholder="MM/AAAA" pattern="(0[1-9]|1[0-2])/\\d{4}" title="Use o formato MM/AAAA">
        <span class="dica">Vai no título do Agidesk. Se não mudar, vale o mês do envio.</span></label>
      <label>Moeda
        <select name="moeda" ${temDesp ? 'disabled' : ''}>${Object.entries(MOEDAS).map(([k, m]) => `<option value="${k}"${moedaDe(r) === k ? ' selected' : ''}>${m.nome}</option>`).join('')}</select>
        <span class="dica">${temDesp ? 'Não dá para trocar depois de incluir despesas.' : 'Despesas em reais e em dólar ficam em relatórios separados.'}</span></label>
      <div class="form-sec" style="margin-top:24px">Padrões das despesas</div>
      <label>Evento / Projeto <span class="opc">(opcional)</span>
        <select name="evento">${opcoes(VALORES.eventos, r.evento, '— Nenhum —')}</select></label>
      <label>Centro de custos
        <select name="centro" required>${opcoes(VALORES.centros, r.centro, 'Selecione')}</select>
        <span class="dica">Viram o padrão de cada despesa nova. Dá para mudar item a item.</span></label>
      <button class="btn primario">${novo ? 'Criar relatório' : 'Salvar'}</button>
    </form>
    ${novo ? '' : `<button id="excluir" class="btn perigo">${ico('lixo', 18)} Excluir relatório</button>`}`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const mesAno = f.mesAno.value.trim();
    Object.assign(r, { apelido: f.apelido.value.trim(), mesAno, mesAnoManual: mesAno !== mesAnoAtual(), moeda: f.moeda.value, evento: f.evento.value, centro: f.centro.value });
    if (novo) { r.id = novoId(); r.status = 'aberto'; r.criadoEm = Date.now(); r.versao = 0; }
    else r.versao = (r.versao || 0) + 1;
    await dbPut('relatorios', r);
    agendarSync();
    go(`/r/${r.id}`);
  };
  $('#excluir')?.addEventListener('click', async () => {
    const aviso = r.driveFolderId ? '\n\nA pasta no Drive vai para a lixeira do Drive (dá para recuperar por 30 dias).' : '';
    if (!confirm('Excluir este relatório com todas as despesas e comprovantes?' + aviso)) return;
    await excluirRelatorio(r, true);
  });
}

async function excluirRelatorio(r, apagarDrive) {
  for (const d of await despesasDe(r.id)) {
    if (d.arquivoId) await dbDel('arquivos', d.arquivoId);
    await dbDel('despesas', d.id);
  }
  if (apagarDrive && r.driveFolderId) await paraLixeira(r.driveFolderId);
  await dbDel('relatorios', r.id);
  agendarSync();
  toast('Relatório removido');
  go('/');
}

async function telaRelatorio(r) {
  topo(r.apelido || 'Relatório', '/');
  const nome = await nomeColaborador();
  const l = await despesasDe(r.id);
  const aberto = r.status === 'aberto';
  const ag = await agConfig();
  const criados = (r.agidesk?.atendimentos || []).filter(a => a?.id).map(a => a.id);
  let aviso = '';
  if (l.length > LIMITE_ITENS) aviso = `O Agidesk aceita até ${LIMITE_ITENS} itens por reembolso. Este relatório será dividido em ${Math.ceil(l.length / LIMITE_ITENS)} atendimentos.`;
  else if (l.length >= LIMITE_ITENS - 2) aviso = `Perto do limite de ${LIMITE_ITENS} itens por reembolso do Agidesk.`;
  const moeda = moedaDe(r);
  const thumbs = {};
  for (const d of l) {
    if (d.arquivoId) { const a = await dbGet('arquivos', d.arquivoId); if (a?.tipo?.startsWith('image/')) thumbs[d.id] = objURL(a.blob); }
    else if (d.thumb) thumbs[d.id] = objURL(d.thumb);
  }
  const estado = d => (d.arquivoId ? `<span class="estado">${ico('celular', 13)} No celular</span>`
    : d.driveFileId ? `<span class="estado ok">${ico('nuvem', 13)} No Drive</span>` : `<span class="estado alerta">${ico('alerta', 13)} Sem anexo</span>`);
  const pct = Math.min(100, (l.length / LIMITE_ITENS) * 100);
  const situacaoAg = r.status === 'enviado' ? `nº ${criados.join(', ')}` : criados.length ? `incompleto (nº ${criados.join(', ')})` : 'não enviado';
  app.innerHTML = `
    <div id="sync"></div>
    <section class="card hero">
      <div class="linha" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <span class="chips"><span class="chip ${r.status}">${STATUS[r.status]}</span>${moeda === 'USD' ? '<span class="chip moeda">Dólar (US$)</span>' : ''}</span>
        ${aberto ? `<a class="pilula" href="#/r/${r.id}/editar">${ico('editar', 15)} Editar</a>` : ''}
      </div>
      <div class="grande" style="margin-top:14px">${valorH(soma(l), moeda)}</div>
      <div class="titulo-ag">${esc(tituloRelatorio(r, nome))}</div>
      <div class="prog ${l.length > LIMITE_ITENS ? 'cheio' : ''}"><i style="width:${pct}%"></i></div>
      <div class="sub" style="font-size:13px">${l.length} de ${LIMITE_ITENS} itens por atendimento</div>
      ${aviso ? `<p class="aviso">${ico('alerta', 18)}<span>${aviso}</span></p>` : ''}
      ${!aberto ? `
        <div class="info-l"><span>Fechado em</span><span>${dataHora(r.fechadoEm) || '—'}</span></div>
        <div class="info-l"><span>Agidesk</span><span>${situacaoAg}${r.enviadoEm ? ' · ' + dataHora(r.enviadoEm) : ''}</span></div>` : ''}
      ${r.driveFolderId ? `<div class="hero-acoes"><a class="pilula" href="https://drive.google.com/drive/folders/${esc(r.driveFolderId)}" target="_blank" rel="noopener">${ico('pasta', 16)} Pasta no Drive</a></div>` : ''}
    </section>
    <h2>Despesas</h2>
    ${l.length ? `<div class="grupo">${l.map(d => `
      <a class="row" href="#/r/${r.id}/d/${d.id}">
        <span class="ic">${thumbs[d.id] ? `<img src="${thumbs[d.id]}" alt="">` : ico((d.driveTipo || '').includes('pdf') ? 'arquivo' : 'recibo')}</span>
        <span class="meio"><strong>${esc(d.descricao)}</strong><span class="sub">${dataBR(d.data)} · ${esc(d.centro)}${d.evento ? ' · ' + esc(d.evento) : ''}</span></span>
        <span class="dir"><strong>${valorH(d.valor, moeda)}</strong>${estado(d)}</span>
      </a>`).join('')}</div>` : `<div class="vazio">${ico('recibo', 48)}<strong>Nenhuma despesa ainda</strong>Inclua cada gasto assim que ele acontecer.</div>`}
    <div class="barra">
      ${aberto
        ? `<div class="linha-btn">${l.length ? `<button id="fechar" class="btn" style="flex:1">${ico('cadeado', 18)} Fechar</button>` : ''}<a class="btn primario" style="flex:1.6" href="#/r/${r.id}/d/nova">${ico('plus')} Adicionar despesa</a></div>`
        : r.status === 'enviado'
          ? `<div class="linha-btn"><a class="btn" style="flex:1" href="#/r/${r.id}/resumo">${ico('copiar', 18)} Ver resumo</a><button id="remover" class="btn perigo" style="flex:1">${ico('lixo', 18)} Remover</button></div>`
          : `${ag ? `<div id="progresso"></div><button id="enviar" class="btn primario">${ico('enviar', 18)} ${criados.length ? 'Continuar envio ao Agidesk' : 'Enviar ao Agidesk'}</button>` : ''}
             <div class="linha-btn"><a class="btn${ag ? '' : ' primario'}" style="flex:1.4" href="#/r/${r.id}/resumo">${ico('copiar', 18)} Copiar e colar</a>${criados.length ? '' : `<button id="reabrir" class="btn fantasma" style="flex:1">${ico('aberto', 18)} Reabrir</button>`}</div>`}
    </div>`;
  mostrarSync();
  $('#fechar')?.addEventListener('click', async () => {
    const sem = l.filter(d => !temAnexo(d));
    if (sem.length) return alert(`${sem.length} despesa(s) sem anexo. O Agidesk exige comprovante em cada item.`);
    if (!confirm('Fechar o relatório? Ele fica pronto para ir ao Agidesk. Se precisar, dá para reabrir.')) return;
    await salvarCampos('relatorios', r.id, { status: 'fechado', fechadoEm: Date.now() });
    if (await agConfig()) rota(); else go(`/r/${r.id}/resumo`);
  });
  $('#enviar')?.addEventListener('click', async e => {
    if (enviandoAgidesk) return;
    const b = e.currentTarget;
    const n = Math.ceil(l.length / LIMITE_ITENS);
    if (!criados.length && !confirm(`Enviar ao Agidesk ${n > 1 ? n + ' atendimentos' : 'um atendimento'} de reembolso com ${l.length} despesa(s), total ${brl(soma(l), moedaDe(r))}?\n\nIsso abre o pedido de verdade no financeiro.`)) return;
    // login do Google tem de ser pedido já no toque (comprovantes que estão só no Drive)
    const precisaDrive = l.some(d => !d.arquivoId && d.driveFileId && !r.agidesk?.arquivos?.[d.id]);
    const token = precisaDrive ? pedirToken() : Promise.resolve();
    enviandoAgidesk = true;
    b.disabled = true;
    const prog = $('#progresso');
    try {
      await token;
      const ids = await enviarAgidesk(await dbGet('relatorios', r.id), t => { prog.textContent = t; });
      alert(`Enviado! Atendimento${ids.length > 1 ? 's' : ''} nº ${ids.join(', ')} no Agidesk.`);
    } catch (err) {
      console.error(err);
      alert('Envio não concluído: ' + err.message + '\n\nO que já foi enviado fica registrado; tocar de novo continua de onde parou.');
    } finally { enviandoAgidesk = false; }
    rota();
  });
  $('#remover')?.addEventListener('click', async () => {
    if (!confirm('Remover este relatório do app? O atendimento no Agidesk não é afetado.')) return;
    const drive = r.driveFolderId && confirm('Mandar também a pasta do Drive para a lixeira?\n\nOK = apagar a pasta (dá para recuperar por 30 dias)\nCancelar = manter a pasta como arquivo do reembolso');
    await excluirRelatorio(r, drive);
  });
  $('#reabrir')?.addEventListener('click', async () => {
    await salvarCampos('relatorios', r.id, { status: 'aberto', fechadoEm: null });
    rota();
  });
}

async function telaDespesa(r, d) {
  const nova = !d;
  const aberto = r.status === 'aberto';
  if (nova && !aberto) return go(`/r/${r.id}`);
  d = d || { data: hojeISO(), descricao: '', valor: null, evento: r.evento, centro: r.centro, obs: '' };
  topo(nova ? 'Nova despesa' : 'Despesa', `/r/${r.id}`);
  const arqAtual = d.arquivoId ? await dbGet('arquivos', d.arquivoId) : null;
  let arqNovo = null;
  app.innerHTML = `
    <form id="f" class="card">
      <fieldset ${aberto ? '' : 'disabled'}>
        <label>Valor da NF
          <span class="valor-campo"><span>${simbolo(r)}</span><input name="valor" required inputmode="numeric" value="${valorInput(d.valor)}" placeholder="0,00" autocomplete="off"></span></label>
        <label>Descrição
          <input name="descricao" required maxlength="200" value="${esc(d.descricao)}" placeholder="Ex.: Táxi aeroporto → hotel"></label>
        <label>Data
          <span class="data-campo">
            <input name="data" required inputmode="numeric" maxlength="10" placeholder="dd/mm/aaaa" value="${esc(dataBR(d.data))}" autocomplete="off">
            ${aberto ? `<button type="button" id="cal" class="ibtn" aria-label="Abrir calendário">${ico('calendario')}</button><input type="date" id="dpick" class="escondido" tabindex="-1">` : ''}
          </span></label>
        <label>Evento / Projeto <span class="opc">(opcional)</span>
          <select name="evento">${opcoes(VALORES.eventos, d.evento, '— Nenhum —')}</select></label>
        <label>Centro de custos
          <select name="centro" required>${opcoes(VALORES.centros, d.centro, 'Selecione')}</select></label>
        <label style="margin-bottom:0">Comprovante <span class="opc">(JPEG, PNG ou PDF, até ${LIMITE_MB} MB)</span></label>
        <div class="anexo">
          <div id="prev"></div>
          ${aberto ? `
          <div class="botoes2">
            <label class="btn">${ico('camera', 18)} Tirar foto<input type="file" id="cam" accept="image/*" capture="environment" hidden></label>
            <label class="btn">${ico('clipe', 18)} Arquivo<input type="file" id="arq" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" hidden></label>
          </div>` : ''}
        </div>
        <label>Observação <span class="opc">(opcional)</span>
          <textarea name="obs" rows="2" maxlength="500" placeholder="Vai para o campo Observações do Agidesk">${esc(d.obs)}</textarea></label>
      </fieldset>
      ${aberto ? '<button class="btn primario">Salvar despesa</button>' : ''}
    </form>
    ${aberto && !nova ? `<button id="excluir" class="btn perigo">${ico('lixo', 18)} Excluir despesa</button>` : ''}`;

  function mostrar() {
    const a = arqNovo || arqAtual;
    const p = $('#prev');
    const bloco = (vis, nome, linha2, link) => `<div class="prev">${vis}<div class="info"><strong>${esc(nome)}</strong><span class="sub">${linha2}</span><br>${link}</div></div>`;
    if (a) {
      const u = objURL(a.blob);
      const vis = a.tipo === 'application/pdf' ? `<span class="doc">${ico('arquivo', 28)}</span>` : `<img src="${u}" alt="Comprovante">`;
      p.innerHTML = bloco(vis, a.nome, `${(a.blob.size / 1048576).toFixed(1)} MB · ${arqNovo ? 'novo, salve para guardar' : 'aguardando envio ao Drive'}`,
        `<a href="${u}" target="_blank">Abrir</a>`);
    } else if (d.driveFileId) {
      const vis = d.thumb ? `<img src="${objURL(d.thumb)}" alt="Miniatura do comprovante">` : `<span class="doc">${ico('arquivo', 28)}</span>`;
      p.innerHTML = bloco(vis, d.driveNome || 'Comprovante', 'Salvo no Google Drive', `<a href="${esc(d.driveUrl)}" target="_blank" rel="noopener">Abrir no Drive</a>`);
    } else {
      p.innerHTML = `<div class="vazio-anexo">${ico('recibo', 22)} Nenhum comprovante anexado.</div>`;
    }
  }
  mostrar();

  async function escolher(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { arqNovo = await prepararArquivo(file); mostrar(); }
    catch (err) { alert(err.message); }
  }
  // data em dd/mm/aaaa: barras automáticas ao digitar + calendário do aparelho no 📅
  // valor: só números, preenchido da direita para a esquerda como nos apps de banco (12590 → 125,90)
  const campoValor = $('#f').valor;
  const mascaraValor = () => {
    const n = campoValor.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
    campoValor.value = n ? (Number(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
  };
  campoValor.addEventListener('input', mascaraValor);
  mascaraValor();
  const campoData = $('#f').data;
  campoData.addEventListener('input', () => {
    const n = campoData.value.replace(/\D/g, '').slice(0, 8);
    campoData.value = [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/');
  });
  $('#cal')?.addEventListener('click', () => {
    const p = $('#dpick');
    p.value = lerData(campoData.value) || hojeISO();
    try { p.showPicker(); } catch { p.click(); }
  });
  $('#dpick')?.addEventListener('change', e => { if (e.target.value) campoData.value = dataBR(e.target.value); });
  $('#cam')?.addEventListener('change', escolher);
  $('#arq')?.addEventListener('change', escolher);

  $('#f').onsubmit = async e => {
    e.preventDefault();
    if (!aberto) return;
    const f = e.target;
    const valor = lerValor(f.valor.value);
    if (isNaN(valor)) return alert('Valor inválido. Use, por exemplo, 125,90.');
    if (!arqNovo && !temAnexo(d)) return alert('Anexe o comprovante (foto ou PDF). O Agidesk exige anexo em cada despesa.');
    const data = lerData(f.data.value);
    if (!data) return alert('Data inválida. Use dd/mm/aaaa, por exemplo 23/11/2026.');
    const campos = { data, descricao: f.descricao.value.trim(), valor, evento: f.evento.value, centro: f.centro.value, obs: f.obs.value.trim() };
    let atual = nova ? { id: novoId(), relatorioId: r.id, criadoEm: Date.now() } : (await dbGet('despesas', d.id)) || d;
    Object.assign(atual, campos);
    if (arqNovo) {
      const id = novoId();
      await dbPut('arquivos', { id, ...arqNovo });
      if (atual.arquivoId) await dbDel('arquivos', atual.arquivoId);
      if (atual.driveFileId) await paraLixeira(atual.driveFileId);
      Object.assign(atual, { arquivoId: id, driveFileId: null, driveUrl: null, driveNome: null, driveTipo: null, thumb: null });
    }
    await dbPut('despesas', atual);
    await marcarAlterado(r.id);
    toast('Despesa salva');
    go(`/r/${r.id}`);
  };
  $('#excluir')?.addEventListener('click', async () => {
    if (!confirm('Excluir esta despesa?')) return;
    const atual = (await dbGet('despesas', d.id)) || d;
    if (atual.arquivoId) await dbDel('arquivos', atual.arquivoId);
    if (atual.driveFileId) await paraLixeira(atual.driveFileId);
    await dbDel('despesas', d.id);
    await marcarAlterado(r.id);
    go(`/r/${r.id}`);
  });
}

// Tela provisória até a integração: tudo pronto para copiar e colar no "Reembolsos gerais"
async function telaResumo(r) {
  topo('Resumo para o Agidesk', `/r/${r.id}`);
  const nome = await nomeColaborador();
  const l = await despesasDe(r.id);
  const arqs = {};
  for (const d of l) if (d.arquivoId) arqs[d.id] = await dbGet('arquivos', d.arquivoId);
  const partes = [];
  for (let i = 0; i < l.length; i += LIMITE_ITENS) partes.push(l.slice(i, i + LIMITE_ITENS));
  const nomeAnexo = (d, n, a) => `${String(n).padStart(2, '0')} - ${d.descricao}`.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) + '.' + EXT[a.tipo];
  const campo = (rot, txt, extra) => `
    <div class="campo"><div><div class="rotulo">${rot}</div><div>${esc(txt) || '—'}</div></div>
    ${extra ?? (txt ? `<button type="button" class="mini" data-copy="${esc(txt)}">${ico('copiar', 14)} Copiar</button>` : '')}</div>`;

  app.innerHTML = `
    <p class="aviso ok" style="margin:0 0 12px">${ico('copiar', 18)}<span>Use esta tela para preencher o "Reembolsos gerais" no Agidesk: toque em Copiar e cole em cada campo.
    ${r.driveFolderId ? ` Os comprovantes estão na <a class="link" href="https://drive.google.com/drive/folders/${esc(r.driveFolderId)}" target="_blank" rel="noopener">pasta do Drive</a>.` : ''}</span></p>
    ${partes.map((p, k) => {
      const sufixo = partes.length > 1 ? ` (${k + 1}/${partes.length})` : '';
      const obs = linhasObs(p, r).join('\n');
      return `
      <section class="card">
        ${partes.length > 1 ? `<h3>Atendimento ${k + 1} de ${partes.length}</h3>` : ''}
        ${campo('Título', tituloRelatorio(r, nome) + sufixo)}
        ${campo(`Valor total (${simbolo(r)})`, valorInput(soma(p)))}
        ${p.map((d, i) => {
          const a = arqs[d.id];
          const link = a ? `<a class="mini" href="${objURL(a.blob)}" download="${esc(nomeAnexo(d, i + 1, a))}">${ico('baixar', 14)} Baixar</a>`
            : d.driveUrl ? `<a class="mini" href="${esc(d.driveUrl)}" target="_blank" rel="noopener">${ico('externo', 14)} Drive</a>` : '';
          return `
          <div class="item-res"><h4>Item ${i + 1}</h4>
            ${campo('Descrição da despesa', d.descricao)}
            ${campo(`Valor da NF (${simbolo(r)})`, valorInput(d.valor))}
            ${campo('Evento / Projeto', d.evento)}
            ${campo('Centros de custos', d.centro)}
            ${campo('Anexo', a ? a.nome : d.driveNome || '', link)}
          </div>`;
        }).join('')}
        <h4 class="sep">Observações</h4>
        ${campo('Observações', obs)}
      </section>`;
    }).join('')}
    ${navigator.canShare && Object.keys(arqs).length ? `<button id="share" class="btn">${ico('compartilhar', 18)} Compartilhar anexos do celular</button>` : ''}`;

  $$('[data-copy]').forEach(b => { b.onclick = () => copiar(b.dataset.copy); });
  $('#share')?.addEventListener('click', async () => {
    const files = l.map((d, i) => {
      const a = arqs[d.id];
      return a && new File([a.blob], nomeAnexo(d, (i % LIMITE_ITENS) + 1, a), { type: a.tipo });
    }).filter(Boolean);
    if (!navigator.canShare({ files })) return alert('Este aparelho não permite compartilhar vários arquivos de uma vez.');
    try { await navigator.share({ files, title: tituloRelatorio(r, nome) }); } catch { /* cancelado */ }
  });
}

// ---------- rotas ----------
async function rota(manterScroll) {
  urlsAtivas.forEach(u => URL.revokeObjectURL(u));
  urlsAtivas = [];
  if (manterScroll !== true) window.scrollTo(0, 0);
  const p = (location.hash.slice(1) || '/').split('/').filter(Boolean);
  try {
    if (!p.length) return await telaLista();
    if (p[0] === 'config') return await telaConfig();
    if (p[0] === 'novo') return await telaRelatorioForm();
    if (p[0] === 'r') {
      const r = await dbGet('relatorios', p[1]);
      if (!r) return go('/');
      if (p[2] === 'editar') return await telaRelatorioForm(r);
      if (p[2] === 'resumo') return await telaResumo(r);
      if (p[2] === 'd') {
        const d = p[3] === 'nova' ? null : await dbGet('despesas', p[3]);
        if (p[3] !== 'nova' && !d) return go(`/r/${r.id}`);
        return await telaDespesa(r, d);
      }
      return await telaRelatorio(r);
    }
    go('/');
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="aviso">Erro: ${esc(e.message)}</p>`;
  }
}

// Depois de sincronizar: redesenha só telas sem formulário (não perde o que está sendo digitado)
let enviandoAgidesk = false;
function aoTerminarSync() {
  const h = location.hash;
  if (enviandoAgidesk) return mostrarSync();
  if (h === '' || h === '#/' || /^#\/r\/[^/]+(\/resumo)?$/.test(h)) rota(true);
  else mostrarSync();
}

window.addEventListener('hashchange', () => rota());
window.addEventListener('online', () => { prepararGoogle().then(sincronizar); mostrarSync(); });
window.addEventListener('offline', mostrarSync);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js');
}
carregarListas().finally(() => rota());
atualizarListas();
prepararGoogle().then(sincronizar);
