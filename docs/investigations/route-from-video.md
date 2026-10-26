# Where the real robot went: the team video vs the simulator

Written 2026-10-23 by the coding assistant, and updated the same day after more frames were measured. Sources: the team video `videos/gyro_run1.MOV` (the old gyro mission, `Harrison_Lucas_Kai_leafcutter_gyro.llsp3`), its sound, the official mat picture, and the simulator. **Nothing here was tested on the robot.**

Picture: [`route-from-video.png`](route-from-video.png). Green = the real robot. Orange = the simulator running the old numbers with the turn-slide model. Purple = `routefix` with no slide. Blue = `routefix_creep` with a 6 cm slide.

## Short answer

The real route worked because the robot **slid** in its turns, and the simulator's wheels never slip:

1. In `turn 67`, the front corner caught the green and black D2 model. The robot slid about **9 cm** back before it could start turning, then about 5 cm more while turning: **15 cm** in all.
2. In `turn 85`, nothing touched the robot, but it still slid **6.5 ± 1 cm** back as the turn started.
3. `turn 20` (a slow-starting turn) did not slide.

The team turn starts at 8 + 0.4 × degrees % speed, so big turns start fast: `turn 85` at 42%, `turn 67` at 35%, `turn 36` at 22%, `turn 20` at 16%. **Turns that start fast slide back.** The team saw this before ("sometimes creeps backward during `turn 67`", AGENTS.md section 18).

There are now two route fixes. Both change only typed-in numbers of `gyro-mission6-7-11` (the safety-timer version):

| File | Numbers (steps 3, 5, 8) | Made for | Simulator says |
|---|---|---|---|
| **`gyro-mission6-7-11_routefix_creep.llsp3`** | **40, 28, back 6 (unchanged)** | a robot that slides about 4-7 cm when a fast turn starts (what the video shows) | works in most runs with 4.5-7.5 cm of slide; fails if the robot does not slide and the turns stop short |
| `gyro-mission6-7-11_routefix.llsp3` | 35, 29, back 12 | a robot that only slides when it hits a model | works well with no slide; fails with the slide the video shows |

**Use `routefix_creep` first.** Run `turn-test` with tape first if you can (see "Next physical tests"): if the robot comes back within 2 cm of its tape marks, use `routefix` instead.

## How the real poses were measured (video, not a hub test)

- Frames were matched to the official top-down mat picture (`simulator/assets/bioglow-field-setup-guide.pdf`, page 2) with OpenCV SIFT features and a RANSAC homography, which maps each video pixel to a point on the mat.
- Checks: a printed bar end landed 8 mm from where the wireframe puts it. Measured robot edges come out 165-183 mm long against the real 184 and 168 mm. The simulator's model outlines, drawn back onto the frames, sit on the real models (saved in `test-results/route-from-video/`, git-ignored).
- Two or three points on the robot's bottom edges were picked on each frame (about ±2-3 cm, ±5°). The start pose (2099, 286) mm facing 180° comes from the launch-area edge marks.
- The sound shows when each block runs (motor noise; `straight` at 50% is loud, turns quieter, 0.2 s silent waits between blocks).

| Video time | Block | Real robot: centre (mm), heading | Notes |
|---|---|---|---|
| 6.6 s | end of `straight 35` | (1739, 279), 181° | where the simulator expects it (within 1-2 cm) |
| 7.6 s | end of `turn 20` | (1703, 286), 164° | no backward slide (the 6.6 s frame was 0.1 s before the straight finished) |
| 9.7 s | end of `straight 47` | (1288, 469), 156° | simulator: (1301, 443), 161° |
| 10.4 s | `turn 67`, jammed | (1343, 399), 157° | slid 9 cm, **not turned yet** |
| 11.0 s | `turn 67` | (1375, 432), 104° | now turning |
| 11.6 s | `turn 67` | (1389, 397), 99° | |
| 12.6 s | end of `turn 67` | (1404, 374), 91° | 15 cm from where the turn started |
| 15.2 s | `turn 36` | (1412, 669), 65° | |
| 19.4 s | end of the push | (1543, 875), 57° | went about 24 of 30 cm: the leafcutter lever stopped it |
| 20.9 s | end of `straight -6`, start of `turn 85` | (1515, 837), 59° | re-measured with a stronger homography (115 matched points) |
| 22.7 s | end of `turn 85` | (1487, 778), -27° | 6.5 cm from where the turn started; no contact in the frames |

Headings are world headings (0° = right, counterclockwise positive). In Word Blocks numbers the real turns land close to their typed values: 180 - 20 - 67 - 36 = 57 and 57 - 85 = -28.

## The turn-slide model in the simulator

New on 2026-10-23 (see `simulator/README.md`): **Turn creep** (Drive Settings) slides the robot straight back when a spin starts, by the setting × (start speed - 15%) / 27%. **Body offset** (Robot Placement) puts the middle of the body ahead of the wheel axle, so spins swing the body around the axle. Both default to 0.

Solving `turn 85` for both at once gives creep **58 ± 15 mm** and offset **8 ± 6 mm**: the body's middle is close to the axle. With creep 60 mm, the simulated old gyro run lands on average about 8 cm from the real poses, against about 15 cm without it. The rest is the extra slide from the D2 jam, which the simulator cannot make: with rigid outlines it can only push the robot about 3 cm.

