'use strict';
// Login Google + envio dos comprovantes ao Drive do usuário.
// Regras: dados do relatório ficam no aparelho; o arquivo local só é apagado
// depois que o Drive confirma o recebimento (tamanho igual ao enviado).

const ESCOPO = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const MIME_PASTA = 'application/vnd.google-apps.folder';
const MIME_PLANILHA = 'application/vnd.google-apps.spreadsheet';

const sync = { rodando: false, estado: 'ocioso', erro: '' };
let tokenClient = null;
let aguardandoToken = null;
let tokenMem = null;

// ---------- scripts do Google ----------
const _scripts = {};
function script(src) {
  return _scripts[src] ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res;
    s.onerror = () => { delete _scripts[src]; s.remove(); rej(new Error('Sem acesso ao Google. Verifique a internet.')); };
    document.head.appendChild(s);
  });
}

async function prepararGoogle() {
  if (!navigator.onLine) return;
  try {
    await script('https://accounts.google.com/gsi/client');
    script('https://apis.google.com/js/api.js').catch(() => {});
    if (tokenClient) return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE.clientId,
      scope: ESCOPO,
      callback: r => {
        const p = aguardandoToken; aguardandoToken = null;
        if (r.error) return p?.rej(new Error(r.error_description || r.error));
        salvarToken(r.access_token, Number(r.expires_in) || 3600);
        p?.res(r.access_token);
      },
      error_callback: e => {
        const p = aguardandoToken; aguardandoToken = null;
        p?.rej(new Error(e.type === 'popup_closed' ? 'Login cancelado.' : 'Não foi possível abrir o login do Google (verifique se o navegador bloqueou a janela).'));
      },
    });
  } catch (e) { console.warn(e); }
}

// ---------- token ----------
function lerToken() {
  let t = tokenMem;
  if (!t) { try { t = JSON.parse(localStorage.getItem('gtoken') || 'null'); } catch { t = null; } }
  return t && t.expira > Date.now() + 60000 ? t.valor : null;
}
function salvarToken(valor, segundos) {
  tokenMem = { valor, expira: Date.now() + segundos * 1000 };
  try { localStorage.setItem('gtoken', JSON.stringify(tokenMem)); } catch { /* sem storage */ }
}
function esquecerToken() {
  tokenMem = null;
  try { localStorage.removeItem('gtoken'); } catch { /* sem storage */ }
}
// Precisa ser chamado direto de um toque do usuário (antes de qualquer await),
// senão o navegador bloqueia a janela de login.
function pedirToken() {
  const t = lerToken();
  if (t) return Promise.resolve(t);
  if (!tokenClient) return Promise.reject(new Error('Não foi possível falar com o Google. Verifique a internet e tente de novo.'));
  return new Promise((res, rej) => {
    aguardandoToken = { res, rej };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

// ---------- chamadas ao Drive ----------
async function gfetch(url, opts = {}) {
  const t = lerToken();
  if (!t) throw Object.assign(new Error('Conecte-se ao Google.'), { login: true });
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + t, ...(opts.headers || {}) } });
  if (r.status === 401) { esquecerToken(); throw Object.assign(new Error('O login do Google expirou.'), { login: true }); }
  if (!r.ok) {
    let msg = String(r.status);
    try { msg = (await r.json()).error.message; } catch { /* sem corpo */ }
    throw Object.assign(new Error('Drive: ' + msg), { status: r.status });
  }
  return r;
}
const gjson = async (url, opts) => (await gfetch(url, opts)).json();
const jsonPost = (metodo, obj) => ({ method: metodo, headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(obj) });

const criarPasta = (nome, pai) => gjson(`${API}?fields=id,name`, jsonPost('POST', { name: nome, mimeType: MIME_PASTA, parents: [pai] }));
const alterarMeta = (id, meta) => gjson(`${API}/${id}?fields=id,name`, jsonPost('PATCH', meta));

