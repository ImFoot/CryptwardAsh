# Cryptward cover art

## Cathedral art pass · 0.1.5

Three new assets were created with the built-in image-generation tool. Original PNG masters are retained below; the game loads WebP copies encoded at quality 90 with alpha quality 100. The three runtime assets total 1,476,954 bytes (about 1.41 MiB), an 80% reduction from the PNG originals. No external asset host is required.

The architecture atlas uses four equally spaced texture frames. Its transparency is preserved. Materials are projected and baked once when a floor is created; pooled additive light sprites and culled architecture render the atmosphere. Floor medallions are clipped to walkable tiles. The layout, collision, enemy statistics, and progression rules are unchanged.

### Cathedral stone

Master: `assets/masters/cathedral-stone-v2.png`
Runtime: `public/assets/art/cathedral-stone.webp`

Final prompt:

Use case: stylized-concept. Asset type: seamless square game environment material for Cryptward, an isometric dark fantasy dungeon. Create a premium hand-painted physically rich ancient cathedral flagstone floor texture, orthographic directly overhead with NO perspective. Large irregular rectangular weathered limestone slabs, muted warm grey and desaturated blue slate, subtle aged brass seams in a few joints, chipped beveled edges, hairline cracks, pitted stone grain, tiny traces of ash and moss. Restrained contrast, luminous midtone stone faces so characters read clearly. Covers the entire square edge to edge; seamless tileable edges; roughly 6 by 6 large stones across the whole image. Sophisticated realistic painterly videogame environment, tactile material quality, soft neutral ambient lighting. No objects, no characters, no lettering, no glowing lines, no border, no black void, no UI.

### Crypt architecture

Master: `assets/masters/crypt-architecture-v2.png`
Runtime: `public/assets/art/crypt-architecture.webp`

Final prompt:

Use case: stylized-concept. Asset type: original Cryptward isometric dungeon architectural prop sprite atlas on a genuinely TRANSPARENT background. One horizontal row of FOUR equally sized cells, each prop fully isolated inside its own quarter with generous transparent padding, no overlap. First cell: tall weathered gothic limestone pillar with carved hooded skull capital and antique brass bands. Second cell: ornate tall black iron and brass brazier pedestal with a brilliant orange fire, realistic curling flames. Third cell: crumbling cathedral statue of a hooded stone guardian holding a downward sword, teal ward light in the cracks, on a square plinth. Fourth cell: broken stone pillar stump surrounded by a small cluster of rubble. All props share the same isometric 2:1 three-quarter overhead game camera, top and two sides visible, verticals upright, fronts facing bottom center. Premium painterly realistic dark fantasy game art, rich sculpted relief, chipped edges, carefully painted ambient occlusion, dramatic warm rim light from upper left and subtle teal fill. Large crisp silhouettes readable at 80 to 160 pixels tall. Full props including bases visible. No floor plane, NO background, NO lettering, NO labels, no UI. Wide landscape atlas.

### Ward medallion

Master: `assets/masters/ward-medallion-v2.png`
Runtime: `public/assets/art/ward-medallion.webp`

Final prompt:

Use case: stylized-concept. Asset type: original Cryptward game environment floor decal. A single circular ancient ritual medallion viewed perfectly straight down, orthographic overhead, on a genuinely transparent background outside the circle. Elaborate weathered antique brass concentric rings inlaid into charcoal limestone, twelve small abstract geometric rune marks around the perimeter, an elegant central compass-like ward sigil, tiny restrained turquoise luminous inlays. Premium hand-painted realistic dark fantasy game art, intricate engraved metal, worn stone, patinated bronze and subtle teal emission. Aged and ominous but legible. Perfect circle centered with generous transparent padding. No perspective, no plinth, no standing objects, no words, no text, no UI. Designed to be projected onto an isometric dungeon floor by the game engine.

## Original cover

Created with the built-in image-generation tool. Saved as `public/assets/cryptward-cover.png`.

Final prompt:

Use case: stylized-concept. Asset type: widescreen original game title-screen background, 16:9 landscape. Create premium painterly dark-fantasy key art for Cryptward: The Ashvault. A lone armored Ash Warden with a closed dark steel helmet, aged brass armor details, short burnt-orange scarf, sword and small round shield stands on the RIGHT THIRD of the composition on pale worn stone slabs, looking toward a monumental industrial crypt archway, giant chains, ancient brass furnace and teal ward runes in the far background. Hand-painted rich detailed game illustration, cinematic depth, confident shapes, sophisticated restrained palette. Teal atmospheric light and warm furnace embers illuminate the armor edges. Floor is clearly visible and lighter than architectural walls. The LEFT 45 percent should be quiet desaturated blue-black mist and subtle stone architecture with no strong focal subjects, reserved for interface lettering. Dramatic but readable, luminous highlights, high material detail, drifting sparks. NO text, NO logos, NO interface, NO lettering. Original characters and world only.
