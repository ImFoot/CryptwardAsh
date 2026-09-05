# CRYPTWARD: THE ASHVAULT

## Consolidated game design and Replit build specification — Version 2.0

**Authority:** This file is the primary implementation specification. JSON files define exact data. The DOCX is the formatted human-readable copy. If an older instruction conflicts with this package, this package wins.

**Product decision:** Cryptward uses a hybrid dungeon system. The Ashvault tutorial is an authored 64 × 48 map. Later Expedition floors are assembled from authored room templates by a lightweight seeded generator. Both sources must produce the same `DungeonDefinition`; gameplay code must not care which source created the dungeon.

**Required build order:** Complete Milestone A, the authored vertical slice, before implementing procedural generation. Architect the common dungeon interface from the beginning, but do not debug combat and generation simultaneously.

# 1. Product vision

Cryptward is an original one-player arcade dungeon crawler about entering a sealed industrial crypt, destroying the furnaces that generate enemies, collecting three seal shards, defeating the Bellows Warden, and escaping before the Ash Warden's Ember reserve burns out. It combines immediately legible room combat with a modern one-thumb control model and short, replayable runs.

## Design pillars

- **Move first, think while moving.** A room communicates its threats, source of reinforcements, and useful cover in under two seconds.
- **True one-thumb play.** Movement, dash, special attack, and interaction share one touch surface. No second finger or fixed action-button cluster is required.
- **Pressure without cheapness.** Ember drains slowly, enemies telegraph, and damage is attributable to readable mistakes.
- **Destroy the source.** Endless enemies are inefficient to farm; breaking nests permanently changes encounter state.
- **Authored quality with procedural variety.** Templates preserve good combat geometry while seeded assembly changes routes and encounters.
- **Readable spectacle.** Strong silhouettes, restrained particles, orange danger, teal benefits/interactions, and clear hit feedback take priority over clutter.

## Product boundaries

- Phaser 3, TypeScript, and Vite; responsive browser deployment.
- Portrait mobile at 390 × 844 is the acceptance-test baseline; desktop is supported.
- No multiplayer, account, backend, analytics, ads, purchases, or stamina timers.
- No inventory grid or equipment-comparison interface in the first release.
- No copied Gauntlet names, maps, characters, art, audio, fonts, wording, or trade dress. Cryptward is original IP inspired only by broad arcade-dungeon mechanics.

# 2. Modes and content structure

## Campaign: The Ashvault

The supplied `levels/level-01-ashvault.json` is the canonical authored tutorial and first campaign floor. It teaches movement, auto-attack, spawners, keys, gates, shards, ranged pressure, secrets, checkpoints, boss tells, and portal completion in a controlled order. Do not replace it with a random floor.

## Expedition

Unlocked after completing the Ashvault. An Expedition is a sequence of seeded generated floors. The first implementation may contain one generated floor and a results screen; later versions may chain three to five floors. Difficulty rises by floor index through encounter budgets, enemy mix, Ember pressure, and optional modifiers—not by making navigation unreadable.

## Daily Crypt and custom seeds

These are optional post-MVP modes. Daily Crypt derives a UTC-date seed plus generator version. Custom Seed accepts a signed 32-bit integer or share code. Identical content version, generator version, mode, and seed must produce identical topology, objectives, encounters, and rewards.

# 3. Core loop and run pressure

1. Enter a room and immediately identify exits, spawners, hazards, and cover.
2. Keep moving while normal attacks automatically strike valid targets in the facing cone.
3. Decide whether to clear enemies, rush a nest, use Ember Burst, or retreat through a choke point.
4. Collect health, Ember, keys, score treasure, and required objectives.
5. Open the progression gate, defeat the floor boss, activate the exit, and receive score and rank.

Ember begins at 100 and drains at 0.22 per second in Campaign. At zero Ember, health drains at 1.5 per second. Expedition modifiers may alter drain by no more than ±35% from the mode baseline. Loading, pause, backgrounding, results, and noninteractive transitions never drain Ember.

