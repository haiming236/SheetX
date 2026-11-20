/**
 * SheetX 第 14 张 · 单元格批注与协作审阅
 *
 * 展示：审阅工具栏（批注/修订/保护/共享）、单元格批注角标（未解决黄 /
 * 已解决绿）、批注弹出卡（回复输入 + @提及 + 点赞 + 解决/删除）、右侧
 * 「批注与审阅」面板（批注列表 + 审阅统计 / 修订时间线 / 审阅流程状态）。
 *
 * 批注、回复、点赞、解决、删除、新建均真实操作数据，右侧面板与表格
 * 角标、审阅统计、修订记录实时联动。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { reviewStyles } from './review-styles.js'
import {
  MEMBERS, CURRENT_USER, TABLE_ROWS, REPORT_TITLE, REPORT_DEADLINE,
  INITIAL_REVISIONS, REVIEW_FLOW, PANEL_TABS, SHEET_TABS, TOP_MENUS,
  type Comment, type Revision, type Member,
} from './review-data.js'
import { toast } from './toast.js'
import { store, useStore } from './store.js'

const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US')

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const
const COL_WIDTHS = [130, 150, 150, 120, 160]
const ROWNUM_W = 44
const BANNER_H = 44
const HEADER_H = 34
const ROW_H = 32

/** 表头/数据行号 → 表格 y 坐标（r 从 1 开始；1=横幅 2=表头 3..8=数据/合计） */
function rowY(r: number): number {
  if (r <= 1) return 0
  if (r === 2) return BANNER_H
  return BANNER_H + HEADER_H + (r - 3) * ROW_H
}

function colX(letter: string): number {
  const i = COL_LETTERS.indexOf(letter as (typeof COL_LETTERS)[number])
  return ROWNUM_W + COL_WIDTHS.slice(0, i).reduce((a, b) => a + b, 0)
}

function memberOf(name: string): Member {
  return MEMBERS.find((m) => m.name === name) ?? CURRENT_USER
}

