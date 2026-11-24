'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');

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
const brl = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const valorInput = c => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));
const dataBR = iso => (iso ? iso.split('-').reverse().join('/') : '');
const soma = l => l.reduce((s, d) => s + d.valor, 0);

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
  return `Reembolso - ${nome || '<seu nome>'} - ${mesAno}` + (fim ? ` - ${fim}` : '');
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
  topo('Meus relatórios');
  const rels = (await dbAll('relatorios')).sort((a, b) => b.criadoEm - a.criadoEm);
  const por = {};
  (await dbAll('despesas')).forEach(d => (por[d.relatorioId] ||= []).push(d));
  app.innerHTML = `
    <div id="sync"></div>
    ${rels.length ? rels.map(r => {
      const l = por[r.id] || [];
      return `
      <a class="card" href="#/r/${r.id}">
        <div class="linha"><strong>${esc(r.apelido || r.evento || 'Relatório ' + r.mesAno)}</strong><span class="tag ${r.status}">${STATUS[r.status]}</span></div>
        <div class="sub">${esc(r.mesAno)} · ${l.length} despesa${l.length === 1 ? '' : 's'}</div>
        <div class="total">${brl(soma(l))}</div>
      </a>`;
    }).join('') : `
      <div class="vazio"><p>Nenhum relatório ainda.</p><p>Crie um no início da viagem e vá incluindo as despesas.</p></div>`}
    <p class="rodape"><a href="#/config">Configurações</a></p>
    <div class="barra"><a class="btn primario" href="#/novo">+ Novo relatório</a></div>`;
  mostrarSync();
}

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
    <form id="f" class="card">
      <label>Seu nome (vai no título do reembolso)*
        <input name="nome" required value="${esc(nome)}" placeholder="Ex.: Ricardo Afonso" autocomplete="name"></label>
      <button class="btn primario">Salvar</button>
    </form>
    <section class="card">
      <h3>Google Drive</h3>
      <p>Pasta dos reembolsos: <strong>${raiz ? esc(raiz.valor.nome) : 'não escolhida'}</strong></p>
      <button id="pasta" class="btn">${raiz ? 'Trocar pasta' : 'Conectar e escolher a pasta'}</button>
      <p class="dica">Cada relatório vira uma subpasta "AAAA-MM-DD-Nome" (data da primeira nota) com os comprovantes e uma planilha. A cópia no celular é apagada depois que o Drive confirma o recebimento. O app só enxerga o que ele mesmo cria.</p>
    </section>
    <form id="fag" class="card">
      <h3>Agidesk</h3>
      ${ag ? `<p>Conectado como <strong>${esc(ag.contatoNome)}</strong> (contato ${ag.contatoId}).</p>` : '<p>Ainda não conectado: o envio é feito copiando e colando.</p>'}
      <label>Seu e-mail no Agidesk
        <input name="email" type="email" required value="${esc(ag?.email || '')}" placeholder="nome@realcloud.com.br" autocomplete="email"></label>
      <label>Chave de acesso
        <input name="chave" type="password" required value="${esc(ag?.chave || '')}" autocomplete="off"></label>
      <button class="btn">${ag ? 'Atualizar' : 'Conectar'}</button>
      ${ag ? '<button type="button" id="agsair" class="btn perigo">Desconectar</button>' : ''}
      <p class="dica">No Agidesk: "Oi, Usuário" → Meus dados → Relações → Chaves de acesso. A chave fica só neste aparelho.</p>
    </form>
    <p class="dica">${uso}</p>`;
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
  r = r || { mesAno: mesAnoAtual(), evento: '', centro: '', apelido: '' };
  topo(novo ? 'Novo relatório' : 'Editar relatório', novo ? '/' : `/r/${r.id}`);
  app.innerHTML = `
    <form id="f" class="card">
      <label>Nome da viagem (vai no nome da pasta do Drive)
        <input name="apelido" value="${esc(r.apelido)}" placeholder="Ex.: Visita a Clientes SP"></label>
      <label>Mês/ano*
        <input name="mesAno" required value="${esc(r.mesAnoManual ? r.mesAno : mesAnoAtual())}" placeholder="MM/AAAA" pattern="(0[1-9]|1[0-2])/\\d{4}" title="Use o formato MM/AAAA">
        <span class="dica">Vai no título do Agidesk. Se não mudar, vale o mês do envio.</span></label>
      <label>Evento / Projeto
        <select name="evento">${opcoes(VALORES.eventos, r.evento, '— Nenhum —')}</select></label>
      <label>Centro de custos padrão*
        <select name="centro" required>${opcoes(VALORES.centros, r.centro, 'Selecione')}</select></label>
      <p class="dica">Evento e centro de custos viram o padrão de cada despesa nova. Dá para mudar item a item.</p>
      <button class="btn primario">${novo ? 'Criar relatório' : 'Salvar'}</button>
    </form>
    ${novo ? '' : '<button id="excluir" class="btn perigo">Excluir relatório</button>'}`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const mesAno = f.mesAno.value.trim();
    Object.assign(r, { apelido: f.apelido.value.trim(), mesAno, mesAnoManual: mesAno !== mesAnoAtual(), evento: f.evento.value, centro: f.centro.value });
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
  const icone = d => (d.arquivoId ? '📱 no celular' : d.driveFileId ? '☁️ no Drive' : '⚠️ sem anexo');
  app.innerHTML = `
    <div id="sync"></div>
    <section class="card">
      <div class="linha"><span class="tag ${r.status}">${STATUS[r.status]}</span>${aberto ? `<a class="link" href="#/r/${r.id}/editar">Editar</a>` : ''}</div>
      <div class="rotulo">Título no Agidesk</div>
      <div class="titulo-ag">${esc(tituloRelatorio(r, nome))}</div>
      <div class="rotulo">Valor total</div>
      <div class="total grande">${brl(soma(l))}</div>
      <div class="sub">${l.length}/${LIMITE_ITENS} itens${r.driveFolderId ? ` · <a class="link" href="https://drive.google.com/drive/folders/${esc(r.driveFolderId)}" target="_blank" rel="noopener">Abrir pasta no Drive</a>` : ''}</div>
      ${aviso ? `<p class="aviso">${aviso}</p>` : ''}
      ${criados.length ? `<p class="aviso">${r.status === 'enviado' ? '✓ Enviado ao Agidesk' : 'Envio ao Agidesk incompleto'}: atendimento${criados.length > 1 ? 's' : ''} nº ${criados.join(', ')}.</p>` : ''}
    </section>
    ${l.length ? l.map((d, i) => `
      <a class="card item" href="#/r/${r.id}/d/${d.id}">
        <span class="ordem">${i + 1}</span>
        <span class="meio"><strong>${esc(d.descricao)}</strong><span class="sub">${dataBR(d.data)} · ${esc(d.centro)}${d.evento ? ' · ' + esc(d.evento) : ''}</span></span>
        <span class="dir"><strong>${brl(d.valor)}</strong><span class="sub">${icone(d)}</span></span>
      </a>`).join('') : '<div class="vazio">Nenhuma despesa ainda.</div>'}
    <div class="barra">
      ${aberto
        ? `<a class="btn primario" href="#/r/${r.id}/d/nova">+ Adicionar despesa</a>${l.length ? '<button id="fechar" class="btn">Fechar relatório</button>' : ''}`
        : r.status === 'enviado'
          ? `<a class="btn" href="#/r/${r.id}/resumo">Ver resumo</a><button id="remover" class="btn perigo">Remover do app</button>`
          : `${ag ? `<button id="enviar" class="btn primario">${criados.length ? 'Continuar envio ao Agidesk' : 'Enviar ao Agidesk'}</button><div id="progresso" class="sub rodape"></div>` : ''}
             <a class="btn${ag ? '' : ' primario'}" href="#/r/${r.id}/resumo">Ver resumo (copiar e colar)</a>
             ${criados.length ? '' : '<button id="reabrir" class="btn">Reabrir</button>'}`}
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
    const b = e.target;
    const n = Math.ceil(l.length / LIMITE_ITENS);
    if (!criados.length && !confirm(`Enviar ao Agidesk ${n > 1 ? n + ' atendimentos' : 'um atendimento'} de reembolso com ${l.length} despesa(s), total ${brl(soma(l))}?\n\nIsso abre o pedido de verdade no financeiro.`)) return;
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
        <label>Data da despesa*
          <input type="date" name="data" required value="${esc(d.data)}"></label>
        <label>Descrição da despesa*
          <input name="descricao" required maxlength="200" value="${esc(d.descricao)}" placeholder="Ex.: Táxi aeroporto → hotel"></label>
        <label>Valor da NF (R$)*
          <input name="valor" required inputmode="decimal" value="${valorInput(d.valor)}" placeholder="0,00"></label>
        <label>Evento / Projeto
          <select name="evento">${opcoes(VALORES.eventos, d.evento, '— Nenhum —')}</select></label>
        <label>Centro de custos*
          <select name="centro" required>${opcoes(VALORES.centros, d.centro, 'Selecione')}</select></label>
        <div class="rotulo">Comprovante* <span class="sub">(JPEG, PNG ou PDF, até ${LIMITE_MB} MB)</span></div>
        <div id="prev" class="prev"></div>
        ${aberto ? `
        <div class="botoes2">
          <label class="btn">📷 Tirar foto<input type="file" id="cam" accept="image/*" capture="environment" hidden></label>
          <label class="btn">📁 Arquivo<input type="file" id="arq" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" hidden></label>
        </div>` : ''}
        <label>Observação (opcional)
          <textarea name="obs" rows="2" maxlength="500" placeholder="Vai para o campo Observações do Agidesk">${esc(d.obs)}</textarea></label>
      </fieldset>
      ${aberto ? '<button class="btn primario">Salvar</button>' : ''}
    </form>
    ${aberto && !nova ? '<button id="excluir" class="btn perigo">Excluir despesa</button>' : ''}`;

  function mostrar() {
    const a = arqNovo || arqAtual;
    const p = $('#prev');
    if (a) {
      const u = objURL(a.blob);
      p.innerHTML = (a.tipo === 'application/pdf'
        ? `<a class="pdf" href="${u}" target="_blank">📄 Abrir PDF</a>`
        : `<a href="${u}" target="_blank"><img src="${u}" alt="Comprovante"></a>`) +
        `<div class="sub">${esc(a.nome)} · ${(a.blob.size / 1048576).toFixed(1)} MB · ${arqNovo ? 'novo (salve para guardar)' : '📱 aguardando envio ao Drive'}</div>`;
    } else if (d.driveFileId) {
      p.innerHTML = (d.thumb ? `<img src="${objURL(d.thumb)}" alt="Miniatura do comprovante">` : '') +
        `<a class="pdf" href="${esc(d.driveUrl)}" target="_blank" rel="noopener">☁️ Abrir no Drive</a><div class="sub">${esc(d.driveNome)}</div>`;
    } else {
      p.innerHTML = '<span class="sub">Nenhum arquivo anexado.</span>';
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
  $('#cam')?.addEventListener('change', escolher);
  $('#arq')?.addEventListener('change', escolher);

  $('#f').onsubmit = async e => {
    e.preventDefault();
    if (!aberto) return;
    const f = e.target;
    const valor = lerValor(f.valor.value);
    if (isNaN(valor)) return alert('Valor inválido. Use, por exemplo, 125,90.');
    if (!arqNovo && !temAnexo(d)) return alert('Anexe o comprovante (foto ou PDF). O Agidesk exige anexo em cada despesa.');
    const campos = { data: f.data.value, descricao: f.descricao.value.trim(), valor, evento: f.evento.value, centro: f.centro.value, obs: f.obs.value.trim() };
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
    ${extra ?? (txt ? `<button type="button" class="mini" data-copy="${esc(txt)}">Copiar</button>` : '')}</div>`;

  app.innerHTML = `
    <p class="dica">Até a integração ficar pronta, use esta tela para preencher o "Reembolsos gerais" no Agidesk: toque em Copiar e cole em cada campo.
    ${r.driveFolderId ? ` Os comprovantes estão na <a class="link" href="https://drive.google.com/drive/folders/${esc(r.driveFolderId)}" target="_blank" rel="noopener">pasta do Drive</a>.` : ''}</p>
    ${partes.map((p, k) => {
      const sufixo = partes.length > 1 ? ` (${k + 1}/${partes.length})` : '';
      const obs = p.map((d, i) => `Item ${i + 1} - ${dataBR(d.data)}${d.obs ? ' - ' + d.obs : ''}`).join('\n');
      return `
      <section class="card">
        ${partes.length > 1 ? `<h3>Atendimento ${k + 1} de ${partes.length}</h3>` : ''}
        ${campo('Título', tituloRelatorio(r, nome) + sufixo)}
        ${campo('Valor total', valorInput(soma(p)))}
        ${p.map((d, i) => {
          const a = arqs[d.id];
          const link = a ? `<a class="mini" href="${objURL(a.blob)}" download="${esc(nomeAnexo(d, i + 1, a))}">Baixar</a>`
            : d.driveUrl ? `<a class="mini" href="${esc(d.driveUrl)}" target="_blank" rel="noopener">Drive</a>` : '';
          return `
          <div class="item-res"><h4>Item ${i + 1}</h4>
            ${campo('Descrição da despesa', d.descricao)}
            ${campo('Valor da NF', valorInput(d.valor))}
            ${campo('Evento / Projeto', d.evento)}
            ${campo('Centros de custos', d.centro)}
            ${campo('Anexo', a ? a.nome : d.driveNome || '', link)}
          </div>`;
        }).join('')}
        <h4 class="sep">Observações</h4>
        ${campo('Data e observação de cada item', obs)}
      </section>`;
    }).join('')}
    ${navigator.canShare && Object.keys(arqs).length ? '<button id="share" class="btn">Compartilhar anexos guardados no celular</button>' : ''}`;

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
