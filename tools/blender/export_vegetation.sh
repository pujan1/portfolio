#!/bin/bash
# Export the Vegetation collection from vegetation_workspace.blend, then compress it.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
WORKSPACE_BLEND="$SCRIPT_DIR/vegetation_workspace.blend"

if [ ! -x "$BLENDER" ]; then
    echo "Blender not found at $BLENDER"
    exit 1
fi

if [ ! -f "$WORKSPACE_BLEND" ]; then
    echo "Missing $WORKSPACE_BLEND"
    echo "Run: bash $SCRIPT_DIR/open_vegetation_workspace.sh"
    exit 1
fi

"$BLENDER" --background "$WORKSPACE_BLEND" --python "$SCRIPT_DIR/export_vegetation.py"
bash "$SCRIPT_DIR/compress_vegetation.sh"
