#!/usr/bin/env zsh
set -e

APP_DIR="${0:A:h}"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

cd "$FRONTEND_DIR"
npm run build

cd "$BACKEND_DIR"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi

echo ""
echo "Catalyst app is starting."
if [ -n "$LAN_IP" ]; then
  echo "Open this from any desktop on the same Wi-Fi/network:"
  echo "http://$LAN_IP:8000/"
else
  echo "Open this from another desktop using this computer's LAN IP on port 8000."
fi
echo ""

exec ./.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
