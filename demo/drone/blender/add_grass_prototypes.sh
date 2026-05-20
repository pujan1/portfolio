#!/bin/bash
# Add reusable low-poly grass clump prototypes to the vegetation workspace.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
WORKSPACE_BLEND="$SCRIPT_DIR/vegetation_workspace.blend"

if [ ! -x "$BLENDER" ]; then
    echo "Blender not found at $BLENDER"
    exit 1
fi

if [ ! -f "$WORKSPACE_BLEND" ]; then
    "$BLENDER" --background --python "$SCRIPT_DIR/setup_vegetation_workspace.py"
fi

"$BLENDER" --background "$WORKSPACE_BLEND" --python "$SCRIPT_DIR/add_grass_prototypes.py"
open "$WORKSPACE_BLEND"
