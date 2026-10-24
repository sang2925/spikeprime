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
            // red edge along the top that sticks out past the right side
            { box: [[8, 72], [-1, 2.2], [PLATE, PLATE + 64]], color: C.brown },
            { box: [[-6, 86], [-3, 3], [PLATE + 60, PLATE + 66]], color: C.red },
            { box: [[30, 46], [-2, -1], [30, 50]], color: C.black },
            { box: [[50, 56], [-2, -1], [20, 44]], color: C.darkOrange },
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
            // the leaf fragments standing in the nest (white, yellow, orange, green)
            ...[[C.white, 24], [C.yellow, 34], [C.orange, 44], [C.green, 54]].map(([color, v]) => ({ leaf: [36, v], z: [62, 112], color })),
            // the white toothed rack, pulled out to the starting line, and the ant on its red sled
            { box: [[20, 30], [-92, 40], [PLATE, PLATE + 6]], color: C.white },
            { box: [[22, 28], [-92, 40], [PLATE + 6, PLATE + 9]], color: C.white },
            { box: [[10, 40], [-100, -84], [0, PLATE + 6]], color: C.red },
            { box: [[14, 36], [-98, -86], [PLATE + 6, PLATE + 10]], color: C.black },
            { sphere: [25, -92], z: 30, r: 9, color: C.red },
            { sphere: [25, -92], z: 19, r: 7, color: C.black },
            ...[-1, 1].flatMap((s) => [-97, -92, -87].map((v) => ({ beam: [[25, v, 16], [25 + s * 16, v, 6]], w: 2.5, color: C.black }))),
            { leaf: [40, -90], z: [10, 40], color: C.green, flat: true },
        ],
        // the mycelium tower on the small square beside the nest (pixels, not the nest frame)
        extra: [
            { pxBox: [[2494, 736], [2565, 783]], z: [0, PLATE + BRICK], color: C.white, studs: true },
            { pxBox: [[2500, 748], [2512, 772]], z: [PLATE + BRICK, 110], color: C.grey },
            { pxBox: [[2546, 748], [2558, 772]], z: [PLATE + BRICK, 110], color: C.grey },
            { pxBox: [[2500, 748], [2558, 772]], z: [104, 114], color: C.white },
            // the white mycelium arm, folded: one beam leaning out, the red handle at its end
            { pxBeam: [[2529, 760, 112], [2610, 700, 60]], w: 7, color: C.white },
            { pxBeam: [[2529, 760, 112], [2475, 700, 135]], w: 7, color: C.white },
            { pxBeam: [[2600, 690, 60], [2620, 710, 60]], w: 9, color: C.red },
        ],
    };

    const MODELS = [M0607, M11];

    /** Every part of a model as shapes in wireframe pixels: prism (poly), cyl, sphere, beam (a, b with z), studs. */
    function pieces(model) {
        const out = [];
        const f = model.frame;
        const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
        const eu = unit(f.O, f.U), ev = unit(f.O, f.V);
        const px = (u, v) => [f.O[0] + (u * eu[0] + v * ev[0]) / MM_PER_PX, f.O[1] + (u * eu[1] + v * ev[1]) / MM_PER_PX];
        const studsOn = (u0, u1, v0, v1, z, color) => {
            const pts = [];
            for (let u = u0 + STUD / 2; u < u1 - 1; u += STUD) for (let v = v0 + STUD / 2; v < v1 - 1; v += STUD) pts.push(px(u, v));
            if (pts.length) out.push({ kind: 'studs', pts, z, color });
        };
        for (const p of model.parts) {
            if (p.box) {
                const [[u0, u1], [v0, v1], [z0, z1]] = p.box;
                out.push({ kind: 'prism', poly: [px(u0, v0), px(u1, v0), px(u1, v1), px(u0, v1)], z0, z1, color: p.color, opacity: p.opacity });
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
        }
        for (const p of model.extra || []) {
            if (p.pxBox) {
                const [[x0, y0], [x1, y1]] = p.pxBox;
                out.push({ kind: 'prism', poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0: p.z[0], z1: p.z[1], color: p.color });
            } else if (p.pxBeam) {
                const [a, b] = p.pxBeam;
                out.push({ kind: 'beam', a: [a[0], a[1]], az: a[2], b: [b[0], b[1]], bz: b[2], w: p.w, color: p.color });
            }
        }
        return out;
    }

    const Models3D = { MODELS, pieces, MM_PER_PX };
    if (typeof module !== 'undefined' && module.exports) module.exports = Models3D;
    else root.Models3D = Models3D;
})(this);
