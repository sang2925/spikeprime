"""Build turn-test.llsp3 (version 2, 2026-10-26) from Team Template.llsp3. All sources are read only.

The robot turns right 90 FOUR times in a row (a full circle) with the turn from gyro-mission6-7-11_simpleturn.llsp3
(constant slow speed). After each turn it waits 1 second and shows on the hub how far it really turned (yaw, rounded).
Reading: shown number minus 90 = how far that turn went past. A robot that does not slide ends where it started.
The first version (old turn vs new turn, 6 half-circle turns) is archived-llsp3/turn-test_old_vs_new.llsp3.
The template's own turn My Block is replaced by the simple-turn one; its straight My Block is kept (not used here).
Block formats come from real SPIKE exports: the team files, samples/format-sample.llsp3 and
samples/write-sample.llsp3 (write, round, repeat).

Run from the project root: python3 -I tools/build_turn_test.py
"""
import copy, io, json, os, random, string, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_gyro_mission6_7_11 import comment_height, new_id   # same id style and comment sizing
from mission6_7_11_comments import TEXT as MISSION_TEXT        # the full WORDS TO KNOW from gyro-mission6-7-11

TEMPLATE = 'Team Template.llsp3'
NEW_SRC = 'gyro-mission6-7-11_simpleturn.llsp3'
OUT = 'turn-test.llsp3'

TEXT = {
    'cSetup': """TURN TEST: does the robot turn without sliding?

The robot turns right 90 degrees FOUR times (a full circle) with our new slow turn (12% speed).
After each turn it stops, waits 1 second, and shows a number on the hub: how far it really turned.

BEFORE: put the robot on the mat in an empty spot. Stick tape at its 4 corners, like a box around it.
AFTER: is the robot still inside the box? If it ended up behind the box, it slid.

Write every number down. Number minus 90 = how far the turn went past.
  Example: the hub shows 93. 93 - 90 = 3 degrees too far.
  Numbers about the same every time = a steady turn.

A grown-up says OK first, and nothing is within 30 cm of the robot.
The hub shows GO before the first turn.""",

    'cPart1': """PART 1: 4 TURNS
Set yaw angle to 0, wait a moment, turn right 90, wait 1 second so the robot stops rolling, then show how far it turned. Wait 3 seconds so you can read it. Then again, 4 times in all.""",

    'cShow': """WRITE (ROUND (YAW ANGLE))
Shows how far the robot really turned, rounded to a whole number. The light matrix scrolls it.
Missed it? Start the program again and watch closely.""",
}


def read(path):
    data = open(path, 'rb').read()
    outer = zipfile.ZipFile(io.BytesIO(data))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    project = json.loads(inner.read('project.json'))
    sprite = [t for t in project['targets'] if not t['isStage']]
    assert len(sprite) == 1, f'{path}: expected one sprite target'
    return data, outer, inner, project, sprite[0]


def procedure(t, proccode):
    """Id of the procedures_definition whose prototype has this proccode"""
    B = t['blocks']
    found = [k for k, b in B.items() if isinstance(b, dict) and b['opcode'] == 'procedures_definition'
             and B[b['inputs']['custom_block'][1]]['mutation']['proccode'] == proccode]
    assert len(found) == 1, (proccode, found)
    return found[0]


def reachable(B, k, out):
    """Block ids under k: its next chain and everything plugged into its inputs"""
    while k and k not in out:
        out.add(k)
        for v in B[k].get('inputs', {}).values():
            for x in v[1:]:
                if isinstance(x, str) and x in B:
                    reachable(B, x, out)
        k = B[k].get('next')
    return out


def copy_procedure(src, def_id, dst, var_map, at, proccode=None):
    """Copy a My Block (definition, prototype, argument shadows, body) and the comments on it from src into dst
    with new block ids. var_map maps the source variable ids to dst ids. Returns the new definition id."""
    S, D = src['blocks'], dst['blocks']
    ids = reachable(S, def_id, set())
    idmap = {}
    for k in ids:
        idmap[k] = new_id(set(D) | set(idmap.values()))
    arg_map = {}
    if proccode:   # renamed copy: new argument ids too, so it can never be confused with the original
        proto = S[S[def_id]['inputs']['custom_block'][1]]
        arg_map = {a: new_id(set(D)) for a in json.loads(proto['mutation']['argumentids'])}

    def ref(x):
        if isinstance(x, str):
            return idmap.get(x, x)
        if isinstance(x, list) and len(x) >= 3 and x[0] == 12:   # variable reporter [12, name, id]
            return [12, x[1], var_map[x[2]]]
        return x

    for k in ids:
        b = copy.deepcopy(S[k])
        b['next'], b['parent'] = idmap.get(b['next']), idmap.get(b['parent'])
        b['inputs'] = {arg_map.get(name, name): [v[0]] + [ref(x) for x in v[1:]] for name, v in b.get('inputs', {}).items()}
        if 'VARIABLE' in b.get('fields', {}):
            name, vid = b['fields']['VARIABLE']
            b['fields']['VARIABLE'] = [name, var_map[vid]]
        if b['opcode'] == 'procedures_prototype' and proccode:
            m = b['mutation']
            m['proccode'] = proccode
            m['argumentids'] = json.dumps([arg_map[a] for a in json.loads(m['argumentids'])])
        b.pop('comment', None)
        D[idmap[k]] = b
    dx, dy = at[0] - S[def_id]['x'], at[1] - S[def_id]['y']
    D[idmap[def_id]]['x'], D[idmap[def_id]]['y'] = at
    for cid, c in src['comments'].items():
        if c['blockId'] in ids:
            new_cid = cid if cid not in dst['comments'] else new_id(set(dst['comments']))
            dst['comments'][new_cid] = {**c, 'blockId': idmap[c['blockId']], 'x': c['x'] + dx, 'y': c['y'] + dy}
            D[idmap[c['blockId']]]['comment'] = new_cid
    return idmap[def_id]


