````markdown
# AGENTS.md: LEGO SPIKE Prime projects

## Purpose

Help our team build, understand, edit, and test LEGO SPIKE Prime Word Blocks programs.

Also help us build a local browser-based 2D route-planning simulator.

The students are 10–12 years old. Explain things in plain words. Use short sentences, clear tables, worked examples, and everyday comparisons.

Create actual files when asked. Do not give only a plan when the task is to build or edit something.

## Start here (status at end of 2026-10-21)

Read this first in a new session. Details are in sections 4 and 14.

**Newest (2026-10-23): two route fixes, picked by one mat measurement.** Evidence and full tables: `docs/route-from-video.md` and `docs/route-from-video.png`. The user asked the assistant to work out the route from the video without asking questions, to keep AGENTS.md updated as it went, and to keep going until the result was verified. A separate file was approved. Nothing was run on the robot.

- **What the video shows** (13 frames matched to the official mat picture with SIFT + homography, about ±2-3 cm; block times from the motor sound): the old gyro run only reached the leafcutter and the back of Mission 11 because it **slid**. In `turn 67` the front-right corner jammed on the green and black D2 model: 9 cm of sliding before it turned, 15 cm in all. In `turn 85`, with nothing touching it, it slid **6.5 ± 1 cm** (re-measured with 113-115-point homographies). `turn 20` (slow start) did not slide. Slide grows with the turn's start speed (8 + 0.4 × degrees %). Solving `turn 85` for both unknowns gives creep about 58 ± 15 mm for a 42% start and a body offset of about 8 ± 6 mm (body's middle slightly ahead of the axle). Outlines drawn back onto the frames sit on the real models (`test-results/route-from-video/`, git-ignored).
- **`gyro-mission6-7-11_routefix_creep.llsp3`** (try first; `.md` notes): straight 47 to **40**, 32 to **28**, back 6 kept. For a robot that slides about 4-7 cm in fast turns. Simulated all-good runs out of 27 for overshoot 0-5°: creep 45 → 13/27/27/26/24/14; creep 60 → 23/27/27/24/20/5; creep 75 → 23/24/23/19/10/0; no creep → 0/0/0/9/25/20 (can touch D2).
- **`gyro-mission6-7-11_routefix.llsp3`** (`.md` notes): 35 / 29 / back 12. For a robot that does not slide: no creep → 20/27/24/21/18/15, never touches D2; creep 60 → 0/0/1/1/0/0.
- Both are built by `python3 -I tools/build_mission6_7_11_routefix.py [routefix|routefix_creep]` from `gyro-mission6-7-11.llsp3` (read-only; refuses to overwrite; checks that only the intended numbers and comments differ). Both opened in SPIKE (`tools/spike_open_check.mjs`): the editor shows only the new numbers, B+A is kept, the 16 comments match, no errors. Slot 19. An unused first build of the creep version (40/26/-8) is in `test-results/backups/` (git-ignored).
- **Simulator additions** (61 tests pass): Push mode, the front pusher, the `m0607stop` outline (where the real push stopped), Turn creep (Drive Settings; `turnCreepMm`), Body offset (Robot Placement; `body.offsetMm`), and the repeatable sweep `node tools/mission6_7_11_sweep.js [--creep=N] [--offset=N] <files>` (outputs in `simulator/test-results/route-fix/`, git-ignored).
- **Simulator buttons added 2026-10-24** (user request): **Video match settings** (Program panel; sets creep 60, overshoot 2°, offset 0, Push, pusher, walls and all outlines except `m0607`, so the page matches `docs/route-from-video.png`; the page defaults have creep 0, Push off and outlines off, which is why `routefix_creep` looked different there) and **◀ Previous block** next to Next block (replays from the start to the previous Next stop, without animating; checked in the browser that it lands on the identical time and pose). 61 tests still pass.
- **Leafcutter push depth (2026-10-24, user concern, open):** Mission 06 scores 10 per leaf fragment only while the fragments stay contained in the nest (rulebook p. 10: "move too quickly, and you may scatter the leaves"). Step 11 is `straight 30 at speed 13` in every 6-7-11 version; the real robot stalled after about 24 cm, so it pushes until the lever stops it, not to a planned depth. The simulator's `m0607stop` outline sits about 2.8 cm past the thin lever line printed on the wireframe (wireframe px about (2275,887)-(2309,920)), i.e. the sim copies the video's push depth. Whether the video run kept the leaves is not visible in the footage. Needed: mark on the real model where the lever starts, where the ant first touches the nest, and where fragments start to fall out; then set step 11 to stop between the last two (needs approval).
- **Push 28 + step notes (2026-10-24, user asked "guess for now" and for a note on every step):** `gyro-mission6-7-11_routefix_creep_push28.llsp3` and `gyro-mission6-7-11_routefix_push28.llsp3` = the route fixes with step 7 (leafcutter push) 30 to 28, plus a one-line note beside each of the 15 steps ("STEP 7: PUSH LEVER (28)": step, what it does, the number to change; drag the note's corner for tips). Steps 1, 6, 12 have their line at the top of the PART 1/2/3 notes. Built by `python3 -I tools/add_step_notes.py <src> <out> --push=28` (refuses to overwrite; reopen check: only the push number and comments differ). Notes sit in two alternating columns (x 400 / 660, width 240, y = 47 + 49 × block index, measured in SPIKE) because one column overlapped. Both opened in SPIKE (28 comments, no errors; screenshots `test-results/spike-open/*_push28/`). Simulated push stall is about 22-23 cm (video about 24), lever line reached about 20 cm, ±5 cm over start spread, so 28 still reaches the lever in most runs and only shortens how long the robot presses on it; sweep (`simulator/test-results/route-fix/push28-sweep.txt`) matches the 30 cm files within a few runs. Earlier layout attempts are in `test-results/backups/`. Student notes: `gyro-mission6-7-11_routefix_creep_push28.md` and `gyro-mission6-7-11_routefix_push28.md` (written 2026-10-24 at the user's request). Not robot-tested.
- **Biggest remaining unknowns**: the real slide and the real body offset. Both are measurable in minutes (see Next step). If the body's middle sits 15 mm or more ahead of the axle, the creep version gets worse at higher overshoot (26/22/17/12/6/0). The new files also start turns without the old 0.2 s pause, which might change the slide. Neither version has been on the mat.

**Current work: `gyro-mission6-7-11.llsp3`** (slot 19, student notes in `gyro-mission6-7-11.md`). It is the gyro mission (`Harrison_Lucas_Kai_leafcutter_gyro.llsp3`, unchanged) plus fixes, with the same route and the same typed-in numbers:

- **Safety timers** in `turn` and `straight`: each stops when done OR when a time limit runs out. This fixes the freeze in the team video: the robot bumped Mission 11, could not finish `straight 15`, and waited forever.
- `turn 0` / `straight 0` / speed 0 do nothing (no dividing by 0). `turn` takes its direction from `degrees`, never by dividing by `error`.
- Yaw is reset once at the program start. Each `turn`/`straight` first does `set heading to yaw angle`. This does the same as the old per-block yaw reset, without the 0.2 s waits.
- **Comments fixed 2026-10-23 (user approved), both gyro-mission6-7-11 and turn-test rebuilt:** no comment claims which wheel motor B drives (not checked on the robot); the `set error` comment says never to change 540, 360 or 180; turn-test now has the full WORDS TO KNOW (heading, error, timer, mod). Blocks unchanged (compared with the previous build), 55 simulator tests pass, both reopened in SPIKE with every comment matching and no page errors. Previous builds kept in the session scratchpad only.
- **Heading lock across turns was tried and dropped (2026-10-21).** The video shows real turns going about 5° too far, and the team's numbers were tuned with that. Correcting it moved the leafcutter push about 12 cm and the Mission 11 bump about 9 cm (simulated). The user chose to keep the video route ("option A"). Do not re-add the lock without re-tuning on the mat. (2026-10-23: frame measurements suggest real turns land closer, about 0-4° long, so the 5° figure is doubtful; keeping the old turn behaviour still stands.)

| Check | Result | By |
|---|---|---|
| Opens in the SPIKE web app; 16 comments match the file; blocks render | ✅ | assistant, `tools/spike_open_check.mjs` |
| Simulator: same route as the old gyro mission (within 2 cm, 2°) with turns +0° and +5° | ✅ | assistant, `node --test tests/` (42 pass) |
| Simulator: robot pinned at Mission 11 still backs up and gets home | ✅ | assistant |
| **Real robot on the mat** | ❓ not tested | — |

