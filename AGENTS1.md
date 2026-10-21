# AGENTS.md: LEGO SPIKE Prime projects

## Working rules

- Save every file in this directory: notes, scripts, test programs, edited `.llsp3` copies. Do not use `/tmp` for anything you need to keep.
- The audience is 10–12 year old students. Write notes (`*.md`) in plain words with short sentences, tables, and everyday comparisons.
- Never change an original `.llsp3` file. Save edits as a copy with a suffix (for example, `_turnfix.llsp3`), plus a matching `.md` that explains the change.
- Before saying that something works on the robot, test it on the hub (see "Hub tools"). Say what was tested and what was not.

## Files

| File | What it is |
|---|---|
| `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` | Original team project. Do not change it. Main program uses `BA`. |
| `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.llsp3` | Fixed copy: new `turn` block. Main program still uses `BA`. **Do not change `BA`.** |
| `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.md` | Notes on the fix, written for the students. |
| `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` | Gyro version of the mission, built from `Team Template` (2026-10-14). Every `move X cm` became `straight` with the same real distance (X × 20.5/17.5, rounded: 30 → 35), at the same speeds (50 / 13 / 100). The extra `stop moving` and mid-mission `set movement speed` blocks were removed. Download slot **1**, so the working mission in slot 0 stays. The simulator shows it ends within 1 cm of the turnfix path. **The user ran it and it works (2026-10-14). Not confirmed yet: whether it reaches the same spots on the mat as the slot 0 version.** If it overshoots by about 17%, the "move blocks overshoot" guess was wrong: use the original numbers (30, 40, 27, …). |
| `Team Template.llsp3` | **Start every new mission from a copy of this file.** It has the setup blocks (`BA`, speed 50), the `turn (degrees)` and `straight (cm) at speed (%)` My Blocks (both tested on the mat), and comments that explain each part. The download slot is set to 19, so change it for each mission. |
| ~~`Straight Test.llsp3`~~ | Moved to the Trash by the user on 2026-10-14. It was the mat test for `straight`: with `17.6`, 50 cm drove about 20 in (50.8 cm), stayed straight, and came back to the tape. The tested block lives on in `Team Template.llsp3` and the gyro mission. |
| ~~`armflip.llsp3`~~ | Removed from the folder by the user on 2026-10-14. It was an old arm-flip program on the same robot: `AB` with `move back 26 inches` to drive forward (which matches "AB = reversed"); arm on port C turned 120° counterclockwise and back. |
| `docs/IfThenBlocks.md`, `docs/SP3AccurateTurning.md`, `docs/SP3GyroMoveStraight.md` | Prime Lessons reference pages (SPIKE 3), added by the user. Check these before inventing a turning or move-straight method. |
| `docs/leafcutter_path_drawing.png` | Photo of the mat with the leafcutter mission's path drawn in red by the user: leave base (bottom right), go out and around the model in the middle, push the model at the red dot (top, slow part), drive home. The PART 1/2/3 comments in the gyro mission are based on this drawing. |
| `paths/` | Path pictures from the simulator. Throwaway. |
| `tools/` | Bluetooth hub tools (below). |

**Comments (rewritten 2026-10-14 for 10–12 year olds and SPIKE beginners):** `Team Template.llsp3` and the gyro mission have a comment on every important block, plus a **WORDS TO KNOW** comment on `set movement motors` (degrees, gyro, yaw, My Block, %, abs). The template's setup comment is a **START HERE** with 3 steps for making a new mission. Style rules: short sentences; say "times" and "divided by" (and once explain that `*` and `/` in blocks mean that); no code-style arrows; a worked example for every number; an "if it does X, try Y" tip for every tuning number; everyday comparisons (bike braking, shopping cart, stopwatch, tank). Box size: height ≈ 19 px × wrapped lines (about width ÷ 9 characters per line) + 80, or the SPIKE app cuts off the text. There's no script that rebuilds these comments, so edit them in the SPIKE app from now on.

## `.llsp3` format

