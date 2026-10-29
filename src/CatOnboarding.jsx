import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, IconButton, PetArt, PetPhoto, Primary, StickerIcon } from "./ui";
import { TODAY } from "./data";
import { readPhoto } from "./Forms";
import { CAT_AVATARS, CAT_BREEDS, catErrors, cropGeometry, fullDate, newCatDraft, validPastDate } from "./catProfile";
import { RotateCw, RotateCcw, Pencil, CircleAlert } from "lucide-react";
import "./onboarding.css";

function Art({ kind, className = "" }) {
  const crop = kind === "welcome" ? [24, 225, 842, 840] : kind === "dates" ? [245, 528, 400, 380] : [243, 534, 420, 335];
  return <svg className={`cat-art ${className}`} viewBox={crop.join(" ")} aria-hidden="true"><image href={`/assets/onboarding/${kind}.png`} width="891" height="1765" /></svg>;
}
function CatFace({ pet, className = "" }) {
  return <span className={`cat-face ${className} ${pet.photo || pet.imageCrop ? "cat-face-photo" : ""}`}><PetPhoto pet={pet} /></span>;
}
function Action({ children, arrow = true, ...props }) {
  return <Primary className="cat-primary" {...props}><span>{children}</span>{arrow && <Icon name="ArrowRight" size={23} />}</Primary>;
}
function Overlay({ title, onClose, variant = "sheet", children }) {
  const ref = useRef(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const oldFocus = document.activeElement;
    const nodes = () => [...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
    nodes()[0]?.focus();
    const key = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const list = nodes();
      if (event.shiftKey && document.activeElement === list[0]) { event.preventDefault(); list.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === list.at(-1)) { event.preventDefault(); list[0]?.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); oldFocus?.focus(); };
  }, []);
  return <div className={`cat-overlay cat-overlay-${variant}`} onClick={onClose}>
    <section className={`cat-dialog cat-dialog-${variant}`} ref={ref} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
      {variant === "sheet" && <><div className="cat-handle" /><header className="cat-sheet-heading"><h2>{title}</h2><IconButton icon="X" label="关闭" onClick={onClose} /></header></>}
      {children}
    </section>
  </div>;
}
function AvatarSheet({ draft, onClose, onSelect, onUpload }) {
  const [chosen, setChosen] = useState(CAT_AVATARS.findIndex(a => a.image === draft.image && JSON.stringify(a.imageCrop) === JSON.stringify(draft.imageCrop)));
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const input = useRef(null), active = useRef(true);
  useEffect(() => () => { active.current = false; }, []);
  async function upload(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setError(""); setBusy(true);
    try { const photo = await readPhoto(file); if (active.current) onUpload(photo); }
    catch (err) { if (active.current) setError(err.message); }
    finally { if (active.current) setBusy(false); }
  }
  return <Overlay title="选择猫咪头像" onClose={onClose}>
    <p className="cat-sheet-subtitle">选一张贴纸，或用它的照片</p>
    <div className="cat-avatar-grid">{CAT_AVATARS.map((cat, i) => <button key={cat.name} aria-label={cat.name} className={chosen === i ? "selected" : ""} aria-pressed={chosen === i} onClick={() => setChosen(i)}><CatFace pet={cat} /><span>{cat.name}</span>{chosen === i && <i><Icon name="Check" size={18} /></i>}</button>)}</div>
    <input ref={input} type="file" accept="image/*" aria-label="选择猫咪照片" className="cat-file-input" onChange={upload} />
    <button className="cat-control cat-upload" onClick={() => input.current.click()} disabled={busy}><Icon name="Camera" /><span>{busy ? "正在读取照片…" : "从相册选择照片"}</span><Icon name="ChevronRight" /></button>
    {error && <p className="cat-error" role="alert">{error}</p>}
    <Action arrow={false} disabled={chosen < 0 || busy} onClick={() => onSelect(CAT_AVATARS[chosen])}>使用这个头像</Action>
  </Overlay>;
}
function BreedSheet({ value, onClose, onSelect }) {
  const [query, setQuery] = useState(""), [chosen, setChosen] = useState(value);
  const visible = CAT_BREEDS.filter(b => b.includes(query.trim()));
  const custom = query.trim() && !CAT_BREEDS.includes(query.trim());
  return <Overlay title="选择猫咪品种" onClose={onClose}>
    <label className="cat-control cat-search"><Icon name="Search" /><input aria-label="搜索猫咪品种" placeholder="搜索品种，或输入名称" value={query} maxLength={40} onChange={e => setQuery(e.target.value)} /></label>
    <p className="cat-list-caption">常见品种</p>
    <div className="cat-breed-list">{[...visible, ...(custom ? [query.trim()] : []), ""].map((breed) => <button key={breed} aria-label={breed || "暂不填写"} aria-pressed={chosen === breed} onClick={() => setChosen(breed)}>
      {breed && breed !== "不确定" ? <CatFace pet={CAT_AVATARS[breed === "布偶猫" ? 0 : breed === "波斯猫" ? 5 : 2]} /> : <Icon name="Cat" size={32} />}
      <span>{breed || "暂不填写"}{custom && breed === query.trim() && <small>使用这个名称</small>}</span>
      <i className={chosen === breed ? "checked" : ""}>{chosen === breed && <Icon name="Check" size={17} />}</i>
    </button>)}</div>
    <Action arrow={false} onClick={() => onSelect(chosen)}>确定</Action>
  </Overlay>;
}
function Wheel({ label, values, value, onChange }) {
  const ref = useRef(null), timer = useRef(null), latest = useRef({ values, value, onChange });
  latest.current = { values, value, onChange };
  useLayoutEffect(() => { ref.current.scrollTop = Math.max(0, values.indexOf(value)) * 44; }, [value, values.length]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const move = (index) => { const { values, onChange } = latest.current; onChange(values[Math.max(0, Math.min(values.length - 1, index))]); };
  return <div className="cat-wheel-column"><span>{label}</span><div className="cat-wheel" ref={ref} tabIndex={0} role="listbox" aria-label={label} aria-activedescendant={`wheel-${label}-${value}`}
    onKeyDown={e => { if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) { e.preventDefault(); move(e.key === "Home" ? 0 : e.key === "End" ? values.length - 1 : values.indexOf(value) + (e.key === "ArrowDown" ? 1 : -1)); } }}
    onScroll={() => { clearTimeout(timer.current); timer.current = setTimeout(() => { const index = Math.round(ref.current.scrollTop / 44); if (latest.current.values[index] !== latest.current.value) move(index); }, 140); }}>
    {values.map(n => <button tabIndex={-1} role="option" id={`wheel-${label}-${n}`} aria-selected={n === value} key={n} onClick={() => onChange(n)}>{n}</button>)}
  </div></div>;
}
function DateSheet({ field, value, birthday, onClose, onSelect }) {
  const [parts, setParts] = useState((value || TODAY).split("-").map(Number));
  const [year, month, day] = parts, [error, setError] = useState("");
  const today = TODAY.split("-").map(Number), years = Array.from({ length: 101 }, (_, i) => today[0] - 100 + i);
  const months = Array.from({ length: year === today[0] ? today[1] : 12 }, (_, i) => i + 1);
  const maxDay = Math.min(new Date(year, month, 0).getDate(), year === today[0] && month === today[1] ? today[2] : 31);
  function change(index, n) {
    const next = [...parts]; next[index] = n;
    next[1] = Math.min(next[1], next[0] === today[0] ? today[1] : 12);
    next[2] = Math.min(next[2], new Date(next[0], next[1], 0).getDate(), next[0] === today[0] && next[1] === today[1] ? today[2] : 31);
    setParts(next); setError("");
  }
  function confirm() {
    const date = parts.map((n, i) => i ? String(n).padStart(2, "0") : n).join("-");
    if (!validPastDate(date)) return setError("请选择不晚于今天的有效日期");
    if (field === "homeDate" && birthday && date < birthday) return setError("到家日不能早于生日");
    onSelect(date);
  }
  return <Overlay title={field === "birthday" ? "选择生日" : "选择到家日"} onClose={onClose}>
    <div className="cat-date-actions"><button onClick={onClose}>取消</button><button onClick={confirm}>确定</button></div>
    <div className="cat-wheels"><Wheel label="年" values={years} value={year} onChange={n => change(0, n)} /><Wheel label="月" values={months} value={month} onChange={n => change(1, n)} /><Wheel label="日" values={Array.from({ length: maxDay }, (_, i) => i + 1)} value={day} onChange={n => change(2, n)} /></div>
    {error && <p className="cat-error" role="alert">{error}</p>}
    <button className="cat-skip" onClick={() => onSelect("")}>暂不填写</button>
  </Overlay>;
}
function PhotoCrop({ source, onCancel, onDone }) {
  const [dimensions, setDimensions] = useState(null), [zoom, setZoom] = useState(1), [rotation, setRotation] = useState(0), [offset, setOffset] = useState({ x: 0, y: 0 }), [error, setError] = useState("");
  const image = useRef(null), box = useRef(null), drag = useRef(null);
  const geometry = dimensions ? cropGeometry(dimensions.width, dimensions.height, rotation, zoom, offset) : null;
  function complete() {
    if (!geometry) return;
    try {
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 480;
      const c = canvas.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, 480, 480);
      c.translate(240 + geometry.x * 480, 240 + geometry.y * 480); c.rotate(rotation * Math.PI / 180); c.scale(geometry.scale * 480, geometry.scale * 480);
      c.drawImage(image.current, -dimensions.width / 2, -dimensions.height / 2);
      onDone(canvas.toDataURL("image/jpeg", .88));
    } catch { setError("照片处理失败，请重试或重新选择照片"); }
  }
  return <Overlay title="调整猫咪头像" variant="full" onClose={onCancel}>
    <header className="cat-crop-header"><button onClick={onCancel}>取消</button><h2>调整猫咪头像</h2><button disabled={!geometry} onClick={complete}>完成</button></header>
    <p className="cat-crop-hint">拖动照片，让小脸居中</p>
    <div className="cat-crop-box" ref={box} tabIndex={0} role="img" aria-label="照片裁剪区域，可拖动照片或用方向键调整位置"
      onKeyDown={e => { const delta = { ArrowLeft: [-.02, 0], ArrowRight: [.02, 0], ArrowUp: [0, -.02], ArrowDown: [0, .02] }[e.key]; if (delta && geometry) { e.preventDefault(); setOffset({ x: geometry.x + delta[0], y: geometry.y + delta[1] }); } }}
      onPointerDown={e => { if (!geometry) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: geometry.x, oy: geometry.y }; }}
      onPointerMove={e => { if (!drag.current) return; const size = box.current.clientWidth; setOffset({ x: drag.current.ox + (e.clientX - drag.current.x) / size, y: drag.current.oy + (e.clientY - drag.current.y) / size }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <img ref={image} draggable={false} src={source} alt="待裁剪的猫咪照片" onLoad={e => setDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} onError={() => setError("图片加载失败，请重新选择照片")}
        style={geometry ? { width: `${dimensions.width * geometry.scale * 100}%`, height: `${dimensions.height * geometry.scale * 100}%`, left: `${50 + geometry.x * 100}%`, top: `${50 + geometry.y * 100}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` } : { visibility: "hidden" }} />
      <div className="cat-crop-mask"><i /><i /><i /><i /></div>
    </div>
    <div className="cat-crop-tools"><div className="cat-zoom"><IconButton icon="Minus" label="缩小" onClick={() => setZoom(v => Math.max(1, v - .1))} /><input aria-label="照片缩放" type="range" min="1" max="3" step=".01" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><IconButton icon="Plus" label="放大" onClick={() => setZoom(v => Math.min(3, v + .1))} /></div>
      <div className="cat-rotate"><button onClick={() => { setRotation(v => (v + 90) % 360); setOffset({ x: 0, y: 0 }); }}><RotateCw /><span>旋转</span></button><button onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}><RotateCcw /><span>重置</span></button></div>
      {error && <p className="cat-error" role="alert">{error}</p>}<p className="cat-muted">仅用于猫咪头像</p>
    </div>
  </Overlay>;
}
function Choices({ label, values, value, onChange, columns = 3 }) {
  return <fieldset className="cat-fieldset"><legend>{label}<span> · 选填</span></legend><div className="cat-choices" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{values.map(item => <button type="button" aria-pressed={value === item} className={value === item ? "selected" : ""} key={item} onClick={() => onChange(value === item ? "" : item)}>{item}{columns === 2 && value === item && <Icon name="CircleCheck" size={18} />}</button>)}</div></fieldset>;
}
export default function CatOnboarding({ welcome = false, onSave, onFinish, onExit }) {
  const [step, setStep] = useState(welcome ? 0 : 1), [draft, setDraft] = useState(newCatDraft), [errors, setErrors] = useState({}), [overlay, setOverlay] = useState(null), [crop, setCrop] = useState(null), [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [hasSaved, setHasSaved] = useState(false);
  const scroll = useRef(null), name = useRef(null), lock = useRef(false);
  useEffect(() => { ["avatars", "dates", "health"].forEach(kind => { const image = new Image(); image.src = `/assets/onboarding/${kind}.png`; }); }, []);
  const modal = !!overlay || !!crop;
  const update = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setErrors(old => ({ ...old, [key]: "" })); };
  useLayoutEffect(() => { scroll.current?.scrollTo(0, 0); scroll.current?.querySelector("h1")?.focus({ preventScroll: true }); }, [step]);
  useEffect(() => {
    if (step < 1 || step > 4) return;
    const prevent = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [step]);
  function next(skip = false) {
    const candidate = skip ? { ...draft, ...(step === 2 ? { birthday: "", homeDate: "" } : { weight: "", sterilized: "" }) } : draft;
    const all = catErrors(candidate), fields = step === 1 ? ["name"] : step === 2 ? ["birthday", "homeDate"] : ["weight"];
    const found = Object.fromEntries(Object.entries(all).filter(([key]) => fields.includes(key)));
    setErrors(found);
    if (Object.keys(found).length) { if (found.name) name.current?.focus(); return; }
    setDraft(candidate); setStep(editing ? 4 : step + 1); setEditing(false);
  }
  function edit(target) { setEditing(true); setStep(target); }
  function back() { if (editing) { setEditing(false); setStep(4); } else if (step > 1) setStep(step - 1); else setOverlay("exit"); }
  function reset() { setDraft(newCatDraft()); setErrors({}); setEditing(false); setStep(1); }
  async function save() {
    if (lock.current) return;
    const found = catErrors(draft);
    if (Object.keys(found).length) { setErrors(found); setStep(found.name ? 1 : found.birthday || found.homeDate ? 2 : 3); return; }
    lock.current = true; setBusy(true);
    try { if (await onSave(draft)) { setHasSaved(true); setOverlay(null); setStep(5); } else setOverlay("failure"); }
    catch { setOverlay("failure"); }
    finally { lock.current = false; setBusy(false); }
  }
  function discard() { setOverlay(null); setDraft(newCatDraft()); setErrors({}); setEditing(false); if (welcome && !hasSaved) setStep(0); else onExit(); }
  const headings = { 1: ["它叫什么名字？", "先认识一下你家的小可爱"], 2: ["记住特别的日子", "不记得具体日期，也没关系"], 3: ["多了解它一点", "这些资料，都可以以后再补充"], 4: ["看看有没有漏掉的", "创建后也可以随时修改"] };
  return <div className="cat-onboarding">
    <div className="cat-flow-scroll" ref={scroll} inert={modal ? true : undefined}>
      {step === 0 || step === 5 ? <div className="cat-landing">
        <header className="cat-brand"><Icon name="PawPrint" size={29} /><strong>喵日记</strong></header>
        <div className="cat-landing-art">{step === 0 ? <Art kind="welcome" /> : <div className="cat-success-art"><div className="cat-paper"><b>猫咪档案</b><i><Icon name="Check" size={52} /></i><strong>{draft.name}</strong><span /><span /></div>{draft.photo || draft.imageCrop ? <CatFace pet={draft} /> : <PetArt pet={draft} />}<Icon name="Heart" className="cat-confetti-heart" size={42} /><Icon name="Sparkles" className="cat-confetti-star" size={40} /></div>}</div>
        <div className="cat-landing-copy"><h1 tabIndex={-1}>{step === 0 ? "先认识一下你家猫咪" : `${draft.name}的档案建好啦`}</h1><p>{step === 0 ? <>建立猫咪的专属档案<br />从今天开始，记录你们的故事</> : <>从今天开始<br />一起收藏每一个猫咪日常</>}</p></div>
        <footer className="cat-landing-footer">{step === 0 && <p>只需一个名字，就能开始</p>}<Action onClick={step === 0 ? () => setStep(1) : onFinish}>{step === 0 ? "建立猫咪档案" : "进入喵日记"}</Action>{step === 5 && <button className="cat-skip" onClick={reset}>继续添加猫咪</button>}</footer>
      </div> : <div className={`cat-wizard cat-step-${step}`}>
        <header className="cat-topbar"><IconButton icon="ChevronLeft" label="返回" onClick={back} /><h2>{step === 4 ? "确认猫咪档案" : "建立猫咪档案"}</h2><button type="button" className="cat-topbar-skip" onClick={() => setOverlay("exit")}>跳过</button></header>
        {step < 4 && <ol className="cat-steps" aria-label="建档进度">{["基本资料", "纪念日", "健康资料"].map((label, i) => <li key={label} className={step === i + 1 ? "active" : step > i + 1 ? "complete" : ""} aria-current={step === i + 1 ? "step" : undefined}><span>{step > i + 1 ? <Icon name="Check" size={17} /> : i + 1}</span><b>{label}</b></li>)}</ol>}
        <div className="cat-wizard-body"><div className="cat-intro"><h1 tabIndex={-1}>{headings[step][0]}</h1><p>{headings[step][1]}</p>
          {step === 1 && <button className="cat-change-avatar" aria-label="更换头像" onClick={() => setOverlay("avatar")}><CatFace pet={draft} /><i><Icon name="Camera" size={22} /></i><span>更换头像</span></button>}
          {(step === 2 || step === 3) && <Art kind={step === 2 ? "dates" : "health"} />}
          {step === 4 && <div className="cat-review-card"><CatFace pet={draft} /><div><strong>{draft.name}</strong><p>{[draft.breed, draft.gender].filter(Boolean).join(" · ") || "猫咪资料，慢慢补充"}</p></div><button aria-label="修改基本资料" onClick={() => edit(1)}><Pencil size={16} />修改</button></div>}
        </div>
        <form className="cat-fields" noValidate onSubmit={e => { e.preventDefault(); step === 4 ? save() : next(); }}>
          {step === 1 && <>
            <label className="cat-field" htmlFor="cat-name"><span>猫咪名字 <em>*</em></span><div className={`cat-control ${errors.name ? "invalid" : ""}`}><input id="cat-name" ref={name} aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? "cat-name-error" : undefined} autoComplete="off" maxLength={20} value={draft.name} onChange={e => update("name", e.target.value)} placeholder="怎么称呼这位小可爱？" /><small>{draft.name.length} / 20</small></div></label>
            {errors.name && <p id="cat-name-error" className="cat-error" role="alert"><CircleAlert size={16} />{errors.name}</p>}
            <div className="cat-field"><span>品种 <small>· 选填</small></span><button type="button" className="cat-control" aria-label="选择猫咪品种" onClick={() => setOverlay("breed")}><span className={!draft.breed ? "cat-muted" : ""}>{draft.breed || "选择或填写品种"}</span><Icon name="ChevronRight" size={20} /></button></div>
            <Choices label="性别" values={["男孩", "女孩", "不确定"]} value={draft.gender} onChange={v => update("gender", v)} />
            <p className="cat-helper">照片、品种和性别都可稍后补充</p>
          </>}
          {step === 2 && <>{[["birthday", "生日", "CalendarDays", "它来到世界的那一天"], ["homeDate", "到家日", "House", "你们开始一起生活的日子"]].map(([key, label, icon, help]) => <div className="cat-field" key={key}><span>{label} <small>· 选填</small></span><button type="button" className={`cat-control cat-date-row ${errors[key] ? "invalid" : ""}`} aria-label={`选择${label}`} onClick={() => setOverlay(key)}><Icon name={icon} size={30} /><span><strong>{draft[key] ? fullDate(draft[key]) : `选择${label}`}</strong><small>{help}</small></span><Icon name="ChevronRight" size={20} /></button>{errors[key] && <p className="cat-error" role="alert">{errors[key]}</p>}</div>)}</>}
          {step === 3 && <><Choices label="绝育状态" values={["未绝育", "已绝育", "计划中", "不确定"]} columns={2} value={draft.sterilized} onChange={v => update("sterilized", v)} />
            <label className="cat-field cat-weight" htmlFor="cat-weight"><span>当前体重 <small>· 选填</small></span><div className={`cat-control ${errors.weight ? "invalid" : ""}`}><StickerIcon name="Scale" size={36} /><input id="cat-weight" type="number" inputMode="decimal" min="0.01" step="any" aria-invalid={!!errors.weight} aria-describedby={errors.weight ? "cat-weight-error" : undefined} placeholder="填写体重" value={draft.weight} onChange={e => update("weight", e.target.value)} /><span>kg</span></div></label>
            {errors.weight && <p id="cat-weight-error" className="cat-error" role="alert">{errors.weight}</p>}<p className="cat-helper">记录第一笔体重，之后方便对比</p></>}
          {step === 4 && <><div className="cat-review-rows">{[["生日", fullDate(draft.birthday), 2], ["到家日", fullDate(draft.homeDate), 2], ["绝育状态", draft.sterilized || "暂未填写", 3], ["当前体重", draft.weight ? `${draft.weight} kg` : "暂未填写", 3]].map(([label, value, target]) => <button type="button" className="cat-control" key={label} aria-label={`修改${label}`} onClick={() => edit(target)}><span><small>{label}</small><strong>{value}</strong></span><Icon name="ChevronRight" size={20} /></button>)}</div><p className="cat-helper">{draft.weight ? "体重将保存为第一笔体重记录" : "没有填写的资料，可以以后慢慢补充"}</p></>}
          <footer className="cat-form-footer">{(step === 2 || step === 3) && <button type="button" className="cat-skip" onClick={() => next(true)}>暂不填写，稍后完善</button>}<Action type="submit" disabled={busy} arrow={step !== 4}>{step === 4 ? <><Icon name="CircleCheck" size={23} /> {busy ? "正在保存…" : "创建档案"}</> : editing ? "返回确认" : step === 3 ? "预览档案" : "下一步"}</Action></footer>
        </form></div>
      </div>}
    </div>
    {overlay === "avatar" && <AvatarSheet draft={draft} onClose={() => setOverlay(null)} onSelect={cat => { setDraft(old => ({ ...old, image: cat.image, imageCrop: cat.imageCrop, photo: "" })); setOverlay(null); }} onUpload={source => { setOverlay(null); setCrop(source); }} />}
    {overlay === "breed" && <BreedSheet value={draft.breed} onClose={() => setOverlay(null)} onSelect={value => { update("breed", value); setOverlay(null); }} />}
    {["birthday", "homeDate"].includes(overlay) && <DateSheet field={overlay} value={draft[overlay]} birthday={draft.birthday} onClose={() => setOverlay(null)} onSelect={value => { update(overlay, value); setOverlay(null); }} />}
    {crop && <PhotoCrop source={crop} onCancel={() => { setCrop(null); setOverlay("avatar"); }} onDone={photo => { update("photo", photo); setCrop(null); }} />}
    {overlay === "exit" && <Overlay title="暂时离开建档？" variant="alert" onClose={() => setOverlay(null)}><StickerIcon name="NotebookPen" size={84} /><h2>暂时离开建档？</h2><p>离开后，未保存的资料将丢失。</p><Action arrow={false} onClick={() => setOverlay(null)}>继续填写</Action><button className="cat-control cat-discard" onClick={discard}>放弃建档</button></Overlay>}
    {overlay === "failure" && <Overlay title="暂时没能保存" variant="alert" onClose={() => !busy && setOverlay(null)}><div className="cat-save-error"><Icon name="FileDown" size={60} /><CircleAlert size={36} /></div><h2>暂时没能保存</h2><p>填写的资料还在<br />请重试，或返回检查资料</p><Action arrow={false} disabled={busy} onClick={save}>{busy ? "正在保存…" : "重新保存"}</Action><button className="cat-control" disabled={busy} onClick={() => setOverlay(null)}>返回检查</button></Overlay>}
  </div>;
}
