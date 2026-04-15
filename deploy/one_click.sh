#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-local}"
PORT="${PORT:-4321}"
HOST="${HOST:-0.0.0.0}"

usage() {
  cat <<'EOF'
Usage:
  ./deploy/one_click.sh
  ./deploy/one_click.sh local [port]
  ./deploy/one_click.sh dev [port]
  ./deploy/one_click.sh remote <user@server> <remote_base_path> [reload_command]

Examples:
  ./deploy/one_click.sh
  ./deploy/one_click.sh local 4321
  ./deploy/one_click.sh dev 4321
  ./deploy/one_click.sh remote root@example.com /var/www/astro-personal "sudo systemctl reload nginx"

Environment:
  PORT=4321
  HOST=0.0.0.0
  SKIP_INSTALL=1
EOF
}

install_deps_if_needed() {
  if [ "${SKIP_INSTALL:-0}" = "1" ]; then
    echo "Skipping dependency install because SKIP_INSTALL=1."
    return
  fi

  if [ -d "node_modules" ]; then
    echo "Dependencies already installed."
    return
  fi

  if [ -f "package-lock.json" ]; then
    echo "Installing dependencies with npm ci..."
    npm ci
  else
    echo "Installing dependencies with npm install..."
    npm install
  fi
}

build_site() {
  echo "Building site..."
  npm run build
}

run_preview() {
  local preview_port="${1:-$PORT}"
  echo "Starting static preview at http://localhost:${preview_port}"
  npm run preview -- --host "$HOST" --port "$preview_port"
}

run_dev() {
  local dev_port="${1:-$PORT}"
  echo "Starting dev server at http://localhost:${dev_port}"
  npm run dev -- --host "$HOST" --port "$dev_port"
}

deploy_remote() {
  local target="${1:-}"
  local remote_base="${2:-}"
  local reload_command="${3:-}"

  if [ -z "$target" ] || [ -z "$remote_base" ]; then
    usage
    exit 1
  fi

  local release
  release="$(date +%Y%m%d%H%M%S)"

  build_site

  echo "Creating remote release directory..."
  ssh "$target" "mkdir -p '$remote_base/releases/$release'"

  echo "Uploading dist/ to $target:$remote_base/releases/$release/"
  rsync -avz --delete dist/ "$target:$remote_base/releases/$release/"

  echo "Activating release..."
  ssh "$target" "ln -sfn '$remote_base/releases/$release' '$remote_base/current'"

  if [ -n "$reload_command" ]; then
    echo "Running remote reload command..."
    ssh "$target" "$reload_command"
  fi

  echo "Deploy done: $release"
  echo "Active path: $remote_base/current"
}

case "$MODE" in
  local)
    install_deps_if_needed
    build_site
    run_preview "${2:-$PORT}"
    ;;
  dev)
    install_deps_if_needed
    run_dev "${2:-$PORT}"
    ;;
  remote)
    install_deps_if_needed
    deploy_remote "${2:-}" "${3:-}" "${4:-}"
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown mode: $MODE"
    usage
    exit 1
    ;;
esac
