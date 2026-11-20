# 进阶总览

本栏目面向引擎开发者与需要深度定制的集成者，覆盖渲染、并行计算、文件互操作、主题与插件。

## 内容地图

| 主题 | 解决什么问题 | 文档 |
|---|---|---|
| 渲染管线与脏矩形 | 为什么改一格不触发全表重绘 | [渲染管线](/advanced/rendering) |
| 后台渲染 | 如何把绘制搬进 Worker、如何降级 | [OffscreenCanvas](/advanced/offscreen) |
| 并行计算 | 排序/筛选/聚合如何在 Worker 跑、如何防竞态 | [Web Worker](/advanced/worker) |
| XLSX | 零依赖读写的能力边界与兼容细节 | [XLSX 导入导出](/advanced/xlsx) |
| 主题 | 令牌双出口、全局换肤 | [主题系统](/advanced/themes) |
| 插件 | 扩展点、生命周期、依赖拓扑 | [插件生态](/advanced/plugins) |

## 贯穿原则

1. **零依赖**：MIT 核心不引入第三方渲染 / 计算 / 文件库；SheetJS / ExcelJS 等由宿主按需注入。
2. **降级优先**：任何新 API（OffscreenCanvas、Worker、CompressionStream）缺失时自动回退主线程，不让表格不可用。
3. **增量消息**：Worker 只收任务 + 增量补丁 + revision，不传整表快照。
4. **契约稳定**：渲染器只认纯数据绘制指令，不解释业务含义。

## 下一步

按需进入各主题，或回到 [架构总览](/guide/architecture)。
