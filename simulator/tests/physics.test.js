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
