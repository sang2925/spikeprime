// Print the body-centre pose at the start of every top-level block of a 6-7-11 program, for comparing with video poses.
// Usage, from simulator/: node tools/route_poses.js <file.llsp3> [--offset=N] [--creep=N] [--over=N] [--start=x,y]
const fs = require('fs');
const P = require('../physics.js'), L = require('../llsp3.js'), W = require('../wordblocks.js'), M = require('../missions.js');
const S = require('./mission6_7_11_sweep.js');
const args = process.argv.slice(2), opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const off = +opt('offset', 0), creep = +opt('creep', 0), over = +opt('over', 0);
const [sx, sy] = opt('start', `${S.START.x},${S.START.y}`).split(',').map(Number);
(async () => {
    const program = W.compileProgram((await L.readLlsp3(fs.readFileSync(args.find((a) => !a.startsWith('--'))))).target);
    const h0 = S.START.heading * Math.PI / 180;
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: sx - off * Math.cos(h0), y: sy - off * Math.sin(h0), headingDeg: S.START.heading });
    const body = (p) => { const h = p.headingDeg * Math.PI / 180; return `(${Math.round(p.x + off * Math.cos(h))}, ${Math.round(p.y + off * Math.sin(h))}) ${p.headingDeg.toFixed(0)}°`; };
    P.setObstacles(sim, S.OUTLINES, { ...S.BODY, offsetMm: off }, S.TABLE);
    P.setContactMode(sim, 'push');
    let last = null;
    const runner = W.createRunner(program, { plainMoveMode: 'app-guess', turnOvershootDeg: over, turnCreepMm: creep, onTopBlock: (t, i) => {
        if (last) console.log(`${last.padEnd(28)} ends at body ${body(sim.pose)}  t=${sim.timeS.toFixed(1)}s`);
        last = program.stacks[t].items[i].label;
    } });
    P.startProgram(sim, runner);
    for (let n = 0; sim.status === 'running' && n < 1e6; n++) P.stepSim(sim);
    console.log(`${String(last).padEnd(28)} ends at body ${body(sim.pose)}  t=${sim.timeS.toFixed(1)}s`);
})();
