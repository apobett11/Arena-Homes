import React, { Suspense } from "react";
import { Sidebar, BottomNav } from "@/components/caretaker/Navigation";
import { TopBar } from "@/components/caretaker/TopBar";
import RoleGate from "@/components/auth/RoleGate";

function CaretakerNavFallback() {
  return <div className="hidden lg:block w-[240px] shrink-0" />;
}

export default function CaretakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate allowedRoles={["CARETAKER", "ADMIN"]}>
      <div className="caretaker-console flex min-h-screen bg-arena-surface text-arena-on-surface selection:bg-primary/20">
        <Suspense fallback={<CaretakerNavFallback />}>
          <Sidebar />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
          <Suspense fallback={null}>
            <TopBar />
          </Suspense>
          <main className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#eef5ff_0%,#f6f9ff_45%,#eef7f4_100%)] p-4 md:p-6 pb-28 lg:pb-8">{children}</main>
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
    </RoleGate>
  );
}
