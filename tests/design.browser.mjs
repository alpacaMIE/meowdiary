// Browser regression and reference-alignment captures. Uses disposable storage only.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const sizes = process.env.QA_WIDTH ? [Number(process.env.QA_WIDTH)] : [375, 320, 768, 1440];
const results = [];
try {
  await mkdir("qa/alignment", { recursive: true });
  for (const width of sizes) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: "light" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(async () => {
      const { seedData, TODAY, dayOffset } = await import("/src/data.js");
      const data = seedData();
      data.records.find(r => r.id === "diary-1").photos = ["/assets/diary.png", "/assets/cat-photo.png", "/assets/diary.png"];
      data.records.push({ id: "qa-old-photo", petId: "tuanzi", group: "diary", type: "日记", title: "一起的小时光", date: `${dayOffset(-35)}T12:00`, photos: ["/assets/diary.png"] });
      data.reminders.push({ id: "qa-care", petId: "tuanzi", type: "猫三联疫苗", date: `${dayOffset(30)}T10:00`, done: false, repeat: "从不" });
      localStorage.setItem("meow-diary-v1", JSON.stringify(data));
    });
    await page.reload();
    const button = name => page.getByRole("button", { name, exact: true });
    const nav = name => page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name, exact: true }).click();
    const back = () => button("返回").click();
    const shot = async name => {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll("img")].map(i => i.decode().catch(() => {})));
      });
      const overflow = await page.evaluate(() => [...document.querySelectorAll(".app-scroll, .page-content, .sheet, .form-card, .settings-group")].filter(el => el.clientWidth && el.scrollWidth > el.clientWidth + 2).map(el => `${el.className}: ${el.scrollWidth}/${el.clientWidth}`));
      assert.deepEqual(overflow, [], `${width} ${name}: horizontal overflow`);
      await page.screenshot({ path: `qa/alignment/${width}-${name}.png`, animations: "disabled", style: ".toast { visibility: hidden; }" });
      if (width === 375 && !(await page.getByRole('dialog').count())) await page.screenshot({ path: `qa/alignment/full-${name}.png`, fullPage: true, animations: "disabled", style: ".toast { visibility:hidden } .app-shell { height:auto!important;min-height:100vh;overflow:visible!important } .app-scroll { height:auto!important;overflow:visible!important;flex:none!important;padding-bottom:24px!important } .bottom-nav { position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;margin:12px 14px!important;flex:none!important } .topbar { position:relative!important }" });
      results.push({ width, name });
    };
    await button("写日记").waitFor(); await shot("01-home");
    await nav("新增记录"); await shot("05-quick-add");
    await page.getByRole("dialog").getByRole("button", { name: "写日记", exact: true }).click();
    await page.getByLabel("日记标题", { exact: true }).fill("今天的故事");
    await page.getByLabel("日记正文", { exact: true }).fill("今天天气很好，团子在阳台晒太阳，还和最喜欢的蝴蝶玩了一会儿。心情看起来很不错～");
    await page.getByLabel("日记位置").fill("阳台"); await page.getByLabel("日记标签").fill("晒太阳,开心");
    await page.locator('.photo-upload input').setInputFiles("public/assets/diary.png");
    await page.locator('.photo-thumb').waitFor(); await shot("06-diary");
    await button("保存日记").click(); await button("写日记").waitFor();
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("meow-diary-v1")).records.some(r => r.tags === "晒太阳,开心" && r.location === "阳台")));
    await button("喂食").click(); await page.getByPlaceholder("例如：鸡肉冻干猫粮").fill("猫粮"); await page.getByLabel("喂食数量").fill("60"); await shot("07-food");
    await page.locator('.food-history > button').first().click(); await button("取消").click();
    assert.equal(await page.getByLabel("喂食数量").inputValue(), "60");
    await button("保存喂食记录").click(); await button("写日记").waitFor();
    await nav("时光"); await shot("02-timeline");
    await page.locator('.timeline-card').first().click(); await shot("record-detail"); await back();
    await button("筛选记录").click(); await shot("17-filter");
    await page.locator('.filter-types').getByRole('button', { name: '日记', exact: true }).click();
    await page.locator('.filter-types').getByRole('button', { name: '体重', exact: true }).click();
    await button("查看结果").click();
    assert.equal(await page.getByRole('button', { name: '2 种记录' }).count(), 1);
    await button("筛选记录").click(); await button("清空").click(); await button("查看结果").click();
    await page.getByLabel("时光视图").selectOption("photos"); await shot("12-photos");
    assert.ok(await page.locator('.photo-wall > section, .photo-wall section').count() >= 2);
    await page.locator('.photo-grid button').first().click(); await shot("photo-viewer"); await button("关闭").click();
    await page.getByLabel("时光视图").selectOption("calendar"); await shot("calendar");
    await button("上个月").click(); await button("下个月").click();
    await nav("猫咪"); await shot("09-cats"); await page.locator('.pet-list-card').first().click(); await shot("04-profile");
    await button("编辑").click(); await shot("edit-profile"); await back();
    await page.locator('.profile-stats > button').first().click(); await shot("03-weight"); await back();
    await button("编辑猫咪形象").click(); await shot("10-appearance"); await button("暖棕").click(); await button("保存形象").click();
    await page.getByRole('button', { name: /^健康与护理/ }).click(); await shot("11-health");
    await button("添加护理记录").click();
    const nextDate = await page.evaluate(async () => (await import('/src/data.js')).dayOffset(45));
    await page.getByLabel("下次提醒", { exact: false }).fill(nextDate);
    await button("保存记录").click(); await page.getByRole('heading', { name: '健康与护理', exact: true }).waitFor();
    assert.ok(await page.evaluate(date => JSON.parse(localStorage.getItem("meow-diary-v1")).reminders.some(r => r.date.startsWith(date)), nextDate));
    await back(); await page.getByRole('button', { name: /^分享它的可爱/ }).click(); await shot("14-share");
    const pngDownload = page.waitForEvent("download"); await button("保存图片").click();
    const png = await pngDownload; assert.ok(png.suggestedFilename().endsWith(".png"));
    if (width === 375) await png.saveAs("qa/alignment/share-export.png");
    await back(); await page.getByRole('button', { name: /^提醒与待办/ }).click(); await shot("08-reminders");
    await page.getByRole('button', { name: /^即将到来/ }).click(); await shot("08-upcoming");
    await nav("我的"); await shot("16-me");
    for (const [name, screenshot] of [["外观模式", "18-display"], ["通知与提醒", "19-notifications"], ["本地数据管理", "20-storage"], ["可读资料导出", "15-export"], ["囤货清单", "stock"], ["养宠账本", "ledger"], ["隐私与权限", "privacy"], ["使用帮助", "help"], ["关于喵日记", "about"]]) {
      await page.getByRole('button', { name: new RegExp(`^${name}`) }).click(); await shot(screenshot);
      if (name === "外观模式") { await button("深色模式").click(); await shot("18-dark"); await button("浅色模式").click(); }
      if (name === "可读资料导出") { const download = page.waitForEvent("download"); await button("导出所选内容").click(); assert.ok((await download).suggestedFilename().endsWith('.csv')); }
      await back();
    }
    await nav("新增记录"); await page.getByRole('button', { name: /^更多记录类型/ }).click(); await shot("catalog"); await button("关闭").click();
    for (const [label, id] of [["记事", "note"], ["提醒", "reminder"], ["记账", "expense"], ["体征", "symptom"], ["囤货", "stock"]]) {
      await nav("新增记录"); await page.getByRole('button', { name: /^更多记录类型/ }).click();
      await page.locator('.catalog-tabs').getByRole('button', { name: label, exact: true }).click();
      await page.locator('.type-grid button').first().click(); await shot(`form-${id}`); await back();
    }
    assert.deepEqual(errors, [], `${width} browser errors`);
    await context.close();
  }
  const gallery = await browser.newPage();
  await gallery.goto(`${base}/qa/design-alignment.html`);
  const count = await gallery.locator('#page option').count();
  assert.equal(count, 32);
  for (let i = 0; i < count; i++) {
    await gallery.locator('#page').selectOption(String(i));
    assert.equal(await gallery.locator('.compare img').evaluateAll(async images => {
      await Promise.all(images.map(image => image.decode()));
      return images.every(image => image.naturalWidth > 0);
    }), true);
  }
  await gallery.close();
  await writeFile("qa/alignment/results.json", JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} page captures; diary/feed/health save, multi-filter, calendar, themes, PNG/CSV downloads; no horizontal overflow or browser errors.`);
} finally { await browser.close(); }
