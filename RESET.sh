#!/usr/bin/env bash
set -euo pipefail

# Run from anywhere; place this script at the root of the repository.
# Deletes every other file and directory, including ignored/untracked files.
# Preserves Git history. Leaves tracked deletions uncommitted.
# Preview with: bash RESET.sh --dry-run

dry_run=false
case "${1:-}" in
  --dry-run) dry_run=true ;;
  -h|--help)
    printf '%s\n' 'Usage: bash RESET.sh [--dry-run]' \
      'Deletes everything except .git, AGENTS.md, RUN.md, and RESET.sh.' \
      'Includes ignored and untracked files. Leaves deletions uncommitted.'
    exit 0
    ;;
  '') ;;
  *) printf 'Unknown argument: %s\n' "$1" >&2; exit 1 ;;
esac
if (( $# > 1 )); then
  printf '%s\n' 'Expected at most one argument.' >&2
  exit 1
fi

if [[ -L "${BASH_SOURCE[0]}" ]]; then
  printf '%s\n' 'Run the actual RESET.sh file, not a symbolic link.' >&2
  exit 1
fi
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd -- "$project_dir"

if [[ ! -e .git ]]; then
  printf '%s\n' 'Place RESET.sh in the repository root next to .git.' >&2
  exit 1
fi
repo_root="$(git rev-parse --show-toplevel)"
repo_root="$(cd -- "$repo_root" && pwd -P)"
if [[ "$project_dir" != "$repo_root" ]]; then
  printf '%s\n' 'Refusing to reset: script is not at the repository root.' >&2
  exit 1
fi

shopt -s dotglob nullglob
targets=()
for entry in ./*; do
  case "${entry#./}" in
    .git|AGENTS.md|RUN.md|RESET.sh) continue ;;
  esac
  targets+=("$entry")
done

if (( ${#targets[@]} == 0 )); then
  printf '%s\n' 'Nothing to remove.'
  exit 0
fi

printf 'Project: %s\n' "$project_dir"
printf '%s\n' 'Removing these entries and all their contents:'
printf '  %q\n' "${targets[@]}"
if [[ "$dry_run" == true ]]; then
  printf '%s\n' 'Dry run only. No files changed.'
  exit 0
fi

for entry in "${targets[@]}"; do
  rm -rf -- "$entry"
done
printf '%s\n' 'Reset complete. Git history and the three project files are preserved.' \
  'Tracked deletions are uncommitted; the Git index was not changed.'
