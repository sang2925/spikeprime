"""Split the coach's 110226-mission7-11.llsp3 (2026-11-03) into two programs, one per hub slot.

The source has two sets of moves: set 1 under 'when program starts', set 2 loose (it only ran when clicked in the app).
Each output keeps one set plus the Gyro Turn My Block. Set 2 gets its own 'when program starts' on top.
Removed: the leftover stacks (a loose 3-block piece, the old 'wait until Degrees = yaw', the empty 'define block name').
Changed: 'set movement speed to 500' becomes 100 (the hub treats 500 as 100 anyway). No other number changes.
Run from the project root (refuses to overwrite):
  python3 -I tools/split_mission7_11.py <source> <set1 out> <set1 name> <set1 slot> <set2 out> <set2 name> <set2 slot>
"""
import copy, io, json, os, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_gyro_mission6_7_11 import new_id


def stack_ids(B, top):
    """All block ids in the stack starting at top (next chain and everything nested under it)."""
    out, todo = set(), [top]
    while todo:
        k = todo.pop()
        if k in out:
            continue
        out.add(k)
        if B[k]['next']:
            todo.append(B[k]['next'])
        for v in B[k]['inputs'].values():
            for x in v[1:]:
                if isinstance(x, str) and x in B:
                    todo.append(x)
    return out


def build(src, out, name, slot, which):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    outer = zipfile.ZipFile(io.BytesIO(src))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    project, manifest = json.loads(inner.read('project.json')), json.loads(outer.read('manifest.json'))
    t = [x for x in project['targets'] if not x['isStage']][0]
    B = t['blocks']
    tops = [k for k, v in B.items() if v.get('topLevel')]
    hat = next(k for k in tops if B[k]['opcode'] == 'flipperevents_whenProgramStarts')
    gyro = next(k for k in tops if B[k]['opcode'] == 'procedures_definition'
                and B[B[k]['inputs']['custom_block'][1]]['mutation']['proccode'] == 'Gyro Turn %s %s')
    set2 = next(k for k in tops if B[k]['opcode'] == 'flippermove_setMovementPair')   # the loose set starts with B+A
    assert sum(1 for k in tops if B[k]['opcode'] == 'flippermove_setMovementPair') == 1
    assert len(tops) == 6, 'source changed? expected 6 stacks'

    keep = stack_ids(B, gyro)
    if which == 1:
        keep |= stack_ids(B, hat)
    else:
        keep |= stack_ids(B, set2)
        k = new_id(set(B))
        B[k] = copy.deepcopy(B[hat])
        B[k].update(next=set2, x=B[set2]['x'], y=B[set2]['y'] - 60)
        B[set2].update(parent=k, topLevel=False)
        B[set2].pop('x'), B[set2].pop('y')
        keep.add(k)
    for k in set(B) - keep:
        del B[k]
    for v in B.values():
        if v['opcode'] == 'flippermove_movementSpeed' and v['inputs']['SPEED'][1][1] == '500':
            v['inputs']['SPEED'][1][1] = '100'

    for k, v in B.items():   # links are consistent
        if v.get('next'):
            assert B[v['next']]['parent'] == k, k
        assert v['parent'] is None or v['parent'] in B, k
    assert t.get('comments', {}) == {}
    assert '"BA"' in json.dumps(B)

    manifest['name'], manifest['slotIndex'] = name, slot
    ni = io.BytesIO()
    with zipfile.ZipFile(ni, 'w', zipfile.ZIP_DEFLATED) as zo:
        for i in inner.infolist():
            zo.writestr(i, json.dumps(project, separators=(',', ':')).encode() if i.filename == 'project.json' else inner.read(i))
    no = io.BytesIO()
    with zipfile.ZipFile(no, 'w', zipfile.ZIP_DEFLATED) as zo:
        for i in outer.infolist():
            zo.writestr(i, ni.getvalue() if i.filename == 'scratch.sb3'
                        else json.dumps(manifest, separators=(',', ':')).encode() if i.filename == 'manifest.json' else outer.read(i))
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    with open(out + '.tmp', 'wb') as f:
        f.write(no.getvalue())
    os.replace(out + '.tmp', out)
    assert zipfile.ZipFile(out).testzip() is None
    print(f'wrote {out}: {len(B)} blocks, name {name!r}, slot {slot}')


if __name__ == '__main__':
    if len(sys.argv) != 8:
        sys.exit(__doc__)
    s, o1, n1, s1, o2, n2, s2 = sys.argv[1:]
    src = open(s, 'rb').read()
    build(src, o1, n1, int(s1), 1)
    build(src, o2, n2, int(s2), 2)
    assert open(s, 'rb').read() == src, 'source changed!'
