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
- Differential-drive physics, fixed timestep, encoders, gyro. No DOM, so it runs in Node tests.

### `/simulator/llsp3.js`
- Reads a `.llsp3` file in memory (ZIP inside ZIP, then `project.json`). Read-only.

### `/simulator/wordblocks.js`
- Runs the Word Blocks themselves (including the team's My Blocks) against `physics.js`, one 5 ms step at a time.

### `/simulator/tests/`
- `physics.test.js`, `wordblocks.test.js`. Run from `simulator/`: `node --test tests/` (Node 18 or newer).

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
   - From the project root run `python3 -m http.server 8000`, then open `http://localhost:8000/simulator/`
   - You can also double-click `index.html`. Drag-and-drop and the BIOGLOW picture worked from a `file://` page in Chrome launched with `--allow-file-access-from-files`; plain Chrome without that flag was not tested.

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
| Body length × width | 180 × 150 mm | **Example**, not team measurements |

If the simulated robot turns too fast or too slow compared to the real one, check track width first.

## Known Limitations (Milestone B)

- **Boundary and obstacle collisions are not enforced yet.** The robot can drive off the table. (Milestone D.)
- Ideal motion: no slip, no noise, no motor acceleration, no coasting after stop. Speed changes instantly. Real turns end 1-2° further than simulated ones (see above).
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

The wireframe does not define collision geometry or mission locations.

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
