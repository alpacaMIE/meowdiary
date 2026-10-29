import test from "node:test";
import assert from "node:assert/strict";
import { emptyData, loadData, seedData, togetherDays } from "../src/data.js";
import { addCatProfile, catErrors, cropGeometry, newCatDraft, validPastDate } from "../src/catProfile.js";

test("first launch has no demo pets; existing diaries and settings survive loading", () => {
  const old = globalThis.localStorage;
  try {
    globalThis.localStorage = { getItem: () => null };
    assert.deepEqual(loadData(), emptyData());
    const saved = { ...seedData(), settings: { theme: "dark" } };
    globalThis.localStorage = { getItem: () => JSON.stringify(saved) };
    assert.deepEqual(loadData().pets, saved.pets);
    assert.deepEqual(loadData().records, saved.records);
    assert.deepEqual(loadData().settings, { theme: "dark", notifications: false });
    globalThis.localStorage = { getItem: () => { throw Error("Blocked"); } };
    assert.deepEqual(loadData(), emptyData());
  } finally { if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old; }
});
test("only name is required; optional dates and weights are validated when supplied", () => {
  const draft = { ...newCatDraft(), name: "   " };
  assert.equal(catErrors(draft).name, "请先给猫咪起个名字");
  assert.deepEqual(catErrors({ ...draft, name: "团子" }), {});
  assert.equal(togetherDays(""), null);
  for (const date of ["2024-02-30", "2025-02-29", "2030-01-01", "bad-date"]) assert.equal(validPastDate(date, "2026-10-29"), false);
  assert.equal(validPastDate("2024-02-29", "2026-10-29"), true);
  assert.ok(catErrors({ ...draft, homeDate: "2024-01-01", birthday: "2024-04-12" }).homeDate);
  for (const weight of ["0", "-4", "Infinity", "abc"]) assert.ok(catErrors({ ...draft, weight }).weight);
});
test("profile and optional first weight are saved atomically without duplicates on retry", () => {
  const before = seedData(), snapshot = JSON.stringify(before);
  const draft = { ...newCatDraft(), name: " 团团 ", weight: "4.2", species: "狗" };
  const saved = addCatProfile(before, draft, new Date("2026-10-29T12:30:00"));
  assert.equal(JSON.stringify(before), snapshot);
  assert.equal(saved.pets.length, before.pets.length + 1);
  assert.equal(saved.pets.at(-1).name, "团团"); assert.equal(saved.pets.at(-1).species, "猫");
  assert.equal(saved.pets.at(-1).birthday, ""); assert.equal(saved.pets.at(-1).homeDate, "");
  assert.equal(saved.records.at(-1).petId, draft.id); assert.equal(saved.records.at(-1).weight, 4.2);
  assert.equal(saved.currentPetId, draft.id); assert.equal(saved.reminders, before.reminders);
  assert.equal(addCatProfile(saved, draft), saved);
  const minimal = addCatProfile(emptyData(), { ...newCatDraft(), name: "小猫" });
  assert.equal(minimal.records.length, 0);
  assert.throws(() => addCatProfile(emptyData(), newCatDraft()));
});
test("crop bounds keep the complete crop area covered after zoom, drag and rotation", () => {
  for (const [width, height] of [[1200, 600], [600, 1200]]) for (const rotation of [0, 90, 180, 270]) for (const zoom of [1, 1.7, 3]) {
    const g = cropGeometry(width, height, rotation, zoom, { x: 100, y: -100 });
    const w = (rotation % 180 ? height : width) * g.scale;
    const h = (rotation % 180 ? width : height) * g.scale;
    assert.ok(w / 2 - Math.abs(g.x) >= .5 - 1e-9);
    assert.ok(h / 2 - Math.abs(g.y) >= .5 - 1e-9);
  }
});