- An `.llsp3` file is a zip containing `manifest.json`, `scratch.sb3`, `icon.svg`, and `monitors.json`.
- `scratch.sb3` is another zip containing `project.json` plus asset files. The blocks are in `targets[1].blocks`.
- To edit: read the bytes **first**, patch them in memory, write to a `.tmp` file, then `os.replace` it over the original. **Never write `open(P, "wb").write(f(open(P, "rb").read()))`**: Python opens the `"wb"` file first, which empties it before it gets read. That wiped the turnfix file on 2026-10-14; it was recovered from a copy still in memory. Replace one string in `project.json` that appears exactly once (assert the count is 1), check it still parses as JSON, and rebuild both zips with the same member order. Then tell the user to open the file in the SPIKE app to check it.
- **The SPIKE app can overwrite your edit.** On 2026-10-14 the `BA`→`AB` edit to the turnfix file disappeared: the file came back with the app's 12:16 save (`lastsaved` in `manifest.json`, permissions `-rw-------`). Before editing, ask the user to close that project in the SPIKE app. After editing, check `manifest.json` → `lastsaved` and the field you changed.
- Comments: put them in `targets[1].comments` as `{id: {blockId, x, y, width, height, minimized, text}}`, and set `"comment": id` on the block they belong to. The SPIKE web app shows them (checked 2026-10-14).
- To check a file opens in the SPIKE web app without the user: open `https://spike.legoeducation.com/prime/` in the browser tool and click **GOT IT**. Replace `window.showOpenFilePicker` with a stub that returns `{kind:'file', name, getFile: async () => File}`, click **Open Project**, then take a screenshot.
- **Tried and reverted (2026-10-14): robot-settings variables + a `check gyro` My Block.** With them added, nothing happened when the user pressed play, so the user asked to go back to typed-in numbers and no gyro check. Both files are back to how they were before. **Do not add variables again unless the user asks.** If they do, two likely causes of the failure, found by exporting a project made in the real app: (1) the app keeps variables in `targets[1].variables` (the sprite), but they had been put on the Stage (`targets[0]`); (2) the app writes `stop all` as `flippercontrol_stop` with `fields: {STOP_OPTION: ["all", null]}` and no menu shadow block, but it had been built with a shadow menu input. Variable inputs look like `[3, [12, name, id], [10, "0"]]`.
- `straight` My Block (built 2026-10-14): resets yaw, waits 0.2 s, sets B's relative position to 0, then `repeat until abs(B relative position) > abs(cm) × 17.6`, with `start moving at left: speed×sign − yaw×2, right: speed×sign + yaw×2`, then `stop moving`. Word-block yaw goes up when the robot turns clockwise, so `left − yaw×k` steers it back. **17.6 wheel degrees per cm was measured on the mat** (the first guess, 20.57 from the app's 17.5 cm per wheel turn, drove 17% too far).
- More-motor opcodes, taken from the SPIKE web app's JS bundle and checked by rendering them in the app: `flippermoremotor_motorSetDegreeCounted` (PORT → shadow `flippermoremotor_multiple-port-selector`, field `field_flippermoremotor_multiple-port-selector`; VALUE) and `flippermoremotor_position` (PORT → shadow `flippermoremotor_single-motor-selector`, field `field_flippermoremotor_single-motor-selector`). Add `flippermoremotor` to `extensions` in both `project.json` and `manifest.json`.
- Only stacks under `flipperevents_whenProgramStarts` run when you press start on the hub. Loose stacks (no hat block) run only when clicked in the app.
- Motor pair block: `flippermove_setMovementPair` with field `field_flippermove_movement-port-selector` = `"BA"` / `"AB"`. The first letter is the left motor.
- The original file has 6 loose stacks and 1 empty `when program starts` block that are missing from the turnfix file.

## Path simulator (no robot needed)

```
python3 tools/sim_path.py                       # every .llsp3 in this folder
python3 tools/sim_path.py <project.llsp3> ...   # just these files
python3 tools/sim_path.py --watch               # keeps running; redraws a file when it is added or saved (Ctrl+C stops)
python3 tools/sim_path.py --as-written ...      # forward means forward, ignore the AB/BA wiring
python3 tools/test_sim_path.py                  # self-check after changing the simulator
```

