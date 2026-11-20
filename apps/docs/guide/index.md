# 使用指南

欢迎阅读 SheetX 使用指南。本栏目按「先跑起来 → 理解架构 → 深入细节」的顺序组织。

## 阅读路径建议

| 你的角色 | 建议顺序 |
|---|---|
| 业务系统前端 | [快速开始](/guide/getting-started) → [安装与集成](/guide/installation) → [SheetXGrid API](/api/grid) → [编辑器](/api/editors) |
| 架构 / 引擎开发者 | [架构总览](/guide/architecture) → [包地图](/guide/packages) → [渲染管线](/advanced/rendering) → [并行计算](/advanced/worker) |
| 想评估能力边界 | [双模式](/guide/dual-mode) → [状态与路线](/guide/roadmap) → [性能基准](/engineering/performance) → [FAQ](/engineering/faq) |

## 文档约定

- 代码块默认使用 TypeScript；`createGrid` / `createSpreadsheet` 为公共工厂函数。
- 标注 **⚠️** 的段落是实战中踩过坑、必须遵守的约束（如行 id 稳定性、Canvas 只能 transfer 一次）。
- 标注 **提示** 的段落是可选项或性能建议，不影响正确性。

## 下一步

从 [快速开始](/guide/getting-started) 开始，五分钟内跑起第一个 Grid。
