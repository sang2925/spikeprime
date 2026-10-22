# Cheat sheet: tweaking gyro-mission6-7-11

Use this when the robot *almost* does the mission and needs a small fix.

## The 5 golden rules

1. **Change ONE number at a time.** If you change two, you won't know which one helped.
2. **Fix the FIRST thing that goes wrong.** If the robot is already off at step 3, fixing step 9 won't help.
3. **Small changes.** Try 1 to 3 cm, or 2 to 5 degrees.
4. **Run it 3 times** before you decide. The robot is a bit different every run.
5. **Write it down** in the log at the bottom. Download to **slot 19** only.

## How to change a number

Click the white number bubble, type the new number, and press Enter. That's it.

## The two blocks you will change

| Block | Number | What it means | Example |
|---|---|---|---|
| `straight 35 cm at speed 50` | **35** | How far to drive, in cm. Minus = backwards. | 35 → 37 drives 2 cm further |
| | **50** | How fast. 13 = very slow, 100 = full speed. | Leave these alone unless pushing too hard |
| `turn 20` | **20** | How many degrees to turn. Plus = right, minus = left. | 20 → 22 turns 2° more to the right |

**Right and left** are from the robot's point of view. Stand behind the robot, looking the way it drives.

**Handy rule:** 2 degrees of turn moves the robot about **1 cm sideways** after 30 cm of driving.

## The mission, step by step

| Step | Block | What the robot does |
|---|---|---|
| 1 | `straight 35 cm at speed 50` | Leaves base |
| 2 | `turn 20` | Turns a little right |
| 3 | `straight 47 cm at speed 50` | Drives toward the models |
| 4 | `turn 67` | Turns right |
| 5 | `straight 32 cm at speed 50` | Drives past the brown model |
| 6 | `turn 36` | Aims at the leafcutter |
| 7 | `straight 30 cm at speed 13` | **Slowly pushes the leafcutter** (Missions 6 and 7) |
| 8 | `straight -6 cm at speed 13` | Backs up a little |
| 9 | `turn 85` | Turns right, toward Mission 11 |
| 10 | `straight 15 cm at speed 13` | **Gently bumps Mission 11**, so the window drops |
| 11 | `straight -18 cm at speed 13` | Backs up |
| 12 | `turn -20` | Turns a little left |
| 13 | `straight 35 cm at speed 100` | Hurries home |
| 14 | `turn 50` | Turns right |
| 15 | `straight 59 cm at speed 100` | Drives into base |

## If it does this, try that

| What you see | Which step | Try |
|---|---|---|
| Doesn't reach the leafcutter | Step 7 | 30 → 32 |
| Pushes the leafcutter too far | Step 7 | 30 → 28 |
| Arrives too far **left** of the leafcutter | Step 6 | 36 → 38 (turn more right) |
| Arrives too far **right** of the leafcutter | Step 6 | 36 → 34 (turn less right) |
| Bumps the brown model with its **right** side | Step 4 | 67 → 65 |
| Bumps something with its **left** side on the way up | Step 4 | 67 → 69 |
| Doesn't touch Mission 11, so the window stays up | Step 10 | 15 → 17 |
| Hits Mission 11 too hard | Step 10 | 15 → 13 |
| Passes Mission 11 on the **left** | Step 9 | 85 → 87 |
| Passes Mission 11 on the **right** | Step 9 | 85 → 83 |
| Stops short of base | Step 15 | 59 → 62 |
| Misses base to the **left** | Step 14 | 50 → 52 |
| Misses base to the **right** | Step 14 | 50 → 48 |

**The turn rule:** robot too far **left**? Make the turn number **bigger**. Too far **right**? Make it **smaller**. (For a minus turn like `turn -20`, "bigger" means closer to 0, for example -20 → -18.)

## Always the same: DON'T change these

| Block or number | Why |
|---|---|
| `set movement motors to B+A` | A+B makes our robot drive **backwards** |
| `set yaw angle to 0`, `wait 0.2`, `set heading to 0` at the start | Sets up the gyro once |
| **17.6** inside `straight` | Measured on our mat: 17.6 wheel degrees = 1 cm |
| **540**, **360**, **180** | Math that keeps the gyro numbers working |

## Expert knobs inside the My Blocks (ask a coach first)

| What you see | Change | Where |
|---|---|---|
| Normal drives stop too early | Time limit **2** → **3** | `straight`, repeat until |
| Pushes Mission 11 too long | Time limit **2** → **1.5** | `straight`, repeat until |
| Turns go too far | **8** → **6** | `turn`, start moving |
| A turn gets stuck before the end | **8** → **10** | `turn`, start moving |
| Wiggles while driving straight | Steering **2** → **1** | `straight`, start moving |
| Curves while driving straight | Steering **2** → **3** | `straight`, start moving |

## Test log

| Date | Step changed | From → To | Run 1 | Run 2 | Run 3 | Better? |
|---|---|---|---|---|---|---|
| | | → | | | | |
| | | → | | | | |
| | | → | | | | |
| | | → | | | | |
