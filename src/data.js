export const TODAY = new Date().toLocaleDateString("sv-SE");
export const dayOffset = (offset) => {
  const d = new Date(`${TODAY}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("sv-SE");
};
export const uid = () => crypto.randomUUID();
// Resolve the old demo path too, so existing local diaries keep their data.
export const petImage = (pet) => pet?.photo || (!pet?.image || pet.image === "/assets/cat.png" ? "/assets/cat-photo.png" : pet.image);
export const dateLabel = (date) => {
  const key = date?.slice(0, 10);
  if (key === TODAY) return "今天";
  if (key === dayOffset(-1)) return "昨天";
  return new Date(`${key}T12:00:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
};
export const ageLabel = (birthday) => {
  if (!birthday) return "生日待补充";
  const b = new Date(birthday),
    now = new Date();
  let months =
    (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months--;
  months = Math.max(0, months);
  return months >= 12
    ? `${Math.floor(months / 12)}岁${months % 12 ? `${months % 12}个月` : ""}`
    : `${months}个月`;
};
export const togetherDays = (date) =>
  date && Number.isFinite(new Date(date).getTime()) ? Math.max(1, Math.floor((new Date(TODAY) - new Date(date)) / 86400000) + 1) : null;
export const GROUPS = ["note", "reminder", "expense", "symptom", "stock"];
export const groupLabels = {
  diary: "日记",
  food: "喂食",
  weight: "体重",
  health: "护理",
  note: "记事",
  reminder: "提醒",
  expense: "记账",
  symptom: "体征",
  stock: "囤货",
};
export function iconFor(name = "", group = "") {
  if (/牙/.test(name)) return "Toothbrush";
  if (group === "diary") return "BookOpen";
  if (/体重/.test(name) || group === "weight") return "Scale";
  if (/疫苗|联$|医疗|药|体检|生病|驱/.test(name) || group === "health")
    return "Syringe";
  if (
    /喂食|粮|罐头|食品|零食|骨肉|宠饭|饼干|奶|肉干/.test(name) ||
    group === "food"
  )
    return "Soup";
  if (/水|洗澡|清洁|洗护|猫砂|铲屎|厕所/.test(name)) return "Droplets";
  if (/生日|100天|到家日/.test(name)) return "Cake";
  if (/玩具|互动|球|逗猫|训练|益智/.test(name)) return "Volleyball";
  if (/遛|旅行|出游|游玩|托运/.test(name)) return "Footprints";
  if (/服饰/.test(name)) return "Shirt";
  if (/毛|指甲|美容/.test(name)) return "Scissors";
  if (/摄影/.test(name)) return "Camera";
  return (
    {
      reminder: "Bell",
      expense: "Wallet",
      symptom: "HeartPulse",
      stock: "Package",
      note: "NotebookPen",
    }[group] || "PawPrint"
  );
}
export function reminderRepeatLabel(reminder) {
  if (reminder.repeat !== "自定义") return reminder.repeat || "从不";
  const frequency = Math.max(1, Number(reminder.frequency) || 1);
  return `每隔 ${frequency} ${reminder.frequencyUnit === "day" ? "天" : "小时"}`;
}
export function toggleReminder(reminders, reminder, now = new Date()) {
  const items = reminders.map((r) => r.id === reminder.id ? { ...r, done: !r.done } : r);
  if (!reminder.done && reminder.repeat && reminder.repeat !== "从不") {
    const d = new Date(reminder.date);
    let n = 0;
    do {
      if (reminder.repeat === "每天") d.setDate(d.getDate() + 1);
      else if (reminder.repeat === "每周") d.setDate(d.getDate() + 7);
      else if (reminder.repeat === "每月") d.setMonth(d.getMonth() + 1);
      else if (reminder.repeat === "每年") d.setFullYear(d.getFullYear() + 1);
      else if (reminder.frequencyUnit === "day") d.setDate(d.getDate() + Math.max(1, Number(reminder.frequency) || 1));
      else d.setHours(d.getHours() + Math.max(1, Number(reminder.frequency) || 1));
      n++;
    } while (d <= now && n < 10000);
    const nextDate = d.toLocaleDateString("sv-SE") + "T" + d.toTimeString().slice(0, 5);
    if (!items.some((r) => !r.done && r.petId === reminder.petId && r.type === reminder.type && r.date === nextDate))
      items.push({ ...reminder, id: uid(), date: nextDate, done: false });
  }
  return items;
}
export function seedData() {
  return {
    pets: [
      {
        id: "tuanzi",
        name: "团子",
        species: "猫",
        breed: "布偶猫",
        gender: "女孩",
        birthday: "2024-04-12",
        homeDate: "2024-06-01",
        sterilized: "已绝育",
        image: "/assets/cat.png",
        tone: "original",
        body: "standard",
      },
      {
        id: "xiaomi",
        name: "小米",
        species: "狗",
        breed: "金毛寻回犬",
        gender: "男孩",
        birthday: "2025-03-08",
        homeDate: "2025-05-01",
        sterilized: "未绝育",
        image: "/assets/dog.png",
        tone: "original",
        body: "standard",
      },
    ],
    records: [
      {
        id: "diary-1",
        petId: "tuanzi",
        group: "diary",
        type: "日记",
        title: "把阳光抱个满怀",
        note: "午后的阳光刚刚好，团子又占领了最喜欢的窗边。\n什么也不做，陪你发一会儿呆。",
        date: `${TODAY}T14:30`,
        photos: ["/assets/diary.png"],
      },
      {
        id: "food-1",
        petId: "tuanzi",
        group: "food",
        type: "喂食",
        food: "鸡肉冻干猫粮",
        quantity: 60,
        unit: "g",
        date: `${TODAY}T08:20`,
        note: "碗底都舔干净啦。",
        photos: [],
      },
      {
        id: "diary-2",
        petId: "xiaomi",
        group: "note",
        type: "遛宠",
        date: `${dayOffset(-1)}T17:30`,
        note: "绕着小公园走了一圈，收集了一路的落叶。",
        photos: [],
      },
      {
        id: "diary-3",
        petId: "tuanzi",
        group: "diary",
        type: "日记",
        title: "今日份小可爱",
        note: "一回家就有毛茸茸的小朋友迎接。",
        date: `${dayOffset(-2)}T18:10`,
        photos: ["/assets/diary.png"],
      },
      {
        id: "health-1",
        petId: "tuanzi",
        group: "health",
        type: "猫三联疫苗",
        date: `${dayOffset(-24)}T10:00`,
        note: "已完成本次接种。",
        hospital: "宠爱动物医院",
        photos: [],
      },
      {
        id: "health-2",
        petId: "tuanzi",
        group: "health",
        type: "外驱",
        date: `${dayOffset(-27)}T10:00`,
        note: "已完成本次护理。",
        photos: [],
      },
      ...[
        [0, 4.2],
        [-7, 4.16],
        [-14, 4.18],
        [-21, 4.06],
        [-28, 3.95],
        [-35, 4.03],
      ].map(([d, value], i) => ({
        id: `weight-${i}`,
        petId: "tuanzi",
        group: "weight",
        type: "称体重",
        weight: value,
        unit: "kg",
        date: `${dayOffset(d)}T08:00`,
        photos: [],
      })),
      {
        id: "dog-weight",
        petId: "xiaomi",
        group: "weight",
        type: "称体重",
        weight: 12.6,
        unit: "kg",
        date: `${dayOffset(-3)}T08:00`,
        photos: [],
      },
    ],
    reminders: [
      {
        id: "r1",
        petId: "tuanzi",
        type: "刷牙",
        date: `${TODAY}T20:00`,
        repeat: "每天",
        done: false,
      },
      {
        id: "r2",
        petId: "tuanzi",
        type: "外驱",
        date: `${dayOffset(3)}T09:00`,
        repeat: "每月",
        done: false,
      },
      {
        id: "r3",
        petId: "xiaomi",
        type: "狂犬疫苗",
        date: `${dayOffset(8)}T10:00`,
        repeat: "每年",
        done: false,
      },
      {
        id: "r4",
        petId: "tuanzi",
        type: "梳毛",
        date: `${dayOffset(-1)}T19:00`,
        repeat: "从不",
        done: true,
      },
    ],
    customTypes: {},
    settings: { theme: "system", notifications: false },
    currentPetId: "tuanzi",
  };
}
export function emptyData() {
  return { pets: [], records: [], reminders: [], customTypes: {}, settings: { theme: "system", notifications: false }, currentPetId: null };
}
export function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem("meow-diary-v1"));
    if (
      raw &&
      Array.isArray(raw.pets) &&
      Array.isArray(raw.records) &&
      Array.isArray(raw.reminders)
    )
      return { ...emptyData(), ...raw, settings: { ...emptyData().settings, ...raw.settings } };
  } catch {
    /* A blocked or corrupt store must not prevent opening the app. */
  }
  return emptyData();
}
export function summary(record) {
  if (record.group === "food")
    return `${record.food || record.type} ${record.quantity || ""} ${record.unit || "g"}`;
  if (record.group === "weight")
    return `${Number(record.weight).toFixed(2)} kg`;
  if (record.group === "expense")
    return `${record.direction === "收入" ? "+" : "−"} ¥${Number(record.amount).toFixed(2)} · ${record.type}`;
  if (record.group === "stock")
    return `${record.itemName} · ${record.quantity} ${record.unit}`;
  return record.title || record.type;
}
export function filterRecords(records, filters, search = "") {
  return records
    .filter(
      (r) =>
        (!filters.pets || filters.pets.includes(r.petId)) &&
        (filters.group === "all" || r.group === filters.group) &&
        (!filters.from || r.date.slice(0, 10) >= filters.from) &&
        (!filters.to || r.date.slice(0, 10) <= filters.to) &&
        `${r.title || ""} ${r.note || ""} ${r.type} ${r.food || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      filters.sort === "asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
}
export const defaultFilters = {
  pets: null,
  group: "all",
  from: "",
  to: "",
  sort: "desc",
};
export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function makeCSV(rows) {
  const escape = (value) => {
    let s = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return "\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
