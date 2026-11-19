#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${CODESPACES:-}" != true ]]; then echo 'This launcher is for a private GitHub Codespace.' >&2; exit 2; fi
if ! docker info >/dev/null 2>&1; then
  echo 'Docker is not ready. Rebuild the dev container using Codespaces: Rebuild Container.' >&2
  exit 2
fi
echo 'Keep ports 8787 and 5080 private. Only run trusted code.'
npm ci
npm run build
npm run assets
docker build -f runner/Dockerfile -t pbo2-lab:net10 .
exec node scripts/playground-server.mjs --private-codespace
