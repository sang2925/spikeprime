// Word Blocks runner + .llsp3 reader tests. Run from simulator/: node --test tests/
// Real team projects are only read (never written).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../physics.js');
const L = require('../llsp3.js');
const W = require('../wordblocks.js');

const ROOT = path.join(__dirname, '..', '..');
const PROFILE = P.DEFAULT_PROFILE;
const MM_PER_MOTOR_DEG = Math.PI * PROFILE.wheelDiameterMm / 360 / PROFILE.gearRatio;
const START = { x: 1000, y: 500, headingDeg: 90 };
const near = (actual, expected, tol, what) =>
    assert.ok(Math.abs(actual - expected) <= tol, `${what}: got ${actual}, expected ${expected} ± ${tol}`);

async function loadTarget(file) {
    return (await L.readLlsp3(fs.readFileSync(path.join(ROOT, file)))).target;
}

/** Run a compiled program to the end; returns the sim, runner and the pose when each main block started */
function runProgram(program, options = {}) {
    const sim = P.createSim(PROFILE, START);
    const starts = [];
    const runner = W.createRunner(program, { ...options, onTopBlock: (t, i) => starts.push({ i, timeS: sim.timeS, pose: { ...sim.pose } }) });
    assert.deepEqual(P.startProgram(sim, runner), []);
    let n = 0;
    while (sim.status === 'running' && n++ < 1e7) P.stepSim(sim);
    starts.push({ i: 'end', timeS: sim.timeS, pose: { ...sim.pose } });
    return { sim, runner, starts };
}

// ---- tiny block builder for synthetic programs ----------------------------
function builder() {
    const blocks = {};
    let n = 0;
    const id = () => `b${++n}`;
    const num = (v) => [1, [4, String(v)]];
    function menu(opcode, field, value) {
        const k = id();
        blocks[k] = { opcode, inputs: {}, fields: { [field]: [value, null] }, shadow: true, topLevel: false, next: null };
        return [1, k];
    }
    function block(opcode, inputs = {}, fields = {}, extra = {}) {
        const k = id();
        blocks[k] = { opcode, inputs, fields, shadow: false, topLevel: false, next: null, ...extra };
        return k;
    }
    function chain(ids) {
        for (let i = 0; i + 1 < ids.length; i++) blocks[ids[i]].next = ids[i + 1];
        return ids[0];
    }
    function program(ids) {
        const start = block('flipperevents_whenProgramStarts', {}, {}, { topLevel: true });
        blocks[start].next = chain(ids);
        return W.compileProgram({ blocks, variables: {} });
    }
    const pair = (p) => block('flippermove_setMovementPair', { PAIR: menu('flippermove_movement-port-selector', 'field_flippermove_movement-port-selector', p) });
    const speed = (s) => block('flippermove_movementSpeed', { SPEED: num(s) });
    const move = (dir, v, unit = 'cm') => block('flippermove_move', { DIRECTION: menu('flippermove_custom-icon-direction', 'field_flippermove_custom-icon-direction', dir), VALUE: num(v) }, { UNIT: [unit, null] });
    const dual = (l, r) => block('flippermoremove_startDualSpeed', { LEFT: num(l), RIGHT: num(r) });
    const wait = (s) => block('control_wait', { DURATION: num(s) });
    return { blocks, num, menu, block, chain, program, pair, speed, move, dual, wait };
}

// ---- reader ---------------------------------------------------------------

test('reads all four team projects (read-only) and finds their start stacks', async () => {
    for (const [file, stacks] of [['Team Template.llsp3', 1], ['Harrison_Lucas_Kai_leafcutter_gyro.llsp3', 1],
        ['Harrison_Lucas_Kai_leafcutter_uncover.llsp3', 1], ['Harrison_Lucas_Kai_leafcutter_uncover_turnfix.llsp3', 1]]) {
        const before = fs.statSync(path.join(ROOT, file)).mtimeMs;
        const program = W.compileProgram(await loadTarget(file));
        assert.equal(program.stacks.length, stacks, file);
        assert.equal(fs.statSync(path.join(ROOT, file)).mtimeMs, before, `${file} must not change`);
    }
});

test('reader rejects files that are not SPIKE projects', async () => {
    await assert.rejects(L.readLlsp3(new TextEncoder().encode('<html>not a zip</html>')), /Not a ZIP/);
    const real = fs.readFileSync(path.join(ROOT, 'Team Template.llsp3'));
    await assert.rejects(L.readLlsp3(real.subarray(0, real.length - 200)), Error);
});

// ---- real team missions ---------------------------------------------------

