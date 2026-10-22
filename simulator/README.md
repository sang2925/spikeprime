# SPIKE Prime Browser Simulator - Milestone B

## Project Summary

A local, offline-capable browser-based simulator for LEGO SPIKE Prime FIRST LEGO League route planning.

**Key Features Implemented:**
- ✅ Scaled competition table (2362.2 × 1143 mm) with proper aspect ratio
- ✅ Configurable grid overlay (minor/major spacing in mm)
- ✅ Mat placement system with X/Y offset and rotation controls
- ✅ Background image upload with crop, opacity, and orientation controls
- ✅ Robot placement with configurable dimensions, position, and heading
- ✅ Start pose save/reset functionality
- ✅ Cursor position display (mm and cm)
- ✅ Zoom and pan controls
- ✅ Mat bounds warning system
- ✅ Aspect ratio checker for background images

## Files Created/Modified

### `/simulator/index.html`
- Main HTML structure
- Control panels for all features
- Canvas container for rendering

### `/simulator/styles.css`
- Complete styling for the application
- Responsive layout
- Control panel styling
- Canvas and UI element styling

### `/simulator/app.js`
- Complete application logic
- State management
- Canvas rendering system
- Event handlers for all controls
- Coordinate transformation utilities
- Movement test panel, telemetry, path drawing (uses `physics.js`)

### `/simulator/physics.js`
- Differential-drive physics, fixed timestep, encoders, gyro, table walls and optional convex obstacles. No DOM, so it runs in Node tests.

### `/simulator/llsp3.js`
- Reads a `.llsp3` file in memory (ZIP inside ZIP, then `project.json`). Read-only.

