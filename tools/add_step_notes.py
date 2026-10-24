"""Copy a Missions 6-7-11 project, set the leafcutter push (step 7) to a new cm, and label every step with a note.

Each of the 15 mission steps gets a one-line note beside its block (two columns, odd and even steps): step number, what the robot is doing, and (in
brackets) the number to change. Drag the note's corner to make it bigger and read the tips below that line. Steps 1, 6 and 12 already carry the
PART 1/2/3 comments, so their step line goes at the top of those. Nothing else changes: the reopen check below
proves only the push number and the comments differ.

Run from the project root:
  python3 -I tools/add_step_notes.py <source.llsp3> <output.llsp3> [--push=CM]
"""
import io, json, math, os, random, string, sys, zipfile

CM_ARG = 'w@.(AFiXfRyrQ`59;NMC'
PUSH_STEP = 7
PART_COMMENT_STEPS = {1: 'cPart1', 6: 'cPart2', 12: 'cPart3'}


def comment_height(text, width):  # same rule as build_gyro_mission6_7_11.py
    per_line = max(1, width // 9)
    return 19 * sum(max(1, math.ceil(len(line) / per_line)) for line in text.split('\n')) + 80


def notes(n):
    """Step number -> (first line, tips). n = typed-in numbers by step: n[s] = cm (straight) or degrees (turn)."""
    p = n[7]
    return {
        1: (f'STEP 1: leave base ({n[1]})', 'Drives out of base towards the river.'),
        2: (f'STEP 2: aim up table ({n[2]})', 'Turns a little right.'),
        3: (f'STEP 3: past brown ({n[3]})',
            f'Touches the green and black model in step 4? Make {n[3]} smaller (try {int(n[3]) - 2}).\n'
            f'Touches Mission 11 on the way up? Make {n[3]} bigger (try {int(n[3]) + 2}).'),
        4: (f'STEP 4: miss green ({n[4]})',
            'Watch this turn: the robot must NOT touch the green and black model.\n'
            f'Bumps something with its right side? Try {int(n[4]) - 2}. With its left side? Try {int(n[4]) + 2}.'),
        5: (f'STEP 5: to the models ({n[5]})', 'Stops in front of the leafcutter.'),
        6: (f'STEP 6: aim at lever ({n[6]})',
            f'Arrives too far left of the lever? Try {int(n[6]) + 2}. Too far right? Try {int(n[6]) - 2}.'),
        7: (f'STEP 7: PUSH LEVER ({p})',
            'Mission 06 only scores while the leaf fragments stay inside the nest. Push too far or too fast and they fall out: 0 points.\n'
            f'Leaves fall out, or the ant goes past the nest? Make {p} smaller (try {int(p) - 2}).\n'
            f"Ant doesn't reach the nest? First check the robot hits the ant straight on, then make {p} bigger (try {int(p) + 2}).\n"
            'In our video the robot stopped after about 24 cm, but the ant was still 5 to 7 cm short of the nest and the mycelium did not come out. Watch the ant: it has to touch the nest.\n'
            'Leave speed 13 alone: slow keeps the leaves in.'),
        8: (f'STEP 8: back off lever ({n[8]})',
            'Sets where the robot meets Mission 11 in step 10.\n'
            f'Goes past the top of Mission 11 without bumping it? Back up 1 cm more ({int(n[8]) - 1}).\n'
            f'Bumps Mission 11 too low, on its side? Back up 1 cm less ({int(n[8]) + 1}).'),
        9: (f'STEP 9: face Mission 11 ({n[9]})', 'Turns right to face the back of Mission 11.'),
        10: (f'STEP 10: BUMP M11 ({n[10]})',
             f"Doesn't touch Mission 11, so the window stays up? Try {int(n[10]) + 2}.\n"
             f'Hits Mission 11 too hard? Try {int(n[10]) - 2}.'),
        11: (f'STEP 11: back off M11 ({n[11]})', 'Backs up before heading home.'),
        12: (f'STEP 12: turn home ({n[12]})', 'Turns a little left.'),
        13: (f'STEP 13: hurry home ({n[13]})', 'Full speed: nothing to push on the way back.'),
        14: (f'STEP 14: turn to base ({n[14]})', 'Turns right towards the home area.'),
        15: (f'STEP 15: into base ({n[15]})', 'The whole robot must end inside home, or it can cost a precision token.'),
    }


def main(src, out, push):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    src_bytes = open(src, 'rb').read()                        # read everything before any output is opened
    outer = zipfile.ZipFile(io.BytesIO(src_bytes))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project = json.loads(src_project)
    manifest = json.loads(outer.read('manifest.json'))
    sprite = [t for t in project['targets'] if not t['isStage']]
    assert len(sprite) == 1
    B, C = sprite[0]['blocks'], sprite[0]['comments']

    start = [k for k, b in B.items() if b.get('opcode') == 'flipperevents_whenProgramStarts' and b.get('topLevel') and b.get('next')]
    assert len(start) == 1, start
    chain, k = [], B[start[0]]['next']
    while k:
        chain.append(k)
        k = B[k]['next']
    steps = [k for k in chain if B[k]['opcode'] == 'procedures_call']   # the 15 mission steps, in order
    assert len(steps) == 15, len(steps)
    first = chain.index(steps[0])
    assert all(B[k]['opcode'] != 'procedures_call' for k in chain[:first])

    push_block = steps[PUSH_STEP - 1]
    slot = B[push_block]['inputs'][CM_ARG]
    assert B[push_block]['mutation']['proccode'].startswith('straight') and slot[1][1] == '30', slot
    old_push = slot[1][1]
    changed_blocks = []
    if push is not None and push != old_push:
        slot[1][1] = push
        changed_blocks.append(push_block)
        part2 = C['cPart2']
        assert part2['text'].count('forward 30 (push the leafcutter)') == 1
        part2['text'] = part2['text'].replace('forward 30 (push the leafcutter)', f'forward {push} (push the leafcutter; was 30)')

    nums = {i + 1: B[k]['inputs'][CM_ARG][1][1] if CM_ARG in B[k]['inputs'] else next(iter(B[k]['inputs'].values()))[1][1]
            for i, k in enumerate(steps)}
    text = notes(nums)
    width = 240   # two columns, the second ending before the 'define turn' stack at about x 900
    for i, k in enumerate(steps, 1):
        head, tips = text[i]
        if i in PART_COMMENT_STEPS:
            c = C[PART_COMMENT_STEPS[i]]
            assert B[k].get('comment') == PART_COMMENT_STEPS[i]
            c['text'] = f'{head}\n{tips}\n\n{c["text"]}'
            c['height'] = comment_height(c['text'], c['width'])
            continue
        assert not B[k].get('comment'), k
        cid = f'cStep{i}'
        # measured in SPIKE (test-results/spike-open): stack blocks sit 49 units apart, the first one about 63 below the hat
        y = 47 + chain.index(k) * 49
        x = 400 if i % 2 else 660   # blocks are only 49 apart and a note needs about 70 to show its line: alternate columns
        C[cid] = {'blockId': k, 'x': x, 'y': y, 'width': width, 'height': 72, 'minimized': False, 'text': f'{head}\n\n{tips}'}
        B[k]['comment'] = cid
    assert 'BA' in json.dumps(B), 'movement pair BA missing'

    manifest['name'] = os.path.splitext(os.path.basename(out))[0]
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    manifest['slotIndex'] = 19                                  # AGENTS.md: temporary tests use slot 19

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

    # reopen and check: blocks differ only in the push number and the new comment links; old comments only in text/height
    z = zipfile.ZipFile(out)
    assert z.testzip() is None
    got = json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json'))
    src = json.loads(src_project)
    gb, sb = [t for t in got['targets'] if not t['isStage']][0], [t for t in src['targets'] if not t['isStage']][0]
    for k, b in sb['blocks'].items():
        g = dict(gb['blocks'][k])
        if k in changed_blocks:
            g['inputs'] = dict(g['inputs'], **{CM_ARG: b['inputs'][CM_ARG]})
        if g.get('comment', '').startswith('cStep'):
            del g['comment']
        assert g == b, k
    assert set(gb['blocks']) == set(sb['blocks'])
    new = sorted(set(gb['comments']) - set(sb['comments']))
    assert len(new) == 12, new
    for cid, c in sb['comments'].items():
        assert {**gb['comments'][cid], 'text': c['text'], 'height': c['height']} == c, cid
    print(f'wrote {out}: push {old_push} -> {nums[PUSH_STEP]}, {len(new)} step notes added, step lines added to PART 1/2/3')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--push=')]
    push = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--push=')), None)
    if len(args) != 2 or (push is not None and not push.lstrip('-').isdigit()):
        sys.exit(__doc__)
    main(args[0], args[1], push)
