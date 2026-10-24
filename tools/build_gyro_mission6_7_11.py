"""Build gyro-mission6-7-11.llsp3 from Harrison_Lucas_Kai_leafcutter_gyro.llsp3 (read-only source).

Same route and typed-in numbers. Changes:
  - yaw is reset once at the start. Each turn/straight first sets 'heading' to the yaw it really has, exactly like
    the old blocks resetting yaw, so the route (and the team's tuned numbers, real turn overshoot included) stays the same.
    (A heading lock that also corrected turn overshoot was tried and dropped on 2026-10-21: it moved the route 9-12 cm.)
  - an 'error' variable (degrees still to turn) is worked out once per loop pass.
  - turn: heading = yaw + degrees, spin until within 1 degree or past the target, or a time limit; turn 0 does nothing.
  - straight: skips cm 0 / speed 0, holds the direction it starts in, stops when far enough or after a time limit
    (so a bump that stops the robot cannot freeze the program).
Block formats are copied from real SPIKE App exports (the team files and samples/format-sample.llsp3).

Run from the project root: python3 tools/build_gyro_mission6_7_11.py
"""
import io, json, math, os, random, string, sys, zipfile

SRC = 'archived-llsp3/Harrison_Lucas_Kai_leafcutter_gyro.llsp3'   # archived 2026-10-24
OUT = 'archived-llsp3/gyro-mission6-7-11.llsp3'
VAR_NAME = 'heading'
ERR_NAME = 'error'


def new_id(taken, n=20):
    chars = string.ascii_letters + string.digits + '!#%()*+,-./:;=?@[]^_`{|}~'
    while True:
        k = ''.join(random.choice(chars) for _ in range(n))
        if k not in taken:
            return k


class Build:
    def __init__(self, blocks, var_ids):
        self.B = blocks
        self.vars = var_ids                                     # name -> id

    def block(self, opcode, inputs=None, fields=None, **extra):
        k = new_id(self.B)
        self.B[k] = {'opcode': opcode, 'next': None, 'parent': None, 'inputs': {}, 'fields': fields or {},
                     'shadow': False, 'topLevel': False, **extra}
        for name, value in (inputs or {}).items():
            self.B[k]['inputs'][name] = self.slot(k, value, *(('bool',) if name in ('CONDITION',) else ()))
        return k

    def slot(self, parent, value, kind='num'):
        """Encode an input like the app does: literal, variable reporter, or a block over an empty shadow."""
        shadow = {'num': 4, 'cmp': 10}.get(kind)
        if isinstance(value, (int, float)):
            return [1, [shadow, fmt(value)]]
        if value in self.vars:
            return [3, [12, value, self.vars[value]], [shadow, ""]]
        self.B[value]['parent'] = parent
        if kind == 'bool':
            return [2, value]
        return [3, value, [shadow, ""]]

    def stack(self, parent, ids):
        """Chain statements under parent; returns the first id"""
        prev = None
        for k in ids:
            self.B[k]['parent'] = prev or parent
            if prev:
                self.B[prev]['next'] = k
            prev = k
        return ids[0]

    # expressions
    def op(self, opcode, a, b):
        return self.block(opcode, {'NUM1': a, 'NUM2': b})

    def add(self, a, b): return self.op('operator_add', a, b)
    def sub(self, a, b): return self.op('operator_subtract', a, b)
    def mul(self, a, b): return self.op('operator_multiply', a, b)
    def div(self, a, b): return self.op('operator_divide', a, b)
    def mod(self, a, b): return self.op('operator_mod', a, b)

    def abs(self, x):
        return self.block('operator_mathop', {'NUM': x}, {'OPERATOR': ['abs', None]})

    def cmp(self, opcode, a, b):
        k = self.block(opcode)
        self.B[k]['inputs'] = {'OPERAND1': self.slot(k, a, 'cmp'), 'OPERAND2': self.slot(k, b, 'cmp')}
        return k

    def logic(self, opcode, a, b):
        k = self.block(opcode)
        self.B[k]['inputs'] = {'OPERAND1': self.slot(k, a, 'bool'), 'OPERAND2': self.slot(k, b, 'bool')}
        return k

    def arg(self, name):
        return self.block('argument_reporter_string_number', fields={'VALUE': [name, None]})

    def yaw(self):
        return self.block('flippersensors_orientationAxis', fields={'AXIS': ['yaw', None]})

    def timer(self):
        return self.block('flippersensors_timer')

    def set_error(self):
        """set error to ((heading - yaw + 540) mod 360) - 180: degrees still to turn, -180..180, + = right.
        Read the gyro once per loop pass, so every use in that pass agrees."""
        k = self.block('data_setvariableto', fields={'VARIABLE': [ERR_NAME, self.vars[ERR_NAME]]})
        self.B[k]['inputs'] = {'VALUE': self.slot(k, self.sub(self.mod(self.add(self.sub(VAR_NAME, self.yaw()), 540), 360), 180), 'cmp')}
        return k

    def set_heading_to_yaw(self):
        """set heading to yaw angle: start from where the robot really points, like the old 'set yaw angle to 0'"""
        k = self.block('data_setvariableto', fields={'VARIABLE': [VAR_NAME, self.vars[VAR_NAME]]})
        self.B[k]['inputs'] = {'VALUE': self.slot(k, self.yaw(), 'cmp')}
        return k

    def port_selector(self, opcode, field, port):
        return self.block(opcode, fields={field: [port, None]}, shadow=True)


