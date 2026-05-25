"use client";

import { AnnouncementsPanel } from "@/components/caretaker/AnnouncementsPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerAnnouncementsPage() {
  return (
    <CaretakerPageShell
      title="Announcements"
      description="Admin notices and tenant broadcasts for your property."
    >
      {(ws) =>
        ws.propertyId ? (
          <AnnouncementsPanel
            incoming={ws.announcements.incoming}
            outgoing={ws.announcements.outgoing}
            propertyId={ws.propertyId}
            caretakerEmployeeId={ws.caretakerEmployeeId}
            onDataChange={ws.refresh}
          />
        ) : null
      }
    </CaretakerPageShell>
  );
}
