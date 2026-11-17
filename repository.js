/* Public demo: the catalogue ships with the site; each visitor keeps their own browser data. */
(function () {
  'use strict';
  let database, identity;
  const C = window.AtlasCore;
  const updates = typeof BroadcastChannel === 'function' ? new BroadcastChannel('chips-atlas-public-v1') : null;
  function bind(value) { return C.bindIdentity(C.migrateState(value || C.initialState()), {id:identity,role:'user'}); }
  function read() {
    return new Promise((resolve,reject) => {
      const request = database.transaction('state','readonly').objectStore('state').get('root');
      request.onsuccess = () => resolve(bind(request.result)); request.onerror = () => reject(request.error);
    });
  }
  function mutate(transform) {
    return new Promise((resolve,reject) => {
      const transaction = database.transaction('state','readwrite'), store = transaction.objectStore('state');
      const request = store.get('root'); let next, failure;
      request.onsuccess = () => { try { next = bind(transform(bind(request.result))); store.put(next,'root'); } catch (e) { failure = e; transaction.abort(); } };
      transaction.oncomplete = () => { updates?.postMessage('updated'); resolve(next); };
      transaction.onabort = transaction.onerror = () => reject(failure || new Error('保存失败，请检查浏览器的存储空间'));
    });
  }
  async function initialize() {
    identity = localStorage.getItem('chips-atlas-visitor-v1');
    if (!/^local-[a-f0-9]{24}$/.test(identity || '')) {
      identity = 'local-' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2,'0')).join('');
      localStorage.setItem('chips-atlas-visitor-v1',identity);
    }
    await new Promise((resolve,reject) => {
      const request = indexedDB.open('chips-atlas-public-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => { database = request.result; database.onversionchange = () => database.close(); resolve(); };
      request.onerror = () => reject(new Error('请允许浏览器保存收藏数据后重试'));
    });
    let catalogue;
    if (location.protocol !== 'file:') {
      try {
        const response = await fetch('./catalogue.json', {cache:'no-store'});
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.products) && data.products.length && new Set(data.products.map(c=>c.id)).size === data.products.length) catalogue = data.products;
        }
      } catch (_) { /* Shipped catalogue remains available when the data file is unreachable. */ }
    }
    return mutate(value => {
      if (catalogue) {
        const ids = new Set(catalogue.map(c=>c.id));
        value.chips = C.clone(catalogue).concat(value.chips.filter(c=>!ids.has(c.id)));
      }
      return C.validateState(value);
    });
  }
  window.AtlasRepository = {publicMode:true,initialize,read,mutate,onExternalChange:callback => { if (updates) updates.onmessage = callback; }};
})();
