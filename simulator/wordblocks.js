/**
 * Runs SPIKE Word Blocks (from a .llsp3 project.json) against the simulator physics, one fixed step at a time.
 * No DOM; runs in the browser and in Node tests.
 *
 * Each physics step: every program thread runs until it has to wait (a wait block, the end of a loop
 * pass, a move that has not reached its distance), then physics moves the robot for one step.
 * So one loop pass takes one 5 ms step. The real hub's loop timing is not measured.
 *
 * Assumptions (not confirmed on the robot), shown in the UI:
 * - Port B turns the simulator's left wheel and port A the right wheel. This is the only layout that
 *   matches both records: pair BA drives forward and "turn 90" turns right.
 * - Pair AB therefore drives backward with left/right swapped (matches the record that AB drove backward).
 * - Yaw reads in 0.1° steps, clockwise +, wrapped to -180..180. Motor positions read in whole degrees.
 * - Speeds outside -100..100 % are clamped. Text or NaN speeds count as 0 (Scratch rule).
 */
(function (root) {
    'use strict';

    const APP_CM_PER_ROTATION = 17.5;  // SPIKE app's built-in guess for "move N cm" (see tools/sim_path.py)
    const DEFAULT_MOVE_SPEED = 50;     // [assumption] SPIKE default movement speed %
    const DEFAULT_MOTOR_SPEED = 75;    // [assumption] SPIKE default single-motor speed % (same as sim_path.py)
    const MAX_OPS_PER_STEP = 100000;
    const MAX_CALL_DEPTH = 50;
    const MATHOPS = {
        abs: Math.abs, floor: Math.floor, ceiling: Math.ceil, sqrt: Math.sqrt,
        sin: (x) => Math.sin(x * Math.PI / 180), cos: (x) => Math.cos(x * Math.PI / 180),
        tan: (x) => Math.tan(x * Math.PI / 180),
        asin: (x) => Math.asin(x) * 180 / Math.PI, acos: (x) => Math.acos(x) * 180 / Math.PI,
        atan: (x) => Math.atan(x) * 180 / Math.PI,
        ln: Math.log, log: Math.log10, 'e ^': Math.exp, '10 ^': (x) => Math.pow(10, x),
    };
    const BINARY = {
        operator_add: ['+', (a, b) => a + b], operator_subtract: ['-', (a, b) => a - b],
        operator_multiply: ['×', (a, b) => a * b], operator_divide: ['÷', (a, b) => a / b],
        operator_mod: ['mod', (a, b) => { const r = a % b; return r !== 0 && (r < 0) !== (b < 0) ? r + b : r; }],
    };

    class StopSignal {
        constructor(scope) { this.scope = scope; }
    }

    function toNumber(v) {
        if (typeof v === 'number') return Number.isNaN(v) ? 0 : v;
        const n = Number(v);
        return Number.isNaN(n) ? 0 : n;
    }

    /** Scratch comparison: numbers if both look like numbers, else case-insensitive text */
    function compare(a, b) {
        const na = Number(a), nb = Number(b);
        const blank = (v) => typeof v === 'string' && v.trim() === '';
        if (!Number.isNaN(na) && !Number.isNaN(nb) && !blank(a) && !blank(b)) return na - nb;
        const sa = String(a).toLowerCase(), sb = String(b).toLowerCase();
        return sa < sb ? -1 : sa > sb ? 1 : 0;
    }

    function fmt(n) {
        return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
    }

    // ------------------------------------------------------------------------
    // Compile: find definitions, start stacks, and labels
    // ------------------------------------------------------------------------

    function compileProgram(target) {
        const blocks = {};
        for (const [id, b] of Object.entries(target.blocks || {})) if (b && typeof b === 'object' && !Array.isArray(b)) blocks[id] = b;
        const defs = {};
        for (const b of Object.values(blocks)) {
            if (b.opcode !== 'procedures_definition') continue;
            const proto = blocks[b.inputs && b.inputs.custom_block && b.inputs.custom_block[1]];
            if (!proto || !proto.mutation) continue;
            let names = [];
            try { names = JSON.parse(proto.mutation.argumentnames || '[]'); } catch (e) { /* no args */ }
            defs[proto.mutation.proccode] = { bodyId: b.next, names, warp: String(proto.mutation.warp) === 'true' };
        }
        const program = { blocks, defs, stacks: [], variables: {}, emptyStarts: 0, looseStacks: 0 };
        for (const [id, v] of Object.entries(target.variables || {})) program.variables[id] = Array.isArray(v) ? v[1] : 0;
        for (const [id, b] of Object.entries(blocks)) {
            if (!b.topLevel) continue;
            if (b.opcode === 'flipperevents_whenProgramStarts') {
                if (!b.next) { program.emptyStarts++; continue; }
                const items = [];
                for (let n = b.next; n && blocks[n] && items.length < 10000; n = blocks[n].next) {
                    items.push({ id: n, label: describeStatement(program, n) });
                }
                program.stacks.push({ startId: id, items });
            } else if (b.opcode !== 'procedures_definition' && !b.shadow) {
                program.looseStacks++;
            }
        }
        return program;
    }

    /** Text for a reporter input, without running it */
    function describeInput(program, input) {
        if (!input) return '?';
        const ref = input[1] === null && input.length > 2 ? input[2] : input[1];
        if (Array.isArray(ref)) return ref[0] === 12 ? String(ref[1]) : String(ref[1]);
        const b = program.blocks[ref];
        if (!b) return '?';
        const inp = b.inputs || {};
        if (BINARY[b.opcode]) return `(${describeInput(program, inp.NUM1)} ${BINARY[b.opcode][0]} ${describeInput(program, inp.NUM2)})`;
        switch (b.opcode) {
            case 'argument_reporter_string_number': return b.fields.VALUE[0];
            case 'operator_mathop': return `${b.fields.OPERATOR[0]}(${describeInput(program, inp.NUM)})`;
            case 'operator_round': return `round(${describeInput(program, inp.NUM)})`;
            case 'operator_gt': return `${describeInput(program, inp.OPERAND1)} > ${describeInput(program, inp.OPERAND2)}`;
            case 'operator_lt': return `${describeInput(program, inp.OPERAND1)} < ${describeInput(program, inp.OPERAND2)}`;
            case 'operator_equals': return `${describeInput(program, inp.OPERAND1)} = ${describeInput(program, inp.OPERAND2)}`;
            case 'operator_and': return `(${describeInput(program, inp.OPERAND1)} and ${describeInput(program, inp.OPERAND2)})`;
            case 'operator_or': return `(${describeInput(program, inp.OPERAND1)} or ${describeInput(program, inp.OPERAND2)})`;
            case 'operator_not': return `not ${describeInput(program, inp.OPERAND)}`;
            case 'flippersensors_orientationAxis': return b.fields.AXIS[0];
            case 'flippermoremotor_position': return `position ${describeInput(program, inp.PORT)}`;
            case 'data_variable': return b.fields.VARIABLE[0];
        }
        if (b.fields && !Object.keys(inp).length && Object.keys(b.fields).length) return String(Object.values(b.fields)[0][0]);
        return b.opcode;
    }

    /** Descriptive Word Blocks text for a statement block */
    function describeStatement(program, id) {
        const b = program.blocks[id];
        const d = (name) => describeInput(program, (b.inputs || {})[name]);
        const unit = () => (b.fields && b.fields.UNIT ? b.fields.UNIT[0] : '');
        switch (b.opcode) {
            case 'procedures_call': {
                let text = b.mutation.proccode;
                let ids = [];
                try { ids = JSON.parse(b.mutation.argumentids || '[]'); } catch (e) { /* none */ }
                for (const argId of ids) text = text.replace('%s', describeInput(program, (b.inputs || {})[argId])).replace('%b', describeInput(program, (b.inputs || {})[argId]));
                return text;
            }
            case 'flippermove_setMovementPair': return `set movement motors to ${d('PAIR')}`;
            case 'flippermove_movementSpeed': return `set movement speed to ${d('SPEED')}%`;
            case 'flippermove_move': return `move ${d('DIRECTION')} for ${d('VALUE')} ${unit()}`;
            case 'flippermove_stopMove': return 'stop moving';
            case 'flippermoremove_startDualSpeed': return `start moving at left ${d('LEFT')}% right ${d('RIGHT')}%`;
            case 'flippersensors_resetYaw': return 'set yaw angle to 0';
            case 'flippermoremotor_motorSetDegreeCounted': return `set relative position of ${d('PORT')} to ${d('VALUE')}`;
            case 'flippermotor_motorSetSpeed': return `set ${d('PORT')} speed to ${d('SPEED')}%`;
            case 'flippermotor_motorTurnForDirection': return `${d('PORT')} run ${d('DIRECTION')} for ${d('VALUE')} ${unit()}`;
            case 'control_wait': return `wait ${d('DURATION')} seconds`;
            case 'control_wait_until': return `wait until ${d('CONDITION')}`;
            case 'control_repeat': return `repeat ${d('TIMES')}`;
            case 'control_repeat_until': return `repeat until ${d('CONDITION')}`;
            case 'control_forever': return 'forever';
            case 'control_if': return `if ${d('CONDITION')} then`;
            case 'control_if_else': return `if ${d('CONDITION')} then / else`;
            case 'data_setvariableto': return `set ${b.fields.VARIABLE[0]} to ${d('VALUE')}`;
            case 'data_changevariableby': return `change ${b.fields.VARIABLE[0]} by ${d('VALUE')}`;
            case 'flippercontrol_stop':
            case 'control_stop': return `stop ${b.fields && b.fields.STOP_OPTION ? b.fields.STOP_OPTION[0] : ''}`.trim();
        }
        return b.opcode;
    }

    // ------------------------------------------------------------------------
    // Runner
    // ------------------------------------------------------------------------

    /**
     * options.plainMoveMode: 'commanded' (move N cm drives N cm) or 'app-guess'
     *   (the app turns cm into motor turns with its 17.5 cm guess; with a bigger wheel the robot goes further).
     * options.onTopBlock(threadIndex, itemIndex): called when a main-stack block starts.
     * options.turnOvershootDeg: estimate, default 0. When "stop moving" ends an in-place spin (wheels turning opposite
     *   ways), the robot keeps spinning this many more degrees before it stops.
     */
    function createRunner(program, options = {}) {
        const blocks = program.blocks;
        const runner = {
            leftPct: 0, rightPct: 0, fault: '', startTimeS: 0,
            pair: null, moveSpeed: DEFAULT_MOVE_SPEED,
            motorSpeed: {}, attachment: {}, zero: { A: 0, B: 0 }, yawRefDeg: null, timerStartS: null,
            variables: { ...program.variables },
            notes: [],
            threads: [],
            plainMoveMode: options.plainMoveMode === 'app-guess' ? 'app-guess' : 'commanded',
            turnOvershootDeg: Number.isFinite(options.turnOvershootDeg) && options.turnOvershootDeg > 0 ? options.turnOvershootDeg : 0,
            onTopBlock: options.onTopBlock || null,
            tick, wordYaw, portPosition,
        };
        let sim = null;
        let ops = 0;
        const noted = new Set();

        function note(text) {
            if (noted.has(text)) return;
            noted.add(text);
            runner.notes.push({ timeS: sim ? sim.timeS - runner.startTimeS : 0, text });
        }

        function clampSpeed(v) {
            const n = toNumber(v);
            if (n > 100 || n < -100) note(`speed ${fmt(n)}% clamped to ±100% (assumed hub behaviour)`);
            return Math.max(-100, Math.min(100, n));
        }

        // ---- robot I/O -------------------------------------------------------

        /** Word Blocks yaw: clockwise +, -180..180, 0.1° steps (assumed) */
        function wordYaw() {
            const ref = runner.yawRefDeg === null ? sim.gyroRefDeg : runner.yawRefDeg;
            let y = -(sim.pose.headingDeg - ref);
            y = ((y + 180) % 360 + 360) % 360 - 180;
            if (y === -180) y = 180;
            return Math.round(y * 10) / 10;
        }

        function nativeDeg(port) {
            if (port === 'B') return sim.encLeftDeg;   // assumption: B = left wheel
            if (port === 'A') return sim.encRightDeg;
            return runner.attachment[port] || 0;
        }

        function portPosition(port) {
            return Math.round(nativeDeg(port) - (runner.zero[port] || 0));
        }

        /** Word Blocks left/right % for the current movement pair -> simulator wheels */
        function setDrive(left, right) {
            const pair = runner.pair || 'BA';
            if (!runner.pair) note('no "set movement motors" block before driving: treated as BA');
            if (pair === 'BA') { runner.leftPct = left; runner.rightPct = right; }
            else if (pair === 'AB') { runner.leftPct = -right; runner.rightPct = -left; }
            else { note(`movement motors ${pair}: only BA and AB are simulated, robot not moved`); runner.leftPct = 0; runner.rightPct = 0; }
        }

        function motorDegPerCm() {
            const p = sim.profile;
            return runner.plainMoveMode === 'app-guess'
                ? 360 / APP_CM_PER_ROTATION
                : 360 * p.gearRatio / (Math.PI * p.wheelDiameterMm / 10);
        }

        // ---- expressions -----------------------------------------------------

        function evalInput(input, ctx) {
            if (!input) return '';
            const ref = input[1] === null && input.length > 2 ? input[2] : input[1];
            if (Array.isArray(ref)) return ref[0] === 12 ? runner.variables[ref[2]] : ref[1];
            return evalBlock(ref, ctx);
        }

        function num(b, name, ctx) { return toNumber(evalInput((b.inputs || {})[name], ctx)); }
        function truthy(v) { return v === true || v === 'true' || (typeof v === 'number' && v !== 0); }

        function evalBlock(id, ctx) {
            const b = blocks[id];
            if (!b) return '';
            if (++ops > MAX_OPS_PER_STEP) throw new Error('A loop ran 100000 blocks without waiting. It may never end.');
            const inp = b.inputs || {};
            if (BINARY[b.opcode]) return BINARY[b.opcode][1](num(b, 'NUM1', ctx), num(b, 'NUM2', ctx));
            switch (b.opcode) {
                case 'argument_reporter_string_number':
                case 'argument_reporter_boolean': {
                    const v = ctx.args[b.fields.VALUE[0]];
                    return v === undefined ? '' : v;
                }
                case 'operator_mathop': {
                    const f = MATHOPS[b.fields.OPERATOR[0]];
                    if (!f) { note(`math "${b.fields.OPERATOR[0]}" not simulated (used 0)`); return 0; }
                    return f(num(b, 'NUM', ctx));
                }
                case 'operator_round': return Math.round(num(b, 'NUM', ctx));
                case 'operator_gt': return compare(evalInput(inp.OPERAND1, ctx), evalInput(inp.OPERAND2, ctx)) > 0;
                case 'operator_lt': return compare(evalInput(inp.OPERAND1, ctx), evalInput(inp.OPERAND2, ctx)) < 0;
                case 'operator_equals': return compare(evalInput(inp.OPERAND1, ctx), evalInput(inp.OPERAND2, ctx)) === 0;
                case 'operator_and': return truthy(evalInput(inp.OPERAND1, ctx)) && truthy(evalInput(inp.OPERAND2, ctx));
                case 'operator_or': return truthy(evalInput(inp.OPERAND1, ctx)) || truthy(evalInput(inp.OPERAND2, ctx));
                case 'operator_not': return !truthy(evalInput(inp.OPERAND, ctx));
                case 'operator_join': return String(evalInput(inp.STRING1, ctx)) + String(evalInput(inp.STRING2, ctx));
                case 'flippersensors_orientationAxis': {
                    const axis = b.fields.AXIS[0];
                    return axis === 'yaw' ? wordYaw() : 0;   // flat table: pitch and roll are 0
                }
                case 'flippermoremotor_position': return portPosition(String(evalInput(inp.PORT, ctx)));
                case 'flippersensors_timer': return sim.timeS - (runner.timerStartS === null ? runner.startTimeS : runner.timerStartS);
                case 'data_variable': return runner.variables[b.fields.VARIABLE[1]];
            }
            // Menu shadows (port, direction, pair pickers) hold their value in a field
            if (b.fields && !Object.keys(inp).length && Object.keys(b.fields).length) return Object.values(b.fields)[0][0];
            note(`not simulated: ${b.opcode} (used 0)`);
            return 0;
        }

        // ---- statements ------------------------------------------------------

        function* runStack(id, ctx, thread, top) {
            while (id && blocks[id]) {
                if (top) {
                    thread.topIndex = thread.itemIndex.get(id);
                    if (runner.onTopBlock) runner.onTopBlock(thread.index, thread.topIndex);
                }
                thread.path.push(describeStatement(program, id));
                try {
                    yield* exec(id, ctx, thread);
                } finally {
                    thread.path.pop();
                }
                id = blocks[id].next;
            }
        }

        function* loopPass(ctx) {
            if (++ops > MAX_OPS_PER_STEP) throw new Error('A loop ran 100000 blocks without waiting. It may never end.');
            if (!ctx.warp) yield;
        }

        function* exec(id, ctx, thread) {
            const b = blocks[id];
            const inp = b.inputs || {};
            const sub = (name) => (inp[name] ? inp[name][1] : null);
            if (++ops > MAX_OPS_PER_STEP) throw new Error('A loop ran 100000 blocks without waiting. It may never end.');
            switch (b.opcode) {
                case 'flippermove_setMovementPair':
                    runner.pair = String(evalInput(inp.PAIR, ctx));
                    return;
                case 'flippermove_movementSpeed':
                    runner.moveSpeed = clampSpeed(num(b, 'SPEED', ctx));
                    return;
                case 'flippermove_stopMove':
                    yield* overshootSpin();
                    setDrive(0, 0);
                    return;
                case 'flippermoremove_startDualSpeed':
                    setDrive(clampSpeed(num(b, 'LEFT', ctx)), clampSpeed(num(b, 'RIGHT', ctx)));
                    return;
                case 'flippersensors_resetYaw':
                    runner.yawRefDeg = sim.pose.headingDeg;
                    return;
                case 'flippersensors_resetTimer':
                    runner.timerStartS = sim.timeS;
                    return;
                case 'flippermoremotor_motorSetDegreeCounted': {
                    const value = num(b, 'VALUE', ctx);
                    for (const port of String(evalInput(inp.PORT, ctx))) runner.zero[port] = nativeDeg(port) - value;
                    return;
                }
                case 'flippermove_move': {
                    yield* move(b, ctx);
                    return;
                }
                case 'control_wait': {
                    const end = sim.timeS + num(b, 'DURATION', ctx);
                    do { yield; } while (sim.timeS < end - 1e-9);
                    return;
                }
                case 'control_wait_until':
                    while (!truthy(evalInput(inp.CONDITION, ctx))) yield;
                    return;
                case 'control_repeat': {
                    const times = Math.round(num(b, 'TIMES', ctx));
                    for (let i = 0; i < times; i++) {
                        thread.path[thread.path.length - 1] = `${describeStatement(program, id)} (pass ${i + 1} of ${times})`;
                        yield* runStack(sub('SUBSTACK'), ctx, thread, false);
                        yield* loopPass(ctx);
                    }
                    return;
                }
                case 'control_repeat_until':
                    while (!truthy(evalInput(inp.CONDITION, ctx))) {
                        yield* runStack(sub('SUBSTACK'), ctx, thread, false);
                        yield* loopPass(ctx);
                    }
                    return;
                case 'control_forever':
                    for (;;) {
                        yield* runStack(sub('SUBSTACK'), ctx, thread, false);
                        yield* loopPass(ctx);
                    }
                case 'control_if':
                    if (truthy(evalInput(inp.CONDITION, ctx))) yield* runStack(sub('SUBSTACK'), ctx, thread, false);
                    return;
                case 'control_if_else':
                    yield* runStack(sub(truthy(evalInput(inp.CONDITION, ctx)) ? 'SUBSTACK' : 'SUBSTACK2'), ctx, thread, false);
                    return;
                case 'procedures_call': {
                    const def = program.defs[b.mutation.proccode];
                    if (!def) { note(`My Block "${b.mutation.proccode}" has no definition: skipped`); return; }
                    if (ctx.depth >= MAX_CALL_DEPTH) throw new Error(`My Block "${b.mutation.proccode}" calls itself too deep.`);
                    let ids = [];
                    try { ids = JSON.parse(b.mutation.argumentids || '[]'); } catch (e) { /* none */ }
                    const args = {};
                    def.names.forEach((name, i) => { args[name] = evalInput(inp[ids[i]], ctx); });
                    yield* runStack(def.bodyId, { args, warp: ctx.warp || def.warp, depth: ctx.depth + 1 }, thread, false);
                    return;
                }
                case 'procedures_definition':
                case 'flipperevents_whenProgramStarts':
                    return;
                case 'data_setvariableto':
                    runner.variables[b.fields.VARIABLE[1]] = evalInput(inp.VALUE, ctx);
                    return;
                case 'data_changevariableby':
                    runner.variables[b.fields.VARIABLE[1]] = toNumber(runner.variables[b.fields.VARIABLE[1]]) + num(b, 'VALUE', ctx);
                    return;
                case 'flippermotor_motorSetSpeed': {
                    const speed = clampSpeed(num(b, 'SPEED', ctx));
                    for (const port of String(evalInput(inp.PORT, ctx))) runner.motorSpeed[port] = speed;
                    return;
                }
                case 'flippermotor_motorTurnForDirection':
                    yield* motorTurn(b, ctx);
                    return;
                case 'flippercontrol_stop':
                case 'control_stop': {
                    const option = b.fields && b.fields.STOP_OPTION ? b.fields.STOP_OPTION[0] : 'all';
                    throw new StopSignal(option === 'this script' ? 'this' : option === 'other scripts in sprite' ? 'others' : 'all');
                }
            }
            note(`not simulated: ${b.opcode} (skipped)`);
        }

        /**
         * Turn-overshoot setting: after an in-place spin, keep the wheels turning until the robot has turned
         * runner.turnOvershootDeg more. ponytail: the program waits for this coast, so the next block (often a
         * yaw reset) starts after it; on the hub the next block starts at once. Upgrade once a mat test measures the coast.
         */
        function* overshootSpin() {
            const k = runner.turnOvershootDeg;
            if (!k || !(runner.leftPct * runner.rightPct < 0)) return;
            note(`turn overshoot: each in-place turn goes ${fmt(k)}° further after "stop moving" (estimate setting)`);
            const start = sim.pose.headingDeg;
            do { yield; } while (Math.abs(sim.pose.headingDeg - start) < k);
        }

        function* move(b, ctx) {
            const direction = String(evalInput(b.inputs.DIRECTION, ctx));
            const unit = b.fields.UNIT[0];
            let amount = num(b, 'VALUE', ctx);
            let sign = direction === 'forward' ? 1 : direction === 'back' ? -1 : 0;
            if (!sign) { note(`move ${direction}: only forward/back are simulated (skipped)`); return; }
            if (amount < 0) { sign = -sign; amount = -amount; }
            if (amount === 0) return;
            const speed = Math.abs(runner.moveSpeed);
            if (speed === 0) throw new Error('A move block ran at speed 0, so it would never finish.');
            const perUnit = { cm: motorDegPerCm(), inches: 2.54 * motorDegPerCm(), rotations: 360, degrees: 1 }[unit];
            setDrive(sign * speed, sign * speed);
            if (unit === 'seconds') {
                const end = sim.timeS + amount;
                do { yield; } while (sim.timeS < end - 1e-9);
            } else if (perUnit) {
                const target = amount * perUnit;
                const l0 = sim.encLeftDeg, r0 = sim.encRightDeg;
                while ((Math.abs(sim.encLeftDeg - l0) + Math.abs(sim.encRightDeg - r0)) / 2 < target) yield;
            } else {
                note(`move unit "${unit}" not simulated (skipped)`);
            }
            setDrive(0, 0);
        }

        function* motorTurn(b, ctx) {
            const ports = String(evalInput(b.inputs.PORT, ctx));
            const direction = String(evalInput(b.inputs.DIRECTION, ctx));
            const unit = b.fields.UNIT[0];
            let amount = num(b, 'VALUE', ctx);
            let sign = direction === 'clockwise' ? 1 : direction === 'counterclockwise' ? -1 : 0;
            if (!sign) { note(`motor ${ports} direction "${direction}" not simulated (skipped)`); return; }
            if (/[AB]/.test(ports)) { note(`motor ${ports} run on its own: drive motors run alone are not simulated (skipped)`); return; }
            if (amount < 0) { sign = -sign; amount = -amount; }
            const p = ports[0];
            const speed = Math.abs(runner.motorSpeed[p] === undefined ? DEFAULT_MOTOR_SPEED : runner.motorSpeed[p]);
            const degPerS = speed / 100 * sim.profile.maxMotorDegPerS;
            if (degPerS === 0) { note(`motor ${ports} at speed 0: skipped`); return; }
            const total = unit === 'seconds' ? degPerS * amount : unit === 'rotations' ? amount * 360 : unit === 'degrees' ? amount : null;
            if (total === null) { note(`motor unit "${unit}" not simulated (skipped)`); return; }
            const start = {};
            for (const port of ports) start[port] = runner.attachment[port] || 0;
            const t0 = sim.timeS;
            let done = 0;
            while (done < total - 1e-9) {
                yield;
                done = Math.min(total, degPerS * (sim.timeS - t0));
                for (const port of ports) runner.attachment[port] = start[port] + sign * done;
            }
        }

        // ---- scheduler -------------------------------------------------------

        /** One physics step of program time. Returns false when every thread has finished. */
        function tick(s) {
            sim = s;
            ops = 0;
            if (!runner.threads.length) {
                program.stacks.forEach((stack, index) => {
                    const thread = { index, path: [], topIndex: -1, done: false, itemIndex: new Map(stack.items.map((it, i) => [it.id, i])) };
                    thread.gen = runStack(blocks[stack.startId].next, { args: {}, warp: false, depth: 0 }, thread, true);
                    runner.threads.push(thread);
                });
                if (!runner.threads.length) return false;
            }
            for (const thread of runner.threads) {
                if (thread.done) continue;
                try {
                    if (thread.gen.next().done) thread.done = true;
                } catch (e) {
                    if (e instanceof StopSignal) {
                        if (e.scope === 'this') thread.done = true;
                        else if (e.scope === 'others') runner.threads.forEach((t) => { if (t !== thread) t.done = true; });
                        else runner.threads.forEach((t) => { t.done = true; });
                    } else {
                        runner.fault = e.message || String(e);
                        return false;
                    }
                }
                if (thread.done) thread.path = [];
            }
            return runner.threads.some((t) => !t.done);
        }

        return runner;
    }

    const WordBlocks = { compileProgram, createRunner, describeStatement, APP_CM_PER_ROTATION };
    if (typeof module !== 'undefined' && module.exports) module.exports = WordBlocks;
    else root.WordBlocks = WordBlocks;
})(this);
