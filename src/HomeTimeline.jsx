import React from "react";
import {
  Avatar,
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
  const pet = a.currentPet,
    records = a.data.records
      .filter((r) => r.petId === pet.id)
      .sort((x, y) => y.date.localeCompare(x.date));
  const todayRecords = records.filter((r) => r.date.startsWith(TODAY)),
    pending = a.data.reminders.filter((r) => r.petId === pet.id && !r.done),
    next = pending.sort((x, y) => x.date.localeCompare(y.date))[0];
  const hour = new Date().getHours(),
    greeting =
      hour < 11
        ? "早上好"
        : hour < 14
          ? "中午好"
          : hour < 18
            ? "下午好"
            : "晚上好";
  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1>
            {greeting}，{pet.name}
            <span className="greeting-dot">。</span>
          </h1>
          <p>
            {new Date().toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        <button
          className="pet-switcher"
          aria-label="切换宠物"
          onClick={() => a.setSheet({ kind: "pets" })}
        >
          <Avatar pet={pet} size={38} />
          <Icon name="ChevronDown" size={15} />
        </button>
      </header>
      <section className="pet-stage">
        <div className="stage-halo" />
        <div className="stage-window" />
        <div className="stage-sun" />
        <div className="stage-leaf leaf-one" />
        <div className="stage-leaf leaf-two" />
        <span className="stage-spark spark-one">
          <Icon name="Sparkles" size={24} />
        </span>
        <span className="stage-spark spark-two">
          <Icon name="Heart" size={20} />
        </span>
        <button
          className="hero-pet-button"
          aria-label={`查看${pet.name}的档案`}
          onClick={() => a.go({ name: "pet", id: pet.id })}
        >
          <PetArt pet={pet} />
        </button>
        <div className="stage-floor" />
        <div className="together-badge">
          <span className="tiny-heart">
            <Icon name="Heart" size={13} fill="currentColor" />
          </span>
          一起的第 <strong>{togetherDays(pet.homeDate)}</strong> 天
        </div>
        <button
          className="stage-edit"
          aria-label="编辑宠物形象"
          onClick={() => a.go({ name: "appearance-pet", id: pet.id })}
        >
          <Icon name="Sparkles" size={19} />
        </button>
      </section>
      <div className="page-content home-content">
        <div className="today-cards">
          <button
            className="today-card"
            onClick={() => {
              a.setFilters({
                pets: [pet.id],
                group: "all",
                from: TODAY,
                to: TODAY,
                sort: "desc",
              });
              a.switchTab("timeline");
            }}
          >
            <span className="today-label">
              <Icon name="CalendarDays" size={17} />
              今天的陪伴
            </span>
            <span className="today-value">
              {todayRecords.length}
              <small>条记录</small>
            </span>
          </button>
          <button
            className="today-card"
            onClick={() => a.go({ name: "reminders" })}
          >
            <span className="today-label">
              <Icon name="Bell" size={17} />
              待办事项
              <span className="notification-dot" />
            </span>
            <span className="today-value">
              {pending.length}
              <small>件小事</small>
            </span>
            <span className="today-foot">
              {next
                ? `${next.type} · ${dateLabel(next.date)}`
                : "今天也照顾得很好"}
              <Icon name="ChevronRight" size={14} />
            </span>
          </button>
        </div>
        <SectionTitle>快捷记录</SectionTitle>
        <div className="quick-actions">
          {[
            ["diary", "BookOpen", "写日记"],
            ["food", "Soup", "记喂食"],
            ["weight", "Scale", "记体重"],
          ].map(([group, icon, label]) => (
            <button
              key={group}
              className={`quick-action ${group}`}
              onClick={() => a.openForm(group)}
            >
              <Icon name={icon} size={26} />
              <span>{label}</span>
              <Icon className="quick-plus" name="Plus" size={13} />
            </button>
          ))}
        </div>
        <SectionTitle
          action="全部"
          onClick={() => {
            a.setFilters({
              pets: [pet.id],
              group: "all",
              from: "",
              to: "",
              sort: "desc",
            });
            a.switchTab("timeline");
          }}
        >
          最近记录
        </SectionTitle>
        <div className="card recent-card">
          {records.slice(0, 3).map((r) => (
            <RecordRow key={r.id} record={r} a={a} />
          ))}
          {!records.length && (
            <Empty
              title="我们的故事，从今天开始"
              action="写下第一篇日记"
              onAction={() => a.openForm("diary")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
export function Timeline({ a }) {
  const records = filterRecords(a.data.records, a.filters, a.timelineSearch);
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
      (a.petSpecies === "全部" || p.species === a.petSpecies) &&
      `${p.name}${p.breed}`.includes(a.petSearch),
  );
  return (
    <div className="page-content root-page">
      <header className="page-heading">
        <h1>宠物</h1>
        <IconButton
          icon="Plus"
          label="添加宠物"
          onClick={() => a.go({ name: "pet-form" })}
        />
      </header>
      <Search
        value={a.petSearch}
        onChange={a.setPetSearch}
        placeholder="搜索名字或品种"
      />
      <Chips
        items={["全部", "猫", "狗"]}
        value={a.petSpecies}
        onChange={a.setPetSpecies}
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
        添加宠物
      </button>
    </div>
  );
}
