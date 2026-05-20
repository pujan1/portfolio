#!/bin/bash
# Compress manually authored vegetation.glb for the drone scene.
# Usage from this folder:  ./compress_vegetation.sh
# Usage from repo root:    bash tools/blender/compress_vegetation.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RAW_GLB="$SCRIPT_DIR/build/vegetation.glb"
COMPRESSED_GLB="$REPO_ROOT/assets/models/vegetation.glb"

if [ ! -f "$RAW_GLB" ]; then
    echo "Missing $RAW_GLB"
    echo "Export selected Vegetation objects from Blender to this file first."
    echo "Run: bash $SCRIPT_DIR/export_vegetation.sh"
    exit 1
fi

mkdir -p "$REPO_ROOT/assets/models"

echo "Compressing vegetation..."
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
