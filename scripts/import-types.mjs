import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const source = readFileSync(
  new URL("../Design/内置类型清单.md", import.meta.url),
  "utf8",
);
const groups = [
  ["reminder", "提醒", "提醒类型", 25],
  ["expense", "记账", "记账分类", 50],
  ["symptom", "体征", "异常/体征记录类型", 20],
  ["note", "记事", "记事类型", 85],
  ["stock", "囤货", "囤货分类", 3],
];
const types = {};
for (const [id, label, heading, count] of groups) {
  const section = source
    .split(
      new RegExp("二、" + heading.replace("/", "\\/") + "（共 \\d+ 项）"),
    )[1]
    ?.split("最后加一项")[0];
  if (!section) throw Error(`Missing ${heading}`);
  const items = [...section.matchAll(/^\s+(\d+)\.\s+(.+?)（英文/gm)].map(
    (m) => ({ id: `${id}-${m[1]}`, name: m[2].trim() }),
  );
  if (items.length !== count)
    throw Error(`${id}: expected ${count}, got ${items.length}`);
  types[id] = { label, items };
}
const output = JSON.stringify(types, null, 2) + "\n";
const target = new URL("../src/types.json", import.meta.url);
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== output)
    throw Error("Type catalogue differs from design source");
} else {
  mkdirSync(new URL("../src", import.meta.url), { recursive: true });
  writeFileSync(target, output);
}
console.log(
  "Verified 183 built-in types across 5 groups; source order and duplicate entries preserved.",
);
