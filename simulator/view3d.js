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
                d.obstacles.map((o) => o.poly)]);
            if (key !== fieldKey) {
                const first = !fieldKey;
                fieldKey = key;
                table = d.table;
                buildField(d);
                if (first) resetCamera();
            }
            const r = d.robot, rk = JSON.stringify([r.length, r.width, r.offset, r.trackWidth, r.wheelDiameter, r.parts]);
            if (rk !== robotKey) { robotKey = rk; buildRobot(r); }
            robot.position.copy(toV(r.x, r.y));
            robot.rotation.y = r.headingDeg * Math.PI / 180;
            const n = d.showPath ? d.path.length : 0;
            if (n !== pathLen) { pathLen = n; buildPath(d.showPath ? d.path : []); }
            draw();
        }

        resize();
        return { update, resize, resetCamera, canvas: renderer.domElement };
    }

    root.View3D = { create };
})(this);
