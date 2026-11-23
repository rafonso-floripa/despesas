// Armazenamento local no celular (IndexedDB): relatórios, despesas, arquivos e configurações.
const DB_NOME = 'relatorio-despesas';
const DB_VERSAO = 1;
let _db;

function abrirDB() {
  return _db ||= new Promise((res, rej) => {
    const req = indexedDB.open(DB_NOME, DB_VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('relatorios', { keyPath: 'id' });
      db.createObjectStore('despesas', { keyPath: 'id' }).createIndex('relatorioId', 'relatorioId');
      db.createObjectStore('arquivos', { keyPath: 'id' });
      db.createObjectStore('config', { keyPath: 'chave' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function op(store, modo, fn) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, modo);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req?.result);
    t.onerror = t.onabort = () => rej(t.error);
  });
}

const dbGet = (s, k) => op(s, 'readonly', st => st.get(k));
const dbAll = s => op(s, 'readonly', st => st.getAll());
const dbByIndex = (s, i, v) => op(s, 'readonly', st => st.index(i).getAll(v));
const dbPut = (s, o) => op(s, 'readwrite', st => st.put(o));
const dbDel = (s, k) => op(s, 'readwrite', st => st.delete(k));
