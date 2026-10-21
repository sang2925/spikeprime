import runloop, motor_pair, motor
from hub import port

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.B, port.A)  # same as word block "set movement motors to BA"
    a0, b0 = motor.relative_position(port.A), motor.relative_position(port.B)
    await motor_pair.move_for_degrees(motor_pair.PAIR_1, 180, 0, velocity=200)
    print("A moved", motor.relative_position(port.A) - a0, "B moved", motor.relative_position(port.B) - b0)

runloop.run(main())
