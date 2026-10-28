"""Copy a Missions 6-7-11 program and make every `turn N` step call `Gyro Turn safe N ()` instead.

The Gyro Turn safe My Block (and its note) is copied from Team Template.llsp3 (read only). The program's own `turn`
My Block stays in the file, unused, so nothing else moves. Numbers, straights, step notes: unchanged.
Run from the project root:
  python3 -I tools/use_gyro_turn_safe.py <source.llsp3> <output.llsp3>
"""
import io, json, os, random, string, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_turn_test import read, procedure, copy_procedure

TEMPLATE = 'Team Template.llsp3'
NAME = 'Gyro Turn safe %s %s'


def main(src_path, out):
    if os.path.exists(out):
        sys.exit(f'{out} already exists. Move it away first (never overwritten without approval).')
    sources = {p: open(p, 'rb').read() for p in (src_path, TEMPLATE)}
    _, outer, inner, project, t = read(src_path)
    _, _, _, _, tmpl = read(TEMPLATE)
    manifest = json.loads(outer.read('manifest.json'))
    B, C = t['blocks'], t['comments']
    before = json.loads(json.dumps(B))

    new_def = copy_procedure(tmpl, procedure(tmpl, NAME), t, {}, (3700, 0))
    proto = B[B[new_def]['inputs']['custom_block'][1]]
    deg_arg, acc_arg = json.loads(proto['mutation']['argumentids'])
    calls = [k for k, b in B.items() if b['opcode'] == 'procedures_call' and b['mutation']['proccode'] == 'turn %s']
    assert len(calls) == 6, len(calls)
    for k in calls:
        value = list(B[k]['inputs'].values())[0]
        B[k]['inputs'] = {deg_arg: value, acc_arg: [1, [10, '']]}
        B[k]['mutation'] = {'tagName': 'mutation', 'children': [], 'proccode': NAME,
                            'argumentids': json.dumps([deg_arg, acc_arg]), 'warp': 'false'}

    changed = sorted(k for k in before if before[k] != B[k])
    assert changed == sorted(calls), changed
    assert '"BA"' in json.dumps(B)
    manifest['name'] = os.path.splitext(os.path.basename(out))[0]
    manifest['id'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
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
    with open(out + '.tmp', 'wb') as f:
        f.write(no.getvalue())
    os.replace(out + '.tmp', out)
    assert zipfile.ZipFile(out).testzip() is None
    for p, data in sources.items():
        assert open(p, 'rb').read() == data, f'{p} changed!'
    print(f'wrote {out}: 6 turn steps now call Gyro Turn safe; nothing else changed')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
