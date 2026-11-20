import { defineConfig } from 'vitepress'

/**
 * SheetX 官方文档站配置
 * - 导航：指南 / API / 进阶 / 工程 / 资源
 * - 侧栏：按栏目分组，链接到各栏目 index 作为落地页
 * - 搜索：本地全文搜索（零后端依赖，与引擎"纯前端"定位一致）
 */
export default defineConfig({
  title: 'SheetX',
  description: '面向 Web 应用的高性能嵌入式表格引擎（Grid + Spreadsheet 双模式）',
  lang: 'zh-CN',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['meta', { name: 'theme-color', content: '#3451f6' }],
    ['meta', { name: 'og:title', content: 'SheetX 文档 · 嵌入式表格引擎' }],
    ['meta', { name: 'og:description', content: '面向业务系统的高性能 Web 表格引擎：数据网格 + 电子表格双模式，Canvas 渲染、虚拟滚动、公式增量计算。' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    // 官方 Logo 自带 "Sheet X" 文字，siteTitle 留空避免重复（logo 的 aria-label 已提供无障碍名称）
    siteTitle: '',
    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API 参考', link: '/api/', activeMatch: '/api/' },
      { text: '进阶', link: '/advanced/', activeMatch: '/advanced/' },
      { text: '工程', link: '/engineering/', activeMatch: '/engineering/' },
      {
        text: '资源',
        items: [
          { text: '引擎使用与对接指南', link: 'https://github.com/sheetx/sheetx', target: '_blank' },
          { text: '性能基准报告', link: '/engineering/performance' },
          { text: '状态与路线', link: '/guide/roadmap' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '文档首页', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装与集成', link: '/guide/installation' },
          ],
        },
        {
          text: '核心概念',
          items: [
            { text: '架构总览', link: '/guide/architecture' },
            { text: '双模式：Grid 与 Spreadsheet', link: '/guide/dual-mode' },
            { text: '包地图与依赖方向', link: '/guide/packages' },
            { text: '状态与路线', link: '/guide/roadmap' },
          ],
        },
      ],
      '/api/': [
        {
          text: '公共 API',
          items: [
            { text: 'API 总览', link: '/api/' },
            { text: 'SheetXGrid', link: '/api/grid' },
            { text: 'SheetXSpreadsheet', link: '/api/spreadsheet' },
            { text: '事件系统', link: '/api/events' },
          ],
        },
        {
          text: '扩展 API',
          items: [
            { text: '编辑器', link: '/api/editors' },
            { text: '公式与函数', link: '/api/formula' },
            { text: '格式化器', link: '/api/formatters' },
          ],
        },
      ],
      '/advanced/': [
        {
          text: '渲染与计算',
          items: [
            { text: '进阶总览', link: '/advanced/' },
            { text: '渲染管线与脏矩形', link: '/advanced/rendering' },
            { text: '后台渲染（OffscreenCanvas）', link: '/advanced/offscreen' },
            { text: '并行计算（Web Worker）', link: '/advanced/worker' },
          ],
        },
        {
          text: '数据与扩展',
          items: [
            { text: 'XLSX 导入导出', link: '/advanced/xlsx' },
            { text: '主题系统', link: '/advanced/themes' },
            { text: '插件与扩展生态', link: '/advanced/plugins' },
          ],
        },
      ],
      '/engineering/': [
        {
          text: '工程与质量',
          items: [
            { text: '工程总览', link: '/engineering/' },
            { text: '性能基准', link: '/engineering/performance' },
            { text: '测试与验收', link: '/engineering/testing' },
            { text: '浏览器兼容', link: '/engineering/compatibility' },
            { text: '常见问题（FAQ）', link: '/engineering/faq' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
      options: {
        placeholder: '搜索文档…',
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询',
            displayDetails: '显示详情',
            backButtonTitle: '返回',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    editLink: {
      pattern: 'https://github.com/sheetx/sheetx/edit/main/apps/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      message: 'MIT 核心开源 · 专为企业业务系统打造的嵌入式表格引擎',
      copyright: 'Copyright © 2026 SheetX',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sheetx/sheetx' }],
  },
})
