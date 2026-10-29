import React, { useState } from "react";
import types from "./types.json";
import {
  GROUPS,
  defaultFilters,
  dayOffset,
  TODAY,
  groupLabels,
  uid,
} from "./data";
import {
  Sheet,
  Search,
  Chips,
  Icon,
  TypeIcon,
  StickerIcon,
  Primary,
  Avatar,
  Field,
  PetSelect,
  Empty,
  Segmented,
} from "./ui";

export function Catalog({ a, sheet }) {
  const [group, setGroup] = useState(sheet.group || "note"),
    [search, setSearch] = useState(""),
    [custom, setCustom] = useState(false),
    [name, setName] = useState(""),
    [icon, setIcon] = useState("PawPrint");
  const [petId, setPetId] = useState(sheet.petId || a.currentPet.id);
  const items = [
    ...types[group].items,
    ...(a.data.customTypes[group] || []),
  ].filter((t) => t.name.includes(search.trim()));
  function choose(item) {
    a.setSheet(null);
    if (sheet.onSelect) sheet.onSelect(item.name);
    else a.openForm(group, item.name, petId);
  }
  function saveCustom(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (
      [...types[group].items, ...(a.data.customTypes[group] || [])].some(
        (x) => x.name === n,
      )
    ) {
      a.toast("这个类型已经存在");
      return;
    }
    const item = { id: uid(), name: n, icon };
    if (
      a.commit({
        ...a.data,
        customTypes: {
          ...a.data.customTypes,
          [group]: [...(a.data.customTypes[group] || []), item],
        },
      })
    ) {
      setCustom(false);
      setSearch("");
      setName("");
      a.toast("已添加自定义类型");
    }
  }
  return (
    <Sheet
      title={
        custom ? "自定义类型" : sheet.onSelect ? "选择类型" : "记录一个小日常"
      }
      onClose={() => a.setSheet(null)}
      className="catalog-sheet"
    >
      {custom ? (
        <form onSubmit={saveCustom} className="custom-form">
          <button
            className="text-button"
            type="button"
            onClick={() => setCustom(false)}
          >
            <Icon name="ChevronLeft" size={17} />
            返回类型清单
          </button>
          <Field label="名称">
            <input
              autoFocus
              required
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给这个日常起个名字"
            />
          </Field>
          <div className="custom-icons">
            {[
              "PawPrint",
              "Heart",
              "Sun",
              "Star",
              "BookOpen",
              "Soup",
              "Syringe",
              "Cake",
              "Camera",
              "Flower2",
              "Footprints",
              "Package",
            ].map((n) => (
              <button
                key={n}
                type="button"
                className={n === icon ? "selected" : ""}
                aria-label={n}
                aria-pressed={n === icon}
                onClick={() => setIcon(n)}
              >
                <Icon name={n} />
              </button>
            ))}
          </div>
          <Primary type="submit">添加类型</Primary>
        </form>
      ) : (
        <>
          {!sheet.onSelect && (
            <div className="catalog-pet">
              <PetSelect pets={a.data.pets} value={petId} onChange={setPetId} />
              <div className="mini-shortcuts">
                <button
                  onClick={() => {
                    a.setSheet(null);
                    a.openForm("diary", "日记", petId);
                  }}
                >
                  <Icon name="BookOpen" size={17} />
                  日记
                </button>
                <button
                  onClick={() => {
                    a.setSheet(null);
                    a.openForm("weight", "称体重", petId);
                  }}
                >
                  <Icon name="Scale" size={17} />
                  体重
                </button>
              </div>
            </div>
          )}
          <div className="catalog-tabs">
            {(sheet.onSelect ? [group] : GROUPS).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGroup(g);
                  setSearch("");
                }}
                aria-pressed={group === g}
                className={group === g ? "selected" : ""}
              >
                {types[g].label}
              </button>
            ))}
          </div>
          <Search
            value={search}
            onChange={setSearch}
            placeholder="搜索记录类型"
          />
          <div className="catalog-body">
            <div className="type-grid">
              {items.map((t) => (
                <button key={t.id} onClick={() => choose(t)}>
                  <TypeIcon name={t.name} group={group} icon={t.icon} />
                  <span>{t.name}</span>
                </button>
              ))}
              {!search && (
                <button onClick={() => setCustom(true)}>
                  <span className="type-icon custom">
                    <Icon name="Plus" />
                  </span>
                  <span>自定义</span>
                </button>
              )}
            </div>
            {!items.length && (
              <Empty
                icon="Search"
                title="没有找到这个类型"
                action="添加自定义类型"
                onAction={() => {
                  setName(search);
                  setCustom(true);
                }}
              />
            )}
          </div>
          <div className="catalog-footer">
            {types[group].items.length} 个内置类型
            {a.data.customTypes[group]?.length
              ? ` · ${a.data.customTypes[group].length} 个自定义`
              : ""}
          </div>
        </>
      )}
    </Sheet>
  );
}
export function FilterSheet({ a }) {
  const [draft, setDraft] = useState({
    ...a.filters,
    pets: a.filters.pets ? [...a.filters.pets] : null,
  });
  const set = (key, v) => setDraft((f) => ({ ...f, [key]: v }));
  const toggle = (id) =>
    set(
      "pets",
      draft.pets === null
        ? [id]
        : draft.pets.includes(id)
          ? draft.pets.filter((x) => x !== id)
          : [...draft.pets, id],
    );
  const presets = [
    ["全部", "", ""],
    ["今天", TODAY, TODAY],
    ["本周", dayOffset(-6), TODAY],
    ["本月", TODAY.slice(0, 8) + "01", TODAY],
  ];
  return (
    <Sheet title="筛选" className="filter-sheet" onClose={() => a.setSheet(null)}>
      <div className="filter-content">
        <div className="section-title">
          <h3>猫咪 <small>（可多选）</small></h3>
          <button
            className="text-button"
            onClick={() => setDraft(defaultFilters)}
          >
            清空
          </button>
        </div>
        <div className="pet-filter-grid">
          <button
            className={draft.pets === null ? "selected" : ""}
            onClick={() => set("pets", null)}
          >
            <span className="all-pets-icon">
              <Icon name="PawPrint" size={30} />
            </span>
            <span>全部</span>
            {draft.pets === null && (
              <Icon className="check-corner" name="CircleCheck" size={17} />
            )}
          </button>
          {a.data.pets.map((p) => (
            <button
              key={p.id}
              className={draft.pets?.includes(p.id) ? "selected" : ""}
              onClick={() => toggle(p.id)}
            >
              <Avatar pet={p} size={58} />
              <span>{p.name}</span>
              {draft.pets?.includes(p.id) && (
                <Icon className="check-corner" name="CircleCheck" size={17} />
              )}
            </button>
          ))}
        </div>
        <h3>记录类型 <small>（可多选）</small></h3>
        <div className="filter-types">{["all", ...Object.keys(groupLabels).filter(g => g !== "reminder")].map(g => {
          const selected = draft.groups?.length ? draft.groups.includes(g) : draft.group === g;
          return <button key={g} className={`chip ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => setDraft(d => {
            if (g === "all") return { ...d, group: "all", groups: [] };
            const groups = d.groups?.length ? d.groups : d.group !== "all" ? [d.group] : [];
            const next = groups.includes(g) ? groups.filter(x => x !== g) : [...groups, g];
            return { ...d, group: next.length === 1 ? next[0] : "all", groups: next };
          })}><StickerIcon name={{ all: "BookOpen", diary: "BookOpen", food: "Soup", weight: "Scale", health: "Syringe", note: "NotebookPen", expense: "Wallet", symptom: "HeartPulse", stock: "Package" }[g]} size={32} />{g === "all" ? "全部" : groupLabels[g]}</button>;
        })}</div>
        <h3>时间范围</h3>
        <div className="chips">
          {presets.map(([label, from, to]) => (
            <button
              className={`chip ${draft.from === from && draft.to === to ? "selected" : ""}`}
              key={label}
              onClick={() => setDraft((d) => ({ ...d, from, to }))}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="date-range">
          <input
            type="date"
            aria-label="开始日期"
            value={draft.from}
            onChange={(e) => set("from", e.target.value)}
          />
          <span>—</span>
          <input
            type="date"
            aria-label="结束日期"
            min={draft.from}
            value={draft.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
        <h3>排序</h3>
        <Segmented
          items={[
            ["desc", "最新在前"],
            ["asc", "最早在前"],
          ]}
          value={draft.sort}
          onChange={(v) => set("sort", v)}
        />
        <Primary
          disabled={
            draft.pets?.length === 0 ||
            (draft.from && draft.to && draft.from > draft.to)
          }
          onClick={() => {
            a.setFilters(draft);
            a.setSheet(null);
          }}
        >
          查看结果{draft.pets && `（${draft.pets.length} 只猫咪）`}
        </Primary>
      </div>
    </Sheet>
  );
}
export function AppSheets({ a }) {
  const s = a.sheet;
  if (!s) return null;
  if (s.kind === "types") return <Catalog a={a} sheet={s} />;
  if (s.kind === "filters") return <FilterSheet a={a} />;
  if (s.kind === "pets")
    return (
      <Sheet title="今天和谁一起？" onClose={() => a.setSheet(null)}>
        <div className="switch-pet-list">
          {a.data.pets.map((p) => (
            <button
              key={p.id}
              className={a.currentPet.id === p.id ? "selected" : ""}
              onClick={() => {
                a.commit({ ...a.data, currentPetId: p.id });
                a.setSheet(null);
              }}
            >
              <Avatar pet={p} size={58} />
              <strong>{p.name}</strong>
              <span>{p.breed}</span>
              {a.currentPet.id === p.id && <Icon name="Check" size={20} />}
            </button>
          ))}
          <button
            className="add-pet-inline"
            onClick={() => {
              a.setSheet(null);
              a.go({ name: "pet-form" });
            }}
          >
            <Icon name="Plus" />
            添加猫咪
          </button>
        </div>
      </Sheet>
    );
  if (s.kind === "confirm")
    return (
      <Sheet title={s.title} onClose={() => a.setSheet(null)}>
        <div className="confirm-content">
          <p>{s.body}</p>
          <Primary
            className="danger-button"
            onClick={() => {
              a.setSheet(null);
              s.action();
            }}
          >
            {s.label || "确认"}
          </Primary>
          <button className="secondary" onClick={() => a.setSheet(null)}>
            取消
          </button>
        </div>
      </Sheet>
    );
  if (s.kind === "photo")
    return (
      <Sheet title="这一刻" onClose={() => a.setSheet(null)}>
        <img className="lightbox" src={s.src} alt="记录照片" />
        {s.record && (
          <button
            className="text-button lightbox-link"
            onClick={() => {
              a.setSheet(null);
              a.go({ name: "record", id: s.record.id });
            }}
          >
            查看这条记录
            <Icon name="ArrowRight" size={18} />
          </button>
        )}
      </Sheet>
    );
  return null;
}