test('gyro mission: every straight drives |cm| × 17.6 motor degrees, every turn stops just past |deg| - 1', async () => {
    const program = W.compileProgram(await loadTarget('Harrison_Lucas_Kai_leafcutter_gyro.llsp3'));
    const { sim, runner, starts } = runProgram(program);
    assert.equal(sim.status, 'stopped', sim.fault);
    assert.deepEqual(runner.notes, []);
    const items = program.stacks[0].items;
    assert.deepEqual(starts.slice(0, -1).map((s) => s.i), items.map((_, i) => i), 'every main block ran once, in order');
    let straights = 0, turns = 0;
    for (let k = 0; k < items.length; k++) {
        const a = starts[k].pose, b = starts[k + 1].pose;
        const s = /^straight (-?[\d.]+) cm/.exec(items[k].label);
        const t = /^turn (-?[\d.]+)$/.exec(items[k].label);
        if (s) {
            const cm = Number(s[1]);
            const expected = Math.abs(cm) * 17.6 * MM_PER_MOTOR_DEG;   // loop stops on the first step past the target
            near(Math.hypot(b.x - a.x, b.y - a.y), expected, 2, `${items[k].label} distance`);
            const th = a.headingDeg * Math.PI / 180;
            assert.equal(Math.sign((b.x - a.x) * Math.cos(th) + (b.y - a.y) * Math.sin(th)), Math.sign(cm), `${items[k].label} direction`);
            near(b.headingDeg, a.headingDeg, 1e-6, `${items[k].label} stays straight`);
            straights++;
        }
        if (t) {
            const deg = Number(t[1]);
            const clockwise = -(b.headingDeg - a.headingDeg);          // world heading is counterclockwise +
            assert.equal(Math.sign(clockwise), Math.sign(deg), `${items[k].label}: + means clockwise`);
            assert.ok(Math.abs(clockwise) > Math.abs(deg) - 1 && Math.abs(clockwise) <= Math.abs(deg) - 0.5,
                `${items[k].label} turned ${clockwise}`);
            near(Math.hypot(b.x - a.x, b.y - a.y), 0, 1e-6, `${items[k].label} turns in place`);
            turns++;
        }
    }
    assert.equal(straights, 9);
    assert.equal(turns, 6);
});

test('plain move: "as commanded" drives the cm asked; "app guess" drives 20.5/17.5 times further', async () => {
    const program = W.compileProgram(await loadTarget('Harrison_Lucas_Kai_leafcutter_uncover.llsp3'));
    const idx = program.stacks[0].items.findIndex((it) => it.label === 'move forward for 30 cm');
    assert.ok(idx >= 0);
    for (const [mode, expectedMm] of [['commanded', 300], ['app-guess', 30 * 360 / 17.5 * MM_PER_MOTOR_DEG]]) {
        const { starts, sim } = runProgram(program, { plainMoveMode: mode });
        assert.equal(sim.status, 'stopped', sim.fault);
        const a = starts[idx].pose, b = starts[idx + 1].pose;
        near(Math.hypot(b.x - a.x, b.y - a.y), expectedMm, 2, mode);
    }
});

test('team turn My Block: turn 0 does nothing; turn 200 never finishes because yaw wraps at 180', async () => {
    const target = await loadTarget('Team Template.llsp3');
    const template = W.compileProgram(target);
    const def = Object.entries(template.defs).find(([code]) => code.startsWith('turn '));
    assert.ok(def, 'template has a turn My Block');
    const protoId = Object.values(target.blocks).find((b) => b.opcode === 'procedures_definition' && target.blocks[b.inputs.custom_block[1]].mutation.proccode === def[0]).inputs.custom_block[1];
    const argId = JSON.parse(target.blocks[protoId].mutation.argumentids)[0];
    for (const [deg, expectFault] of [[0, false], [200, true]]) {
        const blocks = JSON.parse(JSON.stringify(target.blocks));
        for (const b of Object.values(blocks)) if (b.opcode === 'flipperevents_whenProgramStarts') b.next = null;
        blocks.call = { opcode: 'procedures_call', inputs: { [argId]: [1, [10, String(deg)]] }, fields: {}, shadow: false, topLevel: false, next: null,
            mutation: { tagName: 'mutation', children: [], proccode: def[0], argumentids: JSON.stringify([argId]), warp: 'false' } };
        blocks.go = { opcode: 'flipperevents_whenProgramStarts', inputs: {}, fields: {}, shadow: false, topLevel: true, next: 'call' };
        const { sim } = runProgram(W.compileProgram({ blocks, variables: {} }));
        if (expectFault) {
            assert.equal(sim.status, 'fault');
            assert.match(sim.fault, /still running/);
        } else {
            assert.equal(sim.status, 'stopped', sim.fault);
            near(sim.pose.headingDeg, START.headingDeg, 1e-9, 'turn 0 heading');
            near(sim.timeS, 0.2, 0.011, 'turn 0 only waits 0.2 s');
        }
    }
});

// ---- synthetic programs ---------------------------------------------------

