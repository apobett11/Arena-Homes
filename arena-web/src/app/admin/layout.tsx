"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 selection:text-white">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-50">
                <AdminSidebar />
            </div>

            {/* Main Content Wrapper */}
            <div className="lg:ml-64 min-h-screen flex flex-col">
                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                <AdminBottomNav />
            </div>
            
        </div>
    );
}
