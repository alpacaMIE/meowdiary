import { TODAY, uid } from "./data.js";

// The artwork is displayed through SVG viewBoxes; the approved source PNG stays intact.
export const CAT_AVATARS = [
  { name: "布偶", image: "/assets/cat-photo.png" },
  ...[
    ["橘猫", 345, 1000], ["狸花", 614, 1000],
    ["三花", 74, 1257], ["黑猫", 345, 1257], ["白猫", 614, 1257],
  ].map(([name, x, y]) => ({ name, image: "/assets/onboarding/avatars.png", imageCrop: [x, y, 202, 202] })),
];
export const CAT_BREEDS = ["中华田园猫", "英国短毛猫", "美国短毛猫", "布偶猫", "暹罗猫", "缅因猫", "波斯猫", "不确定"];
export function newCatDraft() {
  return { id: uid(), name: "", species: "猫", breed: "", gender: "", birthday: "", homeDate: "", sterilized: "", weight: "", image: "/assets/cat-photo.png", photo: "", tone: "original", body: "standard" };
}
export function validPastDate(value, today = TODAY) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const date = new Date(value + "T12:00:00");
  return !Number.isNaN(date.getTime()) && date.toLocaleDateString("sv-SE") === value;
}
export function catErrors(draft, today = TODAY) {
  const errors = {};
  if (!draft.name.trim()) errors.name = "请先给猫咪起个名字";
  else if (draft.name.trim().length > 20) errors.name = "名字最多填写 20 个字";
  if (!validPastDate(draft.birthday, today)) errors.birthday = "请选择不晚于今天的有效日期";
  if (!validPastDate(draft.homeDate, today)) errors.homeDate = "请选择不晚于今天的有效日期";
  if (draft.birthday && draft.homeDate && draft.homeDate < draft.birthday) errors.homeDate = "到家日不能早于生日";
  if (draft.weight !== "" && (!Number.isFinite(Number(draft.weight)) || Number(draft.weight) <= 0)) errors.weight = "请填写大于 0 的体重";
  return errors;
}
export function addCatProfile(data, draft, now = new Date()) {
  if (Object.keys(catErrors(draft)).length) throw Error("猫咪资料需要检查");
  // Keep one stable id throughout retries, including the optional first weight record.
  if (data.pets.some((pet) => pet.id === draft.id)) return data;
  const { weight, ...profile } = draft;
  const pet = { ...profile, name: draft.name.trim(), species: "猫", createdAt: now.toISOString() };
  const records = weight === "" ? data.records : [...data.records, {
    id: `initial-weight-${pet.id}`, petId: pet.id, group: "weight", type: "称体重",
    weight: Number(weight), unit: "kg", date: now.toLocaleDateString("sv-SE") + "T" + now.toTimeString().slice(0, 5), photos: [], note: "建立档案时的第一笔体重",
  }];
  return { ...data, pets: [...data.pets, pet], records, currentPetId: pet.id };
}
export const fullDate = (value) => value ? value.split("-").map(Number).map((part, i) => `${part}${["年", "月", "日"][i]}`).join("") : "暂未填写";

export function cropGeometry(width, height, rotation, zoom, offset) {
  const rotated = rotation % 180 !== 0;
  const scale = Math.max(1 / (rotated ? height : width), 1 / (rotated ? width : height)) * zoom;
  const maxX = Math.max(0, ((rotated ? height : width) * scale - 1) / 2);
  const maxY = Math.max(0, ((rotated ? width : height) * scale - 1) / 2);
  return { scale, x: Math.max(-maxX, Math.min(maxX, offset.x)), y: Math.max(-maxY, Math.min(maxY, offset.y)) };
}