**Turn creep investigation (2026-10-23):** see `docs/turn-creep-investigation.md`. Leading explanation (medium confidence, simulated and video evidence, not proven): during `turn 67` the robot's front reaches the green-and-black model by the river (the simulator's D2 dock outline) in about 4 of 10 plausible runs, and a front contact pushes it backward. `turn 36` passes within millimetres of the same model in about 85 % of runs. The code itself never commands wheel roll during a turn (regression test). **The exact next physical test** is the A/B contact test in that doc, run with gyro-mission6-7-11 in slot 19 (same route): 6 runs with the model and 6 with it lifted off, filmed from above, also checking that step 10 hits the back of Mission 11 and marking where the bump ends. The user prefers not to use the old code (2026-10-23): the original stays in slot 0, unchanged and unused. Exception the user confirmed: turn-test keeps its exact copy of the old turn as a measuring stick.

**Next step (needs the user, the robot and approval; updated 2026-10-23):** (1) Ruler, no motion: back of the robot to the centre of the wheel axle (body offset = 92 mm minus that) and wheel-centre to wheel-centre (track width). (2) `turn-test.llsp3` **on the mat** (slot 19) with tape at the 4 corners and a phone filming from above: overshoot from the hub numbers, slide from how far the robot ends up from its tape (`turn-test.md`). (3) Pick the route fix: slide 2 cm or more, `gyro-mission6-7-11_routefix_creep`; less, `gyro-mission6-7-11_routefix`. With a measured offset, re-run `node tools/mission6_7_11_sweep.js --offset=<mm> --creep=<slide cm × 10> <both files>` first. (4) Run the chosen file 5 times from the video start and fill in its `.md` table. The older plan (A/B contact test, then turn-test, then gyro-mission6-7-11) is superseded: the video now answers the contact question for `turn 67` (frames show the jam), and `turn 85` shows a slide without contact.

**Review of 2026-10-23 (all Word Blocks files, docs, rules, SPIKE palette):** the original uncover turn spins at a constant 5.2% and stops when abs(yaw) > degrees (recorded replay: about 1° past). The template/gyro/6-7-11 turn starts at 8 + 0.4 × remaining, so it ends faster and can roll further. Unused blocks confirmed in the real SPIKE palette: `set movement motors to brake at stop` and `set movement acceleration to` (More Movement); try them only after the turn test. Missions (from `simulator/missions.js`): M06 10 points per leaf fragment in the nest; M07 20 when the mycelium is fully extended, No Equipment Constraint; M11 20 when the root cover is down touching the mat. Ports E/F (a colour sensor?) are not recorded.

**To rebuild the mission file** (needs approval; the builder refuses to overwrite): move the old `gyro-mission6-7-11.llsp3` away, then run `python3 -I tools/build_gyro_mission6_7_11.py`. Comment text lives in `tools/mission6_7_11_comments.py`. Then check it in SPIKE:

```bash
node tools/spike_open_check.mjs gyro-mission6-7-11.llsp3 test-results/spike-open ~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright
```

(Read-only: it opens the file in a separate Chrome profile kept in `test-results/spike-open/.chrome-profile`, then writes `result.json` and screenshots. The first run downloads the SPIKE app, which takes a few minutes. The Playwright path is the npx cache on this Mac; it may change.)

**Simulator:** `python3 tools/serve.py` from the project root, then open `http://localhost:8000/simulator/`. Use `serve.py`, not `python3 -m http.server`: it tells the browser not to cache, so edits show after a normal refresh. "Port 8000 is already in use" means it is already running. Opening `gyro-mission6-7-11.llsp3` places the robot at its start automatically (see section 14). Since 2026-10-22 the simulator loads the **Team robot** profile (plain moves "Team guess", turn overshoot 5°) and the table walls are on; this is on purpose, at the user's request, and differs from section 14's "start with ideal motion". "Ideal robot" is one click away in Drive Settings. The 15 model outlines (BIOGLOW Missions) are all off to start with.

**Browser tools:** on 2026-10-21 the Playwright MCP did not load in the desktop app; on 2026-10-23 it worked (SPIKE web app in its own profile, used to make `samples/write-sample.llsp3`). The Claude in Chrome extension cannot answer SPIKE's native file picker. The Playwright library script above works.

## 1. Instruction priority and project evidence

Follow these instructions in this order:

1. Applicable safety rules, tool permissions, and the user's current explicit directions.
2. Original-file protection, BA configuration, slot protection, and the team-specific rules in this document.
3. Recorded project facts, preserving their dates, uncertainty, and test provenance.
4. General programming and simulator guidance.

The project history below was supplied by the user. It is not proof that the current assistant inspected those files or performed those tests.

Before making new claims:

- Inspect the actual files when available.
- Distinguish current observations from historical records.
- Say who performed a test when known.
- Do not turn a hypothesis into a confirmed fact.
- Do not claim access to files, a browser, or a hub without actually having it.
- Do not silently identify the leafcutter project as an official BIOGLOW mission. Verify mission identity separately when relevant.

## 2. Working rules

- Save retained notes, scripts, tests, edited project copies, and screenshots inside this project directory or its subdirectories.
- Do not use `/tmp` for anything that must be kept.
- Never modify an original `.llsp3` file.
- Save changes as a suffixed copy, such as `_turnfix.llsp3`, with a matching `.md` explanation in `docs/` (the `.llsp3` files stay at the project root).
- Start every new mission from a copy of `Team Template.llsp3`.
- Preserve the team's `BA` movement-pair setting.
- Do not swap cables.
- Do not add configuration variables or a `check gyro` My Block unless the user asks.
- Keep the team's typed-in-number approach unless explicitly asked to change it.
- Make the smallest useful change first.
- Preserve unrelated blocks, comments, assets, and scripts.
- Do not claim something works on the robot based only on simulation, JSON checks, an app screenshot, or a Python replay.
- Before physical testing, confirm the hub, program, slot, clear space, and user readiness.
- Obtain explicit approval before uploads, slot clearing, or robot motion.
- A read-only connection is not permission to move the robot.
- Protect slot 0.
- Use slot 19 for approved temporary tests.
- Clear slot 19 only with approval.
- The gyro mission is designated for slot 1. Confirm before overwriting it.
- Ask the user to close a project in other SPIKE sessions before editing its working copy.
- Quit the SPIKE app before Bluetooth hub connections.

## 3. First inspection

Before changing an unfamiliar project, inspect the available directory.

Look for:

- `AGENTS.md`
- `Team Template.llsp3`
- Original, turnfix, and gyro mission projects
- `tools/sim_path.py`
- `tools/test_sim_path.py`
- Existing browser simulator files
- Referenced documentation and path drawings

Report:

- What exists.
- What is missing.
- Any material conflict between these instructions and the actual files.

Do not claim to inspect unavailable files.

Do not require a long intake when the task can proceed safely with known information.

For missing facts, use clearly labeled placeholders or ask a specific question.

## 4. Files and project history

The following records were supplied by the user and are dated 2026-10-14 unless noted otherwise.

**Layout (2026-10-24):** every note (`.md`) except this file and `README.md` (the kid-friendly front page GitHub shows, added 2026-10-24) lives in `docs/`; the `.llsp3` programs stay at the project root, the simulator in `simulator/`, scripts in `tools/`. A `.md` named in this document without a folder means `docs/<name>` (for example `gyro-mission6-7-11.md` is `docs/gyro-mission6-7-11.md`). The root also has `index.html` and `.nojekyll` for GitHub Pages.

