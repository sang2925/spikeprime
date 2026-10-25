# gyro-mission6-7-11_routefix_creep_push28_back10_s36_slowturn: gentler turns

A copy of `gyro-mission6-7-11_routefix_creep_push28_back10_s36.llsp3` (not changed). Slot **19**. **Try this one first.**

## What changed

| Where | Before | Now |
|---|---|---|
| `turn` My Block, speed math | 8 + **0.4** times degrees left | 8 + **0.2** times degrees left |
| Step 3 | 36 (from s36) | 36 |
| Step 8 | -10 (from back10) | -10 |

The 0.4 is in two places (one for each wheel). Both are now 0.2. Nothing else changed.

## Why

Turns that start fast make the grey back wheels scrape and the robot slides. Less speed at the start, less sliding.

| Turn | Start speed before | Start speed now |
|---|---|---|
| `turn 85` | 8 + 34 = **42%** | 8 + 17 = **25%** |
| `turn 67` | 8 + 26.8 = **35%** | 8 + 13.4 = **21%** |
| `turn 20` | 8 + 8 = 16% | 8 + 4 = 12% |

> Like a bike: start pedalling hard on gravel and the back wheel skids. Start gently and it grips.

In our first video, `turn 20` (16%) did not slide at all. Now every turn starts near that speed.

Turns take a little longer (about 1 second more in total). The time limit still has plenty of room.

## Simulator results (27 runs each, turns 1 to 3 degrees too far)

Because we do not know exactly how much the real robot slides, we tried three amounts:

| Slide | Fast turns, step 3 = 36 | **Slow turns, step 3 = 36** |
|---|---|---|
| none | 26 to 27 good | **26 to 27 good** |
| some | 16 to 27 good | **25 to 27 good** |
| a lot | 1 to 5 good | **24 to 27 good** |

Slow turns work almost the same whatever the slide, so the robot should do the same thing every run. The green and black model was never touched (closest 15 to 45 mm).

## If it does X, try Y (ONE number at a time)

| What you see | Where | Try |
|---|---|---|
| A turn stops before the end | `turn` speed math, the 8 | 10 |
| Turns go too far | `turn` speed math, the 8 | 6 |
| Still slides back in step 4 | Step 3 | 34 |
| Pusher misses the ant (ant on the robot's left) | Step 3 | 38 |
| Turn after the push catches the ant | Step 8 | -12 |

## What we tested

| Test | Who | Result |
|---|---|---|
| Opens in SPIKE, speed note shows 0.2, 28 notes, no errors | Claude, 2026-10-25 | ✅ |
| Only the two 0.4 numbers and the speed note differ from s36 | Claude, 2026-10-25 | ✅ |
| Simulator (table above) | Claude, 2026-10-25 | ✅ |
| **Real robot** | nobody yet | ❓ |

## Next test (grown-up's OK first)

Reset the ant and Mission 11's window. Slot 19. Run 5 times, filming:

| Run | Slid back in a turn? | Pusher hit the ant? | Ant in nest? | Window dropped? | Home? |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
