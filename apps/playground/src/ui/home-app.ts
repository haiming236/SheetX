/**
 * SheetX 首页 · 设计稿导航中心
 *
 * 24 张高保真设计稿（含引擎演示、打印预览、格式面板、函数库、版本管理、批量导入、高级筛选、多视图与插件生态）的卡片墙，点击卡片经 hash 进入对应视图。
 * 每张卡片带一张纯 CSS/SVG 的 mock 缩略图，呼应该页面的视觉特征。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { homeStyles } from './home-styles.js'
import { PAGE_ENTRIES, HERO_STATS, type PageEntry } from './home-data.js'
import { store, useStore } from './store.js'

@customElement('home-app')
export class HomeApp extends LitElement {
  static styles = [baseStyles, lightTokens, homeStyles]

  /** 首页搜索：按标题/描述/标签过滤卡片 */
  @state() private query = ''
  /** 最近访问（main.ts 写入 localStorage，与本页共享） */
  @state() private recent: string[] = []

  constructor() {
    super()
    // 首页展示全局业务数据的实时统计：任一页面改数据，这里立即变化
    useStore(this)
  }

  connectedCallback(): void {
    super.connectedCallback()
    try {
      this.recent = JSON.parse(localStorage.getItem('sx:recent') ?? '[]') as string[]
    } catch {
      this.recent = []
    }
  }

  private get filteredEntries(): PageEntry[] {
    const keyword = this.query.trim().toLowerCase()
    if (!keyword) return PAGE_ENTRIES
    return PAGE_ENTRIES.filter((entry) =>
      `${entry.no} ${entry.title} ${entry.desc} ${entry.tags.join(' ')}`.toLowerCase().includes(keyword),
    )
  }

  private get recentEntries(): PageEntry[] {
    return this.recent
      .map((route) => PAGE_ENTRIES.find((entry) => entry.route === route))
      .filter((entry): entry is PageEntry => entry !== undefined)
      .slice(0, 5)
  }

  private go(route: string): void {
    location.hash = `#${route}`
  }

  /* ---------------- mock 缩略图 ---------------- */

  private mwin(body: TemplateResult): TemplateResult {
    return html`
      <div class="mwin">
        <div class="mchrome"><i></i><i></i><i></i></div>
        ${body}
      </div>`
  }

  private renderMock(entry: PageEntry): TemplateResult {
    const a = entry.accent
    switch (entry.mock) {
      case 'table':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow"><span class="mcell hd" style="width:34%"></span><span class="mcell hd" style="width:26%"></span><span class="mcell hd" style="width:22%"></span><span class="mcell hd" style="width:14%"></span></div>
            ${[0, 1, 2].map((r) => html`
              <div class="mrow">
                <span class="mcell" style="width:34%"></span>
                <span class="mcell" style="width:26%"></span>
                <span class="mcell" style="width:22%; ${r === 1 ? `background:${a}55;` : ''}"></span>
                <span class="mcell" style="width:14%"></span>
              </div>`)}
            <div class="mrow"><span class="mcell hdl" style="width:34%"></span><span class="mcell hdl" style="width:26%"></span><span class="mcell hdl" style="width:36%"></span></div>
          </div>`)

      case 'grid':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow"><span class="mcell hd" style="width:24%"></span><span class="mcell hd" style="width:24%"></span><span class="mcell hd" style="width:20%"></span><span class="mcell hd" style="width:16%"></span></div>
            ${[['#22c55e', '#f59e0b'], ['#22c55e', '#22c55e'], ['#f59e0b', '#22c55e'], ['#3b82f6', '#f59e0b'], ['#22c55e', '#3b82f6']].map((p) => html`
              <div class="mrow">
                <span class="mcell thin" style="width:24%"></span>
                <span class="mcell thin" style="width:24%"></span>
                <span class="mpill" style="width:20px; background:${p[0]}33;"></span>
                <span class="mdot" style="background:${p[1]};"></span>
                <span class="mcell thin" style="width:10%"></span>
              </div>`)}
          </div>`)

      case 'sheet':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mtoolbar"><span class="mtool"></span><span class="mtool"></span><span class="mtool wide"></span><span class="mtool"></span><span class="mtool wide" style="background:${a}33;"></span><span class="mtool"></span></div>
            <div class="mrow"><span class="mcell hd" style="width:44%"></span><span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:24%"></span></div>
            <div class="mrow"><span class="mcell" style="width:44%; background:${a}22;"></span><span class="mcell" style="width:28%"></span><span class="mcell" style="width:24%"></span></div>
            <div class="mrow"><span class="mcell" style="width:44%"></span><span class="mcell" style="width:28%"></span><span class="mcell" style="width:24%"></span></div>
            <div class="mtabs"><span class="mtab on" style="width:26px;"></span><span class="mtab" style="width:22px;"></span><span class="mtab" style="width:22px;"></span></div>
          </div>`)

      case 'editors':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow"><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:36%"></span><span class="mcell hd" style="width:30%"></span></div>
            <div class="mrow"><span class="mcell" style="width:30%"></span><span class="mcell" style="width:36%; outline:1.5px solid ${a}; outline-offset:-1.5px; background:var(--sx-bg-surface);"></span><span class="mcell" style="width:30%"></span></div>
            <div class="mrow"><span class="mcell" style="width:30%"></span><span class="mcell" style="width:36%"></span><span class="mcell" style="width:30%"></span></div>
            <div class="mmenu" style="left:34%; top:38px; width:42%;">
              <div class="mi"><i style="background:${a};"></i><span style="width:80%; background:${a}33;"></span></div>
              <div class="mi"><i style="background:#dbe2ec;"></i><span style="width:70%;"></span></div>
              <div class="mi"><i style="background:#dbe2ec;"></i><span style="width:75%;"></span></div>
            </div>
          </div>`)

      case 'virtual':
        return this.mwin(html`
          <div class="mbody" style="gap:2.5px;">
            <div class="mrow"><span class="mcell hd" style="width:32%"></span><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span></div>
            ${[0, 1, 2, 3, 4, 5, 6].map(() => html`
              <div class="mrow"><span class="mcell thin" style="width:32%"></span><span class="mcell thin" style="width:30%"></span><span class="mcell thin" style="width:30%"></span></div>`)}
            <div class="mscroll"><i style="height:30%;"></i></div>
          </div>`)

      case 'formula':
        return this.mwin(html`
          <div class="mbody">
            <div class="mfx">fx <b>=SUM(C2:C8)*1.06</b></div>
            <div class="mmenu" style="position:static; width:70%;">
              <div class="mi"><i style="background:${a};"></i><span style="width:55%; background:${a}2e;"></span></div>
              <div class="mi"><i style="background:#dbe2ec;"></i><span style="width:65%;"></span></div>
              <div class="mi"><i style="background:#dbe2ec;"></i><span style="width:48%;"></span></div>
            </div>
            <div class="mrow"><span class="mcell" style="width:30%"></span><span class="mcell" style="width:30%; background:${a}33;"></span><span class="mcell" style="width:30%; outline:1.5px solid ${a}; outline-offset:-1.5px; background:var(--sx-bg-surface);"></span></div>
          </div>`)

      case 'io':
        return this.mwin(html`
          <div class="mbody">
            <div class="mupload" style="height:34px;">${sxIcon('cloudUpload', 16)}</div>
            ${[['#3b82f6', '70%'], ['#22c55e', '55%'], ['#f59e0b', '62%']].map(([c, w]) => html`
              <div class="mrow">
                <span class="mdot" style="background:${c}; border-radius:2px;"></span>
                <span class="mcell thin" style="width:${w};"></span>
                <span class="mpill" style="width:18px; background:${c}2e;"></span>
              </div>`)}
          </div>`)

      case 'context':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow"><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span></div>
            <div class="mrow"><span class="mcell" style="width:30%"></span><span class="mcell" style="width:30%; outline:1.5px solid ${a}; outline-offset:-1.5px; background:var(--sx-bg-surface);"></span><span class="mcell" style="width:30%"></span></div>
            <div class="mrow"><span class="mcell" style="width:30%"></span><span class="mcell" style="width:30%"></span><span class="mcell" style="width:30%"></span></div>
            <div class="mmenu" style="left:42%; top:20px; width:46%;">
              ${[a, '#dbe2ec', '#dbe2ec', '#dbe2ec', '#dbe2ec'].map((c) => html`
                <div class="mi"><i style="background:${c};"></i><span style="width:78%;"></span></div>`)}
            </div>
          </div>`)

      case 'filter':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow">
              <span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:28%"></span>
              <span class="mpill" style="width:26px; background:${a}; display:inline-flex; align-items:center; justify-content:center; color:#fff;">${sxIcon('filter', 7)}</span>
            </div>
            ${[[false, '#22c55e'], [true, ''], [false, '#f59e0b'], [true, ''], [false, '#3b82f6']].map(([dim, c]) => html`
              <div class="mrow" style="${dim ? 'opacity:0.28;' : ''}">
                <span class="mcell thin" style="width:28%"></span>
                <span class="mcell thin" style="width:28%"></span>
                ${c ? html`<span class="mdot" style="background:${c};"></span>` : html`<span class="mcell thin" style="width:16%"></span>`}
              </div>`)}
            <div class="mrow" style="margin-top:1px;"><span class="mpill" style="width:40px; background:${a}2e;"></span><span class="mpill" style="width:26px; background:#22c55e2e;"></span></div>
          </div>`)

      case 'settings':
        return this.mwin(html`
          <div class="mbody">
            <div class="mtheme-cards">
              <span class="mtheme on"><i></i></span>
              <span class="mtheme dark"><i></i></span>
              <span class="mtheme half"><i></i></span>
            </div>
            <div class="mswatch-row">
              ${['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#64748b'].map((c) => html`<span class="mswatch" style="background:${c};"></span>`)}
            </div>
            <div class="mrow"><span class="mcell thin" style="width:46%;"></span><span class="mtoggle"></span></div>
            <div class="mrow"><span class="mcell thin" style="width:38%;"></span><span class="mtoggle off"></span></div>
          </div>`)

      case 'workbook':
        return this.mwin(html`
          <div class="mbody" style="gap:3px; padding-right:0;">
            <div class="mrow" style="padding-right:6px;"><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:22%"></span><span class="mcell hd" style="width:22%"></span></div>
            <div class="mrow" style="padding-right:6px;"><span class="mcell thin" style="width:30%"></span><span class="mcell thin" style="width:22%"></span><span class="mcell thin" style="width:22%"></span></div>
            <div class="mrow" style="padding-right:6px;"><span class="mcell thin" style="width:30%"></span><span class="mcell thin" style="width:22%"></span><span class="mcell thin" style="width:22%"></span></div>
            <div class="mtabs">
              <span class="mtab" style="width:22px; background:#f59e0b88;"></span>
              <span class="mtab on" style="width:26px;"></span>
              <span class="mtab" style="width:22px; background:#22c55e88;"></span>
            </div>
            <div class="mpanel">
              <span class="mchip" style="width:80%;"></span>
              <span class="mchip" style="width:64%; background:#fef3c7; border-color:#fde68a;"></span>
              <span class="mchip" style="width:72%; background:#f0fdf4; border-color:#bbf7d0;"></span>
            </div>
          </div>`)

      case 'charts':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow" style="align-items:flex-end; height:34px; gap:5px; padding:0 2px;">
              ${[14, 22, 18, 28, 20].map((h, i) => html`<span class="mbar" style="height:${h}px; background:${i === 3 ? a : a + '99'};"></span>`)}
              <svg width="52" height="30" viewBox="0 0 52 30" style="margin-left:auto;">
                <polyline points="2,24 14,14 26,18 38,8 50,12" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="mrow">
              <svg width="22" height="22" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8" fill="none" stroke="#3b82f6" stroke-width="4.5" stroke-dasharray="30 21" stroke-dashoffset="8"/>
                <circle cx="11" cy="11" r="8" fill="none" stroke="#22c55e" stroke-width="4.5" stroke-dasharray="12 39" stroke-dashoffset="-22"/>
                <circle cx="11" cy="11" r="8" fill="none" stroke="#f59e0b" stroke-width="4.5" stroke-dasharray="9 42" stroke-dashoffset="-34"/>
              </svg>
              <span class="mcell thin" style="width:34%;"></span>
              <span class="mdot" style="background:#3b82f6;"></span>
              <span class="mdot" style="background:#22c55e;"></span>
              <span class="mdot" style="background:#f59e0b;"></span>
            </div>
          </div>`)

      case 'pivot':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow">
              <span class="mcell hd" style="width:26%;"></span>
              <span class="mcell hd" style="width:24%; background:#60a5fa;"></span>
              <span class="mcell hd" style="width:24%; background:#60a5fa;"></span>
              <span class="mcell hd" style="width:18%;"></span>
            </div>
            ${[0, 1, 2].map((r) => html`
              <div class="mrow">
                <span class="mcell hdl" style="width:26%;"></span>
                <span class="mcell thin" style="width:24%;"></span>
                <span class="mcell thin" style="width:24%; ${r === 1 ? `background:${a}33;` : ''}"></span>
                <span class="mcell thin" style="width:18%; background:var(--sx-grid-header-bg);"></span>
              </div>`)}
            <div class="mrow" style="margin-top:1px;">
              <span class="mchip" style="width:30px;"></span>
              <span class="mchip" style="width:30px; background:#fef3c7; border-color:#fde68a;"></span>
              <span class="mchip" style="width:30px; background:#f0fdf4; border-color:#bbf7d0;"></span>
            </div>
          </div>`)

      case 'review':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow"><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span></div>
            <div class="mrow">
              <span class="mcell" style="width:30%"></span>
              <span class="mcell" style="width:30%; outline:1.5px solid ${a}; outline-offset:-1.5px; background:var(--sx-bg-surface); position:relative;"></span>
              <span class="mdot" style="background:#f59e0b; width:5px; height:5px; border-radius:0; clip-path:polygon(100% 0, 0 0, 100% 100%);"></span>
            </div>
            <div class="mcomment">
              <span class="mavatar" style="background:#334155;"></span>
              <div style="flex:1; display:flex; flex-direction:column; gap:2.5px;">
                <span class="mcell thin" style="width:55%;"></span>
                <span class="mcell thin" style="width:85%;"></span>
              </div>
            </div>
          </div>`)

      case 'validate':
        return this.mwin(html`
          <div class="mbody">
            <div class="mrow"><span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:28%"></span></div>
            <div class="mrow"><span class="mcell" style="width:28%"></span><span class="mcell" style="width:28%; outline:1.5px solid #ef4444; outline-offset:-1.5px; background:#fef2f2;"></span><span class="mcell" style="width:28%"></span></div>
            <div style="display:flex; justify-content:center;">
              <div class="mdialog" style="width:62%;">
                <span class="mdot" style="background:#ef4444; width:9px; height:9px;"></span>
                <span class="mcell thin" style="width:70%;"></span>
                <span class="dbtn"></span>
              </div>
            </div>
          </div>`)

      case 'engine':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mcode">&lt;<em>sheetx-grid</em> <b>ref</b>&gt;</div>
            <div class="mrow"><span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:28%"></span><span class="mcell hd" style="width:28%"></span></div>
            <div class="mrow"><span class="mcell thin" style="width:28%"></span><span class="mcell thin" style="width:28%; background:#22c55e2e;"></span><span class="mcell thin" style="width:28%"></span></div>
            <div class="mrow">
              <span class="mdot" style="background:#22c55e;"></span>
              <span class="mcell thin" style="width:44%; background:#f0fdf4;"></span>
            </div>
            <div class="mcode">engine.<b>ready</b> = <em>true</em></div>
          </div>`)

      case 'print':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:3px;">
              <div style="width:34%;border-right:1px solid #eef1f6;padding-right:3px;">
                <span class="mcell hd thin" style="width:90%"></span>
                <span class="mcell thin" style="width:70%;margin-top:3px"></span>
                <span class="mcell thin" style="width:80%;margin-top:3px"></span>
              </div>
              <div style="flex:1;display:flex;gap:3px;">
                <div style="flex:1;border:1px solid #e2e8f0;background:#fff;padding:3px;">
                  <span class="mcell hd" style="width:60%"></span>
                  <span class="mcell thin" style="width:90%;margin-top:3px"></span>
                  <span class="mcell thin" style="width:70%;margin-top:3px;background:#dbeafe"></span>
                </div>
                <div style="flex:1;border:1px solid #e2e8f0;background:#fff;padding:3px;">
                  <span class="mcell hd" style="width:50%"></span>
                  <span class="mcell thin" style="width:80%;margin-top:3px"></span>
                  <span class="mcell thin" style="width:60%;margin-top:3px;background:#dcfce7"></span>
                </div>
              </div>
            </div>
            <div class="mcode">A4 · <b>纵向</b> · 1 / 2</div>
          </div>`)

      case 'format':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow"><span class="mcell hd" style="width:24%"></span><span class="mcell hd" style="width:24%"></span><span class="mcell hd" style="width:24%"></span><span class="mcell hd" style="width:24%"></span></div>
            <div class="mrow"><span class="mcell thin" style="width:24%"></span><span class="mcell thin" style="width:24%;background:#dcfce7"></span><span class="mcell thin" style="width:24%;background:#fef9c3"></span><span class="mcell thin" style="width:24%;background:#fee2e2"></span></div>
            <div class="mrow"><span class="mcell thin" style="width:24%"></span><span class="mcell thin" style="width:24%"></span><span class="mcell thin" style="width:24%;background:#dbeafe"></span><span class="mcell thin" style="width:24%"></span></div>
            <div class="mcode">¥#,##0 · <b>0.0%</b> · B I U</div>
          </div>`)

      case 'formula-lib':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow"><span class="mcell hd" style="width:22%"></span><span class="mcell hd" style="width:22%"></span><span class="mcell hd" style="width:22%"></span></div>
            <div class="mrow"><span class="mcode" style="width:56%;font-size:8px">=SUMIFS(C:C,B:B,"销售部")</span></div>
            <div class="mrow">
              <span class="mcell" style="width:18%;background:#dbeafe"></span>
              <span class="mcell" style="width:14%"></span>
              <span class="mcell" style="width:24%"></span>
            </div>
            <div class="mcode">fx · <b>27 个函数</b></div>
          </div>`)

      case 'history':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:3px;">
              <div style="flex:1;border-right:1px solid #eef1f6">
                <span class="mcell hd" style="width:60%"></span>
                <span class="mcell thin" style="width:80%;margin-top:3px"></span>
                <span class="mcell thin" style="width:70%;margin-top:3px"></span>
              </div>
              <div style="width:36%">
                <span class="mcell hd" style="width:90%"></span>
                <span class="mrow" style="margin-top:3px"><span class="mdot" style="background:#3b82f6"></span><span class="mcell thin" style="width:60%"></span></span>
                <span class="mrow"><span class="mdot" style="background:#3b82f6"></span><span class="mcell thin" style="width:50%"></span></span>
              </div>
            </div>
            <div class="mcode">撤销 <b>100 步</b> · 版本快照</div>
          </div>`)

      case 'import':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:3px;">
              <div style="width:34%;border-right:1px solid #eef1f6;padding-right:3px;">
                <span class="mcell hd" style="width:80%"></span>
                <span class="mrow"><span class="mdot" style="background:#22c55e"></span><span class="mcell thin" style="width:60%"></span></span>
                <span class="mrow"><span class="mdot" style="background:#f59e0b"></span><span class="mcell thin" style="width:50%"></span></span>
              </div>
              <div style="flex:1">
                <div style="height:5px;border-radius:3px;background:#e2e8f0;overflow:hidden"><div style="width:78%;height:100%;background:#3b82f6"></div></div>
                <span class="mcell thin" style="width:80%;margin-top:4px"></span>
                <span class="mcell thin" style="width:60%;margin-top:3px"></span>
              </div>
            </div>
            <div class="mcode"><b>78%</b> · 780,000 / 1,000,000</div>
          </div>`)

      case 'adv-filter':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:3px;">
              <div style="flex:1">
                <span class="mcell hd" style="width:50%"></span>
                <span class="mcell thin" style="width:80%;margin-top:3px"></span>
                <span class="mcell thin" style="width:60%;margin-top:3px"></span>
              </div>
              <div style="width:36%;border-left:1px solid #eef1f6;padding-left:3px;">
                <span class="mcell hd" style="width:80%"></span>
                <span class="mrow"><span class="mcell thin" style="width:60%"></span><em style="font-size:7px;color:#3b82f6">AND</em></span>
                <span class="mrow"><span class="mcell thin" style="width:50%"></span><em style="font-size:7px;color:#3b82f6">OR</em></span>
              </div>
            </div>
            <div class="mcode">条件组 <b>2</b> · 命中 5 / 13</div>
          </div>`)

      case 'multi-view':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:3px;">
              <div style="width:22%;border-right:1px solid #eef1f6;padding-right:3px;">
                <span class="mcell hd" style="width:80%"></span>
                <span class="mcell thin" style="width:60%;margin-top:3px"></span>
                <span class="mcell thin" style="width:70%;margin-top:3px;background:#dbeafe"></span>
              </div>
              <div style="flex:1">
                <div class="mrow"><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span><span class="mcell hd" style="width:30%"></span></div>
                <span class="mcell thin" style="width:90%;margin-top:3px"></span>
                <span class="mcell thin" style="width:70%;margin-top:3px"></span>
              </div>
            </div>
            <div class="mcode">4 视图 · <b>同数据</b></div>
          </div>`)

      case 'plugins':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow"><span class="mcell hd" style="width:48%"></span><span class="mcell" style="width:30%;margin-left:auto"></span></div>
            <div style="height:13px;border-radius:4px;background:linear-gradient(100deg,#dbeafe,#ede9fe);border:1px solid #dbe3f5;"></div>
            <div class="mrow" style="gap:2px">
              <span class="mchip" style="width:30px;background:${a};border-color:${a}"></span>
              <span class="mchip" style="width:24px"></span><span class="mchip" style="width:24px"></span>
              <span class="mchip" style="width:24px"></span>
            </div>
            ${[0, 1].map((row) => html`
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2].map((col) => html`
                  <div style="flex:1;border:1px solid ${row === 0 && col === 0 ? a : '#e2e8f0'};border-radius:4px;padding:3px;display:flex;flex-direction:column;gap:2px">
                    <span class="mdot" style="background:${['#10b981','#8b5cf6','#2563eb'][col]};border-radius:2px;width:8px;height:8px"></span>
                    <span class="mcell thin" style="width:100%"></span>
                    <span class="mcell thin" style="width:66%"></span>
                    <span class="mpill" style="width:24px;height:4px;background:${row === 0 && col === 0 ? '#d1fae5' : '#dbeafe'}"></span>
                  </div>`)}
              </div>`)}
            <div class="mcode">8 插件 · <b>5 扩展点</b></div>
          </div>`)

      case 'properties':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
              <div style="height:8px;border-radius:2px;background:${a};width:82%"></div>
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mcell hd" style="flex:1;height:6px"></span>`)}
              </div>
              ${[0, 1, 2].map((r) => html`
                <div class="mrow" style="gap:2px">
                  ${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:5px;background:${r === 1 && c === 2 ? '#dcfce7' : '#eef1f6'}"></span>`)}
                </div>`)}
              <div class="mrow" style="gap:2px;margin-top:2px">
                <span style="flex:1;height:18px;border-radius:3px;background:#dbeafe;display:flex;align-items:flex-end;gap:1px;padding:2px">
                  ${[6, 10, 8, 12, 14].map((h) => html`<i style="width:12%;height:${h}px;background:${a};border-radius:1px 1px 0 0"></i>`)}
                </span>
                <span style="width:34%;height:18px;border-radius:50%;background:conic-gradient(${a} 0 32%,#f5a623 32% 50%,#2fbf8f 50% 78%,#9b7bf0 78%)"></span>
              </div>
            </div>
            <div style="width:26%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:2px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map((i) => html`<span class="mpill" style="flex:1;height:6px;background:${i === 0 ? a : '#e8ecf3'}"></span>`)}
              </div>
              <span class="mcell thin" style="width:100%;margin-top:2px"></span>
              <span class="mcell thin" style="width:70%"></span>
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mchip" style="width:9px;height:9px"></span>`)}
              </div>
              <div class="mrow" style="gap:2px;margin-top:2px">
                <span class="mchip" style="width:20px;height:5px;background:${a};border-color:${a}"></span>
                <span class="mchip" style="width:20px;height:5px"></span>
              </div>
            </div>
            <div class="mcode">4 标签 · <b>统一属性</b></div>
          </div>`)

      case 'host':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:20%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${85 - i * 6}%;height:5px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div style="height:8px;border-radius:2px;background:${a};width:64%"></div>
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2].map(() => html`<span style="flex:1;height:14px;border:1px solid #dbe3f5;border-radius:3px;background:#f8faff"></span>`)}
              </div>
              <div class="mrow" style="gap:2px">
                <span class="mcell thin" style="width:44%"></span><span class="mcell thin" style="width:34%"></span>
              </div>
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mchip" style="width:14px;height:5px;background:${a};border-color:${a}"></span>`)}
              </div>
            </div>
            <div style="width:26%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:70%"></span>
              ${[0, 1].map(() => html`
                <div style="border:1px solid #e2e8f0;border-radius:3px;padding:3px;display:flex;flex-direction:column;gap:2px">
                  <span class="mcell thin" style="width:60%"></span>
                  <span class="mcode" style="font-size:4px;background:#eef2ff">const user = await ...</span>
                </div>`)}
            </div>
            <div class="mcode">ERP 适配 · <b>API 调试</b></div>
          </div>`)

      case 'datasource':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:18%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="width:80%;height:5px"></span>`)}
              <div style="margin-top:3px;padding:3px;border-radius:2px;background:#eef2ff;font-size:4px;color:${a}">不内置数据库</div>
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2].map((i) => html`<span class="mpill" style="width:26px;height:7px;background:${i === 0 ? a : '#e8ecf3'};border-color:${i === 0 ? a : '#e8ecf3'}"></span>`)}
              </div>
              <div style="height:7px;border-radius:2px;background:${a};width:52%"></div>
              <div class="mrow" style="gap:2px">
                <span class="mcell thin" style="width:60%"></span><span class="mcell thin" style="width:28%"></span>
              </div>
              ${[0, 1, 2].map(() => html`
                <div class="mrow" style="gap:2px">
                  ${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:5px;background:${c === 3 ? '#dcfce7' : '#eef1f6'}"></span>`)}
                </div>`)}
              <div class="mrow" style="gap:2px;justify-content:center">
                ${[0, 1, 2].map((i) => html`<span class="mchip" style="width:9px;height:8px;background:${i === 0 ? a : '#e8ecf3'};border-color:${i === 0 ? a : '#e8ecf3'}"></span>`)}
              </div>
            </div>
            <div style="width:24%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:70%"></span>
              ${[0, 1, 2].map(() => html`
                <div class="mrow" style="gap:2px"><span class="mcell thin" style="flex:1"></span><span class="mchip" style="width:14px;height:6px;background:${a};border-color:${a}"></span></div>`)}
            </div>
            <div class="mcode">远程分页 · <b>12,580 条</b></div>
          </div>`)

      case 'edit':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3, 4].map(() => html`<span class="mcell hd" style="flex:1;height:6px"></span>`)}
              </div>
              ${[0, 1, 2, 3].map((r) => html`
                <div class="mrow" style="gap:2px">
                  <span class="mchip" style="width:7px;height:7px;background:${r === 1 ? a : '#e2e8f0'};border-color:${r === 1 ? a : '#e2e8f0'}"></span>
                  ${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:5px;background:${r === 1 && c === 3 ? '#dbeafe' : '#eef1f6'}"></span>`)}
                </div>`)}
              <div style="margin-top:2px;border-top:1px solid #eef1f6;padding-top:2px">
                ${[0, 1].map(() => html`<div class="mrow" style="gap:2px"><span class="mcell thin" style="width:22%"></span><span class="mcell thin" style="width:50%"></span><span class="mpill" style="width:22px;height:4px;background:#dcfce7"></span></div>`)}
              </div>
            </div>
            <div style="width:26%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:66%"></span>
              <span class="mcell thin" style="width:90%"></span>
              <span class="mchip" style="width:44px;height:8px;border-color:${a}"></span>
              <span class="mchip" style="width:30px;height:5px;background:${a};border-color:${a}"></span>
              <span class="mcode" style="font-size:4px">暂存 3 条</span>
            </div>
            <div class="mcode">事务提交 · <b>回滚/冲突</b></div>
          </div>`)

      case 'permission':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:19%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3].map((i) => html`<span class="mcell thin" style="width:${84 - i * 5}%;height:5px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
              <div style="margin-top:3px;padding:3px;border-radius:2px;background:#eef2ff;font-size:4px;color:${a}">宿主裁决</div>
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2].map((i) => html`<span class="mchip" style="width:22px;height:7px;background:${i === 1 ? '#dbeafe' : '#e8ecf3'};border-color:${i === 1 ? a : '#e8ecf3'}"></span>`)}
              </div>
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mcell hd" style="flex:1;height:6px"></span>`)}
              </div>
              ${[0, 1, 2].map((r) => html`
                <div class="mrow" style="gap:2px">
                  ${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:5px;background:${c === 2 ? '#fef3c7' : r === 1 && c === 1 ? '#eef1f6' : '#eef1f6'}"></span>`)}
                </div>`)}
            </div>
            <div style="width:25%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:72%"></span>
              ${[0, 1, 2].map(() => html`
                <div class="mrow" style="gap:2px"><span class="mcell thin" style="flex:1"></span><span class="mpill" style="width:20px;height:4px;background:#dcfce7"></span></div>`)}
            </div>
            <div class="mcode">5 权限维度 · <b>宿主裁决</b></div>
          </div>`)

      case 'i18n':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mcell hd" style="flex:1;height:6px"></span>`)}
              </div>
              <div style="height:8px;border-radius:2px;background:${a};width:56%"></div>
              ${[0, 1, 2].map(() => html`
                <div class="mrow" style="gap:2px">
                  ${[0, 1, 2].map(() => html`<span class="mcell thin" style="flex:1;height:5px"></span>`)}
                </div>`)}
              <div class="mrow" style="gap:2px;margin-top:2px">
                <span class="mpill" style="width:46%;height:12px;background:#dbeafe;border-color:#dbeafe"></span>
                <span class="mchip" style="width:46%;height:12px;border-color:${a}"></span>
              </div>
            </div>
            <div style="width:26%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:70%"></span>
              <span class="mchip" style="width:90%;height:7px"></span>
              ${[0, 1, 2].map(() => html`<div class="mrow" style="gap:2px"><span class="mcell thin" style="flex:1"></span><span class="mchip" style="width:22px;height:5px"></span></div>`)}
            </div>
            <div class="mcode">8 语言 · <b>RTL 镜像</b></div>
          </div>`)

      case 'keyboard':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:18%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${82 - i * 4}%;height:5px;background:${i === 3 ? a : '#eef1f6'}"></span>`)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map((i) => html`<span class="mpill" style="flex:1;height:6px;background:${i === 0 ? a : '#e8ecf3'};border-color:${i === 0 ? a : '#e8ecf3'}"></span>`)}
              </div>
              ${[0, 1, 2, 3].map(() => html`
                <div class="mrow" style="gap:2px">
                  <span class="mcell thin" style="flex:1;height:5px"></span>
                  <span style="display:flex;gap:1px"><i style="padding:0 3px;border:1px solid #dbe3f5;border-radius:2px;font-size:4px">Ctrl</i><i style="padding:0 3px;border:1px solid #dbe3f5;border-radius:2px;font-size:4px">C</i></span>
                </div>`)}
            </div>
            <div style="width:25%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:74%"></span>
              <span class="mchip" style="width:90%;height:7px"></span>
              <span class="mchip" style="width:60%;height:5px"></span>
              <div style="margin-top:2px;padding:3px;border-radius:2px;background:#fef3c7;font-size:4px;color:#b45309">冲突检测</div>
            </div>
            <div class="mcode">Excel/WPS · <b>冲突检测</b></div>
          </div>`)

      case 'plugin-dev':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:16%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${82 - i * 4}%;height:5px;background:${i === 1 ? a : '#eef1f6'}"></span>`)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              ${[0, 1, 2].map((i) => html`
                <div class="mrow" style="gap:3px;padding:3px;border:1px solid #e2e8f0;border-radius:3px;${i === 1 ? `border-color:${a};background:#f8faff` : ''}">
                  <span style="width:12px;height:12px;border-radius:3px;background:${['#7c5cff','#16a34a','#2563eb'][i]};flex:none"></span>
                  <span class="mcell thin" style="flex:1"></span>
                  <span class="mchip" style="width:18px;height:6px;background:${a};border-color:${a}"></span>
                </div>`)}
              <div class="mrow" style="gap:2px;margin-top:2px">
                ${[0, 1, 2, 3].map((i) => html`<span class="mcell thin" style="flex:1;height:5px;background:${i === 1 ? '#eef2ff' : '#eef1f6'}"></span>`)}
              </div>
            </div>
            <div style="width:22%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:76%"></span>
              <span class="mcode" style="font-size:4px;background:#eef2ff">registerPlugin({</span>
              ${[0, 1, 2].map(() => html`<span class="mcell thin" style="width:88%;height:4px"></span>`)}
            </div>
            <div class="mcode">扩展点 · <b>代码运行</b></div>
          </div>`)

      case 'debug':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:16%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${82 - i * 4}%;height:5px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2, 3].map((c) => html`<span class="mchip" style="flex:1;height:9px;background:${['#eff6ff','#f0fdf4','#faf5ff','#fff7ed'][c]};border-color:${['#3b82f6','#22a06b','#a855f7','#ea580c'][c]}"></span>`)}
              </div>
              <div style="height:26px;position:relative;border-bottom:1px solid #eef1f6">
                ${[0, 1, 2].map((l) => html`<span style="position:absolute;left:0;right:0;bottom:${6 + l * 6}px;height:1px;background:${['#3b82f6','#22a06b','#a855f7'][l]};opacity:.7;clip-path:polygon(0 40%,15% 20%,30% 50%,45% 10%,60% 45%,75% 25%,100% 40%,100% 60%,75% 45%,60% 65%,45% 30%,30% 70%,15% 40%,0 60%)"></span>`)}
              </div>
              ${[0, 1, 2].map(() => html`<div class="mrow" style="gap:2px"><span class="mcell thin" style="width:18%"></span><span class="mcell thin" style="flex:1"></span><span class="mchip" style="width:16px;height:4px"></span></div>`)}
            </div>
            <div style="width:22%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              ${[0, 1, 2, 3].map(() => html`<div class="mrow" style="gap:2px"><span class="mcell thin" style="flex:1"></span><span class="mchip" style="width:18px;height:4px;background:#dcfce7"></span></div>`)}
              <span class="mcode" style="font-size:4px">60 FPS / 128 MB</span>
            </div>
            <div class="mcode">实时监控 · <b>60 FPS</b></div>
          </div>`)

      case 'embed':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:16%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${82 - i * 4}%;height:5px;background:${i === 1 ? a : '#eef1f6'}"></span>`)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <div class="mrow" style="gap:2px">
                ${[0, 1, 2].map((i) => html`<span class="mpill" style="flex:1;height:7px;background:${i === 0 ? a : '#e8ecf3'};border-color:${i === 0 ? a : '#e8ecf3'}"></span>`)}
              </div>
              <div style="border:1px solid #e2e8f0;border-radius:3px;padding:3px;display:flex;flex-direction:column;gap:1px">
                ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${50 + ((i * 13) % 40)}%;height:4px;background:${i % 2 ? '#dbeafe' : '#eef2ff'}"></span>`)}
              </div>
              <div style="height:20px;border:1px solid #e2e8f0;border-radius:3px">
                <div class="mrow" style="background:${a};height:6px">${[0, 1, 2].map(() => html`<span class="mcell thin" style="flex:1;height:3px;background:#fff"></span>`)}</div>
                ${[0, 1].map(() => html`<div class="mrow" style="gap:2px;padding:1px">${[0, 1, 2].map(() => html`<span class="mcell thin" style="flex:1;height:3px"></span>`)}</div>`)}
              </div>
            </div>
            <div style="width:22%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              ${[0, 1, 2].map(() => html`
                <div style="border:1px solid #e2e8f0;border-radius:3px;padding:3px"><span class="mcell thin" style="width:80%;height:4px"></span></div>`)}
              <span class="mcode" style="font-size:4px">onChange →</span>
            </div>
            <div class="mcode">3 框架 · <b>在线体验</b></div>
          </div>`)

      case 'api-doc':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div style="width:18%;border-right:1px solid #eef1f6;padding-right:3px;display:flex;flex-direction:column;gap:2px">
              ${[0, 1, 2].map((g) => html`
                <span class="mcell hd" style="width:60%;height:4px"></span>
                ${[0, 1].map((i) => html`<span class="mcell thin" style="width:${70 - i * 10}%;height:4px;background:${g === 0 && i === 1 ? a : '#eef1f6'}"></span>`)}
              `)}
            </div>
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:44%;height:7px;background:${a}"></span>
              <span class="mcell thin" style="width:70%"></span>
              <div style="border:1px solid #e2e8f0;border-radius:3px;padding:3px;display:flex;flex-direction:column;gap:1px">
                ${[0, 1, 2, 3, 4].map((i) => html`<span class="mcell thin" style="width:${40 + ((i * 17) % 50)}%;height:4px;background:${i % 3 === 0 ? '#fef3c7' : i % 3 === 1 ? '#dcfce7' : '#dbeafe'}"></span>`)}
              </div>
              <div class="mrow" style="gap:2px">${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="flex:1;height:4px"></span>`)}</div>
            </div>
            <div style="width:22%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
              <span class="mcell hd" style="width:66%"></span>
              <div style="border:1px solid #e2e8f0;border-radius:3px;height:22px">
                <div class="mrow" style="background:${a};height:5px">${[0, 1, 2].map(() => html`<span class="mcell thin" style="flex:1;height:2px;background:#fff"></span>`)}</div>
              </div>
              <span class="mchip" style="width:80%;height:9px;background:#eef2ff"></span>
            </div>
            <div class="mcode">API 文档 · <b>TypeScript</b></div>
          </div>`)

      case 'playground-all':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:30px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mpill" style="width:30px;height:7px"></span>
              <span style="margin-left:auto" class="mcell thin" style="width:34px"></span>
            </div>
            <div style="display:flex;gap:2px;flex:1;min-height:0">
              <div style="width:16%;border-right:1px solid #eef1f6;display:flex;flex-direction:column;gap:2px">
                ${[0, 1, 2, 3, 4, 5].map((i) => html`<span class="mcell thin" style="width:${84 - i * 5}%;height:4px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
              </div>
              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                <div style="height:7px;border-radius:2px;background:${a};width:76%"></div>
                ${[0, 1, 2, 3].map(() => html`
                  <div class="mrow" style="gap:2px">${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:4px;background:${c === 2 ? '#dbeafe' : '#eef1f6'}"></span>`)}</div>`)}
                <div class="mrow" style="gap:2px;margin-top:1px">
                  <span class="mchip" style="flex:1;height:12px;background:#dbeafe;border-color:#dbeafe"></span>
                  <span class="mchip" style="width:30%;height:12px;background:#ede9fe;border-color:#ede9fe"></span>
                </div>
              </div>
              <div style="width:22%;border-left:1px solid #eef1f6;padding-left:3px;display:flex;flex-direction:column;gap:3px">
                <span class="mcell hd" style="width:70%"></span>
                ${[0, 1, 2, 3].map(() => html`<div class="mrow" style="gap:2px"><span class="mcell thin" style="flex:1"></span><span class="mchip" style="width:14px;height:4px;background:${a};border-color:${a}"></span></div>`)}
              </div>
            </div>
            <div class="mcode">双模式 · <b>在线体验</b></div>
          </div>`)

      case 'dual-mode':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:34px;height:7px;background:#2563eb;border-color:#2563eb">Grid</span>
              <span class="mpill" style="width:44px;height:7px;background:#059669;border-color:#059669">Sheet</span>
              <span style="margin-left:auto" class="mchip" style="width:28px;height:7px;background:${a};border-color:${a}"></span>
            </div>
            <div style="display:flex;gap:3px;flex:1;min-height:0">
              <div style="flex:1;min-width:0;border:1px solid #dbeafe;border-radius:3px;display:flex;flex-direction:column;gap:2px;padding:2px">
                ${[0, 1, 2, 3, 4].map((i) => html`<div class="mrow" style="gap:2px">${[0, 1, 2].map((c) => html`<span class="mcell thin" style="flex:1;height:4px;background:${c === 1 && i === 1 ? '#dbeafe' : '#eef1f6'}"></span>`)}</div>`)}
              </div>
              <div style="flex:1;min-width:0;border:1px solid #a7f3d0;border-radius:3px;display:flex;flex-direction:column;gap:2px;padding:2px">
                <span class="mcell hd" style="height:5px;width:60%;background:#a7f3d0"></span>
                ${[0, 1, 2, 3].map(() => html`<div class="mrow" style="gap:2px">${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="flex:1;height:4px"></span>`)}</div>`)}
              </div>
            </div>
            <div class="mcode">ERP网格 · <b>Excel表格</b></div>
          </div>`)

      case 'engine-arch':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:30px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mcell thin" style="width:26px"></span>
            </div>
            <div style="display:flex;gap:2px;flex:1;min-height:0">
              <div style="width:15%;display:flex;flex-direction:column;gap:2px">
                ${[0, 1, 2, 3].map((i) => html`<span class="mcell thin" style="height:5px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
              </div>
              <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:2px">
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => html`<span class="mcell" style="border-radius:2px;background:${i === 4 ? a : '#eef1f6'};opacity:${i === 4 ? 1 : .75}"></span>`)}
              </div>
              <div style="width:15%;display:flex;flex-direction:column;gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="height:5px"></span>`)}
              </div>
            </div>
            <div class="mcode">8 模块 · <b>核心引擎</b></div>
          </div>`)

      case 'render-arch':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:32px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mpill" style="width:26px;height:7px"></span>
            </div>
            <div style="display:flex;gap:3px;flex:1;min-height:0">
              <div style="flex:1;border:1px solid #dbeafe;border-radius:3px;display:flex;flex-direction:column;gap:2px;padding:2px">
                <div class="mrow" style="gap:2px">${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="flex:1;height:4px"></span>`)}</div>
                ${[0, 1, 2, 3].map((r) => html`<div class="mrow" style="gap:2px">${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:5px;background:${r === 0 && c === 0 ? '#dbeafe' : '#eef1f6'}"></span>`)}</div>`)}
              </div>
              <div style="width:20%;display:flex;flex-direction:column;gap:2px">
                ${[0, 1, 2, 3].map(() => html`<span class="mcell thin" style="height:6px"></span>`)}
              </div>
            </div>
            <div class="mcode">Canvas + DOM · <b>混合渲染</b></div>
          </div>`)

      case 'virtual-scroll':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:36px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mchip" style="width:24px;height:7px;background:#dbeafe;border-color:#dbeafe"></span>
            </div>
            <div style="display:flex;gap:3px;flex:1;min-height:0">
              <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                <div class="mrow" style="gap:2px">${[0, 1, 2, 3].map(() => html`<span class="mcell hd" style="flex:1;height:5px"></span>`)}</div>
                ${[0, 1, 2, 3, 4].map((r) => html`<div class="mrow" style="gap:2px">${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:4px;background:${r === 1 && c === 2 ? '#dbeafe' : '#eef1f6'}"></span>`)}</div>`)}
              </div>
              <div style="width:20%;display:flex;flex-direction:column;gap:2px;border-left:1px solid #eef1f6;padding-left:3px">
                ${[0, 1, 2].map(() => html`<span class="mchip" style="height:6px;background:#dbeafe;border-color:#dbeafe"></span>`)}
              </div>
            </div>
            <div class="mcode">100 万行 · <b>60 FPS</b></div>
          </div>`)

      case 'ai-assistant':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:28px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mcell thin" style="width:20px"></span>
            </div>
            <div style="display:flex;gap:3px;flex:1;min-height:0">
              <div style="width:14%;display:flex;flex-direction:column;gap:2px">
                ${[0, 1, 2].map((i) => html`<span class="mcell thin" style="height:5px;background:${i === 0 ? a : '#eef1f6'}"></span>`)}
              </div>
              <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                <div class="mrow" style="gap:2px">${[0, 1, 2].map(() => html`<span class="mcell thin" style="flex:1;height:4px"></span>`)}</div>
                ${[0, 1, 2, 3].map(() => html`<div class="mrow" style="gap:2px">${[0, 1, 2].map((c) => html`<span class="mcell thin" style="flex:1;height:4px;background:${c === 0 ? '#dcfce7' : '#eef1f6'}"></span>`)}</div>`)}
              </div>
              <div style="width:24%;border:1px solid #ddd6fe;border-radius:3px;display:flex;flex-direction:column;gap:2px;padding:2px">
                <span class="mchip" style="height:6px;background:#ede9fe;border-color:#ede9fe"></span>
                ${[0, 1, 2].map(() => html`<span class="mcell thin" style="height:5px"></span>`)}
              </div>
            </div>
            <div class="mcode">AI 助手 · <b>可插拔</b></div>
          </div>`)

      case 'ai-generate':
        return this.mwin(html`
          <div class="mbody" style="gap:3px;">
            <div class="mrow" style="gap:2px">
              <span class="mpill" style="width:30px;height:7px;background:${a};border-color:${a}"></span>
              <span class="mchip" style="width:20px;height:7px;background:#dcfce7;border-color:#dcfce7"></span>
            </div>
            <div style="display:flex;gap:3px;flex:1;min-height:0">
              <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                <div class="mrow" style="gap:2px">${[0, 1, 2, 3].map(() => html`<span class="mcell hd" style="flex:1;height:5px"></span>`)}</div>
                ${[0, 1, 2].map(() => html`<div class="mrow" style="gap:2px">${[0, 1, 2, 3].map((c) => html`<span class="mcell thin" style="flex:1;height:4px;background:${c === 0 ? '#dcfce7' : '#eef1f6'}"></span>`)}</div>`)}
              </div>
              <div style="width:28%;border:1px solid #a7f3d0;border-radius:3px;display:flex;flex-direction:column;gap:2px;padding:2px">
                <span class="mchip" style="height:7px;background:#dcfce7;border-color:#dcfce7"></span>
                ${[0, 1, 2].map(() => html`<span class="mcell thin" style="height:5px"></span>`)}
                <span class="mchip" style="height:7px;width:60%;background:${a};border-color:${a};margin-left:auto"></span>
              </div>
            </div>
            <div class="mcode">一句话 · <b>生成表格</b></div>
          </div>`)

      default:
        return this.mwin(html`<div class="mbody"><span class="mcell" style="width:100%;"></span></div>`)
    }
  }

  /* ---------------- 页面 ---------------- */

  private renderCard(entry: PageEntry): TemplateResult {
    return html`
      <a class="card" href="#${entry.route}" @click=${(e: Event) => { e.preventDefault(); this.go(entry.route) }}>
        <div class="card-preview">
          <span class="card-no-float">${entry.no}</span>
          ${this.renderMock(entry)}
        </div>
        <div class="card-body">
          <div class="card-head">
            <span class="card-icon" style="background:${entry.accent};">${sxIcon(entry.icon, 14)}</span>
            <span class="card-title">${entry.title}</span>
            <span class="card-arrow">${sxIcon('arrowRight', 14)}</span>
          </div>
          <div class="card-desc">${entry.desc}</div>
          <div class="card-tags">${entry.tags.map((t) => html`<span class="tag">${t}</span>`)}</div>
        </div>
      </a>`
  }

  render(): TemplateResult {
    const entries = this.filteredEntries
    const searching = this.query.trim().length > 0
    const recent = this.recentEntries
    return html`
      <div class="home">
        <header class="home-topbar">
          <span class="brand">${sxLogo()}</span>
          <span class="divider"></span>
          <span class="crumb">设计稿导航中心</span>
          <div class="home-search">
            ${sxIcon('search', 14)}
            <input
              placeholder="搜索视图：标题 / 说明 / 标签（Ctrl + F）"
              .value=${this.query}
              @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value }}
              @keydown=${(event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  this.query = ''
                  ;(event.target as HTMLInputElement).blur()
                }
                if (event.key === 'Enter' && entries.length > 0) location.hash = `#${entries[0]!.route}`
              }}
            />
            ${searching
              ? html`<button class="search-clear" title="清除" @click=${() => { this.query = '' }}>${sxIcon('close', 13)}</button>`
              : nothing}
          </div>
          <div class="right">
            <span class="ver-chip">dev server <b>:5228</b></span>
            <span class="ver-chip">共 <b>${PAGE_ENTRIES.length}</b> 个视图</span>
          </div>
        </header>

        <section class="hero">
          <span class="hero-badge">${sxIcon('sparkles', 12)} 第一阶段 · 核心 UI 设计稿</span>
          <h1>SheetX <span class="grad">纯前端表格引擎</span> UI 预览</h1>
          <p>15 张高保真设计稿 + 1 个引擎对接演示，全部可交互。点击任意卡片进入，顶部 tab 随时切换。</p>
          <div class="hero-stats">
            ${HERO_STATS.map((s) => html`
              <div class="stat-chip"><div class="sv">${s.value}</div><div class="sl">${s.label}</div></div>`)}
          </div>
          <div class="live-stats">
            <span class="live-label">实时业务数据（各页共享同一份）</span>
            <span class="live-chip"><b>${store.stats().salesTotal}</b> 万销售额</span>
            <span class="live-chip"><b>${store.stats().salesCount}</b> 个区域</span>
            <span class="live-chip ${store.stats().stockWarning > 0 ? 'warn' : ''}"><b>${store.stats().stockWarning}</b> 项库存预警</span>
            <span class="live-chip"><b>${store.stats().inventoryCount}</b> 个 SKU</span>
            <span class="live-chip"><b>${store.stats().openComments}</b> 条待处理批注</span>
          </div>
        </section>

        ${!searching && recent.length > 0
          ? html`
              <div class="recentbar">
                <span>最近访问</span>
                ${recent.map(
                  (entry) => html`
                    <a class="recent-chip" href="#${entry.route}" @click=${(e: Event) => { e.preventDefault(); this.go(entry.route) }}>
                      <span class="no">${entry.no}</span>${entry.title}
                    </a>
                  `,
                )}
              </div>
            `
          : nothing}

        <main class="grid">
          ${entries.length > 0
            ? entries.map((p) => this.renderCard(p))
            : html`
                <div class="empty-state">
                  <div class="es-title">没有匹配「${this.query}」的视图</div>
                  <div class="es-hint">试试：主界面 / 图表 / 筛选 / 数据验证 / 引擎，或按 Esc 清空</div>
                </div>
              `}
        </main>

        <footer class="home-foot">
          ${sxIcon('infoCircle', 13)}
          <span>
            快捷键：<code>Ctrl+F</code> 聚焦搜索 · <code>Alt+1..9</code> 跳转前九个视图 · <code>← →</code> 切换上下一个视图
          </span>
        </footer>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-app': HomeApp
  }
}
