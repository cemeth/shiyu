// 言灯 - 主逻辑
// 支持语言注册表切换:切换语言时按需加载对应的数据包

'use strict';

const $ = (sel) => document.querySelector(sel);
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); }; // 空安全事件绑定(多页面:元素不在当前页时静默跳过)

// ========== 开场动画:首次打开完整播放(1.75s),同标签页内切页快速闪过(0.9s),点击可跳过 ==========
const splash = $('#splash');
if (splash) {
  const hideSplash = () => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 600); };
  let duration = 1750;
  if (sessionStorage.getItem('splash_seen')) { splash.classList.add('fast'); duration = 900; }
  else sessionStorage.setItem('splash_seen', '1');
  const splashTimer = setTimeout(hideSplash, duration);
  splash.addEventListener('click', () => { clearTimeout(splashTimer); hideSplash(); });
}

// ========== 全局状态 ==========
const PAGE = document.body.dataset.page || 'home'; // 当前页面:home / quiz / spell / review / speak / phrases / grammar / checkin
const PAGE_TITLES = { home: '背单词', quiz: '小测验', spell: '拼写', review: '复习', speak: '口语', phrases: '日常用语', grammar: '语法', checkin: '打卡' };
let lang = null;                       // 当前语言(registry 项)
const loadedCodes = new Set(['ru']);   // data-ru.js 已在 HTML 中静态加载
let learned = {};                      // { 单词键: true }
let customWords = [];                  // 用户自建单词 [{cat, ru, zh}]
let checkinDates = [];                 // ['YYYY-MM-DD']
let quizBest = null;                   // 最高测验分
let quizLog = {};                      // { 'YYYY-MM-DD': {total, correct, avgStress} } 每日测验记录
let quizWrong = [];                    // 测验/拼写做错的单词键(错词本数据)
let packId = 'base';                   // 当前词库包
let catFilter = '';                    // 当前分类筛选(胶囊)
let packOpen = false;                  // 是否已进入某个词库包(未进入时首页只显示包选择面板)
let gridOpen = false;                  // 单词列表是否展开(默认折叠,不铺开全部单词)
let newWordDates = {};                 // { 单词键: 'YYYY-MM-DD' } 首次标记「认识」的日期(生词日历数据)
let wordReview = {};                   // { 单词键: { stage, nextDue, wrong } } 艾宾浩斯复习状态
let familiar = {};                     // { 单词键: true } 认识但记得不牢的「模糊」词,复习时优先
let dailyGoal = 0;                     // 每日新词目标(0 = 未设)
let goalCelebrated = '';               // 已庆祝达成目标的日期(当天只提示一次)
let reviewLog = {};                    // { 'YYYY-MM-DD': 复习词数 } 统计图数据(从启用日起累计)
let wrongStreak = {};                  // { 单词键: 连续答对次数 } 错词智能重练:连续答对 2 次自动移出错词本
let achievements = {};                 // { 成就id: 达成日期 } 成就徽章
let curIdx = 0;                        // 当前卡片下标
let filtered = [];                     // 筛选后的单词列表
let curWord = null;                    // 当前卡片单词
let vocabOrder = 'seq';                // 浏览顺序 seq / rand
let speakRate = 1;                     // 朗读速度
let quiz = null;                       // 测验状态 {words, idx, score, wrong, opts}
let toastTimer = null;
let quoteTimer = null;                 // 概览引言轮换定时器

// localStorage 键前缀:每个语言独立保存进度
const pkey = (k) => lang.code + '_' + k;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dstr = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========== 语音朗读 ==========
function speak(text, rate, onend) {
  if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/́/g, '')); // 去掉重音符号再朗读
  u.lang = lang ? lang.speak : 'ru-RU';
  u.rate = rate || speakRate;
  if (onend) u.onend = onend; // 磨耳朵:播完自动接下一个
  const v = window.speechSynthesis.getVoices().find((x) => x.lang === u.lang);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// 所有带 data-speak 的朗读元素(句子/对话/绕口令/短语/字母示例/卡片例句)
document.addEventListener('click', (e) => {
  const b = e.target.closest('.speak-btn, .example-item');
  if (b && b.dataset.speak) { e.stopPropagation(); speak(b.dataset.speak); }
});

function toggleRate() {
  if (!$('#rate-normal')) return;
  $('#rate-normal').classList.toggle('active', speakRate === 1);
  $('#rate-slow').classList.toggle('active', speakRate !== 1);
}

// ========== 数据存取 ==========
function loadState() {
  try {
    learned = JSON.parse(localStorage.getItem(pkey('learned')) || '{}');
    customWords = JSON.parse(localStorage.getItem(pkey('custom_words')) || '[]');
    checkinDates = JSON.parse(localStorage.getItem(pkey('checkin_dates')) || '[]');
    quizBest = JSON.parse(localStorage.getItem(pkey('quiz_best')) || 'null');
    quizWrong = JSON.parse(localStorage.getItem(pkey('quiz_wrong')) || '[]');
    newWordDates = JSON.parse(localStorage.getItem(pkey('new_word_dates')) || '{}');
    wordReview = JSON.parse(localStorage.getItem(pkey('word_review')) || '{}');
    familiar = JSON.parse(localStorage.getItem(pkey('familiar')) || '{}');
    dailyGoal = parseInt(localStorage.getItem(pkey('daily_goal')) || '0', 10) || 0;
    goalCelebrated = localStorage.getItem(pkey('goal_celebrated')) || '';
    reviewLog = JSON.parse(localStorage.getItem(pkey('review_log')) || '{}');
    wrongStreak = JSON.parse(localStorage.getItem(pkey('wrong_streak')) || '{}');
    achievements = JSON.parse(localStorage.getItem(pkey('achievements')) || '{}');
    quizLog = JSON.parse(localStorage.getItem(pkey('quiz_log')) || '{}');
  } catch (e) {
    learned = {}; customWords = []; checkinDates = []; quizBest = null; quizWrong = [];
    newWordDates = {}; wordReview = {}; familiar = {}; dailyGoal = 0; goalCelebrated = ''; reviewLog = {};
    wrongStreak = {}; achievements = {}; quizLog = {};
  }
}
const saveLearned = () => localStorage.setItem(pkey('learned'), JSON.stringify(learned));
const saveCustom = () => localStorage.setItem(pkey('custom_words'), JSON.stringify(customWords));
const saveCheckin = () => localStorage.setItem(pkey('checkin_dates'), JSON.stringify(checkinDates));
const saveBest = () => localStorage.setItem(pkey('quiz_best'), JSON.stringify(quizBest));
const saveWrong = () => localStorage.setItem(pkey('quiz_wrong'), JSON.stringify(quizWrong));
const saveWordDates = () => localStorage.setItem(pkey('new_word_dates'), JSON.stringify(newWordDates));
const saveWordReview = () => localStorage.setItem(pkey('word_review'), JSON.stringify(wordReview));
const saveFamiliar = () => localStorage.setItem(pkey('familiar'), JSON.stringify(familiar));
const saveWrongStreak = () => localStorage.setItem(pkey('wrong_streak'), JSON.stringify(wrongStreak));
const saveAchievements = () => localStorage.setItem(pkey('achievements'), JSON.stringify(achievements));
const saveQuizLog = () => localStorage.setItem(pkey('quiz_log'), JSON.stringify(quizLog));

// ========== 词库包 ==========
// 每个词库包独立浏览、独立统计、独立复习
const packList = () => window.VOCAB_PACKS || [{ id: 'base', name: '基础词汇', data: 'VOCAB' }];
function packWords(id) {
  const p = packList().find((x) => x.id === id);
  const src = p ? (window[p.data] || []) : [];
  return src.map((w) => Object.assign({ pack: id }, w));
}
function allWords() { const ws = packWords(packId); return packId === 'base' ? ws.concat(customWords) : ws; }
// 词库包页签:四个包分开显示,各自独立学习
function renderPackTabs() {
  $('#pack-tabs').innerHTML = packList().map((p) => {
    const n = packWords(p.id).length + (p.id === 'base' ? customWords.length : 0);
    return '<button class="pack-tab' + (packOpen && p.id === packId ? ' active' : '') + '" data-pack="' + p.id + '">'
      + '📦 ' + p.name + '<span class="pack-count">' + n + '</span></button>';
  }).join('');
}
// 词库包选择面板:打开首页时不铺开单词,点选某个包才展开单词学习区
function renderPackGate() {
  $('#pack-gate-grid').innerHTML = packList().map((p, i) => {
    const words = packWords(p.id).concat(p.id === 'base' ? customWords : []);
    const n = words.length;
    const known = words.filter((w) => learned[wkey(w)]).length;
    const pct = n ? Math.round(known / n * 100) : 0;
    return '<button class="pack-card fade-item" style="animation-delay:' + (i * 60) + 'ms" data-pack="' + p.id + '">' +
      '<div class="pack-card-head"><span class="pack-card-name">📦 ' + p.name + '</span><span class="pack-card-count">' + n + ' 词</span></div>' +
      '<p class="pack-card-desc">' + esc(p.desc || '') + '</p>' +
      '<div class="pack-card-bar"><i style="width:' + pct + '%"></i></div>' +
      '<span class="pack-card-meta">已掌握 ' + known + ' · ' + pct + '%</span></button>';
  }).join('');
}
// 收起单词列表:进入/切换词库包时默认折叠,不铺开全部单词
function collapseGrid() {
  gridOpen = false;
  $('#word-grid-wrap').classList.remove('open');
  $('#grid-toggle-arrow').classList.remove('open');
}
// 包面板 → 学习区的交错过渡:面板先淡出上移,学习区随后淡入上滑
function revealArea() {
  const gate = $('#pack-gate');
  const area = $('#vocab-area');
  gate.classList.remove('gate-leave');
  void gate.offsetWidth;
  gate.classList.add('gate-leave');
  setTimeout(() => {
    area.hidden = false;
    area.classList.remove('area-fade');
    void area.offsetWidth; // 重新触发过渡动画
    area.classList.add('area-fade');
  }, 140);
  setTimeout(() => { gate.hidden = true; }, 320);
}
// 进入词库包:收起选择面板,平滑展开单词学习区
function enterPack(id) {
  packId = id;
  localStorage.setItem(pkey('pack'), packId);
  packOpen = true;
  revealArea();
  collapseGrid();
  $('#vocab-level').style.display = packWords(packId).some((w) => w.level) ? '' : 'none';
  renderPackTabs();
  buildCategoryChips();
  applyFilter();
  const p = packList().find((x) => x.id === packId);
  toast('进入「' + (p ? p.name : '') + '」' + (p && p.desc ? ' · ' + p.desc : ''));
}
function allPackWords() { return packList().flatMap((p) => packWords(p.id).concat(p.id === 'base' ? customWords : [])); }
// 学习进度键:基础词汇包保持旧键(兼容老用户数据),其他包加包前缀
const wkey = (w) => (w.pack && w.pack !== 'base' ? w.pack + '::' + w.ru : w.ru);
// 学习过(标记「认识」)的单词:测验和拼写都从这里出题
function learnedPool() { return allWords().filter((w) => learned[wkey(w)]); }
// 拼写答案归一化:忽略大小写和重音符号
const norm = (s) => String(s).toLowerCase().replace(/́/g, '').trim();
// 艾宾浩斯记忆曲线复习间隔(天):学习后第 1、2、4、7、15、30 天复习,共 6 轮
const INTERVALS = [1, 2, 4, 7, 15, 30];
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dstr(d); };

