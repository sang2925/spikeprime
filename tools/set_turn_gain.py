"""Copy a Missions 6-7-11 project and change the turn helper's speed gain (the 0.4 in 8 + 0.4 times abs(error)).

Run from the project root:
  python3 -I tools/set_turn_gain.py <source.llsp3> <output.llsp3> <new gain>
Refuses to overwrite; the reopen check proves only the two gain numbers and the speed-math note changed.
"""
import io, json, os, random, string, sys, zipfile


def sprite(project):
    s = [t for t in project['targets'] if not t['isStage']]
    assert len(s) == 1
    return s[0]


def main(src, out, gain):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    outer = zipfile.ZipFile(io.BytesIO(open(src, 'rb').read()))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project, manifest = json.loads(src_project), json.loads(outer.read('manifest.json'))
    B, C = sprite(project)['blocks'], sprite(project)['comments']
    hits = [k for k, b in B.items() if b['opcode'] == 'operator_multiply' and b['inputs'].get('NUM1') == [1, [4, '0.4']]
            and B[b['parent']]['opcode'] == 'operator_add']
    assert len(hits) == 2, hits
    for k in hits:
        B[k]['inputs']['NUM1'] = [1, [4, str(gain)]]
    g = float(gain)
    t = C['cTurn_drive']['text']
    assert t.count('0.4') == 1
    t = t.replace('Speed = 8 + 0.4 times abs(error)', f'Speed = 8 + {gain} times abs(error)  (was 0.4: slower starts slide less)')
    t = t.replace('Example: 90 degrees left to turn: 8 + 36 = 44% (fast).\n45 left: 8 + 18 = 26%. 5 left: 8 + 2 = 10% (slow).',
                  f'Example: 90 degrees left to turn: 8 + {90 * g:g} = {8 + 90 * g:g}%.\n45 left: 8 + {45 * g:g} = {8 + 45 * g:g}%. 5 left: 8 + {5 * g:g} = {8 + 5 * g:g}% (slow).')
    C['cTurn_drive']['text'] = t
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
            zo.writestr(info, new_inner.getvalue() if info.filename == 'scratch.sb3'
                        else json.dumps(manifest, separators=(',', ':')).encode() if info.filename == 'manifest.json' else outer.read(info))
    with open(out + '.tmp', 'wb') as f:
        f.write(new_outer.getvalue())
    os.replace(out + '.tmp', out)
    z = zipfile.ZipFile(out)
    assert z.testzip() is None
    got = sprite(json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json')))
    was = sprite(json.loads(src_project))
    assert sorted(b for b in was['blocks'] if was['blocks'][b] != got['blocks'][b]) == sorted(hits)
    assert [c for c in was['comments'] if was['comments'][c] != got['comments'][c]] == ['cTurn_drive']
    print(f'wrote {out}: turn gain 0.4 -> {gain} (2 blocks), speed-math note updated; nothing else changed')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
