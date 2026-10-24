// Run from the simulator folder: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../physics.js');

const TOL_MM = 1e-6;
const TOL_DEG = 1e-6;
const near = (actual, expected, tol, what) =>
    assert.ok(Math.abs(actual - expected) <= tol, `${what}: got ${actual}, expected ${expected} ± ${tol}`);

const PROFILE = { wheelDiameterMm: 60, trackWidthMm: 120, gearRatio: 1, maxMotorDegPerS: 1000, leftMotorSign: 1, rightMotorSign: 1 };
const START = { x: 1000, y: 500, headingDeg: 0 };

function run(profile, left, right, duration, start = START) {
    const sim = P.createSim(profile, start);
    assert.deepEqual(P.startTest(sim, left, right, duration), []);
    while (sim.status === 'running') P.stepSim(sim);
    return sim;
}

const mmPerS = (profile, pct) => pct / 100 * profile.maxMotorDegPerS / profile.gearRatio / 360 * Math.PI * profile.wheelDiameterMm;

test('equal positive speeds drive straight forward', () => {
    const sim = run(PROFILE, 50, 50, 2);
    near(sim.pose.x, START.x + mmPerS(PROFILE, 50) * 2, TOL_MM, 'x');
    near(sim.pose.y, START.y, TOL_MM, 'y');
    near(sim.pose.headingDeg, 0, TOL_DEG, 'heading');
    assert.equal(sim.status, 'stopped');
});

test('forward follows a non-zero heading (90 = +Y)', () => {
    const sim = run(PROFILE, 50, 50, 1, { x: 0, y: 0, headingDeg: 90 });
    near(sim.pose.x, 0, TOL_MM, 'x');
    near(sim.pose.y, mmPerS(PROFILE, 50), TOL_MM, 'y');
});

test('equal negative speeds drive straight in reverse', () => {
    const sim = run(PROFILE, -50, -50, 2);
    near(sim.pose.x, START.x - mmPerS(PROFILE, 50) * 2, TOL_MM, 'x');
    near(sim.pose.y, START.y, TOL_MM, 'y');
    near(sim.pose.headingDeg, 0, TOL_DEG, 'heading');
});

test('opposite speeds turn in place, right wheel forward = counterclockwise', () => {
    const sim = run(PROFILE, -30, 30, 1.5);
    near(sim.pose.x, START.x, TOL_MM, 'x');
    near(sim.pose.y, START.y, TOL_MM, 'y');
    const expected = (2 * mmPerS(PROFILE, 30)) / PROFILE.trackWidthMm * 1.5 * 180 / Math.PI;
    near(sim.pose.headingDeg, expected, TOL_DEG, 'heading');
    assert.ok(expected > 0);
});

test('a full clockwise spin returns to the same place and reads -360, not 0', () => {
    const v = mmPerS(PROFILE, 40);
    const duration = Math.PI * PROFILE.trackWidthMm / v;   // each wheel rolls one circle of diameter = track
    const sim = run(PROFILE, 40, -40, duration);
    near(sim.pose.headingDeg, -360, 1e-6, 'heading');
    near(P.gyroDeg(sim), -360, 1e-6, 'gyro');
    near(sim.pose.x, START.x, TOL_MM, 'x');
});

test('unequal speeds drive a circular arc of the expected radius', () => {
    const vL = mmPerS(PROFILE, 20), vR = mmPerS(PROFILE, 60);
    const radius = PROFILE.trackWidthMm / 2 * (vR + vL) / (vR - vL);
    const sim = run(PROFILE, 20, 60, 1.234);
    // heading 0 turning left: centre is radius above the start
    near(Math.hypot(sim.pose.x - START.x, sim.pose.y - (START.y + radius)), radius, TOL_MM, 'distance to centre');
    near(sim.pose.headingDeg, (vR - vL) / PROFILE.trackWidthMm * 1.234 * 180 / Math.PI, TOL_DEG, 'heading');
    assert.ok(sim.pose.y > START.y, 'curved left');
});

