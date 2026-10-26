# gyro-mission6-7-11_routefix: the same mission, without the lucky slide

This is a new copy of `gyro-mission6-7-11.llsp3`. That file was not changed. The new file is `gyro-mission6-7-11_routefix.llsp3`. It is set to download to **slot 19**, our test slot.

It has everything `gyro-mission6-7-11` has (the safety timers too). Only **3 typed-in numbers** are different.

> **Update (later on 2026-10-23): there are now two route-fix versions.** A closer look at the video showed our robot also slides about 6 cm in `turn 85`, where nothing touched it. This file is for a robot that does **not** slide like that. The other one, `gyro-mission6-7-11_routefix_creep`, is for a robot that does, and it's the one to try first. To find out which one fits our robot, run `turn-test` on the mat with tape (see `gyro-mission6-7-11_routefix_creep.md`).

## What we found in our video

We measured where the robot really was in our video, frame by frame, on a picture of the mat. (Grown-up details: `route-from-video.md`.)

In `turn 67`, the robot's front corner **caught the green and black model**. At first the robot could not turn at all: it slid backwards about **9 cm**. Then it turned, and slid about 5 cm more on the way. That's about **15 cm** in all.

> Everyday comparison: you try to spin around in a narrow hallway with a backpack on. The backpack hits the wall, so you get shoved back a step before you can turn.

Here is the surprise: our route **needed** that slide! Without it, the robot would have missed the leafcutter and Mission 11. In `turn 85` it slid again, about 6 cm, and that lined it up with Mission 11.

A slide is luck. It might be 10 cm one day and 20 cm the next. So the new file drives to the same places **on purpose**.

## The 3 changes

| Step | Block | Old | New | Why |
|---|---|---|---|---|
| 3 | `straight` up past the brown model | 47 | **35** | Stop 12 cm earlier, so `turn 67` has room. 47 minus 12 = 35 |
| 5 | `straight` over to the models | 32 | **29** | Lands where the push really started in the video |
| 8 | `straight` back up after the push | -6 | **-12** | Backs up the 6 cm that the second slide used to add |

Everything else is the same: B+A, 17.6 degrees per cm, the speeds, the turns, and the way home.

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app; blocks show 35, 29, -12; all 16 comments show | Claude, 2026-10-23 | ✅ |
| Simulator: robot never touches the green and black model | Claude, 2026-10-23 | ✅ in 162 of 162 runs (start moved ±2 cm, ±2°, turns 0 to 5° too far) |
| Simulator, robot that does not slide: push stops at the leafcutter, bumps the back of Mission 11, gets completely home | Claude, 2026-10-23 | ✅ in 20, 27, 24, 21, 18, 15 of 27 runs for turns 0, 1, 2, 3, 4, 5° too far |
| Simulator, robot that slides 6 cm in fast turns (like `turn 85` in the video) | Claude, 2026-10-23 | ❌ works in almost no runs. Use `gyro-mission6-7-11_routefix_creep` for that robot |
| **On the real robot and mat** | nobody yet | ❓ **Not tested** |

A simulator is not the real robot. Our numbers came from **one** video.

## Next physical test (needs a grown-up's OK before the robot moves)

1. Download to **slot 19** (not slot 0 or slot 1).
2. Start from the same spot as in our video.
3. Watch `turn 67` (step 4): does the robot turn without touching the green and black model?
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
| Touches the green and black model in `turn 67` | Make 35 smaller (try 33) | 3 |
| Touches Mission 11 while driving up | Make 35 bigger (try 37) | 3 |
| Goes past the top of Mission 11 without bumping it | Back 14 instead of 12 | 8 |
| Bumps Mission 11 too low, on its side | Back 10 instead of 12 | 8 |

All the other tips in `gyro-mission6-7-11.md` and the cheat sheet still work. The step numbers are the same. Only the numbers in steps 3, 5 and 8 are different: the cheat sheet shows 47, 32 and -6, and this file has 35, 29 and -12.

Keep `gyro-mission6-7-11` as our backup. Only replace it after this version works on the mat.
