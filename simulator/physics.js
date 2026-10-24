/**
 * Differential-drive physics for the simulator. No DOM: runs in the browser and in Node tests.
 *
 * Units: mm, seconds, degrees.
 * World: X right, Y up, heading 0 points right (+X), positive heading = counterclockwise.
 * Pose = midpoint between the two drive wheels.
 * Logical wheel speed: +% rolls that wheel forward. Motor mounting direction only changes encoder signs.
 * Ideal motion: no slip, no noise, no overshoot.
 * Optional obstacles (convex polygons, mm) and table walls (a rectangle, mm): if the robot body would touch one, the step is undone and the run pauses.
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
            obstacles: [],     // [{ name, poly: [[x, y], ...] }] convex, mm; empty = no collisions
            bounds: null,      // { minX, minY, maxX, maxY } table interior, mm; null = no walls
            body: null,        // { lengthMm, widthMm } centred on the wheel midpoint; needed when obstacles or bounds are set
            contact: '',       // which obstacle stopped the robot
            contactMode: 'pause',   // 'pause' = a ticked model stops the run; 'push' = it pushes the robot aside (the robot slides)
            pushedMm: 0,       // how far models have pushed the robot this run (push mode)
            clearance: {},     // closest approach so far this run: { name: { mm, timeS, pose, step } } (walls and ticked obstacles)
            turns: [],         // finished in-place spins this run (see trackSpin)
            spin: null,        // the spin in progress
        };
    }

    /** Corners of the robot body (centred on the wheel midpoint; no body offset yet) */
    function bodyCorners(pose, body) {
        const h = pose.headingDeg * Math.PI / 180, c = Math.cos(h), s = Math.sin(h);
        const l = body.lengthMm / 2, w = body.widthMm / 2, off = body.offsetMm || 0;
        return [[l, w], [-l, w], [-l, -w], [l, -w]].map(([f, side]) => [pose.x + (f + off) * c - side * s, pose.y + (f + off) * s + side * c]);
    }

    /**
     * Every convex piece of the robot's footprint: the body box ('box'), plus any attachment rectangles in
     * body.parts = [{ name, front, back, left, right }] (mm from the centre of the body box: front/back along the
     * heading, left/right sideways, left positive). body.offsetMm (default 0, not measured yet) is how far the box
     * centre sits ahead of the wheel midpoint (minus = behind); the box and its parts move together.
     * Returns [{ name, poly }].
     */
    function bodyPolys(pose, body) {
        const h = pose.headingDeg * Math.PI / 180, c = Math.cos(h), s = Math.sin(h);
        const off = body.offsetMm || 0;
        const at = (f, side) => [pose.x + (f + off) * c - side * s, pose.y + (f + off) * s + side * c];
        const out = [{ name: 'box', poly: bodyCorners(pose, body) }];
        for (const p of body.parts || []) out.push({ name: p.name, poly: [at(p.front, p.left), at(p.back, p.left), at(p.back, p.right), at(p.front, p.right)] });
        return out;
    }
    const allPoints = (polys) => polys.flatMap((p) => p.poly);

    /** Separating-axis test for two convex polygons (touching counts as overlap) */
    function convexOverlap(a, b) {
        for (const poly of [a, b]) {
            for (let i = 0; i < poly.length; i++) {
                const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
                const nx = y1 - y2, ny = x2 - x1;
                const span = (p) => p.map(([x, y]) => x * nx + y * ny);
                const pa = span(a), pb = span(b);
                if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
            }
        }
        return true;
    }

    /** Name of the wall or obstacle the robot body touches, or ''. A body corner exactly on a wall is still inside. */
    function touching(sim) {
        if (!sim.body || (!sim.obstacles.length && !sim.bounds)) return '';
        const polys = bodyPolys(sim.pose, sim.body);
        const b = sim.bounds;
        if (b) {
            const pts = allPoints(polys), xs = pts.map((c) => c[0]), ys = pts.map((c) => c[1]);
            if (Math.min(...xs) < b.minX) return 'the left table wall';
            if (Math.max(...xs) > b.maxX) return 'the right table wall';
            if (Math.min(...ys) < b.minY) return 'the bottom table wall';
            if (Math.max(...ys) > b.maxY) return 'the top table wall';
        }
        const hit = sim.obstacles.find((o) => polys.some((r) => convexOverlap(r.poly, o.poly)));
        return hit ? hit.name : '';
    }

    /** Smallest push that separates convex polygon a from b (separating-axis test), as { dx, dy } moving a; null if apart */
    function separation(a, b) {
        let best = null;
        const centre = (p) => [p.reduce((t, q) => t + q[0], 0) / p.length, p.reduce((t, q) => t + q[1], 0) / p.length];
        const [ca, cb] = [centre(a), centre(b)];
        for (const poly of [a, b]) {
            for (let i = 0; i < poly.length; i++) {
                const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
                let nx = y1 - y2, ny = x2 - x1;
                const len = Math.hypot(nx, ny);
                if (!len) continue;
                nx /= len; ny /= len;
                const pa = a.map(([x, y]) => x * nx + y * ny), pb = b.map(([x, y]) => x * nx + y * ny);
                const overlap = Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb));
                if (overlap < 0) return null;
                if (!best || overlap < best.depth) {
                    const sign = (ca[0] - cb[0]) * nx + (ca[1] - cb[1]) * ny < 0 ? -1 : 1;
                    best = { depth: overlap, dx: sign * nx, dy: sign * ny };
                }
            }
        }
        return best && { dx: best.dx * (best.depth + 0.01), dy: best.dy * (best.depth + 0.01) };
    }

    /**
     * Push mode: move the robot out of every ticked model it overlaps (the model is fixed and does not move).
     * Rubber tyres grip sideways, so the robot is moved along its own forward/back line: the wheels slip, the gyro
     * still turns the robot. While it spins, that is the same as turning about a point on the wheel line, which is
     * how the team video's 15 cm backward creep in 'turn 67' looks. When the model presses on the robot's side (the
     * forward/back line cannot clear it), the robot is shoved sideways instead.
     * ponytail: no friction at the contact and no stalled encoders; real stalls stop the wheel count, here it keeps
     * counting. Returns false if it could not get clear.
     */
    function pushClear(sim) {
        for (let n = 0; n < 8; n++) {
            let moved = false;
            const h = sim.pose.headingDeg * Math.PI / 180, fx = Math.cos(h), fy = Math.sin(h);
            for (const o of sim.obstacles) {
                for (const r of bodyPolys(sim.pose, sim.body)) {
                    const sep = separation(r.poly, o.poly);
                    if (!sep) continue;
                    const depth = Math.hypot(sep.dx, sep.dy), along = (sep.dx * fx + sep.dy * fy) / depth;
                    if (Math.abs(along) > 0.3) { sep.dx = fx * depth / along; sep.dy = fy * depth / along; }
                    sim.pose.x += sep.dx;
                    sim.pose.y += sep.dy;
                    sim.pushedMm += Math.hypot(sep.dx, sep.dy);
                    moved = true;
                }
            }
            if (!moved) return true;
        }
        return !touching(sim);
    }

    function setContactMode(sim, mode) {
        sim.contactMode = mode === 'push' ? 'push' : 'pause';
    }

    /** bounds (optional): the table interior rectangle { minX, minY, maxX, maxY } in mm; null/omitted = no walls */
    /** Shortest distance from point (px, py) to the segment a-b */
    function pointSegmentDist(px, py, [ax, ay], [bx, by]) {
        const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }

    /** Gap between two convex polygons that do not overlap (0 if they touch): the shortest corner-to-edge distance */
    function polygonGap(a, b) {
        let best = Infinity;
        for (const [p, q] of [[a, b], [b, a]]) {
            for (const [px, py] of p) {
                for (let i = 0; i < q.length; i++) best = Math.min(best, pointSegmentDist(px, py, q[i], q[(i + 1) % q.length]));
            }
        }
        return best;
    }

    /** What the program is doing now (its top-level block), for the closest-approach readout */
    function activeBlockLabel(sim) {
        const threads = (sim.program && sim.program.threads) || [];
        const t = threads.find((x) => !x.done && x.path && x.path.length);
        return t ? t.path[0] : '';
    }

    /** Remember the smallest gap to each wall and ticked obstacle. Called after every accepted step. */
    function updateClearance(sim) {
        if (!sim.body || (!sim.obstacles.length && !sim.bounds)) return;
        const polys = bodyPolys(sim.pose, sim.body), robot = allPoints(polys);
        const note = (name, mm) => {
            const old = sim.clearance[name];
            if (old && old.mm <= mm) return;
            sim.clearance[name] = { mm, timeS: sim.timeS, pose: { ...sim.pose }, block: activeBlockLabel(sim) };
        };
        const b = sim.bounds;
        if (b) {
            const xs = robot.map((c) => c[0]), ys = robot.map((c) => c[1]);
            note('the left table wall', Math.min(...xs) - b.minX);
            note('the right table wall', b.maxX - Math.max(...xs));
            note('the bottom table wall', Math.min(...ys) - b.minY);
            note('the top table wall', b.maxY - Math.max(...ys));
        }
        for (const o of sim.obstacles) note(o.name, Math.min(...polys.map((r) => polygonGap(r.poly, o.poly))));
    }

    const CORNERS = ['front-left corner', 'back-left corner', 'back-right corner', 'front-right corner'];   // bodyCorners order
    const SIDES = ['left side', 'back', 'right side', 'front'];   // edge i runs from corner i to corner i + 1

    /** The wall or ticked obstacle nearest the body now: { name, mm, part } (part = which corner or side), or null */
    function nearestThing(sim) {
        if (!sim.body || (!sim.obstacles.length && !sim.bounds)) return null;
        let best = null;
        const consider = (name, mm, part) => { if (!best || mm < best.mm) best = { name, mm, part }; };
        for (const { name: piece, poly: robot } of bodyPolys(sim.pose, sim.body)) {
            const corner = (i) => (piece === 'box' ? CORNERS[i] : piece), side = (j) => (piece === 'box' ? SIDES[j] : piece);
            const b = sim.bounds;
            if (b) {
                robot.forEach(([x, y], i) => {
                    consider('the left table wall', x - b.minX, corner(i));
                    consider('the right table wall', b.maxX - x, corner(i));
                    consider('the bottom table wall', y - b.minY, corner(i));
                    consider('the top table wall', b.maxY - y, corner(i));
                });
            }
            for (const o of sim.obstacles) {
                robot.forEach(([x, y], i) => o.poly.forEach((q, j) => consider(o.name, pointSegmentDist(x, y, q, o.poly[(j + 1) % o.poly.length]), corner(i))));
                o.poly.forEach(([x, y]) => robot.forEach((r, j) => consider(o.name, pointSegmentDist(x, y, r, robot[(j + 1) % robot.length]), side(j))));
            }
        }
        return best;
    }

    /**
     * In-place spins (wheels turning opposite ways), one record each in sim.turns: how far the robot turned, how far
     * its wheel midpoint moved (0 when the wheels are equal and opposite), how far the wheels rolled on average, and
     * the nearest wall or ticked model during the spin. Called after every accepted step with the values from before it.
     */
    function trackSpin(sim, leftPct, rightPct, before, encL0, encR0, t0) {
        const spinning = leftPct * rightPct < 0;
        if (spinning && !sim.spin) {
            sim.spin = { block: activeBlockLabel(sim), startS: t0, pose0: before, encL0, encR0, nearest: null };
        }
        if (!sim.spin) return;
        if (!spinning) {
            closeSpin(sim, before, encL0, encR0, t0);   // the spin ended before this step
            return;
        }
        const near = nearestThing(sim);
        if (near && (!sim.spin.nearest || near.mm < sim.spin.nearest.mm)) {
            sim.spin.nearest = { ...near, timeS: sim.timeS, pose: { ...sim.pose } };
        }
    }

    function closeSpin(sim, pose1, encL1, encR1, t1) {
        const s = sim.spin;
        sim.spin = null;
        const h = s.pose0.headingDeg * Math.PI / 180, dx = pose1.x - s.pose0.x, dy = pose1.y - s.pose0.y;
        const p = sim.profile;
        sim.turns.push({
            block: s.block, startS: s.startS, endS: t1,
            turnedDeg: pose1.headingDeg - s.pose0.headingDeg,              // + = counterclockwise (left), like heading
            forwardMm: dx * Math.cos(h) + dy * Math.sin(h),               // along the heading at the start: - = backward
            sideMm: -dx * Math.sin(h) + dy * Math.cos(h),                 // + = to the robot's left
            wheelForwardDeg: ((encL1 - s.encL0) * p.leftMotorSign + (encR1 - s.encR0) * p.rightMotorSign) / 2,   // motor deg, - = rolled back
            nearest: s.nearest,
        });
    }

    function setObstacles(sim, obstacles, body, bounds) {
        if (isActive(sim)) return ['Obstacles cannot change during a run.'];
        sim.obstacles = obstacles.map((o) => ({ name: o.name, poly: o.poly.map(([x, y]) => [x, y]) }));
        sim.body = body ? { lengthMm: body.lengthMm, widthMm: body.widthMm, offsetMm: body.offsetMm || 0, parts: (body.parts || []).map((p) => ({ ...p })) } : null;
        sim.bounds = bounds ? { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY } : null;
        sim.contact = '';
        sim.clearance = {};
        return [];
    }

    function startTouchingErrors(sim) {
        const name = touching(sim);
        return name ? [`The robot starts touching ${name}. Move it clear first.`] : [];
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
        const errors = validateProfile(sim.profile).concat(validateTest(leftPct, rightPct, durationS), startTouchingErrors(sim));
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
        const errors = validateProfile(sim.profile).concat(startTouchingErrors(sim));
        if (errors.length) return fail(sim, errors);
        runner.startTimeS = sim.timeS;
        sim.program = runner;
        sim.status = 'running';
        sim.fault = '';
        sim.contact = '';
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

    /**
     * Drive both wheels for dt; false (and fault) if the pose stops being a number.
     * If the body would touch an obstacle, the step is undone (last safe pose, no encoder or time change) and the run pauses.
     * A 5 ms step moves at most about 2 mm at 100%, far less than an obstacle is wide, so the robot cannot jump through one.
     */
    function advance(sim, leftPct, rightPct, dt, forcePath) {
        const p = sim.profile;
        const safe = { ...sim.pose };
        const encL0 = sim.encLeftDeg, encR0 = sim.encRightDeg, t0 = sim.timeS;
        const vL = wheelSpeedMmPerS(p, leftPct), vR = wheelSpeedMmPerS(p, rightPct);
        integrate(sim.pose, vL, vR, p.trackWidthMm, dt);
        let hit = touching(sim);
        if (hit && sim.contactMode === 'push' && !/table wall/.test(hit) && pushClear(sim)) hit = '';   // the model shoves the robot aside
        if (hit) {
            Object.assign(sim.pose, safe);
            sim.contact = `Robot body touched ${hit} at ${sim.timeS.toFixed(2)} s, so the run paused. Wheels were at ${leftPct.toFixed(0)}% / ${rightPct.toFixed(0)}%. Resume tries the same step again.`;
            sim.status = 'paused';
            return false;
        }
        sim.encLeftDeg += motorDegPerS(p, leftPct) * dt * p.leftMotorSign;
        sim.encRightDeg += motorDegPerS(p, rightPct) * dt * p.rightMotorSign;
        sim.timeS += dt;
        updateClearance(sim);
        trackSpin(sim, leftPct, rightPct, safe, encL0, encR0, t0);
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
        if (!advance(sim, t.leftPct, t.rightPct, dt, last)) return false;
        t.stepsDone++;
        if (last) {
            sim.test = null;
            sim.status = 'stopped';
            if (sim.spin) closeSpin(sim, { ...sim.pose }, sim.encLeftDeg, sim.encRightDeg, sim.timeS);
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
            if (sim.spin) closeSpin(sim, { ...sim.pose }, sim.encLeftDeg, sim.encRightDeg, sim.timeS);
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
    function resume(sim) {
        if (sim.status !== 'paused') return;
        sim.status = 'running';
        sim.contact = '';
    }

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
        Object.assign(sim, fresh, { obstacles: sim.obstacles, body: sim.body, bounds: sim.bounds, contactMode: sim.contactMode });
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
        resetGyro, gyroDeg, resetSim, placeRobot, setProfile, clearPath, setObstacles, setContactMode, touching, polygonGap, nearestThing, bodyPolys,
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = SimPhysics;
    else root.SimPhysics = SimPhysics;
})(this);