function nowStr(): string {
  const d = new Date()
  const p = (v: number): string => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 把文本中的 @提及 渲染为高亮 */
function renderMentions(text: string): TemplateResult {
  const parts = text.split(/(@[\w\u4e00-\u9fa5]+)/g)
  return html`${parts.map((p) => p.startsWith('@') ? html`<span class="mention">${p}</span>` : html`${p}`)}`
}

@customElement('review-app')
export class ReviewApp extends LitElement {
  static styles = [baseStyles, lightTokens, reviewStyles]

  constructor() {
    super()
    // 批注来自全局 store：首页「待处理批注」统计联动，刷新/切页保留
    useStore(this)
  }

  connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('click', this.docClick)
    // 协作模拟：他人光标每 5s 移动；每 9s 随机产生一条他人的批注动作
    this.cursorTimer = window.setInterval(() => this.movePeerCursor(), 5000)
    this.activityTimer = window.setInterval(() => this.simulatePeerActivity(), 9000)
  }

  disconnectedCallback(): void {
    window.removeEventListener('click', this.docClick)
    if (this.cursorTimer !== null) clearInterval(this.cursorTimer)
    if (this.activityTimer !== null) clearInterval(this.activityTimer)
    this.cursorTimer = null
    this.activityTimer = null
    if (this.toastTimer) clearTimeout(this.toastTimer)
    super.disconnectedCallback()
  }

  /** 随机移动一位协作者的光标 */
  private movePeerCursor(): void {
    const peers = this.onlineMembers.filter((member) => member.name !== CURRENT_USER.name)
    if (peers.length === 0) return
    const peer = peers[Math.floor(Math.random() * peers.length)]!
    const cells = ['B3', 'C4', 'D5', 'B6', 'C7', 'D8', 'B8']
    this.peerSelections = [
      { name: peer.name, initials: peer.initials, bg: peer.bg, cell: cells[Math.floor(Math.random() * cells.length)]! },
    ]
  }

  /** 模拟他人协作活动：新增批注 / 回复 / 解决（写入全局 store，其他页面统计同步） */
  private simulatePeerActivity(): void {
    const peers = this.onlineMembers.filter((member) => member.name !== CURRENT_USER.name)
    if (peers.length === 0) return
    const peer = peers[Math.floor(Math.random() * peers.length)]!
    const openComments = this.comments.filter((comment) => !comment.resolved)
    const roll = Math.random()

    if (roll < 0.34 || openComments.length === 0) {
      const templates = [
        { cell: 'B4', text: '这个数字和上月对不上，麻烦核对一下。' },
        { cell: 'C5', text: '建议补充环比数据。' },
        { cell: 'D6', text: '这一行我来跟进，今天下班前更新。' },
        { cell: 'B7', text: '合计口径是否包含退货？' },
      ]
      const template = templates[Math.floor(Math.random() * templates.length)]!
      store.replaceComments([
        ...this.comments,
        {
          id: `c${Date.now()}`,
          cell: template.cell,
          author: peer.name,
          time: nowStr(),
          text: template.text,
          likes: 0,
          liked: false,
          resolved: false,
          replies: [],
        },
      ])
      this.addRevision(peer.name, '添加批注', `在 ${template.cell} 添加了一条批注`)
      this.showToast(`${peer.name} 在 ${template.cell} 添加了批注`)
      return
    }

    const target = openComments[Math.floor(Math.random() * openComments.length)]!
    if (roll < 0.72) {
      const replies = ['收到，我核对一下。', '已确认，数据无误。', '同意，稍后同步给财务。', '这里需要产品确认口径。']
      this.patchComment(target.id, {
        replies: [
          ...target.replies,
          { author: peer.name, time: nowStr(), text: replies[Math.floor(Math.random() * replies.length)]! },
        ],
      })
      this.addRevision(peer.name, '回复批注', `回复了 ${target.cell} 的批注`)
      this.showToast(`${peer.name} 回复了 ${target.cell}`)
    } else {
      this.patchComment(target.id, { resolved: true })
      this.addRevision(peer.name, '解决批注', `${target.cell} 的批注已标记为已解决`)
      this.showToast(`${peer.name} 解决了 ${target.cell} 的批注`)
    }
  }

  /** 批注列表（全局唯一数据源；本地不再持有副本） */
  private get comments(): Comment[] {
    return store.snapshot().comments
  }

  /** 不可变更新单条批注（store 广播后所有订阅页面同步） */
  private patchComment(id: string, patch: Partial<Comment>): void {
    store.replaceComments(this.comments.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }
  @state() private revisions: Revision[] = [...INITIAL_REVISIONS]
  @state() private selected = { row: 4, col: 'C' }
  @state() private openCommentId: string | null = 'c1'
  @state() private newCommentFor: string | null = null
  @state() private replyDraft = ''
  @state() private mentionQuery: string | null = null
  @state() private panelTab = '批注'
  @state() private openMenu: string | null = null
  @state() private activeSheetTab = '年度报告'
  /** 在线协作者（演示：三位成员常在线） */
  private readonly onlineMembers = MEMBERS
  /** 他人光标（每 5s 随机移动，展示“他人正在查看哪一格”） */
  @state() private peerSelections: Array<{ name: string; initials: string; bg: string; cell: string }> = [
    { name: 'Mike Chen', initials: 'MK', bg: '#22c55e', cell: 'C4' },
  ]
  private cursorTimer: number | null = null
  private activityTimer: number | null = null
  @state() private toast = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null
  private docClick = (): void => {
    if (this.openMenu) this.openMenu = null
    if (this.mentionQuery !== null) this.mentionQuery = null
  }

  /* ---------------- 派生数据 ---------------- */

  private get sortedComments(): Comment[] {
    return [...this.comments].sort((a, b) => a.time.localeCompare(b.time))
  }

  private get openComment(): Comment | null {
    return this.comments.find((c) => c.id === this.openCommentId) ?? null
  }

  private get stats(): { avg: string; count: number; sum: string } {
    const vals = TABLE_ROWS.map((r) => r.actual)
    const sum = vals.reduce((a, b) => a + b, 0)
    return { avg: fmtInt(sum / vals.length), count: vals.length, sum: fmtInt(sum) }
  }

  private commentOfCell(cell: string): Comment | null {
    return this.comments.find((c) => c.cell === cell) ?? null
  }

  private cellAddress(row: number, col: string): string {
    return `${col}${row}`
  }

  private cellText(row: number, col: string): string {
    const i = COL_LETTERS.indexOf(col as (typeof COL_LETTERS)[number])
    if (row >= 3 && row <= 7) {
      const r = TABLE_ROWS[row - 3]
      if (i === 0) return r.dept
      if (i === 1) return fmtInt(r.target)
      if (i === 2) return fmtInt(r.actual)
      if (i === 3) return `${(r.actual / r.target * 100).toFixed(1)}%`
      return r.note
    }
    if (row === 8) {
      const t = TABLE_ROWS.reduce((a, r) => a + r.target, 0)
      const a = TABLE_ROWS.reduce((s, r) => s + r.actual, 0)
      if (i === 0) return '合计'
      if (i === 1) return fmtInt(t)
      if (i === 2) return fmtInt(a)
      if (i === 3) return `${(a / t * 100).toFixed(1)}%`
      return ''
    }
    return ''
  }

  /* ---------------- 交互 ---------------- */

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private toggleMenu(name: string, e: Event): void {
    e.stopPropagation()
    this.openMenu = this.openMenu === name ? null : name
  }

  private selectCell(row: number, col: string): void {
    this.selected = { row, col }
    const cell = this.cellAddress(row, col)
    const c = this.commentOfCell(cell)
    this.openCommentId = c ? c.id : null
    this.newCommentFor = null
    this.replyDraft = ''
  }

  private addRevision(user: string, action: string, detail: string): void {
    this.revisions = [{ time: nowStr(), user, action, detail }, ...this.revisions]
  }

  private submitReply(commentId: string): void {
    const text = this.replyDraft.trim()
    if (!text) return
    const c = this.comments.find((x) => x.id === commentId)
    if (!c) return
    this.patchComment(commentId, { replies: [...c.replies, { author: CURRENT_USER.name, time: nowStr(), text }] })
    this.replyDraft = ''
    this.mentionQuery = null
    this.addRevision(CURRENT_USER.name, '回复批注', `回复了 ${c.cell} 的批注`)
    this.showToast('回复已发布')
  }

  private toggleLike(c: Comment): void {
    this.patchComment(c.id, { liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) })
  }

  private resolveComment(c: Comment): void {
    this.patchComment(c.id, { resolved: !c.resolved })
    this.openMenu = null
    this.addRevision(CURRENT_USER.name, c.resolved ? '解决批注' : '重新打开', `${c.cell} 的批注已${c.resolved ? '标记为已解决' : '重新打开'}`)
    this.showToast(c.resolved ? '批注已标记为已解决' : '批注已重新打开')
  }

  private deleteComment(c: Comment): void {
    store.replaceComments(this.comments.filter((x) => x.id !== c.id))
    if (this.openCommentId === c.id) this.openCommentId = null
    this.openMenu = null
    this.addRevision(CURRENT_USER.name, '删除批注', `删除了 ${c.cell} 的批注`)
    this.showToast('批注已删除')
  }

  private publishNewComment(): void {
    if (!this.newCommentFor) return
    const text = this.replyDraft.trim()
    if (!text) return
    const id = `c${Date.now()}`
    store.replaceComments([...this.comments, {
      id, cell: this.newCommentFor, author: CURRENT_USER.name, time: nowStr(),
      text, likes: 0, liked: false, resolved: false, replies: [],
    }])
    this.addRevision(CURRENT_USER.name, '添加批注', `在 ${this.newCommentFor} 添加了一条批注`)
    this.openCommentId = id
    this.newCommentFor = null
    this.replyDraft = ''
    this.showToast('批注已添加')
  }

  private onReplyInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value
    this.replyDraft = v
    const m = /@([\w\u4e00-\u9fa5]*)$/.exec(v)
    this.mentionQuery = m ? m[1] : null
  }

  private pickMention(m: Member): void {
    this.replyDraft = this.replyDraft.replace(/@([\w\u4e00-\u9fa5]*)$/, `@${m.name} `)
    this.mentionQuery = null
  }

  private mentionCandidates(): Member[] {
    const q = (this.mentionQuery ?? '').toLowerCase()
    return MEMBERS.filter((m) => m.name.toLowerCase().includes(q))
  }

  /* ---------------- 渲染：chrome ---------------- */

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((m) => html`
            <button class="top-menu ${m === '审阅' ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>
          `)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 15)}<input placeholder="搜索功能..." /></label>
          <span class="online-peers" title="${this.onlineMembers.length} 人在线协作">
            ${this.onlineMembers.map(
              (member) => html`<span class="peer-avatar" style="background:${member.bg}" title="${member.name}">${member.initials}</span>`,
            )}
            <span class="peer-online-dot"></span>
          </span>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 15)}</button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 15)}</button>
        <button class="tool-btn" title="打印" @click=${() => toast('打印预览')} >${sxIcon('print', 15)}</button>
        <span class="v-sep"></span>
        <span class="font-select">思源黑体<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <span class="font-select">12<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <button class="tool-btn" @click=${() => toast('加粗')}><b>B</b></button>
        <button class="tool-btn" @click=${() => toast('斜体')}><i>I</i></button>
        <button class="tool-btn" @click=${() => toast('下划线')}><u>U</u></button>
        <button class="tool-btn"><span class="fc-red">A</span></button>
        <button class="tool-btn"><span class="fc-yellow">A</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" @click=${() => toast('左对齐')}>${sxIcon('alignLeft', 15)}</button>
        <button class="tool-btn" @click=${() => toast('居中')}>${sxIcon('alignCenter', 15)}</button>
        <button class="tool-btn" @click=${() => toast('右对齐')}>${sxIcon('alignRight', 15)}</button>
        <span class="v-sep"></span>
        ${this.renderToolPill('批注', 'comment', ['新建批注', '显示所有批注'], 't-comment')}
        ${this.renderToolPill('修订', 'history', ['突出显示修订', '打开修订记录'], 't-revision')}
        ${this.renderToolPill('保护', 'shield', ['保护工作表', '保护工作簿', '锁定单元格'], 't-protect')}
        ${this.renderToolPill('共享', 'users', ['邀请协作者', '生成分享链接', '权限设置'], 't-share')}
      </div>`
  }

  private renderToolPill(label: string, icon: Parameters<typeof sxIcon>[0], items: string[], menuName: string): TemplateResult {
    return html`
      <span class="opt-wrap" style="position:relative; display:inline-flex;">
        <button class="tool-pill ${this.openMenu === menuName ? 'menu-open' : ''}"
          @click=${(e: Event) => this.toggleMenu(menuName, e)}>
          <span class="ic">${sxIcon(icon, 14)}</span>${label}<span class="caret">${sxIcon('chevronDown', 11)}</span>
        </button>
        ${this.openMenu === menuName ? html`
          <div class="tool-menu" @click=${(e: Event) => e.stopPropagation()}>
            ${items.map((it, i) => html`
              <button class="tool-menu-item" @click=${() => { this.openMenu = null; this.onToolMenu(menuName, i) }}>
                <span class="tmic">${sxIcon(icon, 13)}</span>${it}
              </button>
            `)}
          </div>` : nothing}
      </span>`
  }

  private onToolMenu(menuName: string, _i: number): void {
    if (menuName === 't-comment') {
      const cell = this.cellAddress(this.selected.row, this.selected.col)
      const exist = this.commentOfCell(cell)
      if (exist) {
        this.openCommentId = exist.id
      } else {
        this.newCommentFor = cell
        this.replyDraft = ''
      }
      return
    }
    this.showToast(`${({ 't-revision': '修订', 't-protect': '保护', 't-share': '共享' } as Record<string, string>)[menuName]}功能（演示）`)
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <span class="cell-ref">${this.cellAddress(this.selected.row, this.selected.col)}<span class="caret">${sxIcon('chevronDown', 10)}</span></span>
        <span class="fx-badge">fx</span>
        <span class="formula-input">${this.cellText(this.selected.row, this.selected.col)}</span>
      </div>`
  }

  /* ---------------- 渲染：表格 ---------------- */

  private renderTable(): TemplateResult {
    const widths = [ROWNUM_W, ...COL_WIDTHS]
    return html`
      <table class="sheet-table">
        <colgroup>
          ${widths.map((w) => html`<col style="width:${w}px" />`)}
        </colgroup>
        <tbody>
          <tr>
            <td class="rownum">1</td>
            <td class="banner-cell" colspan="5">
              <div class="banner-inner">
                <span class="bi">${sxIcon('chartBar', 17)}</span>${REPORT_TITLE}
                <span class="banner-deadline">${REPORT_DEADLINE}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td class="rownum">2</td>
            <th>部门</th><th>销售目标</th><th>实际销售</th><th>完成率</th><th>备注</th>
          </tr>
          ${TABLE_ROWS.map((r, idx) => this.renderDataRow(r, idx + 3))}
          ${this.renderTotalRow()}
        </tbody>
      </table>`
  }

  private renderDataRow(r: (typeof TABLE_ROWS)[number], row: number): TemplateResult {
    const rate = `${(r.actual / r.target * 100).toFixed(1)}%`
    const cells = [
      { v: r.dept, cls: '' },
      { v: fmtInt(r.target), cls: 'num' },
      { v: fmtInt(r.actual), cls: 'num' },
      { v: rate, cls: 'ctr' },
      { v: r.note, cls: '' },
    ]
    return html`
      <tr>
        <td class="rownum">${row}</td>
        ${cells.map((c, i) => this.renderTd(c.v, c.cls, row, COL_LETTERS[i]))}
      </tr>`
  }

  private renderTotalRow(): TemplateResult {
    const t = TABLE_ROWS.reduce((a, r) => a + r.target, 0)
    const a = TABLE_ROWS.reduce((s, r) => s + r.actual, 0)
    const cells = [
      { v: '合计', cls: '' },
      { v: fmtInt(t), cls: 'num' },
      { v: fmtInt(a), cls: 'num' },
      { v: `${(a / t * 100).toFixed(1)}%`, cls: 'ctr' },
      { v: '', cls: '' },
    ]
    return html`
      <tr class="total">
        <td class="rownum">8</td>
        ${cells.map((c, i) => this.renderTd(c.v, c.cls, 8, COL_LETTERS[i]))}
      </tr>`
  }

  private renderTd(value: string, cls: string, row: number, col: string): TemplateResult {
    const cell = `${col}${row}`
    const c = this.commentOfCell(cell)
    const isSel = this.selected.row === row && this.selected.col === col
    const peer = this.peerSelections.find((item) => item.cell === cell)
    return html`
      <td class="${cls} ${isSel ? 'sel-cell' : ''} ${peer ? 'peer-cell' : ''}"
        style=${peer ? `outline: 2px solid ${peer.bg}; outline-offset: -2px;` : ''}
        @click=${() => this.selectCell(row, col)}>
        ${value}
        ${peer ? html`<span class="peer-tag" style="background:${peer.bg}" title="${peer.name} 正在查看">${peer.initials}</span>` : nothing}
        ${c ? html`<span class="cmark ${c.resolved ? 'resolved' : ''}"></span>` : nothing}
      </td>`
  }

  /* ---------------- 渲染：批注弹出卡 ---------------- */

  private renderCommentPop(): TemplateResult {
    if (this.newCommentFor) return this.renderNewCommentPop()
    const c = this.openComment
    if (!c) return html``
    const m = memberOf(c.author)
    const left = Math.min(colX(c.cell.slice(0, 1)) + 56, 754 - 258)
    const row = parseInt(c.cell.slice(1), 10)
    const top = rowY(row) + ROW_H + 8
    return html`
      <div class="comment-pop" style="left:${left}px; top:${top}px;" @click=${(e: Event) => e.stopPropagation()}>
        <div class="cp-head">
          <span class="cp-avatar" style="background:${m.bg}">${m.initials}</span>
          <div>
            <div class="cp-name">${c.author}</div>
            <div class="cp-time">${c.time}</div>
          </div>
          <span class="opt-wrap" style="position:relative; margin-left:auto;">
            <button class="cp-more" @click=${(e: Event) => this.toggleMenu(`pop-${c.id}`, e)}>${sxIcon('more', 15)}</button>
            ${this.openMenu === `pop-${c.id}` ? html`
              <div class="more-menu">
                <button class="more-item" @click=${() => this.resolveComment(c)}>
                  <span class="mic">${sxIcon(c.resolved ? 'refresh' : 'checkCircle', 13)}</span>${c.resolved ? '重新打开' : '标记为已解决'}
                </button>
                <button class="more-item danger" @click=${() => this.deleteComment(c)}>
                  <span class="mic">${sxIcon('trash', 13)}</span>删除批注
                </button>
              </div>` : nothing}
          </span>
        </div>
        <div class="cp-text">${renderMentions(c.text)}</div>
        ${c.replies.length ? html`
          <div class="cp-reply-list">
            ${c.replies.map((r) => {
              const rm = memberOf(r.author)
              return html`
                <div class="cp-reply">
                  <span class="cp-avatar" style="background:${rm.bg}">${rm.initials}</span>
                  <div class="cp-reply-body">
                    <div class="cp-reply-meta"><b>${r.author}</b>${r.time}</div>
                    <div class="cp-reply-text">${renderMentions(r.text)}</div>
                  </div>
                </div>`
            })}
          </div>` : nothing}
        ${c.resolved ? html`
          <div class="cp-resolved-tip">${sxIcon('checkCircle', 13)} 已解决</div>` : nothing}
        ${this.renderReplyInput(`pop-${c.id}`)}
        <div class="cp-foot">
          <button class="cp-act ${c.liked ? 'liked' : ''}" @click=${() => this.toggleLike(c)}>
            ${sxIcon('thumbsUp', 14)} ${c.likes}
          </button>
          <button class="cp-act" @click=${() => this.showToast('已复制批注链接（演示）')}>${sxIcon('link', 14)}</button>
          <span class="spacer"></span>
          ${c.resolved ? html`<span class="cp-act resolved-act">${sxIcon('checkCircle', 14)} 已解决</span>` : nothing}
        </div>
      </div>`
  }

  private renderNewCommentPop(): TemplateResult {
    const cell = this.newCommentFor ?? ''
    const left = Math.min(colX(cell.slice(0, 1)) + 56, 754 - 258)
    const row = parseInt(cell.slice(1), 10)
    const top = rowY(row) + ROW_H + 8
    return html`
      <div class="comment-pop" style="left:${left}px; top:${top}px;" @click=${(e: Event) => e.stopPropagation()}>
        <div class="cp-head">
          <span class="cp-avatar" style="background:${CURRENT_USER.bg}">${CURRENT_USER.initials}</span>
          <div>
            <div class="cp-name">${CURRENT_USER.name}</div>
            <div class="cp-time">新建批注 · ${cell}</div>
          </div>
        </div>
        ${this.renderReplyInput('new')}
        <div class="cp-foot">
          <button class="cp-act" @click=${() => { this.newCommentFor = null; this.replyDraft = '' }}>取消</button>
          <span class="spacer"></span>
          <button class="cp-act" style="color:#fff; background:var(--sx-brand); border-radius:6px; padding:4px 12px;"
            ?disabled=${!this.replyDraft.trim()}
            @click=${() => this.publishNewComment()}>发布</button>
        </div>
      </div>`
  }

  private renderReplyInput(menuName: string): TemplateResult {
    const candidates = this.mentionCandidates()
    return html`
      <div class="cp-input-wrap">
        <input class="cp-input" placeholder="回复，@提及成员..."
          .value=${this.replyDraft}
          @input=${(e: Event) => this.onReplyInput(e)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.submitReplyOrNew(menuName) }}
          @click=${(e: Event) => e.stopPropagation()} />
        <button class="cp-send" ?disabled=${!this.replyDraft.trim()}
          @click=${() => this.submitReplyOrNew(menuName)}>${sxIcon('send', 13)}</button>
        ${this.mentionQuery !== null && candidates.length ? html`
          <div class="mention-menu">
            ${candidates.map((m) => html`
              <button class="mention-item" @click=${() => this.pickMention(m)}>
                <span class="mi-avatar" style="background:${m.bg}">${m.initials}</span>${m.name}
              </button>
            `)}
          </div>` : nothing}
      </div>`
  }

  private submitReplyOrNew(menuName: string): void {
    if (menuName === 'new') this.publishNewComment()
    else this.submitReply(menuName.replace('pop-', ''))
  }

  /* ---------------- 渲染：右侧面板 ---------------- */

  private renderPanel(): TemplateResult {
    return html`
      <aside class="panel">
        <div class="panel-head">
          <span class="ph-icon">${sxIcon('comment', 15)}</span>
          <span class="panel-title">批注与审阅</span>
          <button class="panel-close" @click=${() => this.showToast('面板收起（演示）')}>${sxIcon('close', 16)}</button>
        </div>
        <div class="panel-tabs">
          ${PANEL_TABS.map((t) => html`
            <button class="panel-tab ${this.panelTab === t ? 'active' : ''}" @click=${() => { this.panelTab = t }}>
              ${t}${t === '批注' ? html` (${this.comments.length})` : nothing}
            </button>
          `)}
        </div>
        <div class="panel-body">
          ${this.panelTab === '批注' ? this.renderCommentsTab() : nothing}
          ${this.panelTab === '修订记录' ? this.renderRevisionsTab() : nothing}
          ${this.panelTab === '审阅状态' ? this.renderStatusTab() : nothing}
        </div>
      </aside>`
  }

  private renderCommentsTab(): TemplateResult {
    const total = this.comments.length
    const resolved = this.comments.filter((c) => c.resolved).length
    return html`
      ${this.sortedComments.map((c) => {
        const m = memberOf(c.author)
        return html`
          <div class="cmt-card">
            <div class="cmt-head">
              <span class="cmt-avatar" style="background:${m.bg}">${m.initials}</span>
              <div>
                <div class="cmt-name">${c.author}</div>
                <div class="cmt-time">${c.time}</div>
              </div>
              <span class="cmt-cell-tag ${c.resolved ? 'resolved' : ''}">${c.cell}${c.resolved ? ' · 已解决' : ''}</span>
              <span class="opt-wrap" style="position:relative; margin-left:auto;">
                <button class="cmt-more" @click=${(e: Event) => this.toggleMenu(`panel-${c.id}`, e)}>${sxIcon('more', 15)}</button>
                ${this.openMenu === `panel-${c.id}` ? html`
                  <div class="more-menu">
                    <button class="more-item" @click=${() => { this.selectCellStr(c.cell); this.openMenu = null }}>
                      <span class="mic">${sxIcon('border', 13)}</span>定位到单元格
                    </button>
                    <button class="more-item" @click=${() => this.resolveComment(c)}>
                      <span class="mic">${sxIcon(c.resolved ? 'refresh' : 'checkCircle', 13)}</span>${c.resolved ? '重新打开' : '标记为已解决'}
                    </button>
                    <button class="more-item danger" @click=${() => this.deleteComment(c)}>
                      <span class="mic">${sxIcon('trash', 13)}</span>删除批注
                    </button>
                  </div>` : nothing}
              </span>
            </div>
            <div class="cmt-text">${renderMentions(c.text)}</div>
            ${c.replies.length ? html`
              <div class="cmt-replies">
                ${c.replies.map((r) => {
                  const rm = memberOf(r.author)
                  return html`
                    <div class="cmt-reply">
                      <span class="cmt-avatar" style="background:${rm.bg}">${rm.initials}</span>
                      <div class="cmt-reply-body">
                        <div class="cmt-reply-meta"><b>${r.author}</b>${r.time}</div>
                        <div class="cmt-reply-text">${renderMentions(r.text)}</div>
                      </div>
                    </div>`
                })}
              </div>` : nothing}
            <button class="cmt-reply-btn" @click=${() => { this.selectCellStr(c.cell); this.openCommentId = c.id }}>
              ${sxIcon('reply', 12)} 回复
            </button>
          </div>`
      })}
      <div class="stats-block">
        <div class="stats-title">审阅统计</div>
        <div class="stats-row"><span class="dot" style="background:#f59e0b"></span>批注总数<span class="val">${total}</span></div>
        <div class="stats-row"><span class="dot" style="background:#22c55e"></span>已解决<span class="val">${resolved}</span></div>
        <div class="stats-row"><span class="dot" style="background:#ef4444"></span>未解决<span class="val">${total - resolved}</span></div>
      </div>`
  }

  private selectCellStr(cell: string): void {
    const col = cell.slice(0, 1)
    const row = parseInt(cell.slice(1), 10)
    this.selectCell(row, col)
  }

  private renderRevisionsTab(): TemplateResult {
    return html`
      ${this.revisions.map((r, i) => {
        const dotCls = r.action.includes('解决') ? 'green' : r.action.includes('批注') ? '' : r.action.includes('删除') ? 'gray' : 'amber'
        return html`
          <div class="rev-item">
            <div class="rev-rail">
              <span class="rev-dot ${dotCls}"></span>
              ${i < this.revisions.length - 1 ? html`<span class="rev-line"></span>` : nothing}
            </div>
            <div class="rev-body">
              <div class="rev-action"><b>${r.user}</b> ${r.action}</div>
              <div class="rev-detail">${r.detail}</div>
              <div class="rev-time">${sxIcon('clock', 11)}${r.time}</div>
            </div>
          </div>`
      })}`
  }

  private renderStatusTab(): TemplateResult {
    const doneCount = REVIEW_FLOW.filter((s) => s.status === 'done').length
    const pct = Math.round(doneCount / REVIEW_FLOW.length * 100)
    return html`
      <div class="flow-title">审阅流程</div>
      <div class="progress-wrap">
        <div class="progress-label"><span>整体进度</span><span>${pct}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      ${REVIEW_FLOW.map((s, i) => html`
        <div class="flow-step">
          <div class="flow-rail">
            <span class="flow-node ${s.status === 'done' ? 'done' : s.status === 'active' ? 'active' : ''}">
              ${s.status === 'done' ? sxIcon('check', 11) : i + 1}
            </span>
            ${i < REVIEW_FLOW.length - 1 ? html`<span class="flow-line"></span>` : nothing}
          </div>
          <div class="flow-body">
            <div class="flow-name ${s.status === 'todo' ? 'dim' : ''}">
              ${s.name}
              <span class="flow-badge ${s.status}">${s.status === 'done' ? '已完成' : s.status === 'active' ? '进行中' : '待开始'}</span>
            </div>
            <div class="flow-owner">负责人：${s.owner}</div>
          </div>
        </div>
      `)}`
  }

  /* ---------------- 渲染：底部 ---------------- */

  private renderBottom(): TemplateResult {
    const s = this.stats
    return html`
      <div class="sheet-tabs-bar">
        <button class="tab-add" @click=${() => this.showToast('新建工作表（演示）')}>+</button>
        ${SHEET_TABS.map((t) => html`
          <button class="sheet-tab ${this.activeSheetTab === t ? 'active' : ''}"
            @click=${() => { this.activeSheetTab = t; this.showToast(`切换到「${t}」（演示）`) }}>${t}</button>
        `)}
        <button class="tabs-more" @click=${() => this.showToast('更多工作表（演示）')}>•••</button>
      </div>
      <div class="statusbar">
        <span>就绪</span>
        <span>平均值: <span class="sb-val">${s.avg}</span></span>
        <span>计数: <span class="sb-val">${s.count}</span></span>
        <span>求和: <span class="sb-val">${s.sum}</span></span>
        <span class="right">
          <span class="zoom-ctl">
            <button @click=${() => this.showToast('缩小（演示）')}>−</button>
            <span class="zoom-val">100%</span>
            <button @click=${() => this.showToast('放大（演示）')}>+</button>
          </span>
          <span style="display:inline-flex">${sxIcon('fullscreen', 14)}</span>
        </span>
      </div>`
  }

  /* ---------------- 总渲染 ---------------- */

  render(): TemplateResult {
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="main">
            ${this.renderFormulaBar()}
            <div class="sheet-scroll">
              <div class="sheet-canvas">
                ${this.renderTable()}
                ${this.renderCommentPop()}
              </div>
            </div>
          </div>
          ${this.renderPanel()}
        </div>
        ${this.renderBottom()}
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'review-app': ReviewApp
  }
}
