# 常见问题（FAQ）

## 集成与容器

**Q：画布空白 / 尺寸为 0？**
A：容器必须有确定尺寸（引擎按 100% 填充）。给容器设置明确 `height`，或确认父级链有高度。

**Q：为什么 getValue 读不到值？**
A：确认使用稳定的 `rowId` 而非下标。下标会随插删漂移；生产数据务必提供唯一 `id`。见 [Grid API](/api/grid#行-id-说明)。

**Q：CDN 和 npm 场景有什么区别？**
A：CDN 入口 `@sheetx/web-component/cdn` 有副作用（挂全局 `SheetX` + 注册元素）；npm 从包主入口具名导入，无副作用。见 [安装与集成](/guide/installation)。

## 编辑与输入

**Q：中文输入法会提前提交 / 丢字？**
A：引擎的 `ImeGuard` 在 composition 期间抑制提交，`compositionend` 后提交一次。自定义编辑器**不要在 composition 期间调用 `commit()`**。

**Q：Enter / Tab 提交后跳两行？**
A：编辑器提交事件已做 `stopPropagation`，避免被导航层重复处理。若自定义编辑器遇到此问题，检查是否在 commit 后手动触发了导航。

**Q：粘贴 Excel 数据格式错乱？**
A：引擎按 TSV → HTML 优先级解析。若源提供 HTML 表格，会优先用 HTML 保留结构。见 [事件系统](/api/events)。

## 渲染与性能

**Q：滚动后画布空白？**
A：历史上曾因 clip-end 平移累积导致，已修复。若复现请开启 `debug: true` 检查脏矩形，并提供复现步骤。

**Q：改一个格会全表重绘吗？**
A：不会。脏矩形只覆盖变化区域；`debug: true` 可视化验证。见 [渲染管线](/advanced/rendering)。

**Q：OffscreenRenderer 一直是 `mode:'main'`？**
A：说明能力检测未通过或 canvas 已被主线程 `getContext('2d')`（一条 canvas 只能 transfer 一次）。这是预期降级，功能不受影响。见 [后台渲染](/advanced/offscreen)。

## 文件互操作

**Q：`001` 变成数字 1？**
A：内置 XLSX 适配层会把 `001` 保留为文本。若仍有问题，检查是否在写入前做了 `Number()` 转换。

**Q：日期差一天 / 1900 年错乱？**
A：内置实现按 1900 日期系统 + 闰日 bug 处理（序列号 60 归一化到 1900-03-01）。见 [XLSX 导入导出](/advanced/xlsx)。

**Q：公式读出来是公式串不是值？**
A：`getCellValue` 返回计算值；若读的是 XLSX `formulas` 字段，那是公式串（外部契约统一带 `=`）。

## 授权

**Q：商业项目能用吗？**
A：MIT 核心可商用。虚拟滚动、基础编辑、复制粘贴等基础能力都在社区版。商业版覆盖高级公式、Excel 兼容、透视表、协同等企业级能力。见 [状态与路线](/guide/roadmap)。

## 没找到答案？

查阅 [引擎使用与对接指南](https://github.com/sheetx/sheetx) 或引擎开发任务书（仓库 `docs/` 与根目录）。
