# Bakery management mobile game

Portrait mobile sim: bottom tabs **入貨 / 做包 / 店面 / 結算**, interactive bake steps (knead, toppings, etc.), per-recipe ingredients.

## Engine

Default **Godot 4 + GDScript** (mobile export, UI, touch). Switch only if kit names another engine.

## Skills to load (in order)

Installed under `.agents/skills/` (also mirrored historically in `.cursor/skills/`).

| Phase | Skills | Why |
|-------|--------|-----|
| Always start | `router` | Confirm engine + minimal set |
| Scaffold | `prototype-fast` → `godot-gdscript` → `godot-nodes-scenes` → `godot-signals-groups` | MVP shell, scenes, tab events |
| Shell UI | `godot-ui-control` + `game-ui-ux` | 4-tab bottom nav, safe area, phone layout |
| Economy / data | `godot-resources` + `survival-crafting` + `rpg` | Recipes, inventory, buy/sell loop (skip survival needs/base threats) |
| Bake minigames | `input-systems` + `puzzle` + `game-feel` + `godot-animation` | Touch knead/drag toppings, step sequences, juice |
| Persist | `save-systems` | Stock, cash, day, unlocks |
| Polish | `create-game-assets` + `audio-design` + `godot-audio` | Bread art, SFX/ambience |
| Ship | `godot-export` | Android / iOS |

Restore lockfile installs with:

```bash
npx skills experimental_install
# or re-add the curated set:
npx skills add gamedev-skills/awesome-gamedev-agent-skills -a cursor -y --copy \
  -s router -s godot-gdscript -s godot-nodes-scenes -s godot-signals-groups \
  -s godot-ui-control -s godot-resources -s godot-animation -s godot-audio \
  -s godot-export -s game-ui-ux -s input-systems -s game-feel \
  -s create-game-assets -s save-systems -s audio-design -s prototype-fast \
  -s survival-crafting -s puzzle -s rpg
```

## Core loop to prototype first

1. Buy ingredients (入貨)
2. One interactive bake recipe (做包)
3. Put stock on shelf / serve (店面)
4. End-of-day money + waste (結算)

Validate the bake gesture fun (`prototype-fast`) before expanding recipes or shop systems.
