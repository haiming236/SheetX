# 测试与验收

SheetX 采用分层测试：单元测试（Vitest）+ 浏览器级交互验收（真实 DOM 事件）+ 类型检查 + 构建。

## 单元测试

```bash
pnpm test
```

- 39 个测试文件、**398/398** 通过（持续迭代中）。
- vitest 默认 node 环境；涉及 DOM 的用例（editors / interaction）在文件内用 `@vitest-environment jsdom` 标注。
- 覆盖：数据 / 事务 / 撤销、渲染脏矩形几何、公式依赖与环检测、编辑器（含远程搜索防抖与竞态）、XLSX 往返、Worker 协议与降级、插件运行时、主题令牌、Offscreen 渲染器协议等。

## 浏览器级交互验收（E2E）

```bash
pnpm test:e2e                          # 构建 → 临时静态服务 → 浏览器驱动 → report.json
BROWSER=chrome pnpm test:e2e           # 有 Chrome/Edge 时按基线补跑
```

`apps/e2e` 在**真实浏览器 DOM 与事件循环**中跑用例，而非 jsdom 合成事件：

| 用例 | 覆盖 |
|---|---|
| IME | composition 全序列、Enter 吞噬、跨组合取消判定 |
| 剪贴板 | TSV / HTML 粘贴优先级、复制写出 TSV |
| Grid 集成 | 真实 paste → mutation → 单元格值 |
| 键盘 | ArrowRight / Enter 导航 |
| 计算 Worker | 内联 Worker 真实 sort / aggregate |
| 后台渲染 | OffscreenCanvas 渲染 + 中心像素回传 |

本轮真实结果：WebKit 27.2，**6/6 PASS，0 控制台错误**；两条 Worker 路径均命中 `mode:'worker'`。

> 系统级输入法（微软拼音 / 搜狗）无法在 CI 程序化驱动，IME 用例用真实 CompositionEvent 序列验证守卫语义；真机输入法属人工验收项。

## 类型检查与构建

```bash
pnpm typecheck   # 全 workspace 0 错误
pnpm build       # packages + benchmark + e2e
pnpm build:docs  # 文档站
```

## 验收操作对照

任务书关键验收项与操作：

| 验收项 | 操作 |
|---|---|
| 改一格只重绘对应脏矩形 | `debug: true` 看红框；`getRenderStats().drawCalls` 局部 |
| 公式改 A1 只重算受影响节点 | 依赖追踪日志 / `formula-change` 事件 |
| 脏矩形可视化 | `createGrid({..., debug: true})` 编辑单格 |
| 交互全走 Command | 撤销成对、事件可观测 |
| 性能 | [性能基准](/engineering/performance) |

## 下一步

[浏览器兼容](/engineering/compatibility) · [FAQ](/engineering/faq) · [渲染管线](/advanced/rendering)