| File | Purpose and protection |
|---|---|
| `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` | Original team project. Never modify. Main program uses `BA`. |
| `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.llsp3` | Turn-fix working copy. New `turn` My Block. Main program still uses `BA`. Do not change `BA`. |
| `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.md` | Student explanation of the turn fix. Keep it matched to the actual working copy. |
| `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` | Gyro mission built from Team Template. See the conversion notes below. Designated slot 1. |
| `Team Template.llsp3` | Starting point for every new mission. Includes `BA`, speed 50, the `turn` and `straight` My Blocks, and explanatory comments. Template slot is 19. |
| `Straight Test.llsp3` | User moved it to Trash on 2026-10-14. Do not assume it is present. The tested helper remains in the template and gyro mission. |
| `armflip.llsp3` | User removed it from the folder on 2026-10-14. Do not assume it is present. |
| `docs/IfThenBlocks.md` | User-added Prime Lessons SPIKE 3 reference. |
| `docs/SP3AccurateTurning.md` | User-added turning reference. Check before replacing turning logic. |
| `docs/SP3GyroMoveStraight.md` | User-added straight-driving reference. Check before replacing straight logic. |
| `docs/leafcutter_path_drawing.png` | User's red path drawing on the mat. Not in the folder on 2026-10-21. |
| `docs/leafcutter_stall_spot.png` | User's marked location for the unresolved drift issue. Not in the folder on 2026-10-21. |
| `docs/SP3Variables.md` | User-added variables reference (present 2026-10-21). |
| `paths/` | Regenerable path pictures from the existing simulator. |
| `tools/` | Existing simulator and Bluetooth hub tools. Inspect before using. |
| `simulator/` | Browser simulator. Status in section 14, "Status (2026-10-21)". User guide: `simulator/README.md`. |
| `.gitignore` | Added 2026-10-21. See section 26. |
| `gyro-mission6-7-11.llsp3` / `.md` | Added 2026-10-21. Gyro mission plus safety timers; generated by `tools/build_gyro_mission6_7_11.py`. Slot 19. See "Start here". |
| `gyro-mission6-7-11-cheat-sheet.md` | Added 2026-10-21. One-page student guide for small number tweaks (steps 1-15, symptom table, do-not-change list, test log). Keep it matched to the main program. |
| `gyro-mission6-7-11_routefix.llsp3` / `.md` | Added 2026-10-23. 6-7-11 with `straight` 47 to 35, 32 to 29, -6 to -12: the video route for a robot that does not slide in turns. Built by `tools/build_mission6_7_11_routefix.py routefix`. Slot 19. Not robot-tested. |
| `gyro-mission6-7-11_routefix_creep.llsp3` / `.md` | Added 2026-10-23. 6-7-11 with `straight` 47 to 40, 32 to 28 (back 6 kept): the video route for a robot that slides about 4-7 cm when a fast turn starts (what the video shows; try first). Built by `tools/build_mission6_7_11_routefix.py routefix_creep`. Slot 19. Not robot-tested. |
| `simulator/tools/mission6_7_11_sweep.js` | Added 2026-10-23. Runs a Missions 6-7-11 program 27 times per overshoot (0-5°) with Push, the pusher and the outlines; counts D2 touches, push stall, Mission 11 bump, completely home, other touches. `--creep=N`, `--offset=N`. About 1 minute per file. |
| `docs/route-from-video.md` / `.png` | Added 2026-10-23, updated the same day. Real robot poses from the video (13 frames) vs simulated routes; the turn-slide evidence; both route fixes with their simulated results; limits; next physical tests. |
| `turn-test.llsp3` / `.md` | Added 2026-10-23. Team Template copy, slot 19. Turns right 90 three times with the OLD turn (copied from the original uncover project) and three times with the NEW turn (copied from gyro-mission6-7-11), and after each turn shows `round(yaw angle)` on the light matrix. Built by `tools/build_turn_test.py` (reads Team Template, uncover and gyro-mission6-7-11 read-only; refuses to overwrite). Opened in SPIKE (17 comments match); simulated (ideal motors: OLD 90, NEW 89). Not run on the robot. |
| `samples/write-sample.llsp3` | Added 2026-10-23. Real SPIKE export made by the assistant in the SPIKE web app through the Playwright MCP (new Word Blocks project, saved through a stubbed save picker). Holds `write (round (pitch angle))` and `repeat 10`: the formats for `flipperlight_lightDisplayText` (TEXT `[3, id, [10, ...]]`), `operator_round` (NUM `[3, id, [4, ""]]`) and `control_repeat` (TIMES `[1, [6, "10"]]`), plus the `flipperlight` extension in both extension lists. Do not edit. |
| `docs/turn-creep-investigation.md` | Added 2026-10-23. Investigation of the backward creep in `turn 67` and of turn reliability: four causes checked, Word Blocks vs simulator vs Python replay, safety-timer risks, prioritized next steps, the exact next physical test, and a plain-words summary for the team. Every finding labelled history / file / video / sim / test / robot. |
| `simulator/tools/turn_clearance_sweep.js` | Added 2026-10-23. For every in-place turn of a program, over ±2 cm / ±2° starts and 0-5° overshoot: how often the robot body touches each model outline and which part of the body is nearest. Output saved in `simulator/test-results/turn-clearance-sweep.txt` (git-ignored folder; rerun to regenerate). |
| `samples/format-sample.llsp3` | Real SPIKE export saved by the user on 2026-10-21. Reference for block formats (variables, timer, mod, or, if). Do not edit. |
| `tools/build_gyro_mission6_7_11.py`, `tools/mission6_7_11_comments.py` | Builder and comment text for `gyro-mission6-7-11.llsp3`. Reads the gyro mission read-only; refuses to overwrite its output. |
| `tools/spike_open_check.mjs` | Opens a `.llsp3` in the SPIKE web app with Playwright (read-only) and checks blocks and comments. |
| `tools/serve.py` | Simulator web server with caching turned off. |
| `videos/gyro_run1.MOV` | User's video of the gyro mission. Local only: ignored by git. |
| `AGENTS1.md` | Removed 2026-10-21 (an older copy of this file from 2026-10-14; still in git history). |

### Gyro mission conversion

Recorded changes:

- Built from `Team Template.llsp3`.
- Each `move X cm` became `straight` at approximately:
  `X × 20.5 ÷ 17.5`, rounded.
- Example: 30 became 35.
- Speeds remained 50, 13, and 100.
- Extra `stop moving` and mid-mission `set movement speed` blocks were removed.
- Download slot is 1, preserving the working mission in slot 0.

Recorded results:

- User reports the mission ran successfully on 2026-10-14.
- Existing simulator reportedly ends within 1 cm of the turnfix path.
- Matching physical mat positions against the slot 0 version remains unconfirmed.

If it overshoots by about 17%, investigate the plain-move correction assumption. Consider the original distances only after a controlled test.

Do not automatically apply another distance multiplier to already converted mission numbers.

### Removed test projects

`Straight Test.llsp3` reportedly showed:

- Calibration: 17.6 wheel degrees per cm.
- A 50 cm request drove about 20 inches, or 50.8 cm.
- Robot stayed straight and returned to the tape.

`armflip.llsp3` reportedly used:

- `AB`.
- `move back 26 inches` to drive physically forward.
- Port C arm movement of 120 degrees counterclockwise and back.

These are historical records, not current executable files.

## 5. Student writing and comments

Use:

- Short sentences.
- Clear units.
- Tables for comparisons.
- A worked example for each tuning number.
- An “if it does X, try Y” tip for tuning.
- Everyday comparisons, such as bike brakes, shopping carts, tanks, and stopwatches.

Say “times” and “divided by.”

Explain once that `*` means times and `/` means divided by.

Avoid code-style arrows in student prose.

The user reports template and gyro mission comments were rewritten on 2026-10-14.

They include:

- Comments on important blocks.
- A `WORDS TO KNOW` comment covering degrees, gyro, yaw, My Block, %, and abs.
- A `START HERE` comment with three steps for making a new mission.

Approximate comment-box sizing used in this project:

- Wrapped characters per line: width divided by 9.
- Height: about 19 pixels times wrapped line count, plus 80 pixels.

This is a project heuristic. Verify the actual app display.

No existing script rebuilds these comments.

Prefer editing comments in the SPIKE app unless the user explicitly requests programmatic editing.

## 6. Robot facts and configuration

Recorded on 2026-10-14:

| Port | Device | Use |
|---|---|---|
| A | Large motor | Drive wheel |
| B | Large motor | Drive wheel |
| C | Medium motor | Attachment used in this project |
| D | Medium motor | Not used in this project |

### Measured body size

Reported by the user on 2026-10-21, no attachments:

| Direction | Inches | Millimeters |
|---|---|---|
| Front to back | 7 1/4 | 184.15 |
| Side to side | 6 5/8 | 168.275 |

Source: the user's tape measurement. Not re-measured by the assistant.

Not yet measured: where the wheel midpoint sits inside this box (body offset), track width, and attachment footprints. The simulator draws the body centred on the wheel midpoint until the offset is measured.

### BA protection

- `BA` is correct for the current robot.
- User reports `AB` drove backward on the mat.
- User does not want the cables swapped.
- Physical left/right assignment of A and B remains unconfirmed.
- A previous upside-down hand-roll test was misleading.

Confirm physical forward only with an approved short move on the floor, right side up.

Do not infer forward direction from encoder signs alone.

Recorded signs with `BA`:

- A positive.
- B negative.
- Physical movement forward.

### Recorded turning behavior

- `turn 90`: right/clockwise.
- `turn -90`: left/counterclockwise.
- User records report the same turn direction with `AB` and `BA` during those tests.
- Do not generalize that observation to other robots.

### Recorded hub state

- Bluetooth name: `a`.
- Firmware: 1.8.149.
- SPIKE App 3.
- Battery was 100%.
- Gyro was steady while still.
- Hub buttons reportedly showed only slot 0.

