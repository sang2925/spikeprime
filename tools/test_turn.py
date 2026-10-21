import runloop, motor_pair
from hub import port, motion_sensor

async def turn(deg):  # Python copy of the turnfix "turn" word block
    motion_sensor.reset_yaw(0)
    await runloop.sleep_ms(200)
    sign = 1 if deg > 0 else -1
    while True:
        yaw = abs(motion_sensor.tilt_angles()[0]) / 10
        if yaw > abs(deg) - 1:
            break
        spd = (8 + 0.4 * (abs(deg) - yaw)) * 10.5  # % -> deg/s, large motor 100% ~ 1050 deg/s
        motor_pair.move_tank(motor_pair.PAIR_1, int(spd * sign), int(-spd * sign))
        await runloop.sleep_ms(10)
    motor_pair.stop(motor_pair.PAIR_1)
    await runloop.sleep_ms(500)
    print("turn", deg, "-> stopped at", motion_sensor.tilt_angles()[0] / 10)

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.B, port.A)  # BA, same as the mission
    await turn(90)
    await runloop.sleep_ms(500)
    await turn(-90)

runloop.run(main())
