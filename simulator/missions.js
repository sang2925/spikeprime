/**
 * BIOGLOW (2026-27) Robot Game missions, transcribed for the simulator. No DOM: runs in the browser and in Node tests.
 *
 * Sources, all downloaded 2026-10-21 into simulator/assets/ (hashes in README.md):
 *  - Robot Game Rulebook (file id "30082603 V1", InDesign date 28/4/26): scoring text, pages 9-12; rules, pages 13-18.
 *  - Field Setup Guide: page 2 placement map, pages 3-15 per-mission photos.
 *  - Challenge Updates, "Updated October 14th, 2026" (they supersede the rulebook).
 * The rulebook, the Updates and the Field Setup video are the authority. This file is a study aid, not a scorer.
 *
 * Marker positions (ix, iy) are pixels in assets/bioglow-wireframe-page2-300dpi.png (3300 x 2550). They were
 * read off the wireframe's model outlines and checked against FIRST's numbered placement map. The wireframe
 * itself is 1.1% narrower than the configured mat (see README), so treat positions as good to about +-15 mm.
 * They are labels only. They are NOT collision shapes and not sensor data.
 */
(function (root) {
    'use strict';

    // matCrop = centres of the wireframe's drawn mat border lines, in picture pixels (+-1 px). app.js uses the same crop.
    const IMAGE = { url: 'assets/bioglow-wireframe-page2-300dpi.png', width: 3300, height: 2550, matCrop: { x: 166, y: 636, w: 2967, h: 1689 } };

    /** Scoring line helpers */
    const base = (text, points, extra) => ({ text, points, ...extra });
    const bonus = (text, points, extra) => ({ text, points, bonus: true, ...extra });

    const MISSIONS = [
        {
            id: 1, name: 'Drone Survey', page: 9, noEquipment: true,
            scoring: [
                base('Drone is no longer touching the mat', 20),
                bonus('...and the LiDAR map is completely flipped over, with the scan marker at least partly in the survey area', 10),
            ],
        },
        {
            id: 2, name: 'Exploding Seeds', page: 9,
            scoring: [base('Seeds no longer touching the stalk', 10, { each: true })],
            notes: ['Field Setup Guide: seeds must be placed as shown, but the orientation of the green tubes may vary in competitions.'],
        },
        {
            id: 3, name: 'Flip the Rock', page: 9,
            scoring: [
                base('The research flag is down', 20),
                bonus('...and the rock has been returned to its original starting position', 10),
            ],
        },
        {
            id: 4, name: 'Lucky Leaves', page: 9, noEquipment: true,
            scoring: [
                base('One leaf is completely removed, no longer touching the nest', 10),
                bonus('...and the second leaf is completely removed, no longer touching the nest, with the katydid in its original starting position', 20),
            ],
            notes: [
                'The nest is the mission model that holds the leaves and the katydid.',
                'The leaf habitat is the nest plus the marked area on the mat around it (the thick outline on the wireframe).',
                'If the katydid is completely outside the leaf habitat at any time, the bonus is no longer available.',
                'If the katydid is completely outside the leaf habitat at the end of the match, the team scores zero points for this mission.',
            ],
            updates: ['Update 01 (2026-09-02) replaced the rulebook wording above. Before the match the leaves are randomised in the nest and teams are not told where the katydid starts. The rulebook page still shows the older wording ("even partly").'],
        },
        {
            id: 5, name: 'Reaching Roots', page: 10, noEquipment: true,
            scoring: [
                base('The plant root is partially extended', 10, { onlyOne: true }),
                base('The plant root is completely extended', 20, { onlyOne: true }),
            ],
            notes: ['Only one scoring condition is possible for this mission.'],
        },
        {
            id: 6, name: 'Leafcutter Frenzy', page: 10,
            scoring: [base('The ant is touching the nest, and the leaf fragments are contained within the nest', 10, { each: true, eachWhat: 'fragment' })],
        },
        {
            id: 7, name: 'Humongous Fungus', page: 10, noEquipment: true,
            scoring: [
                base('The mycelium is completely extended', 20),
                bonus('...and a connection is formed between one team\'s extended mycelium and the opposing team\'s fully extended plant root (two bonuses possible)', 10),
            ],
            notes: [
                'The mycelium and plant root do not need to touch to form a connection. If each is fully extended, both teams earn the bonus.',
                'It is not possible to earn the bonus in remote competitions or if there is no opposing team.',
            ],
        },
        {
            id: 8, name: 'Tangled', page: 10,
            scoring: [base('The vine is touching the mat', 30)],
            updates: ['Update 03 (2026-10-14): events are encouraged to tape the tree down with thin black tape along the mat border behind it. Practise with the tree taped and untaped.'],
        },
        {
            id: 9, name: 'Research Platform', page: 11, noEquipment: true,
            scoring: [
                base('The research platform is raised', 10),
                base('The camera trap is deployed', 10),
                base('The seed is no longer touching the tree', 10),
            ],
            updates: ['Update 03 (2026-10-14): the same tree-taping guidance as Mission 8.'],
        },
        {
            id: 10, name: 'Fragile Microhabitats', page: 11, noEquipment: true,
            scoring: [
                base('The spider habitat is in its original starting position', 10),
                base('The snail habitat is in its original starting position', 10),
            ],
            notes: ['Two separate models: the spider habitat and the snail habitat.'],
        },
        {
            id: 11, name: 'Window to the Past', page: 11,
            scoring: [base('The root cover is down, touching the mat', 20)],
        },
        {
            id: 12, name: 'Forest Elder', page: 11, noEquipment: true,
            scoring: [
                base('The cane is completely raised, touching the tree', 20),
                base('The support tie is around the post', 10),
            ],
        },
        {
            id: 13, name: 'Keystone Species', page: 12, interchangeable: true,
            scoring: [base('Your team\'s keystone species is on the restoration platform, and the young trees are raised', 30)],
            notes: [
                'You can use the bricks in bag 20 to build your keystone species model.',
                'Your keystone species counts as equipment and is included in the pre-match inspection. Teams are asked to identify it then.',
            ],
            updates: ['Update 02 (2026-10-14): programming the robot to release an interchangeable model from its dock with the model\'s built-in latch is allowed, if done autonomously during the match.'],
        },
        {
            id: 14, name: 'Seeds of Renewal', page: 12, interchangeable: true,
            scoring: [
                base('Seeds are contained within the replantation station', 5, { each: true }),
                bonus('...and are touching the mat', 5, { each: true }),
            ],
            updates: ['Update 02 (2026-10-14): the dock-release rule described under Mission 13 applies.'],
        },
        {
            id: 15, name: 'Biocentric Architecture', page: 12, noEquipment: true, interchangeable: true,
            scoring: [
                base('The nesting canopy is raised', 10),
                base('The garden skylight is completely in', 10),
                base('The compost hatch is completely opened, touching the mat', 10),
                bonus('Environmental bonus: you completed the greatest ecological need for the dock the model is on (mine dock: nesting canopy, OR city dock: garden skylight, OR farm dock: compost hatch)', 10),
            ],
            notes: ['Only one bonus is possible for this mission.'],
            updates: ['Update 02 (2026-10-14): the dock-release rule described under Mission 13 applies.'],
        },
    ];

    /** Pieces of rule text that are not tied to one model */
    const OTHER_SCORING = [
        'Equipment inspection (rule 8): if the robot and all equipment fit completely in ONE launch area and under 12 in. (305 mm), 20 points.',
        'Precision tokens: you start with six (50 points). Interrupting the robot outside home removes one. Tokens left: 1 = 10, 2 = 15, 3 = 25, 4 = 35, 5 = 50, 6 = 50 points.',
        'The match is 2.5 minutes. Mission requirements must be visibly met at the end of the match (rule 22).',
        'Gracious Professionalism is scored by referees (2, 3 or 4 points) and is added to the Core Values score, not the robot game.',
        '"No Equipment Constraint" missions: the mission model cannot earn points for that mission if it is touching equipment at the end of the match.',
    ];

    /**
     * Where each model sits on the wireframe picture.
     * kind: model | part | area | dock.  confidence: high (model outline matches FIRST's map and photo) |
     * medium (identified by elimination or from the mat artwork; see basis).
     */
    const MARKERS = [
        { label: '01', missions: [1], kind: 'model', ix: 1874, iy: 2240, confidence: 'medium',
            basis: 'Round 3-spot pad at the bottom centre = the drone pilot platform. The drone wires run left from it to about x=1500 on the picture. FIRST\'s map puts badge 01 at the left end of that run.' },
        { label: '01', missions: [1], kind: 'area', ix: 1730, iy: 1996, confidence: 'medium',
            basis: 'The thick square outline near the river. It is the only marked square on the mat and Mission 1 is the only mission that mentions a survey area.' },
        { label: '02', missions: [2], kind: 'model', ix: 1110, iy: 1524, confidence: 'high', basis: 'Model outline at the centre-left, under FIRST\'s badge 02.' },
        { label: '03', missions: [3], kind: 'model', ix: 284, iy: 1350, confidence: 'high', basis: 'Wide model outline on the left wall, under FIRST\'s badge 03.' },
        { label: '04', missions: [4], kind: 'model', ix: 350, iy: 830, confidence: 'high',
            basis: 'Nest outline at the top left. The thick polygon beside it is the marked leaf habitat area.' },
        { label: '05', missions: [5], kind: 'model', ix: 764, iy: 704, confidence: 'high', basis: 'Narrow bracket outline against the top wall, under FIRST\'s badge 05.' },
        { label: '06·07', missions: [6, 7], kind: 'model', ix: 2450, iy: 745, confidence: 'medium',
            basis: 'The cluster at the top right. FIRST\'s Field Setup Guide shows Missions 6 and 7 on one page as one connected build, so they share a marker. The split between the two was not worked out.' },
        { label: '08·09', missions: [8, 9], kind: 'model', ix: 1024, iy: 760, confidence: 'high',
            basis: 'The tree cluster at the top. Missions 8 and 9 share the tree model (one page in the Field Setup Guide).' },
        { label: '10', missions: [10], kind: 'model', ix: 1276, iy: 768, confidence: 'medium',
            basis: 'The snail habitat: the Field Setup Guide photo (p. 10) shows it against the top wall, next to the big tree (2026-10-24).' },
        { label: '10', missions: [10], kind: 'model', ix: 1710, iy: 1258, confidence: 'medium',
            basis: 'The spider habitat: the Field Setup Guide photo (p. 10) shows it on the sand near the river, in the middle of the mat (2026-10-24).' },
        { label: '11', missions: [11], kind: 'model', ix: 2250, iy: 1440, confidence: 'high', basis: 'Diamond outline at the right of centre, under FIRST\'s badge 11.' },
        { label: '12', missions: [12], kind: 'model', ix: 3042, iy: 1204, confidence: 'high', basis: 'Round 3-spot pad on the right wall = the tree base, under FIRST\'s badge 12.' },
        { label: '12', missions: [12], kind: 'part', ix: 3040, iy: 1520, confidence: 'medium',
            basis: 'Small bracket outline just above the right home area. The Field Setup Guide photo shows the post as a separate piece in that spot.' },
        { label: 'D1', missions: [13, 14, 15], kind: 'dock', ix: 2970, iy: 790, confidence: 'high', dock: 'Mine dock',
            basis: 'Top-right dock. The Field Setup Guide photo of the mine dock shows orange ground with the river on its left, which matches this corner of the mat.' },
        { label: 'D2', missions: [13, 14, 15], kind: 'dock', ix: 1650, iy: 1396, confidence: 'medium', dock: 'Farm dock',
            basis: 'Centre dock. Named "farm" only because the mat artwork around it is crop fields. The rulebook text does not say which dock is which.' },
        { label: 'D3', missions: [13, 14, 15], kind: 'dock', ix: 2066, iy: 2190, confidence: 'medium', dock: 'City dock',
            basis: 'Bottom dock. Named "city" only because the mat artwork around it is roads and containers. The rulebook text does not say which dock is which.' },
    ];

    /**
     * Where an image pixel lands on the mat, as millimetres from the mat's centre (x right, y up),
     * using the same rule as the background picture: the cropped part is fitted inside the mat without stretching,
     * after being turned clockwise by orientationDeg (0, 90, 180 or 270).
     */
    function imagePxToMatMm(ix, iy, crop, orientationDeg, matW, matH) {
        const sideways = Math.abs(orientationDeg) % 180 !== 0;
        const effW = sideways ? crop.h : crop.w;
        const effH = sideways ? crop.w : crop.h;
        const s = Math.min(matW / effW, matH / effH);
        const dx = (ix - crop.x - crop.w / 2) * s;
        const dy = (iy - crop.y - crop.h / 2) * s;           // image Y points down
        const a = orientationDeg * Math.PI / 180;
        const rx = dx * Math.cos(a) - dy * Math.sin(a);       // clockwise turn on screen (Y down)
        const ry = dx * Math.sin(a) + dy * Math.cos(a);
        return { x: rx, y: -ry };
    }

    function markersFor(missionId) {
        return MARKERS.filter((m) => m.missions.includes(missionId));
    }

    /**
     * Optional obstacles (off by default). Corners are picture pixels of the wireframe, read 2026-10-21/22 from zoomed
     * crops with a ruler grid (good to about 5 px, about 3 mm; the picture is a diagram, not exact scale).
     * Estimates: the real models' levers, plants and wires stick out past the outline, and thin arms are left out
     * (08·09). Diagonal models use the outline's convex hull, so empty corners count as solid. Floor-flat things
     * (printed black lines, launch-area shapes) are not included. The robot also touches 06·07 and 11 on purpose.
     */
    const circle = (cx, cy, r, n = 12) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);
    const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const OBSTACLES = [
        { key: 'm11', name: 'Mission 11 model (wireframe outline, estimate)', missions: [11],
            corners: [[2256, 1363], [2336, 1443], [2251, 1527], [2172, 1447]] },
        { key: 'm0607', name: 'Missions 06 and 07 model (leafcutter, estimate)', missions: [6, 7],
            corners: [[2435, 643], [2566, 736], [2566, 784], [2402, 828], [2334, 744]] },
        { key: 'm02', name: 'Mission 02 model (estimate)', missions: [2],
            corners: [[1101, 1476], [1118, 1476], [1160, 1518], [1160, 1535], [1118, 1577], [1101, 1577], [1059, 1535], [1059, 1518]] },
        { key: 'm03', name: 'Mission 03 model (estimate)', missions: [3], corners: rect(195, 1303, 375, 1399) },
        { key: 'm04', name: 'Mission 04 model (estimate)', missions: [4],
            corners: [[381, 715], [427, 715], [440, 739], [440, 910], [270, 910], [246, 897], [246, 850], [276, 778], [309, 745]] },
        { key: 'm05', name: 'Mission 05 model (estimate)', missions: [5], corners: [[734, 643], [794, 643], [794, 774], [781, 774], [734, 726]] },
        // Not a model outline: where the real robot's pusher stopped in the team video (19.4 s), about ±3 cm. The
        // leafcutter lever stops moving there, so the real push went about 24 of its 30 cm.
        { key: 'm0607stop', name: 'Leafcutter lever: where the real push stopped (from the video, estimate)', missions: [6, 7],
            corners: [[2269, 786], [2244, 823], [2320, 872], [2343, 833]] },
        // Mission 07's tower: the small square beside the nest on the wireframe (the arm hangs in front of it). A robot or
        // attachment touching it is a clash; the red handle at its front is where a hook should reach (2026-10-24, estimate).
        { key: 'm07tower', name: 'Mission 07 tower, beside the nest (estimate)', missions: [7], corners: rect(2494, 736, 2565, 783) },
        { key: 'm0809', name: 'Missions 08 and 09 model, body only (estimate)', missions: [8, 9], corners: rect(947, 680, 1098, 800) },
        { key: 'm10a', name: 'Mission 10 snail habitat, by the top wall next to the tree (estimate)', missions: [10],
            corners: [[1272, 740], [1294, 736], [1307, 758], [1281, 805], [1252, 785], [1250, 760]] },
        { key: 'm10b', name: 'Mission 10 spider habitat, on the sand in the middle (estimate)', missions: [10], corners: rect(1672, 1225, 1748, 1285) },
        // Mission 01's zipline (two low strings from the launcher pad to the red anchor) and the LiDAR map on the feet
        // along the survey square's top-left side (wireframe, checked against the Field Setup Guide photo p. 3, 2026-10-24)
        { key: 'm01line', name: 'Mission 01 zipline strings, launcher to anchor (estimate)', missions: [1], corners: rect(1110, 2228, 1830, 2258) },
        { key: 'm01map', name: 'Mission 01 LiDAR map, beside the survey area (estimate)', missions: [1],
            corners: [[1652, 1992], [1762, 1926], [1790, 1964], [1680, 2030]] },
        { key: 'm12a', name: 'Mission 12 model, upper (estimate)', missions: [12], corners: circle(3043, 1204, 48) },
        { key: 'm12b', name: 'Mission 12 part, lower (estimate)', missions: [12], corners: rect(3025, 1472, 3061, 1562) },
        { key: 'm01', name: 'Mission 01 model, drone pad (estimate)', missions: [1], corners: circle(1875, 2243, 48) },
        { key: 'd1', name: 'D1 dock (estimate)', missions: [], corners: [[3001, 684], [3077, 778], [2951, 904], [2858, 828], [2858, 811]] },
        { key: 'd2', name: 'D2 dock (estimate)', missions: [], corners: rect(1584, 1295, 1716, 1499) },
        { key: 'd3', name: 'D3 dock (estimate)', missions: [], corners: rect(1999, 2089, 2130, 2292) },
    ];

    /**
     * Start poses (world mm, heading ° counterclockwise from right), keyed by the project name in manifest.json.
     * Opening that project places the robot there and saves it as the start pose.
     */
    const START_POSES = {
        // Measured on the first video frame against the printed launch-area edge strip (ticks every 10 cm from the
        // bottom-right mat corner): robot sides at about 19 and 38 cm from the bottom wall, back on the mat's right edge.
        'gyro-mission6-7-11': { x: 2099, y: 286, heading: 180,
            source: 'measured from the team video gyro_run1.MOV against the launch-area edge marks, about ±2 cm (estimate)' },
        'gyro-mission6-7-11_routefix': { x: 2099, y: 286, heading: 180,
            source: 'same start as gyro-mission6-7-11 (team video), about ±2 cm (estimate)' },
        'gyro-mission6-7-11_routefix_creep': { x: 2084.6, y: 288.7, heading: 180,
            source: 'start set by the coach on 2026-10-24 in Robot Placement: back of the robot on the bold black launch line, its left side on the black tick line (video start was (2099, 286))' },
        'gyro-mission6-7-11_routefix_creep_push28': { x: 2084.6, y: 288.7, heading: 180,
            source: 'same coach start as routefix_creep (2026-10-24): back on the bold black launch line, left side on the black tick line (before: (2103.1, 313.9) from the cursor; video start (2099, 286))' },
        'gyro-mission6-7-11_routefix_creep_push28_back10': { x: 2084.6, y: 288.7, heading: 180,
            source: 'same coach start as routefix_creep_push28 (only step 8 differs, 2026-10-25)' },
        'gyro-mission6-7-11_routefix_creep_push28_arm': { x: 2103.1, y: 313.9, heading: 180,
            source: 'same start as gyro-mission6-7-11_routefix_creep_push28 (set by the coach on 2026-10-24)' },
        'gyro-mission6-7-11_routefix_push28': { x: 2099, y: 286, heading: 180,
            source: 'same start as gyro-mission6-7-11 (team video), about ±2 cm (estimate)' },
    };

    const BioglowMissions = { IMAGE, MISSIONS, MARKERS, OTHER_SCORING, OBSTACLES, START_POSES, imagePxToMatMm, markersFor };
    if (typeof module !== 'undefined' && module.exports) module.exports = BioglowMissions;
    else root.BioglowMissions = BioglowMissions;
})(this);