# 4. One-hand control contract

The first eligible touch in the lower 70% of the viewport creates a dynamic joystick centered on the landing point. The same pointer feeds one gesture classifier. The hero never teleports or changes world position when the stick recenters.

| Gesture | Classification | Action |
|---|---|---|
| Drag | displacement > 12 px | Move; facing follows smoothed movement vector |
| Quick tap | duration ≤ 180 ms and displacement < 12 px | Cast Ember Burst toward retained facing or valid assisted target |
| Outward flick | peak velocity ≥ 850 px/s and duration < 360 ms | Dash in flick direction for 180 ms; 1.8 s cooldown |
| Context hold | duration ≥ 350 ms, displacement < 12 px, valid target at start | Open, unlock, pull, activate, or revive |
| Release | any completed movement gesture | Stop and retain facing/aim memory for 900 ms |

Gesture priority is context hold, flick, quick tap, then completed drag. A hold is eligible only when a valid interactable was present at touch start. A flick is measured from recent samples rather than total displacement. Multi-touch is ignored after the primary pointer is captured, except the pause control.

Keyboard fallback: WASD/arrows move, Space bursts, Shift dashes, E interacts. Gamepad fallback: left stick moves, South bursts, East dashes, West interacts. These do not weaken the touch acceptance criteria.

## Auto-attack

- Attack every 520 ms when a valid target exists.
- Query within 210 px and a 110-degree cone centered on retained facing.
- Require unobstructed line of sight; walls and closed doors block acquisition.
- Prefer shortest distance. Within 10%, prefer aim-axis alignment, then spawner, then lower health, then stable entity ID.
- Never rotate more than 35 degrees away from movement. When stationary, permit up to 55 degrees of aim magnetism.
- Display a subtle brass reticle for 120 ms before the strike, never a permanent targeting line.

# 5. Player, combat, and recovery

| Stat | Baseline |
|---|---|
| Health | 100; 420 ms post-hit invulnerability |
| Ember | 100; fuels time pressure and Ember Burst |
| Move speed | 128 px/s, exactly four tiles per second |
| Blade | 14 damage, 58 px frontal sweep, up to three targets |
| Ember Burst | 30 damage, 18 Ember, radial knockback |
| Dash | 315 px/s for 180 ms; enemy-safe but not wall/pit-safe |
| Guard charm | four seconds; blocks 50% damage |

Use circular bodies, compact forward attack capsules, deterministic cooldowns, and stable numeric entity IDs. Resolve world collision before soft enemy separation. Pool projectiles, impacts, pickup sparkles, damage labels, and boss hazards. A successful hit produces directional knockback, a short sprite flash or reduced-flash outline, a 2–4 px camera impulse, and a concise audio event.

On death, freeze enemies for 450 ms and offer Retry from Checkpoint or Restart Floor. Checkpoint revival preserves destroyed nests, permanent gates, objectives already banked, deaths, and elapsed time; it resets loose enemies and uncollected transient pickups after the checkpoint. Apply a 500-point death penalty.

# 6. Enemies, nests, and boss

| Enemy | Role | Baseline |
|---|---|---|
| Ash Rat | Fast pack flanker with short lunge | HP 20; 6 damage; 50 points |
| Bonebound | Slow melee blocker with 420 ms cleaver tell | HP 42; 12 damage; 90 points |
| Cinder Acolyte | Ranged controller maintaining 160–220 px | HP 34; 10 damage; 120 points |
| Furnace Brute | Elite lane denial with 700 ms wedge tell | HP 120; 20 damage; 250 points |
| Ember Nest | Stationary generator; pauses after burst damage | HP 95; 400 points |
| Bellows Warden | Three-phase authored boss | HP 850; 2,500 points |

Nests activate only in the current room or its reveal margin. Each owns a cadence and living cap; the global mobile cap is 24 active enemies. Spawn telegraph is 600 ms and a new enemy is harmless for 400 ms. Destroying a nest ends future waves and drops Ember but does not erase existing enemies.

