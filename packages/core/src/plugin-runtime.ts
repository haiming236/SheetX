/**
 * @sheetx/core - 插件运行时（M4「插件中心与扩展生态」）
 *
 * plugin.ts 只定义契约，本模块提供可执行的注册/依赖排序/生命周期/扩展点记账：
 * - 插件目录（manifest）与安装状态分离：市场列表 ≠ 已安装插件；
 * - 依赖拓扑排序，缺失依赖、循环依赖、未启用依赖直接拒绝；
 * - 按 STARTING → READY → RENDERED → STEADY 推进生命周期，错误按插件隔离；
 * - 所有扩展点注册统一记账（command/editor/formatter/renderer/dataAdapter/theme/menu/function），
 *   便于宿主做「扩展管理 / 安全审计 / 热禁用」；
 * - 状态可序列化到 localStorage/服务端，零运行时依赖，浏览器与 Node 均可运行。
 */
import { PluginStage, type PluginStageValue } from './plugin.js'

/** 一等扩展点：插件能通过它们向宿主注入能力 */
export const EXTENSION_POINTS = [
  'command',
  'editor',
  'formatter',
  'renderer',
  'dataAdapter',
  'theme',
  'menu',
  'function',
] as const

export type ExtensionPoint = (typeof EXTENSION_POINTS)[number]

export const EXTENSION_POINT_LABELS: Record<ExtensionPoint, string> = {
  command: '命令',
  editor: '编辑器',
  formatter: '格式化器',
  renderer: '渲染器',
  dataAdapter: '数据适配器',
  theme: '主题',
  menu: '菜单',
  function: '函数',
}

/** 插件市场条目（可序列化，UI 只依赖这一层元数据） */
export interface PluginManifest {
  id: string
  name: string
  version: string
  category?: string
  description?: string
  publisher?: string
  dependencies?: readonly string[]
  extensionPoints?: readonly ExtensionPoint[]
  rating?: number
  downloads?: number
  recommended?: boolean
}

export type PluginHookName = 'onStarting' | 'onReady' | 'onRendered' | 'onSteady'

export interface PluginHooks {
  onStarting?(ctx: PluginRuntimeContext): void | Promise<void>
  onReady?(ctx: PluginRuntimeContext): void | Promise<void>
  onRendered?(ctx: PluginRuntimeContext): void | Promise<void>
  onSteady?(ctx: PluginRuntimeContext): void | Promise<void>
  onDisable?(ctx: PluginRuntimeContext): void | Promise<void>
}

export interface RuntimePlugin extends PluginManifest {
  hooks?: PluginHooks
}

/** 宿主暴露的真实注册能力；缺省为空表示只做运行时代办，不接引擎 */
export interface ExtensionHost {
  registerCommand?(name: string, handler: unknown): void
  registerEditor?(name: string, factory: unknown): void
  registerFormatter?(name: string, formatter: unknown): void
  registerRenderer?(name: string, renderer: unknown): void
  registerDataAdapter?(name: string, adapter: unknown): void
  registerTheme?(name: string, theme: unknown): void
  registerMenu?(name: string, menu: unknown): void
  registerFunction?(name: string, fn: unknown): void
}

export interface ExtensionRegistration {
  pluginId: string
  point: ExtensionPoint
  name: string
  /** 真实注入值；仅做元数据声明时为 undefined */
  payload?: unknown
}

export interface PluginRuntimeContext extends ExtensionHost {
  readonly id: string
  readonly manifest: Readonly<RuntimePlugin>
  log(message: string): void
}

export type PluginStageName = PluginStageValue | 'disabled' | 'error'

export interface PluginStatus {
  id: string
  installed: boolean
  enabled: boolean
  stage: PluginStageName
  error?: string
}

export interface ActivationEvent {
  pluginId: string
  stage: PluginStageName
  ok: boolean
  message?: string
  at: string
}

export type PluginSort = 'recommended' | 'downloads' | 'rating' | 'name'

export interface PluginFilter {
  query?: string
  category?: string
  sort?: PluginSort
  installedOnly?: boolean
  installedIds?: ReadonlySet<string>
}

