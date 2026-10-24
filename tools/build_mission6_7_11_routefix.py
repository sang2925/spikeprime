"""Build a route-fix copy of gyro-mission6-7-11.llsp3 (read-only source): gyro-mission6-7-11_<variant>.llsp3.

Only three typed-in numbers, four comment texts and the comment positions change (the reopen check below proves it;
the JSON is re-serialised and the ZIPs rebuilt, so the bytes differ). Variants (docs/route-from-video.md):
  routefix:        straight 47 -> 35, 32 -> 29, -6 -> -12. For a robot whose turns do not slide (the 15 cm slide in
                   the video came only from catching the D2 model).
  routefix_creep:  straight 47 -> 40, 32 -> 28 (back 6 stays). For a robot that slides back a few cm whenever a turn
                   starts fast (about 6 cm for 'turn 85' in the video).
The turn-test creep measurement on the mat says which one to use.

Run from the project root: python3 tools/build_mission6_7_11_routefix.py [routefix|routefix_creep]
"""
import io, json, math, os, random, string, sys, zipfile

SRC = 'archived-llsp3/gyro-mission6-7-11.llsp3'   # archived 2026-10-24, still the source
BLOCKS = [('@jw(EldY.h)p@c]2x9Lb', '47'), ('KH=yUg6I[}(Iw!xw@Gzf', '32'), ('++f.b7dpido-JQ{IOS13', '-6')]   # (block id in SRC, old cm)
NEW_CM = {'routefix': ('35', '29', '-12'), 'routefix_creep': ('40', '28', '-6')}
CM_ARG = 'w@.(AFiXfRyrQ`59;NMC'

TEXTS = {'routefix': {
    'cMission': ('NEW IN THIS VERSION: safety timers. If Mission 11 stops the robot, it still backs up and goes home. Same route as before. Read the notes on \'turn\' and \'straight\'.',
                 'NEW IN THIS VERSION: safety timers. If Mission 11 stops the robot, it still backs up and goes home. Read the notes on \'turn\' and \'straight\'.\n\n'
                 'ROUTE FIX: 3 numbers changed (47 is now 35, 32 is now 29, back 6 is now back 12), so the robot no longer has to slide off the green and black model. See PART 1 and PART 2.'),
    'cPart1': ('Drive out 35 cm, turn a little right (20), drive 47 cm up past the brown model.\nThen turn right 67 and drive 32 cm over to the models at the top.',
               'Drive out 35 cm, turn a little right (20), drive 35 cm up past the brown model.\nThen turn right 67 and drive 29 cm over to the models at the top.\n\n'
               'NEW: 35 and 29 (they were 47 and 32).\n'
               'In our video the robot drove 47 cm, and its front corner caught the green and black model during \'turn 67\'. It slid back about 15 cm before it could turn. The old route only worked because of that slide!\n'
               'Now it stops 12 cm earlier, turns in free space, and ends up where the slide used to put it.\n'
               '  Touches the green and black model in turn 67? Make 35 smaller (try 33).\n'
               '  Touches Mission 11 on the way up? Make 35 bigger (try 37).'),
    'cPart2': ('forward 30 (push the leafcutter), back 6, turn right 85, forward 15 (bump Mission 11 so the window drops), back 18.',
               'forward 30 (push the leafcutter), back 12, turn right 85, forward 15 (bump the back of Mission 11 so the window drops), back 18.\n'
               'NEW: back 12 (it was 6). In the video the robot also slid about 6 cm during \'turn 85\'. That slide lined it up with Mission 11. Backing up 12 does the same on purpose.\n'
               '  Goes past the top of Mission 11 without bumping it? Try back 14.\n'
               '  Bumps Mission 11 too low, on its side? Try back 10.'),
}, 'routefix_creep': {
    'cMission': ('NEW IN THIS VERSION: safety timers. If Mission 11 stops the robot, it still backs up and goes home. Same route as before. Read the notes on \'turn\' and \'straight\'.',
                 'NEW IN THIS VERSION: safety timers. If Mission 11 stops the robot, it still backs up and goes home. Read the notes on \'turn\' and \'straight\'.\n\n'
                 'ROUTE FIX, SLIDE VERSION: 2 numbers changed (47 is now 40, 32 is now 28). This version plans for our robot sliding back a little when a fast turn starts. See PART 1 and PART 2.'),
    'cPart1': ('Drive out 35 cm, turn a little right (20), drive 47 cm up past the brown model.\nThen turn right 67 and drive 32 cm over to the models at the top.',
               'Drive out 35 cm, turn a little right (20), drive 40 cm up past the brown model.\nThen turn right 67 and drive 28 cm over to the models at the top.\n\n'
               'NEW: 40 and 28 (they were 47 and 32).\n'
               'In our video, turns that start fast made the robot slide back a few cm, like tyres spinning on ice. \'turn 67\' slides about 4 cm, and much more when the robot catches the green and black model.\n'
               'This version stops 7 cm earlier, so the turn misses that model, and it plans for the 4 cm slide.\n'
               '  Touches the green and black model in turn 67? Make 40 smaller (try 38).\n'
               '  Touches Mission 11 on the way up? Make 40 bigger (try 42).'),
    'cPart2': ('forward 30 (push the leafcutter), back 6, turn right 85, forward 15 (bump Mission 11 so the window drops), back 18.',
               'forward 30 (push the leafcutter), back 6, turn right 85, forward 15 (bump the back of Mission 11 so the window drops), back 18.\n'
               'Back 6 stays the same: \'turn 85\' starts fast, so the robot slides back about 6 cm by itself. 6 + 6 = 12 cm: the right spot for Mission 11.\n'
               '  Goes past the top of Mission 11 without bumping it? Try back 7.\n'
               '  Bumps Mission 11 too low, on its side? Try back 5.'),
}}


