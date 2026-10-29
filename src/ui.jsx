import React, { useEffect, useRef } from "react";
import {
  PawPrint,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Minus,
  MapPin,
  BellPlus,
  ArrowUpRight,
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
  Minus,
  MapPin,
  BellPlus,
  ArrowUpRight,
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
import { iconFor, ageLabel, petImage } from "./data";

export function Icon({ name = "PawPrint", size = 22, ...props }) {
  const C = Icons[name] || Icons.PawPrint;
  return <C size={size} strokeWidth={2} {...props} />;
}
// The transparent atlas uses a regular 3 × 4 grid; all icons share one request.
const stickerCells = {
  BookOpen: 0, NotebookPen: 0, Soup: 1, Scale: 2, Toothbrush: 3,
  Scissors: 4, Camera: 5, Images: 5, Image: 5, Syringe: 6,
  Bell: 7, BellRing: 7, CalendarClock: 7, ListTodo: 7, Wallet: 8,
  HeartPulse: 9, ShieldCheck: 9, Package: 10, PawPrint: 11,
};
export function StickerIcon({ name = "PawPrint", size = 42, className = "" }) {
  const cell = stickerCells[name];
  if (cell === undefined) return <span className={`drawn-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true"><Icon name={name} size={Math.round(size * .65)} /></span>;
  return <span className={`sticker-icon ${className}`} aria-hidden="true" style={{ width: size, height: size, backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 100 / 3}%` }} />;
}

export function StickerFilters() {
  return <svg className="sticker-filters" aria-hidden="true" width="0" height="0"><defs>
    <filter id="photo-sticker" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="edge" />
      <feFlood floodColor="white" />
      <feComposite in2="edge" operator="in" result="border" />
      <feMerge><feMergeNode in="border" /><feMergeNode in="SourceGraphic" /></feMerge>
      <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#252525" floodOpacity=".16" />
    </filter>
  </defs></svg>;
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
export function PetPhoto({ pet, className = "" }) {
  if (pet?.imageCrop && !pet.photo) return <svg className={className} viewBox={pet.imageCrop.join(" ")} role="img" aria-label={pet.name || "猫咪"}><image href={petImage(pet)} width="891" height="1765" /></svg>;
  return <img src={petImage(pet)} alt={pet?.name || "猫咪"} className={className} />;
}
export function Avatar({ pet, size = 44, className = "", ...props }) {
  if (pet?.id === "household") return <span className={`avatar household-avatar ${className}`} style={{ width: size, height: size }} aria-label="家里共用" {...props}><Icon name="House" size={size * .55} /></span>;
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <PetPhoto
        pet={pet}
        className={
          pet?.photo ? "real-photo" : `tone-${pet?.tone || "original"}`
        }
      />
    </span>
  );
}
export function PetArt({ pet, className = "" }) {
  return (
    <PetPhoto
      className={`pet-art ${className} tone-${pet?.tone || "original"} body-${pet?.body || "standard"} ${pet?.photo ? "uploaded-pet" : ""}`}
      pet={pet}
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
        <StickerIcon name={icon} size={34} />
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
        <StickerIcon name={icon} size={58} />
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
      <StickerIcon name={icon || iconFor(name, group)} size={size * 1.9} />
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
      {pet.breed || "品种待补充"} <span>·</span> {ageLabel(pet.birthday)}
    </p>
  );
}