Other new pieces: **Push** mode (models shove the robot aside instead of pausing the run; head-on the robot stalls, like the real push), the **front pusher** (42 mm out, 43 mm wide, 12 mm left of centre, from the frames) and the **leafcutter stop** outline (where the real push stopped; drawn back onto the frames it lands on a small red and black piece in front of the leafcutter model).

## How the route fixes were chosen and checked (simulated only)

Tool: `node tools/mission6_7_11_sweep.js [--creep=N] [--offset=N] <file.llsp3>` from `simulator/`. Each row runs 27 starts (±2 cm, ±2°) with Push, the pusher and every outline except the leafcutter body. A run is "all good" when the push stalls on the leafcutter stop, the bump touches Mission 11, no other model is touched, D2 stays clear, and the whole body ends inside the home arc (radius about 485 mm, measured on the wireframe; the rulebook takes a precision token if the robot is touched outside home).

All-good runs out of 27, for turn overshoot 0 / 1 / 2 / 3 / 4 / 5° (the simulator's own turns stop about 0.5-1° early, so the real robot's recorded 1.9° past is about 3° here). Saved outputs: `simulator/test-results/route-fix/` (git-ignored).

| Turn creep | `routefix_creep` (40 / 28 / -6) | `routefix` (35 / 29 / -12) | current `gyro-mission6-7-11` (47 / 32 / -6) |
|---|---|---|---|
| 0 (no slide) | 0 / 0 / 0 / 9 / 25 / 20 | 20 / 27 / 24 / 21 / 18 / 15 | 0 at every overshoot (touches D2) |
| 30 mm | 0 / 12 / 27 / 25 / 24 / 25 | 0 / 12 / 12 / 9 / 7 / 2 | |
| 45 mm | 13 / 27 / 27 / 26 / 24 / 14 | | |
| 60 mm (the video) | 23 / 27 / 27 / 24 / 20 / 5 | 0 / 0 / 1 / 1 / 0 / 0 | |
| 75 mm | 23 / 24 / 23 / 19 / 10 / 0 | | |

`routefix_creep` never touches D2 with 30 mm of creep or more (closest 3-28 mm in the worst run per row); with no creep it touches D2 in up to 9 of 27 runs at low overshoot. `routefix` never touches D2 without creep (closest 17 mm).

Body offset (creep 60 for `routefix_creep`, 0 for `routefix`):

| Body's middle vs the axle | `routefix_creep` | `routefix` |
|---|---|---|
| 15 mm behind | 13 / 24 / 25 / 26 / 24 / 12 | 10 / 26 / 27 / 27 / 24 / 21 |
| centred | 23 / 27 / 27 / 24 / 20 / 5 | 20 / 27 / 24 / 21 / 18 / 15 |
| 15 mm ahead | 26 / 22 / 17 / 12 / 6 / 0 | 21 / 24 / 20 / 15 / 9 / 5 |

Number searches (typed numbers 34-42 / 24-31 / -6 to -12, about 380 sets): no set works well both with and without the slide, because a 4 cm slide in `turn 67` moves the whole route more than the room between D2 and Mission 11. For the slide range the video allows (creep 45-75 mm, body offset 0-15 mm, overshoot 1-3°), 40 / 28 / -6 scored 85 of 108 runs with D2 at least 14 mm away. Higher scores came only with D2 closer: 41 / 28 / -6 scored 92 but came within 6 mm, and 42 / 27 / -6 scored 96 but touched it. The first try, 40 / 26 / -8, scored 61. Keeping back 6 works because `turn 85` adds its own 6 cm.

Also checked: automated tests (`tests/wordblocks.test.js`, both route fixes, 61 tests pass); both files opened in the SPIKE web app (`tools/spike_open_check.mjs`): the editor shows only the new numbers, B+A is kept, the 16 comments match the files, no errors.

## Limits

- One video, one run. The slides, the lever stop and the pusher size are estimates from it.
- **The body offset matters as much as the slide** and has never been measured. If the middle of the body sits well ahead of the axle, `routefix_creep` gets worse at higher overshoot (table above).
- The new files go straight into each turn after `stop moving`. The old program waited 0.2 s first (it reset yaw before every block). A turn that starts while the robot is still settling might slide differently.
- The push stalls where the leafcutter lever stops, which lines the robot up again. If the bump misses Mission 11, change the back-up number (step 8) first.
- A turn My Block that starts more gently (for example, a speed cap of about 25%) would probably remove the slide altogether. That changes every turn, so it would need the turn test and a re-tune, and was not done.

## Next physical tests (need the user, the robot, and approval before any download or motion)

1. **Ruler, no motion:** measure from the back of the robot to the centre of the wheel axle. Body offset = 92 mm minus that. Also measure wheel centre to wheel centre (track width).
2. **`turn-test` on the mat** (slot 19; see `turn-test.md`), with tape at the 4 corners and, if you can, a phone filming from above. It gives the overshoot (hub numbers) and the slide (how far the robot ends up from its tape).
3. Pick the file: slide 2 cm or more, `gyro-mission6-7-11_routefix_creep`; less than 2 cm, `gyro-mission6-7-11_routefix`. With a measured offset, re-run the sweep first: `node tools/mission6_7_11_sweep.js --offset=<mm> --creep=<slide cm × 10> ../gyro-mission6-7-11_routefix_creep.llsp3 ../gyro-mission6-7-11_routefix.llsp3`.
4. Download the chosen file to slot 19, start from the same spot as the video, run it 5 times, and fill in the table in its `.md` file. Watch `turn 67` (no touch on the green and black model) and where the bump hits Mission 11.
