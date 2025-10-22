#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found. Install Node.js and npm first." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

cleanup() {
  echo
  echo "Stopping services..."
  if [[ -n "${API_PID:-}" ]] && ps -p "${API_PID}" >/dev/null 2>&1; then
    kill "${API_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT
trap 'exit 130' INT

echo "Starting API server..."
npm run server &
API_PID=$!

echo "Starting Vite dev server..."
npm run dev
