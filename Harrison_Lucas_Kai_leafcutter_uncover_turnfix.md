# Turn fix: Harrison/Lucas leafcutter-world flip

File: `Harrison_Lucas_Kai_leafcutter_uncover_turnfix.llsp3` (its name ends in "turnfix").
The original `Harrison_Lucas_Kai_leafcutter_uncover.llsp3` has not been changed, so you can always go back to it.

## What now works

When the robot turns, it now starts fast and slows down as it gets close to where it should stop.

## Why we had to change it

The old `turn` block turned at **5.2% speed the whole time**. That caused two problems:

1. **It was slow.** 5.2% is like walking with tiny baby steps. Every turn took a long time, and that time adds up across a whole mission.
2. **It didn't turn the same amount every time.** Motors at very low power don't move smoothly. They can jerk, slip, or barely move. So you could run the same turn twice and the robot ended up pointing a bit differently each time. When the robot points the wrong way, everything after that turn misses too.

**Think of riding a bike to a stop line.** You don't pedal slowly the whole way. You go fast first, then brake as you get close, so you stop right on the line. The new block does that.

## What changed (only the `define turn` block)

| Part | Before | After | Why |
|---|---|---|---|
| Wait before turning | 0.5 seconds | 0.2 seconds | The gyro sensor needs a short moment after it resets to 0. 0.2 seconds is enough, and the robot wastes less time. |
| Speed | always 5.2% | fast at the start, slow at the end | Fast so it's quick, slow so it stops in the right spot. |
| Loop | `wait until` | `repeat until` | `wait until` sets the speed once and then waits. `repeat until` checks again and again, so it can keep lowering the speed while it turns. |
| When it stops | exactly at the target | 1 degree early | A robot keeps sliding a little after you tell it to stop, like a shopping cart rolling after you let go. Stopping 1 degree early lets it slide into the right spot. |

## How the speed works

Speed = **8 + 0.4 × (degrees still left to turn)**

Example for a 90° turn:

| Degrees left | Math | Speed |
|---|---|---|
| 90 (just starting) | 8 + 0.4 × 90 | 44% |
| 45 (halfway) | 8 + 0.4 × 45 | 26% |
| 10 (almost there) | 8 + 0.4 × 10 | 12% |
| 0 (done) | 8 + 0.4 × 0 | 8% |

The **8** is the slowest the robot will go. Below that, the motors are too weak to move it smoothly.

The part `degrees ÷ abs(degrees)` always works out to **+1 or −1**. It tells the wheels which way to spin, so positive numbers turn one way and negative numbers turn the other way.

## The new block

```
define turn (degrees)
set yaw angle to 0
wait 0.2 seconds
repeat until  abs(yaw) > abs(degrees) − 1
    start moving at
        left:  (8 + 0.4 × (abs(degrees) − abs(yaw))) × (degrees ÷ abs(degrees))
        right: (8 + 0.4 × (abs(degrees) − abs(yaw))) × −(degrees ÷ abs(degrees))
stop moving
```

- **yaw** = how far the robot has turned so far (measured by the hub's gyro sensor).
- **abs** = "absolute value": it drops the minus sign, so −90 becomes 90. Then the math works for left and right turns.

Not changed: the main program still says **set movement motors to BA**, same as the original. Every `turn` number and every move is the same as before.

Heads up: the original file also had 6 loose scripts with no **when program starts** block on top, plus one empty **when program starts** block. Those are not in the turnfix file. They never ran when you pressed start on the hub, but if you used them for testing, open the original file to get them.

## Where to find it

The block is at the bottom right of the canvas. Click **Zoom to fit** (bottom left, the four-arrows icon) to see everything.

## Status

- Checked: the file opens in the SPIKE app and the new turn block looks right.
- Checked on the mat: **BA drives forward**. For a short time this file said **AB**, and the robot drove backwards, so we put it back to **BA**.
- Checked on the floor: the new turn method stopped at **91.9°** for a 90° right turn and **90.9°** for a 90° left turn. That's only 1–2° past the target. (I tested a Python copy of the turn block. Next, run the real mission from the SPIKE app to check the word block itself.)

## If it doesn't turn quite right

1. **Turns too far (overshoots):** change the `8` to `6`, so it's slower at the end.
2. **Stops too early (doesn't turn enough):** change the `− 1` to `− 0`.
3. **Skips a turn completely:** change the wait back to `0.5`. The gyro needed more time to reset.

## AB or BA? What we learned

On this robot, **BA is correct**. The team tested it on the mat.

We made a mistake on the way there. We held the robot up in the air (upside down), turned a wheel "forward" by hand, and used that to decide which way was forward. Upside down, it's easy to roll the wheel the wrong way, so that test fooled us into switching to **AB**. With **AB**, the robot drove backwards.

**Lesson:** test which way is forward with the robot **on the floor, right side up**. Don't trust a test done upside down.

Turns go the same way with **BA** and **AB**: `turn 90` turns right and `turn -90` turns left. We checked this on the floor.

We still don't know why the robot drove backwards before today. The ideas below are the best guesses.

## Why it can work one week and not the next

Code doesn't change by itself. If the same program acts differently, something about the robot or the way it was started changed:

1. **The A and B cables got swapped,** for example while rebuilding or charging. Then forward becomes backward. Take a photo of which wheel is plugged into A and which into B, so you can check this next time.
2. **A different script ran.** Pressing start on the hub runs only the script under **when program starts**. Clicking a loose script in the app runs just that script, and some of them don't set the motor ports first.
3. **Low battery or dirty wheels** → turns stop in slightly different places. The old 5.2% speed made this worse. The new turn block helps.
4. **The robot was placed a bit differently at the start** → small differences at the start get bigger by the end of the mission.

**Quick check before every run:** put the robot on the floor and run a short "move forward." If it goes backward, check the cables and make sure the first block says **BA**.
