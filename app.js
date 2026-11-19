/* Browser views and event binding. All business mutations live in core.js. */
(function () {
  'use strict';
  const C = window.AtlasCore, R = window.AtlasRepository;
  const root = document.getElementById('app');
  const PUBLIC = Boolean(R.publicMode);
  const paths = {
    bag:'M5 3h14l-1 4 1 14H5L6 7 5 3Zm1 4h12M8 11c2-2 6-2 8 0M9 16h6',
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    bookmark:'M6 3h12v18l-6-4-6 4V3Z', user:'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z', filter:'M4 7h16M7 12h10M10 17h4M8 4v6M16 9v6',
    plus:'M12 5v14M5 12h14', check:'m5 12 4 4L19 6', heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    arrow:'m9 5 7 7-7 7', back:'m15 5-7 7 7 7', close:'m6 6 12 12M6 18 18 6',
    upload:'M12 16V3m-5 5 5-5 5 5M4 14v6h16v-6', download:'M12 3v13m-5-5 5 5 5-5M4 15v6h16v-6',
    file:'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h5', settings:'M3 7h18M3 17h18M8 4v6M16 14v6',
    shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 10 3 3 5-6',
    info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    zoom:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5', image:'M3 3h18v18H3zM3 16l5-5 5 5 3-3 5 5M16 7h.01',
    refresh:'M3 4v6h6M21 20v-6h-6M4 10a8 8 0 0 1 14-5l3 3M3 16l3 3a8 8 0 0 0 14-5',
    edit:'m15 4 5 5M3 21l5-1L21 7l-5-5L3 15v6Z'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (paths[name] || paths.bag) + '"></path></svg>'; }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const image = value => {
    const src = C.validImage(value) ? value : 'assets/unknown.png';
    return window.AtlasImages?.[src] || src;
  };
  const safeSource = value => { try { const u = new URL(value); return u.protocol === 'https:' && ['www.lays.com.cn','www.pepsico.com.cn','m.thepaper.cn','www.dealmoon.com','marketfoodasia.com','tao.hooos.com','www.foodaily.com','foodaily.com','post.smzdm.com','k.sina.cn','k.sina.com.cn','www.sohu.com','www.sayweee.com','wiki.smzdm.com','ma.gfsuper.com','www.digitaling.com','socialbeta.com','mightydepot.com','www.topfoo.com','www.ganhuoku.cn','www.foodtalks.cn','www.tentopsnacks.com','exoticers.com','americanuncleshop.fr','exosweet.com','www.foodinc.com.cn','www.smzdm.com','www.xinyingyang.com','candyfunhouse.com','shopee.ph','www.alibaba.com','www.umall.com.au','www.charmfoods.com.tw','www.yami.com','xinwen.bjd.com.cn','24h.pchome.com.tw','afamily.vn','shop.tiktok.com','laysaroundtheworld.com','shopee.tw','ufood.com.hk','beautycornerca.com','biggo.com.tw','online.citysuper.com.hk','style.udn.com','www.cosmopolitan.com','www.weee.com','www.wellcome.com.hk','fuji-san.ru','eg.alpremium.ca','exoticsnacks.com','online.carrefour.com.tw','tw.buy.yahoo.com','www.rakuten.com.tw','www.snaxo.ca','eorder.soda-mall.com','exoticsnackguysonline.com','munchaddict.com','shop.app','www.hktvmall.com','www.mintel.com','www.sina.cn','www.scrummy.pl','www.exodrinks.fr','www.waitrose.ae','sugarrushshop.co.uk','www.pns.hk','www.sinosplice.com','ep.shxwcb.com','www.noveltybee-store.com','onelife.tw','m.bjnews.com.cn','pangjing.cn','www.4anet.com','www.cbndata.com','static.zhoudaosh.com','www.foodszs.com','www.mobilewiz.com.tw','news.sina.com.cn','www.dadamokujin.com','beautycornerca.com','www.yilantop.com','www.pinterest.com'].includes(u.hostname) && !u.username && !u.password; } catch (_) { return false; } };
  const date = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN'); };
  const statusName = { pending:'待审核', approved:'已收录', rejected:'未通过' };
  let state, route = { name:'catalog' }, trail = [], sheet = null, draft = null, busy = false;
  const collectionOptions = [['missing','未拥有'],['owned','已拥有'],['wanted','想要收藏']];
  const imageOptions = [['ready','已有封面'],['pending','封面待补']];
  const orderOptions = [['year-desc','包装年份从新到旧'],['year-asc','包装年份从旧到新']];
  const filterKeys = ['market','year','series','packagingForm','specification','tag','releaseBatch','collection','imageStatus','order'];
  const defaultFilters = () => ({search:'', ...Object.fromEntries(filterKeys.map(key=>[key,'']))});
  let filters = defaultFilters(), favoriteTab = 'owned', favoriteSearch = '', adminTab = 'pending', historyTab = '';
  let side = 'coverImage', toastTimer;
  function toast(message) {
    root.querySelector('.toast')?.remove();
    const element = document.createElement('div'); element.className = 'toast'; element.setAttribute('role','status'); element.textContent = message;
    root.appendChild(element); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.remove(), 2600);
  }
  function button(text, action, cls, attrs) { return '<button type="button" class="' + (cls === undefined ? 'btn' : cls) + '" data-action="' + action + '" ' + (attrs || '') + '>' + text + '</button>'; }
  function header(title, end) { return '<header class="sub-header">' + button(icon('back'), 'back', 'back', 'aria-label="返回"') + '<h2>' + esc(title) + '</h2>' + (end ? '<div class="header-end">' + end + '</div>' : '') + '</header>'; }
  function navigation() { return '<nav class="bottom-nav" aria-label="主要导航">' + [['catalog','grid','图鉴'],['favorites','bookmark','我的收藏'],['profile','user','我的']].map(([name, i, text]) => button('<span class="nav-icon">' + icon(i) + '</span><span>' + text + '</span>', 'nav', route.name === name ? 'active' : '', 'data-name="' + name + '" aria-current="' + (route.name === name ? 'page' : 'false') + '"')).join('') + '</nav>'; }
  function empty(title, message, action) { return '<div class="empty">' + icon('bag') + '<strong>' + esc(title) + '</strong><p>' + esc(message) + '</p>' + (action || '') + '</div>'; }
  function tags(item, onCard = false, showBatch = true) {
    const batch = item.releaseBatch;
    const names = item.tags.filter(tag =>
      !batch?.includes(tag) && !(tag === '联名' && batch?.includes('聯名')) &&
      !(tag === '限定' && item.tags.includes('城市限定')));
    const style = onCard ? 'edition' : 'tag';
    const badge = batch && showBatch ? '<span class="' + style + (onCard ? ' edition-batch' : '') + '">' + esc(batch) + '</span>' : '';
    if (!batch && names.length === 0 && !onCard) return '<span class="tag">常规</span>';
    return badge + names.map(tag => '<span class="' + style + '">' + esc(tag) + '</span>').join('');
  }
  function yearLabel(item) {
    if (item.year) return '包装：' + item.year + '年';
    const year = item.firstSeenYear || item.flavorDocumentedYear;
    return year ? '口味首见：' + year + '年' + (item.firstSeenProvisional ? '（待核）' : '') : '年份待核实';
  }
  function card(item, showBatch) {
    const status = C.favoriteStatus(state, item.id);
    return '<button type="button" class="chip-card" data-action="detail" data-id="' + esc(item.id) + '" aria-label="查看' + esc(item.name) + '"><div class="chip-art ' + (item.sourceKind === 'official' ? 'official' : !item.isDemo ? 'uploaded' : '') + '">' + (item.imagePending ? '<div class="image-pending">' + icon('bag') + '<span>图片待补</span></div>' : '<img loading="lazy" src="' + esc(image(item.coverImage)) + '" alt="' + esc(item.name) + '正面">') + '' + (status ? '<span class="owned-badge ' + status + '">' + icon(status === 'owned' ? 'check' : 'heart') + (status === 'owned' ? '已拥有' : '想要') + '</span>' : '') + (item.active === false ? '<span class="owned-badge">已下架</span>' : '') + '</div><h3>' + esc(item.name) + '</h3><div class="chip-meta"><span>' + esc(C.packageWeights(item).join(' / ') || '规格待核实') + '</span>' + '<span>·</span><span>' + esc(item.market) + '</span></div><p class="chip-year">' + esc(yearLabel(item)) + '</p><div class="tag-row">' + tags(item,true,showBatch) + '</div></button>';
  }
  function filterLabel(key, value) {
    if (key === 'year' && value === 'unknown') return '包装年份待核实';
    const options = {collection:collectionOptions,imageStatus:imageOptions,order:orderOptions}[key];
    return options?.find(([id])=>id === value)?.[1] || value;
  }
  function cardGrid(items, showBatch = true) { return '<div class="grid">' + items.map(item=>card(item,showBatch)).join('') + '</div>'; }
  function yearGroups(items, order, markup, unit = '款') {
    return C.packagingYearGroups(items,order).map(([year,group]) =>
      '<section class="year-group" data-year="' + (year || 'unknown') + '"><h2><span>' +
      (year ? year + ' 年' : '包装年份待核实') + '</span><small>' + group.length + ' ' + unit + '</small></h2>' + markup(group) + '</section>').join('');
  }
  function catalogResults() {
    const items = C.homeCatalog(state, filters);
    const selected = filterKeys.filter(key => filters[key]);
    const summary = selected.map(key => {
      const value = filterLabel(key,filters[key]);
      return button(esc(value) + ' ×', 'remove-filter', '', 'data-key="' + key + '" aria-label="移除筛选 ' + esc(value) + '"');
    }).join('');
    const actions = button('发行批次 ' + icon('arrow'),'batch-directory','text-btn') + (!PUBLIC ? button(icon('plus') + '补充图鉴','submit','text-btn') : '');
    const heading = '<div class="catalog-heading"><strong>' + (selected.some(key=>key !== 'order') || filters.search ? '筛选结果' : '全部图鉴') + ' <span class="muted">' + items.length + '</span></strong><div class="catalog-tools">' + actions + '</div></div>';
    const results = items.length ? (filters.order ? yearGroups(items,filters.order,cardGrid) : cardGrid(items)) :
      empty('没有找到这款包装','试试其他口味，或清除筛选条件。',button('查看全部图鉴','clear-all','btn secondary'));
    return (summary ? '<div class="filter-summary">' + summary + '</div>' : '') + heading + results;
  }
  function catalogMarkup() {
    const count = filterKeys.filter(key => filters[key]).length;
    const filter = button(icon('filter') + '筛选' + (count ? '<span class="filter-count">' + count + '</span>' : ''), 'filters', 'filter-trigger' + (count ? ' selected' : ''), 'aria-label="筛选图鉴"');
    return '<main class="page" data-screen-label="图鉴"><header class="topbar"><div class="brand"><div class="brand-icon">' + icon('bag') + '</div><h1>乐事薯片袋图鉴</h1></div></header><div class="search-row"><label class="search">' + icon('search') + '<input id="catalog-search" type="search" maxlength="60" placeholder="搜索名称、口味或系列" aria-label="搜索包装名称、口味或系列" value="' + esc(filters.search) + '"></label>' + filter + '</div><div id="catalog-results">' + catalogResults() + '</div></main>' + navigation();
  }
  function searchBox(id,label,placeholder,value) {
    return '<div class="search-row"><label class="search">' + icon('search') + '<input id="' + id + '" type="search" maxlength="60" aria-label="' + label + '" placeholder="' +
      placeholder + '" value="' + esc(value || '') + '"></label></div>';
  }
  function favoriteResults() {
    const items = C.favorites(state,favoriteTab,{query:favoriteSearch,recent:true});
    if (!items.length && favoriteSearch.trim()) return empty('这页收藏没有匹配的包装','',button('清除收藏搜索','clear-favorite-search','btn secondary'));
    return items.length ? cardGrid(items) : empty(favoriteTab === 'owned' ? '还没有已拥有的包装' : '还没有想要收藏的包装','',
      button('浏览图鉴','nav','btn','data-name="catalog"'));
  }
  function favoritesMarkup() {
    const owned = C.favorites(state,'owned').length, wanted = C.favorites(state,'wanted').length;
    const tabs = [['owned','已拥有',owned],['wanted','想要收藏',wanted]].map(([id,name,count]) =>
      button(name + ' <span class="muted" data-favorite-count="' + id + '">' + count + '</span>','favorite-tab',favoriteTab === id ? 'active' : '',
        'data-tab="' + id + '" aria-pressed="' + (favoriteTab === id) + '"')).join('');
    return '<main class="page" data-screen-label="我的收藏"><header class="topbar"><h1>我的收藏</h1></header><div class="tabs-wide">' + tabs + '</div>' +
      searchBox('favorite-search','搜索我的收藏','搜收藏中的名称、口味或克重',favoriteSearch) +
      '<div id="favorite-results" class="section-results">' + favoriteResults() + '</div></main>' + navigation();
  }
  function profileMarkup() {
    const user = C.user(state), submissions = C.ownSubmissions(state);
    const menu = (i, name, action, extra = '') => button(icon(i) + '<span>' + name + '</span><span class="right">' + extra + '</span>' + icon('arrow'), action, 'menu-item');
    const stats = [['owned','已拥有',C.favorites(state,'owned').length],['wanted','想要收藏',C.favorites(state,'wanted').length]];
    const countButtons = stats.map(([id,name,count]) => button('<strong>' + count + '</strong><small>' + name + '</small>', 'stat', '', 'data-name="' + id + '"')).join('');
    const submissionsMenu = PUBLIC ? '' : menu('file','投稿记录','history',String(submissions.length));
    const adminMenu = !PUBLIC && user.role !== 'user' ? menu('shield','管理图鉴与投稿','admin',state.submissions.filter(s => s.status === 'pending').length + ' 条待审') : '';
    return '<main class="page" data-screen-label="我的"><header class="topbar"><h1>我的</h1></header><div class="profile-block"><div class="avatar">' + icon(user.role === 'owner' ? 'shield' : 'user') + '</div><div><h2>' + esc(user.name) + '</h2><p>' + (adminMenu ? '本地管理员' : '收藏仅自己可见') + '</p></div></div><div class="stats">' + countButtons + '</div><div class="menu">' + submissionsMenu + adminMenu + menu('info','关于图鉴','about') + '</div><p class="local-note">' + (R.readOnly ? '浏览器已限制存储，开放存储后即可收藏。' : '收藏保存在当前浏览器。') + '</p></main>' + navigation();
  }
  function historyMarkupFor(chip) {
    const link = (url,text) => safeSource(url) ? ' <a target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + text + ' ↗</a>' : '';
    const batchSource = link(chip.releaseBatchSourceUrl,'批次来源');
    return (batchSource ? '<p class="source-note">' + batchSource + '</p>' : '') + (chip.timelineSource ? '<p class="description">时间线参考：' + esc(chip.timelineRecordId) + ' · ' + esc(chip.timelineSource) + '。' + esc(chip.timelineEvidence) + '。' + esc(chip.timelineNote) + '</p>' : '') + (chip.yearEvidence ? '<p class="description">' + esc(chip.yearEvidence) + (chip.yearEvidenceUrl === chip.releaseBatchSourceUrl ? '' : link(chip.yearEvidenceUrl,'年份依据')) + '</p>' : '') + (chip.historyNote ? '<p class="description">' + esc(chip.historyNote) + link(chip.historyUrl,'历史资料') + '</p>' : '');
  }
  function detailMarkup() {
    const chip = state.chips.find(c => c.id === route.id);
    if (route.fromLink && (!chip || chip.active === false)) {
      const message = chip ? '这款包装已下架' : '找不到此包装';
      return '<main class="page">' + header('图鉴详情') + empty(message,'返回图鉴可继续查看其他包装。',button('返回图鉴','back','btn')) + '</main>';
    }
    if (!chip) return '<main class="page">' + header('图鉴详情') + empty('图鉴不存在', '返回列表后再试。') + '</main>';
    const status = C.favoriteStatus(state,chip.id);
    const edit = !PUBLIC && C.user(state).role !== 'user' ? button(icon('edit'),'edit','back','aria-label="编辑图鉴" data-id="' + esc(chip.id) + '"')
      : PUBLIC && chip.active !== false && location.protocol !== 'file:' ? button('复制单品链接','share-chip','btn secondary') : '';
    const pending = side === 'coverImage' && chip.imagePending;
    const picture = pending ? '<div class="image-pending">' + icon('bag') + '<span>正面图片待补</span></div>' : '<img src="' + esc(image(chip[side] || chip.coverImage)) + '" alt="' + esc(chip.name) + (side === 'backImage' ? '背面' : '正面') + '">' + button(icon('zoom'),'zoom','zoom','aria-label="放大包装图片"');
    const switcher = chip.backImage ? '<div class="image-switch">' + [['coverImage','正面'],['backImage','背面']].map(([key,title]) => button(title,'side',side === key ? 'active' : '', 'data-side="' + key + '" aria-pressed="' + (side === key) + '"')).join('') + '</div>' : '';
    const seen = chip.firstSeenYear || chip.flavorDocumentedYear;
    const facts = [['发行市场',chip.market],['包装年份',chip.year ? chip.year + '年' : '待核实'],['包装形态',chip.packagingForm]];
    if (chip.imageSpecification && chip.imageSpecification !== '待核实') facts.push(['图示规格',chip.imageSpecification]);
    if (chip.specification !== chip.imageSpecification && chip.specification && chip.specification !== '待核实') facts.push(['已知规格',chip.specification]);
    if (chip.series) facts.push(['产品系列',chip.series]);
    if (chip.flavor && chip.flavor !== chip.name) facts.push(['口味',chip.flavor]);
    if (seen) facts.push(['口味首见',seen + '年' + (chip.firstSeenProvisional ? '（待核）' : '')]);
    const rows = facts.map(([label,value]) => '<div><dt>' + label + '</dt><dd>' + esc(value) + '</dd></div>').join('');
    const imageSource = safeSource(chip.sourceUrl) ? '<p class="source-note">图片来源：<a target="_blank" rel="noopener noreferrer" href="' + esc(chip.sourceUrl) + '">' + esc(chip.sourceLabel || '素材来源') + ' ↗</a></p>' : '';
    const contribute = !PUBLIC && chip.active !== false ? button(icon('upload') + '补充包装图片','contribute','btn secondary full','data-id="' + esc(chip.id) + '"') : '';
    const batchLink = chip.releaseBatch ? button('查看同批包装 ' + icon('arrow'),'open-batch','btn secondary full') : '';
    const versions = C.relatedPackaging(state,chip.id);
    const cue = chip.id === 'wasabi-jm' ? '<p class="description">袋面口号「芥么离谱」可用于辨认这版夏季限定。</p>' : '';
    const related = versions.length ? '<section class="related-packaging"><h2>同口味其他包装</h2>' + cue + versions.map(c=>packageOption(c,'detail')).join('') + '</section>' : '';
    const actions = chip.active === false
      ? (status ? button('取消收藏','favorite','btn secondary full','data-status=""') : '<p class="form-hint">这款图鉴已下架。</p>')
      : button(icon('check') + (status === 'owned' ? '已拥有' : '标记拥有'),'favorite','btn ' + (status === 'owned' ? 'on-owned' : 'secondary'),'data-status="owned" aria-pressed="' + (status === 'owned') + '"')
        + button(icon('heart') + (status === 'wanted' ? '已加入心愿' : '想要收藏'),'favorite','btn ' + (status === 'wanted' ? 'on-wanted' : ''),'data-status="wanted" aria-pressed="' + (status === 'wanted') + '"');
    return '<main class="page" data-screen-label="图鉴详情">' + header('图鉴详情',edit) + '<div class="detail-layout"><div><div class="detail-hero">' + picture + '</div>' + switcher + '</div><article class="detail-info"><h1>' + esc(chip.name) + '</h1><div class="tag-row">' + tags(chip) + (chip.active === false ? '<span class="tag">已下架</span>' : '') + '</div>' + batchLink + '<dl class="detail-fields">' + rows + '</dl>' + related + (chip.description ? '<p class="description">' + esc(chip.description) + '</p>' : '') + imageSource + historyMarkupFor(chip) + contribute + '</article></div></main><div class="sticky-actions"><div class="action-row">' + actions + '</div></div>';
  }
  function packageOption(chip, action, selected = false) {
    const specs = [chip.market,chip.packagingForm,chip.series,C.packageWeights(chip).join(' / ')].filter(Boolean);
    if (chip.year) specs.push(chip.year + '年');
    return button('<img src="' + esc(image(chip.coverImage)) + '" alt="" loading="lazy"><span><strong>' + esc(chip.name) + '</strong><small>' + esc(specs.join(' · ')) + '</small></span>',
      action,'package-option' + (selected ? ' selected' : ''),'data-id="' + esc(chip.id) + '"' + (action === 'choose-duplicate' ? ' aria-pressed="' + selected + '"' : ''));
  }
  function batchMarkup() {
    const batch = C.releaseBatches(state).find(group=>group.id === route.id);
    if (!batch) return '<main class="page">' + header('发行批次') +
      empty('找不到此批次','',button('返回图鉴','back','btn')) + '</main>';
    const cards = batch.cards;
    const owned = new Set(C.favorites(state,'owned').map(chip=>chip.id));
    const count = cards.filter(chip=>owned.has(chip.id)).length;
    const visible = route.onlyMissing ? cards.filter(chip=>!owned.has(chip.id)) : cards;
    const progress = cards.length ? '<p class="batch-progress">已拥有 <strong>' + count + '/' + cards.length + '</strong> 款 · 本图鉴收录 ' + cards.length + ' 款</p>' : '';
    const share = PUBLIC && location.protocol !== 'file:' ? button('复制批次链接','share-batch','btn secondary') : '';
    const source = safeSource(batch.sourceUrl) ? '<p class="batch-source source-note"><a href="' + esc(batch.sourceUrl) + '" target="_blank" rel="noopener noreferrer">批次资料 ↗</a></p>' : '';
    return '<main class="page" data-screen-label="发行批次">' + header(batch.name,share) + '<div class="batch-controls">' + progress +
      button('只看未拥有','batch-missing','btn secondary','aria-pressed="' + !!route.onlyMissing + '"') + '</div>' +
      (visible.length ? cardGrid(visible,false) : empty('已拥有本图鉴收录的全部款','')) + source + '</main>';
  }
  function batchDirectoryResults() {
    const batches = C.releaseBatches(state,route.query);
    if (!batches.length) return empty('没有匹配的发行批次','',button('清除批次搜索','clear-batch-search','btn secondary'));
    const owned = new Set(C.favorites(state,'owned').map(chip=>chip.id));
    return yearGroups(batches,'year-desc',group=>'<div class="batch-index">' + group.map(batch=>{
      const cover = batch.cards.find(C.hasFrontImage);
      const progress = batch.cards.filter(chip=>owned.has(chip.id)).length + '/' + batch.cards.length + ' 款';
      const art = cover ? '<img src="' + esc(image(cover.coverImage)) + '" alt="" loading="lazy">' : '<span class="batch-cover-empty">' + icon('bag') + '</span>';
      return button(art + '<span><strong>' + esc(batch.name) + '</strong><small>已拥有 ' + progress + '</small></span>' + icon('arrow'),
        'open-batch','package-option batch-index-item','data-id="' + esc(batch.id) + '"');
    }).join('') + '</div>','批');
  }
  function batchDirectoryMarkup() {
    return '<main class="page" data-screen-label="批次索引">' + header('发行批次') +
      searchBox('batch-search','搜索发行批次','搜批次名称、口味或年份',route.query) +
      '<div id="batch-directory-results" class="section-results">' + batchDirectoryResults() + '</div></main>';
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (String(selected) === String(value) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function originalPictures(record) {
    return [['coverImage','正面'],['backImage','背面']].filter(([key])=>record[key])
      .map(([key,label])=>'<img src="' + esc(image(record[key])) + '" alt="投稿' + label + '原图">').join('');
  }
  function reviewImageLabel(key, draft) {
    if (route.name !== 'review' || !draft.baseline) return '点击替换';
    return draft[key] === draft.baseline[key] ? '沿用原图' : '本次替换';
  }
  function duplicateResults(data) {
    const query = (data.duplicateSearch ?? (data.name || data.flavor)).trim();
    const cards = query ? C.catalog(state,{search:query}).slice(0,6) : [];
    return cards.map(c=>packageOption(c,'choose-duplicate',c.id === data.duplicateId)).join('') ||
      (query ? '<p class="form-hint">没有找到相近包装</p>' : '');
  }
  function duplicatePicker(data, review) {
    const chosen = review && state.chips.find(c=>c.id === data.duplicateId);
    const selection = chosen ? '<p class="form-hint">已关联 ' + esc(chosen.name + ' · ' + chosen.market + ' · ' + chosen.packagingForm + ' · ' + (chosen.series || '')) +
      ' ' + button('取消关联','clear-duplicate','text-btn') + '</p>' : '';
    return '<section class="duplicate-picker"><label class="field"><span>' + (review ? '关联已有图鉴（选填）' : '查找已有包装') +
      '</span><input type="search" id="duplicate-search" value="' + esc(data.duplicateSearch || '') + '" placeholder="名称、口味、地区或包装形态"></label>' +
      (review ? '' : '<p class="form-hint">点选相同包装可给原卡补图，也可继续提交新版。</p>') + selection +
      '<div id="duplicate-results">' + duplicateResults(data) + '</div></section>';
  }
  function fieldsMarkup(data) {
    const removedBack = route.name === 'review' && data.baseline?.backImage && !data.backImage;
    const upload = (key,label) => '<label class="upload-tile">' + (data[key] ? '<img src="' + esc(image(data[key])) + '" alt="' + label + '预览"><span class="upload-caption">' + label + ' · ' + reviewImageLabel(key,data) + '</span>' : icon('plus') + '<span>' + label + (key === 'coverImage' && !(route.name === 'submit' && C.hasFrontImage(data.baseline)) ? '图片' : '图片（选填）') + '</span>') + '<input type="file" accept="image/jpeg,image/png,image/webp" data-image="' + key + '" aria-label="上传' + label + '图片"></label>';
    return '<div class="upload-pair">' + upload('coverImage','正面') + upload('backImage','背面') + '</div><p class="form-hint">支持 JPG、PNG、WebP，每张不超过 5MB。' + (route.name === 'submit' && data.coverImage ? button('撤下已选正面图','remove-front','text-btn') : '') + (data.backImage ? button(route.name === 'submit' ? '撤下已选背面图' : '移除背面图','remove-back','text-btn') : removedBack ? ' 本次移除原背面图。' : '') + '</p><label class="field"><span>包装名称</span><input name="name" required maxlength="60" placeholder="例如：原味 · 周年纪念包装" value="' + esc(data.name) + '"></label>' + (route.name === 'submit' && !data.targetChipId ? duplicatePicker(data,false) : '') + '<div class="field-pair"><label class="field"><span>发行市场</span><select name="market">' + C.MARKETS.map(x => option(x,x,data.market)).join('') + '</select></label><label class="field"><span>发行年份<small>未知可留空</small></span><input name="year" inputmode="numeric" maxlength="4" placeholder="例如 2026" value="' + esc(data.year ?? '') + '"></label></div><label class="field"><span>包装形态</span><select name="packagingForm">' + C.FORMS.map(x => option(x,x,data.packagingForm)).join('') + '</select></label><span class="field-title">特殊标签<small class="muted">（可多选）</small></span><div class="checks">' + C.TAGS.map(t => '<label class="check"><input type="checkbox" name="tags" value="' + t + '"' + (data.tags.includes(t) ? ' checked' : '') + '><span>' + t + '</span></label>').join('') + '</div><div class="field-pair"><label class="field"><span>口味<small>选填</small></span><input name="flavor" maxlength="60" value="' + esc(data.flavor) + '" placeholder="例如 原味"></label><label class="field"><span>规格<small>选填</small></span><input name="specification" maxlength="60" value="' + esc(data.specification) + '" placeholder="例如 70g"></label></div><label class="field"><span>补充说明<small>选填</small></span><textarea name="description" maxlength="600" placeholder="包装差异、系列信息，或需要管理员确认的地方…">' + esc(data.description) + '</textarea></label>';
  }
  function proposalComparison(record, target) {
    if (!target || !record?.proposedFields?.length) return '';
    const display = value => (Array.isArray(value) ? value.join('、') : value) || '未填写';
    const rows = record.proposedFields.filter(key=>Object.hasOwn(C.FIELD_NAMES,key) && display(target[key]) !== display(record[key]))
      .map(key=>'<tr><th scope="row">' + C.FIELD_NAMES[key] + '</th><td>' + esc(display(target[key])) + '</td><td>' + esc(display(record[key])) + '</td></tr>');
    return rows.length ? '<details class="review-original"><summary>核对投稿建议（' + rows.length + ' 项）</summary><table class="review-diff"><thead><tr><th>字段</th><th>原卡资料</th><th>投稿建议</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></details>' : '';
  }
  function editorMarkup() {
    const review = route.name === 'review', editing = route.name === 'edit';
    const record = review ? state.submissions.find(s => s.id === route.id) : null;
    if (!draft) prepareDraft();
    const title = review ? '整理并审核' : editing ? (route.id ? '编辑图鉴' : '新增图鉴') : '补充图鉴';
    const undo = draft.beforeLink ? button('改为提交新版','unlink-target','text-btn') : '';
    const target = draft.targetChipId ? '<div class="page-intro">正在为已有图鉴补图：' + esc(draft.baseline?.name || draft.name) + undo + '</div>' : '';
    const originals = record ? '<details class="review-original"><summary>查看投稿原图与资料</summary><p>' +
      esc([record.name,record.market,record.year ? record.year + '年' : '年份未知',record.packagingForm,record.specification,record.flavor,...record.tags].filter(Boolean).join(' · ')) +
      '</p>' + originalPictures(record) + '<p>' + esc(record.description) + '</p></details>' : '';
    const reviewFields = review ? '<label class="field"><span>审核说明<small>驳回时必填</small></span><textarea name="reviewRemark" maxlength="300" placeholder="例如：图鉴已收录，或图片需要重新拍摄">' + esc(draft.reviewRemark || '') + '</textarea></label>' +
      '<div class="reason-buttons">' + ['图片不清晰，请重新拍摄','该包装已收录'].map(v => button(v,'reason','','data-reason="' + esc(v) + '"')).join('') + '</div>' + duplicatePicker(draft,true) : '';
    const actions = review ? '<div class="action-row">' + button('驳回投稿','reject','btn secondary') + '<button type="submit" class="btn">确认收录</button></div>' :
      '<button type="submit" class="btn full">' + (editing ? '保存图鉴' : '提交审核') + '</button>';
    return '<main class="page" data-screen-label="' + title + '">' + header(title) + target + originals + proposalComparison(record,draft.baseline) +
      '<form id="editor-form" class="form-content" novalidate>' + fieldsMarkup(draft) + reviewFields + '<p class="form-error" id="form-error" role="alert"></p>' + actions + '</form></main>';
  }
  function recordMarkup(record, admin) {
    const action = admin && record.status === 'pending' ? 'review' : 'submission-detail';
    return '<button type="button" class="record" data-action="' + action + '" data-id="' + esc(record.id) + '"><img class="record-thumb" src="' + esc(image(record.coverImage || record.backImage)) + '" alt="' + esc(record.name) + '"><div class="record-main"><h3>' + esc(record.name) + '</h3><p>' + esc(record.market) + ' · ' + (record.year || '年份未知') + '<br>' + date(record.createTime) + (admin ? ' · ' + esc(state.users.find(u => u.id === record.userId)?.name || '收藏者') : '') + '</p>' + (record.reviewRemark ? '<p class="record-note">' + esc(record.reviewRemark) + '</p>' : '') + '<div class="record-footer"><span class="pill ' + record.status + '">' + statusName[record.status] + '</span>' + (record.chipId ? '<span class="muted">查看对应图鉴 ›</span>' : '') + '</div></div>' + icon('arrow') + '</button>';
  }
  function historyMarkup() {
    const items = C.ownSubmissions(state).filter(s => !historyTab || s.status === historyTab);
    return '<main class="page" data-screen-label="投稿记录">' + header('我的投稿') + '<div class="tabs-wide">' + [['','全部'],['pending','待审核'],['approved','已收录'],['rejected','未通过']].map(([id,name]) => button(name,'history-tab',historyTab === id ? 'active' : '', 'data-tab="' + id + '"')).join('') + '</div>' + (items.length ? '<div class="record-list">' + items.map(s => recordMarkup(s,false)).join('') + '</div>' : empty('这里还没有投稿', '发现没收录的包装时，来补充一款。', button('补充图鉴','submit','btn'))) + '</main>';
  }
  function adminMarkup() {
    if (C.user(state).role === 'user') return '<main class="page">' + header('管理图鉴') + empty('需要管理员身份','当前账号没有管理权限。') + '</main>';
    const items = state.submissions.filter(s => adminTab === 'all' || s.status === adminTab);
    return '<main class="page" data-screen-label="管理员">' + header('管理图鉴与投稿',button(icon('plus'),'new-chip','back','aria-label="新增图鉴"')) + '<div class="tabs-wide">' + [['pending','待审核'],['all','全部投稿'],['chips','图鉴管理']].map(([id,name]) => button(name + (id === 'pending' ? ' ' + state.submissions.filter(s => s.status === 'pending').length : ''),'admin-tab',adminTab === id ? 'active' : '', 'data-tab="' + id + '"')).join('') + '</div>' + (adminTab === 'chips' ? '<div class="section-row"><h3>共 ' + state.chips.length + ' 款</h3>' + button(icon('plus') + '新增图鉴','new-chip','text-btn') + '</div><div class="record-list">' + state.chips.map(c => '<div class="record"><img class="record-thumb" src="' + esc(image(c.coverImage)) + '" alt="' + esc(c.name) + '"><div class="record-main"><h3>' + esc(c.name) + '</h3><p>' + esc(c.market) + ' · ' + (c.year || '年份未知') + (c.active === false ? ' · 已下架' : '') + '</p><div class="record-footer">' + button('编辑','edit','text-btn','data-id="' + esc(c.id) + '"') + button(c.active === false ? '重新上架' : '下架','toggle-active','text-btn','data-id="' + esc(c.id) + '"') + '</div></div></div>').join('') + '</div>' : items.length ? '<div class="record-list">' + items.map(s => recordMarkup(s,true)).join('') + '</div>' : empty('暂时没有待办', '收到新投稿后，会显示在这里。')) + '</main>';
  }
  function prepareDraft() {
    const data = route.name === 'review' ? state.submissions.find(s => s.id === route.id) : route.name === 'edit' && route.id ? state.chips.find(c => c.id === route.id) : null;
    const targetId = route.targetChipId || data?.targetChipId;
    const target = targetId ? state.chips.find(c => c.id === targetId) : null;
    draft = { name:'', market:'中国大陆', year:'', packagingForm:'袋装', tags:[], flavor:'', specification:'', description:'', coverImage:'', backImage:'', modified:false };
    if (data) Object.assign(draft, data);
    if (route.name === 'review' && target) Object.assign(draft,C.reviewFields(data,target));
    if (route.name === 'submit' && target) Object.assign(draft,target,{targetChipId:target.id,coverImage:'',backImage:''});
    draft.baseline = target || (route.name === 'edit' ? data : null);
  }
  function updateDraft() {
    const form = document.getElementById('editor-form');
    if (!form || !draft) return;
    const data = new FormData(form);
    for (const key of ['name','market','year','packagingForm','flavor','specification','description','reviewRemark']) if (data.has(key)) draft[key] = String(data.get(key));
    draft.tags = data.getAll('tags');
  }
  function pageScroll() { return root.querySelector('.page')?.scrollTop || 0; }
  function navigationState() {
    return {atlas:true,route,trail,filters,favoriteTab,favoriteSearch,scrollTop:pageScroll()};
  }
  function routeUrl(current = route, sharing = false) {
    const url = new URL(location.href);
    if (sharing) url.search = '';
    const kind = {detail:'chip',batch:'batch'}[current.name];
    url.hash = kind ? '/' + kind + '/' + encodeURIComponent(current.id) : '';
    return url.href;
  }
  function routeFromLink() {
    if (/^#\/batch(?:\/|$)/.test(location.hash)) return {name:'batch',id:location.hash.slice('#/batch/'.length)};
    if (!/^#\/chip(?:\/|$)/.test(location.hash)) return {name:'catalog'};
    const id = location.hash.slice('#/chip/'.length);
    return {name:'detail',id:C.resolvePublicChip(state,id)?.id || id,fromLink:true};
  }
  function go(name, args) {
    if (route.name === name && !args) return;
    if (PUBLIC) history.replaceState(navigationState(),'');
    if (['catalog','favorites','profile'].includes(name)) trail = [];
    else trail.push({route, scrollTop: pageScroll()});
    route = Object.assign({name},args || {}); side = 'coverImage'; sheet = null;
    draft = null; if (['submit','edit','review'].includes(name)) prepareDraft();
    render();
    if (PUBLIC) history.pushState(navigationState(),'',routeUrl());
  }
  function back(force) {
    if (PUBLIC && trail.length && history.state?.atlas) { history.back(); return; }
    if (!force && draft?.modified) { updateDraft(); sheet = {type:'discard'}; return render(pageScroll()); }
    const previous = trail.pop();
    route = previous?.route || {name:'catalog'}; draft = null; sheet = null; side = 'coverImage';
    render(previous?.scrollTop);
    if (PUBLIC) history.replaceState(navigationState(),'',routeUrl());
  }
  function restoreNavigation(saved) {
    ({route,trail,filters,favoriteTab,favoriteSearch = ''} = saved);
    sheet = null; side = 'coverImage';
    render(saved.scrollTop);
  }
  function rememberNavigation() {
    if (!PUBLIC || !state) return;
    try {
      sessionStorage.setItem('atlas-reload',JSON.stringify({url:location.href,saved:navigationState()}));
    } catch (_) { /* Browsing still works when tab storage is unavailable. */ }
  }
  function navigationOnLoad() {
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
      try {
        const snapshot = JSON.parse(sessionStorage.getItem('atlas-reload'));
        if (snapshot?.url === location.href) return snapshot.saved;
      } catch (_) { /* Fall back to the browser history entry. */ }
    }
    return history.state;
  }
  window.addEventListener('pagehide', rememberNavigation);
  if (PUBLIC) window.addEventListener('popstate', event => {
    if (!state) return;
    if (event.state?.atlas) return restoreNavigation(event.state);
    route = routeFromLink(); trail = []; sheet = null; side = 'coverImage';
    render();
  });
  function sheetMarkup() {
    if (!sheet) return '';
    if (sheet.type === 'zoom') {
      const chip = state.chips.find(c => c.id === route.id);
      return '<div class="viewer" role="dialog" aria-modal="true" aria-label="包装大图">' + button(icon('close'),'close-sheet','sheet-close','aria-label="关闭大图"') + '<img src="' + esc(image(chip?.[side] || chip?.coverImage)) + '" alt="包装大图"><p>' + esc(chip?.name || '') + '</p></div>';
    }
    const title = {filters:'筛选图鉴',about:'关于图鉴',discard:'放弃这次修改？',active:'下架这款图鉴？',submission:'投稿详情',share:route.name === 'batch' ? '批次链接' : '单品链接'}[sheet.type] || '';
    let content = '';
    if (sheet.type === 'share') content = '<label class="field"><span>选择并复制地址</span><input id="share-url" readonly value="' + esc(routeUrl(route,true)) + '"></label>';
    if (sheet.type === 'filters') {
      const select = (key,label,values,all) => '<label class="field' + (key === 'releaseBatch' ? ' filter-wide' : '') + '"><span>' + label + '</span><select name="' + key + '">' + option('',all,filters[key] || '') + values.map(v => option(Array.isArray(v) ? v[0] : v,Array.isArray(v) ? v[1] : v,filters[key])).join('') + '</select></label>';
      const active = C.homeCatalog(state);
      const series = [...new Set(active.map(c => c.series).filter(Boolean))];
      const weights = [...new Set(active.flatMap(C.packageWeights))].sort((a,b) => parseFloat(a)-parseFloat(b));
      const years = [...new Set(active.map(c => c.year).filter(Boolean))].sort((a,b) => a-b);
      const batches = [...new Set(active.map(c => c.releaseBatch).filter(Boolean))];
      content = '<form id="filters-form">' +
        select('market','地区',[...new Set(active.map(c => c.market))],'全部地区') +
        select('year','包装年份',[...years,['unknown','待核实']],'全部年份') +
        select('series','产品系列',series,'全部系列') +
        select('packagingForm','包装形态',[...new Set(active.map(c => c.packagingForm))],'全部形态') +
        select('specification','净含量（优先按图示）',weights,'全部规格') +
        select('tag','款式',['常规',...C.TAGS],'全部款式') +
        select('collection','收藏状态',collectionOptions,'全部状态') +
        select('imageStatus','展示图片',imageOptions,'全部图片') +
        select('order','浏览顺序',orderOptions,'默认顺序') +
        select('releaseBatch','发行批次',batches,'全部批次') +
        '<div class="filter-actions"><output id="filter-preview" aria-live="polite">' + matchingCount(filters) + '</output><div class="action-row">' +
        button('重置','reset-filters','btn secondary') + '<button type="submit" class="btn">查看结果</button></div></div></form>';
    }
    if (sheet.type === 'about') content = '<p>图鉴当前收录 ' + C.catalog(state).length + ' 条产品记录，包含不同市场、系列及包装形态。筛选支持年份、系列、袋装／罐装与净含量。详情保留素材来源。</p><p>收藏中预放了一组展示记录，可自行调整。图片和操作保存在当前浏览器。</p>' + button('知道了','close-sheet','btn full');
    if (sheet.type === 'discard') content = '<p>尚未保存的资料和图片会被放弃。</p><div class="action-row">' + button('继续填写','close-sheet','btn secondary') + button('放弃修改','discard','btn danger') + '</div>';
    if (sheet.type === 'active') content = '<p>下架后不再出现在公共图鉴中，已有收藏保留。管理员可以重新上架。</p><div class="action-row">' + button('取消','close-sheet','btn secondary') + button('确认下架','confirm-active','btn danger','data-id="' + esc(sheet.id) + '"') + '</div>';
    if (sheet.type === 'submission') {
      const s = state.submissions.find(s => s.id === sheet.id);
      content = '<p><strong>' + esc(s.name) + '</strong><br>' + esc(s.market) + ' · ' + (s.year || '年份未知') + ' · ' + statusName[s.status] + '</p><p>' + esc(s.description || '没有补充说明') + '</p>' + (s.reviewRemark ? '<p>审核说明：' + esc(s.reviewRemark) + '</p>' : '') + '<div class="submission-images">' + originalPictures(s) + '</div>' + (s.chipId ? button('查看对应图鉴','detail','btn full','data-id="' + esc(s.chipId) + '"') : button('知道了','close-sheet','btn full'));
    }
    return '<div class="overlay" data-action="overlay-close"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-header"><h2 id="sheet-title">' + title + '</h2>' + button(icon('close'),'close-sheet','sheet-close','aria-label="关闭弹窗"') + '</div>' + content + '</section></div>';
  }
  function matchingCount(query) {
    return '符合条件 ' + C.catalog(state,query).length + ' 款';
  }
  function filterDraft(form) {
    const fields = new FormData(form);
    return {search:filters.search,...Object.fromEntries(filterKeys.map(key=>[key,fields.get(key) || '']))};
  }
  function refreshFilterPreview(form) {
    form.querySelector('#filter-preview').textContent = matchingCount(filterDraft(form));
  }
  function render(scrollTop = 0) {
    const functions = {catalog:catalogMarkup,favorites:favoritesMarkup,profile:profileMarkup,detail:detailMarkup,batch:batchMarkup,directory:batchDirectoryMarkup,submit:editorMarkup,edit:editorMarkup,review:editorMarkup,history:historyMarkup,admin:adminMarkup};
    root.innerHTML = (functions[route.name] || catalogMarkup)() + sheetMarkup();
    const page = root.querySelector('.page'); if (page) { page.scrollTop = scrollTop; if (sheet) page.setAttribute('inert',''); }
    if (sheet) { root.querySelector('.bottom-nav')?.setAttribute('inert',''); root.querySelector('.sticky-actions')?.setAttribute('inert',''); root.querySelector('.sheet-close')?.focus({preventScroll:true}); }
    document.title = (route.name === 'detail' ? state.chips.find(c => c.id === route.id)?.name : root.querySelector('main h1,main h2')?.textContent) || '乐事薯片袋图鉴';
  }
  async function write(transform, message, redraw = true) {
    if (busy) return false;
    busy = true; writeEpoch++;
    try { state = await R.mutate(transform); if (redraw) render(pageScroll()); if (message) toast(message); return true; }
    catch (error) {
      const warning = root.querySelector('#form-error');
      if (warning) {
        warning.textContent = error.message; warning.scrollIntoView({block:'nearest'});
        queueExternalRead();
      } else toast(error.message);
      return false;
    }
    finally { busy = false; refreshExternal(); }
  }
  async function loadImage(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
    if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5MB');
    const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('图片读取失败，请重新选择')); reader.readAsDataURL(file); });
    const img = new Image();
    await new Promise((resolve,reject) => { img.onload = resolve; img.onerror = () => reject(new Error('文件不是可读取的图片')); img.src = data; });
    if (img.naturalWidth * img.naturalHeight > 30000000) throw new Error('图片分辨率过大，请缩小后再上传');
    return data;
  }
  root.addEventListener('click', async event => {
    const el = event.target.closest('[data-action]'); if (!el || busy) return;
    const a = el.dataset.action, id = el.dataset.id;
    if (a === 'overlay-close' && event.target !== el) return;
    if (['close-sheet','overlay-close'].includes(a)) { sheet = null; return render(pageScroll()); }
    if (a === 'nav') return go(el.dataset.name);
    if (a === 'back') return back();
    if (a === 'discard') return back(true);
    if (a === 'detail') return go('detail',{id});
    if (a === 'batch-directory') return go('directory',{query:''});
    if (a === 'open-batch') {
      const batchId = id || state.chips.find(c=>c.id === route.id)?.releaseBatchId;
      if (batchId) go('batch',{id:batchId,onlyMissing:false});
      return;
    }
    if (a === 'batch-missing') { route.onlyMissing = !route.onlyMissing; return render(); }
    if (a === 'clear-batch-search' || a === 'clear-favorite-search') {
      const input = document.getElementById(a === 'clear-batch-search' ? 'batch-search' : 'favorite-search');
      input.value = '';
      refreshSearch(input);
      input.focus();
      return;
    }
    if (a === 'share-chip' || a === 'share-batch') {
      const current = route;
      try { await navigator.clipboard.writeText(routeUrl(current,true)); toast(current.name === 'batch' ? '已复制批次链接' : '已复制单品链接'); }
      catch (_) {
        if (route !== current) return;
        sheet = {type:'share'}; render(pageScroll());
        const input = document.getElementById('share-url'); input.focus(); input.select();
      }
      return;
    }
    if (a === 'side') { side = el.dataset.side; return render(pageScroll()); }
    if (a === 'zoom') { sheet = {type:'zoom'}; return render(pageScroll()); }
    if (a === 'filters') { sheet = {type:'filters'}; return render(pageScroll()); }
    if (a === 'clear-all') { filters = defaultFilters(); return render(); }
    if (a === 'reset-filters') {
      for (const select of el.form.querySelectorAll('select')) select.value = '';
      return refreshFilterPreview(el.form);
    }
    if (a === 'remove-filter' && filterKeys.includes(el.dataset.key)) { filters[el.dataset.key] = ''; return render(); }
    if (a === 'favorite-tab') { favoriteTab = el.dataset.tab; return render(); }
    if (a === 'favorite') {
      const chipId = route.id, selected = el.dataset.status;
      const previous = selected || C.favoriteStatus(state,chipId);
      const status = el.getAttribute('aria-pressed') === 'true' ? '' : selected;
      return write(s => C.setFavorite(s,chipId,status,previous),'收藏已更新');
    }
    if (a === 'contribute') { if (PUBLIC) return; return go('submit',{targetChipId:id}); }
    if (a === 'submit') { if (PUBLIC) return toast('分享版先开放浏览和收藏'); return go('submit'); }
    if (a === 'history') { historyTab = ''; return go('history'); }
    if (a === 'history-tab') { historyTab = el.dataset.tab; return render(); }
    if (a === 'admin') { if (PUBLIC) return; return go('admin'); }
    if (a === 'admin-tab') { adminTab = el.dataset.tab; return render(); }
    if (a === 'edit' || a === 'new-chip') return go('edit',{id:id || ''});
    if (a === 'review') return go('review',{id});
    if (a === 'submission-detail') { sheet = {type:'submission',id}; return render(pageScroll()); }
    if (a === 'toggle-active') { const chip = state.chips.find(c => c.id === id); if (!chip.active) return write(s => C.setActive(s,id,true),'图鉴已重新上架'); sheet = {type:'active',id}; return render(pageScroll()); }
    if (a === 'confirm-active') { sheet = null; return write(s => C.setActive(s,id,false),'图鉴已下架，收藏记录保留'); }
    if (a === 'stat') { favoriteTab = el.dataset.name; return go('favorites'); }
    if (a === 'about') { sheet = {type:a}; return render(pageScroll()); }
    if (a === 'choose-duplicate') {
      const chip = state.chips.find(card=>card.id === id && card.active !== false);
      if (!draft || !chip) return;
      updateDraft();
      if (route.name === 'review') draft.duplicateId = id;
      else if (route.name === 'submit' && !draft.targetChipId) {
        const form = C.cleanFields(chip,false);
        draft = {...form,baseline:chip,targetChipId:id,coverImage:draft.coverImage,backImage:draft.backImage,beforeLink:draft};
      }
      draft.modified = true;
      return render(pageScroll());
    }
    if (a === 'unlink-target' && draft?.beforeLink) {
      updateDraft();
      draft = {...draft.beforeLink,coverImage:draft.coverImage,backImage:draft.backImage,modified:true};
      return render(pageScroll());
    }
    if (a === 'clear-duplicate' && draft) {
      updateDraft(); draft.duplicateId = ''; draft.modified = true;
      return render(pageScroll());
    }
    if (a === 'reason') { updateDraft(); draft.reviewRemark = el.dataset.reason; draft.modified = true; return render(pageScroll()); }
    if ((a === 'remove-back' || a === 'remove-front') && draft) {
      updateDraft(); draft[a === 'remove-back' ? 'backImage' : 'coverImage'] = ''; draft.modified = true;
      return render(pageScroll());
    }
    if (a === 'reject') {
      updateDraft();
      try {
        const opts = {remark:draft.reviewRemark,chipId:draft.duplicateId};
        const success = await write(s => C.review(s,route.id,'rejected',opts),'',false);
        if (success) { draft = null; back(true); toast('投稿已驳回'); }
      } catch (e) { document.getElementById('form-error').textContent = e.message; }
    }
  });
  root.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    if (event.target.id === 'filters-form') { filters = filterDraft(event.target); sheet = null; return render(); }
    if (event.target.id !== 'editor-form') return;
    updateDraft(); const errorElement = document.getElementById('form-error'); errorElement.textContent = '';
    try {
      const fields = C.cleanFields(draft,route.name !== 'submit');
      if ((route.name === 'submit' || (route.name === 'edit' && !route.id)) &&
          [fields.coverImage,fields.backImage].some(value=>value.startsWith('assets/'))) throw new Error('请上传自己拍摄的包装图片');
      let operation;
      if (route.name === 'submit') operation = s => C.submit(s,Object.assign({},fields,{targetChipId:draft.targetChipId || ''}),draft.baseline);
      if (route.name === 'edit') operation = s => C.saveChip(s,route.id,fields,draft.baseline);
      if (route.name === 'review') operation = s => C.review(s,route.id,'approved',{fields,remark:draft.reviewRemark,baseline:draft.baseline});
      const success = await write(operation,'',false);
      if (success) {
        const previous = route.name; draft = null;
        if (previous === 'submit') { trail = [{route:{name:'catalog'},scrollTop:0}]; route = {name:'history'}; render(); toast('投稿已提交，等待管理员审核'); }
        else { back(true); toast(previous === 'review' ? '已收录到公共图鉴' : '图鉴已保存'); }
      }
    } catch (error) { errorElement.textContent = error.message; errorElement.scrollIntoView({block:'nearest'}); }
  });
  const searchViews = {
    'catalog-search': {selector:'#catalog-results',markup:catalogResults,save:value=>{filters.search=value;}},
    'favorite-search': {selector:'#favorite-results',markup:favoriteResults,save:value=>{favoriteSearch=value;}},
    'batch-search': {selector:'#batch-directory-results',markup:batchDirectoryResults,save:value=>{route.query=value;}}
  };
  function refreshSearch(input) {
    const view = Object.hasOwn(searchViews,input.id) && searchViews[input.id];
    if (!view) return;
    view.save(input.value);
    root.querySelector(view.selector).innerHTML = view.markup();
  }
  function refreshDuplicates(input) {
    const results = document.getElementById('duplicate-results');
    if (!results || !draft) return;
    if (input.id === 'duplicate-search') draft.duplicateSearch = input.value;
    else if (route.name === 'submit' && (input.name === 'name' || input.name === 'flavor')) draft[input.name] = input.value;
    else return;
    results.innerHTML = duplicateResults(draft);
  }
  root.addEventListener('compositionend', event => {
    if (Object.hasOwn(searchViews,event.target.id)) refreshSearch(event.target);
    else refreshDuplicates(event.target);
  });
  root.addEventListener('input', event => {
    if (Object.hasOwn(searchViews,event.target.id)) {
      if (!event.isComposing) refreshSearch(event.target);
    } else if (event.target.closest('#editor-form') && draft) {
      draft.modified = true;
      if (!event.isComposing) refreshDuplicates(event.target);
    }
  });
  root.addEventListener('change', async event => {
    const input = event.target;
    if (input.form?.id === 'filters-form') return refreshFilterPreview(input.form);
    if (input.closest('#editor-form') && draft) { draft.modified = true; updateDraft(); }
    if (input.dataset.image && input.files?.[0]) {
      const currentDraft = draft, key = input.dataset.image;
      busy = true;
      try { const encoded = await loadImage(input.files[0]); if (draft !== currentDraft) return; draft[key] = encoded; draft.modified = true; render(pageScroll()); }
      catch (e) { toast(e.message); input.value = ''; }
      finally { busy = false; refreshExternal(); }
    }

  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheet) { sheet = null; render(pageScroll()); }
    if (event.key === 'Tab' && sheet) {
      const focusable = [...root.querySelectorAll('[role="dialog"] button,[role="dialog"] select,[role="dialog"] input')].filter(e => !e.disabled);
      const index = focusable.indexOf(document.activeElement);
      if (focusable.length && event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length-1].focus(); }
      else if (focusable.length && !event.shiftKey && index === focusable.length-1) { event.preventDefault(); focusable[0].focus(); }
    }
  });
  window.addEventListener('beforeunload', event => { if (draft?.modified) { event.preventDefault(); event.returnValue = ''; } });
  let readQueued = false, reading = false, writeEpoch = 0;
  function queueExternalRead() { readQueued = true; refreshExternal(); }
  async function refreshExternal() {
    if (!readQueued || !state || reading || busy) return;
    readQueued = false; reading = true;
    const epoch = writeEpoch;
    try {
      const latest = await R.read();
      if (busy || epoch !== writeEpoch) { readQueued = true; return; }
      if (!latest) return;
      state = latest;
      const filterForm = document.getElementById('filters-form');
      if (filterForm) refreshFilterPreview(filterForm);
      if (draft || sheet) return;
      const input = document.activeElement;
      if (input && Object.hasOwn(searchViews,input.id)) {
        const view = searchViews[input.id];
        root.querySelector(view.selector).innerHTML = view.markup();
        for (const count of root.querySelectorAll('[data-favorite-count]')) count.textContent = C.favorites(state,count.dataset.favoriteCount).length;
      } else render(pageScroll());
    } catch (error) { toast(error.message); }
    finally { reading = false; if (readQueued) refreshExternal(); }
  }
  R.onExternalChange(queueExternalRead);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) rememberNavigation();
    else queueExternalRead();
  });
  R.initialize().then(data => {
    state = data;
    const linked = PUBLIC ? routeFromLink() : route;
    const saved = PUBLIC && navigationOnLoad();
    if (PUBLIC && saved?.atlas && routeUrl(saved.route) === location.href) restoreNavigation(saved);
    else { route = linked; render(); }
    refreshExternal();
  }).catch(error => {
    root.innerHTML = '<main class="error-screen"><h2>暂时无法打开图鉴</h2><p>' + esc(error.message) + '</p><p>如果此前使用过，请保留当前浏览器数据，先检查存储权限。</p><button class="btn" id="retry">重新打开</button></main>';
    document.getElementById('retry').onclick = () => location.reload();
  });
})();
