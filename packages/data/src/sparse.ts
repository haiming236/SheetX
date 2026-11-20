/**
 * @sheetx/data - 稀疏矩阵
 *
 * Sheet 模式的单元格存储基座：row → col → T 两级 Map。
 * 核心不变量：**只为非空单元格分配内存**——用户只在 A1/B2/Z1000 有内容时，
 * 不应为几十万个空格子建对象（这是 Luckysheet/Univer 均验证过的性能红线）。
 *
 * 设计说明：借鉴 Univer ObjectMatrix「两级稀疏 JSON」的思想（Apache-2.0，仅借鉴思路，
 * 实现为自研 Map 结构而非 plain object——Map 在百万级键下性能与内存特征更稳定）。
 */

/** 稀疏矩阵：两级 Map 索引，空值不占内存 */
export class SparseMatrix<T> {
  private rows = new Map<number, Map<number, T>>()

  /** 非空行数（用于统计与序列化体积预估） */
  get rowCount(): number {
    return this.rows.size
  }

  /** 读取单元格；不存在返回 undefined（与「空格不占内存」一致，用 undefined 表示空） */
  get(row: number, col: number): T | undefined {
    return this.rows.get(row)?.get(col)
  }

  has(row: number, col: number): boolean {
    return this.rows.get(row)?.has(col) ?? false
  }

  /**
   * 写入单元格。
   * 约定：value 为 null/undefined 时执行删除——保证「非空才存储」的不变量，
   * 调用方无需关心从「有值」到「清空」的分支。
   */
  set(row: number, col: number, value: T | null | undefined): void {
    if (value === null || value === undefined) {
      this.delete(row, col)
      return
    }
    let rowMap = this.rows.get(row)
    if (!rowMap) {
      rowMap = new Map()
      this.rows.set(row, rowMap)
    }
    rowMap.set(col, value)
  }

  /** 删除单元格；若整行为空则连行索引一起回收（避免长尾空行积累） */
  delete(row: number, col: number): void {
    const rowMap = this.rows.get(row)
    if (!rowMap) return
    rowMap.delete(col)
    if (rowMap.size === 0) this.rows.delete(row)
  }

  /** 取整行（只含非空列）；不存在返回 undefined */
  getRow(row: number): Map<number, T> | undefined {
    return this.rows.get(row)
  }

  /** 行号列表（升序）。供序列化与遍历使用，避免直接暴露内部 Map */
  getRowIndices(): number[] {
    return [...this.rows.keys()].sort((a, b) => a - b)
  }

  /**
   * 稀疏遍历：只访问非空单元格。
   * callback 返回 false 可提前终止（用于「找到一个就停」的场景）。
   */
  forEach(callback: (row: number, col: number, value: T) => void | false): void {
    for (const [row, rowMap] of this.rows) {
      for (const [col, value] of rowMap) {
        if (callback(row, col, value) === false) return
      }
    }
  }

  clear(): void {
    this.rows.clear()
  }

  /**
   * 序列化为 plain object（快照/持久化格式）。
   * 键使用十进制数字字符串，JSON 往返无损（与 Univer 快照格式同构，便于未来互通）。
   */
  toJSON(): Record<string, Record<string, T>> {
    const out: Record<string, Record<string, T>> = {}
    for (const [row, rowMap] of this.rows) {
      const rowObj: Record<string, T> = {}
      for (const [col, value] of rowMap) rowObj[String(col)] = value
      out[String(row)] = rowObj
    }
    return out
  }

  static fromJSON<T>(json: Record<string, Record<string, T>> | undefined | null): SparseMatrix<T> {
    const matrix = new SparseMatrix<T>()
    if (!json) return matrix
    for (const rowKey of Object.keys(json)) {
      const rowMap = json[rowKey]!
      for (const colKey of Object.keys(rowMap)) {
        matrix.set(Number(rowKey), Number(colKey), rowMap[colKey])
      }
    }
    return matrix
  }
}
