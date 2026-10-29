// Run with a local Vite server and Playwright available through NODE_PATH.
// Uses isolated browser contexts and never clears the user's browser storage.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("dialog", dialog => dialog.accept());
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const button = name => page.getByRole("button", { name, exact: true });
const shot = async name => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const sources = [...document.querySelectorAll("img, svg image")].map(el => el.currentSrc || el.getAttribute("href") || el.getAttribute("src")).filter(Boolean);
    sources.push("/assets/sticker-icons.png");
    await Promise.all([...new Set(sources)].map(src => { const image = new Image(); image.src = src; return image.decode().catch(() => {}); }));
  });
  await page.screenshot({ path: `qa/screenshots/cat-${name}.png`, animations: "disabled" });
};
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("meow-diary-v1")));
const next = () => button("下一步").click();
const skip = () => button("暂不填写，稍后完善").click();
async function date(year, month, day) {
  const y = page.getByRole("listbox", { name: "年", exact: true });
  const m = page.getByRole("listbox", { name: "月", exact: true });
  const d = page.getByRole("listbox", { name: "日", exact: true });
  const now = new Date();
  await y.press("End");
  for (let i = 0; i < now.getFullYear() - year; i++) await y.press("ArrowUp");
  await m.press("Home"); for (let i = 1; i < month; i++) await m.press("ArrowDown");
  await d.press("Home"); for (let i = 1; i < day; i++) await d.press("ArrowDown");
}
try {
  await mkdir("qa/screenshots", { recursive: true });
  await page.goto(base); await button("建立猫咪档案").waitFor(); await shot("21-welcome");
  assert.equal(await saved(), null);
  await button("建立猫咪档案").click(); await next();
  await page.getByText("请先给猫咪起个名字", { exact: true }).waitFor(); await shot("31-name-error");
  assert.equal(await page.locator("#cat-name").evaluate(el => el === document.activeElement), true);
  await page.getByLabel("猫咪名字").fill("团子");
  await button("更换头像").click(); await shot("23-avatar");
  await button("橘猫").click(); await button("使用这个头像").click();
  await button("更换头像").click();
  await page.getByLabel("选择猫咪照片").setInputFiles("public/assets/diary.png");
  await page.getByRole("dialog", { name: "调整猫咪头像" }).waitFor();
  await page.waitForFunction(() => document.querySelector(".cat-crop-box img")?.naturalWidth > 0);
  await page.getByLabel("照片缩放").fill("1.7"); await button("旋转").click();
  const box = await page.locator(".cat-crop-box").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 - 20); await page.mouse.up();
  await shot("24-crop"); await button("重置").click(); await button("完成").click();
  await button("选择猫咪品种").click(); await page.getByLabel("搜索猫咪品种").fill("布偶");
  await button("布偶猫").click(); await page.getByLabel("搜索猫咪品种").fill(""); await shot("25-breed"); await button("确定").click();
  await button("女孩").click(); await shot("22-basics"); await next();
  await button("选择生日").click(); await date(2024, 4, 12); await shot("27-date"); await button("确定").click();
  await button("选择到家日").click(); await date(2024, 6, 1); await button("确定").click();
  assert.ok((await page.locator(".cat-fields").innerText()).includes("2024年4月12日"));
  await shot("26-dates"); await button("跳过").click(); await shot("32-exit");
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("dialog").evaluate(el => el.contains(document.activeElement)), true);
  await button("继续填写").click(); await next();
  await button("已绝育").click(); await page.getByLabel("当前体重").fill("-1"); await button("预览档案").click();
  await page.getByText("请填写大于 0 的体重", { exact: true }).waitFor();
  await page.getByLabel("当前体重").fill("4.2"); await shot("28-health"); await button("预览档案").click();
  await button("修改基本资料").click(); assert.equal(await page.getByLabel("猫咪名字").inputValue(), "团子"); await button("返回确认").click();
  await shot("29-review");
  await page.evaluate(() => { window.originalStorageWrite = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException("Quota exceeded", "QuotaExceededError"); }; });
  await button("创建档案").click(); await page.getByRole("dialog", { name: "暂时没能保存" }).waitFor(); await shot("33-save-error");
  assert.equal(await saved(), null);
  await button("返回检查").click(); assert.ok((await page.locator(".cat-review-card").innerText()).includes("团子"));
  await button("创建档案").click();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorageWrite; });
  await button("重新保存").click(); await button("进入喵日记").waitFor(); await shot("30-success");
  let data = await saved();
  assert.equal(data.pets.length, 1); assert.equal(data.pets[0].species, "猫"); assert.equal(data.pets[0].birthday, "2024-04-12"); assert.equal(data.pets[0].homeDate, "2024-06-01");
  assert.match(data.pets[0].photo, /^data:image\/jpeg;base64,/); assert.equal(data.records.length, 1); assert.equal(data.records[0].weight, 4.2);
  const firstId = data.pets[0].id;
  await button("继续添加猫咪").click(); await page.getByLabel("猫咪名字").fill("小黑");
  await button("更换头像").click(); await button("黑猫").click(); await button("使用这个头像").click();
  await next(); await skip(); await skip(); await button("创建档案").click(); await button("进入喵日记").click();
  data = await saved(); assert.equal(data.pets.length, 2); assert.equal(data.records.length, 1); assert.equal(data.pets[0].id, firstId);
  assert.deepEqual(data.pets[1].imageCrop, [345, 1257, 202, 202]); assert.equal(data.pets[1].homeDate, "");
  assert.ok(!(await page.locator("body").innerText()).includes("NaN"));
  await page.reload(); await page.getByRole("navigation", { name: "主导航" }).waitFor();
  assert.equal(await button("建立猫咪档案").count(), 0);
  await button("猫咪").click(); await button("添加猫咪").first().click();
  await page.getByLabel("猫咪名字").fill("未保存"); await button("跳过").click(); await button("放弃建档").click();
  assert.equal((await saved()).pets.length, 2);
  await page.goto(base + "/?onboarding=1"); await button("建立猫咪档案").waitFor();
  assert.equal((await saved()).pets.length, 2);
  for (const [width, height] of [[320, 740], [375, 812], [768, 1024], [1280, 800], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.locator(".app-shell").evaluate(el => Math.round(el.getBoundingClientRect().width)), width);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await shot(`responsive-${width}`);
    await button("建立猫咪档案").click();
    await shot(`basics-${width}`);
    const overflow = await page.locator(".cat-flow-scroll").evaluate(el => el.scrollWidth > el.clientWidth);
    assert.equal(overflow, false, `form overflows at ${width}`);
    await button("更换头像").click(); assert.ok(await button("使用这个头像").isVisible()); await page.keyboard.press("Escape");
    await button("跳过").click(); await button("放弃建档").click();
  }
  // Returning from the success screen to add another cat must also allow a clean exit.
  await page.setViewportSize({ width: 375, height: 812 });
  await button("建立猫咪档案").click(); await page.getByLabel("猫咪名字").fill("名字就够了");
  await next(); await skip(); await skip(); await button("创建档案").click(); await button("继续添加猫咪").click();
  await button("跳过").click(); await button("放弃建档").click(); await page.getByRole("navigation", { name: "主导航" }).waitFor();
  assert.equal((await saved()).pets.length, 3);
  assert.equal((await saved()).records.length, 1);
  assert.deepEqual(errors, []);
  console.log("PASS: all 13 onboarding states, actual crop upload, persistence, retry, name-only creation, multi-cat, discard, focus containment and 5 responsive sizes.");
} catch (error) {
  await page.screenshot({ path: "qa/screenshots/cat-debug-failure.png" }).catch(() => {});
  console.error(await page.locator("body").innerText());
  throw error;
} finally { await browser.close(); }
