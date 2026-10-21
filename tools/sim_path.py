"""Draw the path a SPIKE word-block program would drive, as an SVG (top-down view).
Usage: python3 tools/sim_path.py                  # every .llsp3 in the project folder
       python3 tools/sim_path.py <file.llsp3> ...  # just these
       python3 tools/sim_path.py --watch          # redo a file whenever an .llsp3 is added or saved
       add --as-written to treat "forward" as forward no matter which motor pair is set

Simulates every non-empty "when program starts" stack:
  move forward/back (cm, inches, rotations, degrees); repeat N; custom blocks (their body is run with the
  arguments filled in); a custom block that resets yaw = gyro turn by its first number (N > 0 = right);
  "start moving at left/right" + "wait until yaw > N" = gyro turn; set movement motors; motor ports (labels).
Anything else is listed as NOTE: not simulated.
Default = how today's robot moves: "AB" drives backward, "BA" forward (user-observed on the mat, see AGENTS.md).
ponytail: perfect turns in place, no wheel slip; measured turns overshoot ~1-2 degrees. Pivot turns
(one wheel stopped) are drawn in place too; add track width if that offset matters.
"""
import io, json, math, sys, time, zipfile
from pathlib import Path

APP_CM_PER_ROTATION = 17.5   # SPIKE app's built-in guess for "move N cm" (DEFAULT_FLIPPER_MOVE_CALIBRATION in the app)
REAL_CM_PER_ROTATION = 20.5  # measured 2026-10-14: straight test went 58.4 cm for 50 asked (17.5 guess), then 50.8 (17.6 deg/cm)
REVERSED_PAIR = "AB"    # user ran the AB version on 2026-10-14 and it drove backward; BA drives forward
SCALE = REAL_CM_PER_ROTATION / APP_CM_PER_ROTATION  # "move 30 cm" really drives ~35 cm on this robot
UNIT_CM = {"cm": SCALE, "inches": 2.54 * SCALE, "rotations": REAL_CM_PER_ROTATION, "degrees": REAL_CM_PER_ROTATION / 360}
IGNORED = {"flipperevents_whenProgramStarts", "flippermove_movementSpeed", "flippermove_stopMove", "control_wait",
           "flippersensors_resetYaw", "procedures_definition", "data_setvariableto",  # settings: My Blocks are simulated by their first number
           "flipperlight_lightDisplayImageOn", "flipperlight_lightDisplayText", "flippercontrol_stop"}
MOVING = ("flippermove_move", "flippermoremove_startDualSpeed", "procedures_call", "flippermotor_motorTurnForDirection")
DEG_PER_SEC_AT_100 = 1050  # [INFERENCE] ~175 rpm at 100%; only used for "run motor for N seconds"
DEFAULT_MOTOR_SPEED = 75   # [INFERENCE] SPIKE word-block default motor speed %
MATH = {"operator_add": lambda a, b: a + b, "operator_subtract": lambda a, b: a - b,
        "operator_multiply": lambda a, b: a * b, "operator_divide": lambda a, b: a / b if b else None}


def load_blocks(path):
    outer = zipfile.ZipFile(path)
    inner = zipfile.ZipFile(io.BytesIO(outer.read("scratch.sb3")))
    project = json.loads(inner.read("project.json"))
    return next(t["blocks"] for t in project["targets"] if t["blocks"])


def value(blocks, inp, args=None):
    """Value of a block input: a literal, a menu choice, a custom-block argument, or simple math. None if unknown."""
    ref = inp[1]
    if isinstance(ref, list):
        return ref[1]
    b = blocks.get(ref)
    if not b:
        return None
    if b["opcode"] == "argument_reporter_string_number":
        return (args or {}).get(b["fields"]["VALUE"][0])
    if b["opcode"] in MATH:
        n1, n2 = number(blocks, b["inputs"]["NUM1"], args), number(blocks, b["inputs"]["NUM2"], args)
        return None if n1 is None or n2 is None else MATH[b["opcode"]](n1, n2)
    if b.get("fields") and not b.get("inputs"):
        return next(iter(b["fields"].values()))[0]
    return None


def number(blocks, inp, args=None):
    try:
        return float(value(blocks, inp, args))
    except (TypeError, ValueError):
        return None