test('pair AB drives backward with the same turn direction as BA', () => {
    for (const p of ['BA', 'AB']) {
        const b = builder();
        const { sim } = runProgram(b.program([b.pair(p), b.speed(50), b.move('forward', 10)]));
        const dy = sim.pose.y - START.y;   // heading 90 = +Y
        near(Math.abs(dy), 100, 2, `${p} distance`);
        assert.equal(Math.sign(dy), p === 'BA' ? 1 : -1, `${p} direction`);

        const t = builder();
        const turn = runProgram(t.program([t.pair(p), t.dual(30, -30), t.wait(0.5), t.block('flippermove_stopMove')])).sim;
        assert.ok(turn.pose.headingDeg < START.headingDeg - 10, `${p}: left +, right - turns clockwise`);
    }
});

test('wait, repeat and seconds moves take the right simulated time and distance', () => {
    const b = builder();
    const body = b.move('forward', 10);
    const repeat = b.block('control_repeat', { TIMES: b.num(3), SUBSTACK: [2, body] });
    const { sim } = runProgram(b.program([b.pair('BA'), b.speed(50), b.wait(0.2), repeat, b.move('back', 1, 'seconds')]));
    const v = P.wheelSpeedMmPerS(PROFILE, 50);
    near(sim.pose.y - START.y, 300 - v * 1, 8, 'three 10 cm moves, then 1 s back');
    near(sim.timeS, 0.2 + 300 / v + 1, 0.05, 'time');
});

test('speeds over 100% are clamped with a note', () => {
    const b = builder();
    const { sim, runner } = runProgram(b.program([b.pair('BA'), b.dual(300, 300), b.wait(1), b.block('flippermove_stopMove')]));
    near(sim.pose.y - START.y, P.wheelSpeedMmPerS(PROFILE, 100), 2, 'distance at 100%');
    assert.ok(runner.notes.some((n) => /clamped/.test(n.text)));
});

test('stop all ends the program; later blocks do not run', () => {
    const b = builder();
    const stop = b.block('flippercontrol_stop', {}, { STOP_OPTION: ['all', null] });
    const { sim } = runProgram(b.program([b.pair('BA'), stop, b.move('forward', 10)]));
    assert.equal(sim.status, 'stopped');
    assert.deepEqual(sim.pose, START);
});

test('unsupported blocks are skipped with a NOTE; missing My Block definitions too', () => {
    const b = builder();
    const odd = b.block('flipperlight_lightDisplayText', { TEXT: [1, [10, 'hi']] });
    const call = b.block('procedures_call', {}, {}, { mutation: { proccode: 'ghost', argumentids: '[]', warp: 'false' } });
    const { sim, runner } = runProgram(b.program([odd, call, b.pair('BA'), b.move('forward', 5)]));
    assert.equal(sim.status, 'stopped');
    assert.ok(runner.notes.some((n) => n.text === 'not simulated: flipperlight_lightDisplayText (skipped)'));
    assert.ok(runner.notes.some((n) => /ghost/.test(n.text)));
    near(sim.pose.y - START.y, 50, 2, 'later blocks still ran');
});

test('faults: a move at speed 0 and a loop that never waits', () => {
    const a = builder();
    const zero = runProgram(a.program([a.pair('BA'), a.speed(0), a.move('forward', 10)])).sim;
    assert.equal(zero.status, 'fault');
    assert.match(zero.fault, /speed 0/);

    const b = builder();
    const forever = b.block('control_forever', { SUBSTACK: [2, null] });
    const def = b.block('procedures_definition', { custom_block: [1, null] }, {}, { topLevel: true });
    const proto = b.block('procedures_prototype', {}, {}, { shadow: true, mutation: { proccode: 'spin', argumentids: '[]', argumentnames: '[]', warp: 'true' } });
    b.blocks[def].inputs.custom_block = [1, proto];
    b.blocks[def].next = forever;
    const call = b.block('procedures_call', {}, {}, { mutation: { proccode: 'spin', argumentids: '[]', warp: 'false' } });
    const stuck = runProgram(b.program([call])).sim;
    assert.equal(stuck.status, 'fault');
    assert.match(stuck.fault, /without waiting/);
});

test('attachment motor C turns by the requested degrees over the estimated time', () => {
    const b = builder();
    const port = b.menu('flippermotor_multiple-port-selector', 'field_flippermotor_multiple-port-selector', 'C');
    const dir = b.menu('flippermotor_custom-icon-direction', 'field_flippermotor_custom-icon-direction', 'counterclockwise');
    const setSpeed = b.block('flippermotor_motorSetSpeed', { PORT: port, SPEED: b.num(50) });
    const run = b.block('flippermotor_motorTurnForDirection', { PORT: port, DIRECTION: dir, VALUE: b.num(-120) }, { UNIT: ['degrees', null] });
    const { sim, runner } = runProgram(b.program([setSpeed, run]));
    near(runner.attachment.C, 120, 1e-9, 'counterclockwise -120 = clockwise 120');
    near(sim.timeS, 120 / (0.5 * PROFILE.maxMotorDegPerS), 0.006, 'time');
    assert.deepEqual(sim.pose, START);
});
