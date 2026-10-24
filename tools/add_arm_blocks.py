"""Copy a Missions 6-7-11 project and add a port C swing arm after the leafcutter push (step 7): three blocks copied
from the old lift-arm stacks in Harrison_Lucas_Kai_leafcutter_uncover.llsp3 (set speed C, turn C out, turn C back), plus
one comment beside them. Nothing else changes (the reopen check below proves it). Needs the 'flippermotor' extension, which
the 6-7-11 programs did not have, so it is added to both extension lists.

The swing angle and direction are guesses to tune on the robot (see the comment text). The old lift arm used 120 degrees
at speed 75-80 (counterclockwise out, clockwise back). This arm rests pointing LEFT across the front of the robot and
swings about 105 degrees to point forward and a little right, at the Mission 7 handle.

Run from the project root:
  python3 -I tools/add_arm_blocks.py <source.llsp3> <output.llsp3>
"""
import copy, io, json, math, os, random, string, sys, zipfile

DONOR = 'archived-llsp3/Harrison_Lucas_Kai_leafcutter_uncover.llsp3'
PUSH_STEP = 7
OUT_DEG, SPEED = '105', '75'
ARM_TEXT = ("ARM (port C), NOT TESTED\n"
            "C counterclockwise 105: the arm swings from the left, across the front, to the Mission 7 handle. C clockwise 105: back.\n"
            "Wrong way? Swap the two directions. Too short? Try 120.")


def new_id():
    return ''.join(random.choice(string.ascii_letters + string.digits + '+/=~-') for _ in range(20))


