# turn-test: does the robot turn without sliding?

`turn-test.llsp3` is a small test program (slot **19**). It spins the robot in place **four times**, a full circle. It uses the slow 12% turn from `gyro-mission6-7-11_simpleturn`.

The first version (old turn against new turn, six half-circle turns) is in `archived-llsp3/turn-test_old_vs_new.llsp3`, with its notes in `docs/archive/turn-test_old_vs_new.md`.

## What it tells us

| Question | How you find out |
|---|---|
| Does the robot **slide** when it spins? | Is it back inside its tape box at the end? |
| Does each turn go the **right amount**? | The 4 numbers on the hub |
| Is it the **same every time**? | Run it 3 times and compare |

## Before you start (a grown-up must say OK)

1. Put the robot on the **mat**, right side up, in an empty spot. Nothing within 30 cm. (Our robot only slides on the mat, not on the floor.)
2. Stick small pieces of **tape on the mat touching each corner of the robot**, like a box around it. (4 pieces.)
3. Download `turn-test` to **slot 19**. This replaces whatever is in slot 19.
4. If you can, film from above with your phone, with the hub's light grid in view.
5. Press the hub's center button.

## What happens

The grid on top of the hub shows **GO**, then the robot turns right 90 degrees. It stops, waits 1 second, and the grid scrolls a number. This is how far it really turned. It waits 3 seconds, then turns again. Four turns in all, about 25 seconds.

A picture of where to look: `docs/hub-light-matrix.jpg`.

## Write down the numbers

| Run | Turn 1 | Turn 2 | Turn 3 | Turn 4 | Back inside the tape box? | If not: how far behind? (cm) |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**How far past** = the number minus 90. Worked example: the hub shows 93. 93 minus 90 = **3 degrees too far**. If it shows 88, that is **2 degrees short**.

## What it means

| What you see | What it means | What to do |
|---|---|---|
| Back in the box, numbers 88 to 92 and the same every time | The turn is steady | Try `gyro-mission6-7-11_simpleturn` |
| Back in the box, but numbers are 93 or more | The robot coasts after it stops | In the mission, type each turn a little smaller (85 becomes 83) |
| Numbers are 87 or less | The turn stops early | In the `turn` block, change the speed **12** to **14**, run again |
| Ended up **behind** the box | It still slides backward | Change the speed **12** to **10**, run again. If it still slides, the grey wheels are the limit. |
| Numbers jump around (more than 3 apart) | Something is slipping | Check the wheels and the mat, then run again |

Change ONE number at a time. If you change the speed in `turn-test`, make the same change in the mission.

## What we tested

| Test | Who | Result |
|---|---|---|
| Opens in SPIKE: 15 notes, no errors | Claude, 2026-10-26 | ✅ |
| Simulator: it ends exactly where it started, and the hub would show GO 92 92 92 92 when each turn coasts 2 degrees | Claude, 2026-10-26 | ✅ (the simulator can't slide, so this only checks the program) |
| **On the real robot** | nobody yet | ❓ **Not tested** |

Built by `tools/build_turn_test.py` from `Team Template.llsp3` and `gyro-mission6-7-11_simpleturn.llsp3`.
