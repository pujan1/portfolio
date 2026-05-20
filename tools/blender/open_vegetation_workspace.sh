#!/bin/bash
# Build and open the Blender workspace used for manual vegetation placement.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
WORKSPACE_BLEND="$SCRIPT_DIR/vegetation_workspace.blend"

if [ ! -x "$BLENDER" ]; then
    echo "Blender not found at $BLENDER"
    exit 1
fi

"$BLENDER" --background --python "$SCRIPT_DIR/setup_vegetation_workspace.py"
open "$WORKSPACE_BLEND"
