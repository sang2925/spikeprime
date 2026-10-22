// Open a .llsp3 in the SPIKE web app with Playwright (read-only check: no hub, no upload, no save).
// SPIKE opens files with the browser's showOpenFilePicker; Playwright can't click that native dialog,
// so the picker is answered with the file's bytes before the page loads.
// Usage: node tools/spike_open_check.mjs <file.llsp3> <outDir> [path/to/playwright]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createRequire } from 'node:module';

const [file, outDir, pwPath = 'playwright'] = process.argv.slice(2);
const { chromium } = createRequire(import.meta.url)(pwPath);
mkdirSync(outDir, { recursive: true });

// installed Google Chrome with its own profile kept in outDir, so SPIKE's first-run app download ("This might take
// several minutes") happens once, not every run. Never the user's real Chrome profile.
const browser = await chromium.launchPersistentContext(join(outDir, '.chrome-profile'),
    { headless: false, channel: 'chrome', viewport: { width: 1600, height: 1000 } });
const page = browser.pages()[0] ?? await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(({ name, b64 }) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const f = new File([bytes], name, { type: 'application/octet-stream' });
    window.showOpenFilePicker = async () => [{
        kind: 'file', name, getFile: async () => f,
        queryPermission: async () => 'granted', requestPermission: async () => 'granted', isSameEntry: async () => false,
    }];
}, { name: basename(file), b64: readFileSync(file).toString('base64') });

await page.goto('https://spike.legoeducation.com/prime/lobby');
const gotIt = page.getByRole('button', { name: 'GOT IT' });     // first-run welcome screen in a fresh profile
if (await gotIt.isVisible({ timeout: 5000 }).catch(() => false)) await gotIt.click();
await page.locator('#video_player').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});   // intro video fades out
// the splash screen can come back while SPIKE downloads itself, so keep trying the click for up to 5 minutes
for (let i = 0; ; i++) {
    try { await page.getByRole('button', { name: 'Open Project' }).first().click({ timeout: 10000 }); break; }
    catch (e) {
        if (await gotIt.isVisible().catch(() => false)) await gotIt.click();
        if (i >= 30) { await page.screenshot({ path: join(outDir, 'lobby-fail.png') }); throw e; } }
}
await page.waitForURL(/\/prime\/project/, { timeout: 30000 });
await page.waitForSelector('.blocklyBlockCanvas', { timeout: 30000 });
await page.waitForTimeout(2000);

const result = await page.evaluate(() => ({
    tab: [...document.querySelectorAll('*')].map((e) => e.childElementCount === 0 ? e.textContent.trim() : '')
        .find((t) => /mission/i.test(t) && t.length < 40) || '',
    blockText: [...document.querySelectorAll('.blocklyBlockCanvas .blocklyText')].map((t) => t.textContent),
    comments: [...document.querySelectorAll('textarea')].map((t) => t.value),
}));
result.errors = errors;
writeFileSync(join(outDir, 'result.json'), JSON.stringify(result, null, 1));
await page.screenshot({ path: join(outDir, 'editor.png') });
// scroll the canvas (mouse wheel) to photograph the rest of the scripts
await page.mouse.move(1000, 500);
for (const [name, dx, dy] of [['right', 900, 0], ['down-right', 0, 700], ['down', -900, 0]]) {
    await page.mouse.wheel(dx, dy);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outDir, `editor-${name}.png`) });
}
console.log(JSON.stringify({ tab: result.tab, blockTextCount: result.blockText.length, comments: result.comments.length, errors }));
await browser.close();
