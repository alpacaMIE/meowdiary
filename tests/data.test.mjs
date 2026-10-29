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
  reminderRepeatLabel,
} from "../src/data.js";
import { HOUSEHOLD, isLifeRecord, stockStatus, selectStock, adjustStock, saveManagedRecord, deleteManagedRecord, addStockReminder, expenseSummary, symptomSummary } from "../src/careData.js";

test("multiple record types intersect with cats and dates without including unrelated records", () => {
  const records = seedData().records;
  const result = filterRecords(records, { ...defaultFilters, pets: ["tuanzi"], groups: ["diary", "weight"], from: TODAY, to: TODAY });
  assert.ok(result.length >= 2);
  assert.ok(result.every(r => r.petId === "tuanzi" && ["diary", "weight"].includes(r.group) && r.date.startsWith(TODAY)));
  assert.equal(filterRecords(records, { ...defaultFilters, groups: [] }).length, records.length);
});

test("stock is current balance, ordered by expiry, with shared supplies and a separate empty shelf", () => {
  const records = [
    { id: "fresh", group: "stock", petId: "a", type: "食品", itemName: "猫粮", quantity: 3, expiry: "2027-01-01" },
    { id: "shared", group: "stock", petId: HOUSEHOLD, type: "药品", itemName: "药", quantity: 1, expiry: "2026-10-30" },
    { id: "used", group: "stock", petId: "a", type: "食品", itemName: "罐头", quantity: 0, expiry: "2026-09-01" },
    { id: "other", group: "stock", petId: "b", type: "用具", itemName: "玩具", quantity: 2, expiry: "2027-02-01" },
  ];
  assert.deepEqual(selectStock(records, "a").map((r) => r.id), ["shared", "fresh"]);
  assert.deepEqual(selectStock(records, "a", "食品").map((r) => r.id), ["fresh"]);
  assert.deepEqual(selectStock(records, "a", "已用完").map((r) => r.id), ["used"]);
  const data = { records, reminders: [] }, next = adjustStock(data, "shared", -1);
  assert.equal(records[1].quantity, 1);
  assert.equal(selectStock(next.records, "a", "已用完").length, 2);
  assert.equal(adjustStock(next, "shared", -1).records[1].quantity, 0);
  assert.equal(adjustStock(next, "shared", 1).records[1].quantity, 1);
  assert.equal(stockStatus({ expiry: "2026-11-27" }, "2026-10-28").tone, "soon");
  assert.equal(stockStatus({ expiry: "2026-10-28" }, "2026-10-28").label, "今天到期");
  assert.equal(stockStatus({ expiry: "2026-10-27" }, "2026-10-28").label, "已过期");
});

test("stock bookkeeping is atomic and idempotent, and manually edited or unlinked bills survive stock deletion", () => {
  const stock = { id: "stock", group: "stock", petId: HOUSEHOLD, type: "食品", itemName: "猫粮", quantity: 3, amount: "20.10", date: "2026-10-28T10:00", bookExpense: true };
  let data = saveManagedRecord({ records: [], reminders: [] }, stock);
  assert.equal(data.records.length, 2);
  data = saveManagedRecord(data, { ...stock, quantity: 2, amount: "30" });
  assert.equal(data.records.length, 2);
  const bill = data.records.find((r) => r.group === "expense");
  assert.equal(bill.amount, 30);
  data = saveManagedRecord(data, { ...bill, amount: 25, direction: "收入" });
  assert.equal(data.records.find((r) => r.id === stock.id).bookExpense, false);
  assert.equal(data.records.find((r) => r.id === bill.id).sourceStockId, undefined);
  data = deleteManagedRecord(data, stock);
  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].amount, 25);
  let linked = saveManagedRecord({ records: [], reminders: [] }, stock);
  linked = deleteManagedRecord(linked, linked.records.find((r) => r.group === "expense"));
  assert.equal(linked.records[0].bookExpense, false);
  assert.equal(saveManagedRecord(linked, linked.records[0]).records.length, 1);
});