def comment_height(text, width):  # same rule as build_gyro_mission6_7_11.py
    per_line = max(1, width // 9)
    return 19 * sum(max(1, math.ceil(len(line) / per_line)) for line in text.split('\n')) + 80


def main(variant):
    OUT, TEXT = f'gyro-mission6-7-11_{variant}.llsp3', TEXTS[variant]
    NUMBERS = [(bid, old, new) for (bid, old), new in zip(BLOCKS, NEW_CM[variant]) if new != old]   # numbers kept as they were are left alone
    if os.path.exists(OUT):
        sys.exit(f'{OUT} already exists. Move it away first (never overwritten without approval).')
    src_bytes = open(SRC, 'rb').read()                       # read everything before any output is opened
    outer = zipfile.ZipFile(io.BytesIO(src_bytes))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project = json.loads(src_project)
    manifest = json.loads(outer.read('manifest.json'))
    sprite = [t for t in project['targets'] if not t['isStage']]
    assert len(sprite) == 1
    B, C = sprite[0]['blocks'], sprite[0]['comments']

    for block_id, old, new in NUMBERS:
        slot = B[block_id]['inputs'][CM_ARG]
        assert B[block_id]['opcode'] == 'procedures_call' and slot[1][1] == old, (block_id, slot)
        slot[1][1] = new

    for cid, (old, new) in TEXT.items():
        assert C[cid]['text'].count(old) == 1, cid
        C[cid]['text'] = C[cid]['text'].replace(old, new)
        C[cid]['height'] = comment_height(C[cid]['text'], C[cid]['width'])
    # PART 1, 2, 3 are stacked: move each one below the one above it; MISSION grows upward (nothing above it)
    old_bottom = C['cMission']['y'] + C['cMission']['height']
    C['cMission']['y'] = old_bottom - C['cMission']['height']
    C['cPart2']['y'] = max(C['cPart2']['y'], C['cPart1']['y'] + C['cPart1']['height'] + 20)
    C['cPart3']['y'] = max(C['cPart3']['y'], C['cPart2']['y'] + C['cPart2']['height'] + 20)
    assert 'BA' in json.dumps(B), 'movement pair BA missing'

    manifest['name'] = f'gyro-mission6-7-11_{variant}'
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
    manifest['slotIndex'] = 19                                  # AGENTS.md: temporary tests use slot 19

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

    # reopen and check: only the three numbers and four comment texts differ from the source
    z = zipfile.ZipFile(OUT)
    assert z.testzip() is None
    got = json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json'))
    src = json.loads(src_project)
    gb, sb = [t for t in got['targets'] if not t['isStage']][0], [t for t in src['targets'] if not t['isStage']][0]
    changed = [k for k in sb['blocks'] if sb['blocks'][k] != gb['blocks'][k]]
    assert sorted(changed) == sorted(n[0] for n in NUMBERS), changed
    assert sorted(k for k in sb['comments'] if sb['comments'][k]['text'] != gb['comments'][k]['text']) == sorted(TEXT)
    print(f'wrote {OUT}: {len(gb["blocks"])} blocks, {len(gb["comments"])} comments, changed blocks {len(changed)}')


if __name__ == '__main__':
    v = sys.argv[1] if len(sys.argv) > 1 else 'routefix'
    if v not in NEW_CM:
        sys.exit(f'Unknown variant {v}. Use one of: {", ".join(NEW_CM)}')
    main(v)
