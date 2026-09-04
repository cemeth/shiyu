# 拾语 · Russian Learning — CLAUDE.md

## 项目概述
单文件俄语学习网站（index.html + style.css + app.js），目标用户是中国零基础俄语学习者。
风格：俄式学术气质 + 温暖纸质感，精致但不浮夸。

---

## 视觉方向（自动应用）

当涉及任何 CSS/HTML 改动、UI 升级、界面优化时，**自动运行以下 skill**：

```
/stitch-design-taste           → 设计系统规范：排版/色彩/布局/动效标准
/high-end-web-design           → 主流程：毛玻璃/微渐变/视差/悬停反馈/响应式
/redesign-existing-projects    → 审计现有设计 → 找问题 → 针对性修复
/frontend-design-direction     → 决定整体视觉方向时的参考框架
```

### 设计基准（已确立）

| 维度 | 规则 |
|------|------|
| 字体 | 俄文用 Georgia / Noto Serif；正文用 Inter |
| 主色 | `#2c3e6b`（深蓝）+ `#4a6fa5`（辅蓝） |
| 强调色 | `#b5523e`（俄式红棕） |
| 圆角 | 16px–20px（卡片），999px（pill） |
| 阴影 | 多层柔和 + 与背景同色系 tint |
| 背景 | 统一背景色 + 毛玻璃玻璃感 |
| Header | 毛玻璃 + 俄式蓝白红装饰线 |
| 动画 | 克制但有意：翻转、脉冲、扫光、滚动渐入 |
| 悬停 | 所有可交互元素必须有 hover 状态 |

### 禁止事项（Anti-Patterns）

- ❌ 紫色/粉色渐变 AI 默认风格
- ❌ 纯黑 `#000000` 背景（用 `#0d1117` 或 `#1e2430`）
- ❌ 单层扁平阴影
- ❌ 卡片里套卡片
- ❌ 过度装饰动画掩盖性能
- ❌ hover-only 的移动端交互
- ❌ 所有主题共用同一套样式不针对俄式语境调优

---

## 项目结构

```
拾语/
├── index.html        # 首页（每日一词 + 背单词）
├── quiz.html         # 小测验
├── spell.html        # 拼写练习
├── review.html       # 艾宾浩斯复习
├── speak.html        # 口语跟读
├── phrases.html      # 日常用语
├── grammar.html      # 语法
├── checkin.html      # 打卡 + 成就徽章
├── style.css         # 全部样式（主题变量 + 所有页面样式）
├── langs.js          # 语言注册表
├── data-ru.js        # 俄语词库数据
├── data-ex-ru-*.js   # 例句数据
├── app.js            # 全部业务逻辑
├── logo.svg          # Logo
├── build-single.js   # 打包脚本（合并为单文件）
└── 拾语.html         # 单文件版（最终发布版）
```

---

## 技术约束

1. **单文件发布**：`node build-single.js` 将 CSS/JS 内联生成 `拾语.html`
2. **localStorage 存储**：所有学习数据存本地，无后端
3. **Vanilla JS**：无任何框架依赖
4. **多主题系统**：6 套配色方案 + 深色模式，通过 CSS 变量切换
5. **TTS 朗读**：使用 Web Speech API 俄语语音
6. **响应式**：移动端优先，640px 断点

---

## 语言支持

- 当前：俄语（ru）
- 预留：英语（en）数据文件 `data-en.js` 已存在
- 扩展方式：在 `langs.js` 加一项 + 新建数据文件

---

## 工作流约定

### 视觉任务
用户说"美化""升级""看起来更高级"等 → 自动启动 `/redesign-existing-projects`

### 新页面/功能
涉及 UI 时 → 先过 `/frontend-design-direction` 确定方向，再动手

### 打包发布
修改样式/HTML 后必须运行 `node build-single.js` 更新 `拾语.html`
