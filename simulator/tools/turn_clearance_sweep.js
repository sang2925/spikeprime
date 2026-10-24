// For each in-place turn of a program: does the robot body reach a model outline while it spins, and which part of
// the body gets there first? Runs the program many times from slightly different start poses and turn overshoots,
// because the real start and the real overshoot are only known to about 2 cm and a few degrees.
// The outlines are estimates read off the wireframe (simulator/README.md, "Table Walls and Model Outlines"). The robot
// is not stopped by them here; every step is only measured, so later turns are still checked.
// Usage, from simulator/:  node tools/turn_clearance_sweep.js <project.llsp3> [plain-move mode: app-guess|commanded]
const fs = require('fs');
const path = require('path');
const P = require('../physics.js');
const L = require('../llsp3.js');
const W = require('../wordblocks.js');
const M = require('../missions.js');

const MAT_W = 2019.3, MAT_H = 1136.65, MAT_X = 171.45, MAT_Y = 0;   // app.js defaults: mat on the bottom wall, centred
const BODY = { lengthMm: 184.15, widthMm: 168.275 };                 // team measured, body centred on the wheels
const START = M.START_POSES['gyro-mission6-7-11'];                    // measured from the video, about +-2 cm
const toWorld = ([ix, iy]) => {
    const p = M.imagePxToMatMm(ix, iy, M.IMAGE.matCrop, 0, MAT_W, MAT_H);
    return [MAT_X + MAT_W / 2 + p.x, MAT_Y + MAT_H / 2 + p.y];
};
const outlines = M.OBSTACLES.map((o) => ({ name: o.name.replace(/ \(.*\)$/, ''), poly: o.corners.map(toWorld) }));

async function main() {
    const [file, mode = 'app-guess'] = process.argv.slice(2);
    const { target } = await L.readLlsp3(fs.readFileSync(path.resolve(file)));
    const program = W.compileProgram(target);
    const runs = [];
    for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) for (const dh of [-2, -1, 0, 1, 2]) for (const over of [0, 1, 3, 5]) {
        const sim = P.createSim(P.DEFAULT_PROFILE, { x: START.x + dx, y: START.y + dy, headingDeg: START.heading + dh });
        let block = '';
        const runner = W.createRunner(program, { plainMoveMode: mode, turnOvershootDeg: over, onTopBlock: (t, i) => { block = `${i}: ${program.stacks[t].items[i].label}`; } });
        P.startProgram(sim, runner);
        const perTurn = {};   // block -> { outline -> { touch, gap, part } }
        for (let n = 0; sim.status === 'running' && n < 1e6; n++) {
            P.stepSim(sim);
            if (!sim.spin) continue;                                     // only while the robot spins in place
            const turn = perTurn[block] || (perTurn[block] = {});
            for (const o of outlines) {
                const probe = { body: BODY, obstacles: [o], bounds: null, pose: sim.pose };
                const touch = P.touching(probe) !== '';
                const near = P.nearestThing(probe);
                const rec = turn[o.name] || (turn[o.name] = { touch: false, gap: Infinity, part: '' });
                if (touch) rec.touch = true;
                if (!touch && near.mm < rec.gap) { rec.gap = near.mm; rec.part = near.part; }
                if (touch && !rec.touchPart) rec.touchPart = near.part;   // the part nearest the outline as it first crosses
            }
        }
        runs.push({ dx, dy, dh, over, perTurn, status: sim.status });
    }
    // report: for every turn block, the outlines that come within 30 mm in any run
    const blocks = [...new Set(runs.flatMap((r) => Object.keys(r.perTurn)))];
    console.log(`${path.basename(file)}, plain moves "${mode}", ${runs.length} runs: start x/y +-20 mm, heading +-2 deg, turn overshoot 0/1/3/5 deg`);
    for (const b of blocks) {
        const names = new Set();
        runs.forEach((r) => Object.entries(r.perTurn[b] || {}).forEach(([n, rec]) => { if (rec.touch || rec.gap < 30) names.add(n); }));
        if (!names.size) { console.log(`  ${b}: nothing within 30 mm`); continue; }
        for (const n of names) {
            const recs = runs.map((r) => (r.perTurn[b] || {})[n]).filter(Boolean);
            const touching = recs.filter((x) => x.touch);
            const gaps = recs.filter((x) => !x.touch).map((x) => x.gap).sort((a, c) => a - c);
            const parts = {};
            recs.forEach((x) => { const part = x.touch ? x.touchPart : x.part; parts[part] = (parts[part] || 0) + 1; });
            console.log(`  ${b}: ${n}: touches in ${touching.length} of ${recs.length} runs;` +
                (gaps.length ? ` gap when clear ${gaps[0].toFixed(0)}-${gaps[gaps.length - 1].toFixed(0)} mm (median ${gaps[gaps.length >> 1].toFixed(0)});` : '') +
                ` nearest part: ${Object.entries(parts).sort((a, c) => c[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
        }
    }
    // the same question per overshoot, for the turn-67 block only (the reported creep)
    const t67 = blocks.find((b) => / turn 67$/.test(b));
    if (t67) {
        for (const over of [0, 1, 3, 5]) {
            const rs = runs.filter((r) => r.over === over);
            const touch = rs.filter((r) => Object.values(r.perTurn[t67] || {}).some((x) => x.touch));
            console.log(`  ${t67}, overshoot ${over} deg: body touches an outline in ${touch.length} of ${rs.length} start poses`);
        }
    }
}

main();