// ========== 背单词 ==========
// 分类图标:让每个分类一眼可辨
const CAT_EMOJI = {
  // 基础词汇
  '问候用语': '👋', '代词疑问词': '❓', '数字': '🔢', '家庭人物': '👪', '常用动词': '▶️',
  '常用名词': '📦', '形容词': '🎨', '常用短语': '💬', '颜色': '🌈', '食物饮料': '🍽️',
  '动物': '🐾', '身体': '🧍', '衣物': '👕', '星期月份': '📅', '天气季节': '⛅',
  '地点场所': '📍', '抽象概念': '💭', '进阶动词': '🚀', 'C1 词汇': '🏛️', 'C2 词汇': '👑',
  '职业': '💼', '副词': '➰', '家居物品': '🛋️', '文具学习': '📐', '交通出行': '🚗',
  '进阶形容词': '🌟', '其他常用': '🧩',
  // 高频词汇
  '高频·虚词': '⚙️', '高频·代词': '👉', '高频·动词': '🏃', '高频·名词': '🎯', '高频·形容词': '✨', '高频·副词': '🌀',
  // 易错口语
  '易错·接格': '🔗', '易错·形近词': '👯', '易错·重音': '🎵', '易错·用法': '📖',
  // 主题场景
  '场景·就医看病': '🏥', '场景·银行金融': '🏦', '场景·交通出行': '🚌', '场景·购物': '🛒',
  '场景·餐厅': '🍜', '场景·酒店住宿': '🏨', '场景·机场': '✈️', '场景·问路': '🗺️',
  '场景·工作职场': '💻', '场景·学习考试': '📝', '场景·租房住房': '🏠', '场景·运动健身': '🏋️',
  '场景·网络手机': '📱', '场景·情绪心情': '😊', '场景·时间日期': '⏰', '场景·家庭生活': '👨‍👩‍👧',
  '场景·美容理发': '💇', '场景·修理服务': '🔧', '场景·警察求助': '🚓', '场景·天气气候': '🌦️',
  '场景·衣物鞋帽': '👟', '场景·节日庆典': '🎉', '场景·自然环境': '🌲', '场景·动物宠物': '🐶',
  '场景·学校课堂': '🎓', '场景·厨房做饭': '🍳', '场景·打扫家务': '🧹', '场景·约会交友': '💑',
  '场景·邮局快递': '📮', '场景·旅游观光': '🧳',
  '自定义': '✍️',
  // 英语专属分类
  '问候': '👋', '代词': '👉', '时间': '🕰️', '易错·搭配': '🔗',
  'A2 词汇': '🟢', 'B1 词汇': '🟡', 'B2 词汇': '🟠', 'C1 词汇': '🔵', 'C2 词汇': '👑'
};
const catEmoji = (c) => CAT_EMOJI[c] || '📚';

// 分类胶囊(带词数)+ 填充添加弹窗的分类候选
function buildCategoryChips() {
  const words = allWords();
  const counts = {};
  words.forEach((w) => { counts[w.cat] = (counts[w.cat] || 0) + 1; });
  const cats = Object.keys(counts);
  $('#vocab-category').innerHTML =
    '<button class="cat-chip' + (catFilter ? '' : ' active') + '" data-cat="">📚 全部<span class="cat-chip-n">' + words.length + '</span></button>' +
    cats.map((c) =>
      '<button class="cat-chip' + (catFilter === c ? ' active' : '') + '" data-cat="' + esc(c) + '">' + catEmoji(c) + ' ' + esc(c) + '<span class="cat-chip-n">' + counts[c] + '</span></button>').join('');
  $('#add-cat-list').innerHTML = cats.map((c) => '<option value="' + esc(c) + '">').join('');
}

function applyFilter() {
  const lv = $('#vocab-level').value;
  const q = $('#vocab-search').value.trim().toLowerCase();
  filtered = allWords().filter((w) =>
    (!catFilter || w.cat === catFilter) &&
    (!lv || (w.level || '') === lv) &&
    (!q || w.ru.toLowerCase().includes(q) || w.zh.toLowerCase().includes(q)));
  if (vocabOrder === 'rand') shuffle(filtered);
  curIdx = 0;
  renderCard();
}

function updateStats() {
  const total = filtered.length;
  const n = filtered.filter((w) => learned[wkey(w)]).length;
  $('#vocab-learned-count').textContent = n;
  $('#vocab-total').textContent = total;
  $('#known-bar-fill').style.width = total ? (n / total * 100) + '%' : '0%';
  $('#stats-bar-fill').style.width = total ? (n / total * 100) + '%' : '0%';
  $('#card-progress').textContent = total ? (curIdx + 1) + ' / ' + total : '没有符合条件的单词';
  updateHero();
  updateQuizInfo();
  updateSpellInfo();
  updateStressInfo();
  renderWordGrid();
}

// 单词列表网格:当前筛选结果一目了然,点击直接跳到该卡片
function renderWordGrid() {
  $('#word-grid-title').textContent = '📋 单词列表(共 ' + filtered.length + ' 词)';
  const grid = $('#word-grid');
  if (!filtered.length) { grid.innerHTML = '<p class="no-wrong">没有符合条件的单词</p>'; return; }
  grid.innerHTML = filtered.map((w, i) => {
    const k = wkey(w);
    const ok = learned[k];
    const fuzzy = !!familiar[k];
    return '<button class="word-item' + (i === curIdx ? ' current' : '') + (ok ? (fuzzy ? ' fuzzy' : ' learned') : '') + '" data-i="' + i + '">' +
      '<span class="word-ru">' + esc(w.ru) + '</span><span class="word-zh">' + esc(w.zh) + '</span>' +
      '<span class="word-meta">' + esc(w.cat) + (w.level ? ' · ' + w.level : '') + '</span>' +
      (ok ? '<span class="word-check">' + (fuzzy ? '🤔' : '✓') + '</span>' : '') + '</button>';
  }).join('');
}

// 例句:EXAMPLES_<语言码> 按单词键匹配(优先原词,再试去重音形式);每词 2 句,点击朗读
function examplesOf(w) {
  if (!w) return [];
  const ex = window['EXAMPLES_' + lang.code.toUpperCase()] || {};
  return ex[w.ru] || ex[w.ru.toLowerCase()] || ex[norm(w.ru)] || [];
}
// 例句区 HTML(背单词卡与复习卡共用)
const exHTML = (exs) => exs.length ? '<span class="example-title">💬 例句 · 点击朗读</span>' + exs.map((e) =>
  '<button class="example-item" data-speak="' + esc(e[0]) + '">' +
  '<span class="example-ru">' + esc(e[0]) + '</span>' +
  '<span class="example-zh">' + esc(e[1]) + '</span></button>').join('') : '';
function renderCard() {
  $('#flashcard').classList.remove('flipped');
  curWord = filtered[curIdx] || null;
  if (curWord) {
    $('#card-ru').textContent = curWord.ru;
    $('#card-zh').textContent = curWord.zh;
    $('#card-cat').textContent = curWord.cat + (curWord.level ? ' · ' + curWord.level : '');
    $('#card-known-badge').hidden = !learned[wkey(curWord)];
    $('#card-note').hidden = !curWord.note;
    $('#card-note').textContent = curWord.note || '';
    // 卡片背面例句:点击朗读且不触发翻转;有例句时卡片加高,没有则保持原尺寸
    const exs = examplesOf(curWord);
    const exBox = $('#card-examples');
    if (exBox) exBox.innerHTML = exHTML(exs);
    $('#flashcard').classList.toggle('has-ex', exs.length > 0);
  } else {
    $('#card-ru').textContent = '—';
    $('#card-zh').textContent = '暂无单词';
    $('#card-cat').textContent = '';
    $('#card-known-badge').hidden = true;
    $('#card-note').hidden = true;
    $('#card-examples').innerHTML = '';
    $('#flashcard').classList.remove('has-ex');
  }
  $('#card-delete').hidden = !(curWord && customWords.includes(curWord));
  updateStats();
}

const goNext = (step) => {
  if (!filtered.length) return;
  curIdx = (curIdx + step + filtered.length) % filtered.length;
  renderCard();
};
const markKnown = () => {
  if (!curWord) return;
  const k = wkey(curWord);
  const firstTime = !learned[k];
  learned[k] = true;
  if (familiar[k]) { delete familiar[k]; saveFamiliar(); } // 认识得牢 → 取消模糊标记
  quizWrong = quizWrong.filter((x) => x !== k); // 掌握了就从错词队列移除
  if (firstTime || !wordReview[k]) {
    newWordDates[k] = dstr(new Date());                       // 生词日历:记录首次学习日期
    wordReview[k] = { stage: 0, nextDue: addDays(INTERVALS[0]), wrong: 0 }; // 第 1 次复习在明天
    saveWordDates(); saveWordReview();
  }
  saveLearned(); saveWrong();
  checkAchievements(); // 成就:标记认识词数
  goNext(1);
};
const markNew = () => {
  if (!curWord) return;
  const k = wkey(curWord);
  delete learned[k];
  delete familiar[k];
  delete newWordDates[k];
  delete wordReview[k];
  saveLearned(); saveFamiliar(); saveWordDates(); saveWordReview();
  goNext(1);
};
// 不熟悉:认识但记得不牢 → 保留已学状态,重新从第 1 轮复习,并标记「模糊」
const markFamiliar = () => {
  if (!curWord) return;
  const k = wkey(curWord);
  const firstTime = !learned[k];
  learned[k] = true;
  familiar[k] = true;
  if (firstTime || !wordReview[k]) {
    newWordDates[k] = dstr(new Date());                       // 生词日历:记录首次学习日期
    wordReview[k] = { stage: 0, nextDue: addDays(INTERVALS[0]), wrong: 0 };
    saveWordDates(); saveWordReview();
  } else {
    wordReview[k].stage = 0;                                  // 模糊 → 复习计划从头再来
    wordReview[k].nextDue = addDays(INTERVALS[0]);
    saveWordReview();
  }
  saveLearned(); saveFamiliar();
  goNext(1);
};

// 记录错词:进入错词本,并重置艾宾浩斯计划(当天复习)
function noteWrong(w) {
  const k = wkey(w);
  if (!quizWrong.includes(k)) quizWrong.push(k);
  if (wordReview[k]) {
    wordReview[k].wrong = (wordReview[k].wrong || 0) + 1;
    wordReview[k].stage = 0;
    wordReview[k].nextDue = dstr(new Date());
  } else if (learned[k]) {
    wordReview[k] = { stage: 0, nextDue: dstr(new Date()), wrong: 1 };
  }
  delete wrongStreak[k]; // 又答错了 → 错词重练进度清零
  saveWordReview(); saveWrong(); saveWrongStreak();
}

