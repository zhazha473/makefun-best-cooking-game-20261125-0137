# COPPER LADLE: 12 dishes, 5 stations, 3 rushes, 1 perfect service

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/zhazha473/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/zhazha473/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game for the make.fun
[best-cooking-game-20261125-0137](https://make.fun/c/best-cooking-game-20261125-0137)
bounty. It runs offline in a desktop browser from static files, played
with keyboard and mouse.

## How to play

You are the cook in a small copper-and-tile kitchen. Orders arrive on
the board at the top; each names a dish and a customer, and its patience
bar drains while you work. Walk the loop — pantry, chopping board, stove,
assembly counter, service window — and get the dish out before the
customer walks away.

- **WASD / arrows** — walk (or click where the cook should go)
- **E / Space** — work the nearest counter
- **1–8** — pick an ingredient from the pantry (or click its bin)
- **Hold E at the chopping board** — chop · **stove** — cook, then take
  it off before it burns · **assembly counter** — stack the plate ·
  **service window** — serve
- **Tab** — the recipe book (12 dishes) · **P** — pause · **M** — mute ·
  **R** — restart the run

12 dishes from 8 ingredients, 3 rushes (morning, lunch, dinner) of 150
seconds, a rush hour with double tips in the last minute, and a combo
that grows with every clean serve. A dish only counts when the plate
holds exactly the right ingredients in the right states — raw, chopped
or cooked.

## Play it

```sh
node serve.ts        # opens http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` + `game/styles.css` — page and canvas
- `game/src/main.js` — screens and the frame loop
- `game/src/recipes.js` — 8 ingredients, 12 dishes, 12 regulars
- `game/src/kitchen.js` — the five-station loop, counters, collisions
- `game/src/orders.js` — the order board: spawn, patience, tips
- `game/src/chef.js` — the cook: one pair of hands, one item
- `game/src/cooking.js` — chop, cook, assemble, serve, bin
- `game/src/render.js` — the kitchen, the food, the cook, the HUD
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — deterministic screenshot staging
- `game/src/random.js` — seeded random numbers
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
