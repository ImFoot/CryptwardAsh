# 0.3.3 rollback verification

Verified locally on September 6, 2026 (Pacific time).

PR #12 is reverted because its art overhaul added unwanted visual clutter. Character models, props, lighting, materials, and art notes match the pre-overhaul commit `c3a678d`. The added environment module and its dedicated test are removed. The earlier compact HUD and click controls remain intact.

- All 16 automated tests passed, including animation invariants and the 10,000-seed progression suite.
- TypeScript, production build, and GitHub Pages subpath build passed.
- All 93 browser integration checks and additional real mouse/keyboard checks passed. The restored desktop gameplay view was visually checked; no browser errors were reported.
- Version 0.3.3 is synchronized in package.json, package-lock.json, and the settings display.

## Previous release: 0.3.1 build verification

Verified locally on September 6, 2026 (Pacific time).

- TypeScript, production build, and GitHub Pages subpath build: passed.
- All 16 automated tests and all 93 development browser integration checks passed.
- Headless Microsoft Edge checks confirmed the smaller score updates, bars and ability cooldowns update, room changes do not announce names, objectives appear on pause, and the full map opens and closes. No browser errors were reported.
- Gameplay layouts were visually reviewed at 1280 × 720 and 390 × 844, plus the mobile pause screen. Physical touch/gamepad acceptance was not repeated.

Gameplay no longer shows the objective panel, furnace count, chapter/location text, timer, control legend, ability names, minimap heading, or exploration percentage. Room-entry and routine health/Ember pickup announcements are removed. Objectives, furnace progress, and elapsed time are available while paused; control help remains in settings. Essential meters, inventory, minimap, ability icons/keys, boss status, and contextual interaction/progression messages remain visible when needed.

## Previous release: 0.3.0 build verification

Verified locally on September 5, 2026 (Pacific time).

- TypeScript, production build, and GitHub Pages subpath build: passed.
- All 16 automated tests passed, including six new navigation checks for precise destinations, routing around walls, closed/open crossings, diagonal corner blocking, invalid/out-of-map clicks, and collision sweeps. The existing 10,000-seed progression suite also passed.
- All 93 development browser integration checks passed. Added coverage includes exact click arrival, keyboard override, clearing destinations on pause/map/death/title/restart, cursor-directed Shift dash, fixed dash direction during combat, automatic melee on all sides, wall occlusion, and click projection at all eight camera orientations.
- Additional Playwright checks in headless Microsoft Edge used real mouse and keyboard input: click-and-release arrival, hold-to-steer, Shift dash, right-click Burst, simultaneous held movement and Burst, and pause during a held click. No browser errors were reported.
- Desktop gameplay and settings screenshots were visually reviewed at 1280 × 720, including the destination ring and updated control instructions.

Left-click moves; nearby enemies are still attacked automatically without clicking or aiming. Routes respect the existing collision rules and progression locks. Shift cancels the current route and dashes toward the cursor. Keyboard, touch, and gamepad alternatives remain available; physical touch/gamepad acceptance was not repeated in this pass.

## Previous release: 0.2.0 engine verification

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
