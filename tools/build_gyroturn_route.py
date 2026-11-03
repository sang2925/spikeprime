"""Build gyroturn-route.llsp3 (coach's photo program, 2026-11-02, with the Gyro Turn fixed).

The main program is copied from the coach's photo: B+A, speed 50, then
  move up 55, Gyro Turn 45 0, move up 25, Gyro Turn 45 0, move up 30, Gyro Turn 45 0,
  speed 10, move up 35, speed 25, move down 10, Gyro Turn 55 0, move up 30, Gyro Turn 45 0, speed 80, move up 60.
Start: a copy of Team Template (read-only). The photo's Gyro Turn is removed and Gyro Turn safe is renamed to
Gyro Turn, so the main program reads exactly like the photo but every turn uses the fixed version:
  set yaw angle to 0, wait 0.05, start moving at (the same 15% speeds), wait until abs(yaw) > abs(Degrees) - 1, stop.
Run from the project root (refuses to overwrite):
  python3 -I tools/build_gyroturn_route.py "Team Template.llsp3" gyroturn-route.llsp3
With --no-route only the Gyro Turn swap is made (used 2026-11-02 to update Team Template itself, coach's request):
  python3 -I tools/build_gyroturn_route.py <old template> "Team Template.llsp3" --no-route
"""
import io, json, os, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_gyro_mission6_7_11 import comment_height, new_id

ROUTE = [('move', 'forward', 55), ('turn', 45), ('move', 'forward', 25), ('turn', 45), ('move', 'forward', 30), ('turn', 45),
         ('speed', 10), ('move', 'forward', 35), ('speed', 25), ('move', 'back', 10), ('turn', 55), ('move', 'forward', 30),
         ('turn', 45), ('speed', 80), ('move', 'forward', 60)]

NOTE_TURN = """MY BLOCK: GYRO TURN (Degrees) (Acceleration), fixed
Spins at 15% until the gyro reads MORE than the number minus 1, then stops. Plus = right, minus = left.
What changed from the photo: a 0.05 second wait after 'set yaw angle to 0' (the reset is not instant); '=' became '>' with minus 1, so it can't miss the number and spin a whole circle; the second 'wait until' is gone, so it can't wait forever.
Turns too far? Change the 1 to 2. Stops short? Change it to 0.
Acceleration is not used yet."""


def main(SRC, OUT, route=True):
    if os.path.exists(OUT):
        sys.exit(f'{OUT} already exists. Move it away first (never overwritten without approval).')
    src = open(SRC, 'rb').read()
    outer = zipfile.ZipFile(io.BytesIO(src))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    project, manifest = json.loads(inner.read('project.json')), json.loads(outer.read('manifest.json'))
    t = [x for x in project['targets'] if not x['isStage']][0]
    B, C = t['blocks'], t['comments']

    protos = {v['mutation']['proccode']: k for k, v in B.items() if v['opcode'] == 'procedures_prototype'}

    # remove the photo's Gyro Turn (definition stack and everything under it) and its note
    photo_def = B[protos['Gyro Turn %s %s']]['parent']
    doomed = {photo_def}
    while True:
        more = {k for k, v in B.items() if k not in doomed and (v['parent'] in doomed)}
        if not more:
            break
        doomed |= more
    assert not any(v['opcode'] == 'procedures_call' for v in B.values()), 'template should have no calls'
    for k in doomed:
        del B[k]
    del C['cGyroTurn']

    # rename Gyro Turn safe to Gyro Turn
    proto = B[protos['Gyro Turn safe %s %s']]
    proto['mutation']['proccode'] = 'Gyro Turn %s %s'
    arg_deg, arg_acc = json.loads(proto['mutation']['argumentids'])
    words = C['cWords']
    assert words['text'].count("Ours are 'turn' and 'straight'.") == 1
    words['text'] = words['text'].replace("Ours are 'turn' and 'straight'.", "Ours are 'turn', 'straight' and 'Gyro Turn'.")
    note = C['cGyroTurnSafe']
    note['text'], note['height'], note['y'] = NOTE_TURN, comment_height(NOTE_TURN, 400), 0
    B[note['blockId']]['y'] = comment_height(NOTE_TURN, 400) + 40

    def blk(opcode, inputs=None, fields=None, shadow=False, **extra):
        k = new_id(set(B))
        B[k] = {'opcode': opcode, 'next': None, 'parent': None, 'inputs': inputs or {}, 'fields': fields or {},
                'shadow': shadow, 'topLevel': False, **extra}
        for v in B[k]['inputs'].values():
            if isinstance(v[1], str):
                B[v[1]]['parent'] = k
        return k

    def step(s):
        if s[0] == 'move':
            d = blk('flippermove_custom-icon-direction', fields={'field_flippermove_custom-icon-direction': [s[1], None]}, shadow=True)
            return blk('flippermove_move', {'DIRECTION': [1, d], 'VALUE': [1, [4, str(s[2])]]}, {'UNIT': ['cm', None]})
        if s[0] == 'speed':
            return blk('flippermove_movementSpeed', {'SPEED': [1, [4, str(s[1])]]})
        return blk('procedures_call', {arg_deg: [1, [10, str(s[1])]], arg_acc: [1, [10, '0']]},
                   mutation={'tagName': 'mutation', 'children': [], 'proccode': 'Gyro Turn %s %s',
                             'argumentids': json.dumps([arg_deg, arg_acc]), 'warp': 'false'})

    # append the route after 'set movement speed to 50' in the main script
    hat = next(k for k, v in B.items() if v['opcode'] == 'flipperevents_whenProgramStarts')
    last = hat
    while B[last]['next']:
        last = B[last]['next']
    assert B[last]['opcode'] == 'flippermove_movementSpeed' and B[last]['inputs']['SPEED'][1][1] == '50'
    for s in ROUTE if route else []:
        k = step(s)
        B[last]['next'], B[k]['parent'] = k, last
        last = k

    for k, v in B.items():   # links are consistent
        if v.get('next'):
            assert B[v['next']]['parent'] == k, k
        if v['parent']:
            assert v['parent'] in B, k
        for inp in v['inputs'].values():
            if isinstance(inp[1], str):
                assert B[inp[1]]['parent'] == k, (k, inp)
    for c in C.values():
        assert c['blockId'] is None or c['blockId'] in B
    assert '"BA"' in json.dumps(B)

    if route:
        manifest['name'] = 'gyroturn-route'
    manifest['slotIndex'] = 19
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
    print(f'wrote {OUT}: {len(B)} blocks, {len(C)} notes')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4) or sys.argv[3:] not in ([], ['--no-route']):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], route=len(sys.argv) == 3)
