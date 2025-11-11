#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_COMPONENTS=("backend" "agent")

usage() {
  cat <<EOF
Usage: $(basename "$0") [component...]

Create Python virtual environments (".venv") for one or more components and
install the pinned dependencies from each component's requirements.txt file.

Examples
  $(basename "$0")           # setup backend/.venv and agent/.venv
  $(basename "$0") backend   # only setup backend/.venv

Environment variables
  PYTHON     Override the python interpreter (default: python3)
EOF
}

log() {
  printf '[setup_envs] %s\n' "$*" >&2
}

setup_component() {
  local component="$1"
  local dir="$ROOT_DIR/$component"
  local requirements="$dir/requirements.txt"
  local venv_path="$dir/.venv"
  local python_bin="${PYTHON:-python3}"

  if [[ ! -d "$dir" ]]; then
    log "skip: $component (directory not found: $dir)"
    return
  fi

  if ! command -v "$python_bin" >/dev/null 2>&1; then
    log "error: python interpreter '$python_bin' not found"
    exit 1
  fi

  if [[ ! -d "$venv_path" ]]; then
    log "creating virtualenv for $component"
    "$python_bin" -m venv "$venv_path"
  else
    log "virtualenv exists for $component — reusing"
  fi

  # shellcheck source=/dev/null
  source "$venv_path/bin/activate"
  log "pip upgrade in $component"
  pip install --upgrade pip wheel >/dev/null

  if [[ -f "$requirements" ]]; then
    log "installing requirements for $component"
    pip install -r "$requirements"
  else
    log "warning: requirements file not found for $component ($requirements)"
  fi

  deactivate
  log "completed setup for $component"
}

main() {
  local components=()

  if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
    usage
    exit 0
  fi

  if [[ $# -eq 0 ]]; then
    components=("${DEFAULT_COMPONENTS[@]}")
  else
    components=("$@")
  fi

  for component in "${components[@]}"; do
    setup_component "$component"
  done

  log "all done"
}

main "$@"
