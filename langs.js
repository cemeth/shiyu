// 语言注册表:以后想加新语言(日语、韩语等),只需在这里加一项 + 新建一个数据文件
// ex = 例句数据文件(单词卡片背面的例句,切换语言时按需顺序加载)
window.LANGS = [
  { code: 'ru', name: '俄语', flag: '🇷🇺', speak: 'ru-RU', file: 'data-ru.js', hasGrammar: true, ex: ['data-ex-ru-1.js', 'data-ex-ru-2.js', 'data-ex-ru-3.js', 'data-ex-ru-4.js', 'data-ex-ru-5.js'] },
  { code: 'en', name: '英语', flag: '🇬🇧', speak: 'en-US', file: 'data-en.js', hasGrammar: false, ex: ['data-ex-en-1.js', 'data-ex-en-2.js'] },
];
