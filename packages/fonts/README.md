# @sheetx/fonts

SheetX 内置字体库：**统一字体注册 + 按需加载 + TTF 子集化 + PDF 字体嵌入**。

目标：使用者不需要自己装字体，也不需要为字体功能引入庞大依赖（本包零运行时依赖）。

## 目录结构

```
packages/fonts/
├── src/
│   ├── index.ts      # 对外导出
│   ├── registry.ts   # SheetXFonts：注册表（唯一事实来源）
│   ├── loader.ts     # FontFace 加载 + document.fonts.ready（Node 安全降级）
│   ├── ttf.ts        # 极简 TTF 解析（head/hhea/maxp/cmap/hmtx/name/OS2）
│   ├── subset.ts     # 子集化（字形闭包 + 重建 glyf/loca/hmtx/cmap）
│   └── pdf.ts        # PDF 字体嵌入（FontFile2 + CIDFontType2 + ToUnicode）
├── assets/
│   ├── source-han-serif/{regular,bold}.ttf   思源宋体
│   ├── source-han-sans/{regular,bold}.ttf    思源黑体
│   └── inter/{regular,bold}.ttf              Inter
└── test/fonts.test.ts
```

## 快速开始

```ts
import { SheetXFonts } from '@sheetx/fonts'

// 1. 注册内置字体（幂等）；load: true 同时把 Regular 载入浏览器
await SheetXFonts.registerBuiltins({ load: true })

// 2. 默认字体：思源宋体 Regular
SheetXFonts.setDefault('Source Han Serif CN')

// 3. 列表 / 解析
SheetXFonts.getAvailableFonts()                       // FontDescriptor[]
SheetXFonts.resolveCssFamily('Source Han Sans CN', 700) // "'Source Han Sans CN', 'PingFang SC', sans-serif"

// 4. 自定义字体（用户自带 TTF）
SheetXFonts.registerFromBytes({ family: 'Acme Sans', weight: 400, bytes })
```

### 资源从哪来

字体文件由**宿主应用**提供地址，包本身不绑定打包器：

```ts
// Vite 示例
const assets = import.meta.glob('.../assets/**/*.ttf', { query: '?url', import: 'default', eager: true })
SheetXFonts.setAssetResolver((family, weight) => mapToUrl(family, weight))
```

不设置时默认按包内 `assets/` 相对路径解析（`new URL(..., import.meta.url)`）。

### 表格默认字体

```ts
const spreadsheet = new SheetXSpreadsheet({
  container: '#app',
  defaultFont: { family: 'Source Han Serif CN', size: 12, weight: 400 },
})
```

## PDF 导出（字体嵌入）

**TTF 本身不保证嵌入成功**，必须走完整链路：子集化 → FontFile2 → CIDFontType2 → ToUnicode。

```ts
// 推荐：字体数组即回退链，缺字自动切后备字体
const pdf = buildPdfDocument([sansBytes, interBytes], {
  lines: [
    { text: '销售报表 完成率 负责人', fontSize: 16 },
    { text: '¥1,234.56 · 90%', fontSize: 12 },
  ],
})

// 进阶：只拿嵌入程序，交给自己的 PDF 引擎
const program = await SheetXFonts.createPdfFont('Source Han Sans CN', fullText)
// program.fontFile / baseFont / widths / toUnicode / encodeHex / measure
```

校验建议：

1. **结构**：PDF 内应含 `/Subtype /CIDFontType2`、`/FontFile2`、`/ToUnicode`；
2. **内容**：把 `FontFile2` 流抽出来重新解析，确认是合法 TTF 子集且含用到的字形（本包单测即这么做）；
3. **渲染**：`sips -s format png out.pdf --out out.png` 或 `qlmanage -t`，在未安装该字体的机器上看是否有豆腐块。

## 已知限制

| 项 | 说明 |
| --- | --- |
| 内置字体覆盖 | 提供的思源子集仅含约 3579 个字，**缺空格、¥、·、—、°、±、×、÷ 等符号**。已在 PDF 导出中加入多字体回退（自动切 Inter），但建议用完整字体重新子集化 |
| 丢弃的表 | 子集化会丢弃 `GSUB/GPOS/GDEF/kern` 等排版表（PDF 用 Identity-H 不做复杂排版），因此不支持连字/字距调整 |
| 不支持 | CFF 轮廓（OTF）、可变字体、彩色字形（COLR/SVG） |
| 子集体积 | 实测 4 行中文报表 → 双字体 PDF 约 20KB（未子集化约 716KB） |

## 字体许可

内置字体均为 **SIL Open Font License 1.1**，允许嵌入与再分发（含 PDF 子集嵌入）。自定义字体请自行确认 `OS/2.fsType` 许可位。

## 测试

```bash
npx vitest run packages/fonts/test/fonts.test.ts

# 产出实物 PDF 供人工检查
SHEETX_EMIT_DEMO=/tmp/sheetx-font-demo.pdf npx vitest run packages/fonts/test/fonts.test.ts
```