let addMode = 'single'; // 添加单词弹窗模式:single 单个添加 / bulk 批量导入
function addWordModal(show) {
  $('#add-modal').hidden = !show;
  if (show) {
    $('#add-ru').value = ''; $('#add-zh').value = '';
    $('#add-cat').value = ''; $('#add-note').value = '';
    $('#add-bulk-cat').value = ''; $('#add-bulk-text').value = '';
    setAddMode('single');
    $('#add-ru').focus();
  }
}
function setAddMode(m) {
  addMode = m;
  document.querySelectorAll('.add-mode-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
  $('#add-single-view').hidden = m !== 'single';
  $('#add-bulk-view').hidden = m !== 'bulk';
  $('#add-save').textContent = m === 'single' ? '保存并开始学习' : '一键导入';
  if (m === 'bulk') $('#add-bulk-text').focus();
}
// 解析一行:单词 | 意思 | 备注(分隔符支持 | 、Tab 或多个空格;兜底按单个空格拆)
function parseBulkLine(line) {
  const m = line.match(/^([^|\t]+?)\s*(?:[|\t]\s*|\s{2,})(.*)$/);
  if (m) {
    const rest = m[2].trim();
    const m2 = rest.match(/^(.*?)\s*(?:[|\t]\s*|\s{2,})(.*)$/);
    if (m2) return { ru: m[1].trim(), zh: m2[1].trim(), note: m2[2].trim() };
    return { ru: m[1].trim(), zh: rest, note: '' };
  }
  const sp = line.split(/\s+/);
  if (sp.length >= 2) return { ru: sp[0], zh: sp.slice(1).join(' '), note: '' };
  return { ru: line, zh: '', note: '' };
}
// 一键批量导入:每行一个单词,导入后全部自动标记「认识」并进入艾宾浩斯复习
function importBulkWords() {
  const text = $('#add-bulk-text').value.trim();
  if (!text) { toast('请先粘贴要导入的单词'); return; }
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const existing = new Set(allPackWords().map((w) => norm(w.ru)));
  const cat = $('#add-bulk-cat').value.trim() || '自定义';
  const added = [];
  let dup = 0, bad = 0;
  for (const line of lines) {
    const { ru, zh, note } = parseBulkLine(line);
    if (!ru || !zh) { bad++; continue; }
    if (existing.has(norm(ru))) { dup++; continue; }
    const w = { cat: cat, ru: ru, zh: zh };
    if (note) w.note = note;
    customWords.push(w);
    existing.add(norm(ru));
    added.push(w);
  }
  if (!added.length) {
    toast(dup || bad ? '没有新词导入(重复 ' + dup + ' 个' + (bad ? ',格式错误 ' + bad + ' 个' : '') + ')'
      : '没有识别到有效单词,请按「单词 | 意思」每行一个检查一下');
    return;
  }
  for (const w of added) {
    const k = wkey(w);
    learned[k] = true;                                            // 自动标记「认识」
    newWordDates[k] = dstr(new Date());                           // 记入生词日历
    wordReview[k] = { stage: 0, nextDue: addDays(INTERVALS[0]), wrong: 0 };
  }
  saveCustom(); saveLearned(); saveWordDates(); saveWordReview();
  addWordModal(false);
  if (PAGE === 'home') {                                          // 首页:刷新词库与卡片
    packId = 'base';                                              // 自定义词在基础词汇包
    localStorage.setItem(pkey('pack'), packId);
    if (!packOpen) {
      packOpen = true;
      revealArea();
      collapseGrid();
    }
    $('#vocab-level').style.display = '';
    renderPackTabs();
    catFilter = cat;
    $('#vocab-search').value = '';
    vocabOrder = 'seq';
    $('#vocab-order').value = 'seq';
    buildCategoryChips();
    applyFilter();
    const idx = filtered.findIndex((x) => x === added[0]);
    if (idx >= 0) { curIdx = idx; renderCard(); }
  }
  toast('一键导入 ' + added.length + ' 个单词,已开始学习 📚' + (dup ? '(跳过重复 ' + dup + ' 个)' : '') + (bad ? ',格式错误 ' + bad + ' 个已忽略' : ''));
}

// 一键添加:保存后切到基础词汇包、定位到新词、自动开始艾宾浩斯复习
function saveCustomWord() {
  const ru = $('#add-ru').value.trim();
  const zh = $('#add-zh').value.trim();
  if (!ru || !zh) { toast('单词和意思都不能为空'); return; }
  if (allPackWords().some((w) => norm(w.ru) === norm(ru))) { toast('「' + ru + '」已经存在啦'); return; }
  const cat = $('#add-cat').value.trim() || '自定义';
  const note = $('#add-note').value.trim();
  const w = { cat: cat, ru: ru, zh: zh };
  if (note) w.note = note;
  customWords.push(w);
  saveCustom();
  const k = wkey(w);
  learned[k] = true;                                            // 自动标记「认识」
  newWordDates[k] = dstr(new Date());                           // 记入生词日历
  wordReview[k] = { stage: 0, nextDue: addDays(INTERVALS[0]), wrong: 0 }; // 明天开始第 1 轮复习
  saveLearned(); saveWordDates(); saveWordReview();
  addWordModal(false);
  if (PAGE === 'home') {                                        // 首页:刷新词库与卡片
    packId = 'base';                                            // 自定义词在基础词汇包
    localStorage.setItem(pkey('pack'), packId);
    if (!packOpen) {
      packOpen = true;
      revealArea();
      collapseGrid();
    }
    $('#vocab-level').style.display = '';
    renderPackTabs();
    catFilter = cat;
    $('#vocab-search').value = '';
    vocabOrder = 'seq';
    $('#vocab-order').value = 'seq';
    buildCategoryChips();
    applyFilter();
    const idx = filtered.findIndex((x) => x === w);
    if (idx >= 0) { curIdx = idx; renderCard(); }
  }
  toast('已添加「' + ru + '」并开始学习,明天将首次复习 📚');
}

// ========== 小测验 ==========
function resetQuizUI() {
  quiz = null;
  $('#quiz-start').hidden = false;
  $('#quiz-run').hidden = true;
  $('#quiz-result').hidden = true;
  $('#quiz-best').textContent = quizBest == null ? '--' : quizBest;
}

function startQuiz() {
  const pool = learnedPool(); // 只从学习过的单词中出题
  if (pool.length < 4) { toast('学习过的单词太少,先把单词标记为「认识」再来测验吧'); return; }
  shuffle(pool);
  quiz = { words: pool.slice(0, 10), idx: 0, score: 0, wrong: [], opts: [] };
  $('#quiz-start').hidden = true;
  $('#quiz-result').hidden = true;
  $('#quiz-run').hidden = false;
  showQuizQuestion();
}

function showQuizQuestion() {
  const w = quiz.words[quiz.idx];
  $('#quiz-qnum').textContent = '第 ' + (quiz.idx + 1) + ' 题 / 共 ' + quiz.words.length + ' 题';
  $('#quiz-score').textContent = '得分:' + quiz.score;
  const dir = Math.random() < 0.5 ? 'ru' : 'zh'; // 随机方向:外→中 或 中→外
  quiz.dir = dir;
  const targetKey = dir === 'ru' ? 'zh' : 'ru';
  const others = learnedPool().filter((x) => x !== w && x[targetKey] !== w[targetKey]);
  shuffle(others);
  const opts = shuffle([w].concat(others.slice(0, 3)));
  quiz.opts = opts;
  $('#quiz-q').innerHTML = dir === 'ru'
    ? '<span class="q-ru">' + esc(w.ru) + '</span>'
    : '「' + esc(w.zh) + '」用' + lang.name + '怎么说?';
  const box = $('#quiz-opts');
  box.innerHTML = opts.map((o, i) =>
    '<button class="quiz-option fade-item" style="animation-delay:' + (i * 50) + 'ms" data-i="' + i + '"><span class="opt-label">' + 'ABCD'[i] + '</span><span>' + esc(o[targetKey]) + '</span></button>').join('');
  box.querySelectorAll('.quiz-option').forEach((btn) => btn.addEventListener('click', () => answerQuiz(opts[+btn.dataset.i])));
  $('#quiz-next').hidden = true;
}

function answerQuiz(chosen) {
  const w = quiz.words[quiz.idx];
  const correct = chosen === w;
  $('#quiz-opts').querySelectorAll('.quiz-option').forEach((b, i) => {
    b.disabled = true;
    if (quiz.opts[i] === w) b.classList.add('correct');
    else if (quiz.opts[i] === chosen) b.classList.add('wrong');
  });
  if (correct) quiz.score++; else quiz.wrong.push(w);
  $('#quiz-score').textContent = '得分:' + quiz.score;
  $('#quiz-next').hidden = false;
}

function finishQuiz() {
  $('#quiz-run').hidden = true;
  $('#quiz-result').hidden = false;
  const total = quiz.words.length, score = quiz.score;
  $('#result-score').textContent = score;
  $('#result-msg').textContent = score === total ? '满分!太棒了! 🎉'
    : score >= total * 0.8 ? '非常棒!继续保持! 💪'
    : score >= total * 0.6 ? '不错!再复习一下错题吧!'
    : '别灰心,多翻翻单词卡再来一次!';
  // 错词自动进入错词本,并回到复习第 1 轮(当天复习)
  let added = 0;
  quiz.wrong.forEach((w) => { if (!quizWrong.includes(wkey(w))) added++; noteWrong(w); });
  if (score > (quizBest || 0)) { quizBest = score; saveBest(); toast('新纪录! 🎉'); }
  else if (added) toast(added + ' 个错词已加入错词本');
  $('#quiz-best').textContent = quizBest == null ? '--' : quizBest;
  const box = $('#quiz-wrong');
  box.innerHTML = quiz.wrong.length
    ? quiz.wrong.map((w, i) =>
        '<div class="wrong-item fade-item" style="animation-delay:' + (i * 50) + 'ms"><button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button><span class="wrong-ru">' + esc(w.ru) + '</span><span class="wrong-zh">' + esc(w.zh) + '</span></div>').join('')
    : '<p class="no-wrong">全部答对,没有错题! 👏</p>';
  updateHero();
  checkAchievements(); // 成就:测验最高分
  // 记录今日测验成绩供周报使用
  const qd = dstr(new Date());
  if (!quizLog[qd]) quizLog[qd] = { total: 0, correct: 0, count: 0 };
  quizLog[qd].total += total;
  quizLog[qd].correct += score;
  quizLog[qd].count += 1;
  saveQuizLog();
}

// ========== 拼写练习(看义拼写 / 听音拼写双模式) ==========
let spell = null; // {words, idx, score, wrong}
let spellMode = 'see'; // 'see' 看义拼写 / 'listen' 听音拼写

function setSpellMode(m) {
  spellMode = m;
  $('#spell-mode-see').classList.toggle('active', m === 'see');
  $('#spell-mode-listen').classList.toggle('active', m === 'listen');
  updateSpellInfo();
}
on('#spell-mode-see', 'click', () => setSpellMode('see'));
on('#spell-mode-listen', 'click', () => setSpellMode('listen'));

function resetSpellUI() {
  spell = null;
  $('#spell-start').hidden = false;
  $('#spell-run').hidden = true;
  $('#spell-result').hidden = true;
}

function startSpell() {
  const pool = learnedPool(); // 只从学习过的单词中出题
  if (pool.length < 3) { toast('学习过的单词太少,先把单词标记为「认识」吧'); return; }
  shuffle(pool);
  spell = { words: pool.slice(0, 10), idx: 0, score: 0, wrong: [] };
  $('#spell-start').hidden = true;
  $('#spell-result').hidden = true;
  $('#spell-run').hidden = false;
  showSpellQuestion();
}

function showSpellQuestion() {
  const w = spell.words[spell.idx];
  $('#spell-qnum').textContent = '第 ' + (spell.idx + 1) + ' 题 / 共 ' + spell.words.length + ' 题';
  $('#spell-progress').textContent = (spell.idx + 1) + ' / ' + spell.words.length;
  if (spellMode === 'listen') {
    $('#spell-zh').textContent = '🎧 听发音,拼出你听到的单词';
    $('#spell-hint').textContent = '提示:重音符号 ́ 不用打;没听清点左上角 🔊 再听一遍';
    speak(w.ru); // 自动播放发音
  } else {
    $('#spell-zh').textContent = w.zh;
    $('#spell-hint').textContent = '提示:重音符号 ́ 不用打,例如 привет 也算对';
  }
  $('#spell-input').value = '';
  $('#spell-input').disabled = false;
  $('#spell-submit').disabled = false;
  $('#spell-feedback').innerHTML = '';
  $('#spell-feedback').className = 'spell-feedback';
  $('#spell-next').hidden = true;
  $('#spell-input').focus();
}

function submitSpell() {
  if (!spell) return;
  const w = spell.words[spell.idx];
  const ans = norm($('#spell-input').value);
  if (!ans) { toast('先输入答案再提交'); return; }
  const fb = $('#spell-feedback');
  if (ans === norm(w.ru)) {
    spell.score++;
    fb.className = 'spell-feedback ok';
    fb.innerHTML = '✓ 正确! <span class="spell-correct-word">' + esc(w.ru) + '</span>';
  } else {
    spell.wrong.push(w);
    fb.className = 'spell-feedback no';
    fb.innerHTML = '✗ 正确答案:<span class="spell-correct-word">' + esc(w.ru) + '</span>(' + esc(w.zh) + ')';
  }
  $('#spell-input').disabled = true;
  $('#spell-submit').disabled = true;
  $('#spell-next').hidden = false;
}

function spellNext() {
  spell.idx++;
  if (spell.idx < spell.words.length) showSpellQuestion();
  else finishSpell();
}

function finishSpell() {
  $('#spell-run').hidden = true;
  $('#spell-result').hidden = false;
  spell.wrong.forEach((w) => noteWrong(w)); // 拼错的词进入错词本
  const total = spell.words.length, score = spell.score;
  $('#spell-result-score').textContent = score;
  $('#spell-result-msg').textContent = score === total ? '满分!拼写大师! 🎉'
    : score >= total * 0.8 ? '非常棒!继续保持! 💪'
    : score >= total * 0.6 ? '不错!错词再抄写几遍吧!'
    : '别灰心,多翻翻单词卡再来一次!';
  // 记录今日拼写成绩供周报使用
  const qd = dstr(new Date());
  if (!quizLog[qd]) quizLog[qd] = { total: 0, correct: 0, count: 0 };
  quizLog[qd].total += total;
  quizLog[qd].correct += score;
  quizLog[qd].count += 1;
  saveQuizLog();
  const box = $('#spell-wrong');
  box.innerHTML = spell.wrong.length
    ? spell.wrong.map((w, i) =>
        '<div class="wrong-item fade-item" style="animation-delay:' + (i * 50) + 'ms"><button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button><span class="wrong-ru">' + esc(w.ru) + '</span><span class="wrong-zh">' + esc(w.zh) + '</span></div>').join('')
    : '<p class="no-wrong">全部拼对,没有错词! 👏</p>';
}

// ========== 重音练习(俄语专属:听音选重音位置,2026-09-04) ==========
const STRESS_VOWELS = 'аеёиоуыэюя';
const CN_ORD = '一二三四五六七八九';
let stressGame = null; // {words, idx, score, wrong}
// 重音在第几个音节(无 ́ 标记返回 0);音节数 = 元音数
const stressSyllable = (s) => {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (STRESS_VOWELS.includes(s[i].toLowerCase())) {
      count++;
      if (s[i + 1] === '́') return count;
    }
  }
  return 0;
};
const syllableCount = (s) => (norm(s).match(new RegExp('[' + STRESS_VOWELS + ']', 'gi')) || []).length;

