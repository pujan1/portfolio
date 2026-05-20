#!/bin/bash
# Export drone.blend, then compress it for the web scene.
# Usage from anywhere: bash demo/drone/blender/export_drone.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
WORKSPACE_BLEND="$SCRIPT_DIR/drone.blend"

if [ ! -x "$BLENDER" ]; then
    echo "Blender not found at $BLENDER"
    exit 1
fi

if [ ! -f "$WORKSPACE_BLEND" ]; then
    echo "Missing $WORKSPACE_BLEND"
    exit 1
fi

"$BLENDER" --background --factory-startup "$WORKSPACE_BLEND" --python "$SCRIPT_DIR/export_drone.py"
bash "$SCRIPT_DIR/compress_drone.sh"
