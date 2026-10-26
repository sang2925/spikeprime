"""Copy a project with its notes (comments) rewritten or removed. Blocks are never changed.

Run from the project root:
  python3 -I tools/tidy_notes.py <source.llsp3> <output.llsp3> <spec.json>
spec.json: {"text": {"commentId": "new text", ...}, "delete": ["commentId", ...], "place": {"commentId": [x, y, width], ...}}
Every comment not named keeps its text. Heights follow the project rule (19 px per wrapped line + 80).
Refuses to overwrite; the reopen check proves the blocks are identical apart from removed comment links.
"""
import io, json, math, os, sys, zipfile


def comment_height(text, width):
    per_line = max(1, width // 9)
    return 19 * sum(max(1, math.ceil(len(line) / per_line)) for line in text.split('\n')) + 80


def sprite(project):
    s = [t for t in project['targets'] if not t['isStage']]
    assert len(s) == 1
    return s[0]


def main(src, out, spec_path):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    spec = json.load(open(spec_path))
    outer = zipfile.ZipFile(io.BytesIO(open(src, 'rb').read()))
    inner = zipfile.ZipFile(io.BytesIO(outer.read('scratch.sb3')))
    src_project = inner.read('project.json')
    project, manifest = json.loads(src_project), json.loads(outer.read('manifest.json'))
    t = sprite(project)
    B, C = t['blocks'], t['comments']
    for cid in spec.get('delete', []):
        c = C.pop(cid)
        if c['blockId']:
            assert B[c['blockId']].get('comment') == cid
            del B[c['blockId']]['comment']
    for cid, text in spec.get('text', {}).items():
        c = C[cid]
        bottom = c['y'] + c['height']
        c['text'] = text
        c['height'] = comment_height(text, c['width'])
        c['y'] = bottom - c['height'] if c['y'] < 0 else c['y']
    for cid, (x, y, w) in spec.get('place', {}).items():
        C[cid].update(x=x, y=y, width=w, height=comment_height(C[cid]['text'], w))
    manifest['name'] = os.path.splitext(os.path.basename(out))[0]
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
    strip = lambda b: {k: v for k, v in b.items() if k != 'comment'}
    assert set(was['blocks']) == set(got['blocks'])
    assert all(strip(was['blocks'][k]) == strip(got['blocks'][k]) for k in was['blocks']), 'a block changed'
    print(f'wrote {out}: {len(was["comments"])} notes -> {len(got["comments"])}; blocks unchanged')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
