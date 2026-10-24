# Turn creep and turn reliability: investigation (2026-10-23)

> **Update, later on 2026-10-23:** robot poses measured on video frames settle the creep [video]. In `turn 67` of the old gyro run, the robot jammed against the green and black (D2) model, slid about 9 cm back without turning (9.7 to 10.4 s), then turned while sliding about 5 cm more: about 15 cm in all. The route needed that slide to reach the leafcutter and Mission 11. Details, the route fix (`gyro-mission6-7-11_routefix.llsp3`) and the next physical test: [`route-from-video.md`](route-from-video.md). The rest of this document is the earlier investigation, unchanged.

Done by the coding assistant on 2026-10-23. No hub connection, no uploads, no robot motion.

Every finding is labelled with where it comes from:

| Label | Meaning |
|---|---|
| **[history]** | Recorded earlier by the user or in AGENTS.md. Not re-checked today. |
| **[file]** | Read from the current project files today. |
| **[video]** | Read by the assistant from the team video `videos/gyro_run1.MOV` (old gyro program, 2026-10-21): frames and sound. |
| **[sim]** | Browser simulator (`simulator/`). Ideal motors, model outlines are estimates. |
| **[test]** | Automated tests that ran today. |
| **[robot]** | Something seen on the real robot. **Nothing new today.** |

## 1. What exists now

| Program | Slot | Moves | Turn My Block | Status |
|---|---|---|---|---|
| `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` (original) | 0 | plain `move` | **old turn**: reset yaw, wait 0.5 s, spin at 5.2 %, stop when abs(yaw) > degrees [file] | Works on the mat, user report [history] |
| `..._uncover_turnfix.llsp3` | – | plain `move` | turnfix: reset yaw, wait 0.2 s, 8 + 0.4 × remaining, stop 1° early [file] | Working copy [history] |
| `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` | 1 | `straight` | turnfix style [file] | Ran 2026-10-14 [history]; jammed at Mission 11 in the 2026-10-21 video [video] |
| `gyro-mission6-7-11.llsp3` | 19 | `straight` | same speed math, no per-block yaw reset, safety timers [file] | Not run on the robot |
| `turn-test.llsp3` | 19 | – | old turn and new turn, 3 × 90° each, shows yaw on the hub [file] | Not run on the robot |

The original is the only program with a reported full working run. All four mission programs drive the same route: the gyro numbers are the original's distances × 20.5 / 17.5 [file, history].

Tools: browser simulator plus `node --test tests/` from `simulator/`; `tools/sim_path.py` (older Python path simulator) with `tools/test_sim_path.py`; hub replay scripts `tools/test_forward.py`, `test_turn.py`, `test_old_turn.py` (Python, need the hub and approval).

## 2. The backward creep during `turn 67`

The report [history]: during the original program's `turn 67` the robot sometimes creeps backward, finishes turning, and carries on. It happens on the printed river, near the green-and-black model, not touching the middle brown model. [video] The middle brown model with flowers is **Mission 11** (its root cover falls when the robot bumps its back at about 23.6-24.2 s). The green-and-black model is a different one, next to the river. A floor replay of the old turn (`tools/test_old_turn.py`, no models around) showed no creep and no net wheel roll.

The four possible causes, checked one by one:

| Cause | Evidence | Verdict |
|---|---|---|
| **(a) The wheels really roll backward** | [file, test] In all three mission programs, every turn tells the wheels equal and opposite speeds (new regression test: average wheel roll and centre movement stay under 0.5 for all 6 turns, at 0° and 5° overshoot). [history] The floor replay measured zero net wheel roll. | **Unlikely**, high confidence for the code. A collision can still push the wheels backward, which a hub encoder log would show. |
| **(b) Unequal wheels make the robot slide** | [sim] In `turn 67` each wheel rolls about 65-88 mm (track 112-150 mm). Creeping 1 cm takes the two wheels running about 12-15 % apart on average. [history] On the floor they matched. | **Possible, less likely** (medium-low). Mat friction at 5.2 % is not measured. |
| **(c) Gyro overshoot** | A turn that goes too far rotates the robot; it doesn't slide it. [history] The old turn settles about 1° past; the turnfix-style turn about 2° past (Python replays). | **Not a creep cause by itself** (high confidence). But more overshoot means more contact: [sim] `turn 67` touches in 10 of 45 start poses at 0° overshoot and 25 of 45 at 5°. |
| **(d) The robot bumps a model while it spins** | [sim] The original program's `turn 67` brings the robot's **front** (front side or front corners) to the D2-dock outline in **71 of 180** runs, starting within ±2 cm and ±2° of the measured start with 0-5° overshoot. A front contact pushes the robot **backward**, the reported symptom. [video] During `turn 67` and `turn 36` the robot's corner sits right beside the green-and-black model. The camera angle can't show whether they touch. Real `turn 67` took about **2.9 s** where the simulator takes 0.78 s (3.7×), slower than `turn 85` (about 2.4 s for a bigger turn), so something may have slowed it. [history] Creep only on the mat, only "sometimes", never on the floor. | **Leading explanation, medium confidence.** Not proven. |

