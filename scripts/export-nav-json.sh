#!/usr/bin/env bash
set -euo pipefail

OUTPUT="$HOME/FreelanceSnail.github.io/lab/nav-data.json"

echo "Exporting NAV data to $OUTPUT ..."
sc-navmgr --identity user nav export-json --output "$OUTPUT"
echo "Done."
