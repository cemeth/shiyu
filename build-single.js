// 拾语 · 单文件版打包脚本
const fs = require('fs');
const P = __dirname + '/';
const enc = 'utf8';

const PAGES = [
  { view: 'home', file: 'index.html', name: '背单词' },
  { view: 'quiz', file: 'quiz.html', name: '小测验' },
  { view: 'spell', file: 'spell.html', name: '拼写' },
  { view: 'review', file: 'review.html', name: '复习' },
  { view: 'speak', file: 'speak.html', name: '口语' },
  { view: 'phrases', file: 'phrases.html', name: '日常用语' },
  { view: 'grammar', file: 'grammar.html', name: '语法' },
  { view: 'checkin', file: 'checkin.html', name: '打卡' },
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

// 2. 重复 id 检测
const ids = {};
for (const p of PAGES) {
  for (const m of mains[p.view].matchAll(/\sid="([^"]+)"/g)) {
    (ids[m[1]] = ids[m[1]] || []).push(p.view);
  }
}
const dups = Object.entries(ids).filter(([, v]) => v.length > 1);
if (dups.length) {
  console.log('⚠️ 重复 id 检测:');
  dups.forEach(([id, views]) => console.log('   #' + id + ' -> ' + views.join(', ')));
  process.exit(1);
}

// 3. 从 index.html 提取公共骨架
const head = grab(index, /<head>[\s\S]*?<\/head>/, 'head')
  .replace('<link rel="stylesheet" href="style.css">', '<style>\n' + style + '\n</style>')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' + encodeURIComponent(logo) + '">');
const splash = grab(index, /<div class="splash" id="splash">[\s\S]*?<\/div>\s*<\/div>/, 'splash');
const headerRaw = grab(index, /<header class="site-header">[\s\S]*?<\/header>/, 'header');
const bodyTail = index.match(/<\/main>([\s\S]*?)<script src="langs\.js">/)[1];

// 4. 导航改为按钮
const nav = '<nav class="tabs">\n' + PAGES.map((p) =>
  '    <button type="button" class="tab' + (p.view === 'home' ? ' active' : '') + '" data-view="' + p.view + '"' +
  (p.view === 'grammar' ? ' data-tab="grammar"' : '') + '>' + p.name + '</button>').join('\n') + '\n    </nav>';
const header = headerRaw.replace(/<nav class="tabs">[\s\S]*?<\/nav>/, nav);

// 5. 各页内容组装成视图
const views = PAGES.map((p) =>
  '  <section class="page-view' + (p.view === 'home' ? ' active' : '') + '" data-view="' + p.view + '">\n' +
  mains[p.view] + '\n  </section>').join('\n');

// 6. app.js 补丁
let app = read('app.js');
const patches = [
  ["const PAGE = document.body.dataset.page || 'home'; // 当前页面",
   "let PAGE = 'home'; // 单文件版"],
  [`  if (loadedCodes.has(code) && dataOwner === code) { initAll(target); return; }
  const s = document.createElement('script');`,
   `  if (loadedCodes.has(code) && dataOwner === code) { initAll(target); return; }
  if (window.__SINGLE_DATA && window.__SINGLE_DATA[code]) { (0, eval)(window.__SINGLE_DATA[code]); loadedCodes.add(code); dataOwner = code; initAll(target); return; }
  const s = document.createElement('script');`],
  [`if (loadedCodes.has(bootLang.code) && dataOwner === bootLang.code) {
  bootAfterLang(bootLang);
} else {
  loadScripts([bootLang.file], () => { loadedCodes.add(bootLang.code); dataOwner = bootLang.code; bootAfterLang(bootLang); });
}`,
   `(function () {
  if (window.__SINGLE_DATA && window.__SINGLE_DATA[bootLang.code] && !(loadedCodes.has(bootLang.code) && dataOwner === bootLang.code)) {
    (0, eval)(window.__SINGLE_DATA[bootLang.code]);
    loadedCodes.add(bootLang.code);
    dataOwner = bootLang.code;
  }
  bootAfterLang(bootLang);
})();`],
];
for (const [from, to] of patches) {
  if (!app.includes(from)) throw new Error('app.js 补丁未匹配:\n' + from.slice(0, 60) + '\n...');
  app = app.replace(from, to);
}

// 7. 单文件运行时
const runtime = `
(function () {
  const tabs = document.querySelectorAll('.tab[data-view]');
  const views = document.querySelectorAll('.page-view');
  let currentView = 'home';
  let transitioning = false;
  let pendingTarget = null;

  function switchToView(v) {
    if (transitioning) { pendingTarget = v; return; }
    if (v === currentView) return;
    transitioning = true;
    PAGE = v;
    pendingTarget = null;
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.view === v));
    const current = document.querySelector('.page-view.active');
    const next = document.querySelector('.page-view[data-view=\"' + v + '\"]');
    if (current) { current.classList.add('exiting'); current.classList.remove('active'); }
    if (next) { next.classList.add('active'); }
    setTimeout(() => {
      if (current) current.classList.remove('exiting');
      transitioning = false;
      requestAnimationFrame(() => initAll(lang, true));
      window.scrollTo(0, 0);
      if (pendingTarget) { const target = pendingTarget; pendingTarget = null; requestAnimationFrame(() => switchToView(target)); }
    }, 300);
  }

  window.showView = switchToView;
  tabs.forEach((t) => t.addEventListener('click', () => switchToView(t.dataset.view)));
  const origSwitch = window.switchLang;
  window.switchLang = function (code) {
    origSwitch(code);
    if (lang.code !== 'ru' && PAGE === 'grammar') showView('home');
  };
})();`;

// 8. 组装输出
const html = `<!DOCTYPE html>
<!-- 拾语 · 单文件版:所有页面/样式/词库/例句已内联,双击即可使用 -->
${head.replace('</head>', '')}
</head>
<body data-page="home">
${splash}
${header}
<main class="container">
<div class="views-wrapper">
${views}
</div>
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
console.log('OK: ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
