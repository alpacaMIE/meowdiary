import React, { useState } from "react";
import { Topbar, Icon, IconButton, TypeIcon, Avatar, Chips, Primary, Empty } from "./ui";
import { TODAY, dateLabel } from "./data";
import { HOUSEHOLD, money, stockQuantity, stockStatus, selectStock, adjustStock, addStockReminder, expenseSummary } from "./careData";

function PetChips({ pets, value, onChange, shared = true }) {
  return <div className="household-pets"><Chips items={[["all", "全部宠物"], ...pets.map((p) => [p.id, p.name]), ...(shared ? [[HOUSEHOLD, "家里共用"]] : [])]} value={value} onChange={onChange} /></div>;
}

export function Stock({ a }) {
  const [petId, setPetId] = useState(a.page?.petFilter || "all"), [category, setCategory] = useState(a.page?.category || "全部");
  const records = selectStock(a.data.records, petId, category);
  const add = () => a.openForm("stock", "食品", petId === "all" ? HOUSEHOLD : petId);
  function remind(r, purpose) {
    const next = addStockReminder(a.data, r, purpose);
    if (next === a.data) { a.go({ name: "reminders" }); return; }
    if (a.commit(next)) a.toast("已加入提醒与待办");
  }
  return <>
    <Topbar title="囤货清单" onBack={a.back} action={<IconButton icon="Bell" label="查看囤货提醒" onClick={() => a.go({ name: "reminders" })} />} />
    <div className="page-content household-page stock-page">
      <PetChips pets={a.data.pets} value={petId} onChange={(v) => { setPetId(v); a.updatePage({ petFilter: v }); }} />
      <Chips items={["全部", "食品", "药品", "用具", "已用完"]} value={category} onChange={(v) => { setCategory(v); a.updatePage({ category: v }); }} />
      <div className="stock-list">
        {records.map((r) => {
          const status = stockStatus(r), quantity = stockQuantity(r), pet = a.data.pets.find((p) => p.id === r.petId);
          const purpose = quantity === 0 ? "restock" : "expiry";
          const reminded = a.data.reminders.some((item) => !item.done && item.sourceStockId === r.id && item.stockPurpose === purpose);
          return <article className={`stock-card card ${quantity > 0 ? status.tone : "used"}`} key={r.id}>
            <button className="stock-info" onClick={() => a.go({ name: "record", id: r.id })}>
              {r.photos?.[0] ? <img className="stock-photo" src={r.photos[0]} alt={r.itemName} /> : <TypeIcon name={r.type} group="stock" />}
              <span className="stock-copy"><strong>{r.itemName}</strong><small>{pet?.name || "家里共用"} · {r.type}</small>{r.location && <span className="stock-location"><Icon name="MapPin" size={13} />{r.location}</span>}</span>
              <Icon name="ChevronRight" size={16} />
            </button>
            <div className="stock-balance">
              <span className={`expiry-tag ${quantity > 0 ? status.tone : "neutral"}`}>{quantity === 0 ? "已用完" : status.label}</span>
              <div className="quantity-stepper">
                <button aria-label={`减少${r.itemName}余量`} disabled={quantity === 0} onClick={() => a.commit(adjustStock(a.data, r.id, -1))}><Icon name="Minus" size={17} /></button>
                <span aria-live="polite"><b>{quantity}</b> {r.unit || "件"}</span>
                <button aria-label={`增加${r.itemName}余量`} onClick={() => a.commit(adjustStock(a.data, r.id, 1))}><Icon name="Plus" size={17} /></button>
              </div>
            </div>
            {(quantity === 0 || status.days <= 30) && <div className="stock-followup">
              <button className="text-button" onClick={() => remind(r, purpose)}><Icon name={reminded ? "BellRing" : "BellPlus"} size={16} />{reminded ? "查看提醒" : quantity === 0 ? "提醒补货" : "添加有效期提醒"}</button>
              {quantity === 0 && <button className="text-button" onClick={() => a.go({ name: "form", group: "stock", type: r.type, petId: r.petId, draft: { itemName: r.itemName, location: r.location, unit: r.unit, photos: r.photos || [], quantity: 1 } })}>再囤一次<Icon name="ArrowUpRight" size={16} /></button>}
            </div>}
          </article>;
        })}
        {!records.length && <Empty icon="Package" title={category === "已用完" ? "还没有用完的物品" : "柜子里还有什么？"} />}
      </div>
      <div className="page-bottom-action"><Primary onClick={add}><Icon name="Plus" size={20} />添加囤货</Primary></div>
    </div>
  </>;
}