Bellows Warden phases remain authored: Temper at 100–66%, Overpressure at 65–33%, and Rupture at 32–0%. The boss cannot begin an attack off-camera. Orange always indicates danger; teal marks an exposed core, interaction, or benefit. Boss arenas are never procedurally carved.

# 7. Authored Level 1 — The Ashvault

The fixed map is 64 × 48 tiles, 2,048 × 1,536 world pixels. Target first-clear time is 14 minutes; skilled replay is 8–10 minutes.

| Zone | Purpose | Key beat |
|---|---|---|
| Ember Vestibule | Safe onboarding | Move, auto-attack, tonic, checkpoint |
| Rat Run | Spawner lesson | Destroy the Ash Rat nest rather than farming waves |
| Key Vault | Exploration loop | Brass key and Bonebound commitment tell |
| Furnace Cross | Choice hub | Locked gate, secret wall, and route return |
| Bone Barracks | Crowd geometry | Choke points and second shard |
| Cinder Gallery | Ranged pressure | Break line of sight, pull lever, claim third shard |
| Seal Approach | Mastery check | Brute plus Acolyte; three-shard gate |
| Bellows Arena | Boss payoff | Three phases followed by portal exit |

Critical path: spawn → Rat Run nest and first shard → Key Vault key → Furnace Cross gate → Bone Barracks shard → Cinder Gallery lever and shard → Seal Approach → three-shard gate → Bellows Warden → exit portal.

The cracked wall in Furnace Cross opens after two blade hits or one Burst. Destroying all three nests grants a 1,000-point bonus. No-death bonus is 2,000. Time bonus begins below 14:00 at five points per saved second.

Keep the full authored tilemap resident. Wake AI only in the current zone and adjacent reveal corridor. Closed doors block movement, navigation, projectiles, and sight.

# 8. Hybrid dungeon architecture

Both authored and generated maps must be normalized into one runtime object before `GameScene` creates entities.

```ts
interface DungeonDefinition {
  schemaVersion: 1;
  id: string;
  displayName: string;
  source: "authored" | "generated";
  seed?: number;
  generatorVersion?: string;
  biome: "ashvault";
  tileSize: 32;
  width: number;
  height: number;
  layers: { ground: number[]; walls: number[]; collision: number[]; decoration: number[]; zones: number[] };
  rooms: DungeonRoom[];
  connections: DungeonConnection[];
  objects: DungeonObject[];
  progression: ProgressionDefinition;
}
```

`AuthoredDungeonLoader` parses the supplied Tiled-compatible map. `DungeonGenerator` creates the same definition. `DungeonValidator` validates both. Rendering, combat, AI, minimap, objectives, checkpoints, and results receive only the normalized definition.

```ts
const dungeon = request.kind === "authored"
  ? authoredLoader.load(request.levelId)
  : generator.generate(request.options);

validator.assertValid(dungeon);
gameScene.start(dungeon);
```

Do not place generator logic in `GameScene`. Do not create separate gameplay paths for Campaign and Expedition.

# 9. Lightweight procedural generator

The generator assembles authored semantic room templates. It must not carve an unconstrained cellular maze.

## Stage 1 — progression graph

Create an abstract graph before placing tiles. Default small-floor targets are 9–13 rooms, a 6–9 room critical path, one or two branches, one loop or shortcut, one optional treasure room, one checkpoint at 55–70% depth, and one fixed boss arena. At most two dead ends may exist and each must contain a reward or required objective.

Select a progression recipe by mode and floor index. The MVP recipe is `key_and_three_shards`: place the key before its gate; place three shards in distinct reachable combat/objective rooms; place the seal gate after all three branches can be completed; place boss and exit last. Secrets may never contain required progression.

## Stage 2 — room selection

Choose a template matching graph role, required socket degree, depth range, biome, and recent-use constraints. Avoid repeating the same template or shape within three rooms. Rotation is allowed only when `allowRotate` is true. Mirroring requires `allowMirror`; never infer it because banners, stairs, text, or lighting may be directional.