These are dated observations, not current live readings.

## 7. Calibrated straight My Block

Recorded helper behavior:

1. Reset yaw.
2. Wait 0.2 seconds.
3. Set B's relative motor position to zero.
4. Repeat until:
   `abs(B relative position) > abs(cm) × 17.6`
5. Start moving with:
   - Left: `speed × sign − yaw × 2`
   - Right: `speed × sign + yaw × 2`
6. Stop moving.

The user reports 17.6 motor degrees per cm was measured on the mat.

An earlier setting of about 20.57, based on the app's assumed 17.5 cm per wheel turn, drove about 17% too far.

Preserve 17.6 unless the user approves a calibration experiment.

### Distance uncertainty

Recorded measured wheel travel:

- About 20.5 cm per wheel revolution.

Existing simulator assumption:

- Plain move commands may travel `20.5 ÷ 17.5` times the requested distance.

That plain-move overshoot remains an inference.

A proposed confirmation is an approved plain `move 50 cm` test on the mat.

Do not apply the plain-move multiplier to the calibrated `straight` helper.

### Yaw convention

The recorded Word Blocks yaw increases clockwise.

Hub Python and the browser simulator use different conventions.

Convert signs and units explicitly.

## 8. Turn-fix My Block

The following is the recorded baseline, expressed as descriptive Word Blocks notation:

```text
define turn (degrees)
    set yaw angle to 0
    wait 0.2 seconds

    repeat until abs(yaw) > abs(degrees) − 1
        start moving at
            left:
                (8 + 0.4 × (abs(degrees) − abs(yaw)))
                × (degrees ÷ abs(degrees))

            right:
                (8 + 0.4 × (abs(degrees) − abs(yaw)))
                × −(degrees ÷ abs(degrees))

    stop moving
```

### Recorded changes

| Part | Before | After |
|---|---|---|
| Reset wait | 0.5 seconds | 0.2 seconds |
| Speed | Constant 5.2% | Faster initially, slower near target |
| Control | Wait-until behavior | Repeated speed updates |
| Stop target | At requested magnitude | 1 degree early |

Speed example:

| Degrees left | Calculation | Requested speed |
|---|---|---|
| 90 | 8 + 0.4 × 90 | 44% |
| 45 | 8 + 0.4 × 45 | 26% |
| 10 | 8 + 0.4 × 10 | 12% |

The value 8 is this helper's chosen baseline, not a universal minimum motor speed.

### Known limitations

- The direction expression divides by zero for a zero-degree request.
- Large inputs can request excessive speed.
- The recorded helper has no explicit timeout.
- Early stopping does not guarantee an exact final angle.

Flag these limitations.

Do not silently modify the template or working mission.

Propose guards, speed clamping, or timeouts in a separate approved copy.

### Test provenance

Recorded Python replay results:

- Right 90-degree command stopped around 91.9 degrees.
- Left 90-degree command stopped around 90.9 degrees magnitude.

These results do not prove identical behavior of the real Word Blocks mission.

Keep app checks, Python replays, and actual Word Blocks mat tests separate.

### Historical tuning ideas

Treat these as experiments, not guaranteed fixes:

- Lowering 8 to 6 may reduce final speed but can reintroduce stalling.
- Changing minus 1 to minus 0 changes the stop threshold.
- Restoring a 0.5-second wait may help if reset settling is the issue.

Confirm the symptom. Change one number at a time in an approved copy.

## 9. Reverted variables experiment

On 2026-10-14, robot-settings variables and a `check gyro` My Block were tried and reverted because pressing play did nothing.

Do not add them again unless asked.

User-recorded likely serialization issues:

1. Variables were placed on the Stage rather than the sprite.
2. `stop all` was built with an incorrect shadow-menu structure.

These are likely causes, not confirmed root causes.

Observed app structures:

- Variables: `targets [firstinspires](https://www.firstinspires.org/programs/fll/game-and-season).variables`.
- Variable input:
  `[3, [12, name, id], [10, "0"]]`
- Stop-all opcode:
  `flippercontrol_stop`
- Stop-all fields:
  `{STOP_OPTION: ["all", null]}`

Check a real app export before constructing unfamiliar block structures.

## 10. Safe `.llsp3` editing

### Recorded archive structure

Outer ZIP:

- `manifest.json`
- `scratch.sb3`
- `icon.svg`
- `monitors.json`

Inner `scratch.sb3` ZIP:

- `project.json`
- Asset files

This team's program blocks were found in:

`targets [firstinspires](https://www.firstinspires.org/programs/fll/game-and-season).blocks`

Validate target identity. Do not assume all projects use that ordering.

### Editing procedure

1. Identify the protected source.
2. Identify the approved working-copy output.
3. Ask the user to close the project in other SPIKE sessions.
4. Read all source bytes before opening any output for writing.
5. Inspect archive members, JSON, timestamps, and exact fields.
6. Build the edit in memory.
7. Preserve untouched members, member order, and metadata where practical.
8. Validate the intended change.
9. Parse JSON and validate both ZIP archives.
10. Write a `.tmp` sibling of the working-copy output.
11. Use `os.replace` only on the approved working-copy output.
12. Reopen the written archive and verify the change.
13. Open the saved copy in SPIKE and inspect it.
14. Write matching student notes.

Never atomically replace the protected original.

Do not overwrite an existing working copy without approval and a recoverable baseline.

For a literal one-string patch:

- Assert the original string appears exactly once.
- Verify the edited JSON still parses.

For structured changes:

- Identify the exact target.
- Validate the expected change count.
- Check for unintended differences.

### Dangerous write pattern

Never use:

```python
open(P, "wb").write(f(open(P, "rb").read()))
```

Opening the output can truncate it before the read.

The user reports this wiped the turnfix file on 2026-10-14. It was recovered from bytes still in memory.

### SPIKE can overwrite outside edits

The user reports an outside edit was overwritten by a later app save.

Before editing:

- Ask the user to close the project in the app.

After editing:

- Check the changed field.
- Inspect `manifest.json` → `lastsaved`.
- Investigate unexpected changes.
- Do not fabricate an app save timestamp.

Regardless of the historical BA-to-AB edit, current required configuration is BA.

### Comments

Recorded structure:

```text
targets.comments = { [firstinspires](https://www.firstinspires.org/programs/fll/game-and-season)
    id: {
        blockId,
        x,
        y,
        width,
        height,
        minimized,
        text
    }
}
```

The linked block has:

```text
"comment": id
```

### Recorded opcodes

Movement pair:

- Opcode: `flippermove_setMovementPair`
- Field: `field_flippermove_movement-port-selector`

Relative-position setter:

- Opcode: `flippermoremotor_motorSetDegreeCounted`
- PORT shadow: `flippermoremotor_multiple-port-selector`
- Field: `field_flippermoremotor_multiple-port-selector`
- Value input: `VALUE`

Position reporter:

- Opcode: `flippermoremotor_position`
- PORT shadow: `flippermoremotor_single-motor-selector`
- Field: `field_flippermoremotor_single-motor-selector`

Include `flippermoremotor` in both relevant extension lists when required.

Validate against a real app export before relying on new structures.

### Start events and loose scripts

Recorded hub-start event:

`flipperevents_whenProgramStarts`

Loose stacks can run when clicked in the app.

The original reportedly contains six loose stacks and one empty start-event block absent from the turnfix copy.

Do not delete additional scripts automatically.

## 11. Browser tools and Playwright MCP

There are two separate browser workflows:

1. Test the local simulator.
2. Create or edit real SPIKE Word Blocks projects when requested.

Do not confuse simulator commands with a real SPIKE project.

### Tool availability

Prefer an available Playwright MCP browser connection.

An equivalent authorized browser tool is acceptable.

- Discover available tools.
- Do not invent tool names.
- Do not assume a browser connection exists.
- Do not claim screenshots or interactions that did not occur.
- Do not install tools or change browser configuration without permission.

If browser automation is unavailable:

- Continue work that does not require it.
- Provide manual checks.
- State which browser checks were not performed.

### Local simulator browser testing

When tools permit:

1. Start the local server.
2. Open the application.
3. Inspect the interface.
4. Exercise controls.
5. Check console errors.
6. Capture useful screenshots.
7. Report actual results.

Check:

- Dimensions and coordinate display.
- Mat placement.
- Robot dragging and rotation.
- Numeric entry.
- Image upload and calibration.
- Command editing and repeats.
- Run, pause, resume, step, and reset.
- Collision warnings.
- Save/load.
- Resizing.

Store retained evidence under:

`simulator/test-results/`

A screenshot alone does not prove movement or collision correctness.

