# Graphics assets

## 0.2.0: Three.js world

The runtime now draws the dungeon, characters, enemies, pickups, gates, and effects as actual 3D meshes. Character joints animate separately; rigid pieces are merged by material to reduce drawing work. Stone uses a generated albedo, a derived bump texture in the renderer, real-time directional shadows, ambient occlusion, environment reflections, and restrained bloom.

- Source master: `assets/masters/basalt-albedo.png`
- Runtime material: `public/assets/materials/basalt.webp` (1024 × 1024)
- Created with the built-in image-generation tool, then resized and encoded to WebP with Sharp. No downloaded third-party art.
- The title screen displays the live 3D world. The older cover and sprite library remain as historical source assets and for the supplied asset manifest, but are not loaded by the new renderer.

Generation prompt:

> Use case: stylized-concept. Asset type: seamless physically based stone material albedo for a real-time 3D dark fantasy dungeon. Flat orthographic macro photograph-like material swatch of ancient worn basalt, dark cool gray but clearly exposed, fine granular mineral structure, weathered pits, subtle chips and layered erosion, occasional fine pale mineral vein. Unpatterned continuous natural stone surface, not tiles, not brickwork, no grout, no objects. Neutral diffuse light, no directional shadows, no specular highlights baked in, no vignette. Edge-to-edge seamless repeatable square texture with uniform medium value. Rich tactile microdetail, restrained contrast so real engine lighting supplies the shadows. No text, no UI, no border.

## Earlier cover art (retained, unused by the 3D renderer)

Created with the built-in image-generation tool. Saved as `public/assets/cryptward-cover.png`.

Prompt:

> Use case: stylized-concept. Asset type: widescreen original game title-screen background, 16:9 landscape. Create premium painterly dark-fantasy key art for Cryptward: The Ashvault. A lone armored Ash Warden with a closed dark steel helmet, aged brass armor details, short burnt-orange scarf, sword and small round shield stands on the RIGHT THIRD of the composition on pale worn stone slabs, looking toward a monumental industrial crypt archway, giant chains, ancient brass furnace and teal ward runes in the far background. Hand-painted rich detailed game illustration, cinematic depth, confident shapes, sophisticated restrained palette. Teal atmospheric light and warm furnace embers illuminate the armor edges. Floor is clearly visible and lighter than architectural walls. The LEFT 45 percent should be quiet desaturated blue-black mist and subtle stone architecture with no strong focal subjects, reserved for interface lettering. Dramatic but readable, luminous highlights, high material detail, drifting sparks. NO text, NO logos, NO interface, NO lettering. Original characters and world only.
