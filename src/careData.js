import { TODAY, uid } from "./data.js";

export const HOUSEHOLD = "household";
export const householdPet = { id: HOUSEHOLD, name: "家里共用" };
export const isLifeRecord = (r) => !["stock", "expense"].includes(r.group);
export const money = (amount) => Number(amount || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (value) => Math.round((Number(value) || 0) * 100);
export const stockQuantity = (r) => Math.max(0, Number(r.quantity) || 0);
export function stockStatus(r, today = TODAY) {
  if (!r.expiry) return { label: "未填有效期", tone: "neutral", days: Infinity };
  const days = Math.round((Date.parse(r.expiry.slice(0, 10)) - Date.parse(today)) / 86400000);
  if (!Number.isFinite(days)) return { label: "未填有效期", tone: "neutral", days: Infinity };
  return { days, tone: days < 0 ? "expired" : days <= 30 ? "soon" : "neutral",
    label: days < 0 ? "已过期" : days === 0 ? "今天到期" : days <= 30 ? `剩 ${days} 天` : `${r.expiry} 到期` };
}
export function selectStock(records, petId = "all", category = "全部") {
  return records.filter((r) => r.group === "stock" && (petId === "all" || r.petId === petId || (petId !== HOUSEHOLD && r.petId === HOUSEHOLD)))
    .filter((r) => category === "已用完" ? stockQuantity(r) === 0 : stockQuantity(r) > 0 && (category === "全部" || r.type === category))
    .sort((a, b) => stockStatus(a).days - stockStatus(b).days || a.itemName.localeCompare(b.itemName));
}
export function adjustStock(data, id, delta) {
  const records = data.records.map((r) => r.id === id && r.group === "stock"
    ? { ...r, quantity: Math.max(0, Math.round((stockQuantity(r) + delta) * 100) / 100) } : r);
  const used = records.find((r) => r.id === id && r.group === "stock" && stockQuantity(r) === 0);
  return { ...data, records, reminders: used ? data.reminders.filter((r) => r.done || r.sourceStockId !== id || r.stockPurpose !== "expiry") : data.reminders };
}
export function expenseCategory(r) {
  if (/粮|食品|零食|罐头|骨肉|宠饭|奶/.test(r.type)) return "食品零食";
  if (/药|疫苗|驱虫|生病|绝育|保健|钙|营养|益生|元素|联$/.test(r.type)) return "医疗护理";
  if (/用品|猫砂|尿垫|食具|宠窝|笼|耗材|玩具|服饰/.test(r.type)) return "日常用品";
  return "生活服务";
}
export function expenseSummary(records, { month = TODAY.slice(0, 7), year = false, petId = "all" } = {}) {
  const entries = records.filter((r) => r.group === "expense" && r.date.startsWith(year ? month.slice(0, 4) : month) && (petId === "all" || r.petId === petId))
    .sort((a, b) => b.date.localeCompare(a.date));
  let spent = 0, income = 0;
  const categories = {}, days = {};
  for (const r of entries) {
    const amount = cents(r.amount), day = r.date.slice(0, 10);
    days[day] ??= { entries: [], spent: 0, income: 0 };
    days[day].entries.push(r);
    if (r.direction === "收入") { income += amount; days[day].income += amount; }
    else { spent += amount; days[day].spent += amount; const category = expenseCategory(r); categories[category] = (categories[category] || 0) + amount; }
  }
  return { entries, spent: spent / 100, income: income / 100,
    categories: Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount: amount / 100, percent: spent ? amount / spent * 100 : 0 })),
    days: Object.entries(days).map(([date, d]) => ({ date, ...d, spent: d.spent / 100, income: d.income / 100 })) };
}
export function symptomSummary(records, petId, today = TODAY) {
  const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - 29);
  const from = start.toLocaleDateString("sv-SE"), types = {};
  const recent = records.filter((r) => r.group === "symptom" && r.petId === petId && r.date.slice(0, 10) >= from && r.date.slice(0, 10) <= today);
  recent.forEach((r) => { types[r.type] = (types[r.type] || 0) + 1; });
  return { count: recent.length, types: Object.entries(types).sort((a, b) => b[1] - a[1]) };
}
// Save the stock and its optional bill atomically. Editing never adds a second bill.
export function saveManagedRecord(data, record) {
  let reminders = data.reminders;
  let records = data.records.some((r) => r.id === record.id) ? data.records.map((r) => r.id === record.id ? record : r) : [...data.records, record];
  if (record.group === "stock") {
    const oldStock = data.records.find((r) => r.id === record.id);
    reminders = reminders.filter((r) => r.done || r.sourceStockId !== record.id || r.stockPurpose !== "expiry" || stockQuantity(record) > 0)
      .map((r) => {
        if (r.done || r.sourceStockId !== record.id) return r;
        return { ...r, petId: record.petId,
          type: `${r.stockPurpose === "expiry" ? "检查有效期" : "补货"} · ${record.itemName}`,
          date: r.stockPurpose === "expiry" && oldStock?.expiry !== record.expiry && record.expiry ? `${record.expiry}T${r.date.slice(11, 16)}` : r.date,
          note: [record.location, record.expiry && `有效期 ${record.expiry}`].filter(Boolean).join(" · ") };
      });
    const bill = records.find((r) => r.group === "expense" && r.sourceStockId === record.id);
    if (record.bookExpense && Number(record.amount) > 0) {
      const expense = { ...bill, id: bill?.id || uid(), group: "expense", sourceStockId: record.id,
        petId: record.petId, type: { 食品: "宠物食品", 药品: "药品", 用具: "日常用品" }[record.type] || "日常用品",
        date: record.date, amount: Number(record.amount), direction: "支出", note: record.itemName, photos: [] };
      records = bill ? records.map((r) => r.id === bill.id ? expense : r) : [...records, expense];
    } else if (bill) {
      // Switching the link off keeps an already saved bill; it simply becomes independent.
      records = records.map((r) => r.id === bill.id ? { ...r, sourceStockId: undefined } : r);
    }
  } else if (record.group === "expense" && record.sourceStockId) {
    // A manually edited bill becomes independent, so later stock edits cannot overwrite it.
    records = records.map((r) => r.id === record.sourceStockId ? { ...r, bookExpense: false }
      : r.id === record.id ? { ...r, sourceStockId: undefined } : r);
  }
  return { ...data, records, reminders };
}
export function deleteManagedRecord(data, record) {
  return { ...data, records: data.records.filter((r) => r.id !== record.id).map((r) => {
    if (record.group === "expense" && r.id === record.sourceStockId) return { ...r, bookExpense: false };
    if (record.group === "stock" && r.sourceStockId === record.id) return { ...r, sourceStockId: undefined };
    return r;
  }), reminders: data.reminders.filter((r) => r.sourceStockId !== record.id) };
}
export function addStockReminder(data, stock, purpose, today = TODAY) {
  if (data.reminders.some((r) => !r.done && r.sourceStockId === stock.id && r.stockPurpose === purpose)) return data;
  const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + 1);
  const date = purpose === "expiry" && stock.expiry >= today ? stock.expiry : d.toLocaleDateString("sv-SE");
  return { ...data, reminders: [...data.reminders, { id: uid(), group: "reminder", petId: stock.petId,
    sourceStockId: stock.id, stockPurpose: purpose, type: `${purpose === "expiry" ? "检查有效期" : "补货"} · ${stock.itemName}`,
    date: `${date}T09:00`, repeat: "从不", done: false, note: [stock.location, stock.expiry && `有效期 ${stock.expiry}`].filter(Boolean).join(" · ") }] };
}
