# @sheetx/benchmark

SheetX 渲染性能基准应用（任务书 T6 / 正式方案 L845-857）。页面直接驱动真实 `@sheetx/grid`，数字来自浏览器 `requestAnimationFrame` 采样与 `grid.getRenderStats()`，不造 mock 渲染器。

```bash
pnpm --filter @sheetx/benchmark dev      # 开发页
pnpm --filter @sheetx/benchmark build    # 产物 apps/benchmark/dist
```

页面右上角「运行全部场景」，或控制台执行：

```js
const report = await window.__bench.runAll()
console.log(report)
```

`window.__bench` 也暴露 `seed(rows, cols)` / `scroll('x'|'y', frames)` / `paste(cells)`，方便自动化只跑单项。

## 场景

| 场景 | 内容 |
|---|---|
| `seed100k20` | 10 万行 × 20 列：数据生成、Grid 构造、首帧耗时 |
| `scroll100k` | 纵向连续滚动 120 帧：FPS、P95 帧间隔、blit 帧数 |
| `paste1000` | 1000 格批量粘贴：同步 mutation 耗时、两帧内完成耗时 |
| `seed1000cols` / `scroll1000cols` | 1000 列横向虚拟滚动 |
| `frozenScroll` | 冻结 2 行 3 列后的组合滚动 |

`report.json` 是本机真实采集结果。当前沙箱 Chrome/Edge 自动化进程无法启动，指标采集于 WebKit 27.2；产品基线仍为 Chrome/Edge，CI 环境应补跑同名脚本覆盖。
