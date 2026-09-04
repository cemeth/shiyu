// 拾语 · 单文件版打包脚本
// 用法:node build-single.js → 生成「拾语.html」(全部页面/样式/脚本/词库/例句内联,单文件双击即用)
const fs = require('fs');
const P = __dirname + '/';
const enc = 'utf8';

const PAGES = [
  { view: 'home', file: 'index.html', name: '📚 背单词' },
  { view: 'quiz', file: 'quiz.html', name: '✏️ 小测验' },
  { view: 'spell', file: 'spell.html', name: '⌨️ 拼写' },
  { view: 'review', file: 'review.html', name: '🔄 复习' },
  { view: 'speak', file: 'speak.html', name: '🗣️ 口语' },
  { view: 'phrases', file: 'phrases.html', name: '💬 日常用语' },
  { view: 'grammar', file: 'grammar.html', name: '📖 语法' },
  { view: 'checkin', file: 'checkin.html', name: '🔥 打卡' },
];

const read = (f) => fs.readFileSync(P + f, enc);
const grab = (html, re, label) => {
  const m = html.match(re);
  if (!m) throw new Error('未找到: ' + label);
  return m[0];
};

const index = read('index.html');
const style = read('style.css');
const logo = read('logo.svg').trim();

// 1. 各页 <main class="container"> 内层内容
const mains = {};
for (const p of PAGES) {
  const html = read(p.file);
  const m = html.match(/<main class="container">([\s\S]*?)<\/main>/);
  if (!m) throw new Error(p.file + ' 未找到 main');
  mains[p.view] = m[1].trim();
}

// 2. 重复 id 检测(页面间冲突会导致功能错乱)
const ids = {};
for (const p of PAGES) {
  for (const m of mains[p.view].matchAll(/\sid="([^"]+)"/g)) {
    (ids[m[1]] = ids[m[1]] || []).push(p.view);
  }
}
const dups = Object.entries(ids).filter(([, v]) => v.length > 1);
if (dups.length) {
  console.log('⚠️ 重复 id 检测:');
  dups.forEach(([id, views]) => console.log('   #' + id + ' → ' + views.join(', ')));
  process.exit(1);
}

// 3. 从 index.html 提取公共骨架
const head = grab(index, /<head>[\s\S]*?<\/head>/, 'head')
  .replace('<link rel="stylesheet" href="style.css">', '<style>\n' + style + '\n</style>')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' + encodeURIComponent(logo) + '">');
const splash = grab(index, /<div class="splash" id="splash">[\s\S]*?<\/div>\s*<\/div>/, 'splash'); // 退场时 splash.remove()
const headerRaw = grab(index, /<header class="site-header">[\s\S]*?<\/header>/, 'header');
const bodyTail = index.match(/<\/main>([\s\S]*?)<script src="langs\.js">/)[1]; // footer/toast/fab/弹窗/导入文件

// 4. 导航改为按钮 + 页内视图切换
const nav = '<nav class="tabs">\n' + PAGES.map((p) =>
  '    <button type="button" class="tab' + (p.view === 'home' ? ' active' : '') + '" data-view="' + p.view + '"' +
  (p.view === 'grammar' ? ' data-tab="grammar"' : '') + '>' + p.name + '</button>').join('\n') + '\n    </nav>';
const header = headerRaw.replace(/<nav class="tabs">[\s\S]*?<\/nav>/, nav);

// 5. 各页内容组装成视图
const views = PAGES.map((p) =>
  '  <section class="page-view" data-view="' + p.view + '"' + (p.view === 'home' ? '' : ' hidden') + '>\n' +
  mains[p.view] + '\n  </section>').join('\n');

