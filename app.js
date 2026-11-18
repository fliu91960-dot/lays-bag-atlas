/* Browser views and event binding. All business mutations live in core.js. */
(function () {
  'use strict';
  const C = window.AtlasCore, R = window.AtlasRepository;
  const root = document.getElementById('app');
  const PUBLIC = Boolean(R.publicMode), modeText = PUBLIC ? '体验版' : '本地体验';
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
  const image = value => C.validImage(value) ? value : 'assets/unknown.png';
  const safeSource = value => { try { const u = new URL(value); return u.protocol === 'https:' && ['www.lays.com.cn','www.pepsico.com.cn','m.thepaper.cn','www.dealmoon.com','marketfoodasia.com','tao.hooos.com','www.foodaily.com','foodaily.com','post.smzdm.com','k.sina.cn','k.sina.com.cn','www.sohu.com','www.sayweee.com','wiki.smzdm.com','ma.gfsuper.com','www.digitaling.com','socialbeta.com','mightydepot.com','www.topfoo.com','www.ganhuoku.cn','www.foodtalks.cn','www.tentopsnacks.com','exoticers.com','americanuncleshop.fr','exosweet.com','www.foodinc.com.cn','www.smzdm.com','www.xinyingyang.com','candyfunhouse.com','shopee.ph','www.alibaba.com','www.umall.com.au','www.charmfoods.com.tw','www.yami.com','xinwen.bjd.com.cn','24h.pchome.com.tw','afamily.vn','shop.tiktok.com','laysaroundtheworld.com','shopee.tw','ufood.com.hk','beautycornerca.com','biggo.com.tw','online.citysuper.com.hk','style.udn.com','www.cosmopolitan.com','www.weee.com','www.wellcome.com.hk','fuji-san.ru','eg.alpremium.ca','exoticsnacks.com','online.carrefour.com.tw','tw.buy.yahoo.com','www.rakuten.com.tw','www.snaxo.ca','eorder.soda-mall.com','exoticsnackguysonline.com','munchaddict.com','shop.app','www.hktvmall.com','www.mintel.com','www.sina.cn','www.scrummy.pl','www.exodrinks.fr','www.waitrose.ae','sugarrushshop.co.uk','www.pns.hk','www.sinosplice.com','ep.shxwcb.com'].includes(u.hostname) && !u.username && !u.password; } catch (_) { return false; } };
  const date = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN'); };
  const statusName = { pending:'待审核', approved:'已收录', rejected:'未通过' };
  let state, route = { name:'catalog' }, trail = [], sheet = null, draft = null, busy = false;
  let filters = { search:'', tag:'', market:'', year:'', packagingForm:'', specification:'', series:'' }, favoriteTab = 'owned', adminTab = 'pending', historyTab = '';
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
  function tags(item) { return item.tags.length ? item.tags.map(t => '<span class="tag">' + esc(t) + '</span>').join('') : '<span class="tag">常规</span>'; }
  function yearLabel(item) {
    if (item.year) return '包装：' + item.year + '年';
    const year = item.firstSeenYear || item.flavorDocumentedYear;
    return year ? '口味首见：' + year + '年' + (item.firstSeenProvisional ? '（待核）' : '') : '年份待核实';
  }
  function card(item) {
    const status = C.favoriteStatus(state, item.id);
    return '<button type="button" class="chip-card" data-action="detail" data-id="' + esc(item.id) + '" aria-label="查看' + esc(item.name) + '"><div class="chip-art ' + (item.sourceKind === 'official' ? 'official' : !item.isDemo ? 'uploaded' : '') + '">' + (item.imagePending ? '<div class="image-pending">' + icon('bag') + '<span>图片待补</span></div>' : '<img loading="lazy" src="' + esc(image(item.coverImage)) + '" alt="' + esc(item.name) + '正面">') + '' + (status ? '<span class="owned-badge ' + status + '">' + icon(status === 'owned' ? 'check' : 'heart') + (status === 'owned' ? '已拥有' : '想要') + '</span>' : '') + (item.active === false ? '<span class="owned-badge">已下架</span>' : '') + '</div><h3>' + esc(item.name) + '</h3><div class="chip-meta"><span>' + esc(item.imageSpecification || item.specification || '规格待补') + '</span>' + '<span>·</span><span>' + esc(item.market) + '</span></div><p class="chip-year">' + esc(yearLabel(item)) + '</p><div class="tag-row">' + item.tags.map(t => '<span class="edition">' + esc(t) + '</span>').join('') + '</div></button>';
  }
  function catalogMarkup() {
    const items = C.catalog(state, filters);
    const count = Object.entries(filters).filter(([key,value]) => key !== 'search' && value).length;
    return '<main class="page" data-screen-label="图鉴"><header class="topbar"><div class="brand"><div class="brand-icon">' + icon('bag') + '</div><div><h1>薯片袋图鉴</h1><p>乐事包装收藏册</p></div></div><span class="mode">' + modeText + '</span></header><div class="search-row"><label class="search">' + icon('search') + '<input id="catalog-search" type="search" maxlength="60" placeholder="搜索包装名称" aria-label="搜索包装名称" value="' + esc(filters.search) + '"></label>' + button(icon('filter') + '筛选' + (count ? '<span class="filter-count">' + count + '</span>' : ''), 'filters', 'filter-trigger' + (count ? ' selected' : ''), 'aria-label="筛选图鉴"') + '</div><div class="catalog-heading"><strong>' + (count || filters.search ? '筛选结果' : '全部图鉴') + ' <span class="muted">' + items.length + '</span></strong>' + (PUBLIC ? '' : button(icon('plus') + '补充图鉴', 'submit', 'text-btn')) + '</div>' + (items.length ? '<div class="grid">' + items.map(card).join('') + '</div>' : empty('没有找到这款包装', '换个名称或筛选条件试试。', button('清空筛选', 'clear-all', 'btn secondary'))) + '</main>' + navigation();
  }
  function favoritesMarkup() {
    const items = C.favorites(state, favoriteTab), owned = C.favorites(state, 'owned').length, wanted = C.favorites(state, 'wanted').length;
    return '<main class="page" data-screen-label="我的收藏"><header class="topbar"><h1>我的收藏</h1><span class="mode">' + esc(C.user(state).name) + '</span></header><div class="tabs-wide">' + [['owned','已拥有',owned],['wanted','想要收藏',wanted]].map(([id,name,count]) => button(name + ' <span class="muted">' + count + '</span>', 'favorite-tab', favoriteTab === id ? 'active' : '', 'data-tab="' + id + '"')).join('') + '</div>' + (items.length ? '<div class="grid">' + items.map(card).join('') + '</div>' : empty(favoriteTab === 'owned' ? '第一只袋子，等你点亮' : '把想要的包装记在这里', '去图鉴看看，找到喜欢的那一款。', button('逛逛图鉴', 'nav', 'btn', 'data-name="catalog"'))) + '</main>' + navigation();
  }
  function profileMarkup() {
    const user = C.user(state), submissions = C.ownSubmissions(state), isAdmin = user.role !== 'user';
    const menu = (i,name,action,extra) => button(icon(i) + '<span>' + name + '</span>' + (extra ? '<span class="right">' + extra + '</span>' : '') + icon('arrow').replace('<svg','<svg class="arrow"'), action, 'menu-item');
    return '<main class="page" data-screen-label="我的"><header class="topbar"><h1>我的</h1><span class="mode">' + modeText + '</span></header><div class="profile-block"><div class="avatar">' + icon(user.role === 'owner' ? 'shield' : 'user') + '</div><div><h2>' + esc(user.name) + '</h2><p>' + (user.role === 'owner' ? '本地管理员' : user.role === 'admin' ? '管理员' : '每一个包装，都值得被记住') + '</p></div></div><div class="stats">' + [['owned','已拥有',C.favorites(state,'owned').length],['wanted','想要收藏',C.favorites(state,'wanted').length],['history','我的投稿',submissions.length]].map(([id,name,count]) => button('<strong>' + count + '</strong><small>' + name + '</small>', 'stat', '', 'data-name="' + id + '"')).join('') + '</div><div class="menu">' + (PUBLIC ? '' : menu('file','投稿记录','history',submissions.length ? String(submissions.length) : '')) + menu('bookmark','收藏可见性','visibility','仅自己') + '</div>' + (isAdmin ? '<div class="menu">' + menu('shield','管理图鉴与投稿','admin',String(state.submissions.filter(s => s.status === 'pending').length) + ' 条待审') + '</div>' : '') + '<div class="menu">' + menu('info','关于体验版','about') + '</div><p class="local-note">数据和图片保存在当前浏览器。</p><p class="page-footnote">乐事薯片袋图鉴 · ' + (PUBLIC ? '分享体验版' : '本地版 0.3.1') + '<br>收藏爱好者项目</p></main>' + navigation();
  }
  function historyMarkupFor(chip) {
    const link = (url,text) => safeSource(url) ? ' <a target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + text + ' ↗</a>' : '';
    return (chip.timelineSource ? '<p class="description">时间线参考：' + esc(chip.timelineRecordId) + ' · ' + esc(chip.timelineSource) + '。' + esc(chip.timelineEvidence) + '。' + esc(chip.timelineNote) + '</p>' : '') + (chip.yearEvidence ? '<p class="description">' + esc(chip.yearEvidence) + link(chip.yearEvidenceUrl,'年份依据') + '</p>' : '') + (chip.historyNote ? '<p class="description">' + esc(chip.historyNote) + link(chip.historyUrl,'历史资料') + '</p>' : '');
  }
  function detailMarkup() {
    const chip = state.chips.find(c => c.id === route.id);
    if (!chip) return '<main class="page">' + header('图鉴详情') + empty('图鉴不存在', '返回列表后再试。') + '</main>';
    const status = C.favoriteStatus(state, chip.id), isAdmin = C.user(state).role !== 'user';
    return '<main class="page" data-screen-label="图鉴详情">' + header('图鉴详情', isAdmin ? button(icon('edit'), 'edit', 'back', 'data-id="' + esc(chip.id) + '" aria-label="编辑图鉴"') : '') + '<div class="detail-hero ' + (chip.sourceKind === 'official' ? 'official' : '') + '"><img src="' + esc(image(chip[side] || chip.coverImage)) + '" alt="' + esc(chip.name) + (side === 'backImage' ? '背面' : '正面') + '">' + button(icon('zoom'), 'zoom', 'zoom', 'aria-label="放大包装图片"') + '</div><div class="image-switch">' + button('正面', 'side', side === 'coverImage' ? 'active' : '', 'data-side="coverImage"') + (chip.backImage ? button('背面', 'side', side === 'backImage' ? 'active' : '', 'data-side="backImage"') : '') + '</div><article class="detail-info"><h1>' + esc(chip.name) + '</h1><div class="tag-row">' + tags(chip) + (chip.active === false ? '<span class="tag">已下架</span>' : '') + '</div><dl class="detail-fields">' + [['发行市场',chip.market],['包装年份',chip.year || '待核实'],['口味首见',chip.firstSeenYear ? chip.firstSeenYear + '年' + (chip.firstSeenProvisional ? '（待核）' : '') : chip.flavorDocumentedYear ? chip.flavorDocumentedYear + '年' : '待核实'],['产品系列',chip.series || '待补充'],['包装形态',chip.packagingForm],['图示规格',chip.imageSpecification || chip.specification || '待补充'],['已知规格',chip.specification || '待补充'],['口味',chip.flavor || '待补充']].map(([k,v]) => '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl>' + (chip.description ? '<p class="description">' + esc(chip.description) + '</p>' : '') + (safeSource(chip.sourceUrl) ? '<p class="source-note">图片来源：<a target="_blank" rel="noopener noreferrer" href="' + esc(chip.sourceUrl) + '">' + esc(chip.sourceLabel || '素材来源') + ' ↗</a></p>' : '') + '' + historyMarkupFor(chip) + (PUBLIC || chip.active === false ? '' : button(icon('upload') + '补充包装图片','contribute','btn secondary full','data-id="' + esc(chip.id) + '"')) + '</article></main><div class="sticky-actions"><div class="action-row">' + (chip.active === false ? (status ? button('取消收藏', 'favorite', 'btn secondary full', 'data-status=""') : '<p class="form-hint">这款图鉴已下架。</p>') : button(icon('check') + (status === 'owned' ? '已拥有 ✓' : '标记拥有'), 'favorite', 'btn ' + (status === 'owned' ? 'on-owned' : 'secondary'), 'data-status="owned"') + button(icon('heart') + (status === 'wanted' ? '已加入心愿' : '想要收藏'), 'favorite', 'btn ' + (status === 'wanted' ? 'on-wanted' : ''), 'data-status="wanted"')) + '</div></div>';
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (String(selected) === String(value) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function fieldsMarkup(data) {
    const upload = (key,label) => '<label class="upload-tile">' + (data[key] ? '<img src="' + esc(image(data[key])) + '" alt="' + label + '预览"><span class="upload-caption">' + label + ' · 点击替换</span>' : icon('plus') + '<span>' + label + (key === 'coverImage' ? '图片' : '图片（选填）') + '</span>') + '<input type="file" accept="image/jpeg,image/png,image/webp" data-image="' + key + '" aria-label="上传' + label + '图片"></label>';
    return '<div class="upload-pair">' + upload('coverImage','正面') + upload('backImage','背面') + '</div><p class="form-hint">支持 JPG、PNG、WebP，每张不超过 5MB。' + (data.backImage ? ' <button type="button" class="text-btn" data-action="remove-back">移除背面图</button>' : '') + '</p><label class="field"><span>包装名称</span><input name="name" required maxlength="60" placeholder="例如：原味 · 周年纪念包装" value="' + esc(data.name) + '"></label><div class="field-pair"><label class="field"><span>发行市场</span><select name="market">' + C.MARKETS.map(x => option(x,x,data.market)).join('') + '</select></label><label class="field"><span>发行年份<small>未知可留空</small></span><input name="year" inputmode="numeric" maxlength="4" placeholder="例如 2026" value="' + esc(data.year ?? '') + '"></label></div><label class="field"><span>包装形态</span><select name="packagingForm">' + C.FORMS.map(x => option(x,x,data.packagingForm)).join('') + '</select></label><span class="field-title">特殊标签<small class="muted">（可多选）</small></span><div class="checks">' + C.TAGS.map(t => '<label class="check"><input type="checkbox" name="tags" value="' + t + '"' + (data.tags.includes(t) ? ' checked' : '') + '><span>' + t + '</span></label>').join('') + '</div><div class="field-pair"><label class="field"><span>口味<small>选填</small></span><input name="flavor" maxlength="60" value="' + esc(data.flavor) + '" placeholder="例如 原味"></label><label class="field"><span>规格<small>选填</small></span><input name="specification" maxlength="60" value="' + esc(data.specification) + '" placeholder="例如 70g"></label></div><label class="field"><span>补充说明<small>选填</small></span><textarea name="description" maxlength="600" placeholder="包装差异、系列信息，或需要管理员确认的地方…">' + esc(data.description) + '</textarea></label>';
  }
  function editorMarkup() {
    const review = route.name === 'review', editing = route.name === 'edit';
    const record = review ? state.submissions.find(s => s.id === route.id) : null;
    if (!draft) prepareDraft();
    return '<main class="page" data-screen-label="' + (review ? '审核投稿' : editing ? '编辑图鉴' : '补充图鉴') + '">' + header(review ? '整理并审核' : editing ? (route.id ? '编辑图鉴' : '新增图鉴') : '补充图鉴', '<span class="mode">' + (review || editing ? '管理员' : '投稿') + '</span>') + (draft.targetChipId ? '<p class="page-intro">正在为已有图鉴补图：' + esc(draft.name) + '</p>' : '') + (review ? '<details class="review-original"><summary>查看投稿原图与资料</summary><p>' + esc(record.name) + ' · ' + esc(record.market) + ' · ' + (record.year || '年份未知') + '</p><img src="' + esc(image(record.coverImage)) + '" alt="投稿正面原图">' + (record.backImage ? '<img src="' + esc(image(record.backImage)) + '" alt="投稿背面原图">' : '') + '<p>' + esc(record.description) + '</p></details>' : !editing && !draft.targetChipId ? '<p class="page-intro">把图鉴里还没有的包装分享给大家。<br>管理员确认后，才会收录到公共图鉴。</p>' : '') + '<form id="editor-form" class="form-content" novalidate>' + fieldsMarkup(draft) + (review ? '<label class="field"><span>审核说明<small>驳回时必填</small></span><textarea name="reviewRemark" maxlength="300" placeholder="例如：图鉴已收录，或图片需要重新拍摄">' + esc(draft.reviewRemark || '') + '</textarea></label><div class="reason-buttons">' + ['图片不清晰，请重新拍摄','该包装已收录'].map(v => button(v,'reason','','data-reason="' + esc(v) + '"')).join('') + '</div><label class="field"><span>重复投稿对应图鉴<small>选填</small></span><select name="duplicateId">' + option('','不关联','') + C.catalog(state,{}).map(c => option(c.id,c.name,draft.duplicateId)).join('') + '</select></label>' : '') + '<p class="form-error" id="form-error" role="alert"></p>' + (review ? '<div class="action-row">' + button('驳回投稿','reject','btn secondary') + '<button type="submit" class="btn">确认收录</button></div>' : '<button type="submit" class="btn full">' + (editing ? '保存图鉴' : '提交审核') + '</button>') + '</form></main>';
  }
  function recordMarkup(record, admin) {
    const action = admin && record.status === 'pending' ? 'review' : 'submission-detail';
    return '<button type="button" class="record" data-action="' + action + '" data-id="' + esc(record.id) + '"><img class="record-thumb" src="' + esc(image(record.coverImage)) + '" alt="' + esc(record.name) + '"><div class="record-main"><h3>' + esc(record.name) + '</h3><p>' + esc(record.market) + ' · ' + (record.year || '年份未知') + '<br>' + date(record.createTime) + (admin ? ' · ' + esc(state.users.find(u => u.id === record.userId)?.name || '收藏者') : '') + '</p>' + (record.reviewRemark ? '<p class="record-note">' + esc(record.reviewRemark) + '</p>' : '') + '<div class="record-footer"><span class="pill ' + record.status + '">' + statusName[record.status] + '</span>' + (record.chipId ? '<span class="muted">查看对应图鉴 ›</span>' : '') + '</div></div>' + icon('arrow') + '</button>';
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
    const target = route.name === 'submit' && route.targetChipId ? state.chips.find(c => c.id === route.targetChipId) : null;
    draft = Object.assign({ name:'', market:'中国大陆', year:'', packagingForm:'袋装', tags:[], flavor:'', specification:'', description:'', coverImage:'', backImage:'', modified:false }, data ? C.clone(data) : target ? Object.assign(C.clone(target), {targetChipId:target.id,coverImage:'',backImage:''}) : {});
  }
  function updateDraft() {
    const form = document.getElementById('editor-form');
    if (!form || !draft) return;
    const data = new FormData(form);
    for (const key of ['name','market','year','packagingForm','flavor','specification','description','reviewRemark','duplicateId']) if (data.has(key)) draft[key] = String(data.get(key));
    draft.tags = data.getAll('tags');
  }
  function go(name, args) {
    if (['catalog','favorites','profile'].includes(name)) trail = [];
    else trail.push(route);
    route = Object.assign({name},args || {}); side = 'coverImage'; sheet = null;
    draft = null; if (['submit','edit','review'].includes(name)) prepareDraft();
    render();
  }
  function back(force) {
    if (!force && draft?.modified) { updateDraft(); sheet = {type:'discard'}; return render(true); }
    route = trail.pop() || {name:'catalog'}; draft = null; sheet = null; side = 'coverImage'; render();
  }
  function sheetMarkup() {
    if (!sheet) return '';
    if (sheet.type === 'zoom') {
      const chip = state.chips.find(c => c.id === route.id);
      return '<div class="viewer" role="dialog" aria-modal="true" aria-label="包装大图">' + button(icon('close'),'close-sheet','sheet-close','aria-label="关闭大图"') + '<img src="' + esc(image(chip?.[side] || chip?.coverImage)) + '" alt="包装大图"><p>' + esc(chip?.name || '') + '</p></div>';
    }
    const title = {filters:'筛选图鉴',about:'关于本地体验版',visibility:'收藏可见性',discard:'放弃这次修改？',active:'下架这款图鉴？',submission:'投稿详情'}[sheet.type] || '';
    let content = '';
    if (sheet.type === 'filters') {
      const select = (key,label,values,all) => '<label class="field"><span>' + label + '</span><select name="' + key + '">' + option('',all || '全部',filters[key]) + values.map(v => option(Array.isArray(v) ? v[0] : v,Array.isArray(v) ? v[1] : v,filters[key])).join('') + '</select></label>';
      const series = [...new Set(['原切','无限','大波浪','自然滋味',...state.chips.map(c => c.series).filter(Boolean)])];
      const weights = [...new Set([...C.FOCUS_WEIGHTS,...state.chips.map(c => c.specification).filter(Boolean)])].sort((a,b) => parseFloat(a)-parseFloat(b));
      const years = [...new Set(state.chips.map(c => c.year).filter(Boolean))].sort((a,b) => a-b);
      content = '<form id="filters-form">' + select('market','地区',C.MARKETS,'全部地区') + select('year','包装年份',[...years,['unknown','待核实']],'全部年份') + select('series','产品系列',series,'全部系列') + select('packagingForm','包装形态',C.FORMS,'袋装、罐装') + select('specification','净含量',weights,'全部规格') + select('tag','款式',['常规',...C.TAGS],'全部款式') + '<div class="action-row">' + button('重置','reset-filters','btn secondary') + '<button type="submit" class="btn">查看结果</button></div></form>';
    }
    if (sheet.type === 'about') content = '<p>图鉴当前收录 ' + C.initialState().chips.length + ' 条产品记录，包含不同市场、系列及包装形态。筛选支持年份、系列、袋装／罐装与净含量。详情保留素材来源。</p><p>收藏中预放了一组展示记录，可自行调整。图片和操作保存在当前浏览器。</p>' + button('知道了','close-sheet','btn full');
    if (sheet.type === 'visibility') content = '<p>收藏仅保存在当前浏览器，当前为私有收藏。</p>' + button('知道了','close-sheet','btn full');
    if (sheet.type === 'discard') content = '<p>尚未保存的资料和图片会被放弃。</p><div class="action-row">' + button('继续填写','close-sheet','btn secondary') + button('放弃修改','discard','btn danger') + '</div>';
    if (sheet.type === 'active') content = '<p>下架后不再出现在公共图鉴中，已有收藏保留。管理员可以重新上架。</p><div class="action-row">' + button('取消','close-sheet','btn secondary') + button('确认下架','confirm-active','btn danger','data-id="' + esc(sheet.id) + '"') + '</div>';
    if (sheet.type === 'submission') {
      const s = state.submissions.find(s => s.id === sheet.id);
      content = '<p><strong>' + esc(s.name) + '</strong><br>' + esc(s.market) + ' · ' + (s.year || '年份未知') + ' · ' + statusName[s.status] + '</p><p>' + esc(s.description || '没有补充说明') + '</p>' + (s.reviewRemark ? '<p>审核说明：' + esc(s.reviewRemark) + '</p>' : '') + '<div class="submission-images"><img src="' + esc(image(s.coverImage)) + '" alt="投稿正面原图">' + (s.backImage ? '<img src="' + esc(image(s.backImage)) + '" alt="投稿背面原图">' : '') + '</div>' + (s.chipId ? button('查看对应图鉴','detail','btn full','data-id="' + esc(s.chipId) + '"') : button('知道了','close-sheet','btn full'));
    }
    return '<div class="overlay" data-action="overlay-close"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-header"><h2 id="sheet-title">' + title + '</h2>' + button(icon('close'),'close-sheet','sheet-close','aria-label="关闭弹窗"') + '</div>' + content + '</section></div>';
  }
  function render(preserveScroll) {
    const scroll = preserveScroll ? root.querySelector('.page')?.scrollTop || 0 : 0;
    const functions = {catalog:catalogMarkup,favorites:favoritesMarkup,profile:profileMarkup,detail:detailMarkup,submit:editorMarkup,edit:editorMarkup,review:editorMarkup,history:historyMarkup,admin:adminMarkup};
    root.innerHTML = (functions[route.name] || catalogMarkup)() + sheetMarkup();
    const page = root.querySelector('.page'); if (page) { page.scrollTop = scroll; if (sheet) page.setAttribute('inert',''); }
    if (sheet) { root.querySelector('.bottom-nav')?.setAttribute('inert',''); root.querySelector('.sticky-actions')?.setAttribute('inert',''); root.querySelector('.sheet-close')?.focus({preventScroll:true}); }
    document.title = '薯片袋图鉴 · ' + ({catalog:'图鉴',favorites:'我的收藏',profile:'我的'}[route.name] || '本地体验');
  }
  async function write(transform, message, redraw = true) {
    if (busy) return false;
    busy = true;
    try { state = await R.mutate(transform); if (redraw) render(true); if (message) toast(message); return true; }
    catch (error) { toast(error.message); return false; }
    finally { busy = false; }
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
    if (['close-sheet','overlay-close'].includes(a)) { sheet = null; return render(true); }
    if (a === 'nav') return go(el.dataset.name);
    if (a === 'back') return back();
    if (a === 'discard') return back(true);
    if (a === 'detail') return go('detail',{id});
    if (a === 'side') { side = el.dataset.side; return render(true); }
    if (a === 'zoom') { sheet = {type:'zoom'}; return render(true); }
    if (a === 'filters') { sheet = {type:'filters'}; return render(true); }
    if (a === 'clear-all') { filters = {search:'',tag:'',market:'',year:'',packagingForm:'',specification:'',series:''}; return render(); }
    if (a === 'reset-filters') { filters = {search:filters.search,tag:'',market:'',year:'',packagingForm:'',specification:'',series:''}; return render(true); }
    if (a === 'favorite-tab') { favoriteTab = el.dataset.tab; return render(); }
    if (a === 'favorite') return write(s => C.setFavorite(s,route.id,C.favoriteStatus(s,route.id) === el.dataset.status ? '' : el.dataset.status),'收藏已更新');
    if (a === 'contribute') { if (PUBLIC) return; return go('submit',{targetChipId:id}); }
    if (a === 'submit') { if (PUBLIC) return toast('分享版先开放浏览和收藏'); return go('submit'); }
    if (a === 'history') { historyTab = ''; return go('history'); }
    if (a === 'history-tab') { historyTab = el.dataset.tab; return render(); }
    if (a === 'admin') { if (PUBLIC) return; return go('admin'); }
    if (a === 'admin-tab') { adminTab = el.dataset.tab; return render(); }
    if (a === 'edit' || a === 'new-chip') return go('edit',{id:id || ''});
    if (a === 'review') return go('review',{id});
    if (a === 'submission-detail') { sheet = {type:'submission',id}; return render(true); }
    if (a === 'toggle-active') { const chip = state.chips.find(c => c.id === id); if (!chip.active) return write(s => C.setActive(s,id,true),'图鉴已重新上架'); sheet = {type:'active',id}; return render(true); }
    if (a === 'confirm-active') { sheet = null; return write(s => C.setActive(s,id,false),'图鉴已下架，收藏记录保留'); }
    if (a === 'stat') { if (el.dataset.name === 'history') return go('history'); favoriteTab = el.dataset.name; return go('favorites'); }
    if (['about','visibility'].includes(a)) { sheet = {type:a}; return render(true); }
    if (a === 'reason') { updateDraft(); draft.reviewRemark = el.dataset.reason; draft.modified = true; return render(true); }
    if (a === 'remove-back') { updateDraft(); draft.backImage = ''; draft.modified = true; return render(true); }
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
    if (event.target.id === 'filters-form') { const data = new FormData(event.target); for (const key of ['market','year','series','packagingForm','specification','tag']) filters[key] = data.get(key); sheet = null; return render(); }
    if (event.target.id !== 'editor-form') return;
    updateDraft(); const errorElement = document.getElementById('form-error'); errorElement.textContent = '';
    try {
      const fields = C.cleanFields(draft,true);
      if (route.name !== 'review' && fields.coverImage.startsWith('assets/') && !route.id) throw new Error('请上传自己的包装正面图片');
      let operation;
      if (route.name === 'submit') operation = s => C.submit(s,Object.assign({},fields,{targetChipId:draft.targetChipId || ''}));
      if (route.name === 'edit') operation = s => C.saveChip(s,route.id,fields);
      if (route.name === 'review') operation = s => C.review(s,route.id,'approved',{fields,remark:draft.reviewRemark});
      const success = await write(operation,'',false);
      if (success) {
        const previous = route.name; draft = null;
        if (previous === 'submit') { trail = [{name:'catalog'}]; route = {name:'history'}; render(); toast('投稿已提交，等待管理员审核'); }
        else { back(true); toast(previous === 'review' ? '已收录到公共图鉴' : '图鉴已保存'); }
      }
    } catch (error) { errorElement.textContent = error.message; errorElement.scrollIntoView({block:'nearest'}); }
  });
  root.addEventListener('input', event => {
    if (event.target.id === 'catalog-search') {
      filters.search = event.target.value;
      const start = event.target.selectionStart; render(); const input = document.getElementById('catalog-search'); input.focus(); try { input.setSelectionRange(start,start); } catch (_) {}
    } else if (event.target.closest('#editor-form') && draft) { draft.modified = true; }
  });
  root.addEventListener('change', async event => {
    const input = event.target;
    if (input.closest('#editor-form') && draft) { draft.modified = true; updateDraft(); }
    if (input.dataset.image && input.files?.[0]) {
      const currentDraft = draft, key = input.dataset.image;
      busy = true;
      try { const encoded = await loadImage(input.files[0]); if (draft !== currentDraft) return; draft[key] = encoded; draft.modified = true; render(true); }
      catch (e) { toast(e.message); input.value = ''; }
      finally { busy = false; }
    }

  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheet) { sheet = null; render(true); }
    if (event.key === 'Tab' && sheet) {
      const focusable = [...root.querySelectorAll('[role="dialog"] button,[role="dialog"] select,[role="dialog"] input')].filter(e => !e.disabled);
      const index = focusable.indexOf(document.activeElement);
      if (focusable.length && event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length-1].focus(); }
      else if (focusable.length && !event.shiftKey && index === focusable.length-1) { event.preventDefault(); focusable[0].focus(); }
    }
  });
  window.addEventListener('beforeunload', event => { if (draft?.modified) { event.preventDefault(); event.returnValue = ''; } });
  R.onExternalChange(async () => {
    if (draft?.modified || busy) { toast('另一页面更新了数据，保存时会使用最新记录'); return; }
    state = await R.read(); render(true);
  });
  R.initialize().then(data => { state = data; render(); }).catch(error => {
    root.innerHTML = '<main class="error-screen"><h2>暂时无法打开图鉴</h2><p>' + esc(error.message) + '</p><p>如果此前使用过，请保留当前浏览器数据，先检查存储权限。</p><button class="btn" id="retry">重新打开</button></main>';
    document.getElementById('retry').onclick = () => location.reload();
  });
})();