def comment_height(text, width):
    per_line = max(1, width // 9)
    return 19 * sum(max(1, math.ceil(len(line) / per_line)) for line in text.split('\n')) + 80


def clone(donor_blocks, root):
    """Deep copy a block and its shadow children under fresh ids; returns (new root id, {id: block})."""
    ids, out = {}, {}

    def walk(k):
        ids[k] = new_id()
        for i in donor_blocks[k].get('inputs', {}).values():
            if isinstance(i, list) and isinstance(i[1], str) and i[1] in donor_blocks:
                walk(i[1])
    walk(root)
    for k, nk in ids.items():
        b = copy.deepcopy(donor_blocks[k])
        b['next'], b['parent'], b['topLevel'] = None, None, False
        b.pop('x', None), b.pop('y', None)
        for i in b.get('inputs', {}).values():
            if isinstance(i, list) and isinstance(i[1], str) and i[1] in ids:
                i[1] = ids[i[1]]
        out[nk] = b
    for k, nk in ids.items():
        for i in out[nk].get('inputs', {}).values():
            if isinstance(i, list) and isinstance(i[1], str) and i[1] in out:
                out[i[1]]['parent'] = nk
    return ids[root], out


def main(src, out):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    src_bytes, donor_bytes = open(src, 'rb').read(), open(DONOR, 'rb').read()
    outer = zipfile.ZipFile(io.BytesIO(src_bytes))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project, manifest = json.loads(src_project), json.loads(outer.read('manifest.json'))
    sprite = [t for t in project['targets'] if not t['isStage']]
    assert len(sprite) == 1
    B, C = sprite[0]['blocks'], sprite[0]['comments']

    d_outer = zipfile.ZipFile(io.BytesIO(donor_bytes))
    d_proj = json.loads(zipfile.ZipFile(io.BytesIO(d_outer.read('scratch.sb3'))).read('project.json'))
    DB = [t for t in d_proj['targets'] if not t['isStage']][0]['blocks']
    d_speed = next(k for k, b in DB.items() if b['opcode'] == 'flippermotor_motorSetSpeed' and b['topLevel'])
    d_turn = DB[d_speed]['next']
    assert DB[d_turn]['opcode'] == 'flippermotor_motorTurnForDirection'

    start = [k for k, b in B.items() if b.get('opcode') == 'flipperevents_whenProgramStarts' and b.get('topLevel') and b.get('next')]
    assert len(start) == 1
    chain, k = [], B[start[0]]['next']
    while k:
        chain.append(k)
        k = B[k]['next']
    steps = [k for k in chain if B[k]['opcode'] == 'procedures_call']
    assert len(steps) == 15
    after = steps[PUSH_STEP - 1]
    nxt = B[after]['next']

    added = []
    for root, edits in ((d_speed, ('SPEED', SPEED)), (d_turn, ('out', None)), (d_turn, ('back', None))):
        rid, blocks = clone(DB, root)
        b = blocks[rid]
        if edits[0] == 'SPEED':
            b['inputs']['SPEED'][1][1] = edits[1]
        else:
            b['inputs']['VALUE'][1][1] = OUT_DEG
            b['fields']['UNIT'][0] = 'degrees'
            dir_block = blocks[b['inputs']['DIRECTION'][1]]
            dir_block['fields']['field_flippermotor_custom-icon-direction'][0] = 'counterclockwise' if edits[0] == 'out' else 'clockwise'
        B.update(blocks)
        added.append(rid)
    prev = after
    for rid in added:
        B[prev]['next'], B[rid]['parent'] = rid, prev
        prev = rid
    B[prev]['next'] = nxt
    if nxt:
        B[nxt]['parent'] = prev
    assert 'BA' in json.dumps(B), 'movement pair BA missing'

    first_idx = chain.index(after) + 1
    cid = 'cArm'
    C[cid] = {'blockId': added[1], 'x': 660, 'y': 47 + first_idx * 49, 'width': 240, 'height': 140, 'minimized': False, 'text': ARM_TEXT}
    B[added[1]]['comment'] = cid

    for lst in (manifest['extensions'], project['extensions']):
        if 'flippermotor' not in lst:
            lst.append('flippermotor')
    manifest['name'] = os.path.splitext(os.path.basename(out))[0]
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    manifest['slotIndex'] = 19

    new_inner = io.BytesIO()
    with zipfile.ZipFile(new_inner, 'w', zipfile.ZIP_DEFLATED) as zo:
        for info in inner.infolist():
            zo.writestr(info, json.dumps(project, separators=(',', ':')).encode() if info.filename == 'project.json' else inner.read(info))
    new_outer = io.BytesIO()
    with zipfile.ZipFile(new_outer, 'w', zipfile.ZIP_DEFLATED) as zo:
        for info in outer.infolist():
            data = (new_inner.getvalue() if info.filename == 'scratch.sb3'
                    else json.dumps(manifest, separators=(',', ':')).encode() if info.filename == 'manifest.json'
                    else outer.read(info))
            zo.writestr(info, data)
    tmp = out + '.tmp'
    with open(tmp, 'wb') as f:
        f.write(new_outer.getvalue())
    os.replace(tmp, out)

    # reopen: every original block is unchanged except the push block's and the next block's links
    z = zipfile.ZipFile(out)
    assert z.testzip() is None
    got = json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json'))
    src_p = json.loads(src_project)
    gb, sb = [t for t in got['targets'] if not t['isStage']][0], [t for t in src_p['targets'] if not t['isStage']][0]
    changed = sorted(k for k in sb['blocks'] if sb['blocks'][k] != gb['blocks'][k])
    assert changed == sorted([after, nxt] + ([B[after]['comment']] if False else [])) or changed == sorted([after, nxt]), changed
    assert len(gb['blocks']) - len(sb['blocks']) == sum(1 for k in gb['blocks'] if k not in sb['blocks']) and \
        all(gb['blocks'][k]['opcode'].startswith('flippermotor_') for k in gb['blocks'] if k not in sb['blocks'])
    for cid2, c in sb['comments'].items():
        assert gb['comments'][cid2] == c, cid2
    print(f'wrote {out}: arm blocks (set speed C {SPEED}, turn C counterclockwise {OUT_DEG} degrees, turn C clockwise {OUT_DEG} degrees) after step {PUSH_STEP}; changed original blocks: 2 (links only)')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