What the (d) result depends on:
- **Plain moves going about 17 % further than typed.** This is the team's working hypothesis, and the gyro conversion supports it. If plain moves go exactly as typed, the simulated `turn 67` touches in only 1 of 180 runs.
- **The outlines.** They were read off the wireframe and are good to about 5 mm. The real model may stick out further, which makes contact more likely.
- **The robot's body box,** centred on the wheels. The real body offset isn't measured.
- **Which real model sits at dock D2.** The simulator's D2 and lower Mission 10 outlines are where the green-and-black model is in the video, but the names are inferred.

The same route has the same problem in the newer programs [sim]: the gyro mission touches at `turn 67` in 65 of 180 runs and gyro-mission6-7-11 in 68 of 180. At `turn 36` the left side or back-left corner reaches the lower Mission 10 outline in about 85 % of runs for all of them. Full numbers: `simulator/test-results/turn-clearance-sweep.txt`.

## 3. Real Word Blocks vs simulator vs Python replay

| Behaviour | Real Word Blocks on the hub | Browser simulator | Python replay (`tools/test_*.py`) |
|---|---|---|---|
| Wheel speeds each turn asks for | From the blocks | **Same blocks, run exactly** [test] | Re-typed in Python (same formulas) |
| Stop rule of each turn | From the blocks | **Exact** | Re-typed |
| Loop speed | Not measured | Assumed: one loop pass per 5 ms step | 10 ms sleep per pass |
| Yaw resolution | Not measured (whole degrees?) | Assumed 0.1° | 0.1° (tilt_angles / 10) |
| Speeding up, braking, coasting | Real motors; the app has a hidden movement acceleration setting (default "medium") and "brake at stop" [file: SPIKE palette] | **Instant**, plus an optional overshoot setting (5° in the Team robot profile) | Real motors |
| Straight timing | [video] about the simulated time (push about 4.1-4.3 s vs 4.08 s) | 10.5 deg/s per % (estimate) | Real |
| Turn timing | [video] **2-3.7× slower** than simulated | Same 10.5 deg/s per %, track 112 mm (both unmeasured) | Real |
| Plain `move` distance | 17 % further (team hypothesis) | Choice: as typed, or the team guess | `move_for_degrees` with the 17.5 cm guess |
| Models and contact | Real models | Optional outlines (estimates); measure or pause | Floor only, no models |
| Wheel slip, unequal wheels | Possible | None | Measured on the floor: none |
| Robot shape | Real LEGO shape | Box 184 × 168 mm, centred on the wheels | Real |

So the simulator is trustworthy for **what the program tells the wheels** and for **straight-line timing**. It is only an estimate for **turn timing, coasting and contact**.

**Where the simulated route goes wrong** [sim, video]: `mission6-7-11-routes.png` draws both routes. In the simulator, the push (step 7) ends about 15-20 cm short of the leafcutter outline, and the Mission 11 bump (steps 10-11) ends with the robot front about 11 cm short of the Mission 11 outline (robot centre about 25-30 cm from the model centre). The real robot reaches both (video, user). Steps 1-6 match the video better: during turns 67 and 36 the robot is beside the green-and-black model in both. So trust the simulator more for steps 1-6 than for the end. What-if runs (2026-10-23) show that no single missing effect closes the 11 cm Mission 11 gap. The gap shrinks to: push slipping to 15-20 cm of real travel, about 4-5 cm; `turn 36` twisted 10° further, 6 cm; every turn 10° further, 7.6 cm; start pointing 3° differently, 8 cm. Several small effects together are enough, and errors add up along the route, so the last steps are the least accurate. The fix is to measure the real robot at the end of steps 6, 7 and 10 once, then tune the simulator to match. Contact during turns 67 and 36, which the simulator can't model, is one possible reason the real route bends differently afterwards. Unmeasured track width, model positions and pushing slip are others.

`tools/sim_path.py` (the older Python path simulator) **cannot** follow gyro-mission6-7-11 or turn-test. Their My Blocks sit inside an `if`, which it skips, so their paths come out without any turns [test]. Use the browser simulator for those.

## 4. gyro-mission6-7-11 and the safety timers

| Risk | Evidence | Size |
|---|---|---|
| Same route as the original, so the same contact risk at `turn 67` and `turn 36` | [sim] section 2 | **High, if (d) is right** |
| New failure: if rubbing slows `turn 67` past its time limit (2 + 67 / 30 = 4.23 s), the turn stops short | [video] the old gyro's `turn 67` took about 2.9 s with its 0.2 s wait, so about 1.6× headroom | Medium |
| The turn goes further than the old turn | [history] replay: about 91.9° vs 91.1° for a 90. [sim] about +3° per turn keeps the route within about 3 cm of the original; +6° moves it about 10 cm. The video's "about 5° per turn" may include rotation from contact | Medium, measure with `turn-test` |
| `straight` timer uses an unmeasured 10.5 | [video] straights take about the simulated time, so the 2× margin holds | Low |
| A timer that fires makes no sound, so nobody knows it happened | [file] | Low, but slows debugging |
| `tools/sim_path.py` shows wrong paths for this file | [test] | Low (use the browser simulator) |