test('one stationary wheel pivots around that wheel', () => {
    const sim = run(PROFILE, 0, 50, 1);
    const half = PROFILE.trackWidthMm / 2;
    const th = sim.pose.headingDeg * Math.PI / 180;
    // left wheel contact point = pose + half track to the robot's left
    near(sim.pose.x - Math.sin(th) * half, START.x, TOL_MM, 'left wheel x');
    near(sim.pose.y + Math.cos(th) * half, START.y + half, TOL_MM, 'left wheel y');
    assert.ok(sim.pose.headingDeg > 0);
});

test('encoders follow speed, duration, gearing and mounting direction', () => {
    const profile = { ...PROFILE, gearRatio: 3, rightMotorSign: -1 };
    const sim = run(profile, 40, 40, 1.5);
    near(sim.encLeftDeg, 0.4 * 1000 * 1.5, 1e-6, 'left encoder');
    near(sim.encRightDeg, -0.4 * 1000 * 1.5, 1e-6, 'right encoder (mounted reversed)');
    // 600 motor deg / 3 = 200 wheel deg of a 60 mm wheel; mounting sign does not change direction of travel
    near(sim.pose.x - START.x, 200 / 360 * Math.PI * 60, TOL_MM, 'distance');
});

test('a duration that is not a whole number of steps ends exactly on time', () => {
    const sim = run(PROFILE, 50, 50, 1.0023);
    near(sim.timeS, 1.0023, 1e-9, 'time');
    near(sim.pose.x - START.x, mmPerS(PROFILE, 50) * 1.0023, TOL_MM, 'distance');
});

test('gyro reset changes the reference, not the pose', () => {
    const sim = run(PROFILE, -30, 30, 1);
    const before = { ...sim.pose };
    assert.ok(Math.abs(P.gyroDeg(sim)) > 1);
    assert.deepEqual(P.resetGyro(sim), []);
    assert.deepEqual(sim.pose, before);
    near(P.gyroDeg(sim), 0, TOL_DEG, 'gyro after reset');
});

test('gyro reset is refused while running, allowed while paused', () => {
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, -30, 30, 1);
    P.stepSim(sim);
    const ref = sim.gyroRefDeg;
    assert.equal(P.resetGyro(sim).length, 1);
    assert.equal(sim.gyroRefDeg, ref);
    P.pause(sim);
    assert.deepEqual(P.resetGyro(sim), []);
    near(P.gyroDeg(sim), 0, TOL_DEG, 'gyro');
});

test('reset restores the start state and keeps the profile', () => {
    const profile = { ...PROFILE, gearRatio: 2 };
    const sim = run(profile, 30, 70, 2);
    P.resetSim(sim, START);
    assert.deepEqual(sim.pose, START);
    assert.equal(sim.timeS, 0);
    assert.equal(sim.encLeftDeg, 0);
    assert.equal(sim.encRightDeg, 0);
    assert.equal(P.gyroDeg(sim), 0);
    assert.deepEqual(sim.path, [[START.x, START.y]]);
    assert.equal(sim.status, 'stopped');
    assert.equal(sim.profile.gearRatio, 2);
});

test('playback speed and frame rate do not change the result', () => {
    const results = [[1, 1 / 60], [0.25, 1 / 30], [7.3, 1 / 144], [20, 0.1]].map(([playback, frame]) => {
        const sim = P.createSim(PROFILE, START);
        P.startTest(sim, 35, 80, 3.21);
        const clock = { accumS: 0, playback };
        let frames = 0;
        while (sim.status === 'running' && frames++ < 1e6) P.runFrame(sim, clock, frame);
        return sim;
    });
    const ref = run(PROFILE, 35, 80, 3.21);
    for (const sim of results) {
        near(sim.pose.x, ref.pose.x, 1e-9, 'x');
        near(sim.pose.y, ref.pose.y, 1e-9, 'y');
        near(sim.pose.headingDeg, ref.pose.headingDeg, 1e-9, 'heading');
        near(sim.encLeftDeg, ref.encLeftDeg, 1e-9, 'left encoder');
        near(sim.timeS, 3.21, 1e-9, 'time');
    }
});

