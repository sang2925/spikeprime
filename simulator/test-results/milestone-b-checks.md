# Milestone B checks (2026-10-21)

Run by the coding assistant. Simulated only. Not tested on the robot or the hub.

## Node tests

`node --test tests/` from `simulator/` (Node v26.12.0): 20 tests, 20 pass, 0 fail.

## Browser checks

Headless Chromium, `python3 -m http.server 8000`, `http://localhost:8000/simulator/`, default drive settings.

| Check | Result |
|---|---|
| 50/50 %, 1 s | X +299.1713 mm (expected 299.1713), Y change 0, heading 0, encoders 525.0° / 525.0°, time 1.000 s |
| Locks while running | Robot X, wheel diameter, mat X, Start test and Reset gyro disabled. Dragging the robot during the test did nothing. |
| -30/30 % spin, paused | X/Y change 0, heading +118.458° (counterclockwise), gyro the same |
| Paused 0.5 s | Time did not change |
| Step 5 ms | Time +0.005000 s |
| Reset gyro while paused | Gyro 0.00°, pose identical, world heading still 119.38° |
| Reset | Pose = saved start, time 0, encoders 0, gyro 0, path 1 point, background and mat kept |
| Wheel diameter 0 | Error shown. Start gives fault, robot did not move |
| Duration -1, blank, 601; left 150 % | Each gave fault with a message; robot did not move |
| Hidden tab (simulated `visibilitychange`) | Paused, shown as "paused (tab was hidden)". Time unchanged over 1.5 s hidden. After Resume, +0.09 s in about 0.1 s real time |
| Path show/hide, clear | Hide/show works; clear left 1 point |
| 35/80 %, 2.5 s at playback 1, 10, 0.5 | Identical pose, encoders and time (difference 0) |
| Resize 1600×1000 to 1100×760 | Pose, body size and track width identical; screen/world round trip error 0 |

Screenshots: `milestone-b-paused-spin.png`, `milestone-b-curve.png`, `milestone-b-resized.png`.
