/**
 * SheetX 第 34 张 · 开发者调试与性能监控
 *
 * 面向第三方开发者排查集成问题：帧率 / 内存 / 渲染耗时 / 数据量 / 虚拟滚动 /
 * 事件追踪 / API 调用日志。多序列 SVG 趋势图 + 实时采样 + 日志筛选 + 报告导出。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { debugStyles } from './debug-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  LEFT_NAV, TIME_RANGES, SAMPLE_INTERVALS, SAMPLES, METRICS, EVENT_LOGS,
  LOG_FILTERS, COMPONENTS, API_STATS, PERF_TIP, buildReport, DEFAULT_CONFIG,
  type FullConfig,
} from './debug-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置', '开发者工具']
const STORE_KEY = 'sx:debug-config'

@customElement('debug-app')
export class DebugApp extends LitElement {
  static styles = [baseStyles, lightTokens, debugStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '开发者工具'
  @state() private nav = 'performance'
  @state() private cfg: FullConfig = this.load()
  @state() private tooltip: { x: number; y: number; idx: number } | null = null
  @state() private tick = 0
  @state() private samplePaused = false

  private stopTheme: (() => void) | null = null
  private timer: number | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.startSampling()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    if (this.timer !== null) window.clearInterval(this.timer)
  }

  private startSampling(): void {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = window.setInterval(() => {
      if (this.cfg.monitoring && !this.samplePaused) this.tick++
    }, 1000)
  }

  private load(): FullConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...structuredClone(DEFAULT_CONFIG), ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return structuredClone(DEFAULT_CONFIG)
  }

  private patch(key: keyof FullConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg)) } catch { /* 忽略 */ }
    if (key === 'interval') this.startSampling()
  }

  private chooseNav(key: string): void {
    this.nav = key
    if (key !== 'performance') toast(`${LEFT_NAV.find((n) => n.key === key)?.label}（当前演示聚焦性能监控）`)
  }

  private visibleSamples() {
    const range = this.cfg.timeRange
    const n = range === '1分钟' ? 12 : range === '5分钟' ? 60 : range === '15分钟' ? 60 : 60
    return SAMPLES.slice(-n)
  }

  private clearData(): void {
    this.samplePaused = true
    this.tick = 0
    toast('监控数据已清空（演示：暂停采样）')
  }

  private resume(): void {
    this.samplePaused = false
    toast('采样已恢复')
  }

  private exportReport(): void {
    const report = buildReport()
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sheetx-performance-report.txt'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('性能报告已导出')
  }

  private clearCache(): void {
    toast('数据缓存已清理（128 MB → 0 MB）')
  }

  /* ================= 趋势图 ================= */

  private renderChart(): TemplateResult {
    const samples = this.visibleSamples()
    const W = 600, H = 180, PL = 30, PR = 10, PT = 8, PB = 22
    const iw = W - PL - PR, ih = H - PT - PB
    const x = (i: number) => PL + (i / Math.max(1, samples.length - 1)) * iw
    const yFps = (v: number) => PT + (1 - v / 70) * ih
    const yMem = (v: number) => PT + (1 - v / 160) * ih
    const yCost = (v: number) => PT + (1 - v / 20) * ih
    const path = (fn: (v: number) => number, key: 'fps' | 'mem' | 'cost') =>
      samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${fn(s[key]).toFixed(1)}`).join(' ')
    const ticks = [0, 15, 30, 45, 60]
    return html`
      <div class="chart-area">
        <div class="legend">
          <span><i style="background:#3b82f6"></i>FPS</span>
          <span><i style="background:#22a06b"></i>内存（MB）</span>
          <span><i style="background:#a855f7"></i>渲染耗时（ms）</span>
        </div>
        <!-- Y 轴刻度用 HTML 覆盖层，避免 SVG text 在本环境不渲染的问题 -->
        <div style="position:absolute;left:2px;top:26px;bottom:30px;width:24px;display:flex;flex-direction:column;justify-content:space-between;font-size:9px;color:var(--sx-text-hint);pointer-events:none">
          ${[60, 45, 30, 15, 0].map((t) => html`<span>${t}</span>`)}
        </div>
        <svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
             @mousemove=${(e: MouseEvent) => {
               const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
               const px = (e.clientX - rect.left) / rect.width * W
               const idx = Math.max(0, Math.min(samples.length - 1, Math.round((px - PL) / iw * (samples.length - 1))))
               this.tooltip = { x: x(idx) / W * 100, y: 12, idx }
             }}
             @mouseleave=${() => { this.tooltip = null }}>
          ${ticks.map((t) => html`
            <line class="grid-line" x1=${PL} y1=${yFps(t)} x2=${W - PR} y2=${yFps(t)} />
            <text class="axis-label" x=${2} y=${yFps(t) + 3}>${t}</text>`)}
          <path d=${path(yFps, 'fps')} fill="none" stroke="#3b82f6" stroke-width="1.6" />
          <path d=${path(yMem, 'mem')} fill="none" stroke="#22a06b" stroke-width="1.6" />
          <path d=${path(yCost, 'cost')} fill="none" stroke="#a855f7" stroke-width="1.6" />
          ${samples.length > 0 ? html`
            <line x1=${x(this.tooltip?.idx ?? Math.floor(samples.length / 2))} y1=${PT} x2=${x(this.tooltip?.idx ?? Math.floor(samples.length / 2))} y2=${H - PB} stroke="var(--sx-border-strong)" stroke-width=".8" stroke-dasharray="3 2" />` : nothing}
          <text class="axis-label" x=${PL} y=${H - 4}>14:20</text>
          <text class="axis-label" x=${W / 2 - 12} y=${H - 4}>14:22</text>
          <text class="axis-label" x=${W - PR - 28} y=${H - 4}>14:24</text>
        </svg>
        ${this.tooltip && samples[this.tooltip.idx] ? html`
          <div class="tooltip" style=${`left:${Math.min(82, Math.max(2, this.tooltip.x))}%;top:${this.tooltip.y}px`}>
            <div class="tt">${samples[this.tooltip.idx]!.t}</div>
            <div class="row"><i style="background:#3b82f6"></i>FPS：${samples[this.tooltip.idx]!.fps}</div>
            <div class="row"><i style="background:#22a06b"></i>内存：${samples[this.tooltip.idx]!.mem} MB</div>
            <div class="row"><i style="background:#a855f7"></i>耗时：${samples[this.tooltip.idx]!.cost} ms</div>
          </div>` : nothing}
      </div>`
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m }}>${m}</button>`)}
        </nav>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></div>
        <button class="icon-btn" title="帮助" @click=${() => toast('性能数据由 SheetX 内置监控采集')}>${sxIcon('help', 16)}</button>
        <button class="icon-btn" title="设置" @click=${() => this.chooseNav('panel')}>${sxIcon('settings', 16)}</button>
        <span class="avatar" title="宿主用户">张</span>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">开发者工具</div>
        ${LEFT_NAV.map((item) => html`
          <button class="side-item ${this.nav === item.key ? 'active' : ''}" @click=${() => this.chooseNav(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
      </aside>`
  }

  private renderMetrics(): TemplateResult {
    return html`
      <div class="metrics">
        ${METRICS.map((m) => html`
          <div class="metric">
            <span class="ic" style=${`background:${m.bg};color:${m.color}`}>${sxIcon(m.icon, 19)}</span>
            <div>
              <div class="val">${m.value}<span style="font-size:11px;font-weight:500;color:var(--sx-text-hint);margin-left:3px">${m.unit}</span></div>
              <div class="lbl">${m.label}</div>
            </div>
            <span class="delta ${m.up ? 'up' : 'down'}">${m.up ? sxIcon('arrowUp', 10) : sxIcon('arrowDown', 10)} ${m.delta}</span>
          </div>`)}
      </div>`
  }

  private renderLogs(): TemplateResult {
    const filtered = EVENT_LOGS.filter((l) => {
      const f = this.cfg.logFilter
      const matchFilter = f === '全部' || (
        f === '渲染' ? l.source === 'Renderer' :
        f === '数据' ? l.source === 'DataSource' :
        f === 'API' ? l.source === 'API' :
        f === '错误' ? l.level === 'error' :
        l.level === 'warn')
      const q = this.cfg.logQuery.trim().toLowerCase()
      return matchFilter && (!q || l.msg.toLowerCase().includes(q) || l.source.toLowerCase().includes(q))
    })
    const dot: Record<string, string> = { info: '#3b82f6', success: '#22a06b', warn: '#e5a23c', error: '#dc2626', purple: '#a855f7' }
    return html`
      <div class="panel log-panel">
        <div class="panel-head">
          ${sxIcon('terminal', 15)} 事件日志
          <span style="margin-left:auto;font-size:10px;color:var(--sx-text-hint);font-weight:400">${filtered.length} 条</span>
        </div>
        <div class="log-tools">
          <div class="log-filters">
            ${LOG_FILTERS.map((f) => html`
              <button class="log-filter ${this.cfg.logFilter === f ? 'on' : ''}" @click=${() => this.patch('logFilter', f)}>${f}</button>`)}
          </div>
          <div class="log-search">${sxIcon('search', 12)}<input placeholder="搜索日志..." .value=${this.cfg.logQuery} @input=${(e: Event) => this.patch('logQuery', (e.target as HTMLInputElement).value)} /></div>
          <button class="icon-btn" title="清空日志" @click=${() => this.clearData()}>${sxIcon('close', 13)}</button>
        </div>
        <div class="log-list">
          ${filtered.length === 0 ? html`<div style="padding:14px;text-align:center;color:var(--sx-text-hint);font-size:11px">无匹配日志</div>` : nothing}
          ${filtered.map((l) => html`
            <div class="log-item">
              <span class="time">${l.time}</span>
              <span class="dot" style=${`background:${dot[l.level]}`}></span>
              <span class="msg">${l.msg}</span>
              <span class="src">${l.source}</span>
            </div>`)}
        </div>
      </div>`
  }

  private renderComponents(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('gridView', 15)} 组件状态</div>
        <div class="comp-list">
          ${COMPONENTS.map((c) => html`
            <div class="comp-row">
              <span class="dot"></span><span>${c.name}</span>
              <span class="st">${c.status}</span>
              ${c.action
                ? html`<button class="badge blue" style="border:0;cursor:pointer" @click=${() => this.clearCache()}>${c.action}</button>`
                : html`<span class="badge">正常</span>`}
            </div>`)}
        </div>
      </div>`
  }

  private renderApiStats(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('chartBar', 15)} API 调用统计<span class="api-head-extra">近 5 分钟 ▾</span></div>
        <table class="api-table">
          <thead><tr><th>接口</th><th>调用次数</th><th>平均耗时</th><th>成功率</th></tr></thead>
          <tbody>
            ${API_STATS.map((a) => html`
              <tr><td>${a.endpoint}</td><td class="num">${a.calls}</td><td class="num">${a.avg}ms</td><td class="num ok">${a.rate}%</td></tr>`)}
          </tbody>
        </table>
      </div>`
  }

  private renderPlaceholder(): TemplateResult {
    const map: Record<string, { title: string; text: string }> = {
      panel: { title: '调试面板', text: '实时开关：脏矩形可视化 / 虚拟滚动边界 / 命令栈追踪 / Worker 消息流。' },
      logs: { title: '日志管理', text: '按级别（info / warn / error）筛选并导出结构化日志，便于定位集成问题。' },
      api: { title: 'API 调试', text: '查看 <code>DataAdapter.load</code> / <code>save</code> 的每次请求与响应，支持重放。' },
      component: { title: '组件检查', text: '运行时组件树：<code>Renderer</code> / <code>VirtualScroll</code> / <code>Worker</code> / <code>Cache</code>。' },
      version: { title: '版本信息', text: 'SheetX v1.0.0 · MIT Core · TypeScript / Canvas 2D / Web Worker。' },
    }
    const p = map[this.nav] ?? map.version!
    return html`
      <div class="panel placeholder">
        <h3>${p.title}</h3>
        <div>${p.text.replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>')}</div>
        <p style="margin-top:12px;color:var(--sx-text-hint);font-size:11px">本设计稿聚焦「性能监控」；其余栏目为可切换的占位视图。</p>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-debug-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          <div class="main">
            <div class="head">
              <span class="head-icon">${sxIcon('chartLine', 22)}</span>
              <div><h2>性能监控</h2><p>实时监控 SheetX 运行状态，优化性能表现</p></div>
              <div class="head-right">
                <span class="live"><span class="dot"></span>${this.samplePaused ? '已暂停' : '实时监控中'}</span>
                <select class="select" .value=${this.cfg.interval} @change=${(e: Event) => this.patch('interval', (e.target as HTMLSelectElement).value)}>
                  ${SAMPLE_INTERVALS.map((s) => html`<option>${s}</option>`)}
                </select>
                ${this.samplePaused ? html`<button class="btn" @click=${() => this.resume()}>恢复采样</button>` : nothing}
                <button class="btn" @click=${() => this.clearData()}>${sxIcon('trash', 12)} 清空数据</button>
                <button class="btn primary" @click=${() => this.exportReport()}>${sxIcon('download', 12)} 导出报告</button>
              </div>
            </div>
            ${this.nav === 'performance' ? html`
              ${this.renderMetrics()}
              <div class="grid">
                <div>
                  <div class="panel">
                    <div class="panel-head">${sxIcon('chartLine', 15)} 性能趋势
                      <div class="right ranges">
                        ${TIME_RANGES.map((t) => html`
                          <button class="range ${this.cfg.timeRange === t ? 'on' : ''}" @click=${() => this.patch('timeRange', t)}>${t}</button>`)}
                      </div>
                    </div>
                    ${this.renderChart()}
                  </div>
                  ${this.renderLogs()}
                </div>
                <div class="side">
                  ${this.renderComponents()}
                  ${this.renderApiStats()}
                  <div class="tip-card"><span class="ic">${sxIcon('infoCircle', 15)}</span><span><b>性能提示</b><br />${PERF_TIP}</span></div>
                </div>
              </div>` : this.renderPlaceholder()}
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-app': DebugApp
  }
}