def uses(blocks, start_id, opcode):
    """True if the stack starting at start_id (including nested blocks) contains opcode."""
    todo, seen = [start_id], set()
    while todo:
        bid = todo.pop()
        if not bid or bid in seen or bid not in blocks:
            continue
        seen.add(bid)
        b = blocks[bid]
        if b["opcode"] == opcode:
            return True
        todo.append(b.get("next"))
        todo += [v[1] for v in b.get("inputs", {}).values() if isinstance(v[1], str)]
    return False


def yaw_target(blocks, cond_id, args):
    """For 'wait until yaw > N' style conditions: N (as a positive number), else None."""
    cond = blocks.get(cond_id)
    if not cond or not uses(blocks, cond_id, "flippersensors_orientationAxis"):
        return None
    for inp in cond.get("inputs", {}).values():
        n = number(blocks, inp, args)
        if n is not None:
            return abs(n)
    return None


def simulate(blocks, start_id, as_written):
    s = {"x": 0.0, "y": 0.0, "heading": 0.0, "pair": None, "spin": None,  # heading 0 = up the page, clockwise +
         "angle": {}, "speed": {}}  # per attachment port: degrees turned so far (clockwise +), set speed %
    steps, notes = [(0.0, 0.0, 0.0, "start")], []
    defs = {}
    for bid, b in blocks.items():
        if b["opcode"] == "procedures_definition":
            proto = blocks[b["inputs"]["custom_block"][1]]
            names = json.loads(proto["mutation"].get("argumentnames", "[]"))
            defs[proto["mutation"]["proccode"]] = (bid, names)

    def turn(deg, label):
        s["heading"] = (s["heading"] + deg) % 360
        steps.append((s["x"], s["y"], s["heading"], label))

    def drive(cm, label, written_forward):
        """cm > 0 = the way the code says; flipped when the motor pair is reversed on today's robot."""
        if s["pair"] == REVERSED_PAIR and not as_written:
            cm = -cm
            label += f" (drives {'BACKWARD' if written_forward else 'FORWARD'}: {s['pair']})"
        s["x"] += cm * math.sin(math.radians(s["heading"]))
        s["y"] += cm * math.cos(math.radians(s["heading"]))
        steps.append((s["x"], s["y"], s["heading"], label))

    def run(bid, args, depth=0):
        while bid:
            b = blocks[bid]
            op = b["opcode"]
            inputs = b.get("inputs", {})
            if op == "flippermove_setMovementPair":
                s["pair"] = value(blocks, inputs["PAIR"])
            elif op == "flippermove_move":
                direction = value(blocks, inputs["DIRECTION"])
                unit = b["fields"]["UNIT"][0]
                amount = number(blocks, inputs["VALUE"], args)
                if unit not in UNIT_CM or amount is None:
                    notes.append(f"skipped move {direction} {amount} {unit} (can't turn it into cm)")
                else:
                    sign = 1 if direction == "forward" else -1
                    cm = sign * amount * UNIT_CM[unit]
                    drive(cm, f"{direction} {amount:g} {unit} (~{abs(cm):.0f} cm real)", sign > 0)
            elif op == "procedures_call":
                code = b["mutation"]["proccode"]
                if code not in defs:
                    notes.append(f"custom block '{code}' has no definition")
                else:
                    def_id, names = defs[code]
                    ids = json.loads(b["mutation"].get("argumentids", "[]"))
                    call_args = {n: value(blocks, inputs[i], args) for n, i in zip(names, ids) if i in inputs}
                    nums = [number(blocks, inputs[i], args) for i in ids if i in inputs]
                    first = nums[0] if nums else None
                    label = code
                    for n in nums:
                        label = label.replace("%s", "?" if n is None else f"{n:g}", 1)
                    if uses(blocks, def_id, "flippermoremotor_position") and first is not None:
                        drive(first, label, first > 0)  # gyro straight block: first number = cm, - = backward
                    elif uses(blocks, def_id, "flippersensors_resetYaw") and first is not None:
                        turn(first, label)  # gyro turn block, N > 0 = right
                    elif depth > 20:
                        notes.append(f"custom block '{code}' calls itself too deep; stopped")
                    else:
                        run(blocks[def_id]["next"], call_args, depth + 1)
            elif op == "control_repeat":
                times = number(blocks, inputs["TIMES"], args)
                body = inputs.get("SUBSTACK", [None, None])[1]
                if times is None:
                    notes.append("repeat with an unknown count: body run once")
                    times = 1
                for _ in range(int(times)):
                    run(body, args, depth)
            elif op in ("control_if", "control_if_else"):
                # sensor checks (like 'check gyro') can't be simulated; assume they pass and skip their insides
                inner = [inputs.get(k, [None, None])[1] for k in ("SUBSTACK", "SUBSTACK2")]
                if any(uses(blocks, i, m) for i in inner if i for m in MOVING):
                    notes.append(f"{op}: skipped the blocks inside (the simulator can't read sensors)")
            elif op == "flippermoremove_startDualSpeed":
                left, right = number(blocks, inputs["LEFT"], args), number(blocks, inputs["RIGHT"], args)
                s["spin"] = None if left is None or right is None or left == right else (1 if left > right else -1)
                if s["spin"] is None:
                    notes.append("start moving at left/right: not a turn (or speeds unknown), skipped")
            elif op in ("control_wait_until", "control_repeat_until") and s["spin"]:
                deg = yaw_target(blocks, inputs.get("CONDITION", [None, None])[1], args)
                if deg is None:
                    notes.append(f"{op} after start moving: no yaw target found, skipped")
                else:
                    turn(s["spin"] * deg, f"gyro turn {'right' if s['spin'] > 0 else 'left'} {deg:g}")
                s["spin"] = None
            elif op == "flippermotor_motorSetSpeed":
                for p in value(blocks, inputs["PORT"]) or "":
                    s["speed"][p] = number(blocks, inputs["SPEED"], args)
            elif op == "flippermotor_motorTurnForDirection":
                ports = value(blocks, inputs["PORT"]) or "?"
                direction = value(blocks, inputs["DIRECTION"])
                unit = b["fields"]["UNIT"][0]
                amount = number(blocks, inputs["VALUE"], args)
                label = f"motor {ports} {direction} {value(blocks, inputs['VALUE'], args)} {unit}"
                if amount is not None and direction in ("clockwise", "counterclockwise"):
                    sign = 1 if direction == "clockwise" else -1
                    for p in ports:
                        if unit == "seconds":  # estimate from the set speed
                            deg = abs(s["speed"].get(p) or DEFAULT_MOTOR_SPEED) / 100 * DEG_PER_SEC_AT_100 * amount
                        else:
                            deg = amount * (360 if unit == "rotations" else 1)
                        s["angle"][p] = s["angle"].get(p, 0) + sign * deg
                    approx = "~" if unit == "seconds" else ""
                    label += " → " + ", ".join(f"{p} at {approx}{s['angle'][p]:+.0f}°" for p in ports)
                else:
                    notes.append(f"motor {ports}: couldn't work out how far it turns ({direction}, {amount})")
                steps.append((s["x"], s["y"], s["heading"], label))
            elif op not in IGNORED:
                notes.append(f"not simulated: {op}")
            bid = b["next"]

    run(start_id, {})
    return steps, notes


