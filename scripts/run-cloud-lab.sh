#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
chapter="${1:-8}"
case "$chapter" in
  1|2|3|4|5|6|7) printf -v id '%02d' "$chapter"; exec dotnet run --project "praktikum/bab-$id/PraktikumBab$id.csproj" ;;
  8|9|10|11) printf -v id '%02d' "$chapter"; port=$((5000+chapter)); echo "Open forwarded port $port in Codespaces (keep it private)."; if [ "$chapter" = 11 ]; then echo "GET /api/barangapi"; fi; exec dotnet run --project "praktikum/bab-$id/PraktikumBab$id.csproj" --no-launch-profile --urls "http://0.0.0.0:$port" ;;
  *) echo "Usage: bash scripts/run-cloud-lab.sh 1..11" >&2; exit 2 ;;
esac
