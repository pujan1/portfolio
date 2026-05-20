# Tools

Authoring pipeline for the 3D assets the site loads at runtime. None of
this runs at deploy time — outputs are checked into `assets/models/`.

## Structure

```
tools/
├── blender/                # Blender scripts + .blend workspaces
│   ├── vegetation_workspace.blend
│   ├── build_landscape.py  # Generates the diorama from scratch
│   ├── rebuild.sh          # build_landscape.py → compress → assets/models/landscape.glb
│   ├── export_vegetation.{sh,py}   # vegetation_workspace.blend → assets/models/vegetation.glb
│   ├── compress_vegetation.sh      # @gltf-transform optimize
│   ├── snap_selected_to_terrain.py # Drops selected meshes onto landscape geometry
│   ├── setup_vegetation_workspace.py
│   ├── open_vegetation_workspace.sh
│   └── build/              # gitignored — raw .glb outputs before compression
└── prompts/                # Hunyuan3D image-to-3D prompts for POI landmarks
```

## Pipelines

### Landscape

```bash
bash tools/blender/rebuild.sh
```

Runs `build_landscape.py` headless, writes `tools/blender/build/landscape.glb`,
compresses it to `assets/models/landscape.glb`. Hard-reload the browser
afterwards (Cmd+Shift+R) to bust the cache.

### Vegetation

Vegetation is placed manually in `vegetation_workspace.blend`:

```bash
# One-time: build the workspace and open it
bash tools/blender/open_vegetation_workspace.sh

# Then place grass/trees in the "Vegetation" collection and export
bash tools/blender/export_vegetation.sh
```

### POI landmarks (cabin, camera, guitar, etc.)

Generated outside Blender via Hunyuan3D. See [prompts/README.md](prompts/README.md)
for the prompt list and the per-asset Nano Banana inputs. Compress the
resulting `.glb` with the same `@gltf-transform optimize` flags the
Blender pipeline uses, then drop into `assets/models/`.

## Requirements

- Blender 4.x at `/Applications/Blender.app/Contents/MacOS/Blender`
- Node.js (for `npx @gltf-transform/cli`)
