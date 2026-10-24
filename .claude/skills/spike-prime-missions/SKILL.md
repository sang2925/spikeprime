---
name: spike-prime-missions
description: Work on this FLL team's LEGO SPIKE Prime Word Blocks programs and the browser route simulator. Use when asked to change a mission program (.llsp3), make a new mission or variant, add step notes, check a program in the SPIKE app, run or extend the simulator (2D/3D, mission models, physics), compare a robot video with the simulator, or publish the simulator. Students are 10-12; the coach approves anything that touches the robot.
---

# SPIKE Prime missions and simulator

Read `AGENTS.md` first ("Start here" and the file table). It is the full record and wins over this skill.
This skill is the short version: how the pieces fit, the commands, and the traps we already hit.

## Ground rules (never skip)

- **Robot and hub:** no uploads, slot changes, Bluetooth or motion without the coach's explicit OK for that action. Test slot is **19**. Slot 0 is protected.
- **Movement pair stays BA.** Keep typed-in numbers; change one number at a time.
- **Never edit an original `.llsp3`.** Make a suffixed copy (by script), keep its `.md` notes in `docs/`.
- **Label evidence:** file inspected / SPIKE app opened / simulated / video / robot-tested. Never call a simulation or an app check a robot result.
- **Student text:** short sentences, plain words, "times" and "divided by", a worked example and an "if it does X, try Y" tip.
- The coach commits and pushes, unless they ask you to.

## Layout

| Where | What |
|---|---|
| top level | programs in use (`*_push28.llsp3`, `turn-test.llsp3`, `Team Template.llsp3`), `README.md` (kids), `AGENTS.md`, `index.html` + `.nojekyll` (GitHub Pages) |
| `archived-llsp3/` | originals and old versions (sources for the builders) |
| `docs/` | every student and grown-up note (`.md`) |
| `tools/` | builders and checkers (Python, Node) |
| `simulator/` | the web simulator; `tests/`, `tools/` (sweeps), `vendor/` (three.js r147) |
| `test-results/` | git-ignored: SPIKE screenshots, backups, instruction PDFs, video frames |

## Editing Word Blocks programs (`.llsp3`)

An `.llsp3` is a ZIP holding `manifest.json` and `scratch.sb3` (another ZIP holding `project.json`).
Edit by script, never by hand, and never with `open(P, "wb").write(f(open(P, "rb").read()))`.

1. Read every source byte first; build the change in memory; write `<out>.tmp`, then `os.replace`.
2. Refuse to overwrite an existing output (move the old one to `test-results/backups/` first).
3. Reopen the result and assert only the intended blocks and comments changed.
4. Set `manifest.name` (the simulator keys start poses on it) and `slotIndex` 19.
5. Check in the real app (read-only, own Chrome profile):
   `node tools/spike_open_check.mjs <file>.llsp3 test-results/spike-open ~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`
   then move `test-results/spike-open/*.png` and `result.json` into a per-file folder.

Facts that save time: a My Block call stores its number at `inputs[argId] = [1, [10, "value"]]`
(the `straight` cm argument id is ``w@.(AFiXfRyrQ`59;NMC``). Comments live in `targets[sprite].comments`
and the block points at them with `"comment": id`. Copy unfamiliar block shapes from `samples/*.llsp3` (real exports).

Builders (all refuse to overwrite):
- `python3 -I tools/build_mission6_7_11_routefix.py [routefix|routefix_creep]` (route-fix numbers)
- `python3 -I tools/add_step_notes.py <src> <out> --push=N` (step 7 push number + a one-line note beside every step)
- `python3 -I tools/build_turn_test.py`, `python3 -I tools/build_gyro_mission6_7_11.py`

Step notes in SPIKE: blocks sit 49 workspace units apart (first one about 63 below the hat). A note needs about
70 units to show its first line, so put notes in two alternating columns (x 400 and 660, width 240), with a
headline of 26 characters or fewer. Folded (minimized) notes show almost nothing.

## The simulator

- Run: `python3 tools/serve.py` (no-cache server), open `http://localhost:8000/simulator/`. Drop an `.llsp3` on the page.
- Tests: `node --test tests/` from `simulator/` (keep them passing; old programs load from `archived-llsp3/`).
- Route sweep: `node tools/mission6_7_11_sweep.js [--creep=N] [--offset=N] <files>` from `simulator/`.
- Files: `physics.js` (fixed 5 ms steps, collisions, push mode), `wordblocks.js` (runs the real blocks),
  `llsp3.js`, `missions.js` (BIOGLOW mission data, outlines in wireframe pixels, `START_POSES`),
  `app.js` (UI, kid view, 3D wiring, mission reactions), `view3d.js` (three.js drawing only),
  `models3d.js` (LEGO-style mission models and their moving parts).
- **Video match settings** = turn creep 60 mm, overshoot 2°, offset 0, Push, front pusher, all outlines but the
  leafcutter body. Use it whenever you compare with the team video.
- **Bump `?v=` in `simulator/index.html`** whenever a JS or CSS file changes; GitHub Pages caches for 10 minutes.

### Mission models

Built by eye from FIRST's building instructions (13 PDF books; download to `test-results/instructions/`),
matched to missions with the rulebook pictures, and placed on the wireframe outlines. Before trusting a placement,
check the Field Setup Guide (`simulator/assets/bioglow-field-setup-guide.pdf`): p. 2 is the placement map and
pp. 3-16 show each model on the mat. Wireframe pixel to mat: subtract the crop (166, 636), times 1996.7/2967 mm.
Moving parts are `moves` in `models3d.js` (hinge or slide, driven by a 0-1 state from `app.js`).

## Comparing with a robot video

- Frames: `ffmpeg -ss <t> -i videos/<file>.MOV -frames:v 1 out.jpg`; crop the area of interest and look before claiming.
- Positions: match frames to the official mat picture (OpenCV SIFT + RANSAC homography), pick robot corners, map to mm.
- Timing: the motor sound shows block starts and ends.
- Watch the mission parts, not just the robot: in the 2026-10-23 video the robot stopped at about 24 cm, but the
  leafcutter ant was still 5-7 cm from the nest, so Missions 06/07 did not score.

## Reading PDFs on this Mac

There is no poppler. Use Swift PDFKit: extract text with `PDFDocument(...).page(at:).string`, render pages by
drawing `page.draw(with: .mediaBox, to:)` into an `NSImage` and saving PNG. Tile pages with ffmpeg `hstack`/`vstack`
from a bash script (zsh mangles `[$i:v]`).

## Finish every change

Run the tests, check the page in the browser (no console errors), update `AGENTS.md` (what changed, how it was
checked, what is still a guess) and the kid `README.md` if students will see it, then offer to commit.
