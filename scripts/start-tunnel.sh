#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-}"

if [ -z "${PORT}" ]; then
  if [ -f "$ROOT/.connector_port" ]; then
    PORT="$(cat "$ROOT/.connector_port")"
  else
    echo "No port known. Run scripts/start-mcp.sh first." >&2
    exit 1
  fi
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Installing cloudflared..."
  brew install cloudflared
fi

echo "Opening public tunnel to http://localhost:${PORT} ..."
# This prints a URL like: https://<random>.trycloudflare.com
cloudflared tunnel --url "http://localhost:${PORT}"
