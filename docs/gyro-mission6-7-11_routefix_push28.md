# gyro-mission6-7-11_routefix_push28: a gentler leafcutter push, and a note on every step

This is a new copy of `gyro-mission6-7-11_routefix.llsp3`. That file was not changed. The new file is set to download to **slot 19**, our test slot.

This one is for a robot that does **not** slide back when a fast turn starts. Try its partner, `gyro-mission6-7-11_routefix_creep_push28`, first: our video shows the robot sliding. The turn test with tape on the mat tells you which one fits our robot.

## What changed

| What | Before | Now | Why |
|---|---|---|---|
| Step 7, push the leafcutter | `straight 30` | `straight 28` | Push the lever a little less |
| Notes in the program | Big notes for PART 1, 2, 3 | Plus a one-line note beside **every** step | So you can see which step is which, and which number to change |

Everything else is the same: B+A, 17.6 degrees per cm, the speeds, the turns, and the way home.

## Why push less?

Mission 06 gives 10 points for each leaf fragment, but only if the fragments stay **inside the nest** (rulebook page 10). If the robot pushes the lever too far, the leaves fall out, and they score 0.

> Everyday comparison: pushing a full shopping cart into a wall. Push gently and stop, and everything stays in. Keep shoving, and the top bag tips out.

In our video, the lever stopped the robot after about **24 cm** of its 30. So with 30, the wheels kept pushing on a lever that could not move any more. With 28, the robot still reaches the lever, but presses on it for less time.

## The step notes

Open the file in SPIKE. Next to each block there is a small yellow note, like this:

`STEP 7: PUSH LEVER (28)`

- **STEP 7** = the step number. It matches the cheat sheet (steps 1 to 15).
- **PUSH LEVER** = what the robot is doing in that step.
- **(28)** = the number you would change.

Drag the note's bottom-right corner to make it bigger. Underneath are the "if it does this, try that" tips.

Steps 1, 6 and 12 already had the big PART 1, PART 2 and PART 3 notes on the left, so their step line is at the top of those.

## If it does X, try Y (change ONE number at a time)

| What you see | Step | Try |
|---|---|---|
| Leaves fall out of the nest | 7 | 28, then 26, then 24 |
| The ant does not reach the nest | 7 | 30 |
| Touches the green and black model when it turns | 3 | 35, then 33 |
| Goes past the top of Mission 11 without bumping it | 8 | back 13 instead of back 12 |
| Bumps Mission 11 too low, on its side | 8 | back 11 instead of back 12 |

Leave the speed at **13** in step 7. Slow keeps the leaves in.

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app; step 7 shows 28; all 28 notes show; no errors | Claude, 2026-10-24 | ✅ |
| Only step 7's number and the notes are different from `routefix` (checked by the build tool) | Claude, 2026-10-24 | ✅ |
| Simulator, robot that does not slide: pushes the lever, bumps Mission 11, gets home | Claude, 2026-10-24 | ✅ the same as with 30 (20, 27, 24, 21, 18, 15 good runs out of 27 for turns 0 to 5° too far) |
| Simulator, robot that slides 6 cm in fast turns | Claude, 2026-10-23 (30 cm version) | ❌ works in almost no runs. Use `routefix_creep_push28` for that robot |
| Do the leaves stay in the nest? | nobody yet | ❓ The simulator cannot tell. Only the real model can. |
| **On the real robot and mat** | nobody yet | ❓ **Not tested** |

## Next physical test (needs a grown-up's OK before the robot moves)

1. With the model on the mat, push the lever slowly by hand. Mark three spots: where the lever starts, where the ant first touches the nest, and where leaves start to fall out.
2. Download this file to **slot 19** (not slot 0 or slot 1).
3. Start from the same spot as in our video. Run it 5 times and fill in:

| Run | Push number | Ant touching nest? | Leaves still in? | Window dropped (Mission 11)? | Got home? | Notes |
|---|---|---|---|---|---|---|
| 1 | 28 | | | | | |
| 2 | 28 | | | | | |
| 3 | 28 | | | | | |
| 4 | 28 | | | | | |
| 5 | 28 | | | | | |

A simulator is not the real robot. Keep `gyro-mission6-7-11_routefix` as the backup until this one works on the mat.
