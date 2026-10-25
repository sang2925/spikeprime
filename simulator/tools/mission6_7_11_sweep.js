// Missions 6, 7 and 11 route check: runs a program many times from slightly different start poses and turn
// overshoots, the way the real robot meets the models (Push on, the front pusher, every model outline except the
// 06·07 body; the robot pushes that model's lever on purpose, and the lever's real stop point is the m0607stop outline).
// Per overshoot it counts: D2 touched, push stalled on the leafcutter stop, Mission 11 bumped, robot completely home,
// and any other model touched. "Touched" = the body or pusher came within 1 mm (Push leaves it a hair clear).
// Push = the first forward 'straight ... at speed 13', bump = the second; touching the stop during the push, Mission 11
// during the bump, and either one during the block right after (backing away) is expected. Anything else is not.
// Home: the whole body box inside the right home arc (radius about 485 mm around the mat's bottom-right corner,
// measured on the wireframe; the strip between the mat and the right wall counts too). Estimates, not robot tests.
// --offset=N: the body box centre sits N mm ahead of the wheel midpoint (minus = behind; not measured yet, default 0).
// Start poses are box-centre poses (that is what the video measured), so the wheels start N mm behind them.
// --creep=N: each in-place turn starts with an N mm slide straight back (hypothesis from the video; default 0).
// Usage, from simulator/:  node tools/mission6_7_11_sweep.js [--offset=N] [--creep=N] <project.llsp3> [more.llsp3 ...]
const fs = require('fs');
const path = require('path');
const P = require('../physics.js');
const L = require('../llsp3.js');
const W = require('../wordblocks.js');
const M = require('../missions.js');

const MAT_W = 2019.3, MAT_H = 1136.65, MAT_X = 171.45, MAT_Y = 0;   // app.js defaults: mat on the bottom wall, centred
const TABLE = { minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 };
const BODY = { lengthMm: 184.15, widthMm: 168.275, parts: [{ name: 'front pusher', front: 134, back: 92, left: 34, right: -9 }] };
const HOME = { x: MAT_X + MAT_W, y: MAT_Y, r: 485 };
const START = M.START_POSES['gyro-mission6-7-11'];                    // from the video, about ±2 cm
const toWorld = ([ix, iy]) => {
    const p = M.imagePxToMatMm(ix, iy, M.IMAGE.matCrop, 0, MAT_W, MAT_H);
    return [MAT_X + MAT_W / 2 + p.x, MAT_Y + MAT_H / 2 + p.y];
};
const OUTLINES = M.OBSTACLES.filter((o) => o.key !== 'm0607' && o.key !== 'm01line' && o.key !== 'm01map').map((o) => ({ name: o.key, poly: o.corners.map(toWorld) }));
const BOXES = Object.fromEntries(OUTLINES.map((o) => [o.name, {
    minX: Math.min(...o.poly.map((p) => p[0])), maxX: Math.max(...o.poly.map((p) => p[0])),
    minY: Math.min(...o.poly.map((p) => p[1])), maxY: Math.max(...o.poly.map((p) => p[1])) }]));
const REACH = Math.hypot(BODY.lengthMm / 2, BODY.widthMm / 2) + 160;   // furthest any part of the robot gets from its box centre, plus the pusher
const isHome = (pose, offsetMm) => P.bodyPolys(pose, { lengthMm: BODY.lengthMm, widthMm: BODY.widthMm, offsetMm })[0].poly
    .every(([x, y]) => Math.hypot(Math.min(x, HOME.x) - HOME.x, y - HOME.y) <= HOME.r);

const HOOK = { name: 'right-front hook', front: 250, back: 100, left: -76, right: -91 };   // --hook: a 15 mm bar on the right side, tip 25 cm ahead of the wheels (the Mission 07 handle is about 24 cm ahead, 9 cm right)
let withHook = false, swingMode = false;
const HANDLE = ((p) => toWorld(p))([2528, 834]);   // Mission 07 red handle, estimate from the Field Setup Guide photo