function updateStressInfo() {
  if (!$('#stress-begin')) return;
  const pool = learnedPool().filter((w) => stressSyllable(w.ru) > 0);
  const n = pool.length;
  $('#stress-info').innerHTML = n >= 3
    ? '从你学习过的 <b>' + n + '</b> 个带重音的单词中抽 10 个练重音。'
    : '先把至少 <b>3</b> 个带重音的单词标记为「认识」,再来练重音吧。';
  $('#stress-begin').disabled = n < 3;
}
function startStress() {
  const pool = learnedPool().filter((w) => stressSyllable(w.ru) > 0);
  if (pool.length < 3) { toast('学习过的带重音单词太少,先把单词标记为「认识」吧'); return; }
  shuffle(pool);
  stressGame = { words: pool.slice(0, 10), idx: 0, score: 0, wrong: [] };
  $('#stress-start').hidden = true;
  $('#stress-result').hidden = true;
  $('#stress-run').hidden = false;
  showStressQuestion();
}
function showStressQuestion() {
  const w = stressGame.words[stressGame.idx];
  const syl = stressSyllable(w.ru);
  const total = syllableCount(w.ru);
  $('#stress-qnum').textContent = '第 ' + (stressGame.idx + 1) + ' 题 / 共 ' + stressGame.words.length + ' 题';
  $('#stress-progress').textContent = (stressGame.idx + 1) + ' / ' + stressGame.words.length;
  $('#stress-word').textContent = norm(w.ru); // 不带重音显示
  $('#stress-speak').dataset.speak = w.ru;
  $('#stress-feedback').innerHTML = '';
  $('#stress-feedback').className = 'spell-feedback';
  $('#stress-next').hidden = true;
  const opts = $('#stress-options');
  opts.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const b = document.createElement('button');
    b.className = 'stress-opt';
    b.textContent = '第 ' + CN_ORD[i - 1] + ' 音节';
    b.addEventListener('click', () => answerStress(i));
    opts.appendChild(b);
  }
  speak(w.ru); // 自动播放发音
}
function answerStress(n) {
  if (!stressGame) return;
  const w = stressGame.words[stressGame.idx];
  const right = stressSyllable(w.ru);
  const fb = $('#stress-feedback');
  $('#stress-options').querySelectorAll('.stress-opt').forEach((b) => { b.disabled = true; });
  if (n === right) {
    stressGame.score++;
    fb.className = 'spell-feedback ok';
    fb.innerHTML = '✓ 正确! <span class="spell-correct-word">' + esc(w.ru) + '</span>';
  } else {
    stressGame.wrong.push(w);
    fb.className = 'spell-feedback no';
    fb.innerHTML = '✗ 重音在第 ' + CN_ORD[right - 1] + ' 音节:<span class="spell-correct-word">' + esc(w.ru) + '</span>(' + esc(w.zh) + ')';
  }
  $('#stress-next').hidden = false;
}
function stressNext() {
  stressGame.idx++;
  if (stressGame.idx < stressGame.words.length) showStressQuestion();
  else finishStress();
}
function finishStress() {
  $('#stress-run').hidden = true;
  $('#stress-result').hidden = false;
  stressGame.wrong.forEach((w) => noteWrong(w)); // 错词进入错词本
  const total = stressGame.words.length, score = stressGame.score;
  $('#stress-result-score').textContent = score;
  $('#stress-result-msg').textContent = score === total ? '满分!重音大师! 🎉'
    : score >= total * 0.8 ? '非常棒!重音感觉越来越准了! 💪'
    : score >= total * 0.6 ? '不错!错的重音多听几遍!'
    : '别灰心,多听发音慢慢就有语感了!';
  $('#stress-wrong').innerHTML = stressGame.wrong.length
    ? stressGame.wrong.map((w, i) =>
        '<div class="wrong-item fade-item" style="animation-delay:' + (i * 50) + 'ms"><button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button><span class="wrong-ru">' + esc(w.ru) + '</span><span class="wrong-zh">' + esc(w.zh) + '</span></div>').join('')
    : '<p class="no-wrong">全部选对,没有错的重音! 👏</p>';
}
on('#stress-begin', 'click', startStress);
on('#stress-again', 'click', startStress);
on('#stress-next', 'click', stressNext);
on('#stress-speak', 'click', () => { if (stressGame) speak(stressGame.words[stressGame.idx].ru); });

// ========== 复习:艾宾浩斯计划 + 生词本 + 错词本 + 日历 ==========
let reviewIdx = 0;
let reviewWord = null;
let dueQueue = [];        // 今日到期待复习的单词
let reviewTab = 'due';    // due / newbook / wrongbook / calendar

const reviewStateOf = (w) => wordReview[wkey(w)] || null;
function mastered(w) {
  const k = wkey(w);
  if (!learned[k]) return false;
  const r = wordReview[k];
  return !r || r.stage >= INTERVALS.length; // 老数据或完成 6 轮复习视为已掌握
}
function dueWords() {
  const today = dstr(new Date());
  return allWords()
    .filter((w) => { const r = reviewStateOf(w); return r && r.stage < INTERVALS.length && r.nextDue <= today; })
    .sort((a, b) => {
      const fa = familiar[wkey(a)] ? 0 : 1;                   // 模糊词优先复习
      const fb = familiar[wkey(b)] ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return reviewStateOf(a).nextDue < reviewStateOf(b).nextDue ? -1 : 1;
    });
}

// 统计图数据:复习日志(每日复习词数,自启用起累计)
const logReview = () => {
  const today = dstr(new Date());
  reviewLog[today] = (reviewLog[today] || 0) + 1;
  localStorage.setItem(pkey('review_log'), JSON.stringify(reviewLog));
};

// 复习页总渲染:统计 + 四个子视图
function renderReviewAll() {
  if (!$('#review-due-count')) return; // 只在复习页
  dueQueue = dueWords();
  const masteredN = allWords().filter(mastered).length;
  const wrongN = allWords().filter((w) => (reviewStateOf(w)?.wrong || 0) > 0).length;
  $('#review-due-count').textContent = dueQueue.length;
  $('#review-mastered-count').textContent = masteredN;
  $('#review-wrong-count').textContent = wrongN;
  renderDueView();
  renderNewbook();
  renderWrongbook();
  renderReviewCalendars();
}

// 今日复习:艾宾浩斯到期单词
function renderDueView() {
  const total = dueQueue.length;
  $('#review-empty').hidden = total > 0;
  $('#review-run').hidden = !total;
  if (reviewIdx >= total) reviewIdx = 0;
  $('#review-card').classList.remove('flipped');
  reviewWord = dueQueue[reviewIdx] || null;
  if (reviewWord) {
    const r = reviewStateOf(reviewWord);
    $('#review-ru').textContent = reviewWord.ru;
    $('#review-zh').textContent = reviewWord.zh;
    const kk = wkey(reviewWord);
    $('#review-cat').textContent = reviewWord.cat + (reviewWord.level ? ' · ' + reviewWord.level : '') + (r ? ' · 第' + (r.stage + 1) + ' 轮复习' : '')
      + (quizWrong.includes(kk) || (r && r.wrong > 0) ? ' · 🔁 错词重练 ' + (wrongStreak[kk] || 0) + '/2' : '');
    $('#review-note').hidden = !reviewWord.note;
    $('#review-note').textContent = reviewWord.note || '';
    const exs = examplesOf(reviewWord);
    const exBox = $('#review-examples');
    if (exBox) exBox.innerHTML = exHTML(exs);
    $('#review-card').classList.toggle('has-ex', exs.length > 0);
  }
  $('#review-progress').textContent = total ? (reviewIdx + 1) + ' / ' + total : '';
}

const reviewNext = (step) => {
  if (!dueQueue.length) return;
  reviewIdx = (reviewIdx + step + dueQueue.length) % dueQueue.length;
  renderDueView();
};
const reviewKnown = () => {
  if (!reviewWord) return;
  const k = wkey(reviewWord);
  if (familiar[k]) { delete familiar[k]; saveFamiliar(); }  // 复习记住了 → 不再模糊
  const r = wordReview[k] || { stage: 0, wrong: 0 };
  r.stage++;
  if (r.stage >= INTERVALS.length) {
    r.nextDue = 'mastered';
    toast('完成全部 6 轮复习,进入「已掌握」! 🎉');
  } else {
    r.nextDue = addDays(INTERVALS[r.stage]);
    toast('记住了!下一轮 ' + INTERVALS[r.stage] + ' 天后');
  }
  wordReview[k] = r;
  saveWordReview();
  logReview(); // 统计图:每日复习数 +1
  // 错词智能重练:错词本里的词连续答对 2 次,自动移出错词本
  if (quizWrong.includes(k) || (r.wrong || 0) > 0) {
    const s = (wrongStreak[k] || 0) + 1;
    if (s >= 2) {
      r.wrong = 0;
      quizWrong = quizWrong.filter((x) => x !== k);
      delete wrongStreak[k];
      saveWrong(); saveWordReview(); saveWrongStreak();
      toast('连续答对 2 次,「' + reviewWord.ru + '」已移出错词本! 🎉');
    } else {
      wrongStreak[k] = s;
      saveWrongStreak();
      toast('记住了!错词重练 ' + s + '/2,再连续答对 1 次即移出错词本');
    }
  }
  checkAchievements(); // 成就:完成全部复习轮的词数
  const was = reviewIdx;
  renderReviewAll();
  reviewIdx = Math.min(was, dueQueue.length - 1);
  renderDueView();
};
const reviewStillNew = () => {
  if (!reviewWord) return;
  const k = wkey(reviewWord);
  const r = wordReview[k] || { stage: 0, wrong: 0 };
  r.stage = 0;                                    // 忘了 → 重置回第 1 轮
  r.wrong = (r.wrong || 0) + 1;                    // 并记入错词本
  r.nextDue = addDays(INTERVALS[0]);
  delete wrongStreak[k]; saveWrongStreak();        // 又答错 → 重练进度清零
  wordReview[k] = r;
  saveWordReview();
  logReview(); // 统计图:每日复习数 +1
  toast('没关系,已重置到第 1 轮,明天再来');
  const was = reviewIdx;
  renderReviewAll();
  reviewIdx = Math.min(was, dueQueue.length - 1);
  renderDueView();
};

// 生词本:正在学习(未完成 6 轮)的单词
function renderNewbook() {
  const list = allWords()
    .filter((w) => { const k = wkey(w); return learned[k] && newWordDates[k] && !mastered(w); })
    .sort((a, b) => (newWordDates[wkey(b)] || '').localeCompare(newWordDates[wkey(a)] || ''));
  $('#newbook-list').innerHTML = list.length
    ? list.map((w, i) => {
        const k = wkey(w);
        const r = wordReview[k] || {};
        return '<div class="book-item fade-item" style="animation-delay:' + (i * 30) + 'ms">' +
          '<button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button>' +
          '<span class="book-ru">' + esc(w.ru) + '</span><span class="book-zh">' + esc(w.zh) + '</span>' +
          (familiar[k] ? '<span class="book-fuzzy">🤔 模糊</span>' : '') +
          '<span class="book-meta">' + esc(newWordDates[k] || '') + ' 学 · 第 ' + (Math.min(r.stage || 0, INTERVALS.length) + 1) + ' 轮 · 下次 ' + esc(r.nextDue === 'mastered' ? '已掌握' : (r.nextDue || '—')) + '</span></div>';
      }).join('')
    : '<p class="no-wrong">还没有正在学习的生词,去「背单词」标记「认识」吧。</p>';
}

// 错词本:测验/拼写/复习中出错的单词
function renderWrongbook() {
  const list = allWords()
    .filter((w) => (reviewStateOf(w)?.wrong || 0) > 0)
    .sort((a, b) => (reviewStateOf(b)?.wrong || 0) - (reviewStateOf(a)?.wrong || 0));
  $('#wrongbook-list').innerHTML = list.length
    ? list.map((w, i) => {
        const r = reviewStateOf(w);
        const ws = wrongStreak[wkey(w)] || 0;
        return '<div class="book-item fade-item" style="animation-delay:' + (i * 30) + 'ms">' +
          '<button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button>' +
          '<span class="book-ru">' + esc(w.ru) + '</span><span class="book-zh">' + esc(w.zh) + '</span>' +
          '<span class="book-meta">错 ' + r.wrong + ' 次</span>' +
          (ws ? '<span class="book-retrain" title="复习时连续答对 2 次即自动移出错词本">重练中 ' + ws + '/2</span>' : '') +
          '<button class="btn btn-light btn-sm wrong-fix-btn" data-fix="' + esc(w.ru) + '">已纠正</button></div>';
      }).join('')
    : '<p class="no-wrong">太棒了,还没有错词! 🎉</p>';
}

