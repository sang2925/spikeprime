# gyro-mission6-7-11_routefix_creep_push28_back10_s36: stop sliding back in turn 67

A new copy of `gyro-mission6-7-11_routefix_creep_push28_back10.llsp3` (not changed). Slot **19**.

## What changed

| Step | Before | Now | Why |
|---|---|---|---|
| 3, drive past the brown model | `straight 40` | `straight 36` | Stops 4 cm further from the green and black model |
| 8, back away from the ant | `straight -10` | `straight -10` (same as back10) | So the turn after the push does not catch the ant |

Everything else is the same.

## Why

In two of our videos (IMG_7463 and IMG_7464) the robot slid back towards home during step 4 (`turn 67`). Its front corner hit the green and black model. The model did not move, so the wheels pushed the robot backwards instead.

> Like turning a shopping cart in a narrow aisle: the corner hits the shelf and the cart gets shoved back.

The grey back wheels scrape sideways in every turn, so the robot finishes step 3 in a slightly different spot each run. A couple of cm closer to the model and the corner hits it.

Driving 4 cm less in step 3 keeps the corner away from the model.

Worked example: the simulator says the closest the corner gets to the model goes from **0 to 13 mm** (with 40) to **27 to 46 mm** (with 36).

## Simulator results (27 runs each, turns 1 to 3 degrees too far)

| Step 3 | Touches the green and black model | Gap to it | Good runs |
|---|---|---|---|
| 40 (before) | in up to 6 of 27 | 0 to 13 mm | 9 to 27 |
| 37 | never | 6 to 36 mm | 22 to 27 |
| **36** | **never** | **16 to 46 mm** | **16 to 27** |
| 35 | never | 26 to 56 mm | 11 to 27 |

## If it does X, try Y (ONE number at a time)

| What you see | Step | Try |
|---|---|---|
| Still slides back in step 4 | 3 | 34 |
| The pusher misses the ant, ant on the robot's left | 3 | 38 |
| Turn after the push catches the ant | 8 | -12 |

## What we tested

| Test | Who | Result |
|---|---|---|
| Opens in SPIKE, step 3 shows 36, 28 notes, no errors | Claude, 2026-10-25 | ✅ |
| Only step 3 and its note differ from back10 | Claude, 2026-10-25 | ✅ |
| Simulator (table above) | Claude, 2026-10-25 | ✅ |
| **Real robot** | nobody yet | ❓ |

## Next test (grown-up's OK first)

Reset the ant and Mission 11. Slot 19. Run 5 times, filming:

| Run | Slid back in step 4? | Pusher hit the ant? | Ant in nest? | Window dropped? | Home? |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
