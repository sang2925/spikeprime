# turn-test: how far do our turns really go?

`turn-test.llsp3` is a small test program, made from a copy of `Team Template.llsp3`. It is set to **slot 19**. No mission files were changed.

## Why we need it

Our first leafcutter program (`Harrison_Lucas_Kai_leafcutter_uncover.llsp3`) works on the mat. It uses the **old turn**: slow and steady.

`gyro-mission6-7-11` uses the **new turn**: faster, and it slows down near the end. A faster turn can roll further after it stops, like a bike that needs more room to brake when it's going fast.

In the simulator:

| If the new turn goes past by | Then gyro-mission6-7-11 |
|---|---|
| About 3 degrees | Pushes the leafcutter and bumps Mission 11 almost exactly like the old program (2-3 cm away) |
| About 6 degrees | Arrives about 10 cm away and hits Mission 11 at a steep angle, corner first, like in our video |

So we need one number: **how far does each turn really go?**

## What the robot does

| Part | What happens | The hub shows |
|---|---|---|
| Start | Sets movement motors to B+A and speed 50% | |
| Part 1 | **Old turn** right 90, 3 times. After each turn it stops, waits 1 second, and shows how far it turned. | `OLD`, then 3 numbers |
| Part 2 | **New turn** right 90, 3 times. Before each turn it sets yaw angle to 0, so the number is just that turn. | `NEW`, then 3 numbers |

The robot spins in place 6 times. The whole test takes about 45 seconds.

## Before you start (a grown-up must say OK)

1. Download `turn-test` to **slot 19**. This **replaces** whatever is in slot 19, including gyro-mission6-7-11. Download that one again afterwards.
2. Put the robot **on the mat**, right side up, in an empty spot. (Our robot only creeps backward on the mat, never on the floor.)
3. Keep everything at least 30 cm away. The robot should only spin, not drive.
4. Stick a small piece of tape at each of the robot's 4 corners on the mat, so you can see where it started.
5. If you can, film it with a phone held straight above the robot.
6. Have a pencil and this table ready. The numbers scroll across the hub, so watch closely.

## Write down the numbers

| Run | OLD 1 | OLD 2 | OLD 3 | NEW 1 | NEW 2 | NEW 3 |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

Run it 3 times if you can, so you can see if the numbers change.

**Creep:** after the whole test, how far did the middle of the robot end up from the middle of the 4 tape marks? Write it here: ______ cm. (A robot that spins perfectly ends up exactly where it started. In our video, a fast turn crept about 6 cm backward.)

**How far past** = the number minus 90.

**Worked example:** the hub shows 93. 93 minus 90 = **3 degrees too far**. If it shows 88, then 88 minus 90 = -2, which means **2 degrees short**.

## What the numbers mean

Compare the NEW numbers with the OLD numbers.

| What you see | What it means | What to do |
|---|---|---|
| NEW is about the same as OLD (2 or less apart) | The new turn behaves like the one that works | Keep gyro-mission6-7-11 as it is and test it on the mat |
| NEW is 3 or more bigger than OLD | The new turn rolls too far | In the `turn` My Block, change **8** to **6**. Run turn-test again (change ONE number at a time). |
| NEW is smaller than OLD | The new turn stops early | In the `turn` My Block, change **8** to **10**. Run turn-test again. |
| The numbers jump around (more than 3 apart in one part) | Something is slipping or rubbing | Check the wheels and the floor, then run it again |

If you change the `turn` My Block here, make the same change in gyro-mission6-7-11. Keep both the same.

## What we actually tested

| Test | Who | Result |
|---|---|---|
| File opens in the SPIKE app (Chrome); every block and all 17 comments show | Claude, 2026-10-23 | ✅ |
| Simulator: the whole test runs, and the hub would show OLD 90 90 90, NEW 89 89 89 with perfect motors | Claude, 2026-10-23 | ✅ |
| Simulator: if every turn rolls 3 degrees further, the numbers become 93 and 92 | Claude, 2026-10-23 | ✅ That's how "number minus 90" works |
| **On the real robot** | nobody yet | ❓ **Not tested.** No robot was available. |

The simulator can't tell us the real numbers: its motors stop perfectly. That's why we need the robot.

## How it's built

- **Old turn:** copied exactly from our first leafcutter program (reset yaw, wait 0.5 seconds, spin at 5.2%, stop when the gyro passes the number).
- **New turn:** copied exactly from gyro-mission6-7-11, with its `heading` and `error` variables and its comments.
- **Showing the number:** `write (round (yaw angle))`. `round` makes it a whole number, so it's easy to read.
- The template's `straight` My Block is still there, but this test doesn't use it.
- Built by `tools/build_turn_test.py`. The block formats were copied from real SPIKE files (`samples/write-sample.llsp3` for `write`, `round` and `repeat`).
