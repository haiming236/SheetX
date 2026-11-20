/**
 * SheetX 统一发布构建（零新增依赖：Vite 8 + TypeScript 7）
 *
 * 产物：
 *   packages/<pkg>/dist/index.js    ESM
 *   packages/<pkg>/dist/index.d.ts  类型声明
 *   packages/web-component/dist/sheetx.iife.js  CDN 单脚本（加载即挂全局 SheetX + 注册元素）
 *
 * 依赖顺序按 package.json 的 workspace:* 依赖做拓扑排序，
 * 保证 core 先于 grid、grid 先于 web-component。
 */
import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PKGS = resolve(ROOT, 'packages')

function readPkg(dir) {
  return JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'))
}

/** 拓扑排序：被依赖的包先构建 */
function topoSort(dirs) {
  const byName = new Map(dirs.map((dir) => [readPkg(dir).name, dir]))
  const visited = new Set()
  const order = []
  const visit = (dir) => {
    if (visited.has(dir)) return
    visited.add(dir)
    const pkg = readPkg(dir)
    const deps = { ...(pkg.dependencies || {}), ...(pkg.peerDependencies || {}) }
    for (const depName of Object.keys(deps)) {
      const depDir = byName.get(depName)
      if (depDir && depDir !== dir) visit(depDir)
    }
    order.push(dir)
  }
  dirs.forEach(visit)
  return order
}

const allDirs = readdirSync(PKGS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => resolve(PKGS, entry.name))
  .filter((dir) => existsSync(resolve(dir, 'package.json')))

const ordered = topoSort(allDirs)
const only = process.argv[2] // 可选：只构建某个包名

for (const dir of ordered) {
  const pkg = readPkg(dir)
  if (only && pkg.name !== only) continue
  const name = pkg.name
  const isWebComponent = name === '@sheetx/web-component'
  process.stdout.write(`[build] ${name}\n`)

  const common = (extra) => ({
    root: dir,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2022',
      minify: false,
      sourcemap: true,
      ...extra,
      rollupOptions: {
        external: (id) => {
          // IIFE 需要把依赖打进去（CDN 单脚本），其余包外部化
          if (extra.lib?.formats?.includes('iife')) return false
          if (id === 'lit' || id.startsWith('lit/')) return true
          if (id.startsWith('@sheetx/')) return true
          if (id === 'node:fs' || id === 'node:url' || id === 'node:path') return true
          return false
        },
      },
    },
  })

  if (isWebComponent) {
    await build(common({ lib: { entry: resolve(dir, 'src/index.ts'), formats: ['es'], fileName: () => 'index.js' } }))
    // CDN IIFE 用 esbuild：Vite/Rolldown 的输出在 WebKit 下会因模板嵌套等语法解析失败，
    // esbuild 降到 ES2020 后各浏览器一致可用（已实测 Safari/WebKit）。
    const esbuildBin = resolve(ROOT, 'node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild')
    execFileSync(esbuildBin, [
      resolve(dir, 'src/cdn.ts'),
      '--bundle',
      '--format=iife',
      '--global-name=SheetXBundle',
      '--target=es2020',
      '--outfile=' + resolve(dir, 'dist/sheetx.iife.js'),
    ], { cwd: ROOT, stdio: 'pipe' })
  } else {
    await build(common({
      lib: { entry: resolve(dir, 'src/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    }))
  }

  // 类型声明：tsc --emitDeclarationOnly（复用各包 tsconfig，不新增依赖）
  const tsconfig = resolve(dir, 'tsconfig.json')
  if (existsSync(tsconfig)) {
    try {
      execFileSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        ['exec', 'tsc', '-p', tsconfig, '--emitDeclarationOnly', '--declaration', '--noEmit', 'false', '--rootDir', resolve(dir, 'src'), '--outDir', resolve(dir, 'dist')],
        { cwd: ROOT, stdio: 'pipe' },
      )
    } catch (error) {
      // 声明生成失败不静默吞掉：打印摘要帮助定位
      const err = error
      const out = (err.stdout || '') + (err.stderr || '')
      process.stdout.write(`[dts] ${name} 声明生成失败：\n${String(out).slice(-1200)}\n`)
    }
  }
}

// package.json 写入 publishConfig（发布时用 dist 入口，开发时仍走 src）
for (const dir of allDirs) {
  const pkg = readPkg(dir)
  if (!pkg.name?.startsWith('@sheetx/')) continue
  pkg.publishConfig = {
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': { types: './dist/index.d.ts', default: './dist/index.js' },
      ...(pkg.name === '@sheetx/web-component' ? { './cdn': './dist/sheetx.iife.js' } : {}),
    },
  }
  writeFileSync(resolve(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
}

process.stdout.write('[build] 所有发布包构建完成\n')
