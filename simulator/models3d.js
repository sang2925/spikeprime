/**
 * LEGO-style 3D models of two mission models, for the 3D view only (no physics, no collisions).
 * Built by eye from FIRST's BIOGLOW building instructions (book 06 = Missions 06/07 leafcutter and mycelium,
 * book 09 = Mission 11 Window to the Past) and the rulebook pictures (pages 10-11), then placed on the wireframe
 * outlines in missions.js. Bricks are approximate: right colours, sizes within about 1 stud (8 mm), not every piece.
 *
 * Each model has a frame on the wireframe picture (pixels): origin O, and points U and V that set its two floor axes.
 * Parts use millimetres in that frame: u along O to U, v along O to V, z up from the mat.
 * pieces(model) turns parts into wireframe-pixel shapes; app.js maps pixels to the table, view3d.js draws them.
 */
(function (root) {
    'use strict';

    const MM_PER_PX = 1996.7 / 2967;   // the wireframe mat crop: 2967 px across, drawn 1996.7 mm wide
    const PLATE = 3.2, BRICK = 9.6, STUD = 8;
    const C = {   // LEGO colours, roughly
        brown: 0x5a2d1a, red: 0xc91a09, green: 0x237841, brightGreen: 0x4bb34b, tan: 0xe4cd9e, white: 0xf4f4f4,
        grey: 0xa0a5a9, darkGrey: 0x6c6e68, black: 0x1b2a34, yellow: 0xf2cd37, orange: 0xfe8a18, pink: 0xe4adc8,
        purple: 0xcd6298, lavender: 0xb18cbf, azure: 0x5ac4da, clear: 0xdfeef0, darkOrange: 0xa95500, sandGreen: 0xa0bcac,
    };

    // ---- Mission 11: wireframe outline corners top (2256,1363), right (2336,1443), bottom (2251,1527), left (2172,1447).
    // The root cover hinges on the right-to-bottom side (the extra line beside it on the wireframe); the robot bumps the
    // opposite side. u runs along the cover side (0 to 80 mm), v from the cover side to the back (0 to 76 mm).
    const M11 = {
        key: 'm11', label: '11', name: 'Mission 11: Window to the Past',
        frame: { O: [2251, 1527], U: [2336, 1443], V: [2172, 1447] },
        // the cover swings on this line (u from 0 to 80 at the front edge, just above the mat) and falls outward, to -v
        moves: [{ group: 'cover', type: 'hinge', a: [0, 0, PLATE], b: [80, 0, PLATE], toward: [0, -1], max: Math.PI / 2, state: 'm11', animate: true }],
        // the cover lying flat on the mat (for the 2D view): u 8 to 72, v 0 to -64
        flat: [[8, 0], [72, 0], [72, -64], [8, -64]],
        parts: [
            // base plate and the hinge strip at the front
            { box: [[0, 80], [6, 76], [0, PLATE]], color: C.brown, studs: true },
            { box: [[14, 66], [2, 8], [0, PLATE]], color: C.grey },
            // rock walls, left and right, and the back corners
            { box: [[0, 16], [8, 76], [PLATE, PLATE + 4 * BRICK]], color: C.brown },
            { box: [[64, 80], [8, 76], [PLATE, PLATE + 4 * BRICK]], color: C.brown },
            { box: [[16, 30], [62, 76], [PLATE, PLATE + 3 * BRICK]], color: C.brown },
            // clear 1x1 bricks on the rock tops (the "window" frame)
            ...[[4, 12], [68, 12], [4, 70], [68, 70]].map(([u, v]) => ({ box: [[u, u + 8], [v, v + 8], [PLATE + 4 * BRICK, PLATE + 5 * BRICK]], color: C.clear, opacity: 0.6 })),
            // green ground on top
            { box: [[0, 80], [6, 76], [PLATE + 5 * BRICK, 2 * PLATE + 5 * BRICK]], color: C.brightGreen, studs: true },
            // inside: the old root and its tan fingers
            { cyl: [40, 46], r: 6, r2: 4, z: [PLATE, 2 * PLATE + 5 * BRICK], color: C.tan },
            { cyl: [40, 46], r: 12, r2: 2, z: [PLATE, PLATE + 10], color: C.tan },
            // on top: cone tree, green brick, brown dome, stump, blue mushroom
            { cyl: [18, 62], r: 10, r2: 3, z: [55, 75], color: C.brightGreen },
            { box: [[56, 72], [58, 74], [55, 55 + BRICK]], color: C.green, studs: true },
            { sphere: [62, 26], z: 60, r: 8, color: C.brown },
            { cyl: [28, 26], r: 8, z: [55, 64], color: C.darkOrange },
            { cyl: [70, 42], r: 2, z: [55, 63], color: C.white },
            { cyl: [70, 42], r: 7, r2: 6, z: [63, 66], color: C.azure },
            // the flower stalk and its flowers
            { cyl: [44, 44], r: 3, z: [55, 92], color: C.brightGreen },
            { cyl: [36, 40], r: 2, z: [70, 84], color: C.brightGreen },
            { cyl: [52, 48], r: 2, z: [70, 84], color: C.brightGreen },
            { cyl: [36, 40], r: 5, r2: 2, z: [84, 92], color: C.yellow },
            { cyl: [52, 48], r: 5, r2: 2, z: [84, 92], color: C.yellow },
            { cyl: [44, 44], r: 12, r2: 7, z: [92, 100], color: C.orange },
            { cyl: [44, 44], r: 6, z: [100, 103], color: C.purple },
            { cyl: [30, 52], r: 14, z: [80, 82], color: C.lavender },
            { cyl: [30, 52], r: 2.5, z: [55, 80], color: C.pink },
            // the seed on its red arm, hanging off the left side
            { beam: [[2, 38, 60], [-14, 30, 72]], w: 5, color: C.red },
            { sphere: [-18, 28], z: 46, r: 8, color: C.tan },
            // ROOT COVER, standing up in its starting position: brown plate with a black and a dark orange tile,
            // red edge along the top that sticks out past the right side (field setup guide p. 11 photo)
            { box: [[8, 72], [-1, 2.2], [PLATE, PLATE + 64]], color: C.brown, group: 'cover' },
            { box: [[6, 100], [-3, 3], [PLATE + 60, PLATE + 66]], color: C.red, group: 'cover' },
            { box: [[50, 68], [-2, -1], [48, 62]], color: C.black, group: 'cover' },
            { box: [[60, 66], [-2, -1], [26, 48]], color: C.darkOrange, group: 'cover' },
        ],
    };

    // ---- Missions 06 and 07: the nest is the square part of the wireframe outline: left (2334,744), top (2435,643),
    // bottom (2402,828), right about (2503,727). The ant's rack runs parallel to the left-to-top side and comes out
    // of the bottom-to-left side. u runs along that side (0 to 73 mm), v from it to the back (0 to 96 mm).
    // The thin line on the wireframe about 88 mm in front of the nest (pixels (2275,887) to (2309,920)) is drawn
    // here as where the ant starts. The mycelium tower stands on the small square beside the nest.
    const M0607 = {
        key: 'm0607', label: '06·07', name: 'Missions 06 and 07: Leafcutter Frenzy and Humongous Fungus',
        frame: { O: [2402, 828], U: [2334, 744], V: [2503, 727] },
        // Mission 06: pushing the ant slides the rack (and the ant) into the nest (book 06 step 48). How far the robot
        // has pushed comes from app.js (state 'm0607', 0 to 1). The mycelium arm is Mission 07, a separate mission:
        // pushing the ant does not move it (corrected 2026-10-24 by the coach), so it stays folded here.
        moves: [
            { group: 'ant', type: 'slide', dir: [0, 1], dist: 84, state: 'm0607' },
        ],
        parts: [
            // white base plate, tan walls, white raised floor
            { box: [[4, 70], [4, 92], [0, PLATE]], color: C.white, studs: true },
            { box: [[4, 70], [84, 92], [PLATE, PLATE + 2 * BRICK]], color: C.tan, studs: true },
            { box: [[60, 70], [4, 92], [PLATE, PLATE + 2 * BRICK]], color: C.tan, studs: true },
            { box: [[4, 12], [4, 84], [PLATE, PLATE + BRICK]], color: C.white },
            { box: [[4, 14], [4, 40], [PLATE + BRICK, PLATE + BRICK + PLATE]], color: C.brightGreen },
            // the big gear inside and its axle
            { cyl: [36, 50], r: 20, z: [PLATE + 6, PLATE + 14], color: C.darkGrey, axis: 'u' },
            { cyl: [44, 62], r: 10, z: [PLATE + 6, PLATE + 14], color: C.tan, axis: 'u' },
            // the nest: tan arches over the floor, white and tan slopes on top, green bits
            { box: [[4, 14], [10, 86], [PLATE + 2 * BRICK, PLATE + 5 * BRICK]], color: C.tan },
            { box: [[56, 70], [10, 86], [PLATE + 2 * BRICK, PLATE + 5 * BRICK]], color: C.tan },
            { box: [[4, 70], [10, 22], [PLATE + 4 * BRICK, PLATE + 5 * BRICK]], color: C.tan },
            { box: [[4, 70], [74, 86], [PLATE + 4 * BRICK, PLATE + 5 * BRICK]], color: C.tan },
            { box: [[4, 70], [22, 74], [PLATE + 5 * BRICK, PLATE + 5 * BRICK + 4]], color: C.white },
            { box: [[10, 64], [30, 66], [PLATE + 5 * BRICK + 4, PLATE + 6 * BRICK]], color: C.tan },
            ...[[6, 12], [62, 12], [6, 80], [62, 80]].map(([u, v]) => ({ box: [[u, u + 6], [v, v + 6], [PLATE + 5 * BRICK, PLATE + 5 * BRICK + 6]], color: C.green })),
            // the leaf fragments standing in the nest: green nearest the ant, then orange, yellow, white (field setup guide p. 8)
            ...[[C.green, 24], [C.orange, 34], [C.yellow, 44], [C.white, 54]].map(([color, v]) => ({ leaf: [36, v], z: [62, 112], color })),
            // the white toothed rack, pulled out to the starting line, and the ant on its red sled
            { box: [[20, 30], [-92, 40], [PLATE, PLATE + 6]], color: C.white, group: 'ant' },
            { box: [[22, 28], [-92, 40], [PLATE + 6, PLATE + 9]], color: C.white, group: 'ant' },
            { box: [[10, 40], [-100, -84], [0, PLATE + 6]], color: C.red, group: 'ant' },
            { box: [[14, 36], [-98, -86], [PLATE + 6, PLATE + 10]], color: C.black, group: 'ant' },
            { sphere: [25, -92], z: 30, r: 9, color: C.red, group: 'ant' },
            { sphere: [25, -92], z: 19, r: 7, color: C.black, group: 'ant' },
            ...[-1, 1].flatMap((s) => [-97, -92, -87].map((v) => ({ beam: [[25, v, 16], [25 + s * 16, v, 6]], w: 2.5, color: C.black, group: 'ant' }))),
            { leaf: [40, -90], z: [10, 40], color: C.green, flat: true, group: 'ant' },
        ],
        // the mycelium tower on the small square beside the nest (pixels, not the nest frame)
        extra: [
            { pxBox: [[2494, 736], [2565, 783]], z: [0, PLATE + BRICK], color: C.white, studs: true },
            { pxBox: [[2500, 748], [2512, 772]], z: [PLATE + BRICK, 110], color: C.grey },
            { pxBox: [[2546, 748], [2558, 772]], z: [PLATE + BRICK, 110], color: C.grey },
            { pxBox: [[2500, 748], [2558, 772]], z: [104, 114], color: C.white },
            // the white mycelium arm (Mission 07), folded (starting position, Field Setup Guide p. 8, rechecked 2026-10-24):
            // it hangs straight down in front of its own tower (south, away from the wall), not across towards the nest,
            // with the red handle lying across the front of the tower base
            { pxBeam: [[2522, 772, 112], [2522, 832, 18]], w: 7, color: C.white, group: 'arm' },
            { pxBeam: [[2538, 772, 108], [2538, 812, 60]], w: 7, color: C.white, group: 'arm' },
            { pxBeam: [[2500, 834, 16], [2556, 834, 16]], w: 9, color: C.red, group: 'arm' },
        ],
    };

    // ---- The other models: simpler LEGO-style shapes from each book's finished picture (and the rulebook photos),
    // sized to their wireframe outlines. Frame: u to the right on the picture, v up the picture (towards the far wall).
    const onRect = (x0, y0, x1, y1) => ({ O: [x0, y1], U: [x1, y1], V: [x0, y0] });
    const ring = (cu, cv, r, z, w, color, n = 14, from = 0, to = 2 * Math.PI) => Array.from({ length: n }, (_, i) => {   // a hose or rope loop in the u-z plane
        const t0 = from + (to - from) * i / n, t1 = from + (to - from) * (i + 1) / n;
        return { beam: [[cu + r * Math.cos(t0), cv, z + r * Math.sin(t0)], [cu + r * Math.cos(t1), cv, z + r * Math.sin(t1)]], w, color };
    });
    const frameUp = (u0, u1, v0, v1, z0, z1, color) => [   // a technic frame standing up: four bars
        { box: [[u0, u1], [v0, v1], [z0, z0 + 8]], color }, { box: [[u0, u1], [v0, v1], [z1 - 8, z1]], color },
        { box: [[u0, u0 + 8], [v0, v1], [z0, z1]], color }, { box: [[u1 - 8, u1], [v0, v1], [z0, z1]], color }];

    // Mission 01 Drone Survey (book 01; Field Setup Guide p. 3): the round launcher pad, two low strings running west
    // to a red anchor (wireframe bracket at x 1127), the drone riding on them (small square at x 1483), and the LiDAR
    // map on its feet beside the survey square
    const M01 = { key: 'm01', label: '01', name: 'Mission 01: Drone Survey', frame: onRect(1827, 2195, 1923, 2291),
        alsoHides: ['m01line', 'm01map'], parts: [
            { cyl: [32, 32], r: 30, z: [0, PLATE * 2], color: C.darkGrey },
            { cyl: [32, 32], r: 22, z: [PLATE * 2, 14], color: C.grey },
            { box: [[24, 40], [24, 40], [14, 36]], color: C.white }, { sphere: [32, 32], z: 40, r: 6, color: C.tan },
        ],
        extra: [
            { pxBeam: [[1850, 2231, 22], [1127, 2231, 12]], w: 2, color: C.black },
            { pxBeam: [[1850, 2255, 22], [1127, 2255, 12]], w: 2, color: C.black },
            { pxBox: [[1104, 2215], [1146, 2271]], z: [0, 24], color: C.red },
            { pxBox: [[1468, 2226], [1498, 2260]], z: [10, 26], color: C.black },
            { pxBox: [[1474, 2232], [1492, 2254]], z: [26, 34], color: C.azure },
            { pxBox: [[1678, 1978], [1700, 2002]], z: [0, 12], color: C.darkGrey }, { pxBox: [[1750, 1934], [1774, 1958]], z: [0, 12], color: C.darkGrey },
            { pxPoly: [[1652, 1992], [1762, 1926], [1790, 1964], [1680, 2030]], z: [12, 30], color: C.grey },
            { pxPoly: [[1668, 1990], [1758, 1936], [1776, 1962], [1686, 2016]], z: [30, 34], color: C.green },
            { pxBox: [[1700, 1962], [1720, 1982]], z: [34, 46], color: C.red },
        ] };
    // Mission 02 Exploding Seeds (book 02; Field Setup Guide p. 4): the grey frame base sits on the diagonal (the
    // diamond on the wireframe), the green stalk stands in its middle, the hose arches over it, seeds on the stalk.
    // Checked 2026-10-24. Frame: u from the left corner to the bottom corner, v from the left corner to the top corner.
    const M02 = { key: 'm02', label: '02', name: 'Mission 02: Exploding Seeds', frame: { O: [1059, 1527], U: [1110, 1577], V: [1110, 1476] }, parts: [
        { box: [[2, 46], [2, 46], [0, 8]], color: C.grey }, { box: [[12, 36], [12, 36], [8, 12]], color: C.darkGrey },
        { box: [[20, 28], [20, 28], [12, 130]], color: C.brightGreen },
        { beam: [[24, 24, 118], [24, 36, 150]], w: 4, color: C.yellow },
        ...ring(24, 24, 34, 100, 4, C.brightGreen, 16, 0, Math.PI),
        { sphere: [12, 24], z: 92, r: 7, color: C.brown }, { sphere: [36, 24], z: 92, r: 7, color: C.brown },
        { sphere: [24, 24], z: 70, r: 7, color: C.brown }, { cyl: [24, 16], r: 6, z: [66, 69], color: C.yellow },
    ] };
    // Mission 03 Flip the Rock (book 03): lime frame, grey and green rock, two red flags
    const M03 = { key: 'm03', label: '03', name: 'Mission 03: Flip the Rock', frame: onRect(195, 1303, 375, 1399), parts: [
        { box: [[4, 117], [4, 61], [0, 8]], color: C.brightGreen },
        { box: [[14, 107], [10, 55], [8, 38]], color: C.darkGrey },
        { box: [[20, 100], [16, 50], [38, 48]], color: C.green, studs: true },
        { box: [[40, 80], [22, 44], [48, 58]], color: C.grey },
        { box: [[6, 14], [26, 34], [8, 84]], color: C.red }, { box: [[107, 115], [26, 34], [8, 84]], color: C.red },
        { cyl: [60, 33], r: 5, z: [58, 70], color: C.azure },
    ] };
    // Mission 04 Lucky Leaves (book 04; Field Setup Guide p. 6): three flat green wings bent around the top-left corner of
    // the thick square (the leaf habitat area, flat on the mat), a tan rope loop standing on each wing. The katydid and
    // leaves are placed by the referee, so they are not drawn. Checked against the wireframe 2026-10-24.
    const M04 = { key: 'm04', label: '04', name: 'Mission 04: Lucky Leaves', frame: onRect(246, 715, 440, 910), parts: [],
        extra: [
            { pxBox: [[248, 840], [316, 908]], z: [0, 8], color: C.darkGrey }, { pxBox: [[252, 848], [318, 900]], z: [8, 14], color: C.green },
            { pxBox: [[370, 717], [438, 786]], z: [0, 8], color: C.darkGrey }, { pxBox: [[378, 717], [430, 788]], z: [8, 14], color: C.green },
            { pxPoly: [[278, 780], [310, 746], [368, 790], [318, 838]], z: [0, 8], color: C.darkGrey },
            { pxPoly: [[284, 780], [312, 752], [362, 792], [320, 832]], z: [8, 14], color: C.green },
            { pxBeam: [[268, 874, 12], [250, 874, 4]], w: 30, color: C.green }, { pxBeam: [[404, 730, 12], [404, 718, 4]], w: 30, color: C.green },
            { pxBeam: [[300, 772, 12], [284, 756, 4]], w: 30, color: C.green },
            ...[[290, 874], [404, 752], [322, 792]].flatMap(([x, y]) => Array.from({ length: 12 }, (_, i) => {
                const t0 = Math.PI * 2 * i / 12, t1 = Math.PI * 2 * (i + 1) / 12, r = 14 / MM_PER_PX;
                return { pxBeam: [[x + r * Math.cos(t0), y, 54 + 14 * Math.sin(t0)], [x + r * Math.cos(t1), y, 54 + 14 * Math.sin(t1)]], w: 3, color: C.tan };
            })),
            ...[[290, 874], [404, 752], [322, 792]].map(([x, y]) => ({ pxBeam: [[x, y, 14], [x, y, 40]], w: 3, color: C.tan })),
        ] };
    // Mission 05 Reaching Roots (book 05). Orientation from the Field Setup Guide photo (p. 7) and the wireframe
    // (checked 2026-10-24): the grey frame stands on the left side, its face square to the wall; the brown root stands on
    // the right with its curved foot reaching out from the wall (the thin strip on the wireframe), leans back towards
    // the wall with its horn tip over the top, and the red bars point left, across the frame. u: left to right (0-40 mm),
    // v: from the outer end (0) to the wall (88).
    const M05 = { key: 'm05', label: '05', name: 'Mission 05: Reaching Roots', frame: onRect(734, 643, 794, 774), parts: [
        { box: [[6, 14], [40, 86], [0, 8]], color: C.grey }, { box: [[6, 14], [40, 86], [48, 56]], color: C.grey },
        { box: [[6, 14], [40, 48], [0, 56]], color: C.grey }, { box: [[6, 14], [78, 86], [0, 56]], color: C.grey },
        { box: [[30, 40], [0, 40], [0, 6]], color: C.brown }, { box: [[24, 40], [30, 62], [0, 14]], color: C.brown },
        { box: [[24, 32], [36, 48], [14, 22]], color: C.green },
        { beam: [[34, 30, 10], [34, 74, 96]], w: 8, color: C.brown }, { beam: [[34, 74, 96], [34, 94, 120]], w: 7, color: C.brown },
        { beam: [[22, 40, 10], [22, 82, 104]], w: 8, color: C.brown },
        { cyl: [34, 98], r: 4, r2: 1, z: [118, 140], color: C.brown },
        { beam: [[30, 56, 62], [0, 56, 62]], w: 5, color: C.red }, { sphere: [0, 56], z: 62, r: 5, color: C.red },
        { beam: [[30, 72, 88], [0, 72, 88]], w: 5, color: C.red }, { sphere: [0, 72], z: 88, r: 5, color: C.red },
        { box: [[18, 28], [60, 70], [70, 78]], color: C.green },
    ] };
    // Missions 08 Tangled and 09 Research Platform (book 07): the big tree, its canopy and the research platform
    const M0809 = { key: 'm0809', label: '08·09', name: 'Missions 08 and 09: Tangled and Research Platform', frame: onRect(947, 680, 1098, 800), parts: [
        { box: [[20, 82], [10, 70], [0, 8]], color: C.brown },
        { box: [[36, 66], [26, 56], [8, 230]], color: C.brown },
        { beam: [[66, 40, 200], [92, 40, 236]], w: 8, color: C.brown }, { beam: [[36, 40, 190], [6, 40, 228]], w: 8, color: C.brown },
        { cyl: [51, 41], r: 46, r2: 30, z: [226, 246], color: C.brightGreen }, { cyl: [51, 41], r: 30, r2: 12, z: [246, 262], color: C.green },
        { box: [[60, 100], [14, 66], [110, 118]], color: C.tan, studs: true },
        { box: [[60, 100], [14, 18], [118, 128]], color: C.tan }, { box: [[96, 100], [14, 66], [118, 128]], color: C.tan },
        { box: [[66, 72], [30, 36], [118, 138]], color: C.green }, { box: [[80, 86], [44, 50], [118, 138]], color: C.darkOrange },
        { beam: [[66, 40, 20], [100, 6, 4]], w: 5, color: C.green }, { beam: [[100, 6, 4], [120, -10, 4]], w: 5, color: C.tan },
        { box: [[30, 36], [56, 62], [100, 110]], color: C.red },
    ] };
    // Mission 10 Fragile Microhabitats (book 08). Field Setup Guide p. 10: the snail habitat is by the top wall next to
    // the big tree (outline m10a), the spider habitat on the sand in the middle (outline m10b).
    const M10A = { key: 'm10b', label: '10', name: 'Mission 10: spider habitat', frame: onRect(1672, 1225, 1748, 1285), parts: [
        { box: [[4, 34], [16, 28], [0, 6]], color: C.brightGreen },
        ...frameUp(6, 34, 18, 26, 6, 78, C.white),
        { box: [[4, 10], [18, 26], [6, 86]], color: C.brown }, { box: [[4, 34], [18, 26], [80, 86]], color: C.brown },
        { sphere: [22, 22], z: 44, r: 5, color: C.black },
    ] };
    // The snail habitat: the wireframe base is a tilted rectangle whose long side runs up towards the top wall; the ramp
    // climbs that way with the yellow snail at the top (Field Setup Guide p. 10). Checked 2026-10-24.
    // Frame: O = bottom corner (1285, 801), u to (1255, 786), v up the ramp to (1311, 757).
    const M10B = { key: 'm10a', label: '10', name: 'Mission 10: snail habitat', frame: { O: [1285, 801], U: [1255, 786], V: [1311, 757] }, parts: [
        { box: [[0, 22], [0, 34], [0, 14]], color: C.darkGrey },
        { beam: [[11, 4, 12], [11, 40, 66]], w: 10, color: C.brightGreen },
        { beam: [[4, 2, 8], [4, 38, 62]], w: 5, color: C.brown },
        { sphere: [11, 44], z: 76, r: 11, color: C.yellow }, { sphere: [11, 36], z: 74, r: 6, color: C.orange },
    ] };
    // Mission 12 Forest Elder (book 10; Field Setup Guide p. 12): the leaning tan tree on its round green base, the red
    // support tie on the wall side, and the long brown cane lying flat on the mat, pointing away from the home area
    // (north-west). Checked 2026-10-24.
    const M12A = { key: 'm12a', label: '12', name: 'Mission 12: Forest Elder', frame: onRect(2995, 1156, 3091, 1252), parts: [
        { cyl: [32, 32], r: 30, z: [0, 8], color: C.green },
        { beam: [[32, 32, 8], [40, 36, 80]], w: 12, color: C.tan }, { beam: [[40, 36, 80], [26, 30, 140]], w: 10, color: C.tan },
        { beam: [[40, 36, 80], [56, 38, 130]], w: 8, color: C.tan },
        { sphere: [26, 30], z: 146, r: 14, color: C.green }, { sphere: [58, 38], z: 136, r: 12, color: C.green },
        ...ring(50, 32, 20, 42, 4, C.red, 12, -Math.PI / 2, Math.PI * 1.2),
        { beam: [[26, 40, 3], [-50, 110, 3]], w: 5, color: C.brown }, { beam: [[-50, 110, 3], [-58, 118, 8]], w: 6, color: C.brown },
    ] };
    const M12B = { key: 'm12b', label: '12', name: 'Mission 12: post', frame: onRect(3025, 1472, 3061, 1562), parts: [
        { box: [[6, 18], [4, 56], [0, 8]], color: C.darkGrey },
        { beam: [[12, 50, 8], [12, 56, 32]], w: 8, color: C.grey }, { box: [[4, 20], [50, 58], [30, 40]], color: C.red },
    ] };
    // The three dock models (books 11, 12, 13; Missions 13, 14 and 15) each with its grey dock frame. D2 is the
    // green and black one in the team video; which of the other two stands on D1 and which on D3 is a guess.
    const M13 = { key: 'd2', label: '13', stretchV: 1.75, name: 'Mission 13: Keystone Species (D2 dock)', frame: onRect(1584, 1295, 1716, 1499), parts: [
        { box: [[6, 83], [6, 70], [0, 10]], color: C.black }, ...frameUp(6, 83, 6, 14, 10, 60, C.darkGrey), ...frameUp(6, 83, 62, 70, 10, 60, C.darkGrey),
        { box: [[10, 79], [14, 62], [40, 48]], color: C.brown },
        { box: [[10, 79], [14, 20], [10, 30]], color: C.brightGreen }, { box: [[10, 79], [56, 62], [10, 30]], color: C.brightGreen },
        { cyl: [24, 38], r: 10, r2: 4, z: [48, 70], color: C.green }, { cyl: [60, 40], r: 10, r2: 4, z: [48, 70], color: C.green },
        { box: [[72, 78], [40, 46], [60, 70]], color: C.yellow },
    ] };
    const M14 = { key: 'd3', label: '14', stretchV: 1.75, name: 'Mission 14: Seeds of Renewal (dock, guess)', frame: onRect(1999, 2089, 2130, 2292), parts: [
        { box: [[6, 82], [6, 70], [0, 10]], color: C.brightGreen }, ...frameUp(6, 82, 6, 14, 10, 54, C.darkGrey), ...frameUp(6, 82, 62, 70, 10, 54, C.darkGrey),
        ...[14, 24, 34, 44, 54, 64, 74].map((u) => ({ box: [[u, u + 5], [14, 62], [30, 50]], color: C.brown })),
        { box: [[10, 78], [14, 62], [26, 30]], color: C.green }, { box: [[70, 78], [8, 14], [54, 62]], color: C.yellow },
    ] };
    const M15 = { key: 'd1', label: '15', stretchV: 1.75, name: 'Mission 15: Biocentric Architecture (dock, guess)', frame: { O: [2858, 820], U: [2951, 904], V: [3001, 684] }, parts: [
        { box: [[4, 80], [6, 76], [0, 50]], color: C.tan }, { box: [[4, 80], [6, 76], [50, 56]], color: C.brightGreen, studs: true },
        { box: [[4, 40], [6, 76], [56, 62]], color: C.black, studs: true },
        { box: [[44, 76], [10, 40], [56, 60]], color: C.red }, { box: [[48, 72], [14, 36], [56, 58]], color: C.clear, opacity: 0.5 },
        ...frameUp(4, 80, 0, 8, 0, 54, C.brightGreen),
        { box: [[20, 34], [-1, 1], [14, 34]], color: C.clear, opacity: 0.6 }, { box: [[50, 64], [-1, 1], [14, 34]], color: C.clear, opacity: 0.6 },
        { box: [[70, 82], [30, 40], [56, 62]], color: C.red },
    ] };

    const MODELS = [M0607, M11, M01, M02, M03, M04, M05, M0809, M10A, M10B, M12A, M12B, M13, M14, M15];

    /** Every part of a model as shapes in wireframe pixels: prism (poly), cyl, sphere, beam (a, b with z), studs. */
    function pieces(model) {
        const out = [];
        const f = model.frame;
        const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
        const eu = unit(f.O, f.U), ev = unit(f.O, f.V);
        const sv = model.stretchV || 1;   // dock models: drawn short, stretched to fill the dock outline
        const px = (u, v) => [f.O[0] + (u * eu[0] + v * sv * ev[0]) / MM_PER_PX, f.O[1] + (u * eu[1] + v * sv * ev[1]) / MM_PER_PX];
        const studsOn = (u0, u1, v0, v1, z, color) => {
            const pts = [];
            for (let u = u0 + STUD / 2; u < u1 - 1; u += STUD) for (let v = v0 + STUD / 2; v < v1 - 1; v += STUD) pts.push(px(u, v));
            if (pts.length) out.push({ kind: 'studs', pts, z, color });
        };
        for (const p of model.parts) {
            const n0 = out.length;
            if (p.box) {
                const [[u0, u1], [v0, v1], [z0, z1]] = p.box;
                out.push({ kind: 'prism', poly: [px(u0, v0), px(u1, v0), px(u1, v1), px(u0, v1)], z0, z1, color: p.color, opacity: p.opacity, group: p.group });
                if (p.studs === true) studsOn(u0, u1, v0, v1, z1, p.color);
            } else if (p.cyl) {
                const c = px(...p.cyl);
                if (p.axis === 'u') {   // a wheel standing up, turning about the u axis
                    const zc = (p.z[0] + p.z[1]) / 2 + p.r - 4;
                    out.push({ kind: 'disc', c, z: zc, r: p.r, axis: eu, thick: p.z[1] - p.z[0], color: p.color });
                } else {
                    out.push({ kind: 'cyl', c, r: p.r, r2: p.r2 ?? p.r, z0: p.z[0], z1: p.z[1], color: p.color });
                }
            } else if (p.sphere) {
                out.push({ kind: 'sphere', c: px(...p.sphere), z: p.z, r: p.r, color: p.color });
            } else if (p.beam) {
                const [a, b] = p.beam;
                out.push({ kind: 'beam', a: px(a[0], a[1]), az: a[2], b: px(b[0], b[1]), bz: b[2], w: p.w, color: p.color });
            } else if (p.leaf) {   // a tall flat leaf (or one lying flat): a thin rounded slab
                const [u, v] = p.leaf, [z0, z1] = p.z;
                if (p.flat) out.push({ kind: 'beam', a: px(u - 4, v), az: z0, b: px(u + 22, v + 6), bz: z0 + 4, w: 10, color: p.color, flatten: true });
                else out.push({ kind: 'beam', a: px(u, v), az: z0, b: px(u, v), bz: z1, w: 12, color: p.color, flatten: true, along: eu });
            }
            if (p.group) for (let i = n0; i < out.length; i++) out[i].group = p.group;
        }
        for (const p of model.extra || []) {
            const n0 = out.length;
            if (p.pxPoly) {
                out.push({ kind: 'prism', poly: p.pxPoly, z0: p.z[0], z1: p.z[1], color: p.color });
            } else if (p.pxBox) {
                const [[x0, y0], [x1, y1]] = p.pxBox;
                out.push({ kind: 'prism', poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0: p.z[0], z1: p.z[1], color: p.color });
            } else if (p.pxBeam) {
                const [a, b] = p.pxBeam;
                out.push({ kind: 'beam', a: [a[0], a[1]], az: a[2], b: [b[0], b[1]], bz: b[2], w: p.w, color: p.color });
            }
            if (p.group) for (let i = n0; i < out.length; i++) out[i].group = p.group;
        }
        return out;
    }

    /** Wireframe pixel for model millimetres (u, v) */
    function framePx(model, u, v) {
        const f = model.frame;
        const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
        const eu = unit(f.O, f.U), ev = unit(f.O, f.V);
        return [f.O[0] + (u * eu[0] + v * ev[0]) / MM_PER_PX, f.O[1] + (u * eu[1] + v * ev[1]) / MM_PER_PX];
    }

    /**
     * Moving parts in wireframe pixels: hinge { a, az, b, bz, toward: pixel vector the top swings towards, max radians }
     * or slide { dir: pixel unit vector, dist mm }. Each follows a state value from 0 to 1 (app.js).
     */
    function moves(model) {
        const P = (u, v) => framePx(model, u, v), o = P(0, 0);
        const vec = (u, v) => { const q = P(u, v); return [q[0] - o[0], q[1] - o[1]]; };
        return (model.moves || []).map((m) => {
            const base = { group: m.group, type: m.type, state: m.state, animate: !!m.animate, max: m.max, dist: m.dist };
            if (m.type === 'slide') { const d = vec(...m.dir), l = Math.hypot(...d); return { ...base, dir: [d[0] / l, d[1] / l] }; }
            const [a, b] = m.pxA ? [m.pxA, m.pxB] : [[...P(m.a[0], m.a[1]), m.a[2]], [...P(m.b[0], m.b[1]), m.b[2]]];
            return { ...base, a: [a[0], a[1]], az: a[2], b: [b[0], b[1]], bz: b[2], toward: m.pxToward || vec(...m.toward) };
        });
    }

    const Models3D = { MODELS, pieces, framePx, moves, MM_PER_PX };
    if (typeof module !== 'undefined' && module.exports) module.exports = Models3D;
    else root.Models3D = Models3D;
})(this);
