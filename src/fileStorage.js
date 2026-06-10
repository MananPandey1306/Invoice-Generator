// ── File System Access API helpers ───────────────────────────────

export const isFileSystemSupported = () =>
  typeof window.showOpenFilePicker === 'function' &&
  typeof window.showSaveFilePicker === 'function';

// ── IndexedDB: persist file handle across page refreshes ─────────

const IDB_NAME  = 'InvoiceForgeDB';
const IDB_STORE = 'handles';
const IDB_KEY   = 'active';

function openIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    r.onsuccess = e => res(e.target.result);
    r.onerror   = e => rej(e.target.error);
  });
}

export async function saveHandleToIDB(handle) {
  try {
    const db = await openIDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = res;
      tx.onerror    = e => rej(e.target.error);
    });
    db.close();
  } catch {}
}

export async function loadHandleFromIDB() {
  try {
    const db = await openIDB();
    const handle = await new Promise((res, rej) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = e => res(e.target.result || null);
      req.onerror   = e => rej(e.target.error);
    });
    db.close();
    return handle;
  } catch { return null; }
}

export async function clearHandleFromIDB() {
  try {
    const db = await openIDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = res;
      tx.onerror    = e => rej(e.target.error);
    });
    db.close();
  } catch {}
}

// ── Permission helpers ────────────────────────────────────────────

export async function requestPermission(handle) {
  try {
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return true;
    const req  = await handle.requestPermission({ mode: 'readwrite' });
    return req === 'granted';
  } catch { return false; }
}

// ── Read / Write ──────────────────────────────────────────────────

export async function writeToFile(handle, data) {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function readFromFile(handle) {
  const file = await handle.getFile();
  const text  = await file.text();
  return JSON.parse(text);
}

// ── Picker options ────────────────────────────────────────────────

export const OPEN_OPTS = {
  types: [{
    description: 'InvoiceForge Data File',
    accept: { 'application/json': ['.invoiceforge'] },
  }],
  multiple: false,
};

export const SAVE_OPTS = {
  types: [{
    description: 'InvoiceForge Data File',
    accept: { 'application/json': ['.invoiceforge'] },
  }],
  suggestedName: 'my-business.invoiceforge',
};

// ── Bundle all app state into one save payload ────────────────────

export function buildSavePayload(biz, invoice, invoiceNum, template) {
  return { version: 1, biz, draft: invoice, invoiceNum, template };
}
