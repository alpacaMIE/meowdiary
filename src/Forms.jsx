import React, { useState } from "react";
import {
  Icon,
  IconButton,
  Primary,
  Topbar,
  Field,
  PetSelect,
  PetArt,
  Chips,
  Segmented,
  TypeIcon,
  StickerIcon,
  SectionTitle,
} from "./ui";
import { TODAY, uid, groupLabels, iconFor, dateLabel } from "./data";
import { HOUSEHOLD, householdPet } from "./careData";

export async function readPhoto(file) {
  if (!file.type.startsWith("image/")) throw Error("请选择图片文件");
  if (file.size > 15 * 1024 * 1024) throw Error("请选择小于 15 MB 的图片");
  const source = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(Error("图片读取失败"));
    r.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(Error("暂不支持这种图片格式"));
    img.src = source;
  });
  const ratio = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}
export function PhotoInput({ photos, onChange, toast }) {
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (photos.length + files.length > 9) {
      toast("每条记录最多添加 9 张照片");
      return;
    }
    setBusy(true);
    try {
      const images = await Promise.all(files.map(readPhoto));
      onChange([...photos, ...images]);
    } catch (error) {
      toast(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="photo-input">
      {photos.map((photo, i) => (
        <div className="photo-thumb" key={i}>
          <img src={photo} alt={`照片 ${i + 1}`} />
          <IconButton
            icon="X"
            label={`移除照片 ${i + 1}`}
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      {photos.length < 9 && (
        <label className="photo-upload">
          <Icon name="Plus" size={26} />
          <span>{busy ? "处理中…" : "添加照片"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={upload}
            disabled={busy}
          />
        </label>
      )}
    </div>
  );
}
export function RecordForm({
  page,
  pets,
  record,
  records = [],
  onRecord,
  currentPetId,
  onBack,
  onSave,
  openTypes,
  toast,
  ask,
}) {
  const group = page.group;
  const initial = {
    petId: record?.petId || currentPetId || pets[0]?.id,
    type: page.type || groupLabels[group],
    date: `${TODAY}T${new Date().toTimeString().slice(0, 5)}`,
    note: "",
    title: "",
    photos: [],
    food: "",
    quantity: "",
    unit: group === "stock" ? "袋" : "g",
    weight: "",
    amount: "",
    direction: "支出",
    repeat: group === "reminder" ? "每天" : undefined,
    frequency: 1,
    frequencyUnit: record ? "hour" : "day",
    sound: "默认",
    volume: 60,
    itemName: "",
    expiry: "",
    location: "",
    hospital: "",
    nextDate: "",
    bookExpense: false,
    ...page.draft,
    ...record,
  };
  const [form, setForm] = useState(initial),
    [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false);
  const [startDate, reminderTime = ""] = form.date.split("T");
  const set = (key, value) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const title = {
    diary: "写日记",
    food: "记喂食",
    weight: "记体重",
    health: "疫苗与驱虫",
    note: "记一件小事",
    reminder: record ? "编辑提醒" : "新建提醒",
    expense: "记一笔",
    symptom: "记录体征",
    stock: record ? "编辑囤货" : "添加囤货",
  }[group];
  const back = () =>
    dirty
      ? ask("放弃这次编辑？", "尚未保存的内容将不会保留。", onBack, "放弃编辑")
      : onBack();
  const viewRecord = (id) => dirty
    ? ask("放弃这次编辑？", "尚未保存的内容将不会保留。", () => onRecord(id), "放弃编辑")
    : onRecord(id);
  const pool = ["note", "reminder", "expense", "symptom", "stock"].includes(
    group,
  )
    ? group
    : "note";
  const choose = () => openTypes(pool, (type) => set("type", type));
  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.petId) {
      toast("请先添加一只宠物");
      return;
    }
    if (
      group === "diary" &&
      !form.title.trim() &&
      !form.note.trim() &&
      !form.photos.length
    ) {
      toast("写点什么，或添加一张照片吧");
      return;
    }
    if (group === "note" && !form.type) {
      toast("请选择记事类型");
      return;
    }
    if (group === "weight" && !(Number(form.weight) > 0)) {
      toast("请输入大于 0 的体重");
      return;
    }
    setSaving(true);
    const data = { ...form, id: record?.id || uid(), group };
    if (group === "reminder" && form.repeat === "自定义") {
      data.frequency = Number(form.frequency);
    }
    if (group === "weight") {
      data.weight =
        Number(form.weight) /
        (form.weightUnit === "g" ? 1000 : form.weightUnit === "斤" ? 2 : 1);
      data.unit = "kg";
    }
    const saved = onSave(data);
    if (saved === false) setSaving(false);
  }
  return (
    <>
      <Topbar
        title={title}
        onBack={back}
        action={
          <button
            className="text-button"
            type="submit"
            form="record-form"
            disabled={saving}
          >
            保存
          </button>
        }
      />
      <form
        id="record-form"
        className={`page-content form-page form-${group}`}
        onSubmit={submit}
      >
        <div className="form-context">
          <PetSelect
            pets={["stock", "expense"].includes(group) || form.petId === HOUSEHOLD ? [householdPet, ...pets] : pets}
            value={form.petId}
            onChange={(v) => set("petId", v)}
          />
          {group === "diary" && <label className="diary-date"><StickerIcon name="CalendarDays" size={28} /><input aria-label="记录时间" type="datetime-local" required value={form.date} onChange={e => set("date", e.target.value)} /></label>}
        </div>
        {group === "expense" && (
          <Segmented
            items={["支出", "收入"].map((v) => [v, v])}
            value={form.direction}
            onChange={(v) => set("direction", v)}
          />
        )}
        {["note", "reminder", "expense", "symptom", "stock", "health"].includes(
          group,
        ) && (
          <button
            className="type-selection card"
            type="button"
            onClick={choose}
          >
            <TypeIcon name={form.type} group={group} />
            <strong>{form.type}</strong>
            <Icon name="ChevronRight" size={19} />
          </button>
        )}
        {group === "diary" && (
          <>
            <div className="diary-heading"><StickerIcon name="BookOpen" size={39} />
            <input
              className="diary-title"
              aria-label="日记标题"
              placeholder="今天的故事"
              maxLength={60}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            </div>
            <div className="diary-editor">
              <textarea
                aria-label="日记正文"
                placeholder="今天，和它发生了什么？"
                maxLength={2000}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
              />
              <span className="counter">{form.note.length} / 2000</span>
            </div>
          </>
        )}
        {group === "weight" && (
          <div className="weight-input-stage">
            <PetArt pet={pets.find((p) => p.id === form.petId)} />
            <div className="large-number-input">
              <input
                aria-label="体重"
                type="number"
                step="0.01"
                min="0.01"
                max="999999"
                placeholder="0.00"
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                required
              />
              <select
                aria-label="体重单位"
                value={form.weightUnit || "kg"}
                onChange={(e) => set("weightUnit", e.target.value)}
              >
                <option>kg</option>
                <option>斤</option>
                <option>g</option>
              </select>
            </div>
          </div>
        )}
        {group === "expense" && (
          <div className="amount-input">
            <span>¥</span>
            <input
              autoFocus
              aria-label="金额"
              type="number"
              min="0.01"
              max="99999999"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
            />
          </div>
        )}
        {group === "expense" && record?.sourceStockId && <p className="link-note">这笔账来自囤货。保存修改后将独立保留。</p>}
        {group === "food" && (
          <div className="form-card food-data">
            <Field label="食物名称" icon="Soup">
              <input
                placeholder="例如：鸡肉冻干猫粮"
                value={form.food}
                onChange={(e) => set("food", e.target.value)}
                required
                maxLength={50}
              />
            </Field>
            <Field label="数量" icon="Scale">
              <div className="input-with-unit">
                <input
                  aria-label="喂食数量"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="60"
                  required
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
                <select
                  aria-label="喂食单位"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                >
                  {["g", "kg", "ml", "袋", "罐", "份"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="日期时间" icon="CalendarDays"><input aria-label="记录时间" type="datetime-local" required value={form.date} onChange={e => set("date", e.target.value)} /></Field>
          </div>
        )}
        {group === "stock" && (
          <div className="form-card">
            <Field label="物品名称">
              <input
                placeholder="物品名称"
                required
                maxLength={50}
                value={form.itemName}
                onChange={(e) => set("itemName", e.target.value)}
              />
            </Field>
            <Field label="剩余数量">
              <div className="input-with-unit">
                <input
                  type="number"
                  aria-label="囤货余量"
                  min="0"
                  step="0.01"
                  required
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
                <select
                  aria-label="囤货单位"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                >
                  {["袋", "罐", "个", "盒", "瓶", "kg"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="有效期">
              <input
                type="date"
                required
                value={form.expiry}
                onChange={(e) => set("expiry", e.target.value)}
              />
            </Field>
            <Field label="物品花费" optional>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
                <span>元</span>
              </div>
            </Field>
            <Field label="存放位置" optional>
              <input
                placeholder="例如：客厅储物柜"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            {Number(form.amount) > 0 && <label className="stock-book-toggle">
              <span>顺便记一笔账</span>
              <input type="checkbox" checked={form.bookExpense} onChange={(e) => set("bookExpense", e.target.checked)} />
            </label>}
            {record?.bookExpense && !form.bookExpense && <p className="link-note">已生成的账单会保留，可在账本中编辑或删除。</p>}
          </div>
        )}
        {!["diary", "food"].includes(group) && <div className="form-card">
          {group === "reminder" ? (
            <>
              <Field label="开始日期">
                <input
                  aria-label="开始日期"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => set("date", `${e.target.value}T${reminderTime}`)}
                />
              </Field>
              <Field label="提醒时间">
                <input
                  aria-label="提醒时间"
                  type="time"
                  required
                  step="60"
                  value={reminderTime}
                  onChange={(e) => set("date", `${startDate}T${e.target.value}`)}
                />
              </Field>
              <Field label="重复类型">
                <select
                  aria-label="重复类型"
                  value={form.repeat}
                  onChange={(e) => set("repeat", e.target.value)}
                >
                  {["从不", "每天", "每周", "每月", "每年", "自定义"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </Field>
              {form.repeat === "自定义" && (
                <Field label="每隔">
                  <div className="input-with-unit reminder-interval">
                    <input
                      aria-label="重复间隔"
                      type="number"
                      min="1"
                      max="8760"
                      step="1"
                      value={form.frequency}
                      onChange={(e) => set("frequency", e.target.value)}
                      required
                    />
                    <select
                      aria-label="间隔类型"
                      value={form.frequencyUnit}
                      onChange={(e) => set("frequencyUnit", e.target.value)}
                    >
                      <option value="day">天</option>
                      <option value="hour">小时</option>
                    </select>
                  </div>
                </Field>
              )}
            </>
          ) : (
            <Field label="记录时间">
              <input
                aria-label="记录时间"
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
          )}
          {group === "health" && (
            <>
              <Field label="医院 / 品牌" optional>
                <input
                  value={form.hospital}
                  placeholder="填写名称"
                  onChange={(e) => set("hospital", e.target.value)}
                />
              </Field>
              <Field label="下次提醒" optional>
                <input
                  type="date"
                  min={TODAY}
                  value={form.nextDate}
                  onChange={(e) => set("nextDate", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>}
        {group !== "diary" && (
          <div className="note-field">
            <label htmlFor="note">
              {group === "symptom" ? "体征描述" : "备注"}
              <span className="muted"> · 选填</span>
            </label>
            <textarea
              id="note"
              placeholder={
                group === "symptom" ? "记录观察到的情况…" : "想记下的其他小事…"
              }
              value={form.note}
              maxLength={1000}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>
        )}
        {!["reminder", "food"].includes(group) && (
          <PhotoInput
            photos={form.photos}
            onChange={(v) => set("photos", v)}
            toast={toast}
          />
        )}
        {group === "diary" && <div className="diary-extras">
          <label><StickerIcon name="MapPin" size={33} /><input aria-label="日记位置" placeholder="添加位置" maxLength={80} value={form.location} onChange={e => set("location", e.target.value)} /><Icon name="ChevronRight" size={18} /></label>
          <label><StickerIcon name="Heart" size={33} /><input aria-label="日记标签" placeholder="添加标签，用逗号分隔" maxLength={80} value={form.tags || ""} onChange={e => set("tags", e.target.value)} /><Icon name="ChevronRight" size={18} /></label>
        </div>}
        {group === "food" && <section className="food-recent"><SectionTitle>最近喂食记录</SectionTitle><div className="card food-history">
          {records.filter(r => r.group === "food" && r.petId === form.petId).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 4).map(r => <button type="button" key={r.id} onClick={() => viewRecord(r.id)}><StickerIcon name="Soup" size={33} /><time>{dateLabel(r.date)}<br />{r.date.slice(11, 16)}</time><strong>{r.food || r.type}</strong><small>{r.quantity} {r.unit}</small><Icon name="ChevronRight" size={17} /></button>)}
          {!records.some(r => r.group === "food" && r.petId === form.petId) && <p className="quiet-empty">从这一餐开始记录</p>}
        </div><details className="food-attachments"><summary>添加照片（选填）</summary><PhotoInput photos={form.photos} onChange={v => set("photos", v)} toast={toast} /></details></section>}
        <Primary type="submit" disabled={saving}>
          {saving ? "保存中…" : group === "reminder" ? "保存提醒" : group === "diary" ? "保存日记" : group === "food" ? "保存喂食记录" : "保存记录"}
        </Primary>
      </form>
    </>
  );
}

export function PetForm({ pet, onBack, onSave, onDelete, toast, ask }) {
  const [form, setForm] = useState(
    pet || {
      name: "",
      species: "猫",
      breed: "",
      gender: "",
      birthday: "",
      homeDate: "",
      sterilized: "",
      image: "/assets/cat-photo.png",
      tone: "original",
      body: "standard",
    },
  );
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => {
    setDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };
  async function photo(e) {
    if (!e.target.files[0]) return;
    try {
      set("photo", await readPhoto(e.target.files[0]));
    } catch (error) {
      toast(error.message);
    }
  }
  const back = () =>
    dirty
      ? ask("放弃这次编辑？", "尚未保存的资料将不会保留。", onBack, "放弃编辑")
      : onBack();
  return (
    <>
      <Topbar title={pet ? "编辑猫咪资料" : "认识一位新朋友"} onBack={back} />
      <form
        className="page-content form-page pet-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) {
            toast("给它起个名字吧");
            return;
          }
          onSave({ ...form, name: form.name.trim(), id: pet?.id || uid() });
        }}
      >
        <div className="cat-edit-portrait"><PetArt pet={form} /></div>
        <div className="form-card">
          <Field label="猫咪名字">
            <input
              autoComplete="off"
              required
              maxLength={20}
              placeholder="怎么称呼这位小可爱？"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="品种">
            <input
              maxLength={40}
              list="breeds"
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
              placeholder="填写品种"
            />
            <datalist id="breeds">
              {["布偶猫", "英国短毛猫", "中华田园猫", "暹罗猫", "缅因猫"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </datalist>
          </Field>
          <Field label="性别">
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option value="">暂未填写</option>
              <option>女孩</option>
              <option>男孩</option>
              <option>不确定</option>
            </select>
          </Field>
          <Field label="生日" optional>
            <input
              type="date"
              max={TODAY}
              value={form.birthday}
              onChange={(e) => set("birthday", e.target.value)}
            />
          </Field>
          <Field label="到家日" optional>
            <input
              type="date"
              max={TODAY}
              min={form.birthday || undefined}
              value={form.homeDate}
              onChange={(e) => set("homeDate", e.target.value)}
            />
          </Field>
          <Field label="绝育状态">
            <select
              value={form.sterilized}
              onChange={(e) => set("sterilized", e.target.value)}
            >
              <option value="">暂未填写</option>
              <option>未绝育</option>
              <option>已绝育</option>
              <option>计划中</option>
              <option>不确定</option>
            </select>
          </Field>
        </div>
        <label className="upload-profile card">
          <Icon name="Camera" />
          <span>{form.photo ? "更换真实照片" : "使用自己的照片"}</span>
          {form.photo && <img src={form.photo} alt="自选头像" />}
          <input type="file" accept="image/*" onChange={photo} />
        </label>
        {form.photo && (
          <button
            className="text-button"
            type="button"
            onClick={() => set("photo", "")}
          >
            恢复默认贴纸
          </button>
        )}
        <Primary type="submit">
          {pet ? "保存资料" : "开始我们的故事"}
          <Icon name="ArrowRight" size={18} />
        </Primary>
        {pet && (
          <button
            className="danger-link"
            type="button"
            onClick={() =>
              ask(
                `删除${pet.name}的档案？`,
                "这只宠物的记录、照片和提醒也会从此浏览器移除。",
                () => onDelete(pet.id),
                "删除档案",
              )
            }
          >
            删除宠物档案
          </button>
        )}
      </form>
    </>
  );
}