## 12. Real SPIKE Word Blocks browser editing

This workflow requires a specific user request.

It is not automatically authorized by a request to build the simulator.

Target app:

`https://spike.legoeducation.com/prime/`

### Before editing

1. Read this document.
2. Identify the exact source project.
3. Resolve the requested change.
4. Select a new output filename.
5. Obtain approval for consequential edits.
6. Ask the user to close other sessions of that project.

For a new mission:

- Copy `Team Template.llsp3`.
- Preserve BA.
- Reuse existing straight and turn helpers.
- Preserve typed-in numbers unless asked otherwise.
- Do not upload or run automatically.

For an existing mission:

- Edit an approved working copy.
- Preserve unrelated content.
- Do not rebuild the mission for a small change.

### Preferred procedure

Prefer normal app interactions:

1. Open the working copy.
2. Inspect visible blocks and comments.
3. Locate the exact script or My Block.
4. Make the approved change.
5. Export or save a new copy.

Inspect the live editor before choosing selectors or coordinates.

Use page structure when sufficient.

For visual interactions:

- Inspect screenshots.
- Verify each meaningful change.
- Do not assume fixed block positions.

If reliable interaction is not possible:

- Stop that editing step.
- Explain the limitation.
- Propose an alternative.
- Do not claim success.

Do not inject guessed editor APIs or assume the editor uses a particular block framework.

Do not modify internal app state based on invented methods.

### Archive-editing fallback

If the user approves archive editing:

- Follow the safe archive procedure.
- Open the result in SPIKE afterward.
- Verify the saved copy.

A historical browser technique used a file-picker stub with `window.showOpenFilePicker`. Treat that as a past experiment, not a guaranteed current capability.

Use such a workaround only when tools, permissions, and the inspected app support it.

### Save and verify

After editing:

1. Save or export a new suffixed `.llsp3`.
2. Verify the file exists and is nonempty.
3. Reopen that saved file in SPIKE.
4. Inspect the changed block and inputs.
5. Confirm BA is unchanged.
6. Check comments and surrounding blocks.
7. Create matching `.md` notes.
8. Record useful evidence.

An in-memory editor change is not a saved deliverable.

An exported file is not app-validated until reopened.

### Hardware boundary

Browser editing does not authorize:

- Hub pairing.
- Uploading.
- Slot clearing.
- Motor motion.
- Mission execution.

Those require separate approval.

## 13. Existing path simulator

Inspect the existing implementation before changing or replacing it.

Commands from the project root:

```bash
python3 tools/sim_path.py
python3 tools/sim_path.py <project.llsp3>
python3 tools/sim_path.py --watch
python3 tools/sim_path.py --as-written <project.llsp3>
python3 tools/test_sim_path.py
```

Recorded behavior:

- Processes `.llsp3` files in the folder by default.
- Writes `paths/<project>_path.svg`.
- Prints step X/Y in cm and heading.
- Watch mode redraws added or saved files.
- Projects without executable start-event stacks are skipped.
- `--as-written` ignores the current AB/BA reversal mapping.
- Found 2026-10-23: it skips everything inside an `if` block, so gyro-mission6-7-11 and turn-test (My Blocks wrapped in `if`) come out with no turns. Use the browser simulator for those. Also, `python3 -I tools/test_sim_path.py` fails with ModuleNotFoundError; run it without `-I`, as above.

Recorded supported behavior:

- Move in cm, inches, rotations, and degrees.
- Fixed repeats.
- Simple arithmetic.
- Custom blocks with substituted arguments.
- Heuristic straight and turn recognition.
- Some attachment motor commands.

Heuristics:

- A custom block reading relative motor position is treated as straight travel using its first argument in cm.
- Other yaw-resetting helpers are treated as turns using their first argument.
- Positive turn means right in this simulator.
- Pivot turns are drawn in place.

Report every:

`NOTE: not simulated`

Unsupported behavior and heuristic misclassification can invalidate a path.

### Attachment estimates

Labels show accumulated motor angle, such as:

`C at -131°`

Recorded convention:

- Clockwise positive.
- Physical arm up/down direction unmeasured.

Seconds-based motion uses estimates:

- Default speed 75%.
- 100% approximately 1050 degrees/second.

These are not measured values.

### Limitations

- Ideal in-place turns.
- No wheel slip.
- Pivot turns approximated as in-place.
- Plain-move distance correction remains a hypothesis.
- Agreement with another simulated path does not prove real mat agreement.

## 14. Browser simulator requirements

### Purpose

Build a local educational planning tool.

It must not require an AI API, subscription, or running language model for normal operation.

Do not claim official LEGO compatibility, scoring authority, or physical accuracy beyond what was tested.

### Field inputs

User-supplied dimensions:

| Object | Inches | Millimeters |
|---|---|---|
| Table interior | 93 × 45 | 2362.2 × 1143 |
| Mat | 79.5 × 44.75 | 2019.3 × 1136.65 |

Use:

`1 inch = 25.4 mm`

Use millimeters internally.

Keep table, mat, robot, obstacles, and background separate.

Preserve aspect ratio.

Do not stretch the mat to fill the table.

### World coordinates

- Origin: bottom-left interior table corner.
- X positive right.
- Y positive up.
- Heading zero right.
- Heading positive counterclockwise.
- Robot position refers to the midpoint between drive wheels.

Define body and attachment offsets relative to that midpoint.

Keep physical positions independent of screen pixels.

### Mat placement

Allow:

- Bottom-left X offset.
- Bottom-left Y offset.
- Rotation about the mat's local bottom-left corner.

Label unverified placement clearly.

Do not assume centered placement is official.

Evidence (2026-10-21): the Robot Game Rulebook, Field Setup Step 1, says to align the mat to the bottom wall and center it between the left and right walls. The simulator default is therefore X offset 171.45 mm, Y offset 0.

Warn if the mat extends outside the table.

### Background

Reference supplied by the user:

`https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-wireframe-grid.pdf`

Inspect the PDF before interpreting its boundaries.

If unavailable:

- Use a blank scaled mat.
- Support local PNG/JPG upload.
- State the limitation.
- Do not invent mission locations.

Provide:

- Image preview.
- Crop selection.
- Aspect-ratio check.
- Opacity.
- Orientation adjustment.
- Replace/remove.
- Alignment with mat movement and rotation.

Do not silently distort a mismatched crop.

Artwork is not collision geometry or a sensor map.

### Robot configuration

Allow:

- Body length and width.
- Body offset.
- Wheel diameter.
- Track width.
- Gear ratio.
- Direction settings.
- Optional physical port mapping.
- Maximum speed or calibrated speed mapping.
- Attachment footprint.
- Starting pose.

Define gear ratio as motor revolutions per wheel revolution.

Label unmeasured defaults as examples.

Allow dragging, rotation, numeric entry, and saving the start pose.

Do not change BA.

Keep unknown physical port mapping explicit.

### Distance modes

Keep separate:

1. Calibrated team straight commands.
2. Plain move commands.
3. Geometry-based wheel movement.

Team straight:

- Intended physical distance is its requested cm.
- No additional plain-move multiplier.

Plain move:

- Default: as commanded.
- Optional: team hypothesis correction of 20.5/17.5.
- Show and save the selected mode.

Never automatically correct already converted mission numbers again.

### Movement

Use shared differential-drive physics.

Compute movement from wheel velocities, track width, and elapsed simulation time.

Use wheel geometry and gearing for encoder rotation.

Do not teleport to command endpoints.

Support:

- Forward/reverse.
- In-place turns.
- Curves.
- Independent wheel motion.
- Encoders.

Use a fixed timestep independent of rendering.

Playback speed changes processing rate, not physics.

Pause when the tab becomes inactive.

Start with ideal motion:

- No slip.
- No noise.
- No universal overshoot correction.

Label uncalibrated timing as estimated.

### Commands

Provide an editable ordered list:

- Team straight.
- Team turn.
- Generic drive.
- Turn to world heading.
- Independent wheel speeds for a duration.
- Wait.
- Stop.
- Repeat group.

Team turn positive means clockwise.

World heading positive means counterclockwise.

Handle:

- Zero-angle and zero-distance no-ops.
- Invalid inputs.
- Zero-speed movement requests.
- Finite timeouts.
- Speed limits.
- Clear fault reporting.

Relative 360-degree turns must complete a revolution, not become zero-degree no-ops.

Highlight active commands and repeat iterations.

Allow adding, editing, duplicating, deleting, and reordering.

Use controllers that generate wheel motion through the shared physics model.

Provide descriptive Word Blocks translations.

Do not claim direct SPIKE import.

Defer arbitrary `.llsp3` import/export unless separately requested.

