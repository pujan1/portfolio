#!/bin/bash
# Compress the manually authored drone.glb for the drone scene.
# Usage from anywhere: bash demo/drone/blender/compress_drone.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRONE_DIR="$(dirname "$SCRIPT_DIR")"

RAW_GLB="$DRONE_DIR/assets/blender/drone.glb"
COMPRESSED_GLB="$DRONE_DIR/assets/compressed/drone.glb"

if [ ! -f "$RAW_GLB" ]; then
    echo "Missing $RAW_GLB"
    echo "Run: bash demo/drone/blender/export_drone.sh"
    exit 1
fi

mkdir -p "$DRONE_DIR/assets/compressed"

echo "Compressing drone..."
cd "$DRONE_DIR/assets"
npx --yes @gltf-transform/cli optimize \
    "$RAW_GLB" \
    "$COMPRESSED_GLB" \
    --simplify false \
    --palette false \
    --join false \
    --instance false

RAW_SIZE=$(du -h "$RAW_GLB" | cut -f1)
COMPRESSED_SIZE=$(du -h "$COMPRESSED_GLB" | cut -f1)
echo "Done. Raw: $RAW_SIZE  Compressed: $COMPRESSED_SIZE"