test('a long real-time gap (hidden tab) does not jump the robot', () => {
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, 50, 50, 10);
    P.runFrame(sim, { accumS: 0, playback: 1 }, 30);   // 30 s away from the tab
    assert.ok(sim.timeS <= 0.1 + 1e-9, `time advanced ${sim.timeS} s`);
});

test('pause stops time; single step advances exactly one timestep', () => {
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, 50, 50, 1);
    P.pause(sim);
    assert.equal(P.runFrame(sim, { accumS: 0, playback: 1 }, 0.05), 0);
    assert.equal(sim.timeS, 0);
    assert.ok(P.stepOnce(sim));
    near(sim.timeS, P.TIMESTEP_S, 1e-12, 'time');
    assert.equal(sim.status, 'paused');
    P.resume(sim);
    assert.equal(sim.status, 'running');
});

test('invalid settings fault safely and do not move the robot', () => {
    const bad = [
        { wheelDiameterMm: 0 }, { trackWidthMm: NaN }, { gearRatio: -1 },
        { maxMotorDegPerS: 0 }, { leftMotorSign: 2 }, { rightMotorSign: 0 }, { wheelDiameterMm: Infinity },
    ];
    for (const change of bad) {
        const sim = P.createSim({ ...PROFILE, ...change }, START);
        assert.ok(P.startTest(sim, 50, 50, 1).length > 0, JSON.stringify(change));
        assert.equal(sim.status, 'fault');
        assert.equal(P.stepSim(sim), false);
        assert.deepEqual(sim.pose, START);
    }
});

test('invalid speeds and durations fault safely', () => {
    const bad = [[101, 0, 1], [0, -100.5, 1], [NaN, 0, 1], [0, 0, 0], [0, 0, -1], [0, 0, NaN], [0, 0, Infinity], [0, 0, 601]];
    for (const [l, r, d] of bad) {
        const sim = P.createSim(PROFILE, START);
        assert.ok(P.startTest(sim, l, r, d).length > 0, `${l},${r},${d}`);
        assert.equal(sim.status, 'fault');
        assert.deepEqual(sim.pose, START);
    }
    // a fault clears on the next valid start
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, 0, 0, 0);
    assert.deepEqual(P.startTest(sim, 10, 10, 0.1), []);
    assert.equal(sim.fault, '');
});

test('invalid playback speed runs no steps', () => {
    for (const playback of [0, -1, NaN, 21]) {
        const sim = P.createSim(PROFILE, START);
        P.startTest(sim, 50, 50, 1);
        assert.equal(P.runFrame(sim, { accumS: 0, playback }, 0.05), 0);
        assert.deepEqual(sim.pose, START);
    }
});

test('settings and placement are locked during a test', () => {
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, 50, 50, 1);
    assert.equal(P.setProfile(sim, { ...PROFILE, gearRatio: 5 }).length, 1);
    assert.equal(sim.profile.gearRatio, 1);
    assert.equal(P.placeRobot(sim, { x: 0, y: 0, headingDeg: 0 }).length, 1);
    assert.deepEqual(sim.pose, START);
    assert.equal(P.startTest(sim, 10, 10, 1).length, 1);
    assert.equal(sim.status, 'running');
});

test('normalizeHeading wraps to (-180, 180]', () => {
    assert.equal(P.normalizeHeading(540), 180);
    assert.equal(P.normalizeHeading(-180), 180);
    near(P.normalizeHeading(-190), 170, 1e-12, '-190');
    near(P.normalizeHeading(725), 5, 1e-12, '725');
});