// 生词日历 + 复习日历(最近 8 周)
function calGrid(el, counts) {
  const today = new Date();
  const todayStr = dstr(today);
  const start = new Date(today);
  start.setDate(start.getDate() - 55 - ((start.getDay() + 6) % 7));
  let html = '一二三四五六日'.split('').map((d) => '<div class="cal-head">' + d + '</div>').join('');
  for (let i = 0; i < 56; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = dstr(d);
    const cls = ['cal-cell'];
    if (counts[ds]) cls.push('has-count');
    if (ds === todayStr) cls.push('today');
    if (d > today) cls.push('future');
    html += '<div class="' + cls.join(' ') + '" title="' + ds + (counts[ds] ? ':' + counts[ds] + ' 词' : '') + '">' + d.getDate() +
      (counts[ds] ? '<span class="cal-count">' + counts[ds] + '</span>' : '') + '</div>';
  }
  el.innerHTML = html;
}

function renderReviewCalendars() {
  const newCounts = {}, dueCounts = {};
  allWords().forEach((w) => {
    const k = wkey(w);
    if (newWordDates[k]) newCounts[newWordDates[k]] = (newCounts[newWordDates[k]] || 0) + 1;
    const r = wordReview[k];
    if (r && r.nextDue !== 'mastered' && r.stage < INTERVALS.length) dueCounts[r.nextDue] = (dueCounts[r.nextDue] || 0) + 1;
  });
  calGrid($('#newword-calendar'), newCounts);
  calGrid($('#review-calendar'), dueCounts);
}

// 复习页子视图切换
function setReviewTab(name) {
  reviewTab = name;
  if (!$('#review-view-due')) return; // 只在复习页
  document.querySelectorAll('.review-tab').forEach((t) => t.classList.toggle('active', t.dataset.rtab === name));
  $('#review-view-due').hidden = name !== 'due';
  $('#review-view-newbook').hidden = name !== 'newbook';
  $('#review-view-wrongbook').hidden = name !== 'wrongbook';
  $('#review-view-calendar').hidden = name !== 'calendar';
  renderReviewAll();
}

// ========== 口语:字母表 ==========
function renderLetters() {
  const groups = window.LETTER_GROUPS;
  if (!groups) return;
  $('#letters-container').innerHTML = groups.map((g) =>
    '<div class="letter-group"><h3>' + esc(g.name) + '</h3><div class="letter-grid">' +
    g.letters.map((l, i) =>
      '<div class="letter-card fade-item" style="animation-delay:' + (i * 30) + 'ms"><div class="letter-big"><span>' + esc(l.upper) + '</span><span class="letter-lower">' + esc(l.lower) + '</span></div>' +
      '<div class="letter-info"><div class="letter-ipa">' + esc(l.ipa) + '</div><div class="letter-note">' + esc(l.note) + '</div>' +
      '<div class="letter-example"><button class="speak-btn small" data-speak="' + esc(l.example) + '" title="听发音">🔊</button><span>' + esc(l.example) + '</span></div>' +
      '</div></div>').join('') + '</div></div>').join('');
}

// ========== 口语:跟读 ==========
function renderSentences() {
  const list = window.SENTENCES || [];
  $('#sentences-container').innerHTML = list.length
    ? list.map((s, i) =>
        '<div class="sentence-item fade-item" style="animation-delay:' + (i * 40) + 'ms"><span class="s-no">' + (i + 1) + '</span>' +
        '<button class="speak-btn small" data-speak="' + esc(s.ru) + '">🔊</button>' +
        '<span class="ru">' + esc(s.ru) + '</span><span class="zh">' + esc(s.zh) + '</span></div>').join('')
    : '<p class="sub-tip">暂无跟读内容</p>';
}

function renderTwisters() {
  const list = window.TONGUE_TWISTERS || [];
  $('#twisters-container').innerHTML = list.map((t, i) =>
    '<div class="twister-card fade-item" style="animation-delay:' + (i * 60) + 'ms"><button class="speak-btn small" data-speak="' + esc(t.ru) + '">🔊</button> <span class="ru">' + esc(t.ru) + '</span>' +
    '<div class="zh">' + esc(t.zh) + '</div>' + (t.tip ? '<div class="tip">💡 ' + esc(t.tip) + '</div>' : '') + '</div>').join('');
}

function renderDialogues() {
  const list = window.DIALOGUES || [];
  $('#dialogues-container').innerHTML = list.map((d, i) =>
    '<div class="dialogue-card fade-item" style="animation-delay:' + (i * 80) + 'ms"><h4>💬 ' + esc(d.title) + '</h4>' +
    d.lines.map((l) =>
      '<div class="dialogue-line"><span class="dialogue-who">' + esc(l.who) + '</span>' +
      '<div class="dialogue-text"><button class="speak-btn small" data-speak="' + esc(l.ru) + '">🔊</button> <span class="ru">' + esc(l.ru) + '</span>' +
      '<div class="zh">' + esc(l.zh) + '</div></div></div>').join('') + '</div>').join('');
}

// ========== 日常用语 ==========
function renderPhrases() {
  const groups = window.PHRASES || [];
  const q = ($('#phrase-search').value || '').trim().toLowerCase();
  $('#phrases-container').innerHTML = groups.map((g) => {
    const items = g.items.filter((it) => !q || it.ru.toLowerCase().includes(q) || it.zh.toLowerCase().includes(q));
    if (!items.length) return '';
    return '<div class="phrase-group"><h3>' + esc(g.name) + '</h3><div class="phrase-list">' +
      items.map((it, i) =>
        '<div class="phrase-item fade-item" style="animation-delay:' + (i * 30) + 'ms"><button class="speak-btn small" data-speak="' + esc(it.ru) + '">🔊</button>' +
        '<span class="ru">' + esc(it.ru) + '</span><span class="zh">' + esc(it.zh) + '</span></div>').join('') + '</div></div>';
  }).join('') || '<p class="sub-tip">没有找到匹配的句子</p>';
}

