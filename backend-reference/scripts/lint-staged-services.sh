#!/usr/bin/env bash
# lint-staged-services.sh
# Runs each microservice's own ESLint, but ONLY on the JS files staged for this
# commit — never the whole service. This keeps pre-commit fast: a one-file change
# lints one file, not thousands. Each service's own .eslintrc / .eslintignore and
# local eslint binary are used (config is auto-discovered from the file's folder).
#
# Exit 1 (blocking the commit) if ESLint reports problems in any staged file.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Staged, still-present JS files (Added/Copied/Modified/Renamed; skip Deleted —
# you can't lint a file that no longer exists).
STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACMR -- '*.js' '*.cjs' '*.mjs' || true)"

if [ -z "$STAGED_FILES" ]; then
  echo "No staged JS files to lint."
  exit 0
fi

# Unique top-level directories touched (the first path segment = service name).
SERVICES="$(printf '%s\n' "$STAGED_FILES" | sed 's#/.*##' | sort -u)"

FAILED=0
LINTED_ANY=0

for service in $SERVICES; do
  ESLINT_BIN="$ROOT_DIR/$service/node_modules/.bin/eslint"
  # Skip anything that isn't a service with its own ESLint (root files, shared
  # dirs, services without a local eslint install).
  if [ ! -x "$ESLINT_BIN" ]; then
    continue
  fi

  # This service's staged files, made relative to the service directory so
  # ESLint resolves the right .eslintrc and honours the service's .eslintignore.
  REL_FILES="$(printf '%s\n' "$STAGED_FILES" | grep "^${service}/" | sed "s#^${service}/##")"
  [ -z "$REL_FILES" ] && continue

  COUNT="$(printf '%s\n' "$REL_FILES" | grep -c .)"
  echo "› Linting ${COUNT} changed file(s) in '${service}'…"
  LINTED_ANY=1

  if ! ( cd "$ROOT_DIR/$service" && printf '%s\n' "$REL_FILES" | xargs ./node_modules/.bin/eslint ); then
    FAILED=1
  fi
done

if [ "$LINTED_ANY" -eq 0 ]; then
  echo "No staged JS files belong to a lintable service. Skipping lint."
  exit 0
fi

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "ESLint found problems in staged files. Fix them (or run 'npm run lint:fix' in the service) before committing."
  exit 1
fi

echo "ESLint passed on all staged service files."
exit 0