// 6. app.js 补丁:多页跳转 → 单文件页内切换
// 关键:两种语言的数据文件共用同名 window 全局(如 VOCAB),不能同时执行——
// 俄语数据内联执行,英语数据以字符串内嵌,切换语言时求值(复刻多页版的动态加载语义)
let app = read('app.js');
const patches = [
  ["const PAGE = document.body.dataset.page || 'home'; // 当前页面:home / quiz / spell / review / speak / phrases / grammar / checkin",
   "let PAGE = 'home'; // 单文件版:showView 切换时更新(原多页版读 body data-page)"],
  [`  if (loadedCodes.has(code) && dataOwner === code) { initAll(target); return; }
  const s = document.createElement('script');`,
   `  if (loadedCodes.has(code) && dataOwner === code) { initAll(target); return; }
  if (window.__SINGLE_DATA && window.__SINGLE_DATA[code]) { (0, eval)(window.__SINGLE_DATA[code]); loadedCodes.add(code); dataOwner = code; initAll(target); return; } // 单文件版:内嵌数据字符串直接求值
  const s = document.createElement('script');`],
  [`if (loadedCodes.has(bootLang.code) && dataOwner === bootLang.code) {
  bootAfterLang(bootLang);
} else {
  loadScripts([bootLang.file], () => { loadedCodes.add(bootLang.code); dataOwner = bootLang.code; bootAfterLang(bootLang); });
}`,
   `(function () { // 单文件版:上次用的语言若不是俄语,先求值其内嵌数据再启动
  if (window.__SINGLE_DATA && window.__SINGLE_DATA[bootLang.code] && !(loadedCodes.has(bootLang.code) && dataOwner === bootLang.code)) {
    (0, eval)(window.__SINGLE_DATA[bootLang.code]);
    loadedCodes.add(bootLang.code);
    dataOwner = bootLang.code;
  }
  bootAfterLang(bootLang);
})();`],
];
for (const [from, to] of patches) {
  if (!app.includes(from)) throw new Error('app.js 补丁未匹配:\n' + from.slice(0, 60) + '…');
  app = app.replace(from, to);
}

// 7. 单文件运行时:视图切换 + 英语时语法页兜底
const runtime = `
// ===== 单文件版运行时:页内视图切换(多页版此处为页面跳转) =====
(function () {
  const tabs = document.querySelectorAll('.tab[data-view]');
  const views = document.querySelectorAll('.page-view');
  window.showView = function (v) {
    PAGE = v;
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.view === v));
    views.forEach((s) => { s.hidden = s.dataset.view !== v; });
    window.scrollTo(0, 0);
    initAll(lang, true);
  };
  tabs.forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));
  // 英语模式没有语法页:切换语言时若正停在语法页,回首页
  const origSwitch = window.switchLang;
  window.switchLang = function (code) {
    origSwitch(code);
    if (lang.code !== 'ru' && PAGE === 'grammar') showView('home');
  };
})();`;

// 8. 组装输出
const html = `<!DOCTYPE html>
<!-- 拾语 · 单文件版:所有页面/样式/词库/例句已内联,双击即可使用,手机/平板/电脑通用。由 build-single.js 生成,请勿手改 -->
${head.replace('</head>', '')}
</head>
<body data-page="home">
${splash}
${header}
<main class="container">
${views}
</main>
${bodyTail}
<script>
${read('langs.js')}
${read('data-ru.js')}
${read('data-ex-ru-1.js')}
${read('data-ex-ru-2.js')}
${read('data-ex-ru-3.js')}
${read('data-ex-ru-4.js')}
${read('data-ex-ru-5.js')}
${read('data-ex-en-1.js')}
${read('data-ex-en-2.js')}
// 单文件版:语言数据包以字符串内嵌(两种语言共用同名 window 全局,只能按需求值,不能同时执行)
window.__SINGLE_DATA = { ru: ${JSON.stringify(read('data-ru.js'))}, en: ${JSON.stringify(read('data-en.js'))} };
</script>
<script>
${app}
</script>
<script>
${runtime}
</script>
</body>
</html>
`;

const out = P + '拾语.html';
fs.writeFileSync(out, html, enc);
console.log('✅ 已生成 ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB,UTF-8)');