Room templates contain dimensions, shape, sockets, semantic markers, tags, weight, role eligibility, and transformation permissions. The generator stamps floor/wall geometry and later resolves markers into actual encounters and objects.

## Stage 3 — spatial placement

Place rooms on a 20 × 20 tile coarse grid. Begin with Start, then place the critical path, then branches and loop. Connect compatible sockets using straight, L-shaped, or short Z-shaped corridors at least three tiles wide. Reject overlap, corridors crossing rooms, blocked sockets, routes longer than 28 tiles, and layouts with total bounding dimensions above the configured limit.

Try up to eight complete layouts. Each attempt uses a derived sub-seed so retry behavior is deterministic. If all attempts fail, load a bundled known-good fallback seed. Generation should complete below 50 ms on a typical phone; perform it behind the floor-loading transition.

## Stage 4 — tile decoration

Stamp the semantic walkable mask, create boundary walls, open socket apertures, then use seeded weighted tile variants. Decoration must never alter collision after validation begins. Keep a two-tile clear zone at entrances, around progression objects, and around checkpoint activation. Orange hazards require both color and shape/animation cues.

## Stage 5 — encounters and rewards

Calculate room threat budget as `4 + floor(1.5 × criticalDepth) + difficultyModifier + jitter(-2..2)`. Suggested costs: Rat 1, Bonebound 2, Acolyte 3, minor trap group 2, Nest 5, Brute 6, elite modifier +3.

- Never schedule more than two high-intensity rooms consecutively.
- Place a calm room immediately before the boss.
- Do not place ranged-only encounters in narrow rooms.
- Do not combine the maximum threat budget with heavy environmental hazards.
- Spawn the player at least four clear tiles from active enemies and hazards.
- Spawners remain dormant until room entry.
- Required pickups use protected markers, never random floor coordinates.

## Stage 6 — validation

Validate array sizes, bounds, unique IDs, socket closure, collision continuity, connectivity, objective order, key-before-gate, all-shards-before-seal, checkpoint reachability, boss isolation, exit-after-boss, safe spawn areas, minimum combat area, and object/collision conflicts. Use breadth-first search with an inventory-state model, not simple geometric reachability.

Validation failure returns structured reason codes for tests and debug display. Production retries silently and records the rejected seed only in a local debug log. Never expose a broken floor.

# 10. Procedural pacing and difficulty

Difficulty changes composition, not fairness. Each room receives intensity 0–3. The graph scheduler should resemble `0,1,2,0,2,1,3,0,boss`, with branches allowed to be one step harder in exchange for better rewards.

| Floor band | Rooms | Budget modifier | Enemy access | Notes |
|---|---:|---:|---|---|
| Expedition 1 | 9–11 | 0 | Rats, Bonebound, Acolyte | One Nest maximum before checkpoint |
| Expedition 2 | 10–12 | +2 | Add Brute | More loops; two Nests permitted |
| Expedition 3+ | 11–14 | +4 then +1/floor capped at +8 | Full roster | Add modifiers, not denser walls |

Rewards scale with optional risk. Dead-end branches contain a tonic, Ember charge, score relic, charm, or secret—not empty floor. Generated runs use the same scoring language as Campaign, but rank thresholds are stored per recipe and room-count band.

# 11. UI, camera, accessibility, and minimap

HUD: health and Ember upper left; stable score upper center; keys, shards, and pause upper right; 96 × 72 minimap below counters. Generated minimaps reveal visited room outlines and connections rather than every decorative tile. Objective arrows select the next reachable required objective, never a locked objective behind an unmet prerequisite.

Use a 390 × 844 logical viewport and responsive letterboxing. Mobile zoom is 1.12, desktop 1.0. Camera dead zone is 70 × 110 px with 0.14 lerp and 38 px movement look-ahead. Clamp shake to 5 px normally and 9 px for boss-only events.

