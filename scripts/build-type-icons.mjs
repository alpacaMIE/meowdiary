import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { iconSubjects, iconPrompt, stylePrompt } from "./type-icon-specs.mjs";

// Originals stay untouched. This only exports smaller, alpha-preserving web assets.
const sharp = createRequire(import.meta.url)("sharp");
const root = new URL("../", import.meta.url);
const partial = process.argv.includes("--partial");
const types = JSON.parse(await readFile(new URL("src/types.json", root), "utf8"));
const templateNames = new Set(Object.values(types).flatMap(group => group.items.map(item => item.name)));
const specifications = new Map(iconSubjects.map(subject => [subject[0], subject]));
if (specifications.size !== iconSubjects.length || new Set(iconSubjects.map(item => item[1])).size !== iconSubjects.length)
  throw Error("Duplicate icon name or filename");
for (const name of templateNames) if (!specifications.has(name)) throw Error(`Missing icon specification: ${name}`);
await mkdir(new URL("public/assets/type-icons/", root), { recursive: true });
await mkdir(new URL("Design/记录类型图标/", root), { recursive: true });
const assets = {}, items = [], missing = [];
for (const subject of iconSubjects) {
  const [name, slug] = subject;
  const source = new URL(`Design/记录类型图标/原图/${slug}.png`, root);
  const output = new URL(`public/assets/type-icons/${slug}.webp`, root);
  let original;
  try { original = await readFile(source); } catch (error) {
    if (error.code !== "ENOENT") throw error;
    missing.push(name); continue;
  }
  const metadata = await sharp(original).metadata();
  if (!metadata.hasAlpha) throw Error(`Missing transparent alpha channel: ${slug}`);
  const alpha = await sharp(original).extractChannel("alpha").stats();
  if (alpha.channels[0].min !== 0 || alpha.channels[0].max < 200) throw Error(`Invalid transparency: ${slug}`);
  let fresh = false;
  try { fresh = (await stat(output)).mtimeMs >= (await stat(source)).mtimeMs; } catch {}
  if (!fresh) await sharp(original).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(fileURLToPath(output));
  assets[name] = `/assets/type-icons/${slug}.webp`;
  items.push({ name, slug, source: `原图/${slug}.png`, asset: assets[name], width: metadata.width, height: metadata.height, transparent: true, sha256: createHash("sha256").update(original).digest("hex"), prompt: iconPrompt(subject) });
}
if (missing.length && !partial) throw Error(`Missing ${missing.length} generated icons: ${missing.join("、")}`);
const groups = Object.fromEntries(Object.entries(types).map(([key, group]) => [key, { label: group.label, items: group.items.map(item => ({ ...item, asset: assets[item.name] || null })) }]));
await writeFile(new URL("src/type-icons.json", root), JSON.stringify(assets, null, 2) + "\n");
await writeFile(new URL("Design/记录类型图标/manifest.json", root), JSON.stringify({ generator: "built-in image_gen", styleReference: "../../public/assets/sticker-icons.png", stylePrompt, templateCount: Object.values(types).reduce((n, group) => n + group.items.length, 0), uniqueTypeCount: templateNames.size, generatedCount: items.length, missing, groups, items }, null, 2) + "\n");
console.log(`Exported ${items.length}/${templateNames.size} transparent icons; ${missing.length} remaining.`);
