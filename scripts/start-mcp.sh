#!/usr/bin/env bash
set -euo pipefail

# Find (or accept) a port for supergateway, prefer 8000..8015
find_free_port() {
  for p in $(seq 8000 8015); do
    if ! lsof -i :"$p" >/dev/null 2>&1; then
      echo "$p"
      return 0
    fi
  done
  echo "No free port in 8000-8015" >&2
  exit 1
}

PORT="${1:-}"
if [ -z "${PORT}" ]; then
  PORT="$(find_free_port)"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Starting MCP Files for: $ROOT"
echo "Using PORT=$PORT"
echo "$PORT" > "$ROOT/.connector_port"

exec npx -y supergateway \
  --stdio "npx -y @modelcontextprotocol/server-filesystem \"$ROOT\"" \
  --port "$PORT" --baseUrl "http://localhost:${PORT}" \
  --ssePath /sse --messagePath /message
