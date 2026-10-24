/**
 * Step pictures for arm-build.html: each step is a small 3D scene of the arm with the pieces added in that step
 * highlighted (orange glow). Drag a picture to turn it. Simple shapes, not official LEGO files; sizes are estimates.
 * x runs along the arm (pointing towards -x), y is up, z is across. 1 LEGO hole = 8 mm.
 */
(function () {
    'use strict';
    const DARK = 0x1b2a34, GREY = 0x6c6e68, LIGHT = 0xdcdcdc, BLUE = 0x2b6cb0, RED = 0xc91a09;

    const mat = (color, glow) => new THREE.MeshLambertMaterial({ color, emissive: glow ? 0xff8c00 : 0x000000, emissiveIntensity: glow ? 0.4 : 0 });
    function box(w, h, d, color, glow) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, glow)); }

    // Technic liftarm 1 x n, lying along x, middle at the origin
    function liftarm(n, color, glow) {
        const g = new THREE.Group(), len = n * 8, m = mat(color, glow);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(len - 8, 8, 8), m));
        for (const sx of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 8, 14), m); cap.position.x = sx * (len / 2 - 4); g.add(cap); }
        const hole = new THREE.MeshBasicMaterial({ color: 0x050505 });
        for (let i = 0; i < n; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 8.6, 10), hole); h.rotation.x = Math.PI / 2; h.position.x = -len / 2 + 4 + 8 * i; g.add(h); }
        return g;
    }
    function pin(color, glow) {   // connector pin through a hole, along z
        const g = new THREE.Group(), m = mat(color, glow);
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 16, 10), m));
        const head = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2, 10), m); head.position.y = 9; g.add(head);
        g.rotation.x = Math.PI / 2;
        return g;
    }
    function tag(text) {
        const c = document.createElement('canvas'); c.width = 96; c.height = 96;
        const g = c.getContext('2d');
        g.fillStyle = '#feca57'; g.beginPath(); g.arc(48, 48, 44, 0, 7); g.fill();
        g.lineWidth = 6; g.strokeStyle = '#1b2a34'; g.stroke();
        g.fillStyle = '#1b2a34'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 48, 52);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
        s.scale.set(22, 22, 1);
        return s;
    }

    const FINGER = 14;   // holes in the finger beam (the guide says to size it from the handle height)
    const tipX = -104;

    // Every piece, by name. make(glow) builds it; glow = highlighted as new in this step.
    const PIECE = {
        arm: { n: '2a', at: [-56, 14, 0], make: (g) => { const a = liftarm(15, DARK, g); a.position.set(-56, 0, 0); return a; } },
        L: { n: '4', at: [tipX + 30, 22, 0], make: (g) => {
            const o = new THREE.Group();
            const a = liftarm(5, GREY, g); a.position.set(tipX + 16, 8, 0); o.add(a);
            const b = liftarm(3, GREY, g); b.rotation.z = Math.PI / 2; b.position.set(tipX, -4, 0); o.add(b);
            for (const dx of [0, 8]) { const p = pin(BLUE, g); p.position.set(tipX + dx, 8, 6); o.add(p); }
            return o; } },
        finger: { n: '2b', at: [tipX - 22, -34, 8], make: (g) => {
            const o = new THREE.Group();
            const f = liftarm(FINGER, DARK, g); f.rotation.z = Math.PI / 2; f.position.set(tipX, -4 - (FINGER * 8) / 2 + 12, 8); o.add(f);
            for (const dy of [0, -8]) { const p = pin(BLUE, g); p.position.set(tipX, -4 + dy, 4); o.add(p); }
            return o; } },
        tip: { n: '7', at: [tipX - 22, -4 - FINGER * 8 + 22, 14], make: (g) => {
            const t = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 14, 12), mat(RED, g));
            t.rotation.x = Math.PI / 2; t.position.set(tipX, -4 - FINGER * 8 + 16, 10); return t; } },
        motor: { n: '1', at: [4, -76, 34], make: (g) => {
            const m = new THREE.Group();
            m.add(box(56, 32, 48, LIGHT, g));
            const s = box(58, 6, 50, 0x9a9a9a, g); s.position.y = 4; m.add(s);
            const cap = box(20, 6, 20, 0x333333, g); cap.position.y = 19; m.add(cap);
            const a1 = box(5, 12, 1.8, 0x111111, g), a2 = box(1.8, 12, 5, 0x111111, g); a1.position.y = a2.position.y = 25; m.add(a1, a2);
            m.position.set(0, -26, 0); return m; } },
        shaft: { n: '5', at: [16, -14, 18], make: (g) => {
            const gear = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 4, 20), mat(GREY, g)); gear.position.set(0, -6, 0); return gear; } },
        shaftPins: { n: '', at: null, make: (g) => {   // the two pins that hold the arm to the shaft piece
            const o = new THREE.Group();
            for (const dx of [0, -8]) { const p = pin(BLUE, g); p.position.set(dx, 2, 6); o.add(p); }
            return o; } },
        shelf: { n: '3', at: [-34, -64, 24], make: (g) => {
            const o = new THREE.Group();
            for (const dz of [-8, 8]) { const sh = liftarm(7, DARK, g); sh.position.set(-12, -46, dz); o.add(sh); }
            return o; } },
        brace: { n: '8', at: [-52, -84, 8], make: (g) => {
            const b = liftarm(5, GREY, g); b.rotation.z = Math.atan2(30, 40); b.position.set(-34, -64, -8); return b; } },
        robot: { n: '', at: null, make: (g) => {   // the robot's top-front-right corner, so the shelf has somewhere to sit
            const o = new THREE.Group();
            const body = box(200, 118, 168, 0xf4c9d0, g); body.position.set(-33 - 100, -50 - 59 - 4, -60); o.add(body);
            const frame = box(80, 12, 110, DARK, g); frame.position.set(-33 - 40 - 6, -50 - 6 - 4, -40); o.add(frame);
            return o; } },
    };

    // What each picture shows: [piece, new in this step?]
    const PICS = [
        { id: 'pic1', look: [-56, 0, 0], dist: 190, show: [['arm', 1], ['L', 1]] },
        { id: 'pic2', look: [-80, -50, 4], dist: 300, show: [['arm', 0], ['L', 0], ['finger', 1], ['tip', 1]] },
        { id: 'pic3', look: [0, -26, 0], dist: 210, show: [['motor', 1], ['shaft', 1]] },
        { id: 'pic4', look: [-50, -30, 0], dist: 230, show: [['motor', 0], ['shaft', 0], ['arm', 0], ['L', 0], ['finger', 0], ['tip', 0], ['shaftPins', 1]] },
        { id: 'pic5', look: [-30, -50, 0], dist: 200, show: [['motor', 0], ['shaft', 0], ['arm', 0], ['L', 0], ['finger', 0], ['tip', 0], ['shaftPins', 0], ['shelf', 1]] },
        { id: 'pic6', look: [-34, -60, 0], dist: 200, show: [['motor', 0], ['shaft', 0], ['arm', 0], ['L', 0], ['finger', 0], ['tip', 0], ['shaftPins', 0], ['shelf', 0], ['brace', 1]] },
        { id: 'pic7', look: [-110, -80, -30], dist: 420, show: [['motor', 0], ['shaft', 0], ['arm', 0], ['L', 0], ['finger', 0], ['tip', 0], ['shaftPins', 0], ['shelf', 0], ['brace', 0], ['robot', 0]] },
    ];

    function makeScene(pic, hostEl) {
        const w = hostEl.clientWidth || 420, h = 300;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        renderer.setClearColor(0xffffff);
        hostEl.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('role', 'img');
        renderer.domElement.setAttribute('aria-label', 'Build picture: drag to turn it');
        const scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(120, 260, 200); scene.add(sun);
        const camera = new THREE.PerspectiveCamera(32, w / h, 1, 3000);
        const target = new THREE.Vector3(...pic.look);
        camera.position.set(target.x - pic.dist * 0.55, target.y + pic.dist * 0.45, target.z + pic.dist * 0.8);
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.copy(target); controls.update();
        for (const [name, isNew] of pic.show) {
            const p = PIECE[name];
            scene.add(p.make(!!isNew));
            if (isNew && p.n && p.at) { const t = tag(p.n); t.position.set(...p.at); scene.add(t); }
        }
        const draw = () => renderer.render(scene, camera);
        controls.addEventListener('change', draw);
        draw();
        return { resize: () => { const nw = hostEl.clientWidth; if (!nw) return; renderer.setSize(nw, h); camera.aspect = nw / h; camera.updateProjectionMatrix(); draw(); } };
    }

    window.addEventListener('load', () => {
        const made = PICS.map((pic) => { const el = document.getElementById(pic.id); return el && makeScene(pic, el); }).filter(Boolean);
        window.addEventListener('resize', () => made.forEach((m) => m.resize()));
    });
})();
