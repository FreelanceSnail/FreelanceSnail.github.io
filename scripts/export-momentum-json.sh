#!/usr/bin/env bash
set -euo pipefail

OUTPUT="$HOME/FreelanceSnail.github.io/lab/momentum-data.json"
SCRIPT="$HOME/FreelanceSnail.github.io/lab/tools/momentum_rotation.py"

echo "Exporting momentum rotation data to $OUTPUT ..."
python3 "$SCRIPT"
echo "Done."
