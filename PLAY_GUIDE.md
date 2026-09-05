# Play Cryptward on this laptop

Double-click **Play Cryptward.cmd** in this folder. It starts the finished game in your default browser. Keep the folder intact. No account, hosting subscription, or internet connection is needed to play.

The local server runs only on this laptop. The launcher reuses an existing Cryptward server when possible. It does not install a startup task or background service.

## Controls

| Action | Control |
| --- | --- |
| Move | WASD or arrow keys |
| Aim | Mouse; movement direction if the mouse has not been moved |
| Blade | Automatically attacks nearby targets in front of you |
| Ember Burst | Space or right mouse button; costs 18 Ember |
| Dash | Shift; 1.8-second cooldown |
| Interact | E |
| Map | M; pauses the game |
| Pause | Escape |
| Fullscreen | F |

Gamepad support: left stick moves, South bursts, East dashes, West interacts. Touch gestures provide a secondary small-screen fallback; desktop is the primary version.

## Your first descent

Bind the checkpoint flame near the entrance with E. Follow the eastern passage to Rat Run. The first teal seal unlocks when you destroy its furnace nest. Search the northern Key Vault for the brass key, then open the eastern gate.

The other seals are in Bone Barracks and Cinder Gallery. Pull the gallery lever before collecting its seal. With all three seals, enter Seal Approach and open the boss gate. Avoid the orange warning circles, strike between the Warden's attacks, then use the eastern portal.

Destroying furnaces restores Ember and prevents future waves. Shards restore some Ember too. Burst is powerful but spends your reserve. Defeat offers a checkpoint retry that preserves seals, opened gates, and destroyed furnaces, with a 500-point score penalty.

Enemy and furnace kills grant XP. Level 2 requires 120 XP; later levels require 360, 720, and 1,200 total XP. Each level adds 15 maximum health, restores up to 35 health, adds 2 blade damage, and adds 3 Ember Burst damage. Earned levels survive checkpoint revival. A normal campaign clear reaches at least Level 2 before the boss, while fuller clears can grow stronger.

Completing the campaign unlocks **Expedition** on the title screen. Enter a signed integer seed to play or repeat a ten-room floor assembled from the supplied room templates. This first Expedition implementation uses a fixed progression graph with seeded room choices and rewards.

## Readability

Walkable floors are lighter stone. Walls are dark masonry with brass boundary edges. Raised columns mark solid obstacles. Locked crossings have visible grilles. Teal marks benefits and wards; orange marks attacks and furnaces. There is no full-screen darkness effect over gameplay.

Settings include scene brightness, sound effects, and reduced flashes/shake. Settings, unlocks, and the best score are saved in this browser. Changing browsers or clearing site storage starts a separate save.

## Build and development

The source uses Phaser 3, TypeScript, and Vite. `dist` is the ready-to-play build. `server.mjs` serves only that directory on localhost.

With a normal Node.js/npm installation: `npm install`, `npm run dev`, `npm run build`, and `npm test`.

This laptop also has a local npm bootstrap in `.tools/package/bin/npm-cli.js`, usable as `node .tools/package/bin/npm-cli.js run build` when npm is absent from PATH.

The development-only `/?verify` page provides a **Run campaign verification** button for scene integration checks. It is excluded from production builds and does not write test results into game saves.

## Current scope

This is the playable PC-first campaign and initial seeded Expedition build. It includes the full authored map, all six enemy/source families, the three-phase Warden, objectives, checkpoint recovery, results, map, sound effects, and settings. The original specification's complete mobile gesture/accessibility acceptance suite, daily mode, multi-floor Expedition campaigns, and resumable mid-run saves are not implemented. Best scores currently share one leaderboard across modes.
