'use strict';
// Envio do relatório fechado ao Agidesk ("Reembolsos gerais").
// A chave (app_key) é de cada usuário e fica só neste aparelho.
// Fluxo: sobe cada comprovante (POST /files) → cria o atendimento (POST /tasks).
// O progresso fica gravado no relatório (r.agidesk), então um envio interrompido
// retoma de onde parou e um atendimento já criado nunca é criado de novo.

const AG = {
  url: 'https://realcloud.agidesk.com/api/v1/',
  tenant: 'realcloud',
  cliente: 1,
  servico: 113, // Financeiro > Reembolso > Reembolsos gerais
  form: 7,      // Formulário - Reembolso
  campo: { titulo: 47, valor: 50, obs: 48, bloco: 44, descricao: 24, valorNF: 21, evento: 28, centro: 29, anexo: 22 },
};

async function agConfig() {
  const c = await dbGet('config', 'agidesk');
  return c ? c.valor : null;
}

async function agFetch(caminho, chave, params) {
  const sep = caminho.includes('?') ? '&' : '?';
  let r;
  try {
    r = await fetch(`${AG.url}${caminho}${sep}app_key=${encodeURIComponent(chave)}`, {
      method: params ? 'POST' : 'GET',
      headers: { 'X-Tenant-ID': AG.tenant, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      body: params ? new URLSearchParams(params) : undefined,
    });
  } catch { throw new Error('Sem conexão com o Agidesk. Verifique a internet.'); }
  let j = null;
  try { j = await r.json(); } catch { /* sem corpo */ }
  if (r.status === 401 || r.status === 403) throw new Error('O Agidesk recusou a chave de acesso. Confira em Configurações.');
  if (!r.ok || j?.error || j?.status === false) throw new Error('Agidesk: ' + (j?.error_message || j?.message || r.status));
  return j;
}

// Configurações: valida a chave e descobre o contato pelo e-mail
async function agConectar(chave, email) {
  const l = await agFetch(`contacts?email=${encodeURIComponent(email)}`, chave);
  const c = Array.isArray(l) ? l.find(x => String(x.email || '').toLowerCase() === email.toLowerCase()) || (l.length === 1 ? l[0] : null) : null;
  if (!c) throw new Error('Nenhum contato com esse e-mail no Agidesk.');
  const v = { chave, email, contatoId: Number(c.id), contatoNome: c.title };
  await dbPut('config', { chave: 'agidesk', valor: v });
  return v;
}

// Texto → chave de comparação (ignora acento, maiúscula, espaço e pontuação)
const normal = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function agListas(chave) {
  const [ev, cc] = await Promise.all([agFetch('formfielditems?limit=500', chave), agFetch('costcenters?limit=500', chave)]);
  const mapa = l => Object.fromEntries((l || []).filter(x => x.active === '1').map(x => [normal(x.title), Number(x.id)]));
  return { eventos: mapa(ev), centros: mapa(cc) };
}

// Listas das telas (Evento e Centro) vindas do Agidesk, guardadas no aparelho.
// Sem chave ou sem rede, valem as últimas guardadas ou, na falta, valores.js.
async function carregarListas() {
  const c = await dbGet('config', 'listasAgidesk');
  if (c) Object.assign(VALORES, c.valor);
}
async function atualizarListas() {
  const cfg = await agConfig();
  if (!cfg || !navigator.onLine) return;
  try {
    const [ev, cc] = await Promise.all([agFetch('formfielditems?limit=500', cfg.chave), agFetch('costcenters?limit=500', cfg.chave)]);
    const nomes = l => (l || []).filter(x => x.active === '1').map(x => x.title).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const valor = { eventos: nomes(ev), centros: nomes(cc) };
    if (!valor.centros.length) return;
    await dbPut('config', { chave: 'listasAgidesk', valor });
    Object.assign(VALORES, valor);
  } catch (e) { console.warn('Listas do Agidesk:', e); }
}

function blobBase64(blob) {
  return new Promise((res, rej) => {
    const f = new FileReader();
    f.onload = () => res(String(f.result).split(',')[1]);
    f.onerror = () => rej(new Error('Não foi possível ler o comprovante.'));
    f.readAsDataURL(blob);
  });
}

// Comprovante: cópia do celular ou, se já foi para o Drive, baixa de lá
async function comprovante(d) {
  d = (await dbGet('despesas', d.id)) || d; // relê: o envio ao Drive pode ter acabado de mover o arquivo
  if (d.arquivoId) {
    const a = await dbGet('arquivos', d.arquivoId);
    if (a) return { blob: a.blob, tipo: a.tipo };
  }
  if (d.driveFileId) {
    const resp = await gfetch(`${API}/${d.driveFileId}?alt=media`);
    return { blob: await resp.blob(), tipo: d.driveTipo };
  }
  throw new Error(`A despesa "${d.descricao}" está sem comprovante.`);
}

const partesDe = l => { const p = []; for (let i = 0; i < l.length; i += LIMITE_ITENS) p.push(l.slice(i, i + LIMITE_ITENS)); return p; };

// Botão "Enviar ao Agidesk". progresso(texto) atualiza a tela.
async function enviarAgidesk(r, progresso) {
  const cfg = await agConfig();
  if (!cfg) throw new Error('Configure a chave do Agidesk em Configurações.');
  if (!navigator.onLine) throw new Error('Sem internet. Tente quando estiver conectado.');
  const nome = await nomeColaborador();
  const l = await despesasDe(r.id);
  if (!l.length) throw new Error('Relatório sem despesas.');
  const partes = partesDe(l);
  const ag = r.agidesk || { arquivos: {}, atendimentos: [] };
  ag.arquivos ||= {}; ag.atendimentos ||= [];
  const gravar = () => salvarCampos('relatorios', r.id, { agidesk: ag });

  // confere evento e centro antes de subir qualquer coisa
  progresso('Conferindo as listas do Agidesk…');
  const listas = await agListas(cfg.chave);
  const C = AG.campo;
  for (const d of l) {
    if (!listas.centros[normal(d.centro)]) throw new Error(`Centro de custos "${d.centro}" não existe no Agidesk (despesa "${d.descricao}").`);
    if (d.evento && !listas.eventos[normal(d.evento)]) throw new Error(`Evento "${d.evento}" não existe ou está inativo no Agidesk (despesa "${d.descricao}").`);
  }

  for (let k = 0; k < partes.length; k++) {
    if (ag.atendimentos[k]?.id) continue; // já criado
    const p = partes[k];
    const rotuloParte = partes.length > 1 ? ` (atendimento ${k + 1} de ${partes.length})` : '';

    // 1) comprovantes
    for (let i = 0; i < p.length; i++) {
      const d = p[i];
      if (ag.arquivos[d.id]) continue;
      progresso(`Enviando comprovante ${i + 1} de ${p.length}${rotuloParte}…`);
      const a = await comprovante(d);
      const titulo = limparNome(`${String(i + 1).padStart(2, '0')} - ${d.data} - ${d.descricao}`).slice(0, 80) + '.' + EXT[a.tipo];
      const f = await agFetch('files', cfg.chave, { title: titulo, content: await blobBase64(a.blob), mimetype: a.tipo });
      ag.arquivos[d.id] = { id: Number(f.id), nome: titulo };
      await gravar();
    }

    // 2) atendimento
    if (ag.atendimentos[k]?.tentando && !confirm(
      `Uma tentativa anterior de criar o atendimento${rotuloParte} foi interrompida.\n\n` +
      'Antes de continuar, veja no Agidesk se ele já foi criado. Se já foi, cancele aqui e avise o suporte do app para não duplicar.\n\nCriar agora?')) {
      throw new Error('Envio pausado para conferência.');
    }
    ag.atendimentos[k] = { tentando: Date.now() };
    await gravar();
    progresso(`Criando o atendimento${rotuloParte}…`);

    const titulo = (tituloRelatorio(r, nome) + (partes.length > 1 ? ` (${k + 1}/${partes.length})` : '')).slice(0, 256);
    const total = valorInput(soma(p));
    const obs = linhasObs(p, r).map(esc).join('<br>');
    const q = [];
    const add = (chave, valor) => q.push([chave, String(valor)]);
    add('services', AG.servico); add('customers', AG.cliente); add('contacts', cfg.contatoId); add('forms', AG.form);
    add('title', 'Reembolsos gerais');
    p.forEach(d => add('files[]', ag.arquivos[d.id].id));
    const campo = (pre, id, valor, extra = []) => {
      add(`${pre}[form_id]`, AG.form); add(`${pre}[formfield_id]`, id);
      add(`${pre}[value]`, valor); add(`${pre}[text]`, valor);
      extra.forEach(([c, v]) => add(`${pre}${c}`, v));
    };
    campo('customfields[0]', C.titulo, titulo);
    campo('customfields[1]', C.valor, total);
    add('customfields[2][form_id]', AG.form); add('customfields[2][formfield_id]', C.bloco);
    p.forEach((d, n) => {
      const b = `customfields[2][value][${n}]`;
      const arq = ag.arquivos[d.id];
      add(`${b}[forms]`, AG.form); add(`${b}[edition]`, 1); add(`${b}[files][]`, arq.id);
      let j = 0;
      const linha = (id, valor, extra = []) => { campo(`${b}[customfields][${j++}]`, id, valor, [['[placement_id]', C.bloco], ...extra]); };
      linha(C.descricao, d.descricao);
      linha(C.valorNF, valorInput(d.valor));
      if (d.evento) { const ide = listas.eventos[normal(d.evento)]; linha(C.evento, ide, [['[items][]', ide]]); }
      const idc = listas.centros[normal(d.centro)]; linha(C.centro, idc, [['[items][]', idc]]);
      add(`${b}[customfields][${j}][form_id]`, AG.form); add(`${b}[customfields][${j}][formfield_id]`, C.anexo);
      add(`${b}[customfields][${j}][placement_id]`, C.bloco); add(`${b}[customfields][${j}][value]`, '');
      add(`${b}[customfields][${j}][files][]`, arq.id); add(`${b}[customfields][${j}][text]`, arq.nome);
    });
    if (obs) campo('customfields[3]', C.obs, obs);

    const t = await agFetch('tasks', cfg.chave, q);
    if (!t?.id) throw new Error('O Agidesk não devolveu o número do atendimento.');
    ag.atendimentos[k] = { id: Number(t.id), titulo, criadoEm: Date.now() };
    await gravar();
  }

  await salvarCampos('relatorios', r.id, { status: 'enviado', enviadoEm: Date.now() });
  return ag.atendimentos.map(a => a.id);
}