test('obstacle: the robot stops at the last safe pose, the run pauses, and resume does not push through', () => {
    const sim = P.createSim(PROFILE, START);
    const box = { name: 'Test box', poly: [[1300, 400], [1400, 400], [1400, 600], [1300, 600]] };
    assert.deepEqual(P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150 }), []);
    assert.deepEqual(P.startTest(sim, 50, 50, 5), []);
    while (sim.status === 'running') P.stepSim(sim);
    assert.equal(sim.status, 'paused');
    assert.match(sim.contact, /Test box/);
    assert.equal(P.touching(sim), '');
    near(sim.pose.x + 90, 1300, 2, 'front edge stops at the box');   // one 5 ms step at 50% is about 0.8 mm
    const stuck = { ...sim.pose };
    P.resume(sim);
    P.stepSim(sim);
    assert.equal(sim.status, 'paused');
    assert.deepEqual(sim.pose, stuck);
});

test('obstacle: a start pose touching an obstacle is refused, and no obstacles means no collisions', () => {
    const sim = P.createSim(PROFILE, START);
    P.setObstacles(sim, [{ name: 'Under robot', poly: [[990, 490], [1010, 490], [1010, 510], [990, 510]] }], { lengthMm: 180, widthMm: 150 });
    assert.match(P.startTest(sim, 50, 50, 1).join(' '), /starts touching Under robot/);
    near(run(PROFILE, 50, 50, 1).pose.x, 1000 + 0.5 * 1000 * Math.PI * 60 / 360, 1e-6, 'no obstacles: drives freely');
});

test('table walls: the robot body stops at each of the four walls and the run pauses', () => {
    const table = { minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 };
    const body = { lengthMm: 184.15, widthMm: 168.275 };
    // [start x, y, heading, wall name, which body extent ends on the wall]
    for (const [x, y, h, wall, edge] of [[300, 500, 180, 'left', (p) => p.x - 92.075], [2000, 500, 0, 'right', (p) => p.x + 92.075],
        [1000, 300, -90, 'bottom', (p) => p.y - 92.075], [1000, 800, 90, 'top', (p) => p.y + 92.075]]) {
        const sim = P.createSim(PROFILE, { x, y, headingDeg: h });
        P.setObstacles(sim, [], body, table);
        assert.deepEqual(P.startTest(sim, 50, 50, 20), []);
        while (sim.status === 'running') P.stepSim(sim);
        assert.equal(sim.status, 'paused', wall);
        assert.match(sim.contact, new RegExp(`${wall} table wall`));
        const limit = { left: 0, right: 2362.2, bottom: 0, top: 1143 }[wall];
        near(edge(sim.pose), limit, 1.5, `${wall}: front edge stops at the wall`);
    }
});

test('table walls: a spin in a corner pauses when a body corner swings through the wall, and no bounds means no walls', () => {
    const body = { lengthMm: 184.15, widthMm: 168.275 };
    const spin = (bounds) => {
        const sim = P.createSim(PROFILE, { x: 100, y: 100, headingDeg: 0 });     // square-on: corners 92 mm from the wall
        P.setObstacles(sim, [], body, bounds);
        assert.deepEqual(P.startTest(sim, 30, -30, 6), []);
        while (sim.status === 'running') P.stepSim(sim);
        return sim;
    };
    const walled = spin({ minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 });
    assert.equal(walled.status, 'paused', 'half-diagonal is 125 mm, so a spin swings corners past a wall 100 mm away');
    assert.match(walled.contact, /table wall/);
    assert.equal(spin(null).status, 'stopped', 'no bounds: spins freely');
});

test('table walls: a start pose over a wall is refused', () => {
    const sim = P.createSim(PROFILE, { x: 50, y: 500, headingDeg: 0 });
    P.setObstacles(sim, [], { lengthMm: 184.15, widthMm: 168.275 }, { minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 });
    assert.match(P.startTest(sim, 50, 50, 1).join(' '), /starts touching the left table wall/);
});

