// Verify the entire illustrated catalogue in disposable browser storage.
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)("playwright");
const types = JSON.parse(await readFile("src/types.json", "utf8"));
const assets = JSON.parse(await readFile("src/type-icons.json", "utf8"));
assert.equal(Object.keys(assets).length, new Set(Object.values(types).flatMap(group => group.items.map(item => item.name))).size, "Generate and export the complete catalogue before running this check");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const results = [];
const decode = page => page.locator('.type-sticker').evaluateAll(async images => {
  await Promise.all(images.map(image => image.decode()));
  return images.every(image => image.naturalWidth === 256 && image.naturalHeight === 256);
});
try {
  await mkdir("qa/type-icons", { recursive: true });
  for (const width of [320, 375, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: "light" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async () => {
      const { seedData } = await import('/src/data.js');
      localStorage.setItem('meow-diary-v1', JSON.stringify(seedData()));
    });
    await page.reload();
    await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: '新增记录', exact: true }).click();
    for (const group of ['note', 'reminder', 'expense', 'symptom', 'stock']) {
      await page.locator('.catalog-tabs').getByRole('button', { name: types[group].label, exact: true }).click();
      const items = await page.locator('.type-grid button').evaluateAll(buttons => buttons.slice(0, -1).map(button => ({ name: button.innerText, src: button.querySelector('img.type-sticker')?.getAttribute('src') })));
      assert.deepEqual(items, types[group].items.map(item => ({ name: item.name, src: assets[item.name] })));
      assert.equal(await decode(page), true);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.app-scroll,.sheet,.catalog-tabs,.type-grid')].filter(el => el.clientWidth && el.scrollWidth > el.clientWidth + 2).map(el => el.className));
      assert.deepEqual(overflow, []);
      await page.screenshot({ path: `qa/type-icons/${width}-${group}.png`, animations: 'disabled' });
      if (width === 375) await page.screenshot({ path: `qa/type-icons/full-${group}.png`, fullPage: true, animations: 'disabled', style: 'html,body,#root,.app-shell { height:auto!important;overflow:visible!important } .sheet-overlay { position:relative!important;height:auto!important;min-height:100vh;align-items:flex-start!important;padding:0!important } .sheet.catalog-sheet { height:auto!important;max-height:none!important } .catalog-body { flex:none!important;overflow:visible!important } .app-scroll,.bottom-nav,.toast { display:none!important }' });
      results.push({ width, group, templates: items.length, loaded: true, overflow: false });
    }
    await page.locator('.catalog-tabs').getByRole('button', { name: '记事', exact: true }).click();
    await page.getByPlaceholder('搜索记录类型').fill('剪指甲');
    assert.equal(await page.locator('.type-grid .type-sticker').count(), 1);
    await page.locator('.type-grid button').first().click();
    await page.locator('.form-note').waitFor();
    assert.equal(await page.locator('.type-selection .type-sticker').getAttribute('src'), assets['剪指甲']);
    assert.equal(await decode(page), true);
    if (width === 375) {
      await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('meow-diary-v1'));
        data.customTypes.note = [{ id: 'qa-custom-icon', name: '睡前摸摸', icon: 'Heart' }];
        localStorage.setItem('meow-diary-v1', JSON.stringify(data));
      });
      await page.reload();
      await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: '新增记录', exact: true }).click();
      await page.getByPlaceholder('搜索记录类型').fill('睡前摸摸');
      assert.equal(await page.locator('.type-grid .type-sticker').count(), 0);
      assert.equal(await page.locator('.type-grid .reference-icon').count(), 1);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${base}/Design/记录类型图标/index.html`);
  await page.locator('.card').first().waitFor();
  assert.equal(await page.locator('.card').count(), Object.keys(assets).length);
  await page.locator('.art img').evaluateAll(async images => { for (const image of images) image.loading = 'eager'; await Promise.all(images.map(image => image.decode())); });
  await page.screenshot({ path: 'qa/type-icons/all-icons.png', fullPage: true });
  await page.getByLabel('预览方式').selectOption('compact');
  await page.getByRole('button', { name: '深色底预览', exact: true }).click();
  await page.screenshot({ path: 'qa/type-icons/all-icons-dark-48.png', fullPage: true });
  await page.getByLabel('搜索类型名称').fill('保险');
  assert.equal(await page.locator('.card').count(), 1);
  await writeFile('qa/type-icons/results.json', JSON.stringify(results, null, 2) + '\n');
  console.log(`PASS: ${Object.keys(assets).length} independent icons; all 183 templates rendered at 4 viewport sizes; search, form icons, and light/dark preview gallery.`);
} finally { await browser.close(); }
