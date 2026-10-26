# gyro-mission6-7-11: the gyro mission with safety timers

This is a new copy of our gyro mission (`Harrison_Lucas_Kai_leafcutter_gyro.llsp3`). The old file was not changed. The new file is `gyro-mission6-7-11.llsp3`. It is set to download to **slot 19**, our test slot.

## What the robot does

The route is the same as before:

1. Leave base and drive up past the brown model (speed 50).
2. Slowly push the leafcutter model: Missions 6 and 7 (speed 13).
3. Back up, turn, and gently bump Mission 11 so the window drops (speed 13).
4. Back up, turn, and drive home fast (speed 100).

Every typed-in number is the same as in the gyro mission.

## Why we needed a new version

In our video, the gyro mission bumped Mission 11, the window dropped, and then the robot **stopped forever**. It never backed up or drove home.

The `straight` block drives until wheel B has turned enough. For the bump, that's 15 times 17.6 = 264 degrees. Mission 11 stopped the robot before it got there. The wheel never reached 264, so the block kept waiting, forever.

> Everyday comparison: you're told "walk 20 steps, then turn around", and a wall is in the way at step 12. A sensible person turns around anyway. Our old block kept pushing against the wall, counting.

(Frames from our video show it: at 22.0 seconds the root cover of Mission 11, the brown model with flowers, is up. The robot bumps the back of the model at about 23.6 seconds, and at 24.2 seconds the cover is down on the mat. So Mission 11 worked. The only problem was that the robot kept pushing afterwards.)

## What changed

### 1. Safety timers (the main fix)

Each `turn` and `straight` now stops when it is **done OR when time is up**, whichever comes first.

| Block | Time limit | Example |
|---|---|---|
| `turn` | 2 + abs(degrees) divided by 30 seconds | turn 90: 2 + 3 = 5 seconds |
| `straight` | (abs(cm) times 17.6) divided by (abs(speed) times 10.5), times 2, plus 0.5 seconds | straight 15 at speed 13: 264 divided by 136.5 = about 1.9; 1.9 times 2 + 0.5 = **about 4.4 seconds** |

(`*` means times and `/` means divided by.)

The number 10.5 is a **guess** for how many degrees per second the wheel turns for each 1% of speed. We have not measured it.

### 2. Yaw is set to 0 only once

The old blocks did "set yaw angle to 0, wait 0.2 seconds" at the start of **every** turn and straight. Now we do it once, at the start of the program. That saves about 3 seconds.

Instead, each block starts with **set heading to yaw**: "start from where I really point right now". That does the same job as resetting yaw, without the wait.

| Variable | Meaning |
|---|---|
| `heading` | The way we **want** the robot to point |
| `error` | How many degrees the robot still has to turn to face heading. Plus = right, minus = left |

**Worked example:** the robot really points at yaw 22. `turn 67` sets heading to 22, then adds 67: heading = 89.

```text
error = ((heading - yaw + 540) mod 360) - 180
```

**Worked example:** heading 89, yaw 80. 89 minus 80 plus 540 = 549. 549 mod 360 = 189. 189 minus 180 = **9**, so turn 9 more degrees right.

Why the `+ 540`, `mod 360`, `- 180`? Yaw jumps from 180 to -180 when the robot turns past "backwards". `mod` fixes that jump, like a clock going from 12 back to 1. The answer is always between -180 and 180.

### 3. When does `turn` stop?

When the robot is within 1 degree of heading, **or has already gone past it**. That's the same rule as the turn that worked on our robot.

**Worked example (turn 90, a right turn):** direction = 90 divided by abs(90) = 1. Error 30 times 1 = 30: keep turning. Error 0.5: stop. Error -2 (2 degrees too far): stop.

### 4. Safety checks

- `turn 0` does nothing. (The old block divided by 0.)
- `straight 0`, or speed 0, does nothing. (Same reason.)
- `turn` gets its direction from `degrees`, never by dividing by `error`. Error can be exactly 0, and dividing by 0 could stop the program.

## Something we tried and did NOT keep: the heading lock

We tried a "heading lock" that fixes turns that go too far. In our video, our robot's turns go about **5 degrees too far**, every time. But our numbers were tested on the mat **with** those extra degrees. The simulator showed that "fixing" them moves the leafcutter push about 12 cm and the Mission 11 bump about 9 cm. So we kept the turns working like before.

**Update (2026-10-23):** a closer look at the same video shows the turns are better than we thought. The first turn (`turn 20`) went about 4 degrees too far. But after four turns, the robot pointed within about 1 degree of where the typed numbers add up to. The big surprise was a slide, not the turns: see `gyro-mission6-7-11_routefix.md`. Our `turn-test` program will measure the turns properly.

> Everyday comparison: your basketball throw always pulls a little left, so you learned to aim a little right. If someone suddenly fixes your arm, you start missing.

We can try the heading lock again later. Then we would re-test every turn number on the mat.

## What stayed the same

- Movement motors are still **B+A**. A+B drives our robot backwards.
- 17.6 degrees per cm (measured on the mat).
- The turn speed math: 8 + 0.4 times (degrees left).
- The straight steering strength: 2.
- All the numbers in the mission, and the route.

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app (Chrome); every block and comment shows | Claude, 2026-10-21 | ✅ |
| Simulator: whole mission runs to the end | Claude, 2026-10-21 | ✅ |
| Simulator: same route as the old gyro mission, with perfect turns and with turns 5 degrees too far | Claude, 2026-10-21 | ✅ End within 2 cm and 2 degrees |
| Simulator: robot pinned at Mission 11 during the bump | Claude, 2026-10-21 | ✅ Gave up after about 4.4 s, backed up, got home. (The old gyro mission waited forever.) |
| **On the real robot and mat** | nobody yet | ❓ **Not tested** |

A simulator is not the real robot. It has no real wheels, no slipping, and no real models to push.

## Next physical test (needs a grown-up's OK before the robot moves)

1. Download to **slot 19** (not slot 0 or slot 1).
2. Start from the same spot as in our video.
3. Run it 5 times. Write down each run:

| Run | Leafcutter pushed? | Window dropped? | Backed up after the bump? | Got home? | Notes |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## If it does X, try Y (change ONE number at a time)

| What you see | What to try | Where |
|---|---|---|
| A normal drive stops too early | In the straight time limit, change **2** to **3** | `straight`, repeat until |
| Pushes Mission 11 too long | In the straight time limit, change **2** to **1.5** | `straight`, repeat until |
| Turns go too far | Change **8** to **6** | `turn`, start moving |
| A turn stalls before it finishes | Change **8** to **10** | `turn`, start moving |
| Robot wiggles while driving straight | Change the steering **2** to **1** | `straight`, start moving |
| Robot still curves while driving straight | Change the steering **2** to **3** | `straight`, start moving |

Keep the gyro mission as our known-good backup. Only replace it after this version works on the mat.
