import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { loadData, groupLabels, defaultFilters, toggleReminder, uid } from "./data";
import { Icon, Empty, StickerFilters } from "./ui";
import { Home, Timeline, Pets } from "./HomeTimeline";
import {
  PetDetail,
  Weight,
  Reminders,
  Health,
  RecordDetail,
  PetAppearance,
} from "./Details";
import {
  Me,
  Display,
  Notifications,
  Storage,
  Export,
  Share,
  Info,
} from "./Settings";
import { RecordForm, PetForm } from "./Forms";
import { AppSheets } from "./Sheets";
import { Stock, Ledger } from "./Household";
import { saveManagedRecord } from "./careData";
import CatOnboarding from "./CatOnboarding";
import { addCatProfile } from "./catProfile";

export default function App() {
  const [data, setData] = useState(loadData),
    [tab, setTab] = useState("home"),
    [stack, setStack] = useState([]),
    [sheet, setSheet] = useState(null),
    [message, setMessage] = useState("");
  const [onboarding, setOnboarding] = useState(() => !data.pets.length || new URLSearchParams(location.search).has("onboarding") ? { welcome: true } : null);
  const [filters, setFilters] = useState(defaultFilters),
    [timelineMode, setTimelineMode] = useState("list"),
    [timelineSearch, setTimelineSearch] = useState(""),
    [showSearch, setShowSearch] = useState(false),
    [petSearch, setPetSearch] = useState("");
  const scroll = useRef(null),
    positions = useRef({}),
    toastTimer = useRef(null),
    notificationSent = useRef(new Set());
  const page = stack.at(-1),
    hasTabs = !page || ["pet", "share", "export", "reminders"].includes(page.name),
    currentPet =
      data.pets.find((p) => p.id === data.currentPetId) || data.pets[0],
    pageKey = page
      ? `${page.name}:${page.id || page.editId || ""}:${stack.length}`
      : tab;
  const toast = (text) => {
    clearTimeout(toastTimer.current);
    setMessage(text);
    toastTimer.current = setTimeout(() => setMessage(""), 3200);
  };
  function commit(next, { silent = false } = {}) {
    try {
      localStorage.setItem("meow-diary-v1", JSON.stringify(next));
      setData(next);
      return true;
    } catch {
      if (!silent) toast("本地空间不足或不可用，请减少照片后重试；填写内容已保留");
      return false;
    }
  }
  const remember = () => {
    positions.current[pageKey] = scroll.current?.scrollTop || 0;
  };
  const go = (next) => {
    if (next.name === "pet-form" && !next.id) {
      setSheet(null);
      setOnboarding({ welcome: false });
      return;
    }
    remember();
    setStack((s) => [...s, next]);
  };
  const back = () => {
    remember();
    setStack((s) => s.slice(0, -1));
  };
  const switchTab = (next) => {
    remember();
    setStack([]);
    setTab(next);
  };
  useLayoutEffect(() => {
    if (scroll.current)
      scroll.current.scrollTop = positions.current[pageKey] || 0;
  }, [pageKey]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        data.settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : data.settings.theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.settings.theme]);
  useEffect(() => {
    if (
      !data.settings.notifications ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const check = () => {
      const now = Date.now();
      data.reminders
        .filter(
          (r) =>
            !r.done &&
            !notificationSent.current.has(r.id) &&
            new Date(r.date).getTime() <= now &&
            now - new Date(r.date).getTime() < 60000,
        )
        .forEach((r) => {
          notificationSent.current.add(r.id);
          try {
            new Notification(
              `${data.pets.find((p) => p.id === r.petId)?.name || "家里共用"} · ${r.type}`,
              { body: r.note || "一件等你完成的小事", icon: "/favicon.svg" },
            );
          } catch {
            /* Browser may not allow notifications on this platform. */
          }
        });
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [data]);
  const ask = (title, body, action, label) =>
    setSheet({ kind: "confirm", title, body, action, label });
  function openForm(group = "note", type, petId = currentPet?.id) {
    setSheet(null);
    if (!petId) {
      go({ name: "pet-form" });
      return;
    }
    if (group === "note" && type === "喂食") group = "food";
    if (group === "note" && type === "称体重") group = "weight";
    go({
      name: "form",
      group,
      type:
        type ||
        { diary: "日记", food: "喂食", weight: "称体重", health: "猫三联疫苗" }[
          group
        ] ||
        groupLabels[group],
      petId,
    });
  }
  const openTypes = (group, onSelect) =>
    setSheet({ kind: "types", group, onSelect });
  function saveRecord(record) {
    let next;
    if (record.group === "reminder") {
      const old = data.reminders.find((r) => r.id === record.id);
      const saved = { ...record, done: old?.done || false };
      next = {
        ...data,
        reminders: old
          ? data.reminders.map((r) => (r.id === record.id ? saved : r))
          : [...data.reminders, saved],
      };
    } else {
      next = saveManagedRecord(data, record);
      if (
        record.group === "health" &&
        record.nextDate &&
        !data.reminders.some((r) => r.sourceRecordId === record.id)
      ) {
        next.reminders = [
          ...data.reminders,
          {
            id: uid(),
            sourceRecordId: record.id,
            petId: record.petId,
            type: record.type,
            date: record.nextDate + "T09:00",
            repeat: "从不",
            done: false,
          },
        ];
      } else if (record.group === "health" && record.nextDate) {
        next.reminders = data.reminders.map((r) =>
          r.sourceRecordId === record.id
            ? {
                ...r,
                date: record.nextDate + "T09:00",
                type: record.type,
                petId: record.petId,
              }
            : r,
        );
      }
    }
    if (!commit(next)) return false;
    back();
    toast(({ reminder: "提醒已安排", stock: "囤货已保存", expense: "账单已保存" })[record.group] || "这一刻，记住了");
    return true;
  }
  function savePet(pet) {
    const exists = data.pets.some((p) => p.id === pet.id);
    if (
      commit({
        ...data,
        pets: exists
          ? data.pets.map((p) => (p.id === pet.id ? pet : p))
          : [...data.pets, pet],
        currentPetId: exists ? data.currentPetId : pet.id,
      })
    ) {
      back();
      toast(exists ? "宠物资料已更新" : `你好，${pet.name}`);
    }
  }
  function deletePet(id) {
    const pets = data.pets.filter((p) => p.id !== id);
    if (
      commit({
        ...data,
        pets,
        records: data.records.filter((r) => r.petId !== id),
        reminders: data.reminders.filter((r) => r.petId !== id),
        currentPetId:
          data.currentPetId === id ? pets[0]?.id : data.currentPetId,
      })
    ) {
      setFilters(defaultFilters);
      setStack([]);
      if (!pets.length) setOnboarding({ welcome: true });
      toast("档案已删除");
    }
  }
  const a = {
    completeReminder: (reminder) => {
      if (commit({ ...data, reminders: toggleReminder(data.reminders, reminder) }))
        toast(reminder.done ? "已恢复待办" : reminder.repeat && reminder.repeat !== "从不" ? "完成啦，下次提醒已安排" : "完成一件小事！");
    },
    data,
    page,
    updatePage: (patch) => setStack((s) => s.map((p, i) => i === s.length - 1 ? { ...p, ...patch } : p)),
    currentPet,
    commit,
    tab,
    go,
    back,
    switchTab,
    sheet,
    setSheet,
    toast,
    ask,
    openForm,
    openTypes,
    setSettings: (patch) =>
      commit({ ...data, settings: { ...data.settings, ...patch } }),
    filters,
    setFilters,
    timelineMode,
    setTimelineMode,
    timelineSearch,
    setTimelineSearch,
    showSearch,
    setShowSearch,
    petSearch,
    setPetSearch,
  };
  function content() {
    if (page?.name === "pet-form")
      return (
        <PetForm
          key={page.id || "new"}
          pet={data.pets.find((p) => p.id === page.id)}
          onBack={back}
          onSave={savePet}
          onDelete={deletePet}
          toast={toast}
          ask={ask}
        />
      );
    if (!page)
      return {
        home: <Home a={a} />,
        timeline: <Timeline a={a} />,
        pets: <Pets a={a} />,
        me: <Me a={a} />,
      }[tab];
    const pet = data.pets.find((p) => p.id === page.id) || currentPet;
    if (page.name === "form") {
      const record = (
        page.group === "reminder" ? data.reminders : data.records
      ).find((r) => r.id === page.editId);
      return (
        <RecordForm
          key={`${page.group}-${page.editId || stack.length}`}
          page={page}
          pets={data.pets}
          record={record}
          records={data.records}
          onRecord={(id) => go({ name: "record", id })}
          currentPetId={page.petId || currentPet.id}
          onBack={back}
          onSave={saveRecord}
          openTypes={openTypes}
          toast={toast}
          ask={ask}
        />
      );
    }
    if (page.name === "pet") return <PetDetail a={a} pet={pet} />;
    if (page.name === "weight") return <Weight a={a} pet={pet} />;
    if (page.name === "health") return <Health a={a} pet={pet} />;
    if (page.name === "stock") return <Stock a={a} />;
    if (page.name === "ledger") return <Ledger a={a} initialPetId={page.id || "all"} />;
    if (page.name === "appearance-pet")
      return <PetAppearance a={a} pet={pet} />;
    if (page.name === "reminders") return <Reminders a={a} petId={page.id} />;
    if (page.name === "record") {
      const record = data.records.find((r) => r.id === page.id);
      return record ? (
        <RecordDetail a={a} record={record} />
      ) : (
        <Empty title="记录已删除" action="返回" onAction={back} />
      );
    }
    if (page.name === "share")
      return (
        <Share
          a={a}
          pet={pet}
          record={data.records.find((r) => r.id === page.recordId)}
        />
      );
    if (page.name === "export") return <Export a={a} />;
    if (page.name === "display") return <Display a={a} />;
    if (page.name === "notifications") return <Notifications a={a} />;
    if (page.name === "storage") return <Storage a={a} />;
    return <Info a={a} name={page.name} />;
  }
  function finishOnboarding() {
    const url = new URL(location.href); url.searchParams.delete("onboarding"); history.replaceState(null, "", url);
    setOnboarding(null); setStack([]); setTab("home");
  }
  if (onboarding || !currentPet) return <div className="app-shell"><StickerFilters /><CatOnboarding
    welcome={onboarding?.welcome ?? true}
    onSave={draft => commit(addCatProfile(data, draft), { silent: true })}
    onFinish={finishOnboarding}
    onExit={() => { if (data.pets.length) finishOnboarding(); else setOnboarding({ welcome: true }); }}
  /></div>;
  return (
    <div className="app-shell">
      <StickerFilters />
      <main
        className={`app-scroll ${hasTabs && currentPet ? "with-tabs" : ""}`}
        ref={scroll}
        inert={sheet ? true : undefined}
      >
        {content()}
      </main>
      {hasTabs && currentPet && (
        <nav
          className="bottom-nav"
          aria-label="主导航"
          inert={sheet ? true : undefined}
        >
          {[
            ["home", "House", "首页"],
            ["timeline", "Clock3", "时光"],
            ["add", "Plus", "新增记录"],
            ["pets", "Cat", "猫咪"],
            ["me", "UserRound", "我的"],
          ].map(([id, icon, label]) =>
            id === "add" ? (
              <button
                key={id}
                className="nav-add"
                aria-label="新增记录"
                onClick={() => setSheet({ kind: "types" })}
              >
                <Icon name="Plus" size={29} />
              </button>
            ) : (
              <button
                key={id}
                className={`nav-item ${tab === id ? "active" : ""}`}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => switchTab(id)}
              >
                <span>
                  <Icon name={icon} size={23} />
                </span>
                <small>{label}</small>
              </button>
            ),
          )}
        </nav>
      )}
      <AppSheets a={a} />
      {message && (
        <div className="toast" role="status">
          <Icon name="Check" size={18} />
          {message}
        </div>
      )}
    </div>
  );
}