function runOnce(program, startBox, overshoot, offsetMm = 0, creepMm = 0) {
    const h = startBox.headingDeg * Math.PI / 180;
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: startBox.x - offsetMm * Math.cos(h), y: startBox.y - offsetMm * Math.sin(h), headingDeg: startBox.headingDeg });
    P.setObstacles(sim, OUTLINES, { ...BODY, parts: withHook ? [...BODY.parts, HOOK] : BODY.parts, offsetMm }, TABLE);
    P.setContactMode(sim, 'push');
    const labels = [];
    let swing = null;   // --swing: a hook on a port C arm, stowed inside the body for the whole route, swung out once at the end of the push
    const runner = W.createRunner(program, { plainMoveMode: 'app-guess', turnOvershootDeg: overshoot, turnCreepMm: creepMm, onTopBlock: (t, i) => {
        labels.push(program.stacks[t].items[i].label);
        if (swingMode && !swing && labels.slice(0, -1).filter((l) => /^straight \d+(\.\d+)? cm at speed 13$/.test(l)).length === 1) {
            const polys = P.bodyPolys(sim.pose, { ...sim.body, parts: [...BODY.parts, HOOK] }).filter((r) => r.name === HOOK.name);
            const hit = sim.obstacles.filter((o) => polys.some((r) => P.polygonGap(r.poly, o.poly) < 1)).map((o) => o.name);
            const hp = HANDLE, h = sim.pose.headingDeg * Math.PI / 180;
            const dx = hp[0] - sim.pose.x, dy = hp[1] - sim.pose.y, fwd = dx * Math.cos(h) + dy * Math.sin(h), side = -dx * Math.sin(h) + dy * Math.cos(h);
            swing = { hit, fwd, side };
        }
    } });
    P.startProgram(sim, runner);
    const touches = [];   // { block, name } in order
    const minGap = {};
    for (let n = 0; sim.status === 'running' && n < 1e6; n++) {
        P.stepSim(sim);
        if (n % 2) continue;
        const polys = P.bodyPolys(sim.pose, sim.body);
        const c = polys[0].poly.reduce((t, q) => [t[0] + q[0] / 4, t[1] + q[1] / 4], [0, 0]);
        for (const o of sim.obstacles) {
            const b = BOXES[o.name];   // skip models too far away to touch or to beat the closest gap so far
            const far = Math.hypot(Math.max(b.minX - c[0], 0, c[0] - b.maxX), Math.max(b.minY - c[1], 0, c[1] - b.maxY)) - REACH;
            if (far > 1 && far > (minGap[o.name] ?? Infinity)) continue;
            const gap = Math.min(...polys.map((r) => P.polygonGap(r.poly, o.poly)));
            if (!(minGap[o.name] <= gap)) minGap[o.name] = gap;
            const block = labels.length - 1;
            if (gap < 1 && !touches.some((t) => t.block === block && t.name === o.name)) touches.push({ block, name: o.name });
        }
    }
    const fwd13 = labels.map((l, i) => [l, i]).filter(([l]) => /^straight \d+(\.\d+)? cm at speed 13$/.test(l)).map(([, i]) => i);
    const [push, bump] = fwd13;
    const expected = (t) => (t.name === 'm0607stop' && (t.block === push || t.block === push + 1))
        || (t.name === 'm11' && (t.block === bump || t.block === bump + 1));
    return {
        status: sim.status,
        stall: touches.some((t) => t.name === 'm0607stop' && t.block === push),
        bumped: touches.some((t) => t.name === 'm11' && t.block === bump),
        d2: touches.some((t) => t.name === 'd2'),
        other: touches.filter((t) => !expected(t)).map((t) => `${labels[t.block]}: ${t.name}`),
        home: sim.status === 'stopped' && isHome(sim.pose, offsetMm),
        minD2: minGap.d2,
        swing,
    };
}

