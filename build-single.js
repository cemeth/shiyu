// 言灯 · 单文件版打包脚本 (SPA 版)
const fs = require('fs');
const P = __dirname + '/';
const enc = 'utf8';

const read = (f) => fs.readFileSync(P + f, enc);
const grab = (html, re, label) => {
  const m = html.match(re);
  if (!m) throw new Error('未找到: ' + label);
  return m[0];
};

const index = read('index.html');
const style = read('style.css');
const logo = read('logo.svg').trim();

// 1. 从 index.html 提取公共骨架
const head = grab(index, /<head>[\s\S]*?<\/head>/, 'head')
  .replace('<link rel="stylesheet" href="style.css">', '<style>\n' + style + '\n</style>')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' + encodeURIComponent(logo) + '">');
const splash = grab(index, /<div class="splash" id="splash">[\s\S]*?<\/div>\s*<\/div>/, 'splash');
const navBar = grab(index, /<nav class="spa-nav">[\s\S]*?<\/nav>/, 'nav');
const bodyTail = index.match(/<\/main>([\s\S]*?)<script src="langs\.js">/)[1];

// 2. 提取 main 内容(从 class="spa-nav"> 之后到 </main> 之间)
const mainMatch = index.match(/<nav class="spa-nav">[\s\S]*?<\/nav>([\s\S]*?)<\/main>/);
if (!mainMatch) throw new Error('未找到 main 内容');
const mainContent = mainMatch[1].trim();

// 3. app.js 补丁(单文件版:lang 动态加载改为内联数据)
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

// 4. 组装输出
const html = `<!DOCTYPE html>
<!-- 言灯 · 单文件版:所有页面/样式/词库/例句已内联,双击即可使用 -->
${head.replace('</head>', '')}
</head>
<body data-page="home">
${splash}
${navBar}
<main class="container">
${mainContent}
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
</body>
</html>
`;

const out = P + '言灯.html';
fs.writeFileSync(out, html, enc);
console.log('OK: ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
