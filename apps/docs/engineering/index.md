# 工程总览

本栏目覆盖性能、测试、兼容性与常见问题，帮助开发者验证集成效果、定位问题。

## 内容地图

| 主题 | 文档 |
|---|---|
| 性能基准（真实 rAF 指标） | [性能基准](/engineering/performance) |
| 单测 / E2E / 类型检查 | [测试与验收](/engineering/testing) |
| 浏览器与 API 能力矩阵 | [浏览器兼容](/engineering/compatibility) |
| 高频问题 | [常见问题 FAQ](/engineering/faq) |

## 质量原则

- **不凭感觉**：性能与交互均有落盘的真实报告（`apps/benchmark/report.json`、`apps/e2e/report.json`）。
- **CI 可复现**：benchmark / E2E 都有独立应用与脚本，可在 CI 按基线浏览器补跑。
- **降级可验证**：新 API 缺失时的主线程路径有单测覆盖。

## 命令速查

```bash
pnpm typecheck     # 全工程类型检查
pnpm test          # 全部单元测试
pnpm test:e2e      # 浏览器级交互验收
pnpm build         # 构建所有 packages + benchmark + e2e
pnpm build:docs    # 构建文档站
```

## 下一步

从 [性能基准](/engineering/performance) 了解真实数字，或回到 [文档首页](/)。
