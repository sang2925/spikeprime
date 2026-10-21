/**
 * Read a SPIKE .llsp3 file in memory: outer ZIP -> scratch.sb3 (inner ZIP) -> project.json.
 * Read-only: nothing is ever written back. No DOM; runs in the browser and in Node 18+.
 */
(function (root) {
    'use strict';

    const MAX_FILE_BYTES = 50 * 1024 * 1024;

    function u16(b, o) { return b[o] | (b[o + 1] << 8); }
    function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

    async function inflateRaw(data) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    /** Unzip into Map(name -> Uint8Array). Stored and deflate members only; no ZIP64. Throws Error with a plain message. */
    async function unzip(bytes) {
        if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
        if (bytes.length > MAX_FILE_BYTES) throw new Error('File is too big to be a SPIKE project.');
        let eocd = -1;
        for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
            if (u32(bytes, i) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('Not a ZIP file (a .llsp3 file is a ZIP).');
        const count = u16(bytes, eocd + 10);
        let p = u32(bytes, eocd + 16);
        const files = new Map();
        for (let n = 0; n < count; n++) {
            if (p + 46 > bytes.length || u32(bytes, p) !== 0x02014b50) throw new Error('ZIP directory is damaged.');
            const method = u16(bytes, p + 10);
            const compSize = u32(bytes, p + 20);
            const size = u32(bytes, p + 24);
            const nameLen = u16(bytes, p + 28), extraLen = u16(bytes, p + 30), commentLen = u16(bytes, p + 32);
            const local = u32(bytes, p + 42);
            const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
            p += 46 + nameLen + extraLen + commentLen;
            if (compSize === 0xffffffff || local + 30 > bytes.length || u32(bytes, local) !== 0x04034b50) {
                throw new Error(`ZIP member ${name} is damaged or uses an unsupported format.`);
            }
            const start = local + 30 + u16(bytes, local + 26) + u16(bytes, local + 28);
            const raw = bytes.subarray(start, start + compSize);
            if (raw.length !== compSize) throw new Error(`ZIP member ${name} is cut short.`);
            let data;
            if (method === 0) data = raw;
            else if (method === 8) data = await inflateRaw(raw);
            else throw new Error(`ZIP member ${name} uses compression method ${method}, which is not supported.`);
            if (data.length !== size) throw new Error(`ZIP member ${name} has the wrong size after unpacking.`);
            files.set(name, data);
        }
        return files;
    }

    /** Returns { project, manifest, target } where target is the sprite that holds the blocks */
    async function readLlsp3(bytes) {
        const outer = await unzip(bytes);
        const sb3 = outer.get('scratch.sb3');
        if (!sb3) throw new Error('No scratch.sb3 inside. Is this a SPIKE Word Blocks project?');
        const inner = await unzip(sb3);
        const json = inner.get('project.json');
        if (!json) throw new Error('No project.json inside scratch.sb3.');
        let project;
        try {
            project = JSON.parse(new TextDecoder().decode(json));
        } catch (e) {
            throw new Error('project.json is not valid JSON.');
        }
        let manifest = null;
        try {
            manifest = outer.has('manifest.json') ? JSON.parse(new TextDecoder().decode(outer.get('manifest.json'))) : null;
        } catch (e) { /* manifest is only for the label */ }
        const targets = Array.isArray(project.targets) ? project.targets : [];
        const target = targets.find((t) => !t.isStage && t.blocks && Object.keys(t.blocks).length)
            || targets.find((t) => t.blocks && Object.keys(t.blocks).length);
        if (!target) throw new Error('The project has no blocks.');
        return { project, manifest, target };
    }

    const Llsp3 = { unzip, readLlsp3 };
    if (typeof module !== 'undefined' && module.exports) module.exports = Llsp3;
    else root.Llsp3 = Llsp3;
})(this);
