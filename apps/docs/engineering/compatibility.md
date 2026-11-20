# 浏览器兼容

## 浏览器矩阵

| 浏览器 | 目标 |
|---|---|
| Chrome | 完整支持（基线） |
| Edge | 完整支持（基线） |
| Firefox | 暂不作为阶段目标 |
| Safari | 暂不作为阶段目标 |
| 企业旧版浏览器 | 放弃兼容 |

当前 E2E / benchmark 报告采集于 WebKit 27.2（沙箱内 Chrome/Edge 自动化进程无法启动）；产品基线仍是 Chrome/Edge，CI 需用 `BROWSER=chrome` 补跑。

## 关键 API 能力矩阵

| 能力 | 支持时 | 不支持时 |
|---|---|---|
| OffscreenCanvas + transfer | 后台渲染 Worker | 自动降级主线程 Canvas2DRenderer |
| Worker / Blob URL | 内联计算 Worker | 主线程同源纯函数（先让出宏任务） |
| CompressionStream('deflate-raw') | XLSX 压缩 | 降级 store（不阻塞读写） |
| Canvas 2D | 完整渲染 | 无头模式（Node / 无图形环境跳过绘制，数据层照常工作） |

**纪律**：任何新 API 缺失都不能让表格不可用。所有加速层都有主线程降级路径。

## 显示相关场景

- Retina / 高 DPI：backing store = CSS 尺寸 × DPR，绘制走 CSS 坐标；DPR 变化重建。
- 浏览器缩放：DPR 变化触发文本度量缓存整体失效。
- 深色模式：主题令牌 + CSS 变量双出口同步（见 [主题系统](/advanced/themes)）。

## 中文与剪贴板（P0）

- IME：Windows 微软拼音 / 搜狗 / 百度、macOS 拼音；E2E 用真实 CompositionEvent 覆盖守卫语义，真机仍属人工验收。
- 剪贴板：Excel / WPS / Google Sheets / 浏览器之间互相复制粘贴；TSV 优先，HTML 表格可解析。
- 键盘：Windows / macOS 的 Ctrl / Cmd 差异。

## 下一步

[测试与验收](/engineering/testing) · [FAQ](/engineering/faq)
