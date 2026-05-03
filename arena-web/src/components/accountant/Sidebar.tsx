"use client";

import { LayoutDashboard, BookOpen, PieChart, FileText, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/accountant/dashboard" },
    { icon: BookOpen, label: "Ledger", href: "/accountant/ledger" },
    { icon: PieChart, label: "Budgets", href: "/accountant/budgets" },
    { icon: FileText, label: "Reports", href: "/accountant/reports" },
    { icon: MessageSquare, label: "Chat", href: "/accountant/chat" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-50">
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-6 border-b border-slate-800/50">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0066FF] to-[#00D084] bg-clip-text text-transparent">
                        Arena Homes
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Financial Portal</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? "bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-800/50">
                    <button 
                        onClick={async () => {
                            await AuthApi.logout();
                            localStorage.removeItem('user_role');
                            sessionStorage.removeItem('user_role');
                            router.replace('/');
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