class Stack:
    """Small block maker for the main script, using the formats of real SPIKE exports"""
    def __init__(self, B):
        self.B = B

    def block(self, opcode, inputs=None, fields=None, **extra):
        k = new_id(set(self.B))
        self.B[k] = {'opcode': opcode, 'next': None, 'parent': None, 'inputs': inputs or {}, 'fields': fields or {},
                     'shadow': False, 'topLevel': False, **extra}
        for v in self.B[k]['inputs'].values():
            for x in v[1:]:
                if isinstance(x, str) and x in self.B:
                    self.B[x]['parent'] = k
        return k

    def chain(self, parent, ids, substack=False):
        """Put ids one under another below parent (or inside parent's mouth when substack); returns the last id"""
        prev = None
        for k in ids:
            self.B[k]['parent'] = prev or parent
            if prev:
                self.B[prev]['next'] = k
            prev = k
        if substack:
            self.B[parent]['inputs']['SUBSTACK'] = [2, ids[0]]
        else:
            self.B[parent]['next'] = ids[0]
        return prev

    def wait(self, s):
        return self.block('control_wait', {'DURATION': [1, [4, str(s)]]})

    def write_text(self, text):
        return self.block('flipperlight_lightDisplayText', {'TEXT': [1, [10, text]]})

    def write_yaw(self):
        yaw = self.block('flippersensors_orientationAxis', fields={'AXIS': ['yaw', None]})
        rnd = self.block('operator_round', {'NUM': [3, yaw, [4, '']]})
        return self.block('flipperlight_lightDisplayText', {'TEXT': [3, rnd, [10, '']]})

    def call(self, proccode, arg_id, value):
        return self.block('procedures_call', {arg_id: [1, [10, str(value)]]}, mutation={
            'tagName': 'mutation', 'children': [], 'proccode': proccode, 'argumentids': json.dumps([arg_id]), 'warp': 'false'})

    def repeat(self, times, body):
        k = self.block('control_repeat', {'TIMES': [1, [6, str(times)]]})
        self.chain(k, body, substack=True)
        return k


