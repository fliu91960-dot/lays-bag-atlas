/* Public demo: the catalogue ships with the site; each visitor keeps their own browser data. */
(function () {
  'use strict';
  let database, identity, preview, shipped;
  const C = window.AtlasCore;
  const updates = typeof BroadcastChannel === 'function' ? new BroadcastChannel('chips-atlas-public-v1') : null;
  function visitorId(saved) {
    const valid = id => /^local-[a-f0-9]{24}$/.test(id || '');
    let remembered;
    try { remembered = localStorage.getItem('chips-atlas-visitor-v1'); } catch (_) {}
    if (valid(remembered)) return remembered;
    const id = valid(saved?.currentUserId) ? saved.currentUserId :
      'local-' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2,'0')).join('');
    try { localStorage.setItem('chips-atlas-visitor-v1',id); } catch (_) {}
    return id;
  }
  function bind(saved) {
    const value = !saved || saved.fixtureRevision < shipped.fixtureRevision || !saved.fixtureRevision
      ? C.migrateState(saved || shipped) : saved;
    const user = C.user(value);
    if (value.identityRevision && user?.id === identity && user.showcaseRevision && value.users.every(u=>u.role === 'user')) return value;
    return C.bindIdentity(value,{id:identity, role:'user'},{seedExamples:false});
  }
  function read() {
    if (preview) return Promise.resolve(preview);
    return new Promise((resolve,reject) => {
      const request = database.transaction('state','readonly').objectStore('state').get('root');
      request.onsuccess = () => { try { resolve(bind(request.result)); } catch (e) { reject(e); } };
      request.onerror = () => reject(request.error);
    });
  }
  function mutate(transform) {
    if (preview) return Promise.reject(new Error('浏览器未开放存储，允许本站保存数据后即可收藏'));
    return new Promise((resolve,reject) => {
      const transaction = database.transaction('state','readwrite'), store = transaction.objectStore('state');
      const request = store.get('root'); let next, failure, changed = false;
      request.onsuccess = () => {
        try {
          // A first visit and a concurrent tab choose their identity in the same serialized transaction.
          identity ||= visitorId(request.result);
          next = bind(transform(bind(request.result)));
          changed = next !== request.result;
          if (changed) store.put(next,'root');
        } catch (e) { failure = e; transaction.abort(); }
      };
      transaction.oncomplete = () => { if (changed) updates?.postMessage('updated'); resolve(next); };
      transaction.onabort = transaction.onerror = () => reject(failure || new Error('保存失败，请检查浏览器的存储空间'));
    });
  }
  async function openStorage() {
    await new Promise((resolve,reject) => {
      const request = indexedDB.open('chips-atlas-public-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onblocked = () => reject(new Error('浏览器暂时无法打开收藏存储'));
      request.onsuccess = () => { database = request.result; database.onversionchange = () => database.close(); resolve(); };
      request.onerror = () => reject(new Error('请允许浏览器保存收藏数据后重试'));
    });
  }
  async function initialize() {
    shipped = C.initialState();
    try { await openStorage(); } catch (_) {
      // A visitor can still browse the shipped atlas when browser storage is disabled.
      preview = {...shipped,favorites:[]};
      return preview;
    }
    // The release builds both core.js and the public JSON export from this same fixture.
    const catalogue = C.catalog(shipped);
    const ids = new Set(catalogue.map(c=>c.id));
    try { return await mutate(value => {
      if (value.fixtureRevision > shipped.fixtureRevision) return value;
      const retired = value.chips.filter(c=>!ids.has(c.id));
      if (retired.every(c=>c.active === false && c.imagePending && c.coverImage === 'assets/unknown.png' && !c.backImage) &&
          JSON.stringify(C.catalog(value)) === JSON.stringify(catalogue)) return value;
      const archived = retired.map(c=>({...c,active:false,imagePending:true,coverImage:'assets/unknown.png',backImage:''}));
      return C.validateState({...value,chips:catalogue.concat(archived)});
    }); } catch (_) {
      // A full or unavailable database can reject writes even after opening successfully.
      try { preview = await read(); }
      catch (_) { preview = {...shipped,favorites:[]}; }
      return preview;
    }
  }
  window.AtlasRepository = {publicMode:true,get readOnly(){return Boolean(preview);},initialize,read,mutate,onExternalChange:callback => { if (updates) updates.onmessage = callback; }};
})();
