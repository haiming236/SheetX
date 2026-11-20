/**
 * @sheetx/formula - 公式引擎门面
 *
 * 对上层（spreadsheet）暴露的完整工作流：
 *   setFormula(写入公式) → recompute(增量重算) → FormulaChange[]（写回引擎缓存的值）
 *
 * 架构纪律：
 * - 引擎**不持有表格数据**——通过 ValueSource 接口取值（isomorphic，可在 Worker 跑）；
 * - 计算结果只进 computed 缓存，不写回数据源——数据写入是上层的事
 *   （spreadsheet 把 FormulaChange 转成 mutation，source='formula'，不进 undo 栈：
 *   undo 恢复的是公式串，值由重算推导——Univer 同款语义）；
 * - 增量重算入口与 @sheetx/data 的事件天然衔接：DATA_CHANGED 事务里的变更单元格
 *   就是 recompute 的 seeds。
 */

import { parseFormula } from './parser.js'
import { FormulaSyntaxError } from './lexer.js'
import { FormulaError, isFormulaError, FormulaErrorCode } from './errors.js'
import { Evaluator, toNumber, toBool, toStringValue } from './evaluator.js'
import type { CellValueLike, EvalValue, SourceCellValue, ValueSource } from './evaluator.js'
import { createBuiltinFunctions, dateToSerial, serialToDate } from './functions.js'
import type { FunctionImpl, FunctionRegistry } from './functions.js'
import { DependencyGraph, nodeKey } from './graph.js'
import type { ChangedCell, FormulaNode } from './graph.js'

/** 一次公式重算产生的值变更 */
export interface FormulaChange {
  sheet: string
  row: number
  col: number
  /** 之前的计算值（或无缓存时的原始单元格值） */
  oldValue: CellValueLike
  /** 新计算值（错误以其错误码字符串落值，如 "#DIV/0!"） */
  newValue: CellValueLike
}

export interface FormulaEngineOptions {
  source: ValueSource
}

export class FormulaEngine {
  readonly graph = new DependencyGraph()
  private readonly functions: FunctionRegistry
  private readonly evaluator: Evaluator
  private readonly source: ValueSource
  /** 计算值缓存：nodeKey → 结果（错误以 FormulaError 实例存储） */
  private readonly computed = new Map<string, EvalValue>()

  constructor(options: FormulaEngineOptions) {
    this.source = options.source
    this.functions = createBuiltinFunctions()
    // 关键：求值器拿到的是「缓存感知」的取值源——公式引用公式时，
    // 先查计算缓存再落原始数据源。否则 A4=A3*2 会读到 A3 的原始空值（=0）。
    // E1：缓存中的 FormulaError **原样透传**（不字符串化），保证 #CYCLE! 等错误
    // 沿引用链保真传播（旧实现经 valueToCell 变字符串，下游 toNumber 失败变成 #VALUE!）。
    const cacheAwareSource: ValueSource = {
      getCellValue: (sheet, row, col) => {
        if (sheet) {
          const cached = this.computed.get(nodeKey(sheet, row, col))
          if (cached !== undefined) {
            if (isFormulaError(cached)) return cached
            if (Array.isArray(cached)) return cached[0]?.[0] ?? null
            return cached
          }
        }
        return this.source.getCellValue(sheet, row, col)
      },
      getRangeValues: (sheet, r1, c1, r2, c2) => {
        const matrix: SourceCellValue[][] = []
        for (let r = r1; r <= r2; r++) {
          const rowValues: SourceCellValue[] = []
          for (let c = c1; c <= c2; c++) rowValues.push(cacheAwareSource.getCellValue(sheet, r, c))
          matrix.push(rowValues)
        }
        return matrix
      },
    }
    this.evaluator = new Evaluator(cacheAwareSource, this.functions)
  }

  /** 注册自定义函数（插件扩展点） */
  registerFunction(name: string, impl: FunctionImpl): void {
    this.functions.register(name, impl)
  }

  hasFunction(name: string): boolean {
    return this.functions.has(name)
  }

  /**
   * 设置公式（解析 + 建图 + 立即求值该格）。
   * 语法错误不抛异常——单元格显示 #NAME?，公式串保留（用户可修正）。
   * formulaText 为 null/undefined 表示删除公式。
   *
   * E1：区间环（含跨表互引）在**建图阶段**检测——写入后立刻对该格跑一次
   * collectDirty，环上节点与环的下游统一落 #CYCLE!；批量装载传
   * `{ deferCycle: true }` 跳过逐格检测（recalculateAll 的最终拓扑统一处理），
   * 避免 O(n²) 的装载开销。
   */
  setFormula(
    sheet: string,
    row: number,
    col: number,
    formulaText: string | null | undefined,
    options?: { deferCycle?: boolean },
  ): void {
    const key = nodeKey(sheet, row, col)
    if (formulaText === null || formulaText === undefined || formulaText === '') {
      this.graph.removeFormula(sheet, row, col)
      this.computed.delete(key)
      return
    }
    const text = formulaText.startsWith('=') ? formulaText.slice(1) : formulaText
    try {
      const ast = parseFormula(text)
      const node = this.graph.setFormula(sheet, row, col, ast)
      // E1：自环在建图时标记并立即落 #CYCLE!——绝不执行求值（求值会把
      // 自身旧值当输入，产生静默漂移的错误数值）。
      if (node.selfCycle) {
        this.computed.set(key, FormulaError.cycle())
        return
      }
      // E1：区间环建图期检测（复用 recompute 的 Kahn 机制；cyclic = 环 + 环下游）
      if (!options?.deferCycle) {
        const { cyclic } = this.graph.collectDirty([{ sheet, row, col }])
        if (cyclic.has(node.key)) {
          for (const cyclicKey of cyclic) {
            if (this.graph.getNode(cyclicKey)) this.computed.set(cyclicKey, FormulaError.cycle())
          }
          return
        }
      }
      // 非环公式：立即求值一次（不触发下游——下游由 recompute 统一处理）
      this.evaluateNodeToCache(node)
    } catch (error) {
      if (error instanceof FormulaSyntaxError) {
        this.computed.set(key, FormulaError.nameError())
      } else {
        throw error
      }
    }
  }