// Envio "resumable": funciona para arquivos grandes (PDF de até 20 MB)
async function enviarArquivo(blob, meta, tipo) {
  const r = await gfetch(`${UPLOAD}?uploadType=resumable&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': tipo },
    body: JSON.stringify(meta),
  });
  const sessao = r.headers.get('Location');
  if (!sessao) throw new Error('O Drive não iniciou o envio.');
  const r2 = await fetch(sessao, { method: 'PUT', headers: { 'Content-Type': tipo }, body: blob });
  if (!r2.ok) throw new Error(`Falha ao enviar arquivo ao Drive (${r2.status}).`);
  return r2.json();
}

async function paraLixeira(id) {
  const c = (await dbGet('config', 'lixeira')) || { chave: 'lixeira', ids: [] };
  if (!c.ids.includes(id)) c.ids.push(id);
  await dbPut('config', c);
}

// ---------- nomes ----------
const limparNome = s => String(s).replace(/[\\/:*?"<>|#%]/g, '-').replace(/\s+/g, ' ').trim();
function nomePasta(r, l) {
  const primeira = l.map(d => d.data).sort()[0];
  return limparNome(`${primeira}-${r.apelido || r.evento || 'Relatorio'}`);
}
const nomeArquivoDrive = (d, tipo) => limparNome(`${d.data} - ${d.descricao}`).slice(0, 80) + '.' + EXT[tipo];

// Planilha espelho no layout da aba "Padrão". Valores como fórmula (=12590/100)
// para não depender do separador decimal da conta.
function csvRelatorio(r, l, nome) {
  const q = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = ' ' + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const num = c => `=${c}/100`;
  const linhas = [
    ['', '', q('Titulo: ' + tituloRelatorio(r, nome, l))],
    ['', '', q('Valor Total'), num(soma(l))],
    [],
    ['Ordem', 'Data da Despesa', 'Descrição da Despesa', 'Valor da NF', 'Evento / Projeto', 'Centro de Custos', 'Arquivo', 'Observação (opcional)'].map(q),
    ...l.map((d, i) => [
      i + 1, q(d.data), q(d.descricao), num(d.valor), q(d.evento), q(d.centro),
      q(d.driveUrl || '(aguardando envio)'), q(d.obs ? `${dataBR(d.data)} - ${d.obs}` : ''),
    ]),
  ];
  return linhas.map(l => l.join(',')).join('\r\n');
}

// ---------- sincronização ----------
async function precisaSync(r, l) {
  if (!l.length) return false;
  return (r.versao || 0) !== (r.versaoDrive || 0) ||
    l.some(d => d.arquivoId || (d.driveFileId && nomeArquivoDrive(d, d.driveTipo) !== d.driveNome)) ||
    (r.driveFolderId && nomePasta(r, l) !== r.driveFolderNome);
}

async function sincronizarRelatorio(r, raizId, nome) {
  const l = await despesasDe(r.id);
  if (!(await precisaSync(r, l))) return;
  const versao = r.versao || 0;

  // pasta do relatório
  const np = nomePasta(r, l);
  if (r.driveFolderId && r.driveFolderNome !== np) {
    try { await alterarMeta(r.driveFolderId, { name: np }); }
    catch (e) { if (e.status === 404) Object.assign(r, { driveFolderId: null, driveSheetId: null }); else throw e; }
  }
  if (!r.driveFolderId) r.driveFolderId = (await criarPasta(np, raizId)).id;
  r.driveFolderNome = np;
  await salvarCampos('relatorios', r.id, { driveFolderId: r.driveFolderId, driveFolderNome: np, driveSheetId: r.driveSheetId ?? null });

  // comprovantes
  for (const d of l) {
    if (d.arquivoId) {
      const idLocal = d.arquivoId;
      const a = await dbGet('arquivos', idLocal);
      if (!a) { await salvarCampos('despesas', d.id, { arquivoId: null }, o => o.arquivoId === idLocal); continue; }
      const nomeExt = nomeArquivoDrive(d, a.tipo);
      const up = await enviarArquivo(a.blob, { name: nomeExt, parents: [r.driveFolderId] }, a.tipo);
      // confirma lendo de volta do Drive
      const conf = await gjson(`${API}/${up.id}?fields=id,size,webViewLink`);
      if (Number(conf.size) !== a.blob.size) {
        await paraLixeira(conf.id);
        throw new Error(`"${nomeExt}" chegou incompleto ao Drive. Vou tentar de novo.`);
      }
      let thumb = d.thumb || null;
      if (a.tipo.startsWith('image/')) { try { thumb = await converterJPEG(a.blob, 360, 0.7); } catch { /* sem miniatura */ } }
      const salvo = await salvarCampos('despesas', d.id, {
        arquivoId: null, driveFileId: conf.id, driveUrl: conf.webViewLink, driveNome: nomeExt, driveTipo: a.tipo, arquivoNome: a.nome, thumb,
      }, o => o.arquivoId === idLocal);
      if (salvo && salvo.arquivoId === null && salvo.driveFileId === conf.id) await dbDel('arquivos', idLocal);
      else await paraLixeira(conf.id); // o usuário trocou o arquivo durante o envio
      Object.assign(d, { driveUrl: conf.webViewLink });
    } else if (d.driveFileId) {
      const nomeExt = nomeArquivoDrive(d, d.driveTipo);
      if (nomeExt !== d.driveNome) {
        try { await alterarMeta(d.driveFileId, { name: nomeExt }); } catch (e) { if (e.status !== 404) throw e; }
        await salvarCampos('despesas', d.id, { driveNome: nomeExt });
      }
    }
  }

  // planilha espelho
  const lAtual = await despesasDe(r.id);
  const csv = csvRelatorio(r, lAtual, nome);
  if (r.driveSheetId) {
    try { await gfetch(`${UPLOAD}/${r.driveSheetId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'text/csv; charset=UTF-8' }, body: csv }); }
    catch (e) { if (e.status === 404) r.driveSheetId = null; else throw e; }
  }
  if (!r.driveSheetId) {
    const s = await enviarArquivo(new Blob([csv], { type: 'text/csv' }), { name: 'Relatório de despesas (gerado pelo app)', parents: [r.driveFolderId], mimeType: MIME_PLANILHA }, 'text/csv');
    r.driveSheetId = s.id;
  }
  await salvarCampos('relatorios', r.id, { driveSheetId: r.driveSheetId, versaoDrive: versao });
}

