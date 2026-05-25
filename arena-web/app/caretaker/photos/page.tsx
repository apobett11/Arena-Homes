"use client";

import { PhotosPanel } from "@/components/caretaker/PhotosPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerPhotosPage() {
  return (
    <CaretakerPageShell
      title="Property photos"
      description="Cover, gate, and gallery media for your assigned property."
    >
      {(ws) =>
        ws.propertyId ? (
          <PhotosPanel propertyId={ws.propertyId} onDataChange={ws.refresh} />
        ) : null
      }
    </CaretakerPageShell>
  );
}
