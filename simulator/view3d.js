/**
 * 3D view of the same simulation the 2D canvas shows (no physics here: it only draws).
 * Uses three.js r147 from vendor/ (global THREE, THREE.OrbitControls). World mm map to three.js units as
 * x = world x, y = height above the table, z = -world y, so the table's bottom wall is nearest the camera.
 * Heights are not measured: walls 76 mm, models 120 mm, robot body 110 mm (look only, not used by the physics).
 */
(function (root) {
    'use strict';

    const WALL_H = 76, MODEL_H = 120, BODY_H = 110, PUSHER_H = 40;
    const toV = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

    function create(container) {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('role', 'img');
        renderer.domElement.setAttribute('aria-label', '3D view of the robot game table, the robot and the path it drove. Drag to look around.');

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0a0a1a');
        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const sun = new THREE.DirectionalLight(0xffffff, 0.6);
        sun.position.set(800, 2500, 1200);
        scene.add(sun);

        const camera = new THREE.PerspectiveCamera(40, 1, 10, 30000);
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI / 2 - 0.05;   // stay above the table
        controls.addEventListener('change', draw);

        const fieldGroup = new THREE.Group();   // table, walls, mat, models: rebuilt only when they change
        const robot = new THREE.Group();
        const pathMat = new THREE.MeshBasicMaterial({ color: 0xfeca57, side: THREE.DoubleSide });
        let path = null, fieldKey = '', robotKey = '', pathLen = -1, frame = 0, table = { w: 2362.2, h: 1143 };
        scene.add(fieldGroup, robot);

        function draw() {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera); });
        }

        function resize() {
            const w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            draw();
        }

        function resetCamera() {
            camera.position.set(table.w / 2, 1700, 1250);   // above and in front of the bottom wall
            controls.target.set(table.w / 2, 0, -table.h / 2);
            controls.update();
            draw();
        }

        function clear(group) {
            for (const o of [...group.children]) {
                group.remove(o);
                o.traverse((c) => {
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
                });
            }
        }

        function box(w, h, d, color, opts = {}) {
            return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, ...opts }));
        }

        function buildField(d) {
            clear(fieldGroup);
            const { w, h } = d.table;
            const floor = box(w, 4, h, 0x2a2a3a);
            floor.position.set(w / 2, -2, -h / 2);
            fieldGroup.add(floor);
            const wood = 0xc8a46e, t = 19;
            for (const [x, z, sx, sz] of [[w / 2, t / 2, w + 2 * t, t], [w / 2, -h - t / 2, w + 2 * t, t], [-t / 2, -h / 2, t, h], [w + t / 2, -h / 2, t, h]]) {
                const wall = box(sx, WALL_H, sz, wood);
                wall.position.set(x, WALL_H / 2, z);
                fieldGroup.add(wall);
            }

            // The mat (light blue when there is no picture), then the picture on top, both turned with the mat
            const mat = new THREE.Group();
            mat.position.set(d.mat.x + d.mat.w / 2, 0, -(d.mat.y + d.mat.h / 2));
            mat.rotation.y = -d.mat.rotationDeg * Math.PI / 180;   // the 2D view turns the mat screen-clockwise
            const base = new THREE.Mesh(new THREE.PlaneGeometry(d.mat.w, d.mat.h), new THREE.MeshLambertMaterial({ color: 0x9fb8c0 }));
            base.rotation.x = -Math.PI / 2;
            base.position.y = 0.5;
            mat.add(base);
            const bg = d.background;
            if (bg) {
                const c = document.createElement('canvas');
                const turned = bg.orientation % 180 !== 0;
                const k = Math.min(1, 4096 / Math.max(bg.crop.w, bg.crop.h));
                c.width = Math.round((turned ? bg.crop.h : bg.crop.w) * k);
                c.height = Math.round((turned ? bg.crop.w : bg.crop.h) * k);
                const g = c.getContext('2d');
                g.translate(c.width / 2, c.height / 2);
                g.rotate(bg.orientation * Math.PI / 180);
                g.drawImage(bg.image, bg.crop.x, bg.crop.y, bg.crop.w, bg.crop.h, -bg.crop.w * k / 2, -bg.crop.h * k / 2, bg.crop.w * k, bg.crop.h * k);
                const tex = new THREE.CanvasTexture(c);
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
                const pic = new THREE.Mesh(new THREE.PlaneGeometry(bg.fitW, bg.fitH),
                    new THREE.MeshBasicMaterial({ map: tex, transparent: bg.opacity < 1, opacity: bg.opacity }));
                pic.rotation.x = -Math.PI / 2;
                pic.position.y = 1;
                mat.add(pic);
            }
            fieldGroup.add(mat);

            for (const m of d.models || []) buildModel(m);

            for (const o of d.obstacles) {
                const shape = new THREE.Shape(o.poly.map(([x, y]) => new THREE.Vector2(x, y)));
                const geo = new THREE.ExtrudeGeometry(shape, { depth: MODEL_H, bevelEnabled: false });
                geo.rotateX(-Math.PI / 2);   // shape (x, y) lies on the table, the extrusion goes up
                const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xe94560, transparent: true, opacity: 0.45 }));
                fieldGroup.add(m);
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xe94560 }));
                fieldGroup.add(edges);
            }
        }

        // LEGO-style mission models (models3d.js), already in table mm: x, y on the mat, z up
        const studGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.8, 12);
        function lambert(color, opacity) {
            return new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity: opacity ?? 1 });
        }
        const movers = {};   // model key -> [{ obj, type, axis, sign, max, dir, dist, state, animate, value, target }]
        function buildModel(m) {
            const g = new THREE.Group();
            const groups = {};
            const old = movers[m.key] || [];
            movers[m.key] = (m.moves || []).map((mv, i) => {
                const inner = new THREE.Group();
                groups[mv.group] = inner;
                const prev = old[i] || { value: 0, target: 0 };
                if (mv.type === 'slide') {   // parts that slide (the leafcutter's ant and rack)
                    g.add(inner);
                    const dir = new THREE.Vector3(mv.dir[0], 0, -mv.dir[1]);
                    const it = { obj: inner, type: 'slide', dir, dist: mv.dist, state: mv.state, animate: mv.animate, value: prev.value, target: prev.target };
                    inner.position.copy(dir).multiplyScalar(mv.dist * it.value);
                    return it;
                }
                // parts that swing about a hinge line (Mission 11's root cover, the mycelium arm)
                const a = toV(mv.a[0], mv.a[1], mv.az), b = toV(mv.b[0], mv.b[1], mv.bz);
                const axis = b.clone().sub(a).normalize();
                const toward = new THREE.Vector3(mv.toward[0], 0, -mv.toward[1]);
                const sign = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).dot(toward) >= 0 ? 1 : -1;   // the top swings towards 'toward'
                const pivot = new THREE.Group();
                pivot.position.copy(a);
                inner.position.copy(a).multiplyScalar(-1);
                pivot.add(inner);
                g.add(pivot);
                const it = { obj: pivot, type: 'hinge', axis, sign, max: mv.max, state: mv.state, animate: mv.animate, value: prev.value, target: prev.target };
                pivot.setRotationFromAxisAngle(axis, sign * mv.max * it.value);
                return it;
            });
            for (const p of m.pieces) {
                const parent = (p.group && groups[p.group]) || g;
                if (p.kind === 'prism') {
                    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(p.poly.map(([x, y]) => new THREE.Vector2(x, y))), { depth: p.z1 - p.z0, bevelEnabled: false });
                    geo.rotateX(-Math.PI / 2);
                    const mesh = new THREE.Mesh(geo, lambert(p.color, p.opacity));
                    mesh.position.y = p.z0;
                    parent.add(mesh);
                } else if (p.kind === 'cyl') {
                    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r2, p.r, p.z1 - p.z0, 20), lambert(p.color));
                    mesh.position.copy(toV(p.c[0], p.c[1], (p.z0 + p.z1) / 2));
                    parent.add(mesh);
                } else if (p.kind === 'disc') {   // a wheel standing on edge, its axle along p.axis (a unit vector on the mat)
                    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.thick, 24), lambert(p.color));
                    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(p.axis[0], 0, -p.axis[1]));
                    mesh.position.copy(toV(p.c[0], p.c[1], p.z));
                    parent.add(mesh);
                } else if (p.kind === 'sphere') {
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 16, 12), lambert(p.color));
                    mesh.position.copy(toV(p.c[0], p.c[1], p.z));
                    parent.add(mesh);
                } else if (p.kind === 'beam') {   // a bar from a to b; flatten = a thin slab (leaves), facing along p.along
                    const a = toV(p.a[0], p.a[1], p.az), b = toV(p.b[0], p.b[1], p.bz), len = a.distanceTo(b);
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.flatten ? 2 : p.w, len, p.w), lambert(p.color));
                    mesh.position.copy(a).add(b).multiplyScalar(0.5);
                    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
                    if (p.along) mesh.rotateY(Math.atan2(p.along[1], p.along[0]));
                    parent.add(mesh);
                } else if (p.kind === 'studs') {
                    const inst = new THREE.InstancedMesh(studGeo, lambert(p.color), p.pts.length);
                    const mtx = new THREE.Matrix4();
                    p.pts.forEach(([x, y], i) => inst.setMatrixAt(i, mtx.makeTranslation(x, p.z + 0.9, -y)));
                    parent.add(inst);
                }
            }
            // floating label so kids can see which mission it is
            const c = document.createElement('canvas');
            c.width = 256; c.height = 96;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#1e8e3e';
            ctx.beginPath(); ctx.roundRect(4, 4, 248, 88, 44); ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(m.label, 128, 52);
            const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
            label.scale.set(120, 45, 1);
            label.position.copy(toV(m.labelAt[0], m.labelAt[1], m.labelZ || 170));
            g.add(label);
            fieldGroup.add(g);
        }

        let sweeperPivot = null;
        function buildRobot(r) {
            clear(robot);
            const body = box(r.length, BODY_H, r.width, 0xe94560);
            body.position.set(r.offset, BODY_H / 2 + 8, 0);
            robot.add(body);
            const hub = box(r.length * 0.55, 30, r.width * 0.6, 0xf2f2f2);
            hub.position.set(r.offset - r.length * 0.1, BODY_H + 8 + 15, 0);
            robot.add(hub);
            const nose = box(14, 14, r.width * 0.5, 0xfeca57);   // shows which way is forward
            nose.position.set(r.offset + r.length / 2 - 7, BODY_H + 8 + 7, 0);
            robot.add(nose);
            const wheelR = r.wheelDiameter / 2;
            for (const side of [1, -1]) {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, 18, 24), new THREE.MeshLambertMaterial({ color: 0x222222 }));
                wheel.rotation.x = Math.PI / 2;
                wheel.position.set(0, wheelR, side * (r.trackWidth / 2 + 9));
                robot.add(wheel);
            }
            sweeperPivot = null;
            if (r.sweeper) {   // IDEA, not built: a port C medium motor on a shelf off the top-front black frame, turning a beam with a finger
                const px = r.sweeper.pivotX, pz = 60, deck = BODY_H + 8;
                const shelf = box(px + 30 - 30, 8, 36, 0x1b2a34);   // two black beams reaching forward from the top-front frame
                shelf.scale.set(1, 1, 1);
                shelf.position.set((px + 30 + 30) / 2, deck + 4, pz);
                robot.add(shelf);
                const motor = box(56, 32, 48, 0x4a4f55);   // medium motor, roughly 5.6 x 4.8 cm and 3.2 cm tall, lying flat, shaft up
                motor.position.set(px, deck + 8 + 16, pz);
                robot.add(motor);
                const pivot = new THREE.Group();
                pivot.position.set(px, deck + 8 + 32 + 6, pz);
                const L = r.sweeper.beamLength;
                const beam = box(L + 8, 8, 8, 0x1b2a34);                    // black 15-hole liftarm, starts pointing straight back
                beam.position.set(-L / 2 + 4, 0, 0);
                const finger = box(8, r.sweeper.fingerLength, 8, 0x1b2a34); // second beam hanging down from the tip to near the mat
                finger.position.set(-L, -r.sweeper.fingerLength / 2, 0);
                const tip = box(10, 10, 10, 0xc91a09);                      // red end pin
                tip.position.set(-L, -r.sweeper.fingerLength, 0);
                pivot.add(beam, finger, tip);
                robot.add(pivot);
                sweeperPivot = pivot;
            }
            for (const p of r.parts) {   // attachments: front/back along the robot, left positive
                const part = box(p.front - p.back, PUSHER_H, p.left - p.right, 0x9a9a9a);
                part.position.set(r.offset + (p.front + p.back) / 2, PUSHER_H / 2 + 4, -(p.left + p.right) / 2);
                robot.add(part);
            }
        }

        // A flat stripe 14 mm wide (WebGL lines are always 1 pixel thin, too thin to see from far away)
        function buildPath(points) {
            if (path) { scene.remove(path); path.geometry.dispose(); }
            const pos = [], half = 7;
            for (let i = 1; i < points.length; i++) {
                const a = points[i - 1], b = points[i];
                if (!a || !b) continue;   // null = robot placed by hand: a gap
                const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
                if (!len) continue;
                const nx = -dy / len * half, ny = dx / len * half;
                const q = [[a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]].map(([x, y]) => [x, 3, -y]);
                pos.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            path = new THREE.Mesh(geo, pathMat);
            scene.add(path);
        }

        /** d: { table, mat, background, obstacles, robot, path, showPath } (see app.js) */
        function update(d) {
            const key = JSON.stringify([d.table, d.mat, d.background && [d.background.src, d.background.crop, d.background.orientation, d.background.opacity, d.background.fitW],
                d.obstacles.map((o) => o.poly), (d.models || []).map((m) => m.key)]);
            if (key !== fieldKey) {
                const first = !fieldKey;
                fieldKey = key;
                table = d.table;
                buildField(d);
                if (first) resetCamera();
            }
            const r = d.robot, rk = JSON.stringify([r.length, r.width, r.offset, r.trackWidth, r.wheelDiameter, r.parts, r.sweeper && [r.sweeper.pivotX, r.sweeper.beamLength]]);
            if (rk !== robotKey) { robotKey = rk; buildRobot(r); }
            robot.position.copy(toV(r.x, r.y));
            robot.rotation.y = r.headingDeg * Math.PI / 180;
            if (sweeperPivot) sweeperPivot.rotation.y = (r.sweeper.out ? -193 : -90) * Math.PI / 180;   // stowed: beam points left across the front; out: swung 103 degrees to point forward and a little right
            for (const list of Object.values(movers)) {
                for (const it of list) {
                    it.target = Math.max(0, Math.min(1, (d.modelState || {})[it.state] || 0));
                    if (!it.animate) { it.value = it.target; applyMove(it); }
                }
            }
            animateMoves();
            const n = d.showPath ? d.path.length : 0;
            if (n !== pathLen) { pathLen = n; buildPath(d.showPath ? d.path : []); }
            draw();
        }

        resize();
        function applyMove(it) {
            if (it.type === 'slide') it.obj.position.copy(it.dir).multiplyScalar(it.dist * it.value);
            else it.obj.setRotationFromAxisAngle(it.axis, it.sign * it.max * it.value);
        }

        // Animated moves (the Mission 11 cover falling) go to their target in about 0.4 s, then stop asking for frames
        let swinging = false, lastT = 0;
        function animateMoves() {
            if (swinging) return;
            const step = (t) => {
                const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
                lastT = t;
                let moving = false;
                for (const list of Object.values(movers)) {
                    for (const it of list) {
                        if (!it.animate || it.value === it.target) continue;
                        const diff = it.target - it.value, max = 2.5 * dt;
                        it.value = Math.abs(diff) <= max ? it.target : it.value + Math.sign(diff) * max;
                        applyMove(it);
                        moving = true;
                    }
                }
                renderer.render(scene, camera);
                if (moving) requestAnimationFrame(step); else { swinging = false; lastT = 0; }
            };
            swinging = true;
            requestAnimationFrame(step);
        }

        /** Look at table point (x, y) mm from about dist mm away, from the front-right */
        function focus(x, y, dist = 600) {
            controls.target.copy(toV(x, y, 40));
            camera.position.copy(toV(x + dist * 0.5, y - dist * 0.7, dist * 0.6));
            controls.update();
            draw();
        }

        return { update, resize, resetCamera, focus, canvas: renderer.domElement };
    }

    root.View3D = { create };
})(this);
