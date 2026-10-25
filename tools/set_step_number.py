"""Copy a Missions 6-7-11 project and change ONE step's typed-in number, plus that step's note.

Run from the project root:
  python3 -I tools/set_step_number.py <source.llsp3> <output.llsp3> <step 1-15> <new number> "<new note text>"
Refuses to overwrite; the reopen check proves only that block's number and that note changed.
"""
import io, json, os, random, string, sys, zipfile

CM_ARG = 'w@.(AFiXfRyrQ`59;NMC'


def sprite(project):
    s = [t for t in project['targets'] if not t['isStage']]
    assert len(s) == 1
    return s[0]


def steps(B):
    start = [k for k, b in B.items() if b.get('opcode') == 'flipperevents_whenProgramStarts' and b.get('topLevel') and b.get('next')]
    assert len(start) == 1
    out, k = [], B[start[0]]['next']
    while k:
        if B[k]['opcode'] == 'procedures_call':
            out.append(k)
        k = B[k]['next']
    assert len(out) == 15
    return out


def main(src, out, step, value, note):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    src_bytes = open(src, 'rb').read()
    outer = zipfile.ZipFile(io.BytesIO(src_bytes))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project, manifest = json.loads(src_project), json.loads(outer.read('manifest.json'))
    T = sprite(project)
    B, C = T['blocks'], T['comments']
    k = steps(B)[step - 1]
    arg = CM_ARG if CM_ARG in B[k]['inputs'] else list(B[k]['inputs'])[0]
    old = B[k]['inputs'][arg][1][1]
    B[k]['inputs'][arg] = [1, [10, str(value)]]
    cid = B[k].get('comment')
    assert cid in C, 'step has no note'
    C[cid]['text'] = note
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

    # reopen: only that block and that note differ
    z = zipfile.ZipFile(out)
    assert z.testzip() is None
    got = sprite(json.loads(zipfile.ZipFile(io.BytesIO(z.read('scratch.sb3'))).read('project.json')))
    was = sprite(json.loads(src_project))
    assert [b for b in was['blocks'] if was['blocks'][b] != got['blocks'][b]] == [k]
    assert [c for c in was['comments'] if was['comments'][c] != got['comments'][c]] == [cid]
    assert 'BA' in json.dumps(got['blocks'])
    print(f'wrote {out}: step {step} {old} -> {value}; note {cid} rewritten; nothing else changed')


if __name__ == '__main__':
    if len(sys.argv) != 6:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5])
