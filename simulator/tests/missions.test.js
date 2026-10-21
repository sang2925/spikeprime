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