export function Ledger({ a, initialPetId = "all" }) {
  const [petId, setPetId] = useState(a.page?.petFilter || initialPetId), [month, setMonth] = useState(a.page?.month || TODAY.slice(0, 7)), [year, setYear] = useState(a.page?.year || false);
  const report = expenseSummary(a.data.records, { month, year, petId });
  function shift(amount) {
    const d = new Date(`${month}-01T12:00:00`);
    if (year) d.setFullYear(d.getFullYear() + amount); else d.setMonth(d.getMonth() + amount);
    const next = d.toLocaleDateString("sv-SE").slice(0, 7);
    setMonth(next); a.updatePage({ month: next });
  }
  return <>
    <Topbar title="养宠账本" onBack={a.back} />
    <div className="page-content household-page ledger-page">
      <div className="ledger-period">
        <IconButton icon="ChevronLeft" label={year ? "上一年" : "上个月"} onClick={() => shift(-1)} />
        <strong>{year ? `${month.slice(0, 4)} 年` : `${month.slice(0, 4)} 年 ${Number(month.slice(5))} 月`}</strong>
        <IconButton icon="ChevronRight" label={year ? "下一年" : "下个月"} onClick={() => shift(1)} />
        <button className={`chip ${year ? "selected" : ""}`} aria-pressed={year} onClick={() => { setYear(!year); a.updatePage({ year: !year }); }}>{year ? "按月" : "全年"}</button>
      </div>
      <PetChips pets={a.data.pets} value={petId} onChange={(v) => { setPetId(v); a.updatePage({ petFilter: v }); }} />
      <section className="ledger-summary card">
        <div className="ledger-summary-heading"><span>{year ? "全年" : "本月"}总支出</span><TypeIcon name="记账" group="expense" /></div>
        <h2><small>¥</small>{money(report.spent)}</h2>
        <p>{report.entries.length} 笔{report.income > 0 && <span> · 收入 ¥{money(report.income)}</span>}</p>
        {report.spent > 0 && <div className="expense-breakdown">
          <div className="expense-bar" role="img" aria-label={report.categories.map((c) => `${c.name} ${Math.round(c.percent)}%`).join("，")}>
            {report.categories.map((c, i) => <span key={c.name} className={`category-color color-${i}`} style={{ width: `${c.percent}%` }} />)}
          </div>
          <div className="expense-legend">{report.categories.map((c, i) => <span key={c.name}><i className={`category-color color-${i}`} />{c.name}<b>{Math.round(c.percent)}%</b></span>)}</div>
        </div>}
      </section>
      <div className="ledger-days">
        {report.days.map((day) => <section className="ledger-day" key={day.date}>
          <header><h3>{dateLabel(day.date)}</h3><span>支出 ¥{money(day.spent)}{day.income > 0 && ` · 收入 ¥${money(day.income)}`}</span></header>
          <div className="card">{day.entries.map((r) => {
            const pet = a.data.pets.find((p) => p.id === r.petId);
            return <button className="bill-row" key={r.id} onClick={() => a.go({ name: "record", id: r.id })}>
              <TypeIcon name={r.type} group="expense" />
              <span className="bill-copy"><strong>{r.type}</strong>{r.note && <small>{r.note}</small>}<span className="bill-pet">{pet && <Avatar pet={pet} size={18} />}{pet?.name || "家里共用"}</span></span>
              <b className={r.direction === "收入" ? "income" : ""}>{r.direction === "收入" ? "+" : "−"} ¥{money(r.amount)}</b>
            </button>;
          })}</div>
        </section>)}
        {!report.entries.length && <Empty icon="Wallet" title="这段时间还没有账单" />}
      </div>
      <div className="page-bottom-action"><Primary onClick={() => a.openForm("expense", "宠物食品", petId === "all" ? HOUSEHOLD : petId)}><Icon name="Plus" size={20} />记一笔</Primary></div>
    </div>
  </>;
}
