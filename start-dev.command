#!/bin/bash
set -e

# Start the Bewerbungsmanager local development environment.
# Save this file in the project root, next to package.json and docker-compose.yml.

cd "$(dirname "$0")"

if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ] && [ ! -f "compose.yml" ] && [ ! -f "compose.yaml" ]; then
  echo "ERROR: Put start-dev.command in the project root (next to package.json and the Docker Compose file)."
  read -r -p "Press Enter to close..."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or not available in PATH."
  read -r -p "Press Enter to close..."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not available in PATH. Install/enable it with Corepack first."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "== Starting local PostgreSQL =="
docker compose up -d postgres

echo
echo "== Starting frontend and backend in development mode =="
echo "Keep this Terminal window open while developing."
echo "Stop the frontend/backend with Ctrl+C. PostgreSQL is left running."
echo

pnpm dev
status=$?

echo
echo "Development processes exited with status: $status"
read -r -p "Press Enter to close..."
exit "$status"
