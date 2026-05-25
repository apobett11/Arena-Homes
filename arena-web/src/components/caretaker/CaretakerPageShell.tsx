"use client";

import React from "react";
import { useCaretakerWorkspace } from "@/hooks/useCaretakerWorkspace";
import { cn, ck } from "./caretaker-ui";

interface CaretakerPageShellProps {
  title: string;
  description?: string;
  children: (ctx: ReturnType<typeof useCaretakerWorkspace>) => React.ReactNode;
  loadFacilities?: boolean;
}

export function CaretakerPageShell({
  title,
  description,
  children,
  loadFacilities = false,
}: CaretakerPageShellProps) {
  const workspace = useCaretakerWorkspace({ loadFacilities });

  if (workspace.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="caretaker-loading-shell flex flex-col items-center gap-4 px-10 py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#0d3b66]/20 border-t-[#0d3b66]" />
          <p className="text-sm font-semibold text-[#5c6b7a]">Loading {title.toLowerCase()}…</p>
        </div>
      </div>
    );
  }

  if (workspace.error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
        <div className="caretaker-overview-panel max-w-md border-l-4 border-l-red-500 text-center">
          <p className="font-semibold text-red-800">{workspace.error}</p>
          <button type="button" onClick={() => workspace.refresh()} className={cn(ck.btnPrimary, "mt-5")}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(ck.page, "pb-4")}>
      <header className="mb-2">
        <p className={ck.sectionTitle}>Caretaker console</p>
        <h1 className="caretaker-display-lg text-[#0a2540]">{title}</h1>
        {description && <p className={cn(ck.body, "mt-2 max-w-2xl")}>{description}</p>}
      </header>
      {children(workspace)}
    </div>
  );
}
