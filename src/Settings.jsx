import React, { useState } from "react";
import {
  Icon,
  Avatar,
  PetArt,
  Primary,
  Topbar,
  SectionTitle,
  Row,
  Field,
  Chips,
} from "./ui";
import {
  TODAY,
  groupLabels,
  dateLabel,
  ageLabel,
  togetherDays,
  downloadFile,
  makeCSV,
  summary,
  petImage,
  reminderRepeatLabel,
} from "./data";

export function Me({ a }) {
  return (
    <div className="page-content root-page me-page">
      <header className="page-heading">
        <h1>我的</h1>
        <span className="little-flower">
          <Icon name="Flower2" size={26} />
        </span>
      </header>
      <button
        className="profile-card"
        onClick={() => a.go({ name: "pet", id: a.currentPet.id })}
      >
        <Avatar pet={a.currentPet} size={61} />
        <div>
          <h2>{a.currentPet.name}的日常</h2>
          <p>陪伴的第 {togetherDays(a.currentPet.homeDate)} 天</p>
        </div>
        <Icon name="ChevronRight" size={18} />
      </button>
      <SectionTitle>常用功能</SectionTitle>
      <div className="card settings-group">
        <Row
          icon="Bell"
          label="提醒与待办"
          value={`${a.data.reminders.filter((r) => !r.done).length} 件`}
          onClick={() => a.go({ name: "reminders" })}
        />
        <Row
          icon="FileDown"
          label="可读资料导出"
          tone="yellow"
          onClick={() => a.go({ name: "export" })}
        />
      </div>
      <SectionTitle>外观与使用</SectionTitle>
      <div className="card settings-group">
        <Row
          icon="Sun"
          label="外观模式"
          value={
            { system: "跟随系统", light: "浅色", dark: "深色" }[
              a.data.settings.theme
            ]
          }
          onClick={() => a.go({ name: "display" })}
        />
        <Row
          icon="Type"
          label="文字与显示"
          tone="purple"
          value="跟随系统"
          onClick={() => a.go({ name: "display" })}
        />
        <Row
          icon="Wind"
          label="减少动态效果"
          tone="sage"
          value="跟随系统"
          onClick={() => a.go({ name: "display" })}
        />
        <Row
          icon="BellRing"
          label="通知与提醒"
          onClick={() => a.go({ name: "notifications" })}
        />
      </div>
      <SectionTitle>数据与隐私</SectionTitle>
      <div className="card settings-group">
        <Row
          icon="Database"
          label="本地数据管理"
          tone="blue"
          onClick={() => a.go({ name: "storage" })}
        />
        <Row
          icon="Shield"
          label="隐私与权限"
          tone="purple"
          onClick={() => a.go({ name: "privacy" })}
        />
      </div>
      <SectionTitle>帮助与关于</SectionTitle>
      <div className="card settings-group">
        <Row
          icon="MessageCircleQuestion"
          label="使用帮助"
          tone="sage"
          onClick={() => a.go({ name: "help" })}
        />
        <Row
          icon="Info"
          label="关于喵日记"
          tone="yellow"
          onClick={() => a.go({ name: "about" })}
        />
      </div>
      <div className="page-signature">
        <Icon name="PawPrint" size={15} />
        喵日记 · Meow Diary
      </div>
    </div>
  );
}
export function Display({ a }) {
  return (
    <>
      <Topbar title="外观与显示" onBack={a.back} />
      <div className="page-content settings-page">
        <SectionTitle>外观模式</SectionTitle>
        <div className="theme-picker">
          {[
            ["system", "Monitor", "跟随系统"],
            ["light", "Sun", "浅色"],
            ["dark", "Moon", "深色"],
          ].map(([id, icon, label]) => (
            <button
              className={a.data.settings.theme === id ? "selected" : ""}
              aria-pressed={a.data.settings.theme === id}
              key={id}
              onClick={() => a.setSettings({ theme: id })}
            >
              <span className={`theme-swatch ${id}`}>
                <i />
                <i />
                <i />
              </span>
              <span>
                <Icon name={icon} size={16} />
                {label}
              </span>
              {a.data.settings.theme === id && (
                <Icon name="CircleCheck" size={18} className="theme-check" />
              )}
            </button>
          ))}
        </div>
        <SectionTitle>显示与阅读</SectionTitle>
        <div className="card info-rows">
          <div>
            <Icon name="Type" size={20} />
            <span>文字缩放</span>
            <small>跟随浏览器</small>
          </div>
          <div>
            <Icon name="Wind" size={20} />
            <span>减少动态效果</span>
            <small>跟随系统</small>
          </div>
        </div>
        <p className="small-note">
          使用浏览器的缩放功能调整文字大小。动态效果尊重系统的“减少动态效果”设置。
        </p>
        <SectionTitle>预览</SectionTitle>
        <div className="card preview-card">
          <div className="pet-inline">
            <Avatar pet={a.currentPet} />
            <h3>和{a.currentPet.name}一起记录生活</h3>
          </div>
          <p>阳光落在窗边，小日子慢慢过。</p>
          <span className="muted">今天 · 温暖的陪伴</span>
        </div>
      </div>
    </>
  );
}
export function Notifications({ a }) {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  async function request() {
    if (!("Notification" in window)) {
      a.toast("当前浏览器不支持系统通知，待办仍可正常使用");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      a.setSettings({ notifications: p === "granted" });
      if (p === "denied") a.toast("可在浏览器的站点设置中修改通知权限");
    } catch {
      a.toast("无法获取通知权限，请检查浏览器设置");
    }
  }
  return (
    <>
      <Topbar title="通知与提醒" onBack={a.back} />
      <div className="page-content settings-page">
        <SectionTitle>浏览器通知</SectionTitle>
        <div className="card settings-group">
          <Row
            icon="Bell"
            label="通知权限"
            value={
              {
                granted: "已允许",
                denied: "已关闭",
                default: "未授权",
                unsupported: "不支持",
              }[permission]
            }
            onClick={request}
          />
          {permission === "granted" && (
            <div className="toggle-row">
              <span>页面打开时提醒</span>
              <button
                className={`toggle ${a.data.settings.notifications ? "on" : ""}`}
                role="switch"
                aria-checked={a.data.settings.notifications}
                aria-label="页面打开时提醒"
                onClick={() =>
                  a.setSettings({
                    notifications: !a.data.settings.notifications,
                  })
                }
              >
                <span />
              </button>
            </div>
          )}
        </div>
        <p className="small-note">
          当前为纯前端原型。通知仅在页面打开时触发，关闭页面后不会后台推送。
        </p>
        <SectionTitle>我的提醒</SectionTitle>
        <div className="card settings-group">
          <Row
            icon="ListTodo"
            label="提醒与待办"
            onClick={() => a.go({ name: "reminders" })}
          />
          <Row
            icon="Syringe"
            label="疫苗与驱虫"
            tone="blue"
            onClick={() => a.go({ name: "health", id: a.currentPet.id })}
          />
          <Row
            icon="Plus"
            label="新建提醒"
            tone="sage"
            onClick={() => a.setSheet({ kind: "types", group: "reminder" })}
          />
        </div>
        <div className="card info-card">
          <Icon name="CalendarHeart" size={25} />
          <h3>记得，也要记录</h3>
          <p>
            完成待办只会更新计划状态。实际的喂食、护理和体重，需要单独保存为记录。
          </p>
        </div>
      </div>
    </>
  );
}
export function Storage({ a }) {
  const photos =
    a.data.records.reduce((n, r) => n + (r.photos?.length || 0), 0) +
    a.data.pets.filter((p) => p.photo).length;
  const bytes = new Blob([JSON.stringify(a.data)]).size;
  return (
    <>
      <Topbar title="本地数据管理" onBack={a.back} />
      <div className="page-content settings-page">
        <div className="storage-stat card">
          {[
            [a.data.pets.length, "只宠物"],
            [a.data.records.length, "条记录"],
            [photos, "张照片"],
          ].map(([num, label]) => (
            <div key={label}>
              <strong>{num}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <SectionTitle>资料与存储</SectionTitle>
        <div className="card settings-group">
          <Row
            icon="FileDown"
            label="可读资料导出"
            tone="yellow"
            onClick={() => a.go({ name: "export" })}
          />
          <div className="storage-usage">
            <Icon name="HardDrive" size={20} />
            <span>浏览器中的资料</span>
            <strong>{(bytes / 1024).toFixed(1)} KB</strong>
          </div>
        </div>
        <div className="card info-card">
          <Icon name="LockKeyhole" size={24} />
          <h3>小日常，留在这里</h3>
          <p>
            资料保存在当前浏览器。图片上传后会压缩保存在本地；内置示例素材不计入浏览器存储空间。
          </p>
          <p>
            清除网站数据或更换浏览器会失去本地资料。CSV
            导出为可读资料，不包含原始照片，也不能用于完整恢复。
          </p>
        </div>
        <SectionTitle>权限与隐私</SectionTitle>
        <div className="card settings-group">
          <Row
            icon="Image"
            label="照片与文件"
            value="手动选择"
            onClick={() => a.go({ name: "privacy" })}
          />
          <Row
            icon="Shield"
            label="数据说明"
            tone="sage"
            onClick={() => a.go({ name: "privacy" })}
          />
        </div>
      </div>
    </>
  );
}
export function Export({ a }) {
  const [petIds, setPetIds] = useState(a.data.pets.map((p) => p.id)),
    [groups, setGroups] = useState(["profile", ...Object.keys(groupLabels)]),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const toggle = (list, set, id) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const inside = (r) =>
    petIds.includes(r.petId) &&
    (!from || r.date.slice(0, 10) >= from) &&
    (!to || r.date.slice(0, 10) <= to);
  const records = a.data.records.filter(
      (r) => inside(r) && groups.includes(r.group),
    ),
    reminders = groups.includes("reminder")
      ? a.data.reminders.filter(inside)
      : [];
  function exportNow() {
    const rows = [
      [
        "宠物",
        "类别",
        "类型",
        "日期",
        "标题/项目",
        "数值",
        "单位",
        "备注",
        "状态",
        "重复",
        "有效期",
        "存放位置",
      ],
    ];
    if (groups.includes("profile"))
      a.data.pets
        .filter((p) => petIds.includes(p.id))
        .forEach((p) =>
          rows.push([
            p.name,
            "宠物资料",
            p.species,
            p.birthday,
            p.breed,
            "",
            "",
            "性别：" +
              p.gender +
              "；到家日：" +
              p.homeDate +
              "；" +
              p.sterilized,
          ]),
        );
    records.forEach((r) =>
      rows.push([
        a.data.pets.find((p) => p.id === r.petId)?.name,
        groupLabels[r.group],
        r.type,
        r.date,
        r.title || r.food || r.itemName || "",
        r.group === "weight"
          ? r.weight
          : r.group === "expense"
            ? r.amount
            : ["food", "stock"].includes(r.group)
              ? r.quantity
              : "",
        r.group === "expense" ? "元" : r.unit || "",
        r.note || "",
        "",
        "",
        r.expiry || "",
        r.location || "",
      ]),
    );
    reminders.forEach((r) =>
      rows.push([
        a.data.pets.find((p) => p.id === r.petId)?.name,
        "提醒",
        r.type,
        r.date,
        "",
        "",
        "",
        r.note || "",
        r.done ? "已完成" : "待办",
        reminderRepeatLabel(r),
      ]),
    );
    downloadFile(
      makeCSV(rows),
      `喵日记-${TODAY}.csv`,
      "text/csv;charset=utf-8;",
    );
    a.toast(`已导出 ${rows.length - 1} 项资料`);
  }
  return (
    <>
      <Topbar title="可读资料导出" onBack={a.back} />
      <div className="page-content export-page">
        <div className="export-hero">
          <span className="type-icon stock">
            <Icon name="FileDown" size={30} />
          </span>
          <h2>收藏陪伴的点滴</h2>
        </div>
        <SectionTitle>宠物</SectionTitle>
        <div className="export-pets">
          {a.data.pets.map((p) => (
            <button
              key={p.id}
              className={petIds.includes(p.id) ? "selected" : ""}
              aria-pressed={petIds.includes(p.id)}
              onClick={() => toggle(petIds, setPetIds, p.id)}
            >
              <Avatar pet={p} size={38} />
              {p.name}
              <Icon
                name={petIds.includes(p.id) ? "CircleCheck" : "Circle"}
                size={18}
              />
            </button>
          ))}
        </div>
        <SectionTitle>导出内容</SectionTitle>
        <div className="card export-options">
          {[["profile", "基本资料"], ...Object.entries(groupLabels)].map(
            ([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={groups.includes(id)}
                  onChange={() => toggle(groups, setGroups, id)}
                />
                <span>{label}</span>
                <Icon
                  name={groups.includes(id) ? "CircleCheck" : "Circle"}
                  size={20}
                />
              </label>
            ),
          )}
        </div>
        <SectionTitle>日期范围</SectionTitle>
        <div className="date-range">
          <input
            type="date"
            aria-label="导出开始日期"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>—</span>
          <input
            type="date"
            aria-label="导出结束日期"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <p className="small-note">
          CSV 文件 · 不选日期则导出全部 · 不含照片原件
        </p>
        <Primary
          disabled={
            !petIds.length || !groups.length || (from && to && from > to)
          }
          onClick={exportNow}
        >
          <Icon name="Download" size={19} />
          导出所选资料
        </Primary>
      </div>
    </>
  );
}
export function Share({ a, pet, record }) {
  const [theme, setTheme] = useState("cream"),
    [busy, setBusy] = useState(false);
  const palettes = {
    cream: ["#ffffff", "#ffe59d"],
    sage: ["#ffffff", "#b5cd9f"],
    rose: ["#ffffff", "#f2b5a9"],
  };
  async function save() {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1200;
      const c = canvas.getContext("2d");
      c.fillStyle = palettes[theme][0];
      c.fillRect(0, 0, 900, 1200);
      c.strokeStyle = "#e6e6df";
      c.lineWidth = 3;
      c.strokeRect(20, 20, 860, 1160);
      c.save();
      c.translate(450, 30);
      c.rotate(-.06);
      c.fillStyle = palettes[theme][1];
      c.fillRect(-95, -20, 190, 40);
      c.restore();
      c.fillStyle = "#30302e";
      c.font = 'bold 74px "Microsoft YaHei", sans-serif';
      c.fillText(pet.name, 70, 145);
      c.fillStyle = "#858580";
      c.font = '27px "Microsoft YaHei", sans-serif';
      c.fillText(`${pet.breed} · ${ageLabel(pet.birthday)}`, 74, 200);
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = petImage(pet);
      });
      const ratio = Math.min(700 / img.width, 650 / img.height);
      const bodyScale =
        pet.body === "slim" ? 0.9 : pet.body === "round" ? 1.1 : 1;
      c.filter =
        pet.tone === "warm"
          ? "sepia(0.24) saturate(1.2)"
          : pet.tone === "silver"
            ? "grayscale(0.85)"
            : "none";
      const sticker = document.createElement("canvas");
      sticker.width = 800;
      sticker.height = 700;
      const sc = sticker.getContext("2d");
      const w = img.width * ratio * bodyScale, h = img.height * ratio;
      const left = (800 - w) / 2;
      sc.drawImage(img, left, 20, w, h);
      sc.globalCompositeOperation = "source-in";
      sc.fillStyle = "white";
      sc.fillRect(0, 0, 800, 700);
      c.save();
      c.filter = "none";
      c.shadowColor = "#30302e20";
      c.shadowBlur = 8;
      c.shadowOffsetY = 4;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8)
        c.drawImage(sticker, 50 + Math.cos(angle) * 9, 230 + Math.sin(angle) * 9);
      c.restore();
      c.drawImage(img, (900 - w) / 2, 250, w, h);
      c.filter = "none";
      c.fillStyle = "#30302e";
      c.textAlign = "center";
      c.font = '36px "Microsoft YaHei", sans-serif';
      c.fillText(
        record
          ? (record.title || record.type).slice(0, 18)
          : `一起的第 ${togetherDays(pet.homeDate)} 天`,
        450,
        990,
      );
      c.fillStyle = "#858580";
      c.font = '23px "Microsoft YaHei", sans-serif';
      c.fillText("把陪伴，写进每一天。", 450, 1050);
      c.font = '20px "Microsoft YaHei", sans-serif';
      c.fillText("MEOW DIARY · 喵日记", 450, 1140);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("Image export failed");
      downloadFile(blob, `${pet.name}-分享卡片.png`, "image/png");
      a.toast("分享卡片已保存");
    } catch {
      a.toast("图片暂时无法生成，请重试");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Topbar title="分享这份可爱" onBack={a.back} />
      <div className="page-content share-page">
        <div className={`share-card ${theme}`}>
          <div className="share-heading">
            <h1>
              {pet.name}
              <Icon name="PawPrint" size={25} />
            </h1>
            <p>
              {pet.breed} · {ageLabel(pet.birthday)}
            </p>
          </div>
          <span className="share-heart">
            <Icon name="Heart" size={29} />
          </span>
          <PetArt pet={pet} />
          <div className="share-caption">
            <h2>
              {record
                ? record.title || record.type
                : `一起的第 ${togetherDays(pet.homeDate)} 天`}
            </h2>
            <p>把陪伴，写进每一天。</p>
          </div>
          <span className="share-logo">MEOW DIARY · 喵日记</span>
        </div>
        <div className="share-themes">
          {[
            ["cream", "奶黄"],
            ["sage", "鼠尾草"],
            ["rose", "浅桃"],
          ].map(([id, label]) => (
            <button
              className={`${id} ${theme === id ? "selected" : ""}`}
              key={id}
              onClick={() => setTheme(id)}
              aria-label={label}
              aria-pressed={theme === id}
            >
              {theme === id && <Icon name="Check" size={18} />}
            </button>
          ))}
        </div>
        <Primary onClick={save} disabled={busy}>
          <Icon name="Download" size={20} />
          {busy ? "生成中…" : "保存分享卡片"}
        </Primary>
      </div>
    </>
  );
}
export function Info({ a, name }) {
  const titles = {
    privacy: "隐私与权限",
    help: "使用帮助",
    about: "关于喵日记",
  };
  return (
    <>
      <Topbar title={titles[name]} onBack={a.back} />
      <div className="page-content info-page">
        {name === "about" ? (
          <div className="about-brand">
            <img src="/favicon.svg" alt="喵日记" />
            <h1>喵日记</h1>
            <span>Meow Diary</span>
            <p>把陪伴，写进每一天。</p>
            <div className="version-pill">前端原型 · v1.0.0</div>
            <p className="small-note">
              初始内容为演示资料。
              <br />
              使用 React 构建，资料保存在当前浏览器。
            </p>
          </div>
        ) : name === "privacy" ? (
          <>
            <div className="card info-card">
              <Icon name="ShieldCheck" size={28} />
              <h2>只在你的浏览器里</h2>
              <p>
                宠物资料、记录、提醒及选择的照片只保存在当前浏览器，不发送到服务器，也没有账号或云同步。
              </p>
            </div>
            <div className="card info-card">
              <h3>照片访问</h3>
              <p>仅访问你通过文件选择器主动选中的照片，不读取其他相册内容。</p>
              <h3>通知权限</h3>
              <p>由浏览器管理。关闭通知不会删除计划，也不会自动完成待办。</p>
              <h3>保存与导出</h3>
              <p>
                清除浏览器数据会移除所有本地记录。可在“可读资料导出”中保存
                CSV；该文件不包含原始媒体，不是可恢复备份。
              </p>
            </div>
          </>
        ) : (
          <div className="help-list">
            {[
              [
                "怎么记录？",
                "点击底部中央的＋，选择记事、提醒、记账、体征或囤货类型。也可以从首页直接写日记、记喂食和体重。填写后点击保存。",
              ],
              [
                "怎么查看不同宠物的记录？",
                "在时光中点击宠物范围或筛选按钮，可以选择一只或多只宠物。时间线与照片墙共享筛选条件。",
              ],
              [
                "待办完成后会产生记录吗？",
                "不会。待办表示计划，记录表示已经发生的事实。完成周期待办会生成下一次计划，实际护理仍需要单独记录。",
              ],
              [
                "数据在哪里？",
                "数据仅保存在当前浏览器的本地存储中。关闭页面再打开仍可继续；清除浏览器数据会删除资料。",
              ],
              [
                "如何导出或分享？",
                "在“我的 → 可读资料导出”选择宠物、类型和日期导出 CSV。在宠物档案或记录详情中可以生成并保存 PNG 分享卡片。",
              ],
            ].map(([q, answer]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Icon name="ChevronDown" size={17} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
