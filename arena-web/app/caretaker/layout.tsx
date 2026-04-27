import React from "react";
import { Sidebar, BottomNav } from "@/components/caretaker/Navigation";
import { TopBar } from "@/components/caretaker/TopBar";
import RoleGate from "@/components/auth/RoleGate";

export default function CaretakerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGate allowedRoles={["CARETAKER", "ADMIN"]}>
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary/30 transition-colors duration-300">
                {/* Sidebar - Desktop Only */}
                <div className="hidden lg:block flex-shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Header */}
                    <TopBar />

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
                        {children}
                    </main>
                </div>

                {/* Bottom Nav - Mobile Only */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
                
                {/* Mobile padding */}
                <div className="lg:hidden h-20" />
            </div>
        </RoleGate>
    );
}
