# gyro-mission6-7-11_simpleturn: one slow speed for every turn

A new file, slot **19**. Built from `gyro-mission6-7-11_routefix_push28` (in `archived-llsp3/`, not changed).

## What changed

| Where | Before | Now | Why |
|---|---|---|---|
| `turn` My Block speed | 8 + 0.4 times degrees left (starts at up to 42%) | **always 12%** | Fast starts made the grey back wheels skid |
| Step 3 | 35 | **36** | Best number with slow turns in the simulator |

The idea comes from the Prime Lessons gyro turn (`docs/SP3GyroTurning.pdf`, page 8): one slow speed, wait until the gyro reaches the number, stop. The PDF says: use low speeds to keep the turn accurate.

> Like a bike on gravel: pedal hard from a stop and the back wheel skids. Pedal gently and it grips.

## The numbers (steps 1 to 15)

| Step | Block | | Step | Block |
|---|---|---|---|---|
| 1 | straight 35 | | 9 | turn 85 |
| 2 | turn 20 | | 10 | straight 15 (bump Mission 11) |
| 3 | straight **36** | | 11 | straight -18 |
| 4 | turn 67 | | 12 | turn -20 |
| 5 | straight 29 | | 13 | straight 35 |
| 6 | turn 36 | | 14 | turn 50 |
| 7 | straight 28 (push the ant, slow) | | 15 | straight 59 (home) |
| 8 | straight -12 (back away from the ant) | | | |

## Why not the old gyro numbers (47 and 32)?

We tried them first. In the simulator, with slow turns, the robot hits the green and black model in about 25 of 27 runs. The old gyro route only reached the leafcutter **because** the robot slid back about 15 cm in `turn 67`. Without the slide, 47 cm is too far. These numbers were made for a robot that does not slide.

## Simulator results (27 runs each)

| Turns go this much too far | 0° | 1° | 2° | 3° | 4° | 5° |
|---|---|---|---|---|---|---|
| Good runs out of 27 | 15 to 20 | 26 to 27 | 24 to 27 | 20 to 24 | 18 to 19 | 14 to 18 |

The result is the same whether the robot slides or not, because slow turns barely slide.

## If it does X, try Y (ONE number at a time)

| What you see | Where | Try |
|---|---|---|
| A turn stops before the end | turn speed 12 | 14 |
| Turns go too far | the turn number in that step | 1 or 2 less (85 to 83) |
| Touches the green and black model in step 4 | step 3 | 34 |
| Pusher misses the ant (ant on the robot's left) | step 3 | 38 |
| Turn after the push catches the ant | step 8 | -14 |

## What we tested

| Test | Who | Result |
|---|---|---|
| Opens in SPIKE, turn note says "always 12%", 28 notes, no errors | Claude, 2026-10-26 | ✅ |
| Only the two turn numbers and step 3 differ from routefix_push28 | Claude, 2026-10-26 (build tools) | ✅ |
| Simulator (table above) | Claude, 2026-10-26 | ✅ |
| **Real robot** | nobody yet | ❓ |

## Next test (grown-up's OK first)

Reset the ant to its thin black line and Mission 11's window. Slot 19. Run 5 times, filming:

| Run | Slid in a turn? | Pusher hit the ant? | Ant in nest? | Window dropped? | Home? |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