// ========== 打卡 ==========
function calcStreak(dates) {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  if (!set.has(dstr(d))) d.setDate(d.getDate() - 1); // 今天还没打卡就从昨天算
  while (set.has(dstr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// ========== 成就徽章(打卡页徽章墙 + 任意页解锁提醒) ==========
const ACHIEVEMENTS = [
  { id: 'first', emoji: '🌱', name: '初来乍到', desc: '标记第一个单词「认识」', cond: () => Object.keys(learned).length >= 1 },
  { id: 'w50', emoji: '📗', name: '词汇新手', desc: '认识 50 个单词', cond: () => Object.keys(learned).length >= 50 },
  { id: 'w100', emoji: '📘', name: '词汇学徒', desc: '认识 100 个单词', cond: () => Object.keys(learned).length >= 100 },
  { id: 'w500', emoji: '📙', name: '词汇达人', desc: '认识 500 个单词', cond: () => Object.keys(learned).length >= 500 },
  { id: 'w1000', emoji: '📚', name: '词汇大师', desc: '认识 1000 个单词', cond: () => Object.keys(learned).length >= 1000 },
  { id: 'm100', emoji: '🎓', name: '百词精通', desc: '100 个单词完成全部 6 轮复习', cond: () => Object.keys(learned).filter((k) => wordReview[k] && wordReview[k].stage >= INTERVALS.length).length >= 100 },
  { id: 's7', emoji: '🔥', name: '坚持一周', desc: '连续打卡 7 天', cond: () => calcStreak(checkinDates) >= 7 },
  { id: 's30', emoji: '☀️', name: '坚持一月', desc: '连续打卡 30 天', cond: () => calcStreak(checkinDates) >= 30 },
  { id: 'q8', emoji: '💪', name: '测验高手', desc: '小测验最高分达到 8 分', cond: () => quizBest != null && quizBest >= 8 },
  { id: 'q10', emoji: '🏆', name: '测验满分', desc: '小测验答对全部 10 题', cond: () => quizBest != null && quizBest >= 10 },
  { id: 'g1', emoji: '🎯', name: '目标达成', desc: '完成一次每日学习目标', cond: () => !!goalCelebrated },
];
// 检查并解锁新成就(状态写入 + toast 提醒;徽章墙渲染见 renderAchievements)
function checkAchievements() {
  const newGot = [];
  ACHIEVEMENTS.forEach((a) => {
    if (achievements[a.id] || !a.cond()) return;
    achievements[a.id] = dstr(new Date());
    newGot.push(a);
  });
  if (!newGot.length) return;
  saveAchievements();
  toast(newGot.length === 1
    ? '🎉 解锁成就:' + newGot[0].emoji + ' ' + newGot[0].name
    : '🎉 一次解锁 ' + newGot.length + ' 个成就:' + newGot.map((a) => a.emoji).join(''));
  if (PAGE === 'checkin') renderAchievements();
}
// 徽章墙(打卡页):已达成彩色高亮,未达成灰色锁定
function renderAchievements() {
  const el = $('#achievement-grid');
  if (!el) return;
  const earned = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;
  $('#achievement-count').textContent = earned + ' / ' + ACHIEVEMENTS.length;
  el.innerHTML = ACHIEVEMENTS.map((a, i) => {
    const got = achievements[a.id];
    return '<div class="badge' + (got ? ' earned' : '') + ' fade-item" style="animation-delay:' + (i * 40) + 'ms" title="' +
      esc(a.desc) + (got ? '(达成于 ' + got + ')' : '(未达成)') + '">' +
      '<div class="badge-emoji">' + a.emoji + '</div>' +
      '<div class="badge-name">' + a.name + '</div>' +
      '<div class="badge-desc">' + esc(a.desc) + '</div></div>';
  }).join('');
}

function renderCheckin() {
  const streak = calcStreak(checkinDates);
  animateNum($('#streak-days'), streak, 600);
  $('#checkin-total').textContent = checkinDates.length;
  const today = new Date();
  const todayStr = dstr(today);
  const done = checkinDates.includes(todayStr);
  const btn = $('#checkin-btn');
  btn.disabled = done;
  btn.classList.toggle('checked', done);
  btn.classList.toggle('pulse', !done && streak >= 3);
  btn.textContent = done ? '今日已打卡 ✓' : '今日打卡';
  // 激励文案
  const msgs = [
    [0, '开始你的第一天,迈出第一步!'],
    [1, '第一天完成!继续保持!'],
    [2, '两天了,习惯在形成中…'],
    [3, '三日打勾,初具恒心!'],
    [4, '一周只剩 3 天,加油!'],
    [5, '坚持 5 天,你很可靠。'],
    [6, '距离一周还差 1 天!'],
    [7, '连续一周!你就是最棒的!'],
    [14, '两周达成!了不起的坚持。'],
    [30, '一月坚持!你已超越多数人。'],
    [100, '一百天!你是真正的学习者。'],
  ];
  let msg = msgs[0][1];
  for (const [n, m] of msgs) { if (streak >= n) msg = m; }
  $('#checkin-msg').textContent = done ? '今天已经打过卡啦,明天继续! 🔥' : msg;
  // 里程碑高亮
  document.querySelectorAll('.milestone').forEach((el) => {
    el.classList.toggle('reached', streak >= parseInt(el.dataset.target));
  });
  // 月度进度环
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const dayOfMonth = today.getDate();
  const monthLearned = checkinDates.filter((d) => {
    const parts = d.split('-');
    return parseInt(parts[0]) === today.getFullYear() && parseInt(parts[1]) === (today.getMonth() + 1);
  }).length;
  const pct = Math.min(monthLearned / Math.max(dayOfMonth, 1), 1);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - pct);
  $('#ring-fill').setAttribute('stroke-dashoffset', circumference - offset);
  animateNum($('#ring-num'), monthLearned, 500);
  // 本月新学/已掌握/待复习
  const masteredCount = Object.keys(learned).filter((k) => wordReview[k] && wordReview[k].stage >= INTERVALS.length).length;
  const dueCount = Object.keys(wordReview).filter((k) => {
    const r = wordReview[k];
    return r && r.nextDue && r.nextDue <= todayStr;
  }).length;
  $('#month-new').textContent = monthLearned;
  $('#month-mastered').textContent = masteredCount;
  $('#month-due').textContent = dueCount;
  // 日历:最近 8 周,从周一开始
  const set = new Set(checkinDates);
  const start = new Date(today);
  start.setDate(start.getDate() - 55 - ((start.getDay() + 6) % 7));
  let html = '一二三四五六日'.split('').map((d) => '<div class="cal-head">' + d + '</div>').join('');
  for (let i = 0; i < 56; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = dstr(d);
    const cls = ['cal-cell'];
    if (set.has(ds)) cls.push('checked');
    if (ds === todayStr) cls.push('today');
    if (d > today) cls.push('future');
    html += '<div class="' + cls.join(' ') + '" title="' + ds + '">' + d.getDate() + '</div>';
  }
  $('#calendar').innerHTML = html;
  renderStats(); // 学习统计趋势图
  renderAchievements(); // 成就徽章墙
  renderWeeklyReport(); // 周报
  updateHero();
}

// ========== 主题(6 套配色 × 深/浅) ==========
const THEMES = [
  { id: 'plain', name: '素白', c1: '#5b6b7f', c2: '#8a99ad' },
  { id: 'haze', name: '雾霾蓝', c1: '#6b7f9e', c2: '#8fa3bd' },
  { id: 'pine', name: '墨绿', c1: '#4d7c6f', c2: '#7a9e90' },
  { id: 'latte', name: '奶咖', c1: '#a68b6b', c2: '#c0a988' },
  { id: 'graphite', name: '石墨灰', c1: '#4b5563', c2: '#6b7280' },
  { id: 'mauve', name: '雾紫', c1: '#7d7a9e', c2: '#9d9ab8' },
];
const curTheme = THEMES.some((t) => t.id === localStorage.getItem('site_accent'))
  ? localStorage.getItem('site_accent') : 'plain';

function applyAccent(id) {
  document.body.dataset.accent = THEMES.some((t) => t.id === id) ? id : 'plain';
  localStorage.setItem('site_accent', document.body.dataset.accent);
  document.querySelectorAll('.theme-swatch').forEach((el) =>
    el.classList.toggle('active', el.dataset.id === document.body.dataset.accent));
}

function renderDarkBtn() {
  const dark = document.body.classList.contains('dark');
  $('#theme-dark-btn').textContent = dark ? '深色模式: 开' : '深色模式: 关';
}

const LAYOUTS = [
  { id: 'tech',    name: '科技风', desc: '当前默认 · 简约几何' },
  { id: 'editorial', name: '编辑风', desc: '大留白 · 衬线标题' },
  { id: 'compact',   name: '紧凑风', desc: '高信息密度 · 工具感' },
  { id: 'warm',      name: '温暖风', desc: '纸质感 · 学术气质' },
];
const curLayout = localStorage.getItem('site_layout') || 'tech';

function applyLayout(id) {
  document.body.dataset.layout = LAYOUTS.some((l) => l.id === id) ? id : 'tech';
  localStorage.setItem('site_layout', document.body.dataset.layout);
  document.querySelectorAll('.layout-swatch').forEach((el) =>
    el.classList.toggle('active', el.dataset.id === document.body.dataset.layout));
}

function initLayout() {
  applyLayout(curLayout);
  $('#layout-swatches').innerHTML = LAYOUTS.map((l) =>
    '<button class="layout-swatch' + (l.id === curLayout ? ' active' : '') + '" data-id="' + l.id + '" title="' + l.desc + '">' +
    '<span class="layout-swatch-name">' + l.name + '</span>' +
    '<span class="layout-swatch-desc">' + l.desc + '</span></button>').join('');
}

function initTheme() {
  const saved = localStorage.getItem('site_theme');
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', dark);
  renderDarkBtn();
  $('#theme-swatches').innerHTML = THEMES.map((t) =>
    '<button class="theme-swatch' + (t.id === curTheme ? ' active' : '') + '" data-id="' + t.id + '" title="' + t.name + '">' +
    '<span class="theme-swatch-dot" style="background:linear-gradient(135deg,' + t.c1 + ',' + t.c2 + ')"></span>' +
    '<span class="theme-swatch-name">' + t.name + '</span></button>').join('');
  applyAccent(curTheme);
  initLayout();
}
on('#theme-toggle', 'click', (e) => {
  e.stopPropagation();
  $('#theme-panel').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!$('#theme-panel').contains(e.target)) $('#theme-panel').classList.remove('open');
});
on('#theme-swatches', 'click', (e) => {
  const btn = e.target.closest('.theme-swatch');
  if (btn) applyAccent(btn.dataset.id);
});
on('#layout-swatches', 'click', (e) => {
  const btn = e.target.closest('.layout-swatch');
  if (btn) applyLayout(btn.dataset.id);
});
on('#theme-dark-btn', 'click', () => {
  const dark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('site_theme', dark ? 'dark' : 'light');
  renderDarkBtn();
});

// ========== 首页概览 ==========
function updateHero() {
  if (!$('#hero-greet')) return; // 只在首页有概览看板
  const h = new Date().getHours();
  $('#hero-greet').textContent = (h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好') + '!';
  const d = new Date();
  $('#hero-date').textContent = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + '日一二三四五六'[d.getDay()];
  $('#hero-streak').textContent = calcStreak(checkinDates);
  const all = allPackWords();
  const learnedCount = all.filter((w) => learned[wkey(w)]).length;
  // 数字递增动画
  animateNum($('#hero-learned'), learnedCount, 600);
  animateNum($('#hero-best'), quizBest, 600);
  // learned 显示格式特殊: "N / TOTAL"
  setTimeout(() => {
    if ($('#hero-learned')) $('#hero-learned').textContent = learnedCount + ' / ' + all.length;
  }, 620);
  updateGoalUI(); // 每日目标卡片(含达成检测)
  renderDailyWord(); // 每日一词(按日期+语言确定,当天不变)
}

// ========== 每日一词:按日期确定每天一个词,各语言独立 ==========
const dailyWordOf = () => {
  const all = allPackWords();
  if (!all.length) return null;
  const seed = lang.code + '_' + dstr(new Date());
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return all[h % all.length];
};
function renderDailyWord() {
  if (!$('#daily-word-ru')) return; // 每日一词卡片只在首页
  const w = dailyWordOf();
  const now = new Date();
  $('#daily-word-date').textContent = (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 每天一个新词';
  const k = wkey(w);
  const isKnown = !!learned[k];
  $('#daily-word-ru').textContent = w.ru;
  $('#daily-word-zh').textContent = w.zh;
  $('#daily-word-meta').innerHTML =
    '<span class="cat-tag">' + esc(w.cat) + '</span>' +
    (w.level ? '<span class="cat-tag">' + esc(w.level) + '</span>' : '') +
    (w.note ? '<span class="daily-word-note">' + esc(w.note) + '</span>' : '');
  $('#daily-word-speak').dataset.speak = w.ru;
  $('#daily-word-ex').innerHTML = exHTML(examplesOf(w));
  const btn = $('#daily-word-known');
  btn.classList.toggle('done', isKnown);
  btn.disabled = isKnown;
}
const markDailyWord = () => {
  const w = dailyWordOf();
  if (!w) return;
  const k = wkey(w);
  learned[k] = true;
  if (familiar[k]) { delete familiar[k]; saveFamiliar(); }
  quizWrong = quizWrong.filter((x) => x !== k);
  if (!wordReview[k]) {
    newWordDates[k] = dstr(new Date());                       // 生词日历:记录首次学习日期
    wordReview[k] = { stage: 0, nextDue: addDays(INTERVALS[0]), wrong: 0 };
    saveWordDates(); saveWordReview();
  }
  saveLearned(); saveWrong();
  renderDailyWord();
  updateHero();
  toast('✨ 已加入学习计划,明天起开始复习');
};
on('#daily-word-known', 'click', markDailyWord);

// ========== 每日学习目标 ==========
const todayLearnedCount = () => {
  const today = dstr(new Date());
  return Object.values(newWordDates).filter((x) => x === today).length;
};
function updateGoalUI() {
  const card = $('#hero-goal');
  if (!card) return; // 目标卡片只在首页
  const n = todayLearnedCount();
  if (dailyGoal > 0) {
    const pct = Math.min(100, Math.round(n / dailyGoal * 100));
    $('#goal-num').textContent = n + ' / ' + dailyGoal;
    $('#goal-label').textContent = '🎯 今日新词目标';
    $('#goal-bar-fill').style.width = pct + '%';
    card.classList.toggle('goal-done', n >= dailyGoal);
  } else {
    $('#goal-num').textContent = '--';
    $('#goal-label').textContent = '🎯 设个每日目标';
    $('#goal-bar-fill').style.width = '0%';
    card.classList.remove('goal-done');
  }
  // 达成检测:当天第一次达成时庆祝一次
  if (dailyGoal > 0 && n >= dailyGoal && goalCelebrated !== dstr(new Date())) {
    goalCelebrated = dstr(new Date());
    localStorage.setItem(pkey('goal_celebrated'), goalCelebrated);
    toast('🎉 今日目标达成!已学 ' + n + ' 个新词,超额完成 ' + (n - dailyGoal) + ' 个!');
    checkAchievements(); // 成就:目标达成
  }
}
function openGoalModal() {
  $('#goal-input').value = dailyGoal || '';
  $('#goal-modal').hidden = false;
  $('#goal-input').focus();
}
function rotateQuote() {
  const list = window.SENTENCES || [];
  if (!list.length) return;
  const s = list[Math.floor(Math.random() * list.length)];
  const box = $('#hero-quote');
  box.classList.remove('quote-fade');
  void box.offsetWidth; // 重新触发动画
  box.classList.add('quote-fade');
  $('#hero-quote-ru').textContent = s.ru;
  $('#hero-quote-zh').textContent = '— ' + s.zh;
}

// ========== 测验 / 拼写信息 ==========
function updateQuizInfo() {
  if (!$('#quiz-info')) return;
  const n = learnedPool().length;
  $('#quiz-info').innerHTML = n >= 4
    ? '测验从你学习过的 <b>' + n + '</b> 个单词中随机抽 10 题。'
    : '先把至少 <b>4</b> 个单词标记为「认识」,再来测验吧。';
  $('#quiz-begin').disabled = n < 4;
}
function updateSpellInfo() {
  if (!$('#spell-info')) return;
  const n = learnedPool().length;
  const text = spellMode === 'listen'
    ? '听单词发音,拼出你听到的词。同样从你学习过的 <b>' + n + '</b> 个单词中随机抽 10 题。'
    : '从你学习过的 <b>' + n + '</b> 个单词中随机抽 10 题进行拼写。';
  $('#spell-info').innerHTML = n >= 3
    ? text
    : '先把至少 <b>3</b> 个单词标记为「认识」,再来拼写吧。';
  $('#spell-begin').disabled = n < 3;
}

// ========== 语言切换 ==========
function initLangSelect() {
  const sel = $('#lang-select');
  sel.innerHTML = window.LANGS.map((l) => '<option value="' + l.code + '">' + l.flag + ' ' + l.name + '</option>').join('');
  sel.value = localStorage.getItem('lang_code') || 'ru'; // 跨页面记住上次选择的语言
  sel.addEventListener('change', () => switchLang(sel.value));
}

let dataOwner = 'ru'; // 当前全局数据属于哪个语言(各语言数据文件共用同名 window 变量,动态加载会覆盖)
function switchLang(code) {
  const target = window.LANGS.find((l) => l.code === code);
  if (!target || target === lang) return;
  localStorage.setItem('lang_code', code); // 跳转其他页面时保持语言
  if (loadedCodes.has(code) && dataOwner === code) { initAll(target); return; }
  const s = document.createElement('script');
  s.src = target.file;
  s.onload = () => { loadedCodes.add(code); dataOwner = code; initAll(target); };
  s.onerror = () => { toast('加载' + target.name + '学习包失败,请检查 ' + target.file + ' 是否存在'); $('#lang-select').value = lang ? lang.code : 'ru'; };
  document.body.appendChild(s);
}

// 每个页面只渲染自己的模块
function initAll(newLang, quiet) {
  lang = newLang;
  document.title = lang.name + '学习助手 · ' + (PAGE_TITLES[PAGE] || '');
  loadState(); // 每个语言独立的进度
  // 当前词库包(各页共用的上下文:测验/拼写/复习都按当前包统计)
  packId = localStorage.getItem(pkey('pack')) || 'base';
  if (!packList().some((p) => p.id === packId)) packId = 'base';
  // 语法入口:该语言没有语法内容时隐藏导航链接
  const gLink = document.querySelector('.tab[data-tab="grammar"]');
  if (gLink) gLink.style.display = lang.hasGrammar ? '' : 'none';
  // 俄语专属模块(重音练习等):其他语言自动隐藏
  document.querySelectorAll('[data-ru-only]').forEach((el) => { el.style.display = lang.code === 'ru' ? '' : 'none'; });

  if (PAGE === 'home') {
    packOpen = false; // 打开首页先看词库包选择面板,点入包才展开单词
    renderPackTabs();
    renderPackGate();
    $('#pack-gate').hidden = false;
    $('#vocab-area').hidden = true;
    // 未进入词库包时,统计显示全部词库的汇总
    const all = allPackWords();
    const knownAll = all.filter((w) => learned[wkey(w)]).length;
    $('#vocab-learned-count').textContent = knownAll;
    $('#vocab-total').textContent = all.length;
    $('#stats-bar-fill').style.width = all.length ? (knownAll / all.length * 100) + '%' : '0%';
    updateHero();
    rotateQuote();
    clearInterval(quoteTimer);
    quoteTimer = setInterval(rotateQuote, 6000);
  } else if (PAGE === 'quiz') {
    resetQuizUI();
    updateQuizInfo();
  } else if (PAGE === 'spell') {
    resetSpellUI();
    updateSpellInfo();
  } else if (PAGE === 'review') {
    reviewIdx = 0;
    setReviewTab(reviewTab); // 复习四视图
  } else if (PAGE === 'speak') {
    $('#speak-letters').hidden = !window.LETTER_GROUPS;
    $('#speak-twisters').hidden = !(window.TONGUE_TWISTERS && window.TONGUE_TWISTERS.length);
    $('#speak-dialogues').hidden = !(window.DIALOGUES && window.DIALOGUES.length);
    renderLetters();
    renderSentences();
    renderTwisters();
    renderDialogues();
    toggleRate();
    updateStressInfo(); // 重音练习(俄语专属,其他语言整块隐藏)
  } else if (PAGE === 'phrases') {
    renderPhrases();
  } else if (PAGE === 'checkin') {
    renderCheckin();
  }
  checkAchievements(); // 启动/切语言时兜底检查(如导入数据后)
  if (!quiet) toast('已切换到 ' + lang.name + ' ' + lang.flag);
}

// ========== 事件绑定 ==========
on('#flashcard', 'click', (e) => {
  if (e.target.closest('.speak-btn') || e.target.closest('.delete-btn') || e.target.closest('.example-item')) return;
  if (curWord) $('#flashcard').classList.toggle('flipped');
});
on('#card-speak', 'click', () => { if (curWord) speak(curWord.ru); });
on('#card-prev', 'click', () => goNext(-1));
on('#card-next', 'click', () => goNext(1));
on('#card-known', 'click', markKnown);
on('#card-new', 'click', markNew);
on('#card-familiar', 'click', markFamiliar);
on('#card-delete', 'click', () => {
  if (!curWord) return;
  const k = wkey(curWord);
  customWords = customWords.filter((w) => w !== curWord);
  quizWrong = quizWrong.filter((x) => x !== k);
  delete newWordDates[k];
  delete wordReview[k];
  saveCustom();
  saveWrong();
  saveWordDates();
  saveWordReview();
  if (catFilter && !allWords().some((x) => x.cat === catFilter)) catFilter = '';
  buildCategoryChips();
  applyFilter();
  toast('已删除该单词');
});
// 分类胶囊点击筛选
on('#vocab-category', 'click', (e) => {
  const b = e.target.closest('.cat-chip');
  if (!b) return;
  catFilter = b.dataset.cat;
  buildCategoryChips();
  applyFilter();
});
// 单词列表折叠切换:默认收起,点标题行展开 / 收起
on('#word-grid-toggle', 'click', () => {
  gridOpen = !gridOpen;
  $('#word-grid-wrap').classList.toggle('open', gridOpen);
  $('#grid-toggle-arrow').classList.toggle('open', gridOpen);
});
// 单词列表网格:点击跳到对应卡片
on('#word-grid', 'click', (e) => {
  const b = e.target.closest('.word-item');
  if (!b) return;
  curIdx = +b.dataset.i;
  renderCard();
  $('#flashcard').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
on('#vocab-level', 'change', applyFilter);
on('#vocab-search', 'input', applyFilter);
on('#vocab-order', 'change', (e) => { vocabOrder = e.target.value; applyFilter(); });

// 词库包页签切换(未进入时点击 = 进入该包)
on('#pack-tabs', 'click', (e) => {
  const b = e.target.closest('.pack-tab');
  if (!b) return;
  if (!packOpen) { enterPack(b.dataset.pack); return; }
  if (b.dataset.pack === packId) return;
  packId = b.dataset.pack;
  localStorage.setItem(pkey('pack'), packId);
  $('#vocab-level').style.display = packWords(packId).some((w) => w.level) ? '' : 'none';
  catFilter = '';
  $('#vocab-search').value = '';
  vocabOrder = 'seq';
  $('#vocab-order').value = 'seq';
  renderPackTabs();
  buildCategoryChips();
  applyFilter();
  collapseGrid(); // 切包时列表回到折叠态
  const area = $('#vocab-area'); // 切包时平滑过渡
  area.classList.remove('area-fade');
  void area.offsetWidth;
  area.classList.add('area-fade');
  updateQuizInfo();
  updateSpellInfo();
  const p = packList().find((x) => x.id === packId);
  toast('已切换到「' + (p ? p.name : '') + '」' + (p && p.desc ? ' · ' + p.desc : ''));
});
// 词库包选择面板点击进入
on('#pack-gate', 'click', (e) => {
  const b = e.target.closest('.pack-card');
  if (b) enterPack(b.dataset.pack);
});

// 复习页子视图切换
document.querySelectorAll('.review-tab').forEach((t) => t.addEventListener('click', () => setReviewTab(t.dataset.rtab)));

// 错词本「已纠正」按钮(事件委托)
document.addEventListener('click', (e) => {
  const b = e.target.closest('.wrong-fix-btn');
  if (b && b.dataset.fix) {
    const w = allWords().find((x) => x.ru === b.dataset.fix);
    if (w) {
      const k = wkey(w);
      if (wordReview[k]) wordReview[k].wrong = 0;
      quizWrong = quizWrong.filter((x) => x !== k);
      delete wrongStreak[k];
      saveWordReview(); saveWrong(); saveWrongStreak();
      renderReviewAll();
      toast('已纠正「' + w.ru + '」');
    }
  }
});

on('#vocab-add-btn', 'click', () => addWordModal(true));
on('#fab-add', 'click', () => addWordModal(true));
on('#add-cancel', 'click', () => addWordModal(false));
document.querySelectorAll('.add-mode-tab').forEach((t) => t.addEventListener('click', () => setAddMode(t.dataset.mode)));
on('#add-save', 'click', () => { if (addMode === 'bulk') importBulkWords(); else saveCustomWord(); });
// 弹窗内回车直接保存(批量导入文本框里回车是换行,不触发)
const saveFromModal = () => { if (addMode === 'bulk') importBulkWords(); else saveCustomWord(); };
['#add-ru', '#add-zh', '#add-cat', '#add-note', '#add-bulk-cat'].forEach((s) =>
  on(s, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveFromModal(); } }));

on('#quiz-begin', 'click', startQuiz);
on('#spell-begin', 'click', startSpell);
on('#spell-submit', 'click', submitSpell);
on('#spell-input', 'keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!$('#spell-next').hidden) spellNext(); else submitSpell();
  }
});
on('#spell-next', 'click', spellNext);
on('#spell-again', 'click', startSpell);
on('#spell-speak', 'click', () => { if (spell) speak(spell.words[spell.idx].ru); });
on('#review-card', 'click', (e) => {
  if (e.target.closest('.speak-btn, .example-item')) return;
  if (reviewWord) $('#review-card').classList.toggle('flipped');
});
on('#review-speak', 'click', () => { if (reviewWord) speak(reviewWord.ru); });
on('#review-prev', 'click', () => reviewNext(-1));
on('#review-next', 'click', () => reviewNext(1));
on('#review-known', 'click', reviewKnown);
on('#review-new', 'click', reviewStillNew);
on('#quiz-next', 'click', () => {
  quiz.idx++;
  if (quiz.idx < quiz.words.length) showQuizQuestion(); else finishQuiz();
});
on('#quiz-again', 'click', startQuiz);

on('#rate-normal', 'click', () => { speakRate = 1; toggleRate(); });
on('#rate-slow', 'click', () => { speakRate = 0.7; toggleRate(); });
on('#phrase-search', 'input', renderPhrases);
on('#checkin-btn', 'click', () => {
  const ds = dstr(new Date());
  if (!checkinDates.includes(ds)) { checkinDates.push(ds); saveCheckin(); renderCheckin(); toast('打卡成功!今天也努力了 💪'); checkAchievements(); } // 成就:连续打卡
});

// ===== 新功能事件绑定:查词 / 每日目标 / 导出导入 =====
on('#search-btn', 'click', openSearch);
on('#search-input', 'input', renderSearchResults);
on('#search-close', 'click', () => { $('#search-modal').hidden = true; });
on('#hero-goal', 'click', openGoalModal);
on('#goal-cancel', 'click', () => { $('#goal-modal').hidden = true; });
on('#goal-save', 'click', () => {
  const v = parseInt($('#goal-input').value, 10);
  if (isNaN(v) || v < 0) { toast('请输入有效的数字(0 表示不设目标)'); return; }
  const changed = v !== dailyGoal;
  dailyGoal = v;
  localStorage.setItem(pkey('daily_goal'), String(v));
  if (v > 0 && changed) goalCelebrated = ''; // 目标真的变了才重置当天庆祝
  $('#goal-modal').hidden = true;
  updateGoalUI();
  toast(v > 0 ? '每日目标已设为 ' + v + ' 个新词 🎯' : '已取消每日目标');
});
on('#goal-input', 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#goal-save').click(); } });
// Esc 关闭弹窗(查词 / 添加单词 / 目标)
// ========== 磨耳朵:单词列表自动连续朗读(2026-09-04) ==========
let ear = null; // {list, idx, playing, timer}
const earList = () => {
  let list = allPackWords();
  const pool = $('#ear-pool').value;
  if (pool === 'known') list = list.filter((w) => learned[wkey(w)]);
  if (pool === 'new') list = list.filter((w) => !learned[wkey(w)]);
  if ($('#ear-order').value === 'shuffle') shuffle(list);
  return list;
};
function openEar() {
  $('#ear-modal').hidden = false;
  ear = { list: earList(), idx: 0, playing: false, timer: null };
  $('#ear-ru').textContent = '—';
  $('#ear-zh').textContent = '';
  $('#ear-progress').textContent = '0 / ' + ear.list.length;
  $('#ear-toggle').textContent = '▶ 开始';
}
function closeEar() {
  if (ear && ear.timer) { clearTimeout(ear.timer); ear.timer = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  ear = null;
  $('#ear-modal').hidden = true;
}
function earPlay() {
  if (!ear) return;
  const list = ear.list;
  if (!list.length) { toast('没有符合条件的单词'); return; }
  if (ear.idx >= list.length) { // 一轮播完,重新开始
    if ($('#ear-order').value === 'shuffle') shuffle(list);
    ear.idx = 0;
  }
  if (ear.timer) { clearTimeout(ear.timer); ear.timer = null; }
  ear.playing = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // 旧 onend 触发时 playing=false 直接返回
  ear.playing = true;
  const w = list[ear.idx];
  $('#ear-ru').textContent = w.ru;
  $('#ear-zh').textContent = w.zh;
  $('#ear-progress').textContent = (ear.idx + 1) + ' / ' + list.length;
  $('#ear-toggle').textContent = '⏸ 暂停';
  speak(w.ru, speakRate, () => {
    if (!ear || !ear.playing) return;
    ear.timer = setTimeout(() => { ear.idx++; earPlay(); }, parseInt($('#ear-gap').value, 10));
  });
}
function earPause() {
  if (!ear) return;
  if (ear.timer) { clearTimeout(ear.timer); ear.timer = null; }
  ear.playing = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  $('#ear-toggle').textContent = '▶ 继续';
}
function earToggle() { if (ear) { ear.playing ? earPause() : earPlay(); } }
function earNext() {
  if (!ear || !ear.list.length) return;
  if (ear.timer) { clearTimeout(ear.timer); ear.timer = null; }
  ear.idx++;
  if (ear.idx >= ear.list.length) { toast('已到最后一个,再播一遍'); ear.idx = 0; }
  earPlay();
}
on('#ear-open', 'click', openEar);
on('#ear-toggle', 'click', earToggle);
on('#ear-next', 'click', earNext);
on('#ear-close', 'click', closeEar);

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  ['#search-modal', '#add-modal', '#goal-modal'].forEach((s) => { const m = $(s); if (m && !m.hidden) m.hidden = true; });
  const em = $('#ear-modal');
  if (em && !em.hidden) closeEar();
});
on('#export-btn', 'click', (e) => { e.preventDefault(); exportData(); });
on('#import-btn', 'click', (e) => { e.preventDefault(); $('#import-file').click(); });
on('#import-file', 'change', (e) => {
  const f = e.target.files[0];
  if (f) importData(f);
  e.target.value = ''; // 允许重复选择同一文件
});

// ========== 全局查词搜索 ==========
// 在当前语言全部词库包(含自定义词)中查词,最多显示 20 条
function searchWords(q) {
  const s = norm(q);
  if (!s) return [];
  return allPackWords().filter((w) => norm(w.ru).includes(s) || norm(w.zh).includes(s)).slice(0, 20);
}
function openSearch() {
  $('#search-modal').hidden = false;
  $('#search-input').value = '';
  $('#search-results').innerHTML = '<p class="no-wrong">输入单词或中文意思开始搜索</p>';
  $('#search-input').focus();
}
function renderSearchResults() {
  const q = $('#search-input').value.trim();
  const box = $('#search-results');
  if (!q) { box.innerHTML = '<p class="no-wrong">输入单词或中文意思开始搜索</p>'; return; }
  const list = searchWords(q);
  if (!list.length) { box.innerHTML = '<p class="no-wrong">没有找到「' + esc(q) + '」,试试其他拼写</p>'; return; }
  box.innerHTML = list.map((w, i) => {
    const k = wkey(w);
    const st = learned[k]
      ? (mastered(w) ? '<span class="s-state s-mastered">✓ 已掌握</span>' : '<span class="s-state s-learning">📖 学习中</span>')
      : '';
    const exs = examplesOf(w);
    const ex = exs.length ? exs[0] : null;
    return '<div class="search-item fade-item" style="animation-delay:' + (i * 25) + 'ms">' +
      '<button class="speak-btn small" data-speak="' + esc(w.ru) + '">🔊</button>' +
      '<span class="search-ru">' + esc(w.ru) + '</span><span class="search-zh">' + esc(w.zh) + '</span>' +
      '<span class="search-meta">' + esc(w.cat) + (w.level ? ' · ' + w.level : '') + '</span>' + st +
      (ex ? '<span class="search-ex"><span class="search-ex-ru">' + esc(ex[0]) + '</span><span class="search-ex-zh">' + esc(ex[1]) + '</span></span>' : '') +
      '</div>';
  }).join('') + '<p class="search-count">找到 ' + list.length + ' 个' + (list.length === 20 ? '(最多显示 20 个,输得更精确可缩小范围)' : '') + '</p>';
}

// ========== 学习数据导出 / 导入 ==========
function exportData() {
  const out = {};
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(lang.code + '_') || ['lang_code', 'site_theme', 'site_accent'].includes(k));
  keys.forEach((k) => { out[k] = localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify({ app: '言灯', exportedAt: new Date().toISOString(), data: out }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '学习数据备份-' + lang.code + '-' + dstr(new Date()) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('已导出 ' + Object.keys(out).length + ' 条学习数据');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data = null;
    try {
      const obj = JSON.parse(reader.result);
      data = obj.data || obj;
    } catch (e) {
      toast('导入失败:文件不是有效的 JSON 备份'); return;
    }
    const entries = Object.entries(data).filter(([k, v]) =>
      typeof v === 'string' && (k.startsWith(lang.code + '_') || ['lang_code', 'site_theme', 'site_accent'].includes(k)));
    if (!entries.length) { toast('文件中没有可导入的学习数据(或语言不匹配)'); return; }
    if (!confirm('导入将覆盖当前「' + lang.name + '」的学习记录(' + entries.length + ' 条),确定继续?')) return;
    entries.forEach(([k, v]) => localStorage.setItem(k, v));
    toast('导入成功,即将刷新页面…');
    setTimeout(() => location.reload(), 600);
  };
  reader.readAsText(file, 'utf-8');
}

// ========== 学习统计趋势图(打卡页) ==========
// 顶部圆角、基线方角的小柱路径(skill 标记规范:4px 圆角数据端)
function barPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, Math.max(h, 0));
  return 'M' + x + ' ' + (y + h) + ' L' + x + ' ' + (y + rr) +
    ' Q' + x + ' ' + y + ' ' + (x + rr) + ' ' + y +
    ' L' + (x + w - rr) + ' ' + y +
    ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + rr) +
    ' L' + (x + w) + ' ' + (y + h) + ' Z';
}
function renderStatsTable(days) {
  const el = $('#stats-table');
  el.innerHTML = '<table><thead><tr><th>日期</th><th>新学</th><th>复习</th><th>合计</th></tr></thead><tbody>' +
    days.slice().reverse().map((d) =>
      '<tr><td>' + d.ds + '</td><td>' + d.n + '</td><td>' + d.r + '</td><td><b>' + (d.n + d.r) + '</b></td></tr>').join('') +
    '</tbody></table>';
}
function renderStats() {
  const wrap = $('#stats-chart');
  if (!wrap) return; // 统计图只在打卡页
  const days = [];
  const today = new Date();
  const todayStr = dstr(today);
  let totalNew = 0, totalRev = 0;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = dstr(d);
    const n = Object.values(newWordDates).filter((x) => x === ds).length; // 新学有完整历史
    const r = reviewLog[ds] || 0;                                          // 复习自启用日累计
    days.push({ ds, mon: d.getMonth() + 1, day: d.getDate(), n, r });
    totalNew += n; totalRev += r;
  }
  $('#stats-new-total').textContent = totalNew;
  $('#stats-rev-total').textContent = totalRev;
  renderStatsTable(days);
  if (!totalNew && !totalRev) {
    wrap.innerHTML = '<p class="stats-empty">还没有学习记录:去「背单词」标记认识,或来「复习」页完成复习,这里就会出现趋势图 📈</p>';
    return;
  }
  // Y 轴刻度:0..maxTick 共 5 档
  const maxV = Math.max(...days.map((x) => x.n + x.r), 1);
  const step = Math.max(1, Math.ceil(maxV / 4));
  const maxTick = step * 4;
  // SVG 几何
  const W = 660, H = 220, padL = 34, padR = 8, padT = 8, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / 30, barW = Math.min(12, slot * 0.55);
  let svg = '';
  for (let t = 0; t <= 4; t++) { // 水平网格线(hairline)+ Y 轴刻度
    const y = padT + plotH - (t * step / maxTick) * plotH;
    svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="var(--border)" stroke-width="1"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + (t * step) + '</text>';
  }
  days.forEach((dd, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const hN = dd.n / maxTick * plotH;
    const hR = dd.r / maxTick * plotH;
    const gap = 2; // 堆叠段之间的表面色间隙
    let segs = '';
    if (dd.r > 0) {
      const yR = padT + plotH - hN - gap - hR;
      segs += '<path class="bar-rev" d="' + barPath(x, yR, barW, Math.max(hR - 1, 2), 4) + '" fill="var(--chart-review)"/>';
    }
    if (dd.n > 0) {
      const yN = padT + plotH - hN;
      segs += '<path class="bar-new" d="' + barPath(x, yN, barW, Math.max(hN - 1, 2), 4) + '" fill="var(--chart-new)"/>';
    }
    // 透明命中区(比柱更宽的 hover 目标)
    svg += '<g class="bar-slot"><rect class="bar-hit" x="' + (padL + i * slot) + '" y="' + padT + '" width="' + slot + '" height="' + plotH + '" fill="transparent" data-i="' + i + '"/>' + segs + '</g>';
  });
  days.forEach((dd, i) => { // X 轴标签:每 5 天 + 今天(accent 高亮)
    if (i % 5 === 0 || dd.ds === todayStr) {
      const x = padL + i * slot + slot / 2;
      const isToday = dd.ds === todayStr;
      svg += '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" ' +
        (isToday ? 'font-weight="700" fill="var(--accent)"' : 'fill="var(--muted)"') + '>' + dd.mon + '/' + dd.day + '</text>';
    }
  });
  wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="近 30 天学习趋势图">' + svg + '</svg>';
  // hover 提示:日期 + 新学 + 复习
  const tip = $('#chart-tip');
  wrap.querySelectorAll('.bar-hit').forEach((r) => {
    const dd = days[+r.dataset.i];
    r.addEventListener('mousemove', (e) => {
      tip.hidden = false;
      tip.innerHTML = '<b>' + dd.ds + '</b> · 新学 <b>' + dd.n + '</b> · 复习 <b>' + dd.r + '</b>' + (dd.n + dd.r ? ' · 合计 <b>' + (dd.n + dd.r) + '</b>' : '');
      const box = wrap.getBoundingClientRect();
      const left = Math.min(Math.max(e.clientX - box.left + 12, 0), box.width - 170);
      tip.style.left = left + 'px';
      tip.style.top = Math.max(e.clientY - box.top - 12, 4) + 'px';
    });
    r.addEventListener('mouseleave', () => { tip.hidden = true; });
  });
}

