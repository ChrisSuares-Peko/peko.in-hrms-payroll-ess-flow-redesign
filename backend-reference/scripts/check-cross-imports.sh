#!/usr/bin/env bash
# check-cross-imports.sh
# Detects any cross-service require() statements between microservices.
# Fails with exit code 1 if any cross-imports are found.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE_DIRS="users purchase payment paymentGateway travel others kyc officeAndBusiness scheduler"
FOUND_VIOLATIONS=0

for service in $SERVICE_DIRS; do
  SERVICE_PATH="$ROOT_DIR/$service"
  if [ ! -d "$SERVICE_PATH" ]; then
    continue
  fi

  for other in $SERVICE_DIRS; do
    if [ "$service" = "$other" ]; then
      continue
    fi

    # Search for require statements that traverse up into a sibling service folder
    matches=$(rg -l "require\s*\(\s*['\"](\.\./)+${other}/" "$SERVICE_PATH/" \
      --glob '!node_modules/**' \
      --glob '!__tests__/**' \
      --glob '!tests/**' \
      --glob '!*.test.js' \
      --glob '!*.spec.js' \
      2>/dev/null || true)

    if [ -n "$matches" ]; then
      echo "ERROR: Cross-service import detected: $service -> $other"
      echo "$matches" | while IFS= read -r file; do
        rg "require\s*\(\s*['\"](\.\./)+${other}/" "$file" --no-heading 2>/dev/null || true
      done
      echo ""
      FOUND_VIOLATIONS=1
    fi
  done
done

if [ "$FOUND_VIOLATIONS" -eq 1 ]; then
  echo "---"
  echo "Cross-service imports break microservice isolation."
  echo "Each service must only import from its own directory or from @peko/shared."
  echo ""
  echo "To fix: move shared code to the shared/ package and import via @peko/shared/..."
  exit 1
fi

echo "No cross-service imports found. All services are properly isolated."
exit 0