- Writes `paths/<project>_path.svg` (the `paths/` folder is created if needed) and prints each step's x/y (cm) and heading. The pictures are throwaway: delete any you don't need, and they get redrawn on the next run. Projects with no blocks under **when program starts** are skipped, with a message.
- What it simulates:
  - `move` (cm, inches, rotations, degrees)
  - `repeat N`
  - custom blocks: the body runs with the arguments filled in
  - a custom block that reads motor relative position (like `straight`): a straight drive of its first number in cm (− = backward)
  - any other custom block that resets yaw: a gyro turn by its first number (N > 0 = right)
  - `start moving at left/right` followed by `wait until` / `repeat until` on yaw: a gyro turn (left > right = right turn)
  - simple `+ − × ÷` math
  - `set movement motors` (`AB` = reversed on today's robot)
  - attachment motors (`run motor for N degrees/rotations/seconds`, `set speed`): the label shows the running angle, for example `C at -131°` (clockwise +). Seconds are an estimate (`~`) from the set speed (default 75%, 100% ≈ 1050°/s; both are guesses, not measured). Which direction is "up" for the arm has not been measured yet.
- Anything else prints `NOTE: not simulated`. Show those notes to the user, because the path may be wrong after them.
- Assumes perfect turns in place and no wheel slip. Pivot turns (one wheel stopped) are drawn in place too. Real turns overshoot 1–2°, and the error adds up over a long path.
- Distances: the robot really drives about **20.5 cm per wheel turn** (measured with the straight test). The SPIKE app assumes 17.5 (`DEFAULT_FLIPPER_MOVE_CALIBRATION` in its code), so the simulator draws `move 30 cm` as about 35 cm. That `move` blocks overshoot like this is an inference from the straight test; to confirm, run a plain `move 50 cm` on the mat. The `straight` block is calibrated, so it is drawn at the cm asked.

## Robot facts (2026-10-14)

| Port | Device | Job |
|---|---|---|
| A | large motor | drive wheel |
| B | large motor | drive wheel |
| C | medium motor | attachment (used by the code) |
| D | medium motor | not used in this project |

- **`BA` is correct for this robot. Do not change it.** The user ran the `AB` version on the mat and it drove backward. The user also does not want the cables swapped.
- Mistake on 2026-10-14: a hand-roll test with the robot held upside down said `AB` was forward. It was wrong, because the user rolled the wheel while the robot was upside down. Don't decide which way is forward from a test with the robot lifted. Run a short move with the robot on the floor, right side up, and ask the user which way it went.
- Which wheel (left or right) is in A and which is in B is not confirmed, because that test was also done upside down.
- The original "robot drives backwards" report is still unexplained. Main suspects: cables swapped between weeks, or a loose `AB` stack was run.
- Turn direction is the same with `AB` and `BA`: `turn 90` = right/clockwise, `turn -90` = left (measured on the floor).
- New turn logic on the floor: 90° right → stopped at 91.9°, 90° left → stopped at 90.9°.
- Battery was 100%. The gyro stays steady when the robot is still (no drift).
- Hub: Bluetooth name `a`, firmware 1.8.149 (SPIKE App 3).
- Program slots: the mission is in **slot 0**, and the hub's left/right buttons show only slot 0. Use **slot 19** for tests and clear it afterwards.

## Hub tools (Bluetooth)

USB does not work on this Mac: no LEGO USB device (vendor `0x0694`) ever showed up. It is probably a managed work Mac. Use Bluetooth.

Before connecting:
1. Quit the SPIKE app (Cmd+Q). A hub that is connected to the app stays hidden.
2. Press the hub's Bluetooth button until its light blinks.
3. If the first scan says `NO HUB FOUND`, run it once more. That fixed it on 2026-10-14.

Commands, run from this directory:

```
uv run --with bleak tools/spike_watch.py 10                  # read-only: battery, yaw, every port, live
uv run --with bleak tools/spike_run.py 19 tools/test_forward.py   # upload to slot 19 + run, prints output
uv run --with bleak tools/spike_run.py 19 clear              # erase slot 19
```

- `spike_run.py` **overwrites** the slot you give it. Never use slot 0 unless the user asks.
- `tools/test_forward.py` drives 180° of wheel rotation forward with `BA` and prints how far motors A and B moved. Run it **on the floor** and ask the user which way the robot went. Do not trust the + / − signs to tell forward from backward. With `BA`, A goes + and B goes −, and on the mat that is forward.
- `tools/test_turn.py` is a Python copy of the turnfix `turn` block, run with `BA`: 90° right, then 90° left. Run it with the robot on the floor.
- `tools/test_old_turn.py` replays the ORIGINAL turn block (5.2%, wait 0.5, no early stop) and logs how far the robot's center moves. **Result 2026-10-14 on the floor:** 0° of forward/backward creep during the turn and 0° after the stop. It stopped at 90.3° and settled at 91.1°, and a 90° turn took about 5 s. So the old turn does not creep backwards by itself.
- **Open issue: "slowly drifts backwards during turn 67" (original code).** The robot creeps backwards during the slow 5.2% turn, then finishes the turn and goes on to the next block. It happened this week, not last week, and the user could not reproduce it on 2026-10-14. Floor replays showed 0 creep. Where it stalls: `docs/leafcutter_stall_spot.png` (red square). That spot is **left of the drawn path**, on the printed river, right above the green/black model at the bottom-left. It never touched the middle brown model. Leading guess (unproven): on some runs the robot ends up off the path near that green/black model, and during the slow spin its rear corner rubs the model, so it slides backwards. With plain `move` blocks and slow turns, where it ends up changes from run to run, which would explain this week vs last week.
- The mission itself also has slow backward moves on purpose: `move back 5 cm` (after the slow `forward 26`, right after `turn 36`) and `move back 15 cm` (after `turn 85` → `forward 13`), both at speed 13. Don't mistake those for drift.
- `cobs.py`, `crc.py`, `messages.py` are copied from LEGO's [spike-prime-docs](https://github.com/LEGO/spike-prime-docs) (Apache 2.0, see `tools/LICENSE-LEGO-spike-prime-docs`).
- System `python3` (3.9) can't build bleak's macOS dependencies. Use `uv`, which works.

## Hub Python notes

- `motion_sensor.tilt_angles()[0]` = yaw in tenths of a degree, counterclockwise positive. The word-block `turn` uses `abs(yaw)`, so the sign doesn't matter there.
- `motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)` does the same thing as the word block `set movement motors to AB`.
- To turn word-block speed % into deg/s, multiply by about 10.5 (large motor). This is an estimate, not measured.