async function sincronizar() {
  if (sync.rodando || !navigator.onLine || !lerToken()) return;
  const raiz = await dbGet('config', 'driveRaiz');
  if (!raiz) return;
  sync.rodando = true; sync.estado = 'enviando'; sync.erro = '';
  mostrarSync();
  try {
    const lx = await dbGet('config', 'lixeira');
    for (const id of [...(lx?.ids || [])]) {
      try { await alterarMeta(id, { trashed: true }); } catch (e) { if (e.status !== 404) throw e; }
      lx.ids = lx.ids.filter(x => x !== id);
      await dbPut('config', lx);
    }
    const nome = await nomeColaborador();
    for (const r of await dbAll('relatorios')) await sincronizarRelatorio(r, raiz.valor.id, nome);
    sync.estado = 'ok';
  } catch (e) {
    console.error(e);
    sync.estado = e.login ? 'login' : 'erro';
    sync.erro = e.message;
  } finally {
    sync.rodando = false;
    aoTerminarSync();
  }
}

let _timerSync;
function agendarSync() { clearTimeout(_timerSync); _timerSync = setTimeout(sincronizar, 1500); }

// Botão "Enviar ao Drive": pede login (se preciso) e sincroniza
function enviarAgora() {
  pedirToken()
    .then(sincronizar)
    .catch(err => { sync.estado = 'erro'; sync.erro = err.message; mostrarSync(); });
}

// ---------- escolha da pasta (Google Picker) ----------
function escolherPasta() {
  pedirToken()
    .then(async token => {
      await script('https://apis.google.com/js/api.js');
      await new Promise(res => gapi.load('picker', res));
      const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes(MIME_PASTA);
      new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE.apiKey)
        .setAppId(GOOGLE.appId)
        .setTitle('Escolha a pasta dos reembolsos')
        .setCallback(async data => {
          if (data.action !== google.picker.Action.PICKED) return;
          const f = data.docs[0];
          await dbPut('config', { chave: 'driveRaiz', valor: { id: f.id, nome: f.name } });
          toast('Pasta escolhida: ' + f.name);
          rota();
          sincronizar();
        })
        .build()
        .setVisible(true);
    })
    .catch(err => alert(err.message));
}

// ---------- faixa de status ----------
async function mostrarSync() {
  const el = $('#sync');
  if (!el) return;
  const raiz = await dbGet('config', 'driveRaiz');
  const desp = await dbAll('despesas');
  const n = desp.filter(d => d.arquivoId).length;
  const qtd = `${n} comprovante${n === 1 ? '' : 's'}`;
  const lx = await dbGet('config', 'lixeira');
  let pend = (lx?.ids?.length || 0) > 0; // exclusões aguardando ir para a lixeira do Drive
  if (!n && !pend) {
    const por = {};
    desp.forEach(d => (por[d.relatorioId] ||= []).push(d));
    for (const r of await dbAll('relatorios')) if (await precisaSync(r, por[r.id] || [])) { pend = true; break; }
  }
  let html = '';
  if (!raiz) html = `<div class="sync alerta">Os comprovantes ainda não vão para o Drive. <a href="#/config">Configurar</a></div>`;
  else if (sync.rodando) html = `<div class="sync">⏳ Enviando ao Drive…</div>`;
  else if ((n || pend) && !navigator.onLine) html = `<div class="sync">📴 ${n ? qtd + ' guardado(s) no celular' : 'Alterações guardadas no celular'}. Envio quando houver internet.</div>`;
  else if (sync.estado === 'erro') html = `<div class="sync alerta">Erro no envio: ${esc(sync.erro)} <button class="mini" data-sync>Tentar de novo</button></div>`;
  else if ((n || pend) && !lerToken()) html = `<div class="sync alerta">🔑 A conexão com o Google expirou. ${n ? qtd + ' aguardando' : 'Alterações aguardando'}. <button class="mini" data-sync>Reconectar ao Google</button></div>`;
  else if (n || pend) html = `<div class="sync">📱 ${n ? qtd + ' aguardando envio' : 'Alterações aguardando envio'} <button class="mini" data-sync>Enviar ao Drive</button></div>`;
  else if (desp.length) html = `<div class="sync ok">✓ Tudo salvo no Drive</div>`;
  el.innerHTML = html;
}

document.addEventListener('click', e => { if (e.target.closest('[data-sync]')) enviarAgora(); });