### `/simulator/wordblocks.js`
- Runs the Word Blocks themselves (including the team's My Blocks) against `physics.js`, one 5 ms step at a time. Applies the optional turn-overshoot estimate.

### `/simulator/missions.js`
- The 15 BIOGLOW missions (scoring lines, notes, Challenge Updates), where each model sits on the wireframe, the optional model outlines (obstacles) and the per-project start poses. No DOM.

### `/simulator/tests/`
- `physics.test.js`, `wordblocks.test.js`, `missions.test.js`. Run from `simulator/`: `node --test tests/` (Node 18 or newer).

## Running a SPIKE Program (.llsp3)

1. Put the robot where it starts on the mat: drag it to move it, and use **⟲ Turn left 90°** / **⟳ Turn right 90°** to turn it. For other angles, type the heading. You can use a different start every run. The next **Run program** starts from where you put it and saves that as the start pose. (The robot is locked while a program is running or paused: press **Stop** first.)
2. Open your project: **drag the `.llsp3` file onto the page** (anywhere), or in **Program (.llsp3)** click **Choose File**, for example `Harrison_Lucas_Kai_leafcutter_gyro.llsp3`. The file is only read. Dropping only opens it; it does not start it, so you can place the robot first. A drop is refused while a program is running (press **Stop** first), and anything that is not a `.llsp3` file is ignored with a message.
3. Click **Run program**. The robot goes back to the start pose and runs the whole program. Running it again without moving the robot starts from the same place, not from where the last run ended. The running block is highlighted in red. **Now:** shows the block inside the My Block, for example `turn 67 › repeat until abs(yaw) > (abs(degrees) - 1)`.
4. Or click **Next block** to go one block at a time. The robot stops each time a new main block starts. Use **Step 5 ms** (in Run Controls) to go even slower.
5. Watch the Word Blocks yaw, the motor positions, and any **NOTE** lines (blocks the simulator cannot do).

How it works: the simulator does not guess what a My Block means. It runs the real blocks inside it: `set yaw angle to 0`, `wait`, `repeat until`, `start moving at left/right`, the maths, and so on. Every 5 ms the program looks at the simulated gyro and encoders and sets the wheel speeds. Then the physics moves the robot.

Blocks it can run: when program starts, set movement motors (BA, AB), set movement speed, move (cm, inches, rotations, degrees, seconds), start moving at left/right, stop moving, set yaw angle to 0, yaw/pitch/roll, set relative position, relative position, motor C/D run for (degrees, rotations, seconds), set motor speed, wait, wait until, repeat, repeat until, forever, if/else, My Blocks, variables, maths and comparisons, stop. Anything else is skipped with a NOTE.

Assumptions (not confirmed on the robot):

| Assumption | Why |
|---|---|
| Port B turns the left wheel, A the right | The only layout that matches both records: BA drives forward, and `turn 90` turns right |
| Pair AB drives backward, turns the same way | Follows from the line above; matches the record that AB drove backward |
| One loop pass = one 5 ms step | The hub's real loop speed is not measured |
| Yaw reads in 0.1° steps, wraps at ±180°; motor positions read whole degrees | Recorded hub Python reads yaw in tenths of a degree; SPIKE motors count whole degrees |
| Default movement speed 50 %, motor speed 75 % | Used only if the program does not set a speed |
| Speeds above 100 % are cut to 100 % | Not checked on the hub |

Things the simulator found in the team's own blocks (simulated, not tested on the robot):
- `turn 0` does nothing (it only waits 0.2 s).
- `turn` with more than 180 degrees never finishes, because yaw wraps at ±180°, so `abs(yaw)` can never get past 180. The simulator stops it after 300 s.
- With ideal motors, each `turn N` stops between N - 1 and N - 0.5 degrees. The recorded Python replay on the hub stopped about 1-2° **past** N, because a real robot keeps rolling a little after "stop". So the simulated route turns a little less than the real one.

## How to Use

1. **Open the simulator:**
   - From the project root run `python3 tools/serve.py` (it turns off browser caching, so edits show after a normal refresh), then open `http://localhost:8000/simulator/`
   - You can also double-click `index.html`. Drag-and-drop and the BIOGLOW picture worked from a `file://` page in Chrome launched with `--allow-file-access-from-files`; plain Chrome without that flag was not tested.
   - The left panel shows what you use every run, in order: **View**, **Program**, **Run Controls**, **Robot Placement**, **Sensors and Telemetry**. The setup panels below them (**Drive Settings**, **Table Dimensions**, **Mat Placement**, **Background Image**, **Grid Settings**, **Movement Test**, **Cursor Position**) start closed. Click a title to open or close it. Everything inside a closed panel still works and is still locked during a run.

2. **Add a background:**
   - The BIOGLOW wireframe loads by itself when the page opens. After **Remove Background** or an upload, click **Load BIOGLOW Wireframe** to bring it back. Or click "Choose File" and pick a PNG/JPG of your mat
   - **Show background** checkbox and **Opacity** slider control how it looks
   - **Crop** (image pixels, from the top-left) picks the part of the image that is the mat edge. The red box in the small preview shows it. **Reset Crop** puts it back.
   - The cropped picture is never stretched. If its shape does not match the mat, it is drawn as big as fits and centred, and a warning shows the difference.
   - The picture moves and rotates with the mat.
   - The picture is artwork only. It is not used for collisions or sensors.

3. **Position the mat:**
   - Adjust Mat X/Y offset and rotation
   - Warning appears if mat extends outside table boundaries

4. **Configure your robot:**
   - Set robot dimensions (length/width)
   - Adjust position and heading
   - Use "Save as Start Pose" to mark starting position
   - "Reset to Start Pose" returns robot to saved position

5. **Navigate the view:**
   - Use zoom slider or mouse wheel
   - Click "Fit to View" to see entire table
   - Toggle grid visibility

6. **Movement test (Milestone B):**
   - Set **Left** and **Right wheel speed** (-100 to 100 %) and **Duration** (simulation seconds, up to 600).
   - **Start test** drives both wheels at those speeds, then stops by itself when the time is up.
   - In **Run Controls** (shared by tests and programs): **Pause/Resume**, **Step 5 ms** (one physics step, only while paused), **Stop** (keeps the robot where it is).
   - **Reset** stops, puts the robot back at the saved start pose, and clears time, encoders, gyro and path. Settings, mat and background stay.
   - If no start pose is saved, the first **Start test** saves the current pose as the start pose.
   - **Playback speed** only changes how fast the steps run on screen. 1 s of simulation always gives the same result.
   - While a test is running or paused, mat, robot placement and drive settings are locked, and the robot cannot be dragged.
   - Switching to another tab pauses the test. Press **Resume** to go on; the robot does not jump ahead.
   - **Reset gyro** works while stopped or paused. It sets the gyro to 0 and does not move the robot.
   - **Show path** / **Clear path** control the yellow traveled-path line.

   Try it:

   | Left % | Right % | What the robot does |
   |---|---|---|
   | 50 | 50 | Straight forward |
   | -50 | -50 | Straight backward |
   | -30 | 30 | Spins in place, counterclockwise |
   | 30 | 60 | Curves left |
   | 0 | 50 | Pivots around the left wheel |

## Conventions

| Thing | Rule |
|---|---|
| Units | Millimetres inside the simulator |
| Origin | Bottom-left corner of the table interior |
| X / Y | X goes right, Y goes up |
| Robot position | Midpoint between the two drive wheels |
| World heading | 0 points right. Counterclockwise is + |
| Gyro | Heading change since the last gyro reset, counterclockwise +, not wrapped (two left spins = 720°). SPIKE Word Blocks yaw counts **clockwise** as +, so it has the opposite sign. |
| Wheel speed % | + rolls that wheel forward. This is a logical sign, separate from how the motor is mounted. |
| Encoder sign | Which way the motor counts when its wheel rolls forward (+1 or -1). It changes only the encoder reading, not the motion. |
| Encoders | Logical left/right motor degrees. They are **not** ports A/B: the team pair is BA, but which of A/B is left is not confirmed. |
| Time, encoders | Keep counting across tests until **Reset** |

## Gearing and Speed

Worked example with the default settings at 50 %:

1. Motor speed = 50 % of 1050 deg/s = **525 deg/s**.
2. Wheel speed = motor speed divided by gear ratio = 525 divided by 1 = **525 wheel deg/s**.
3. Wheel circumference = π times 65.3 mm = **205.1 mm** per wheel turn.
4. Ground speed = 525 divided by 360, times 205.1 = **299.2 mm/s**.
5. Turning rate = (right ground speed minus left ground speed) divided by track width, in radians per second.

Gear ratio = motor turns per wheel turn. A gear ratio of 3 means the motor turns 3 times for 1 wheel turn: the wheel is 3 times slower and the encoder still counts motor degrees.

The robot moves along the exact arc for its two wheel speeds every 5 ms step. The last step of a test is shortened so the test ends exactly on its duration.

## Example vs Measured Settings

| Setting | Default | Where it comes from |
|---|---|---|
| Wheel diameter | 65.3 mm | Team record: about 20.5 cm per wheel turn (205 divided by π). Not measured by the simulator. |
| Track width | 112 mm | **Example.** Measure between the centre lines of the two wheels' contact patches. |
| Gear ratio | 1 | **Example.** Direct drive assumed. |
| Max motor speed | 1050 deg/s | **Estimate** (about 10.5 deg/s per 1 %). Not measured. |
| Encoder signs | +1 / +1 | **Example.** Not set from the robot. |
| Body length × width | 184.15 × 168.275 mm | **Team measured** (7 1/4 in front to back, 6 5/8 in side to side, no attachments). Where the wheels sit inside this box is not measured. |
| Robot profile | Team robot | Sets the two rows below together. **Team robot** = plain-move mode "Team guess" and turn overshoot 5°. **Ideal robot** = "Drive the cm asked" and 0° (the old defaults). Editing either by hand shows Custom. Both numbers are estimates (added 2026-10-22). |
| Turn overshoot | 5° | **Estimate setting**, read from the gyro video, not measured. 0 = ideal motors that stop at once. |
| Table walls | On | The body box stops at the table interior walls (added 2026-10-22). |
| Model outlines (15) | All off | **Estimates.** Wireframe outlines, ticked one by one or All on. See "Table Walls and Model Outlines". |

If the simulated robot turns too fast or too slow compared to the real one, check track width first.

## Turn Overshoot and the Mission 11 Obstacle (added 2026-10-21)

Both were added to test why the real gyro mission stopped at Mission 11. The Mission 11 obstacle is off by default. Turn overshoot was 0° by default when this was written; since 2026-10-22 the Team robot profile sets it to 5° (see "Table Walls and Model Outlines" and Drive Settings).

**Turn overshoot** (Drive Settings, degrees). When "stop moving" ends an in-place spin (wheels turning opposite ways), the robot keeps spinning this many more degrees, then stops. It only affects `.llsp3` programs. A note in the program notes says when it was used.

- Simplification: the program waits for this extra spin before the next block. On the hub the next block starts at once. Without the wait, the next `straight`'s "set yaw angle to 0" would happen before the extra spin and the `straight` would steer it back out.

**Mission 11 obstacle** (the first tick box in the BIOGLOW Missions list). Mission 11's wireframe outline (a diamond about 8 cm on a side, centre about (158.8, 59.2) cm) is drawn in red and blocks the robot body.

- If the body would touch it, the robot stays at its last safe pose, encoders and time do not change, and the run pauses. The Sensors panel names the obstacle, the time and the wheel speeds. Resume tries the same step again, so a blocked robot stays blocked.
- A start pose that already touches it is refused.
- The body is the measured box centred on the wheel midpoint. A 5 ms step moves at most about 2 mm, so the robot cannot jump through the obstacle.
- The real model's red base plate, lever and plants stick out past the outline.

**Finding (simulated only, 2026-10-21).** Video of a real run (`videos/gyro_run1.MOV`, not in git) shows the robot stopping for good against the Mission 11 model during block 11 (`straight 15 cm at speed 13`). The `straight` My Block has no timeout, so it waits forever and the last four blocks never run. In the simulator, from the start pose read off the video (2099, 265 mm, facing 180°) with the obstacle on:

| Turn overshoot | Result |
|---|---|
| 0°, 5°, 8°, 10°, 15°, 20° | Program finishes. The robot never touches the Mission 11 outline. |

More overshoot turns the whole route further clockwise, which matches the heading seen in the video (about 45° clockwise in block 11 at about 5° per turn). It still leaves at least about 6 cm between the body and the outline. Moving the body forward of the wheels by up to 6 cm (tested in a script, not in the app) does not close the gap either. So these two settings alone do **not** reproduce the jam. Not yet measured: the real Mission 11 footprint including its base plate and lever, the body offset, a real `turn 90` overshoot, and where the robot really is when block 11 starts.

## Table Walls and Model Outlines (added 2026-10-22)

**Table walls** (Run Controls checkbox, on by default). The whole body box (184.15 × 168.275 mm, centred on the wheels) must stay inside the table interior (2362.2 × 1143 mm). If any corner would cross a wall, the robot stays at its last safe pose and the run pauses, with a message naming the wall (for example "the left table wall"). A body corner exactly on a wall still counts as inside. A spin in a corner can pause the run too, because the corners swing out. Starting over a wall is refused.

**Model outlines** (BIOGLOW Missions, one tick box per model, all off by default, plus All on / All off). Fifteen outlines: missions 01 to 12 (10 and 12 have two parts) and the docks D1, D2 and D3. Same pause rule as Mission 11 above. How they were made: each corner was read off a zoomed crop of the wireframe picture with a ruler grid, good to about 5 px (about 3 mm). The picture is a diagram, not exact scale. Boxes are used for boxy models, the convex hull for diagonal ones (so empty corners count as solid), and 12-sided circles for the two round pads. Thin arms are left out (08·09). The real models' levers, plants and wires stick out further, so the real clearance is smaller than the simulator shows. Printed black lines and launch-area shapes are on the floor and are not included. The robot touches 06·07 and 11 on purpose, so ticking those pauses the run when it pushes them.

**Finding (simulated only, 2026-10-22; corrected the same day after an invalid first trial).** Team robot settings, `gyro-mission6-7-11`, start (2099, 286) mm facing 180°, all 15 outlines ticked:

- The run **pauses at 3.69 s in `turn 67`**: a body corner touches the **D2 dock** outline by under 1 mm (robot at about (1317, 482) mm).
- With D2 unticked it pauses at 5.14 s in `turn 36`, on the **lower Mission 10** outline, again by under 1 mm.
- With D2, lower Mission 10 and 06·07 unticked, the whole route finishes (17.8 s). Closest then: the top table wall 10 mm (the leafcutter push, `straight 30`), Mission 11 77 mm (the bump block stops about 8 cm short of the model in the simulator, although the real robot reaches it), the lower Mission 12 part 99 mm, D1 107 mm.
- The outlines are good to about 5 mm and the start to about 2 cm, so both touches are inside the error: "clips D2" is possible and **unproven**. The same route also runs only 10 mm from the top wall, which suggests the simulated route is further up the table than the real one. The original `uncover` shows the same D2 near miss.
- Check on the mat: where is the robot's corner when `turn 67` finishes, and how far is it from the D2 model?

**Closest approach table** (Run Controls, under the walls checkbox): for each wall and ticked model, the smallest gap the body box reached during the run, the time, and the top-level block that was running. Nearest first, eight rows. It clears on Reset or when you tick or untick a model. A run that pauses on contact shows the contact at the top.

## Known Limitations (Milestone B)

- Walls and outlines use the measured body box centred on the wheels. There is no body offset or attachment footprint yet, so attachments sticking out are not checked.
- Ideal motion: no slip, no noise, no motor acceleration. Speed changes instantly. No coasting after stop unless the turn-overshoot estimate is set. Real turns end 1-2° further than simulated ones (see above).
- The body is drawn centred on the wheel midpoint. There is no body offset or attachment footprint yet.
- Mat rotation turns around the mat centre and in the screen-clockwise direction; AGENTS.md asks for rotation about the mat's bottom-left corner. Not changed in this milestone.
- No editable command list yet (Milestone C). Programs come only from `.llsp3` files, and nothing is ever saved back to `.llsp3`.
- No color sensors, line following, scoring, sounds, or lights.
- The telemetry gyro is not wrapped. The Word Blocks yaw in the Program panel is wrapped to ±180°.
- Path keeps every point about 2 mm apart with no cap.

## Technical Details

- **Table Dimensions:** 2362.2 × 1143 mm (93 × 45 in, supplied by the team)
- **Coordinate System:** Origin at bottom-left corner
- **Grid Spacing:** Configurable (default: 50mm minor, 100mm major)
- **Default Robot:** 180 × 150 mm
- **Default Mat:** 2019.3 × 1136.65 mm

## BIOGLOW Background

| File | What it is |
|---|---|
| `assets/bioglow-wireframe-grid.pdf` | Original download from `https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-wireframe-grid.pdf` on 2026-10-21. 904,815 bytes, PDF 1.6, 2 pages, SHA-256 `33231bb977f1e93abc8a1c31986705c8dd5cec8e321f8dc8d879e42934939244`. Keep it unchanged. |
| `assets/bioglow-wireframe-page2-300dpi.png` | Page 2 (wireframe without the lettered grid), 3300 × 2550 px. |
| `tools/pdf_render.swift` | Re-makes the PNG with macOS PDFKit (no installs). |

Re-make the PNG from the `simulator/` folder:

```bash
swift tools/pdf_render.swift assets/bioglow-wireframe-grid.pdf 1 300 assets/bioglow-wireframe-page2-300dpi.png
```

The PDF pages are letter size (11 × 8.5 in). The page edges are **not** the mat edges. The mat edge is the drawn border: black top and bottom, red left, blue right.

Default crop = centres of those border lines, measured from the PNG pixels: left 166, top 636, width 2967, height 1689 px (±1 px).

**Shape mismatch.** That border is 1.757 wide for every 1 tall. The configured mat (2019.3 × 1136.65 mm) is 1.777. That is 1.1% off. Page 1's own lettered grid gives the same 1.757 (10 columns labelled 20 cm, so about 200 cm wide). So the wireframe is a diagram, not an exact-scale drawing. The simulator does not stretch it. It is drawn 1996.7 × 1136.65 mm, centred on the mat, so the left and right edges sit about 11 mm inside the mat outline.

The wireframe does not define collision geometry. The optional model outlines were read from it by hand (see "Table Walls and Model Outlines"). The mission markers below are labels placed on top of it.

## BIOGLOW Missions

Open **BIOGLOW Missions** in the left panel. Pick a mission in the list, or click its green marker on the map. You see its scoring lines, notes, any Challenge Update that changed it, and where it is on the mat. Docks (purple, D1 to D3) hold the interchangeable models for Missions 13 to 15. Untick **Show mission markers** to hide them. Markers appear only while the BIOGLOW picture is the background.

Where the information comes from (downloaded 2026-10-21 into `assets/`; keep them unchanged):

| File | Source | SHA-256 |
|---|---|---|
| `bioglow-rulebook.pdf` | Robot Game Rulebook, file id 30082603 V1, InDesign date 28/4/26. Scoring on pages 9 to 12, rules on pages 13 to 18. | `000852651672a2538bc1f93bd1c84cd7f9a34fb73f6c49f1c6c5309f4787c8f2` |
| `bioglow-field-setup-guide.pdf` | Field Setup Guide. Page 2 is FIRST's numbered placement map; pages 3 to 15 are the model photos. | `f04709ef981b2622a145a3db2b0c1876022422e0dac4f27efc0ef4d293ff59e0` |
| `bioglow-challenge-updates.pdf` | Challenge Updates, "Updated October 14th, 2026". Updates 01 (Lucky Leaves), 02 (dock release) and 03 (tree taping) are shown with the missions they change. | `d1c77661e28867803ffc5c4cebdd86a6799f8e30d953c44ddb80e0abd8375b69` |

The Updates win over the rulebook. Example: the rulebook page for Mission 4 still has the old katydid wording; the simulator shows the Update 01 wording and says so.

How the marker positions were found:

1. Each rulebook mission page was read as a picture and the scoring lines were typed in.
2. FIRST's numbered map (rulebook page 8, Field Setup Guide page 2) gave the rough place of each number.
3. Each number was matched to a model outline on our wireframe picture. The marker sits on that outline.

Each marker has a confidence and a short reason, shown in the mission details. **Not worked out:** which of the two Mission 10 markers is the spider habitat and which is the snail habitat; the split between Missions 6 and 7 (one shared marker); which dock is "mine", "farm" or "city" (the rulebook text does not say; D1 is "mine" because the Field Setup Guide photo of the mine dock shows orange ground with the river on its left, and D2 and D3 are named from the mat artwork).

Limits:

- Markers are good to about 15 mm. The wireframe is 1.1% narrower than the configured mat, so they can be off a little more near the left and right walls.
- The markers are labels. They do not stop the robot and they do not know whether a mission was completed. There is no scoring: the simulator cannot see a flipped rock or a raised platform.
- Mission 4 (Lucky Leaves) cannot be rehearsed exactly: the leaves are randomised and teams are not told where the katydid starts.
- The rule text is copied by hand from the rulebook pictures. Check anything that matters against the rulebook.
- The mat is now placed against the bottom wall (Mat Y offset 0), as the rulebook's Field Setup (Step 1) says: "align the mat to the bottom wall and center it between the left and right walls". Before 2026-10-21 it was centred up and down (3.175 mm).

## Milestone A Goals Achieved

✅ Scaled board with proper dimensions
✅ Background image calibration
✅ Robot placement system
✅ Grid overlay
✅ All controls functional

## Milestone B Goals Achieved

✅ Drive settings (wheel diameter, track width, gear ratio, max speed, encoder signs)
✅ Shared differential-drive physics with a fixed 5 ms timestep
✅ Movement test panel: start, stop, pause/resume, single step, playback speed, reset
✅ Simulated gyro, logical encoders, timer, telemetry, path trace

---

**Note:** This is an educational planning tool. Not official LEGO software. No AI API required. Works offline.
