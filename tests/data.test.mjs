import test from "node:test";
import assert from "node:assert/strict";
import {
  seedData,
  filterRecords,
  defaultFilters,
  makeCSV,
  TODAY,
  dayOffset,
  toggleReminder,
} from "../src/data.js";

test("pet, type, date and search filters intersect without mutating data", () => {
  const { records } = seedData();
  const before = JSON.stringify(records);
  const result = filterRecords(
    records,
    {
      ...defaultFilters,
      pets: ["tuanzi"],
      group: "diary",
      from: TODAY,
      to: TODAY,
    },
    "阳光",
  );
  assert.deepEqual(
    result.map((r) => r.id),
    ["diary-1"],
  );
  assert.equal(JSON.stringify(records), before);
});

test("completing an overdue daily task schedules exactly one future occurrence", () => {
  const reminder = { id: "task", petId: "tuanzi", type: "刷牙", date: "2026-10-25T20:00", repeat: "每天", done: false };
  const reminders = [reminder];
  const now = new Date("2026-10-28T21:00");
  const result = toggleReminder(reminders, reminder, now);
  assert.equal(reminder.done, false);
  assert.equal(result[0].done, true);
  assert.equal(result.length, 2);
  assert.equal(result[1].date, "2026-10-29T20:00");
  assert.equal(result[1].petId, "tuanzi");
  const restored = toggleReminder(result, result[0], now);
  assert.equal(restored[0].done, false);
  assert.equal(toggleReminder(restored, restored[0], now).length, 2);
});

test("a one-time task toggles without creating a record or another reminder", () => {
  const reminder = { id: "once", petId: "xiaomi", type: "梳毛", date: "2026-10-28T20:00", repeat: "从不", done: false };
  const result = toggleReminder([reminder], reminder);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], { ...reminder, done: true });
  assert.deepEqual(toggleReminder(result, result[0]), [reminder]);
});
test("an explicitly empty pet selection never means all pets", () => {
  assert.equal(
    filterRecords(seedData().records, { ...defaultFilters, pets: [] }).length,
    0,
  );
});
test("multiple selected pets and sort order work together", () => {
  const { records } = seedData();
  const result = filterRecords(records, {
    ...defaultFilters,
    pets: ["tuanzi", "xiaomi"],
    sort: "asc",
  });
  assert.equal(result.length, records.length);
  assert.ok(result.every((r, i) => i === 0 || r.date >= result[i - 1].date));
});
test("date range boundaries are inclusive and photos use the same filtered records", () => {
  const result = filterRecords(seedData().records, {
    ...defaultFilters,
    from: dayOffset(-2),
    to: TODAY,
    group: "diary",
  });
  assert.equal(result.length, 2);
  assert.equal(result.flatMap((r) => r.photos).length, 2);
});
test("CSV preserves Chinese, quotes and newlines while guarding spreadsheet formulas", () => {
  const csv = makeCSV([
    ["宠物", "备注"],
    ["团子", '"hello",\n第二行'],
    ["=SUM(1,2)", "+3"],
  ]);
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes('""hello"",\n第二行'));
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"\'+3"'));
});
test("planned reminders do not appear as completed health events", () => {
  const data = seedData();
  const recordIds = new Set(data.records.map((r) => r.id));
  assert.ok(data.reminders.every((r) => !recordIds.has(r.id)));
  assert.equal(
    data.records.filter((r) => r.petId === "tuanzi" && r.date.startsWith(TODAY))
      .length,
    3,
  );
});
