"""Add two Gyro Turn My Blocks to Team Template.llsp3 (coach's request, 2026-10-28; copied from the coach's photo):

  Gyro Turn (Degrees) (Acceleration)      exactly like the photo:
      set yaw angle to 0
      start moving at (15 * Degrees / abs(Degrees)) (-15 * Degrees / abs(Degrees)) % speed
      wait until abs(yaw angle) = abs(Degrees) - 0
      stop moving
      wait until Degrees = yaw angle
      stop moving
  Gyro Turn safe (Degrees) (Acceleration)  the same, but it cannot miss the angle or wait forever:
      set yaw angle to 0, wait 0.05 seconds (Prime Lessons: the yaw reset is not instant)
      start moving at (the same two speeds)
      wait until abs(yaw angle) > abs(Degrees) - 1
      stop moving
Nothing else in the template changes (main script, turn, straight, notes). Acceleration is not used, as in the photo.
operator_equals has no real export here (standard Scratch OPERAND1/OPERAND2): open the result in SPIKE to check it.
Run from the project root (the source is the template as it was before; the output is the new template):
  python3 -I tools/add_gyro_turn_blocks.py <source template.llsp3> <output.llsp3>
"""
import io, json, os, random, string, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_gyro_mission6_7_11 import comment_height, new_id

NOTE_PHOTO = """MY BLOCK: GYRO TURN (Degrees) (Acceleration), like the photo
Spins at 15% until the gyro reads exactly the number, then stops. Plus = right, minus = left.
Careful: 'wait until ... =' only works if the gyro shows exactly that number. If it skips past it, the robot spins a whole extra circle. If the robot coasts past, the second 'wait until' waits forever.
Use Gyro Turn safe for missions. Acceleration is not used yet."""

NOTE_SAFE = """MY BLOCK: GYRO TURN SAFE (Degrees) (Acceleration)
The same 15% turn, but it stops when the gyro reads MORE than the number minus 1, so it can't miss it or get stuck.
Turns too far? Change the 1 to 2. Stops short? Change it to 0.
Acceleration is not used yet."""