### Sensors

Implement:

- Gyro reference and heading.
- Logical wheel encoders.
- Simulation timer.

Resetting gyro reference must not change physical pose.

Expose A/B encoder readings only when their mapping is configured.

Defer line following until explicit sensor-readable data exists.

Do not read reflected light from wireframe artwork.

### Controls

Include:

- Run from saved start.
- Pause/resume.
- One-timestep advance.
- Reset.
- Playback speed.
- Show/hide path.
- Clear path.
- Live pose and sensors.
- Active command.
- Distance and bearing measurement.

Reset clears runtime state but preserves configuration and program.

Lock program/configuration edits during active execution.

### Collisions

Use full body and attachment footprints.

Detect:

- Table boundary contact.
- Manually placed obstacle contact.

Allow rectangular obstacles with position, dimensions, rotation, and name.

On collision:

- Stop.
- Pause.
- Identify the obstacle or boundary.
- Preserve a useful last-safe pose.

Check the initial pose.

Use substeps or another documented technique to reduce tunneling.

Do not infer 3D mechanism behavior or official scoring.

### Save/load

Use versioned JSON.

Include:

- Field and mat settings.
- Robot profile.
- Starting pose.
- Commands.
- Calibration mode.
- Obstacles.
- Background calibration.

Document whether image data is embedded or must be reloaded.

Validate imports before replacing current state.

Do not execute imported data as code.

### Application structure

Prefer:

```text
simulator/
    index.html
    styles.css
    app.js
    physics.js
    executor.js
    tests/
    examples/
    test-results/
    README.md
```

Prefer no build step or CDN dependency.

If serving is needed (no-cache server, so edits show after a normal refresh):

```bash
python3 tools/serve.py
```

From the project root, open:

`http://localhost:8000/simulator/`

State any additional test-runtime requirements.

### Milestones

A. Scaled board, background calibration, and robot placement.

B. Shared physics, robot settings, gyro, and encoders.

C. Commands, repeats, telemetry, path, and translation.

D. Collisions, save/load, tests, examples, and documentation.

E. Optional sensor maps, line following, mechanisms, scoring, and project import/export.

Complete A through D in order.

Do not stop after every milestone to ask permission unless a consequential ambiguity or protected-file change requires it.

### Status (2026-10-21)

Built by the coding assistant on 2026-10-21. Simulated and browser-tested only. Nothing was tested on the robot or the hub.

| Item | State |
|---|---|
| A. Board, background, placement | Done |
| B. Physics, drive settings, gyro, encoders, movement-test panel | Done |
| `.llsp3` program runner (read-only import, step by step) | Done, at the user's request ahead of C |
| C. Editable command list, translation | Not started |
| BIOGLOW mission data and map markers (`missions.js`) | Done 2026-10-21 for all 15 missions. Labels only: no collisions, no scoring. |
| D. Collisions, save/load, examples | Partly done. 2026-10-22: table walls (on by default, whole body box) and 15 model/dock outlines from the wireframe (all off by default, estimates, one tick box each). Save/load, attachment footprints, body offset not started.. 2026-10-23: Push mode (models shove the robot aside instead of pausing), the front pusher footprint (from the video), and the `m0607stop` outline (where the real push stopped). |
| Turn-overshoot estimate setting | Added 2026-10-21. 2026-10-22: default is now 5° through the "Team robot" profile (Drive Settings); "Ideal robot" = 0° and "Drive the cm asked". Both are estimates. Physics defaults and tests are unchanged. 2026-10-23: the video frames suggest about 0-4° per turn (see "Start here"), and the hub replay about 2° (about 3° in this setting). |

Files: `simulator/index.html`, `styles.css`, `app.js` (UI), `physics.js` (no DOM), `llsp3.js` (ZIP reader, no DOM), `wordblocks.js` (Word Blocks interpreter, no DOM), `missions.js` (mission data, no DOM), `tools/pdf_render.swift`, `assets/`, `tests/`, `test-results/`.

Run: `python3 tools/serve.py` from the project root (no-cache server, added 2026-10-21), open `http://localhost:8000/simulator/`. Tests: `node --test tests/` from `simulator/` (61 pass on 2026-10-23). Evidence logs: `simulator/test-results/milestone-b-checks.md`, `program-runner-checks.md`, `missions-checks.md`.

Official documents in `simulator/assets/` (downloaded 2026-10-21, keep unchanged; hashes in `simulator/README.md`): `bioglow-rulebook.pdf` (id 30082603 V1, 28/4/26), `bioglow-field-setup-guide.pdf`, `bioglow-challenge-updates.pdf` (updated 2026-10-14), plus the wireframe PDF. Together about 30 MB. Challenge Updates supersede the rulebook; re-download them before relying on the mission text.

Background:

- `simulator/assets/bioglow-wireframe-grid.pdf`: downloaded 2026-10-21, 904,815 bytes, 2 pages, SHA-256 `33231bb977f1e93abc8a1c31986705c8dd5cec8e321f8dc8d879e42934939244`. Keep unchanged.
- Page 2 rendered to `bioglow-wireframe-page2-300dpi.png` with macOS PDFKit (`tools/pdf_render.swift`). Loads automatically.
- Measured mat border crop: 166, 636, 2967 × 1689 px. Its shape is 1.757; the configured mat is 1.777 (1.1% off). Drawn unstretched at 1996.7 × 1136.65 mm, centred. The PDF is a diagram, not exact scale.

Physics and settings:

