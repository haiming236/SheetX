# SheetX 阶段二任务书 · UI 对接与引擎补齐

> 版本：v1.0 · 日期：2026-11-20 · 前置：《引擎开发任务书》（T1-T11 已完成，153 测试全绿）
> 本阶段目标：**让引擎真正"长"进界面**——Web Component 适配层可用、五张 UI 稿从 mock 外壳切换到真实引擎驱动、补齐对接中暴露的引擎缺口。

---

## 〇、对接现状（本任务书的出发点）

阶段一交接后已完成首轮对接验证（playground `#engine` 路由）：

| 项 | 状态 |
|---|---|
| `@sheetx/web-component`（`<sheetx-grid>` / `<sheetx-spreadsheet>`） | ✅ 已实现，事件桥接/生命周期/undo 验证通过 |
| Grid 渲染（200 行 × 7 列，表头/行号/选中高亮） | ✅ canvas 导出验证正确 |
| Spreadsheet 运行时公式 + 增量重算 | ✅（修复后） |
| `sx-cell-change` / `sx-formula-change` DOM 事件桥接 | ✅ 验证通过 |
| undo/redo 经 wrapper 代理 | ✅ 验证通过 |

对接中发现并处理的问题（后续任务以此为线索）：

1. **[已修] 运行时写公式不生效**：`setCellValue('=…')` 只写存储未建依赖图，公式格恒返回 null。已在 `sheet-engine.executeSetCells` 补 `formula.setFormula` 调用，并新增 5 个回归测试（`spreadsheet/test/sheet-engine.test.ts`）。
2. **[已修] `FormulaError.name()` 与 `Function.name` 冲突**：Lit 包要求 `useDefineForClassFields:false` 下编译失败，已改名 `nameError()`。
3. **[未修·E1] 区间自引用环未检测**：`A3=SUM(A1:A3)` 不报 `#CYCLE!`，反而把自身旧值累加（120→400→490 持续漂移）。**这是正确性 bug，E1 优先修**。
4. **[未修·U1] Lit 嵌套时序坑**：父组件 `firstUpdated` 时子 wrapper 的 engine 尚未创建（子元素还在 microtask 队列）。目前 playground 用 rAF 轮询规避，wrapper 应内建 `engineReady` Promise 化解。
5. **[未修·E4] 弹层裁切**：编辑器宿主在引擎 root 内（`overflow:visible` 但 root `overflow:hidden`），下拉越出表格边界被剪。

---

## A 组 · 引擎补齐（引擎开发者）

### E1 公式环检测补齐（P0，正确性）

- **问题**：区间引用展开成逐格依赖边时，"公式格引用包含自身的区间"（`A3=SUM(A1:A3)`、跨表互引）未被 `DependencyGraph.collectDirty` 判为环，求值器把自身旧值当输入，产生**静默的错误数值**。这比报错更危险。
- **要求**：
  1. 自环（公式引用含自身坐标的区间）→ 该格 `#CYCLE!`，不参与数值传播；
  2. 区间环（A1=SUM(B1:B2)、B1=SUM(A1:A2)）→ 环上全部 `#CYCLE!`；
  3. 环检测在**建图时**标记（setFormula 阶段），recompute 直接跳过环节点；不能依赖"求值时发现"。
- **验收**：新增用例至少覆盖上述两类环 + `#CYCLE!` 不污染下游正常公式（下游引用环格显示 `#CYCLE!` 传播，符合 Excel 语义）。

### E2 公式依赖图 RTree 区间索引（P2，性能储备）

- 现状线性扫描 + 区间包含判断在 ≤5000 公式实测够用（571ms/5000 格）；公式数过万后增量查询退化。
- 要求：接口不变（`collectDirty` 签名不动），内部换 RTree；benchmark 对比 1 万/5 万公式下 recompute 耗时，数据写进报告。

### E3 冻结行绘制（P1）

- `freezeRows(n)` API 已有但滚动布局按无冻结行绘制。实现 9 视口模型中的行冻结带（列冻结已可用），表头带/冻结带不随垂直滚动位移，canvas 侧 viewport 空间指令修正。
- 验收：冻结 2 行 + 5 万行数据，垂直滚动时冻结行钉在表头下方；`getSelectedRanges` 命中坐标不漂移。

### E4 编辑器弹出层挂载 API（P1，对接刚需）

- 现状：编辑器 DOM 挂在引擎 root 内，下拉/日期面板越出表格边界被 `overflow:hidden` 裁切。
- 要求：提供 `setPopupHost(element)`（或 `editorHostMode: 'inline' | 'body'`）把编辑器宿主提升到 body；弹出层定位由引擎负责换算（root 坐标 → 视口坐标）；IME 守卫、commit/cancel 回调语义不变。
- 验收：remote-search 下拉在表格底部边缘行打开时完整显示不被裁切；Esc/滚动关闭行为正常。

### E5 填充柄序列推导（P2）

- 现状是重复平铺。补：数字等差（步长=相邻差）、日期序列（日/周/月）、中文星期/月份（一~日、一月~十二月）。参考 FreeSheet `dropCell` 算法思路（只借鉴思想）。
- 验收：A1=1,A2=3 下拉 → 5,7,9；A1=2026-01-31 下拉月 → 02-28（月末钳制）；A1="周一" 下拉 → 周二…周日循环。