/** 排序/筛选是纯函数：页面与服务端市场可共用同一套语义 */
export function filterPlugins(
  plugins: ReadonlyArray<PluginManifest>,
  filter: PluginFilter = {},
): PluginManifest[] {
  const keyword = filter.query?.trim().toLocaleLowerCase() ?? ''
  const result = plugins.filter((plugin) => {
    if (filter.category && filter.category !== '全部插件' && plugin.category !== filter.category) return false
    if (filter.installedOnly && !filter.installedIds?.has(plugin.id)) return false
    if (!keyword) return true
    const haystack = [
      plugin.id, plugin.name, plugin.description ?? '', plugin.category ?? '', plugin.publisher ?? '',
      ...(plugin.extensionPoints ?? []).map((point) => EXTENSION_POINT_LABELS[point]),
    ].join(' ').toLocaleLowerCase()
    return haystack.includes(keyword)
  })

  const sort = filter.sort ?? 'recommended'
  return result.sort((a, b) => {
    if (sort === 'downloads') return (b.downloads ?? 0) - (a.downloads ?? 0) || a.name.localeCompare(b.name, 'zh-CN')
    if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name, 'zh-CN')
    if (sort === 'name') return a.name.localeCompare(b.name, 'zh-CN')
    // 推荐排序 = 市场运营给出的清单顺序（稳定排序保留 manifest 顺序）
    return 0
  })
}

/**
 * 依赖拓扑排序。enabledIds 为空表示全部参与；传入时只保留启用插件，
 * 但启用插件依赖的插件也必须处于 enabledIds，否则拒绝（不允许隐式拉起已禁用插件）。
 */
export function resolvePluginOrder(
  plugins: ReadonlyArray<PluginManifest>,
  enabledIds?: ReadonlySet<string>,
): string[] {
  const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]))
  const order: string[] = []
  const visiting = new Set<string>()
  const done = new Set<string>()

  const visit = (id: string, chain: string[]): void => {
    if (done.has(id)) return
    if (visiting.has(id)) throw new Error(`插件依赖存在循环：${[...chain, id].join(' → ')}`)
    const plugin = byId.get(id)
    if (!plugin) throw new Error(`插件依赖缺失：${id}`)
    if (enabledIds && !enabledIds.has(id)) throw new Error(`依赖插件未启用：${id}`)
    visiting.add(id)
    for (const dependency of plugin.dependencies ?? []) visit(dependency, [...chain, id])
    visiting.delete(id)
    done.add(id)
    order.push(id)
  }

  for (const plugin of plugins) {
    if (!enabledIds || enabledIds.has(plugin.id)) visit(plugin.id, [])
  }
  return order
}

const HOST_METHOD: Record<ExtensionPoint, keyof ExtensionHost> = {
  command: 'registerCommand',
  editor: 'registerEditor',
  formatter: 'registerFormatter',
  renderer: 'registerRenderer',
  dataAdapter: 'registerDataAdapter',
  theme: 'registerTheme',
  menu: 'registerMenu',
  function: 'registerFunction',
}

const STAGE_HOOK: Record<PluginStageValue, PluginHookName> = {
  [PluginStage.STARTING]: 'onStarting',
  [PluginStage.READY]: 'onReady',
  [PluginStage.RENDERED]: 'onRendered',
  [PluginStage.STEADY]: 'onSteady',
}

const STAGES: PluginStageValue[] = [PluginStage.STARTING, PluginStage.READY, PluginStage.RENDERED, PluginStage.STEADY]

export class PluginRuntime {
  private readonly catalog = new Map<string, RuntimePlugin>()
  private states = new Map<string, PluginStatus>()
  private registrations: ExtensionRegistration[] = []
  private events: ActivationEvent[] = []

  constructor(private readonly host: ExtensionHost = {}) {}

  /** 登记到目录；默认视为已安装并启用，市场页面可传 installed:false */
  add(plugin: RuntimePlugin, options: { installed?: boolean; enabled?: boolean } = {}): PluginStatus {
    if (this.catalog.has(plugin.id)) throw new Error(`插件重复注册：${plugin.id}`)
    this.catalog.set(plugin.id, plugin)
    const installed = options.installed ?? true
    const enabled = installed && (options.enabled ?? true)
    const status: PluginStatus = { id: plugin.id, installed, enabled, stage: enabled ? PluginStage.READY : 'disabled' }
    this.states.set(plugin.id, status)
    return status
  }

