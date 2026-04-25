"use client";

import Sidebar from "@/components/accountant/Sidebar";
import TopBar from "@/components/accountant/TopBar";
import BottomNav from "@/components/accountant/BottomNav";
import RoleGate from "@/components/auth/RoleGate";

export default function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGate allowedRoles={["ACCOUNTANT", "ADMIN"]}>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-50">
                    <Sidebar />
                </div>

                {/* Main Content Wrapper */}
                <div className="lg:ml-64 min-h-screen flex flex-col">
                    {/* Top Navigation Bar */}
                    <TopBar />

                    {/* Page Content */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
                        {children}
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
                
                {/* Mobile padding */}
                <div className="lg:hidden h-20" />
            </div>
        </RoleGate>
    );
}
