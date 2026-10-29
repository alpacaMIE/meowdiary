import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const readJSON = path => JSON.parse(readFileSync(new URL(path, root), "utf8"));

test("all built-in templates resolve to a distinct, nonempty illustration per name", () => {
  const types = readJSON("src/types.json");
  const icons = readJSON("src/type-icons.json");
  const templates = Object.values(types).flatMap(group => group.items);
  const names = [...new Set(templates.map(item => item.name))];
  assert.deepEqual(Object.keys(icons).sort(), names.sort());
  const hashes = new Set();
  for (const name of names) {
    assert.match(icons[name], /^\/assets\/type-icons\/[a-z0-9-]+\.webp$/);
    const image = readFileSync(new URL(`public${icons[name]}`, root));
    assert.equal(image.subarray(0, 4).toString(), "RIFF", name);
    assert.equal(image.subarray(8, 12).toString(), "WEBP", name);
    hashes.add(createHash("sha256").update(image).digest("hex"));
  }
  assert.equal(hashes.size, names.length, "Different names must not silently share a generic placeholder");
});

test("downloadable originals and catalogue manifest cover all template entries", () => {
  const types = readJSON("src/types.json");
  const icons = readJSON("src/type-icons.json");
  const manifest = readJSON("Design/记录类型图标/manifest.json");
  assert.deepEqual(manifest.missing, []);
  assert.equal(manifest.generatedCount, manifest.uniqueTypeCount);
  for (const [group, value] of Object.entries(types)) {
    assert.deepEqual(manifest.groups[group].items.map(({ id, name }) => ({ id, name })), value.items);
    for (const item of manifest.groups[group].items) assert.equal(item.asset, icons[item.name]);
  }
  for (const item of manifest.items) {
    const original = readFileSync(new URL(`Design/记录类型图标/${item.source}`, root));
    assert.equal(createHash("sha256").update(original).digest("hex"), item.sha256, item.name);
    assert.equal(item.transparent, true, item.name);
  }
});