test('closest approach: records the smallest gap to each wall and obstacle, with the time and pose it happened', () => {
    const sim = P.createSim(PROFILE, { x: 500, y: 500, headingDeg: 0 });
    const box = { name: 'Box', poly: [[1000, 300], [1100, 300], [1100, 700], [1000, 700]] };   // front edge starts 410 mm away
    P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150 }, { minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 });
    assert.deepEqual(P.startTest(sim, 50, 50, 20), []);
    for (let i = 0; i < 200 && sim.status === 'running'; i++) P.stepSim(sim);       // 1 s: about 260 mm at 50%, the box is 410 mm away
    const driven = sim.pose.x - 500;
    near(sim.clearance.Box.mm, 1000 - (sim.pose.x + 90), 1e-6, 'gap to the box = distance from the front edge');
    assert.ok(driven > 100, 'drove away from the left wall');
    near(sim.clearance['the left table wall'].mm, 410, 2, 'driving away: the smallest gap is the first step, about 410 mm');
    assert.ok(sim.clearance.Box.timeS > 0.99 && sim.clearance.Box.timeS < 1.01, 'Box was closest at the end');
    near(sim.clearance.Box.pose.x, sim.pose.x, 1e-9, 'pose is stored');
});

test('closest approach: polygonGap is zero when touching, and nothing is recorded without obstacles or walls', () => {
    const a = [[0, 0], [10, 0], [10, 10], [0, 10]];
    near(P.polygonGap(a, [[13, 0], [20, 0], [20, 10], [13, 10]]), 3, 1e-12, 'side by side');
    near(P.polygonGap(a, [[13, 14], [20, 14], [20, 20], [13, 20]]), 5, 1e-12, 'corner to corner: 3 and 4');
    near(P.polygonGap(a, [[10, 0], [20, 0], [20, 10], [10, 10]]), 0, 1e-12, 'touching');
    const sim = P.createSim(PROFILE, START);
    P.startTest(sim, 50, 50, 1);
    while (sim.status === 'running') P.stepSim(sim);
    assert.deepEqual(sim.clearance, {});
});