  addAll(plugins: ReadonlyArray<RuntimePlugin>, options: { installed?: boolean; enabled?: boolean } = {}): void {
    for (const plugin of plugins) this.add(plugin, options)
  }

  get(id: string): RuntimePlugin | undefined {
    return this.catalog.get(id)
  }

  list(): RuntimePlugin[] {
    return [...this.catalog.values()]
  }

  status(id: string): PluginStatus | undefined {
    return this.states.get(id)
  }

  statuses(): PluginStatus[] {
    return [...this.states.values()]
  }

  installedIds(): Set<string> {
    return new Set([...this.states.entries()].filter(([, state]) => state.installed).map(([id]) => id))
  }

  install(id: string): PluginStatus {
    const plugin = this.catalog.get(id)
    if (!plugin) throw new Error(`插件不存在：${id}`)
    const state = this.states.get(id)!
    const next: PluginStatus = { ...state, installed: true, enabled: true, stage: PluginStage.READY, error: undefined }
    this.states.set(id, next)
    return next
  }

  /** 有其它已安装插件依赖它时拒绝卸载，避免产生隐式断裂 */
  async uninstall(id: string): Promise<boolean> {
    const plugin = this.catalog.get(id)
    if (!plugin) return false
    for (const other of this.catalog.values()) {
      if (other.id === id) continue
      const state = this.states.get(other.id)
      if (state?.installed && other.dependencies?.includes(id)) {
        throw new Error(`请先卸载依赖它的插件：${other.name}`)
      }
    }
    const state = this.states.get(id)!
    if (state.enabled) {
      try {
        await plugin.hooks?.onDisable?.(this.createContext(plugin))
      } catch (error) {
        this.pushEvent(id, 'error', false, error instanceof Error ? error.message : String(error))
      }
    }
    this.registrations = this.registrations.filter((registration) => registration.pluginId !== id)
    this.states.set(id, { ...state, installed: false, enabled: false, stage: 'disabled', error: undefined })
    return true
  }

  async enable(id: string): Promise<PluginStatus> {
    const state = this.states.get(id)
    if (!state?.installed) throw new Error(`插件未安装：${id}`)
    this.states.set(id, { ...state, enabled: true, stage: PluginStage.READY, error: undefined })
    await this.activate([id])
    return this.states.get(id)!
  }

  async disable(id: string): Promise<boolean> {
    const plugin = this.catalog.get(id)
    const state = this.states.get(id)
    if (!plugin || !state) return false
    if (state.enabled) {
      try {
        await plugin.hooks?.onDisable?.(this.createContext(plugin))
      } catch (error) {
        this.pushEvent(id, 'error', false, error instanceof Error ? error.message : String(error))
      }
    }
    this.registrations = this.registrations.filter((registration) => registration.pluginId !== id)
    this.states.set(id, { ...state, enabled: false, stage: 'disabled', error: undefined })
    return true
  }