### E6 编辑提交后焦点移动（P2，Excel 习惯）

- 提交后按上次导航方向移动焦点格（Enter→下移、Tab→右移、Shift+Tab→左移），越界钳制。
- 验收：连续编辑一行 5 格按 Tab 流畅右移，最后一列提交后回到下一行首列（与 Excel 对照）。

---

## B 组 · 适配层与工程（UI 开发者）

### U1 web-component 包完善（P0）

1. **engineReady**：wrapper 增加 `whenReady(): Promise<Engine>`（firstUpdated 完成后 resolve），化解"父 firstUpdated 时子 engine 未创建"的时序坑；playground 现有 rAF 轮询替换为该 API。
2. **columns 热更新**：`columns` property 变化 → 重建列模型并保留数据与选区（当前仅 data 支持热更；列结构变化需引擎侧支持或 wrapper 层重建实例，方案二选一，写明取舍）。
3. **事件类型完善**：`SheetXEventTypes` 补全 detail 类型导出，宿主 `addEventListener` 可获得类型提示。
4. **文档**：包内 README（属性/事件/方法三张表 + 五分钟上手），与根目录《引擎使用与对接指南》互相引用。

### U2 / U3 vue、react 适配层（P2）

- vue：薄壳组件 `useSheetXGrid()`（onMounted 创建 / onBeforeUnmount 销毁 / props 透传 / events emit）；
- react：`useRef + useEffect`（严格模式双调用安全：清理函数 destroy，重跑重建）；
- 验收：各自 demo 页在 playground `#vue` / `#react` 路由跑通编辑+事件+undo。

---

## C 组 · Playground UI 对接（把五张设计稿接上真引擎）

> 原则：**布局与视觉保持设计稿不变**，只把 mock DOM 表格换成引擎实例驱动；每张稿一个任务，独立可验收。

| 任务 | 内容 | 关键点 |
|---|---|---|
| C1（P0） | 第02张 Grid 稿接 `@sheetx/grid` | 列定义/200 行数据/行选中/批量修改浮层接真实 API；分页接 LocalAdapter |
| C2（P0） | 第03张 Spreadsheet 稿接 `@sheetx/spreadsheet` | 公式栏双向绑定（输入 `=SUM(..)` 回车写入）、多工作表标签接 sheet 事件、数字格式面板接 setCellStyle numFmt；图表仍用 SVG（引擎不管图表） |
| C3（P1） | 第04张编辑器稿接编辑器系统 | 商品搜索→remote-search（query mock 800ms）、金额快捷按钮→editorParams、日期选择器→date 编辑器；对比设计稿微调 |
| C4（P1） | 第05张虚拟滚动稿接 10 万行 | 数据生成 100k 行；性能面板接 `getRenderStats()`（fps/lastRenderMs/blitFrames 实时刷新）；滚动期间 fps ≥ 55 为达标 |
| C5（P1） | 第01张主界面整合 | 工具栏命令（撤销/重做/校验/导出 CSV）接引擎；右侧属性面板显示选中格真实值；状态栏显示行×列与渲染耗时 |

**纪律**：C 组任务一律用 `<sheetx-grid>` / `<sheetx-spreadsheet>` 元素方式接入（验证适配层），不直接 import 引擎工厂；发现 wrapper 缺口回 U1 修。

---

## D 组 · 阶段验收（浏览器实测，缺一不可）

| # | 验收项 | 方法 | 标准 |
|---|---|---|---|
| D1 | 10 万行滚动帧率 | C4 页面连续滚动 10s，`getRenderStats().fps` | ≥ 55 FPS |
| D2 | 中文 IME | 微软拼音在单元格连续输入/选词/Esc 取消/Enter 提交/中途换格 | 不丢字、不重复、composing 中 Enter 不提交 |
| D3 | Excel 剪贴板互操作 | Excel/WPS 复制 3×3 区域 → SheetX 粘贴；反向复制回 Excel | 行列结构与数值一致 |
| D4 | 撤销/重做 | 编辑→Ctrl+Z→Ctrl+Y；插行→撤销恢复位置与数据 | 与操作逆序完全一致 |
| D5 | 脏矩形可视化 | `createGrid({debug:true})` 编辑单格 | 只出现局部红框（重绘范围正确） |
| D6 | 公式正确性 | E1 环用例 + 19 个函数抽样 + 跨表引用 | 全绿 |

---

## 里程碑与依赖

```
M1（先行，~本周）      E1 环检测 ──┐
                       U1 wrapper 完善 ──┼──> C1、C2 对接可开始
                       （E1 是 C2 公式演示的前置）
M2                     C3、C4、C5 + D1~D4 验收
M3（可并行）           E3 冻结行、E4 弹出层、E5/E6 打磨、U2/U3
```

- E1、U1 是 C 组的前置；E4 与 C3 有耦合（remote-search 下拉裁切），建议同批。
- 所有引擎接口变更走 `@sheetx/core` 契约，禁止包内私自定义跨包类型（沿用任务书 §0 纪律）。
- 许可红线不变：借鉴 Univer/FS 思想，不复制代码，注释标注来源。
