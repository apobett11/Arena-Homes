"use client";

import { IssuesPanel } from "@/components/caretaker/IssuesPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerIssuesPage() {
  return (
    <CaretakerPageShell
      title="Issues"
      description="Track property issues, update status, and resolve tenant reports."
    >
      {(ws) =>
        ws.propertyId ? (
          <IssuesPanel issues={ws.issues} propertyId={ws.propertyId} onDataChange={ws.refresh} />
        ) : null
      }
    </CaretakerPageShell>
  );
}
