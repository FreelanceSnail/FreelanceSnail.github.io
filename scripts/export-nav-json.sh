#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$REPO_ROOT/lab/nav-data.json"

echo "Exporting NAV data to $OUTPUT ..."
sc-navmgr --identity user nav export-json --output "$OUTPUT"
echo "Done."
