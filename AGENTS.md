````markdown
# AGENTS.md: LEGO SPIKE Prime projects

## Purpose

Help our team build, understand, edit, and test LEGO SPIKE Prime Word Blocks programs.

Also help us build a local browser-based 2D route-planning simulator.

The students are 10–12 years old. Explain things in plain words. Use short sentences, clear tables, worked examples, and everyday comparisons.

Create actual files when asked. Do not give only a plan when the task is to build or edit something.

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
- Save changes as a suffixed copy, such as `_turnfix.llsp3`, with a matching `.md` explanation.
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

If serving is needed:

```bash
python3 -m http.server 8000
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
| D. Collisions, save/load, examples | Not started. UI shows "Boundary and obstacle collisions are not enforced yet." |

Files: `simulator/index.html`, `styles.css`, `app.js` (UI), `physics.js` (no DOM), `llsp3.js` (ZIP reader, no DOM), `wordblocks.js` (Word Blocks interpreter, no DOM), `tools/pdf_render.swift`, `assets/`, `tests/`, `test-results/`.

Run: `python3 -m http.server 8000` from the project root, open `http://localhost:8000/simulator/`. Tests: `node --test tests/` from `simulator/` (32 pass on 2026-10-21). Evidence logs: `simulator/test-results/milestone-b-checks.md`, `program-runner-checks.md`.

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

Findings (simulated, not robot-tested):

- `turn 0` is a no-op (0.2 s wait).
- `turn` with more than 180 degrees never finishes because yaw wraps at ±180°; the simulator faults after 300 s.
- Ideal motors stop each `turn N` between N - 1 and N - 0.5 degrees. The recorded hub replay stopped 1-2° past N. Simulated routes therefore turn slightly less than the real robot.

Open items:

- Track width needs a ruler measurement.
- Mat rotation pivots on the mat centre and turns screen-clockwise; section 14 asks for the bottom-left corner. Not changed.
- No body offset or attachment footprint yet.
- A "keeps rolling after stop" setting would need a measured, approved `turn 90` mat test.

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

`Harrison_Lucas_Kai_leafcutter_uncover_turnfix.md`

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
- Remote: `git@github-sang2925:sang2925/spikeprime.git`. The repo must stay private: file names contain students' first names, and it holds FIRST's BIOGLOW PDF.
- `github-sang2925` is a host alias in `~/.ssh/config` using `~/.ssh/id_ed25519_sang2925` (created 2026-10-21, no passphrase). Backup of the old config: `~/.ssh/config.bak-2026-10-21`. Plain `github.com` uses `id_ed25519`, which logs in as `sang2925-pnnl`.
- First push not done yet: the public key still had to be added to the sang2925 GitHub account. Check with `ssh -T git@github-sang2925`, then `git push -u origin main`.
- `.gitignore`: `.DS_Store`, `__pycache__/`, `*.pyc`, `node_modules/`, `*.tmp`.
````