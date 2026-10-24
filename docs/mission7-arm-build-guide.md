# Mission 7 arm: build guide

**Read this first:** this is a plan, not a tested design. Nobody has built it or run it on the robot. The part names and sizes are our best guesses. Picture: [`mission7-arm-blueprint.svg`](mission7-arm-blueprint.svg). The program that goes with it is `gyro-mission6-7-11_routefix_creep_push28_arm.llsp3` (slot 19).

## See it in 3D

Open the simulator, switch on **3D view**, tick **"show the Mission 7 sweeper-arm idea"**, then press **"zoom to the arm"**. The arm is drawn with pieces shaped like real LEGO parts (beams with holes, pins, the medium motor). The yellow numbers match the parts table below: 1 motor, 2a arm, 2b finger, 3 shelf, 4 L-liftarm, 5 shaft piece (under the arm), 7 red tip, 8 brace. Drag to turn it around. It is a picture made from simple shapes, not an official LEGO file, so the motor and small pieces are rough.

## What the arm does

After the robot pushes the leafcutter (Mission 6), a motor on **port C** swings a beam out from the left, across the front, until a hanging "finger" touches the red handle of the Mission 7 mycelium arm. Then the motor swings it back, so it is out of the way for the rest of the route.

> Everyday comparison: a windscreen wiper. It rests on one side and swings across to do its job, then goes back.

## Why this design (what the simulator said)

| Idea | Result in the simulator |
|---|---|
| A fixed hook on the right side that reaches the handle | Hits the green and black model and Mission 11 in almost every run |
| A motor stuck on the right side of the robot | The route fails in every run (the robot is too wide to get past Mission 11) |
| A finger hanging beside the right side | Makes the route worse (it brushes Mission 11) |
| **Arm that rests across the front, finger left of the pusher** | **Route works the same as with no arm** (20, 27, 24, 22 out of 27 clean runs for turns 0 to 3 degrees too far) |

The arm rests across the **front**, inside the width of the robot, so it doesn't catch anything.

## Step 0: measure two things on the real model

1. **Handle height:** how high is the red handle above the mat? (Our guess: 3 to 4 cm.)
2. **Hand test:** lift the real arm by hand. Which way must it move for "the mycelium is completely extended"? (We don't know. The arm in this plan pushes the handle toward the right.)

## Parts (check the names in your set)

| # | Part | How many |
|---|---|---|
| 1 | Medium motor (port C) | 1 |
| 2 | Black beam, 15 holes (about 12 cm) | 2 (arm and finger) |
| 3 | Black beams for the shelf, 5 to 7 holes | 2 |
| 4 | L-shaped liftarm (bent 2x4 or 3x5) | 1 |
| 5 | Piece with a plus-shaped hole, to fit the motor shaft (a liftarm with a cross hole, or a gear) | 1 |
| 6 | Pins | about 10 |
| 7 | Red pin or round piece for the finger tip | 1 |
| 8 | Long diagonal beam to stiffen the shelf | 1 |

## Build steps

**Part A: the arm and finger**
1. Lay beam 2a flat. This is the **arm**.
2. Hold the L-shaped liftarm at the arm's end, so one leg goes along the arm and the other points **down**.
3. Pin it to the arm with **two pins**. Two pins stop it twisting.
4. Pin beam 2b to the L's downward leg with **two pins**. This is the **finger**. It hangs straight down.
5. Press the red pin into the finger's bottom hole.
6. **Finger length rule:** finger bottom should be about **3 to 4 cm above the mat**. Finger length is about **arm height minus handle height**. If the shelf puts the arm 16 cm up and the handle is 3.5 cm, the finger is about 12.5 cm, close to a 15-hole beam. If it is much shorter or longer, use a shorter or longer beam.

**Part B: the motor**
7. Push the plus-hole piece (part 5) onto the motor shaft.
8. Pin the other end of the arm to that piece with **two pins**.
9. Turn the shaft by hand. The arm must swing flat, like a door, without rubbing the motor.

**Part C: the shelf**
10. Pin the two shelf beams to the motor's side holes, so the motor sits between or on them with the shaft pointing **up**.
11. Fix the shelf to the **top-front black frame, on the right side**. It must reach about **6 cm past the front of the frame**, so the shaft is about **12.5 cm ahead of the wheel axle** and **6 cm to the right of the robot's middle**.
12. Pin the long diagonal beam under the shelf so it doesn't sag.

**Part D: set it up**
13. Turn the shaft by hand until the arm points **left across the front**, with the finger hanging **left of the pusher** and **inside the width of the robot**. This is the **resting** position. Start every run from here.
14. Plug the motor into **port C**.

## Test it (needs a grown-up's OK before the robot moves)

1. **Motor only.** Download the arm program to **slot 19**. With the robot lifted off the mat, run it and watch the arm.
   - It should swing about **105 degrees**, from pointing left to pointing forward and a little right, then swing back.
   - Swings the wrong way? Swap **counterclockwise** and **clockwise** in the two motor blocks.
   - Doesn't reach far enough? Try **120** in both blocks.
2. **Handle only.** Place the robot where it ends after the leafcutter push and run the arm. Does the finger reach the red handle? Does the arm move the way the hand test said?
3. **Whole mission, 5 times.** Fill in a table (did the ant reach the nest, did the leaves stay in, did the mycelium extend, did the window drop, did it get home).

## What we still don't know

- Whether the arm design reaches the handle every time. The handle ends up in a slightly different place each run (about 7 cm sideways in the simulator), and the arm only reaches a part of that.
- The real handle height and the right finger length.
- Whether port C has a motor free on the real robot.
- Whether the tall shelf is allowed by the equipment rules and the robot height rules (we haven't checked).

If the arm misses the handle in some runs, the fix is probably to make the push more repeatable, not to change the arm.
