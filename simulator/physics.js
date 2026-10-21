/**
 * Differential-drive physics for the simulator. No DOM: runs in the browser and in Node tests.
 *
 * Units: mm, seconds, degrees.
 * World: X right, Y up, heading 0 points right (+X), positive heading = counterclockwise.
 * Pose = midpoint between the two drive wheels.
 * Logical wheel speed: +% rolls that wheel forward. Motor mounting direction only changes encoder signs.
 * Ideal motion: no slip, no noise, no overshoot.
 */
(function (root) {
    'use strict';

    const TIMESTEP_S = 0.005;          // fixed physics step
    const MAX_TEST_DURATION_S = 600;
    const MAX_PROGRAM_S = 300;         // safety stop for programs (a match is 150 s)
    const MAX_PLAYBACK = 20;
    const MAX_FRAME_REAL_S = 0.1;      // longer real gaps (tab switch, debugger) are ignored, not caught up
    const MAX_STEPS_PER_FRAME = 4000;
    const PATH_MIN_SPACING_MM = 2;

    // Defaults. Only wheel diameter comes from a team record; the rest are examples/estimates.
    const DEFAULT_PROFILE = {
        wheelDiameterMm: 65.3,         // team record: about 20.5 cm per wheel turn (205 / pi)
        trackWidthMm: 112,             // example, not measured
        gearRatio: 1,                  // example: direct drive assumed
        maxMotorDegPerS: 1050,         // estimate: about 10.5 deg/s per 1%, unmeasured
        leftMotorSign: 1,              // example: not set from the robot
        rightMotorSign: 1,             // example: not set from the robot
    };

    function validateProfile(p) {
        const errors = [];
        const positive = (v) => Number.isFinite(v) && v > 0;
        if (!positive(p.wheelDiameterMm)) errors.push('Wheel diameter must be a number above 0 mm.');
        if (!positive(p.trackWidthMm)) errors.push('Track width must be a number above 0 mm.');
        if (!positive(p.gearRatio)) errors.push('Gear ratio must be a number above 0.');
        if (!positive(p.maxMotorDegPerS)) errors.push('Max motor speed must be a number above 0 deg/s.');
        if (p.leftMotorSign !== 1 && p.leftMotorSign !== -1) errors.push('Left motor direction must be +1 or -1.');
        if (p.rightMotorSign !== 1 && p.rightMotorSign !== -1) errors.push('Right motor direction must be +1 or -1.');
        return errors;
    }

    function validateTest(leftPct, rightPct, durationS) {
        const errors = [];
        const pct = (v) => Number.isFinite(v) && v >= -100 && v <= 100;
        if (!pct(leftPct)) errors.push('Left speed must be from -100 to 100 %.');
        if (!pct(rightPct)) errors.push('Right speed must be from -100 to 100 %.');
        if (!(Number.isFinite(durationS) && durationS > 0 && durationS <= MAX_TEST_DURATION_S)) {
            errors.push(`Duration must be above 0 and at most ${MAX_TEST_DURATION_S} s.`);
        }
        return errors;
    }

    /** Motor speed (deg/s, logical sign) for a % command */
    function motorDegPerS(profile, pct) {
        return pct / 100 * profile.maxMotorDegPerS;
    }

    /** Wheel ground speed (mm/s): motor deg/s, divided by gear ratio, times wheel circumference / 360 */
    function wheelSpeedMmPerS(profile, pct) {
        return motorDegPerS(profile, pct) / profile.gearRatio / 360 * Math.PI * profile.wheelDiameterMm;
    }

    function normalizeHeading(deg) {
        const h = ((deg + 180) % 360 + 360) % 360 - 180;
        return h === -180 ? 180 : h;
    }

    function createSim(profile, pose) {
        return {
            profile: { ...profile },
            pose: { x: pose.x, y: pose.y, headingDeg: pose.headingDeg },  // heading is not wrapped
            timeS: 0,
            encLeftDeg: 0,
            encRightDeg: 0,
            gyroRefDeg: pose.headingDeg,
            status: 'stopped',   // stopped | running | paused | fault
            fault: '',
            test: null,
            program: null,     // Word Blocks runner (wordblocks.js) while a program runs
            path: [[pose.x, pose.y]],  // null entries = break (robot placed by hand)
        };
    }

    function isActive(sim) {
        return sim.status === 'running' || sim.status === 'paused';
    }

    function fail(sim, errors) {
        sim.test = null;
        sim.program = null;
        sim.status = 'fault';
        sim.fault = errors.join(' ');
        return errors;
    }

    /** Start a bounded wheel-speed test. Returns [] on success, else error messages (status becomes fault). */
    function startTest(sim, leftPct, rightPct, durationS) {
        if (isActive(sim)) return ['A test is already active. Stop it first.'];
        const errors = validateProfile(sim.profile).concat(validateTest(leftPct, rightPct, durationS));
        if (errors.length) return fail(sim, errors);
        sim.test = {
            leftPct, rightPct, durationS,
            stepsDone: 0,
            stepsTotal: Math.max(1, Math.ceil(durationS / TIMESTEP_S - 1e-9)),
        };
        sim.status = 'running';
        sim.fault = '';
        return [];
    }

    /**
     * Start a program runner. Each step the runner's tick(sim) reads sensors and sets
     * runner.leftPct / runner.rightPct (simulator wheels, + = roll forward); it returns false when done.
     */
    function startProgram(sim, runner) {
        if (isActive(sim)) return ['A test or program is already active. Stop it first.'];
        const errors = validateProfile(sim.profile);
        if (errors.length) return fail(sim, errors);
        runner.startTimeS = sim.timeS;
        sim.program = runner;
        sim.status = 'running';
        sim.fault = '';
        return [];
    }

    /** Move the pose along the exact arc for constant wheel speeds over dt */
    function integrate(pose, vL, vR, trackMm, dt) {
        const v = (vL + vR) / 2;
        const w = (vR - vL) / trackMm;          // rad/s, counterclockwise positive
        const th = pose.headingDeg * Math.PI / 180;
        const dth = w * dt;
        if (Math.abs(dth) < 1e-12) {
            pose.x += v * Math.cos(th) * dt;
            pose.y += v * Math.sin(th) * dt;
        } else {
            const r = v / w;
            pose.x += r * (Math.sin(th + dth) - Math.sin(th));
            pose.y -= r * (Math.cos(th + dth) - Math.cos(th));
        }
        pose.headingDeg += dth * 180 / Math.PI;
    }

    /** Drive both wheels for dt; false (and fault) if the pose stops being a number */
    function advance(sim, leftPct, rightPct, dt, forcePath) {
        const p = sim.profile;
        integrate(sim.pose, wheelSpeedMmPerS(p, leftPct), wheelSpeedMmPerS(p, rightPct), p.trackWidthMm, dt);
        sim.encLeftDeg += motorDegPerS(p, leftPct) * dt * p.leftMotorSign;
        sim.encRightDeg += motorDegPerS(p, rightPct) * dt * p.rightMotorSign;
        sim.timeS += dt;
        if (![sim.pose.x, sim.pose.y, sim.pose.headingDeg].every(Number.isFinite)) {
            fail(sim, ['Physics produced an invalid pose.']);
            return false;
        }
        recordPath(sim, forcePath);
        return true;
    }

    /** Advance one fixed step (the last step of a test is shortened to end exactly on the duration). */
    function stepSim(sim) {
        if (sim.program) return stepProgram(sim);
        const t = sim.test;
        if (!t) return false;
        const last = t.stepsDone === t.stepsTotal - 1;
        const dt = last ? t.durationS - t.stepsDone * TIMESTEP_S : TIMESTEP_S;
        t.stepsDone++;
        if (!advance(sim, t.leftPct, t.rightPct, dt, last)) return false;
        if (last) {
            sim.test = null;
            sim.status = 'stopped';
        }
        return true;
    }

    /** The program decides wheel speeds from the sensors now, then physics runs one fixed step */
    function stepProgram(sim) {
        const prog = sim.program;
        const running = prog.tick(sim);
        if (prog.fault) {
            fail(sim, [prog.fault]);
            return false;
        }
        if (!running) {
            sim.program = null;    // program end stops the motors
            sim.status = 'stopped';
            recordPath(sim, true);
            return true;
        }
        if (!advance(sim, prog.leftPct, prog.rightPct, TIMESTEP_S, false)) return false;
        if (sim.timeS - prog.startTimeS > MAX_PROGRAM_S) {
            fail(sim, [`Program still running after ${MAX_PROGRAM_S} s of simulation, so it was stopped. A loop may never end.`]);
            return false;
        }
        return true;
    }

    // shortcut: path grows without a cap (~1 point per 2 mm), fine for 600 s tests; thin it if long runs lag
    function recordPath(sim, force) {
        const prev = sim.path[sim.path.length - 1];
        const { x, y } = sim.pose;
        if (force || !prev || Math.hypot(x - prev[0], y - prev[1]) >= PATH_MIN_SPACING_MM) sim.path.push([x, y]);
    }

    /**
     * Run as many fixed steps as the elapsed real time allows. Playback only changes how many steps
     * run per frame, never the step size, so results do not depend on playback speed or frame rate.
     */
    function runFrame(sim, clock, realDtS) {
        if (sim.status !== 'running' || !(Number.isFinite(clock.playback) && clock.playback > 0 && clock.playback <= MAX_PLAYBACK)) {
            clock.accumS = 0;
            return 0;
        }
        const realDt = Math.min(Math.max(Number.isFinite(realDtS) ? realDtS : 0, 0), MAX_FRAME_REAL_S);
        clock.accumS += realDt * clock.playback;
        let n = 0;
        while (clock.accumS >= TIMESTEP_S && sim.status === 'running' && n < MAX_STEPS_PER_FRAME) {
            stepSim(sim);
            clock.accumS -= TIMESTEP_S;
            n++;
        }
        if (sim.status !== 'running') clock.accumS = 0;
        return n;
    }

    function pause(sim) { if (sim.status === 'running') sim.status = 'paused'; }
    function resume(sim) { if (sim.status === 'paused') sim.status = 'running'; }

    /** One fixed step while paused */
    function stepOnce(sim) {
        return sim.status === 'paused' ? stepSim(sim) : false;
    }

    function stop(sim) {
        sim.test = null;
        sim.program = null;
        if (isActive(sim)) sim.status = 'stopped';
    }

    /** Zero the gyro at the current heading. The pose does not change. */
    function resetGyro(sim) {
        if (sim.status === 'running') return ['Pause or stop before resetting the gyro.'];
        sim.gyroRefDeg = sim.pose.headingDeg;
        return [];
    }

    function gyroDeg(sim) {
        return sim.pose.headingDeg - sim.gyroRefDeg;
    }

    /** Stop, put the robot at the start pose, clear timer, encoders, gyro reference, path and fault */
    function resetSim(sim, startPose) {
        const fresh = createSim(sim.profile, startPose);
        Object.assign(sim, fresh);
    }

    /** Robot placed by hand while stopped: move the pose and break the path line */
    function placeRobot(sim, pose) {
        if (isActive(sim)) return ['Robot cannot be moved during a test.'];
        const p = sim.pose;
        if (p.x === pose.x && p.y === pose.y && p.headingDeg === pose.headingDeg) return [];
        Object.assign(p, { x: pose.x, y: pose.y, headingDeg: pose.headingDeg });
        const n = sim.path.length;
        // While dragging, keep moving the point after the last break instead of adding new breaks
        if (n >= 2 && sim.path[n - 2] === null) sim.path[n - 1] = [pose.x, pose.y];
        else sim.path.push(null, [pose.x, pose.y]);
        return [];
    }

    function setProfile(sim, profile) {
        if (isActive(sim)) return ['Settings cannot change during a test.'];
        sim.profile = { ...profile };
        return validateProfile(sim.profile);
    }

    function clearPath(sim) {
        sim.path = [[sim.pose.x, sim.pose.y]];
    }

    const SimPhysics = {
        TIMESTEP_S, MAX_TEST_DURATION_S, MAX_PROGRAM_S, MAX_PLAYBACK, DEFAULT_PROFILE,
        validateProfile, validateTest, motorDegPerS, wheelSpeedMmPerS, normalizeHeading,
        createSim, isActive, startTest, startProgram, stepSim, runFrame, pause, resume, stepOnce, stop,
        resetGyro, gyroDeg, resetSim, placeRobot, setProfile, clearPath,
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = SimPhysics;
    else root.SimPhysics = SimPhysics;
})(this);
