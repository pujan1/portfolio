#!/bin/bash
# Rebuild the landscape: Blender script → GLB → compressed GLB.
# Usage from this folder:  ./rebuild.sh
# Usage from anywhere:     bash demo/drone/blender/rebuild.sh
# After running, hard-reload the browser tab (Cmd+Shift+R) to bust the cache.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRONE_DIR="$(dirname "$SCRIPT_DIR")"

BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
if [ ! -x "$BLENDER" ]; then
    echo "❌ Blender not found at $BLENDER"
    exit 1
fi

echo "🔨 Running Blender script…"
"$BLENDER" --background --python "$SCRIPT_DIR/build_landscape.py" 2>&1 \
    | grep -E "✅|❌|Error|error|Traceback" || true

if [ ! -f "$DRONE_DIR/assets/blender/landscape.glb" ]; then
    echo "❌ Blender did not produce landscape.glb — check the script for errors above."
    exit 1
fi

RAW_SIZE=$(du -h "$DRONE_DIR/assets/blender/landscape.glb" | cut -f1)
echo "📦 Raw landscape: $RAW_SIZE"

echo "🗜  Compressing…"
cd "$DRONE_DIR/assets"
npx --yes @gltf-transform/cli optimize \
    blender/landscape.glb \
    compressed/landscape.glb \
    --simplify-error 0.003 \
    --palette false --join false --instance false 2>&1 \
    | tail -1

COMPRESSED_SIZE=$(du -h "compressed/landscape.glb" | cut -f1)
echo "✅ Done.  Compressed: $COMPRESSED_SIZE"
echo "🌐 Reload http://localhost:8080/demo/drone/ with Cmd+Shift+R"
