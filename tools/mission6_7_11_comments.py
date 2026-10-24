"""Student comments for gyro-mission6-7-11.llsp3 (used by build_gyro_mission6_7_11.py). Plain words for ages 10-12."""

TEXT = {
    'cMission': """MISSIONS 6, 7 AND 11 (smart gyro version)

What the robot does: leaves base, drives up past the brown model, slowly pushes the leafcutter model (Missions 6 and 7), then gently bumps Mission 11 so the window drops. Then it backs up, turns, and hurries home.

Set movement motors to B+A. With B+A our robot drives forward. With A+B it drives backwards, so never swap them.

WHY ARE THE NUMBERS BIGGER THAN IN THE OLD VERSION?
The old 'move' block thinks a wheel moves the robot 17.5 cm each time it spins once. Our wheels really move it about 20.5 cm. So the old 'move 30 cm' really drove about 35 cm! 'straight' knows the real size of our wheels, so we type the real distance: 35.

NEW IN THIS VERSION: safety timers. If Mission 11 stops the robot, it still backs up and goes home. Same route as before. Read the notes on 'turn' and 'straight'.""",

    'cLock': """SET UP ONCE
Set yaw angle to 0, wait 0.2 seconds, set heading to 0.
We do this ONE time, at the start. The My Blocks don't reset yaw any more, so they don't need a 0.2 second wait each time.

yaw = the way the robot IS pointing right now.
heading = the way we WANT it to point. Each 'turn' and 'straight' starts by setting heading to yaw: "start from where I really am", like the old blocks did when they reset yaw.

Our turns go a few degrees too far. Our numbers were tested on the mat with that, so we keep it the same.""",

    'cPart2': """PART 2: AT THE MODELS (speed 13 = very slow)
Turn right 36. Then, slowly: forward 30 (push the leafcutter), back 6, turn right 85, forward 15 (bump Mission 11 so the window drops), back 18.
Why slow? So we push gently and in the right spot, without knocking models over.
Why back up? To give the robot room to turn.
If Mission 11 stops the robot before 15 cm, the safety timer in 'straight' ends the push after about 4 seconds, and the robot still backs up and goes home.""",

    'cWords': """WORDS TO KNOW (read this first!)

Degrees: how we measure turning. A full circle is 360 degrees. A quarter turn (like turning a corner) is 90.

Gyro: a sensor inside the hub. It feels the robot turning, like your sense of balance tells you when you spin.

Yaw: the gyro's number for "which way am I pointing?" Turn right and yaw goes up. Turn left and it goes down (below 0).

heading: our variable. The way we want the robot to point.

error: our second variable. How far we still have to turn to face heading. Plus = turn right. Minus = turn left. 0 = perfect.

My Block: a block we made ourselves out of other blocks. Ours are 'turn' and 'straight'. Find them in the red My Blocks section.

%: speed out of 100. 100% = full speed. 50% = half speed.

abs: short for "absolute value". It removes the minus sign. abs of -90 is 90.

timer: a stopwatch inside the hub. 'reset timer' starts it again from 0.

mod: the remainder after dividing. 370 mod 360 = 10, like a clock going past 12 and starting again.""",

    'cTurn_main': """MY BLOCK: TURN (degrees)
Spins the robot in place, using the gyro.

Plus number = turn right. Minus number = turn left.
  turn 90 = a quarter turn to the right
  turn -45 = half of that, to the left

It starts fast and slows down near the end, like a bike braking before a stop sign.

NEW: IF abs(degrees) > 0: turn 0 does nothing (no dividing by 0).
NEW: it gives up after a time limit, so it can never spin forever.
Keep turns between -180 and 180. A bigger number turns the short way round instead.""",

    'cTurn_heading': """SET HEADING TO YAW, then CHANGE HEADING BY (degrees)
Start from where the robot really points, then add this turn.

Example: the robot really points at yaw 22. 'turn 67' makes heading 22 + 67 = 89.

Reset timer: starts the stopwatch for this turn's time limit.""",

    'cTurn_error': """SET ERROR: how many degrees do I still have to turn?
  error = ((heading - yaw + 540) mod 360) - 180
The answer is always between -180 and 180. Plus = turn right, minus = turn left.
Example: heading 87, yaw 80. 87 - 80 + 540 = 547. 547 mod 360 = 187. 187 - 180 = 7. Turn 7 more degrees right.
Why 540 and mod? Yaw jumps from 180 to -180 when you pass the back. mod fixes that jump, like a clock going from 12 back to 1.

We work out error once, before the loop, and again at the end of every loop pass. Then every block in one pass uses the same number.

NEVER CHANGE 540, 360 OR 180. They only make the math work. To change how the robot turns, use the cheat sheet.""",

    'cTurn_repeat': """REPEAT UNTIL (close enough or gone past) OR (time is up)

Close enough or gone past: error times direction is less than 1.
direction = degrees / abs(degrees): 1 for a right turn, -1 for a left turn.
Example, turn 90 (right): error 30 gives 30 (keep turning). Error 0.5 gives 0.5 (stop). Error -2 (went 2 too far) gives -2 (stop).
If it goes a little too far, it does NOT turn back and wiggle. Our turns always go a little too far, and our numbers were tested on the mat that way.

Time limit: 2 + abs(degrees) divided by 30 seconds.
Example: turn 90 gets 2 + 3 = 5 seconds. A normal turn 90 takes about 1 to 2 seconds.
  Robot gives up before finishing a turn? Change 2 to 3.""",

    'cTurn_drive': """START MOVING: the speed math
Speed = 8 + 0.4 times abs(error)
(In the block, * means times and / means divided by.)

Example: 90 degrees left to turn: 8 + 36 = 44% (fast).
45 left: 8 + 18 = 26%. 5 left: 8 + 2 = 10% (slow).

degrees / abs(degrees) is 1 (turn right) or -1 (turn left). The two wheels spin opposite ways, so the robot spins in place, like a tank.

Then: set error again, so the next check uses the new gyro reading.
  Turns too far? Try 6 instead of 8.
  Stalls before the end? Try 10.""",

    'cStraight_main': """MY BLOCK: STRAIGHT (cm) at speed (%)
Drives in a straight line, steering with the gyro.

cm: plus = forward, minus = backward.
  straight 50 = forward 50 cm
  straight -10 = back up 10 cm
speed: 1 to 100. Slow = more exact. Fast = saves time.

It first sets heading to yaw, so it drives straight in the direction it is pointing when it starts.
NEW: straight 0, or speed 0, does nothing.
NEW: it stops when it has gone far enough OR when time is up. So if a model blocks the robot, the program still carries on.

We tested the old version: straight 50 went 50.8 cm and stayed straight. This new version is not tested on the robot yet.""",

    'cStraight_if': """IF (cm is not 0) AND (speed is not 0)
A safety check. The math below divides by cm and by speed. Dividing by 0 is impossible and would crash the program.
So straight 0, or speed 0, just skips everything.""",

    'cStraight_zero': """SET HEADING TO YAW: drive in the direction we point now.

B SET RELATIVE POSITION TO 0
Motor B turns one of our two drive wheels. Its "relative position" counts how far that wheel has turned, in degrees. One full spin of the wheel = 360.
Setting it to 0 starts the count fresh, like resetting a stopwatch.

Reset timer: starts the hub's stopwatch for this drive's time limit.""",

    'cStraight_repeat': """REPEAT UNTIL (far enough) OR (time is up)

Far enough: wheel B has turned abs(cm) times 17.6 degrees.
Why 17.6? One wheel spin (360 degrees) moves our robot about 20.5 cm. 360 divided by 20.5 = about 17.6 degrees for each cm. We tested it on the mat.

Time is up: timer is bigger than
  (abs(cm) times 17.6) divided by (abs(speed) times 10.5), times 2, plus 0.5 seconds.
10.5 is our guess for how many degrees per second the wheel turns for each 1% of speed. We have not measured it.

Example: straight 15 at speed 13 (the Mission 11 bump)
  15 times 17.6 = 264 degrees
  13 times 10.5 = 136.5 degrees each second
  264 divided by 136.5 = about 1.9 seconds
  Time limit: 1.9 times 2 + 0.5 = about 4.4 seconds

Why? If Mission 11 stops the robot before 15 cm, the wheel never reaches 264. The old block waited forever. Now it gives up after about 4.4 seconds and backs up.
  Normal drives stop too early? Change 2 to 3.
  Pushes too long at Mission 11? Change 2 to 1.5.""",

    'cStraight_drive': """START MOVING: the steering math
cm / abs(cm) is a trick: it equals 1 to go forward and -1 to go backward.

The steering fix is error times 2:
  left wheel = speed + error * 2
  right wheel = speed - error * 2

Example at speed 50:
  Pointing at heading: error is 0. Both wheels go 50.
  Curved 3 degrees right: error is -3. Left wheel 44, right wheel 56. The robot steers back left.
  Curved 3 degrees left: error is 3. Left wheel 56, right wheel 44. Steers back right.

error is worked out before the loop and again after every 'start moving', the same way as in 'turn'.

Why 2? It's how hard the robot steers back.
  Wiggles side to side? Try 1.
  Still curves? Try 3.""",
}
