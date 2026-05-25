"use client";

import { useRouter } from "next/navigation";
import { UnitsPanel } from "@/components/caretaker/UnitsPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerUnitsPage() {
  const router = useRouter();

  return (
    <CaretakerPageShell
      title="Units"
      description="High-density room inventory — availability, repairs, reservations, and photos."
    >
      {(ws) =>
        ws.propertyId ? (
          <UnitsPanel
            units={ws.units}
            repairs={ws.repairs}
            propertyId={ws.propertyId}
            onDataChange={ws.refresh}
            onOpenApplications={() => router.push("/caretaker/applications")}
            onOpenPhotos={() => router.push("/caretaker/photos")}
          />
        ) : null
      }
    </CaretakerPageShell>
  );
}