def fmt(v):
    return str(int(v)) if float(v).is_integer() else str(v)


def comment_height(text, width):
    per_line = max(1, width // 9)
    lines = sum(max(1, math.ceil(len(line) / per_line)) for line in text.split('\n'))
    return 19 * lines + 80


def main():
    src_bytes = open(SRC, 'rb').read()                     # read everything before opening any output
    if os.path.exists(OUT):
        sys.exit(f'{OUT} already exists. Move it away first (never overwritten without approval).')
    outer = zipfile.ZipFile(io.BytesIO(src_bytes))
    inner_bytes = outer.read('scratch.sb3')
    inner = zipfile.ZipFile(io.BytesIO(inner_bytes))
    project = json.loads(inner.read('project.json'))
    manifest = json.loads(outer.read('manifest.json'))

    sprite = [t for t in project['targets'] if not t['isStage']]
    assert len(sprite) == 1, 'expected one sprite target'
    t = sprite[0]
    B, C = t['blocks'], t['comments']

    defs = {B[B[k]['inputs']['custom_block'][1]]['mutation']['proccode']: k
            for k, b in B.items() if isinstance(b, dict) and b['opcode'] == 'procedures_definition'}
    turn_def, straight_def = defs['turn %s'], defs['straight %s cm at speed %s']
    main_hat = next(k for k, b in B.items() if isinstance(b, dict) and b['opcode'] == 'flipperevents_whenProgramStarts'
                    and b.get('next'))

    # drop the old bodies (everything reachable from def.next), keep definition + prototype + argument shadows
    def reachable(k, out):
        if not k or k in out:
            return out
        out.add(k)
        b = B[k]
        reachable(b.get('next'), out)
        for v in b.get('inputs', {}).values():
            for x in v[1:]:
                if isinstance(x, str) and x in B:
                    reachable(x, out)
        return out
    old = reachable(B[turn_def]['next'], set()) | reachable(B[straight_def]['next'], set())
    old_comments = {B[k]['comment'] for k in old if 'comment' in B[k]}
    for k in old:
        del B[k]
    for c in old_comments:
        del C[c]

    var_id, err_id = new_id(B), new_id(B)
    t['variables'][var_id] = [VAR_NAME, 0]
    t['variables'][err_id] = [ERR_NAME, 0]
    b = Build(B, {VAR_NAME: var_id, ERR_NAME: err_id})

    # ---- turn ----------------------------------------------------------------
    # Direction comes from degrees (never divide by error: it can be exactly 0).
    # Stops once the robot is within 1 degree OR has gone past, like the turn that worked on the robot. No back-and-forth hunting.
    side = lambda: b.div(b.arg('degrees'), b.abs(b.arg('degrees')))
    turn_nonzero = b.cmp('operator_gt', b.abs(b.arg('degrees')), 0)
    here = b.set_heading_to_yaw()
    change = b.block('data_changevariableby', {'VALUE': b.arg('degrees')}, {'VARIABLE': [VAR_NAME, var_id]})
    reset_t = b.block('flippersensors_resetTimer')
    set_err = b.set_error()
    close = b.cmp('operator_lt', b.mul(ERR_NAME, side()), 1)
    turn_limit = b.add(2, b.div(b.abs(b.arg('degrees')), 30))
    late = b.cmp('operator_gt', b.timer(), turn_limit)
    speed = lambda: b.add(8, b.mul(0.4, b.abs(ERR_NAME)))
    drive = b.block('flippermoremove_startDualSpeed', {'LEFT': b.mul(speed(), side()),
                                                       'RIGHT': b.mul(speed(), b.mul(-1, side()))})
    loop = b.block('control_repeat_until', {'CONDITION': b.logic('operator_or', close, late)})
    B[loop]['inputs']['SUBSTACK'] = [2, b.stack(loop, [drive, b.set_error()])]
    stop = b.block('flippermove_stopMove')
    turn_guard = b.block('control_if', {'CONDITION': turn_nonzero})
    B[turn_guard]['inputs']['SUBSTACK'] = [2, b.stack(turn_guard, [here, change, reset_t, set_err, loop, stop])]
    B[turn_def]['next'] = b.stack(turn_def, [turn_guard])

    # ---- straight ------------------------------------------------------------
    nonzero = b.logic('operator_and', b.cmp('operator_gt', b.abs(b.arg('cm')), 0),
                      b.cmp('operator_gt', b.abs(b.arg('speed')), 0))
    zero_b = b.block('flippermoremotor_motorSetDegreeCounted', {'VALUE': 0})
    sel = b.port_selector('flippermoremotor_multiple-port-selector', 'field_flippermoremotor_multiple-port-selector', 'B')
    B[zero_b]['inputs'] = {'PORT': [1, sel], 'VALUE': [1, [4, '0']]}
    B[sel]['parent'] = zero_b
    hold = b.set_heading_to_yaw()
    reset_t2 = b.block('flippersensors_resetTimer')
    pos = b.block('flippermoremotor_position')
    sel2 = b.port_selector('flippermoremotor_single-motor-selector', 'field_flippermoremotor_single-motor-selector', 'B')
    B[pos]['inputs'] = {'PORT': [1, sel2]}
    B[sel2]['parent'] = pos
    far = b.cmp('operator_gt', b.abs(pos), b.mul(b.abs(b.arg('cm')), 17.6))
    expected = b.div(b.mul(b.abs(b.arg('cm')), 17.6), b.mul(b.abs(b.arg('speed')), 10.5))
    straight_limit = b.add(b.mul(expected, 2), 0.5)
    late2 = b.cmp('operator_gt', b.timer(), straight_limit)
    base = lambda: b.mul(b.arg('speed'), b.div(b.arg('cm'), b.abs(b.arg('cm'))))
    drive2 = b.block('flippermoremove_startDualSpeed', {'LEFT': b.add(base(), b.mul(ERR_NAME, 2)),
                                                        'RIGHT': b.sub(base(), b.mul(ERR_NAME, 2))})
    loop2 = b.block('control_repeat_until', {'CONDITION': b.logic('operator_or', far, late2)})
    B[loop2]['inputs']['SUBSTACK'] = [2, b.stack(loop2, [drive2, b.set_error()])]
    stop2 = b.block('flippermove_stopMove')
    guard = b.block('control_if', {'CONDITION': nonzero})
    B[guard]['inputs']['SUBSTACK'] = [2, b.stack(guard, [hold, zero_b, reset_t2, b.set_error(), loop2, stop2])]
    B[straight_def]['next'] = b.stack(straight_def, [guard])

    # ---- main: set up the heading lock once, after "set movement speed" --------
    speed_blk = next(k for k, v in B.items() if isinstance(v, dict) and v['opcode'] == 'flippermove_movementSpeed'
                     and v['parent'] == B[main_hat]['next'])
    after = B[speed_blk]['next']
    reset_yaw = b.block('flippersensors_resetYaw')
    wait = b.block('control_wait', {'DURATION': 0.2})
    set_h = b.block('data_setvariableto', fields={'VARIABLE': [VAR_NAME, var_id]})
    B[set_h]['inputs'] = {'VALUE': [1, [10, '0']]}
    b.stack(speed_blk, [reset_yaw, wait, set_h])
    B[speed_blk]['next'] = reset_yaw
    B[set_h]['next'] = after
    B[after]['parent'] = set_h

    # ---- comments ------------------------------------------------------------
    from mission6_7_11_comments import TEXT
    def put(cid, block_id, x, y_bottom, width=400):
        text = TEXT[cid]
        h = comment_height(text, width)
        C[cid] = {'blockId': block_id, 'x': x, 'y': y_bottom - h, 'width': width, 'height': h, 'minimized': False, 'text': text}
        if block_id:
            B[block_id]['comment'] = cid
    for cid in ('cMission', 'cWords', 'cTurn_main', 'cStraight_main'):    # these grow upward (nothing above them)
        old_c = C[cid]
        put(cid, old_c['blockId'], old_c['x'], old_c['y'] + old_c['height'], old_c['width'])
    # PART 2 sits between PART 1 and PART 3: keep its top, grow it downward, and move PART 3 below it
    p2 = C['cPart2']
    h = comment_height(TEXT['cPart2'], p2['width'])
    put('cPart2', p2['blockId'], p2['x'], p2['y'] + h, p2['width'])
    C['cPart3']['y'] = max(C['cPart3']['y'], C['cPart2']['y'] + C['cPart2']['height'] + 20)
    tx, ty = B[turn_def]['x'], B[turn_def]['y']
    for i, (cid, k) in enumerate([('cTurn_heading', here), ('cTurn_error', set_err), ('cTurn_repeat', loop),
                                  ('cTurn_drive', drive)]):
        put(cid, k, tx + 420 * (i + 1), ty - 40)
    sx, sy = B[straight_def]['x'], B[straight_def]['y']
    for i, (cid, k) in enumerate([('cStraight_if', guard), ('cStraight_zero', zero_b), ('cStraight_repeat', loop2),
                                  ('cStraight_drive', drive2)]):
        put(cid, k, sx + 420 * (i + 1), sy - 40)
    put('cLock', reset_yaw, -500, 60 - 20)

    # ---- validate ------------------------------------------------------------
    for k, v in B.items():
        if not isinstance(v, dict):
            continue
        assert v['parent'] is None or v['parent'] in B, (k, 'missing parent')
        for name, inp in v['inputs'].items():
            for x in inp[1:]:
                if isinstance(x, str):
                    assert x in B and B[x]['parent'] == k, (k, name, 'child/parent mismatch')
        if v.get('next'):
            assert B[v['next']]['parent'] == k, (k, 'next/parent mismatch')
    for cid, c in C.items():
        assert c['blockId'] is None or B[c['blockId']].get('comment') == cid, cid
    assert 'BA' in json.dumps(B), 'movement pair BA missing'

    manifest['name'] = 'gyro-mission6-7-11'
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    manifest['slotIndex'] = 19                                  # AGENTS.md: temporary tests use slot 19

    # ---- write: rebuild both ZIPs in memory, same member order, tmp sibling, then os.replace ----
    new_inner = io.BytesIO()
    with zipfile.ZipFile(new_inner, 'w', zipfile.ZIP_DEFLATED) as zo:
        for info in inner.infolist():
            data = json.dumps(project, separators=(',', ':')).encode() if info.filename == 'project.json' else inner.read(info)
            zo.writestr(info, data)
    new_outer = io.BytesIO()
    with zipfile.ZipFile(new_outer, 'w', zipfile.ZIP_DEFLATED) as zo:
        for info in outer.infolist():
            if info.filename == 'scratch.sb3':
                data = new_inner.getvalue()
            elif info.filename == 'manifest.json':
                data = json.dumps(manifest, separators=(',', ':')).encode()
            else:
                data = outer.read(info)
            zo.writestr(info, data)
    tmp = OUT + '.tmp'
    with open(tmp, 'wb') as f:
        f.write(new_outer.getvalue())
    os.replace(tmp, OUT)

    # reopen and check
    z = zipfile.ZipFile(OUT)
    assert z.testzip() is None
    p2 = json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json'))
    s2 = [x for x in p2['targets'] if not x['isStage']][0]
    assert s2['variables'][var_id] == [VAR_NAME, 0] and s2['variables'][err_id] == [ERR_NAME, 0]
    assert open(SRC, 'rb').read() == src_bytes, 'source changed!'
    print(f'wrote {OUT}: {len(s2["blocks"])} blocks, {len(s2["comments"])} comments, variable {VAR_NAME}')


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
