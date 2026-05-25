import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Caretaker console shared class tokens (navy / property-management palette) */
export const ck = {
  page: "max-w-[1600px] mx-auto space-y-8",
  card: "caretaker-card p-5 md:p-6",
  statCard: "caretaker-stat-card",
  statNeutral: "caretaker-stat-card caretaker-stat-card--neutral",
  statMuted: "caretaker-stat-card caretaker-stat-card--muted",
  statNavy: "caretaker-stat-card caretaker-stat-card--navy",
  statAlert: "caretaker-stat-card caretaker-stat-card--alert",
  hero: "caretaker-hero relative overflow-hidden px-6 py-6 md:px-8 md:py-7",
  tabNav: "caretaker-tab-nav sticky top-0 z-30 p-3 md:p-4 backdrop-blur-md",
  tabActive: "caretaker-tab-nav__btn--active",
  tabIdle: "caretaker-tab-nav__btn--idle",
  identityCard: "caretaker-identity-card p-5 md:p-6",
  overviewPanel: "caretaker-overview-panel p-5 md:p-6",
  commandCard: "caretaker-command-card p-5 md:p-6",
  sectionTitle: "caretaker-label-caps text-[#5c6b7a]",
  headline: "caretaker-headline-sm text-[#0f1c2e] font-semibold tracking-tight",
  display: "caretaker-display-lg text-[#0f1c2e] tracking-tight",
  displayMobile: "caretaker-display-lg-mobile text-[#0f1c2e]",
  body: "text-sm leading-6 text-[#5c6b7a]",
  input: "caretaker-input",
  btnPrimary: "caretaker-btn-primary disabled:opacity-50",
  btnGhost: "caretaker-btn-ghost disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow-[0_10px_22px_rgba(220,38,38,0.2)] ring-1 ring-red-500/20 transition hover:bg-red-700 hover:shadow-[0_14px_28px_rgba(220,38,38,0.26)] active:scale-[0.98] disabled:opacity-50",
  btnSuccess:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-[0_10px_22px_rgba(5,150,105,0.18)] ring-1 ring-emerald-500/20 transition hover:bg-emerald-700 hover:shadow-[0_14px_28px_rgba(5,150,105,0.24)] active:scale-[0.98] disabled:opacity-50",
  btnWarning:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold shadow-[0_10px_22px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/25 transition hover:bg-amber-400 hover:shadow-[0_14px_28px_rgba(245,158,11,0.24)] active:scale-[0.98] disabled:opacity-50",
  btnInfo:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-[0_10px_22px_rgba(37,99,235,0.2)] ring-1 ring-blue-500/20 transition hover:bg-blue-700 hover:shadow-[0_14px_28px_rgba(37,99,235,0.26)] active:scale-[0.98] disabled:opacity-50",
  btnManage:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-[0_10px_22px_rgba(79,70,229,0.2)] ring-1 ring-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-[0_14px_28px_rgba(79,70,229,0.26)] active:scale-[0.98] disabled:opacity-50",
  filterActive: "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/10",
  filterIdle:
    "bg-white/82 text-slate-600 border border-slate-200 shadow-sm hover:bg-white hover:text-slate-950 hover:border-blue-200 hover:shadow-md",
  empty: "text-center py-12 caretaker-card",
  tableWrap: "caretaker-card overflow-hidden p-0",
  tableHead: "bg-slate-100/80",
  tableRow: "hover:bg-blue-50/55 transition-colors group",
  tableCell: "px-4 lg:px-6 py-4 align-middle text-sm text-slate-800",
  tableHeader:
    "px-4 lg:px-6 py-3 text-left caretaker-label-caps text-slate-500",
  alertCard: "p-4 rounded-xl border-l-4 flex items-center gap-3 shadow-sm ring-1 ring-black/5",
  statGrid: "grid grid-cols-2 md:grid-cols-4 gap-5",
  actionGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3",
  quickActionBtn:
    "flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-2xl border border-[#0d3b66]/12 shadow-[0_8px_20px_rgba(10,37,64,0.07)] hover:border-[#0d3b66]/28 hover:bg-[#0d3b66] hover:text-white hover:shadow-[0_16px_32px_rgba(13,59,102,0.22)] transition-all duration-200 active:scale-[0.98] group min-h-[108px]",
  tabBar: "flex flex-wrap gap-2 pb-1",
  tabButton:
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/30",
  modalBackdrop: "fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm",
  modalPanel: "caretaker-card w-full max-w-2xl max-h-[90vh] overflow-hidden p-0 shadow-2xl",
  iconTile:
    "w-11 h-11 rounded-xl bg-[#e8f0fa] text-[#0d3b66] ring-1 ring-[#0d3b66]/12 flex items-center justify-center shrink-0",
  iconTileNavy:
    "w-11 h-11 rounded-xl bg-white/12 text-white ring-1 ring-white/20 flex items-center justify-center shrink-0",
  fieldLabel: "caretaker-label-caps text-slate-500 mb-1 block",
};

export type SemanticTone = "danger" | "warning" | "info" | "success" | "neutral" | "manage";

export function statusChipClass(tone: SemanticTone): string {
  const map: Record<SemanticTone, string> = {
    danger: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    manage: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return cn("caretaker-chip", map[tone]);
}

export function statusToneFromValue(value?: string | null): SemanticTone {
  const normalized = (value || "").toUpperCase();
  if (["URGENT", "HIGH", "REJECTED", "ESCALATED", "SUSPENDED", "UNDER_MAINTENANCE", "UNAVAILABLE"].includes(normalized)) {
    return "danger";
  }
  if (["WAITING", "PENDING", "RESERVED", "IN_PROGRESS"].includes(normalized)) {
    return "warning";
  }
  if (["ACTIVE", "ACCEPTED", "AVAILABLE", "RESOLVED", "SOLVED", "COMPLETED", "VERIFIED"].includes(normalized)) {
    return "success";
  }
  if (["OCCUPIED", "INFO", "BROADCAST"].includes(normalized)) {
    return "info";
  }
  return "neutral";
}

export function filterButtonClass(active: boolean): string {
  return cn(ck.tabButton, active ? ck.filterActive : ck.filterIdle);
}

export function borderAccentClass(color: string): string {
  return cn(ck.statCard, `border-l-4 ${color}`);
}

export function alertClass(tone: SemanticTone): string {
  const map: Record<SemanticTone, { bg: string; border: string; icon: string }> = {
    danger: { bg: "bg-red-50", border: "border-red-500", icon: "text-red-600" },
    warning: { bg: "bg-amber-50", border: "border-amber-500", icon: "text-amber-600" },
    info: { bg: "bg-blue-50", border: "border-blue-500", icon: "text-blue-600" },
    success: { bg: "bg-emerald-50", border: "border-emerald-500", icon: "text-emerald-600" },
    neutral: { bg: "bg-slate-50", border: "border-slate-400", icon: "text-slate-600" },
    manage: { bg: "bg-indigo-50", border: "border-indigo-500", icon: "text-indigo-600" },
  };
  const style = map[tone];
  return cn(ck.alertCard, style.bg, style.border);
}