test('turn records: an equal and opposite spin turns the robot without moving its wheel midpoint', () => {
    const sim = P.createSim(PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    assert.deepEqual(P.startTest(sim, 40, -40, 1), []);       // left wheel forward, right back: clockwise
    while (sim.status === 'running') P.stepSim(sim);
    assert.equal(sim.turns.length, 1);
    const t = sim.turns[0];
    const v = 0.4 * 1000 / 360 * Math.PI * 60;                  // mm/s at each wheel
    near(t.turnedDeg, -2 * v / 120 * 180 / Math.PI, 1e-6, 'turned clockwise by 2v / track for 1 s');
    near(t.forwardMm, 0, 1e-6, 'no forward or backward creep');
    near(t.sideMm, 0, 1e-6, 'no sideways creep');
    near(t.wheelForwardDeg, 0, 1e-9, 'wheels rolled forward and back equally');
    near(t.endS - t.startS, 1, 1e-9, 'spin lasted the whole test');
});

test('turn records: unequal opposite wheels show up as creep, and driving straight is not a turn', () => {
    const sim = P.createSim(PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    P.startTest(sim, 40, -20, 1);                                // still a spin, but on average 10% forward
    while (sim.status === 'running') P.stepSim(sim);
    near(sim.turns[0].wheelForwardDeg, 0.1 * 1000, 1e-6, 'average wheel roll = (40% - 20%) / 2 of 1000 deg/s for 1 s');
    assert.ok(Math.hypot(sim.turns[0].forwardMm, sim.turns[0].sideMm) > 10, 'the wheel midpoint moved');
    const straight = P.createSim(PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    P.startTest(straight, 50, 50, 1);
    while (straight.status === 'running') P.stepSim(straight);
    assert.deepEqual(straight.turns, []);
});

test('turn records: the nearest wall or ticked model during a spin, and which part of the body is closest', () => {
    const sim = P.createSim(PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    const box = { name: 'Box', poly: [[1120, 480], [1160, 480], [1160, 520], [1120, 520]] };   // 30 mm in front of the robot's nose
    P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150 }, { minX: 0, minY: 0, maxX: 2362.2, maxY: 1143 });
    P.startTest(sim, 10, -10, 0.2);                              // a small spin, nowhere near touching
    while (sim.status === 'running') P.stepSim(sim);
    const n = sim.turns[0].nearest;
    assert.equal(n.name, 'Box');
    assert.match(n.part, /front/);
    assert.ok(n.mm > 0 && n.mm <= 30.5, `gap ${n.mm}`);
});

test('push mode: driving into a model stalls the robot at its face, the run keeps going, and the push is counted', () => {
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    const box = { name: 'Box', poly: [[1150, 400], [1250, 400], [1250, 600], [1150, 600]] };
    P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150 });
    P.setContactMode(sim, 'push');
    P.startTest(sim, 50, 50, 2);
    while (sim.status === 'running') P.stepSim(sim);
    assert.equal(sim.status, 'stopped');
    assert.ok(sim.pose.x + 90 <= 1150.1 && sim.pose.x + 90 > 1145, `front stops at the face, got x ${sim.pose.x}`);
    assert.ok(Math.abs(sim.pose.y - 500) < 0.5, 'a head-on push does not move it sideways');
    assert.ok(sim.pushedMm > 100);
    P.resetSim(sim, { x: 1000, y: 500, headingDeg: 0 });
    assert.equal(sim.contactMode, 'push', 'reset keeps the contact mode');
});

test('attachments: a part sticking out of the body touches a model the box alone does not', () => {
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    const box = { name: 'Box', poly: [[1120, 520], [1200, 520], [1200, 600], [1120, 600]] };
    P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150 });
    assert.equal(P.touching(sim), '');
    P.setObstacles(sim, [box], { lengthMm: 180, widthMm: 150, parts: [{ name: 'pusher', front: 130, back: 90, left: 40, right: 0 }] });
    assert.equal(P.touching(sim), 'Box');
    assert.equal(P.nearestThing(sim).part, 'pusher');
});

test('body offset: the box sits ahead of the wheels, and an in-place spin swings it around the wheel midpoint', () => {
    const sim = P.createSim(P.DEFAULT_PROFILE, { x: 1000, y: 500, headingDeg: 0 });
    P.setObstacles(sim, [], { lengthMm: 180, widthMm: 150, offsetMm: 30, parts: [{ name: 'p', front: 130, back: 90, left: 10, right: -10 }] });
    const [box, part] = P.bodyPolys(sim.pose, sim.body);
    assert.deepEqual(box.poly.map(([x, y]) => [Math.round(x), Math.round(y)]), [[1120, 575], [940, 575], [940, 425], [1120, 425]]);
    assert.equal(Math.round(part.poly[0][0]), 1160, 'parts move with the box');
    P.startTest(sim, 30, -30, 0.5);   // spin right in place
    while (sim.status === 'running') P.stepSim(sim);
    const c = P.bodyPolys(sim.pose, sim.body)[0].poly, cx = c.reduce((t, p) => t + p[0], 0) / 4, cy = c.reduce((t, p) => t + p[1], 0) / 4;
    assert.ok(Math.abs(Math.hypot(cx - 1000, cy - 500) - 30) < 0.01, 'box centre stays 30 mm from the wheel midpoint');
    assert.ok(Math.abs(sim.pose.x - 1000) < 1e-6 && Math.abs(sim.pose.y - 500) < 1e-6, 'wheel midpoint does not move');
});
