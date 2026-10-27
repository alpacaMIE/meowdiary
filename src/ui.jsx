import React, { useEffect, useRef } from "react";
import {
  PawPrint,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  X,
  Check,
  Heart,
  BookOpen,
  NotebookPen,
  Scale,
  Soup,
  Syringe,
  Droplets,
  Cake,
  Volleyball,
  Footprints,
  Shirt,
  Scissors,
  Camera,
  Bell,
  Wallet,
  HeartPulse,
  Package,
  Search as SearchIcon,
  ArrowRight,
  Sun,
  Star,
  Flower2,
  CircleCheck,
  CalendarDays,
  Sparkles,
  List,
  Grid2X2,
  SlidersHorizontal,
  House,
  Clock3,
  Cat,
  Dog,
  UserRound,
  ClipboardList,
  Images,
  Share2,
  ShieldCheck,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  Circle,
  Trash2,
  FileDown,
  Type,
  Wind,
  Database,
  Shield,
  MessageCircleQuestion,
  Info,
  BellRing,
  Monitor,
  Moon,
  ListTodo,
  CalendarHeart,
  LockKeyhole,
  HardDrive,
  Image,
  Download,
} from "lucide-react";
const Icons = {
  Search: SearchIcon,
  PawPrint,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  X,
  Check,
  Heart,
  BookOpen,
  NotebookPen,
  Scale,
  Soup,
  Syringe,
  Droplets,
  Cake,
  Volleyball,
  Footprints,
  Shirt,
  Scissors,
  Camera,
  Bell,
  Wallet,
  HeartPulse,
  Package,
  ArrowRight,
  Sun,
  Star,
  Flower2,
  CircleCheck,
  CalendarDays,
  Sparkles,
  List,
  Grid2X2,
  SlidersHorizontal,
  House,
  Clock3,
  Cat,
  Dog,
  UserRound,
  ClipboardList,
  Images,
  Share2,
  ShieldCheck,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  Circle,
  Trash2,
  FileDown,
  Type,
  Wind,
  Database,
  Shield,
  MessageCircleQuestion,
  Info,
  BellRing,
  Monitor,
  Moon,
  ListTodo,
  CalendarHeart,
  LockKeyhole,
  HardDrive,
  Image,
  Download,
};
import { iconFor, ageLabel } from "./data";

export function Icon({ name = "PawPrint", size = 22, ...props }) {
  const C = Icons[name] || Icons.PawPrint;
  return <C size={size} strokeWidth={1.65} {...props} />;
}
export function IconButton({ icon, label, onClick, ...props }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
export function Avatar({ pet, size = 44, className = "", ...props }) {
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <img
        src={pet?.photo || pet?.image || "/assets/cat.png"}
        alt={pet?.name || "宠物"}
        className={
          pet?.photo ? "real-photo" : `tone-${pet?.tone || "original"}`
        }
      />
    </span>
  );
}
export function PetArt({ pet, className = "" }) {
  return (
    <img
      className={`pet-art ${className} tone-${pet?.tone || "original"} body-${pet?.body || "standard"} ${pet?.photo ? "uploaded-pet" : ""}`}
      src={pet?.photo || pet?.image || "/assets/cat.png"}
      alt={pet?.name || "宠物"}
    />
  );
}
export function Primary({ children, className = "", ...props }) {
  return (
    <button className={`primary ${className}`} {...props}>
      {children}
    </button>
  );
}
export function SectionTitle({ children, action, onClick }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action && (
        <button type="button" className="text-button subtle" onClick={onClick}>
          {action}
          <Icon name="ChevronRight" size={15} />
        </button>
      )}
    </div>
  );
}
export function Topbar({ title, onBack, action }) {
  return (
    <header className="topbar">
      <IconButton icon="ChevronLeft" label="返回" onClick={onBack} />
      <h1>{title}</h1>
      <div className="topbar-action">{action}</div>
    </header>
  );
}
export function Row({ icon, label, value, onClick, tone = "peach", children }) {
  return (
    <button type="button" className="setting-row" onClick={onClick}>
      <span className={`small-icon ${tone}`}>
        <Icon name={icon} size={19} />
      </span>
      <span className="row-label">{label}</span>
      {value && <span className="row-value">{value}</span>}
      {children || <Icon name="ChevronRight" size={17} className="muted" />}
    </button>
  );
}
export function Empty({
  icon = "PawPrint",
  title = "这里还没有记录",
  action,
  onAction,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={32} />
      </span>
      <h3>{title}</h3>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <Icon name="ArrowRight" size={16} />
        </button>
      )}
    </div>
  );
}
export function TypeIcon({ name, group, icon, size = 24 }) {
  return (
    <span className={`type-icon ${group || "note"}`}>
      <Icon name={icon || iconFor(name, group)} size={size} />
    </span>
  );
}
export function Search({
  value,
  onChange,
  placeholder = "搜索",
  autoFocus = false,
}) {
  return (
    <label className="search">
      <Icon name="Search" size={19} />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          aria-label="清除搜索"
          onClick={() => onChange("")}
        >
          <Icon name="X" size={16} />
        </button>
      )}
    </label>
  );
}
export function Chips({ items, value, onChange }) {
  return (
    <div className="chips">
      {items.map((item) => {
        const [id, label] = Array.isArray(item) ? item : [item, item];
        return (
          <button
            key={id}
            type="button"
            className={value === id ? "chip selected" : "chip"}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
export function Segmented({ items, value, onChange }) {
  return (
    <div className="segmented">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={id === value ? "selected" : ""}
          aria-pressed={id === value}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function Field({ label, children, optional }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {optional && <span className="muted"> · 选填</span>}
      </span>
      {children}
    </label>
  );
}
export function PetSelect({ pets, value, onChange }) {
  return (
    <label className="pet-select">
      <Avatar pet={pets.find((p) => p.id === value)} size={32} />
      <select
        aria-label="关联宠物"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {pets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Icon name="ChevronDown" size={15} />
    </label>
  );
}
export function Sheet({ title, onClose, children, className = "" }) {
  const ref = useRef(null),
    oldFocus = useRef(document.activeElement);
  useEffect(() => {
    const initial = ref.current?.querySelector("button,input,select,textarea");
    initial?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length);
        if (!list.length) return;
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      oldFocus.current?.focus();
    };
  }, []);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <section
        ref={ref}
        className={`sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <IconButton icon="X" label="关闭" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}
export function PetMeta({ pet }) {
  return (
    <p className="pet-meta">
      {pet.breed} <span>·</span> {ageLabel(pet.birthday)}
    </p>
  );
}
