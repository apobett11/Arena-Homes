"use client";

import { TenantsPanel } from "@/components/caretaker/TenantsPanel";
import { CaretakerPageShell } from "@/components/caretaker/CaretakerPageShell";

export default function CaretakerTenantsPage() {
  return (
    <CaretakerPageShell
      title="Tenants"
      description="Manage residents, leases, issues, applications, and caretaker-permitted tenant actions."
    >
      {(ws) =>
        ws.propertyId ? (
          <TenantsPanel
            tenants={ws.tenants}
            units={ws.units}
            leases={ws.leases}
            issues={ws.issues}
            applications={ws.applications}
            propertyId={ws.propertyId}
            onDataChange={ws.refresh}
          />
        ) : null
      }
    </CaretakerPageShell>
  );
}
