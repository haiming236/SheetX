# 性能基准

SheetX 从第一天就建立独立性能测试应用 `apps/benchmark`：用真实 Grid + rAF 采样 + `getRenderStats()` 采集，不靠"感觉流畅"。

## 如何运行

```bash
pnpm build:benchmark
cd apps/benchmark/dist && python3 -m http.server 5400
# 浏览器打开后等待 window.__bench.ready，执行 window.__bench.runAll()
```

`window.__bench` 暴露 `seed` / `scroll` / `paste` / `runAll`，页面按钮与自动化共用同一入口。真实结果落盘到 `apps/benchmark/report.json`。

## 本轮采集结果

> 采集环境：WebKit 27.2（Macintosh），DPR 1，视口 1004×518。本机 Chrome/Edge 自动化进程无法启动；**产品基线仍是 Chrome/Edge，CI 需按同脚本补跑覆盖**。

| 场景 | 结果 |
|---|---|
| 10 万行 × 20 列初始化 | **105 ms**（数据生成 29 ms + Grid 构造 76 ms） |
| 10 万行纵向滚动 120 帧 | **60 FPS**，P95 **18 ms**，119 帧全走 blit |
| 1000 格批量粘贴 | 同步 mutation **2 ms**，两帧内完成 **33 ms** |
| 1000 列横向滚动 | **60.1 FPS**，P95 **19 ms**，89 帧 |
| 冻结 2 行 3 列后滚动 | **59.9 FPS**，P95 **18 ms** |

## 研发目标对照

| 测试项目 | 研发目标 | 本轮实测 |
|---|---|---|
| 10 万 × 20 可交互 | 是 | ✅ 105 ms 初始化 |
| 10 万行滚动 60 FPS | 60 FPS | ✅ 60 FPS |
| 1000 格批量粘贴不卡死 | 不卡死主线程 | ✅ 同步 2 ms / 两帧 33 ms |
| 可见区域更新 P95 < 16.7 ms | P95 < 16.7 ms | ⚠️ P95 18–19 ms（软件渲染管线，基线浏览器待补测） |

> 60 FPS 预算是每帧约 16.7 ms；P95 略高于预算主要受采集环境（软件渲染）影响，应在 Chrome/Edge 基线复测后定论。

## 场景设计原则

- 区分「浏览器内存持有全部数据」与「仅持有可见数据」与「服务端远程分页」——这是完全不同的性能场景。
- 覆盖行高变化、冻结行列 + 横向滚动、大范围选区、连续编辑 / 撤销等组合。
- 记录 FPS、P95 帧时间、主线程阻塞时间与操作延迟。

## 下一步

[渲染管线](/advanced/rendering) · [测试与验收](/engineering/testing) · [状态与路线](/guide/roadmap)