async function main() {
    const args = process.argv.slice(2);
    const opt = (name) => parseFloat((args.find((a) => a.startsWith(`--${name}=`)) || `--${name}=0`).split('=')[1]);
    const offsetMm = opt('offset'), creepMm = opt('creep');
    const hookArg = args.find((x) => x.startsWith('--hook'));   // --hook or --hook=<tip mm ahead of the wheels>
    if (args.includes('--sidemotor')) BODY.parts = [...BODY.parts, { name: 'side motor', front: 126, back: 70, left: -84, right: -132 }];   // a medium motor stuck on the right side, front-right: 5.6 x 4.8 cm outside the body
    if (args.includes('--finger')) BODY.parts = [...BODY.parts, { name: 'stowed finger', front: 12, back: 4, left: -96, right: -104 }];   // the arm's finger hanging beside the right side while the arm is stowed (8 mm square, 1.2-2 cm outside the body)
    if (args.includes('--fingerfront')) BODY.parts = [...BODY.parts, { name: 'finger stowed across the front', front: 133, back: 125, left: 64, right: 56 }];   // arm stowed pointing left across the front, finger hanging 3.3 cm past the body, inside the body width
    if (args.includes('--shelf')) BODY.parts = [...BODY.parts, { name: 'top shelf', front: 155, back: 92, left: -42, right: -78 }];   // the top-front shelf for the arm: 6 cm past the body front, 3.6 cm wide, high up (the outlines are flat, so height is ignored)
    swingMode = args.includes('--swing');
    const startArg = args.find((x) => x.startsWith('--start='));   // --start=x,y in mm (box centre), overrides the video start
    if (startArg) { const [sx, sy] = startArg.split('=')[1].split(',').map(Number); START.x = sx; START.y = sy; }
    withHook = !!hookArg;
    if (hookArg && hookArg.includes('=')) HOOK.front = parseFloat(hookArg.split('=')[1]);
    if (swingMode) { HOOK.name = 'swing-out hook'; if (!hookArg) HOOK.front = 250; }
    const files = args.filter((a) => !a.startsWith('--'));
    if (!files.length) { console.log('Usage: node tools/mission6_7_11_sweep.js <project.llsp3> [...]'); process.exit(1); }
    for (const file of files) {
        const program = W.compileProgram((await L.readLlsp3(fs.readFileSync(path.resolve(file)))).target);
        console.log(`\n${path.basename(file)}: 27 starts per row (x, y ±20 mm, heading ±2°), Push on, front pusher, outlines except the 06·07 body, body offset ${offsetMm} mm, turn creep ${creepMm} mm`);
        console.log('overshoot | D2 touched | push stalls | M11 bumped | home | all good | closest to D2 | other touches');
        for (const over of [0, 1, 2, 3, 4, 5]) {
            const rs = [];
            for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) for (const dh of [-2, 0, 2]) {
                rs.push(runOnce(program, { x: START.x + dx, y: START.y + dy, headingDeg: START.heading + dh }, over, offsetMm, creepMm));
            }
            const count = (f) => rs.filter(f).length;
            if (swingMode) {
                const hits = {};
                rs.forEach((r) => r.swing.hit.forEach((n) => { hits[n] = (hits[n] || 0) + 1; }));
                const fw = rs.map((r) => r.swing.fwd), sd = rs.map((r) => r.swing.side);
                console.log(`${over}° | at the end of the push the handle is ${Math.min(...fw).toFixed(0)}-${Math.max(...fw).toFixed(0)} mm ahead, ${(-Math.max(...sd)).toFixed(0)}-${(-Math.min(...sd)).toFixed(0)} mm right of the wheels | hook tip ${HOOK.front} touches: ${Object.entries(hits).map(([k, v]) => `${k} x${v}`).join('; ') || 'nothing'} | rest of route as without the hook: all good ${count((r) => r.stall && r.bumped && r.home && !r.other.length)}/27`);
                continue;
            }
            const others = {};
            rs.forEach((r) => r.other.forEach((o) => { others[o] = (others[o] || 0) + 1; }));
            const good = count((r) => r.stall && r.bumped && r.home && !r.other.length);
            console.log(`${over}° | ${count((r) => r.d2)} | ${count((r) => r.stall)} | ${count((r) => r.bumped)} | ${count((r) => r.home)} | ${good} | ` +
                `${Math.min(...rs.map((r) => r.minD2)).toFixed(0)} mm | ${Object.entries(others).map(([k, v]) => `${k} x${v}`).join('; ') || '-'}`);
        }
    }
}

if (require.main === module) main();
module.exports = { runOnce, START, OUTLINES, BODY, TABLE };