// ========== 周报 ==========
let weekOffset = 0; // 0=本周, -1=上周, 1=下周
const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
function getWeekRange(offset) {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=周一
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}
function renderWeeklyReport() {
  const range = getWeekRange(weekOffset);
  const startStr = dstr(range.start), endStr = dstr(range.end);
  $('#weekly-range-label').textContent = startStr + ' ~ ' + endStr;
  // 本周按钮高亮
  $('#weekly-today').classList.toggle('active', weekOffset === 0);
  // 收集本周数据
  const dayData = [];
  let totalNew = 0, totalRev = 0, totalQuiz = 0, totalQuizCorrect = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(range.start);
    d.setDate(range.start.getDate() + i);
    const ds = dstr(d);
    const n = Object.values(newWordDates).filter((x) => x === ds).length;
    const r = reviewLog[ds] || 0;
    const ql = quizLog[ds];
    const qCorrect = ql ? ql.correct : 0;
    const qTotal = ql ? ql.total : 0;
    const qCount = ql ? ql.count : 0;
    if (n) totalNew += n;
    if (r) totalRev += r;
    if (qTotal) { totalQuiz++; totalQuizCorrect += qCorrect; }
    dayData.push({
      ds,
      label: DAYS[i],
      new: n,
      rev: r,
      quizTotal: qTotal,
      quizCorrect: qCorrect,
      quizCount: qCount,
      checked: checkinDates.includes(ds),
    });
  }
  const avgQuiz = totalQuiz > 0 ? Math.round(totalQuizCorrect / totalQuiz) : 0;
  // 判断今天是否已打卡(仅本周显示)
  const todayChecked = weekOffset === 0 && checkinDates.includes(dstr(new Date()));
  // 渲染 7 天网格
  const maxVal = Math.max(1, ...dayData.map((d) => d.new + d.rev));
  const dayCards = dayData.map((d) => {
    const isToday = d.ds === dstr(new Date()) && weekOffset === 0;
    const h = Math.max(4, Math.round((d.new + d.rev) / maxVal * 80));
    const checkMark = d.checked ? '✓' : '';
    return '<div class="week-day' + (isToday ? ' is-today' : '') + '">' +
      '<div class="week-day-label">' + d.label + (isToday ? ' <em>今</em>' : '') + '</div>' +
      '<div class="week-bar-wrap"><div class="week-bar" style="height:' + h + 'px"></div></div>' +
      '<div class="week-day-num">' + (d.new + d.rev) + '</div>' +
      '<div class="week-day-check">' + (d.checked ? '✓' : '') + '</div>' +
      '</div>';
  }).join('');
  $('#weekly-grid').innerHTML = dayCards;
  // 底部统计
  $('#weekly-footer').innerHTML =
    '<div class="weekly-stat"><span>新学</span><b>' + totalNew + '</b></div>' +
    '<div class="weekly-stat"><span>复习</span><b>' + totalRev + '</b></div>' +
    '<div class="weekly-stat"><span>测验</span><b>' + totalQuiz + '</b>次</div>' +
    '<div class="weekly-stat"><span>均分</span><b>' + avgQuiz + '</b>/10</div>' +
    '<div class="weekly-stat"><span>打卡</span><b>' + dayData.filter((d) => d.checked).length + '</b>/7天</div>';
}
function initWeeklyNav() {
  on('#weekly-prev', 'click', () => { weekOffset--; renderWeeklyReport(); });
  on('#weekly-today', 'click', () => { weekOffset = 0; renderWeeklyReport(); });
  on('#weekly-next', 'click', () => { weekOffset++; if (weekOffset > 0) weekOffset = 0; renderWeeklyReport(); });
}
// 按顺序动态加载脚本(语言数据包、例句文件),全部就绪后回调
function loadScripts(files, done) {
  let i = 0;
  (function next() {
    if (i >= files.length) { done(); return; }
    const s = document.createElement('script');
    s.src = files[i++];
    s.onload = next;
    document.body.appendChild(s);
  })();
}
initTheme();
initLangSelect();
initWeeklyNav();
// 恢复上次选择的语言(跨页面保持一致);非俄语需要动态加载数据包
const bootLang = window.LANGS.find((l) => l.code === (localStorage.getItem('lang_code') || 'ru')) || window.LANGS[0];
// 例句还没就位时,跟着数据包按需加载(EXAMPLES_<语言码> 大写在 window 上)
const needEx = (l) => (l.ex && l.ex.length && !window['EXAMPLES_' + l.code.toUpperCase()]);
// 滚动渐入动画(IntersectionObserver)
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();

// 数字递增动画
function animateNum(el, target, duration) {
  if (!target || isNaN(target)) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const bootAfterLang = (l) => { if (needEx(l)) loadScripts(l.ex, () => initAll(l, true)); else initAll(l, true); };
if (loadedCodes.has(bootLang.code) && dataOwner === bootLang.code) {
  bootAfterLang(bootLang);
} else {
  loadScripts([bootLang.file], () => { loadedCodes.add(bootLang.code); dataOwner = bootLang.code; bootAfterLang(bootLang); });
}
