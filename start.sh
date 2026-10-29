#!/usr/bin/env bash
# 屈佳佳专用摸摸器 —— 启动 / 查看当前链接
# 用法： bash start.sh      （重复执行只会告诉你当前链接，不会重复起进程）
set -uo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8787}"
LOG="/tmp/pet-tunnel.log"

# ---------- 1. 本地服务 ----------
if pgrep -f "http.server $PORT" >/dev/null 2>&1; then
  echo "✓ 本地服务已在运行"
else
  nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >/tmp/pet-server.log 2>&1 &
  sleep 1.2
  echo "✓ 本地服务已启动"
fi

# ---------- 2. 公网隧道 ----------
URL=""
if pgrep -f "cloudflared tunnel" >/dev/null 2>&1; then
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" 2>/dev/null | tail -1)
  echo "✓ 隧道已在运行"
else
  rm -f "$LOG"
  nohup ./bin/cloudflared tunnel --url "http://127.0.0.1:$PORT" --no-autoupdate --protocol http2 >"$LOG" 2>&1 &
  echo "… 正在申请新链接（约 5~10 秒）"
  for _ in $(seq 1 30); do
    sleep 1
    URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1)
    [ -n "$URL" ] && break
  done
fi

echo
if [ -n "$URL" ]; then
  printf '%s' "$URL" | pbcopy 2>/dev/null && echo "（已复制到剪贴板）"
  echo "  发给朋友：  $URL"
else
  echo "  隧道还没起来，看看日志： $LOG"
fi
echo "  你本机：    http://127.0.0.1:$PORT"
for IF in en0 en1; do
  IP=$(ipconfig getifaddr "$IF" 2>/dev/null || true)
  [ -n "$IP" ] && echo "  同一 WiFi： http://$IP:$PORT"
done
echo
echo "关掉本窗口不影响运行；关机/重启后请再执行一次 bash start.sh（链接会变）。"
