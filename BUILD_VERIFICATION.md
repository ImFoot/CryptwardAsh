# PC build verification

Verified locally on September 5, 2026.

- TypeScript type check: passed.
- Production build: passed; Phaser separated from the game bundle.
- Seven automated data/generation tests: passed.
- 10,000 generated seeds: validated for connectivity and progression; generation p95 approximately 2.35 ms on this laptop.
- Browser scene checks: campaign objectives, brass-key consumption, gate restrictions, lever requirement, boss/portal conditions, checkpoint persistence, pause behavior, 128 px/s movement, melee combat, wall collision, and the 24-enemy cap passed.
- Three Expedition seeds exercised through actual scene interaction methods: 4701, -987, 731942.
- Browser error log during scene checks: no errors or warnings.
- Packaged local server: HTTP 200; launcher detects and reuses it.

These are automated mechanics checks and visual inspections, not a completed long-form human balance playtest. Mobile gesture acceptance and a sustained FPS benchmark remain outside this PC-first pass.

Original assets are retained. The authored loader corrects a source zone overlap that otherwise puts the Barracks shard inside the boss restriction. Floor rendering is deliberately brighter than wall rendering; gameplay has no full-screen darkness mask.

For feature scope and controls, see PLAY_GUIDE.md. Cover artwork provenance and the generation prompt are in ART_NOTES.md.