Persist left/right HUD preference, aim assist 0/50/100%, reduced flash, vibration, and audio settings. Reduced Flash replaces white flashes with outline brightening and caps full-screen alpha at 0.12. Color is never the only state cue. Pause immediately on page hide and require a deliberate tap to resume.

# 12. Audio brief

Audio files are not included. Implement event hooks and use only original or properly licensed sounds. The palette is dry industrial percussion, chains, stone, bellows, and concise magical transients that remain legible on phone speakers. Rate-limit identical enemy voices to one per family per 120 ms. Blade and Burst cues remain audible; footsteps duck during dense combat. Boss phase stings duck music by 4 dB for 700 ms.

# 13. Technical project structure

```text
src/
  main.ts
  scenes/BootScene.ts
  scenes/TitleScene.ts
  scenes/GameScene.ts
  scenes/ResultsScene.ts
  dungeon/DungeonDefinition.ts
  dungeon/AuthoredDungeonLoader.ts
  dungeon/DungeonGenerator.ts
  dungeon/DungeonValidator.ts
  dungeon/ProgressionGraph.ts
  dungeon/RoomPlacer.ts
  dungeon/TileDecorator.ts
  dungeon/EncounterPopulator.ts
  systems/InputGesture.ts
  systems/AutoTarget.ts
  systems/Combat.ts
  systems/Spawner.ts
  systems/Progression.ts
  systems/Pool.ts
  entities/Player.ts
  entities/Enemy.ts
  entities/Boss.ts
  ui/HUD.ts
public/
  assets/
  levels/level-01-ashvault.json
  templates/ashvault-room-catalog.json
  config/game-config.json
  config/generator-config.json
```

Gameplay runs at a 60 Hz fixed step with interpolated visuals. Clamp accumulated time after tab restoration. Use spatial hashing or Phaser groups for target queries. Enemy paths update at most four times per second and schedules are offset by entity ID. Direct steering is allowed with clear sight. Store generated seed and generator version in save/resume state.

Save record: `schemaVersion`, settings, campaign bests, expedition bests, cosmetics, unlocks, last seed, generator version, and optional resumable run. Validate and migrate; preserve settings when repairing corrupt score data. No telemetry is required.

# 14. Assets and data authority

The package includes five untouched high-resolution master sheets, normalized atlases, a 32 px runtime tile atlas, and 244 individually named transparent PNGs. `asset_manifest.json` is authoritative for frame names and coordinates. Replit may use atlases for performance or individual frames for simple setup.

The generated-room system reuses this Ashvault art. No new art is required for the first procedural prototype. Room variety comes from template geometry, rotations explicitly permitted by metadata, weighted floor/wall variants, prop placement, encounter mixes, and lighting. A commercial release should receive a human pixel-art cleanup pass for stray edge pixels and animation continuity.

# 15. Milestone implementation plan

## Milestone A — authored vertical slice

Create the Vite/Phaser shell; load assets and `level-01-ashvault.json`; implement collision, gestures, auto-attack, combat, all enemy families, nests, objectives, checkpoint, boss, minimap, results, settings, and local persistence. The authored floor must be completable on a 390 × 844 touch viewport before Milestone B begins.

## Milestone B — common dungeon boundary

Introduce `DungeonDefinition`, normalize the authored loader into it, validate the authored map through `DungeonValidator`, and prove there is no gameplay regression. `GameScene` may receive only a `DungeonDefinition`, not raw Tiled JSON.

## Milestone C — template and graph prototype

Load the supplied room catalog, generate progression graphs deterministically, and expose a developer-only graph/seed screen. Test objective ordering and graph reachability without rendering tiles.

## Milestone D — spatial generator

Place rooms, route corridors, stamp tiles, populate encounters and objects, validate, and render one Expedition floor. Add seed replay and fallback behavior. Maintain the authored Bellows arena as a fixed template.

## Milestone E — procedural modes and polish

