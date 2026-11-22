# CHALKLINE — plan

## Judge criteria (RULES.txt, "The judge")
1. Complete heist game in screenshots: room the thief is crossing, guards with vision cones, cameras, loot target, alarm meter — all in one frame.
2. Fun and depth: several routes per room, tools at a cost, patrols and cones to read before moving.
3. Feel and polish: tension as cones sweep, a fair caught moment, a getaway that pays off the planning.
4. Look and originality: safe cover, danger and loot obvious at a glance; nothing copied from a commercial game.
5. Structure: source split into files with one clear job each, named for what they do.

Exclusion stated by the brief, word for word: "An entry copying an existing commercial game's names, characters, art, music or levels loses to an original one."

## Game plan
- Top-down blueprint heist, canvas 2D, 1280x800: top HUD bar (alarm meter, take), 1280x648 room, bottom tool/legend bar.
- 3 rooms (Marrowgate Gallery, Copperline Bank, Brasswick Vault), 2/3/4 guards and 1/2/3 cameras, each with three routes: patrolled hall, camera gallery, vent duct.
- Guards walk waypoint loops and pause to sweep; cameras sweep ±40°; cones are raycast fans clipped by walls and smoke.
- Seen → alarm rises (+35 %/s near, +15 %/s far); hidden 1.5 s → it drains; >50 % the seer goes alert; 100 % = caught.
- Tools: Q smoke (x2, −$800) blocks sight; E EMP (x1, −$1,200) kills the nearest camera for 5 s.
- Caught card (spotlight, guilty cone, who saw you and for how long), getaway card (route trail, tally, stars, CLEAN stamp).
- WebAudio heartbeat follows the alarm. Debug query params + read-only window.__game for tests and screenshots.
