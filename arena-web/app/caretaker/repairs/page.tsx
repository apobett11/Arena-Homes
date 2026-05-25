"use client";

import { RepairsPanel } from "@/components/caretaker/RepairsPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerRepairsPage() {
  return (
    <CaretakerPageShell
      title="Repairs"
      description="Property-wide repair queue aligned to backend repair records."
    >
      {(ws) =>
        ws.propertyId ? (
          <RepairsPanel
            repairs={ws.repairs}
            issues={ws.issues}
            propertyId={ws.propertyId}
            onDataChange={ws.refresh}
          />
        ) : null
      }
    </CaretakerPageShell>
  );
}
