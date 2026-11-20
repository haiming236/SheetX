/**
 * @sheetx/editors - 编辑器注册表
 *
 * 插件扩展点之一：registerEditor(name, factory) 即可接入自定义编辑器
 * （IPluginContext.registerEditor 直接桥接到这里）。
 * 未知编辑器名报错时列出全部可用名称——错误即文档。
 */

import type { EditorContext, EditorFactory, EditorHandle } from './types.js'

export class EditorRegistry {
  private factories = new Map<string, EditorFactory>()

  register(name: string, factory: EditorFactory, options: { override?: boolean } = {}): void {
    if (this.factories.has(name) && !options.override) {
      throw new Error(`[SheetX] 编辑器 "${name}" 已注册。如需覆盖请传 { override: true }。`)
    }
    this.factories.set(name, factory)
  }

  unregister(name: string): void {
    this.factories.delete(name)
  }

  has(name: string): boolean {
    return this.factories.has(name)
  }

  list(): string[] {
    return [...this.factories.keys()]
  }

  /** 创建编辑器实例。未知名称抛出带候选列表的错误 */
  create(name: string, ctx: EditorContext): EditorHandle {
    const factory = this.factories.get(name)
    if (!factory) {
      throw new Error(`[SheetX] 未注册的编辑器: "${name}"。可用: ${this.list().join(', ')}`)
    }
    return factory(ctx)
  }
}

/** 内置编辑器名（ColumnDef.editor 用这些字符串） */
export const BuiltinEditorNames = {
  TEXT: 'text',
  MULTILINE: 'multiline',
  NUMBER: 'number',
  CURRENCY: 'currency',
  DATE: 'date',
  DATETIME: 'datetime',
  SELECT: 'select',
  BOOLEAN: 'boolean',
  SWITCH: 'switch',
  REMOTE_SEARCH: 'remote-search',
} as const

export type BuiltinEditorName = (typeof BuiltinEditorNames)[keyof typeof BuiltinEditorNames]