  /** 读取某格的计算值（非公式格返回 undefined；错误返回 FormulaError 实例） */
  getComputed(sheet: string, row: number, col: number): EvalValue | undefined {
    return this.computed.get(nodeKey(sheet, row, col))
  }

  /**
   * 增量重算：一组变更单元格 → 受影响公式按拓扑序求值 → 值变更列表。
   * 只返回「值真的变了」的项——上游据此决定是否继续级联（本引擎已在
   * 拓扑序中把级联包含在内，上游无需循环调用）。
   */
  recompute(changed: ReadonlyArray<ChangedCell>): FormulaChange[] {
    const { order, cyclic } = this.graph.collectDirty(changed)
    return this.evaluateInOrder(order, cyclic)
  }

  /** 全量重算（加载快照/插行删列等结构变化后调用） */
  recalculateAll(): FormulaChange[] {
    // 全量场景：先把所有节点按拓扑排（以全部节点为 seeds 等价于空变更 + 全量扩散）
    const nodes = this.graph.allNodes()
    const { order, cyclic } = this.graph.collectDirty(
      nodes.map((node) => ({ sheet: node.sheet, row: node.row, col: node.col })),
    )
    // 动态函数节点与未被 seeds 命中的节点也要算
    const included = new Set(order.map((node) => node.key))
    for (const node of nodes) {
      if (!included.has(node.key) && !cyclic.has(node.key)) order.push(node)
    }
    return this.evaluateInOrder(order, cyclic)
  }

  /** 清空全部公式（换工作簿时） */
  reset(): void {
    this.graph.clear()
    this.computed.clear()
  }

  // ---- 内部 ----

  private evaluateInOrder(order: ReadonlyArray<FormulaNode>, cyclic: ReadonlySet<string>): FormulaChange[] {
    const changes: FormulaChange[] = []
    for (const node of order) {
      const key = node.key
      const oldValue = valueToCell(this.computed.get(key)) ?? this.readSourceValue(node)
      const result = this.evaluateNodeToCache(node)
      const newValue = valueToCell(result) ?? null
      if (!Object.is(oldValue, newValue)) {
        changes.push({ sheet: node.sheet, row: node.row, col: node.col, oldValue, newValue })
      }
    }
    for (const key of cyclic) {
      const node = this.graph.getNode(key)
      if (!node) continue
      const oldValue = valueToCell(this.computed.get(key)) ?? this.readSourceValue(node)
      this.computed.set(key, FormulaError.cycle())
      const newValue = FormulaErrorCode.CYCLE
      // 环格总是计入重算结果：cyclic 表示「本次重算判定为环/环下游」，
      // 上游变更后即使值仍是 #CYCLE! 也代表一次重算事实（Excel 重算语义），
      // 调用方（spreadsheet）据此刷新环格状态并广播。
      changes.push({ sheet: node.sheet, row: node.row, col: node.col, oldValue, newValue })
    }
    return changes
  }

  private evaluateNodeToCache(node: FormulaNode): EvalValue {
    const result = this.evaluator.evaluate(node.ast, { sheet: node.sheet })
    this.computed.set(node.key, result)
    return result
  }

  /** 无计算缓存时的旧值 = 数据源里的原始值（错误实例 → 错误码字符串） */
  private readSourceValue(node: FormulaNode): CellValueLike {
    const raw = this.source.getCellValue(node.sheet, node.row, node.col)
    return isFormulaError(raw) ? raw.code : raw
  }

  // 给外部的便捷求值（测试/调试用）
  evaluateText(formulaText: string, sheet: string | null = null): EvalValue {
    const ast = parseFormula(formulaText.startsWith('=') ? formulaText.slice(1) : formulaText)
    return this.evaluator.evaluate(ast, { sheet })
  }
}

/** EvalValue → 可落库的单元格值（错误 → 错误码字符串；区域 → 左上角） */
export function valueToCell(value: EvalValue | undefined): CellValueLike {
  if (value === undefined) return null
  if (isFormulaError(value)) return value.code
  if (Array.isArray(value)) {
    const first = value[0]?.[0] ?? null
    return isFormulaError(first) ? first.code : first
  }
  return value
}

// re-export：上层（spreadsheet）会用到的工具
export { dateToSerial, serialToDate, FormulaError, isFormulaError, toNumber, toBool, toStringValue }
export type { EvalValue, ValueSource, CellValueLike, FunctionImpl, FunctionRegistry, FormulaNode, ChangedCell }
