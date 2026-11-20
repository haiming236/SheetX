# @sheetx/e2e

SheetX 浏览器级交互验收（任务书 §3.4 / T3）。页面在**真实浏览器 DOM 与事件循环**中跑用例，而非 jsdom 合成事件：

- `ImeGuard`：`compositionstart/update/end` 全序列 + `isComposing` Enter 吞噬 + 跨组合取消判定；
- `ClipboardController`：Excel TSV / HTML 粘贴优先级、复制写出 TSV；
- Grid 集成：真实 `ClipboardEvent('paste')` → mutation → 单元格值；
- 键盘：ArrowRight / Enter 导航；
- `@sheetx/worker`：真实内联 Worker 执行 sort / aggregate（验证 `mode === 'worker'`，非主线程降级）；
- `@sheetx/renderer`：真实 OffscreenCanvas 工作线程渲染，中心像素采样回传（验证 `mode === 'worker'` 且像素非透明）。

系统级输入法（微软拼音/搜狗）无法在 CI 中程序化驱动，IME 用例用真实浏览器的 `CompositionEvent` 序列验证守卫语义；真机输入法仍属人工验收项。

```bash
pnpm --filter @sheetx/e2e dev                 # 手动点按钮运行
pnpm --filter @sheetx/e2e build               # 产物 apps/e2e/dist
bash apps/e2e/scripts/run.sh                  # 自动化运行并覆盖 report.json
BROWSER=chrome bash apps/e2e/scripts/run.sh   # 有 Chrome/Edge 时按基线补跑
```

控制台等价入口：

```js
const report = await window.__e2e.runAll()
```

`report.json` 为本轮真实采集结果（WebKit 27.2，6/6 PASS，0 控制台错误；Compute Worker 与 OffscreenCanvas 渲染 Worker 两条真实路径均命中，中心像素采样 `[255,0,0,255]`）。产品基线仍是 Chrome/Edge，CI 应使用 `BROWSER=chrome` 补跑。
