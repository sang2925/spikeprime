"""Self-check for sim_path.simulate. Run: python3 tools/test_sim_path.py"""
import math
from sim_path import simulate, SCALE  # move blocks drive SCALE x the asked cm on this robot


def chain(blocks, ids):
    for a, b in zip(ids, ids[1:]):
        blocks[a]["next"] = b
    return ids[0]


def B(op, inputs=None, fields=None, mutation=None):
    d = {"opcode": op, "next": None, "inputs": inputs or {}, "fields": fields or {}}
    if mutation:
        d["mutation"] = mutation
    return d


def lit(v):
    return [1, [4, str(v)]]


def program(pair):
    blocks = {
        "pairmenu": B("flippermove_movement-port-selector", fields={"F": [pair, None]}),
        "fwd": B("flippermove_custom-icon-direction", fields={"F": ["forward", None]}),
        "hat": B("flipperevents_whenProgramStarts"),
        "pair": B("flippermove_setMovementPair", {"PAIR": [1, "pairmenu"]}),
        "m1": B("flippermove_move", {"DIRECTION": [1, "fwd"], "VALUE": lit(10)}, {"UNIT": ["cm", None]}),
        # custom "turn %s" whose body resets yaw -> gyro turn by its argument
        "def": B("procedures_definition", {"custom_block": [1, "proto"]}),
        "proto": B("procedures_prototype", mutation={"proccode": "turn %s", "argumentnames": '["deg"]'}),
        "reset": B("flippersensors_resetYaw"),
        "call": B("procedures_call", {"arg1": lit(90)}, mutation={"proccode": "turn %s", "argumentids": '["arg1"]'}),
        # repeat 2 { move forward 5 in }
        "rep": B("control_repeat", {"TIMES": lit(2), "SUBSTACK": [2, "m2"]}),
        "m2": B("flippermove_move", {"DIRECTION": [1, "fwd"], "VALUE": lit(5)}, {"UNIT": ["inches", None]}),
        # pivot left: start moving left 0 right 20, wait until yaw < -90
        "dual": B("flippermoremove_startDualSpeed", {"LEFT": lit(0), "RIGHT": lit(20)}),
        "yaw": B("flippersensors_orientationAxis", fields={"AXIS": ["yaw", None]}),
        "cond": B("operator_lt", {"OPERAND1": [3, "yaw", [10, ""]], "OPERAND2": lit(-90)}),
        "wait": B("control_wait_until", {"CONDITION": [2, "cond"]}),
    }
    chain(blocks, ["def", "reset"])
    chain(blocks, ["hat", "pair", "m1", "call", "rep", "dual", "wait"])
    return blocks


def close(a, b):
    return math.isclose(a, b, abs_tol=1e-6)


steps, notes = simulate(program("BA"), "hat", as_written=False)
x, y, heading, _ = steps[-1]
assert notes == [], notes
assert close(x, 2 * 5 * 2.54 * SCALE) and close(y, 10 * SCALE), (x, y)  # 10 cm up, turn right, 25.4 cm right
assert close(heading, 0), heading                                       # +90 then pivot -90
assert [s[3].split(" (~")[0] for s in steps][2:] == ["turn 90", "forward 5 inches", "forward 5 inches", "gyro turn left 90"]

steps, _ = simulate(program("AB"), "hat", as_written=False)  # AB drives backward on today's robot
assert close(steps[-1][0], -25.4 * SCALE) and close(steps[-1][1], -10 * SCALE), steps[-1]

steps, _ = simulate(program("AB"), "hat", as_written=True)
assert close(steps[-1][0], 25.4 * SCALE) and close(steps[-1][1], 10 * SCALE), steps[-1]

# attachment motor C: speed 25%, ccw 0.5 s (~131 deg), cw -120 deg (= ccw 120), 1 rotation cw
port = B("flippermotor_multiple-port-selector", fields={"F": ["C", None]})
cw, ccw = (B("flippermotor_custom-icon-direction", fields={"F": [d, None]}) for d in ("clockwise", "counterclockwise"))
arm = {"port": port, "cw": cw, "ccw": ccw, "hat": B("flipperevents_whenProgramStarts"),
       "spd": B("flippermotor_motorSetSpeed", {"PORT": [1, "port"], "SPEED": lit(25)}),
       "a1": B("flippermotor_motorTurnForDirection", {"PORT": [1, "port"], "DIRECTION": [1, "ccw"], "VALUE": lit(0.5)}, {"UNIT": ["seconds", None]}),
       "a2": B("flippermotor_motorTurnForDirection", {"PORT": [1, "port"], "DIRECTION": [1, "cw"], "VALUE": lit(-120)}, {"UNIT": ["degrees", None]}),
       "a3": B("flippermotor_motorTurnForDirection", {"PORT": [1, "port"], "DIRECTION": [1, "cw"], "VALUE": lit(1)}, {"UNIT": ["rotations", None]})}
chain(arm, ["hat", "spd", "a1", "a2", "a3"])
steps, notes = simulate(arm, "hat", as_written=False)
assert notes == [], notes
assert [s[3].split("→ ")[1] for s in steps[1:]] == ["C at ~-131°", "C at -251°", "C at +109°"], steps

# gyro straight block: body reads motor relative position -> drive by first number (cm), - = backward
st = {"hat": B("flipperevents_whenProgramStarts"),
      "def": B("procedures_definition", {"custom_block": [1, "proto"]}),
      "proto": B("procedures_prototype", mutation={"proccode": "straight %s cm at speed %s", "argumentnames": '["cm", "speed"]'}),
      "reset": B("flippersensors_resetYaw"),
      "pos": B("flippermoremotor_position"),
      "loop": B("control_repeat_until", {"CONDITION": [2, "pos"]}),
      "c1": B("procedures_call", {"a": lit(30), "b": lit(50)}, mutation={"proccode": "straight %s cm at speed %s", "argumentids": '["a", "b"]'}),
      "c2": B("procedures_call", {"a": lit(-10), "b": lit(40)}, mutation={"proccode": "straight %s cm at speed %s", "argumentids": '["a", "b"]'})}
chain(st, ["def", "reset", "loop"])
chain(st, ["hat", "c1", "c2"])
steps, notes = simulate(st, "hat", as_written=False)
assert notes == [], notes
assert close(steps[-1][1], 20) and close(steps[-1][2], 0), steps[-1]
assert [s[3] for s in steps[1:]] == ["straight 30 cm at speed 50", "straight -10 cm at speed 40"], steps
print("sim_path ok")
