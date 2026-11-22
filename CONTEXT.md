# BRIEF: original heist game (competition best-heist-game-20261122-0559)

Build an ORIGINAL top-down 2D heist game, plain ES modules + Canvas (no external library), static files under game/.

## Judge criteria (verbatim, most important first)
1. A complete heist game, shown in screenshots of the game itself: a room the thief is crossing, guards with vision cones, cameras, a loot target and an alarm meter, all visible in one frame.
2. Fun and depth: several routes per room, tools at a cost, and patrols and cones you have to read before you move.
3. Feel and polish: tension as cones sweep, a caught moment that is fair, and a getaway that pays off the planning.
4. Look and originality: a style where safe cover, danger and loot are obvious at a glance rather than a generic top-down tile set. No copying existing commercial games' names/art.
5. Structure: source split into files with one clear job each, named for what they do.

## Hard requirements
- game/index.html opens in desktop Chrome and plays offline; every reference is a relative path inside game/ or a data: URI; NO http(s) references anywhere; no build step.
- Keyboard (WASD/arrows) + mouse. Guards patrol with rotating/sweeping vision cones; cameras with cones; loot target; alarm meter; caught = alarm; grab loot and reach the getaway to win.
- 3-4 levels or rooms with multiple routes; tools (e.g. EMP to disable camera, smoke, distraction noisemaker) with limited uses/cost.
- Distinct art style: dark vault palette, bright loot glow, clear cover objects, crisp cone rendering with soft edges. Simple WebAudio sounds (no external files, generate with oscillators).
- Split source: game/js/ with one file per job (state.js, level.js, guards.js, cones.js, cameras.js, loot.js, alarm.js, tools.js, render.js, input.js, audio.js, ui.js, main.js ...). Name functions for what they do. Everything parsed as ES modules (no classic-script-only syntax).
- Title screen, level intro, win screen (getaway), caught/retry. Original names (e.g. game "MIDNIGHT VAULT", thief "Wren").
- Screenshots: game must render a deterministically staged scene for ?shot=start|play|loot|end via window.__shot(name) hook; shots.json maps {name, query} entries: 1-start.jpg, 2-play.jpg, 3-loot.jpg, 4-end.jpg with query "?shot=<name>&seed=1".

## Other tasks for the agent
- Touch EVERY pre-existing tracked file at least once (edit a line in main.ts, serve.ts, shots.json, CONTEXT.md; LICENSE must stay canonical MIT text - only add nothing).
- main.ts must differ from starter: add at least one authored line (e.g. a comment describing the game).
- After building: verify with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` runs clean.
- Do NOT run `git commit`; just write files.

## Build note

The finished entry is **MIDNIGHT VAULT**: Wren crosses three authored rooms, reads sweeping guard
and camera cones, spends limited EMP / smoke / noise charges, takes the glowing prize and reaches
the getaway. Source lives in `game/js/` with one job per module; `game/index.html` is the offline
entry. The four screenshots are rendered from the game's own draw commands: `tools/shotgen.mjs`
records them through `createRecordingPainter`, and `tools/rasterize.py` rasterizes them with PIL.
`window.__shot(name)` and `?shot=<name>&seed=1` freeze the same deterministic compositions.
