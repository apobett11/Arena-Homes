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
      <div className="caretaker-console m-0 flex min-h-screen border-0 bg-transparent text-arena-on-surface selection:bg-primary/20">
        <Suspense fallback={<CaretakerNavFallback />}>
          <Sidebar />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 border-0 lg:pl-0">
          <Suspense fallback={null}>
            <TopBar />
          </Suspense>
          <main className="flex-1 overflow-y-auto border-0 bg-transparent px-4 py-5 md:px-8 md:py-7 pb-28 lg:pb-10">
            {children}
          </main>
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
    </RoleGate>
  );
}