def main():
    if os.path.exists(OUT):
        sys.exit(f'{OUT} already exists. Move it away first (never overwritten without approval).')
    sources = {p: open(p, 'rb').read() for p in (TEMPLATE, NEW_SRC)}   # read everything before any write
    _, outer, inner, project, t = read(TEMPLATE)
    _, _, _, _, new = read(NEW_SRC)
    manifest = json.loads(outer.read('manifest.json'))
    B, C = t['blocks'], t['comments']

    # ---- replace the template's turn with the simple turn from gyro-mission6-7-11_simpleturn ----------------------------------
    tmpl_turn = procedure(t, 'turn %s')
    at = (B[tmpl_turn]['x'], B[tmpl_turn]['y'])
    gone = reachable(B, tmpl_turn, set())
    for cid in [cid for cid, c in C.items() if c['blockId'] in gone]:
        del C[cid]
    for k in gone:
        del B[k]
    var_map = {}
    for vid, (name, _) in new['variables'].items():
        var_map[vid] = new_id(set(B) | set(t['variables']))
        t['variables'][var_map[vid]] = [name, 0]
    new_turn = copy_procedure(new, procedure(new, 'turn %s'), t, var_map, at)

    new_arg = json.loads(B[B[new_turn]['inputs']['custom_block'][1]]['mutation']['argumentids'])[0]

    # ---- move the (unused) straight My Block and its comments below the longer main script ------------------
    straight = procedure(t, 'straight %s cm at speed %s')
    moved = reachable(B, straight, set())
    B[straight]['y'] += 1400
    for c in C.values():
        if c['blockId'] in moved:
            c['y'] += 1400

    # ---- main script: after "set movement speed to 50%" -------------------------------------------------------
    hat = next(k for k, b in B.items() if isinstance(b, dict) and b['opcode'] == 'flipperevents_whenProgramStarts')
    speed = B[hat]['next']
    assert B[B[speed]['next']]['opcode'] == 'flippermove_movementSpeed' and B[speed]['opcode'] == 'flippermove_setMovementPair'
    speed = B[speed]['next']
    assert B[speed]['next'] is None, 'template main script changed: expected it to end at set movement speed'
    s = Stack(B)
    show1 = s.write_yaw()
    part1 = s.repeat(4, [s.block('flippersensors_resetYaw'), s.wait(0.2), s.call('turn %s', new_arg, 90), s.wait(1), show1, s.wait(3)])
    s.chain(speed, [s.write_text('GO'), s.wait(2), part1])

    # ---- comments ------------------------------------------------------------------------------------------
    def put(cid, block_id, x, y_bottom, width=400):
        h = comment_height(TEXT[cid], width)
        C[cid] = {'blockId': block_id, 'x': x, 'y': y_bottom - h, 'width': width, 'height': h, 'minimized': False,
                  'text': TEXT[cid]}
        B[block_id]['comment'] = cid
    setup = C['cSetup']
    put('cSetup', setup['blockId'], setup['x'], setup['y'] + setup['height'], setup['width'])   # grows upward
    # the template's WORDS TO KNOW has no heading / error: use the mission's full list (keeps its top-left corner)
    words = MISSION_TEXT['cWords']
    C['cWords'].update(text=words, height=comment_height(words, C['cWords']['width']))
    # which wheel motor B drives has not been checked on the robot (AGENTS.md): no "left wheel" claim (keeps its bottom)
    zero = C['cStraight_zero']
    old_line = 'Motor B turns the left wheel. Its "relative position" counts how far the wheel has turned'
    assert zero['text'].count(old_line) == 1, 'template B comment changed'
    zero['text'] = zero['text'].replace(old_line, 'Motor B turns one of our two drive wheels. Its "relative position" counts how far that wheel has turned')
    h = comment_height(zero['text'], zero['width'])
    zero.update(y=zero['y'] + zero['height'] - h, height=h)
    put('cPart1', part1, -940, 400)
    put('cShow', show1, -940, 760)

    # ---- the light matrix blocks need the flipperlight extension in both lists ---------------------------------
    for lst in (project['extensions'], manifest['extensions']):
        if 'flipperlight' not in lst:
            lst.append('flipperlight')

    # ---- validate ------------------------------------------------------------------------------------------
    for k, v in B.items():
        if not isinstance(v, dict):
            continue
        assert v['parent'] is None or v['parent'] in B, (k, 'missing parent')
        for name, inp in v['inputs'].items():
            for x in inp[1:]:
                if isinstance(x, str):
                    assert x in B and B[x]['parent'] == k, (k, name, 'child/parent mismatch')
                if isinstance(x, list) and x and x[0] == 12:
                    assert x[2] in t['variables'], (k, 'unknown variable')
        if v.get('next'):
            assert B[v['next']]['parent'] == k, (k, 'next/parent mismatch')
        if 'VARIABLE' in v['fields']:
            assert v['fields']['VARIABLE'][1] in t['variables'], (k, 'unknown variable')
    for cid, c in C.items():
        assert c['blockId'] is None or B[c['blockId']].get('comment') == cid, cid
    protos = {B[k]['mutation']['proccode']: json.loads(B[k]['mutation']['argumentids'])
              for k, b in B.items() if isinstance(b, dict) and b['opcode'] == 'procedures_prototype'}
    assert sorted(protos) == ['straight %s cm at speed %s', 'turn %s'], protos
    for b in B.values():
        if isinstance(b, dict) and b['opcode'] == 'procedures_call':
            assert json.loads(b['mutation']['argumentids']) == protos[b['mutation']['proccode']], b['mutation']
    assert '"BA"' in json.dumps(B), 'movement pair BA missing'

    manifest['name'] = 'turn-test'
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    manifest['slotIndex'] = 19                                  # AGENTS.md: temporary tests use slot 19

    # ---- write: rebuild both ZIPs in memory, same member order, tmp sibling, then os.replace ----------------
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
    t2 = [x for x in json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json'))['targets']
          if not x['isStage']][0]
    assert sorted(n for n, _ in t2['variables'].values()) == ['error', 'heading']
    for p, data in sources.items():
        assert open(p, 'rb').read() == data, f'{p} changed!'
    print(f'wrote {OUT}: {len(t2["blocks"])} blocks, {len(t2["comments"])} comments, variables heading and error')


if __name__ == '__main__':
    main()
