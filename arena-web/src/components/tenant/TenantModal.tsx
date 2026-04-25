"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface TenantModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export default function TenantModal({
  open,
  title,
  onClose,
  children,
  fullScreen = false,
}: TenantModalProps) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm p-3 md:p-6">
      <div
        className={`mx-auto border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl ${
          fullScreen
            ? "h-[calc(100vh-1.5rem)] w-full rounded-2xl"
            : "max-h-[calc(100vh-2rem)] w-full max-w-3xl rounded-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 md:px-6">
          <h3 className="text-base font-semibold md:text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 transition hover:bg-slate-700 hover:text-white active:scale-95"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
