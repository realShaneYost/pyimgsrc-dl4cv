#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# start-viz.sh — Launch the DL4CV Visualization Viewer
# Run from repo root:  ./start-viz.sh
# ─────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIZ_DIR="${SCRIPT_DIR}/viz-viewer"

# Verify node is available
if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found. Install with: brew install node"
  exit 1
fi

# Install deps on first run (or after package.json changes)
if [ ! -d "${VIZ_DIR}/node_modules" ]; then
  echo "Installing viz-viewer dependencies..."
  (cd "${VIZ_DIR}" && npm install)
  echo ""
fi

echo "Starting DL4CV Visualization Viewer..."
echo "Scanning for **/viz/*.jsx files in repo..."
echo ""

cd "${VIZ_DIR}"
exec npm run dev
