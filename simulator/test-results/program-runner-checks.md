# .llsp3 program runner checks (2026-10-21)

Run by the coding assistant. Simulated only. Not tested on the robot or the hub. Team `.llsp3` files were only read; their modification times stayed at 2026-10-14.

## Node tests

`node --test tests/` from `simulator/`: 32 tests, 32 pass (20 physics, 12 Word Blocks / reader).

## Browser checks (headless Chromium, local server)

| Check | Result |
|---|---|
| Open `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` | 17 blocks listed, no NOTEs |
| Run program from start pose (400, 150) mm, heading 90 | Ends at (581.3, 182.7) mm, world heading -144.42°, 19.975 s. Same as the Node run. |
| While running | Current block highlighted, "Now: turn 67 › repeat until abs(yaw) > (abs(degrees) - 1)"; Run program and file picker locked |
| Next block from stopped | Paused at block 3 (`straight 35`), robot not moved |
| Next block 4 more times | Paused at the start of `turn 20`, `straight 47`, `turn 67`, `straight 32`; y +351.5 mm after `straight 35`; turn 20 ended at 19.18° |
| Step 5 ms inside the program | Time +0.005 s |
| Stop | Status stopped |
| Open a PNG as a program | "Not a ZIP file" message; previous program kept |
| Open `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` | 21 blocks; 1 empty start block, 6 loose stacks reported, not run |
| Run it with "Team guess" plain-move mode | Ends 14.2 cm right, 4.0 cm up from start; `tools/sim_path.py` gives 14.8, 3.7 (it assumes perfect turns) |
| Page errors | None |

Screenshots: `program-loaded.png`, `program-running.png`, `program-finished.png`.
