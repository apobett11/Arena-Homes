import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stitch Arena caretaker console shared class tokens */
export const ck = {
  page: "max-w-[1600px] mx-auto space-y-6",
  card: "caretaker-card p-5 md:p-6",
  statCard: "caretaker-stat-card",
  sectionTitle: "caretaker-label-caps text-arena-on-surface-variant",
  headline: "caretaker-headline-sm text-arena-on-surface font-medium",
  display: "caretaker-display-lg text-arena-on-surface",
  displayMobile: "caretaker-display-lg-mobile text-arena-on-surface",
  body: "text-sm text-arena-on-surface-variant",
  input: "caretaker-input",
  btnPrimary: "caretaker-btn-primary disabled:opacity-50",
  btnGhost: "caretaker-btn-ghost disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50",
  btnSuccess:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50",
  btnWarning:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50",
  btnInfo:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50",
  btnManage:
    "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50",
  filterActive: "bg-primary text-white shadow-sm",
  filterIdle:
    "bg-arena-surface-container-low text-arena-on-surface-variant border border-arena-outline-variant/50 hover:bg-arena-surface-container hover:text-arena-on-surface",
  empty: "text-center py-12 caretaker-card",
  tableWrap: "caretaker-card overflow-hidden p-0",
  tableHead: "bg-arena-surface-container-low",
  tableRow: "hover:bg-arena-surface-container-lowest transition-colors group",
  tableCell: "px-4 lg:px-6 py-4 align-middle text-sm text-arena-on-surface",
  tableHeader:
    "px-4 lg:px-6 py-3 text-left caretaker-label-caps text-arena-on-surface-variant",
  alertCard: "p-4 rounded-xl border-l-4 flex items-center gap-3",
  statGrid: "grid grid-cols-2 md:grid-cols-4 gap-5",
  actionGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3",
  quickActionBtn:
    "flex flex-col items-center justify-center gap-2 bg-arena-surface-container p-4 rounded-2xl border border-arena-outline-variant/40 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] group min-h-[104px]",
  tabBar: "flex gap-2 overflow-x-auto hide-scrollbar pb-1",
  tabButton:
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
  modalBackdrop: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",
  modalPanel: "caretaker-card w-full max-w-2xl max-h-[90vh] overflow-hidden p-0 shadow-2xl",
  iconTile:
    "w-10 h-10 rounded-xl bg-arena-surface-container-high flex items-center justify-center shrink-0 text-primary",
  fieldLabel: "caretaker-label-caps text-arena-on-surface-variant mb-1 block",
};

export type SemanticTone = "danger" | "warning" | "info" | "success" | "neutral" | "manage";

export function statusChipClass(tone: SemanticTone): string {
  const map: Record<SemanticTone, string> = {
    danger: "bg-error-container/30 text-on-error-container",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    neutral: "bg-slate-100 text-slate-700",
    manage: "bg-secondary/15 text-secondary",
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
    danger: { bg: "bg-error-container/20", border: "border-error", icon: "text-error" },
    warning: { bg: "bg-amber-50", border: "border-amber-500", icon: "text-amber-600" },
    info: { bg: "bg-blue-50", border: "border-blue-500", icon: "text-blue-600" },
    success: { bg: "bg-emerald-50", border: "border-emerald-500", icon: "text-emerald-600" },
    neutral: { bg: "bg-slate-50", border: "border-slate-500", icon: "text-slate-600" },
    manage: { bg: "bg-secondary/10", border: "border-secondary", icon: "text-secondary" },
  };
  const style = map[tone];
  return cn(ck.alertCard, style.bg, style.border);
}
