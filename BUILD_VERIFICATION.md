# 0.2.0 build verification

Verified locally on September 5, 2026 (Pacific time).

- TypeScript: passed.
- Production build and GitHub Pages subpath build: passed. Three.js replaces Phaser; the engine chunk is approximately 135 kB gzip and the game/addons chunk approximately 36 kB gzip.
- Ten automated tests passed: eight dungeon/generation tests, including 10,000 seeds, plus two checks that walking and death animations behave identically at 30 and 120 frames per second.
- Generator p95: 2.91 ms in this run.
- 72 browser integration checks passed: authored campaign, inventory and gates, gallery cage, checkpoint recovery, boss/portal completion, pause, movement, melee, XP, minimap, population cap, three Expedition seeds, all eight camera orientations, perspective ground picking, and GPU geometry cleanup across four repeated restarts.
- Live visual review covered the entrance, Rat Run combat, and Warden chamber. Title and gameplay layouts were also inspected at 390 × 844, and a narrow-screen HUD overlap was corrected. A brief 1280 × 720 preview observation showed approximately 51–57 fps; this is not a sustained hardware benchmark or a guarantee for other devices.
- Model pieces are merged per joint/material, stone uses instanced meshes, attack warnings reuse geometry, and transient model/effect geometry is released on removal or restart.
- The renderer requires WebGL 2. Context loss displays a reload path; saved browser settings and best-run data are retained.

The authored campaign and Expedition mechanics are preserved. This pass changes the rendering engine and presentation; it is not a long-form balance playtest. Physical touch/gamepad acceptance and a sustained mobile performance benchmark remain unverified.

Use `/?verify` on the development server for the integration report and `/?art-review` for the room tour and frame statistics. Both are excluded from production and suppress save writes. See PLAY_GUIDE.md for controls and ART_NOTES.md for the generated material prompt.