  /**
   * 按依赖顺序激活。单个插件抛错只把它自己标记为 error，依赖它的插件跳过；
   * 其余插件继续加载，避免「一个坏插件拖垮整个表格」。
   */
  async activate(ids?: ReadonlyArray<string>): Promise<ActivationEvent[]> {
    const before = this.events.length
    const enabled = new Set(
      [...this.states.entries()]
        .filter(([, state]) => state.installed && state.enabled)
        .map(([id]) => id),
    )
    const candidates = ids ? [...ids] : this.list().map((plugin) => plugin.id)
    let order: string[]
    try {
      order = resolvePluginOrder(
        candidates.map((id) => this.catalog.get(id)).filter((plugin): plugin is RuntimePlugin => Boolean(plugin)),
        new Set(candidates.filter((id) => enabled.has(id))),
      )
    } catch (error) {
      this.pushEvent('runtime', 'error', false, error instanceof Error ? error.message : String(error))
      return this.events.slice(before)
    }

    for (const id of order) {
      const plugin = this.catalog.get(id)!
      const state = this.states.get(id)!
      if (!state.installed || !state.enabled) continue
      const failedDependency = (plugin.dependencies ?? []).find((dep) => this.states.get(dep)?.stage === 'error')
      if (failedDependency) {
        const message = `依赖插件加载失败：${failedDependency}`
        this.states.set(id, { ...state, stage: 'error', error: message })
        this.pushEvent(id, 'error', false, message)
        continue
      }
      const ctx = this.createContext(plugin)
      for (const point of plugin.extensionPoints ?? []) {
        this.registerExtension(plugin.id, point, `${plugin.id}:${point}`)
      }
      try {
        for (const stage of STAGES) {
          this.states.set(id, { ...this.states.get(id)!, stage })
          this.pushEvent(id, stage, true)
          const hook = plugin.hooks?.[STAGE_HOOK[stage]]
          if (hook) await hook(ctx)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.states.set(id, { ...this.states.get(id)!, stage: 'error', error: message })
        this.pushEvent(id, 'error', false, message)
      }
    }
    return this.events.slice(before)
  }

  /** 扩展点账本：UI 用它渲染「扩展管理」面板，宿主也可用它做安全审计 */
  extensions(point?: ExtensionPoint): ExtensionRegistration[] {
    return point
      ? this.registrations.filter((registration) => registration.point === point)
      : [...this.registrations]
  }

  summary(): Array<{ point: ExtensionPoint; label: string; count: number; pluginIds: string[] }> {
    return EXTENSION_POINTS.map((point) => {
      const rows = this.registrations.filter((registration) => registration.point === point)
      return {
        point,
        label: EXTENSION_POINT_LABELS[point],
        count: rows.length,
        pluginIds: [...new Set(rows.map((row) => row.pluginId))],
      }
    })
  }

  getEvents(): ActivationEvent[] {
    return [...this.events]
  }

  clearEvents(): void {
    this.events = []
  }

  /** 只持久化安装状态；插件代码/manifest 由市场或宿主提供，不反序列化任意对象 */
  serialize(): string {
    return JSON.stringify({ version: 1, states: this.statuses() })
  }

  deserialize(json: string): boolean {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!parsed || typeof parsed !== 'object') return false
      const data = parsed as { version?: unknown; states?: unknown }
      if (data.version !== 1 || !Array.isArray(data.states)) return false
      const next = new Map(this.states)
      for (const raw of data.states) {
        if (!raw || typeof raw !== 'object') continue
        const item = raw as Partial<PluginStatus>
        if (typeof item.id !== 'string' || typeof item.installed !== 'boolean' || typeof item.enabled !== 'boolean') continue
        const enabled = item.installed && item.enabled
        next.set(item.id, {
          id: item.id,
          installed: item.installed,
          enabled,
          stage: enabled ? (item.stage ?? PluginStage.READY) : 'disabled',
          error: undefined,
        })
      }
      this.states = next
      return true
    } catch {
      return false
    }
  }

  private registerExtension(pluginId: string, point: ExtensionPoint, name: string, payload?: unknown): void {
    this.registrations = [...this.registrations.filter((row) => !(row.pluginId === pluginId && row.name === name)), {
      pluginId,
      point,
      name,
      payload,
    }]
    const method = this.host[HOST_METHOD[point]]
    if (typeof method === 'function') method.call(this.host, name, payload)
  }

  private createContext(plugin: RuntimePlugin): PluginRuntimeContext {
    const wrap = (point: ExtensionPoint, name: string, value: unknown): void => {
      this.registerExtension(plugin.id, point, name, value)
    }
    return {
      id: plugin.id,
      manifest: plugin,
      log: (message) => this.pushEvent(plugin.id, PluginStage.STEADY, true, message),
      registerCommand: (name, handler) => wrap('command', name, handler),
      registerEditor: (name, factory) => wrap('editor', name, factory),
      registerFormatter: (name, formatter) => wrap('formatter', name, formatter),
      registerRenderer: (name, renderer) => wrap('renderer', name, renderer),
      registerDataAdapter: (name, adapter) => wrap('dataAdapter', name, adapter),
      registerTheme: (name, theme) => wrap('theme', name, theme),
      registerMenu: (name, menu) => wrap('menu', name, menu),
      registerFunction: (name, fn) => wrap('function', name, fn),
    }
  }

  private pushEvent(pluginId: string, stage: PluginStageName, ok: boolean, message?: string): void {
    this.events.push({
      pluginId,
      stage,
      ok,
      message,
      at: new Date().toISOString(),
    })
  }
}
