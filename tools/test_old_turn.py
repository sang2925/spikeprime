"""Replays the start of the ORIGINAL mission: move forward 30 cm at speed 50, then the ORIGINAL turn block
(5.2% speed, wait 0.5 s, no early stop) for turn 20, and logs the wheels.
Question: does the robot creep backwards during or after the turn?
forward = how far the robot's center moved forward, in wheel degrees (BA pair: A counts up, B counts down going forward).
Run on the floor with ~60 cm of space: uv run --with bleak tools/spike_run.py 19 tools/test_old_turn.py 40"""
import runloop, motor_pair, motor
from hub import port, motion_sensor

def forward():
    return (motor.relative_position(port.A) - motor.relative_position(port.B)) / 2

def yaw():
    return -motion_sensor.tilt_angles()[0] / 10  # word-block sign: clockwise = +

async def log(label, ms):
    for _ in range(ms // 100):
        print(label, "yaw", round(yaw(), 1), "forward", round(forward()), "A", motor.velocity(port.A), "B", motor.velocity(port.B))
        await runloop.sleep_ms(100)

async def old_turn(deg):
    motion_sensor.reset_yaw(0)
    await runloop.sleep_ms(500)
    sign = 1 if deg > 0 else -1
    v = int(5.2 * 10.5)  # 5.2% of ~1050 deg/s
    motor_pair.move_tank(motor_pair.PAIR_1, v * sign, -v * sign)
    n = 0
    while abs(yaw()) <= abs(deg):
        if n % 10 == 0:
            print("turning yaw", round(yaw(), 1), "forward", round(forward()), "A", motor.velocity(port.A), "B", motor.velocity(port.B))
        n += 1
        await runloop.sleep_ms(10)
    motor_pair.stop(motor_pair.PAIR_1)

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.B, port.A)  # BA, same as the mission
    motor.reset_relative_position(port.A, 0)
    motor.reset_relative_position(port.B, 0)
    # word block "move forward 30 cm" at speed 50: 30 / 17.5 cm per rotation x 360 = 617 degrees
    await motor_pair.move_for_degrees(motor_pair.PAIR_1, 617, 0, velocity=int(50 * 10.5))
    print("MOVED: forward", round(forward()), "deg (617 asked)")
    await log("before turn", 300)
    f_start = forward()
    await old_turn(20)
    print("STOPPED: yaw", round(yaw(), 1), "forward during turn", round(forward() - f_start))
    f0 = forward()
    await log("after", 2000)
    print("RESULT: during turn forward", round(f0 - f_start), "deg; after stop", round(forward() - f0), "deg; final yaw", round(yaw(), 1))

runloop.run(main())
