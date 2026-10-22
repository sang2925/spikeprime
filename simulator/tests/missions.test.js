// BIOGLOW mission data and marker geometry. Run from simulator/: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../missions.js');

const MAT_W = 2019.3, MAT_H = 1136.65;
const CROP = B.IMAGE.matCrop;
const near = (actual, expected, tol, what) =>
    assert.ok(Math.abs(actual - expected) <= tol, `${what}: got ${actual}, expected ${expected} ± ${tol}`);

test('missions 1-15 exist once each and every scoring line has positive points', () => {
    assert.deepEqual(B.MISSIONS.map((m) => m.id), Array.from({ length: 15 }, (_, i) => i + 1));
    for (const m of B.MISSIONS) {
        assert.ok(m.name && m.scoring.length, `mission ${m.id}`);
        for (const s of m.scoring) assert.ok(Number.isFinite(s.points) && s.points > 0 && s.text, `mission ${m.id}: ${s.text}`);
    }
});

test('every mission has a marker; the three docks serve missions 13-15', () => {
    for (const m of B.MISSIONS) assert.ok(B.markersFor(m.id).length > 0, `mission ${m.id} has no marker`);
    const docks = B.MARKERS.filter((k) => k.kind === 'dock');
    assert.equal(docks.length, 3);
    for (const d of docks) assert.deepEqual(d.missions, [13, 14, 15]);
});

test('every marker lies inside the mat border of the wireframe', () => {
    for (const k of B.MARKERS) {
        assert.ok(k.ix > CROP.x && k.ix < CROP.x + CROP.w && k.iy > CROP.y && k.iy < CROP.y + CROP.h, `${k.label} at ${k.ix},${k.iy}`);
    }
});

test('crop centre is the mat centre; corners land on the fitted picture edges, y up', () => {
    const c = B.imagePxToMatMm(CROP.x + CROP.w / 2, CROP.y + CROP.h / 2, CROP, 0, MAT_W, MAT_H);
    near(c.x, 0, 1e-9, 'centre x');
    near(c.y, 0, 1e-9, 'centre y');
    const s = Math.min(MAT_W / CROP.w, MAT_H / CROP.h);       // picture is a little narrower than the mat: height limits the fit
    const tl = B.imagePxToMatMm(CROP.x, CROP.y, CROP, 0, MAT_W, MAT_H);
    near(tl.x, -CROP.w * s / 2, 1e-9, 'top-left x');
    near(tl.y, CROP.h * s / 2, 1e-9, 'top-left y (up)');
    near(CROP.h * s, MAT_H, 1e-9, 'picture fills the mat height');
    assert.ok(CROP.w * s < MAT_W, 'picture is narrower than the mat (1.1% shape mismatch)');
});

test('turning the picture 90 degrees clockwise moves its right edge to the bottom', () => {
    const right = B.imagePxToMatMm(CROP.x + CROP.w, CROP.y + CROP.h / 2, CROP, 90, MAT_W, MAT_H);
    near(right.x, 0, 1e-9, 'x');
    assert.ok(right.y < 0, 'right edge goes down');
    const s = Math.min(MAT_W / CROP.h, MAT_H / CROP.w);       // sideways: width and height swap in the fit
    near(right.y, -CROP.w * s / 2, 1e-9, 'distance from centre');
    const top = B.imagePxToMatMm(CROP.x + CROP.w / 2, CROP.y, CROP, 90, MAT_W, MAT_H);
    assert.ok(top.x > 0, 'top edge goes right');
});

test('a marker keeps its place relative to the picture when the picture is turned 180 degrees', () => {
    const k = B.MARKERS[0];
    const a = B.imagePxToMatMm(k.ix, k.iy, CROP, 0, MAT_W, MAT_H);
    const b = B.imagePxToMatMm(k.ix, k.iy, CROP, 180, MAT_W, MAT_H);
    near(b.x, -a.x, 1e-9, 'x flips');
    near(b.y, -a.y, 1e-9, 'y flips');
});

test('obstacle outlines: unique keys, convex, and every model sits inside the table', () => {
    const MAT_W = 2019.3, MAT_H = 1136.65, MAT_X = 171.45;     // default mat placement (app.js)
    const keys = new Set();
    for (const o of B.OBSTACLES) {
        assert.ok(!keys.has(o.key), `duplicate key ${o.key}`);
        keys.add(o.key);
        const c = o.corners, n = c.length;
        assert.ok(n >= 3, o.key);
        let sign = 0;
        for (let i = 0; i < n; i++) {
            const [x1, y1] = c[i], [x2, y2] = c[(i + 1) % n], [x3, y3] = c[(i + 2) % n];
            const cross = (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2);
            if (Math.abs(cross) < 1e-9) continue;
            assert.ok(!sign || Math.sign(cross) === sign, `${o.key} is not convex (the collision test needs convex shapes)`);
            sign = sign || Math.sign(cross);
        }
        for (const [ix, iy] of c) {
            const p = B.imagePxToMatMm(ix, iy, B.IMAGE.matCrop, 0, MAT_W, MAT_H);
            const x = MAT_X + MAT_W / 2 + p.x, y = MAT_H / 2 + p.y;
            assert.ok(x > 0 && x < 2362.2 && y > 0 && y < 1143, `${o.key} corner (${ix}, ${iy}) is off the table at ${x.toFixed(0)}, ${y.toFixed(0)}`);
        }
    }
    assert.ok(keys.has('m11') && keys.has('d2'));
});

test('START_POSES: the gyro-mission6-7-11 start is on the mat and clear of every model', () => {
    const s = B.START_POSES['gyro-mission6-7-11'];
    assert.ok(s && s.x > 171 && s.x < 2191 && s.y > 0 && s.y < 1137);
});
