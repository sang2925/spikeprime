# gyro-mission6-7-11_routefix_creep_push28_back10: back up more before turning to Mission 11

This is a new copy of `gyro-mission6-7-11_routefix_creep_push28.llsp3`. That file was not changed. The new file downloads to **slot 19**, our test slot.

## What changed

| What | Before | Now | Why |
|---|---|---|---|
| Step 8, back away from the leafcutter | `straight -6` | `straight -10` | So the turn in step 9 does not catch on the ant |
| The step 8 note | tips for -6 | new tips for -10 | Matches the new number |

Everything else is the same: B+A, 17.6 degrees per cm, the speeds, the push (28), the turns, and the way home.

## What went wrong in our two videos (25 October)

Both runs missed Mission 11's window. Here is what the frames show:

1. After the push, the front of the robot is right against the ant.
2. Step 8 backs up only 6 cm.
3. Step 9 (`turn 85`) spins right. The front-left corner of the robot swings round and **catches on the red ant**.
4. The turn stops about 15 to 20 degrees too early.
5. Step 10 (`straight 15`) now points the wrong way. The robot drives past Mission 11 instead of into it.

> Everyday comparison: opening a car door in a tight parking space. If you are too close to the next car, the door hits it. Back the car out a little first, and the door swings open.

Why were the two runs so different? In run 1 the robot stayed stuck on the ant until its safety timers ran out. In run 2 it slipped free, but it was now facing the wrong way, so the rest of the route was off. It hit Mission 12 on the way home. Same problem, different ending.

One more thing: in both videos the ant was already pushed in before the run started (someone forgot to reset it). So the robot was not pushing anything in step 7. That is still useful: it shows where the robot ends up after a good push.

## Why -10?

We measured where the robot ended the push in both videos. Then the simulator tried different back-up numbers from that spot, 27 times each, with small differences in where the robot starts.

| Step 8 | Good runs out of 27 (about) | What goes wrong |
|---|---|---|
| -6 (old) | 9 to 15 | The turn catches on the ant |
| -8 | 13 to 17 | Still catches on the ant sometimes |
| **-10** | **18 to 23** | Best |
| -12 | 11 to 25 | Good in some tests, not others |
| -14 or -16 | 4 to 21 | Too far back: the robot gets close to Mission 10 |

Worked example: backing up 10 cm instead of 6 cm moves the robot 4 cm further from the ant before it turns. The corner needs about 3 cm of room to swing past.

Step 10 (`straight 15`) did not change the result much, because the robot stops when it hits Mission 11. So we left it alone.

## If it does X, try Y (change ONE number at a time)

| What you see | Step | Try |
|---|---|---|
| Step 9 still catches on the ant | 8 | -12 |
| Goes past Mission 11 without bumping it | 8 | -8 |
| The ant does not reach the nest | 7 | First check the robot hits the ant straight on, then try 30 |
| Leaves fall out of the nest | 7 | 26 |
| Touches the green and black model when it turns | 3 | 38 |

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app; step 8 shows -10; all 28 notes show; no errors | Claude, 2026-10-25 | ✅ |
| Only step 8's number and its note are different from `routefix_creep_push28` (checked by the build tool) | Claude, 2026-10-25 | ✅ |
| Simulator, starting from where the real robot ended the push | Claude, 2026-10-25 | ✅ 18 to 23 good runs out of 27 (the old -6 got 9 to 15) |
| Does `straight 28` push the ant all the way from its start line? | nobody yet | ❓ Our videos started with the ant already pushed in |
| **On the real robot and mat** | nobody yet | ❓ **Not tested** |

## Next test (needs a grown-up's OK before the robot moves)

1. **Reset the leafcutter**: put the ant back on the thin black line on the mat.
2. Check that Mission 11's window is up.
3. Download this file to **slot 19** (not slot 0 or slot 1).
4. Start from the usual spot: back of the robot on the bold black launch line, left side on the black tick line.
5. Run it 5 times. Film from above if you can. Reset the ant and the window every time.

| Run | Ant touching nest? | Leaves still in? | Turn after the push caught on the ant? | Window dropped (Mission 11)? | Got home? | Notes |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

A simulator is not the real robot. Keep `gyro-mission6-7-11_routefix_creep_push28` as the backup until this one works on the mat.
