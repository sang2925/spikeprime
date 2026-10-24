# gyro-mission6-7-11_routefix_creep: the route fix for a robot that slides in fast turns

This is a second version of `gyro-mission6-7-11_routefix`. The other files were not changed. The new file is `gyro-mission6-7-11_routefix_creep.llsp3`. It is set to download to **slot 19**, our test slot.

It has everything `gyro-mission6-7-11` has (the safety timers too). Only **2 typed-in numbers** are different.

## Why there are two route-fix versions

In our video, two kinds of sliding happened (grown-up details: `route-from-video.md`):

1. In `turn 67` the robot's front corner **caught the green and black model** and slid back about 15 cm.
2. In `turn 85` it slid back about **6 cm**, but nothing was touching it.

`turn 85` starts fast (42% speed). `turn 20` starts slowly (16%) and did not slide at all. So our robot may slide a little **every time a turn starts fast**, like tyres spinning on ice before the car moves.

We don't know yet which is true:

| If our robot... | Use | Numbers |
|---|---|---|
| only slides when it catches a model | `gyro-mission6-7-11_routefix` | 35, 29, back 12 |
| also slides at the start of fast turns | **this file** | 40, 28, back 6 |

**How to find out:** run `turn-test` on the mat with tape at the robot's corners (see `turn-test.md`). If the robot ends up 2 cm or more away from the tape, it slides: use this file. If it stays within 2 cm, use `gyro-mission6-7-11_routefix`. If you can't run turn-test first, try this file: it matches what our video shows.

## The 2 changes

| Step | Block | Old | New | Why |
|---|---|---|---|---|
| 3 | `straight` up past the brown model | 47 | **40** | Stop 7 cm earlier, so `turn 67` misses the green and black model. The 4 cm slide at the start of `turn 67` then puts the robot about where the old big slide did. |
| 5 | `straight` over to the models | 32 | **28** | Lands the push where it started in the video |
| 8 | `straight` back up after the push | -6 | -6 (same) | `turn 85` slides about 6 cm by itself. 6 + 6 = 12 cm: the right spot for Mission 11. |

Everything else is the same: B+A, 17.6 degrees per cm, the speeds, the turns, and the way home. The cheat sheet shows 47 and 32 for steps 3 and 5. In this file they are 40 and 28.

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app; blocks show 40, 28, -6 and none of the old 47 and 32; all 16 comments show | Claude, 2026-10-23 | ✅ |
| Simulator, robot that slides about 6 cm in fast turns (like our video): push stops at the leafcutter, bumps the back of Mission 11, gets completely home, never touches the green and black model | Claude, 2026-10-23 | ✅ in 23, 27, 27, 24, 20, 5 of 27 runs for turns 0, 1, 2, 3, 4, 5° too far |
| Same, with a 4.5 cm slide / a 7.5 cm slide | Claude, 2026-10-23 | ✅ 13, 27, 27, 26, 24, 14 / 23, 24, 23, 19, 10, 0 of 27 |
| Simulator, robot that does **not** slide | Claude, 2026-10-23 | ❌ works in only 0, 0, 0, 9, 25, 20 of 27, and can touch the green and black model. Use `gyro-mission6-7-11_routefix` for that robot |
| **On the real robot and mat** | nobody yet | ❓ **Not tested** |

A simulator is not the real robot. Our numbers came from **one** video.

## Next physical test (needs a grown-up's OK before the robot moves)

1. Run `turn-test` on the mat first (see above), to pick the right file.
2. Download the chosen file to **slot 19** (not slot 0 or slot 1).
3. Start from the same spot as in our video.
4. Run it 5 times and fill in:

| Run | Touched green and black model? | Leafcutter pushed? | Window dropped? | Got home? | Notes |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## If it does X, try Y (change ONE number at a time)

| What you see | What to try | Step |
|---|---|---|
| Touches the green and black model during `turn 67` | Make 40 smaller (try 38) | 3 |
| Touches Mission 11 while driving up | Make 40 bigger (try 42) | 3 |
| Goes past the top of Mission 11 without bumping it | Back 7 instead of 6 | 8 |
| Bumps Mission 11 too low, on its side | Back 5 instead of 6 | 8 |
| The push misses the leafcutter | Watch where it goes, then change 28 by 1 or 2 | 5 |

Keep `gyro-mission6-7-11` as our backup. Only replace it after a version works on the mat.