- Fixed 5 ms step, exact-arc integration. Playback changes only steps per frame. Hidden tab pauses.
- Defaults: wheel 65.3 mm (from team's 20.5 cm per wheel turn); track width 112 mm, gear 1, 1050 deg/s at 100%, encoder signs +1/+1 are examples or estimates.

Program runner:

- Runs the real blocks, including the bodies of `straight` and `turn`. It does not guess what a My Block means. Unsupported blocks are skipped with a NOTE.
- Assumptions shown in the UI: port B = simulator left wheel, A = right (the only layout matching "BA drives forward" plus "turn 90 turns right"); pair AB therefore drives backward; one loop pass = one 5 ms step; yaw 0.1° steps wrapping at ±180°; motor positions whole degrees; speeds clamped to ±100%.
- Plain-move mode: "Drive the cm asked" (default) or "Team guess: 17.5 cm per wheel turn". The `straight` helper is never corrected.
- Run program uses the robot's current hand-placed pose as the new start pose, otherwise the saved start. Robot placement: drag to move, ⟲/⟳ 90° buttons or typed heading to turn.
- A `.llsp3` file can be dropped anywhere on the page, or opened with Choose File. Dropping only opens it; Run program starts it. Refused while a program is running.
- Per-project start poses: `START_POSES` in `missions.js`, keyed by the manifest project name. Opening that project places the robot there and saves it as the start pose. Three have one (2026-10-23): `gyro-mission6-7-11`, `gyro-mission6-7-11_routefix` and `gyro-mission6-7-11_routefix_creep`, all (2099, 286) mm, heading 180°, measured on the first video frame against the printed launch-area edge strip (ticks every 10 cm from the bottom-right mat corner; robot sides at about 19 and 38 cm from the bottom wall, back on the mat's right edge). About ±2 cm. The earlier estimate was (2099, 265).

Left panel (reworked 2026-10-21, it had grown to 4 screens): View, Program, Run Controls, Robot Placement, Sensors and BIOGLOW Missions are open, in that order; Drive Settings, Table, Mat, Background, Grid, Movement Test and Cursor are collapsed `<details>`. Inputs in collapsed panels still work and are still locked during a run.

Findings (simulated, not robot-tested):

- `turn 0` is a no-op (0.2 s wait).
- `turn` with more than 180 degrees never finishes because yaw wraps at ±180°; the simulator faults after 300 s.
- Ideal motors stop each `turn N` between N - 1 and N - 0.5 degrees. The recorded hub replay stopped 1-2° past N. Simulated routes therefore turn slightly less than the real robot.

Gyro mission jam (2026-10-21; from the user's video, not a hub or mat test by the assistant):

- Video: `videos/gyro_run1.MOV` (user's phone, local only, not in git). It shows `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` running from the bottom-right launch area. The start pose read from the first frame is about (2099, 265) mm, facing 180°.
- Assistant's reading of the video and its audio (inferred, not confirmed): the robot pushes Mission 06/07, turns, then stops for good with its left front corner against the Mission 11 model during block 11 (`straight 15 cm at speed 13`), after a loud thump at 23.5 s. The `straight` My Block has no timeout, so it waits forever and blocks 12-15 never run. Both simulators end back near the launch area instead.
- Real turns took longer than simulated (`turn 67` about 2.8 s against 1.0 s). That changes timing, not the route.
- End pose estimated from the video (perspective fit on four models, about ±10 cm, ±15°): about (161, 76) cm, facing about 45° clockwise of right. The simulator has the robot at about (153, 89), facing 24.5° clockwise, at the end of block 11.
- Added for this, both off by default and labelled estimates: turn overshoot (Drive Settings; after "stop moving" ends a spin, the robot spins that many more degrees and the program waits for it) and a Mission 11 obstacle (BIOGLOW Missions checkbox; wireframe outline, about 8 cm diamond; on contact the robot keeps its last safe pose and the run pauses).
- Result: with the obstacle on, the gyro mission finishes at turn overshoot 0, 5, 8, 10, 15 and 20° and never touches the outline. About 5° per turn matches the video heading but still leaves at least about 6 cm. A body offset of up to 6 cm (script test) does not close it either. These two settings alone do **not** reproduce the jam.
- Unmeasured candidates: real Mission 11 footprint (base plate, lever, plants stick out past the outline), body offset, real `turn 90` overshoot, and the robot's real position when block 11 starts.
- Proposed robot test (needs the user and the robot): when it stops at Mission 11, check the hub still shows the program running, then pull it back about 3 cm. If it finishes the route, the jam is confirmed. Any timeout or route fix goes in a new approved copy, never the original.
- Table walls and outlines (2026-10-22, simulated; corrected after an invalid first trial in which the obstacles had not been applied): with the Team robot profile and all 15 outlines ticked, the `gyro-mission6-7-11` route from its measured start **pauses at 3.69 s in `turn 67` touching the D2 outline** (by under 1 mm, robot about (1317, 482) mm); with D2 off it pauses at 5.14 s in `turn 36` on the lower Mission 10 outline. With those and 06·07 off it finishes. Closest then: top table wall 10 mm during the leafcutter push, Mission 11 77 mm, but only during `straight 47`; the simulated bump itself ends with the robot front about 11 cm short of the Mission 11 outline (robot centre about 25-30 cm from the model centre), near the leafcutter, while the real robot reaches Mission 11 (corrected 2026-10-23; see `docs/mission6-7-11-routes.png`). Outlines are good to about 5 mm and the start to about 2 cm, so a D2 clip is possible and unproven, and the sim route may sit further up the table than the real one. Suggested mat check: where is the robot's corner at the end of `turn 67`? New: a closest-approach table in Run Controls. `simulator/README.md`, "Table Walls and Model Outlines".
- Mission 11 in that video (checked frame by frame 2026-10-23): the "middle brown model" with flowers **is Mission 11**. Its root cover is up at 22.0 s; the robot's left front reaches the back of the model at about 23.6 s; the cover is down on the mat at 24.2 s and stays down. So Mission 11 scored in that run; the only failure was the freeze afterwards (the robot touched the model before `straight 15` reached 15 cm). Frames saved locally in `test-results/mission11-window-frames.jpg` (git-ignored). The simulator ends this bump with the robot front about 11 cm short of Mission 11, so don't judge Mission 11 with the simulator yet.
- Fix built 2026-10-21: `gyro-mission6-7-11.llsp3` (safety timers; see "Start here"). Not robot-tested.
- Turn overshoot about 5° per turn fits the video: with that setting, the old gyro mission reaches the Mission 11 bump facing -45°, as in the video. With ideal turns the simulated route misses the leafcutter and Mission 11 by 13-26 cm (from the mission badges) and passes about 10 cm from the D2 badge, for every version including the original. Mission badge positions are inferred. Use turn overshoot 5° when comparing simulated routes with the video. **Superseded 2026-10-23:** frame-by-frame measurement (`docs/route-from-video.md`) shows the headings land within about 1° of the typed turns after four turns (only `turn 20` looked about 4° long). The route differences came from a 15 cm slide in `turn 67`, not from overshoot. For video comparisons use about 1°, with Push, the pusher and the outlines.

Open items:

- Mission markers: Mission 10 (which habitat is which), Missions 6/7 (one shared marker) and the dock names (D2 farm, D3 city) are inferred; see `simulator/README.md`, "BIOGLOW Missions".
- Track width needs a ruler measurement. Body size was measured 2026-10-21 (184.15 × 168.275 mm, now the simulator default); body offset is still unmeasured.
- Mat rotation pivots on the mat centre and turns screen-clockwise; section 14 asks for the bottom-left corner. Not changed.
- No body offset yet. Attachment footprint: only the front pusher (2026-10-23, from video frames: 42 mm out, 43 mm wide, 12 mm left of centre). The port C arm is not modelled.
- Turn overshoot is a setting (Team robot preset 5°, Ideal 0°). Its real value still needs the approved `turn-test.llsp3` run (slot 19).
- Settings (track width, start pose, drive settings) reset on page reload; no save/load yet.

Next steps, in the order suggested to the user (each needs the user's go-ahead):

1. Save/load as versioned JSON, then named start positions (Milestone D, part 1).
2. ~~Table-edge collisions~~ Done 2026-10-22 (whole body box). Attachment footprints and body offset still open.
3. ~~Model obstacles~~ Done 2026-10-22 (15 outlines, estimates). Closest-approach table done 2026-10-22. Not done: measuring the real model footprints.
   Idea from the user's list: tweak a typed number in the simulator and see the path move (needs Milestone C, the editable command list).
4. Calibration: ruler measurement of track width; an approved `turn 90` and `straight` mat test to set a coasting/overshoot setting. Robot motion needs explicit approval (section 2).
5. Real-versus-simulated comparison: record where the real robot ended and show it beside the simulated end point.
6. Mat rotation pivot to the bottom-left corner (section 14 asks for it).
7. Optional: a 3D view. Discussed with the user: it would not make the simulation more accurate; calibration (step 4) matters more.

Resume in a new session: read "Start here" and this section, run `node --test tests/` from `simulator/` (expect 61 pass), run `python3 tools/serve.py` from the project root, open `/simulator/`, and drop `gyro-mission6-7-11.llsp3` on the page (the robot jumps to its start; expect it to finish at about 17.8 simulated seconds with the Team robot profile, 17.2 with Ideal). Evidence logs are in `simulator/test-results/*-checks.md`.

## 15. Simulator validation

Test where practical:

- Exact unit conversion.
- Straight motion from equal wheel speeds.
- In-place turning from opposite wheel speeds.
- Completed 360-degree relative turns.
- Team turn sign conversion.
- Gyro reset without pose change.
- Straight-helper calibration handling.
- Optional plain-move multiplier.
- No double correction.
- BA preservation.
- Reset behavior.
- All four table boundaries.
- Attachment collisions.
- Repeats.
- Invalid-input safety.
- Save/load round trip.
- Playback-speed independence.
- Resize independence.

Keep physics and execution logic testable without the DOM.

Provide manual checks when automation is unavailable.

Report actual tests, not intended tests.

## 16. Bluetooth hub tools

User reports USB did not enumerate LEGO vendor `0x0694`.

A managed-Mac restriction is only a hypothesis.

Prefer the recorded Bluetooth workflow unless asked to troubleshoot USB.

### Connection

1. Ask the user to quit SPIKE with Cmd+Q.
2. Ask them to press Bluetooth until the light blinks.
3. Retry scanning once if `NO HUB FOUND`.
4. Resolve actual hub identity before writes or motion.

Commands:

```bash
uv run --with bleak tools/spike_watch.py 10
uv run --with bleak tools/spike_run.py 19 tools/test_forward.py
uv run --with bleak tools/spike_run.py 19 clear
```

Inspect scripts before relying on their behavior.

`spike_run.py` overwrites its selected slot and may execute motion.

Never substitute slot 0.

### Recorded test scripts

`test_forward.py`:

- BA.
- 180 degrees wheel rotation.
- Logs A/B travel.
- Requires floor placement and user direction observation.

`test_turn.py`:

- Python copy of turnfix.
- Right 90, then left 90.
- Not the same as running the Word Blocks mission.

`test_old_turn.py`:

- Original 5.2% turn.
- 0.5-second wait.
- No early stop.

Recorded old-turn replay:

- Zero measured forward/backward creep.
- Stopped around 90.3 degrees.
- Settled around 91.1 degrees.
- About 5 seconds per turn.
- Did not reproduce the reported mission drift.

### Dependencies and attribution

System Python 3.9 reportedly failed to build Bleak dependencies.

Use the project's working `uv` workflow.

Retain LEGO attribution and:

`tools/LICENSE-LEGO-spike-prime-docs`

The user reports `cobs.py`, `crc.py`, and `messages.py` came from LEGO's `spike-prime-docs`.

## 17. Hub Python conventions

Recorded:

- `motion_sensor.tilt_angles()[0]` is yaw in tenths of a degree.
- Counterclockwise is positive.
- Convert before comparison with Word Blocks.

This pairing:

```python
motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
```

corresponds to AB.

Do not copy it unchanged into this robot's BA test.

Estimated large-motor conversion:

- Percentage times about 10.5 gives degrees/second.

That is unmeasured.

## 18. Open drift issue

User report:

During original `turn 67`, the robot sometimes creeps backward, finishes turning, and continues.

It was not reproduced in the recorded floor replay.

Marked location:

- Left of the drawn route.
- On the printed river.
- Above the green/black model at bottom-left.

User says it did not touch the middle brown model.

Leading unproven explanation:

Route variation may bring a rear corner against the nearby model during a slow turn.

Inspect actual clearance and record a run before concluding this is the cause.

Do not confuse intentional reverse moves with drift:

- Back 5 cm after slow forward 26 and turn 36.
- Back 15 cm after turn 85 and forward 13.
- Both recorded at speed 13.

Possible explanations for earlier backward driving include cable changes or a loose AB stack. They remain hypotheses.

Investigation 2026-10-23 (assistant; simulation, video and file evidence only, no robot): `docs/turn-creep-investigation.md`. Summary: (a) real backward wheel roll: the code never commands it in any turn (regression test), and the floor replay saw none. Unlikely. (b) Sliding from unequal wheels: 1 cm of creep in `turn 67` needs the wheels about 12-15 % apart. Possible, less likely. (c) Overshoot rotates rather than slides, but more overshoot means more contact. (d) Contact: the simulated `turn 67` brings the robot's front to the D2-dock outline (where the green-and-black model sits) in 71 of 180 plausible runs, if plain moves go about 17 % further than typed (1 of 180 if they go as typed). The video shows the corner right beside that model, and `turn 67` taking about 2.9 s against 0.78 s simulated. Leading explanation, medium confidence. Next: the A/B contact test in that doc.

Update 2026-10-23 (video measurement, `docs/route-from-video.md`): the creep is real and large. The robot centre moved about 15 cm back during `turn 67` (9.7 s to 12.6 s), while the frames show the front-right corner pressed against the green and black model. The team's route depended on it. `gyro-mission6-7-11_routefix` and `_routefix_creep` avoid the contact. Later the same day `turn 85` also showed a 6.5 cm slide with no contact, so fast-starting turns slide too (see "Start here").

## 19. Official mission evidence

Before giving mission-specific scoring or legality advice:

- Read the correct season and edition's rulebook.
- Check current Challenge Updates.
- Identify the mission or rule.
- Check relevant diagrams.
- Preserve document revision/date when available.
- Separate rules from strategy and assumptions.

Starting resources:

- https://www.firstinspires.org/resources/library/fll/season-materials
- https://www.firstinspires.org/programs/fll/game-and-season
- https://education.lego.com/en-us/first-lego-league/season-materials/
- https://spike.legoeducation.com/prime/help/lls-help-word-blocks

Do not borrow missions or scoring from another season or edition.

If documents are unavailable, request the relevant pages and limit advice to generic programming.

Do not pose as an official referee.

## 20. General programming guidance

For programming answers, provide:

1. Goal.
2. Confirmed configuration and assumptions.
3. Smallest useful change.
4. Ordered block instructions.
5. Plain-language explanation.
6. Controlled test.
7. Limits and untested behavior.

Use verified app labels when available.

Otherwise label instructions as descriptive pseudoblocks.

Do not invent opcodes, dropdowns, or import capabilities.

For new approved behaviors:

- Use bounded loops.
- Stop motors on success and failure.
- Avoid competing scripts controlling the same motors.
- Define fault behavior.
- Check units and direction signs.
- Validate zero and extreme inputs.

Do not silently retrofit these changes into protected baselines.

Encoder reset is not physical attachment homing.

Do not recommend prolonged motor stalling against a hard stop.

## 21. Test records

Use a simple log:

| Version | Project/segment | Start reference | Change | Trial | Success | Time | Observation |
|---|---|---|---|---|---|---|---|

An initial five-trial practice set can help compare changes.

It is not an official FLL requirement or proof of reliability.

Test:

1. Helper alone.
2. Mission segment.
3. Whole route.

Diagnose the earliest divergence.

Change one parameter at a time.

Preserve a known-good version.

## 22. Required validation labels

Use applicable labels accurately:

- File inspected.
- Archive/JSON checked.
- Simulator browser-tested.
- SPIKE project opened.
- Word Blocks edited.
- New `.llsp3` exported.
- Exported copy reopened.
- Simulated.
- Python replay tested.
- Word Blocks tested on hub.
- Mat route tested.
- Not tested.

For each claim, name the file, tool, test, observer, and limits where relevant.

Do not equate:

- Valid JSON with app compatibility.
- App compatibility with correct robot behavior.
- Python replay with Word Blocks execution.
- Simulated agreement with physical agreement.

## 23. Student turn-fix notes

Keep the student explanation in:

`docs/Harrison_Lucas_Kai_leafcutter_uncover_turnfix.md`

Do not paste it into AGENTS.md as a second competing instruction document.

Explain:

- What changed.
- Why it changed.
- What stayed the same.
- The speed formula with examples.
- The meaning of yaw and abs.
- Why BA is protected.
- What tests were actually performed.
- What still needs testing.
- Safe, one-change-at-a-time tuning.

Use the bike-braking comparison.

Do not promise exact turns.

Do not call 8% a universal minimum.

Do not state 0.2 seconds is always enough for gyro reset.

Explain the upside-down test mistake and why forward checks belong on the floor.

## 24. Student ownership

Help students understand and explain their own work.

Encourage prediction, building, measurement, and reflection.

Do not fabricate:

- Engineering notebook entries.
- Student quotations.
- Test histories.
- Innovations.
- Judging evidence.

Label examples and templates.

Summarize genuine changes and observations for student review.

## 25. Final report for completed work

State:

- What files were created or changed.
- Which source files remained untouched.
- How to open or run the result.
- Which checks actually ran.
- Browser actions actually performed.
- Missing tools or files.
- Example or unconfirmed values.
- Known limitations.
- Hardware testing not performed.
- The specific next physical test, if relevant.

Deliver files when tools permit.

Do not claim a file exists until it has been created and verified.

Do not claim success beyond the evidence.

## 26. Version control

Set up on 2026-10-21:

- Git repository at the project root, branch `main`. First commit `37990ca` (all 53 files).
- Repo identity: `Sebastian Ang <angdajiansebastian@gmail.com>` (local config). The global git email is a work address; do not use it here.
- Remote: `git@github-sang2925:sang2925/spikeprime.git`. **Made public by the user on 2026-10-24.** The user decided students' first names in file names are fine (no last names or other details); do not add any other student information. The repo also tracks FIRST's BIOGLOW PDFs (rulebook, field setup guide, challenge updates, wireframe, about 30 MB) and the rendered wireframe PNG the simulator needs; flagged to the user that these are FIRST's documents, now redistributed publicly. Their decision.
- GitHub Pages (2026-10-24): `index.html` at the root redirects to `simulator/`, and `.nojekyll` turns off Jekyll. The simulator is static (no build, relative paths), so Pages serves it as is: switch Pages on in the repo's Settings, Pages, "Deploy from a branch", `main`, `/ (root)`. Expected address `https://sang2925.github.io/spikeprime/` (redirects to `/simulator/`). Pages only shows what is pushed. No `gh` CLI on this Mac; the user switches it on and pushes.
- `github-sang2925` is a host alias in `~/.ssh/config` using `~/.ssh/id_ed25519_sang2925` (created 2026-10-21, no passphrase). Backup of the old config: `~/.ssh/config.bak-2026-10-21`. Plain `github.com` uses `id_ed25519`, which logs in as `sang2925-pnnl`.
- Pushed: `origin/main` was at `c0ae73e` on 2026-10-21 and matched the local branch (user pushed; `ssh -T git@github-sang2925` answers "Hi sang2925!"). Whether the GitHub repo is private was not checked by the assistant; confirm in the repo settings.
- `.gitignore`: `.DS_Store`, `__pycache__/`, `*.pyc`, `node_modules/`, `*.tmp`, `simulator/test-results/*`, (2026-10-21) `videos/` and `test-results/`, and (2026-10-23) `.playwright-mcp/` (the Playwright MCP writes its logs there).
- The user commits and pushes manually. Uncommitted at the end of 2026-10-21: the simulator changes, the gyro-mission6-7-11 files and tools, `samples/`, and AGENTS.md.
````