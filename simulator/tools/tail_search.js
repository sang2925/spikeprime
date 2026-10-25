// Search the numbers after the leafcutter push (back, turn, bump straight) starting from the push-end pose measured
// in the 2026-10-25 videos (body centre about (1530, 935) mm, heading about 50 degrees, both runs).
// Usage, from simulator/: node tools/tail_search.js <file.llsp3> [--offset=8 --creep=58]
const fs = require('fs');
const P = require('../physics.js'), L = require('../llsp3.js'), W = require('../wordblocks.js');
const S = require('./mission6_7_11_sweep.js');
const args = process.argv.slice(2), opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? +a.split('=')[1] : d; };
const off = opt('offset', 8), creep = opt('creep', 58), MARGIN = opt('margin', 20);
const HOME = { x: 171.45 + 2019.3, y: 0, r: 485 };
const LEAF = new Set(['m0607stop', 'm0607', 'm07tower', 'redfig']);
// Where the robot's front-left corner jammed in run 1 (2026-10-25 video, about ±3 cm): the red figure in front of the leafcutter.
const REDFIG = { name: 'redfig', poly: [[1626, 964], [1656, 964], [1656, 994], [1626, 994]] };
const SOLID = S.OUTLINES.filter((o) => !LEAF.has(o.name)), KEEP_AWAY = [...S.OUTLINES.filter((o) => LEAF.has(o.name)), REDFIG];
const num = (blocks, id, v) => { const b = blocks[id]; const k = Object.keys(b.inputs)[0]; b.inputs[k] = [1, [10, String(v)]]; };

function tail(target, nums, start, over) {
    const t = JSON.parse(JSON.stringify(target));
    const p0 = W.compileProgram(t), it = p0.stacks[0].items;   // 0-4 setup, 5-11 steps 1-7, 12.. steps 8-15
    t.blocks[it[4].id].next = it[12].id; t.blocks[it[12].id].parent = it[4].id;
    nums.forEach((v, i) => { if (v !== null) num(t.blocks, it[12 + i].id, v); });
    const program = W.compileProgram(t);
    const h = start.h * Math.PI / 180;
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: start.x - off * Math.cos(h), y: start.y - off * Math.sin(h), headingDeg: start.h });
    P.setObstacles(sim, SOLID, { ...S.BODY, offsetMm: off }, S.TABLE);
    P.setContactMode(sim, 'push');
    const labels = [];
    const runner = W.createRunner(program, { plainMoveMode: 'app-guess', turnOvershootDeg: over, turnCreepMm: creep, onTopBlock: (a, i) => labels.push(program.stacks[a].items[i].label) });
    P.startProgram(sim, runner);
    const r = { leafGap: Infinity, bump: false, other: new Set() };
    for (let n = 0; sim.status === 'running' && n < 4e5; n++) {
        P.stepSim(sim);
        if (n % 2) continue;
        const step = labels.length - 5;   // 1 = back, 2 = turn, 3 = bump, 4.. = way home
        if (step < 1) continue;
        const polys = P.bodyPolys(sim.pose, sim.body);
        if (step >= 2) for (const o of KEEP_AWAY) r.leafGap = Math.min(r.leafGap, ...polys.map((q) => P.polygonGap(q.poly, o.poly)));
        for (const o of sim.obstacles) {
            const gap = Math.min(...polys.map((q) => P.polygonGap(q.poly, o.poly)));
            if (gap < 1) { if (o.name === 'm11' && step === 3) r.bump = true; else if (!(o.name === 'm11' && step === 4)) r.other.add(`${step}:${o.name}`); }
        }
    }
    const home = sim.status === 'stopped' && P.bodyPolys(sim.pose, sim.body)[0].poly.every(([x, y]) => Math.hypot(Math.min(x, HOME.x) - HOME.x, y - HOME.y) <= HOME.r);
    r.status = sim.status;
    return { ...r, home, good: r.bump && home && r.other.size === 0 && r.leafGap >= MARGIN };
}

(async () => {
    const target = (await L.readLlsp3(fs.readFileSync(args.find((a) => !a.startsWith('--'))))).target;
    const starts = [];
    for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) for (const h of [46, 50, 54]) starts.push({ x: 1530 + dx, y: 935 + dy, h });
    const show = (nums, overs = [0, 1, 2, 3]) => {
        const row = overs.map((o) => { const rs = starts.map((s) => tail(target, nums, s, o)); return { o, good: rs.filter((x) => x.good).length, bump: rs.filter((x) => x.bump).length, leafMin: Math.round(Math.min(...rs.map((x) => x.leafGap))), other: [...new Set(rs.flatMap((x) => [...x.other]))].slice(0, 4).join(' ') }; });
        return row;
    };
    if (args.includes('--current')) { for (const r of show([null, null, null])) console.log(JSON.stringify(r)); return; }
    const res = [];
    for (const back of [-6, -8, -10, -12, -14, -16]) for (const fwd of [12, 15, 18, 21, 24, 27]) {
        const row = show([back, null, fwd], [0, 2]);
        res.push({ back, fwd, score: row.reduce((t, r) => t + r.good, 0), row });
        console.log(back, fwd, row.map((r) => `over${r.o}: good ${r.good}/27 bump ${r.bump} leafMin ${r.leafMin} ${r.other}`).join(' | '));
    }
})();