Unlock Expedition after campaign completion. Add results keyed by seed/version, optional Daily Crypt and custom seed, performance profiling, playtest telemetry only in local debug builds, and template-variety tuning.

Replit must stop at the end of each milestone, run its tests, report changed files and unresolved issues, and wait for approval before proceeding if interactive milestone approval is available.

# 16. Acceptance tests and definition of done

## Authored game

- Complete with one thumb at 390 × 844 without keyboard, second finger, or fixed action buttons.
- Tap, flick, drag, and hold pass boundary tests and a debug classification screen.
- Auto-target never selects through walls or closed doors.
- All eight zones are reachable; brass gate requires the key; seal gate requires exactly three shards.
- Nests respect local caps and the global 24-enemy cap; spawn arrivals are telegraphed and harmless.
- Checkpoint recovery preserves permanent changes and resets only documented transient state.
- Boss remains inaccessible before the seal gate; portal remains inactive before boss defeat.
- Results accurately show score, time, deaths, nests, secrets, and rank; bests persist.

## Generator

- The same seed and generator version produce byte-equivalent normalized topology and object placement.
- At least 10,000 automated seeds generate without an uncaught exception.
- Every accepted floor passes inventory-state solvability validation.
- No required object occupies collision, hazard, unopened secret, or unreachable tile.
- No open socket faces solid wall; no corridor is narrower than three tiles.
- Boss has one valid approach and cannot be entered before requirements are satisfied.
- Rejected attempts are deterministic; eight failed attempts select a verified fallback.
- Generation p95 is below 50 ms on the project’s mobile performance target.
- Across 100 consecutive seeds, no template repeats within three critical-path rooms unless the catalog makes that mathematically impossible.

## Performance and release

- Sustain 55–60 FPS on a mid-tier phone with 24 enemies, 20 projectiles, and active effects.
- Backgrounding pauses immediately and never applies accumulated damage or Ember drain.
- Safe-area HUD is not clipped on modern iPhone ratios or desktop fallback.
- No missing asset references, uncaught schema errors, external services, or copied protected creative elements.

The MVP is done when a first-time touch player can complete the authored Ashvault, understand each gate and spawner, defeat the readable boss, then launch and complete a valid seeded Expedition floor with the same controls and gameplay systems.

# 17. Replit handoff instructions

Upload the complete ZIP, extract it at the project root, and paste `REPLIT_BUILD_PROMPT.txt` into Replit Agent. Do not upload the DOCX separately if it is already inside the ZIP. Replit should read this master specification first, then the JSON schemas/configuration, then the authored level and asset manifest.

Do not ask Replit to “build everything in one pass.” Require milestone execution. The procedural architecture is known from day one, but the authored vertical slice is the first proof that combat and one-thumb controls are correct.

# Appendix A — authoritative files

| File | Authority |
|---|---|
| `MASTER_SPECIFICATION.md` | Product, behavior, architecture, milestones, acceptance criteria |
| `config/game-config.json` | Exact gameplay and control baseline values |
| `config/generator-config.json` | Generator limits, weights, budgets, retries, fallback seeds |
| `schemas/*.schema.json` | Data contracts; invalid data must fail development builds |
| `levels/level-01-ashvault.json` | Canonical authored tutorial map |
| `templates/ashvault-room-catalog.json` | Initial procedural room-template metadata |
| `asset_manifest.json` | Asset paths, grids, and frame names |
| `REPLIT_BUILD_PROMPT.txt` | Initial Replit Agent instruction |

# Appendix B — first playtest questions

- Can a new player infer movement within five seconds?
- Does auto-attack feel intentional rather than autonomous?
- Are accidental flick dashes fewer than one in twenty ordinary turns?
- Does the first nest teach “destroy the source” without explanatory text?
- Is Ember pressure noticeable by minute four without becoming oppressive?
- Can players consistently identify orange danger and teal benefit/interaction?
- Does a boss death feel attributable to a readable mistake?
- Do generated rooms feel authored, and can the player recall meaningful route choices afterward?