def main(SRC, OUT):
    if os.path.exists(OUT):
        sys.exit(f'{OUT} already exists. Move it away first (never overwritten without approval).')
    src = open(SRC, 'rb').read()
    outer = zipfile.ZipFile(io.BytesIO(src))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    raw = inner.read('project.json')
    project, manifest = json.loads(raw), json.loads(outer.read('manifest.json'))
    t = [x for x in project['targets'] if not x['isStage']][0]
    B, C = t['blocks'], t['comments']
    before = json.loads(raw)

    def blk(opcode, inputs=None, fields=None, shadow=False, **extra):
        k = new_id(set(B))
        B[k] = {'opcode': opcode, 'next': None, 'parent': None, 'inputs': inputs or {}, 'fields': fields or {},
                'shadow': shadow, 'topLevel': False, **extra}
        for v in B[k]['inputs'].values():
            for x in v[1:]:
                if isinstance(x, str) and x in B:
                    B[x]['parent'] = k
        return k

    def chain(ids, parent=None):
        for a, b in zip(ids, ids[1:]):
            B[a]['next'], B[b]['parent'] = b, a
        if parent:
            B[ids[0]]['parent'] = parent
        return ids

    deg = lambda: blk('argument_reporter_string_number', fields={'VALUE': ['Degrees', None]})
    num = lambda r: [3, r, [4, '']]
    yaw = lambda: blk('flippersensors_orientationAxis', fields={'AXIS': ['yaw', None]})
    absof = lambda r: blk('operator_mathop', {'NUM': num(r)}, {'OPERATOR': ['abs', None]})

    def wheel(sign):   # (sign * Degrees) / abs(Degrees)
        mul = blk('operator_multiply', {'NUM1': [1, [4, str(sign)]], 'NUM2': num(deg())})
        return blk('operator_divide', {'NUM1': num(mul), 'NUM2': num(absof(deg()))})

    def define(name, x, y, note_id, note):
        arg_deg, arg_acc = new_id(set(B)), new_id(set(B))
        proto = blk('procedures_prototype', {arg_deg: [1, blk('argument_reporter_string_number', fields={'VALUE': ['Degrees', None]}, shadow=True)],
                                             arg_acc: [1, blk('argument_reporter_string_number', fields={'VALUE': ['Acceleration', None]}, shadow=True)]},
                    shadow=True, mutation={'tagName': 'mutation', 'children': [], 'proccode': name + ' %s %s',
                                           'argumentids': json.dumps([arg_deg, arg_acc]), 'argumentnames': json.dumps(['Degrees', 'Acceleration']),
                                           'argumentdefaults': json.dumps(['', '']), 'warp': 'false'})
        d = blk('procedures_definition', {'custom_block': [1, proto]}, topLevel=True, x=x, y=y)
        h = comment_height(note, 400)
        C[note_id] = {'blockId': d, 'x': x, 'y': y - h - 20, 'width': 400, 'height': h, 'minimized': False, 'text': note}
        B[d]['comment'] = note_id
        return d

    move = lambda: blk('flippermoremove_startDualSpeed', {'LEFT': num(wheel(15)), 'RIGHT': num(wheel(-15))})

    # ---- Gyro Turn, exactly like the photo ---------------------------------------------------------------------
    photo = define('Gyro Turn', 3700, 0, 'cGyroTurn', NOTE_PHOTO)
    eq1 = blk('operator_equals', {'OPERAND1': [3, absof(yaw()), [10, '']],
                                  'OPERAND2': [3, blk('operator_subtract', {'NUM1': num(absof(deg())), 'NUM2': [1, [4, '0']]}), [10, '']]})
    eq2 = blk('operator_equals', {'OPERAND1': [3, deg(), [10, '']], 'OPERAND2': [3, yaw(), [10, '']]})
    chain([photo, blk('flippersensors_resetYaw'), move(), blk('control_wait_until', {'CONDITION': [2, eq1]}), blk('flippermove_stopMove'),
           blk('control_wait_until', {'CONDITION': [2, eq2]}), blk('flippermove_stopMove')])

    # ---- Gyro Turn safe ----------------------------------------------------------------------------------------
    safe = define('Gyro Turn safe', 3700, 900, 'cGyroTurnSafe', NOTE_SAFE)
    gt = blk('operator_gt', {'OPERAND1': [3, absof(yaw()), [10, '']],
                             'OPERAND2': [3, blk('operator_subtract', {'NUM1': num(absof(deg())), 'NUM2': [1, [4, '1']]}), [10, '']]})
    chain([safe, blk('flippersensors_resetYaw'), blk('control_wait', {'DURATION': [1, [4, '0.05']]}), move(),
           blk('control_wait_until', {'CONDITION': [2, gt]}), blk('flippermove_stopMove')])

    for k, v in B.items():   # links are consistent
        if v.get('next'):
            assert B[v['next']]['parent'] == k, k
        for inp in v['inputs'].values():
            for x in inp[1:]:
                if isinstance(x, str):
                    assert x in B and B[x]['parent'] == k, (k, x)
    assert '"BA"' in json.dumps(B)

    old = [x for x in before['targets'] if not x['isStage']][0]
    assert all(old['blocks'][k] == B[k] for k in old['blocks']), 'an existing template block changed'
    assert all(old['comments'][k] == C[k] for k in old['comments']), 'an existing template note changed'
    ni = io.BytesIO()
    with zipfile.ZipFile(ni, 'w', zipfile.ZIP_DEFLATED) as zo:
        for i in inner.infolist():
            zo.writestr(i, json.dumps(project, separators=(',', ':')).encode() if i.filename == 'project.json' else inner.read(i))
    no = io.BytesIO()
    with zipfile.ZipFile(no, 'w', zipfile.ZIP_DEFLATED) as zo:
        for i in outer.infolist():
            zo.writestr(i, ni.getvalue() if i.filename == 'scratch.sb3'
                        else json.dumps(manifest, separators=(',', ':')).encode() if i.filename == 'manifest.json' else outer.read(i))
    with open(OUT + '.tmp', 'wb') as f:
        f.write(no.getvalue())
    os.replace(OUT + '.tmp', OUT)
    assert zipfile.ZipFile(OUT).testzip() is None
    assert open(SRC, 'rb').read() == src, 'template changed!'
    print(f'wrote {OUT}: {len(B)} blocks, {len(C)} notes; existing template blocks and notes unchanged')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
