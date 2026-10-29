import React, { useState } from "react";
import {
  Icon,
  StickerIcon,
  IconButton,
  Avatar,
  PetArt,
  PetMeta,
  Primary,
  Topbar,
  Row,
  SectionTitle,
  Empty,
  Segmented,
  Chips,
  TypeIcon,
} from "./ui";
import {
  TODAY,
  dayOffset,
  togetherDays,
  ageLabel,
  dateLabel,
  summary,
  groupLabels,
  reminderRepeatLabel,
} from "./data";
import { RecordRow } from "./HomeTimeline";
import { symptomSummary, householdPet, deleteManagedRecord } from "./careData";

export function PetDetail({ a, pet }) {
  const records = a.data.records
      .filter((r) => r.petId === pet.id)
      .sort((x, y) => y.date.localeCompare(x.date)),
    weight = records.find((r) => r.group === "weight");
  const healthCount = (pattern) => records.filter(r => ["health", "note"].includes(r.group) && pattern.test(r.type)).length;
  const nextCare = (pattern) => a.data.reminders.filter(r => r.petId === pet.id && !r.done && pattern.test(r.type)).sort((x, y) => x.date.localeCompare(y.date))[0];
  return (
    <>
      <Topbar
        title="猫咪档案"
        onBack={a.back}
        action={
          <button
            className="text-button"
            onClick={() => a.go({ name: "pet-form", id: pet.id })}
          >
            编辑
          </button>
        }
      />
      <div className="page-content detail-page">
        <div className="profile-stage">
          <div className="profile-blob" />
          <span className="doodle-heart heart-left" aria-hidden="true"><Icon name="Heart" size={23} /></span>
          <span className="doodle-heart heart-right" aria-hidden="true"><Icon name="Heart" size={20} /></span>
          <span className="doodle-ball" aria-hidden="true" />
          <PetArt pet={pet} />
          <button
            className="profile-customize"
            aria-label="编辑猫咪形象"
            onClick={() => a.go({ name: "appearance-pet", id: pet.id })}
          >
            <Icon name="Sparkles" size={20} />
          </button>
        </div>
        <div className="profile-name">
          <h1>
            {pet.name}
            <span
              className={pet.gender === "女孩" ? "gender female" : "gender"}
            >
              {pet.gender === "女孩" ? "♀" : pet.gender === "男孩" ? "♂" : ""}
            </span>
          </h1>
          <PetMeta pet={pet} />
          <p className="together-line">
            <Icon name="Heart" size={14} />
            {pet.homeDate ? `我们已经一起度过 ${togetherDays(pet.homeDate)} 天` : "一起收藏每一个猫咪日常"}
          </p>
        </div>
        <div className="profile-stats">
          {[
            [
              "Scale",
              "体重",
              weight ? Number(weight.weight).toFixed(2) : "—",
              "kg",
              "weight",
              weight ? dateLabel(weight.date) : "还没有记录",
            ],
            [
              "Soup",
              "今天喂食",
              records.filter(
                (r) => r.group === "food" && r.date.startsWith(TODAY),
              ).length,
              "次",
              "food",
              "今天",
            ],
            ["Syringe", "疫苗", healthCount(/疫苗|联$/), "次", "vaccine", nextCare(/疫苗|联$/) ? `下次 ${dateLabel(nextCare(/疫苗|联$/).date)}` : "暂无下次提醒"],
            ["ShieldCheck", "驱虫", healthCount(/驱/), "次", "deworm", nextCare(/驱/) ? `下次 ${dateLabel(nextCare(/驱/).date)}` : "暂无下次提醒"],
          ].map(([icon, label, value, unit, target, caption]) => (
            <button
              key={target}
              onClick={() => {
                if (["weight", "vaccine", "deworm"].includes(target))
                  a.go({ name: target === "weight" ? "weight" : "health", id: pet.id, mode: target });
                else {
                  a.setFilters({
                    pets: [pet.id],
                    group: target,
                    from: target === "food" ? TODAY : "",
                    to: "",
                    sort: "desc",
                  });
                  a.switchTab("timeline");
                }
              }}
            >
              <span
                className={`small-icon ${target === "weight" ? "blue" : target === "health" ? "sage" : "peach"}`}
              >
                <StickerIcon name={icon} size={37} />
              </span>
              <span>
                {label}
                <strong>
                  {value}
                  <small>{unit}</small>
                </strong>
                <small className="stat-caption">{caption}</small>
              </span>
              <Icon name="ChevronRight" size={15} />
            </button>
          ))}
        </div>
        <div className="card settings-group">
          <Row
            icon="ClipboardList"
            label="基本资料"
            description="名字、品种、生日与到家日"
            onClick={() => a.go({ name: "pet-form", id: pet.id })}
          />
          <Row icon="Syringe" label="健康与护理" description="疫苗、驱虫与体征记录" tone="sage" onClick={() => a.go({ name: "health", id: pet.id })} />
          <Row
            icon="Images"
            label="照片与日记"
            description="珍藏每一个可爱瞬间"
            tone="pink"
            onClick={() => {
              a.setFilters({
                pets: [pet.id],
                group: "all",
                from: "",
                to: "",
                sort: "desc",
              });
              a.setTimelineMode("photos");
              a.switchTab("timeline");
            }}
          />
          <Row
            icon="Bell"
            label="提醒与待办"
            description="照顾它的每一件小事"
            onClick={() => a.go({ name: "reminders", id: pet.id })}
          />
          <Row
            icon="Share2"
            label="分享它的可爱"
            tone="sage"
            onClick={() => a.go({ name: "share", id: pet.id })}
          />
          <Row icon="Wallet" label="它的花销" tone="yellow" onClick={() => a.go({ name: "ledger", id: pet.id })} />
        </div>
      </div>
    </>
  );
}
export function Weight({ a, pet }) {
  const [range, setRange] = useState("30"),
    [selected, setSelected] = useState(null);
  const all = a.data.records
    .filter((r) => r.petId === pet.id && r.group === "weight")
    .sort((x, y) => y.date.localeCompare(x.date));
  const entries = all
    .filter(
      (r) =>
        range === "all" || r.date.slice(0, 10) >= dayOffset(-Number(range)),
    )
    .slice()
    .reverse();
  const latest = all[0],
    previous = all[1],
    delta = latest && previous ? latest.weight - previous.weight : null;
  const weights = entries.map((r) => Number(r.weight)),
    lo = Math.min(...weights) - 0.15,
    hi = Math.max(...weights) + 0.15;
  const x = (i) => 42 + (i / Math.max(1, entries.length - 1)) * 288,
    y = (v) => 168 - ((v - lo) / (hi - lo)) * 130;
  const path = entries
    .map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r.weight)}`)
    .join(" ");
  const highlighted = selected !== null && entries[selected] ? selected : entries.length - 1;
  return (
    <>
      <Topbar title="体重曲线" onBack={a.back} />
      <div className="page-content weight-page">
        <Segmented
          items={[
            ["7", "7 天"],
            ["30", "30 天"],
            ["90", "90 天"],
            ["all", "全部"],
          ]}
          value={range}
          onChange={(v) => {
            setRange(v);
            setSelected(null);
          }}
        />
        <div className="weight-overview">
          <div>
            <span className="eyebrow">{pet.name}的体重</span>
            <h1>
              {latest ? Number(latest.weight).toFixed(2) : "—"}
              <small>kg</small>
            </h1>
            {delta !== null && (
              <p className="weight-change">
                较上次 {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)} kg{" "}
                <Icon
                  name={delta >= 0 ? "TrendingUp" : "TrendingDown"}
                  size={16}
                />
              </p>
            )}
            <span className="muted">
              {latest
                ? `${dateLabel(latest.date)} ${latest.date.slice(11, 16)}`
                : "还没有体重记录"}
            </span>
          </div>
          <PetArt pet={pet} />
        </div>
        {entries.length ? (
          <div className="weight-chart">
            <svg
              viewBox="0 0 360 220"
              role="img"
              aria-label={`${pet.name}体重趋势，${entries.length}条记录`}
            >
              <defs>
                <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EDC24A" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#EDC24A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((t) => (
                <g key={t}>
                  <line
                    x1="42"
                    y1={y(lo + (hi - lo) * t)}
                    x2="336"
                    y2={y(lo + (hi - lo) * t)}
                    className="chart-grid"
                  />
                  <text
                    x="3"
                    y={y(lo + (hi - lo) * t) + 4}
                    className="chart-label"
                  >
                    {(lo + (hi - lo) * t).toFixed(1)}
                  </text>
                </g>
              ))}
              <path
                d={`${path} L${x(entries.length - 1)},185 L42,185 Z`}
                fill="url(#chart-fill)"
              />
              <path
                d={path}
                fill="none"
                stroke="#B09234"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {entries.map((r, i) => (
                <g key={r.id}>
                  <circle
                    cx={x(i)}
                    cy={y(r.weight)}
                    r={highlighted === i ? 5 : 4}
                    className="chart-dot"
                    onClick={() => setSelected(i)}
                    role="button"
                    tabIndex="0"
                    aria-label={`${r.date.slice(0, 10)} ${r.weight} kg`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelected(i);
                    }}
                  />
                  {(entries.length < 7 ||
                    i % Math.ceil(entries.length / 5) === 0 ||
                    i === entries.length - 1) && (
                    <text
                      x={x(i)}
                      y="209"
                      textAnchor="middle"
                      className="chart-label"
                    >
                      {r.date.slice(5, 10).replace("-", ".")}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            {highlighted >= 0 && (
              <div className="chart-tooltip">
                {dateLabel(entries[highlighted].date)} ·{" "}
                {Number(entries[highlighted].weight).toFixed(2)} kg
              </div>
            )}
          </div>
        ) : (
          <Empty icon="ChartNoAxesCombined" title="这段时间还没有称重" />
        )}
        <Primary onClick={() => a.openForm("weight", "称体重", pet.id)}>
          <Icon name="Plus" size={21} />
          记录体重
        </Primary>
        <SectionTitle>历史记录</SectionTitle>
        <div className="card weight-history">
          {all.map((r, i) => (
            <button
              key={r.id}
              onClick={() => a.go({ name: "record", id: r.id })}
            >
              <span>
                {dateLabel(r.date)}
                <small>{r.date.slice(11, 16)}</small>
              </span>
              <strong>
                {r.weight.toFixed(2)}
                <small> kg</small>
              </strong>
              <span className="weight-delta">
                {all[i + 1]
                  ? `${r.weight - all[i + 1].weight >= 0 ? "+" : ""}${(r.weight - all[i + 1].weight).toFixed(2)}`
                  : "—"}
              </span>
              <Icon name="ChevronRight" size={16} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
export function Reminders({ a, petId }) {
  const [mode, setMode] = useState("today");
  const all = a.data.reminders.filter((r) => !petId || r.petId === petId);
  const filtered = all
    .filter((r) =>
      mode === "done"
        ? r.done
        : mode === "today"
          ? !r.done && r.date.slice(0, 10) <= TODAY
          : !r.done && r.date.slice(0, 10) > TODAY,
    )
    .sort((x, y) => x.date.localeCompare(y.date));
  const complete = a.completeReminder;
  return (
    <>
      <Topbar
        title="提醒与待办"
        onBack={a.back}
        action={
          <IconButton
            icon="Plus"
            label="新增提醒"
            onClick={() => a.setSheet({ kind: "types", group: "reminder" })}
          />
        }
      />
      <div className="page-content reminder-page">
        <div className="reminder-banner">
          <div>
            <Icon name="Sun" size={24} />
            <h2>
              小小的惦记
            </h2>
          </div>
          <PetArt
            pet={a.data.pets.find((p) => p.id === petId) || a.currentPet}
          />
        </div>
        <Segmented
          items={[
            ["today", `今天 (${all.filter(r => !r.done && r.date.slice(0, 10) <= TODAY).length})`],
            ["pending", `即将到来 (${all.filter(r => !r.done && r.date.slice(0, 10) > TODAY).length})`],
            ["done", `已完成 ${all.filter((r) => r.done).length}`],
          ]}
          value={mode}
          onChange={setMode}
        />
        <div className="reminder-list">
          {filtered.map((r, index) => {
            const p = a.data.pets.find((p) => p.id === r.petId);
            const section = r.done ? "已完成" : r.date.slice(0, 10) <= TODAY ? "今天" : "即将到来";
            const previous = filtered[index - 1];
            const previousSection = previous && (previous.done ? "已完成" : previous.date.slice(0, 10) <= TODAY ? "今天" : "即将到来");
            return (
              <React.Fragment key={r.id}>
              {section !== previousSection && <h2 className="reminder-section-title">{section}</h2>}
              <div
                className={`reminder-item ${r.done ? "completed" : ""}`}
                key={r.id}
              >
                <button
                  className="reminder-info"
                  onClick={() =>
                    a.go({
                      name: "form",
                      group: "reminder",
                      type: r.type,
                      editId: r.id,
                      petId: r.petId,
                    })
                  }
                >
                  <TypeIcon name={r.type} group="reminder" />
                  <span>
                    <strong>
                      {p?.name || "家里共用"} · {r.type}
                    </strong>
                    <small>
                      {dateLabel(r.date)} {r.date.slice(11, 16)}
                      {r.repeat && r.repeat !== "从不" && ` · ${reminderRepeatLabel(r)}`}
                    </small>
                  </span>
                </button>
                <button
                  className="complete-button"
                  aria-label={r.done ? `恢复${r.type}待办` : `完成${r.type}`}
                  onClick={() => complete(r)}
                >
                  <Icon name={r.done ? "CircleCheck" : "Circle"} size={25} />
                </button>
                <button
                  className="delete-reminder"
                  aria-label={`删除${r.type}提醒`}
                  onClick={() =>
                    a.ask(
                      "删除这条提醒？",
                      "不会删除已保存的实际记录。",
                      () =>
                        a.commit({
                          ...a.data,
                          reminders: a.data.reminders.filter(
                            (x) => x.id !== r.id,
                          ),
                        }),
                      "删除提醒",
                    )
                  }
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
              </React.Fragment>
            );
          })}
          {!filtered.length && (
            <Empty
              icon="CircleCheck"
              title={mode === "done" ? "还没有完成的待办" : "小事都安排好啦"}
            />
          )}
        </div>
        <button
          className="add-pet-dashed"
          onClick={() => a.setSheet({ kind: "types", group: "reminder" })}
        >
          <Icon name="Plus" size={18} />
          添加一件小事
        </button>
      </div>
    </>
  );
}
export function Health({ a, pet }) {
  const [mode, setMode] = useState(a.page?.mode || "vaccine");
  const symptoms = symptomSummary(a.data.records, pet.id);
  const isMatch = (r) =>
    mode === "symptom" ? r.group === "symptom" : r.group !== "symptom" && (mode === "vaccine" ? /疫苗|联$/.test(r.type) : /驱/.test(r.type));
  const records = a.data.records
    .filter((r) => r.petId === pet.id && (mode === "symptom" || ["health", "note"].includes(r.group)) && isMatch(r))
    .sort((x, y) => y.date.localeCompare(x.date));
  const reminders = a.data.reminders.filter(
    (r) => r.petId === pet.id && !r.done && isMatch(r),
  );
  return (
    <>
      <Topbar title="健康与护理" onBack={a.back} />
      <div className="page-content health-page">
        <div className="pet-inline">
          <Avatar pet={pet} size={58} />
          <div>
            <h2>{pet.name}</h2>
            <PetMeta pet={pet} />
          </div>
        </div>
        <Segmented
          items={[
            ["vaccine", "疫苗"],
            ["deworm", "驱虫"],
            ["symptom", "体征"],
          ]}
          value={mode}
          onChange={(value) => { setMode(value); a.updatePage({ mode: value }); }}
        />
        {mode === "symptom" ? <>
          <section className="symptom-summary card"><Icon name="NotebookPen" size={23} /><div><h2>近 30 天记录 <b>{symptoms.count}</b> 次</h2>{symptoms.types.length > 0 && <p>{symptoms.types.map(([type, count]) => `${type} ${count}`).join(" / ")}</p>}</div></section>
          <div className="symptom-list">
            {records.map((r) => <article className="symptom-entry" key={r.id}>
              <button className="symptom-copy" onClick={() => a.go({ name: "record", id: r.id })}><span className="symptom-label">{r.type}</span><time>{r.date.slice(0, 10)} · {r.date.slice(11, 16)}</time>{r.note && <p>{r.note}</p>}</button>
              {!!r.photos?.length && <div className="symptom-photos">{r.photos.map((src, i) => <button key={i} aria-label={`查看${r.type}照片 ${i + 1}`} onClick={() => a.setSheet({ kind: "photo", src, record: r })}><img src={src} alt={`${r.type}现场照片 ${i + 1}`} /></button>)}</div>}
            </article>)}
            {!records.length && <Empty icon="HeartPulse" title="还没有体征记录" />}
          </div>
        </> : <>
        <div className="care-overview">
          {[...new Set([...records.map(r => r.type), ...reminders.map(r => r.type)])].map(type => {
            const latest = records.find(r => r.type === type);
            const next = reminders.filter(r => r.type === type).sort((x, y) => x.date.localeCompare(y.date))[0];
            return <section className="care-card card" key={type}><h3><StickerIcon name={mode === "vaccine" ? "Syringe" : "ShieldCheck"} size={51} />{type}</h3>
              <button onClick={() => latest ? a.go({ name: "record", id: latest.id }) : a.openForm("health", type, pet.id)}><span>{mode === "vaccine" ? "上次接种" : "上次驱虫"}</span><strong>{latest ? latest.date.slice(0, 10).replaceAll("-", ".") : "添加记录"}</strong><Icon name="ChevronRight" size={17} /></button>
              <button className="next-care" onClick={() => a.go({ name: "form", group: "reminder", type, petId: pet.id, ...(next ? { editId: next.id } : {}) })}><span>下次提醒</span><strong>{next ? next.date.slice(0, 10).replaceAll("-", ".") : "设置提醒"}</strong><Icon name="CalendarDays" size={19} /></button>
            </section>;
          })}
          {!records.length && !reminders.length && <Empty icon="Syringe" title="还没有护理记录" />}
        </div>
        <Primary onClick={() => a.openForm("health", mode === "vaccine" ? "猫三联疫苗" : "外驱", pet.id)}><Icon name="Plus" size={21} />添加护理记录</Primary>
        <SectionTitle>历史记录</SectionTitle>
        <div className="card">
          {records.map((r) => (
            <RecordRow key={r.id} record={r} a={a} />
          ))}
          {!records.length && (
            <Empty icon="ShieldCheck" title="还没有护理记录" />
          )}
        </div>
        </>}
        {mode === "symptom" && <Primary
          onClick={() =>
            a.openForm("symptom", "软便", pet.id)
          }
        >
          <Icon name="Plus" size={21} />
          记录体征
        </Primary>}
      </div>
    </>
  );
}
export function RecordDetail({ a, record: r }) {
  const pet = a.data.pets.find((p) => p.id === r.petId) || householdPet;
  return (
    <>
      <Topbar
        title={groupLabels[r.group] + "记录"}
        onBack={a.back}
        action={
          <button
            className="text-button"
            onClick={() =>
              a.go({ name: "form", group: r.group, type: r.type, editId: r.id })
            }
          >
            编辑
          </button>
        }
      />
      <article className="page-content record-detail">
        <div className="record-byline">
          <Avatar pet={pet} size={40} />
          <strong>{pet?.name}</strong>
          <span>
            {dateLabel(r.date)} {r.date.slice(11, 16)}
          </span>
        </div>
        <div className="record-title">
          <TypeIcon name={r.type} group={r.group} />
          <h1>{summary(r)}</h1>
        </div>
        {r.note && <p className="record-note">{r.note}</p>}
        {r.tags && <div className="record-tags">{r.tags.split(/[,，]/).filter(Boolean).map((tag, i) => <span key={i}>#{tag.trim()}</span>)}</div>}
        {["hospital", "expiry", "location"]
          .filter((k) => r[k])
          .map((k) => (
            <div className="detail-field" key={k}>
              <span>
                {
                  {
                    hospital: "医院 / 品牌",
                    expiry: "有效期",
                    location: r.group === "diary" ? "地点" : "存放位置",
                    repeat: "重复",
                  }[k]
                }
              </span>
              <strong>{r[k]}</strong>
            </div>
          ))}
        {r.photos?.map((src, i) => (
          <button
            key={i}
            className="detail-photo"
            onClick={() => a.setSheet({ kind: "photo", src })}
          >
            <img src={src} alt={`记录照片 ${i + 1}`} />
          </button>
        ))}
        <div className="record-actions">
          {pet.id !== householdPet.id && <button
            className="secondary"
            onClick={() => a.go({ name: "share", id: pet.id, recordId: r.id })}
          >
            <Icon name="Share2" size={19} />
            分享卡片
          </button>}
          <IconButton
            icon="Trash2"
            label="删除记录"
            onClick={() =>
              a.ask(
                "删除这条记录？",
                r.group === "stock" ? "这件囤货和关联提醒将被移除，已生成的账单会保留。" : "删除后，这条记录及其照片会被移除。",
                () => {
                  if (
                    a.commit(deleteManagedRecord(a.data, r))
                  ) {
                    a.back();
                    a.toast("记录已删除");
                  }
                },
                "删除记录",
              )
            }
          />
        </div>
      </article>
    </>
  );
}
export function PetAppearance({ a, pet }) {
  const [tone, setTone] = useState(pet.tone),
    [body, setBody] = useState(pet.body);
  return (
    <>
      <Topbar title="编辑猫咪形象" onBack={a.back} />
      <div className="page-content appearance-pet">
        <div className="appearance-stage">
          <div className="profile-blob" />
          <PetArt pet={{ ...pet, tone, body }} />
        </div>
        <div className="card settings-group appearance-breed"><Row icon="Cat" label="品种" value={pet.breed || "暂未填写"} onClick={() => a.go({ name: "pet-form", id: pet.id })} /></div>
        <SectionTitle>毛色 / 花纹</SectionTitle>
        <div className="fur-colors">
          {[
            ["original", "原色"],
            ["warm", "暖棕"],
            ["silver", "银灰"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`${id} ${tone === id ? "selected" : ""}`}
              onClick={() => setTone(id)}
              aria-pressed={tone === id}
            >
              <span>{tone === id && <Icon name="Check" size={17} />}</span>
              {label}
            </button>
          ))}
        </div>
        <SectionTitle>体型</SectionTitle>
        <div className="body-choices">
          {[
            ["slim", "偏瘦"],
            ["standard", "标准"],
            ["round", "圆润"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={body === id ? "selected" : ""}
              aria-pressed={body === id}
              onClick={() => setBody(id)}
            >
              <Icon name="Cat" size={30} />
              {label}
            </button>
          ))}
        </div>
        <p className="small-note">仅改变形象，不影响实际体重记录。</p>
        <Primary
          onClick={() => {
            if (
              a.commit({
                ...a.data,
                pets: a.data.pets.map((p) =>
                  p.id === pet.id ? { ...p, tone, body } : p,
                ),
              })
            ) {
              a.back();
              a.toast("新模样已保存");
            }
          }}
        >
          保存形象
        </Primary>
      </div>
    </>
  );
}
