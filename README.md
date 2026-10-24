# Our LEGO SPIKE Prime robot: Missions 6, 7 and 11

This is where our FIRST LEGO League team keeps its robot programs, its notes, and a simulator that shows where the robot will drive.

This season's game is **BIOGLOW**. These programs try three missions:

| Mission | What the robot does |
|---|---|
| **06 Leafcutter Frenzy** | Slowly pushes a lever so the ant gets back to its nest, without spilling the leaves |
| **07 Humongous Fungus** | The same push stretches out the mycelium (the fungus) |
| **11 Window to the Past** | Gently bumps the back of the model so the root cover drops onto the mat |

## Try the simulator

**[Open the simulator](https://sang2925.github.io/spikeprime/)** (it runs in your web browser, nothing to install).

1. Drag one of our `.llsp3` program files onto the page.
2. Press **Run program**, or press **Next block ▶** to go one step at a time (**◀ Previous block** goes back).
3. Press **Video match settings** to make the robot act more like our real robot did in our video.

Two buttons at the top make it easier:

- **Kid view** hides all the grown-up settings and turns on the video match settings for you.
- **3D view** shows the table, the models and the robot in 3D. Drag to look around, scroll to zoom. Every mission model is built from LEGO bricks, copied by eye from the official building instructions. The leafcutter (Missions 06 and 07) and Mission 11 have the most detail.
- When the robot bumps the back of **Mission 11**, its window (the root cover) falls down, in 2D and 3D, and the page says so.
- **[Mission 7 arm build guide](https://sang2925.github.io/spikeprime/simulator/arm-build.html)**: step-by-step pictures for building the idea arm. You can print it.
- When the robot pushes the **leafcutter's ant** (Mission 06), the ant slides towards the nest. The page tells you how far the ant got. It has to go about 8 cm to touch the nest. The white mycelium arm next to it is Mission 07, a separate mission: pushing the ant does not move it.

The simulator is a guess. It is like a weather forecast: useful, but the real robot on the real mat always has the final say.

## Which program should I use?

Programs are the `.llsp3` files. Open them in the LEGO SPIKE app.

| File | What it is | Use it? |
|---|---|---|
| `gyro-mission6-7-11_routefix_creep_push28.llsp3` | **Try this one first.** Our newest version. Every step has a little note, like "STEP 7: PUSH LEVER (28)". | ⭐ Yes |
| `gyro-mission6-7-11_routefix_push28.llsp3` | Same, for a robot that does **not** slide back when it starts a fast turn. | If the turn test says so |
| `turn-test.llsp3` | A test, not a mission. Turns 90° six times and shows on the hub how far it really turned. | For testing |
| `Team Template.llsp3` | The starting point for every **new** mission. Copy it, don't change it. | To start new missions |

Older programs and backups are in the **`archived-llsp3/`** folder:

| File | What it is |
|---|---|
| `gyro-mission6-7-11_routefix_creep.llsp3` | Older version of our newest program (pushes 30 cm, no step notes) |
| `gyro-mission6-7-11_routefix.llsp3` | Older version of the second one |
| `gyro-mission6-7-11.llsp3` | Our first gyro version with safety timers |
| `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` | Our very first mission program. Don't change it! |
| `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.llsp3` | That first program with a better turn |
| `Harrison_Lucas_Kai_leafcutter_gyro.llsp3` | The program in our video |

None of the new programs has been tested on the real robot yet. Test them on the mat before a competition!

### The golden rules

- Download test programs to **slot 19**. Never touch **slot 0**.
- Change **one** number at a time, then run it 3 times.
- Write down what happened.

## The folders

| Folder | What's inside |
|---|---|
| `docs/` | Notes you can read. Start with these: |
| | `gyro-mission6-7-11_routefix_creep_push28.md`: how to use our newest program |
| | `gyro-mission6-7-11-cheat-sheet.md`: which number to change when something goes wrong |
| | `turn-test.md`: how to run the turn test |
| | `route-from-video.md` and `route-from-video.png`: where the robot really went in our video (for grown-ups, lots of detail) |
| `simulator/` | The simulator web page and its code |
| `tools/` | Computer helpers (Python and JavaScript) that build and check our programs. Grown-ups only. |
| `archived-llsp3/` | Old programs and backups (see above) |
| `samples/` | Example SPIKE files we use as a reference. Don't change them. |
| `paths/` | Old drawings of the robot's path |

## Words to know

| Word | What it means |
|---|---|
| **Gyro** | A sensor in the hub that knows which way the robot is pointing, like a compass. |
| **Yaw** | How far the robot has turned left or right. |
| **My Block** | A block we made ourselves, like `straight` and `turn`. |
| **Slot** | One of the hub's 20 places to save a program (0 to 19). |
| **Simulator** | A computer copy of the robot and mat, to try ideas without the real robot. |

## For grown-ups

`AGENTS.md` has the full history, the rules for editing these files, and what has and has not been tested. Run the simulator on your own computer with `python3 tools/serve.py` and open `http://localhost:8000/simulator/`.
