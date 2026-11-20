#!/usr/bin/env bash
# SheetX 浏览器级交互验收：构建产物 → 临时静态服务 → playwright-cli 驱动 runAll() → 写 report.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PORT="${PORT:-5401}"
BROWSER="${BROWSER:-webkit}"

cd "$ROOT"
pnpm --filter @sheetx/e2e build >/dev/null

cd "$ROOT/apps/e2e/dist"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

cd "$ROOT"
playwright-cli close-all >/dev/null 2>&1 || true
playwright-cli open --browser="$BROWSER" >/dev/null
playwright-cli resize 1280 800 >/dev/null
playwright-cli goto "http://127.0.0.1:$PORT/" >/dev/null

RESULT="$(playwright-cli run-code "async page => { await page.waitForFunction(() => !!window.__e2e?.ready); return await page.evaluate(async () => await window.__e2e.runAll()); }" | sed -n 's/^### Result //p' | head -n 1)"
playwright-cli close-all >/dev/null 2>&1 || true

printf '%s\n' "$RESULT" > "$ROOT/apps/e2e/report.json"
echo "$RESULT"
