/* Shared local-only domain model. No cloud authorization is implemented here. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtlasCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MARKETS = ['中国大陆', '中国台湾', '中国香港', '日本', '韩国', '其他', '未知'];
  const TAGS = ['限定', '联名', '促销'];
  const FORMS = ['袋装', '罐装'];
  const FOCUS_WEIGHTS = ['56g', '70g', '75g'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const uid = prefix => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function initialState() {
    const examples = [
      ['美国经典原味', '75g', 1],
      ['黄瓜味', '75g', 5],
      ['青柠味', '70g', 6],
      ['意大利香浓红烩味', '75g', 2],
      ['墨西哥鸡汁番茄味', '70g', 3],
      ['得克萨斯烧烤味', '75g', 4],
      ['飘香麻辣锅味','70g',7], ['香辣小龙虾味','70g',8],
      ['岩烧海苔味','70g',9], ['清新芥香味','70g',10], ['金黄炒蟹味','70g',11],
      ['藤椒钵钵鸡味','70g',12], ['清新小番茄味','70g',13], ['香酥烤鱼味','70g',14],
      ['蒜蓉烤生蚝味','70g',15], ['孜然烤羊肉串味','70g',16], ['川香辣子鸡味','70g',17], ['老坛酸菜鱼味','70g',18],
      ['大波浪·香脆烤鸡翅味','70g',1,3], ['大波浪·铁板鱿鱼味','70g',2,3],
      ['大波浪·炭烤五花肉味','70g',3,3], ['大波浪·美国经典原味','70g',4,3],
      ['大波浪·辛辣味','70g',5,3], ['大波浪·鲜浓番茄味','70g',6,3]
    ];
    const chips = examples.map(row => {
      const group = row[3] || 1, id = 'official-' + (group === 3 ? 'wave-' : 'cn-') + row[2];
      return { id, name:row[0], market:'中国大陆', year:null,
        tags:group === 1 && [12,13,17,18].includes(row[2]) ? ['限定'] : [],
        series:group === 3 ? '大波浪' : '原切', flavor:row[0].replace('大波浪·',''), specification:row[1], packagingForm:'袋装',
        description:'名称和净含量按包装正面核对。', coverImage:'assets/' + id + '.png', backImage:'',
        sourceKind:'official',sourceLabel:'乐事中国官网',sourceUrl:'https://www.lays.com.cn/product-detail.html?pid=' + group + '&index=' + row[2],
        sourceImageUrl:'https://www.lays.com.cn/resource/images/products' + group + '/' + row[2] + '_item.png',sourceCheckedAt:'2026-11-17',
        active:true,isDemo:false,createTime:'2026-11-17T00:00:00.000Z',updateTime:'2026-11-17T00:00:00.000Z' };
    });
    const history = [
      ['official-cn-12',2020,'https://m.thepaper.cn/newsDetail_forward_8541406','2020年8月2日的果壳测评（澎湃转载）出现藤椒钵钵鸡口味。'],
      ['official-cn-18',2021,'https://www.dealmoon.com/post/1455639','2021年8月25日的实物测评出现70g老坛酸菜鱼口味；图片与官网包装设计不同。']
    ];
    history.forEach(([id,year,url,note]) => Object.assign(chips.find(c => c.id === id), { flavorDocumentedYear:year, historyUrl:url, historyNote:note + '该资料用于口味历史，当前展示包装的发行年份仍待核实。' }));
    [['fish','炸鱼薯条味','webp','https://marketfoodasia.com/products/乐事炸鱼薯条味薯片-patatas-sabor-pescado-frito-70g','Marketfood Asia','https://marketfoodasia.com/cdn/shop/files/6abc3956c40fd.webp?v=1790720355'],
      ['butter','蒜香黄油味','jpg','https://tao.hooos.com/goods_POQzadKdi3t6vpXoMQWuvDZfPt6-p3j775c2J4e5456Sj.html','天猫商品图（虎窝淘收录）','https://img.alicdn.com/i2/725677994/O1CN01YqjRFZ28vJHfndAxe_!!725677994.jpg']].forEach(([key,name,ext,url,label,img]) => chips.push({
        id:'fifa-2026-' + key,name,market:'中国大陆',year:2026,series:'FIFA世界杯',tags:['限定','联名'],flavor:name,specification:'70g',packagingForm:'袋装',
        description:'2026 FIFA世界杯限定包装。包装正面可见赛事年份与70g净含量。',coverImage:'assets/fifa-2026-' + key + '.' + ext,backImage:'',
        sourceKind:'retail',sourceLabel:label,sourceUrl:url,sourceImageUrl:img,sourceCheckedAt:'2026-11-17',
        yearEvidenceUrl:'https://www.pepsico.com.cn/media-center/brand-news/211',yearEvidence:'百事中国2026年6月2日品牌新闻介绍该届世界杯限定系列，列出炸鱼薯条、蒜香黄油等袋装口味；包装正面亦标明2026。',
        active:true,isDemo:false,createTime:'2026-11-17T00:00:00.000Z',updateTime:'2026-11-17T00:00:00.000Z'
      }));
    return { version: 1, fixtureRevision: 3, currentUserId: 'collector', users: [
      { id: 'collector', name: '收藏者', role: 'user' },
      { id: 'collector-2', name: '另一位收藏者', role: 'user' },
      { id: 'admin', name: '管理员', role: 'owner' }
    ], chips, favorites: [], submissions: [] };
  }
  function migrateState(input) {
    if (input.fixtureRevision === 3) return clone(input);
    const next = clone(input), map = {'demo-1':'official-cn-1','demo-2':'official-cn-6','demo-3':'official-cn-3'};
    const removable = new Set(next.chips.filter(c => c.isDemo && /^demo-\d+$/.test(c.id) && c.updateTime === '2026-11-16T00:00:00.000Z' && (!next.favorites.some(f => f.chipId === c.id) || map[c.id])).map(c => c.id));
    next.chips = initialState().chips.filter(c => !next.chips.some(old => old.id === c.id)).concat(next.chips.filter(c => !removable.has(c.id)));
    next.favorites.forEach(f => { if (removable.has(f.chipId) && map[f.chipId]) f.chipId = map[f.chipId]; });
    const pairs = new Set(); next.favorites = next.favorites.filter(f => { const key = f.userId + ':' + f.chipId; if (pairs.has(key)) return false; pairs.add(key); return true; });
    next.fixtureRevision = 3;
    return next;
  }
  function bindIdentity(input, session) {
    assert(session && /^local-[a-f0-9]{24}$/.test(session.id) && ['owner','user'].includes(session.role), '本地身份校验失败，请重新启动应用');
    const next = clone(input);
    if (!next.identityRevision) {
      // Carry the current collector's work into the automatically identified local account once.
      const oldId = next.currentUserId;
      next.favorites.forEach(f => { if (f.userId === oldId) f.userId = session.id; });
      next.submissions.forEach(s => { if (s.userId === oldId) s.userId = session.id; });
      next.identityRevision = 1;
    }
    next.users.forEach(u => { if (u.id !== session.id) u.role = 'user'; });
    let target = next.users.find(u => u.id === session.id);
    if (!target) { target = {id:session.id,name:'收藏者',role:'user'}; next.users.push(target); }
    target.role = session.role; target.name = '收藏者'; next.currentUserId = session.id;
    if (!target.showcaseRevision) {
      const samples = {owned:['fifa-2026-fish','official-cn-1','official-cn-5','official-cn-9','official-cn-12','official-wave-1','official-wave-2'],
        wanted:['fifa-2026-butter','official-cn-13','official-cn-15','official-cn-18','official-wave-3']};
      Object.entries(samples).forEach(([status,ids]) => ids.forEach(chipId => {
        if (next.chips.some(c => c.id === chipId && c.active !== false) && !next.favorites.some(f => f.userId === session.id && f.chipId === chipId))
          next.favorites.push({userId:session.id,chipId,status,updateTime:now()});
      }));
      target.showcaseRevision = 1;
    }
    return next;
  }
  function user(state) { return state.users.find(item => item.id === state.currentUserId); }
  function requireAdmin(state) { assert(user(state) && ['admin', 'owner'].includes(user(state).role), '当前身份没有管理员权限'); }
  function validImage(value) {
    return typeof value === 'string' && value.length <= 8 * 1024 * 1024 &&
      (/^assets\/[a-z0-9_-]+\.(png|jpg|webp)$/.test(value) || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value));
  }
  function cleanFields(input, requireImage) {
    const name = String(input.name || '').trim();
    const yearText = input.year === null || input.year === undefined ? '' : String(input.year).trim();
    const year = yearText === '' ? null : Number(yearText);
    assert(name.length > 0 && name.length <= 60, '名称需填写 1～60 个字');
    assert(year === null || (/^\d{4}$/.test(yearText) && Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear() + 1), '请填写有效的四位年份，未知可留空');
    assert(MARKETS.includes(input.market), '请选择发行市场');
    assert(FORMS.includes(input.packagingForm), '请选择包装形态');
    const tags = [...new Set(Array.isArray(input.tags) ? input.tags : [])];
    assert(tags.every(tag => TAGS.includes(tag)), '款式标签不正确');
    ['flavor', 'specification'].forEach(key => assert(String(input[key] || '').length <= 60, '口味或规格不能超过 60 个字'));
    assert(String(input.description || '').length <= 600, '说明不能超过 600 个字');
    assert(!requireImage || Boolean(input.coverImage), '请上传正面图片');
    assert(!input.coverImage || validImage(input.coverImage), '正面图片格式不支持');
    assert(!input.backImage || validImage(input.backImage), '背面图片格式不支持');
    return { name, market: input.market, year, packagingForm: input.packagingForm, tags,
      flavor: String(input.flavor || '').trim(), specification: String(input.specification || '').trim(),
      description: String(input.description || '').trim(), coverImage: input.coverImage || '', backImage: input.backImage || '' };
  }
  function catalog(state, filters) {
    const f = filters || {};
    const search = String(f.search || '').trim().toLowerCase();
    return state.chips.filter(item => item.active !== false)
      .filter(item => !search || item.name.toLowerCase().includes(search))
      .filter(item => !f.market || item.market === f.market)
      .filter(item => !f.year || (f.year === 'unknown' ? item.year === null : String(item.year) === String(f.year)))
      .filter(item => !f.packagingForm || item.packagingForm === f.packagingForm)
      .filter(item => !f.series || item.series === f.series)
      .filter(item => !f.specification || item.specification.replace(/\s+/g,'').toLowerCase() === f.specification)
      .filter(item => !f.tag || (f.tag === '常规' ? item.tags.length === 0 : item.tags.includes(f.tag)));
  }
  function favoriteStatus(state, chipId) {
    const relation = state.favorites.find(item => item.userId === state.currentUserId && item.chipId === chipId);
    return relation ? relation.status : '';
  }
  function favorites(state, status) {
    return state.favorites.filter(item => item.userId === state.currentUserId && (!status || item.status === status))
      .map(item => { const chip = state.chips.find(chip => chip.id === item.chipId); return chip ? Object.assign({}, chip, { favoriteStatus: item.status }) : null; })
      .filter(Boolean);
  }
  function setFavorite(state, chipId, status) {
    assert(['', 'owned', 'wanted'].includes(status), '收藏状态不正确');
    assert(state.chips.some(item => item.id === chipId && (!status || item.active !== false)), '这款图鉴已下架或不存在');
    const next = clone(state);
    next.favorites = next.favorites.filter(item => !(item.userId === next.currentUserId && item.chipId === chipId));
    if (status) next.favorites.push({ userId: next.currentUserId, chipId, status, updateTime: now() });
    return next;
  }
  function submit(state, fields) {
    const data = cleanFields(fields, true);
    const next = clone(state);
    next.submissions.unshift(Object.assign(data, { id: uid('submission'), userId: state.currentUserId,
      status: 'pending', reviewRemark: '', chipId: '', createTime: now(), updateTime: now() }));
    return next;
  }
  function ownSubmissions(state) { return state.submissions.filter(item => item.userId === state.currentUserId); }
  function review(state, id, decision, options) {
    requireAdmin(state);
    assert(['approved', 'rejected'].includes(decision), '审核状态不正确');
    const next = clone(state);
    const record = next.submissions.find(item => item.id === id);
    assert(record, '投稿不存在');
    if (record.status === decision) return next;
    assert(record.status === 'pending', '该投稿已处理，请刷新查看');
    const opts = options || {};
    if (decision === 'approved') {
      const fields = cleanFields(opts.fields || record, true);
      const chipId = 'submission-chip-' + record.id;
      assert(!next.chips.some(chip => chip.id === chipId), '该投稿已经收录');
      // Strings are immutable in the local demo. Cloud mode must copy files before publication.
      next.chips.unshift(Object.assign(fields, { id: chipId, active: true, isDemo: false,
        sourceSubmissionId: record.id, createdBy: state.currentUserId, createTime: now(), updateTime: now() }));
      record.chipId = chipId;
    } else {
      assert(String(opts.remark || '').trim(), '请填写驳回原因');
      if (opts.chipId) assert(next.chips.some(chip => chip.id === opts.chipId && chip.active !== false), '关联图鉴不存在');
      record.chipId = opts.chipId || '';
    }
    record.status = decision;
    record.reviewRemark = String(opts.remark || '').trim().slice(0, 300);
    record.reviewerId = state.currentUserId;
    record.reviewTime = now();
    record.updateTime = now();
    return next;
  }
  function saveChip(state, id, fields) {
    requireAdmin(state);
    const data = cleanFields(fields, true);
    const next = clone(state);
    if (id) {
      const index = next.chips.findIndex(item => item.id === id);
      assert(index !== -1, '图鉴不存在');
      if (next.chips[index].coverImage !== data.coverImage) {
        next.chips[index].sourceKind = 'upload';
        next.chips[index].previousSourceUrl = next.chips[index].sourceUrl || '';
        delete next.chips[index].sourceUrl;
        delete next.chips[index].sourceImageUrl;
        delete next.chips[index].sourceLabel;
        for (const key of ['yearEvidence','yearEvidenceUrl','historyNote','historyUrl','flavorDocumentedYear']) delete next.chips[index][key];
      }
      if (next.chips[index].year !== data.year) { delete next.chips[index].yearEvidence; delete next.chips[index].yearEvidenceUrl; }
      next.chips[index] = Object.assign(next.chips[index], data, { updatedBy: state.currentUserId, updateTime: now() });
    } else next.chips.unshift(Object.assign(data, { id: uid('chip'), active: true, isDemo: false, createdBy: state.currentUserId, createTime: now(), updateTime: now() }));
    return next;
  }
  function setActive(state, id, active) {
    requireAdmin(state);
    const next = clone(state), chip = next.chips.find(item => item.id === id);
    assert(chip, '图鉴不存在');
    chip.active = Boolean(active); chip.updateTime = now();
    return next;
  }
  function switchUser(state, id) {
    assert(state.users.some(item => item.id === id), '体验身份不存在');
    return Object.assign(clone(state), { currentUserId: id });
  }
  function setUserRole(state, id, role) {
    assert(user(state) && user(state).role === 'owner', '只有群主体验身份能任免管理员');
    assert(['user', 'admin'].includes(role), '角色不正确');
    const next = clone(state), target = next.users.find(item => item.id === id);
    assert(target && target.role !== 'owner', '群主身份不能在此修改');
    target.role = role;
    return next;
  }
  function validateState(value) {
    assert(value && value.version === 1, '备份版本不支持');
    assert(['users', 'chips', 'favorites', 'submissions'].every(key => Array.isArray(value[key])), '备份格式不正确');
    assert(value.chips.length <= 20000 && value.favorites.length <= 100000 && value.submissions.length <= 20000, '备份记录过多');
    const users = new Set();
    for (const u of value.users) { assert(u && typeof u.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(u.id) && !users.has(u.id) && typeof u.name === 'string' && u.name.length <= 60 && ['user','admin','owner'].includes(u.role), '备份用户格式不正确'); users.add(u.id); }
    assert(value.users.filter(u => u.role === 'owner').length <= 1 && users.has(value.currentUserId), '本地身份不完整');
    const seen = new Set();
    for (const chip of value.chips) { assert(chip && typeof chip.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(chip.id) && !seen.has(chip.id), '备份图鉴编号重复或缺失'); cleanFields(chip, true); assert(typeof chip.active === 'boolean' && typeof chip.isDemo === 'boolean', '备份图鉴状态不正确'); seen.add(chip.id); }
    const pairs = new Set();
    for (const f of value.favorites) { const key = f.userId + ':' + f.chipId; assert(!pairs.has(key) && ['owned', 'wanted'].includes(f.status) && value.users.some(u => u.id === f.userId) && seen.has(f.chipId), '备份收藏关系不正确'); pairs.add(key); }
    const submissionIds = new Set();
    for (const submission of value.submissions) { assert(submission && ['pending', 'approved', 'rejected'].includes(submission.status) && users.has(submission.userId) && typeof submission.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(submission.id) && !submissionIds.has(submission.id), '备份投稿格式不正确'); cleanFields(submission, true); assert(submission.status !== 'approved' || seen.has(submission.chipId), '备份投稿缺少已收录图鉴'); assert(!submission.chipId || seen.has(submission.chipId), '备份投稿关联不存在'); assert(typeof submission.reviewRemark === 'string' && submission.reviewRemark.length <= 300, '审核说明格式不正确'); submissionIds.add(submission.id); }
    return clone(value);
  }
  return { MARKETS, TAGS, FORMS, FOCUS_WEIGHTS, initialState, migrateState, bindIdentity, clone, user, catalog, favorites, favoriteStatus, setFavorite,
    submit, ownSubmissions, review, saveChip, setActive, switchUser, setUserRole, cleanFields, validImage, validateState };
});
