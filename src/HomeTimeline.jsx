import React, { useState } from "react";
import {
  Avatar,
  StickerIcon,
  PetArt,
  Icon,
  IconButton,
  SectionTitle,
  TypeIcon,
  Empty,
  Search,
  Segmented,
  Chips,
  PetMeta,
} from "./ui";
import {
  TODAY,
  togetherDays,
  dateLabel,
  summary,
  groupLabels,
  filterRecords,
} from "./data";
import { isLifeRecord } from "./careData";

export function RecordRow({ record, a }) {
  return (
    <button
      className="recent-row"
      onClick={() => a.go({ name: "record", id: record.id })}
    >
      {record.photos?.length ? (
        <img className="record-thumb" src={record.photos[0]} alt="记录照片" />
      ) : (
        <TypeIcon name={record.type} group={record.group} />
      )}
      <span className="recent-copy">
        <strong>{summary(record)}</strong>
        <small>
          {dateLabel(record.date)} {record.date.slice(11, 16)}
          <span> · </span>
          {groupLabels[record.group]}
        </small>
      </span>
      <Icon name="ChevronRight" size={17} />
    </button>
  );
}
export function Home({ a }) {
  const pet = a.currentPet;
  const [pat, setPat] = useState({ petId: "", count: 0 });
  const patted = pat.petId === pet.id && pat.count > 0;
  const records = a.data.records.filter((r) => r.petId === pet.id && isLifeRecord(r))
    .sort((x, y) => y.date.localeCompare(x.date));
  const reminders = a.data.reminders.filter((r) => r.petId === pet.id);
  const due = reminders.filter((r) => r.date.slice(0, 10) <= TODAY && (!r.done || r.date.startsWith(TODAY)));
  const upcoming = reminders.filter((r) => !r.done && r.date.slice(0, 10) > TODAY)
    .sort((x, y) => x.date.localeCompare(y.date));
  const shown = (due.length ? due : upcoming.slice(0, 3)).slice().sort((x, y) => x.date.localeCompare(y.date));
  const groups = shown.reduce((out, r) => {
    const date = r.date.slice(0, 10), hour = Number(r.date.slice(11, 13));
    const name = date < TODAY ? "待补办" : date > TODAY ? dateLabel(r.date) : hour < 12 ? "上午" : hour < 18 ? "下午" : "晚上";
    (out[name] ??= []).push(r);
    return out;
  }, {});
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  function touchPet() {
    setPat((previous) => ({ petId: pet.id, count: previous.petId === pet.id ? previous.count + 1 : 1 }));
  }
  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1>{greeting}，{pet.name}<span className="greeting-strokes" aria-hidden="true" /></h1>
          <p>{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} · {new Date().toLocaleDateString("zh-CN", { weekday: "short" })}</p>
        </div>
        <button className="pet-switcher" aria-label="切换宠物" onClick={() => a.setSheet({ kind: "pets" })}>
          <Avatar pet={pet} size={31} /><span>{pet.name}</span><Icon name="ChevronDown" size={15} />
        </button>
      </header>
      <section className="pet-stage" aria-label={`${pet.name}的贴纸小天地`}>
        <div className="sticker-cushion" aria-hidden="true" />
        <span className="doodle-heart heart-left" aria-hidden="true"><Icon name="Heart" size={23} /></span>
        <span className="doodle-heart heart-right" aria-hidden="true"><Icon name="Heart" size={20} /></span>
        <span className="doodle-ball" aria-hidden="true" />
        <button className="hero-pet-button" aria-label={`摸摸${pet.name}`} onClick={touchPet}>
          <PetArt key={`${pet.id}-${pat.count}`} pet={pet} className={patted ? "pet-patted" : ""} />
        </button>
        <button className="pet-speech taped-note" onClick={touchPet} aria-live="polite">
          {patted ? ["呼噜呼噜～", "贴贴！", "再摸一下"][((pat.count || 1) - 1) % 3] : "摸摸我"}
        </button>
        <button className="together-sticker" aria-label={`查看${pet.name}的档案`} onClick={() => a.go({ name: "pet", id: pet.id })}>
          <Icon name="PawPrint" size={19} /><strong>{pet.homeDate ? <>{togetherDays(pet.homeDate)}<small>天</small></> : "档案"}</strong>
        </button>
      </section>
      <div className="page-content home-content">
        <div className="quick-actions" aria-label="快捷记录">
          {[["diary", "BookOpen", "写日记"], ["food", "Soup", "喂食"], ["weight", "Scale", "记体重"]].map(([group, icon, label]) => (
            <button key={group} className={`quick-action ${group}`} onClick={() => a.openForm(group)}>
              <StickerIcon name={icon} size={43} /><span>{label}</span>
            </button>
          ))}
        </div>
        <div className="section-title home-tasks-heading">
          <h2>{due.length || !upcoming.length ? "今日待办" : "接下来的小事"}</h2>
          <button className="task-progress" aria-label="查看全部待办" onClick={() => a.go({ name: "reminders", id: pet.id })}>
            <StickerIcon name="PawPrint" size={27} /><strong>{shown.filter((r) => r.done).length}<span> / {shown.length}</span></strong><Icon name="ChevronRight" size={14} />
          </button>
        </div>
        {Object.entries(groups).map(([label, items]) => (
          <section className="task-group" key={label}>
            <h3 className="task-group-label">{label} · {items.length}</h3>
            <div className="home-task-grid">
              {items.map((r) => (
                <button key={r.id} className={`home-task ${r.done ? "done" : ""}`} aria-label={r.done ? `恢复${r.type}待办` : `完成${r.type}`} aria-pressed={r.done} onClick={() => a.completeReminder(r)}>
                  <span className="task-time taped-note">{r.done ? "完成啦" : r.date.slice(11, 16)}</span>
                  <span className="task-sticker-well"><TypeIcon name={r.type} group="reminder" size={40} />{r.done && <span className="task-done-check"><Icon name="Check" size={15} /></span>}</span>
                  <strong>{r.type}</strong>
                </button>
              ))}
              <button className="home-task task-add" aria-label="新增提醒" onClick={() => a.setSheet({ kind: "types", group: "reminder" })}><span className="task-sticker-well"><Icon name="Plus" size={34} /></span></button>
            </div>
          </section>
        ))}
        {!shown.length && <div className="home-no-tasks"><StickerIcon name="Bell" size={42} /><span>今天的小事都安排好啦</span><IconButton icon="Plus" label="新增提醒" onClick={() => a.setSheet({ kind: "types", group: "reminder" })} /></div>}
        <SectionTitle action="全部" onClick={() => { a.setFilters({ pets: [pet.id], group: "all", from: "", to: "", sort: "desc" }); a.switchTab("timeline"); }}>最近记录</SectionTitle>
        <div className="recent-card home-recent">
          {records.slice(0, 3).map((r) => <RecordRow key={r.id} record={r} a={a} />)}
          {!records.length && <Empty title="我们的故事，从今天开始" action="写下第一篇日记" onAction={() => a.openForm("diary")} />}
        </div>
      </div>
    </div>
  );
}
export function Timeline({ a }) {
  const records = filterRecords(a.filters.group === "all" ? a.data.records.filter(isLifeRecord) : a.data.records, a.filters, a.timelineSearch);
  const byDate = Object.groupBy
    ? Object.groupBy(records, (r) => r.date.slice(0, 10))
    : records.reduce((obj, r) => {
        (obj[r.date.slice(0, 10)] ??= []).push(r);
        return obj;
      }, {});
  const photos = records.flatMap((r) =>
    (r.photos || []).map((src, i) => ({ src, record: r, i })),
  );
  return (
    <div className="page-content root-page timeline-page">
      <header className="page-heading">
        <h1>时光</h1>
        <div>
          <IconButton
            icon="Search"
            label="搜索记录"
            onClick={() => a.setShowSearch(!a.showSearch)}
          />
          <IconButton
            icon="SlidersHorizontal"
            label="筛选记录"
            onClick={() => a.setSheet({ kind: "filters" })}
          />
        </div>
      </header>
      <div className="timeline-pets">
        <button
          className={`pet-scope ${a.filters.pets === null ? "selected" : ""}`}
          onClick={() => a.setSheet({ kind: "filters" })}
        >
          <Icon name="PawPrint" size={17} />
          {a.filters.pets === null
            ? "全部宠物"
            : a.filters.pets.length === 1
              ? a.data.pets.find((p) => p.id === a.filters.pets[0])?.name
              : `已选 ${a.filters.pets.length} 只`}
          <Icon name="ChevronDown" size={13} />
        </button>
        {a.data.pets.slice(0, 3).map((p) => (
          <button
            key={p.id}
            className={`timeline-avatar ${a.filters.pets?.includes(p.id) ? "active" : ""}`}
            onClick={() => a.setFilters((f) => ({ ...f, pets: [p.id] }))}
          >
            <Avatar pet={p} size={39} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      {a.showSearch && (
        <Search
          value={a.timelineSearch}
          onChange={a.setTimelineSearch}
          placeholder="搜索日记、内容或类型"
          autoFocus
        />
      )}
      <div className="timeline-toolbar">
        <button
          className="filter-pill"
          onClick={() => a.setSheet({ kind: "filters" })}
        >
          {groupLabels[a.filters.group] || "全部记录"}
          <Icon name="ChevronDown" size={13} />
        </button>
        <button
          className="filter-pill"
          onClick={() => a.setSheet({ kind: "filters" })}
        >
          {a.filters.from || a.filters.to ? "已选日期" : "全部时间"}
          <Icon name="ChevronDown" size={13} />
        </button>
        <div className="view-switch">
          <button
            aria-label="时间线"
            aria-pressed={a.timelineMode === "list"}
            className={a.timelineMode === "list" ? "selected" : ""}
            onClick={() => a.setTimelineMode("list")}
          >
            <Icon name="List" size={18} />
          </button>
          <button
            aria-label="照片墙"
            aria-pressed={a.timelineMode === "photos"}
            className={a.timelineMode === "photos" ? "selected" : ""}
            onClick={() => a.setTimelineMode("photos")}
          >
            <Icon name="Grid2X2" size={17} />
          </button>
        </div>
      </div>
      {a.timelineMode === "list" ? (
        <div className="timeline-list">
          {Object.entries(byDate).map(([date, rows]) => (
            <section className="timeline-day" key={date}>
              <h2>
                {dateLabel(date)}
                <span>{date.slice(5).replace("-", " / ")}</span>
              </h2>
              <div className="timeline-events">
                {rows.map((r) => {
                  const p = a.data.pets.find((p) => p.id === r.petId);
                  return (
                    <article className="timeline-event" key={r.id}>
                      <span className="timeline-dot" />
                      <button
                        className="timeline-card"
                        onClick={() => a.go({ name: "record", id: r.id })}
                      >
                        <div className="event-header">
                          <TypeIcon name={r.type} group={r.group} size={16} />
                          <span>{groupLabels[r.group]}</span>
                          <span className="event-time">
                            {r.date.slice(11, 16)}
                          </span>
                          <span className="event-pet">{p?.name}</span>
                          <Icon name="ChevronRight" size={15} />
                        </div>
                        <h3>{summary(r)}</h3>
                        {r.note && <p>{r.note}</p>}
                        {r.photos?.length > 0 && (
                          <div
                            className={`event-photos photos-${Math.min(3, r.photos.length)}`}
                          >
                            {r.photos.slice(0, 3).map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt={`${p?.name}的照片`}
                                loading="lazy"
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          {!records.length && (
            <Empty
              icon="NotebookPen"
              title="这段时光还没有记录"
              action="新增记录"
              onAction={() => a.setSheet({ kind: "types" })}
            />
          )}
        </div>
      ) : (
        <div className="photo-wall">
          {photos.length ? (
            <>
              <SectionTitle>
                {a.filters.from
                  ? dateLabel(a.filters.from) + "起"
                  : "珍藏的瞬间"}
              </SectionTitle>
              <div className="photo-grid">
                {photos.map(({ src, record, i }) => (
                  <button
                    key={`${record.id}-${i}`}
                    onClick={() => a.setSheet({ kind: "photo", src, record })}
                  >
                    <img
                      src={src}
                      alt={`${a.data.pets.find((p) => p.id === record.petId)?.name} · ${dateLabel(record.date)}`}
                    />
                    <span>
                      {a.data.pets.find((p) => p.id === record.petId)?.name} ·{" "}
                      {dateLabel(record.date)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Empty
              icon="Images"
              title="这里还没有照片"
              action="写一篇照片日记"
              onAction={() => a.openForm("diary")}
            />
          )}
        </div>
      )}
    </div>
  );
}
export function Pets({ a }) {
  const pets = a.data.pets.filter(
    (p) =>
      `${p.name}${p.breed}`.includes(a.petSearch),
  );
  return (
    <div className="page-content root-page">
      <header className="page-heading">
        <h1>猫咪</h1>
        <IconButton
          icon="Plus"
          label="添加猫咪"
          onClick={() => a.go({ name: "pet-form" })}
        />
      </header>
      <Search
        value={a.petSearch}
        onChange={a.setPetSearch}
        placeholder="搜索名字或品种"
      />
      <div className="pet-list">
        {pets.map((p) => {
          const latest = a.data.records
            .filter((r) => r.petId === p.id)
            .sort((x, y) => y.date.localeCompare(x.date))[0];
          return (
            <button
              className="pet-list-card"
              key={p.id}
              onClick={() => a.go({ name: "pet", id: p.id })}
            >
              <div className="pet-list-image">
                <PetArt pet={p} />
              </div>
              <div>
                <h2>
                  {p.name}
                  <span
                    className={p.gender === "女孩" ? "gender female" : "gender"}
                  >
                    {p.gender === "女孩" ? "♀" : p.gender === "男孩" ? "♂" : ""}
                  </span>
                </h2>
                <PetMeta pet={p} />
                <span className="pet-last-seen">
                  {latest
                    ? `最近记录 · ${dateLabel(latest.date)}`
                    : "故事刚刚开始"}
                </span>
              </div>
              <Icon name="ChevronRight" size={19} />
            </button>
          );
        })}
        {!pets.length && <Empty icon="Search" title="没有找到这位小朋友" />}
      </div>
      <button
        className="add-pet-dashed"
        onClick={() => a.go({ name: "pet-form" })}
      >
        <Icon name="Plus" size={19} />
        添加猫咪
      </button>
    </div>
  );
}