Time limits against the real turn times read from the video: `turn 20` 2.67 s limit vs about 0.6 s; `turn 67` 4.23 vs about 2.7; `turn 36` 3.2 vs about 1.0; `turn 85` 4.83 vs about 2.3.

**Smallest useful next improvement:** none in code until the contact is confirmed. Then try one number at a time, on the mat, in a copy:
- [sim] Changing `straight 47` to **45** cuts `turn 67` contacts from 19 to 7 out of 54 runs, and moves the push and the bump about 2 cm.
- `straight 35` to 33 gives 10 of 54. `turn 20` to 18 gives 12 of 54.
- No single number clears `turn 36` (40-53 of 54 in every try). If `turn 36` really touches, the approach to the leafcutter needs a small re-plan.

Optional, with approval: a short beep when a safety timer ends a turn or straight, so timeouts show up during testing.

## 5. Checks that ran today

| Check | Result |
|---|---|
| `node --test tests/` (from `simulator/`) | **55 pass**, 0 fail (4 new tests for turn records) |
| `python3 tools/test_sim_path.py` | "sim_path ok" (under `python3 -I` it fails with ModuleNotFoundError; run it as AGENTS.md says) |
| `python3 tools/sim_path.py` on every project | Runs. Paths for gyro-mission6-7-11 and turn-test have no turns (see section 3) |
| `node tools/turn_clearance_sweep.js` on original, gyro and 6-7-11 | 180 runs each, see section 2 |
| Browser simulator, original program, Team robot settings, D2 outline ticked | Run pauses at 6.11 s in `turn 67`, wheels 5 % / -5 %, touching D2 |
| Builders | Both still refuse to overwrite their output |

## 6. What to do next, most important first

| # | Work | Why | Confidence |
|---|---|---|---|
| 1 | **Physical A/B test for contact** (below) | Decides between (d) contact and (b) sliding, using gyro-mission6-7-11 (same route as the original). Also shows where it really bumps Mission 11 | High value |
| 2 | Run `turn-test` (slot 19) | Measures the real overshoot of the old and new turn: decides whether gyro-mission6-7-11 copies the original route | High value |
| 3 | Measure track width (ruler: wheel centre to wheel centre) and where the wheels sit in the body | Fixes the simulator's turn timing and contact geometry | Medium |
| 4 | If contact is confirmed: try `straight 47` to 45 in a copy, then re-check `turn 36` | Fewest touches in the simulator for a 2 cm route change | Medium (simulated only) |
| 5 | Run gyro-mission6-7-11 5 times (table in `gyro-mission6-7-11.md`) | The real check of the safety timers | – |

### The exact next physical test (needs an adult's OK, about 15 minutes)

Uses **gyro-mission6-7-11 in slot 19**. It drives the same route as the original, and the simulator gives the same contact risk at `turn 67` (68 of 180 runs). The original in slot 0 stays untouched (the user's choice, 2026-10-23).

1. Start position: robot's back on the mat edge, left side on the 20 cm tick, square to the edge.
2. Film from **straight above** (phone held over the table), from the start until the robot finishes `turn 36`.
3. Run it **6 times with every model in place**. Each time write down: did it touch the green-and-black model during `turn 67`? During `turn 36`? Did it creep backward? Did step 10 hit **the back of Mission 11**, and did the window drop?
   On one run, put a pencil dot (or a small piece of tape) next to the robot's back corners at the end of step 10 (the bump). Measure the dots from the bottom wall and the right edge of the mat. These numbers let the simulator be corrected: today it ends the bump about 11 cm short of Mission 11.
4. **Lift the green-and-black model off the mat** (put it back afterwards) and run it **6 more times**. Write down the same things.

What the results mean:

| Result | Meaning | Next |
|---|---|---|
| Creep only when the model is there, and you see a touch | (d) contact | Try `straight 47` to 45 in a copy (needs approval) |
| Creep also without the model | (b) sliding or uneven wheels | Hub log with `tools/test_old_turn.py` changed to turn 67 (needs approval and Bluetooth) |
| No creep in 12 runs | Not repeatable today | Keep the video, try again on another day |

## For the team (plain words)

Sometimes the robot slides backward a little while it turns. We checked four reasons:

1. **The program tells it to back up.** No. We checked every turn: the wheels always spin the same amount in opposite directions, like a tank turning on the spot.
2. **One wheel is faster.** Probably not. On the floor, both wheels matched.
3. **It turns too far.** That changes where it points, not where it is. But turning too far makes reason 4 more likely.
4. **It bumps a model.** Most likely! In the simulator, the front of the robot reaches the green-and-black model next to the river during `turn 67` in about 4 out of 10 runs. When the front of a spinning robot hits something, it gets pushed backward, like when you spin around in a crowd and someone is in the way.

To be sure, we do an experiment: run the mission 6 times with the model there and 6 times without it, and film from above. If the backward slide only happens with the model there, we've found it.
