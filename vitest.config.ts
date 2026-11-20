import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 大多数引擎逻辑是纯计算（Node 环境即可）；
    // 涉及 DOM 的测试（editors/interaction）在用例内用 @vitest-environment jsdom 标注。
    environment: 'node',
    include: ['packages/**/test/**/*.test.ts'],
    // strict 模式下 vitest globals 关闭，测试文件显式 import { describe, it, expect }
    globals: false,
  },
})
