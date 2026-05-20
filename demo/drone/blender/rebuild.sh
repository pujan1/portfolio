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
RAW_GLB="$DRONE_DIR/assets/blender/landscape.glb"
COMPRESSED_GLB="$DRONE_DIR/assets/compressed/landscape.glb"
BUILD_LOG="$DRONE_DIR/assets/blender/build_landscape.log"

# Remove stale outputs first so a Blender crash cannot look like a successful rebuild.
rm -f "$RAW_GLB" "$COMPRESSED_GLB"

set +e
"$BLENDER" --background --python "$SCRIPT_DIR/build_landscape.py" > "$BUILD_LOG" 2>&1
BLENDER_STATUS=$?
set -e

grep -E "✅|❌|Error|error|Traceback|Writing: .*blender.crash.txt" "$BUILD_LOG" || true

if [ "$BLENDER_STATUS" -ne 0 ]; then
    echo "❌ Blender exited with status $BLENDER_STATUS. Recent log:"
    tail -60 "$BUILD_LOG"
    exit "$BLENDER_STATUS"
fi

if [ ! -f "$RAW_GLB" ]; then
    echo "❌ Blender did not produce landscape.glb — check the script for errors above."
    tail -60 "$BUILD_LOG"
    exit 1
fi

RAW_SIZE=$(du -h "$RAW_GLB" | cut -f1)
echo "📦 Raw landscape: $RAW_SIZE"

echo "🗜  Compressing…"
cd "$DRONE_DIR/assets"
npx --yes @gltf-transform/cli optimize \
    "$RAW_GLB" \
    "$COMPRESSED_GLB" \
    --simplify-error 0.003 \
    --palette false --join false --instance false 2>&1 \
    | tail -1

COMPRESSED_SIZE=$(du -h "$COMPRESSED_GLB" | cut -f1)
echo "✅ Done.  Compressed: $COMPRESSED_SIZE"
echo "🌐 Reload http://localhost:8080/demo/drone/ with Cmd+Shift+R"
