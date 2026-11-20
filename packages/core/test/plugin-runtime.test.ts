/** 插件运行时：筛选排序、依赖拓扑、生命周期、扩展点账本、状态持久化 */
import { describe, it, expect } from 'vitest'
import {
  filterPlugins,
  resolvePluginOrder,
  PluginRuntime,
  EXTENSION_POINTS,
  type PluginManifest,
  type RuntimePlugin,
} from '../src/plugin-runtime.js'

const plugins: PluginManifest[] = [
  { id: 'db', name: '数据库连接', version: '1.2.0', category: '数据连接', rating: 4.9, downloads: 1230, extensionPoints: ['dataAdapter'] },
  { id: 'chart', name: '高级图表库', version: '1.5.0', category: '可视化与图表', rating: 4.8, downloads: 1102, extensionPoints: ['renderer'] },
  { id: 'ai', name: 'AI 助手', version: '1.0.0', category: 'AI 助手', rating: 4.9, downloads: 2413, recommended: true, extensionPoints: ['command', 'function'] },
  { id: 'format', name: '格式扩展包', version: '1.3.0', category: '导入导出', rating: 4.7, downloads: 698, extensionPoints: ['formatter'] },
]

describe('filterPlugins · 市场筛选与排序', () => {
  it('按关键词匹配名称/分类/扩展点', () => {
    expect(filterPlugins(plugins, { query: '图表' }).map((item) => item.id)).toEqual(['chart'])
    expect(filterPlugins(plugins, { query: '适配器' }).map((item) => item.id)).toEqual(['db'])
  })

  it('按分类筛选，全部插件不做过滤', () => {
    expect(filterPlugins(plugins, { category: 'AI 助手' }).map((item) => item.id)).toEqual(['ai'])
    expect(filterPlugins(plugins, { category: '全部插件' })).toHaveLength(4)
  })

  it('按下载量/评分/名称排序，推荐排序优先推荐位', () => {
    expect(filterPlugins(plugins, { sort: 'downloads' })[0]!.id).toBe('ai')
    expect(filterPlugins(plugins, { sort: 'rating' })[0]!.id).toBe('db')
    const byName = filterPlugins(plugins, { sort: 'name' }).map((item) => item.name)
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b, 'zh-CN')))
    expect(filterPlugins(plugins, { sort: 'recommended' }).map((item) => item.id)).toEqual(plugins.map((item) => item.id))
  })

  it('installedOnly 只留下已安装集合中的插件', () => {
    const installed = new Set(['db', 'format'])
    expect(filterPlugins(plugins, { installedOnly: true, installedIds: installed }).map((item) => item.id)).toEqual(['db', 'format'])
  })
})

describe('resolvePluginOrder · 依赖拓扑', () => {
  it('依赖先于使用者', () => {
    const graph: PluginManifest[] = [
      { id: 'ui', name: '业务组件', version: '1', dependencies: ['db', 'chart'] },
      { id: 'db', name: '数据库', version: '1' },
      { id: 'chart', name: '图表', version: '1', dependencies: ['db'] },
    ]
    expect(resolvePluginOrder(graph)).toEqual(['db', 'chart', 'ui'])
  })

  it('缺失依赖、循环依赖、未启用依赖都拒绝', () => {
    expect(() => resolvePluginOrder([{ id: 'a', name: 'A', version: '1', dependencies: ['ghost'] }])).toThrow(/缺失/)
    expect(() => resolvePluginOrder([
      { id: 'a', name: 'A', version: '1', dependencies: ['b'] },
      { id: 'b', name: 'B', version: '1', dependencies: ['a'] },
    ])).toThrow(/循环/)
    expect(() => resolvePluginOrder([
      { id: 'a', name: 'A', version: '1', dependencies: ['b'] },
      { id: 'b', name: 'B', version: '1' },
    ], new Set(['a']))).toThrow(/未启用/)
  })
})

describe('PluginRuntime · 生命周期与扩展点', () => {
  const makePlugins = (): RuntimePlugin[] => [
    {
      id: 'db', name: '数据库', version: '1', category: '数据连接',
      extensionPoints: ['dataAdapter', 'command'],
      hooks: {
        onStarting: (ctx) => { ctx.registerDataAdapter('rest', { kind: 'rest' }) },
        onReady: (ctx) => { ctx.registerCommand('db.connect', () => true) },
      },
    },
    {
      id: 'chart', name: '图表', version: '1', category: '可视化',
      dependencies: ['db'], extensionPoints: ['renderer'],
      hooks: { onRendered: (ctx) => { ctx.registerRenderer('badge', { draw() {} }) } },
    },
  ]

  it('按依赖顺序激活，扩展点注册被完整记账', async () => {
    const runtime = new PluginRuntime()
    runtime.addAll(makePlugins())
    const events = await runtime.activate()
    expect(events.map((event) => event.pluginId)).toEqual([
      'db', 'db', 'db', 'db', 'chart', 'chart', 'chart', 'chart',
    ])
    expect(runtime.status('db')?.stage).toBe('steady')
    expect(runtime.extensions('dataAdapter').map((row) => row.name)).toEqual(['db:dataAdapter', 'rest'])
    expect(runtime.summary().find((row) => row.point === 'renderer')?.pluginIds).toEqual(['chart'])
    expect(runtime.summary()).toHaveLength(EXTENSION_POINTS.length)
  })

  it('插件抛错被隔离，依赖它的插件跳过，其它插件继续', async () => {
    const runtime = new PluginRuntime()
    runtime.addAll([
      { id: 'broken', name: '坏插件', version: '1', hooks: { onStarting: () => { throw new Error('boom') } } },
      { id: 'child', name: '依赖插件', version: '1', dependencies: ['broken'] },
      { id: 'ok', name: '正常插件', version: '1', hooks: { onSteady: (ctx) => { ctx.log('done') } } },
    ])
    await runtime.activate()
    expect(runtime.status('broken')?.stage).toBe('error')
    expect(runtime.status('child')?.stage).toBe('error')
    expect(runtime.status('child')?.error).toMatch(/依赖插件加载失败/)
    expect(runtime.status('ok')?.stage).toBe('steady')
  })

  it('有下游依赖时拒绝卸载，卸载后清掉扩展注册', async () => {
    const runtime = new PluginRuntime()
    runtime.addAll(makePlugins())
    await runtime.activate()
    expect(() => runtime.status('db')).not.toThrow()
    await expect(runtime.uninstall('db')).rejects.toThrow(/业务组件|图表/)
    expect(await runtime.uninstall('chart')).toBe(true)
    expect(runtime.extensions('renderer')).toHaveLength(0)
    expect(runtime.status('chart')?.stage).toBe('disabled')
  })

  it('安装状态可序列化往返，非法数据不破坏现有状态', () => {
    const runtime = new PluginRuntime()
    runtime.add({ id: 'db', name: '数据库', version: '1' }, { installed: false, enabled: false })
    runtime.install('db')
    const json = runtime.serialize()
    const restored = new PluginRuntime()
    restored.add({ id: 'db', name: '数据库', version: '1' }, { installed: false, enabled: false })
    expect(restored.deserialize(json)).toBe(true)
    expect(restored.status('db')).toMatchObject({ installed: true, enabled: true })
    expect(restored.deserialize('{}')).toBe(false)
    expect(restored.status('db')?.installed).toBe(true)
  })
})
