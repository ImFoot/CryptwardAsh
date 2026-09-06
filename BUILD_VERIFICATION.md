# PC build verification

## Cathedral graphics pass · 0.1.5

Verified September 5, 2026:

- TypeScript, local production build, and GitHub Pages build passed.
- All 8 automated tests passed, including progression validation across 10,000 generated floors.
- All 57 browser integration checks passed, including new texture loading, all four architecture frames, atmosphere cleanup across restarts, campaign completion, and three Expedition seeds.
- Browser error/warning logs were empty after the final integration run.
- Visually inspected the Vestibule, Gallery, Warden arena, and seeded Expedition. Checked compact layouts at 640 × 780 and 390 × 844; corrected narrow HUD overlap.
- A local authored floor rebuild measured 514 ms. This is a single timing observation, not an FPS benchmark.
- New runtime artwork totals 1.41 MiB. Original PNG masters and exact generation prompts are retained; see ART_NOTES.md.

The floor canvas is reused across restarts. CPU-backed material canvases avoid repeated GPU readbacks while baking the isometric map. Integration checks yield a frame between restarts so the browser can present and release rendering work.

For visual review in development, append `?art-review` to the local URL. It adds room-tour controls and suppresses save writes. The tour and integration helpers are excluded from production builds.

## Prior build verification

Verified locally on September 5, 2026.

- TypeScript type check: passed.
- Production build: passed; Phaser separated from the game bundle.
- Eight automated data/generation tests: passed.
- 10,000 generated floors: validated for connectivity and progression; generation p95 approximately 1.40 ms on this laptop.
- Browser scene checks: campaign objectives, brass-key consumption, gate restrictions, lever requirement, boss/portal conditions, checkpoint persistence, pause behavior, 128 px/s movement, melee combat, wall collision, and the 24-enemy cap passed.
- Three Expedition seeds exercised through actual scene interaction methods: 4701, -987, 731942.
- Browser error log during scene checks: no errors or warnings.
- Packaged local server: HTTP 200; launcher detects and reuses it.

These are automated mechanics checks and visual inspections, not a completed long-form human balance playtest. Mobile gesture acceptance and a sustained FPS benchmark remain outside this PC-first pass.

Original assets are retained. The authored loader corrects a source zone overlap that otherwise puts the Barracks shard inside the boss restriction. Floor rendering is deliberately brighter than wall rendering; gameplay has no full-screen darkness mask.

For feature scope and controls, see PLAY_GUIDE.md. Cover artwork provenance and the generation prompt are in ART_NOTES.md.
