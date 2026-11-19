#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pids=()
cleanup(){ for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; wait || true; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
for chapter in 8 9 10 11; do
  printf -v id '%02d' "$chapter"
  dotnet build "praktikum/bab-$id/PraktikumBab$id.csproj"
done
for chapter in 8 9 10 11; do
  printf -v id '%02d' "$chapter"
  port=$((5000+chapter))
  dotnet run --project "praktikum/bab-$id/PraktikumBab$id.csproj" --no-build --no-launch-profile --urls "http://0.0.0.0:$port" &
  pids+=("$!")
  echo "Bab $chapter: port $port (private)"
done
echo "Open ports 5008–5011. Ctrl+C stops all servers."
wait -n