def svg(steps, title):
    pts = [(s[0], -s[1]) for s in steps]  # SVG y grows downward
    pad, scale = 25, 4  # 4 px per cm
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    minx, maxx, miny, maxy = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
    mw = (maxx - minx) * scale  # map width; step list goes to its right
    legend_w = 25 + 7.5 * max(len(f"{len(steps)}: {s[3]}") for s in steps)  # ~7.5 px per character at 13 px
    w, h = mw + legend_w, max((maxy - miny) * scale + 40, 70 + 16 * len(steps))
    P = lambda p: ((p[0] - minx) * scale, (p[1] - miny) * scale + 40)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}" font-family="sans-serif" font-size="13">',
           '<rect width="100%" height="100%" fill="white"/>',
           f'<text x="10" y="22" font-size="16" font-weight="bold">{title}</text>']
    for gx in range(math.floor(minx / 10) * 10, math.ceil(maxx) + 1, 10):  # 10 cm grid
        X = (gx - minx) * scale
        out.append(f'<line x1="{X:.0f}" y1="40" x2="{X:.0f}" y2="{h:.0f}" stroke="#eee"/>')
    for gy in range(math.floor(miny / 10) * 10, math.ceil(maxy) + 1, 10):
        Y = (gy - miny) * scale + 40
        out.append(f'<line x1="0" y1="{Y:.0f}" x2="{w:.0f}" y2="{Y:.0f}" stroke="#eee"/>')
    out.append(f'<text x="10" y="{h - 8:.0f}" fill="#999">grid = 10 cm</text>')
    for i in range(1, len(pts)):
        (x1, y1), (x2, y2) = P(pts[i - 1]), P(pts[i])
        if (x1, y1) != (x2, y2):
            dx, dy, h = steps[i][0] - steps[i - 1][0], steps[i][1] - steps[i - 1][1], math.radians(steps[i][2])
            back = dx * math.sin(h) + dy * math.cos(h) < 0  # moved opposite to the way the robot faces
            color = "#d33" if back else "#27c"
            out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="3" marker-end="url(#a)"/>')
    out.insert(1, '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#555"/></marker></defs>')
    for i, (s, p) in enumerate(zip(steps, pts)):  # numbered dots + robot heading tick
        X, Y = P(p)
        hx, hy = X + 20 * math.sin(math.radians(s[2])), Y - 20 * math.cos(math.radians(s[2]))
        out.append(f'<line x1="{X:.1f}" y1="{Y:.1f}" x2="{hx:.1f}" y2="{hy:.1f}" stroke="#090" stroke-width="2"/>')
        out.append(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="9" fill="{"#090" if i == 0 else "#333"}"/>')
        out.append(f'<text x="{X:.1f}" y="{Y + 4:.1f}" fill="white" text-anchor="middle" font-size="10">{i}</text>')
    legend_y = 40
    out.append(f'<g transform="translate({mw + 15:.0f},0)">')
    for i, s in enumerate(steps):
        legend_y += 16
        out.append(f'<text x="0" y="{legend_y}">{i}: {s[3]}</text>')
    out.append("</g>")
    out.append(f'<text x="10" y="36" fill="#666">blue = forward, red = backward, green tick = way the robot faces</text>')
    out.append("</svg>")
    return "\n".join(out)


ROOT = Path(__file__).resolve().parent.parent  # the project folder (tools/ lives inside it)


def sim_file(path, as_written):
    blocks = load_blocks(path)
    starts = [k for k, b in blocks.items() if b["opcode"] == "flipperevents_whenProgramStarts" and b["next"]]
    if not starts:
        print(f"{path.name}: no 'when program starts' stack with blocks under it, nothing to draw")
    for n, start in enumerate(starts, 1):
        steps, notes = simulate(blocks, start, as_written)
        mode = "as written" if as_written else "today's robot"
        suffix = f"_path{n if len(starts) > 1 else ''}{'_as_written' if as_written else ''}.svg"
        out = ROOT / "paths" / (path.stem + suffix)  # one folder for all path pictures; safe to delete, they're redrawn
        out.parent.mkdir(exist_ok=True)
        out.write_text(svg(steps, f"{path.stem} ({mode})"))
        print(f"wrote paths/{out.name}")
        for i, s in enumerate(steps):
            print(f"  {i:2}: x={s[0]:6.1f} cm  y={s[1]:6.1f} cm  facing={s[2]:5.1f}  {s[3]}")
        for note in notes:
            print("  NOTE:", note)


def main():
    as_written = "--as-written" in sys.argv
    named = [Path(a) for a in sys.argv[1:] if a.endswith(".llsp3")]
    if "--watch" not in sys.argv:
        for path in named or sorted(ROOT.glob("*.llsp3")):
            sim_file(path, as_written)
        return
    print(f"watching {ROOT} for new or saved .llsp3 files (Ctrl+C to stop)")
    seen = {}
    while True:
        for path in sorted(ROOT.glob("*.llsp3")):
            mtime = path.stat().st_mtime
            if seen.get(path) != mtime:
                try:
                    sim_file(path, as_written)
                    seen[path] = mtime
                except (zipfile.BadZipFile, KeyError, json.JSONDecodeError):
                    pass  # file still being written; try again next round
        time.sleep(2)


if __name__ == "__main__":
    main()