test("stock expiry reminders are explicit, deduplicated and removed with their supply", () => {
  const stock = { id: "s", group: "stock", petId: HOUSEHOLD, itemName: "罐头", quantity: 1, expiry: "2026-11-02" };
  const original = { records: [stock], reminders: [] };
  const next = addStockReminder(original, stock, "expiry", "2026-10-28");
  assert.equal(original.reminders.length, 0);
  assert.equal(next.reminders[0].date, "2026-11-02T09:00");
  assert.equal(addStockReminder(next, stock, "expiry", "2026-10-28"), next);
  assert.equal(deleteManagedRecord(next, stock).reminders.length, 0);
  assert.equal(adjustStock(next, stock.id, -1).reminders.length, 0);
  const edited = saveManagedRecord(next, { ...stock, expiry: "2026-11-10", itemName: "鸡肉罐头" });
  assert.equal(edited.reminders[0].date, "2026-11-10T09:00");
  assert.equal(edited.reminders[0].type, "检查有效期 · 鸡肉罐头");
  assert.equal(addStockReminder(original, { ...stock, expiry: "2026-10-27" }, "expiry", "2026-10-28").reminders[0].date, "2026-10-29T09:00");
});

test("ledger filters periods and pets, counts cents exactly, and excludes income from expense shares", () => {
  const bill = (id, petId, date, amount, type = "猫粮", direction = "支出") => ({ id, petId, date, amount, type, direction, group: "expense" });
  const records = [bill("1", "a", "2026-10-31T23:59", 0.1), bill("2", "a", "2026-10-31T12:00", 0.2), bill("3", "a", "2026-10-28T10:00", 50, "补贴", "收入"), bill("4", HOUSEHOLD, "2026-10-28T12:00", 20, "药品"), bill("5", "a", "2026-09-30T12:00", 100), bill("6", "a", "2026-11-01T00:00", 200)];
  const month = expenseSummary(records, { month: "2026-10", petId: "a" });
  assert.equal(month.spent, 0.3); assert.equal(month.income, 50);
  assert.equal(month.entries.length, 3); assert.equal(month.categories.length, 1);
  assert.equal(month.categories[0].percent, 100); assert.equal(month.days[0].spent, 0.3);
  assert.equal(expenseSummary(records, { month: "2026-10" }).spent, 20.3);
  assert.equal(expenseSummary(records, { month: "2026-10", year: true, petId: "a" }).spent, 300.3);
  assert.equal(expenseSummary(records, { month: "2027-01" }).entries.length, 0);
});

test("symptom summary covers exactly 30 calendar days for one pet and timeline stays focused on life", () => {
  const r = (id, date, petId = "a", group = "symptom") => ({ id, date, petId, group, type: "软便" });
  const records = [r("1", "2026-09-29T00:00"), r("2", "2026-10-28T23:59"), r("3", "2026-09-28T23:59"), r("4", "2026-10-29T00:00"), r("5", "2026-10-28T12:00", "b"), r("6", "2026-10-28T12:00", "a", "stock"), r("7", "2026-10-28T12:00", "a", "expense")];
  assert.deepEqual(symptomSummary(records, "a", "2026-10-28"), { count: 2, types: [["软便", 2]] });
  assert.equal(records.filter(isLifeRecord).length, 5);
  assert.equal(filterRecords(records, { ...defaultFilters, group: "stock" }).length, 1);
});

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

test("custom reminders use the selected interval and preserve it for the next occurrence", () => {
  const cases = [
    { frequency: 2, frequencyUnit: "day", date: "2026-10-30T20:00", now: "2026-10-30T21:00", next: "2026-11-01T20:00", label: "每隔 2 天" },
    { frequency: 3, frequencyUnit: "hour", date: "2026-10-30T23:30", now: "2026-10-30T23:40", next: "2026-10-31T02:30", label: "每隔 3 小时" },
    { frequency: 2, frequencyUnit: "day", date: "2026-10-20T09:00", now: "2026-10-28T10:00", next: "2026-10-30T09:00", label: "每隔 2 天" },
    { frequency: 4, frequencyUnit: "hour", date: "2026-10-27T09:00", now: "2026-10-28T10:00", next: "2026-10-28T13:00", label: "每隔 4 小时" },
    { frequency: 6, date: "2026-10-28T09:00", now: "2026-10-28T10:00", next: "2026-10-28T15:00", label: "每隔 6 小时" },
  ];
  for (const { now, next, label, ...interval } of cases) {
    const reminder = { id: "custom", petId: "tuanzi", type: "训练", repeat: "自定义", done: false, ...interval };
    const result = toggleReminder([reminder], reminder, new Date(now));
    assert.equal(result.length, 2);
    assert.equal(result[1].date, next);
    assert.equal(result[1].frequency, reminder.frequency);
    assert.equal(result[1].frequencyUnit, reminder.frequencyUnit);
    assert.equal(reminderRepeatLabel(result[1]), label);
  }
  assert.equal(reminderRepeatLabel({ repeat: "每天" }), "每天");
  assert.equal(reminderRepeatLabel({ repeat: "从不" }), "从不");
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
